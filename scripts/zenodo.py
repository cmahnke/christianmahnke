import argparse
import httpx
from invenio_rest_api_client import AuthenticatedClient, models as rdm
from invenio_rest_api_client.api.drafts.reserve_a_doi import sync as rdm_reserve_doi
from invenio_rest_api_client.api.drafts.list_a_drafts_files import sync as rdm_list_files
from invenio_rest_api_client.api.drafts.delete_a_draft_file import sync as rdm_delete_file
from invenio_rest_api_client.api.drafts_files_upload.step_1_start_draft_file_uploads import sync_detailed as rdm_start_upload
from invenio_rest_api_client.api.drafts_files_upload.step_2_upload_a_draft_files_content import sync_detailed as rdm_upload_content
from invenio_rest_api_client.api.drafts_files_upload.step_3_complete_a_draft_file_upload import sync_detailed as rdm_commit_upload
from pathlib import Path
from dotenv import load_dotenv
from datetime import date, datetime, timedelta, timezone
import sys, os, logging
import json
import git
import pikepdf
import pystow
import requests
import shutil
import tempfile
import time
import random
from dataclasses import dataclass
from email.utils import parsedate_to_datetime
from types import SimpleNamespace

sys.path.append(str(Path(__file__).resolve().parents[1] / "themes" / "projektemacher-base" / "scripts"))
from PyHugo import Content, Config, Post

DEFAULT_AUTHOR = {"name": "Christian Mahnke"}
DEFAULT_LICENSE = "cc-by-4.0"

IGNORE_KEYWORDS = ["Blog", "Projektemacher.org", "Status", "Suche", "Spaß", "Fun", ""]

SANDBOX_DOI_PREFIX = "10.5072/"

WAYBACK_AVAILABILITY_URL = "https://archive.org/wayback/available"
WAYBACK_SAVE_URL = "https://web.archive.org/save/"
ARCHIVE_MAX_AGE = timedelta(hours=3)
ARCHIVE_CHECK_TIMEOUT = 15
ARCHIVE_SAVE_TIMEOUT = 60
ARCHIVE_POLL_ATTEMPTS = 6
ARCHIVE_POLL_DELAY = 10
ARCHIVE_RETRY_ATTEMPTS = 3
ARCHIVE_RETRY_BACKOFF = 30
ARCHIVE_MAX_RETRY_DELAY = 300
ARCHIVE_RATE_LIMIT_DELAY = 60
ARCHIVE_MIN_SAVE_INTERVAL = 20
ARCHIVE_JOB_POLL_ATTEMPTS = 30
ARCHIVE_JOB_POLL_DELAY = 5
ARCHIVE_RETRYABLE_STATUSES = {429, 500, 502, 503, 504}
ARCHIVE_USER_AGENT = "zenodo.py"


class ArchiveNotFoundError(Exception):
    """Raised when archive.org reports that it cannot find a target page."""


# Logging Setup
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')


def _load_env_token(sandbox):
    env_path = Path(__file__).resolve().parents[1] / ".env"
    if env_path.is_file():
        load_dotenv(dotenv_path=env_path, override=False)
    var = "ZENODO_SANDBOX_ACCESS_TOKEN" if sandbox else "ZENODO_ACCESS_TOKEN"
    return os.environ.get(var)


def _rdm_client(token, sandbox):
    """Authenticated InvenioRDM client using Zenodo's RDM representation."""
    return AuthenticatedClient(
        base_url="https://sandbox.zenodo.org" if sandbox else "https://zenodo.org",
        token=token,
        headers={"Accept": "application/vnd.inveniordm.v1+json"},
        timeout=httpx.Timeout(120.0),
    )


def _rdm_access():
    return rdm.Access(record=rdm.AccessRecord.PUBLIC, files=rdm.AccessFiles.PUBLIC)


def _rdm_doi(record):
    pids = getattr(record, "pids", None) or {}
    doi = pids.get("doi") if isinstance(pids, dict) else None
    if isinstance(doi, dict):
        return doi.get("identifier")
    return getattr(doi, "identifier", None) or getattr(record, "doi", None)


def _rdm_request(client, method, path, *, body=None, allow_missing=False):
    """Call RDM with raw JSON: Zenodo's draft responses break the generated models."""
    res = client.get_httpx_client().request(method, path, json=body)
    if allow_missing and res.status_code in (404, 410):
        return None
    if res.status_code >= 400:
        raise RuntimeError(f"{method} {path} failed: HTTP {res.status_code}: {res.text[:300]}")
    return res.json() if res.content else {}


def _rdm_record(data):
    """Minimal record view from a raw RDM response."""
    return SimpleNamespace(id=data.get("id"), pids=data.get("pids") or {}, metadata=data.get("metadata") or {})


