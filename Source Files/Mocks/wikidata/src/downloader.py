import requests
import json
import time
import logging
from rdflib import Graph, Literal, URIRef, Namespace
from rdflib.namespace import RDF, RDFS, XSD, PROV
from datetime import datetime
from decimal import Decimal
import heapq
from concurrent.futures import ThreadPoolExecutor, as_completed
import sys
from get_ids import get_unique_wikidata_urls # Assuming this is available

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Define common Wikidata namespaces
WD = Namespace("http://www.wikidata.org/entity/")
WDT = Namespace("http://www.wikidata.org/prop/direct/")
P = Namespace("http://www.wikidata.org/prop/")
PS = Namespace("http://www.wikidata.org/prop/statement/")
PQ = Namespace("http://www.wikidata.org/prop/qualifier/")
PR = Namespace("http://www.wikidata.org/prop/reference/")

# Wikidata properties for prioritization (full URIs of the P-items)
P_INSTANCE_OF_URI = str(P.P31)  # http://www.wikidata.org/prop/P31
P_SUBCLASS_OF_URI = str(P.P279) # http://www.wikidata.org/prop/P279
PRIORITY_PROPERTY_URIS = {P_INSTANCE_OF_URI, P_SUBCLASS_OF_URI}

SCHEMA = Namespace("http://schema.org/")

# Global headers for requests
REQUEST_HEADERS = {
    "Accept": "application/sparql-results+json",
    "User-Agent": "WikidataRDFConnectionsFetcher/1.0 (Python - Dynamic Depth Connectivity with Qualifiers & References)"
}

# --- Retry Configuration ---
MAX_RETRIES = 3
RETRY_DELAY_SECONDS = 5
RATE_LIMIT_WAIT_MULTIPLIER = 2
MAX_WORKERS = 16

# Safety net: Maximum depth to explore even if connectivity isn't achieved
MAX_EXPLORATION_DEPTH = 7

def extract_entity_id_from_uri(uri_string):
    """
    Extracts a Wikidata entity ID (Q-item, P-item, or other) from various URI formats.
    """
    if uri_string.startswith("http://www.wikidata.org/entity/") or \
       uri_string.startswith("https://www.wikidata.org/entity/") or \
       uri_string.startswith("http://www.wikidata.org/wiki/") or \
       uri_string.startswith("https://www.wikidata.org/wiki/"):
        return uri_string.split('/')[-1]
    elif uri_string.startswith(("Q", "P", "L", "R", "F", "S")):
        return uri_string
    return None

def get_rdf_object(value_data):
    """
    Converts a SPARQL result value binding into an rdflib URIRef or Literal.
    Handles different types and provides graceful fallback for problematic literals.
    """
    if value_data["type"] == "uri":
        return URIRef(value_data["value"])
    elif value_data["type"] == "bnode":
        # BNodes in SPARQL results are represented as "_:genid" or similar.
        # rdflib.BNode is typically used for this.
        return URIRef(value_data["value"]) # Treat as URI for now to ensure consistency in graph binding
    else: # It's a literal type (literal, typed-literal, etc.)
        literal_value = value_data["value"]
        literal_datatype_uri = value_data.get("datatype")

        if literal_datatype_uri:
            try:
                return Literal(literal_value, datatype=URIRef(literal_datatype_uri))
            except ValueError as ve:
                if "Invalid isoformat string" in str(ve) and literal_datatype_uri == str(XSD.dateTime):
                    return Literal(literal_value) # Fallback to plain string
                else:
                    return Literal(literal_value)
            except Exception as e:
                return Literal(literal_value)
        else:
            return Literal(literal_value)


