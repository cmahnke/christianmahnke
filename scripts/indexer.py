import asyncio
import json
import yaml
import logging
import os
import sys
import re
import argparse
import pathlib
import requests
from pagefind.index import PagefindIndex, IndexConfig
from bs4.element import Tag
from bs4 import BeautifulSoup
import difflib

logging.basicConfig(level=os.environ.get("LOG_LEVEL", "INFO"))
log = logging.getLogger(__name__)

default_include = ["**/*.htm", "**/*.html"]
data_attribute_prefix = "data-pagefind-"
WIKIDATA_ENDPOINT = "https://query.wikidata.org/sparql"

wikidata_cache = {}

class Page:
    def __init__(self, relative_path, filepath, content = None):
        self.relative_path= relative_path
        self.filepath = filepath
        if isinstance(content, list):
            self.contents = content
        else:
            self.contents = [content]

    def first(self):
        return self.contents[0]


## Helper functions for index enrichment 

def get_labels (qid, lang):
    if qid in wikidata_cache:
        if lang in wikidata_cache[qid] and "labels" in wikidata_cache[qid][lang]:
            return wikidata_cache[qid][lang]["labels"]
        else:
            wikidata_cache[qid][lang] = {}
    else:
        wikidata_cache[qid] = {}
        wikidata_cache[qid][lang] = {}

    uri = f"http://www.wikidata.org/entity/{qid}"
    query = f"""
    SELECT DISTINCT ?altLabel
    WHERE {{
      VALUES ?object {{ <{uri}> }}

      OPTIONAL {{
        ?object <http://www.w3.org/2000/01/rdf-schema#label> ?label .
        FILTER (lang(?label) = "{lang}")
      }}

      {{
        ?object <http://www.w3.org/2004/02/skos/core#altLabel> ?altLabel .
        FILTER (lang(?altLabel) = "{lang}" || lang(?altLabel) = "")
      }}
      UNION
      {{
        ?object <http://www.w3.org/2004/02/skos/core#altLabel> ?altLabel .
        FILTER (!langMatches(lang(?altLabel), "*"))
      }}
    }}
    """

    try:
        response = requests.get(WIKIDATA_ENDPOINT, params={"query": query}, headers={"Accept": "application/sparql-results+json"})
        response.raise_for_status()

        data = response.json()
        alt_labels = []
        for binding in data["results"]["bindings"]:
            if "altLabel" in binding:
                alt_labels.append(binding["altLabel"]["value"])
        
        wikidata_cache[qid][lang]["labels"] = ";".join(alt_labels)
        return wikidata_cache[qid][lang]["labels"]

    except requests.exceptions.RequestException as e:
        print(f"Error querying Wikidata: {e}")
        return ""
    except json.JSONDecodeError:
        print("Error decoding JSON response from Wikidata.")
        return ""
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        return ""


def sed_style_replace(string, pattern):
    if not (pattern.startswith('s') and len(pattern) >= 6 and pattern.endswith('g')):
        raise Exception(f"Malformed {pattern}")
    sep = pattern[1]
    if pattern.count(sep) != 3:
        raise Exception(f"Not a valid pattern {pattern}")
    search, _, rest = pattern[2:].partition(sep)
    replace, _, rest = rest.partition(sep)
    if not search or rest != 'g':
        raise Exception(f"Not a valid pattern {pattern}")
    replace = replace.replace("$", "\\")
    return re.sub(search, replace, string, 0, re.MULTILINE)

# Callable index enrichment functions

def extract(node, attribute = None, pattern = None):
    if attribute is None:
        text = node.text
    else:
        text = node[attribute]
    # BeautifulSoup implements the magic by default antipattern: class attributes are returned as list without providing symetric way to work around this.
    # Like an accesor without parsing. There is a genral setting `multi_valued_attributes=None`
    if isinstance(text, list):
        text = " ".join(text)

    if pattern is not None:
        text = sed_style_replace(text, pattern)
    log.debug(f"Extracting node, attribute {attribute}, pattern {pattern}, result: '{text}'")
    return text

