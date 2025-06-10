import * as d3 from "d3";
import { chord, ribbon, Chord, ChordGroup } from "d3-chord";
import { arc, Arc } from "d3-shape";

import type { Tags } from "./transformations";
import { convertTags } from "./transformations";

type FlowInputRecord = [string, string, string, number];

interface ChordNode {
  index: number;
  name: string;
  startAngle?: number;
  endAngle?: number;
  value?: number;
}

interface ChordData {
  matrix: number[][];
  nodes: ChordNode[];
  urlMap: Map<string, string>;
  nodeNameMap: Map<number, string>;
}

function prepareChordData(inputData: FlowInputRecord[]): ChordData {
  const uniqueNodeNames = Array.from(new Set(inputData.flatMap((d) => [d[0], d[1]])));
  const nodes: ChordNode[] = uniqueNodeNames.map((name, index) => ({ name, index }));

  const nameToIndexMap = new Map<string, number>();
  nodes.forEach((node) => nameToIndexMap.set(node.name, node.index));

  const matrix: number[][] = Array(nodes.length)
    .fill(null)
    .map(() => Array(nodes.length).fill(0));

  const urlMap = new Map<string, string>();
  const nodeNameMap = new Map<number, string>();
  nodes.forEach((node) => nodeNameMap.set(node.index, node.name));

  inputData.forEach((record) => {
    const [sourceName, targetName, url, value] = record;
    const sourceIndex = nameToIndexMap.get(sourceName);
    const targetIndex = nameToIndexMap.get(targetName);

    if (sourceIndex !== undefined && targetIndex !== undefined) {
      matrix[sourceIndex][targetIndex] = value;
      matrix[targetIndex][sourceIndex] = value;
      urlMap.set(`${sourceIndex}-${targetIndex}`, url);
    }
  });

  return { matrix, nodes, urlMap, nodeNameMap };
}

