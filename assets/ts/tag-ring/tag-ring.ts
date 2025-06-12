import * as d3 from "d3";
import { chord, ribbon, Chord, ChordGroup } from "d3-chord";
import { arc, Arc } from "d3-shape";

import type { Tags } from "./transformations";
import { convertTags } from "./transformations";

type FlowInputRecord = [string, string, string, number]; // [sourceName, targetName, url, value]

interface ChordNode {
  index: number;
  name: string;
  startAngle?: number;
  endAngle?: number;
  value?: number;
}

interface IndividualRibbonData {
  source: {
    index: number;
    value: number;
    startAngle: number; // Will be assigned later
    endAngle: number;   // Will be assigned later
  };
  target: {
    index: number;
    value: number;
    startAngle: number; // Will be assigned later
    endAngle: number;   // Will be assigned later
  };
  url: string;
  originalSourceIndex: number;
  originalTargetIndex: number;
  id: string; // Unique ID for data binding
}

interface ChordData {
  groupMatrix: number[][]; // Used only for initial span estimation
  nodes: ChordNode[];
  nodeNameMap: Map<number, string>;
  individualFlows: FlowInputRecord[]; // Original data for individual ribbons
}

function prepareChordData(inputData: FlowInputRecord[]): ChordData {
  const uniqueNodeNames = Array.from(new Set(inputData.flatMap((d) => [d[0], d[1]])));
  const nodes: ChordNode[] = uniqueNodeNames.map((name, index) => ({ name, index }));

  const nameToIndexMap = new Map<string, number>();
  nodes.forEach((node) => nameToIndexMap.set(node.name, node.index));

  const nodeNameMap = new Map<number, string>();
  nodes.forEach((node) => nodeNameMap.set(node.index, node.name));

  // Create a symmetrical group matrix based on total connections for initial span estimation.
  const groupMatrix: number[][] = Array(nodes.length)
    .fill(null)
    .map(() => Array(nodes.length).fill(0));

  inputData.forEach((record) => {
    const [sourceName, targetName] = record;
    const sourceIndex = nameToIndexMap.get(sourceName);
    const targetIndex = nameToIndexMap.get(targetName);

    if (sourceIndex !== undefined && targetIndex !== undefined) {
      groupMatrix[sourceIndex][targetIndex] += 1; // Use 1 for value in initial matrix
      groupMatrix[targetIndex][sourceIndex] += 1; // Ensure symmetrical group arc sizes
    }
  });

  return {
    groupMatrix,
    nodes,
    nodeNameMap,
    individualFlows: inputData,
  };
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
    console.error(`HTML element with ID "${container.id || 'N/A'}" not found!`);
    return;
  }
  container.innerHTML = "";

  const { groupMatrix, nodes, nodeNameMap, individualFlows } = prepareChordData(inputData);
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

  // --- Initial D3 Chord Layout for Group Span Estimation ---
  // This is crucial for the FIRST PASS of ribbon width calculation
  const chordLayoutForSpanEstimation = chord()
    .padAngle(padAngle)
    .sortSubgroups(d3.descending)
    .sortChords(null);

  const initialGroups = chordLayoutForSpanEstimation(groupMatrix).groups;
  const initialNodeGroupMap = new Map<number, ChordGroup>();
  initialGroups.forEach(group => initialNodeGroupMap.set(group.index, group));


  // --- Step 1: Calculate individual ribbon effective widths and accumulated arc sizes ---
  const fixedRibbonWidthAngle = 0.003; // Base angular width of each individual ribbon
  const ribbonSpacingAngle = 0.0005;  // Angular space between individual ribbons

  // Track the total number of unique ribbons connected to each node
  const nodeTotalConnectedRibbonsCount = new Map<number, number>();
  // Store raw sum of effective widths (without spacing yet) for each node's arc
  const nodeRawSumEffectiveWidths = new Map<number, number>();

  nodes.forEach(node => {
    nodeTotalConnectedRibbonsCount.set(node.index, 0);
    nodeRawSumEffectiveWidths.set(node.index, 0); // Initialize
  });

  // First pass to determine effective ribbon width dynamically and accumulate raw widths
  const processedRibbonData: (IndividualRibbonData & { effectiveWidth: number })[] = [];
  let uniqueIdCounter = 0;

  individualFlows.forEach((record) => {
    const [sourceName, targetName, url, value] = record;
    const sourceIndex = nodes.find(n => n.name === sourceName)?.index;
    const targetIndex = nodes.find(n => n.name === targetName)?.index;

    if (sourceIndex === undefined || targetIndex === undefined) return;

    // Increment overall connected count for source and target
    nodeTotalConnectedRibbonsCount.set(sourceIndex, (nodeTotalConnectedRibbonsCount.get(sourceIndex) || 0) + 1);
    nodeTotalConnectedRibbonsCount.set(targetIndex, (nodeTotalConnectedRibbonsCount.get(targetIndex) || 0) + 1);

    const sourceGroupForSpan = initialNodeGroupMap.get(sourceIndex)!;
    const targetGroupForSpan = initialNodeGroupMap.get(targetIndex)!;

    let currentRibbonWidth = fixedRibbonWidthAngle;

    const sourceGroupSpan = sourceGroupForSpan.endAngle - sourceGroupForSpan.startAngle;
    const targetGroupSpan = targetGroupForSpan.endAngle - targetGroupForSpan.startAngle;

    // Use current (not final) counts for dynamic scaling in this pass
    const tempSourceCount = nodeTotalConnectedRibbonsCount.get(sourceIndex)!;
    const tempTargetCount = nodeTotalConnectedRibbonsCount.get(targetIndex)!;


    const totalRequiredSourceWidth = (tempSourceCount * (fixedRibbonWidthAngle + ribbonSpacingAngle)) - ribbonSpacingAngle;
    const totalRequiredTargetWidth = (tempTargetCount * (fixedRibbonWidthAngle + ribbonSpacingAngle)) - ribbonSpacingAngle;

    // Dynamically scale down `currentRibbonWidth` if the group's available space is a bottleneck.
    if (totalRequiredSourceWidth > sourceGroupSpan + 1e-9) {
        currentRibbonWidth = Math.min(currentRibbonWidth, (sourceGroupSpan - (tempSourceCount - 1) * ribbonSpacingAngle) / tempSourceCount);
    }
    if (totalRequiredTargetWidth > targetGroupSpan + 1e-9) {
        currentRibbonWidth = Math.min(currentRibbonWidth, (targetGroupSpan - (tempTargetCount - 1) * ribbonSpacingAngle) / tempTargetCount);
    }
    currentRibbonWidth = Math.max(0.0001, currentRibbonWidth); // Ensure a minimum visible width

    processedRibbonData.push({
      source: { index: sourceIndex, value: value, startAngle: 0, endAngle: 0 }, // Angles initialized to 0, will be set later
      target: { index: targetIndex, value: value, startAngle: 0, endAngle: 0 }, // Angles initialized to 0, will be set later
      url: url,
      originalSourceIndex: sourceIndex,
      originalTargetIndex: targetIndex,
      id: `ribbon-${uniqueIdCounter++}`,
      effectiveWidth: currentRibbonWidth
    });

    // Accumulate raw sum of effective widths for source and target nodes
    nodeRawSumEffectiveWidths.set(sourceIndex, (nodeRawSumEffectiveWidths.get(sourceIndex) || 0) + currentRibbonWidth);
    nodeRawSumEffectiveWidths.set(targetIndex, (nodeRawSumEffectiveWidths.get(targetIndex) || 0) + currentRibbonWidth);
  });

  // Calculate final node accumulated ribbon width by adding spacing for *all* connections
  const nodeAccumulatedRibbonWidth = new Map<number, number>();
  nodes.forEach(node => {
      let totalWidth = nodeRawSumEffectiveWidths.get(node.index) || 0;
      const numConnectedRibbons = nodeTotalConnectedRibbonsCount.get(node.index) || 0;

      if (numConnectedRibbons > 1) { // Only add spacing if there's more than one ribbon
          totalWidth += (numConnectedRibbons - 1) * ribbonSpacingAngle;
      }
      nodeAccumulatedRibbonWidth.set(node.index, totalWidth);
  });


  // --- Step 2: Manually calculate custom arc groups based on accumulated ribbon widths ---
  const customGroups: ChordGroup[] = [];
  let totalSumOfActualAngularWidths = 0;
  nodes.forEach(node => {
      totalSumOfActualAngularWidths += nodeAccumulatedRibbonWidth.get(node.index) || 0;
  });

  const totalAvailableAngle = 2 * Math.PI - nodes.length * padAngle;
  const scalingFactor = totalSumOfActualAngularWidths > 0 ? totalAvailableAngle / totalSumOfActualAngularWidths : 0;

  let currentAngle = 0;
  const finalNodeGroupMap = new Map<number, ChordGroup>(); // This will be the definitive map for node groups

  // Sort nodes by name for consistent arc order
  nodes.sort((a, b) => d3.ascending(a.name, b.name)).forEach(node => {
      const arcWidth = (nodeAccumulatedRibbonWidth.get(node.index) || 0) * scalingFactor;
      const startAngle = currentAngle;
      const endAngle = currentAngle + arcWidth;

      const newGroup: ChordGroup = {
          index: node.index,
          startAngle: startAngle,
          endAngle: endAngle,
          value: (nodeAccumulatedRibbonWidth.get(node.index) || 0),
          source: { index: node.index, startAngle: startAngle, endAngle: endAngle, value: (nodeAccumulatedRibbonWidth.get(node.index) || 0) },
          target: { index: node.index, startAngle: startAngle, endAngle: endAngle, value: (nodeAccumulatedRibbonWidth.get(node.index) || 0) },
      };
      customGroups.push(newGroup);
      finalNodeGroupMap.set(node.index, newGroup);
      currentAngle = endAngle + padAngle;
  });

  // --- Draw Outer Ring Segments (Arcs) using customGroups ---
  const groupElements = svg
    .append("g")
    .attr("class", "group-elements")
    .selectAll("g")
    .data(customGroups) // Use our custom-calculated groups
    .join("g");

  const arcGenerator: Arc<any, ChordGroup> = arc<ChordGroup>()
    .innerRadius(innerRadius)
    .outerRadius(outerRadius);

  const arcPathsSelection = groupElements
    .append("path")
    .attr("class", "group-arc-path")
    .attr("id", (d: ChordGroup) => `group-arc-${d.index}`)
    .attr("fill", (d: ChordGroup) => color(nodeNameMap.get(d.index) || ""))
    .attr("stroke", (d: ChordGroup) => d3.rgb(color(nodeNameMap.get(d.index) || "")).darker().toString())
    .attr("stroke-width", 1) // Initial stroke width
    .attr("fill-opacity", 0.8) // Initial fill opacity for arcs
    .attr("d", arcGenerator)
    .append("title")
    .text((d: ChordGroup) => `${nodeNameMap.get(d.index)}\nCombined Ribbon Width: ${d.value.toFixed(4)} rad`);

  groupElements
    .append("a")
    .attr("href", (d: ChordGroup) => `${linkPrefix}${nodeNameMap.get(d.index) || ""}`)
    .append("text")
    .each((d: ChordGroup & { angle?: number }) => {
      d.angle = (d.startAngle + d.endAngle) / 2; // Use the new group angles
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


  // --- Step 3: Position Individual Ribbons with no overlap ---
  // This map will group all ribbons connected to each node
  const ribbonsConnectedToNode = new Map<number, Array<{
      ribbon: IndividualRibbonData & { effectiveWidth: number };
      isSource: boolean; // True if this ribbon is outgoing from this node
  }>>();

  nodes.forEach(node => {
      ribbonsConnectedToNode.set(node.index, []);
  });

  // Populate the map with ribbons connected to each node
  processedRibbonData.forEach(ribbon => {
      ribbonsConnectedToNode.get(ribbon.originalSourceIndex)!.push({ ribbon: ribbon, isSource: true });
      ribbonsConnectedToNode.get(ribbon.originalTargetIndex)!.push({ ribbon: ribbon, isSource: false });
  });

  // Assign angles to each ribbon segment for each node
  nodes.sort((a, b) => d3.ascending(a.name, b.name)).forEach(node => {
      const nodeIndex = node.index;
      const groupData = finalNodeGroupMap.get(nodeIndex)!;
      const connectedRibbons = ribbonsConnectedToNode.get(nodeIndex)!;

      // Sort ribbons connected to this node by the angle of their *other end*.
      // This ensures a smooth, non-overlapping layout around the arc.
      connectedRibbons.sort((a, b) => {
          const aOtherEndIndex = a.isSource ? a.ribbon.originalTargetIndex : a.ribbon.originalSourceIndex;
          const bOtherEndIndex = b.isSource ? b.ribbon.originalTargetIndex : b.ribbon.originalSourceIndex;
          const aOtherEndGroup = finalNodeGroupMap.get(aOtherEndIndex)!;
          const bOtherEndGroup = finalNodeGroupMap.get(bOtherEndIndex)!;
          return d3.ascending(aOtherEndGroup.startAngle, bOtherEndGroup.startAngle);
      });

      let currentOffsetAngle = groupData.startAngle; // Start placement at the beginning of the node's arc

      connectedRibbons.forEach(({ ribbon, isSource }) => {
          // Scale effectiveWidth and ribbonSpacingAngle to the final angular scale
          const ribbonWidth = ribbon.effectiveWidth * scalingFactor;
          const scaledRibbonSpacing = ribbonSpacingAngle * scalingFactor;

          const ribbonStartAngle = currentOffsetAngle;
          const ribbonEndAngle = currentOffsetAngle + ribbonWidth;

          if (isSource) {
              ribbon.source.startAngle = ribbonStartAngle;
              ribbon.source.endAngle = ribbonEndAngle;
          } else {
              ribbon.target.startAngle = ribbonStartAngle;
              ribbon.target.endAngle = ribbonEndAngle;
          }

          currentOffsetAngle += ribbonWidth + scaledRibbonSpacing;
      });
  });

  const ribbonGenerator = ribbon<IndividualRibbonData>()
    .radius(innerRadius)
    .source(d => d.source)
    .target(d => d.target);

  const ribbonPathsSelection = svg
    .append("g")
    .attr("class", "ribbons-group")
    .selectAll("path")
    .data(processedRibbonData, d => d.id) // Use the now-modified processedRibbonData
    .join("path")
    .attr("class", "ribbon-path")
    .attr("d", ribbonGenerator)
    .attr("fill", (d: IndividualRibbonData) => color(nodeNameMap.get(d.originalSourceIndex) || ""))
    .attr("stroke", (d: IndividualRibbonData) => d3.rgb(color(nodeNameMap.get(d.originalSourceIndex) || "")).darker().toString())
    .attr("stroke-width", 0.5)
    .attr("fill-opacity", 0.6) // Initial ribbon opacity
    .style("cursor", (d: IndividualRibbonData) => {
      return d.url && d.url !== "" ? "pointer" : "default";
    });

  // --- Attach Event Listeners for Highlighting ---

  // Ribbon hover logic
  ribbonPathsSelection
    .on("mouseover", function (event: MouseEvent, d: IndividualRibbonData) {
      // Highlight only the hovered ribbon
      d3.select(this).transition().duration(100).attr("fill-opacity", 0.9);

      // Dim all arcs to create contrast
      arcPathsSelection.transition().duration(100).attr("fill-opacity", 0.2).attr("stroke-width", 1);
      // Highlight only the source and target arcs of the hovered ribbon
      d3.select(`#group-arc-${d.originalSourceIndex}`)
          .transition().duration(100)
          .attr("fill-opacity", 1)
          .attr("stroke-width", 2);
      d3.select(`#group-arc-${d.originalTargetIndex}`)
          .transition().duration(100)
          .attr("fill-opacity", 1)
          .attr("stroke-width", 2);
    })
    .on("mouseout", function (event: MouseEvent, d: IndividualRibbonData) {
      // Reset only the hovered ribbon to default
      d3.select(this).transition().duration(200).attr("fill-opacity", 0.6);
      // Reset all arcs to default
      arcPathsSelection.transition().duration(200).attr("fill-opacity", 0.8).attr("stroke-width", 1);
    })
    .on("click", (event: MouseEvent, d: IndividualRibbonData) => {
      if (d.url && d.url !== "") {
        window.open(d.url, "_blank");
      }
    })
    .append("title")
    .text((d: IndividualRibbonData) => {
      return `${nodeNameMap.get(d.originalSourceIndex)} → ${nodeNameMap.get(d.originalTargetIndex)}\nURL: ${d.url || '(N/A)'}`;
    });

  // Arc hover logic
  arcPathsSelection
      .on("mouseover", function (event: MouseEvent, d: ChordGroup) {
          const hoveredArcIndex = d.index;

          // Dim all ribbons
          ribbonPathsSelection.transition().duration(100).attr("fill-opacity", 0.1);
          // Highlight ribbons connected to the hovered arc
          ribbonPathsSelection.filter(ribbon =>
              ribbon.originalSourceIndex === hoveredArcIndex || ribbon.originalTargetIndex === hoveredArcIndex
          ).transition().duration(100).attr("fill-opacity", 0.9);

          // Dim all other arcs
          arcPathsSelection.filter(arcData => arcData.index !== hoveredArcIndex)
              .transition().duration(100)
              .attr("fill-opacity", 0.2) // Make other arcs very dim
              .attr("stroke-width", 1); // Keep stroke thin
          // Highlight the hovered arc
          d3.select(this)
              .transition().duration(100)
              .attr("fill-opacity", 1)
              .attr("stroke-width", 2);
      })
      .on("mouseout", function (event: MouseEvent, d: ChordGroup) {
          // Reset all ribbons to default
          ribbonPathsSelection.transition().duration(200).attr("fill-opacity", 0.6);
          // Reset all arcs to default
          arcPathsSelection.transition().duration(200).attr("fill-opacity", 0.8).attr("stroke-width", 1);
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
        const url = pair.url || '';

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
      const width = container.getBoundingClientRect().width - padding;
      const outerRadius = Math.ceil(width / 2.5);

      const chartConfig = {
        width: width,
        height: width,
        outerRadius: outerRadius,
        innerRadius: outerRadius - 25,
        padAngle: 0.04,
        labelOffset: 10,
      };

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
