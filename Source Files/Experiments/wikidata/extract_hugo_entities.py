import argparse
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
import subprocess
import tempfile
import rdflib
import rdflib.term
from wikibaseintegrator import wbi_helpers
from wikibaseintegrator.wbi_config import config as wbi_config

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
DB_PATH = "wikidata_cache.db"

# Set User Agent to comply with policy
wbi_config['USER_AGENT'] = 'HugoEntityExtractor/1.0'

logger = logging.getLogger(__name__)

def get_lang_from_filename(filename):
    parts = filename.split('.')
    if len(parts) >= 3:
        return parts[-2]
    return DEFAULT_LANG

def clean_markdown(text):
    #Code
    text = re.sub(r'```[\s\S]*?```', '', text)
    text = re.sub(r'`', '', text)
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
        match = re.search(r'(Q\d+)', str(item))
        if match:
            qids.add(match.group(1))
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

def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS wikidata_cache
                 (query TEXT, lang TEXT, result TEXT, PRIMARY KEY (query, lang))''')
    conn.commit()
    return conn

def get_from_cache(conn, query, lang):
    c = conn.cursor()
    c.execute("SELECT result FROM wikidata_cache WHERE query=? AND lang=?", (query, lang))
    row = c.fetchone()
    if row:
        return json.loads(row[0])
    return False

def save_to_cache(conn, query, lang, result):
    c = conn.cursor()
    c.execute("INSERT OR REPLACE INTO wikidata_cache (query, lang, result) VALUES (?, ?, ?)",
              (query, lang, json.dumps(result)))
    conn.commit()

def search_wikidata(conn, query, lang='en'):
    cached = get_from_cache(conn, query, lang)
    if cached is not False:
        return cached

    max_retries = 3
    for attempt in range(max_retries):
        try:
            # search_entities returns a list of dictionaries
            data = wbi_helpers.search_entities(search_string=query, dict_result=True) #, language=lang
            
            # Handle case where data is the full response dict instead of just the search results list
            if isinstance(data, dict):
                data = data.get('search', [])

            best_match = None
            best_score = -1.0

            if data:
                logger.debug(f"Wikidata search for '{query}' ({lang}) returned {len(data)} results")
                for item in data:
                    if not isinstance(item, dict):
                        logger.warning(f"Wikidata item is not a dict: {type(item)} - {item}")
                        continue

                    match_entry = item.get('match')
                    if isinstance(match_entry, dict):
                        match_text = match_entry.get('text', item.get('label', ''))
                    else:
                        match_text = item.get('label', '')

                    score = difflib.SequenceMatcher(None, query.lower(), match_text.lower()).ratio()
                    item['score'] = round(score, 2)
                    logger.debug(f"  - {item.get('id')} ({item.get('label')}): {score} (match: '{match_text}')")
                    
                    if score > best_score:
                        best_score = score
                        best_match = item
                
                save_to_cache(conn, query, lang, best_match)
                time.sleep(0.5)
                return best_match
            else:
                logger.debug(f"Wikidata search for '{query}' ({lang}) returned no results")
            break
        except Exception as e:
            if "429" in str(e) or "Too Many Requests" in str(e):
                sleep_time = 2 ** attempt
                logger.warning(f"Rate limit hit for '{query}'. Retrying in {sleep_time}s...")
                time.sleep(sleep_time)
            else:
                logger.error(f"Wikidata request failed: {e}")
                break
    return None

def analyze_directory(directory, tags_dir=None, debug=False, target_lang=None):
    nlp_models = {}
    conn = init_db()
    existing_tags = load_hugo_tags(tags_dir)
    missing_stats = {}
    results = []

    logger.info(f"Analyzing directory: {directory}, for language {target_lang}")

    for root, _, files in os.walk(directory):
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
            group_data = {'base_name': base_name, 'files': [], 'discrepancies': []}

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
                        if lang not in nlp_models: # Check again to avoid reload attempts
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

                cleaned_content = clean_markdown(post.content)
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

                        wd_res = search_wikidata(conn, text, lang)
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

    conn.close()
    return results, missing_stats

def print_results(results, missing_stats, debug=False):
    if not results:
        print("No results to display.")

    for group in results:
        for file_data in group['files']:
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

    if missing_stats:
        print("\n" + "="*80)
        print("Entities not found in Wikidata (Sorted by frequency):")
        print(f"{'Count':<10} {'Entity':<30} {'Files'}")
        print("-" * 80)
        sorted_stats = sorted(missing_stats.items(), key=lambda item: item[1]['count'], reverse=True)
        for entity, data in sorted_stats:
            files_str = ", ".join(sorted(data['files']))
            print(f"{data['count']:<10} {entity:<30} {files_str}")

def collect_qids(results):
    qids = set()
    for group in results:
        for file_data in group['files']:
            if 'explicit_qids' in file_data:
                qids.update(file_data['explicit_qids'])
            for ent in file_data['entities']:
                if ent.get('wikidata') and ent['wikidata'].get('id'):
                    qids.add(ent['wikidata']['id'])
    return list(qids)

def fetch_and_save_rdf(qids, output_file):
    if not qids:
        logger.warning("No QIDs to fetch for RDF.")
        return

    logger.info(f"Fetching RDF data for {len(qids)} entities...")
    
    graph = rdflib.Graph()
    try:
        # Batch QIDs
        batch_size = 50
        for i in range(0, len(qids), batch_size):
            batch = qids[i:i+batch_size]
            values = " ".join([f"wd:{qid}" for qid in batch])
            
            sparql = f"""
            CONSTRUCT {{ ?s ?p ?o }} WHERE {{
              VALUES ?s {{ {values} }}
              ?s ?p ?o
            }}
            """
            
            try:
                response = requests.post(
                    "https://query.wikidata.org/sparql",
                    data={'query': sparql},
                    headers={'Accept': 'application/n-triples', 'User-Agent': wbi_config['USER_AGENT']}
                )
                response.raise_for_status()
                graph.parse(data=response.text, format='nt')
                logger.info(f"Fetched batch {i//batch_size + 1}/{(len(qids)-1)//batch_size + 1}")
                time.sleep(1) # Rate limiting
            except Exception as e:
                logger.error(f"Failed to fetch batch starting with {batch[0]}: {e}")
 
        graph.serialize(destination=output_file)
    except Exception as e:
        logger.error(f"Failed to create RDF file: {e}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Extract Named Entities from Hugo posts.")
    parser.add_argument("directory", help="Path to the Hugo content directory")
    parser.add_argument("--tags", help="Path to the Hugo tags directory", default=None)
    parser.add_argument("-d", "--debug", help="Enable debug mode to show ignored entities", action="store_true")
    parser.add_argument("-l", "--lang", help="Specific language to process (e.g. 'en', 'de')", default=None)
    parser.add_argument("--rdf", help="Output path for RDF file containing Wikidata triples", default=None)
    args = parser.parse_args()

    log_level = logging.DEBUG if args.debug else logging.INFO
    logging.basicConfig(level=logging.WARNING, format='%(asctime)s - %(levelname)s - %(message)s')
    logger.setLevel(log_level)

    if os.path.isdir(args.directory):
        results, missing_stats = analyze_directory(args.directory, args.tags, args.debug, args.lang)
        print_results(results, missing_stats, args.debug)
        
        if args.rdf:
            qids = collect_qids(results)
            fetch_and_save_rdf(qids, args.rdf)
    else:
        logger.error(f"Directory '{args.directory}' not found.")