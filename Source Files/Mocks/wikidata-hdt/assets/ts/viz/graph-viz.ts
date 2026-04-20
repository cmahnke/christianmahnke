import { LitElement, html } from 'lit';
import cytoscape from 'cytoscape';
import cytoscapeSvg from 'cytoscape-svg';
import { isWikidataUri, extractQid, WikidataStore } from '../wikidata';
import { loadHdtFromUrl } from '../loader';
import { componentStyles } from './styles.js';

import "../../scss/viz/viz.scss";

cytoscape.use(cytoscapeSvg);

// --- Layout constants ---

const NODE_REPULSION_BASE = 8000;
const IDEAL_EDGE_LENGTH_BASE = 150;
const EDGE_ELASTICITY = 100;
const GRAVITY = 0.1;
const FIT_PADDING = 50;

const OVERLAP_PADDING = 14;
const OVERLAP_ITERATIONS = 100;
const OVERLAP_CONVERGENCE_THRESHOLD = 1;

const NODE_BASE_SIZE = 15;
const NODE_SCALE_FACTOR = 16;

const SVG_REVOKE_DELAY_MS = 5000;
const FRAMES_AFTER_LAYOUT = 5;
const FRAMES_CONTAINER_RETRY = 2;

const FILTERED_PREDICATE_URIS = new Set([
  'urn:enrichment:fetchedFrom',
]);

const INSTANCE_OF_PREDICATE = 'http://www.wikidata.org/prop/direct/P31';

const WIKIBASE_EXTERNAL_ID   = 'http://wikiba.se/ontology#ExternalId';
const WIKIBASE_PROPERTY_TYPE = 'http://wikiba.se/ontology#propertyType';
const WIKIBASE_DIRECT_CLAIM  = 'http://wikiba.se/ontology#directClaim';

export const INSTANCE_OF_COLORS: Record<string, string> = {
  'Q5':        '#e74c3c',
  'Q17334923': '#3498db',
  'Q15642541': '#3498db',
  'Q8502':     '#3498db',
  'Q16334295': '#e67e22',
  'Q43229':    '#e67e22',
  'Q838948':   '#2ecc71',
  'Q7397':     '#f1c40f',
};

// --- i18n ---

type UiLang = 'de' | 'en';

const UI_STRINGS = {
  de: {
    noSrc:         'Kein <code>src</code>-Attribut gesetzt',
    buildingGraph: 'Graph wird aufgebaut…',
    loading:       (src: string) => `Lade ${src}…`,
    queryError:    (msg: string) => `Query-Fehler: ${msg}`,
    incomingLinks: 'Eingehende Verbindungen',
    close:         'Schließen',
    wikidata:      'Wikidata',
    wikipedia:     'Wikipedia',
  },
  en: {
    noSrc:         'No <code>src</code> attribute set',
    buildingGraph: 'Building graph…',
    loading:       (src: string) => `Loading ${src}…`,
    queryError:    (msg: string) => `Query error: ${msg}`,
    incomingLinks: 'Incoming connections',
    close:         'Close',
    wikidata:      'Wikidata',
    wikipedia:     'Wikipedia',
  },
} as const;

function detectBrowserLang(): UiLang {
  const langs = navigator.languages?.length
    ? navigator.languages
    : [navigator.language];
  for (const l of langs) {
    const short = l.split('-')[0].toLowerCase();
    if (short === 'de') return 'de';
    if (short === 'en') return 'en';
  }
  return 'en';
}

function resolveUiLang(attribute: string | null): UiLang {
  if (attribute) {
    const short = attribute.split('-')[0].toLowerCase();
    if (short === 'de') return 'de';
    if (short === 'en') return 'en';
  }
  return detectBrowserLang();
}

// --- Helper types ---

interface NodeData {
  id: string;
  label: string;
  classes: string;
  properties: Map<string, string[]>;
  isWikidata: boolean;
  qid: string | null;
}

interface NodeInfoData {
  label: string;
  id: string;
  qid?: string;
  indegree?: number;
  wikipediaUrl?: string;
  properties: Map<string, string[]>;
  externalIdKeys: Set<string>;
}

interface LegendEntry {
  color: string;
  label: string;
}

type LoadingState =
  | { status: 'idle' }
  | { status: 'loading-data'; message: string }
  | { status: 'building-graph'; message: string }
  | { status: 'ready' }
  | { status: 'error'; message: string };

export type NodeScaling = 'off' | 'linear' | 'log';
export type WikidataMode = 'off' | 'incoming';

const LABEL_PREDICATES = [
  'http://schema.org/name',
  'http://schema.org/headline',
  'http://www.w3.org/2000/01/rdf-schema#label',
  'http://xmlns.com/foaf/0.1/name',
  'http://purl.org/dc/terms/title',
  'http://purl.org/dc/elements/1.1/title',
  'http://schema.org/title',
];

const WIKIPEDIA_PREDICATE = 'http://schema.org/about';
const SCHEMA_URL           = 'http://schema.org/url';
const FOAF_PAGE            = 'http://xmlns.com/foaf/0.1/isPrimaryTopicOf';

function nodeScalingFromAttribute(value: string | null): NodeScaling {
  if (value === 'linear' || value === 'log') return value;
  return 'off';
}

function wikidataModeFromAttribute(value: string | null): WikidataMode {
  if (value === 'incoming') return value;
  return 'off';
}

