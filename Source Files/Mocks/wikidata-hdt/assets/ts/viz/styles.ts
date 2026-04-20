import { css } from 'lit';

export const componentStyles = css`
    :host {
      --graph-height: 100vh;

      /* Typografie */
      --sparql-font-family: inherit;
      --sparql-font-size: 1rem;
      --sparql-line-height: 1.2;

      /* Farben */
      --sparql-accent: #555;
      --sparql-accent-hover: #1a2d52;
      --sparql-accent-active: #0f3460;
      --sparql-accent-text: #fff;
      --sparql-accent-highlight: #53d8fb;

      --sparql-bg: #16213e;
      --sparql-border: #333;
      --sparql-text: #e0e0e0;
      --sparql-error: #e94560;

      display: block;
      position: relative;
      width: 100%;
      height: var(--graph-height);
      overflow: hidden;
    }

    #cy-container { 
      position: absolute; 
      inset: 0; 
      height: var(--graph-height);
    }

    #node-info {
      position: absolute; 
      bottom: 1rem; 
      right: 1rem;
      background: var(--sparql-bg); 
      border: 1px solid var(--sparql-border);
      padding: 1rem; 
      border-radius: 5px;
      font-family: monospace;
      font-size: 0.8rem; 
      max-width: 400px; 
      max-height: 300px;
      overflow-y: auto; 
      white-space: pre-wrap;
      color: var(--sparql-text); 
      z-index: 50;
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

    #export-btn {
      display: var(--sparql-export-btn-display, block);
      padding: .45em .6em .6em .6em;
      background: var(--sparql-accent);
      color: var(--sparql-accent-text);
      font-family: var(--sparql-font-family);
      font-size: var(--sparql-font-size);
      cursor: pointer;
      vertical-align: middle;
      border-radius: .2rem;
      border: 0;
      line-height: var(--sparql-line-height);
      right: 2rem;
      top: 2rem;
      position: absolute;
    }

    #export-btn:hover {
      background: var(--sparql-accent-hover);
      border-color: var(--sparql-accent-highlight);
      color: var(--sparql-accent-highlight);
    }

    #export-btn:active {
      background: var(--sparql-accent-active);
    }

    #export-btn svg {
      width: 1em;
      height: 1em;
      fill: currentColor;
      flex-shrink: 0;
    }
`;