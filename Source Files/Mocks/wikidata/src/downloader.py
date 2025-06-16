import requests
import json
import time
from rdflib import Graph, Literal, URIRef, Namespace
from rdflib.namespace import RDF, RDFS, XSD
from datetime import datetime
from decimal import Decimal # Import Decimal to handle potential Decimal objects
from concurrent.futures import ThreadPoolExecutor, as_completed # Import for parallel processing
import sys # To exit cleanly after saving

# Define common Wikidata namespaces
WD = Namespace("http://www.wikidata.org/entity/")
WDT = Namespace("http://www.wikidata.org/prop/direct/")
SCHEMA = Namespace("http://schema.org/")
PROV = Namespace("http://www.w3.org/ns/prov#")

# Global headers for requests
REQUEST_HEADERS = {
    "Accept": "application/sparql-results+json",
    "User-Agent": "WikidataRDFConnectionsFetcher/1.0 (Python - Dynamic Depth Connectivity)"
}

# --- Retry Configuration ---
MAX_RETRIES = 3
RETRY_DELAY_SECONDS = 5 # Wait 5 seconds before retrying
MAX_WORKERS = 10 # Number of concurrent threads for API calls

# Safety net: Maximum depth to explore even if connectivity isn't achieved
# Prevents infinite loops for truly disconnected or very deeply connected items.
MAX_EXPLORATION_DEPTH = 5

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
    return None

def fetch_connections_for_q_id(current_q_id):
    """
    Helper function to fetch connections for a single Q-ID.
    This function will be run in parallel.
    """
    SPARQL_ENDPOINT = "https://query.wikidata.org/sparql"

    sparql_query = f"""
    SELECT ?item ?itemLabel ?property ?propertyLabel ?value WHERE {{
      BIND(wd:{current_q_id} AS ?item)
      ?item ?property ?value .

      BIND(STR(?property) AS ?propString)
      FILTER(STRSTARTS(?propString, "http://www.wikidata.org/prop/direct/"))

      SERVICE wikibase:label {{
        bd:serviceParam wikibase:language "[AUTO_LANGUAGE],de,en".
        ?item rdfs:label ?itemLabel.
        ?property rdfs:label ?propertyLabel.
      }}
    }}
    """

    retries = 0
    while retries < MAX_RETRIES:
        try:
            response = requests.post(SPARQL_ENDPOINT, data={"query": sparql_query}, headers=REQUEST_HEADERS)
            response.raise_for_status()
            return current_q_id, response.json(), None # Success: return q_id, data, and no error
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 500:
                print(f"  !! Server Error (500) for {current_q_id} (Attempt {retries + 1}/{MAX_RETRIES}): {e}")
                print(f"  Response content: {e.response.text}")
                retries += 1
                if retries < MAX_RETRIES:
                    time.sleep(RETRY_DELAY_SECONDS)
            else:
                return current_q_id, None, f"Error fetching data for {current_q_id}: {e} (Content: {e.response.text})"
        except (requests.exceptions.RequestException, json.JSONDecodeError) as e:
            print(f"  Network/JSON Error for {current_q_id} (Attempt {retries + 1}/{MAX_RETRIES}): {e}")
            retries += 1
            if retries < MAX_RETRIES:
                time.sleep(RETRY_DELAY_SECONDS)
            else:
                return current_q_id, None, f"Max retries reached for {current_q_id}. Skipping. Error: {e}"

    return current_q_id, None, f"Failed to fetch data for {current_q_id} after {MAX_RETRIES} retries."


# --- Disjoint Set Union (DSU) for Connectivity Tracking ---
class DSU:
    """
    Implements a Disjoint Set Union data structure to track connected components.
    """
    def __init__(self, elements):
        # Each element initially points to itself (its own set)
        self.parent = {elem: elem for elem in elements}
        # Rank/size for optimization (union by rank/size)
        self.rank = {elem: 0 for elem in elements}
        # Number of disjoint sets
        self.num_sets = len(elements)

    def find(self, i):
        """
        Finds the representative (root) of the set containing element i.
        Uses path compression for optimization.
        """
        if self.parent[i] == i:
            return i
        # Path compression: make current node point directly to root
        self.parent[i] = self.find(self.parent[i])
        return self.parent[i]

    def union(self, i, j):
        """
        Merges the sets containing elements i and j.
        Returns True if a merge occurred, False if they were already in the same set.
        Uses union by rank for optimization.
        """
        root_i = self.find(i)
        root_j = self.find(j)

        if root_i != root_j:
            # Union by rank: attach smaller rank tree under root of higher rank tree
            if self.rank[root_i] < self.rank[root_j]:
                self.parent[root_i] = root_j
            elif self.rank[root_i] > self.rank[root_j]:
                self.parent[root_j] = root_i
            else:
                self.parent[root_j] = root_i
                self.rank[root_i] += 1
            self.num_sets -= 1 # Decrement number of disjoint sets
            return True # A merge happened
        return False # No merge (already in the same set)