function renderD3ChordDiagram(
  container: HTMLElement,
  inputData: FlowInputRecord[],
  chartConfig: {
    width?: number;
    height?: number;
    outerRadius?: number;
    innerRadius?: number;
    padAngle?: number;
    labelOffset?: number;
  } = {},
  linkPrefix: string = "/tags/"
): void {
  if (!container) {
    console.error(`HTML element not found!`);
    return;
  }
  container.innerHTML = "";

  const { matrix, nodes, urlMap, nodeNameMap } = prepareChordData(inputData);
  if (nodes.length === 0) {
    container.innerHTML = "<p>No data to display.</p>";
    return;
  }

  const width = chartConfig.width || 700;
  const height = chartConfig.height || 700;
  const outerRadius = chartConfig.outerRadius || Math.min(width, height) * 0.5 - 50;
  const innerRadius = chartConfig.innerRadius || outerRadius - 20;
  const padAngle = chartConfig.padAngle || 0.05;
  const labelOffset = chartConfig.labelOffset || 15;

  const svg = d3
    .select(container)
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [-width / 2, -height / 2, width, height])
    .attr("font-size", "10px")
    .attr("font-family", "sans-serif");

  const color = d3.scaleOrdinal(d3.schemeCategory10).domain(nodes.map((d) => d.name));

  const chordLayout = chord().padAngle(padAngle).sortSubgroups(d3.descending).sortChords(d3.descending);

  const chords = chordLayout(matrix);

  const symmetricalChords = chords.map((d) => {
    const combinedValue = Math.max(d.source.value, d.target.value);
    return {
      ...d,
      source: { ...d.source, value: combinedValue },
      target: { ...d.target, value: combinedValue }
    } as Chord; // Type assertion
  });

  const group = svg
    .append("g")
    .selectAll("g")
    .data(chords.groups) // Use original chords.groups for arc rendering
    .join("g");

  const arcGenerator: Arc<any, ChordGroup> = arc<ChordGroup>().innerRadius(innerRadius).outerRadius(outerRadius);

  group
    .append("path")
    .attr("fill", (d: ChordGroup) => color(nodeNameMap.get(d.index) || ""))
    .attr("stroke", (d: ChordGroup) =>
      d3
        .rgb(color(nodeNameMap.get(d.index) || ""))
        .darker()
        .toString()
    )
    .attr("d", arcGenerator)
    .append("title")
    .text((d: ChordGroup) => `${nodeNameMap.get(d.index)}\nTotal Flow: ${d.value.toFixed(2)}`);

  const link = group.append("a").attr("href", (d: ChordGroup) => `${linkPrefix}${nodeNameMap.get(d.index) || ""}`);

  link
    .append("text")
    .each((d: ChordGroup & { angle?: number }) => {
      d.angle = (d.startAngle + d.endAngle) / 2;
    })
    .attr("dy", "0.35em")
    .attr(
      "transform",
      (d: ChordGroup & { angle: number }) => `
            rotate(${(d.angle * 180) / Math.PI - 90})
            translate(${outerRadius + labelOffset})
            ${d.angle > Math.PI ? "rotate(180)" : ""}
        `
    )
    .attr("text-anchor", (d: ChordGroup & { angle: number }) => (d.angle > Math.PI ? "end" : null))
    .text((d: ChordGroup) => nodeNameMap.get(d.index) || "")
    .style("fill", "#333");

  const ribbonGenerator = ribbon<any, Chord>().radius(innerRadius);

  svg
    .append("g")
    .attr("fill-opacity", 0.75)
    .selectAll("path")
    .data(symmetricalChords) // Use the new symmetricalChords data
    .join("path")
    .attr("d", ribbonGenerator)
    .attr("fill", (d: Chord) => color(nodeNameMap.get(d.source.index) || ""))
    .attr("stroke", (d: Chord) =>
      d3
        .rgb(color(nodeNameMap.get(d.source.index) || ""))
        .darker()
        .toString()
    )
    .style("cursor", (d: Chord) => {
      const urlKey = `${d.source.index}-${d.target.index}`;
      return urlMap.has(urlKey) ? "pointer" : "default";
    })
    .on("click", (event: MouseEvent, d: Chord) => {
      const urlKey = `${d.source.index}-${d.target.index}`;
      const url = urlMap.get(urlKey);
      if (url && url !== "") {
        console.log(`Chord clicked: ${nodeNameMap.get(d.source.index)} -> ${nodeNameMap.get(d.target.index)}, URL: ${url}`);
        window.open(url, "_blank");
      } else {
        console.warn(`No URL found for chord: ${nodeNameMap.get(d.source.index)} -> ${nodeNameMap.get(d.target.index)}`);
      }
    })
    .on("mouseover", function (event: MouseEvent, d: Chord) {
      d3.select(this).attr("fill-opacity", 0.95);
    })
    .on("mouseout", function (event: MouseEvent, d: Chord) {
      d3.select(this).attr("fill-opacity", 0.75);
    })
    .append("title")
    .text((d: Chord) => {
      const urlKey = `${d.source.index}-${d.target.index}`;
      const url = urlMap.get(urlKey);
      // Display the original values in the tooltip for clarity
      const originalSourceValue = matrix[d.source.index][d.target.index];
      const originalTargetValue = matrix[d.target.index][d.source.index];

      return `${nodeNameMap.get(d.source.index)} → ${nodeNameMap.get(d.target.index)}\n${url ? `URL: ${url}` : "(No specific URL for this directed flow)"}`;
    });
}

document.addEventListener("DOMContentLoaded", () => {
  fetch("/meta/tags/index.json")
    .then((response) => response.json())
    .then((data: Tags) => {
      interface ConvertedTagPair {
        from: string;
        to: string;
        url: string;
      }

      const tagPairs: ConvertedTagPair[] = convertTags(data);
      const processedData: FlowInputRecord[] = tagPairs.map((pair) => {
        const source = pair.from;
        const target = pair.to;
        const url = pair.url || "";

        const value = 1;
        const recordTuple: FlowInputRecord = [source, target, url, value];
        return recordTuple;
      });

      const containerId = "chordContainer";
      const container = document.getElementById(containerId);

      if (!container) {
        console.error(`Container element with ID "${containerId}" not found.`);
        return;
      }

      let padding =
        parseInt(window.getComputedStyle(container, null).getPropertyValue("padding-left")) +
        parseInt(window.getComputedStyle(container, null).getPropertyValue("padding-right"));
      //console.log(padding);
      const width = container.getBoundingClientRect().width - padding;
      const outerRadius = Math.ceil(width / 2.5);

      const chartConfig = {
        width: width,
        height: width,
        outerRadius: outerRadius,
        innerRadius: outerRadius - 25,
        padAngle: 0.04,
        labelOffset: 10
      };
      //console.log(chartConfig);

      renderD3ChordDiagram(container, processedData, chartConfig);
    })
    .catch((error) => {
      console.error("Error fetching or processing tag data:", error);
      const containerId = "chordContainer";
      const container = document.getElementById(containerId);
      if (container) {
        container.innerHTML = `<p style="color: red; font-family: sans-serif;">
                    <strong>Error loading chart data. Please try again later.</strong>
                </p>`;
      }
    });
});