function scaledSize(indegree: number, scaling: NodeScaling): number {
  if (scaling === 'off' || indegree <= 0) return 0;
  if (scaling === 'linear') return NODE_BASE_SIZE + indegree * NODE_SCALE_FACTOR;
  return NODE_BASE_SIZE + Math.log2(indegree + 1) * NODE_SCALE_FACTOR;
}

const CYTOSCAPE_STYLES: cytoscape.Stylesheet[] = [
  {
    selector: 'node',
    style: {
      'label': 'data(label)',
      'background-color': '#2ecc71',
      'color': '#444',
      'font-size': '10px',
      'text-valign': 'center',
      'width': 'data(nodeSize)',
      'height': 'data(nodeSize)',
      'text-wrap': 'wrap',
      'text-max-width': '150px',
      'min-zoomed-font-size': 4,
      'transition-property': 'background-color, opacity, width, height',
      'transition-duration': 200,
      'border-width': 0,
      'border-color': 'data(borderColor)',
      'border-style': 'solid',
    }
  },
  {
    selector: 'node[borderColor]',
    style: {
      'border-width': 3,
    }
  },
  {
    selector: 'node.post',
    style: {
      'background-color': '#e94560',
      'shape': 'round-rectangle',
      'width': 'data(nodeWidth)',
      'height': 'data(nodeHeight)',
      'padding': '6px'
    }
  },
  {
    selector: 'node.blank',
    style: {
      'background-color': '#888',
      'shape': 'diamond',
      'font-size': '8px',
      'color': '#444'
    }
  },
  {
    selector: 'node.wikidata',
    style: {
      'background-color': '#53d8fb',
      'shape': 'ellipse',
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
    }
  },
  {
    selector: 'node.wikidata-loading',
    style: {
      'border-width': 2,
      'border-color': '#ffbd39',
      'border-style': 'dashed',
    }
  },
  {
    selector: 'node.wikidata-error',
    style: {
      'border-width': 2,
      'border-color': '#e94560',
      'border-style': 'solid',
    }
  },
  {
    selector: 'node.incoming-loaded',
    style: {
      'border-width': 2,
      'border-color': '#2ecc71',
      'border-style': 'double'
    }
  },
  {
    selector: 'node.dimmed',
    style: { 'opacity': 0.2 }
  },
  {
    selector: 'node.highlighted',
    style: { 'opacity': 1, 'font-weight': 'bold' }
  },
  {
    selector: 'node.selected-node',
    style: {
      'border-width': 3,
      'border-color': '#fff',
      'opacity': 1,
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
    style: { 'opacity': 0.1 }
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
];

// --- Pure helper functions ---

function shorten(uri: string): string {
  if (uri.startsWith('"')) return uri;
  const cut = Math.max(uri.lastIndexOf('#'), uri.lastIndexOf('/'));
  return cut >= 0 ? uri.substring(cut + 1) : uri;
}

function findLabelInStore(
  wikidataStore: WikidataStore,
  uri: string,
  languages: string[]
): string | null {
  const langChain = [...new Set([...languages, 'en', 'mul'])];
  for (const predicate of LABEL_PREDICATES) {
    for (const lang of langChain) {
      try {
        const results = wikidataStore.query(
          `SELECT ?label WHERE { <${uri}> <${predicate}> ?label . FILTER(LANG(?label) = "${lang}") } LIMIT 1`
        ) as any[];
        if (results.length > 0) return results[0].get('label').value;
      } catch { /* ignore */ }
    }
    try {
      const results = wikidataStore.query(
        `SELECT ?label WHERE { <${uri}> <${predicate}> ?label . FILTER(LANG(?label) = "") } LIMIT 1`
      ) as any[];
      if (results.length > 0) return results[0].get('label').value;
    } catch { /* ignore */ }
  }
  return null;
}

function findWikipediaUrl(
  wikidataStore: WikidataStore,
  uri: string,
  languages: string[]
): string | null {
  const langChain  = [...new Set([...languages, 'en'])];
  const langFilter = langChain
    .map(l => `STRSTARTS(STR(?article), "https://${l}.wikipedia.org/")`)
    .join(' || ');
  try {
    const results = wikidataStore.query(`
      SELECT ?article WHERE {
        ?article <${WIKIPEDIA_PREDICATE}> <${uri}> .
        FILTER(${langFilter})
      } LIMIT 1
    `) as any[];
    if (results.length > 0) return results[0].get('article').value;
  } catch { /* ignore */ }

  for (const pred of [FOAF_PAGE, SCHEMA_URL]) {
    try {
      const results = wikidataStore.query(
        `SELECT ?url WHERE { <${uri}> <${pred}> ?url . FILTER(CONTAINS(STR(?url), "wikipedia.org")) } LIMIT 1`
      ) as any[];
      if (results.length > 0) return results[0].get('url').value;
    } catch { /* ignore */ }
  }
  return null;
}

function findExternalIdPredicates(wikidataStore: WikidataStore): Set<string> {
  const result = new Set<string>();
  try {
    const rows = wikidataStore.query(`
      SELECT ?directClaim WHERE {
        ?prop <${WIKIBASE_PROPERTY_TYPE}> <${WIKIBASE_EXTERNAL_ID}> ;
              <${WIKIBASE_DIRECT_CLAIM}> ?directClaim .
      }
    `) as any[];
    for (const row of rows) {
      result.add(row.get('directClaim').value as string);
    }
  } catch (e) {
    console.warn('[rdf-graph] findExternalIdPredicates failed', e);
  }
  return result;
}

function getPropertiesFromStore(
  wikidataStore: WikidataStore,
  uri: string,
  languages: string[]
): { properties: Map<string, string[]>; externalIdKeys: Set<string> } {
  const externalIdPredicates = findExternalIdPredicates(wikidataStore);
  const predLabelCache = new Map<string, string>();
  const predIsExternal = new Map<string, boolean>();
  const properties     = new Map<string, string[]>();
  const externalIdKeys = new Set<string>();

  try {
    const rows = wikidataStore.query(
      `SELECT ?p ?o WHERE { <${uri}> ?p ?o }`
    ) as any[];

    for (const row of rows) {
      const predUri = row.get('p').value as string;
      if (FILTERED_PREDICATE_URIS.has(predUri)) continue;

      const val = row.get('o').value as string;

      if (!predLabelCache.has(predUri)) {
        predLabelCache.set(
          predUri,
          findLabelInStore(wikidataStore, predUri, languages) ?? shorten(predUri)
        );
        predIsExternal.set(predUri, externalIdPredicates.has(predUri));
      }

      const predLabel  = predLabelCache.get(predUri)!;
      const isExternal = predIsExternal.get(predUri)!;

      if (!properties.has(predLabel)) properties.set(predLabel, []);
      properties.get(predLabel)!.push(val);

      if (isExternal) externalIdKeys.add(predLabel);
    }
  } catch (e) {
    console.warn('[rdf-graph] getPropertiesFromStore failed for', uri, e);
  }

  return { properties, externalIdKeys };
}

function findInstanceOfColor(
  wikidataStore: WikidataStore,
  uri: string
): string | null {
  if (Object.keys(INSTANCE_OF_COLORS).length === 0) return null;
  try {
    const rows = wikidataStore.query(
      `SELECT ?type WHERE { <${uri}> <${INSTANCE_OF_PREDICATE}> ?type }`
    ) as any[];
    for (const row of rows) {
      const typeUri = row.get('type').value as string;
      const qid     = extractQid(typeUri);
      if (qid && INSTANCE_OF_COLORS[qid]) {
        return INSTANCE_OF_COLORS[qid];
      }
    }
  } catch { /* ignore */ }
  return null;
}

function buildLegend(
  cy: cytoscape.Core,
  wikidataStore: WikidataStore,
  languages: string[]
): LegendEntry[] {
  const usedColors = new Set<string>();
  cy.nodes().forEach((node: cytoscape.NodeSingular) => {
    const color = node.data('borderColor');
    if (color) usedColors.add(color);
  });

  if (usedColors.size === 0) return [];

  const colorToQids = new Map<string, string[]>();
  for (const [qid, color] of Object.entries(INSTANCE_OF_COLORS)) {
    if (!usedColors.has(color)) continue;
    if (!colorToQids.has(color)) colorToQids.set(color, []);
    colorToQids.get(color)!.push(qid);
  }

  const entries: LegendEntry[] = [];
  for (const [color, qids] of colorToQids.entries()) {
    const labels: string[] = [];
    for (const qid of qids) {
      const uri   = `http://www.wikidata.org/entity/${qid}`;
      const label = findLabelInStore(wikidataStore, uri, languages) ?? qid;
      labels.push(label);
    }
    entries.push({ color, label: labels.join(', ') });
  }

  return entries;
}

function findTaggedPosts(wikidataStore: WikidataStore): Set<string> {
  try {
    const results = wikidataStore.query(`
      PREFIX schema: <http://schema.org/>
      SELECT ?post WHERE {
        ?post schema:identifier ?ident .
        ?ident a schema:PropertyValue ;
               schema:propertyID "projektemacher" ;
               schema:value "tag" .
      }
    `) as any[];
    return new Set(results.map((b: any) => b.get('post').value));
  } catch { return new Set(); }
}

function collectNodes(
  results: any[],
  wikidataStore: WikidataStore,
  taggedPosts: Set<string>,
  languages: string[]
): {
  nodeMap: Map<string, NodeData>;
  edges: cytoscape.ElementDefinition[];
} {
  const nodeMap = new Map<string, NodeData>();
  const edges: cytoscape.ElementDefinition[] = [];

  for (const binding of results) {
    const s   = binding.get('s');
    const p   = binding.get('p');
    const o   = binding.get('o');
    const sId = s.value;

    if (!nodeMap.has(sId)) {
      const storeLabel = findLabelInStore(wikidataStore, sId, languages);
      const isTagged   = taggedPosts.has(sId);
      const isWd       = isWikidataUri(sId);
      let classes      = s.termType === 'BlankNode' ? 'blank' : 'uri';
      if (isTagged) classes += ' tagged';
      else classes += ' post';
      if (isWd) classes += ' wikidata';
      nodeMap.set(sId, {
        id: sId, label: storeLabel ?? shorten(sId),
        classes, properties: new Map(), isWikidata: isWd, qid: extractQid(sId)
      });
    }

    const node = nodeMap.get(sId)!;

    if (o.termType === 'Literal') {
      const key = shorten(p.value);
      if (!node.properties.has(key)) node.properties.set(key, []);
      node.properties.get(key)!.push(o.value);
      if (LABEL_PREDICATES.includes(p.value)) node.label = o.value;
    } else {
      const oId = o.value;
      if (!nodeMap.has(oId)) {
        const storeLabel = findLabelInStore(wikidataStore, oId, languages);
        const isTagged   = taggedPosts.has(oId);
        const isWd       = isWikidataUri(oId);
        let classes      = o.termType === 'BlankNode' ? 'blank' : 'uri';
        if (isTagged) classes += ' tagged';
        if (isWd) classes += ' wikidata';
        nodeMap.set(oId, {
          id: oId, label: storeLabel ?? shorten(oId),
          classes, properties: new Map(), isWikidata: isWd, qid: extractQid(oId)
        });
      }
      edges.push({ data: { source: sId, target: oId, label: shorten(p.value) } });
    }
  }
  return { nodeMap, edges };
}

function buildElements(
  nodeMap: Map<string, NodeData>,
  edges: cytoscape.ElementDefinition[],
  scaling: NodeScaling,
  wikidataStore: WikidataStore
): cytoscape.ElementDefinition[] {
  const indegree = new Map<string, number>();
  for (const edge of edges) {
    const target = edge.data.target as string;
    indegree.set(target, (indegree.get(target) ?? 0) + 1);
  }

  const nodes: cytoscape.ElementDefinition[] = [];
  for (const node of nodeMap.values()) {
    const deg    = indegree.get(node.id) ?? 0;
    const size   = scaledSize(deg, scaling);
    const isPost = node.classes.includes('post');

    const defaultSize = node.classes.includes('tagged') ? 25
      : node.classes.includes('wikidata') ? 15
      : 20;

    const nodeSize    = scaling === 'off' ? defaultSize : Math.max(defaultSize, size);
    const borderColor = findInstanceOfColor(wikidataStore, node.id) ?? undefined;

    nodes.push({
      data: {
        id: node.id, label: node.label,
        qid: node.qid, indegree: deg, nodeSize,
        nodeWidth:  isPost ? 'label' : nodeSize,
        nodeHeight: isPost ? 'label' : nodeSize,
        ...(borderColor !== undefined ? { borderColor } : {}),
      },
      classes: node.classes
    });
  }
  return [...nodes, ...edges];
}

async function resultsToCytoscape(
  results: any[],
  wikidataStore: WikidataStore,
  languages: string[],
  scaling: NodeScaling,
  _wikidataMode: WikidataMode
): Promise<cytoscape.ElementDefinition[]> {
  const taggedPosts = findTaggedPosts(wikidataStore);
  const { nodeMap, edges } = collectNodes(results, wikidataStore, taggedPosts, languages);
  return buildElements(nodeMap, edges, scaling, wikidataStore);
}

function waitFrames(n: number): Promise<void> {
  return new Promise(resolve => {
    let count = 0;
    function next() {
      if (++count >= n) resolve();
      else requestAnimationFrame(next);
    }
    requestAnimationFrame(next);
  });
}

interface NodeRect {
  left: number; right: number; top: number; bottom: number;
}

function computeNodeRects(nodes: cytoscape.NodeCollection): Map<string, NodeRect> {
  const rects = new Map<string, NodeRect>();
  for (let i = 0; i < nodes.length; i++) {
    const n   = nodes[i];
    const pos = n.position();
    const bb  = n.boundingBox({ includeLabels: true, includeOverlays: false });
    rects.set(n.id(), {
      left:   pos.x - bb.x1 + OVERLAP_PADDING,
      right:  bb.x2 - pos.x + OVERLAP_PADDING,
      top:    pos.y - bb.y1 + OVERLAP_PADDING,
      bottom: bb.y2 - pos.y + OVERLAP_PADDING,
    });
  }
  return rects;
}

function removeOverlaps(cy: cytoscape.Core): void {
  const nodes = cy.nodes();
  const n     = nodes.length;
  if (n < 2) return;

  const rects = computeNodeRects(nodes);

  for (let iter = 0; iter < OVERLAP_ITERATIONS; iter++) {
    let maxOverlap = 0;

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const posA = nodes[i].position();
        const posB = nodes[j].position();
        const rA   = rects.get(nodes[i].id())!;
        const rB   = rects.get(nodes[j].id())!;

        const overlapX =
          Math.min(posA.x + rA.right,  posB.x + rB.right) -
          Math.max(posA.x - rA.left,   posB.x - rB.left);
        const overlapY =
          Math.min(posA.y + rA.bottom, posB.y + rB.bottom) -
          Math.max(posA.y - rA.top,    posB.y - rB.top);

        if (overlapX > 0 && overlapY > 0) {
          const overlap = Math.min(overlapX, overlapY);
          if (overlap > maxOverlap) maxOverlap = overlap;

          const dx = posB.x - posA.x;
          const dy = posB.y - posA.y;

          if (overlapX < overlapY) {
            const push = overlapX / 2 + 0.5;
            const sx = dx > 0 ? 1 : (dx < 0 ? -1 : (Math.random() > 0.5 ? 1 : -1));
            nodes[i].position({ x: posA.x - sx * push, y: posA.y });
            nodes[j].position({ x: posB.x + sx * push, y: posB.y });
          } else {
            const push = overlapY / 2 + 0.5;
            const sy = dy > 0 ? 1 : (dy < 0 ? -1 : (Math.random() > 0.5 ? 1 : -1));
            nodes[i].position({ x: posA.x, y: posA.y - sy * push });
            nodes[j].position({ x: posB.x, y: posB.y + sy * push });
          }
        }
      }
    }

    if (maxOverlap < OVERLAP_CONVERGENCE_THRESHOLD) break;
  }

  cy.fit(undefined, FIT_PADDING);
}

