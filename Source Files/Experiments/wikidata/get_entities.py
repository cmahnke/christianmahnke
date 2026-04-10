import os
import sys
import json
import re
import warnings
import requests
import argparse
import logging
import time
from datetime import datetime
from rdflib import Graph, URIRef, Namespace, Literal, XSD
from rdflib.namespace import RDF, RDFS

# Logging Setup
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

# Namespaces
SCHEMA_HTTP = Namespace("http://schema.org/")
SCHEMA_HTTPS = Namespace("https://schema.org/")
WD = Namespace("http://www.wikidata.org/entity/")
WDT = Namespace("http://www.wikidata.org/prop/direct/")
P = Namespace("http://www.wikidata.org/prop/")
PS = Namespace("http://www.wikidata.org/prop/statement/")
PQ = Namespace("http://www.wikidata.org/prop/qualifier/")
PR = Namespace("http://www.wikidata.org/prop/reference/")
PROV = Namespace("http://www.w3.org/ns/prov#")
WIKIBASE = Namespace("http://wikiba.se/ontology#")

# Eigener Namespace für Metadaten zum Tracking
ENRICHMENT = Namespace("urn:enrichment:")

# Wikidata SPARQL Configuration
SPARQL_URL = "https://query.wikidata.org/sparql"
SPARQL_HEADERS = {
    'User-Agent': 'BlogEntityExtractor/1.0 (https://github.com/cmahnke)',
    'Accept': 'application/sparql-results+json'
}
MAX_RETRIES = 5
RETRY_BASE_WAIT = 2
REQUEST_TIMEOUT = 30
INTER_QUERY_DELAY = 0.5
INCOMING_LIMIT = 1000

# Standard-Sprachen
DEFAULT_LANGUAGES = ['en', 'de']
ALWAYS_INCLUDE_LANG = 'mul'

# Mapping: Dateiendung → RDF-Serialisierungsformat
FORMAT_MAP = {
    '.ttl': 'turtle',
    '.jsonld': 'json-ld',
    '.json': 'json-ld',
    '.xml': 'xml',
    '.rdf': 'xml',
    '.nt': 'nt',
    '.n3': 'n3',
    '.trig': 'trig',
}

DATETIME_YEAR_MIN = 1
DATETIME_YEAR_MAX = 9999
DATETIME_YEAR_RE = re.compile(r'^(-?\d+)-')

DATE_DATATYPES = {
    str(XSD.dateTime),
    str(XSD.date),
    str(XSD.gYear),
    str(XSD.gYearMonth),
    "http://www.w3.org/2001/XMLSchema#dateTime",
    "http://www.w3.org/2001/XMLSchema#date",
    "http://www.w3.org/2001/XMLSchema#gYear",
    "http://www.w3.org/2001/XMLSchema#gYearMonth",
}

LANG_SENSITIVE_PROPERTIES = {
    'http://www.w3.org/2000/01/rdf-schema#label',
    'http://schema.org/name',
    'http://schema.org/description',
    'http://www.w3.org/2004/02/skos/core#prefLabel',
    'http://www.w3.org/2004/02/skos/core#altLabel',
    'http://schema.org/alternateName',
}

WIKIDATA_OVERRIDES_PROPERTIES = {
    URIRef('http://schema.org/name'),
    URIRef('https://schema.org/name'),
    URIRef('http://schema.org/description'),
    URIRef('https://schema.org/description'),
    URIRef('http://schema.org/alternateName'),
    URIRef('https://schema.org/alternateName'),
    URIRef('http://schema.org/image'),
    URIRef('https://schema.org/image'),
    URIRef('http://schema.org/url'),
    URIRef('https://schema.org/url'),
    URIRef('http://schema.org/sameAs'),
    URIRef('https://schema.org/sameAs'),
    URIRef('http://www.w3.org/2000/01/rdf-schema#label'),
    URIRef('http://www.w3.org/2004/02/skos/core#prefLabel'),
    URIRef('http://www.w3.org/2004/02/skos/core#altLabel'),
}

WIKIDATA_PROPERTY_PREFIXES = (
    'http://www.wikidata.org/prop/',
    'http://www.wikidata.org/entity/P',
)

