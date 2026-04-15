import './viz/graph-viz';
import type { RdfGraph } from './viz/graph-viz';

const status = document.getElementById('status') as HTMLDivElement;
const sparqlInput = document.getElementById('sparql-input') as HTMLTextAreaElement;
const sparqlRun = document.getElementById('sparql-run') as HTMLButtonElement;
const rdfGraph = document.querySelector('rdf-graph') as RdfGraph;

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

function runQuery(): void {
  const query = sparqlInput.value.trim();
  if (!query) return;
  console.log('Running SPARQL query:', query);
  rdfGraph.sparqlQuery = query;
}

// --- Component events ---

rdfGraph.addEventListener('store-loaded', ((e: CustomEvent) => {
  status.textContent = `${e.detail.quadCount} Quads im Store`;
  sparqlRun.disabled = false;
  runQuery();
}) as EventListener);

rdfGraph.addEventListener('load-error', ((e: CustomEvent) => {
  status.textContent = `Fehler: ${e.detail.error}`;
}) as EventListener);

rdfGraph.addEventListener('graph-ready', ((e: CustomEvent) => {
  console.log('Graph ready, quads:', e.detail.quadCount);
}) as EventListener);

rdfGraph.addEventListener('node-selected', ((e: CustomEvent) => {
  console.log(`\n=== ${e.detail.id} ===`);
  console.log(e.detail.label);
  if (e.detail.properties) console.log(e.detail.properties);
}) as EventListener);

rdfGraph.addEventListener('node-expanded', (() => {
  status.textContent = `${rdfGraph.quadCount} Quads im Store`;
}) as EventListener);

// --- UI bindings ---

sparqlRun.addEventListener('click', runQuery);

sparqlInput.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'Enter') {
    runQuery();
  }
});