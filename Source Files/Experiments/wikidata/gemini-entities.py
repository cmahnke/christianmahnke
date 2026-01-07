import argparse
import sys
import os
import frontmatter
import logging
import re
import time
import requests
import json
import subprocess

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

USER_AGENT = 'Projektemacher.org Gemini Entity Extractor/1.0'

def ensure_genai_installed():
    try:
        from google import genai
        return genai
    except ImportError:
        logger.info("google-genai library not found. Installing...")
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", "google-genai"])
            from google import genai
            return genai
        except Exception as e:
            logger.error(f"Failed to install google-genai: {e}")
            sys.exit(1)

genai = ensure_genai_installed()

DEFAULT_LANG = 'de'

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

def call_wikidata_api(url, params=None):
    headers = {'User-Agent': USER_AGENT}
    for attempt in range(5):
        try:
            response = requests.get(url, params=params, headers=headers)
            if response.status_code == 429:
                wait = (2 ** attempt) + 1
                logger.warning(f"Wikidata rate limit. Waiting {wait}s...")
                time.sleep(wait)
                continue
            response.raise_for_status()
            return response.json()
        except Exception as e:
            if attempt == 4:
                logger.error(f"Wikidata request failed: {e}")
                return None
            time.sleep(1)
    return None

def get_wikidata_entities_batch(qids, lang='de'):
    results = {}
    valid_qids = [q for q in qids if re.match(r'^Q\d+$', q)]
    if not valid_qids:
        return results
        
    chunk_size = 50
    for i in range(0, len(valid_qids), chunk_size):
        chunk = valid_qids[i:i+chunk_size]
        ids_str = "|".join(chunk)
        
        langs = [lang]
        if 'en' not in langs: langs.append('en')
        if 'de' not in langs: langs.append('de')
        lang_str = "|".join(langs)
        
        url = f"https://www.wikidata.org/w/api.php?action=wbgetentities&ids={ids_str}&languages={lang_str}&format=json"
        data = call_wikidata_api(url)
        
        if data and 'entities' in data:
            for qid, entity in data['entities'].items():
                if 'missing' in entity:
                    continue
                
                label = entity.get('labels', {}).get(lang, {}).get('value')
                if not label:
                    # Fallback
                    for l in langs:
                        if l in entity.get('labels', {}):
                            label = entity['labels'][l]['value']
                            break
                
                desc = entity.get('descriptions', {}).get(lang, {}).get('value')
                if not desc:
                    for l in langs:
                        if l in entity.get('descriptions', {}):
                            desc = entity['descriptions'][l]['value']
                            break
                            
                results[qid] = {'label': label, 'description': desc}
    return results

def search_correct_qid(name, lang='de'):
    """Sucht die korrekte QID basierend auf dem Namen (Korrektur-Schritt)."""
    url = "https://www.wikidata.org/w/api.php"
    params = {
        "action": "wbsearchentities",
        "search": name,
        "language": lang,
        "format": "json"
    }
    res = call_wikidata_api(url, params=params)
    if res:
        if res.get('search'):
            # Gibt die erste (relevanteste) ID zurück
            return res['search'][0]['id'], res['search'][0]['label']
    return None, None

def list_available_models(client):
    try:
        logger.info("Listing available models:")
        for m in client.models.list():
            logger.info(f" - {m.name}")
    except Exception as e:
        logger.error(f"Failed to list models: {e}")

