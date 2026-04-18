import { LitElement, html, css } from 'lit';
import cytoscape from 'cytoscape';
import cytoscapeSvg from 'cytoscape-svg';
import type { Store } from 'oxigraph';
import { isWikidataUri, extractQid, fetchWikidataLabels, fetchWikidataDetails } from '../wikidata';
import { loadHdtFromUrl } from '../loader';
import { componentStyles } from './styles.js';

import "../../scss/viz/viz.scss";

// Register the cytoscape-svg plugin once
cytoscape.use(cytoscapeSvg);

// --- Layout constants ---

const NODE_REPULSION_BASE = 8000;
const IDEAL_EDGE_LENGTH_BASE = 150;
const EDGE_ELASTICITY = 100;
const GRAVITY = 0.1;
const FIT_PADDING = 50;

const OVERLAP_PADDING = 14;
const OVERLAP_ITERATIONS = 100;

const NODE_BASE_SIZE = 15;
const NODE_SCALE_FACTOR = 16;

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
  properties?: string;
  indegree?: number;
}

type LoadingState =
  | { status: 'idle' }
  | { status: 'loading-data'; message: string }
  | { status: 'building-graph'; message: string }
  | { status: 'ready' }
  | { status: 'error'; message: string };

export type NodeScaling = 'off' | 'linear' | 'log';

/** Controls what happens when clicking a Wikidata node */
export type WikidataMode = 'off' | 'labels' | 'expand';

const LABEL_PREDICATES = [
  'http://schema.org/name',
  'http://schema.org/headline',
  'http://www.w3.org/2000/01/rdf-schema#label',
  'http://xmlns.com/foaf/0.1/name',
  'http://purl.org/dc/terms/title',
  'http://purl.org/dc/elements/1.1/title',
  'http://schema.org/title',
];

function nodeScalingFromAttribute(value: string | null): NodeScaling {
  if (value === 'linear' || value === 'log') return value;
  return 'off';
}

function wikidataModeFromAttribute(value: string | null): WikidataMode {
  if (value === 'labels' || value === 'expand') return value;
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
      'transition-duration': 200
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
    selector: 'node.expanded',
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

function findLabelInStore(store: Store, uri: string, languages: string[]): string | null {
  const langChain = [...new Set([...languages, 'en'])];
  for (const predicate of LABEL_PREDICATES) {
    for (const lang of langChain) {
      try {
        const results = store.query(
          `SELECT ?label WHERE { <${uri}> <${predicate}> ?label . FILTER(LANG(?label) = "${lang}") } LIMIT 1`
        ) as any[];
        if (results.length > 0) return results[0].get('label').value;
      } catch { /* ignore */ }
    }
    try {
      const results = store.query(
        `SELECT ?label WHERE { <${uri}> <${predicate}> ?label . FILTER(LANG(?label) = "" || LANG(?label) IN (${langChain.map(l => `"${l}"`).join(',')})) } LIMIT 1`
      ) as any[];
      if (results.length > 0) return results[0].get('label').value;
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
  } catch { return new Set(); }
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
      nodeMap.set(sId, { id: sId, label: storeLabel ?? shorten(sId), classes, properties: new Map(), isWikidata: isWd, qid: extractQid(sId) });
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
        const storeLabel = findLabelInStore(store, oId, languages);
        const isTagged = taggedPosts.has(oId);
        const isWd = isWikidataUri(oId);
        let classes = o.termType === 'BlankNode' ? 'blank' : 'uri';
        if (isTagged) classes += ' tagged';
        if (isWd) classes += ' wikidata';
        nodeMap.set(oId, { id: oId, label: storeLabel ?? shorten(oId), classes, properties: new Map(), isWikidata: isWd, qid: extractQid(oId) });
      }
      edges.push({ data: { source: sId, target: oId, label: shorten(p.value) } });
    }
  }
  return { nodeMap, edges };
}

