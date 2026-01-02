#!/usr/bin/env python

import argparse
import logging
import requests
import extruct
import re
import time
from urllib.parse import urlparse
from w3lib.html import get_base_url
from datetime import datetime

USER_AGENT = 'Projektemacher.org Schema.org converter/1.0 (https://christianmahnke.de/en/post/schemaorg2wikidata)'


# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def search_wikidata(query, type='item', lang='en', method='api'):
    headers = {'User-Agent': USER_AGENT}
    try:
        if method == 'sparql':
            url = "https://query.wikidata.org/sparql"
            sparql_query = f"""
            SELECT ?item WHERE {{
              ?item wdt:P856 <{query}>.
            }}
            LIMIT 1
            """
            params = {'query': sparql_query, 'format': 'json'}
            headers['Accept'] = 'application/json'
        elif method == 'formatter':
            url = "https://www.wikidata.org/w/api.php"
            params = {
                "action": "wbgetentities",
                "ids": query,
                "format": "json",
                "props": "claims"
            }
        else:
            url = "https://www.wikidata.org/w/api.php"
            params = {
                "action": "wbsearchentities",
                "search": query,
                "language": lang,
                "format": "json",
                "type": type,
                "limit": 1
            }

        response = requests.get(url, params=params, headers=headers, timeout=10)
        response.raise_for_status()
        data = response.json()

        if method == 'sparql':
            if data.get('results', {}).get('bindings'):
                time.sleep(0.5)
                item_url = data['results']['bindings'][0]['item']['value']
                return {'id': item_url.split('/')[-1]}
        elif method == 'formatter':
            claims = data.get('entities', {}).get(query, {}).get('claims', {})
            if 'P1630' in claims:
                return claims['P1630'][0]['mainsnak']['datavalue']['value']
        else:
            if data.get('search'):
                time.sleep(0.5)
                return data['search'][0]
    except Exception as e:
        logger.error(f"Error searching Wikidata for {query}: {e}")
    return None

def validate_qs(qs):
    issues = []
    lines = qs.split('\n')
    for i, line in enumerate(lines):
        if line.count('"') % 2 != 0:
            issues.append(f"Line {i+1} has unbalanced quotes: {line}")
    return issues