def process_batch(client, model_name, batch_items, verify=False):
    if not batch_items:
        return

    prompt = f"""
    Extract all important named entities (persons, locations, organizations, works, concepts) from the following texts.
    Try to find the matching Wikidata QID for each entity.
    Return the result ONLY as valid JSON in the following format:
    {{
      "0": [
        {{"name": "Entity name", "qid": "Q...", "type": "Person/..."}}
      ],
      "1": []
    }}
    
    Use the provided numeric ID for each text as the key in the JSON object.

    Texts:
    """
    
    for i, item in enumerate(batch_items):
        prompt += f"\nID: {i}\nText:\n{item['text']}\n---\n"
    
    raw_response = None
    for attempt in range(5):
        try:
            response = client.models.generate_content(model=model_name, contents=prompt)
            raw_response = response.text
            break
        except Exception as e:
            err_str = str(e)
            if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str or "503" in err_str or "UNAVAILABLE" in err_str:
                wait = (2 ** attempt) + 5
                logger.warning(f"Gemini overloaded or quota exceeded. Waiting {wait}s...")
                time.sleep(wait)
            elif "404" in err_str:
                logger.error(f"Model not found: {e}")
                list_available_models(client)
                sys.exit(1)
            else:
                logger.error(f"Error calling Gemini API: {e}")
                return
    
    if not raw_response:
        return

    try:
        # Clean up markdown code blocks if Gemini returns them
        raw_response = re.sub(r'```json\s*', '', raw_response)
        raw_response = re.sub(r'```\s*', '', raw_response)
        batch_results = json.loads(raw_response)
    except Exception as e:
        logger.error(f"Error parsing JSON from Gemini: {e}")
        return
    
    # Collect all entities and QIDs
    all_entities = []
    qids_to_fetch = set()
    
    for i, item in enumerate(batch_items):
        entities = batch_results.get(str(i))
        if entities:
            for ent in entities:
                if ent.get('qid'):
                    qids_to_fetch.add(ent['qid'])
                all_entities.append({'file_idx': i, 'data': ent})

    # Fetch Wikidata details in batch
    wd_data = get_wikidata_entities_batch(list(qids_to_fetch))
    
    # Prepare verification
    verification_items = []
    for idx, item in enumerate(all_entities):
        ent = item['data']
        qid = ent.get('qid')
        if qid and qid in wd_data:
            info = wd_data[qid]
            ent['wikidata_label'] = info['label']
            
            if verify:
                verification_items.append({
                    'id': idx,
                    'name': ent.get('name'),
                    'qid': qid,
                    'wd_label': info['label'],
                    'wd_desc': info['description']
                })
            else:
                ent['status'] = 'VALID'
        else:
            ent['status'] = 'NOT_FOUND'

    # Verify with Gemini
    if verify and verification_items:
        prompt = "Verify if the extracted entity name matches the Wikidata item details provided.\n" \
                 "Return a JSON object where keys are the IDs and values are 'VALID' or 'MISMATCH'.\n\nItems:"
        
        for item in verification_items:
            prompt += f"\nID: {item['id']}\nExtracted: {item['name']}\nWikidata: {item['wd_label']} ({item['qid']}) - {item['wd_desc']}\n---\n"
            
        try:
            response = client.models.generate_content(model=model_name, contents=prompt)
            # Cleanup JSON
            text = re.sub(r'```json\s*', '', response.text)
            text = re.sub(r'```\s*', '', text)
            verdict = json.loads(text)
            
            for item in verification_items:
                status = verdict.get(str(item['id']))
                all_entities[item['id']]['data']['status'] = status if status else 'UNKNOWN'
        except Exception as e:
            logger.error(f"Verification failed: {e}")

    # Print results
    for i, item in enumerate(batch_items):
        file_ents = [e['data'] for e in all_entities if e['file_idx'] == i]
        if file_ents:
            print(f"\nFile: {item['rel_path']} ({item['lang']})")
            for ent in file_ents:
                print(f"  - {ent.get('name')} ({ent.get('qid')}) [{ent.get('status')}]")

def analyze_directory(directory, client, model_name, target_lang=None, batch_size=10, verify=False):
    batch = []
    try:
        for root, _, files in os.walk(directory):
            for file in files:
                if not file.endswith(".md"):
                    continue
                    
                full_path = os.path.join(root, file)
                lang = get_lang_from_filename(file)
                
                if target_lang and lang != target_lang:
                    continue
                    
                # logger.info(f"Processing {file} ({lang})...")
                
                try:
                    with open(full_path, 'r', encoding='utf-8') as f:
                        post = frontmatter.load(f)
                    
                    if not post.content.strip():
                        continue
                        
                    cleaned_text = clean_markdown(post.content, context=full_path)
                    rel_path = os.path.relpath(full_path, directory)
                    
                    batch.append({
                        'id': rel_path,
                        'text': cleaned_text,
                        'lang': lang,
                        'rel_path': rel_path
                    })
                    
                    if len(batch) >= batch_size:
                        file_names = [item['rel_path'] for item in batch]
                        logger.info(f"Processing batch of {len(batch)} files: {', '.join(file_names)}")
                        process_batch(client, model_name, batch, verify=verify)
                        batch = []
                        time.sleep(1) # Rate limiting
                    
                except Exception as e:
                    logger.error(f"Failed to process {file}: {e}")
    finally:
        if batch:
            file_names = [item['rel_path'] for item in batch]
            logger.info(f"Processing final batch of {len(batch)} files: {', '.join(file_names)}")
            process_batch(client, model_name, batch, verify=verify)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Extract Entities using Gemini.")
    parser.add_argument("directory", help="Path to the Hugo content directory")
    parser.add_argument("-k", "--api-key", help="Google Gemini API Key", default=os.environ.get("GEMINI_API_KEY"))
    parser.add_argument("-l", "--lang", help="Specific language to process", default=None)
    parser.add_argument("--model", help="Gemini Model Name", default='gemini-2.5-flash-lite')
    parser.add_argument("--batch-size", type=int, default=10, help="Number of files to process in one API call")
    parser.add_argument("--verify", help="Enable LLM-based verification of extracted entities", action="store_true")
    
    args = parser.parse_args()
    
    if not args.api_key:
        logger.error("No API key provided. Please set GEMINI_API_KEY environment variable or use --api-key argument.")
        sys.exit(1)
    
    client = genai.Client(api_key=args.api_key)
    
    analyze_directory(args.directory, client, args.model, args.lang, args.batch_size, verify=args.verify)