# Pattern für Statement-Node-URIs
STATEMENT_NODE_RE = re.compile(
    r'^http://www\.wikidata\.org/entity/statement/'
)

# Marker-Prädikate
FETCHED_MARKER = ENRICHMENT['fetchedFrom']
FETCHED_VALUE = Literal("wikidata")

# Logger für rdflib-Warnungen
RDFLIB_TERM_LOGGER = logging.getLogger('rdflib.term')

# Regex für Property-ID-Extraktion
PROPERTY_ID_RE = re.compile(r'(P\d+)$')

# Batch-Größe für Property-Label-Abfragen
LABEL_BATCH_SIZE = 50


def is_valid_python_date(lexical_value: str, datatype: str) -> bool:
    """Prüft ob Datums-Literal in Python darstellbar ist."""
    if datatype not in DATE_DATATYPES:
        return True
    match = DATETIME_YEAR_RE.match(lexical_value)
    if not match:
        return True
    try:
        year = int(match.group(1))
    except ValueError:
        return True
    return DATETIME_YEAR_MIN <= year <= DATETIME_YEAR_MAX


def safe_literal(
    value: str,
    datatype: str | None = None,
    lang: str | None = None
) -> Literal:
    """Erzeugt sicheres rdflib Literal, unterdrückt Warnings bei extremen Daten."""
    if datatype and not is_valid_python_date(value, datatype):
        logger.debug(f"Datumswert außerhalb Python-Grenzen: '{value}'")
        previous_level = RDFLIB_TERM_LOGGER.level
        RDFLIB_TERM_LOGGER.setLevel(logging.ERROR)
        try:
            with warnings.catch_warnings():
                warnings.simplefilter("ignore")
                lit = Literal(value, datatype=URIRef(datatype))
        finally:
            RDFLIB_TERM_LOGGER.setLevel(previous_level)
        return lit

    if lang:
        return Literal(value, lang=lang)
    elif datatype:
        return Literal(value, datatype=URIRef(datatype))
    else:
        return Literal(value)


def extract_property_id(uri_str: str) -> str | None:
    """Extrahiert Property-ID (z.B. 'P31') aus Wikidata-Property-URIs."""
    match = PROPERTY_ID_RE.search(uri_str)
    if match:
        return match.group(1)
    return None


def is_statement_node(uri_str: str) -> bool:
    """Prüft ob eine URI ein Wikidata Statement-Node ist."""
    return bool(STATEMENT_NODE_RE.match(uri_str))


def extract_cached_property_ids(graph: Graph) -> set[str]:
    """Scannt Graph nach Property-IDs mit vorhandenen rdfs:label."""
    cached = set()
    for subject in graph.subjects(RDFS.label, None):
        s_str = str(subject)
        pid = extract_property_id(s_str)
        if pid:
            cached.add(pid)
    if cached:
        logger.info(
            f"Label-Cache: {len(cached)} Property-Labels "
            f"aus bestehendem Graph geladen"
        )
    return cached


def parse_sparql_binding_to_rdf(
    binding: dict,
    languages: list[str] | None = None,
    predicate_str: str | None = None
) -> URIRef | Literal | None:
    """
    Konvertiert ein einzelnes SPARQL-Ergebnis-Binding in ein
    rdflib-Objekt (URIRef oder Literal).
    Gibt None zurück wenn das Literal aufgrund von Sprachfilter
    übersprungen werden soll.
    """
    if binding['type'] == 'uri':
        return URIRef(binding['value'])
    elif binding['type'] in ('literal', 'typed-literal'):
        o_lang = binding.get('xml:lang')
        o_datatype = binding.get('datatype')
        o_value = binding['value']

        if languages and predicate_str:
            if not is_literal_in_allowed_languages(
                value=o_value,
                lang=o_lang,
                datatype=o_datatype,
                predicate=predicate_str,
                allowed_languages=languages
            ):
                return None

        return safe_literal(
            value=o_value,
            datatype=o_datatype,
            lang=o_lang
        )
    # bnode etc. → überspringen
    return None