def extract_schema_to_qs(url):
    try:
        logger.info(f"Processing URL: {url}")
        headers = {'User-Agent': USER_AGENT}
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        lang = 'en'
        lang_match = re.search(r'<html[^>]*lang=["\']?([a-zA-Z\-]+)["\']?', response.text, re.IGNORECASE)
        if lang_match:
            lang = lang_match.group(1).lower()

        base_url = get_base_url(response.text, response.url)
        data = extruct.extract(response.text, base_url=base_url, syntaxes=['json-ld'])
        
        if not data.get('json-ld'):
            logger.warning("No JSON-LD metadata found on this page.")
            return None

        person = None
        for item in data['json-ld']:
            if item.get('@type') == 'Person':
                person = item
                if item.get('inLanguage'):
                    lang = item['inLanguage']
                break
            if item.get('@type') == 'ProfilePage':
                if item.get('inLanguage'):
                    lang = item['inLanguage']
                main_entity = item.get('mainEntity')
                if isinstance(main_entity, dict) and main_entity.get('@type') == 'Person':
                    person = main_entity
                    if person.get('inLanguage'):
                        lang = person['inLanguage']
                    break

        if isinstance(lang, dict):
            lang = lang.get('alternateName', lang.get('name', 'en'))
        elif isinstance(lang, list) and lang:
            lang = lang[0] if isinstance(lang[0], str) else lang[0].get('alternateName', lang[0].get('name', 'en'))
        if isinstance(lang, str):
            lang = lang.lower()

        if not person:
            logger.warning("No 'Person' schema found.")
            return None

        commands = ["CREATE"]
        
        if 'name' in person:
            commands.append(f'LAST|Lmul|"{person["name"].replace("\"", "\\\"")}"')
            commands.append(f'LAST|L{lang}|"{person["name"].replace("\"", "\\\"")}"')
        
        if 'description' in person:
            descriptions = person['description']
            if not isinstance(descriptions, list):
                descriptions = [descriptions]
            
            for desc in descriptions:
                d_lang = lang
                d_val = None
                
                if isinstance(desc, str):
                    d_val = desc
                elif isinstance(desc, dict):
                    if '@value' in desc:
                        d_val = desc['@value']
                        if '@language' in desc:
                            d_lang = desc['@language']
                    else:
                        for k, v in desc.items():
                            if isinstance(v, str) and len(k) < 10 and not k.startswith('@'):
                                commands.append(f'LAST|D{k}|"{v.replace("\"", "\\\"")}"')
                        continue

                if d_val:
                    commands.append(f'LAST|D{d_lang}|"{d_val.replace("\"", "\\\"")}"')

        commands.append("LAST|P31|Q5")
        
        if 'birthDate' in person:
            dob = person['birthDate']
            if len(dob) == 4:
                commands.append(f'LAST|P569|+{dob}-01-01T00:00:00Z/9')
            elif len(dob) == 7:
                commands.append(f'LAST|P569|+{dob}-01T00:00:00Z/10')
            elif len(dob) == 10:
                commands.append(f'LAST|P569|+{dob}T00:00:00Z/11')
        
        if 'url' in person:
            commands.append(f'LAST|P856|"{person["url"].replace("\"", "\\\"")}"')
        
        if 'sameAs' in person:
            sites = person['sameAs'] if isinstance(person['sameAs'], list) else [person['sameAs']]
            for site in sites:
                if 'url' in person and site == person['url']:
                    continue

                parsed = urlparse(site)
                domain = parsed.netloc
                ## Handle subdomains
                for prefix in ['www.', 'm.', 'mobile.', 'api.', 'pro.', 'profile.']:
                    if domain.startswith(prefix) and '.' in domain[len(prefix):]:
                        domain = domain[len(prefix):]
                site_name = domain.split('.')[0]

                # TODO: Mastodon URLs are oly checked by string, we might use webfinger
                path_parts = parsed.path.strip('/').split('/')
                if len(path_parts) == 1 and path_parts[0].startswith('@'):
                    if domain not in ['youtube.com', 'medium.com', 'threads.net', 'tiktok.com', 'flipboard.com', 'picsart.com']:
                        commands.append(f'LAST|P4033|"{path_parts[0]}@{domain}"')
                        continue

                prop = search_wikidata(site_name, type='property')
                if prop:
                    formatter = search_wikidata(prop['id'], method='formatter')
                    if formatter:
                        parts = formatter.split('$1')
                        start = parts[0]
                        end = parts[1] if len(parts) > 1 else ""
                        if site.startswith(start) and (not end or site.endswith(end)):
                            identifier = site[len(start):len(site)-len(end)]
                            commands.append(f'LAST|{prop["id"]}|"{identifier.replace("\"", "\\\"")}"')
                        else:
                            logger.warning(f"URL {site} does not match formatter {formatter} for property {prop['id']}")
                    else:
                        identifier = site.rstrip('/').split('/')[-1]
                        commands.append(f'LAST|{prop["id"]}|"{identifier.replace("\"", "\\\"")}"')
                else:
                    logger.warning(f"Unmapped sameAs entry: {site}, setting it to P973")
                    commands.append(f'LAST|P973|"{site.replace("\"", "\\\"")}"|P3831|Q102345381')

        if 'memberOf' in person:
            memberships = person['memberOf']
            if not isinstance(memberships, list):
                memberships = [memberships]
            
            for org in memberships:
                org_name = None
                org_url = None
                if isinstance(org, dict):
                    org_name = org.get('name')
                    org_url = org.get('url')
                elif isinstance(org, str):
                    if not org.startswith('http'):
                        org_name = org
                    else:
                        org_url = org
                
                res = None
                if org_name:
                    res = search_wikidata(org_name, type='item', lang=lang)
                    if not res and lang != 'en':
                        res = search_wikidata(org_name, type='item', lang='en')
                
                if not res and org_url:
                    res = search_wikidata(org_url, method='sparql')
                    if not res:
                        domain = urlparse(org_url).netloc.replace('www.', '')
                        if domain:
                            res = search_wikidata(domain, type='item', lang=lang)
                            if not res and lang != 'en':
                                res = search_wikidata(domain, type='item', lang='en')

                if res:
                    commands.append(f'LAST|P463|{res["id"]}')
                else:
                    logger.warning(f"Unmapped membership: {org_name or org_url}")

        today = datetime.now().strftime("+%Y-%m-%dT00:00:00Z/11")
        source = f'|S854|"{url}"|S813|{today}'
        
        final_qs = [commands[0], commands[1]]
        for cmd in commands[2:]:
            final_qs.append(f"{cmd}{source}")

        return "\n".join(final_qs)

    except Exception as e:
        logger.error(f"Error: {e}")
        return None

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Convert Schema.org data to WikiData QuickStatements.")
    parser.add_argument("url", help="Web page URL containing Schema.org JSON-LD")
    args = parser.parse_args()

    qs = extract_schema_to_qs(args.url)
    if qs:
        issues = validate_qs(qs)
        if issues:
            logger.warning("Validation issues found in QuickStatements:")
            for issue in issues:
                logger.warning(issue)
        print(qs)