def _rdm_metadata(entry, publication_date):
    """Build RDM metadata from a collected post entry."""
    creators = []
    for author in entry.authors:
        parts = _format_creator_name(author["name"]).split(", ", 1)
        family, given = (parts[0], parts[1]) if len(parts) == 2 else (parts[0], "")
        identifiers = []
        if author.get("orcid"):
            identifiers.append(rdm.Identifier(scheme=rdm.PersonOrOrgIdentifierScheme.ORCID, identifier=author["orcid"]))
        if author.get("gnd"):
            identifiers.append(rdm.Identifier(scheme=rdm.PersonOrOrgIdentifierScheme.GND, identifier=author["gnd"]))
        creators.append(rdm.Creator(person_or_org=rdm.PersonOrOrg(
            type=rdm.PersonOrOrgType.PERSONAL,
            family_name=family,
            given_name=given,
            identifiers=identifiers or None,
        )))
    dates = []
    if entry.date:
        dates.append(rdm.Date(date=entry.date, type=rdm.DateType(id=rdm.DateTypeId.CREATED)))
    if entry.lastmod:
        dates.append(rdm.Date(date=entry.lastmod[:10], type=rdm.DateType(id=rdm.DateTypeId.UPDATED)))
    def related(url, relation):
        return rdm.RelatedIdentifier(
            identifier=url,
            scheme=rdm.IdentifierScheme.URL,
            relation_type=rdm.RelationType(id=relation),
            resource_type=rdm.RelatedIdentifierResourceType(id=rdm.RelatedIdentifierResourceTypeId.PUBLICATION_OTHER),
        )
    related_ids = [related(url, rdm.RelationTypeId.ISVARIANTFORMOF) for url in entry.urls.values() if url != entry.primary_url]
    related_ids += [related(url, rdm.RelationTypeId.ISSUPPLEMENTTO) for url in entry.archive_urls.values()]
    identifiers = [rdm.AlternateIdentifier(identifier=entry.primary_url, scheme=rdm.IdentifierScheme.URL)] if entry.primary_url else None
    return rdm.Metadata(
        resource_type=rdm.ResourceType(id=rdm.ResourceTypeId.PUBLICATION_OTHER),
        title=entry.title,
        description=entry.description or None,
        publication_date=publication_date,
        identifiers=identifiers,
        creators=creators,
        subjects=[rdm.Subject(subject=kw) for kw in entry.keywords] or None,
        languages=[rdm.Lang(id="deu"), rdm.Lang(id="eng")],
        dates=dates or None,
        rights=[rdm.Right(id=entry.license)] if entry.license else None,
        related_identifiers=related_ids or None,
    )


def _tag_keywords(post, conf, lang='en'):
    """Use only the post's tags (translated via i18n) as keywords."""
    keywords = []
    for tag in post.getTags(lang):
        translated = conf.translate(tag, lang)
        keyword = translated if translated else tag
        if keyword not in keywords:
            keywords.append(keyword)
    return keywords


def _get_zenodo_block(post, lang):
    """Read the zenodo block from top-level front matter or params."""
    metadata = post.getMetadata(lang)
    block = metadata.get("zenodo")
    if block is None:
        params = metadata.get("params")
        if isinstance(params, dict) and isinstance(params.get("zenodo"), dict):
            block = params["zenodo"]
    return block if isinstance(block, dict) else {}


def _set_zenodo_block(post, lang, block):
    """Write the zenodo block under params, removing any top-level copy."""
    metadata = post.getMetadata(lang)
    metadata.pop("zenodo", None)
    params = dict(metadata.get("params") or {})
    params["zenodo"] = block
    post.addMetadata("params", params, lang)


@dataclass
class ZenodoEntry:
    title: str
    key: str
    authors: list
    description: str
    keywords: list
    license: str
    related_identifiers: list
    upload_files: dict
    posts: dict
    urls: dict
    deposition_id: str
    doi: str
    lastmods: dict = None
    lastmod: str = ""
    date: str = ""
    primary_url: str = ""
    archive_urls: dict = None
    changed: bool = False

    def to_json(self):
        from dataclasses import asdict

        def custom_serializer(o):
            if isinstance(o, Post):
                return str(o.path)
            if isinstance(o, Path):
                return str(o)
            raise TypeError(f"Object of type {o.__class__.__name__} is not JSON serializable")

        entry_dict = asdict(self)
        return json.dumps(entry_dict, indent=4, default=custom_serializer)

def prepare_entry(conf: Config):
    author = conf.config.get("params", {}).get("author", DEFAULT_AUTHOR).get("name")
    license = conf.config.get("params", {}).get("license", DEFAULT_LICENSE)
    # TODO: check if those better should return None instead of "N/A"
    orcid = conf.config.get("params", {}).get("social", {}).get("orcid", {}).get("username", "N/A")
    gnd = conf.config.get("params", {}).get("social", {}).get("gnd", {}).get("username", "N/A")
    logging.info(f"Global Fallbacks - Author: {author}, License: {license}, ORCID: {orcid}, GND: {gnd}")
    author_data = {"name": author}
    if orcid != "N/A":
        author_data["orcid"] = orcid
    if gnd != "N/A":
        author_data["gnd"] = gnd
    entry = ZenodoEntry(
        title="",
        key="",
        authors=[author_data],
        description="",
        keywords=[],
        license=license,
        related_identifiers=[],
        upload_files={},
        posts={},
        urls={},
        deposition_id="",
        doi="",
        lastmods={},
        lastmod="",
        date="",
        primary_url="",
        archive_urls={},
        changed=False
    )
    return entry

def _parse_lastmod(value, source):
    if value is None or value == "":
        return None
    try:
        if isinstance(value, datetime):
            dt = value
        elif isinstance(value, date):
            dt = datetime.combine(value, datetime.min.time())
        else:
            dt = datetime.fromisoformat(str(value))
    except (ValueError, TypeError) as e:
        logging.error(f"Invalid lastmod value '{value}' in {source}: {e}")
        sys.exit(1)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt

def _publication_date(entry, already_published):
    """Return the Zenodo publication date, aborting when a required date is missing."""
    if already_published or entry.lastmod:
        if not entry.lastmod:
            logging.error(f"Entry '{entry.title}' is published but has no lastmod, cannot set publication_date")
            sys.exit(1)
        return entry.lastmod[:10]
    if entry.date:
        return entry.date[:10]
    logging.error(f"Entry '{entry.title}' has neither lastmod nor date, cannot set publication_date")
    sys.exit(1)

