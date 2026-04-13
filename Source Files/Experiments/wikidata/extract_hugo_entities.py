import argparse
import sys
import os
import spacy
import frontmatter
import logging
import re
import sqlite3
import json
import time
import difflib
import requests
import rdflib
import rdflib.term
from rdflib.namespace import RDFS, SKOS
import rdflib_sqlite3

# --- Configuration Constants ---
BATCH_SIZE = 50
MAX_RETRIES = 5
SEARCH_RETRIES = 3
RATE_LIMIT_BASE_WAIT = 5
INTER_BATCH_SLEEP = 1
INTER_SEARCH_SLEEP = 0.2
RETRY_SLEEP = 2
NLP_MAX_LENGTH = 2_000_000
SPARQL_RESULT_LIMIT = 50
HDT_COMMIT_INTERVAL = 100
HDT_LOG_INTERVAL = 1000
SPARQL_ENDPOINT = "https://query.wikidata.org/sparql"

# Patch rdflib to handle Wikidata's negative years/invalid ISO dates by treating them as strings
rdflib.term.bind(rdflib.XSD.dateTime, str, constructor=str)
rdflib.term.bind(rdflib.XSD.date, str, constructor=str)

# Mapping of language codes to spaCy model names.
# Ensure these models are downloaded via `python -m spacy download <model_name>`
LANG_MODEL_MAP: dict[str, str] = {
    'en': 'en_core_web_trf',
    'de': 'de_core_news_lg'
}

DEFAULT_LANG: str = 'de'

IGNORED_LABELS: set[str] = {'ORDINAL', 'DATE', 'TIME', 'QUANTITY', 'CARDINAL', 'PERCENT'}

# Set User Agent to comply with policy
USER_AGENT: str = 'Projektemacher.org Entity Extractor/1.0'

logger = logging.getLogger(__name__)

# Sentinel for cache miss distinction
_CACHE_MISS = object()


def get_lang_from_filename(filename: str) -> str:
    """Extract language code from Hugo filename pattern: name.lang.md"""
    parts = filename.split('.')
    if len(parts) >= 3:
        candidate = parts[-2]
        if len(candidate) == 2 and candidate.isalpha():
            return candidate
    return DEFAULT_LANG


def clean_markdown(text: str, context: str | None = None) -> str:
    """Remove markdown/Hugo formatting elements and return plain text."""
    # Code blocks
    text = re.sub(r'```[\s\S]*?```', '', text)
    text = re.sub(r'`', '', text)

    # Extract and log DOIs
    doi_regex = r'https?://(?:dx\.)?doi\.org/(10\.\d{4,9}/[-._;()/:a-zA-Z0-9]+)'
    dois = re.findall(doi_regex, text)
    if dois:
        msg = f"Found DOIs: {', '.join(dois)}"
        if context:
            msg += f" in {context}"
        logger.info(msg)

    # Paired Hugo shortcodes (with content) — match opening/closing delimiter consistently
    text = re.sub(
        r'\{\{([<%])\s*(\w+)[\s\S]*?\1\}\}[\s\S]*?\{\{\1\s*/\s*\2\s*\1\}\}',
        '', text
    )
    # Hugo shortcodes (self-closing or single)
    text = re.sub(r'\{\{[<%][\s\S]*?[%>]\}\}', '', text)
    # HTML tags
    text = re.sub(r'<[^>]+>', '', text)
    # Markdown images
    text = re.sub(r'!$[^$]*$$[^$]+$', '', text)
    # Markdown link targets: [text](url) -> text
    text = re.sub(r'$([^$]+)$$[^$]+$', r'\1', text)
    # Remove remaining DOI URLs
    text = re.sub(doi_regex, '', text)
    # Table separators
    text = re.sub(r'^\s*\|?[\s\-:|]+\|\s*$', '', text, flags=re.MULTILINE)
    # Horizontal rules
    text = re.sub(r'^\s*([-*_])\s*\1\s*\1[\s\1]*$', '', text, flags=re.MULTILINE)
    # Remove empty lines
    text = re.sub(r'\n\s*\n', '\n', text)
    return text


def extract_existing_qids(metadata: dict) -> set[str]:
    """Extract Wikidata QIDs from front matter metadata."""
    qids: set[str] = set()
    wikidata_field = metadata.get('wikidata')

    if not wikidata_field:
        return qids

    if isinstance(wikidata_field, str):
        wikidata_field = [wikidata_field]

    for item in wikidata_field:
        matches = re.findall(r'(Q\d+)', str(item))
        qids.update(matches)
    return qids


