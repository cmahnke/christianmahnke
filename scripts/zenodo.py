import argparse
from zenodo_client import Creator, Metadata, Zenodo, create_zenodo, update_zenodo
from pathlib import Path
from datetime import date, datetime, timezone
import sys, os, logging
import json
import git
import pikepdf
import pystow
import requests
import shutil
import tempfile
from dataclasses import dataclass

sys.path.append(str(Path(__file__).resolve().parents[1] / "themes" / "projektemacher-base" / "scripts"))
from PyHugo import Content, Config, Post

DEFAULT_AUTHOR = {"name": "Christian Mahnke"}
DEFAULT_LICENSE = "cc-by-4.0"

UPLOAD_TYPE = "publication"
PUBLICATION_TYPE = "section"

IGNORE_KEYWORDS = ["Blog", "Projektemacher.org", "Status", "Suche", "Spaß", "Fun", ""]

SANDBOX_DOI_PREFIX = "10.5072/"

# Logging Setup
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')


class ReserveMetadata(Metadata):
    """Deposition metadata with a DOI pre-reserved on creation.

    The reserved DOI is returned in the API response (metadata.prereserve_doi.doi)
    but only becomes resolvable once the deposition is published."""

    prereserve_doi: bool = True

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

def _check_zenodo_response(res_json, already_published, target):
    """Validate the Zenodo API response before anything is written to front matter.

    Returns None if the response is usable, or an error message otherwise."""
    res_id = str(res_json.get("id", ""))
    if not res_id:
        return "no deposition id in response"
    if not already_published:
        doi = res_json.get("doi") or res_json.get("metadata", {}).get("prereserve_doi", {}).get("doi", "")
        if not doi:
            return "no DOI in response"
    return None

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

def _get_deposition_json(z, deposition_id):
    """Fetch a deposition (draft or published) as JSON."""
    res = requests.get(
        f"{z.depositions_base}/{deposition_id}",
        params={"access_token": z.access_token},
        timeout=15,
        headers={"User-Agent": "zenodo.py"},
    )
    res.raise_for_status()
    return res.json()

def _reserve_and_publish(entry, metadata, workdir, token, sandbox, target):
    """Reserve a DOI on a new draft deposit, write it into the entry's PDFs, then
    upload the files and publish the deposit.

    Mirrors zenodo_client's pystow key bookkeeping (see Zenodo.ensure) so an
    interrupted run – draft reserved, publish failed – resumes the same draft
    on the next run instead of creating a duplicate deposit.

    Returns the publish response, or None on failure."""
    module = "zenodo:sandbox" if sandbox else "zenodo"
    z = Zenodo(access_token=token, sandbox=sandbox)
    deposition_id = pystow.get_config(module, entry.key)
    reserved_doi = None
    if deposition_id:
        logging.info(f"Found unfinished draft deposition {deposition_id} for key '{entry.key}', resuming.")
        try:
            dep = _get_deposition_json(z, deposition_id)
            reserved_doi = dep.get("metadata", {}).get("prereserve_doi", {}).get("doi", "")
        except requests.HTTPError as e:
            if e.response is not None and e.response.status_code in (404, 410):
                logging.warning(f"Draft deposition {deposition_id} no longer exists on {target}, creating a new one.")
            else:
                logging.error(f"Could not fetch draft deposition {deposition_id} on {target}, not uploading: {e}")
                return None
        if not reserved_doi:
            logging.warning(f"Draft deposition {deposition_id} has no pre-reserved DOI, the PDFs will be uploaded without a DOI.")
    if reserved_doi is None:
        logging.info(f"Reserving DOI for '{entry.title}' on {target}...")
        try:
            dep = create_zenodo(data=metadata, paths=[], publish=False, sandbox=sandbox, access_token=token).json()
        except Exception as e:
            logging.error(f"Reserving a DOI on {target} failed for {entry.posts}: {e}")
            return None
        error = _check_zenodo_response(dep, already_published=False, target=target)
        reserved_doi = dep.get("metadata", {}).get("prereserve_doi", {}).get("doi", "")
        if error is not None or not reserved_doi:
            logging.error(f"Unexpected API response from {target} for {entry.posts} ({error or 'no pre-reserved DOI'}), not uploading or updating front matter. Response: {json.dumps(dep)[:500]}")
            return None
        deposition_id = str(dep["id"])
        pystow.write_config(module, entry.key, deposition_id)
    try:
        _patch_entry_pdfs(entry, reserved_doi)
        upload_paths = _prepare_upload_paths(entry, workdir)
    except Exception as e:
        logging.error(f"Failed to prepare the PDFs for upload (DOI {reserved_doi}) for {entry.posts}, not uploading: {e}")
        return None
    logging.info(f"Uploading patched files to draft deposition {deposition_id} and publishing on {target}...")
    try:
        return update_zenodo(deposition_id=deposition_id, paths=upload_paths, sandbox=sandbox, access_token=token)
    except Exception as e:
        logging.error(f"Publishing draft deposition {deposition_id} on {target} failed for {entry.posts}, it will be resumed on the next run: {e}")
        return None