def fetch_property_labels(
    property_ids: set[str],
    target_graph: Graph,
    languages: list[str],
    label_cache: set[str]
) -> int:
    """Ruft rdfs:label für Wikidata-Properties per Batch-SPARQL ab."""
    if not property_ids:
        return 0

    uncached = property_ids - label_cache
    if not uncached:
        logger.debug(f"  Alle {len(property_ids)} Property-Labels im Cache.")
        return 0

    logger.info(
        f"  Rufe Labels für {len(uncached)} neue Properties ab "
        f"({len(property_ids) - len(uncached)} im Cache): "
        f"{sorted(uncached)}"
    )

    all_uncached = sorted(uncached)
    total_added = 0

    for batch_start in range(0, len(all_uncached), LABEL_BATCH_SIZE):
        batch = all_uncached[batch_start:batch_start + LABEL_BATCH_SIZE]

        values_clause = " ".join(f"wd:{pid}" for pid in batch)
        lang_filter_parts = " || ".join(
            f'LANG(?label) = "{lang}"' for lang in languages
        )

        query = f"""
        PREFIX wd: <http://www.wikidata.org/entity/>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        SELECT ?prop ?label WHERE {{
            VALUES ?prop {{ {values_clause} }}
            ?prop rdfs:label ?label .
            FILTER({lang_filter_parts})
        }}
        """

        data = sparql_query_with_retry(query)
        if data is None:
            logger.error(f"  Property-Label-Batch fehlgeschlagen")
            continue

        bindings = data.get('results', {}).get('bindings', [])
        added = 0

        for result in bindings:
            prop_uri = URIRef(result['prop']['value'])
            label_value = result['label']['value']
            label_lang = result['label'].get('xml:lang')

            label = Literal(label_value, lang=label_lang) if label_lang \
                else Literal(label_value)

            triple = (prop_uri, RDFS.label, label)
            if triple not in target_graph:
                target_graph.add(triple)
                added += 1

        # Labels auf prop/direct/ URIs propagieren
        for pid in batch:
            entity_uri = URIRef(f"http://www.wikidata.org/entity/{pid}")
            direct_uri = URIRef(f"http://www.wikidata.org/prop/direct/{pid}")
            stmt_uri = URIRef(f"http://www.wikidata.org/prop/statement/{pid}")
            qual_uri = URIRef(f"http://www.wikidata.org/prop/qualifier/{pid}")
            prop_uri = URIRef(f"http://www.wikidata.org/prop/{pid}")

            for label in target_graph.objects(entity_uri, RDFS.label):
                for target_uri in (direct_uri, stmt_uri, qual_uri, prop_uri):
                    triple = (target_uri, RDFS.label, label)
                    if triple not in target_graph:
                        target_graph.add(triple)
                        added += 1

            label_cache.add(pid)

        total_added += added

        if len(all_uncached) > LABEL_BATCH_SIZE:
            time.sleep(INTER_QUERY_DELAY)

    if total_added > 0:
        logger.info(f"  → {total_added} Property-Label-Triples hinzugefügt")

    return total_added


def fetch_statement_details(
    statement_uris: set[str],
    target_graph: Graph,
    languages: list[str],
    label_cache: set[str]
) -> int:
    """
    Ruft Details (Qualifiers, Values, References) für
    Wikidata Statement-Nodes ab.

    Statement-Nodes haben die Form:
    http://www.wikidata.org/entity/statement/Q735-D2C4DD3E-...

    Sie enthalten:
    - ps:P* (Property Statement Value)
    - pq:P* (Qualifier)
    - prov:wasDerivedFrom → Reference-Nodes
    - wikibase:rank
    """
    if not statement_uris:
        return 0

    logger.info(
        f"  Rufe Details für {len(statement_uris)} Statement-Nodes ab..."
    )

    lang_filter = build_language_filter(languages)
    total_added = 0
    collected_property_ids = set()

    # Batch-Verarbeitung der Statement-URIs
    STMT_BATCH_SIZE = 20
    all_stmts = sorted(statement_uris)

    for batch_start in range(0, len(all_stmts), STMT_BATCH_SIZE):
        batch = all_stmts[batch_start:batch_start + STMT_BATCH_SIZE]

        values_clause = " ".join(f"<{uri}>" for uri in batch)

        query = f"""
        SELECT ?stmt ?p ?o WHERE {{
            VALUES ?stmt {{ {values_clause} }}
            ?stmt ?p ?o .
            {lang_filter}
        }}
        """

        data = sparql_query_with_retry(query)
        if data is None:
            logger.error(
                f"  Statement-Detail-Batch fehlgeschlagen "
                f"(Batch ab #{batch_start + 1})"
            )
            continue

        bindings = data.get('results', {}).get('bindings', [])
        added = 0

        for result in bindings:
            stmt_uri = URIRef(result['stmt']['value'])
            p_str = result['p']['value']
            p = URIRef(p_str)

            pid = extract_property_id(p_str)
            if pid:
                collected_property_ids.add(pid)

            o = parse_sparql_binding_to_rdf(
                result['o'],
                languages=languages,
                predicate_str=p_str
            )
            if o is None:
                continue

            triple = (stmt_uri, p, o)
            if triple not in target_graph:
                target_graph.add(triple)
                added += 1

        total_added += added
        time.sleep(INTER_QUERY_DELAY)

    # Property-Labels für Qualifier- und Statement-Properties
    if collected_property_ids:
        label_added = fetch_property_labels(
            collected_property_ids, target_graph,
            languages, label_cache
        )
        total_added += label_added

    if total_added > 0:
        logger.info(
            f"  → {total_added} Statement-Detail-Triples hinzugefügt"
        )

    return total_added


