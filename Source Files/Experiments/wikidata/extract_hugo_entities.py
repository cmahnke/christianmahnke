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
from rdflib import util
from rdflib.namespace import RDFS, SKOS

# Patch rdflib to handle Wikidata's negative years/invalid ISO dates by treating them as strings
rdflib.term.bind(rdflib.XSD.dateTime, str, constructor=str)
rdflib.term.bind(rdflib.XSD.date, str, constructor=str)

# Mapping of language codes to spaCy model names.
# Ensure these models are downloaded via `python -m spacy download <model_name>`
LANG_MODEL_MAP = {
    'en': 'en_core_web_trf',
    'de': 'de_core_news_lg'
}

DEFAULT_LANG = 'de'

IGNORED_LABELS = {'ORDINAL', 'DATE', 'TIME', 'QUANTITY', 'CARDINAL', 'PERCENT'}

# Set User Agent to comply with policy
USER_AGENT = 'Projektemacher.org Entity Extractor/1.0'

logger = logging.getLogger(__name__)

def get_lang_from_filename(filename):
    parts = filename.split('.')
    if len(parts) >= 3:
        return parts[-2]
    return DEFAULT_LANG

def clean_markdown(text, context=None):
    #Code
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

    #Paired Hugo shortcodes (with content)
    text = re.sub(r'\{\{([<%])\s*(\w+)[\s\S]*?[%>]\}\}[\s\S]*?\{\{\1\s*/\s*\2\s*[%>]\}\}', '', text)
    #Hugo shortcodes (self-closing or single)
    text = re.sub(r'\{\{[<%][\s\S]*?[%>]\}\}', '', text)
    #HTML tags
    text = re.sub(r'<[^>]+>', '', text)
    #Markdown images
    text = re.sub(r'!\[[^\]]*\]\([^\)]+\)', '', text)
    #amrkdown link targets text -> text
    text = re.sub(r'\[([^\]]+)\]\([^\)]+\)', r'\1', text)
    # Remove remaining DOI URLs
    text = re.sub(doi_regex, '', text)
    # Table separators
    text = re.sub(r'^\s*\|?[\s\-:|]+\|\s*$', '', text, flags=re.MULTILINE)
    # Horizontal rules
    text = re.sub(r'^\s*([-*_])\s*\1\s*\1[\s\1]*$', '', text, flags=re.MULTILINE)
    # Remove empty lines
    text = re.sub(r'\n\s*\n', '\n', text)
    return text

def extract_existing_qids(metadata):
    qids = set()
    wikidata_field = metadata.get('wikidata')
    
    if not wikidata_field:
        return qids
        
    if isinstance(wikidata_field, str):
        wikidata_field = [wikidata_field]
        
    for item in wikidata_field:
        matches = re.findall(r'(Q\d+)', str(item))
        qids.update(matches)
    return qids

def load_hugo_tags(tags_dir):
    tags = {}
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