def load_hugo_tags(tags_dir: str | None) -> dict[str, set[str]]:
    """Load Hugo tag taxonomy entries and their associated QIDs."""
    tags: dict[str, set[str]] = {}
    if not tags_dir or not os.path.isdir(tags_dir):
        return tags

    logger.info(f"Loading tags from {tags_dir}...")
    for root, dirs, files in os.walk(tags_dir):
        for file in files:
            if file == "_index.md":
                full_path = os.path.join(root, file)
                try:
                    with open(full_path, 'r', encoding='utf-8') as f:
                        post = frontmatter.load(f)
                        qids = extract_existing_qids(post.metadata)
                        if post.get('title'):
                            name = post['title'].lower()
                            if name not in tags:
                                tags[name] = set()
                            tags[name].update(qids)
                except Exception as e:
                    logger.error(f"Error reading tag file {full_path}: {e}")

        for d in dirs:
            if d.lower() not in tags:
                tags[d.lower()] = set()
    return tags


def _sanitize_sparql_string(s: str) -> str:
    """Escape a string for safe use inside a SPARQL double-quoted string literal."""
    s = s.replace('\\', '\\\\')
    s = s.replace('"', '\\"')
    s = s.replace('\n', '\\n')
    s = s.replace('\r', '\\r')
    s = s.replace('\t', '\\t')
    return s


def _build_lang_set(*langs: str | None) -> set[str]:
    """Build a set of language codes, always including 'de' and 'en'."""
    result = {'de', 'en'}
    for lang in langs:
        if lang:
            result.add(lang)
    return result