def _wayback_snapshot(url):
    """Return the timestamp of the closest Wayback snapshot, or None."""
    try:
        res = requests.get(
            WAYBACK_AVAILABILITY_URL,
            params={"url": url},
            timeout=ARCHIVE_CHECK_TIMEOUT,
            headers={"User-Agent": "zenodo.py"},
        )
        res.raise_for_status()
        snapshots = res.json().get("archived_snapshots") or {}
        closest = snapshots.get("closest")
        if not closest or not closest.get("available", True):
            return None
        return datetime.strptime(closest["timestamp"], "%Y%m%d%H%M%S").replace(tzinfo=timezone.utc)
    except (requests.RequestException, ValueError, KeyError, TypeError, AttributeError) as e:
        logging.warning(f"Could not check archive.org snapshot for {url}: {e}")
        return None

def _wayback_fresh(timestamp):
    return timestamp is not None and datetime.now(timezone.utc) - timestamp <= ARCHIVE_MAX_AGE


_snapshot_urls = {}
_capture_timestamps = {}


def _wayback_url(url, timestamp):
    """Build the Wayback Machine URL for a snapshot timestamp."""
    stamp = timestamp.strftime("%Y%m%d%H%M%S") if isinstance(timestamp, datetime) else str(timestamp)
    return f"https://web.archive.org/web/{stamp}/{url}"


_last_archive_save = None


def _load_archive_keys():
    """Return the optional Internet Archive S3 keys for authenticated saves."""
    env_path = Path(__file__).resolve().parents[1] / ".env"
    if env_path.is_file():
        load_dotenv(dotenv_path=env_path, override=False)
    access_key = os.environ.get("IA_ACCESS_KEY")
    secret_key = os.environ.get("IA_SECRET_KEY")
    if access_key and secret_key:
        return access_key, secret_key
    return None


def _pace_archive_save():
    """Keep capture submissions below archive.org's anonymous rate limit."""
    global _last_archive_save
    now = time.monotonic()
    if _last_archive_save is not None:
        wait = ARCHIVE_MIN_SAVE_INTERVAL - (now - _last_archive_save)
        if wait > 0:
            logging.info(f"Pausing {wait:.0f}s before the next archive.org save request")
            time.sleep(wait)
    _last_archive_save = time.monotonic()


def _retry_after_seconds(response):
    """Return the Retry-After delay in seconds (clamped), or None if absent/invalid."""
    value = response.headers.get("Retry-After")
    if not value:
        return None
    try:
        delay = float(value)
    except ValueError:
        try:
            target = parsedate_to_datetime(value)
        except (TypeError, ValueError):
            return None
        if target.tzinfo is None:
            target = target.replace(tzinfo=timezone.utc)
        delay = (target - datetime.now(timezone.utc)).total_seconds()
    return max(0, min(delay, ARCHIVE_MAX_RETRY_DELAY))


def _archive_retry_delay(attempt, response):
    """Return (seconds, reason) for the next retry."""
    retry_after = _retry_after_seconds(response) if response is not None else None
    if retry_after is not None:
        return retry_after, "Retry-After header"
    if response is not None and response.status_code == 429:
        return ARCHIVE_RATE_LIMIT_DELAY, "no Retry-After header, 429 fallback"
    delay = min(ARCHIVE_RETRY_BACKOFF * (2 ** attempt), ARCHIVE_MAX_RETRY_DELAY)
    return min(delay + random.uniform(0, 1), ARCHIVE_MAX_RETRY_DELAY), "exponential backoff"


def _archive_request(method, url, *, params=None, data=None, headers=None, timeout, label, pace=False):
    """Request an archive.org endpoint, retrying throttling and transient errors."""
    for attempt in range(ARCHIVE_RETRY_ATTEMPTS + 1):
        if pace:
            _pace_archive_save()
        try:
            res = requests.request(
                method,
                url,
                params=params,
                data=data,
                headers=headers or {"User-Agent": ARCHIVE_USER_AGENT},
                timeout=timeout,
            )
        except requests.RequestException as e:
            if attempt >= ARCHIVE_RETRY_ATTEMPTS:
                logging.error(f"{label}: archive.org request failed after {attempt + 1} attempts: {e}")
                return None
            delay, reason = _archive_retry_delay(attempt, None)
            logging.warning(f"{label}: archive.org request failed ({e}), retrying in {delay:.0f}s ({reason}) [{attempt + 1}/{ARCHIVE_RETRY_ATTEMPTS}]")
            time.sleep(delay)
            continue
        if res.status_code not in ARCHIVE_RETRYABLE_STATUSES:
            return res
        if attempt >= ARCHIVE_RETRY_ATTEMPTS:
            logging.error(f"{label}: HTTP {res.status_code} from archive.org after {attempt + 1} attempts, not retrying")
            return res
        delay, reason = _archive_retry_delay(attempt, res)
        if res.status_code == 429:
            retry_after = _retry_after_seconds(res)
            header = f"{retry_after:.0f}s" if retry_after is not None else "not provided"
            logging.warning(f"Rate limited (429) for {label}; Retry-After: {header}, waiting {delay:.0f}s ({reason}) [{attempt + 1}/{ARCHIVE_RETRY_ATTEMPTS}]")
        else:
            logging.warning(f"{label}: HTTP {res.status_code} from archive.org, retrying in {delay:.0f}s ({reason}) [{attempt + 1}/{ARCHIVE_RETRY_ATTEMPTS}]")
        time.sleep(delay)
    return None