def execute_sparql_query(sparql_query, q_id, results_cache_key):
    """
    Executes a single SPARQL query with retry logic and caches results.
    `results_cache_key` is used to store/retrieve results in the main cache.
    """
    SPARQL_ENDPOINT = "https://query.wikidata.org/sparql"

    if results_cache_key in results_cache:
        logger.debug(f"Cache hit for {results_cache_key}")
        return results_cache[results_cache_key], None

    retries = 0
    while retries < MAX_RETRIES:
        try:
            response = requests.post(SPARQL_ENDPOINT, data={"query": sparql_query}, headers=REQUEST_HEADERS)
            response.raise_for_status() # Raises HTTPError for bad responses (4xx or 5xx)

            data = response.json()
            results_cache[results_cache_key] = data # Cache the successful data
            return data, None # Success: return data, and no error

        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 429: # Specific handling for Too Many Requests
                retry_after = e.response.headers.get("Retry-After")
                wait_time = RETRY_DELAY_SECONDS * RATE_LIMIT_WAIT_MULTIPLIER # Default for 429 if no header

                if retry_after:
                    try:
                        wait_time = int(retry_after) + 1 # Add a small buffer
                        logger.warning(f"Rate limit exceeded (429) for {q_id} (query for {results_cache_key}). Retrying in {wait_time} seconds (Attempt {retries + 1}/{MAX_RETRIES})")
                    except ValueError:
                        logger.warning(f"Rate limit exceeded (429) for {q_id} (query for {results_cache_key}). Retrying in {wait_time} seconds (No valid Retry-After header). (Attempt {retries + 1}/{MAX_RETRIES})")
                else:
                    logger.warning(f"Rate limit exceeded (429) for {q_id} (query for {results_cache_key}). Retrying in {wait_time} seconds (No Retry-After header). (Attempt {retries + 1}/{MAX_RETRIES})")

                retries += 1
                if retries < MAX_RETRIES:
                    time.sleep(wait_time)
                else:
                    return None, f"Max retries reached for {q_id} (Rate Limit Exceeded 429 for {results_cache_key}). Skipping. Error: {e}"

            # This block can also catch MalformedQueryException if it comes as a 400 Bad Request
            # Or if it's a 500 server error, which indicates the query was too complex (even if syntactically valid)
            elif e.response.status_code == 500 or e.response.status_code == 400:
                logger.error(f"Server Error ({e.response.status_code}) for {q_id} (query for {results_cache_key}) (Attempt {retries + 1}/{MAX_RETRIES}): {e}")
                logger.error(f"Problematic Query:\n{sparql_query}") # Print the query to debug syntax issues
                retries += 1
                if retries < MAX_RETRIES:
                    time.sleep(RETRY_DELAY_SECONDS)
                else:
                    return None, f"Max retries reached for {q_id} (Server Error {e.response.status_code} for {results_cache_key}). Skipping. Error: {e}"
            else: # Other HTTP errors (e.g., 404, 403)
                return None, f"Error fetching data for {q_id} (query for {results_cache_key}): {e} (Content: {e.response.text})"

        except (requests.exceptions.RequestException, json.JSONDecodeError) as e:
            logger.error(f"Network/JSON Error for {q_id} (query for {results_cache_key}) (Attempt {retries + 1}/{MAX_RETRIES}): {e}")
            retries += 1
            if retries < MAX_RETRIES:
                time.sleep(RETRY_DELAY_SECONDS)
            else:
                return None, f"Max retries reached for {q_id} (for {results_cache_key}). Skipping. Error: {e}"

    return None, f"Failed to fetch data for {q_id} (for {results_cache_key}) after {MAX_RETRIES} retries."


