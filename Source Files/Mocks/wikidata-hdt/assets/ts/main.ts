//import { Hdt } from "hdt/hdt.js";
//import { hdtToOxigraph } from "./hdt-to-oxigraph";
import * as oxigraph from "oxigraph/web.js";
import { loadHdtFromUrl } from "./loader";
import { initGraph, updateGraph, getCy } from "./graph-viz";

const status = document.getElementById("status") as HTMLDivElement;
const graphContainer = document.getElementById("graph") as HTMLDivElement;
const sparqlInput = document.getElementById("sparql-input") as HTMLTextAreaElement;
const sparqlRun = document.getElementById("sparql-run") as HTMLButtonElement;

const HDT_URL = "/meta/wikidata/enriched_entities.hdt";

const DEFAULT_QUERY = `PREFIX schema: <http://schema.org/>

SELECT ?s ?p ?o ?isTagged WHERE {
  <https://christianmahnke.de/post/> schema:blogPost ?post .
  ?post ?p ?o .
  BIND(?post AS ?s)
  FILTER(?p NOT IN (
    schema:author,
    schema:url,
    schema:workTranslation,
    <http://www.w3.org/1999/02/22-rdf-syntax-ns#type>
  ))
  FILTER(?o NOT IN (
    schema:BlogPosting
  ))
  OPTIONAL {
    ?post schema:identifier ?ident .
    ?ident a schema:PropertyValue ;
           schema:propertyID "projektemacher" ;
           schema:value "tag" .
    BIND(true AS ?isTagged)
  }
} `;

sparqlInput.value = DEFAULT_QUERY;

let store: oxigraph.Store;

async function runQuery(): Promise<void> {
  const query = sparqlInput.value.trim();
  if (!query) return;
  console.log("Running SPARQL query:", query);

  try {
    if (!getCy()) {
      await initGraph(graphContainer, store, query, ['mul', 'de', 'en']);
    } else {
      await updateGraph(store, query);
    }
    status.textContent = `${store.size} Quads im Store`;
  } catch (e) {
    status.textContent = `SPARQL Fehler: ${e}`;
    console.error(e);
  }
}

async function run() {
  console.log("Loading WASM...");
  console.log(`Loading HDT file... ${HDT_URL}`);

  try {
    store = await loadHdtFromUrl(HDT_URL);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`Error loading HDT file: ${message}`, "error");
    console.error("HDT load error:", error);
    return;
  }

  console.log("HDT file loaded successfully. Converting triples to store...");

  console.log(`Dataset conversion complete. Store: ${store.size} Quads. Ready for visualization.`);

  sparqlRun.addEventListener("click", runQuery);

  sparqlInput.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.key === "Enter") {
      runQuery();
    }
  });

  runQuery();
  sparqlRun.disabled = false;
}

run();