function buildNodeSizeMap(elements: cytoscape.ElementDefinition[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const el of elements) {
    if (el.data?.id && !el.data?.source) {
      const size = typeof el.data.nodeSize === 'number' ? el.data.nodeSize : NODE_BASE_SIZE;
      map.set(el.data.id, size);
    }
  }
  return map;
}

function nodeRepulsionFn(sizeMap: Map<string, number>): (node: any) => number {
  return (node: any) => {
    const size  = sizeMap.get(node.data('id')) ?? NODE_BASE_SIZE;
    const ratio = size / NODE_BASE_SIZE;
    return NODE_REPULSION_BASE * ratio * ratio;
  };
}

function idealEdgeLengthFn(sizeMap: Map<string, number>): (edge: any) => number {
  return (edge: any) => {
    const srcSize = sizeMap.get(edge.data('source')) ?? NODE_BASE_SIZE;
    const tgtSize = sizeMap.get(edge.data('target')) ?? NODE_BASE_SIZE;
    return (srcSize + tgtSize) / 2 + IDEAL_EDGE_LENGTH_BASE;
  };
}

function wikidataEntityToElements(
  entity: { id: string; uri: string; label: string; description: string },
  cy: cytoscape.Core,
  wikidataStore: WikidataStore
): cytoscape.ElementDefinition[] {
  if (cy.getElementById(entity.uri).length) return [];
  const borderColor = findInstanceOfColor(wikidataStore, entity.uri) ?? undefined;
  return [{
    data: {
      id:         entity.uri,
      label:      entity.label,
      qid:        entity.id,
      indegree:   0,
      nodeSize:   NODE_BASE_SIZE,
      nodeWidth:  NODE_BASE_SIZE,
      nodeHeight: NODE_BASE_SIZE,
      ...(borderColor !== undefined ? { borderColor } : {}),
    },
    classes: 'uri wikidata'
  }];
}

