import * as d3 from "d3";
import { chord } from "d3-chord";

// --- Type Definitions ---
/**
 * Input record structure: [sourceName, targetName, urlToOpenOnClick, flowValue]
 */
type FlowInputRecord = [string, string, string, number];

interface ChordNode {
  index: number;
  name: string;
  // D3 Chord layout will add properties like startAngle, endAngle, value
  [key: string]: any;
}

interface ChordData {
  matrix: number[][];
  nodes: ChordNode[];
  urlMap: Map<string, string>; // Key: "sourceIndex-targetIndex", Value: url
  nodeNameMap: Map<number, string>; // Key: index, Value: name
}

// --- Data Preparation Function ---
/**
 * Transforms the user-provided flat data into the structure needed for D3 Chord diagrams.
 */
function prepareChordData(inputData: FlowInputRecord[]): ChordData {
  const uniqueNodeNames = Array.from(new Set(inputData.flatMap((d) => [d[0], d[1]])));
  const nodes: ChordNode[] = uniqueNodeNames.map((name, index) => ({ name, index }));

  const nameToIndexMap = new Map<string, number>();
  nodes.forEach((node) => nameToIndexMap.set(node.name, node.index));

  const matrix: number[][] = Array(nodes.length)
    .fill(null)
    .map(() => Array(nodes.length).fill(0));

  const urlMap = new Map<string, string>();
  const nodeNameMap = new Map<number, string>(); // For easy lookup if needed
  nodes.forEach((node) => nodeNameMap.set(node.index, node.name));

  inputData.forEach((record) => {
    const [sourceName, targetName, url, value] = record;
    const sourceIndex = nameToIndexMap.get(sourceName);
    const targetIndex = nameToIndexMap.get(targetName);

    if (sourceIndex !== undefined && targetIndex !== undefined) {
      matrix[sourceIndex][targetIndex] = value;
      urlMap.set(`${sourceIndex}-${targetIndex}`, url);
    }
  });

  return { matrix, nodes, urlMap, nodeNameMap };
}

// --- Chart Rendering Function ---
/**
 * Renders a Chord Diagram using D3.js.
 */