def get_wikidata_connections_rdf(q_ids_initial, output_format='turtle', output_filename='wikidata_connections'):
    """
    Fetches direct connections for a given set of Wikidata IDs, iteratively expanding
    the search until all initial items share at least one connection to another of the given items,
    and saves results in an RDF format.

    Args:
        q_ids_initial (list): A list of Wikidata item IDs (e.g., ['Q186055', 'Q2005']).
        output_format (str): The desired RDF output format ('turtle', 'xml', 'json-ld', 'nt').
        output_filename (str): The base name for the output file (e.g., 'wikidata_connections').
    """

    g = Graph()

    g.bind("wd", WD)
    g.bind("wdt", WDT)
    g.bind("schema", SCHEMA)
    g.bind("rdfs", RDFS)
    g.bind("prov", PROV)

    # Clean and store the initial Q-IDs as a set for efficient lookups
    initial_q_ids_set = {extract_entity_id_from_uri(q_id) for q_id in q_ids_initial if extract_entity_id_from_uri(q_id) is not None}

    # Initialize DSU for connectivity tracking among ONLY the initial_q_ids
    dsu = DSU(initial_q_ids_set)

    # queue_dict will manage which Q-IDs to process at the current depth
    # It stores {q_id: depth} for items we need to explore
    queue_dict = {q_id: 0 for q_id in initial_q_ids_set}

    # processed_q_ids keeps track of all Q-IDs for which we've *started* fetching connections
    # to avoid redundant SPARQL queries.
    processed_q_ids = set()
    unique_triples = set() # To store string representations of triples to avoid duplicates in the RDF graph
    failed_q_ids = [] # To log Q-IDs that failed to fetch after retries

    print(f"Starting connection discovery for {len(initial_q_ids_set)} initial items...")
    print(f"Initial items to connect: {initial_q_ids_set}")

    current_depth = 0
    # The loop continues as long as:
    # 1. There are still Q-IDs to explore (`queue_dict` is not empty).
    # 2. Not all initial Q-IDs are connected (`dsu.num_sets > 1`).
    # 3. We haven't exceeded the MAX_EXPLORATION_DEPTH (safety measure).
    try:
        while queue_dict and dsu.num_sets > 1 and current_depth < MAX_EXPLORATION_DEPTH:
            # Get Q-IDs to process at the current depth
            q_ids_at_current_depth = [q_id for q_id, depth in queue_dict.items() if depth == current_depth]

            if not q_ids_at_current_depth:
                current_depth += 1
                continue # No items at this depth, move to the next

            print(f"\nProcessing {len(q_ids_at_current_depth)} Q-IDs at depth {current_depth}...")
            print(f"  Current number of disconnected sets among initial items: {dsu.num_sets}")

            q_ids_to_process_this_depth_unique = []
            for qid in q_ids_at_current_depth:
                if qid not in processed_q_ids:
                    q_ids_to_process_this_depth_unique.append(qid)
                    processed_q_ids.add(qid)
                # Remove from queue_dict once it's been selected for processing at this depth
                if qid in queue_dict:
                    del queue_dict[qid]

            if not q_ids_to_process_this_depth_unique:
                current_depth += 1
                continue # All items at this depth already processed, move to the next

            with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
                future_to_q_id = {executor.submit(fetch_connections_for_q_id, q_id): q_id for q_id in q_ids_to_process_this_depth_unique}

                for future in as_completed(future_to_q_id):
                    q_id_processed = future_to_q_id[future]
                    try:
                        result_q_id, data, error_message = future.result()
                        if error_message:
                            print(f"  Error for {result_q_id}: {error_message}")
                            failed_q_ids.append(result_q_id)
                            continue

                        # Process the fetched data
                        for binding in data["results"]["bindings"]:
                            subject_uri = URIRef(binding["item"]["value"])
                            predicate_uri = URIRef(binding["property"]["value"])

                            # Add labels
                            item_label_lang = binding["itemLabel"].get("xml:lang")
                            item_label_literal = Literal(binding["itemLabel"]["value"], lang=item_label_lang)
                            g.add((subject_uri, RDFS.label, item_label_literal))

                            property_label_lang = binding["propertyLabel"].get("xml:lang")
                            property_label_literal = Literal(binding["propertyLabel"]["value"], lang=property_label_lang)
                            g.add((predicate_uri, RDFS.label, property_label_literal))

                            value_data = binding["value"]

                            object_literal_for_graph = None # This will be the actual literal added to the graph
                            object_uri = None # Initialize for URI type if needed

                            if value_data["type"] == "uri":
                                object_uri = URIRef(value_data["value"])
                                triple_to_add = (subject_uri, predicate_uri, object_uri)

                                object_for_set = str(object_uri) # For URIs, use their string representation for the set

                                extracted_object_q_id = extract_entity_id_from_uri(object_uri)

                                # Add new Q-IDs to the queue for next depth, if they haven't been processed
                                # and we are within the maximum exploration depth
                                if extracted_object_q_id and extracted_object_q_id.startswith('Q') and \
                                   extracted_object_q_id not in processed_q_ids and \
                                   (current_depth + 1) < MAX_EXPLORATION_DEPTH:
                                    queue_dict[extracted_object_q_id] = current_depth + 1

                                # Check for connectivity between initial Q-IDs using DSU
                                subject_q_id = extract_entity_id_from_uri(subject_uri)
                                if subject_q_id in initial_q_ids_set and \
                                   extracted_object_q_id in initial_q_ids_set and \
                                   subject_q_id != extracted_object_q_id:
                                    dsu.union(subject_q_id, extracted_object_q_id)

                            else: # It's a literal
                                literal_value = value_data["value"]
                                literal_datatype_uri = value_data.get("datatype")

                                if literal_datatype_uri:
                                    try:
                                        object_literal_for_graph = Literal(literal_value, datatype=URIRef(literal_datatype_uri))
                                    except ValueError as ve:
                                        # Specific handling for xsd:dateTime "Invalid isoformat string"
                                        if "Invalid isoformat string" in str(ve) and literal_datatype_uri == str(XSD.dateTime):
                                            print(f"  Warning: Failed to convert xsd:dateTime literal '{literal_value}' due to invalid isoformat. Storing as plain string.")
                                            object_literal_for_graph = Literal(literal_value) # Fallback to plain string
                                        else:
                                            # For other ValueErrors, or if not specific date error, store as plain string
                                            print(f"  Warning: Failed to convert literal '{literal_value}' with datatype '{literal_datatype_uri}' (ValueError: {ve}). Storing as plain string.")
                                            object_literal_for_graph = Literal(literal_value)
                                    except Exception as e:
                                        # Catch any other unexpected conversion errors (e.g., related to Decimal if they arise here)
                                        print(f"  Warning: Unexpected error converting literal '{literal_value}' with datatype '{literal_datatype_uri}': {e}. Storing as plain string.")
                                        object_literal_for_graph = Literal(literal_value)
                                else:
                                    object_literal_for_graph = Literal(literal_value)

                                triple_to_add = (subject_uri, predicate_uri, object_literal_for_graph)

                                # For literals, use rdflib's string representation for the set signature
                                # This handles Decimal, datetime, and other types gracefully for uniqueness check
                                object_for_set = str(object_literal_for_graph)

                            # Create a unique signature for the triple to add to the unique_triples set
                            current_triple_signature = (str(subject_uri), str(predicate_uri), object_for_set)

                            if current_triple_signature not in unique_triples:
                                unique_triples.add(current_triple_signature)
                                g.add(triple_to_add)

                    except Exception as exc:
                        print(f"  Exception processing {q_id_processed}: {exc}")
                        failed_q_ids.append(q_id_processed)

            print(f"    Finished processing depth {current_depth}. Disconnected initial sets remaining: {dsu.num_sets}. Total triples in graph: {len(g)}")
            current_depth += 1
            time.sleep(0.5) # Small delay between depth processing rounds

    except KeyboardInterrupt:
        print("\nCtrl+C detected! Attempting to save current graph before exiting...")
        try:
            if output_format == 'turtle':
                g.serialize(destination=f"{output_filename}_interrupted.ttl", format='turtle', encoding='utf-8')
                print(f"Graph saved to {output_filename}_interrupted.ttl")
            elif output_format == 'xml':
                g.serialize(destination=f"{output_filename}_interrupted.rdf", format='xml', encoding='utf-8')
                print(f"Graph saved to {output_filename}_interrupted.rdf (RDF/XML)")
            elif output_format == 'json-ld':
                g.serialize(destination=f"{output_filename}_interrupted.jsonld", format='json-ld', encoding='utf-8', indent=4)
                print(f"Graph saved to {output_filename}_interrupted.jsonld")
            elif output_format == 'nt':
                g.serialize(destination=f"{output_filename}_interrupted.nt", format='nt', encoding='utf-8')
                print(f"Graph saved to {output_filename}_interrupted.nt (N-Triples)")
            else:
                print(f"Unsupported RDF output format: {output_format}. Cannot save on interrupt.")
        except Exception as save_err:
            print(f"Error during interrupted save: {save_err}")
        finally:
            print("Exiting program.")
            sys.exit(0) # Exit cleanly after saving

    finally: # This block will always execute whether completed or interrupted
        print(f"\nFinished fetching connections.")
        if dsu.num_sets == 1:
            print(f"SUCCESS: All {len(initial_q_ids_set)} initial items are now connected within {current_depth} depths.")
        else:
            print(f"STOPPED: Could not connect all initial items after exploring up to depth {current_depth}.")
            print(f"Remaining {dsu.num_sets} disconnected sets among initial items.")
            if current_depth >= MAX_EXPLORATION_DEPTH:
                 print(f"Reached maximum exploration depth ({MAX_EXPLORATION_DEPTH}) without connecting all initial items.")
            # Optionally, you can print which items are still disconnected
            # for root_id in dsu.parent:
            #     if root_id in initial_q_ids_set and dsu.parent[root_id] == root_id:
            #         members = [k for k, v in dsu.parent.items() if dsu.find(k) == root_id and k in initial_q_ids_set]
            #         if members:
            #             print(f"  Still disconnected set (root: {root_id}): {members}")


        print(f"Total unique triples added to graph: {len(g)}")
        if failed_q_ids:
            print(f"The following Q-IDs failed to fetch after {MAX_RETRIES} retries: {failed_q_ids}")
            print("Consider investigating these IDs manually on Wikidata Query Service.")

        # If the script completes without KeyboardInterrupt, save the final graph
        if not sys.exc_info()[0] == KeyboardInterrupt: # Check if no KeyboardInterrupt occurred
            try:
                if output_format == 'turtle':
                    g.serialize(destination=f"{output_filename}.ttl", format='turtle', encoding='utf-8')
                    print(f"Results saved to {output_filename}.ttl")
                elif output_format == 'xml':
                    g.serialize(destination=f"{output_filename}.rdf", format='xml', encoding='utf-8')
                    print(f"Results saved to {output_filename}.rdf (RDF/XML)")
                elif output_format == 'json-ld':
                    g.serialize(destination=f"{output_filename}.jsonld", format='json-ld', encoding='utf-8', indent=4)
                    print(f"Results saved to {output_filename}.jsonld")
                elif output_format == 'nt':
                    g.serialize(destination=f"{output_filename}.nt", format='nt', encoding='utf-8')
                    print(f"Results saved to {output_filename}.nt (N-Triples)")
                else:
                    print(f"Unsupported RDF output format: {output_format}. Please choose 'turtle', 'xml', 'json-ld', or 'nt'.")
            except Exception as e:
                print(f"Error saving RDF file: {e}")

    return g