def fetch_connections_for_q_id(current_q_id, results_cache, fetch_qualifiers_enabled=False, fetch_references_enabled=False):
    """
    Fetches connections for a single Q-ID by sending multiple, smaller SPARQL queries.
    `fetch_qualifiers_enabled` controls whether qualifier properties are fetched.
    `fetch_references_enabled` controls whether reference properties are fetched.
    """
    all_bindings = []
    errors = []

    # Query 1: Get main statements (P and PS) and item labels
    query_statements = f"""
    SELECT DISTINCT ?item ?itemLabel ?pProperty ?pPropertyLabel ?statementNode ?psProperty ?psPropertyLabel ?statementValue ?statementValueLabel
    WHERE {{
      BIND(wd:{current_q_id} AS ?item)
      ?item ?pProperty ?statementNode .
      FILTER(STRSTARTS(STR(?pProperty), "{str(P)}"))
      OPTIONAL {{ ?statementNode ?psProperty ?statementValue .
                 FILTER(STRSTARTS(STR(?psProperty), "{str(PS)}")) }}
      SERVICE wikibase:label {{ bd:serviceParam wikibase:language "[AUTO_LANGUAGE],de,en". }}
    }}
    """
    logger.debug(f"Executing statement query for {current_q_id}")
    data, error = execute_sparql_query(query_statements, current_q_id, f"{current_q_id}_statements")
    if error:
        errors.append(error)
    elif data:
        all_bindings.extend(data["results"]["bindings"])

    statement_nodes_for_qualifiers_references = set()
    for binding in all_bindings:
        if "statementNode" in binding:
            node_type = binding["statementNode"].get("type")
            node_value = binding["statementNode"]["value"]

            if node_type in ["uri", "bnode"]:
                statement_nodes_for_qualifiers_references.add(node_value)
            # Warning for literal statementNode is suppressed by default via logging level.

    # If no statement nodes suitable for qualifier/reference fetching, no need for further queries
    if not statement_nodes_for_qualifiers_references:
        if not errors: # If no errors and no suitable bindings, it means the Q-ID has no reified statements
            logger.debug(f"No suitable statement nodes for qualifiers/references for {current_q_id}")
            return current_q_id, {"results": {"bindings": []}}, None
        else: # If errors and no suitable bindings, propagate the error
            return current_q_id, None, "\n".join(errors)

    # Query 2: Get Qualifiers for each statement node (conditional)
    if fetch_qualifiers_enabled:
        for sn_uri in list(statement_nodes_for_qualifiers_references):
            sn_entity_id = extract_entity_id_from_uri(sn_uri)

            query_qualifiers = f"""
            SELECT DISTINCT ?statementNode ?qualifierProperty ?qualifierPropertyLabel ?qualifierValue ?qualifierValueLabel
            WHERE {{
              VALUES ?statementNode {{ <{sn_uri}> }} .
              ?statementNode ?qualifierProperty ?qualifierValue .
              FILTER(STRSTARTS(STR(?qualifierProperty), "{str(PQ)}"))
              SERVICE wikibase:label {{ bd:serviceParam wikibase:language "[AUTO_LANGUAGE],de,en". }}
            }}
            """
            logger.debug(f"Executing qualifier query for {sn_entity_id} (from {current_q_id})")
            data_qual, error_qual = execute_sparql_query(query_qualifiers, current_q_id, f"{current_q_id}_{sn_entity_id}_qualifiers")
            if error_qual:
                errors.append(error_qual)
            elif data_qual:
                all_bindings.extend(data_qual["results"]["bindings"])

    # Query 3: Get References for each statement node (conditional)
    if fetch_references_enabled:
        for sn_uri in list(statement_nodes_for_qualifiers_references):
            sn_entity_id = extract_entity_id_from_uri(sn_uri)

            query_references = f"""
            SELECT DISTINCT ?statementNode ?referenceNode ?referenceProperty ?referencePropertyLabel ?referenceValue ?referenceValueLabel
            WHERE {{
              VALUES ?statementNode {{ <{sn_uri}> }} .
              ?statementNode prov:wasDerivedFrom ?referenceNode .
              ?referenceNode ?referenceProperty ?referenceValue .
              FILTER(STRSTARTS(STR(?referenceProperty), "{str(PR)}"))
              SERVICE wikibase:label {{ bd:serviceParam wikibase:language "[AUTO_LANGUAGE],de,en". }}
            }}
            """
            logger.debug(f"Executing reference query for {sn_entity_id} (from {current_q_id})")
            data_ref, error_ref = execute_sparql_query(query_references, current_q_id, f"{current_q_id}_{sn_entity_id}_references")
            if error_ref:
                errors.append(error_ref)
            elif data_ref:
                all_bindings.extend(data_ref["results"]["bindings"])

    if errors:
        return current_q_id, None, "\n".join(errors)
    else:
        return current_q_id, {"results": {"bindings": all_bindings}}, None


# --- Disjoint Set Union (DSU) for Connectivity Tracking ---
class DSU:
    """
    Implements a Disjoint Set Union data structure to track connected components.
    """
    def __init__(self, elements):
        self.parent = {elem: elem for elem in elements}
        self.rank = {elem: 0 for elem in elements}
        self.num_sets = len(elements)
        # Store initial roots for faster lookup
        self.initial_roots = {self.find(elem) for elem in elements}

    def find(self, i):
        if self.parent[i] == i:
            return i
        self.parent[i] = self.find(self.parent[i])
        return self.parent[i]

    def union(self, i, j):
        root_i = self.find(i)
        root_j = self.find(j)

        if root_i != root_j:
            if self.rank[root_i] < self.rank[root_j]:
                self.parent[root_i] = root_j
            elif self.rank[root_i] > self.rank[root_j]:
                self.parent[root_j] = root_i
            else:
                self.parent[root_j] = root_i
                self.rank[root_i] += 1
            self.num_sets -= 1
            return True
        return False