def _archive_save_anonymous(url):
    """Submit an anonymous inline capture, retrying throttling and transient errors."""
    res = _archive_request("GET", f"{WAYBACK_SAVE_URL}{url}", timeout=ARCHIVE_SAVE_TIMEOUT, label=url, pace=True)
    if res is None:
        logging.error(f"Could not save {url} to archive.org: no response")
        return False
    if res.status_code == 404:
        raise ArchiveNotFoundError(f"archive.org cannot find {url}: HTTP 404")
    if res.status_code >= 400:
        logging.error(f"Could not save {url} to archive.org: HTTP {res.status_code}")
        return False
    return True


def _archive_save_authenticated(url, keys):
    """Submit a capture via SPN2 and wait for the job to finish."""
    access_key, secret_key = keys
    headers = {
        "User-Agent": ARCHIVE_USER_AGENT,
        "Accept": "application/json",
        "Authorization": f"LOW {access_key}:{secret_key}",
        "Content-Type": "application/x-www-form-urlencoded",
    }
    res = _archive_request(
        "POST",
        "https://web.archive.org/save",
        data={"url": url},
        headers=headers,
        timeout=ARCHIVE_SAVE_TIMEOUT,
        label=url,
        pace=True,
    )
    if res is None:
        logging.error(f"Could not save {url} to archive.org: no response")
        return False
    if res.status_code >= 400:
        logging.error(f"Could not save {url} to archive.org: HTTP {res.status_code}")
        return False
    try:
        job_id = res.json().get("job_id")
    except ValueError:
        job_id = None
    if not job_id:
        logging.error(f"Could not save {url} to archive.org: no job_id in response")
        return False
    logging.info(f"Archive.org capture job {job_id} started for {url}")
    status_url = f"https://web.archive.org/save/status/{job_id}"
    for attempt in range(ARCHIVE_JOB_POLL_ATTEMPTS):
        time.sleep(ARCHIVE_JOB_POLL_DELAY)
        res = _archive_request("GET", status_url, headers=headers, timeout=ARCHIVE_CHECK_TIMEOUT, label=f"status {job_id}")
        if res is None or res.status_code >= 400:
            logging.error(f"Could not check archive.org capture job {job_id} for {url}: {res.status_code if res is not None else 'no response'}")
            return False
        try:
            status = res.json()
        except ValueError:
            logging.error(f"Invalid archive.org status response for job {job_id}: {res.text[:200]}")
            return False
        state = status.get("status")
        if state == "success":
            logging.info(f"Archive.org captured {url} (timestamp {status.get('timestamp', 'unknown')})")
            _capture_timestamps[url] = status.get("timestamp")
            return True
        if state == "error":
            message = status.get("message") or status.get("status_ext") or state
            if "404" in str(message) or status.get("status_ext") == "error:not-found":
                raise ArchiveNotFoundError(f"archive.org cannot find {url}: {message}")
            logging.error(f"Archive.org capture failed for {url}: {message}")
            return False
        logging.info(f"Waiting for archive.org capture job {job_id} ({attempt + 1}/{ARCHIVE_JOB_POLL_ATTEMPTS})")
    logging.error(f"Archive.org capture job {job_id} for {url} did not finish in time")
    return False


def _archive_url(url, dry_run=False, keys=None):
    """Ensure a Wayback snapshot no older than ARCHIVE_MAX_AGE exists for url."""
    timestamp = _wayback_snapshot(url)
    if _wayback_fresh(timestamp):
        _snapshot_urls[url] = _wayback_url(url, timestamp)
        logging.info(f"Recent archive.org snapshot found for {url}")
        return True
    if dry_run:
        logging.info(f"[DRY RUN] No recent archive.org snapshot for {url}, would save it")
        return False
    logging.info(f"No recent archive.org snapshot for {url}, requesting a save")
    if keys:
        if not _archive_save_authenticated(url, keys):
            return False
        timestamp = _capture_timestamps.get(url)
        if timestamp:
            _snapshot_urls[url] = _wayback_url(url, timestamp)
            return True
    elif not _archive_save_anonymous(url):
        return False
    for attempt in range(ARCHIVE_POLL_ATTEMPTS):
        time.sleep(ARCHIVE_POLL_DELAY)
        timestamp = _wayback_snapshot(url)
        if _wayback_fresh(timestamp):
            _snapshot_urls[url] = _wayback_url(url, timestamp)
            logging.info(f"Fresh archive.org snapshot confirmed for {url}")
            return True
        logging.info(f"Waiting for archive.org snapshot for {url} ({attempt + 1}/{ARCHIVE_POLL_ATTEMPTS})")
    logging.error(f"No archive.org snapshot newer than {ARCHIVE_MAX_AGE} for {url}")
    return False

def ensure_archived(entry, dry_run=False):
    """Gate uploads on a fresh Wayback snapshot for every article URL."""
    if not entry.urls:
        logging.error(f"No article URLs available for '{entry.title}', cannot check archive.org")
        return False
    keys = None if dry_run else _load_archive_keys()
    if keys:
        logging.info("Using authenticated archive.org Save Page Now (IA_ACCESS_KEY/IA_SECRET_KEY)")
    results = []
    for lang, url in entry.urls.items():
        result = _archive_url(url, dry_run, keys)
        if result and url in _snapshot_urls:
            entry.archive_urls[lang] = _snapshot_urls[url]
        results.append(result)
    return all(results)

