import type { Store } from 'oxigraph';
import * as oxigraph from 'oxigraph/web.js';
import { loadHdtFromUrl } from './loader';

// ── Namespaces ────────────────────────────────────────────────────────────────

const WD          = 'http://www.wikidata.org/entity/';
const RDFS_LABEL  = 'http://www.w3.org/2000/01/rdf-schema#label';
const SCHEMA_DESC = 'http://schema.org/description';

// ── Public types ──────────────────────────────────────────────────────────────

export interface WikidataEntity {
  id: string;
  uri: string;
  label: string;
  description: string;
  properties: Map<string, string[]>;
}

export interface WikidataStoreOptions {
  localStorageKey?: string;
}

// ── LocalStorage-Struktur ─────────────────────────────────────────────────────

interface PersistedGraph {
  url:    string;
  nquads: string;
}

// ── Plain helpers ─────────────────────────────────────────────────────────────

export function isWikidataUri(uri: string): boolean {
  return uri.startsWith('http://www.wikidata.org/entity/Q')
    || uri.startsWith('https://www.wikidata.org/entity/Q');
}

export function extractQid(uri: string): string | null {
  const match = uri.match(/wikidata\.org\/entity\/(Q\d+)/);
  return match ? match[1] : null;
}

// ── Internal store helpers ────────────────────────────────────────────────────

function addSafe(store: Store, quad: oxigraph.Quad): void {
  try {
    store.add(quad);
  } catch (e) {
    console.warn('[wikidata] Could not add quad:', quad.toString(), e);
  }
}

function writeLabelsToStore(
  store: Store,
  qid: string,
  info: { label: string; description: string }
): void {
  const subject = oxigraph.namedNode(`${WD}${qid}`);

  if (info.label) {
    addSafe(store, oxigraph.quad(
      subject,
      oxigraph.namedNode(RDFS_LABEL),
      oxigraph.literal(info.label),
      oxigraph.defaultGraph()
    ));
  }

  if (info.description) {
    addSafe(store, oxigraph.quad(
      subject,
      oxigraph.namedNode(SCHEMA_DESC),
      oxigraph.literal(info.description),
      oxigraph.defaultGraph()
    ));
  }
}

// ── URL detection ─────────────────────────────────────────────────────────────

function isUrl(value: string): boolean {
  try {
    const { protocol } = new URL(value, 'https://example.com'); // Dummy base
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    // Wenn kein Protokoll, aber Pfad (z. B. /path), ist es eine relative URL
    return value.startsWith('/') || value.startsWith('./') || value.startsWith('../');
  }
}


// ── LocalStorage persistence ──────────────────────────────────────────────────

function persistStoreAsync(store: Store, key: string, sourceUrl: string): void {
  setTimeout(() => {
    try {
      const nquads = store.dump({ format: 'application/n-quads' });
      const entry: PersistedGraph = { url: sourceUrl, nquads };
      localStorage.setItem(key, JSON.stringify(entry));
    } catch (e) {
      console.warn(`[WikidataStore] LocalStorage-Persistenz fehlgeschlagen (key="${key}"):`, e);
    }
  }, 0);
}

function findPersistedGraph(key: string, sourceUrl: string): string | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    const entry: PersistedGraph = JSON.parse(raw);

    if (entry.url !== sourceUrl) {
      console.debug(
        `[WikidataStore] LocalStorage-Eintrag gefunden, aber URL stimmt nicht überein.\n` +
        `  gespeichert: ${entry.url}\n` +
        `  angefragt:   ${sourceUrl}`
      );
      return null;
    }

    return entry.nquads;
  } catch (e) {
    console.warn(`[WikidataStore] LocalStorage-Lesen fehlgeschlagen (key="${key}"):`, e);
    return null;
  }
}

function restoreStore(store: Store, key: string, sourceUrl: string): boolean {
  const nquads = findPersistedGraph(key, sourceUrl);
  if (!nquads) return false;

  try {
    store.load(nquads, { format: 'application/n-quads' });
    console.debug(`[WikidataStore] Graph aus LocalStorage wiederhergestellt (key="${key}", url="${sourceUrl}").`);
    return true;
  } catch (e) {
    console.warn(`[WikidataStore] LocalStorage-Wiederherstellung fehlgeschlagen (key="${key}"):`, e);
    return false;
  }
}

// ── Exported fetch helpers ────────────────────────────────────────────────────

export async function fetchWikidataLabels(
  qids: string[],
  languages?: string[],
  wikidataStore?: WikidataStore
): Promise<Map<string, { label: string; description: string }>>;