def print_connectivity_status(initial_q_ids_set, dsu):
    """
    Prints the current connectivity status of the initial set of Q-IDs.
    """
    logger.info("\nConnectivity status of initial items:")
    if dsu.num_sets == 1:
        logger.info(f"All {len(initial_q_ids_set)} initial items are currently connected.")
    else:
        logger.info(f"Still {dsu.num_sets} disconnected sets among the initial items.")
        disconnected_sets_map = {}
        for qid in initial_q_ids_set:
            root = dsu.find(qid)
            if root not in disconnected_sets_map:
                disconnected_sets_map[root] = []
            disconnected_sets_map[root].append(qid)

        for i, (root, members) in enumerate(disconnected_sets_map.items()):
            logger.info(f"  Set {i+1} (root: {root}): {', '.join(sorted(list(members)))}") # Ensure members is list for sort


def _save_rdf_graph(graph_obj, base_filename, rdf_format, is_interrupted=False):
    """Helper function to save the RDF graph to a file."""
    suffix = "_interrupted" if is_interrupted else ""
    filename_with_suffix = f"{base_filename}{suffix}"
    full_path = ""
    saved_successfully = False

    try:
        if rdf_format == 'turtle':
            full_path = f"{filename_with_suffix}.ttl"
            graph_obj.serialize(destination=full_path, format='turtle', encoding='utf-8')
        elif rdf_format == 'xml':
            full_path = f"{filename_with_suffix}.rdf"
            graph_obj.serialize(destination=full_path, format='xml', encoding='utf-8')
        elif rdf_format == 'json-ld':
            full_path = f"{filename_with_suffix}.jsonld"
            graph_obj.serialize(destination=full_path, format='json-ld', encoding='utf-8', indent=4)
        elif rdf_format == 'nt':
            full_path = f"{filename_with_suffix}.nt"
            graph_obj.serialize(destination=full_path, format='nt', encoding='utf-8')
        else:
            logger.error(f"Unsupported RDF output format: {rdf_format}. Cannot save.")
            return False
        logger.info(f"Graph saved to {full_path}")
        saved_successfully = True
    except Exception as e:
        logger.error(f"Error saving RDF file {full_path}: {e}")
    return saved_successfully