def variants(node, attribute="data-wikidata-entity", lang = "en"):
    if attribute is None:
        qid = node.text
    else:
        qid = node[attribute]
    return get_labels(qid, lang)


# See https://searchfox.org/mozilla-central/source/devtools/shared/inspector/css-logic.js arround line 634
def generate_css_selector(node):
    if not isinstance(node, Tag):
        return None

    current_node = node
    selector_parts = []

    while current_node and current_node.name != '[document]':
        if current_node.has_attr('id') and current_node['id']:
            id = current_node['id']
            numeric_id_pattern = r"^(\d+).*$"
            if re.match(numeric_id_pattern, id):
                id = re.sub(numeric_id_pattern, lambda m: "".join(list(map(lambda c: "\\" + str(ord(c)), list(m.group(1))))), id)

            part = f"#{id}"
            selector_parts.insert(0, part)
            break

        part = current_node.name
        if current_node.has_attr('class') and current_node['class']:
            part += '.' + '.'.join(current_node['class'])

        if current_node.parent:
            siblings_of_same_type = [
                s for s in current_node.parent.children
                if isinstance(s, Tag) and s.name == current_node.name
            ]

            if len(siblings_of_same_type) > 1:
                try:
                    nth_index = siblings_of_same_type.index(current_node) + 1
                    part += f":nth-of-type({nth_index})"
                except ValueError:
                    pass

        selector_parts.insert(0, part)

        full_selector = " > ".join(selector_parts)
        if current_node.find_parent().select(full_selector) and len(current_node.find_parent().select(full_selector)) == 1:
            return full_selector
        current_node = current_node.parent

    final_selector = " > ".join(selector_parts)
    if final_selector:
        root_document = node.find_parent(None) # Get the ultimate parent, which should be the BeautifulSoup object itself
        if root_document and len(root_document.select(final_selector)) == 1:
            return final_selector
    return None

def load_config(config_file):
    _, ext = os.path.splitext(config_file)
    try:
        with open(config_file, 'r', encoding='utf-8') as f:
            if ext.lower() in ['.json', '.jsonc']:
                config = json.load(f)
            elif ext.lower() in ['.yaml', '.yml']:
                config = yaml.safe_load(f)
            else:
                print(f"Error: Configuration file '{config_file}' must be JSON or YAML.")
                return
            return config
    except FileNotFoundError:
        print(f"Error: Configuration file '{config_file}' not found.")
        return
    except (json.JSONDecodeError, yaml.YAMLError) as e:
        print(f"Error parsing configuration file '{config_file}': {e}")
        return

def create_file_list(source_dir, include, exclude = None, ignore = None):
    patterns = []
    if ignore is not None:
        if isinstance(ignore, str):
            ignore = [ignore]
        for i in ignore:
            patterns.append(re.compile(i))
    index_files = {}
    for root, _, files in os.walk(source_dir):
        for file in files:
            index = False
            filepath = os.path.join(root, file)
            relative_path = os.path.relpath(filepath, source_dir)
            for incl in include:
                if pathlib.PurePath(relative_path).match(incl):
                    index = True
                    break
            if not index:
                continue
            if exclude is not None:
                for excl in exclude:
                    if pathlib.PurePath(relative_path).full_match(excl):
                        log.debug(f"Excluding {relative_path} (Pattern '{excl}')")
                        index = False
                        break
            if not index:
                continue
            if patterns:
                with open(filepath, 'r', encoding='utf-8') as f:
                    contents = f.read()
                    for pattern in patterns:
                        if pattern.search(contents):
                            log.debug(f"Excluding {relative_path} based on content {pattern.pattern}")
                            index = False
                            break

            if index:
                log.debug(f"Including {relative_path}")
                index_files[relative_path] = filepath

    return index_files