def check_post_committed(repo, post):
    """Check that every content file of a post is identical to HEAD (fully committed).

    Returns (committed, reason) - reason is only set if committed is False."""
    reasons = []
    for file in sorted(set(str(f) for f in post.files.values())):
        rel = os.path.relpath(file, repo.working_dir)
        try:
            repo.head.commit.tree[rel]
        except KeyError:
            reasons.append(f"{rel} is not committed (missing from HEAD)")
            continue
        staged = repo.index.diff("HEAD", paths=[rel])
        unstaged = repo.index.diff(None, paths=[rel])
        if len(unstaged) > 0:
            reasons.append(f"{rel} has unstaged changes")
        elif len(staged) > 0:
            reasons.append(f"{rel} has staged but uncommitted changes")
    if reasons:
        return False, "; ".join(reasons)
    return True, None

def _format_creator_name(name):
    """Zenodo requires the 'Family name, given names' format."""
    if "," in name:
        return name
    parts = name.rsplit(" ", 1)
    if len(parts) == 2:
        return f"{parts[1]}, {parts[0]}"
    return name

def patch_pdf_metadata(pdf_path, doi_url, entry):
    """Write the DOI and descriptive metadata into a PDF in place.

    XMP and DocInfo are written consistently (pikepdf's update_docinfo) to keep
    the PDF/A conformance intact; PDFs already carrying the DOI are left untouched."""
    with pikepdf.open(pdf_path, allow_overwriting_input=True) as pdf:
        with pdf.open_metadata() as meta:
            if meta.get("dc:identifier") == doi_url:
                logging.info(f"{pdf_path} already carries {doi_url}, not patching.")
                return
        with pdf.open_metadata(set_pikepdf_as_editor=False, update_docinfo=True) as meta:
            meta["dc:title"] = entry.title
            meta["dc:creator"] = [_format_creator_name(a["name"]) for a in entry.authors]
            meta["dc:description"] = entry.description
            meta["dc:identifier"] = doi_url
            if entry.keywords:
                meta["pdf:Keywords"] = ", ".join(entry.keywords)
        pdf.save(pdf_path)
    logging.info(f"Patched {pdf_path} with DOI {doi_url}")

def _patch_entry_pdfs(entry, doi):
    """Write the DOI and entry metadata into all PDF files of the entry in place."""
    doi_url = f"https://doi.org/{doi}"
    for path in entry.upload_files.values():
        patch_pdf_metadata(path, doi_url, entry)

def _prepare_upload_paths(entry, workdir):
    """Return the paths to upload for an entry.

    Language versions share the basename article.pdf, and the Zenodo bucket is
    keyed by filename – without renaming, the last upload silently replaces the
    previous ones. Multilingual entries therefore get renamed copies
    (article-<lang>.pdf) in workdir; single language entries upload the file as-is."""
    if len(entry.upload_files) <= 1:
        return list(entry.upload_files.values())
    paths = []
    for lang, path in entry.upload_files.items():
        target = Path(workdir) / f"article-{lang}.pdf"
        shutil.copyfile(path, target)
        paths.append(target)
    return paths

def _rdm_reserve_doi(client, draft, entry, target):
    """Return the draft's DOI, reserving one via the RDM API if needed."""
    doi = _rdm_doi(draft)
    if doi:
        return doi
    logging.info(f"Reserving DOI for '{entry.title}' on {target}...")
    result = rdm_reserve_doi(str(draft.id), client=client)
    if not isinstance(result, dict):
        raise RuntimeError(f"reserving a DOI on {target} failed: {result}")
    doi = (result.get("pids") or {}).get("doi", {}).get("identifier")
    if not doi:
        raise RuntimeError(f"no DOI in the reservation response from {target}")
    return doi


def _rdm_upload_files(client, draft_id, paths):
    """Initialize, upload and commit each PDF in a draft's file bucket.

    Uses the detailed responses because the generated client's commit parser
    expects HTTP 201 while Zenodo answers 200. Completed files are kept;
    half-uploaded ones are removed so the resume is clean."""
    existing = rdm_list_files(str(draft_id), client=client)
    entries = existing.get("entries", []) if isinstance(existing, dict) else []
    completed = {entry.get("key") for entry in entries if entry.get("status") == "completed"}
    for entry in entries:
        if entry.get("key") and entry.get("status") != "completed":
            rdm_delete_file(str(draft_id), entry["key"], client=client)
    todo = [p for p in paths if Path(p).name not in completed]
    if not todo:
        logging.info(f"All PDFs already uploaded to draft {draft_id}, skipping upload")
        return
    result = rdm_start_upload(str(draft_id), client=client, body=[rdm.FileTransferItem(key=Path(p).name) for p in todo])
    if result.status_code not in (200, 201):
        raise RuntimeError(f"could not start file uploads for draft {draft_id}: HTTP {result.status_code}")
    for path in todo:
        key = Path(path).name
        with open(path, "rb") as f:
            content = rdm_upload_content(str(draft_id), key, client=client, body=rdm.File(payload=f))
        if content.status_code not in (200, 201):
            raise RuntimeError(f"content upload failed for {key}: HTTP {content.status_code}")
        commit = rdm_commit_upload(str(draft_id), key, client=client)
        if commit.status_code not in (200, 201, 204):
            raise RuntimeError(f"file commit failed for {key}: HTTP {commit.status_code}")


