import cytoscape from 'cytoscape';
import type { Store } from 'oxigraph';
import { isWikidataUri, extractQid, fetchWikidataLabels, fetchWikidataDetails } from './wikidata';

let cy: cytoscape.Core | null = null;

function shorten(uri: string): string {
  if (uri.startsWith('"')) return uri;
  const cut = Math.max(uri.lastIndexOf('#'), uri.lastIndexOf('/'));
  return cut >= 0 ? uri.substring(cut + 1) : uri;
}

interface NodeData {
  id: string;
  label: string;
  classes: string;
  properties: Map<string, string[]>;
  isWikidata: boolean;
  qid: string | null;
}

const LABEL_PREDICATES = [
  'http://schema.org/name',
  'http://schema.org/headline',
  'http://www.w3.org/2000/01/rdf-schema#label',
  'http://xmlns.com/foaf/0.1/name',
  'http://purl.org/dc/terms/title',
  'http://purl.org/dc/elements/1.1/title',
  'http://schema.org/title',
];

function findLabelInStore(store: Store, uri: string): string | null {
  for (const predicate of LABEL_PREDICATES) {
    try {
      const results = store.query(
        `SELECT ?label WHERE { <${uri}> <${predicate}> ?label } LIMIT 1`
      ) as any[];
      if (results.length > 0) {
        return results[0].get('label').value;
      }
    } catch {
      // ignore
    }
  }
  return null;
}

function findTaggedPosts(store: Store): Set<string> {
  try {
    const results = store.query(`
      PREFIX schema: <http://schema.org/>
      SELECT ?post WHERE {
        ?post schema:identifier ?ident .
        ?ident a schema:PropertyValue ;
               schema:propertyID "projektemacher" ;
               schema:value "tag" .
      }
    `) as any[];
    return new Set(results.map(b => b.get('post').value));
  } catch {
    return new Set();
  }
}

function collectNodes(results: any[], store: Store, taggedPosts: Set<string>): {
  nodeMap: Map<string, NodeData>;
  edges: cytoscape.ElementDefinition[];
} {
  const nodeMap = new Map<string, NodeData>();
  const edges: cytoscape.ElementDefinition[] = [];

  for (const binding of results) {
    const s = binding.get('s');
    const p = binding.get('p');
    const o = binding.get('o');
    const sId = s.value;

    if (!nodeMap.has(sId)) {
      const storeLabel = findLabelInStore(store, sId);
      const isTagged = taggedPosts.has(sId);

      let classes = s.termType === 'BlankNode' ? 'blank' : 'uri';
      if (isTagged) {
        classes += ' tagged';
      } else {
        classes += ' post';
      }

      nodeMap.set(sId, {
        id: sId,
        label: storeLabel ?? shorten(sId),
        classes,
        properties: new Map(),
        isWikidata: isWikidataUri(sId),
        qid: extractQid(sId)
      });
    }

    const node = nodeMap.get(sId)!;

    if (o.termType === 'Literal') {
      const key = shorten(p.value);
      if (!node.properties.has(key)) node.properties.set(key, []);
      node.properties.get(key)!.push(o.value);

      if (LABEL_PREDICATES.includes(p.value)) {
        node.label = o.value;
      }
    } else {
      const oId = o.value;

      if (!nodeMap.has(oId)) {
        const storeLabel = findLabelInStore(store, oId);
        const isTagged = taggedPosts.has(oId);

        let classes = o.termType === 'BlankNode' ? 'blank' : 'uri';
        if (isTagged) {
          classes += ' tagged';
        }

        nodeMap.set(oId, {
          id: oId,
          label: storeLabel ?? shorten(oId),
          classes,
          properties: new Map(),
          isWikidata: isWikidataUri(oId),
          qid: extractQid(oId)
        });
      }

      edges.push({
        data: { source: sId, target: oId, label: shorten(p.value) }
      });
    }
  }

  return { nodeMap, edges };
}