def preprocess_html_file(filepath, config):
    def expand_args(args, ctx):
        if isinstance(args, dict):
            return dict(map(lambda i: (i[0], i[1].format(**ctx)) , args.items()))
            
        elif isinstance(args, list):
            return list(map(lambda e: e.format(**ctx), args))
        else:
            return args.format(**ctx)

    def add_meta(element, attr = "meta", field = "", field_def = None, ctx=None):
        #if (any(map(content.__contains__, [",", "'", "\""]))):
        #    log.warning(f"Unknown selector definition type for '{key}': {type(selectors_def)}. Skipping.")
        if isinstance(field_def, dict):
            value_def = list(field_def.values())[0]
            if isinstance(value_def, dict):
                additional_attr = f"{data_attribute_prefix}{attr}-{field}"
                if (additional_attr in element):
                    raise Exception("Attribute {additional_attr} already exists!")
                if "function" in value_def:
                    if "args" in value_def:
                        if ctx is not None:
                            args = expand_args(value_def["args"], ctx)
                        else:
                            args = value_def["args"]
                        if "args" in value_def and isinstance(args, dict):
                            element[additional_attr] = globals()[value_def["function"]](element, **args)
                        elif "args" in value_def and isinstance(args, list):
                            element[additional_attr] = globals()[value_def["function"]](element, *args)
                        log.debug(f"Called {value_def["function"]} with args {args}")
                    else:
                        element[additional_attr] = globals()[value_def["function"]](element)
                    attr_val = f"{field}[{additional_attr}]"
                else:
                    log.warning(f"Unsupported dict value definition {value_def} ")
            else:
                attr_val = field + value_def
        else:
            attr_val = field
        if attr in element:
            element[data_attribute_prefix + attr] = f"{element[data_attribute_prefix + attr]}, {attr_val}"
        else:
            element[data_attribute_prefix + attr] = attr_val

    def add_attr(element, attr, field_def):
        if isinstance(field_def, str):
            element[data_attribute_prefix + attr] = ""
        elif isinstance(field_def, dict):
            value_def = list(field_def.values())[0]
            if isinstance(value_def, dict):
                # TODO: Largely untested
                if "function" in value_def:
                    if "args" in value_def and isinstance(value_def["args"], dict):
                        attr_val = globals()[value_def["function"]](element, **value_def["args"])
                    if "args" in value_def and isinstance(value_def["args"], list):
                        attr_val = globals()[value_def["function"]](element, *value_def["args"])
                    else:
                        attr_val = globals()[value_def["function"]](element)
                else:
                    log.warning(f"Unsupported dict value definition {value_def} ")
            else:
                attr_val = value_def
            element[data_attribute_prefix + attr] = attr_val


    with open(filepath, 'r', encoding='utf-8') as f:
        soup = BeautifulSoup(f, 'html.parser')
    #if logging.DEBUG >= log.level:
    #    initial_html_content = str(soup)
    lang_tag = soup.select("html[lang]")
    if lang_tag is not None:
        lang = lang_tag[0]["lang"]
        log.debug(f"Procesing {filepath}, language {lang}")
    else:
        log.warning(f"Lang tag not found for {filepath}")

    for key, selectors_def in config.items():
        data_attribute_key = data_attribute_prefix + key
        

        if isinstance(selectors_def, str):
            selectors = [selectors_def]
        elif isinstance(selectors_def, list):
            selectors = selectors_def
        elif isinstance(selectors_def, dict):

            if key in ["meta", "default-meta", "filter", "sort"]:
               
                for sub_key, sub_selector in selectors_def.items():
                    log.debug(f"Procesing {sub_key} with {sub_selector}")
                    if isinstance(sub_selector, str):
                        sub_selectors = [sub_selector]
                    elif isinstance(sub_selector, dict):
                        raise Exception("Wrong datatype, use list instead of dict")
                    else:
                        sub_selectors = sub_selector
                    for selector in sub_selectors:
                        if isinstance(selector, str):
                            sel = selector
                        elif isinstance(selector, dict):
                            sel = list(selector.keys())[0]
                        elements = soup.select(sel)
                        for element in elements:
                            add_meta(element, key, sub_key, selector, {"lang": lang})
            continue
        else:
            log.warning(f"Unknown selector definition type for '{key} and dict, maybe selectors need to be given as lsit?': {type(selectors_def)}. Skipping.")
            continue

        if not isinstance(selectors_def, dict):
            log.debug(f"Procesing {key} with {selectors_def}")
            for sub_key in selectors:
                if isinstance(sub_key, str):
                    selector = sub_key
                elif isinstance(sub_key, dict):
                    selector = list(sub_key.keys())[0]
                elements = soup.select(selector)
                for element in elements:
                    if key == "body":
                        element[data_attribute_key] = ""
                    elif key in ["ignore", "weight", "index-attrs"]:
                        add_attr(element, key, sub_key)
                    else:
                        log.warning(f"Unhandled '{key}'!")
                        element[key] = ""

    modified_html_content = str(soup)
    #if logging.DEBUG >= log.level:
    #    result = difflib.unified_diff(initial_html_content, modified_html_content)
    #    diff = ''.join(map(str, result))
    #    log.debug(f"HTML after processing:\n{diff}")
    log.debug(f"HTML after processing:\n{modified_html_content}")
    return modified_html_content