class WikidataProvider:
    """Manages Wikidata entity lookup with RDF graph cache and SQLite negative cache."""

    def __init__(self, db_path: str):
        storage = "SQLite3"
        self.db_path = db_path

        # Determine graph store path
        if os.path.splitext(db_path)[1]:
            self.graph_store_path = os.path.abspath(db_path + ".graph")
        else:
            self.graph_store_path = os.path.abspath(db_path)

        # Determine negative cache SQLite path
        if os.path.isdir(db_path):
            self.cache_db_path = os.path.join(db_path, "wikidata_cache.sqlite")
        else:
            self.cache_db_path = db_path

        identifier = rdflib.URIRef("http://projektemacher.org/wikidata_cache")

        try:
            self.graph = rdflib.Graph(store=storage, identifier=identifier)
            self.graph.open(self.graph_store_path, create=True)
            self._safe_commit()
        except Exception as e:
            logger.error(
                "Failed to open %s store at %s. Falling back to in-memory rdflib Graph: %s",
                storage, self.graph_store_path, e,
            )
            self.graph = rdflib.Graph(identifier=identifier)

        self.conn = sqlite3.connect(self.cache_db_path, timeout=60, check_same_thread=False)
        self._init_cache_table()

    def _init_cache_table(self) -> None:
        with self.conn:
            self.conn.execute('''CREATE TABLE IF NOT EXISTS wikidata_cache
                         (query TEXT PRIMARY KEY, results TEXT)''')

    def _safe_commit(self) -> None:
        """Commit the graph store if the backend supports it."""
        try:
            if hasattr(self.graph.store, 'commit'):
                self.graph.commit()
        except Exception as e:
            logger.warning(f"Graph commit failed (non-fatal): {e}")

    def _safe_rollback(self) -> None:
        """Rollback the graph store if the backend supports it."""
        try:
            if hasattr(self.graph.store, 'rollback'):
                self.graph.rollback()
        except Exception as e:
            logger.warning(f"Graph rollback failed (non-fatal): {e}")

    def close(self) -> None:
        """Close all resources. Ensures SQLite connection closes even if graph close fails."""
        try:
            self.graph.close()
        except Exception as e:
            logger.error(f"Error closing graph store: {e}")
        finally:
            try:
                self.conn.close()
            except Exception as e:
                logger.error(f"Error closing SQLite connection: {e}")

    def _get_negative_cache(self, query: str, lang: str):
        """
        Retrieve a negative cache entry.
        Returns:
            _CACHE_MISS  — no cache entry exists at all
            None         — entity was looked up and confirmed not found
            dict/value   — cached result data
        """
        c = self.conn.cursor()
        c.execute("SELECT results FROM wikidata_cache WHERE query=?", (query,))
        row = c.fetchone()
        if row is None:
            return _CACHE_MISS

        data = json.loads(row[0])
        if lang in data:
            return data[lang]
        for fallback in ['en', 'de']:
            if fallback in data:
                return data[fallback]
        if data:
            return next(iter(data.values()))
        return _CACHE_MISS

    def _set_negative_cache(self, query: str, lang: str, result) -> None:
        c = self.conn.cursor()
        c.execute("SELECT results FROM wikidata_cache WHERE query=?", (query,))
        row = c.fetchone()
        data = json.loads(row[0]) if row else {}
        data[lang] = result
        with self.conn:
            self.conn.execute(
                "INSERT OR REPLACE INTO wikidata_cache (query, results) VALUES (?, ?)",
                (query, json.dumps(data))
            )

    def update_graph(
        self,
        qids: list[str],
        languages: list[str] | None = None,
        force_update: bool = False,
    ) -> None:
        """Fetch RDF data from Wikidata SPARQL endpoint and add to graph cache."""
        if languages is None:
            languages = ['de', 'en']

        if not qids:
            return

        WD = rdflib.Namespace("http://www.wikidata.org/entity/")
        if force_update:
            missing_qids = list(qids)
        else:
            missing_qids = [qid for qid in qids if (WD[qid], None, None) not in self.graph]

        if not missing_qids:
            return

        if len(missing_qids) > 1:
            logger.info(f"Fetching RDF data for {len(missing_qids)} new entities...")
        else:
            logger.debug(f"Fetching RDF data for {missing_qids[0]}...")

        total_batches = (len(missing_qids) - 1) // BATCH_SIZE + 1
        for i in range(0, len(missing_qids), BATCH_SIZE):
            batch = missing_qids[i:i + BATCH_SIZE]
            batch_num = i // BATCH_SIZE + 1

            if force_update:
                for qid in batch:
                    self.graph.remove((WD[qid], None, None))

            values = " ".join([f"wd:{qid}" for qid in batch])

            lang_conditions = [f'LANG(?o) = "{lang}"' for lang in languages]
            filter_clause = " || ".join(['LANG(?o) = ""'] + lang_conditions)

            sparql = f"""
            CONSTRUCT {{ ?s ?p ?o }} WHERE {{
              VALUES ?s {{ {values} }}
              ?s ?p ?o
              FILTER ({filter_clause})
            }}
            """

            for attempt in range(MAX_RETRIES):
                try:
                    response = requests.post(
                        SPARQL_ENDPOINT,
                        data={'query': sparql},
                        headers={'Accept': 'text/turtle', 'User-Agent': USER_AGENT}
                    )
                    if response.status_code == 429:
                        wait = (2 ** attempt) + RATE_LIMIT_BASE_WAIT
                        logger.warning(f"Wikidata rate limit hit. Waiting {wait}s...")
                        time.sleep(wait)
                        continue
                    response.raise_for_status()
                    self.graph.parse(data=response.text, format='turtle')
                    self._safe_commit()
                    if len(missing_qids) > 1:
                        logger.info(f"Fetched and committed batch {batch_num}/{total_batches}")
                    time.sleep(INTER_BATCH_SLEEP)
                    break
                except Exception as e:
                    if attempt == MAX_RETRIES - 1:
                        logger.exception(f"Failed to fetch/save batch starting with {batch[0]}: {e}")
                        logger.error(f"Failed SPARQL: {sparql}")
                        self._safe_rollback()
                    else:
                        time.sleep(RETRY_SLEEP)

    def import_from_hdt(self, hdt_path: str, qids: list[str]) -> None:
        """Import entities from an HDT file into the graph cache."""
        if not os.path.exists(hdt_path):
            logger.error(f"HDT file not found: {hdt_path}")
            return

        try:
            from rdflib_hdt import HDTStore
        except ImportError:
            logger.error(
                "rdflib-hdt library not installed. "
                "Please install it to use HDT features: pip install rdflib-hdt"
            )
            return

        logger.info(f"Loading HDT file {hdt_path}...")
        try:
            store = HDTStore(hdt_path)
            hdt_graph = rdflib.Graph(store=store)
        except Exception as e:
            logger.error(f"Failed to load HDT file: {e}")
            return

        total = len(qids)
        logger.info(f"Importing {total} entities from HDT...")

        batch_count = 0
        for i, qid in enumerate(qids):
            uri = rdflib.URIRef(f"http://www.wikidata.org/entity/{qid}")
            try:
                for s, p, o in hdt_graph.triples((uri, None, None)):
                    self.graph.add((s, p, o))

                batch_count += 1
                if batch_count >= HDT_COMMIT_INTERVAL:
                    self._safe_commit()
                    batch_count = 0
                    if (i + 1) % HDT_LOG_INTERVAL == 0:
                        logger.info(f"Processed {i + 1}/{total} entities from HDT")
            except Exception as e:
                logger.error(f"Error reading {qid} from HDT: {e}")

        self._safe_commit()
        hdt_graph.close()
        logger.info("HDT import completed.")

    def _get_description(self, subject: rdflib.URIRef, lang: str) -> str:
        """Retrieve schema:description for a subject, with language fallback."""
        langs = [lang]
        if 'de' not in langs:
            langs.append('de')
        if 'en' not in langs:
            langs.append('en')

        for l in langs:
            for desc in self.graph.objects(
                subject, rdflib.URIRef("http://schema.org/description")
            ):
                if hasattr(desc, 'language') and desc.language == l:
                    return str(desc)
        return ""

    def _search_in_graph(self, query: str, lang: str) -> dict | None:
        """Search the local RDF graph cache for an entity by QID or label."""
        # Direct QID lookup
        if re.match(r'^Q\d+$', query):
            qid = query
            subject = rdflib.URIRef(f"http://www.wikidata.org/entity/{qid}")
            if (subject, None, None) in self.graph:
                label = query
                for l in [lang, 'de', 'en']:
                    labels = list(self.graph.objects(subject, RDFS.label))
                    for lab in labels:
                        if hasattr(lab, 'language') and lab.language == l:
                            label = str(lab)
                            break
                    if label != query:
                        break

                description = self._get_description(subject, lang)
                return {
                    'id': qid,
                    'label': label,
                    'description': description,
                    'score': 1.0,
                    'match_text': query,
                }
            return None

        # Label / altLabel lookup
        search_langs = [lang]
        if 'de' not in search_langs:
            search_langs.append('de')
        if 'en' not in search_langs:
            search_langs.append('en')

        subject = None
        for l in search_langs:
            l_query = rdflib.Literal(query, lang=l)
            subjects = list(self.graph.subjects(RDFS.label, l_query))
            if not subjects:
                subjects = list(self.graph.subjects(SKOS.altLabel, l_query))
            if subjects:
                subject = subjects[0]
                break

        if subject:
            qid = str(subject).split('/')[-1]
            description = self._get_description(subject, lang)
            return {
                'id': qid,
                'label': query,
                'description': description,
                'score': 1.0,
                'match_text': query,
            }
        return None

    def _fetch_candidates_api(self, query: str, lang: str) -> list[dict]:
        """Fetch entity candidates from Wikidata SPARQL EntitySearch API."""
        safe_query = _sanitize_sparql_string(query)
        langs = _build_lang_set(lang)
        lang_str = " ".join([f'"{l}"' for l in langs])

        sparql = f"""
        SELECT ?item ?itemLabel ?itemDescription ?itemAltLabel ?l WHERE {{
          SERVICE wikibase:mwapi {{
              bd:serviceParam wikibase:api "EntitySearch" .
              bd:serviceParam wikibase:endpoint "www.wikidata.org" .
              bd:serviceParam mwapi:search "{safe_query}" .
              bd:serviceParam mwapi:language "{_sanitize_sparql_string(lang)}" .
              ?item wikibase:apiOutputItem mwapi:item .
          }}
          VALUES ?l {{ {lang_str} }}
          OPTIONAL {{ ?item rdfs:label ?itemLabel . FILTER(LANG(?itemLabel) = ?l) }}
          OPTIONAL {{ ?item schema:description ?itemDescription . FILTER(LANG(?itemDescription) = ?l) }}
          OPTIONAL {{ ?item skos:altLabel ?itemAltLabel . FILTER(LANG(?itemAltLabel) = ?l) }}
        }}
        LIMIT {SPARQL_RESULT_LIMIT}
        """

        try:
            response = requests.post(
                SPARQL_ENDPOINT,
                data={'query': sparql},
                headers={'Accept': 'application/json', 'User-Agent': USER_AGENT}
            )
            response.raise_for_status()
            data = response.json()
        except Exception as e:
            logger.error(f"API request failed for query '{query}'")
            logger.error(f"Failed SPARQL: {sparql}")
            raise

        items: dict[str, dict] = {}
        for result in data.get('results', {}).get('bindings', []):
            qid = result['item']['value'].split('/')[-1]
            if qid not in items:
                items[qid] = {'id': qid, 'labels': {}, 'descriptions': {}, 'aliases': {}}

            l_code = result.get('l', {}).get('value')
            if not l_code:
                continue

            if 'itemLabel' in result:
                items[qid]['labels'][l_code] = result['itemLabel']['value']
            if 'itemDescription' in result:
                items[qid]['descriptions'][l_code] = result['itemDescription']['value']
            if 'itemAltLabel' in result:
                if l_code not in items[qid]['aliases']:
                    items[qid]['aliases'][l_code] = []
                items[qid]['aliases'][l_code].append(result['itemAltLabel']['value'])
        return list(items.values())

    def search(
        self,
        query: str,
        lang: str = 'en',
        context: str | None = None,
    ) -> dict | None:
        """
        Search for a Wikidata entity matching the query.
        Checks local RDF cache, negative cache, then Wikidata API.
        """
        # 1. Check local RDF graph
        rdf_match = self._search_in_graph(query, lang)
        if rdf_match:
            logger.debug(f"Found '{query}' in RDF cache: {rdf_match['id']}")
            return rdf_match

        is_qid = bool(re.match(r'^Q\d+$', query))

        # 2. Check negative cache (skip for QID lookups)
        if not is_qid:
            cached = self._get_negative_cache(query, lang)
            if cached is not _CACHE_MISS:
                if cached is None:
                    logger.debug(f"Negative cache hit for '{query}' — confirmed not found")
                    return None
                # cached contains a previous result — could be used
                logger.debug(f"Cache hit for '{query}'")

        # 3. Direct QID fetch
        if is_qid:
            self.update_graph([query], languages=list(_build_lang_set(lang)))
            return self._search_in_graph(query, lang)

        # 4. Search via API across languages
        search_langs = list(_build_lang_set(lang))
        candidates: dict[str, dict] = {}

        for current_lang in search_langs:
            for attempt in range(SEARCH_RETRIES):
                try:
                    logger.debug(
                        f"Searching Wikidata for '{query}' in language '{current_lang}'"
                    )
                    data = self._fetch_candidates_api(query, current_lang)

                    if not data:
                        self._set_negative_cache(query, current_lang, None)

                    if data:
                        logger.debug(
                            f"Wikidata search for '{query}' ({current_lang}) "
                            f"returned {len(data)} results"
                        )
                        for item in data:
                            best_local_score = 0.0
                            best_local_text = ""

                            for l_code, label in item['labels'].items():
                                s = difflib.SequenceMatcher(
                                    None, query.lower(), label.lower()
                                ).ratio()
                                if s > best_local_score:
                                    best_local_score = s
                                    best_local_text = label

                            for l_code, aliases in item['aliases'].items():
                                for alias in aliases:
                                    s = difflib.SequenceMatcher(
                                        None, query.lower(), alias.lower()
                                    ).ratio()
                                    weighted_s = s * 0.8
                                    if weighted_s > best_local_score:
                                        best_local_score = weighted_s
                                        best_local_text = alias

                            score = round(best_local_score, 2)

                            display_label = (
                                item['labels'].get(lang)
                                or item['labels'].get('en')
                                or item['labels'].get('de')
                                or best_local_text
                            )
                            display_desc = (
                                item['descriptions'].get(lang)
                                or item['descriptions'].get('en')
                                or item['descriptions'].get('de')
                                or ""
                            )

                            item['label'] = display_label
                            item['description'] = display_desc

                            item_id = item.get('id')
                            if (
                                item_id not in candidates
                                or score > candidates[item_id].get('score', 0)
                            ):
                                item['score'] = score
                                item['match_text'] = best_local_text
                                candidates[item_id] = item
                    break
                except Exception as e:
                    if "429" in str(e) or "Too Many Requests" in str(e):
                        sleep_time = 2 ** attempt
                        logger.warning(
                            f"Rate limit hit for '{query}'. Retrying in {sleep_time}s..."
                        )
                        time.sleep(sleep_time)
                    else:
                        logger.error(f"Wikidata request failed: {e}")
                        break

            time.sleep(INTER_SEARCH_SLEEP)
            if candidates:
                break

        # 5. Pick best candidate
        best_match = None
        best_score = -1.0

        for item in candidates.values():
            if item['score'] > best_score:
                best_score = item['score']
                best_match = item

        if best_match:
            if best_match.get('description') is None:
                best_match['description'] = ""
            if best_match.get('aliases') is None:
                best_match['aliases'] = []
            logger.debug(
                f"Best match for '{query}': {best_match.get('id')} "
                f"({best_match.get('label')}) score: {best_score}"
            )

            langs_to_save = _build_lang_set(lang)
            self.update_graph([best_match['id']], languages=list(langs_to_save))
            return best_match

        return None