if __name__ == "__main__":
    your_wikidata_ids = [
        "Q186055", "Q114900810", "Q2005", "Q191529", "Q105134737", "Q1551026", "Q22682088", "Q2893296",
        "Q2858103", "Q2013", "Q54871", "Q24415127", "Q3011087", "Q451553", "Q43379500", "Q316390",
        "Q594150", "Q3305213", "Q735", "Q621630", "Q1340077", "Q24045714", "Q56298708", "Q751808",
        "Q722609", "Q166118", "Q843958", "Q212805", "Q180160", "Q1124860", "Q16206135", "Q720832",
        "Q2031121", "Q1233206", "Q372145", "Q210349", "Q2080143", "Q43464", "Q4385141", "Q3649859",
        "Q1887991", "Q3060903", "Q20379540", "Q48995686", "Q5632983", "Q11979809", "Q3378551", "Q1693140",
        "Q21127617", "Q3655111", "Q562161", "Q4410121", "Q2567251", "Q104789876", "Q872210", "Q10513217",
        "Q1408834", "Q4442824", "Q5635423", "Q1744526", "Q647854", "Q840112", "Q6138279", "Q1474340",
        "Q26384", "Q309", "Q223557", "Q52150547", "Q18761202", "Q695684", "Q18218093", "Q6477113",
        "Q12688575", "Q545449", "Q1208235", "Q473236", "Q3921111", "Q18219090", "Q29373725", "Q464980",
        "Q118496507", "Q628106", "Q121923035", "Q1711347", "Q8180985", "Q11660", "Q69883", "Q12271",
        "Q638608", "Q392142", "Q1286", "Q46384", "Q828468", "Q1133767", "Q631074", "Q54150",
        "Q113579711", "Q34316", "Q853715", "Q131611742", "Q917830", "Q957441", "Q175117", "Q4449979",
        "Q220951", "Q2060711", "Q2588167", "Q652464", "Q747658", "Q133274", "Q93184", "Q131617370",
        "Q479361", "Q1797167", "Q1339814", "Q269174", "Q21014973", "Q19809", "Q22060043", "Q484031",
        "Q9128", "Q625994", "Q76632556", "Q4925992", "Q9440", "Q160236", "Q27986619", "Q202833",
        "Q2985103", "Q10806", "Q19399674", "Q978185", "Q84363917", "Q105241486", "Q732068", "Q731994",
        "Q203241", "Q903816", "Q258031", "Q1283", "Q426196", "Q125928", "Q11391", "Q221163",
        "Q106239881", "Q980672", "Q3525922", "Q190149", "Q27153", "Q1952321", "Q112821333", "Q4363806",
        "Q1145251", "Q1559234", "Q44252", "Q1576316", "Q2195", "Q11376888", "Q75837421", "Q830106",
        "Q1686799", "Q27302", "Q15206305", "Q216293", "Q2985668", "Q197520", "Q165277", "Q123150615",
        "Q614417", "Q67104687", "Q389525", "Q1793892", "Q35158", "Q17558104", "Q7999615", "Q2940499",
        "Q3010266", "Q1449047", "Q27557512", "Q1793574", "Q1581234", "Q2063", "Q94634912", "Q22669857",
        "Q860605", "Q2264545", "Q279925", "Q1281055", "Q574625", "Q9531", "Q1265692", "Q129172",
        "Q294860", "Q1608217", "Q125191", "Q15447320", "Q4048975", "Q181233", "Q1423114", "Q1406",
        "Q95259741", "Q63485369", "Q7109791", "Q114785326", "Q133818614", "Q364", "Q2430433", "Q94743711",
        "Q1618449", "Q313301", "Q936", "Q28720313", "Q1337843", "Q2814", "Q115536963", "Q1685508",
        "Q42332", "Q603967", "Q92703", "Q47092600", "Q539508", "Q504453", "Q152838", "Q564783",
        "Q195076", "Q209330", "Q72885392", "Q116233196", "Q66137", "Q571"
    ]

    # Max depth parameter is removed from the get_wikidata_connections_rdf function call
    # because it's now dynamically determined by the DSU and MAX_EXPLORATION_DEPTH.
    g_dynamic_depth = get_wikidata_connections_rdf(your_wikidata_ids, output_format='turtle', output_filename='wikidata_dynamic_depth_connections_rdf_parallel_savable')

    print("\n--- Script Finished ---")
    if g_dynamic_depth:
        print(f"Final graph contains {len(g_dynamic_depth)} triples.")