def is_already_fetched(uri_ref: URIRef, graph: Graph) -> bool:
    """Prüft ob für eine URI bereits Wikidata-Daten abgerufen wurden."""
    return (uri_ref, FETCHED_MARKER, FETCHED_VALUE) in graph


def mark_as_fetched(uri_ref: URIRef, graph: Graph) -> None:
    """Markiert eine URI als erfolgreich von Wikidata abgerufen."""
    graph.add((uri_ref, FETCHED_MARKER, FETCHED_VALUE))


def build_language_filter(languages: list[str]) -> str:
    """Baut SPARQL FILTER für Sprach-Einschränkung."""
    lang_conditions = " || ".join(
        f'LANG(?o) = "{lang}"' for lang in languages
    )
    return f"FILTER(!isLiteral(?o) || LANG(?o) = \"\" || {lang_conditions})"


def parse_languages(lang_string: str) -> list[str]:
    """Parst Sprach-String, stellt sicher dass 'mul' enthalten ist."""
    languages = [
        lang.strip().lower()
        for lang in lang_string.split(',')
        if lang.strip()
    ]
    if not languages:
        logger.warning(
            f"Keine gültigen Sprachen. Verwende: {DEFAULT_LANGUAGES}"
        )
        languages = DEFAULT_LANGUAGES.copy()
    if ALWAYS_INCLUDE_LANG not in languages:
        languages.append(ALWAYS_INCLUDE_LANG)
    return languages


def is_literal_in_allowed_languages(
    value: str,
    lang: str | None,
    datatype: str | None,
    predicate: str,
    allowed_languages: list[str]
) -> bool:
    """Prüft ob Literal basierend auf Sprache behalten werden soll."""
    if not lang or lang == '':
        return True
    if predicate in LANG_SENSITIVE_PROPERTIES:
        return lang in allowed_languages
    return True


def detect_rdf_format(filepath: str) -> str:
    """Erkennt RDF-Format anhand der Dateiendung."""
    ext = os.path.splitext(filepath)[1].lower()
    fmt = FORMAT_MAP.get(ext)
    if fmt is None:
        logger.warning(
            f"Unbekannte Dateiendung '{ext}'. Fallback: 'turtle'."
        )
        return 'turtle'
    return fmt


