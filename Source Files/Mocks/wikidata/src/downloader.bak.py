import json
import requests
from collections import deque
import time
from urllib.parse import urlparse
import sys

import rdflib
from rdflib import Graph, URIRef, Literal, BNode, Namespace
from rdflib.namespace import RDF, RDFS, XSD
import datetime # Import datetime module

# Define Wikidata namespaces
WD = Namespace("http://www.wikidata.org/entity/")
WDT = Namespace("http://www.wikidata.org/prop/direct/")
P = Namespace("http://www.wikidata.org/prop/")
PS = Namespace("http://www.wikidata.org/prop/statement/")
PQ = Namespace("http://www.wikidata.org/prop/qualifier/")
SCHEMA = Namespace("http://schema.org/")
WIKIBASES = Namespace("http://wikiba.se/ontology#")

# Cache for Wikidata labels to reduce redundant API calls
LABEL_CACHE = {}

def get_wikidata_label(entity_id, lang='en'):
    """
    Fetches the English label for a given Wikidata entity ID.
    Caches labels to reduce API calls.
    """
    if entity_id in LABEL_CACHE:
        return LABEL_CACHE[entity_id]

    if not (entity_id.startswith('Q') or entity_id.startswith('P')):
        LABEL_CACHE[entity_id] = str(entity_id)
        return str(entity_id)

    url = f"https://www.wikidata.org/wiki/Special:EntityData/{entity_id}.json"
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        data = response.json()

        entity = data.get('entities', {}).get(entity_id, {})
        label = entity.get('labels', {}).get(lang, {}).get('value', entity_id)
        LABEL_CACHE[entity_id] = label
        return label
    except requests.exceptions.RequestException as e:
        print(f"Error fetching label for {entity_id}: {e}", file=sys.stderr)
        LABEL_CACHE[entity_id] = entity_id
        return entity_id
    except json.JSONDecodeError:
        print(f"Error decoding JSON for {entity_id}", file=sys.stderr)
        LABEL_CACHE[entity_id] = entity_id
        return entity_id
    except Exception as e:
        print(f"An unexpected error occurred while getting label for {entity_id}: {e}", file=sys.stderr)
        LABEL_CACHE[entity_id] = entity_id
        return entity_id

def fetch_wikidata_entity_data(entity_id):
    """
    Fetches detailed data for a single Wikidata entity from the Wikibase API.
    """
    if not (entity_id.startswith('Q') or entity_id.startswith('P')):
        return None

    url = f"https://www.wikidata.org/wiki/Special:EntityData/{entity_id}.json"
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        data = response.json()
        return data.get('entities', {}).get(entity_id)
    except requests.exceptions.RequestException as e:
        print(f"Error fetching data for {entity_id}: {e}", file=sys.stderr)
        return None
    except json.JSONDecodeError:
        print(f"Error decoding JSON for {entity_id}", file=sys.stderr)
        return None
    except Exception as e:
        print(f"An unexpected error occurred while fetching data for {entity_id}: {e}", file=sys.stderr)
        return None

def extract_entity_id_from_uri(uri_string):
    """
    Extracts a Wikidata entity ID (Q-item or P-item) from various URI formats.
    """
    if uri_string.startswith("http://www.wikidata.org/entity/") or \
       uri_string.startswith("https://www.wikidata.org/entity/"):
        return uri_string.split('/')[-1]
    elif uri_string.startswith("http://www.wikidata.org/wiki/") or \
         uri_string.startswith("https://www.wikidata.org/wiki/"):
        return uri_string.split('/')[-1]
    elif uri_string.startswith("Q") or uri_string.startswith("P"):
        return uri_string
    return None # Not a recognized Wikidata URI/ID

