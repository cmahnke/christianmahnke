import { LitElement, html, nothing, PropertyValues, TemplateResult } from 'lit';
import { loadHdtFromUrl } from '../loader.js';
import { componentStyles } from './styles.js';
import { createSparqlEditor } from 'sparql-editor';

import "../../scss/sparql/sparql.scss";

// =====================
// TYPES
// =====================

interface OxigraphStore {
  load(data: string, options: { format: string; base_iri?: string }): void;
  query(sparql: string): any;
  size: number;
  dump(options: { format: string }): string;
}

type InputTab = 'url' | 'text';
type StatusType = 'success' | 'loading' | 'error' | '';

interface ResultColumn {
  name: string;
}

interface ResultRow {
  [key: string]: any;
}

interface QueryResult {
  type: 'bindings' | 'boolean' | 'graph';
  columns?: ResultColumn[];
  rows?: ResultRow[];
  boolean?: boolean;
  quads?: any[];
}

interface FormattedTerm {
  type: string;
  value: string;
  lang?: string;
  datatype?: string;
}

// =====================
// CONSTANTS
// =====================

// Rows per page in the results table 
const ROWS_PER_PAGE = 100;

const PREFIX_MAP: Record<string, string> = {
  'http://www.w3.org/1999/02/22-rdf-syntax-ns#': 'rdf:',
  'http://www.w3.org/2000/01/rdf-schema#': 'rdfs:',
  'http://www.w3.org/2002/07/owl#': 'owl:',
  'http://www.w3.org/2001/XMLSchema#': 'xsd:',
  'http://xmlns.com/foaf/0.1/': 'foaf:',
  'http://purl.org/dc/elements/1.1/': 'dc:',
  'http://purl.org/dc/terms/': 'dct:',
  'http://schema.org/': 'schema:',
  'http://www.w3.org/2004/02/skos/core#': 'skos:',
};

const MIME_MAP: Record<string, string> = {
  turtle: 'text/turtle',
  ntriples: 'application/n-triples',
  rdfxml: 'application/rdf+xml',
  nquads: 'application/n-quads',
  trig: 'application/trig',
};

const HDT_EXTENSIONS = ['.hdt'];
const HDT_MIMETYPES = ['application/x-hdt', 'application/hdt'];

function isHdt(url: string, contentType: string): boolean {
  const lowerUrl = url.toLowerCase();
  for (let i = 0; i < HDT_EXTENSIONS.length; i++) {
    if (lowerUrl.endsWith(HDT_EXTENSIONS[i])) return true;
  }
  const lowerCt = contentType.toLowerCase();
  for (let i = 0; i < HDT_MIMETYPES.length; i++) {
    if (lowerCt.includes(HDT_MIMETYPES[i])) return true;
  }
  return false;
}

function detectRdfFormat(url: string, contentType: string, fallback: string): string {
  const lowerUrl = url.toLowerCase();
  const lowerCt = contentType.toLowerCase();

  if (lowerCt.includes('turtle') || lowerUrl.endsWith('.ttl')) return 'turtle';
  if (lowerCt.includes('n-triples') || lowerUrl.endsWith('.nt')) return 'ntriples';
  if (lowerCt.includes('rdf+xml') || lowerUrl.endsWith('.rdf') || lowerUrl.endsWith('.owl')) return 'rdfxml';
  if (lowerCt.includes('n-quads') || lowerUrl.endsWith('.nq')) return 'nquads';
  if (lowerCt.includes('trig') || lowerUrl.endsWith('.trig')) return 'trig';

  return fallback;
}

// =====================
// COMPONENT
// =====================

export class OxigraphSparql extends LitElement {

  static override get styles() {
    return componentStyles;
  }