def sparql_query_with_retry(query: str) -> dict | None:
    """SPARQL-Abfrage mit Retry-Logik."""
    for attempt in range(MAX_RETRIES):
        try:
            response = requests.get(
                SPARQL_URL,
                params={'query': query},
                headers=SPARQL_HEADERS,
                timeout=REQUEST_TIMEOUT
            )

            if response.status_code == 429:
                retry_after = response.headers.get("Retry-After")
                try:
                    wait = int(retry_after) + 1 if retry_after else None
                except (ValueError, TypeError):
                    wait = None
                if wait is None:
                    wait = (RETRY_BASE_WAIT ** attempt) + 5
                logger.warning(
                    f"Rate limit (429). Warte {wait}s "
                    f"(Versuch {attempt + 1}/{MAX_RETRIES})..."
                )
                time.sleep(wait)
                continue

            if response.status_code >= 500:
                wait = (RETRY_BASE_WAIT ** attempt) + 1
                logger.warning(
                    f"Server-Fehler {response.status_code}. Warte {wait}s "
                    f"(Versuch {attempt + 1}/{MAX_RETRIES})..."
                )
                time.sleep(wait)
                continue

            response.raise_for_status()
            return response.json()

        except requests.exceptions.Timeout:
            wait = (RETRY_BASE_WAIT ** attempt) + 1
            logger.warning(f"Timeout. Warte {wait}s...")
            time.sleep(wait)

        except requests.exceptions.ConnectionError as e:
            wait = (RETRY_BASE_WAIT ** attempt) + 2
            logger.warning(f"Verbindungsfehler: {e}. Warte {wait}s...")
            time.sleep(wait)

        except Exception as e:
            logger.error(f"Unerwarteter Fehler: {e}")
            if attempt < MAX_RETRIES - 1:
                time.sleep(1)
            else:
                return None

    logger.error(f"SPARQL nach {MAX_RETRIES} Versuchen fehlgeschlagen.")
    return None


def fetch_wikidata_statements(
    uri: str,
    target_graph: Graph,
    current: int,
    total: int,
    languages: list[str],
    label_cache: set[str],
    include_statements: bool = False,
    force_update: bool = False
) -> bool:
    """
    Holt Statements + Property-Labels für eine Wikidata-URI.
    Optional auch Statement-Node-Details (Qualifiers, References).
    """
    if "wikidata.org/entity/" not in str(uri):
        logger.debug(f"Überspringe Nicht-Wikidata-URI: {uri}")
        return False

    uri_ref = URIRef(uri)

    if not force_update and is_already_fetched(uri_ref, target_graph):
        logger.info(
            f"[{current}/{total}] Überspringe {uri}: "
            f"bereits abgerufen. --force zum Neu-Laden."
        )
        return False

    logger.info(f"[{current}/{total}] Hole Wikidata-Statements für: {uri}")

    lang_filter = build_language_filter(languages)

    queries = [
        f"SELECT ?p ?o WHERE {{ <{uri}> ?p ?o . {lang_filter} }}",
        f"SELECT ?s ?p WHERE {{ ?s ?p <{uri}> }} LIMIT {INCOMING_LIMIT}"
    ]

    # Phase 1: Temp-Graph befüllen, Property-IDs und Statement-Nodes sammeln
    wikidata_graph = Graph()
    collected_property_ids = set()
    collected_statement_uris = set()

    for query_index, query in enumerate(queries):
        data = sparql_query_with_retry(query)
        if data is None:
            logger.error(
                f"Abfrage fehlgeschlagen für {uri} "
                f"({'ausgehend' if query_index == 0 else 'eingehend'})"
            )
            continue

        bindings = data.get('results', {}).get('bindings', [])
        logger.debug(
            f"  {'Ausgehend' if query_index == 0 else 'Eingehend'}: "
            f"{len(bindings)} Ergebnisse"
        )

        for result in bindings:
            if query_index == 0:
                p_str = result['p']['value']
                p = URIRef(p_str)

                pid = extract_property_id(p_str)
                if pid:
                    collected_property_ids.add(pid)

                o = parse_sparql_binding_to_rdf(
                    result['o'],
                    languages=languages,
                    predicate_str=p_str
                )
                if o is None:
                    continue

                # Statement-Node-URIs sammeln
                if (include_statements
                        and isinstance(o, URIRef)
                        and is_statement_node(str(o))):
                    collected_statement_uris.add(str(o))

                wikidata_graph.add((uri_ref, p, o))
            else:
                s = URIRef(result['s']['value'])
                p_str = result['p']['value']
                p = URIRef(p_str)

                pid = extract_property_id(p_str)
                if pid:
                    collected_property_ids.add(pid)

                wikidata_graph.add((s, p, uri_ref))

        time.sleep(INTER_QUERY_DELAY)

    # Phase 2: Override-Bereinigung
    wikidata_predicates = set(wikidata_graph.predicates(subject=uri_ref))
    override_preds = wikidata_predicates & WIKIDATA_OVERRIDES_PROPERTIES

    removed_count = 0
    if override_preds:
        for pred in override_preds:
            existing = list(target_graph.triples((uri_ref, pred, None)))
            for triple in existing:
                target_graph.remove(triple)
                removed_count += 1
        if removed_count > 0:
            logger.info(f"  → {removed_count} Override-Triples entfernt")

    # Phase 3: Wikidata-Daten einfügen
    added_count = 0
    for triple in wikidata_graph:
        if triple not in target_graph:
            target_graph.add(triple)
            added_count += 1

    # Phase 4: Statement-Node-Details abrufen (optional)
    stmt_count = 0
    if include_statements and collected_statement_uris:
        stmt_count = fetch_statement_details(
            collected_statement_uris, target_graph,
            languages, label_cache
        )

    # Phase 5: Property-Labels (mit Cache)
    label_count = 0
    if collected_property_ids:
        label_count = fetch_property_labels(
            collected_property_ids, target_graph,
            languages, label_cache
        )

    # Marker setzen
    mark_as_fetched(uri_ref, target_graph)

    graph_changed = (removed_count + added_count + label_count + stmt_count) > 0
    parts = [
        f"{added_count} hinzugefügt",
        f"{removed_count} ersetzt",
        f"{label_count} Property-Labels",
    ]
    if include_statements:
        parts.append(f"{stmt_count} Statement-Details")
    logger.info(f"  → {', '.join(parts)} für {uri}")

    return graph_changed