def analyze_directory(
    directory: str,
    tags_dir: str | None = None,
    debug: bool = False,
    target_lang: str | None = None,
    provider: WikidataProvider | None = None,
    hdt_file: str | None = None,
    force_update: bool = False,
) -> tuple[list[dict], dict]:
    """Analyze a Hugo content directory for named entities and Wikidata matches."""
    nlp_models: dict[str, spacy.Language] = {}
    existing_tags = load_hugo_tags(tags_dir)
    missing_stats: dict[str, dict] = {}
    results: list[dict] = []

    # --- Phase 1: Collect all QIDs to pre-populate cache ---
    all_qids_to_fetch: set[str] = set()

    logger.info("Scanning content files for Wikidata QIDs to pre-populate cache...")
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith(".md"):
                full_path = os.path.join(root, file)
                try:
                    with open(full_path, 'r', encoding='utf-8') as f:
                        post = frontmatter.load(f)
                        qids = extract_existing_qids(post.metadata)
                        all_qids_to_fetch.update(qids)

                        post_tags = post.metadata.get('tags')
                        if post_tags:
                            if isinstance(post_tags, str):
                                post_tags = [post_tags]
                            for tag in post_tags:
                                tag_lower = str(tag).lower()
                                if tag_lower in existing_tags:
                                    all_qids_to_fetch.update(existing_tags[tag_lower])
                except Exception as e:
                    logger.debug(f"Could not extract QIDs from {file}: {e}")

    if all_qids_to_fetch and provider:
        logger.info(
            f"Ensuring {len(all_qids_to_fetch)} referenced entities are present in cache..."
        )

        if hdt_file:
            provider.import_from_hdt(hdt_file, list(all_qids_to_fetch))

        fetch_langs = list(_build_lang_set(target_lang))
        provider.update_graph(
            list(all_qids_to_fetch), languages=fetch_langs, force_update=force_update
        )

    # --- Phase 2: Process files ---
    logger.info(f"Analyzing directory: {directory}, for language {target_lang}")

    for root, dirs, files in os.walk(directory):
        # Group files by base name to handle translations together
        file_groups: dict[str, list[str]] = {}
        for file in files:
            if not file.endswith(".md"):
                continue

            parts = file.split('.')
            if len(parts) >= 3 and len(parts[-2]) == 2:
                base_name = ".".join(parts[:-2] + [parts[-1]])
            else:
                base_name = file

            if base_name not in file_groups:
                file_groups[base_name] = []
            file_groups[base_name].append(file)

        for base_name, group_files in file_groups.items():
            group_entities: dict[str, set[str]] = {}  # lang -> set(entity texts)
            group_data: dict = {
                'base_name': base_name,
                'files': [],
                'discrepancies': [],
                'path': os.path.relpath(root, directory),
            }

            for file in group_files:
                full_path = os.path.join(root, file)
                lang = get_lang_from_filename(file)
                if not lang:
                    logger.error(f"Cannot determine language for {file}, skipping.")
                    continue
                if target_lang and lang != target_lang:
                    logger.debug(f"Skipping {file}: lang '{lang}' != target '{target_lang}'")
                    continue

                logger.info(f"Processing file: {full_path}, language {lang}")

                try:
                    with open(full_path, 'r', encoding='utf-8') as f:
                        post = frontmatter.load(f)
                except Exception as e:
                    logger.error(f"Error reading {file}: {e}")
                    continue

                existing_qids = extract_existing_qids(post.metadata)

                # Add QIDs from tags assigned to the post
                post_tags = post.metadata.get('tags')
                if post_tags:
                    if isinstance(post_tags, str):
                        post_tags = [post_tags]
                    for tag in post_tags:
                        tag_lower = str(tag).lower()
                        if tag_lower in existing_tags:
                            existing_qids.update(existing_tags[tag_lower])

                # Load spaCy model if not already loaded
                if lang not in nlp_models:
                    model_name = LANG_MODEL_MAP.get(lang, LANG_MODEL_MAP[DEFAULT_LANG])
                    try:
                        logger.info(f"Loading spaCy model '{model_name}' for language '{lang}'...")
                        nlp_models[lang] = spacy.load(model_name)
                        nlp_models[lang].max_length = NLP_MAX_LENGTH
                    except OSError as e:
                        logger.error(
                            f"Model '{model_name}' not found. "
                            f"Install via: python -m spacy download {model_name}"
                        )
                        logger.error(f"Skipping language '{lang}'.")
                        continue

                nlp = nlp_models.get(lang)
                if nlp is None:
                    continue

                # Process content
                if not post.content.strip():
                    logger.debug(f"Skipping empty file: {full_path}, language {lang}")
                    continue

                cleaned_content = clean_markdown(post.content, context=full_path)
                logger.debug(
                    f"Checking entities for file: {full_path}, language {lang}\n"
                    f"{cleaned_content}"
                )
                doc = nlp(cleaned_content)

                current_entities: set[str] = set()
                file_entities: list[dict] = []
                if doc.ents:
                    seen_entities: set[str] = set()
                    for ent in doc.ents:
                        text = ent.text.strip()
                        if not text:
                            continue

                        if text in seen_entities:
                            continue
                        seen_entities.add(text)

                        entity_record: dict = {
                            'text': text,
                            'label': ent.label_,
                            'tag_match': "",
                            'wikidata': None,
                            'status': 'valid',
                        }

                        if ent.label_ in IGNORED_LABELS:
                            entity_record['status'] = 'ignored_label'
                            file_entities.append(entity_record)
                            continue

                        wd_res = provider.search(text, lang, context=full_path) if provider else None
                        entity_record['wikidata'] = wd_res

                        if not wd_res:
                            if text not in missing_stats:
                                missing_stats[text] = {'count': 0, 'files': set()}
                            missing_stats[text]['count'] += 1
                            rel_path = os.path.relpath(full_path, directory)
                            missing_stats[text]['files'].add(rel_path)

                        if wd_res and wd_res.get('id') in existing_qids:
                            entity_record['status'] = 'ignored_id'
                            current_entities.add(text)
                            file_entities.append(entity_record)
                            continue

                        tag_match = "Yes" if text.lower() in existing_tags else ""
                        entity_record['tag_match'] = tag_match

                        current_entities.add(text)
                        file_entities.append(entity_record)
                else:
                    logger.warning(f"No entities found for file: {full_path}, language {lang}")

                group_data['files'].append({
                    'file': file,
                    'lang': lang,
                    'entities': file_entities,
                    'explicit_qids': list(existing_qids),
                })

                if lang not in group_entities:
                    group_entities[lang] = set()
                group_entities[lang].update(current_entities)

            # Cross-language discrepancy detection
            if debug and len(group_entities) > 1:
                all_langs = sorted(group_entities.keys())
                all_ents: set[str] = set()
                for s in group_entities.values():
                    all_ents.update(s)

                discrepancies: list[tuple[str, list[str]]] = []
                for ent in all_ents:
                    present_in = [l for l in all_langs if ent in group_entities[l]]
                    if len(present_in) < len(all_langs):
                        discrepancies.append((ent, present_in))

                if discrepancies:
                    group_data['discrepancies'] = discrepancies
                    group_data['all_langs'] = all_langs

            results.append(group_data)

    return results, missing_stats