async function resolveWikidataLabels(nodeMap: Map<string, NodeData>): Promise<void> {
  const needsLabel = [...nodeMap.values()].filter(n =>
    n.isWikidata && n.qid && n.label === shorten(n.id)
  );

  if (needsLabel.length === 0) return;

  const qids = needsLabel.map(n => n.qid!);
  console.log(`Lade ${qids.length} Wikidata Labels…`);
  const labels = await fetchWikidataLabels(qids);

  for (const node of needsLabel) {
    const info = labels.get(node.qid!);
    if (info) {
      node.label = info.label;
      if (info.description) {
        node.properties.set('description', [info.description]);
      }
    }
    node.classes += ' wikidata';
  }
}

function buildElements(
  nodeMap: Map<string, NodeData>,
  edges: cytoscape.ElementDefinition[]
): cytoscape.ElementDefinition[] {
  const nodes: cytoscape.ElementDefinition[] = [];

  for (const node of nodeMap.values()) {
    const propLines: string[] = [];
    for (const [key, values] of node.properties) {
      for (const v of values) {
        propLines.push(`${key}: ${v}`);
      }
    }

    nodes.push({
      data: {
        id: node.id,
        label: node.label,
        properties: propLines.join('\n'),
        propertyCount: propLines.length,
        qid: node.qid
      },
      classes: node.classes
    });
  }

  return [...nodes, ...edges];
}

async function resultsToCytoscape(results: any[], store: Store): Promise<cytoscape.ElementDefinition[]> {
  const taggedPosts = findTaggedPosts(store);
  const { nodeMap, edges } = collectNodes(results, store, taggedPosts);
  await resolveWikidataLabels(nodeMap);
  return buildElements(nodeMap, edges);
}

function setupHighlighting(): void {
  if (!cy) return;

  cy.on('tap', 'node', (evt) => {
    const node = evt.target;

    cy!.elements().removeClass('highlighted connected dimmed selected-node');

    const neighborhood = node.neighborhood();
    const connected = neighborhood.add(node);

    cy!.elements().addClass('dimmed');
    connected.removeClass('dimmed');
    connected.addClass('highlighted');
    node.addClass('selected-node');
    neighborhood.edges().addClass('connected');

    console.log(`\n=== ${node.data('id')} ===`);
    console.log(node.data('label'));
    if (node.data('properties')) console.log(node.data('properties'));
    showNodeInfo(node.data());
  });

  cy.on('tap', (evt) => {
    if (evt.target === cy) {
      cy!.elements().removeClass('highlighted connected dimmed selected-node');
      const panel = document.getElementById('node-info');
      if (panel) panel.style.display = 'none';
    }
  });

  cy.on('dbltap', 'node.wikidata', async (evt) => {
    const node = evt.target;
    const qid = node.data('qid');
    if (!qid) return;

    showNodeInfo({ ...node.data(), properties: 'Lade Wikidata Details…' });

    const details = await fetchWikidataDetails(qid);
    const propLines: string[] = [];
    for (const [key, values] of details.properties) {
      for (const v of values) {
        propLines.push(`${key}: ${v}`);
      }
    }

    node.data('properties', propLines.join('\n'));
    node.data('propertyCount', propLines.length);
    showNodeInfo(node.data());
  });
}