def zenodo_push(entry: ZenodoEntry, token, sandbox=True, dry_run=True, update=False):
    if not entry.upload_files or not entry.key or not entry.title:
        logging.warning(f"Missing required fields for entry '{entry.title}', skipping.")
        return

    target = "Zenodo sandbox" if sandbox else "Zenodo production"

    metadata = ReserveMetadata(
        title=entry.title,
        upload_type=UPLOAD_TYPE,
        publication_type=PUBLICATION_TYPE,
        creators=[Creator(name=_format_creator_name(a["name"]), orcid=a.get("orcid"), gnd=a.get("gnd"), affiliation=a.get("affiliation")) for a in entry.authors],
        description=entry.description,
        keywords=entry.keywords,
        license=entry.license,
        related_identifiers=entry.related_identifiers
    )

    already_published = bool(entry.deposition_id or entry.doi)

    # A sandbox DOI (10.5072/...) can never be updated on production – start over there
    if already_published and not sandbox and entry.doi.startswith(SANDBOX_DOI_PREFIX):
        logging.warning(f"Entry '{entry.title}' has a Zenodo sandbox DOI ({entry.doi}) but target is {target}, treating it as unpublished and creating a new deposit.")
        entry.deposition_id = ""
        entry.doi = ""
        entry.changed = False
        already_published = False

    if dry_run:
        if already_published and not entry.changed:
            logging.info(f"[DRY RUN] '{entry.title}' already published and unchanged, would skip.")
        elif already_published:
            logging.info(f"[DRY RUN] Would create a new Zenodo version for '{entry.title}' (lastmod {entry.lastmod or 'unknown'}).")
        else:
            logging.info(f"[DRY RUN] Would reserve a DOI for '{entry.title}' on {target}, write it into the PDF metadata, then upload and publish.")
        logging.info(f"[DRY RUN] Files to be uploaded: {list(entry.upload_files.values())}")
        return

    if already_published and not entry.changed:
        logging.info(f"Entry '{entry.title}' already has a deposition ID or DOI and is unchanged, skipping upload.")
        return

    with tempfile.TemporaryDirectory() as tmp:
        # Phase 1: reserve (new entries) / upload / create version – raises on API
        # failure, front matter untouched
        try:
            if already_published:
                logging.info(f"Entry '{entry.title}' changed since last upload (lastmod {entry.lastmod or 'unknown'}), creating new Zenodo version on {target}...")
                if entry.doi:
                    _patch_entry_pdfs(entry, entry.doi)
                res = update_zenodo(
                    deposition_id=entry.deposition_id,
                    paths=_prepare_upload_paths(entry, tmp),
                    sandbox=sandbox,
                    access_token=token
                )
            else:
                logging.info(f"Uploading '{entry.title}' to {target}...")
                res = _reserve_and_publish(entry, metadata, tmp, token, sandbox, target)
                if res is None:
                    return
        except Exception as e:
            logging.error(f"Upload to {target} failed for {entry.posts}, not updating front matter: {e}")
            return

    # Phase 2: validate response, build front matter for all languages before writing
    try:
        res_json = res.json()
    except Exception as e:
        logging.error(f"Invalid API response from {target} for {entry.posts}, not updating front matter: {e}")
        return
    error = _check_zenodo_response(res_json, already_published, target)
    if error is not None:
        logging.error(f"Unexpected API response from {target} for {entry.posts} ({error}), not updating front matter. Response: {json.dumps(res_json)[:500]}")
        return

    if already_published:
        new_id = str(res_json.get("id", ""))
        zenodo_post_metadata = {
            "deposition_id": new_id if new_id else entry.deposition_id,
        }
    else:
        zenodo_post_metadata = {
            "doi": res_json.get("doi") or res_json.get("metadata", {}).get("prereserve_doi", {}).get("doi", ""),
            "deposition_id": str(res_json.get("id", "")),
        }
    if entry.lastmod:
        zenodo_post_metadata["lastmod"] = entry.lastmod

    updates = []
    for lang, post in entry.posts.items():
        zenodo = post.getMetadata(lang).get("zenodo", {})
        post_metadata = {**zenodo, **zenodo_post_metadata}
        updates.append((lang, post, post_metadata))

    # Phase 3: write front matter; stop on the first failure and report state
    written, skipped = [], []
    for index, (lang, post, post_metadata) in enumerate(updates):
        if update:
            try:
                post.addMetadata("zenodo", post_metadata, lang)
                written.append(lang)
            except Exception as e:
                remaining = [l for l, _, _ in updates[index + 1:]]
                logging.error(
                    f"Error while writing front matter of {post} (language '{lang}') after successful upload to {target}, "
                    f"not updating front matter: {e}. Written: {written or 'none'}, not written: {[lang] + remaining}"
                )
                return

        logging.info(f"Success! DOI {post_metadata.get('doi', 'unchanged')} in {post} added.")

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
        if repo is not None:
            committed, reason = check_post_committed(repo, post)
            if not committed:
                logging.warning(f"Skipping post {post.path}, content is not fully committed: {reason}")
                continue
        upload = {}
        entry = prepare_entry(conf)
        entry_lastmods = {}
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
            if lang == conf.defaultLanguage:
                full_url = f"{base_url.rstrip("/")}/{os.path.dirname(post_relative_path)}".rstrip("/") + "/"
            else:
                full_url = f"{base_url.rstrip("/")}/{lang}/{os.path.dirname(post_relative_path)}".rstrip("/") + "/"
            entry.urls[lang] = full_url
            entry.related_identifiers.append({"identifier": full_url, "relation": "isIdenticalTo", "resource_type": "publication-section"})

            keywords = post.getKeywords()
            # TODO: This isn't working yet
            #keywords = post.getKeywords(lang)
            keywords = list(set(keywords) - set(IGNORE_KEYWORDS))
            description = post.getMetadata(lang).get("description", "")
            if "cite" in post.getMetadata(lang):
                logging.info("Post is set to be citeable")
            title = post.getMetadata(lang).get("title", "")
            zenodo = post.getMetadata(lang).get("zenodo", {})
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
    parser.add_argument("--dry-run", "-n", action="store_true", help="Perform a dry run without uploading or changing files.")
    parser.add_argument("--token", help="Zenodo API Token")
    parser.add_argument("--production", "-p", action="store_false", dest="sandbox", default=True, help="Upload to production Zenodo instead of the sandbox")
    parser.add_argument("--update", "-u", action="store_true", default=False, help="Update post front matter with archive URLs")
    parser.add_argument("--debug", "-d", action="store_true", help="Enable debug logging")
    args = parser.parse_args()

    if args.debug:
        logging.basicConfig(level=logging.DEBUG)

    site_root = Path(args.basedir).resolve()
    logging.info(f"Trying to load config from {site_root} and process posts in subdir '{args.sub}' with pattern '{args.pattern}'")
    logging.info(f"Target: {'Zenodo sandbox' if args.sandbox else 'Zenodo production'}")
    posts = check_hugo_posts(site_root, args.sub, args.pattern, args.update)
    for entry in posts:
        zenodo_push(entry, token=args.token, sandbox=args.sandbox, dry_run=args.dry_run, update=args.update)