def print_results(results: list[dict], missing_stats: dict, debug: bool = False) -> None:
    """Print analysis results to stdout."""
    if not results:
        print("No results to display.")
        return

    for group in results:
        suggested_qids: dict[str, str] = {}
        for file_data in group['files']:
            for ent in file_data['entities']:
                if ent['status'] == 'valid' and ent.get('wikidata') and not ent['tag_match']:
                    qid = ent['wikidata']['id']
                    if qid not in suggested_qids:
                        label = ent['wikidata'].get('label') or ent['text']
                        desc = ent['wikidata'].get('description')
                        if desc:
                            label = f"{label} - {desc}"
                        suggested_qids[qid] = label

            if not file_data['entities'] and not debug:
                continue

            valid_entities = [e for e in file_data['entities'] if e['status'] == 'valid']
            if not valid_entities and not debug:
                continue

            print(f"\nFile: {file_data['file']} ({file_data['lang']})")
            print(f"{'Entity':<30} {'Label':<10} {'Tag':<5} {'Wikidata':<20}")
            print("-" * 80)

            for ent in file_data['entities']:
                text = ent['text']
                if ent['status'] == 'ignored_label':
                    if debug:
                        print(f"{text[:30]:<30} {ent['label']:<10} {'-':<5} {'IGNORED (Label)'}")
                    continue

                if ent['status'] == 'ignored_id':
                    if debug:
                        wd_res = ent['wikidata']
                        wd_info = (
                            f"{wd_res.get('id')} ({wd_res.get('score', 0.0)})"
                            if wd_res
                            else "Unknown"
                        )
                        print(
                            f"{text[:30]:<30} {ent['label']:<10} {'-':<5} "
                            f"IGNORED (ID: {wd_info})"
                        )
                    continue

                wd_res = ent['wikidata']
                wd_str = ""
                if wd_res:
                    desc = wd_res.get('description') or 'No desc'
                    wd_str = f"{wd_res.get('id')} ({wd_res.get('score', 0.0)}) - {desc}"
                print(f"{text[:30]:<30} {ent['label']:<10} {ent['tag_match']:<5} {wd_str}")

        if debug and group.get('discrepancies'):
            print(
                f"\n[DEBUG] Cross-language discrepancies for group: {group['base_name']}"
            )
            print(f"{'Entity':<30} {'Detected In':<20} {'Missing In':<20}")
            print("-" * 70)
            all_langs = group['all_langs']
            for ent, present in sorted(group['discrepancies']):
                missing = [l for l in all_langs if l not in present]
                print(
                    f"{ent[:30]:<30} {','.join(present):<20} {','.join(missing):<20}"
                )

        if suggested_qids:
            print(
                f"\nSuggested Wikidata additions for {group['path']} / {group['base_name']}:"
            )
            print("wikidata:")
            for qid, label in suggested_qids.items():
                print(f"  - https://www.wikidata.org/wiki/{qid} # {label}")

    if missing_stats:
        print("\n" + "=" * 80)
        print("Entities not found in Wikidata (Sorted by frequency):")
        print(f"{'Count':<10} {'Entity':<30} {'Files'}")
        print("-" * 80)
        sorted_stats = sorted(
            missing_stats.items(), key=lambda item: item[1]['count'], reverse=True
        )
        for entity, data in sorted_stats:
            files_str = ", ".join(sorted(data['files']))
            print(f"{data['count']:<10} {entity:<30} {files_str}")


