import init_hdt, { Hdt } from 'hdt/hdt.js';
import init_oxigraph, * as oxigraph from "oxigraph/web.js";

import wasm_hdt from 'hdt/hdt_bg.wasm'; 
import wasm_oxigraph from 'oxigraph/web_bg.wasm';

import.meta.url = '';

if (window) {
  import.meta.url = window.location.origin;
}

(async function () {
  await init_hdt({ wasm_hdt });
  await init_oxigraph({ wasm_oxigraph });
})();

function parseTerm(value: string, position: "subject" | "predicate" | "object") {
  if (value.startsWith("_:")) {
    return oxigraph.blankNode(value.slice(2));
  }

  if (position === "object" && value.startsWith('"')) {
    const lastQuote = value.lastIndexOf('"');
    if (lastQuote <= 0) return oxigraph.literal(value.slice(1));

    const text = value.substring(1, lastQuote);
    const suffix = value.substring(lastQuote + 1);

    if (suffix.startsWith("@")) {
      return oxigraph.literal(text, suffix.slice(1));
    }

    if (suffix.startsWith("^^")) {
      const dt = suffix.slice(2);
      const clean = dt.startsWith("<") && dt.endsWith(">") ? dt.slice(1, -1) : dt;
      return oxigraph.literal(text, oxigraph.namedNode(clean));
    }

    return oxigraph.literal(text);
  }

  const clean = value.startsWith("<") && value.endsWith(">") ? value.slice(1, -1) : value;
  return oxigraph.namedNode(clean);
}

export function hdtToOxigraph(hdt: Hdt): oxigraph.Store {
  const store = new oxigraph.Store();

  const ids = hdt.triple_ids_with_pattern(null, null, null);
  const strings = hdt.ids_to_strings(ids);

  for (let i = 0; i < strings.length; i += 3) {
    try {
      store.add(
        oxigraph.quad(
          parseTerm(strings[i], "subject") as any,
          parseTerm(strings[i + 1], "predicate") as any,
          parseTerm(strings[i + 2], "object") as any,
          oxigraph.defaultGraph()
        )
      );
    } catch (e) {
      console.warn("Skip:", strings[i], strings[i + 1], strings[i + 2], e);
    }
  }

  return store;
}

export async function loadHdtFromUrl(url: string): Promise<oxigraph.Store> {
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
  let hdt: Hdt;
  try {
    hdt = await new Hdt(new Uint8Array(buffer));
  } catch (parseError) {
    const message = parseError instanceof Error ? parseError.message : String(parseError);
    throw new Error(`Error parsing HDT data from "${url}" (${buffer.byteLength} bytes): ${message}`);
  }

  let store;
  store = hdtToOxigraph(hdt);
  
  hdt.free();
  return store;
}