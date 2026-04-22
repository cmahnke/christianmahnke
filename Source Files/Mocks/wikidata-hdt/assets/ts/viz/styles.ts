import { css } from 'lit';

export const componentStyles = css`
    :host {
      --graph-background: white;

      --graph-height: 100vh;

      /* Typografie */
      --sparql-font-family: inherit;
      --sparql-font-size: 1rem;
      --sparql-line-height: 1.2;

      --node-info-font-size: 1rem;
      --node-info-color: white;
      --node-info-bg: #000000aa;
      --node-info-link-color: #53d8fb;
      --node-info-link-decoration: none;

      /* Farben */
      --sparql-accent: #555;
      --sparql-accent-hover: #1a2d52;
      --sparql-accent-active: #0f3460;
      --sparql-accent-text: #fff;
      --sparql-accent-highlight: #53d8fb;

      --sparql-border: #333;
      --sparql-text: #e0e0e0;
      --sparql-error: #e94560;

      --legend-bg: #ffffffaa;

      --border-radius: .2rem;

      --sparql-export-btn-display: block;
      --sparql-fullscreen-btn-display: block;

      display: block;
      position: relative;
      width: 100%;
      height: var(--graph-height);
      overflow: hidden;
      position: relative;
    }

    #cy-container { 
      position: absolute;
      inset: 0; 
      height: var(--graph-height);
      background: var(--graph-background);
    }

    #loading-overlay {
      position: absolute; 
      inset: 0;
      display: flex; 
      align-items: center; 
      justify-content: center;
      background: rgba(0, 0, 0, 0.7);
      color: var(--sparql-text); 
      font-family: monospace;
      font-size: var(--sparql-font-size); 
      z-index: 90;
    }

    #loading-overlay .error { 
      color: var(--sparql-error); 
    }

    .spinner {
      display: inline-block; 
      width: 1.2em; 
      height: 1.2em;
      border: 2px solid var(--sparql-border);
      border-top-color: var(--sparql-accent-highlight);
      border-radius: 50%; 
      animation: spin 0.8s linear infinite;
      margin-right: 0.5em;
      vertical-align: middle;
    }

    @keyframes spin { 
      to { 
        transform: rotate(360deg); 
      } 
    }

    .toolbar-button {
      padding: .45em .6em .6em .6em;
      background: var(--sparql-accent);
      color: var(--sparql-accent-text);
      font-family: var(--sparql-font-family);
      font-size: var(--sparql-font-size);
      cursor: pointer;
      vertical-align: middle;
      line-height: var(--sparql-line-height);
      border: 0;
      border-radius: var(--border-radius);
    }

    #toolbar {
      top: 2rem;
      position: absolute;
      right: 2rem;
      display: flex;
      justify-content: flex-end;
    }

    #fullscreen-btn {
      display: var(--sparql-fullscreen-btn-display, block);
    }

    #export-btn {
      display: var(--sparql-export-btn-display, block);
      pointer-events: auto;
    }

    .toolbar-button:hover {
      background: var(--sparql-accent-hover);
      border-color: var(--sparql-accent-highlight);
      color: var(--sparql-accent-highlight);
    }

    .toolbar-button:active {
      background: var(--sparql-accent-active);
    }

    /* ── Node Info Panel ── */

    #node-info {
      position: absolute; 
      bottom: 1rem; 
      right: 1rem;
      background: var(--node-info-bg); 
      border: 1px solid var(--sparql-border);
      padding: .4rem; 
      border-radius: var(--border-radius);
      font-size: var(--node-info-font-size); 
      max-width: 25em; 
      max-height: 20em;
      z-index: 50;
      font-family: var(--sparql-font-family);
      color: var(--node-info-color);
      display: flex;
      flex-direction: column;
    }

    #node-info > .node-info-label {
      margin-top: 1em;
    }

    #node-info a:link {
      color: var(--node-info-link-color);
      text-decoration: var(--node-info-link-decoration);
    }

    #node-info a:visited {
      color: var(--node-info-link-color);
      text-decoration: var(--node-info-link-decoration);
    }

    #node-info a:hover {
      color: var(--node-info-link-color);
    }

    #node-info a:active {
      color: var(--node-info-link-color);
      text-decoration: var(--node-info-link-decoration);
    }

    #node-info-close {
      right: 1em;
      top: 1em;
      position: absolute;
    }

    .node-info-label {
      font-weight: bold;
      font-size: xx-large;
    }

    .node-info-id {
      text-align: right;
      font-style: italic;
    }

    .node-info-row {
      /* zeile mit key + wert nebeneinander */
    }

    .node-info-key {
      /* label der zeile, z.b. "Wikipedia", "Wikidata" */
    }

    .node-info-properties {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.25rem 0.5rem;
      align-items: start;
      justify-items: start;
      overflow-y: auto;
    }

    .node-info-properties .node-info-row {
      display: contents;
    }

    .node-info-properties .node-info-row .node-info-key {
      font-weight: bold;
      word-break: break-word;
      max-width: 8em;
    }

    .node-info-properties .node-info-row .node-info-values {
      word-break: break-word;
    }

    /* -- Color info panel-- */
    #legend {
      position: absolute;
      top: 1rem;
      left: 1rem;
      max-width: 12em; 
      max-height: fit-content;
      border: 1px solid var(--sparql-border);
      background: var(--legend-bg);
      padding: .4rem; 
      border-radius: var(--border-radius);
      font-size: var(--node-info-font-size);
      font-family: var(--sparql-font-family);
    }
    
    .legend-swatch {
      display: inline-block;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      border: 5px solid var(--swatch-color);;
      background: transparent;
      flex-shrink: 0;
    }

    .legend-entry {
      display: flex;
      align-items: flex-start;
      gap: 6px;
    }

    .legend-label {
      line-height: 1.3;
      flex: 1;
      min-width: 0;
    }

`;