def save_rdf_graph(output_file: str, provider: WikidataProvider) -> None:
    """Serialize the cached RDF graph to a Turtle file."""
    try:
        provider.graph.serialize(destination=output_file, format='turtle')
        logger.info(f"RDF graph saved to {output_file}")
    except Exception as e:
        logger.error(f"Failed to create RDF file: {e}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Extract Named Entities from Hugo posts and resolve against Wikidata."
    )
    parser.add_argument("directory", help="Path to the Hugo content directory")
    parser.add_argument("-t", "--tags", help="Path to the Hugo tags directory", default=None)
    parser.add_argument(
        "-d", "--debug",
        help="Enable debug mode to show ignored entities",
        action="store_true",
    )
    parser.add_argument(
        "-l", "--lang",
        help="Specific language to process (e.g. 'en', 'de')",
        default=None,
    )
    parser.add_argument(
        "--rdf",
        help="Output path for RDF file containing Wikidata triples",
        default="entities.ttl",
    )
    parser.add_argument(
        "--db",
        help="Path to SQLite database for caching",
        default="wikidata_data.db",
    )
    parser.add_argument(
        "--hdt",
        help="Path to HDT file for local cache population",
        default=None,
    )
    parser.add_argument(
        "--force",
        help="Force update of cache even if entities exist",
        action="store_true",
    )
    args = parser.parse_args()

    log_level = logging.DEBUG if args.debug else logging.INFO
    logging.basicConfig(
        level=logging.WARNING, format='%(asctime)s - %(levelname)s - %(message)s'
    )
    logger.setLevel(log_level)

    if not os.path.isdir(args.directory):
        logger.error(f"Directory '{args.directory}' not found.")
        sys.exit(1)

    provider = None
    try:
        provider = WikidataProvider(args.db)
        results, missing_stats = analyze_directory(
            args.directory,
            args.tags,
            args.debug,
            args.lang,
            provider=provider,
            hdt_file=args.hdt,
            force_update=args.force,
        )
        print_results(results, missing_stats, args.debug)
        save_rdf_graph(args.rdf, provider=provider)
    except KeyboardInterrupt:
        logger.warning("Process interrupted by user. Closing resources...")
    except Exception as e:
        logger.exception(f"An error occurred: {e}")
        sys.exit(1)
    finally:
        if provider:
            provider.close()