async function resolveWikidataLabels(nodeMap: Map<string, NodeData>, languages: string[]): Promise<void> {
  const needsLabel = [...nodeMap.values()].filter(n => n.isWikidata && n.qid && n.label === shorten(n.id));
  if (needsLabel.length === 0) return;
  const qids = needsLabel.map(n => n.qid!);
  const labels = await fetchWikidataLabels(qids, languages);
  for (const node of needsLabel) {
    const info = labels.get(node.qid!);
    if (info) {
      node.label = info.label;
      if (info.description) node.properties.set('description', [info.description]);
    }
    node.classes += ' wikidata';
  }
}

function buildElements(
  nodeMap: Map<string, NodeData>,
  edges: cytoscape.ElementDefinition[],
  scaling: NodeScaling
): cytoscape.ElementDefinition[] {
  const indegree = new Map<string, number>();
  for (const edge of edges) {
    const target = edge.data.target as string;
    indegree.set(target, (indegree.get(target) ?? 0) + 1);
  }

  const nodes: cytoscape.ElementDefinition[] = [];
  for (const node of nodeMap.values()) {
    const propLines: string[] = [];
    for (const [key, values] of node.properties) {
      for (const v of values) propLines.push(`${key}: ${v}`);
    }

    const deg = indegree.get(node.id) ?? 0;
    const size = scaledSize(deg, scaling);
    const isPost = node.classes.includes('post');

    const defaultSize = node.classes.includes('tagged') ? 25
      : node.classes.includes('wikidata') ? 15
      : 20;

    const nodeSize = scaling === 'off' ? defaultSize : Math.max(defaultSize, size);

    nodes.push({
      data: {
        id: node.id, label: node.label,
        properties: propLines.join('\n'), propertyCount: propLines.length,
        qid: node.qid, indegree: deg, nodeSize,
        nodeWidth: isPost ? 'label' : nodeSize,
        nodeHeight: isPost ? 'label' : nodeSize,
      },
      classes: node.classes
    });
  }
  return [...nodes, ...edges];
}

async function resultsToCytoscape(
  results: any[], store: Store, languages: string[],
  scaling: NodeScaling, wikidataMode: WikidataMode
): Promise<cytoscape.ElementDefinition[]> {
  const taggedPosts = findTaggedPosts(store);
  const { nodeMap, edges } = collectNodes(results, store, taggedPosts, languages);
  if (wikidataMode !== 'off') {
    await resolveWikidataLabels(nodeMap, languages);
  }
  return buildElements(nodeMap, edges, scaling);
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
    const n = nodes[i];
    const pos = n.position();
    const bb = n.boundingBox({ includeLabels: true, includeOverlays: false });
    rects.set(n.id(), {
      left: pos.x - bb.x1 + OVERLAP_PADDING,
      right: bb.x2 - pos.x + OVERLAP_PADDING,
      top: pos.y - bb.y1 + OVERLAP_PADDING,
      bottom: bb.y2 - pos.y + OVERLAP_PADDING,
    });
  }
  return rects;
}