// --- Web Component ---

export class RdfGraph extends LitElement {

  static override get styles() {
    return componentStyles;
  }

  static override properties = {
    src: { type: String },
    languages: {
      type: Array,
      converter: {
        fromAttribute(value: string | null): string[] {
          return value ? value.split(',').map(s => s.trim()).filter(Boolean) : ['de', 'en'];
        },
        toAttribute(value: string[]): string { return value.join(','); }
      }
    },
    nodeScaling: {
      type: String,
      attribute: 'node-scaling',
      converter: {
        fromAttribute: nodeScalingFromAttribute,
        toAttribute(value: NodeScaling): string { return value; }
      }
    },
    wikidata: {
      type: String,
      converter: {
        fromAttribute: wikidataModeFromAttribute,
        toAttribute(value: WikidataMode): string { return value; }
      }
    },
    autoExecute: {
      type: Boolean,
      attribute: 'auto-execute',
      reflect: false,
    },
    language: {
      type: String,
    },
  };

  src: string = '';
  languages: string[] = ['de', 'en'];
  nodeScaling: NodeScaling = 'off';
  wikidata: WikidataMode = 'off';
  autoExecute: boolean = false;
  language: string | null = null;

  private _sparqlQuery: string = '';

  get sparqlQuery(): string {
    return this._sparqlQuery;
  }