export async function fetchWikidataLabels(
  qids: string[],
  languages: string[] = ['de', 'en'],
  wikidataStore?: WikidataStore
): Promise<Map<string, { label: string; description: string }>> {
  const result = new Map<string, { label: string; description: string }>();
  if (qids.length === 0) return result;

  // Auf den Store warten bevor wir ihn nutzen
  if (wikidataStore) {
    await wikidataStore.ready;
    for (const qid of qids) {
      if (wikidataStore.isFetchedLabels(qid)) {
        result.set(qid, wikidataStore.getLabelsFromStore(qid));
      }
    }
  }

  const pending = wikidataStore
    ? qids.filter(q => !wikidataStore.isFetchedLabels(q))
    : qids;

  if (pending.length === 0) return result;

  const langChain = [...new Set([...languages, 'mul', 'en'])];
  const langParam  = langChain.join('|');

  for (let i = 0; i < pending.length; i += 50) {
    const chunk = pending.slice(i, i + 50);
    const url = `https://www.wikidata.org/w/api.php?` + new URLSearchParams({
      action: 'wbgetentities',
      ids: chunk.join('|'),
      props: 'labels|descriptions',
      languages: langParam,
      format: 'json',
      origin: '*'
    });

    try {
      const response = await fetch(url);
      const json     = await response.json();

      for (const [qid, entity] of Object.entries(json.entities ?? {}) as any[]) {
        let label:       string | null = null;
        let description: string | null = null;

        for (const lang of langChain) {
          if (!label       && entity.labels?.[lang]?.value)       label       = entity.labels[lang].value;
          if (!description && entity.descriptions?.[lang]?.value) description = entity.descriptions[lang].value;
          if (label && description) break;
        }

        const info = { label: label ?? qid, description: description ?? '' };
        result.set(qid, info);

        if (wikidataStore) {
          writeLabelsToStore(wikidataStore.store, qid, info);
          wikidataStore._markLabelsFetched(qid);
        }
      }

      wikidataStore?._persist();
    } catch (e) {
      console.warn('[wikidata] fetchWikidataLabels API error:', e);
    }
  }

  return result;
}

export async function fetchWikidataDetails(
  qid: string,
  languages?: string[],
  wikidataStore?: WikidataStore
): Promise<WikidataEntity>;

export async function fetchWikidataDetails(
  qid: string,
  languages: string[] = ['de', 'en'],
  wikidataStore?: WikidataStore
): Promise<WikidataEntity> {
  // Auf den Store warten bevor wir ihn nutzen
  if (wikidataStore) await wikidataStore.ready;

  if (wikidataStore?.isFetchedEntity(qid)) {
    return wikidataStore.getEntityFromStore(qid);
  }

  const url = `https://www.wikidata.org/wiki/Special:EntityData/${qid}.jsonld`;

  let text: string;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
    text = await res.text();
  } catch (e) {
    console.error(`[wikidata] fetchWikidataDetails fetch failed for ${qid}:`, e);
    throw e;
  }

  if (wikidataStore) {
    try {
      wikidataStore.store.load(text, {
        format: 'application/ld+json',
        base_iri: url
      });
    } catch (e) {
      console.error(`[wikidata] fetchWikidataDetails store.load failed for ${qid}:`, e);
      throw e;
    }
    wikidataStore._markEntityFetched(qid);
    wikidataStore._markLabelsFetched(qid);
    wikidataStore._persist();
    return wikidataStore.getEntityFromStore(qid);
  }

  const json       = JSON.parse(text);
  const graph      = json['@graph'] ?? [json];
  const entityNode = graph.find((n: any) =>
    n['@id'] === `${WD}${qid}`
  ) ?? {};

  const properties = new Map<string, string[]>();
  for (const [key, val] of Object.entries(entityNode)) {
    if (key.startsWith('@')) continue;
    const values       = Array.isArray(val) ? val : [val];
    const stringValues = values
      .map((v: any) => (typeof v === 'object' ? v['@value'] ?? v['@id'] ?? '' : String(v)))
      .filter(Boolean);
    if (stringValues.length > 0) properties.set(key, stringValues);
  }

  const labelEntry  = properties.get(RDFS_LABEL);
  const label       = labelEntry
    ? (labelEntry.find(l => languages.some(lang => l.startsWith(lang))) ?? labelEntry[0] ?? qid)
    : qid;

  const descEntry   = properties.get(SCHEMA_DESC);
  const description = descEntry?.[0] ?? '';

  return { id: qid, uri: `${WD}${qid}`, label, description, properties };
}

// ── WikidataStore ─────────────────────────────────────────────────────────────

export class WikidataStore {
  private readonly _store:          Store;
  private readonly _fetchedLabels   = new Set<string>();
  private readonly _fetchedEntities = new Set<string>();
  private readonly _localStorageKey: string | null;
  private readonly _sourceUrl:       string;