def _rdm_stage_or_publish(entry, metadata, workdir, token, sandbox, target, publish=False):
    """Create or resume an RDM draft, patch PDFs with its DOI, upload files.

    Returns (record, doi). The record is a draft unless publish is requested."""
    client = _rdm_client(token, sandbox)
    module = "zenodo:sandbox" if sandbox else "zenodo"
    draft_id = pystow.get_config(module, entry.key)
    draft = None
    resumed = False
    if draft_id:
        logging.info(f"Found unfinished draft {draft_id} for key '{entry.key}', resuming.")
        try:
            data = _rdm_request(client, "GET", f"/api/records/{draft_id}/draft", allow_missing=True)
            draft = _rdm_record(data) if data is not None else None
            resumed = draft is not None
        except Exception as e:
            logging.warning(f"Could not fetch draft {draft_id} on {target}: {e}")
        if draft is None:
            logging.warning(f"Draft {draft_id} no longer exists on {target}, creating a new one.")
    if draft is None:
        body = rdm.CreateADraftRecordBody(access=_rdm_access(), files=rdm.Files(enabled=True), metadata=metadata)
        data = _rdm_request(client, "POST", "/api/records", body=body.model_dump(mode="json", by_alias=True, exclude_unset=True))
        draft = _rdm_record(data)
        if not draft.id:
            raise RuntimeError(f"creating a draft on {target} failed")
        pystow.write_config(module, entry.key, str(draft.id))
    elif resumed:
        body = rdm.UpdateDraftRecord(access=_rdm_access(), files=rdm.Files(enabled=True), metadata=metadata)
        data = _rdm_request(client, "PUT", f"/api/records/{draft.id}/draft", body=body.model_dump(mode="json", by_alias=True, exclude_unset=True))
        draft = _rdm_record(data)
    doi = _rdm_reserve_doi(client, draft, entry, target)
    _patch_entry_pdfs(entry, doi)
    _rdm_upload_files(client, draft.id, _prepare_upload_paths(entry, workdir))
    logging.info(f"Uploaded files to draft {draft.id} on {target} ({'will publish' if publish else 'leaving it in draft'})...")
    if publish:
        record = _rdm_record(_rdm_request(client, "POST", f"/api/records/{draft.id}/draft/actions/publish"))
        return record, doi
    return draft, doi


def _rdm_new_version(entry, metadata, workdir, token, sandbox, target, publish=False):
    """Create a new RDM version draft, update its metadata, upload files."""
    client = _rdm_client(token, sandbox)
    data = _rdm_request(client, "POST", f"/api/records/{entry.deposition_id}/versions")
    draft = _rdm_record(data)
    if not draft.id:
        raise RuntimeError(f"creating a new version on {target} failed")
    body = rdm.UpdateDraftRecord(access=_rdm_access(), files=rdm.Files(enabled=True), metadata=metadata)
    data = _rdm_request(client, "PUT", f"/api/records/{draft.id}/draft", body=body.model_dump(mode="json", by_alias=True, exclude_unset=True))
    draft = _rdm_record(data)
    doi = _rdm_reserve_doi(client, draft, entry, target)
    _patch_entry_pdfs(entry, doi)
    _rdm_upload_files(client, draft.id, _prepare_upload_paths(entry, workdir))
    logging.info(f"Uploaded files to new version draft {draft.id} on {target} ({'will publish' if publish else 'leaving it in draft'})...")
    if publish:
        record = _rdm_record(_rdm_request(client, "POST", f"/api/records/{draft.id}/draft/actions/publish"))
        return record, doi
    return draft, doi

def zenodo_push(entry: ZenodoEntry, token, sandbox=True, dry_run=True, update=False, archive=True, publish=False):
    if not entry.upload_files or not entry.key or not entry.title:
        logging.warning(f"Missing required fields for entry '{entry.title}', skipping.")
        return True

    target = "Zenodo sandbox" if sandbox else "Zenodo production"

    already_published = bool(entry.deposition_id or entry.doi)

    # A sandbox DOI (10.5072/...) can never be updated on production – start over there
    if already_published and not sandbox and entry.doi.startswith(SANDBOX_DOI_PREFIX):
        logging.warning(f"Entry '{entry.title}' has a Zenodo sandbox DOI ({entry.doi}) but target is {target}, treating it as unpublished and creating a new deposit.")
        entry.deposition_id = ""
        entry.doi = ""
        entry.changed = False
        already_published = False

    publication_date = _publication_date(entry, already_published)

    if dry_run:
        if already_published and not entry.changed:
            logging.info(f"[DRY RUN] '{entry.title}' already published and unchanged, would skip.")
        elif already_published:
            logging.info(f"[DRY RUN] Would create a new Zenodo version for '{entry.title}' (lastmod {entry.lastmod or 'unknown'}).")
        else:
            logging.info(f"[DRY RUN] Would reserve a DOI for '{entry.title}' on {target}, write it into the PDF metadata, then upload and {'publish' if publish else 'stage as a draft'}.")
        logging.info(f"[DRY RUN] Files to be uploaded: {list(entry.upload_files.values())}")
        if archive:
            ensure_archived(entry, dry_run=True)
        return True

    if already_published and not entry.changed:
        logging.info(f"Entry '{entry.title}' already has a deposition ID or DOI and is unchanged, skipping upload.")
        return True

    if archive and not ensure_archived(entry):
        logging.error(f"Archive.org gate failed for '{entry.title}', skipping Zenodo upload.")
        return False

    metadata = _rdm_metadata(entry, publication_date)
    logging.info(f"Related identifiers for '{entry.title}': {len(metadata.related_identifiers or [])}")

    with tempfile.TemporaryDirectory() as tmp:
        try:
            if already_published:
                logging.info(f"Entry '{entry.title}' changed since last upload (lastmod {entry.lastmod or 'unknown'}), creating new Zenodo version on {target}...")
                record, doi = _rdm_new_version(entry, metadata, tmp, token, sandbox, target, publish)
            else:
                logging.info(f"Uploading '{entry.title}' to {target}...")
                record, doi = _rdm_stage_or_publish(entry, metadata, tmp, token, sandbox, target, publish)
        except Exception as e:
            logging.error(f"Upload to {target} failed for {entry.posts}, not updating front matter: {e}")
            return False

    record_id = str(getattr(record, "id", "") or "")
    if record_id:
        host = "https://sandbox.zenodo.org" if sandbox else "https://zenodo.org"
        url_path = "records" if publish else "uploads"
        logging.info(f"{'Published' if publish else 'Staged draft'} on {target}: {host}/{url_path}/{record_id}")

    if already_published:
        zenodo_post_metadata = {
            "deposition_id": record_id or entry.deposition_id,
        }
    else:
        zenodo_post_metadata = {
            "doi": doi,
            "deposition_id": record_id,
        }
    if entry.lastmod:
        zenodo_post_metadata["lastmod"] = entry.lastmod

    updates = []
    for lang, post in entry.posts.items():
        zenodo = _get_zenodo_block(post, lang)
        post_metadata = {**zenodo, **zenodo_post_metadata}
        updates.append((lang, post, post_metadata))

    # Phase 3: write front matter; stop on the first failure and report state
    written, skipped = [], []
    for index, (lang, post, post_metadata) in enumerate(updates):
        if update:
            try:
                _set_zenodo_block(post, lang, post_metadata)
                written.append(lang)
            except Exception as e:
                remaining = [l for l, _, _ in updates[index + 1:]]
                logging.error(
                    f"Error while writing front matter of {post} (language '{lang}') after successful upload to {target}, "
                    f"not updating front matter: {e}. Written: {written or 'none'}, not written: {[lang] + remaining}"
                )
                return False

        logging.info(f"Success! DOI {post_metadata.get('doi', 'unchanged')} in {post} added.")

    return True