def read_uris_from_json(source_input):
    """
    Reads a list of Wikidata URIs or IDs from a JSON source.
    Source can be a file path (str), a URL (str), or a file-like object (e.g., sys.stdin).
    """
    data = None
    if isinstance(source_input, str):
        if urlparse(source_input).scheme in ('http', 'https'):
            print(f"Attempting to fetch JSON from URL: {source_input}", file=sys.stderr)
            try:
                response = requests.get(source_input, timeout=10)
                response.raise_for_status()
                data = response.json()
            except requests.exceptions.RequestException as e:
                print(f"Error fetching JSON from URL {source_input}: {e}", file=sys.stderr)
                return []
            except json.JSONDecodeError:
                print(f"Error: Could not decode JSON from URL {source_input}", file=sys.stderr)
                return []
        else:
            print(f"Attempting to read JSON from local file: {source_input}", file=sys.stderr)
            try:
                with open(source_input, 'r', encoding='utf-8') as f:
                    data = json.load(f)
            except FileNotFoundError:
                print(f"Error: JSON file not found at {source_input}", file=sys.stderr)
                return []
            except json.JSONDecodeError:
                print(f"Error: Could not decode JSON from {source_input}", file=sys.stderr)
                return []
    else: # Assume it's a file-like object (e.g., sys.stdin)
        print("Attempting to read JSON from piped input (stdin)...", file=sys.stderr)
        try:
            data = json.load(source_input)
        except json.JSONDecodeError:
            print(f"Error: Could not decode JSON from piped input.", file=sys.stderr)
            return []
        except Exception as e:
            print(f"An unexpected error occurred while reading from stdin: {e}", file=sys.stderr)
            return []

    if data is None:
        return []

    entity_ids = []
    for item in data:
        if isinstance(item, str):
            extracted_id = extract_entity_id_from_uri(item)
            if extracted_id:
                entity_ids.append(extracted_id)
            else:
                print(f"Warning: Unrecognized URI/ID format skipped: {item}", file=sys.stderr)
    return list(set(entity_ids))

def convert_value_to_rdflib_object(value_data):
    """
    Converts a structured value dictionary into an rdflib Literal or URIRef.
    """
    if not value_data:
        return None

    value_type = value_data.get('type')

    # Handle 'string' type first, as its 'value' is often direct, not nested
    if value_type == 'string':
        string_value = value_data.get('value')
        if string_value is not None:
            return Literal(string_value, datatype=XSD.string)
        else:
            print(f"Warning: 'string' type value missing 'value' key or malformed: {value_data}. Skipping.", file=sys.stderr)
            return None

    # Handle 'monolingualtext' type
    elif value_type == 'monolingualtext':
        nested_value_content = value_data.get('value')
        if isinstance(nested_value_content, dict):
            text = nested_value_content.get('text')
            lang = nested_value_content.get('language')
            if text is not None and lang is not None:
                return Literal(text, lang=lang)
            else:
                print(f"Warning: 'monolingualtext' value missing 'text' or 'language' in nested 'value' content: {value_data}. Skipping this value.", file=sys.stderr)
                return None
        else:
            print(f"Warning: 'monolingualtext' value does not contain expected nested 'value' dictionary: {value_data}. Skipping this value.", file=sys.stderr)
            return None

    # For all other complex types, the actual data is nested under a 'value' key
    nested_value_content = value_data.get('value')
    if not isinstance(nested_value_content, dict):
        print(f"Warning: Expected nested 'value' dictionary not found for type '{value_type}' in {value_data}. Storing as generic string or skipping.", file=sys.stderr)
        return Literal(json.dumps(value_data) if isinstance(value_data, dict) else str(value_data))

    if value_type == 'wikibase-entityid':
        entity_id = nested_value_content.get('id')
        if entity_id:
            return WD[entity_id]
        else:
            print(f"Warning: 'wikibase-entityid' value missing 'id' key in nested 'value' content: {value_data}. Skipping this value.", file=sys.stderr)
            return None
    elif value_type == 'time':
        time_str = nested_value_content.get('time')
        precision = nested_value_content.get('precision') # Get precision

        if time_str:
            try:
                # Remove leading '+' if present
                if time_str.startswith('+'):
                    time_str = time_str[1:]

                # Determine datatype based on precision
                # Precision 11 = day, 10 = month, 9 = year
                if precision == 11: # Day precision: YYYY-MM-DD
                    # Ensure it has a time component for XSD.dateTime (or just use XSD.date)
                    # For date, we can just take the date part
                    date_part = time_str.split('T')[0]
                    return Literal(date_part, datatype=XSD.date)
                elif precision == 10: # Month precision: YYYY-MM
                    # Create a valid XSD.gYearMonth
                    return Literal(time_str.split('T')[0][:7], datatype=XSD.gYearMonth)
                elif precision == 9: # Year precision: YYYY
                    # Create a valid XSD.gYear
                    return Literal(time_str.split('T')[0][:4], datatype=XSD.gYear)
                else: # Fallback for unknown/higher precision (like exact time)
                    # If it doesn't have a time component, add a default for XSD.dateTime
                    if 'T' not in time_str:
                        time_str += 'T00:00:00Z'
                    # Attempt to parse to ensure it's a valid dateTime for rdflib
                    # This internal parsing ensures rdflib handles it correctly
                    datetime.datetime.fromisoformat(time_str.replace('Z', '+00:00') if time_str.endswith('Z') else time_str)
                    return Literal(time_str, datatype=XSD.dateTime)
            except ValueError as e:
                print(f"Warning: Could not parse time '{time_str}' with precision {precision} from {value_data}: {e}. Storing as plain string.", file=sys.stderr)
                return Literal(time_str)
            except Exception as e:
                print(f"Warning: An unexpected error occurred parsing time '{time_str}' from {value_data}: {e}. Storing as plain string.", file=sys.stderr)
                return Literal(time_str)
        else:
            print(f"Warning: 'time' value missing 'time' key in nested 'value' content: {value_data}. Skipping.", file=sys.stderr)
            return None
    elif value_type == 'quantity':
        amount_str = nested_value_content.get('amount')
        if amount_str is not None:
            try:
                amount = float(amount_str)
                return Literal(amount, datatype=XSD.decimal)
            except ValueError:
                print(f"Warning: Could not convert quantity amount '{amount_str}' to float. Storing as string.", file=sys.stderr)
                return Literal(amount_str, datatype=XSD.string)
        else:
            print(f"Warning: 'quantity' value missing 'amount' key in nested 'value' content: {value_data}. Skipping this value.", file=sys.stderr)
            return None
    elif value_type == 'globecoordinate':
        longitude = nested_value_content.get('longitude')
        latitude = nested_value_content.get('latitude')
        if longitude is not None and latitude is not None:
            coord_str = f"Point({longitude} {latitude})"
            return Literal(coord_str, datatype=URIRef("http://www.opengis.net/ont/geosparql#wktLiteral"))
        else:
            print(f"Warning: 'globecoordinate' value missing 'longitude' or 'latitude' in nested 'value' content: {value_data}. Skipping this value.", file=sys.stderr)
            return None
    else:
        print(f"Warning: Unhandled value type '{value_type}' for {value_data}. Storing 'value' content as generic string.", file=sys.stderr)
        return Literal(json.dumps(nested_value_content) if isinstance(nested_value_content, dict) else str(nested_value_content))