class WikidataProvider:
    def __init__(self, db_path):
        self.db_path = db_path
        store_uri = f"sqlite:///{os.path.abspath(db_path)}"
        identifier = rdflib.URIRef("http://projektemacher.org/wikidata_cache")
        self.graph = rdflib.Graph(store="SQLAlchemy", identifier=identifier)
        self.graph.open(store_uri, create=True)
        self.graph.commit()
        
        self.conn = sqlite3.connect(db_path, timeout=60, check_same_thread=False)
        self._init_cache_table()

    def _init_cache_table(self):
        with self.conn:
            self.conn.execute('''CREATE TABLE IF NOT EXISTS wikidata_cache
                         (query TEXT PRIMARY KEY, results TEXT)''')

    def close(self):
        self.graph.close()
        self.conn.close()

    def _get_negative_cache(self, query, lang):
        c = self.conn.cursor()
        c.execute("SELECT results FROM wikidata_cache WHERE query=?", (query,))
        row = c.fetchone()
        if row:
            data = json.loads(row[0])
            if lang in data:
                return data[lang]
            for fallback in ['en', 'de']:
                if fallback in data:
                    return data[fallback]
            if data:
                return next(iter(data.values()))
        return False

    def _set_negative_cache(self, query, lang, result):
        c = self.conn.cursor()
        c.execute("SELECT results FROM wikidata_cache WHERE query=?", (query,))
        row = c.fetchone()
        data = json.loads(row[0]) if row else {}
        data[lang] = result
        with self.conn:
            self.conn.execute("INSERT OR REPLACE INTO wikidata_cache (query, results) VALUES (?, ?)",
                      (query, json.dumps(data)))

    def update_graph(self, qids, languages=None, force_update=False):
        if languages is None:
            languages = ['de', 'en']
        
        if not qids:
            return

        WD = rdflib.Namespace("http://www.wikidata.org/entity/")
        missing_qids = []
        if force_update:
            missing_qids = list(qids)
        else:
            for qid in qids:
                if not (WD[qid], None, None) in self.graph: 
                    missing_qids.append(qid)
        
        if not missing_qids:
            return

        if len(missing_qids) > 1:
            logger.info(f"Fetching RDF data for {len(missing_qids)} new entities...")
        else:
            logger.debug(f"Fetching RDF data for {missing_qids[0]}...")
        
        batch_size = 50
        for i in range(0, len(missing_qids), batch_size):
            batch = missing_qids[i:i+batch_size]
            
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
            
            try:
                response = requests.post(
                    "https://query.wikidata.org/sparql",
                    data={'query': sparql},
                    headers={'Accept': 'text/turtle', 'User-Agent': USER_AGENT}
                )
                response.raise_for_status()
                self.graph.parse(data=response.text, format='turtle')
                self.graph.commit()
                if len(missing_qids) > 1:
                    logger.info(f"Fetched and committed batch {i//batch_size + 1}/{(len(missing_qids)-1)//batch_size + 1}")
                time.sleep(1)
            except Exception:
                logger.exception(f"Failed to fetch/save batch starting with {batch[0]}")
                logger.error(f"Failed SPARQL: {sparql}")
                self.graph.rollback()

    def import_from_hdt(self, hdt_path, qids):
        if not os.path.exists(hdt_path):
            logger.error(f"HDT file not found: {hdt_path}")
            return

        try:
            from rdflib_hdt import HDTStore
        except ImportError:
            logger.error("rdflib-hdt library not installed. Please install it to use HDT features: pip install rdflib-hdt")
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
                if batch_count >= 100:
                    self.graph.commit()
                    batch_count = 0
                    if (i + 1) % 1000 == 0:
                        logger.info(f"Processed {i + 1}/{total} entities from HDT")
            except Exception as e:
                logger.error(f"Error reading {qid} from HDT: {e}")
        
        self.graph.commit()
        hdt_graph.close()
        logger.info("HDT import completed.")

    def _get_description(self, subject, lang):
        langs = [lang]
        if 'de' not in langs: langs.append('de')
        if 'en' not in langs: langs.append('en')
        
        for l in langs:
            for desc in self.graph.objects(subject, rdflib.URIRef("http://schema.org/description")):
                if desc.language == l:
                    return str(desc)
        return ""

    def _search_in_graph(self, query, lang):
        if re.match(r'^Q\d+$', query):
            qid = query
            subject = rdflib.URIRef(f"http://www.wikidata.org/entity/{qid}")
            if (subject, None, None) in self.graph:
                label = query
                for l in [lang, 'de', 'en']:
                    labels = list(self.graph.objects(subject, RDFS.label))
                    for lab in labels:
                        if lab.language == l:
                            label = str(lab)
                            break
                    if label != query: break
                
                description = self._get_description(subject, lang)
                return {'id': qid, 'label': label, 'description': description, 'score': 1.0, 'match_text': query}
            return None

        search_langs = [lang]
        if 'de' not in search_langs: search_langs.append('de')
        if 'en' not in search_langs: search_langs.append('en')
        
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
            return {'id': qid, 'label': query, 'description': description, 'score': 1.0, 'match_text': query}
        return None

    def _fetch_candidates_api(self, query, lang):
        safe_query = re.sub(r'[\r\n"\'\\|]', '', query)
        langs = set([lang, 'de', 'en']) if lang else {'de', 'en'}
        lang_str = " ".join([f'"{l}"' for l in langs])
        
        sparql = f"""
        SELECT ?item ?itemLabel ?itemDescription ?itemAltLabel ?l WHERE {{
          SERVICE wikibase:mwapi {{
              bd:serviceParam wikibase:api "EntitySearch" .
              bd:serviceParam wikibase:endpoint "www.wikidata.org" .
              bd:serviceParam mwapi:search "{safe_query}" .
              bd:serviceParam mwapi:language "{lang}" .
              ?item wikibase:apiOutputItem mwapi:item .
          }}
          VALUES ?l {{ {lang_str} }}
          OPTIONAL {{ ?item rdfs:label ?itemLabel . FILTER(LANG(?itemLabel) = ?l) }}
          OPTIONAL {{ ?item schema:description ?itemDescription . FILTER(LANG(?itemDescription) = ?l) }}
          OPTIONAL {{ ?item skos:altLabel ?itemAltLabel . FILTER(LANG(?itemAltLabel) = ?l) }}
        }}
        LIMIT 50
        """
        
        try:
            response = requests.post(
                "https://query.wikidata.org/sparql",
                data={'query': sparql},
                headers={'Accept': 'application/json', 'User-Agent': USER_AGENT}
            )
            response.raise_for_status()
            data = response.json()
        except Exception as e:
            logger.error(f"API request failed for query '{query}'")
            logger.error(f"Failed SPARQL: {sparql}")
            raise e
        
        items = {}
        for result in data.get('results', {}).get('bindings', []):
            qid = result['item']['value'].split('/')[-1]
            if qid not in items:
                items[qid] = {'id': qid, 'labels': {}, 'descriptions': {}, 'aliases': {}}
            
            l_code = result.get('l', {}).get('value')
            if not l_code: continue

            if 'itemLabel' in result:
                items[qid]['labels'][l_code] = result['itemLabel']['value']
            if 'itemDescription' in result:
                items[qid]['descriptions'][l_code] = result['itemDescription']['value']
            if 'itemAltLabel' in result:
                if l_code not in items[qid]['aliases']: items[qid]['aliases'][l_code] = []
                items[qid]['aliases'][l_code].append(result['itemAltLabel']['value'])
        return list(items.values())

    def search(self, query, lang='en', context=None):
        rdf_match = self._search_in_graph(query, lang)
        if rdf_match:
            logger.debug(f"Found '{query}' in RDF cache: {rdf_match['id']}")
            return rdf_match

        is_qid = bool(re.match(r'^Q\d+$', query))
        
        if not is_qid:
            cached = self._get_negative_cache(query, lang)
            if cached is None:
                return None

        if is_qid:
            self.update_graph([query], languages=[lang, 'de', 'en'])
            return self._search_in_graph(query, lang)
        
        search_langs = set([lang, 'de', 'en']) if lang else {'de', 'en'}
        candidates = {}

        for current_lang in search_langs:
            max_retries = 3
            for attempt in range(max_retries):
                try:
                    logger.debug(f"Searching Wikidata for '{query}' in language '{current_lang}'")
                    data = self._fetch_candidates_api(query, current_lang)
                    
                    if not data:
                        self._set_negative_cache(query, current_lang, None)
                    
                    if data:
                        logger.debug(f"Wikidata search for '{query}' ({current_lang}) returned {len(data)} results")
                        for item in data:
                            best_local_score = 0.0
                            best_local_text = ""
                            
                            for l_code, label in item['labels'].items():
                                s = difflib.SequenceMatcher(None, query.lower(), label.lower()).ratio()
                                if s > best_local_score:
                                    best_local_score = s
                                    best_local_text = label
                            
                            for l_code, aliases in item['aliases'].items():
                                for alias in aliases:
                                    s = difflib.SequenceMatcher(None, query.lower(), alias.lower()).ratio()
                                    weighted_s = s * 0.8
                                    if weighted_s > best_local_score:
                                        best_local_score = weighted_s
                                        best_local_text = alias

                            score = round(best_local_score, 2)
                            
                            display_label = item['labels'].get(lang) or item['labels'].get('en') or item['labels'].get('de') or best_local_text
                            display_desc = item['descriptions'].get(lang) or item['descriptions'].get('en') or item['descriptions'].get('de') or ""
                            
                            item['label'] = display_label
                            item['description'] = display_desc
                            
                            item_id = item.get('id')
                            if item_id not in candidates or score > candidates[item_id].get('score', 0):
                                item['score'] = score
                                item['match_text'] = best_local_text
                                candidates[item_id] = item
                    break
                except Exception as e:
                    if "429" in str(e) or "Too Many Requests" in str(e):
                        sleep_time = 2 ** attempt
                        logger.warning(f"Rate limit hit for '{query}'. Retrying in {sleep_time}s...")
                        time.sleep(sleep_time)
                    else:
                        logger.error(f"Wikidata request failed: {e}")
                        break
            time.sleep(0.2)
            if candidates:
                break

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
            logger.debug(f"Best match for '{query}': {best_match.get('id')} ({best_match.get('label')}) score: {best_score}")
            
            langs_to_save = {'de', 'en'}
            if lang:
                langs_to_save.add(lang)
            self.update_graph([best_match['id']], languages=list(langs_to_save))
            return best_match
        
        return None