def load_schema_graph(input_source: str) -> Graph:
    """Lädt JSON-LD und gibt den geparsten Graph zurück."""
    g = Graph()
    try:
        if input_source.startswith(('http://', 'https://')):
            logger.info(f"Lade JSON-LD von URL: {input_source}")
            response = requests.get(input_source, timeout=REQUEST_TIMEOUT)
            response.raise_for_status()
            content = response.text
        else:
            logger.info(f"Lade JSON-LD von Datei: {input_source}")
            if not os.path.exists(input_source):
                logger.error(f"Datei nicht gefunden: {input_source}")
                sys.exit(1)
            with open(input_source, 'r', encoding='utf-8') as f:
                content = f.read()

        g.parse(data=content, format="json-ld")
        logger.info(f"{len(g)} Triples aus Eingabe geparst.")
    except requests.exceptions.RequestException as e:
        logger.error(f"Fehler beim Laden der URL: {e}")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Fehler beim Laden/Parsen: {e}")
        sys.exit(1)

    return g


def extract_about_uris(schema_graph: Graph) -> list[URIRef]:
    """Extrahiert deduplizierte 'about'-URIs aus Blog-Einträgen."""
    blogs = (
        list(schema_graph.subjects(RDF.type, SCHEMA_HTTP.Blog))
        + list(schema_graph.subjects(RDF.type, SCHEMA_HTTPS.Blog))
    )

    if not blogs:
        logger.error("KEIN Blog-Entity gefunden!")
        all_types = set(schema_graph.objects(None, RDF.type))
        if all_types:
            logger.info(f"Vorhandene Typen: {[str(t) for t in all_types]}")
        else:
            logger.warning("Keine RDF-Typ-Definitionen gefunden.")
        sys.exit(1)

    logger.info(
        f"{len(blogs)} Blog-Entities gefunden: {[str(b) for b in blogs]}"
    )

    query = """
    PREFIX s_http: <http://schema.org/>
    PREFIX s_https: <https://schema.org/>
    SELECT DISTINCT ?about WHERE {
        {
            ?blog a s_http:Blog .
            ?blog (s_http:blogPost|s_http:blogPosting) ?post .
            ?post s_http:about ?about .
        } UNION {
            ?blog a s_https:Blog .
            ?blog (s_https:blogPost|s_https:blogPosting) ?post .
            ?post s_https:about ?about .
        }
        FILTER(isURI(?about))
    }
    """

    results = schema_graph.query(query)
    seen = set()
    uris = []
    for row in results:
        uri_str = str(row.about)
        if uri_str not in seen:
            seen.add(uri_str)
            uris.append(row.about)

    return uris