def check_hugo_posts(site_root, subdir, pattern, update=False):
    conf = Config(site_root)
    langs = conf.langs
    logging.info(f"Site languages: {langs}, default: {conf.defaultLanguage}")
    content = Content(os.path.join(site_root, Content.DEFAULT_CONTENT_DIR), sub_path=subdir, config=conf, sections=False)
    entries = []
    base_url = conf.baseURL()
    content_root = os.path.join(site_root, conf.publishDir())
    post_root = os.path.join(site_root, conf.contentDir(), subdir)

    try:
        repo = git.Repo(site_root)
    except (git.InvalidGitRepositoryError, git.NoSuchPathError):
        repo = None
        logging.warning(f"No git repository found at {site_root}, skipping committed-state checks")

    post_files = {}
    for post in content:
        if post.draft:
            logging.info(f"Skipping draft post: {post.path}")
            continue
        upload = {}
        entry = prepare_entry(conf)
        entry_lastmods = {}
        titles = {}
        descriptions = {}
        stored_lastmod = None
        if not post.path or not post.getURL():
            logging.warning(f"Post {post} has no path or URL, skipping.")
            continue
        relative = post.path.relative_to(site_root)
        logging.info(f"Processig post: {post.path} | Output Dirs: {post.getOutputDirs()} | URL: {post.getURL()}")
        if not str(relative) in post_files:
            post_files[str(relative)] = {}
        post_files[str(relative)]["URL"] = post.getURL()

        for lang, search_path in post.getOutputDirs().items():
            search_path = os.path.join(site_root, search_path)
            logging.info(f"Checking for files in {search_path} for language '{lang}'")
            files = list(Path(search_path).rglob(pattern))
            if len(files) > 1:
                logging.warning(f"Multiple files match '{pattern}' for language '{lang}' in {search_path}, using last: {files}")
            for file in files:
                #relative_path = file.relative_to(content_root)
                entry.upload_files[lang] = str(file)
                entry.posts[lang] = post
            post_relative_path = Path(post.getFile(lang)).relative_to(post_root)
            url_path = f"{subdir.strip('/')}/{os.path.dirname(post_relative_path)}".strip("/")
            if lang == conf.defaultLanguage:
                full_url = f"{base_url.rstrip('/')}/{url_path}".rstrip("/") + "/"
                entry.primary_url = full_url
                date_dt = _parse_lastmod(post.getMetadata(lang).get("date"), post.getFile(lang))
                if date_dt:
                    entry.date = date_dt.date().isoformat()
            else:
                full_url = f"{base_url.rstrip('/')}/{lang}/{url_path}".rstrip("/") + "/"
            entry.urls[lang] = full_url
            entry.related_identifiers.append({"identifier": full_url, "relation": "isSupplementTo", "resource_type": "publication-other"})

            keywords = _tag_keywords(post, conf, 'en')
            keywords = list(set(keywords) - set(IGNORE_KEYWORDS))
            description = post.getMetadata(lang).get("description", "")
            if "cite" in post.getMetadata(lang):
                logging.info("Post is set to be citeable")
            title = post.getMetadata(lang).get("title", "")
            zenodo = _get_zenodo_block(post, lang)
            entry_lastmods[lang] = _parse_lastmod(post.getMetadata(lang).get("lastmod"), post.getFile(lang))
            if "lastmod" in zenodo:
                stored_lastmod = _parse_lastmod(zenodo["lastmod"], post.getFile(lang))
            if "publish" in zenodo and zenodo["publish"] is True:
                upload[lang] = True
            else:
                upload[lang] = False
            if "description" in zenodo:
                description = zenodo["description"]
            if "keywords" in zenodo:
                keywords = zenodo["keywords"]
            if "doi" in zenodo:
                entry.doi = zenodo["doi"]
            if "deposition_id" in zenodo:
                entry.deposition_id = zenodo["deposition_id"]

            titles[lang] = title
            descriptions[lang] = description
            entry.keywords.extend(keywords)
            if entry.description != "" and description != "":
                entry.description = f"{entry.description}\n\n---\n\n{description}"
            elif description != "":
                entry.description = description

            if entry.title != "" and title != "":
                entry.title = f"{entry.title} / {title}"
            elif title != "":
                entry.title = title
        if not all(upload.get(lang) is True for lang in conf.langs):
            logging.warning(f"Post {post.path} with pattern '{pattern}' not marked for upload in all languages, skipping!")
            continue

        if repo is not None:
            committed, reason = check_post_committed(repo, post)
            if not committed:
                logging.error(f"Post {post.path} has uncommitted content: {reason}, aborting run")
                sys.exit(1)

        for field, values in (("title", titles), ("description", descriptions)):
            present = [value for value in values.values() if value]
            if len(present) > 1 and len(set(present)) == 1:
                logging.error(f"Post {post.path} has an identical {field} in all languages: {present[0]}")
                sys.exit(1)

        # Fail on divergent lastmod dates between the language versions
        present_lastmods = {lang: dt for lang, dt in entry_lastmods.items() if dt is not None}
        if present_lastmods:
            if len(present_lastmods) != len(entry_lastmods) or len(set(present_lastmods.values())) > 1:
                details = ", ".join(
                    f"{lang}: {dt.isoformat() if dt is not None else 'missing'}" for lang, dt in entry_lastmods.items()
                )
                logging.error(f"Divergent lastmod dates for post {post.path}: {details}")
                sys.exit(1)
            lastmod_dt = max(present_lastmods.values())
            entry.lastmods = {lang: dt.isoformat() for lang, dt in entry_lastmods.items() if dt is not None}
            entry.lastmod = lastmod_dt.isoformat()
            if entry.deposition_id or entry.doi:
                if stored_lastmod is None:
                    logging.warning(
                        f"Post {post.path} is published but has no zenodo.lastmod recorded, cannot detect changes, will not create new versions"
                    )
                elif lastmod_dt > stored_lastmod:
                    entry.changed = True
                    logging.info(f"Post {post.path} changed since last upload: lastmod {lastmod_dt.isoformat()} > zenodo.lastmod {stored_lastmod.isoformat()}")

        if not entry.key:
            entry.key = str(relative.with_suffix(""))
            logging.info(f"Using post path as Zenodo key: {entry.key}")

        entry.keywords = list(set(entry.keywords))
        logging.info(f"Entry for {post.path} - {entry.to_json()}")
        entries.append(entry)

    return entries

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Push Hugo posts to Zenodo.")
    parser.add_argument("--basedir", "-b", default=".", help="The base directory of the Hugo project.")
    parser.add_argument("--sub", default="post", help="Subdirectory inside publishDir to scan")
    parser.add_argument("--pattern", default="article.pdf", help="File pattern to search")
    parser.add_argument("--limit", type=int, default=0, help="Process at most N posts (0 = all)")
    parser.add_argument("--dry-run", "-n", action="store_true", help="Perform a dry run without uploading or changing files.")
    parser.add_argument("--token", help="Zenodo API Token")
    parser.add_argument("--production", "-p", action="store_false", dest="sandbox", default=True, help="Upload to production Zenodo instead of the sandbox")
    parser.add_argument("--update", "-u", action="store_true", default=False, help="Write the returned doi and deposition_id back into the post front matter")
    parser.add_argument("--publish", action="store_true", default=False, help="Publish the staged Zenodo deposits (default: leave them as drafts)")
    parser.add_argument("--no-archive", dest="archive", action="store_false", default=True, help="Skip the archive.org freshness check before uploading")
    parser.add_argument("--debug", "-d", action="store_true", help="Enable debug logging")
    args = parser.parse_args()

    if args.debug:
        logging.basicConfig(level=logging.DEBUG)

    site_root = Path(args.basedir).resolve()
    logging.info(f"Trying to load config from {site_root} and process posts in subdir '{args.sub}' with pattern '{args.pattern}'")
    logging.info(f"Target: {'Zenodo sandbox' if args.sandbox else 'Zenodo production'}")
    token = args.token
    if token is None:
        token = _load_env_token(args.sandbox)
        if token:
            logging.info("Using Zenodo token from environment or local .env file")
        elif not args.dry_run:
            var = "ZENODO_SANDBOX_ACCESS_TOKEN" if args.sandbox else "ZENODO_ACCESS_TOKEN"
            logging.error(f"No Zenodo API token found. Pass --token or set {var} in the environment or a local .env file.")
            sys.exit(1)
    posts = check_hugo_posts(site_root, args.sub, args.pattern, args.update)
    if args.limit > 0:
        posts = posts[:args.limit]
    failed = False
    for entry in posts:
        try:
            if not zenodo_push(entry, token=token, sandbox=args.sandbox, dry_run=args.dry_run, update=args.update, archive=args.archive, publish=args.publish):
                failed = True
        except ArchiveNotFoundError as e:
            logging.error(f"{e}, aborting run")
            sys.exit(1)
    if failed:
        sys.exit(1)