function removeOverlaps(cy: cytoscape.Core): void {
  const nodes = cy.nodes();
  const n = nodes.length;
  if (n < 2) return;

  const rects = computeNodeRects(nodes);

  for (let iter = 0; iter < OVERLAP_ITERATIONS; iter++) {
    let maxOverlap = 0;

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const posA = nodes[i].position();
        const posB = nodes[j].position();
        const rA = rects.get(nodes[i].id())!;
        const rB = rects.get(nodes[j].id())!;

        const overlapX = Math.min(posA.x + rA.right, posB.x + rB.right) - Math.max(posA.x - rA.left, posB.x - rB.left);
        const overlapY = Math.min(posA.y + rA.bottom, posB.y + rB.bottom) - Math.max(posA.y - rA.top, posB.y - rB.top);

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
    if (maxOverlap < 1) break;
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
    const size = sizeMap.get(node.data('id')) ?? NODE_BASE_SIZE;
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

// --- Web Component ---

export class RdfGraph extends LitElement {

  static override get styles() {
    return componentStyles;
  }

  static override properties = {
    src: { type: String },
    sparqlQuery: { type: String, attribute: 'sparql-query' },
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
    exportSvg: {
      type: Boolean,
      attribute: 'export-svg',
      reflect: true,
    },
  };

  src: string = '';
  sparqlQuery: string = '';
  languages: string[] = ['de', 'en'];
  nodeScaling: NodeScaling = 'off';
  wikidata: WikidataMode = 'off';
  exportSvg: boolean = false;

  private _nodeInfo: NodeInfoData | null = null;
  private _loadingState: LoadingState = { status: 'idle' };
  private _cy: cytoscape.Core | null = null;
  private _store: Store | null = null;
  private _loadedSrc: string | null = null;
  private _executedQuery: string | null = null;
  private _executedLanguages: string[] | null = null;
  private _executedScaling: NodeScaling | null = null;
  private _executedWikidata: WikidataMode | null = null;
  private _resizeObserver: ResizeObserver | null = null;
  private _working = false;
  private _workVersion = 0;

  override connectedCallback(): void {
    super.connectedCallback();
    this._resizeObserver = new ResizeObserver(() => this._handleResize());
    this._resizeObserver.observe(this);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this._resizeObserver) { this._resizeObserver.disconnect(); this._resizeObserver = null; }
    if (this._cy) { this._cy.destroy(); this._cy = null; }
    this._store = null;
    this._loadedSrc = null;
  }

  private _handleResize(): void {
    if (this._cy) this._cy.resize();
  }

  protected override updated(changed: Map<string, unknown>): void {
    const srcChanged = changed.has('src');
    const queryChanged = changed.has('sparqlQuery');
    const langChanged = changed.has('languages');
    const scalingChanged = changed.has('nodeScaling');
    const wikidataChanged = changed.has('wikidata');
    if (srcChanged || queryChanged || langChanged || scalingChanged || wikidataChanged) {
      this._scheduleWork(srcChanged);
    }
  }

  private _scheduleWork(srcChanged: boolean): void {
    const version = ++this._workVersion;
    if (this._working) return;
    queueMicrotask(() => {
      if (version === this._workVersion) this._doWork(srcChanged);
    });
  }

  private async _doWork(srcChanged: boolean): Promise<void> {
    if (this._working) return;
    this._working = true;
    const startVersion = this._workVersion;
    try {
      if (srcChanged && this.src && this.src !== this._loadedSrc) {
        await this._loadData(startVersion);
        if (this._workVersion !== startVersion) return;
      }
      const queryToRun = this.sparqlQuery?.trim();
      if (this._store && queryToRun &&
        (queryToRun !== this._executedQuery ||
         !this._arraysEqual(this.languages, this._executedLanguages) ||
         this.nodeScaling !== this._executedScaling ||
         this.wikidata !== this._executedWikidata)) {
        await this._buildGraph(queryToRun, startVersion);
      }
    } finally {
      this._working = false;
      if (this._workVersion !== startVersion) {
        queueMicrotask(() => this._doWork(this.src !== this._loadedSrc));
      }
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

  private _layoutOptions(sizeMap?: Map<string, number>): any {
    const container = this.renderRoot.querySelector('#cy-container') as HTMLDivElement | null;
    const w = container?.clientWidth ?? 800;
    const h = container?.clientHeight ?? 600;

    const repulsion = sizeMap
      ? nodeRepulsionFn(sizeMap)
      : () => NODE_REPULSION_BASE;

    const edgeLength = sizeMap
      ? idealEdgeLengthFn(sizeMap)
      : () => IDEAL_EDGE_LENGTH_BASE;

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
    this._updateOverlay({ status: 'loading-data', message: `Lade ${this.src}…` });
    if (this._cy) { this._cy.destroy(); this._cy = null; }
    this._store = null;
    this._executedQuery = null;
    this._executedLanguages = null;
    this._executedScaling = null;
    this._executedWikidata = null;
    const loadingSrc = this.src;
    try {
      const store = await loadHdtFromUrl(this.src);
      if (this._workVersion !== version || this.src !== loadingSrc) return;
      this._store = store;
      this._loadedSrc = loadingSrc;
      this.dispatchEvent(new CustomEvent('store-loaded', {
        detail: { quadCount: store.size }, bubbles: true, composed: true
      }));
    } catch (error) {
      if (this._workVersion !== version || this.src !== loadingSrc) return;
      const message = error instanceof Error ? error.message : String(error);
      this._updateOverlay({ status: 'error', message });
      this.dispatchEvent(new CustomEvent('load-error', {
        detail: { error: message }, bubbles: true, composed: true
      }));
    }
  }

  private async _buildGraph(query: string, version: number): Promise<void> {
    if (!this._store) return;
    const isFirstBuild = !this._cy;
    if (isFirstBuild) {
      this._updateOverlay({ status: 'building-graph', message: 'Graph wird aufgebaut…' });
    }

    await this.updateComplete;
    const container = this.renderRoot.querySelector('#cy-container') as HTMLDivElement;
    if (!container) return;
    if (container.clientWidth === 0 || container.clientHeight === 0) {
      await waitFrames(2);
      if (container.clientWidth === 0 || container.clientHeight === 0) return;
    }

    try {
      const results = this._store.query(query) as any[];
      const elements = await resultsToCytoscape(
        results, this._store, this.languages, this.nodeScaling, this.wikidata
      );
      if (this._workVersion !== version) return;

      const sizeMap = buildNodeSizeMap(elements);

      if (!this._cy) {
        this._cy = cytoscape({
          container,
          elements,
          style: CYTOSCAPE_STYLES as any,
          layout: this._layoutOptions(sizeMap),
        });
        this._setupInteractions();
      } else {
        this._cy.elements().remove();
        this._cy.add(elements);
        this._cy.layout(this._layoutOptions(sizeMap)).run();
      }

      await waitFrames(5);

      if (this._cy && this._workVersion === version) {
        removeOverlaps(this._cy);
      }

      this._executedQuery = query;
      this._executedLanguages = [...this.languages];
      this._executedScaling = this.nodeScaling;
      this._executedWikidata = this.wikidata;
      this._updateOverlay({ status: 'ready' });

      this.dispatchEvent(new CustomEvent(isFirstBuild ? 'graph-ready' : 'graph-updated', {
        detail: { cy: this._cy, quadCount: this._store!.size }, bubbles: true, composed: true
      }));
    } catch (error) {
      if (this._workVersion !== version) return;
      this._updateOverlay({
        status: 'error',
        message: `Query-Fehler: ${error instanceof Error ? error.message : String(error)}`
      });
      this.dispatchEvent(new CustomEvent('query-error', {
        detail: { error: error instanceof Error ? error.message : String(error) }, bubbles: true, composed: true
      }));
    }
  }

  private _setupInteractions(): void {
    if (!this._cy) return;

    this._cy.on('tap', 'node', (evt) => {
      const node = evt.target;
      const cy = this._cy!;
      cy.elements().removeClass('highlighted connected dimmed selected-node');
      const neighborhood = node.neighborhood();
      const connected = neighborhood.add(node);
      cy.elements().addClass('dimmed');
      connected.removeClass('dimmed');
      connected.addClass('highlighted');
      node.addClass('selected-node');
      neighborhood.edges().addClass('connected');
      this._updateNodeInfo(node.data());
      this.dispatchEvent(new CustomEvent('node-selected', {
        detail: node.data(), bubbles: true, composed: true
      }));

      if (this.wikidata === 'expand') {
        const qid = node.data('qid');
        if (qid && !node.hasClass('expanded')) {
          this._expandWikidataNode(node.data('id'), qid);
        }
      }
    });

    this._cy.on('tap', (evt) => {
      if (evt.target === this._cy) {
        this._cy!.elements().removeClass('highlighted connected dimmed selected-node');
        this._updateNodeInfo(null);
        this.dispatchEvent(new CustomEvent('node-deselected', { bubbles: true, composed: true }));
      }
    });
  }

  private async _expandWikidataNode(nodeId: string, qid: string): Promise<void> {
    if (!this._cy) return;
    const node = this._cy.getElementById(nodeId);
    if (node.hasClass('expanded')) return;

    node.data('label', node.data('label') + ' ⏳');

    try {
      const details = await fetchWikidataDetails(qid, this.languages);
      const propLines: string[] = [];
      const linkedEntities: { predicate: string; qid: string; uri: string }[] = [];

      for (const [key, values] of details.properties) {
        for (const v of values) {
          propLines.push(`${key}: ${v}`);
          const linkedQid = v.match(/^(Q\d+)$/)?.[1]
            ?? v.match(/wikidata\.org\/entity\/(Q\d+)/)?.[1];
          if (linkedQid) {
            linkedEntities.push({
              predicate: key, qid: linkedQid,
              uri: `http://www.wikidata.org/entity/${linkedQid}`
            });
          }
        }
      }

      if (linkedEntities.length > 0) {
        const linkedQids = linkedEntities.map(e => e.qid);
        const labels = await fetchWikidataLabels(linkedQids, this.languages);
        const newElements: cytoscape.ElementDefinition[] = [];

        for (const linked of linkedEntities) {
          const targetId = linked.uri;
          const info = labels.get(linked.qid);
          const label = info?.label ?? linked.qid;

          if (!this._cy.getElementById(targetId).length) {
            newElements.push({
              data: {
                id: targetId, label,
                properties: info?.description ?? '',
                qid: linked.qid, indegree: 0,
                nodeSize: NODE_BASE_SIZE,
                nodeWidth: NODE_BASE_SIZE,
                nodeHeight: NODE_BASE_SIZE,
              },
              classes: 'uri wikidata'
            });
          }

          const edgeId = `${nodeId}__${linked.predicate}__${targetId}`;
          if (!this._cy.getElementById(edgeId).length) {
            newElements.push({
              data: { id: edgeId, source: nodeId, target: targetId, label: linked.predicate }
            });
          }
        }

        if (newElements.length > 0) {
          this._cy.add(newElements);

          const neighborhood = node.neighborhood().add(node);
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
      }

      node.data('label', node.data('label').replace(' ⏳', ''));
      node.data('properties', propLines.join('\n'));
      node.addClass('expanded');
      this._updateNodeInfo(node.data());
      this.dispatchEvent(new CustomEvent('node-expanded', {
        detail: { nodeId, qid }, bubbles: true, composed: true
      }));
    } catch (e) {
      node.data('label', node.data('label').replace(' ⏳', ' ❌'));
      console.error('Wikidata expand error:', e);
    }
  }

  // ── Public SVG export API ──────────────────────────────────────────

  exportAsSvg(): void {
    if (!this._cy) return;

    // cytoscape-svg adds the svgExporter method to the cy instance
    const svgContent = (this._cy as any).svg({
      full: true,
      scale: 1
    });

    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const baseName = this.src
      ? this.src.split('/').pop()?.replace(/\.[^.]+$/, '') ?? 'graph'
      : 'graph';

    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${baseName}.svg`;
    anchor.click();

    setTimeout(() => URL.revokeObjectURL(url), 5000);

    this.dispatchEvent(new CustomEvent('svg-exported', {
      detail: { filename: anchor.download }, bubbles: true, composed: true
    }));
  }

  // ── Accessors ─────────────────────────────────────────────────────

  getCy(): cytoscape.Core | null { return this._cy; }
  getStore(): Store | null { return this._store; }
  get quadCount(): number { return this._store?.size ?? 0; }

  // ── Rendering ─────────────────────────────────────────────────────

  protected override render() {
    const showExport =
      this.exportSvg &&
      this._loadingState.status === 'ready' &&
      this._cy !== null;

    return html`
      <div id="cy-container"></div>
      ${this._renderOverlay()}
      ${showExport ? this._renderExportButton() : null}
      ${this._nodeInfo ? html`<div id="node-info">${this._formatNodeInfo(this._nodeInfo)}</div>` : null}
    `;
  }

  private _renderExportButton() {
    return html`
      <button
        id="export-btn"
        title="Graph als SVG exportieren"
        @click=${() => this.exportAsSvg()}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 16l-5-5h3V4h4v7h3l-5 5zm-7 4h14v-2H5v2z"/>
        </svg>
        SVG
      </button>
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

  private _formatNodeInfo(data: NodeInfoData): string {
    const lines = [data.label, data.id, ''];
    if (data.qid) lines.push(`Wikidata: ${data.qid}`);
    if (data.indegree !== undefined) lines.push(`Eingehende Verbindungen: ${data.indegree}`);
    if (data.properties) lines.push(data.properties);
    return lines.join('\n');
  }
}

customElements.define('rdf-graph', RdfGraph);

declare global {
  interface HTMLElementTagNameMap {
    'rdf-graph': RdfGraph;
  }
}