def analyze_directory(directory, tags_dir=None, debug=False, target_lang=None, provider=None, hdt_file=None, force_update=False):
    nlp_models = {}
    existing_tags = load_hugo_tags(tags_dir)
    missing_stats = {}
    results = []

    # Collect all QIDs to ensure they are in the cache
    all_qids_to_fetch = set()

    logger.info("Scanning content files for Wikidata QIDs to pre-populate cache...")
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith(".md"):
                full_path = os.path.join(root, file)
                try:
                    with open(full_path, 'r', encoding='utf-8') as f:
                        post = frontmatter.load(f)
                        # Direct Wikidata QIDs
                        qids = extract_existing_qids(post.metadata)
                        all_qids_to_fetch.update(qids)
                        
                        # QIDs via Tags
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

    if all_qids_to_fetch:
        logger.info(f"Ensuring {len(all_qids_to_fetch)} referenced entities are present in cache...")
        
        if hdt_file:
            provider.import_from_hdt(hdt_file, list(all_qids_to_fetch))
            
        fetch_langs = list({target_lang, 'de', 'en'} - {None})
        provider.update_graph(list(all_qids_to_fetch), languages=fetch_langs, force_update=force_update)

    logger.info(f"Analyzing directory: {directory}, for language {target_lang}")

    for root, post_dir, files in os.walk(directory):
        # Group files by base name to handle translations together
        file_groups = {}
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
            group_entities = {} # lang -> set(entities)
            group_data = {'base_name': base_name, 'files': [], 'discrepancies': [], 'path': os.path.relpath(root, directory)}

            for file in group_files:
                full_path = os.path.join(root, file)
                lang = get_lang_from_filename(file)
                if not lang:
                    raise Exception("Can't get languege")
                if target_lang and lang != target_lang:
                    logger.info(f"Skipping {file}: lang '{lang}' != target '{target_lang}'")
                    continue

                logger.info(f"Processing file: {full_path}, language {lang}")

                try:
                    # Load file content and metadata
                    with open(full_path, 'r', encoding='utf-8') as f:
                        post = frontmatter.load(f)
                except Exception as e:
                    logger.error(f"Error reading {file}: {e}")
                    raise e

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



                # Load model if not already loaded
                if lang not in nlp_models:
                    logger.info(f"Trying to get a language model not defined '{lang}'...")
                    model_name = LANG_MODEL_MAP.get(lang, LANG_MODEL_MAP[DEFAULT_LANG])
                    try:
                        logger.info(f"Loading model '{model_name}' for language '{lang}'...")
                        nlp_models[lang] = spacy.load(model_name)
                        # Increase limit for large posts
                        nlp_models[lang].max_length = 2000000
                    except OSError as e:
                        logger.error(f"Model '{model_name}' not found. Skipping language '{lang}'.")
                        raise e

                nlp = nlp_models.get(lang)

                # Process content
                if not post.content.strip():
                    logger.debug(f"Skipping empty file: {full_path}, language {lang}")
                    continue

                cleaned_content = clean_markdown(post.content, context=full_path)
                logger.debug(f"Checking entities for file: {full_path}, language {lang}\n{cleaned_content}")
                doc = nlp(cleaned_content)

                current_entities = set()
                file_entities = []
                if doc.ents:
                    seen_entities = set()
                    for ent in doc.ents:
                        text = ent.text.strip()
                        if not text:
                            continue

                        if text in seen_entities:
                            continue
                        seen_entities.add(text)
                        
                        entity_record = {
                            'text': text,
                            'label': ent.label_,
                            'tag_match': "",
                            'wikidata': None,
                            'status': 'valid'
                        }

                        if ent.label_ in IGNORED_LABELS:
                            entity_record['status'] = 'ignored_label'
                            file_entities.append(entity_record)
                            continue

                        wd_res = provider.search(text, lang, context=full_path)
                        entity_record['wikidata'] = wd_res

                        if not wd_res:
                            if text not in missing_stats:
                                missing_stats[text] = {'count': 0, 'files': set()}
                            missing_stats[text]['count'] += 1
                            rel_path = os.path.relpath(full_path, directory)
                            missing_stats[text]['files'].add(rel_path)

                        if wd_res and wd_res.get('id') in existing_qids:
                            entity_record['status'] = 'ignored_id'
                            # Track even if ignored for output, for cross-lang comparison
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
                    'post': post_dir,
                    'entities': file_entities,
                    'explicit_qids': list(existing_qids)
                })

                if lang not in group_entities:
                    group_entities[lang] = set()
                group_entities[lang].update(current_entities)

            # End of group processing - Debug comparison
            if debug and len(group_entities) > 1:
                all_langs = sorted(group_entities.keys())
                all_ents = set()
                for s in group_entities.values():
                    all_ents.update(s)
                
                discrepancies = []
                for ent in all_ents:
                    present_in = [l for l in all_langs if ent in group_entities[l]]
                    if len(present_in) < len(all_langs):
                        discrepancies.append((ent, present_in))
                
                if discrepancies:
                    group_data['discrepancies'] = discrepancies
                    group_data['all_langs'] = all_langs
            
            results.append(group_data)

    return results, missing_stats