  static override get properties(): Record<string, object> {
    return {
      query:         { type: String },
      dataUrl:       { type: String, attribute: 'data-url' },
      rdfData:       { type: String, attribute: 'rdf-data' },
      rdfFormat:     { type: String, attribute: 'rdf-format' },
      heading:       { type: String },
      hideDataInput: { type: Boolean, attribute: 'hide-data-input' },
      autoExecute:   { type: Boolean, attribute: 'auto-execute' },

      _store:          { state: true },
      _loading:        { state: true },
      _loadingData:    { state: true },
      _result:         { state: true },
      _error:          { state: true },
      _statusMessage:  { state: true },
      _statusType:     { state: true },
      _tripleCount:    { state: true },
      _executionTime:  { state: true },
      _oxigraphReady:  { state: true },
      _activeInputTab: { state: true },
      _urlInput:       { state: true },
      _textInput:      { state: true },
      _storeLocked:    { state: true },
      _currentPage:    { state: true },
    };
  }

  // Public
  query: string;
  dataUrl: string;
  rdfData: string;
  rdfFormat: string;
  heading: string;
  hideDataInput: boolean;
  autoExecute: boolean;

  // Internal
  private _store: OxigraphStore | null;
  private _loading: boolean;
  private _loadingData: boolean;
  private _result: QueryResult | null;
  private _error: string | null;
  private _statusMessage: string;
  private _statusType: StatusType;
  private _tripleCount: number;
  private _executionTime: number;
  private _oxigraphReady: boolean;
  private _activeInputTab: InputTab;
  private _urlInput: string;
  private _textInput: string;
  private _oxigraphModule: any;
  private _storeLocked: boolean;

  /** Aktuelle Seite der Ergebnistabelle (0-basiert) */
  private _currentPage: number;

  private _editor: any = null;
  private _currentQueryText: string;

  constructor() {
    super();

    this.query = 'SELECT ?s ?p ?o\nWHERE {\n  ?s ?p ?o .\n}\nLIMIT 25';
    this.dataUrl = '';
    this.rdfData = '';
    this.rdfFormat = 'turtle';
    this.heading = '';
    this.hideDataInput = false;
    this.autoExecute = false;

    this._store = null;
    this._loading = false;
    this._loadingData = false;
    this._result = null;
    this._error = null;
    this._statusMessage = '';
    this._statusType = '';
    this._tripleCount = 0;
    this._executionTime = 0;
    this._oxigraphReady = false;
    this._activeInputTab = 'text';
    this._urlInput = '';
    this._textInput = '';
    this._oxigraphModule = null;
    this._storeLocked = false;
    this._currentPage = 0;

    this._currentQueryText = this.query;
  }

  // =====================
  // COMPUTED
  // =====================

  private _hasAttributeData(): boolean {
    return !!(this.rdfData.trim() || this.dataUrl.trim());
  }

  private _shouldShowDataInput(): boolean {
    if (this.hideDataInput) return false;
    if (this._storeLocked) return false;
    return true;
  }

  private _shouldShowHeader(): boolean {
    return !!this.heading;
  }

  private _isEditorDisabled(): boolean {
    return !this._oxigraphReady || this._loadingData;
  }

  // =====================
  // PAGINATION HELPERS
  // =====================

  private _totalPages(): number {
    const rows = this._result?.rows?.length ?? 0;
    return Math.max(1, Math.ceil(rows / ROWS_PER_PAGE));
  }

  private _pagedRows(): ResultRow[] {
    const rows = this._result?.rows ?? [];
    const start = this._currentPage * ROWS_PER_PAGE;
    return rows.slice(start, start + ROWS_PER_PAGE);
  }

  private _goToPage(page: number): void {
    const total = this._totalPages();
    this._currentPage = Math.max(0, Math.min(page, total - 1));
  }

  private _goFirst(): void { this._goToPage(0); }
  private _goPrev(): void  { this._goToPage(this._currentPage - 1); }
  private _goNext(): void  { this._goToPage(this._currentPage + 1); }
  private _goLast(): void  { this._goToPage(this._totalPages() - 1); }

  // =====================
  // LIFECYCLE
  // =====================

  override connectedCallback(): void {
    super.connectedCallback();
    this._initOxigraph();
  }

  override firstUpdated(changedProperties: PropertyValues): void {
    super.firstUpdated(changedProperties);
    this._mountEditor();
  }