  /**
   * Resolved sobald der Store vollständig initialisiert ist.
   * Bei URL-Übergabe: nach dem Laden der HDT-Datei (oder aus LocalStorage).
   * Bei Store-Übergabe: sofort.
   *
   * Alle öffentlichen Methoden awaiten dies intern – der Aufrufer muss
   * `ready` nicht selbst abwarten, kann es aber für optimistisches UI nutzen:
   *
   * @example
   * const ws = new WikidataStore('https://example.com/data.hdt');
   * ws.ready.then(() => console.log('Store bereit, Größe:', ws.size));
   * // Code hier läuft sofort weiter ↓
   */
  readonly ready: Promise<void>;

  // ── Konstruktor ────────────────────────────────────────────────────────────

  /**
   * @param storeOrUrl  Oxigraph-`Store`-Instanz **oder** HTTP(S)-URL zur HDT-Datei.
   * @param options     Optionale Einstellungen (z. B. `localStorageKey`).
   *
   * @example
   * // Sofort verfügbar, Laden im Hintergrund
   * const ws = new WikidataStore('https://example.com/data.hdt', {
   *   localStorageKey: 'my-app:graph'
   * });
   *
   * // Optional: auf vollständige Initialisierung warten
   * await ws.ready;
   *
   * @example
   * // Bestehenden Store übergeben
   * const ws = new WikidataStore(existingStore);
   */
  constructor(storeOrUrl: Store | string, options: WikidataStoreOptions = {}) {
    this._localStorageKey = options.localStorageKey ?? null;

    if (typeof storeOrUrl === 'string') {
      // ── URL-Pfad: leerer Store, Laden im Hintergrund ───────────────────
      const url = storeOrUrl;

      if (!isUrl(url)) {
        throw new Error(
          `[WikidataStore] Ungültiges Argument: "${url}" ist weder eine ` +
          `gültige HTTP(S)-URL noch eine Store-Instanz.`
        );
      }

      this._store     = new oxigraph.Store();
      this._sourceUrl = url;

      // `ready` kapselt den gesamten Ladevorgang; der Konstruktor kehrt
      // sofort zurück, während dies im Hintergrund läuft.
      this.ready = this._initialize(url);

    } else {
      // ── Store-Pfad: sofort bereit ──────────────────────────────────────
      this._store     = storeOrUrl;
      this._sourceUrl = '';
      this.ready      = Promise.resolve();

      if (this._localStorageKey) {
        const restored = restoreStore(this._store, this._localStorageKey, '');
        if (restored) this._rebuildFetchedSetsFromStore();
      }
    }
  }

  /**
   * Interner Ladevorgang für den URL-Pfad.
   * Wird einmalig vom Konstruktor gestartet und in `this.ready` gespeichert.
   */
  private async _initialize(url: string): Promise<void> {
    // 1. Cache prüfen
    if (this._localStorageKey) {
      const restored = restoreStore(this._store, this._localStorageKey, url);
      if (restored) {
        console.debug(`[WikidataStore] Cache-Hit für "${url}" – HDT wird nicht neu geladen.`);
        this._rebuildFetchedSetsFromStore();
        return;
      }
      console.debug(`[WikidataStore] Kein Cache für "${url}" – lade HDT von URL.`);
    }

    // 2. HDT laden
    const loadedStore = await loadHdtFromUrl(url);
    for (const quad of loadedStore) {
      addSafe(this._store, quad as oxigraph.Quad);
    }

    console.debug(`[WikidataStore] HDT geladen: ${this._store.size} Quads von "${url}".`);

    // 3. Nicht-blockierend persistieren
    this._persist();
  }

  // ── Getters ────────────────────────────────────────────────────────────────

  get store():     Store  { return this._store; }
  get size():      number { return this._store.size; }
  get sourceUrl(): string { return this._sourceUrl; }

  query(sparql: string): unknown {
    return this._store.query(sparql);
  }

  // ── LocalStorage ───────────────────────────────────────────────────────────

  _persist(): void {
    if (this._localStorageKey) {
      persistStoreAsync(this._store, this._localStorageKey, this._sourceUrl);
    }
  }

  clearLocalStorage(): void {
    if (this._localStorageKey) {
      localStorage.removeItem(this._localStorageKey);
    }
  }

  private _rebuildFetchedSetsFromStore(): void {
    try {
      const rows = this._store.query(
        'SELECT DISTINCT ?s WHERE { ?s ?p ?o }'
      ) as any[];

      for (const row of rows) {
        const uri = row.get('s')?.value ?? '';
        const qid = extractQid(uri);
        if (!qid) continue;

        this._fetchedLabels.add(qid);

        const propRows = this._store.query(
          `SELECT ?p WHERE { <${WD}${qid}> ?p ?o }`
        ) as any[];

        if (propRows.length > 2) {
          this._fetchedEntities.add(qid);
        }
      }

      console.debug(
        `[WikidataStore] Wiederhergestellt: ${this._fetchedLabels.size} Label-QIDs, ` +
        `${this._fetchedEntities.size} Entity-QIDs.`
      );
    } catch (e) {
      console.warn('[WikidataStore] _rebuildFetchedSetsFromStore fehlgeschlagen:', e);
    }
  }

