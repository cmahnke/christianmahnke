import { css } from 'lit';

export const componentStyles = css`
    :host {
      --sparql-font-family: inherit;
      --sparql-font-size: 1rem;
      --sparql-line-height: 1.2;

      --sparql-accent: #555;
      --sparql-accent-hover: #333;
      --sparql-accent-text: #fff;

      display: block;
      position: relative;
      width: 100%;
      height: 100%;
      overflow: hidden;
    }
    #cy-container { 
      position: absolute; 
      inset: 0; 
    }

    #node-info {
      position: absolute; 
      bottom: 1rem; 
      right: 1rem;
      background: #16213e; 
      border: 1px solid #333;
      padding: 1rem; 
      border-radius: 5px;
      font-size: 0.8rem; 
      max-width: 400px; 
      max-height: 300px;
      overflow-y: auto; 
      white-space: pre-wrap;
      font-family: monospace; 
      color: #e0e0e0; 
      z-index: 100;
    }

    #loading-overlay {
      position: absolute; 
      inset: 0;
      display: flex; 
      align-items: center; 
      justify-content: center;
      background: rgba(0, 0, 0, 0.7);
      color: #e0e0e0; 
      font-family: monospace; 
      font-size: 1rem; 
      z-index: 200;
    }

    #loading-overlay .error { 
      color: #e94560; 
    }

    .spinner {
      display: inline-block; 
      width: 1.2em; 
      height: 1.2em;
      border: 2px solid #555;
      border-top-color: #53d8fb;
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
      padding: .45em .6em .6em .6em;
      background: var(--sparql-accent);
      color: var(--sparql-accent-text);
      font-family: var(--sparql-font-family);
      font-size: var(--actions-fontsize);
      cursor: pointer;
      vertical-align: middle;
      border-radius: .2rem;
      border: 0;
      font-size: 100%;
      line-height: 1.15;
      right: 2rem;
      top: 2rem;
      position: absolute;
    }

    #export-btn:hover {
      background: #1a2d52;
      border-color: #53d8fb;
      color: #53d8fb;
    }

    #export-btn:active {
      background: #0f3460;
    }

    #export-btn svg {
      width: 1em;
      height: 1em;
      fill: currentColor;
      flex-shrink: 0;
    }
`;