def merge_graphs(target: Graph, source: Graph) -> int:
    """Mergt Triples. Gibt Anzahl neuer Triples zurück."""
    count_before = len(target)
    for triple in source:
        if triple not in target:
            target.add(triple)
    return len(target) - count_before


def save_graph(graph: Graph, output_path: str, output_format: str) -> bool:
    """Speichert den Graph."""
    try:
        graph.serialize(destination=output_path, format=output_format)
        logger.info(
            f"Graph gespeichert: {output_path} "
            f"({len(graph)} Triples, Format: {output_format})"
        )
        return True
    except Exception as e:
        logger.error(f"Fehler beim Speichern: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(
        description="Schema.org JSON-LD → Wikidata-Anreicherung"
    )
    parser.add_argument(
        "input",
        help="URL oder Pfad zur Schema.org JSON-LD Datei"
    )
    parser.add_argument(
        "-o", "--output",
        default="enriched_entities.ttl",
        help="Ausgabe-RDF-Datei (Standard: enriched_entities.ttl)"
    )
    parser.add_argument(
        "-l", "--languages",
        default=",".join(DEFAULT_LANGUAGES),
        help=(
            f"Kommaseparierte Sprachliste. "
            f"'{ALWAYS_INCLUDE_LANG}' immer eingeschlossen. "
            f"(Standard: {','.join(DEFAULT_LANGUAGES)})"
        )
    )
    parser.add_argument(
        "-s", "--statements",
        action="store_true",
        help=(
            "Statement-Node-Details (Qualifiers, References, Ranks) "
            "mit abrufen. Erzeugt deutlich mehr Daten."
        )
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Erzwingt Neu-Laden aller Wikidata-Daten."
    )
    args = parser.parse_args()

    languages = parse_languages(args.languages)
    logger.info(f"Sprach-Filter: {', '.join(languages)}")
    if args.statements:
        logger.info("Statement-Details: AKTIVIERT (mehr Daten & Abfragen)")

    output_format = detect_rdf_format(args.output)

    # ── Schritt 1: Schema.org-Daten laden ──
    schema_graph = load_schema_graph(args.input)

    # ── Schritt 2: About-URIs extrahieren ──
    about_uris = extract_about_uris(schema_graph)
    logger.info(f"{len(about_uris)} eindeutige 'about'-URIs extrahiert.")

    # ── Schritt 3: Ausgabe-Graph initialisieren ──
    result_graph = Graph()
    initial_triple_count = 0

    if os.path.exists(args.output):
        try:
            logger.info(f"Lade bestehende Daten aus {args.output}...")
            result_graph.parse(source=args.output, format=output_format)
            initial_triple_count = len(result_graph)
            logger.info(f"{initial_triple_count} Triples geladen.")
        except Exception as e:
            logger.warning(f"Konnte {args.output} nicht laden: {e}")

    # ── Schritt 4: Label-Cache initialisieren ──
    label_cache = extract_cached_property_ids(result_graph)

    # ── Schritt 5: Schema.org-Triples mergen ──
    schema_added = merge_graphs(result_graph, schema_graph)
    logger.info(
        f"{schema_added} neue Schema.org-Triples "
        f"(Gesamt: {len(result_graph)})."
    )
    graph_modified = schema_added > 0

    if not about_uris:
        logger.warning("Keine 'about'-URIs. Nur Schema.org-Daten.")
        if graph_modified or initial_triple_count == 0:
            save_graph(result_graph, args.output, output_format)
        return

    # ── Schritt 6: Wikidata-Anreicherung ──
    try:
        for i, uri in enumerate(about_uris, 1):
            if fetch_wikidata_statements(
                uri, result_graph, i, len(about_uris),
                languages=languages,
                label_cache=label_cache,
                include_statements=args.statements,
                force_update=args.force
            ):
                graph_modified = True

    except KeyboardInterrupt:
        logger.warning("Unterbrochen. Speichere Fortschritt...")
    finally:
        should_save = (
            graph_modified
            or (initial_triple_count == 0 and len(result_graph) > 0)
        )
        if should_save:
            save_graph(result_graph, args.output, output_format)
        else:
            logger.info("Keine Änderungen. Speichern übersprungen.")

    logger.info(f"Label-Cache: {len(label_cache)} Property-IDs nach Abschluss")


if __name__ == "__main__":
    main()