async def index(contents, output_dir):
    async with PagefindIndex() as index:
        processed_files_count = 0
        for page in contents:
            relative_path = page.relative_path
            filepath = page.filepath
            content = page.first()

            try:
                await index.add_html_file(
                    url=f"/{relative_path}",
                    content=content,
                    source_path=filepath
                )
                processed_files_count += 1

            except Exception as e:
                log.error(f"Error processing file {filepath}: {e}")

        log.info(f"Processed {processed_files_count} HTML files.")

        log.info(f"Writing Pagefind index to '{output_dir}'...")
        await index.write_files(output_path=output_dir)
        log.info("Pagefind indexing complete!")

async def main():
    if sys.version_info[0] < 3 or sys.version_info[1] < 13:
        raise Exception("Must be using Python 3.13")

    parser = argparse.ArgumentParser(description='Index page')
    parser.add_argument('-s', '--source', type=pathlib.Path, help='The source directory containing HTML files to be indexed',)
    parser.add_argument('-c', '--config', type=pathlib.Path, help='File containing configuration (JSON or YAML)', required=True)
    parser.add_argument("-o", "--output", type=pathlib.Path, help="The directory where Pagefind will write its index files. Defaults to a 'pagefind' subdirectory within the source directory.")

    args = parser.parse_args()
    config = load_config(args.config)

    if config is None:
        raise Exception("Failed to load config!")

    if not "files" in config:
        raise Exception("No file section in config!")

    if ("source" in config["files"]):
        source_dir = config["files"]["source"]
    elif ("source" in args and args.source):
        source_dir = args.source

    if ("output" in config["files"]):
        output_dir = config["files"]["output"]
    elif ("output" in args and args.output):
        output_dir = args.output

    if output_dir is None:
        output_dir = os.path.join(source_dir, "pagefind")

    include = default_include
    if ("include" in config["files"]):
        include = config["files"]["include"]
    exclude = None
    if ("exclude" in config["files"]):
        exclude = config["files"]["exclude"]

    ignore = None
    if ("ignore" in config["content"]):
        ignore = config["content"]["ignore"]

    log.info(f"Starting Pagefind indexing for '{source_dir}'...")
    log.info(f"Output directory: '{output_dir}'")
    log.info(f"Using configuration from: '{args.config}'")

    file_list = create_file_list(source_dir, include, exclude, ignore)
    index_config = config["index"]
    pages = []
    for relative_path, filepath in file_list.items():
        pages.append(Page(relative_path, filepath, preprocess_html_file(filepath, index_config)))
    await index(pages, output_dir)

if __name__ == "__main__":
    print("Starting indexer")
    asyncio.run(main())