def collect_wikidata_data_to_rdflib(initial_uri_list, max_depth=2):
    """
    Collects Wikidata data into an rdflib Graph.
    """
    graph = Graph()

    graph.bind("wd", WD)
    graph.bind("wdt", WDT)
    graph.bind("p", P)
    graph.bind("ps", PS)
    graph.bind("pq", PQ)
    graph.bind("wikibase", WIKIBASES)
    graph.bind("schema", SCHEMA)
    graph.bind("xsd", XSD)
    graph.bind("rdf", RDF)
    graph.bind("rdfs", RDFS)

    queue = deque([(entity_id, 0) for entity_id in initial_uri_list])
    processed_entities = set()

    while queue:
        current_entity_id, current_depth = queue.popleft()

        if current_entity_id in processed_entities:
            continue

        if not (current_entity_id.startswith('Q') or current_entity_id.startswith('P')):
            print(f"Warning: Skipping non-Wikidata entity ID format (not Q or P): {current_entity_id}", file=sys.stderr)
            continue

        processed_entities.add(current_entity_id)

        print(f"Collecting data for {current_entity_id} (Depth: {current_depth})", file=sys.stderr)

        subject_uri = WD[current_entity_id]

        entity_label = get_wikidata_label(current_entity_id)
        graph.add((subject_uri, RDFS.label, Literal(entity_label, lang='en')))

        entity_data = fetch_wikidata_entity_data(current_entity_id)
        if not entity_data:
            continue

        claims = entity_data.get('claims', {})
        for prop_id, statements in claims.items():
            property_uri = WDT[prop_id]
            statement_property_uri = P[prop_id]

            prop_label = get_wikidata_label(prop_id)
            graph.add((property_uri, RDFS.label, Literal(prop_label, lang='en')))

            for statement in statements:
                main_snak = statement.get('mainsnak')
                if not main_snak:
                    continue

                main_value_rdflib = convert_value_to_rdflib_object(main_snak.get('datavalue'))

                if main_value_rdflib is None:
                    continue

                graph.add((subject_uri, property_uri, main_value_rdflib))

                # Use a blank node for the statement to attach qualifiers
                statement_bnode = BNode()
                graph.add((subject_uri, statement_property_uri, statement_bnode))
                graph.add((statement_bnode, RDF.type, WIKIBASES.Statement))
                graph.add((statement_bnode, RDF.subject, subject_uri))
                graph.add((statement_bnode, RDF.predicate, property_uri))
                graph.add((statement_bnode, RDF.object, main_value_rdflib))

                # Need to correctly access the 'id' for adding to queue for the main snak
                if main_snak.get('datavalue', {}).get('type') == 'wikibase-entityid':
                    linked_entity_id_data = main_snak.get('datavalue', {}).get('value')
                    if isinstance(linked_entity_id_data, dict):
                        linked_entity_id = linked_entity_id_data.get('id')
                        if linked_entity_id and linked_entity_id not in processed_entities and current_depth < max_depth:
                            queue.append((linked_entity_id, current_depth + 1))

                qualifiers = statement.get('qualifiers', {})
                for qual_prop_id, qual_snaks in qualifiers.items():
                    qual_property_uri = PQ[qual_prop_id]
                    qual_prop_label = get_wikidata_label(qual_prop_id)
                    graph.add((qual_property_uri, RDFS.label, Literal(qual_prop_label, lang='en')))

                    for qual_snak in qual_snaks:
                        qual_value_rdflib = convert_value_to_rdflib_object(qual_snak.get('datavalue'))

                        if qual_value_rdflib is None:
                            continue

                        graph.add((statement_bnode, qual_property_uri, qual_value_rdflib))
                        # Corrected access for qualifier value when checking for linked entities
                        if qual_snak.get('datavalue', {}).get('type') == 'wikibase-entityid':
                            linked_entity_id_data = qual_snak.get('datavalue', {}).get('value')
                            if isinstance(linked_entity_id_data, dict):
                                linked_entity_id = linked_entity_id_data.get('id')
                                if linked_entity_id and linked_entity_id not in processed_entities and current_depth < max_depth:
                                    queue.append((linked_entity_id, current_depth + 1))

        time.sleep(0.1)

    return graph