export async function initGraph(container: HTMLElement, store: Store, query: string): Promise<cytoscape.Core> {
  const results = store.query(query) as any[];
  const elements = await resultsToCytoscape(results, store);

  cy = cytoscape({
    container,
    elements,
    style: [
      // --- Nodes: Default (grün) ---
      {
        selector: 'node',
        style: {
          'label': 'data(label)',
          'background-color': '#2ecc71',
          'color': '#e0e0e0',
          'font-size': '10px',
          'text-valign': 'bottom',
          'text-margin-y': 8,
          'width': 20,
          'height': 20,
          'text-wrap': 'wrap',
          'text-max-width': '150px',
          'min-zoomed-font-size': 4,
          'transition-property': 'background-color, opacity, width, height',
          'transition-duration': 200
        }
      },
      // --- BlogPosts (rot) ---
      {
        selector: 'node.post',
        style: {
          'background-color': '#e94560',
          'width': 25,
          'height': 25
        }
      },
      // --- Tagged Posts (gelb) ---
      {
        selector: 'node.tagged',
        style: {
          'background-color': '#f1c40f',
          'color': '#1a1a2e',
          'width': 25,
          'height': 25
        }
      },
      // --- Blank Nodes ---
      {
        selector: 'node.blank',
        style: {
          'background-color': '#888',
          'shape': 'diamond',
          'width': 15,
          'height': 15,
          'font-size': '8px',
          'color': '#aaa'
        }
      },
      // --- Wikidata Nodes ---
      {
        selector: 'node.wikidata',
        style: {
          'background-color': '#53d8fb',
          'shape': 'round-rectangle',
          'width': 'label',
          'height': 'label',
          'padding': '5px'
        }
      },
      // --- Highlighting ---
      {
        selector: 'node.dimmed',
        style: {
          'opacity': 0.2
        }
      },
      {
        selector: 'node.highlighted',
        style: {
          'opacity': 1,
          'font-weight': 'bold'
        }
      },
      {
        selector: 'node.selected-node',
        style: {
          'border-width': 3,
          'border-color': '#fff',
          'opacity': 1,
          'width': 35,
          'height': 35
        }
      },
      // --- Edges ---
      {
        selector: 'edge',
        style: {
          'label': 'data(label)',
          'font-size': '7px',
          'color': '#888',
          'line-color': '#444',
          'target-arrow-color': '#444',
          'target-arrow-shape': 'triangle',
          'curve-style': 'bezier',
          'width': 1,
          'text-rotation': 'autorotate',
          'text-margin-y': -8,
          'min-zoomed-font-size': 4,
          'transition-property': 'line-color, opacity, width',
          'transition-duration': 200
        }
      },
      {
        selector: 'edge.dimmed',
        style: {
          'opacity': 0.1
        }
      },
      {
        selector: 'edge.connected',
        style: {
          'line-color': '#ffbd39',
          'target-arrow-color': '#ffbd39',
          'width': 3,
          'opacity': 1,
          'color': '#ffbd39',
          'font-size': '9px',
          'font-weight': 'bold'
        }
      }
    ],
    layout: {
      name: 'cose',
      animate: false,
      nodeDimensionsIncludeLabels: true,
      nodeRepulsion: () => 8000,
      idealEdgeLength: () => 150,
      edgeElasticity: () => 100,
      gravity: 0.1,
      padding: 50
    } as any
  });

  setupHighlighting();
  return cy;
}

function showNodeInfo(data: any): void {
  let panel = document.getElementById('node-info');
  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'node-info';
    panel.style.cssText = `
      position: fixed; bottom: 1rem; right: 1rem;
      background: #16213e; border: 1px solid #333;
      padding: 1rem; border-radius: 5px;
      font-size: 0.8rem; max-width: 400px;
      max-height: 300px; overflow-y: auto;
      white-space: pre-wrap; font-family: monospace;
      color: #e0e0e0; z-index: 100;
    `;
    document.body.appendChild(panel);
  }

  panel.style.display = 'block';
  const lines = [data.label, data.id, ''];
  if (data.qid) lines.push(`Wikidata: ${data.qid}`);
  if (data.properties) lines.push(data.properties);
  panel.textContent = lines.join('\n');
}

export async function updateGraph(store: Store, query: string): Promise<void> {
  if (!cy) return;

  const results = store.query(query) as any[];
  const elements = await resultsToCytoscape(results, store);

  cy.elements().remove();
  cy.add(elements);
  cy.layout({
    name: 'cose',
    animate: true,
    animationDuration: 500,
    nodeDimensionsIncludeLabels: true,
    nodeRepulsion: () => 8000,
    idealEdgeLength: () => 150,
    edgeElasticity: () => 100,
    gravity: 0.1,
    padding: 50
  } as any).run();
}

export function getCy(): cytoscape.Core | null {
  return cy;
}