def print_results(results, missing_stats, debug=False):
    if not results:
        print("No results to display.")

    for group in results:
        suggested_qids = {}
        for file_data in group['files']:
            for ent in file_data['entities']:
                if ent['status'] == 'valid' and ent.get('wikidata') and not ent['tag_match']:
                    qid = ent['wikidata']['id']
                    if qid not in suggested_qids:
                        label = ent['wikidata'].get('label')
                        if not label:
                            label = ent['text']
                        desc = ent['wikidata'].get('description')
                        if desc:
                            label = f"{label} - {desc}"
                        suggested_qids[qid] = label

            if not file_data['entities'] and not debug:
                continue
            
            # Only print header if there are valid entities or we are debugging
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
                        wd_info = f"{wd_res.get('id')} ({wd_res.get('score', 0.0)})" if wd_res else "Unknown"
                        print(f"{text[:30]:<30} {ent['label']:<10} {'-':<5} IGNORED (ID: {wd_info})")
                    continue
                
                wd_res = ent['wikidata']
                wd_str = ""
                if wd_res:
                    desc = wd_res.get('description') or 'No desc'
                    wd_str = f"{wd_res.get('id')} ({wd_res.get('score', 0.0)}) - {desc}"
                print(f"{text[:30]:<30} {ent['label']:<10} {ent['tag_match']:<5} {wd_str}")

        if debug and group['discrepancies']:
            print(f"\n[DEBUG] Cross-language discrepancies for group: {group['base_name']}")
            print(f"{'Entity':<30} {'Detected In':<20} {'Missing In':<20}")
            print("-" * 70)
            all_langs = group['all_langs']
            for ent, present in sorted(group['discrepancies']):
                missing = [l for l in all_langs if l not in present]
                print(f"{ent[:30]:<30} {','.join(present):<20} {','.join(missing):<20}")

        if suggested_qids:
            print(f"\nSuggested Wikidata additions for {group['path']} / {group['base_name']}:")
            print("wikidata:")
            for qid, label in suggested_qids.items():
                print(f"  - https://www.wikidata.org/wiki/{qid} # {label}")

    if missing_stats:
        print("\n" + "="*80)
        print("Entities not found in Wikidata (Sorted by frequency):")
        print(f"{'Count':<10} {'Entity':<30} {'Files'}")
        print("-" * 80)
        sorted_stats = sorted(missing_stats.items(), key=lambda item: item[1]['count'], reverse=True)
        for entity, data in sorted_stats:
            files_str = ", ".join(sorted(data['files']))
            print(f"{data['count']:<10} {entity:<30} {files_str}")