def save_rdflib_graph(graph, output_path, format='json-ld'):
    """
    Saves the rdflib Graph to a file in the specified RDF serialization format.
    """
    try:
        graph.serialize(destination=output_path, format=format, encoding='utf-8')
        print(f"\nRDF graph saved successfully to {output_path} in {format} format.", file=sys.stderr)
    except Exception as e:
        print(f"Error saving RDF graph to {output_path} in {format} format: {e}", file=sys.stderr)

if __name__ == "__main__":
    output_rdf_file = "collected_wikidata_graph.jsonld"
    serialization_format = "json-ld"

    if len(sys.argv) > 1:
        json_source = sys.argv[1]
    else:
        json_source = sys.stdin

    uris_to_process = read_uris_from_json(json_source)
    if not uris_to_process:
        print("No URIs found to process. Exiting.", file=sys.stderr)
        sys.exit(1)
    else:
        print(f"Successfully read {len(uris_to_process)} unique URIs from input.", file=sys.stderr)
        print("Starting RDF graph construction...", file=sys.stderr)

        rdf_graph = collect_wikidata_data_to_rdflib(uris_to_process, max_depth=1)

        print(f"\nRDF Graph created with {len(rdf_graph)} triples.", file=sys.stderr)

        save_rdflib_graph(rdf_graph, output_rdf_file, format=serialization_format)

        print(f"\nScript finished. Collected RDF data is in '{output_rdf_file}'.", file=sys.stderr)
        print("You can now use RDF tools to query or visualize this data.", file=sys.stderr)