  set sparqlQuery(value: string) {
    const old = this._sparqlQuery;
    this._sparqlQuery = value;
    if (old !== value) {
      this._scheduleWork(false);
    }
  }

  private get _t() {
    return UI_STRINGS[resolveUiLang(this.language)];
  }

  private _nodeInfo: NodeInfoData | null = null;
  private _loadingState: LoadingState = { status: 'idle' };
  private _legend: LegendEntry[] = [];
  private _cy: cytoscape.Core | null = null;
  private _wikidataStore: WikidataStore | null = null;
  private _loadedSrc: string | null = null;
  private _executedQuery: string | null = null;
  private _executedLanguages: string[] | null = null;
  private _executedScaling: NodeScaling | null = null;
  private _executedWikidata: WikidataMode | null = null;
  private _resizeObserver: ResizeObserver | null = null;
  private _scriptObserver: MutationObserver | null = null;
  private _working = false;
  private _workVersion = 0;
  private _pendingSrcChanged = false;

  override connectedCallback(): void {
    super.connectedCallback();

    this._resizeObserver = new ResizeObserver(() => this._handleResize());
    this._resizeObserver.observe(this);

    const script = this.querySelector('script[type="application/sparql-query"]');
    if (script?.textContent) {
      this.sparqlQuery = script.textContent.trim();
    }

    this._scriptObserver = new MutationObserver(() => {
      const s = this.querySelector('script[type="application/sparql-query"]');
      if (s?.textContent) {
        this.sparqlQuery = s.textContent.trim();
      }
    });
    this._scriptObserver.observe(this, { childList: true, subtree: true });
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this._resizeObserver) { this._resizeObserver.disconnect(); this._resizeObserver = null; }
    if (this._scriptObserver) { this._scriptObserver.disconnect(); this._scriptObserver = null; }
    if (this._cy) { this._cy.destroy(); this._cy = null; }
    this._wikidataStore = null;
    this._loadedSrc = null;
  }

  private _handleResize(): void {
    if (this._cy) {
      this._cy.resize();
    }
  }

  private _observeContainer(): void {
    const container = this.renderRoot.querySelector('#cy-container') as HTMLDivElement | null;
    if (container && this._resizeObserver) {
      this._resizeObserver.observe(container);
    }
  }

  protected override updated(changed: Map<string, unknown>): void {
    const srcChanged      = changed.has('src');
    const langChanged     = changed.has('languages');
    const scalingChanged  = changed.has('nodeScaling');
    const wikidataChanged = changed.has('wikidata');
    if (srcChanged || langChanged || scalingChanged || wikidataChanged) {
      this._scheduleWork(srcChanged);
    }
  }

  private _scheduleWork(srcChanged: boolean): void {
    ++this._workVersion;
    this._pendingSrcChanged ||= srcChanged;
    if (this._working) return;
    queueMicrotask(() => this._drainWork());
  }

  private async _drainWork(): Promise<void> {
    if (this._working) return;
    while (true) {
      const version    = this._workVersion;
      const srcChanged = this._pendingSrcChanged;
      this._pendingSrcChanged = false;
      this._working = true;
      try {
        await this._doWork(srcChanged, version);
      } finally {
        this._working = false;
      }
      if (this._workVersion === version) break;
    }
  }

  private async _doWork(srcChanged: boolean, version: number): Promise<void> {
    if (srcChanged && this.src && this.src !== this._loadedSrc) {
      await this._loadData(version);
      if (this._workVersion !== version) return;
    }
    const queryToRun = this._sparqlQuery.trim();
    const settingsChanged =
      queryToRun !== this._executedQuery ||
      !this._arraysEqual(this.languages, this._executedLanguages) ||
      this.nodeScaling !== this._executedScaling ||
      this.wikidata !== this._executedWikidata;
    const autoTrigger = this.autoExecute && this._executedQuery === null;
    if (this._wikidataStore && queryToRun && (settingsChanged || autoTrigger)) {
      await this._buildGraph(queryToRun, version);
    }
  }

  private _arraysEqual(a: string[] | null, b: string[] | null): boolean {
    if (a === b) return true;
    if (!a || !b || a.length !== b.length) return false;
    return a.every((v, i) => v === b[i]);
  }

  private _updateOverlay(state: LoadingState): void {
    this._loadingState = state;
    this.requestUpdate();
  }

  private _updateNodeInfo(info: NodeInfoData | null): void {
    this._nodeInfo = info;
    this.requestUpdate();
  }

  private _closeNodeInfo(): void {
    this._cy?.elements().removeClass('highlighted connected dimmed selected-node');
    this._updateNodeInfo(null);
    this.dispatchEvent(new CustomEvent('node-deselected', { bubbles: true, composed: true }));
  }

  private _layoutOptions(sizeMap?: Map<string, number>): any {
    const container = this.renderRoot.querySelector('#cy-container') as HTMLDivElement | null;
    const w = container?.clientWidth  ?? 800;
    const h = container?.clientHeight ?? 600;
    const repulsion  = sizeMap ? nodeRepulsionFn(sizeMap)   : () => NODE_REPULSION_BASE;
    const edgeLength = sizeMap ? idealEdgeLengthFn(sizeMap) : () => IDEAL_EDGE_LENGTH_BASE;
    return {
      name: 'cose',
      animate: false,
      nodeDimensionsIncludeLabels: true,
      nodeRepulsion: repulsion,
      idealEdgeLength: edgeLength,
      edgeElasticity: () => EDGE_ELASTICITY,
      gravity: GRAVITY,
      fit: true,
      padding: FIT_PADDING,
      boundingBox: { x1: 0, y1: 0, w, h },
    };
  }

  private async _loadData(version: number): Promise<void> {
    this._updateOverlay({ status: 'loading-data', message: this._t.loading(this.src) });
    if (this._cy) { this._cy.destroy(); this._cy = null; }
    this._wikidataStore     = null;
    this._legend            = [];
    this._executedQuery     = null;
    this._executedLanguages = null;
    this._executedScaling   = null;
    this._executedWikidata  = null;
    const loadingSrc = this.src;
    try {
      const rawStore = await loadHdtFromUrl(this.src);
      if (this._workVersion !== version || this.src !== loadingSrc) return;
      this._wikidataStore = new WikidataStore(rawStore);
      this._loadedSrc = loadingSrc;
      this.dispatchEvent(new CustomEvent('store-loaded', {
        detail: { quadCount: rawStore.size }, bubbles: true, composed: true
      }));
    } catch (error) {
      if (this._workVersion !== version || this.src !== loadingSrc) return;
      const message = error instanceof Error ? error.message : String(error);
      console.error('[rdf-graph] Fehler beim Laden der HDT-Datei:', error);
      this._updateOverlay({ status: 'error', message });
      this.dispatchEvent(new CustomEvent('load-error', {
        detail: { error: message }, bubbles: true, composed: true
      }));
    }
  }

  private async _buildGraph(query: string, version: number): Promise<void> {
    if (!this._wikidataStore) return;
    const isFirstBuild = !this._cy;
    if (isFirstBuild) {
      this._updateOverlay({ status: 'building-graph', message: this._t.buildingGraph });
    }
    await this.updateComplete;
    const container = this.renderRoot.querySelector('#cy-container') as HTMLDivElement;
    if (!container) return;
    if (container.clientWidth === 0 || container.clientHeight === 0) {
      await waitFrames(FRAMES_CONTAINER_RETRY);
      if (container.clientWidth === 0 || container.clientHeight === 0) return;
    }
    try {
      const results  = this._wikidataStore.query(query) as any[];
      const elements = await resultsToCytoscape(
        results, this._wikidataStore, this.languages, this.nodeScaling, this.wikidata
      );
      if (this._workVersion !== version) return;
      const sizeMap = buildNodeSizeMap(elements);
      if (!this._cy) {
        this._cy = cytoscape({
          container, elements,
          style: CYTOSCAPE_STYLES as any,
          layout: this._layoutOptions(sizeMap),
        });
        await waitFrames(2);
        this._cy.resize();
        this._setupInteractions();
        this._observeContainer();
      } else {
        this._cy.elements().remove();
        this._cy.add(elements);
        this._cy.layout(this._layoutOptions(sizeMap)).run();
      }
      await waitFrames(FRAMES_AFTER_LAYOUT);
      if (this._cy && this._workVersion === version) removeOverlaps(this._cy);

      if (this._cy && this._wikidataStore) {
        this._legend = buildLegend(this._cy, this._wikidataStore, this.languages);
      }

      this._executedQuery     = query;
      this._executedLanguages = [...this.languages];
      this._executedScaling   = this.nodeScaling;
      this._executedWikidata  = this.wikidata;
      this._updateOverlay({ status: 'ready' });
      this.dispatchEvent(new CustomEvent(isFirstBuild ? 'graph-ready' : 'graph-updated', {
        detail: { cy: this._cy, quadCount: this._wikidataStore.size }, bubbles: true, composed: true
      }));
    } catch (error) {
      if (this._workVersion !== version) return;
      const message = this._t.queryError(
        error instanceof Error ? error.message : String(error)
      );
      console.error('[rdf-graph] Fehler beim Ausführen der SPARQL-Query:', error);
      this._updateOverlay({ status: 'error', message });
      this.dispatchEvent(new CustomEvent('query-error', {
        detail: { error: error instanceof Error ? error.message : String(error) }, bubbles: true, composed: true
      }));
    }
  }

  private _setupInteractions(): void {
    if (!this._cy) return;

    this._cy.on('zoom pan', () => {
      this._cy?.resize();
    });

    this._cy.on('tap', 'node', (evt) => {
      const node   = evt.target;
      const cy     = this._cy!;
      const nodeId = node.data('id') as string;

      cy.elements().removeClass('highlighted connected dimmed selected-node');
      const neighborhood = node.neighborhood();
      neighborhood.add(node).removeClass('dimmed').addClass('highlighted');
      cy.elements().addClass('dimmed');
      neighborhood.add(node).removeClass('dimmed');
      node.addClass('selected-node');
      neighborhood.edges().addClass('connected');

      const wikipediaUrl = this._wikidataStore
        ? findWikipediaUrl(this._wikidataStore, nodeId, this.languages) ?? undefined
        : undefined;

      const { properties, externalIdKeys } = this._wikidataStore
        ? getPropertiesFromStore(this._wikidataStore, nodeId, this.languages)
        : { properties: new Map<string, string[]>(), externalIdKeys: new Set<string>() };

      this._updateNodeInfo({
        label:      node.data('label'),
        id:         nodeId,
        qid:        node.data('qid') ?? undefined,
        indegree:   node.data('indegree'),
        wikipediaUrl,
        properties,
        externalIdKeys,
      });

      this.dispatchEvent(new CustomEvent('node-selected', {
        detail: node.data(), bubbles: true, composed: true
      }));

      const qid = node.data('qid');
      if (qid && this.wikidata === 'incoming' && !node.hasClass('incoming-loaded')) {
        this._loadIncomingLinks(nodeId, qid);
      }
    });

    this._cy.on('tap', (evt) => {
      if (evt.target === this._cy) {
        this._closeNodeInfo();
      }
    });
  }

  private async _loadIncomingLinks(nodeId: string, qid: string): Promise<void> {
    if (!this._cy || !this._wikidataStore) return;
    const node = this._cy.getElementById(nodeId);
    if (node.hasClass('incoming-loaded')) return;
    node.addClass('wikidata-loading');
    try {
      const uri      = `http://www.wikidata.org/entity/${qid}`;
      const entities = await this._wikidataStore.enrichIncomingLinks(uri, this.languages);
      const newElements: cytoscape.ElementDefinition[] = [];
      for (const entity of entities) {
        newElements.push(...wikidataEntityToElements(entity, this._cy, this._wikidataStore));
        const edgeId = `${entity.uri}__incoming__${nodeId}`;
        if (!this._cy.getElementById(edgeId).length) {
          newElements.push({
            data: { id: edgeId, source: entity.uri, target: nodeId, label: '→' }
          });
        }
      }
      this._applyNewElements(newElements, node);
      node.removeClass('wikidata-loading');
      node.addClass('incoming-loaded');

      if (this._wikidataStore) {
        this._legend = buildLegend(this._cy, this._wikidataStore, this.languages);
      }

      const { properties, externalIdKeys } = getPropertiesFromStore(
        this._wikidataStore, nodeId, this.languages
      );
      this._updateNodeInfo({
        label:        node.data('label'),
        id:           nodeId,
        qid:          node.data('qid') ?? undefined,
        indegree:     node.data('indegree'),
        wikipediaUrl: this._nodeInfo?.wikipediaUrl,
        properties,
        externalIdKeys,
      });

      this.dispatchEvent(new CustomEvent('node-incoming-loaded', {
        detail: { nodeId, qid, count: entities.length }, bubbles: true, composed: true
      }));
    } catch (e) {
      node.removeClass('wikidata-loading');
      node.addClass('wikidata-error');
      console.error('[rdf-graph] Fehler beim Laden eingehender Verbindungen:', e);
    }
  }

  private _applyNewElements(
    newElements: cytoscape.ElementDefinition[],
    anchorNode: cytoscape.NodeSingular
  ): void {
    if (!this._cy || newElements.length === 0) return;
    this._cy.add(newElements);
    const neighborhood = anchorNode.neighborhood().add(anchorNode);
    const localSizeMap = new Map<string, number>();
    neighborhood.nodes().forEach((n: cytoscape.NodeSingular) => {
      const s = n.data('nodeSize');
      localSizeMap.set(n.id(), typeof s === 'number' ? s : NODE_BASE_SIZE);
    });
    neighborhood.layout({
      name: 'cose',
      animate: true,
      animationDuration: 300,
      fit: false,
      nodeDimensionsIncludeLabels: true,
      nodeRepulsion: nodeRepulsionFn(localSizeMap),
      idealEdgeLength: idealEdgeLengthFn(localSizeMap),
      edgeElasticity: () => EDGE_ELASTICITY,
      gravity: GRAVITY,
    } as any).run();
  }

  exportAsSvg(): void {
    if (!this._cy) return;
    const svgContent = (this._cy as any).svg({ full: true, scale: 1 });
    const blob       = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url        = URL.createObjectURL(blob);
    const baseName   = this.src
      ? this.src.split('/').pop()?.replace(/\.[^.]+$/, '') ?? 'graph'
      : 'graph';
    const anchor    = document.createElement('a');
    anchor.href     = url;
    anchor.download = `${baseName}.svg`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), SVG_REVOKE_DELAY_MS);
    this.dispatchEvent(new CustomEvent('svg-exported', {
      detail: { filename: anchor.download }, bubbles: true, composed: true
    }));
  }

  getCy(): cytoscape.Core | null     { return this._cy; }
  getStore(): WikidataStore | null   { return this._wikidataStore; }
  get quadCount(): number            { return this._wikidataStore?.size ?? 0; }

  protected override render() {
    const ready = this._loadingState.status === 'ready' && this._cy !== null;
    return html`
      <div id="cy-container"></div>
      ${this._renderOverlay()}
      ${this._legend.length > 0 ? this._renderLegend() : null}
      <button
        id="export-btn"
        title="Graph als SVG exportieren"
        ?disabled=${!ready}
        @click=${() => this.exportAsSvg()}
      >SVG</button>
      ${this._nodeInfo ? this._renderNodeInfo(this._nodeInfo) : null}
    `;
  }

  private _renderOverlay() {
    const s = this._loadingState;
    if (s.status === 'idle' && !this.src)
      return html`<div id="loading-overlay"><span>Kein <code>src</code> Attribut gesetzt</span></div>`;
    if (s.status === 'loading-data' || s.status === 'building-graph')
      return html`<div id="loading-overlay"><span><span class="spinner"></span>${s.message}</span></div>`;
    if (s.status === 'error')
      return html`<div id="loading-overlay"><span class="error">❌ ${s.message}</span></div>`;
    return null;
  }

  private _renderLegend() {
    return html`
      <div id="legend">
        ${this._legend.map(entry => html`
          <div class="legend-entry">
            <span class="legend-swatch" style="--swatch-color: ${entry.color}"></span>
            <span class="legend-label">${entry.label}</span>
          </div>
        `)}
      </div>
    `;
  }

  private _renderPropertyRow(key: string, values: string[]) {
    return html`
      <div class="node-info-row">
        <span class="node-info-key">${key}</span>
        <span class="node-info-values">
          ${values.map((v, i) => html`
            ${i > 0 ? html`<br>` : null}
            ${v.startsWith('http') ? html`
              <a href=${v} target="_blank" rel="noopener noreferrer">${shorten(v)} ↗</a>
            ` : v}
          `)}
        </span>
      </div>
    `;
  }

  private _renderNodeInfo(data: NodeInfoData) {
    const allEntries      = [...data.properties.entries()];
    const normalEntries   = allEntries.filter(([k]) => !data.externalIdKeys.has(k));
    const externalEntries = allEntries.filter(([k]) =>  data.externalIdKeys.has(k));

    return html`
      <div id="node-info">

        <button
          id="node-info-close"
          title=${this._t.close}
          @click=${() => this._closeNodeInfo()}
        >✕</button>

        <div class="node-info-label">${data.label}</div>
        <div class="node-info-id">
          <a href=${data.id} target="_blank" rel="noopener noreferrer">${data.id}</a>
        </div>

        ${data.qid ? html`
          <div class="node-info-row">
            <span class="node-info-key">${this._t.wikidata}</span>
            <a href="https://www.wikidata.org/entity/${data.qid}"
              target="_blank" rel="noopener noreferrer">${data.qid} ↗</a>
          </div>` : null}

        ${data.wikipediaUrl ? html`
          <div class="node-info-row">
            <span class="node-info-key">${this._t.wikipedia}</span>
            <a href=${data.wikipediaUrl}
              target="_blank" rel="noopener noreferrer">${data.wikipediaUrl} ↗</a>
          </div>` : null}

        ${data.indegree !== undefined ? html`
          <div class="node-info-row">
            <span class="node-info-key">${this._t.incomingLinks}</span>
            <span>${data.indegree}</span>
          </div>` : null}

        ${normalEntries.length > 0 ? html`
          <div class="node-info-properties">
            ${normalEntries.map(([key, values]) => this._renderPropertyRow(key, values))}
          </div>` : null}

        ${externalEntries.length > 0 ? html`
          <div class="node-info-properties node-info-external-ids">
            ${externalEntries.map(([key, values]) => this._renderPropertyRow(key, values))}
          </div>` : null}

      </div>
    `;
  }
}

customElements.define('rdf-graph', RdfGraph);

declare global {
  interface HTMLElementTagNameMap {
    'rdf-graph': RdfGraph;
  }
}