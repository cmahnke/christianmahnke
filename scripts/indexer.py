import asyncio
import json
import yaml
import logging
import os
import sys
import argparse
import pathlib
from pagefind.index import PagefindIndex, IndexConfig
from bs4 import BeautifulSoup
import difflib

logging.basicConfig(level=os.environ.get("LOG_LEVEL", "INFO"))
log = logging.getLogger(__name__)

default_include = ["**/*.htm", "**/*.html"]

# See https://searchfox.org/mozilla-central/source/devtools/shared/inspector/css-logic.js arround line 634
def generate_css_selector(node):
    if not isinstance(node, BeautifulSoup.Tag):
        return None

    current_node = node
    selector_parts = []

    while current_node and current_node.name != '[document]':
        if current_node.has_attr('id') and current_node['id']:
            part = f"#{current_node['id']}"
            selector_parts.insert(0, part)
            break

        part = current_node.name
        if current_node.has_attr('class') and current_node['class']:
            part += '.' + '.'.join(current_node['class'])

        if current_node.parent:
            siblings_of_same_type = [
                s for s in current_node.parent.children
                if isinstance(s, BeautifulSoup.Tag) and s.name == current_node.name
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

def create_file_list(source_dir, include, exclude):
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
            if index:
                log.debug(f"Including {relative_path}")
                index_files[relative_path] = filepath

    return index_files

# TODO: We should do some sanity check, like whether "data-pagefind-body" is unique (would be a warning)
def preprocess_html_file(filepath, config):
    with open(filepath, 'r', encoding='utf-8') as f:
        soup = BeautifulSoup(f, 'html.parser')
    #if logging.DEBUG >= log.level:
    #    initial_html_content = str(soup)

    for key, selectors_def in config.items():
        data_attribute_key = "data-pagefind-" + key

        if isinstance(selectors_def, str):
            selectors = [selectors_def]
        elif isinstance(selectors_def, list):
            selectors = selectors_def
        elif isinstance(selectors_def, dict):

            if key in ["meta", "filter", "sort", "weight"]:
                for sub_key, sub_selector in selectors_def.items():
                    elements = soup.select(sub_selector)
                    for element in elements:
                        if key in element:
                            if sub_key not in element[key].split(' '):
                                element[data_attribute_key] = f"{element[key]} {sub_key}".strip()
                        else:
                            element[data_attribute_key] = sub_key

                        value_attribute_name = f"{data_attribute_key}-{sub_key}"
                        element[value_attribute_name] = element.get_text(strip=True)
            continue
        else:
            log.warning(f"Unknown selector definition type for '{key}': {type(selectors_def)}. Skipping.")
            continue

        if not isinstance(selectors_def, dict):
            for selector in selectors:
                elements = soup.select(selector)
                for element in elements:
                    if key in [ "body", "index-on", "ignore"]:
                        element[data_attribute_key] = ""
                    elif key in ["content", "title"]:
                        element[data_attribute_key] = element.get_text(strip=True)
                    elif key == "image":
                        if 'src' in element.attrs:
                            element[data_attribute_key] = element['src']
                        else:
                            element[data_attribute_key] = element['src']
                            log.warning(f"{selector} matched an element without a 'src' for data-pagefind-image.")
                    else:
                        element[key] = ""

    modified_html_content = str(soup)
    #if logging.DEBUG >= log.level:
    #    result = difflib.unified_diff(initial_html_content, modified_html_content)
    #    diff = ''.join(map(str, result))
    #    log.debug(f"HTML after processing:\n{diff}")
    return modified_html_content

async def index(contents, index_config, output_dir):
    async with PagefindIndex() as index:
        processed_files_count = 0
        for relative_path, content in contents.items():
            modified_html_content = content["content"]
            filepath = content["file"]

            try:
                await index.add_html(
                    url=f"/{relative_path}",
                    content=modified_html_content,
                    source_path=filepath
                )
                processed_files_count += 1

            except Exception as e:
                log.error(f"Error processing file {filepath}: {e}")

        log.info(f"Processed {processed_files_count} HTML files.")

        log.info(f"Writing Pagefind index to '{output_dir}'...")
        await index.write_files(output_path=output_dir)
        log.info("Pagefind indexing complete!")

def main():
    if sys.version_info[0] < 3 and sys.version_info[1] < 13:
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

    log.info(f"Starting Pagefind indexing for '{source_dir}'...")
    log.info(f"Output directory: '{output_dir}'")
    log.info(f"Using configuration from: '{args.config}'")

    file_list = create_file_list(source_dir, include, exclude)
    index_config = config["index"]
    contents = {}
    for relative_path, filepath in file_list.items():
        contents[relative_path] = {"contents": preprocess_html_file(filepath, index_config), "file": filepath}

if __name__ == "__main__":
    print("Starting indexer")
    main()
