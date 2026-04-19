import { css } from 'lit';

export const componentStyles = css`
  :host {
    --sparql-font-family: inherit;
    --sparql-font-size: 1rem;
    --sparql-line-height: 1.2;

    --sparql-bg: #fff;
    --sparql-color: #222;
    --sparql-color-muted: #888;
    --sparql-border-color: #e5e5e5;
    --sparql-border-radius: var(--border-radius);
    --sparql-shadow: none;

    --sparql-accent: #555;
    --sparql-accent-hover: #333;
    --sparql-accent-text: #fff;

    --sparql-editor-bg: #fafafa;
    --sparql-editor-color: #333;
    --sparql-editor-font: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
    --sparql-editor-font-size: 0.82rem;
    --sparql-editor-min-height: 140px;
    --sparql-editor-border: #ddd;

    --sparql-table-header-bg: transparent;
    --sparql-table-header-color: #555;
    --sparql-table-border: #e5e5e5;
    --sparql-table-hover: #f9f9f9;
    --sparql-table-alt: #fdfdfd;
    --sparql-table-cell-padding: 8px 12px;

    --sparql-error-bg: #fef2f2;
    --sparql-error-color: #b91c1c;
    --sparql-error-border: #fecaca;
    --sparql-success-color: #555;

    --sparql-padding: 0;
    --sparql-section-gap: 1px solid var(--sparql-border-color);

    --actions-hint-display: block;
    --actions-fontsize: 0.78rem;

    --result-font-size: 0.85rem;

    --outline-color: #ff5477;
    --outline: 1px solid var(--outline-color);
    --border-radius: .2rem;

    display: block;
    font-family: var(--sparql-font-family);
    font-size: var(--sparql-font-size);
    line-height: var(--sparql-line-height);
    color: var(--sparql-color);
  }

  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  /* ========================================
     WRAPPER
     ======================================== */
  .wrapper {
    background: var(--sparql-bg);
    border-top: var(--sparql-section-gap);
    border-bottom: var(--sparql-section-gap);
  }

  /* ========================================
     HEADER
     ======================================== */
  .header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    padding: 1em 0;
    border-bottom: var(--sparql-section-gap);
  }

  .header h2 {
    margin: 0;
    font-size: 1rem;
    font-weight: 400;
    text-transform: uppercase;
    color: var(--sparql-color-muted);
  }

  .header-meta {
    display: flex;
    align-items: center;
    gap: .5em;
  }

  .meta-badge {
    font-size: 0.72rem;
    color: var(--sparql-color-muted);
  }

  .meta-badge.locked::before {
    content: '● ';
    color: var(--sparql-accent);
  }

  /* ========================================
     SOURCE NOTICE (locked)
     ======================================== */
  .source-notice {
    display: flex;
    align-items: baseline;
    gap: .5em;
    padding: .625em 0;
    border-bottom: var(--sparql-section-gap);
    font-size: 0.78rem;
  }

  .source-label {
    text-transform: uppercase;
    color: var(--sparql-color-muted);
    flex-shrink: 0;
  }

  .source-value {
    font-family: var(--sparql-editor-font);
    font-size: 0.76rem;
    color: var(--sparql-color);
    word-break: break-all;
  }

  /* ========================================
     DATA SECTION
     ======================================== */
  .data-section {
    padding: 14px 0;
    border-bottom: var(--sparql-section-gap);
  }

  /* ========================================
     TAB BAR
     ======================================== */
  .tab-bar {
    display: flex;
    gap: 0;
    margin-bottom: .6em;
    border-bottom: 1px solid var(--sparql-border-color);
  }

  .tab-bar button {
    padding: .4em 1em;
    border: none;
    border-bottom: 2px solid transparent;
    background: none;
    cursor: pointer;
    font-family: var(--sparql-font-family);
    font-size: 0.78rem;
    color: var(--sparql-color-muted);
  }

  .tab-bar button:hover {
    color: var(--sparql-color);
  }

  .tab-bar button.active {
    color: var(--sparql-color);
    border-bottom-color: var(--sparql-color);
  }

  /* ========================================
     INPUT ROWS
     ======================================== */
  .input-row {
    display: flex;
    gap: 8px;
  }

  .input-row input[type="text"] {
    flex: 1;
    padding: 7px 10px;
    border: 1px solid var(--sparql-border-color);
    border-radius: var(--border-radius);
    font-family: var(--sparql-editor-font);
    font-size: 0.8rem;
    background: var(--sparql-bg);
    color: var(--sparql-color);
  }

  .input-row input[type="text"]:focus {
    outline: none;
    border-color: var(--sparql-accent);
  }

  .input-col {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  /* ========================================
     BUTTONS
     ======================================== */
  .btn-primary {
    padding: .45em .6em .6em .6em;
    background: var(--sparql-accent);
    color: var(--sparql-accent-text);
    font-family: var(--sparql-font-family);
    font-size: var(--actions-fontsize);
    cursor: pointer;
    vertical-align: middle;
    border-radius: var(--border-radius);
    border: 0;
    font-size: 100%;
    line-height: 1.15;
  }

  .btn-primary:hover:not(:disabled) {
    background: var(--sparql-accent-hover);
  }

  .btn-primary:disabled {
    opacity: 0.4;
    cursor: default;
  }

  .btn-secondary {
    padding: .45em .6em .6em .6em;
    background: none;
    color: var(--sparql-accent);
    font-family: var(--sparql-font-family);
    font-size: var(--actions-fontsize);
    cursor: pointer;
    vertical-align: middle;
    border-radius: var(--border-radius);
    border: 0;
    font-size: 100%;
    line-height: 1.15;
  }

  .btn-secondary:hover:not(:disabled) {
    border-color: var(--sparql-accent);
  }

  .btn-secondary:disabled {
    opacity: 0.4;
    cursor: default;
  }

  /* ========================================
     EDITOR
     ======================================== */
  .editor-section {
    padding: 14px 0;
    border-bottom: var(--sparql-section-gap);
  }

  .editor-section #query-editor-container[inert] {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .cm-editor {
    width: 100%;
    min-height: var(--sparql-editor-min-height);
    background: var(--sparql-editor-bg);
    color: var(--sparql-editor-color);
    border: 1px solid var(--sparql-editor-border);
    border-radius: var(--border-radius);
    font-family: var(--sparql-editor-font);
    font-size: var(--sparql-editor-font-size);
    line-height: 1.55;
    resize: vertical;
    tab-size: 2;
  }

  .cm-editor.cm-focused {
    outline: var(--outline) !important;
  }

  /* ========================================
     ACTIONS
     ======================================== */
  .actions {
    display: flex;
    align-items: center;
    gap: .6em;
    padding: .6em 0;
    border-bottom: var(--sparql-section-gap);
  }

  .hint {
    font-size: 0.72rem;
    color: var(--sparql-color-muted);
  }

  .actions .hint {
    display: var(--actions-hint-display);
  }

  .status {
    margin-left: auto;
    font-size: 1rem;
  }

  .status.success {
    color: var(--sparql-success-color);
  }

  .status.loading {
    color: var(--sparql-color-muted);
  }

  .status.error {
    color: var(--sparql-error-color);
  }

  /* ========================================
     RESULTS
     ======================================== */
  .results-section {
    padding: .8em 0;
  }

  .placeholder-text {
    color: var(--sparql-color-muted);
    font-size: var(--result-font-size, 0.85rem);
    font-style: italic;
    padding: 1.2em 0;
  }

  /* ========================================
     TABLE
     ======================================== */
  .table-wrap {
    overflow-x: auto;
    margin: 0 -1px;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  thead th {
    text-align: left;
    padding: var(--sparql-table-cell-padding);
    font-weight: 400;
    color: var(--sparql-table-header-color);
    border-bottom: 2px solid var(--sparql-table-border);
    background: var(--sparql-table-header-bg);
    white-space: nowrap;
  }

  tbody td {
    padding: var(--sparql-table-cell-padding);
    border-bottom: 1px solid var(--sparql-table-border);
    max-width: 420px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  tbody tr:nth-child(even) {
    background: var(--sparql-table-alt);
  }

  tbody tr:hover {
    background: var(--sparql-table-hover);
  }

  tbody tr:last-child td {
    border-bottom: none;
  }

  /* Cell types */
  .uri {
    color: var(--sparql-accent);
    text-decoration: none;
  }

  .uri:hover {
    text-decoration: underline;
  }

  .bnode {
    color: #9775fa;
    font-family: var(--sparql-editor-font);
    font-size: 0.8rem;
  }

  .lit {
    color: var(--sparql-color);
  }

  .lang {
    color: var(--sparql-color-muted);
    font-size: 1rem;
    margin-left: 2px;
  }

  .dt {
    color: var(--sparql-color-muted);
    font-size: 0.7rem;
    margin-left: 3px;
    font-style: italic;
  }

  .empty {
    color: var(--sparql-color-muted);
  }

  /* ========================================
     BOOLEAN
     ======================================== */
  .boolean-result {
    padding: 1em 0;
    font-family: var(--sparql-editor-font);
    font-size: 1rem;
  }

  .boolean-result.is-true {
    color: #2b8a3e;
  }

  .boolean-result.is-false {
    color: var(--sparql-error-color);
  }

  /* ========================================
     GRAPH RESULT
     ======================================== */
  pre.graph-result {
    margin: 0;
    padding: .8em;
    background: var(--sparql-editor-bg);
    border: 1px solid var(--sparql-editor-border);
    border-radius: var(--border-radius);
    font-family: var(--sparql-editor-font);
    font-size: 0.8rem;
    line-height: 1.55;
    max-height: 400px;
    overflow: auto;
    white-space: pre-wrap;
    word-break: break-all;
    color: var(--sparql-editor-color);
  }

  /* ========================================
     ERROR
     ======================================== */
  .error-box {
    background: var(--sparql-error-bg);
    border: 1px solid var(--sparql-error-border);
    border-radius: var(--border-radius);
    padding: .8em;
  }

  .error-box pre {
    margin: 0;
    font-family: var(--sparql-editor-font);
    font-size: 0.78rem;
    color: var(--sparql-error-color);
    white-space: pre-wrap;
    word-break: break-word;
    line-height: 1.5;
  }

  /* ========================================
     LOADING
     ======================================== */
  .loading {
    display: flex;
    justify-content: center;
    padding: 1.5em 0;
  }

  @keyframes sparql-spin {
    to { transform: rotate(360deg); }
  }

  .spinner {
    width: 1.25em;
    height: 1.25em;
    border: 1.5px solid var(--sparql-border-color);
    border-top-color: var(--sparql-accent);
    border-radius: 50%;
    animation: sparql-spin 0.7s linear infinite;
  }

  /* ========================================
     SCROLLBAR
     ======================================== */
  .table-wrap::-webkit-scrollbar,
  pre.graph-result::-webkit-scrollbar {
    height: 6px;
    width: 6px;
  }

  .table-wrap::-webkit-scrollbar-track,
  pre.graph-result::-webkit-scrollbar-track {
    background: transparent;
  }

  .table-wrap::-webkit-scrollbar-thumb,
  pre.graph-result::-webkit-scrollbar-thumb {
    background: var(--sparql-border-color);
    border-radius: var(--border-radius);
  }

  /* ========================================
     RESPONSIVE
     ======================================== */
  @media (max-width: 600px) {
    .header {
      flex-direction: column;
      gap: 4px;
    }

    .actions {
      flex-wrap: wrap;
    }

    .status {
      margin-left: 0;
      width: 100%;
    }

    .input-row {
      flex-direction: column;
    }

    tbody td {
      max-width: 180px;
    }
  }

  /* ========================================
     PRINT
     ======================================== */
  @media print {
    .data-section,
    .editor-section,
    .actions,
    .source-notice {
      display: none;
    }

    .table-wrap {
      overflow: visible;
    }

    tbody tr:hover {
      background: inherit;
    }
  }

  /* ========================================
     REDUCED MOTION
     ======================================== */
  @media (prefers-reduced-motion: reduce) {
    .spinner {
      animation-duration: 2s;
    }

    * {
      transition: none !important;
    }
  }

  .pagination {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.5rem;
    padding: 0.75rem 0 0.25rem;
    font-size: 0.875rem;
  }

  .pagination-info {
    color: var(--color-muted, #666);
    margin-right: auto;
  }

  .pagination-controls {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .pagination-btn {
    min-width: 2rem;
    padding: 0.25rem 0.5rem;
    border: 1px solid var(--color-border, #ccc);
    border-radius: var(--border-radius);
    background: var(--color-bg, #fff);
    cursor: pointer;

    &:hover:not(:disabled) {
      background: var(--color-hover, #f0f0f0);
    }

    &.active {
      background: var(--color-primary, #2563eb);
      color: #fff;
      border-color: var(--color-primary, #2563eb);
      font-weight: 600;
    }

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
  }

  .pagination-ellipsis {
    padding: 0 0.25rem;
    color: var(--color-muted, #666);
  }
`;