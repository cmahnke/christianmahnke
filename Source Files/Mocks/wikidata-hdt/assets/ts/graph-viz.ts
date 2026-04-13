import cytoscape from "cytoscape";
import type { Store } from "oxigraph";

let cy: cytoscape.Core | null = null;

function shorten(uri: string): string {
  if (uri.startsWith('"')) return uri;
  const cut = Math.max(uri.lastIndexOf("#"), uri.lastIndexOf("/"));
  return cut >= 0 ? uri.substring(cut + 1) : uri;
}

export function initGraph(container: HTMLElement, store: Store, query: string): cytoscape.Core {
  const results = store.query(query) as any[];
  const elements = resultsToCytoscape(results);

  cy = cytoscape({
    container,
    elements,
    style: [
      {
        selector: "node",
        style: {
          label: "data(label)",
          "background-color": "#e94560",
          color: "#e0e0e0",
          "font-size": "10px",
          "text-valign": "bottom",
          "text-margin-y": 5,
          width: 20,
          height: 20
        }
      },
      {
        selector: "node.blank",
        style: {
          "background-color": "#888",
          shape: "diamond",
          width: 15,
          height: 15,
          "font-size": "8px",
          color: "#aaa"
        }
      },
      {
        selector: "node.literal",
        style: {
          shape: "rectangle",
          "background-color": "#0f3460",
          width: "label",
          height: "label",
          padding: "5px",
          "font-size": "8px",
          "text-valign": "center"
        }
      },
      {
        selector: "node.wikidata",
        style: {
          "background-color": "#53d8fb"
        }
      },
      {
        selector: "edge",
        style: {
          label: "data(label)",
          "font-size": "7px",
          color: "#888",
          "line-color": "#333",
          "target-arrow-color": "#333",
          "target-arrow-shape": "triangle",
          "curve-style": "bezier",
          width: 1
        }
      }
    ],
    layout: {
      name: "cose",
      animate: false,
      nodeDimensionsIncludeLabels: true
    }
  });

  return cy;
}

function resultsToCytoscape(results: any[]): cytoscape.ElementDefinition[] {
  const nodes = new Map<string, cytoscape.ElementDefinition>();
  const edges: cytoscape.ElementDefinition[] = [];

  for (const binding of results) {
    const s = binding.get("s");
    const p = binding.get("p");
    const o = binding.get("o");

    const sId = s.value;
    const oId = o.value;
    const isLiteral = o.termType === "Literal";

    if (!nodes.has(sId)) {
      nodes.set(sId, {
        data: { id: sId, label: shorten(sId) },
        classes: s.termType === "BlankNode" ? "blank" : "uri"
      });
    }

    if (isLiteral) {
      const litId = `${sId}__${p.value}__${oId}`;
      if (!nodes.has(litId)) {
        nodes.set(litId, {
          data: { id: litId, label: oId.substring(0, 50) },
          classes: "literal"
        });
      }
      edges.push({
        data: { source: sId, target: litId, label: shorten(p.value) }
      });
    } else {
      if (!nodes.has(oId)) {
        nodes.set(oId, {
          data: { id: oId, label: shorten(oId) },
          classes: o.termType === "BlankNode" ? "blank" : "uri"
        });
      }
      edges.push({
        data: { source: sId, target: oId, label: shorten(p.value) }
      });
    }
  }

  return [...nodes.values(), ...edges];
}

export function updateGraph(store: Store, query: string): void {
  if (!cy) return;

  const results = store.query(query) as any[];
  const elements = resultsToCytoscape(results);

  cy.elements().remove();
  cy.add(elements);
  cy.layout({ name: "cose", animate: true, animationDuration: 500 } as any).run();
}

export function addWikidataNodes(entityUri: string, bindings: Array<{ property: string; valueLabel: string }>): void {
  if (!cy) return;

  const newElements: cytoscape.ElementDefinition[] = [];

  if (!cy.getElementById(entityUri).length) {
    newElements.push({
      data: { id: entityUri, label: shorten(entityUri) },
      classes: "wikidata"
    });
  }

  for (const b of bindings) {
    const targetId = `wd__${entityUri}__${b.property}`;
    newElements.push({
      data: { id: targetId, label: b.valueLabel.substring(0, 40) },
      classes: "wikidata literal"
    });
    newElements.push({
      data: { source: entityUri, target: targetId, label: shorten(b.property) }
    });
  }

  cy.add(newElements);
  cy.layout({ name: "cose", animate: true, animationDuration: 500 } as any).run();
}

export function getCy(): cytoscape.Core | null {
  return cy;
}
