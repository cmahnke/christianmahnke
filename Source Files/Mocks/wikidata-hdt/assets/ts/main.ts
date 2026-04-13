import { Hdt } from "hdt/hdt.js";
import { hdtToOxigraph } from "./hdt-to-oxigraph";
import { initGraph, updateGraph, getCy } from "./graph-viz";

const status = document.getElementById("status") as HTMLDivElement;
const graphContainer = document.getElementById("graph") as HTMLDivElement;
const sparqlInput = document.getElementById("sparql-input") as HTMLTextAreaElement;
const sparqlRun = document.getElementById("sparql-run") as HTMLButtonElement;

const HDT_URL = "/meta/wikidata/enriched_entities.hdt";

let store;

function runQuery(): void {
  const query = sparqlInput.value.trim();
  if (!query) return;
  console.log("Running SPARQL query:", query);

  try {
    if (!getCy()) {
      initGraph(graphContainer, store, query);
    } else {
      updateGraph(store, query);
    }
    status.textContent = `${store.size} Quads im Store`;
  } catch (e) {
    status.textContent = `SPARQL Fehler: ${e}`;
    console.error(e);
  }
}

export async function loadHdtFromUrl(url: string): Promise<Hdt> {
  let response: Response;
  try {
    response = await fetch(url);
  } catch (networkError) {
    const message = networkError instanceof Error ? networkError.message : String(networkError);
    throw new Error(`Network error while fetching HDT file from "${url}": ${message}`);
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch HDT file from "${url}": HTTP ${response.status} ${response.statusText}`);
  }

  let buffer: ArrayBuffer;
  try {
    buffer = await response.arrayBuffer();
  } catch (readError) {
    const message = readError instanceof Error ? readError.message : String(readError);
    throw new Error(`Error reading response body from "${url}": ${message}`);
  }

  if (buffer.byteLength === 0) {
    throw new Error(`HDT file from "${url}" is empty (0 bytes)`);
  }

  try {
    return new Hdt(new Uint8Array(buffer));
  } catch (parseError) {
    const message = parseError instanceof Error ? parseError.message : String(parseError);
    throw new Error(`Error parsing HDT data from "${url}" (${buffer.byteLength} bytes): ${message}`);
  }
}

async function run() {
  console.log("Loading WASM...");
  console.log(`Loading HDT file... ${HDT_URL}`);

  let hdt: Hdt;
  try {
    hdt = await loadHdtFromUrl(HDT_URL);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`Error loading HDT file: ${message}`, "error");
    console.error("HDT load error:", error);
    return;
  }

  console.log("HDT file loaded successfully. Converting triples to store...");

  store = hdtToOxigraph(hdt);
  hdt.free();

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