def save_rdf_graph(output_file, provider):
    try:
        provider.graph.serialize(destination=output_file, format='turtle')
    except Exception as e:
        logger.error(f"Failed to create RDF file: {e}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Extract Named Entities from Hugo posts.")
    parser.add_argument("directory", help="Path to the Hugo content directory")
    parser.add_argument("--tags", help="Path to the Hugo tags directory", default=None)
    parser.add_argument("-d", "--debug", help="Enable debug mode to show ignored entities", action="store_true")
    parser.add_argument("-l", "--lang", help="Specific language to process (e.g. 'en', 'de')", default=None)
    parser.add_argument("--rdf", help="Output path for RDF file containing Wikidata triples", default="entities.ttl")
    parser.add_argument("--db", help="Path to SQLite database", default="wikidata_data.db")
    parser.add_argument("--hdt", help="Path to HDT file for local cache population", default=None)
    parser.add_argument("--force", help="Force update of cache even if entities exist", action="store_true")
    args = parser.parse_args()

    log_level = logging.DEBUG if args.debug else logging.INFO
    logging.basicConfig(level=logging.WARNING, format='%(asctime)s - %(levelname)s - %(message)s')
    logger.setLevel(log_level)

    if os.path.isdir(args.directory):
        provider = None
        try:
            provider = WikidataProvider(args.db)
            results, missing_stats = analyze_directory(args.directory, args.tags, args.debug, args.lang, provider=provider, hdt_file=args.hdt, force_update=args.force)
            print_results(results, missing_stats, args.debug)
            
            save_rdf_graph(args.rdf, provider=provider)
        except Exception as e:
            logger.exception(f"An error occurred: {e}")
            sys.exit(1)
        except KeyboardInterrupt:
            logger.warning("Process interrupted by user. Closing graph...")
        finally:
            if provider: provider.close()
    else:
        logger.error(f"Directory '{args.directory}' not found.")