def get_wikidata_connections_rdf(q_ids_initial, output_format='turtle', output_filename='wikidata_connections', fetch_qualifiers=False, fetch_references=False, max_connections_per_node=2):
    """
    Fetches connections for a given set of Wikidata IDs, including qualifiers and references,
    iteratively expanding the search until all initial items share at least one connection
    to another of the given items, and saves results in an RDF format.

    Args:
        q_ids_initial (list): A list of Wikidata item IDs (e.g., ['Q186055', 'Q2005']).
        output_format (str): The desired RDF output format ('turtle', 'xml', 'json-ld', 'nt').
        output_filename (str): The base name for the output file (e.g., 'wikidata_connections').
        fetch_qualifiers (bool): If True, also fetches qualifier properties for statements. Default is False.
        fetch_references (bool): If True, also fetches reference properties for statements. Default is False.
        max_connections_per_node (int): The maximum number of distinct initial Q-ID components
                                        a node should connect to before its further fetching stops.
                                        Set to 0 or None to disable this optimization.
    """

    g = Graph()

    g.bind("wd", WD)
    g.bind("wdt", WDT)
    g.bind("p", P)
    g.bind("ps", PS)
    g.bind("pq", PQ)
    g.bind("pr", PR)
    g.bind("schema", SCHEMA)
    g.bind("rdfs", RDFS)
    g.bind("prov", PROV)

    initial_q_ids_set = {extract_entity_id_from_uri(q_id) for q_id in q_ids_initial if extract_entity_id_from_uri(q_id) is not None}
    initial_q_ids_set.discard(None) # Remove any None values from extraction failures

    if not initial_q_ids_set:
        logger.error("No valid initial Wikidata IDs provided. Exiting.")
        return Graph()

    dsu = DSU(initial_q_ids_set)

    # Use a set to track which Q-IDs are "satisfied" and no longer need to be fetched
    satisfied_q_ids = set()

    # Tracks the set of initial roots each node has connected to so far
    # key: node_q_id, value: set of initial roots it's connected to
    node_connected_to_roots = {q_id: {dsu.find(q_id)} for q_id in initial_q_ids_set}

    # Priority queue stores: (depth, priority_score, q_id_str)
    # depth: exploration depth
    # priority_score: 0 for high (P31/P279), 1 for normal
    priority_queue = []
    for q_id in initial_q_ids_set:
        heapq.heappush(priority_queue, (0, 0, q_id)) # Initial items: depth 0, high priority (0)

    processed_q_ids_for_fetching = set() # Tracks Q-IDs for which fetch_connections_for_q_id has been *called*
    unique_triples = set()
    failed_q_ids = []

    global results_cache
    results_cache = {}

    logger.info(f"Starting connection discovery for {len(initial_q_ids_set)} initial items...")
    logger.info(f"Initial items to connect: {initial_q_ids_set}")
    logger.info(f"Qualifier fetching is {'enabled' if fetch_qualifiers else 'disabled'}.")
    logger.info(f"Reference fetching is {'enabled' if fetch_references else 'disabled'}.")
    if max_connections_per_node > 0:
        logger.info(f"Node fetching will stop if it connects to {max_connections_per_node} or more distinct initial components.")
    else:
        logger.info("Node connection limit optimization is disabled.")

    interrupted_by_user = False

    try:
        while priority_queue and dsu.num_sets > 1:
            # Check if the shallowest item in queue exceeds max depth
            if priority_queue[0][0] >= MAX_EXPLORATION_DEPTH:
                logger.info(f"Next items in queue start at depth {priority_queue[0][0]}, "
                            f"which meets or exceeds MAX_EXPLORATION_DEPTH ({MAX_EXPLORATION_DEPTH}). Stopping exploration.")
                break

            items_for_executor = [] # List of (q_id, item_original_depth_in_queue)
            q_ids_added_to_this_batch_set = set() # To avoid duplicates within the same batch

            # Gather a batch of unique, eligible Q-IDs
            while priority_queue and len(items_for_executor) < MAX_WORKERS:
                item_depth, item_priority_score, q_id = heapq.heappop(priority_queue)

                if item_depth >= MAX_EXPLORATION_DEPTH:
                    # This item itself is too deep. Since queue is sorted by depth first,
                    # all subsequent items would also be too deep or deeper.
                    # Push back and break from batch collection.
                    heapq.heappush(priority_queue, (item_depth, item_priority_score, q_id))
                    break

                if q_id in satisfied_q_ids:
                    logger.debug(f"Item {q_id} (depth {item_depth}, prio {item_priority_score}) skipped (already satisfied).")
                    continue

                if q_id in processed_q_ids_for_fetching: # Already submitted for fetching in a *previous* batch
                    logger.debug(f"Item {q_id} (depth {item_depth}, prio {item_priority_score}) skipped (already fetched or submitted).")
                    continue

                if q_id in q_ids_added_to_this_batch_set: # Already added to *this current* batch via a path
                    logger.debug(f"Item {q_id} (depth {item_depth}, prio {item_priority_score}) skipped (already in current batch).")
                    continue

                items_for_executor.append((q_id, item_depth))
                q_ids_added_to_this_batch_set.add(q_id)
                # Mark as submitted for fetching *now* to prevent re-processing by concurrent logic or future batches
                processed_q_ids_for_fetching.add(q_id)

            if not items_for_executor:
                if not priority_queue:
                    logger.info("Priority queue is empty. No more items to process.")
                # If queue has items but all were filtered (e.g. too deep), the outer MAX_EXPLORATION_DEPTH check handles termination.
                break # No eligible items for this batch, break from main while loop.

            logger.info(f"\nProcessing batch of {len(items_for_executor)} Q-IDs. "
                        f"Current disconnected sets: {dsu.num_sets}.")
            # Log details of the batch, e.g., logger.info(f"Batch items (q_id, depth): {items_for_executor}")

            with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
                future_to_q_id_details = {
                    executor.submit(fetch_connections_for_q_id, q_id, results_cache, fetch_qualifiers, fetch_references): (q_id, item_depth_from_batch)
                    for q_id, item_depth_from_batch in items_for_executor
                }

                for future in as_completed(future_to_q_id_details):
                    q_id_processed, current_item_original_depth = future_to_q_id_details[future]
                    try:
                        result_q_id, data, error_message = future.result()
                        if error_message:
                            logger.error(f"Exception processing Q{result_q_id}: {error_message}") # Corrected logging
                            failed_q_ids.append(result_q_id)
                            continue

                        for binding in data["results"]["bindings"]:
                            if "item" in binding:
                                subject_uri = URIRef(binding["item"]["value"])
                                current_subject_q_id = extract_entity_id_from_uri(subject_uri)
                                if current_subject_q_id and current_subject_q_id.startswith('Q'):
                                    if current_subject_q_id in satisfied_q_ids:
                                        continue

                                if "itemLabel" in binding:
                                    item_label_lang = binding["itemLabel"].get("xml:lang")
                                    item_label_literal = Literal(binding["itemLabel"]["value"], lang=item_label_lang)
                                    if (subject_uri, RDFS.label, item_label_literal) not in g:
                                        g.add((subject_uri, RDFS.label, item_label_literal))
                            elif "statementNode" in binding:
                                if binding["statementNode"].get("type") in ["uri", "bnode"]:
                                    subject_uri = URIRef(binding["statementNode"]["value"])
                                    current_subject_q_id = None
                                else:
                                    logger.debug(f"Skipping binding for {result_q_id}: statementNode is not URI/BNode: {binding.get('statementNode', {}).get('value')}")
                                    continue
                            else:
                                logger.debug(f"Skipping binding for {result_q_id}: Missing 'item' and 'statementNode'.")
                                continue

                            if "statementNode" in binding and "pProperty" in binding:
                                if binding["statementNode"].get("type") in ["uri", "bnode"]:
                                    statement_node_uri = URIRef(binding["statementNode"]["value"])
                                    p_property_uri = URIRef(binding["pProperty"]["value"])

                                    if "pPropertyLabel" in binding:
                                        p_property_label_value = binding["pPropertyLabel"]["value"]
                                        p_property_label_lang = binding["pPropertyLabel"].get("xml:lang")
                                        p_property_label_literal = Literal(p_property_label_value, lang=p_property_label_lang)
                                        if (p_property_uri, RDFS.label, p_property_label_literal) not in g:
                                            g.add((p_property_uri, RDFS.label, p_property_label_literal))

                                    triple_sig_p = (str(subject_uri), str(p_property_uri), str(statement_node_uri))
                                    if triple_sig_p not in unique_triples:
                                        unique_triples.add(triple_sig_p)
                                        g.add((subject_uri, p_property_uri, statement_node_uri))

                                    if "psProperty" in binding and "statementValue" in binding:
                                        ps_property_uri = URIRef(binding["psProperty"]["value"])
                                        statement_value = get_rdf_object(binding["statementValue"])

                                        if "psPropertyLabel" in binding:
                                            ps_property_label_value = binding["psPropertyLabel"]["value"]
                                            ps_property_label_lang = binding["psPropertyLabel"].get("xml:lang")
                                            ps_property_label_literal = Literal(ps_property_label_value, lang=ps_property_label_lang)
                                            if (ps_property_uri, RDFS.label, ps_property_label_literal) not in g:
                                                g.add((ps_property_uri, RDFS.label, ps_property_label_literal))

                                        triple_sig_ps = (str(statement_node_uri), str(ps_property_uri), str(statement_value))
                                        if triple_sig_ps not in unique_triples:
                                            unique_triples.add(triple_sig_ps)
                                            g.add((statement_node_uri, ps_property_uri, statement_value))

                                        if isinstance(statement_value, URIRef):
                                            extracted_object_q_id = extract_entity_id_from_uri(statement_value)
                                            if extracted_object_q_id and extracted_object_q_id.startswith('Q'):
                                                new_item_depth_for_queue = current_item_original_depth + 1
                                                if new_item_depth_for_queue < MAX_EXPLORATION_DEPTH:
                                                    if extracted_object_q_id not in satisfied_q_ids:
                                                        is_priority_link = str(p_property_uri) in PRIORITY_PROPERTY_URIS
                                                        new_priority_score = 0 if is_priority_link else 1
                                                        heapq.heappush(priority_queue, (new_item_depth_for_queue, new_priority_score, extracted_object_q_id))
                                                        logger.debug(f"Added to queue: {extracted_object_q_id} (depth {new_item_depth_for_queue}, prio {new_priority_score}) from {current_subject_q_id} via {p_property_uri}")
                                                    else:
                                                        logger.debug(f"Not adding {extracted_object_q_id} to queue (already satisfied).")
                                                else:
                                                    logger.debug(f"Not adding {extracted_object_q_id} to queue (depth {new_item_depth_for_queue} >= max {MAX_EXPLORATION_DEPTH}).")

                                                if current_subject_q_id in initial_q_ids_set and extracted_object_q_id in initial_q_ids_set:
                                                    if dsu.union(current_subject_q_id, extracted_object_q_id):
                                                        logger.debug(f"Union formed between {current_subject_q_id} and {extracted_object_q_id} via {p_property_uri}")

                                                if current_subject_q_id in initial_q_ids_set:
                                                    if extracted_object_q_id in initial_q_ids_set: # Check if object is initial for DSU root tracking
                                                        root_of_object = dsu.find(extracted_object_q_id)
                                                        if root_of_object in dsu.initial_roots:
                                                            node_connected_to_roots.setdefault(current_subject_q_id, set()).add(root_of_object)
                                                            if max_connections_per_node > 0 and len(node_connected_to_roots[current_subject_q_id]) >= max_connections_per_node:
                                                                satisfied_q_ids.add(current_subject_q_id)
                                                                # No need to remove from priority_queue; it will be skipped when popped
                                                                logger.info(f"Node {current_subject_q_id} satisfied (connected to {len(node_connected_to_roots[current_subject_q_id])} components).")

                                                if extracted_object_q_id in initial_q_ids_set:
                                                    if current_subject_q_id in initial_q_ids_set: # Check if subject is initial for DSU root tracking
                                                        root_of_subject = dsu.find(current_subject_q_id)
                                                        if root_of_subject in dsu.initial_roots:
                                                            node_connected_to_roots.setdefault(extracted_object_q_id, set()).add(root_of_subject)
                                                            if max_connections_per_node > 0 and len(node_connected_to_roots[extracted_object_q_id]) >= max_connections_per_node:
                                                                satisfied_q_ids.add(extracted_object_q_id)
                                                                logger.info(f"Node {extracted_object_q_id} satisfied (connected to {len(node_connected_to_roots[extracted_object_q_id])} components).")

                            if fetch_qualifiers and "statementNode" in binding and "qualifierProperty" in binding and "qualifierValue" in binding and "pProperty" not in binding:
                                if binding["statementNode"].get("type") in ["uri", "bnode"]:
                                    statement_node_uri = URIRef(binding["statementNode"]["value"])
                                    qualifier_property_uri = URIRef(binding["qualifierProperty"]["value"])
                                    qualifier_value = get_rdf_object(binding["qualifierValue"])

                                    if "qualifierPropertyLabel" in binding:
                                        qualifier_property_label_value = binding["qualifierPropertyLabel"]["value"]
                                        qualifier_property_label_lang = binding["qualifierPropertyLabel"].get("xml:lang")
                                        qualifier_property_label_literal = Literal(qualifier_property_label_value, lang=qualifier_property_label_lang)
                                        if (qualifier_property_uri, RDFS.label, qualifier_property_label_literal) not in g:
                                            g.add((qualifier_property_uri, RDFS.label, qualifier_property_label_literal))

                                    triple_sig_pq = (str(statement_node_uri), str(qualifier_property_uri), str(qualifier_value))
                                    if triple_sig_pq not in unique_triples:
                                        unique_triples.add(triple_sig_pq)
                                        g.add((statement_node_uri, qualifier_property_uri, qualifier_value))

                            if fetch_references and "statementNode" in binding and "referenceNode" in binding and "referenceProperty" in binding and "referenceValue" in binding and "pProperty" not in binding:
                                if binding["statementNode"].get("type") in ["uri", "bnode"]:
                                    statement_node_uri = URIRef(binding["statementNode"]["value"])
                                    reference_node_uri = URIRef(binding["referenceNode"]["value"])
                                    reference_property_uri = URIRef(binding["referenceProperty"]["value"])
                                    reference_value = get_rdf_object(binding["referenceValue"])

                                    if "referencePropertyLabel" in binding:
                                        reference_property_label_value = binding["referencePropertyLabel"]["value"]
                                        reference_property_label_lang = binding["referencePropertyLabel"].get("xml:lang")
                                        reference_property_label_literal = Literal(reference_property_label_value, lang=reference_property_label_lang)
                                        if (reference_property_uri, RDFS.label, reference_property_label_literal) not in g:
                                            g.add((reference_property_uri, RDFS.label, reference_property_label_literal))

                                    triple_sig_prov = (str(statement_node_uri), str(PROV.wasDerivedFrom), str(reference_node_uri))
                                    if triple_sig_prov not in unique_triples:
                                        unique_triples.add(triple_sig_prov)
                                        g.add((statement_node_uri, PROV.wasDerivedFrom, reference_node_uri))

                                    triple_sig_pr = (str(reference_node_uri), str(reference_property_uri), str(reference_value))
                                    if triple_sig_pr not in unique_triples:
                                        unique_triples.add(triple_sig_pr)
                                        g.add((reference_node_uri, reference_property_uri, reference_value))

                    except Exception as exc:
                        logger.exception(f"Exception processing results for {q_id_processed}")
                        failed_q_ids.append(q_id_processed)

            logger.info(f"Finished processing batch. Disconnected initial sets remaining: {dsu.num_sets}. Triples in graph: {len(g)}")
            time.sleep(0.1) # Small pause after each batch

    except KeyboardInterrupt:
        interrupted_by_user = True
        logger.warning("\nCtrl+C detected! Will attempt to save current graph and exit.")
        # The finally block will handle saving and printing status.

    finally:
        logger.info("\n--- Processing complete or interrupted ---")
        print_connectivity_status(initial_q_ids_set, dsu)

        # Log if max depth was the reason for stopping, only if not interrupted
        if not interrupted_by_user and priority_queue and priority_queue[0][0] >= MAX_EXPLORATION_DEPTH and dsu.num_sets > 1:
            logger.warning(f"Stopped due to reaching maximum exploration depth ({MAX_EXPLORATION_DEPTH}) with {dsu.num_sets} disconnected sets remaining.")
        elif not interrupted_by_user and not priority_queue and dsu.num_sets > 1:
             logger.warning(f"Queue exhausted but {dsu.num_sets} disconnected sets remain.")


        logger.info(f"Total unique triples added to graph: {len(g)}")
        if failed_q_ids:
            logger.warning(f"The following Q-IDs failed to fetch or process completely: {list(set(failed_q_ids))}")
            logger.info("Consider investigating these IDs manually on Wikidata Query Service.")

        try:
            _save_rdf_graph(g, output_filename, output_format, is_interrupted=interrupted_by_user)
        except Exception as e: # Catch errors from the save function itself, though it logs too
            logger.error(f"Critical error during final graph save procedure: {e}")

        if interrupted_by_user:
            logger.info("Exiting program due to user interruption.")
            sys.exit(0) # Graceful exit after saving

    return g

if __name__ == "__main__":
    wikidata_ids_url = "https://christianmahnke.de/meta/wikidata/index.json"
    logger.info(f"Fetching initial Wikidata IDs from: {wikidata_ids_url}")
    wikidata_ids = get_unique_wikidata_urls(wikidata_ids_url)

    if not wikidata_ids:
        logger.error("No initial Wikidata IDs found. Exiting.")
        sys.exit(1)

    logger.info(f"Found {len(wikidata_ids)} unique Wikidata IDs to process.")

    # Example usage:
    logger.info("\n--- Running with default settings (qualifiers/references disabled, stop at 2 connections per node) ---")
    g_default = get_wikidata_connections_rdf(
        wikidata_ids,
        output_format='nt', # Using N-Triples for potentially large outputs
        output_filename='wikidata_connections_output',
        fetch_qualifiers=False, # Default, but explicit
        fetch_references=False, # Default, but explicit
        max_connections_per_node=2
    )
    logger.info(f"Graph with default settings contains {len(g_default)} triples.")

    logger.info("\n--- Script Finished ---")