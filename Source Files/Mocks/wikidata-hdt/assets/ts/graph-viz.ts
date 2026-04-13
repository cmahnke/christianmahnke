import cytoscape from 'cytoscape';
import type { Store } from 'oxigraph';
import { isWikidataUri, extractQid, fetchWikidataLabels, fetchWikidataDetails } from './wikidata';
import oxigraph from 'oxigraph';

let cy: cytoscape.Core | null = null;
let currentLanguages: string[] = ['de', 'en'];
let currentStore: Store | null = null;

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

function findLabelInStore(store: Store, uri: string, languages: string[]): string | null {
  // Nur explizit gewünschte Sprachen, NICHT mul
  const langChain = [...new Set([...languages, 'en'])];

  for (const predicate of LABEL_PREDICATES) {
    for (const lang of langChain) {
      try {
        const results = store.query(
          `SELECT ?label WHERE {
            <${uri}> <${predicate}> ?label .
            FILTER(LANG(?label) = "${lang}")
          } LIMIT 1`
        ) as any[];
        if (results.length > 0) {
          return results[0].get('label').value;
        }
      } catch { /* ignore */ }
    }

    // Fallback: Label ohne Sprach-Tag (aber nicht mul)
    try {
      const results = store.query(
        `SELECT ?label WHERE {
          <${uri}> <${predicate}> ?label .
          FILTER(LANG(?label) = "" || LANG(?label) IN (${langChain.map(l => `"${l}"`).join(',')}))
        } LIMIT 1`
      ) as any[];
      if (results.length > 0) {
        return results[0].get('label').value;
      }
    } catch { /* ignore */ }
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

function collectNodes(results: any[], store: Store, taggedPosts: Set<string>, languages: string[]): {
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
      const storeLabel = findLabelInStore(store, sId, languages);
      const isTagged = taggedPosts.has(sId);
      const isWd = isWikidataUri(sId);

      let classes = s.termType === 'BlankNode' ? 'blank' : 'uri';
      if (isTagged) classes += ' tagged';
      else classes += ' post';
      if (isWd) classes += ' wikidata';

      nodeMap.set(sId, {
        id: sId,
        label: storeLabel ?? shorten(sId),
        classes,
        properties: new Map(),
        isWikidata: isWd,
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
        const storeLabel = findLabelInStore(store, oId, languages);
        const isTagged = taggedPosts.has(oId);
        const isWd = isWikidataUri(oId);

        let classes = o.termType === 'BlankNode' ? 'blank' : 'uri';
        if (isTagged) classes += ' tagged';
        if (isWd) classes += ' wikidata';

        nodeMap.set(oId, {
          id: oId,
          label: storeLabel ?? shorten(oId),
          classes,
          properties: new Map(),
          isWikidata: isWd,
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

async function resolveWikidataLabels(nodeMap: Map<string, NodeData>, languages: string[]): Promise<void> {
  const needsLabel = [...nodeMap.values()].filter(n =>
    n.isWikidata && n.qid && n.label === shorten(n.id)
  );

  if (needsLabel.length === 0) return;

  const qids = needsLabel.map(n => n.qid!);
  console.log(`Lade ${qids.length} Wikidata Labels (${languages.join(', ')})…`);
  const labels = await fetchWikidataLabels(qids, languages);

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

async function resultsToCytoscape(results: any[], store: Store, languages: string[]): Promise<cytoscape.ElementDefinition[]> {
  const taggedPosts = findTaggedPosts(store);
  const { nodeMap, edges } = collectNodes(results, store, taggedPosts, languages);
  await resolveWikidataLabels(nodeMap, languages);
  return buildElements(nodeMap, edges);
}

async function expandWikidataNode(nodeId: string, qid: string): Promise<void> {
  if (!cy || !currentStore) return;

  const node = cy.getElementById(nodeId);
  if (node.hasClass('expanded')) return;

  node.data('label', node.data('label') + ' ⏳');

  try {
    const details = await fetchWikidataDetails(qid, currentLanguages);

    // Properties im Info sammeln
    const propLines: string[] = [];
    const linkedEntities: { predicate: string; qid: string; uri: string }[] = [];

    for (const [key, values] of details.properties) {
      for (const v of values) {
        propLines.push(`${key}: ${v}`);

        // Wikidata-Entity-Links erkennen
        const linkedQid = v.match(/^(Q\d+)$/)?.[1]
          ?? v.match(/wikidata\.org\/entity\/(Q\d+)/)?.[1];

        if (linkedQid) {
          linkedEntities.push({
            predicate: key,
            qid: linkedQid,
            uri: `http://www.wikidata.org/entity/${linkedQid}`
          });
        }
      }
    }

    // Labels für verlinkte Entities laden
    if (linkedEntities.length > 0) {
      const linkedQids = linkedEntities.map(e => e.qid);
      const labels = await fetchWikidataLabels(linkedQids, currentLanguages);

      const newElements: cytoscape.ElementDefinition[] = [];

      for (const linked of linkedEntities) {
        const targetId = linked.uri;
        const info = labels.get(linked.qid);
        const label = info?.label ?? linked.qid;

        // Node hinzufügen falls nicht vorhanden
        if (!cy.getElementById(targetId).length) {
          newElements.push({
            data: {
              id: targetId,
              label,
              properties: info?.description ?? '',
              qid: linked.qid
            },
            classes: 'uri wikidata'
          });

          // Auch in den Oxigraph Store
          try {
            currentStore.add(oxigraph.quad(
              oxigraph.namedNode(nodeId),
              oxigraph.namedNode(`http://www.wikidata.org/prop/${linked.predicate}`),
              oxigraph.namedNode(targetId),
              oxigraph.namedNode('http://www.wikidata.org/')
            ));
          } catch { /* ignore */ }
        }

        // Edge hinzufügen
        const edgeId = `${nodeId}__${linked.predicate}__${targetId}`;
        if (!cy.getElementById(edgeId).length) {
          newElements.push({
            data: {
              id: edgeId,
              source: nodeId,
              target: targetId,
              label: linked.predicate
            }
          });
        }
      }

      if (newElements.length > 0) {
        cy.add(newElements);

        // Layout nur für neue + benachbarte Knoten
        const neighborhood = node.neighborhood().add(node);
        neighborhood.layout({
          name: 'cose',
          animate: true,
          animationDuration: 300,
          fit: false,
          nodeDimensionsIncludeLabels: true,
          nodeRepulsion: () => 8000,
          idealEdgeLength: () => 150,
        } as any).run();
      }
    }

    // Node aktualisieren
    node.data('label', node.data('label').replace(' ⏳', ''));
    node.data('properties', propLines.join('\n'));
    node.addClass('expanded');
    showNodeInfo(node.data());

  } catch (e) {
    node.data('label', node.data('label').replace(' ⏳', ' ❌'));
    console.error('Wikidata expand error:', e);
  }
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

    // Wikidata-Knoten automatisch expandieren bei Klick
    const qid = node.data('qid');
    if (qid && !node.hasClass('expanded')) {
      expandWikidataNode(node.data('id'), qid);
    }
  });

  cy.on('tap', (evt) => {
    if (evt.target === cy) {
      cy!.elements().removeClass('highlighted connected dimmed selected-node');
      const panel = document.getElementById('node-info');
      if (panel) panel.style.display = 'none';
    }
  });
}

export async function initGraph(
  container: HTMLElement,
  store: Store,
  query: string,
  languages: string[] = ['de', 'en']
): Promise<cytoscape.Core> {
  currentLanguages = languages;
  currentStore = store;

  const results = store.query(query) as any[];
  const elements = await resultsToCytoscape(results, store, languages);

  cy = cytoscape({
    container,
    elements,
    style: [
      {
        selector: 'node',
        style: {
          'label': 'data(label)',
          'background-color': '#2ecc71',
          'color': '#444',
          'font-size': '10px',
          'text-valign': 'center',
          //'text-margin-y': 8,
          'width': 20,
          'height': 20,
          'text-wrap': 'wrap',
          'text-max-width': '150px',
          'min-zoomed-font-size': 4,
          'transition-property': 'background-color, opacity, width, height',
          'transition-duration': 200
        }
      },
      {
        selector: 'node.post',
        style: {
          'background-color': '#e94560',
          'shape': 'round-rectangle',
          'width': 'label',
          'height': 'label',
          'padding': '6px 6px'
        }
      },
      {
        selector: 'node.blank',
        style: {
          'background-color': '#888',
          'shape': 'diamond',
          'width': 20,
          'height': 20,
          'font-size': '8px',
          'color': '#444'
        }
      },
      {
        selector: 'node.wikidata',
        style: {
          'background-color': '#53d8fb',
          'shape': 'cicle',
          'width': 15,
          'height': 15,
          'padding': '5px',
          'color': '#444'
        }
      },
      {
        selector: 'node.tagged',
        style: {
          'shape': 'diamond',
          'background-color': '#f1c40f',
          'color': '#444',
          'width': 25,
          'height': 25
        }
      },
      {
        selector: 'node.expanded',
        style: {
          'border-width': 2,
          'border-color': '#2ecc71',
          'border-style': 'double'
        }
      },
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
          'width': 'label',
          'height': 'label',
          'font-weight': 'bold'
        }
      },
      {
        selector: 'edge',
        style: {
          'label': 'data(label)',
          'font-size': '7px',
          'color': '#444',
          'line-color': '#888',
          'target-arrow-color': '#888',
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

  currentStore = store;
  const results = store.query(query) as any[];
  const elements = await resultsToCytoscape(results, store, currentLanguages);

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