  // ── Cache state ────────────────────────────────────────────────────────────

  isFetchedLabels(qid: string):  boolean { return this._fetchedLabels.has(qid); }
  isFetchedEntity(qid: string):  boolean { return this._fetchedEntities.has(qid); }

  /** @internal */
  _markLabelsFetched(qid: string): void { this._fetchedLabels.add(qid); }
  /** @internal */
  _markEntityFetched(qid: string): void { this._fetchedEntities.add(qid); }

  // ── Convenience methods ────────────────────────────────────────────────────

  async enrichLabels(
    qids: string[],
    languages: string[] = ['de', 'en']
  ): Promise<Map<string, { label: string; description: string }>> {
    return fetchWikidataLabels(qids, languages, this);
  }

  async enrichEntity(
    qid: string,
    languages: string[] = ['de', 'en']
  ): Promise<WikidataEntity> {
    return fetchWikidataDetails(qid, languages, this);
  }

  async enrichEntities(
    qids: string[],
    languages: string[] = ['de', 'en']
  ): Promise<Map<string, WikidataEntity>> {
    const result = new Map<string, WikidataEntity>();
    for (const qid of qids) {
      try {
        result.set(qid, await this.enrichEntity(qid, languages));
      } catch {
        // logged inside fetchWikidataDetails
      }
    }
    return result;
  }

  async enrichIncomingLinks(
    uri: string,
    languages: string[] = ['de', 'en'],
    limit = 50
  ): Promise<WikidataEntity[]> {
    const qid = extractQid(uri);
    if (!qid) {
      console.warn(`[WikidataStore] enrichIncomingLinks: not a Wikidata URI: ${uri}`);
      return [];
    }

    const sparql = `
      PREFIX wd: <http://www.wikidata.org/entity/>

      SELECT DISTINCT ?subject WHERE {
        ?subject ?p wd:${qid} .
        FILTER(STRSTARTS(STR(?subject), "http://www.wikidata.org/entity/Q"))
      } LIMIT ${limit}
    `;

    let incomingQids: string[];
    try {
      const res = await fetch('https://query.wikidata.org/sparql', {
        method: 'POST',
        headers: {
          'Accept': 'application/sparql-results+json',
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'HDT-Browser-Viewer/1.0'
        },
        body: new URLSearchParams({ query: sparql })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
      const json = await res.json();

      incomingQids = (json.results.bindings as any[])
        .map(b => extractQid(b.subject?.value ?? ''))
        .filter((q): q is string => q !== null);
    } catch (e) {
      console.error(`[WikidataStore] enrichIncomingLinks SPARQL failed for ${uri}:`, e);
      throw e;
    }

    if (incomingQids.length === 0) return [];

    const results: WikidataEntity[] = [];
    for (const incomingQid of incomingQids) {
      try {
        results.push(await this.enrichEntity(incomingQid, languages));
      } catch {
        // logged inside enrichEntity / fetchWikidataDetails
      }
    }

    return results;
  }

  // ── Store reconstruction ───────────────────────────────────────────────────

  getLabelsFromStore(qid: string): { label: string; description: string } {
    const uri = `${WD}${qid}`;
    let   label       = qid;
    let   description = '';

    try {
      const lr = this._store.query(
        `SELECT ?l WHERE { <${uri}> <${RDFS_LABEL}> ?l } LIMIT 1`
      ) as any[];
      if (lr.length > 0) label = lr[0].get('l').value;

      const dr = this._store.query(
        `SELECT ?d WHERE { <${uri}> <${SCHEMA_DESC}> ?d } LIMIT 1`
      ) as any[];
      if (dr.length > 0) description = dr[0].get('d').value;
    } catch (e) {
      console.warn(`[WikidataStore] getLabelsFromStore failed for ${qid}:`, e);
    }

    return { label, description };
  }

  getEntityFromStore(qid: string): WikidataEntity {
    const uri                    = `${WD}${qid}`;
    const properties             = new Map<string, string[]>();
    const { label, description } = this.getLabelsFromStore(qid);

    try {
      const rows = this._store.query(
        `SELECT ?p ?o WHERE { <${uri}> ?p ?o }`
      ) as any[];
      for (const row of rows) {
        const key = row.get('p').value;
        const val = row.get('o').value;
        if (!properties.has(key)) properties.set(key, []);
        properties.get(key)!.push(val);
      }
    } catch (e) {
      console.warn(`[WikidataStore] getEntityFromStore failed for ${qid}:`, e);
    }

    return { id: qid, uri, label, description, properties };
  }
}