function renderD3ChordDiagram(
  containerId: string,
  inputData: FlowInputRecord[],
  chartConfig: {
    width?: number;
    height?: number;
    outerRadius?: number;
    innerRadius?: number;
    padAngle?: number;
    labelOffset?: number;
  } = {}
): void {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`HTML element with ID '${containerId}' not found.`);
    return;
  }
  container.innerHTML = ""; // Clear previous content

  if (typeof d3 === "undefined" || !d3.chord) {
    container.innerHTML = `<p style="color: red; font-family: sans-serif;">
            <strong>Error: D3.js (including d3.chord) not loaded.</strong>
        </p>`;
    console.error("D3.js or d3.chord not loaded.");
    return;
  }

  const { matrix, nodes, urlMap, nodeNameMap } = prepareChordData(inputData);
  if (nodes.length === 0) {
    container.innerHTML = "<p>No data to display.</p>";
    return;
  }

  const width = chartConfig.width || 700;
  const height = chartConfig.height || 700;
  const outerRadius = chartConfig.outerRadius || Math.min(width, height) * 0.5 - 50;
  const innerRadius = chartConfig.innerRadius || outerRadius - 20;
  const padAngle = chartConfig.padAngle || 0.05; // Padding between arcs
  const labelOffset = chartConfig.labelOffset || 15; // Distance of labels from arcs

  const svg = d3
    .select(container)
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [-width / 2, -height / 2, width, height]) // Center the diagram
    .attr("font-size", "10px")
    .attr("font-family", "sans-serif");

  const color = d3.scaleOrdinal(d3.schemeCategory10).domain(nodes.map((d) => d.name));

  const chordLayout = d3
    .chord()
    .padAngle(padAngle)
    .sortSubgroups(d3.descending) // Sort subgroups by value (optional)
    .sortChords(d3.descending); // Sort chords by value (optional)

  const chords = chordLayout(matrix);

  // --- Draw Outer Arcs (Groups) ---
  const group = svg
    .append("g")
    .selectAll("g")
    .data(chords.groups) // chords.groups are the nodes/arcs
    .join("g");

  const arc = d3.arc().innerRadius(innerRadius).outerRadius(outerRadius);

  group
    .append("path")
    .attr("fill", (d: any) => color(nodeNameMap.get(d.index) || ""))
    .attr("stroke", (d: any) => d3.rgb(color(nodeNameMap.get(d.index) || "")).darker())
    .attr("d", arc)
    .append("title") // Basic tooltip for arcs
    .text((d: any) => `${nodeNameMap.get(d.index)}\nTotal Flow: ${d.value.toFixed(2)}`);

  // --- Add Group Labels (Node Names) ---
  group
    .append("text")
    .each((d: any) => {
      d.angle = (d.startAngle + d.endAngle) / 2;
    })
    .attr("dy", "0.35em")
    .attr(
      "transform",
      (d: any) => `
            rotate(${(d.angle * 180) / Math.PI - 90})
            translate(${outerRadius + labelOffset})
            ${d.angle > Math.PI ? "rotate(180)" : ""}
        `
    )
    .attr("text-anchor", (d: any) => (d.angle > Math.PI ? "end" : null))
    .text((d: any) => nodeNameMap.get(d.index) || "")
    .style("fill", "#333");

  // --- Draw Ribbons (Chords/Links) ---
  const ribbon = d3.ribbon().radius(innerRadius);

  svg
    .append("g")
    .attr("fill-opacity", 0.75)
    .selectAll("path")
    .data(chords) // chords are the links/ribbons
    .join("path")
    .attr("d", ribbon)
    .attr("fill", (d: any) => color(nodeNameMap.get(d.source.index) || "")) // Color ribbon by source
    .attr("stroke", (d: any) => d3.rgb(color(nodeNameMap.get(d.source.index) || "")).darker())
    .style("cursor", (d: any) => {
      const urlKey = `${d.source.index}-${d.target.index}`;
      return urlMap.has(urlKey) ? "pointer" : "default";
    })
    .on("click", (event: MouseEvent, d: any) => {
      const urlKey = `${d.source.index}-${d.target.index}`; // Key based on the specific directed flow
      const url = urlMap.get(urlKey);
      if (url) {
        console.log(`Chord clicked: ${nodeNameMap.get(d.source.index)} -> ${nodeNameMap.get(d.target.index)}, URL: ${url}`);
        window.open(url, "_blank");
      } else {
        // This case might happen if matrix[j][i] is also non-zero and has no URL, but the ribbon represents matrix[i][j]
        // The `chords` array contains one object per pair (i,j) where matrix[i][j] > 0 or matrix[j][i] > 0.
        // The `d.source` refers to the flow `matrix[i][j]`.
        console.warn(`No URL found for chord: ${nodeNameMap.get(d.source.index)} -> ${nodeNameMap.get(d.target.index)}`);
      }
    })
    .on("mouseover", function (event: MouseEvent, d: any) {
      d3.select(this).attr("fill-opacity", 0.95);
    })
    .on("mouseout", function (event: MouseEvent, d: any) {
      d3.select(this).attr("fill-opacity", 0.75);
    })
    .append("title") // Basic tooltip for ribbons
    .text((d: any) => {
      const urlKey = `${d.source.index}-${d.target.index}`;
      const url = urlMap.get(urlKey);
      // The value of this specific directed chord is d.source.value
      return `${nodeNameMap.get(d.source.index)} → ${nodeNameMap.get(d.target.index)}
Value: ${d.source.value.toFixed(2)}
${url ? `URL: ${url}` : "(No specific URL for this directed flow)"}`;
    });
}

document.addEventListener("DOMContentLoaded", () => {
  // Sample Data: [sourceName, targetName, urlForLink, flowValue]
  const myFlowData = [
    ["Marketing", "Sales", "https://example.com/marketing-sales", 120],
    ["Sales", "Support", "https://example.com/sales-support", 90],
    ["Support", "Development", "https://example.com/support-dev", 70],
    ["Development", "Marketing", "https://example.com/dev-marketing-feedback", 40], // Cycle
    ["External Leads", "Marketing", "https://example.com/leads-to-marketing", 150],
    ["Sales", "Development", "https://example.com/sales-to-dev", 50], // Additional flow
    ["Development", "Sales", "https://example.com/dev-to-sales-tools", 20] // Another flow
  ];

  const chartConfig = {
    width: 750,
    height: 750,
    outerRadius: 300,
    innerRadius: 280,
    padAngle: 0.04,
    labelOffset: 10
  };

  renderD3ChordDiagram("chordContainer", myFlowData, chartConfig);
});