  override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);

    if (changedProperties.has('query') && this._editor) {
      const current = this._editor.state.doc.toString();
      if (current !== this.query) {
        this._editor.dispatch({
          changes: { from: 0, to: current.length, insert: this.query },
        });
      }
      this._currentQueryText = this.query;
    }

    if (changedProperties.has('rdfData') && this.rdfData && this._oxigraphReady) {
      this._lockAndLoad(() => this._loadRdfString(this.rdfData, this.rdfFormat));
    }

    if (changedProperties.has('dataUrl') && this.dataUrl && this._oxigraphReady) {
      this._urlInput = this.dataUrl;
      this._lockAndLoad(() => this._loadFromUrl(this.dataUrl));
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this._editor && typeof this._editor.destroy === 'function') {
      this._editor.destroy();
    }
    this._editor = null;
  }

  private async _lockAndLoad(loadFn: () => Promise<void>): Promise<void> {
    this._storeLocked = true;
    await loadFn();
    if (this.autoExecute) {
      await this._executeQuery();
    }
  }

  // =====================
  // EDITOR SETUP
  // =====================

  private _mountEditor(): void {
    if (this.hideDataInput) return;

    const container = this.renderRoot.querySelector<HTMLElement>('#query-editor-container');
    if (!container) return;

    this._editor = createSparqlEditor({
      parent: container,
      value: this.query,
      onChange: (value: string) => {
        this._currentQueryText = value;
      },
    });
  }

  // =====================
  // OXIGRAPH INIT
  // =====================

  private async _initOxigraph(): Promise<void> {
    if (this._oxigraphReady) return;
    this._setStatus('Initialisiere…', 'loading');

    try {
      this._oxigraphModule = await import('oxigraph/web.js');

      if (typeof this._oxigraphModule.default === 'function') {
        await this._oxigraphModule.default();
      }

      this._store = new this._oxigraphModule.Store();
      this._oxigraphReady = true;
      this._tripleCount = 0;
      this._setStatus('Bereit', 'success');

      if (this._hasAttributeData()) {
        this._storeLocked = true;

        if (this.rdfData) {
          await this._loadRdfString(this.rdfData, this.rdfFormat);
        }
        if (this.dataUrl) {
          this._urlInput = this.dataUrl;
          await this._loadFromUrl(this.dataUrl);
        }
        if (this.autoExecute && this._tripleCount > 0) {
          await this._executeQuery();
        }
      }
    } catch (err: any) {
      this._setStatus('Initialisierungsfehler', 'error');
      this._error = err.message;
      console.error('OxiGraph init error:', err);
    }
  }

  // =====================
  // DATA LOADING
  // =====================

  private async _loadRdfString(data: string, format: string): Promise<void> {
    if (!this._store || !data.trim()) return;

    try {
      this._loadingData = true;
      this._setStatus('Lade Daten…', 'loading');

      const mimeType = MIME_MAP[format] || 'text/turtle';
      this._store.load(data, { format: mimeType });

      this._tripleCount = this._store.size;
      this._setStatus(this._tripleCount + ' Tripel', 'success');
      this._error = null;

      this.dispatchEvent(new CustomEvent('data-loaded', {
        detail: { tripleCount: this._tripleCount },
        bubbles: true,
        composed: true,
      }));
    } catch (err: any) {
      this._setStatus('Parse-Fehler', 'error');
      this._error = err.message;
    } finally {
      this._loadingData = false;
    }
  }

  private async _loadFromUrl(url: string): Promise<void> {
    if (!url.trim()) return;

    if (isHdt(url, '')) {
      await this._loadHdt(url);
      return;
    }

    try {
      this._loadingData = true;
      this._setStatus('Lade…', 'loading');

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('HTTP ' + response.status + ': ' + response.statusText);
      }

      const contentType = response.headers.get('content-type') || '';

      if (isHdt(url, contentType)) {
        await this._loadHdt(url);
        return;
      }

      if (!this._store) return;
      const text = await response.text();
      const format = detectRdfFormat(url, contentType, this.rdfFormat);
      await this._loadRdfString(text, format);
    } catch (err: any) {
      this._setStatus('Ladefehler', 'error');
      this._error = err.message;
    } finally {
      this._loadingData = false;
    }
  }

  private async _loadHdt(url: string): Promise<void> {
    if (!url.trim()) return;

    try {
      this._loadingData = true;
      this._setStatus('Lade HDT…', 'loading');

      const store = await loadHdtFromUrl(url);
      this._store = store as unknown as OxigraphStore;
      this._tripleCount = this._store.size;
      this._setStatus(this._tripleCount + ' Tripel', 'success');
      this._error = null;

      if (this.autoExecute) {
        await this._executeQuery();
      }
    } catch (err: any) {
      this._setStatus('HDT-Fehler', 'error');
      this._error = err.message;
    } finally {
      this._loadingData = false;
    }
  }

  // =====================
  // QUERY
  // =====================

  private async _executeQuery(): Promise<void> {
    if (!this._store) return;

    const queryText = this._currentQueryText.trim();
    if (!queryText) return;

    this._loading = true;
    this._error = null;
    this._result = null;
    this._currentPage = 0;
    this._setStatus('Abfrage…', 'loading');

    try {
      const t0 = performance.now();
      const result = this._store.query(queryText);
      this._executionTime = Math.round((performance.now() - t0) * 100) / 100;

      this._result = this._processResult(result);

      let count: string;
      if (this._result.type === 'bindings') {
        count = (this._result.rows?.length ?? 0) + ' Ergebnisse';
      } else if (this._result.type === 'boolean') {
        count = 'ASK: ' + this._result.boolean;
      } else {
        count = (this._result.quads?.length ?? 0) + ' Tripel';
      }

      this._setStatus(count + ' · ' + this._executionTime + ' ms', 'success');

      this.dispatchEvent(new CustomEvent('query-executed', {
        detail: { result: this._result, executionTime: this._executionTime },
        bubbles: true,
        composed: true,
      }));
    } catch (err: any) {
      this._error = err.message;
      this._setStatus('Fehler', 'error');

      this.dispatchEvent(new CustomEvent('query-error', {
        detail: { error: err.message },
        bubbles: true,
        composed: true,
      }));
    } finally {
      this._loading = false;
    }
  }

  private _processResult(result: any): QueryResult {
    if (typeof result === 'boolean') {
      return { type: 'boolean', boolean: result };
    }

    if (Array.isArray(result) || (result && Symbol.iterator in Object(result))) {
      const entries: any[] = [...result];

      if (entries.length === 0) {
        return { type: 'bindings', columns: [], rows: [] };
      }

      const first = entries[0];

      if (first && 'subject' in first && 'predicate' in first) {
        return { type: 'graph', quads: entries };
      }

      if (typeof first.get === 'function' || first instanceof Map) {
        const columnSet = new Set<string>();
        const rows: ResultRow[] = [];

        for (const binding of entries) {
          const row: ResultRow = {};
          const iter: Iterable<[any, any]> =
            typeof binding.entries === 'function' ? binding.entries() : binding;

          for (const [key, value] of iter) {
            const colName: string =
              typeof key === 'string'
                ? (key.startsWith('?') ? key.slice(1) : key)
                : String(key);
            columnSet.add(colName);
            row[colName] = value;
          }
          rows.push(row);
        }

        const columns: ResultColumn[] = [...columnSet].map(
          (name: string) => ({ name })
        );
        return { type: 'bindings', columns, rows };
      }
    }

    return { type: 'bindings', columns: [], rows: [] };
  }

  // =====================
  // HELPERS
  // =====================

  private _setStatus(msg: string, type: StatusType): void {
    this._statusMessage = msg;
    this._statusType = type;
  }

  private _formatTerm(term: any): FormattedTerm {
    if (!term) return { type: 'empty', value: '' };
    if (term.termType === 'NamedNode') return { type: 'uri', value: term.value };
    if (term.termType === 'BlankNode') return { type: 'bnode', value: '_:' + term.value };
    if (term.termType === 'Literal') {
      return {
        type: 'literal',
        value: term.value,
        lang: term.language || undefined,
        datatype: term.datatype?.value || undefined,
      };
    }
    return { type: 'unknown', value: String(term) };
  }

  private _shortenUri(uri: string): string {
    const entries = Object.entries(PREFIX_MAP);
    for (let i = 0; i < entries.length; i++) {
      if (uri.startsWith(entries[i][0])) {
        return entries[i][1] + uri.slice(entries[i][0].length);
      }
    }
    return uri;
  }

  public setQuery(sparqlQuery: string): void {
    this.query = sparqlQuery;
    this._currentQueryText = sparqlQuery;
    if (this._editor) {
      const current = this._editor.state.doc.toString();
      this._editor.dispatch({
        changes: { from: 0, to: current.length, insert: sparqlQuery },
      });
    }
  }

  public runQuery(): void {
    this._executeQuery();
  }

  // =====================
  // EVENT HANDLERS
  // =====================

  private _handleKeydown(e: KeyboardEvent): void {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      this._executeQuery();
      return;
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.target as HTMLTextAreaElement;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      textarea.value =
        textarea.value.substring(0, start) + '  ' + textarea.value.substring(end);
      textarea.selectionStart = start + 2;
      textarea.selectionEnd = start + 2;
    }
  }

  private async _handleLoadData(): Promise<void> {
    if (this._storeLocked) return;

    if (this._activeInputTab === 'url' && this._urlInput.trim()) {
      this._store = new this._oxigraphModule.Store();
      await this._loadFromUrl(this._urlInput.trim());
    } else if (this._activeInputTab === 'text' && this._textInput.trim()) {
      this._store = new this._oxigraphModule.Store();
      await this._loadRdfString(this._textInput.trim(), this.rdfFormat);
    }
  }

  private _handleTabClick(tab: InputTab): void {
    if (this._storeLocked) return;
    this._activeInputTab = tab;
  }

  private _handleUrlInput(e: Event): void {
    this._urlInput = (e.target as HTMLInputElement).value;
  }

  private _handleTextInput(e: Event): void {
    this._textInput = (e.target as HTMLTextAreaElement).value;
  }

  // =====================
  // RENDER
  // =====================

  override render(): TemplateResult {
    return html`
      <div class="wrapper">
        ${this._shouldShowHeader() ? this._renderHeader() : nothing}
        ${this._shouldShowDataInput() ? this._renderDataSection() : nothing}
        ${!this.hideDataInput ? this._renderEditor() : nothing}
        ${!this.hideDataInput ? this._renderActions() : nothing}
        ${this._renderResults()}
      </div>
    `;
  }

  private _renderHeader(): TemplateResult {
    let src = '';
    if (this._storeLocked) {
      if (this.rdfData.trim()) {
        src = 'Inline RDF';
      } else if (this.dataUrl.trim()) {
        src = this.dataUrl;
      }
    }

    return html`
      <div class="header">
        <div class="header-top">
          <h2>${this.heading}</h2>
          <div class="header-meta">
            ${this._storeLocked
              ? html`<span class="meta-badge locked">Feste Quelle</span>`
              : nothing}
            ${this._tripleCount > 0
              ? html`<span class="meta-badge">${this._tripleCount} Tripel</span>`
              : nothing}
          </div>
        </div>
        ${src
          ? html`
            <div class="source-notice">
              <span class="source-label">Quelle</span>
              <span class="source-value">${src}</span>
            </div>
          `
          : nothing}
      </div>
    `;
  }

  private _renderDataSection(): TemplateResult {
    return html`
      <div class="data-section">
        <div class="tab-bar">
          <button
            class=${this._activeInputTab === 'text' ? 'active' : ''}
            @click=${() => this._handleTabClick('text')}
          >Turtle</button>
          <button
            class=${this._activeInputTab === 'url' ? 'active' : ''}
            @click=${() => this._handleTabClick('url')}
          >URL</button>
        </div>
        ${this._renderActiveTab()}
      </div>
    `;
  }

  private _renderActiveTab(): TemplateResult {
    if (this._activeInputTab === 'url') {
      return html`
        <div class="input-row">
          <input type="text"
            placeholder="https://example.org/data.ttl"
            .value=${this._urlInput}
            @input=${this._handleUrlInput} />
          <button class="btn-secondary"
            ?disabled=${!this._oxigraphReady || this._loadingData}
            @click=${this._handleLoadData}>Laden</button>
        </div>
      `;
    }

    return html`
      <div class="input-col">
        <textarea
          placeholder="@prefix ex: <http://example.org/> .&#10;ex:Alice a ex:Person ."
          .value=${this._textInput}
          @input=${this._handleTextInput}></textarea>
        <button class="btn-secondary"
          ?disabled=${!this._oxigraphReady || this._loadingData}
          @click=${this._handleLoadData}>In Store laden</button>
      </div>
    `;
  }

  private _renderEditor(): TemplateResult {
    return html`
      <div class="editor-section">
        <div
          id="query-editor-container"
          ?inert=${this._isEditorDisabled()}
        ></div>
      </div>
    `;
  }

  private _renderActions(): TemplateResult {
    return html`
      <div class="actions">
        <button class="btn-primary"
          ?disabled=${!this._oxigraphReady || this._loading}
          @click=${this._executeQuery}>
          ${this._loading ? 'Läuft…' : 'Ausführen'}
        </button>
        <span class="hint">Ctrl + Enter</span>
        ${this._statusMessage
          ? html`<span class="status ${this._statusType}">${this._statusMessage}</span>`
          : nothing}
      </div>
    `;
  }

  private _renderResults(): TemplateResult {
    let content: TemplateResult | symbol;

    if (this._loading) {
      content = html`<div class="loading"><div class="spinner"></div></div>`;
    } else if (this._error) {
      content = this._renderError();
    } else if (this._result) {
      content = this._renderResultContent();
    } else {
      content = html`<p class="placeholder-text">Keine Ergebnisse.</p>`;
    }

    return html`<div class="results-section">${content}</div>`;
  }

  private _renderError(): TemplateResult {
    return html`
      <div class="error-box">
        <pre>${this._error}</pre>
      </div>
    `;
  }

  private _renderResultContent(): TemplateResult | symbol {
    if (!this._result) return nothing;
    switch (this._result.type) {
      case 'boolean': return this._renderBooleanResult();
      case 'graph':   return this._renderGraphResult();
      case 'bindings':
      default:        return this._renderBindingsResult();
    }
  }

  private _renderBooleanResult(): TemplateResult {
    const val = this._result!.boolean;
    return html`
      <div class="boolean-result ${val ? 'is-true' : 'is-false'}">
        ${val ? 'True' : 'False'}
      </div>
    `;
  }

  private _renderGraphResult(): TemplateResult {
    const quads = this._result!.quads || [];
    const lines = quads.map((q: any) => {
      const s = this._shortenUri(q.subject?.value ?? String(q.subject));
      const p = this._shortenUri(q.predicate?.value ?? String(q.predicate));
      let o: string;
      if (q.object?.termType === 'Literal') {
        o = '"' + q.object.value + '"';
        if (q.object.language) o += '@' + q.object.language;
      } else {
        o = this._shortenUri(q.object?.value ?? String(q.object));
      }
      return s + '  ' + p + '  ' + o + ' .';
    });
    return html`<pre class="graph-result">${lines.join('\n')}</pre>`;
  }

  private _renderBindingsResult(): TemplateResult {
    const columns = this._result!.columns || [];
    const allRows = this._result!.rows || [];

    if (columns.length === 0 || allRows.length === 0) {
      return html`<p class="placeholder-text">Keine Ergebnisse.</p>`;
    }

    const totalPages  = this._totalPages();
    const currentPage = this._currentPage;
    const pagedRows   = this._pagedRows();

    const rangeStart = currentPage * ROWS_PER_PAGE + 1;
    const rangeEnd   = Math.min(rangeStart + ROWS_PER_PAGE - 1, allRows.length);

    // Tabelle und Pagination als separate Variablen –
    // pagination landet dadurch NICHT innerhalb von table-wrap
    const tableMarkup = html`
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              ${columns.map((col: ResultColumn) => html`<th>?${col.name}</th>`)}
            </tr>
          </thead>
          <tbody>
            ${pagedRows.map((row: ResultRow) => html`
              <tr>
                ${columns.map((col: ResultColumn) =>
                  html`<td>${this._renderCell(row[col.name])}</td>`
                )}
              </tr>
            `)}
          </tbody>
        </table>
      </div>
    `;

    const paginationMarkup = totalPages > 1
      ? this._renderPagination(currentPage, totalPages, rangeStart, rangeEnd, allRows.length)
      : nothing;

    // bindings-result ist der gemeinsame Wrapper;
    // table-wrap und pagination sind direkte Geschwister darin
    return html`
      <div class="bindings-result">
        ${tableMarkup}
        ${paginationMarkup}
      </div>
    `;
  }

  private _renderPagination(
    current: number,
    total: number,
    rangeStart: number,
    rangeEnd: number,
    totalRows: number,
  ): TemplateResult {

    const pageNumbers = this._buildPageWindow(current, total);

    return html`
      <nav class="pagination" aria-label="Seitennavigation">

        <span class="pagination-info">
          Zeige ${rangeStart}–${rangeEnd} von ${totalRows}
          &nbsp;|&nbsp;
          Seite ${current + 1} von ${total}
        </span>

        <div class="pagination-controls">

          <button
            class="pagination-btn"
            title="Erste Seite"
            ?disabled=${current === 0}
            @click=${this._goFirst}
          >«</button>

          <button
            class="pagination-btn"
            title="Vorherige Seite"
            ?disabled=${current === 0}
            @click=${this._goPrev}
          >‹</button>

          ${pageNumbers.map(entry =>
            entry === -1
              ? html`<span class="pagination-ellipsis">…</span>`
              : html`
                  <button
                    class="pagination-btn ${entry === current ? 'active' : ''}"
                    ?disabled=${entry === current}
                    @click=${() => this._goToPage(entry)}
                  >${entry + 1}</button>
                `
          )}

          <button
            class="pagination-btn"
            title="Nächste Seite"
            ?disabled=${current === total - 1}
            @click=${this._goNext}
          >›</button>

          <button
            class="pagination-btn"
            title="Letzte Seite"
            ?disabled=${current === total - 1}
            @click=${this._goLast}
          >»</button>

        </div>
      </nav>
    `;
  }

  private _buildPageWindow(current: number, total: number): number[] {
    const WINDOW = 2;
    const pages: number[] = [];
    const seen = new Set<number>();

    const add = (n: number) => {
      if (n >= 0 && n < total && !seen.has(n)) {
        seen.add(n);
        pages.push(n);
      }
    };

    add(0);
    add(total - 1);

    for (let i = current - WINDOW; i <= current + WINDOW; i++) {
      add(i);
    }

    pages.sort((a, b) => a - b);

    const result: number[] = [];
    for (let i = 0; i < pages.length; i++) {
      if (i > 0 && pages[i] - pages[i - 1] > 1) {
        result.push(-1);
      }
      result.push(pages[i]);
    }

    return result;
  }

  // =====================
  // CELL RENDER
  // =====================

  private _renderCell(term: any): TemplateResult {
    const f: FormattedTerm = this._formatTerm(term);

    switch (f.type) {
      case 'uri':
        return html`
          <a class="uri" href=${f.value} target="_blank" rel="noopener">
            ${this._shortenUri(f.value)}
          </a>`;
      case 'bnode':
        return html`<span class="bnode">${f.value}</span>`;
      case 'literal': {
        let suffix: TemplateResult | symbol = nothing;
        if (f.lang) {
          suffix = html`<span class="lang">@${f.lang}</span>`;
        } else if (f.datatype && !f.datatype.includes('XMLSchema#string')) {
          suffix = html`<span class="dt">${this._shortenUri(f.datatype)}</span>`;
        }
        return html`<span class="lit">${f.value}${suffix}</span>`;
      }
      case 'empty':
        return html`<span class="empty">–</span>`;
      default:
        return html`<span>${f.value}</span>`;
    }
  }
}

customElements.define('oxigraph-sparql', OxigraphSparql);

declare global {
  interface HTMLElementTagNameMap {
    'oxigraph-sparql': OxigraphSparql;
  }
}