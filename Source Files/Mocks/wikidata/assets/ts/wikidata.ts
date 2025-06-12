import * as d3 from "d3";

// --- Type Definitions ---
export interface InfoLink {
  label: string;
  url: string;
}
export interface InitialItemInput {
  id: string;
  weight: number;
  infoLinks?: InfoLink[];
}


// --- Configuration Constants ---
const WIKIDATA_SPARQL_ENDPOINT = "https://query.wikidata.org/sparql";

// --- Default Styling and Layout Options ---
const DEFAULT_INITIAL_RADIUS = 15;
const DEFAULT_INTERMEDIATE_ITEM_RADIUS = 8;
const DEFAULT_NON_INITIAL_ITEM_COLOR = "#D3D3D3";
const DEFAULT_LINK_DISTANCE_II = 100;
const DEFAULT_LINK_DISTANCE_IX = 70;
const DEFAULT_COLLISION_PADDING = 1;

// --- Data Fetching Limits ---
const MAX_RESULTS_DIRECT = 100;
const MAX_RESULTS_INDIRECT = 50;
const MAX_P31_P279_RESULTS_PER_CHUNK_LEVEL = 10;
const P31_P279_CHUNK_SIZE = 30;


// --- Interfaces ---
interface WikidataItemBase {
  id: string;
  label: string;
  isInitial: boolean;
  weight?: number;
  infoLinks?: InfoLink[];
  group?: number;
}

interface WikidataItem extends WikidataItemBase {}

interface WikidataRelation {
  source: string;
  target: string;
  property: {
    id: string;
    label: string;
  };
  isIndirectPart?: boolean;
}

interface GraphNode extends d3.SimulationNodeDatum, WikidataItemBase {
  radius: number;
  fx?: number | null;
  fy?: number | null;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
  propertyLabel: string;
  propertyId: string;
  isIndirectPart?: boolean;
}

export interface VisualizationRenderOptions {
  intermediateItemRadius: number;
  nonInitialItemColor: string;
  linkDistanceII: number;
  linkDistanceIX: number;
  collisionPadding: number;
}


// --- Main Visualization Function (Single Entry Point) ---
export async function visualizeRelations(
  language: string,
  initialItemsData: InitialItemInput[],
  options?: Partial<VisualizationRenderOptions>
): Promise<void> {
  const itemListDisplay = document.getElementById("item-list-display");
  const loader = document.getElementById("loader");

  if (!itemListDisplay || !loader) {
    console.error("Required HTML elements ('item-list-display', 'loader') not found.");
    return;
  }

  if (!initialItemsData || initialItemsData.length === 0) {
    console.error("No initial item data provided.");
    itemListDisplay.textContent = "None";
    d3.select("svg").selectAll("*").remove();
    return;
  }

  loader.classList.remove("hidden");
  itemListDisplay.textContent = initialItemsData.map((item) => `${item.id} (w:${item.weight})`).join(", ");

  const renderOptions: VisualizationRenderOptions = {
    intermediateItemRadius: options?.intermediateItemRadius ?? DEFAULT_INTERMEDIATE_ITEM_RADIUS,
    nonInitialItemColor: options?.nonInitialItemColor ?? DEFAULT_NON_INITIAL_ITEM_COLOR,
    linkDistanceII: options?.linkDistanceII ?? DEFAULT_LINK_DISTANCE_II,
    linkDistanceIX: options?.linkDistanceIX ?? DEFAULT_LINK_DISTANCE_IX,
    collisionPadding: options?.collisionPadding ?? DEFAULT_COLLISION_PADDING,
  };

  try {
    const { allItems, allRelations } = await fetchData(language, initialItemsData);
    const { prunedItems, prunedRelations } = pruneGraph(allItems, allRelations);
    renderGraph(prunedItems, prunedRelations, renderOptions);
  } catch (error) {
    console.error("Error visualizing relations:", error);
    const svg = d3.select("svg");
    svg.selectAll("*").remove();
    svg
      .append("text")
      .attr("x", "50%")
      .attr("y", "50%")
      .attr("text-anchor", "middle")
      .text("Failed to load data. Check console for details.");
  } finally {
    loader.classList.add("hidden");
  }
}


// --- Data Fetching Logic ---
async function executeSparqlQuery(query: string): Promise<any> {
  const params = new URLSearchParams();
  params.append("query", query);

  const endpointUrlWithFormat = `${WIKIDATA_SPARQL_ENDPOINT}?format=json`;

  const response = await fetch(endpointUrlWithFormat, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Accept": "application/sparql-results+json"
    },
    body: params
  });

  if (!response.ok) {
    const errorBody = await response.text();
    const errorMessage = `Wikidata SPARQL query failed with status ${response.status} ${response.statusText}.\nQuery:\n${query}\nResponse body:\n${errorBody}`;
    throw new Error(errorMessage);
  }
  return response.json();
}

async function fetchItemDetails(
  language: string,
  itemInputs: { qid: string; isInitial: boolean; weight?: number; infoLinks?: InfoLink[] }[]
): Promise<Map<string, WikidataItem>> {
  const itemMap = new Map<string, WikidataItem>();
  if (itemInputs.length === 0) return itemMap;

  const validInputInputs = itemInputs.filter(input => {
    const trimmedQid = input.qid.trim();
    const isValidQid = /^Q\d+$/.test(trimmedQid);
    if (!isValidQid) {
      console.warn(`Invalid QID format detected and skipped: '${input.qid}'`);
    }
    input.qid = trimmedQid;
    return isValidQid;
  });

  if (validInputInputs.length === 0) return itemMap;
  const qidsToFetch = validInputInputs.map((input) => input.qid);

  const chunkSize = 50;
  for (let i = 0; i < qidsToFetch.length; i += chunkSize) {
    const chunkQids = qidsToFetch.slice(i, i + chunkSize);
    const chunkInputDataMap = new Map(validInputInputs.slice(i, i + chunkSize).map(inp => [inp.qid, inp]));
    const valuesClause = chunkQids.map((id) => `wd:${id}`).join(" ");
    const query = `
      SELECT ?item ?itemLabel WHERE {
        VALUES ?item { ${valuesClause} }
        SERVICE wikibase:label { bd:serviceParam wikibase:language "${language},en". }
      }`;
    try {
      const json = await executeSparqlQuery(query);
      json.results.bindings.forEach((binding: any) => {
        const qid = binding.item.value.split("/").pop();
        const inputData = chunkInputDataMap.get(qid);
        if (inputData) {
          itemMap.set(qid, {
            id: qid,
            label: binding.itemLabel?.value || qid,
            isInitial: inputData.isInitial,
            weight: inputData.isInitial ? inputData.weight : undefined,
            infoLinks: inputData.isInitial ? inputData.infoLinks : undefined,
            group: inputData.isInitial ? 1 : 2
          });
        }
      });
    } catch (error) {
      console.warn(`Could not fetch labels for some items: ${chunkQids.join(", ")}`, error);
      chunkQids.forEach((qid) => {
        if (!itemMap.has(qid)) {
          const inputData = chunkInputDataMap.get(qid);
          if (inputData) {
            itemMap.set(qid, { id: qid, label: qid, isInitial: inputData.isInitial, weight: inputData.weight, infoLinks: inputData.infoLinks, group: inputData.isInitial ? 1 : 2 });
          }
        }
      });
    }
  }
  return itemMap;
}

async function fetchAndProcessP31P279Level(
  sourceQidsBatch: string[],
  language: string,
  itemMasterMap: Map<string, WikidataItem>,
  allRelations: WikidataRelation[],
  processedForP31P279: Set<string>,
  targetItemGroup: number,
  levelName: string
): Promise<Set<string>> {
  const newTargetsFoundThisLevel = new Set<string>();
  const qidsToQueryThisIteration = sourceQidsBatch.filter(qid => !processedForP31P279.has(qid));

  if (qidsToQueryThisIteration.length === 0) {
    return newTargetsFoundThisLevel;
  }

  console.log(`Fetching P31/P279 ${levelName} for ${qidsToQueryThisIteration.length} items.`);

  for (let i = 0; i < qidsToQueryThisIteration.length; i += P31_P279_CHUNK_SIZE) {
    const chunkOfCurrentLevelQids = qidsToQueryThisIteration.slice(i, i + P31_P279_CHUNK_SIZE);
    chunkOfCurrentLevelQids.forEach(qid => processedForP31P279.add(qid));

    const valuesClause = chunkOfCurrentLevelQids.map(id => `wd:${id.trim()}`).join(" ");
    const p31p279Query = `
      SELECT ?sourceItem ?property_entity ?propertyID ?propertyLabel ?targetItem ?targetItemLabel WHERE {
        VALUES ?sourceItem { ${valuesClause} }
        VALUES ?property_entity { wd:P31 wd:P279 }
        ?sourceItem ?p_wdt ?targetItem .
        ?property_entity wikibase:directClaim ?p_wdt .
        FILTER(ISIRI(?targetItem) && STRSTARTS(STR(?targetItem), "http://www.wikidata.org/entity/Q"))
        BIND(REPLACE(STR(?property_entity), STR(wd:), "") AS ?propertyID)
        SERVICE wikibase:label {
          bd:serviceParam wikibase:language "${language},en".
          ?property_entity rdfs:label ?propertyLabel .
          ?targetItem rdfs:label ?targetItemLabel .
        }
      } LIMIT ${MAX_P31_P279_RESULTS_PER_CHUNK_LEVEL}`;

    try {
      const jsonResponse = await executeSparqlQuery(p31p279Query);
      jsonResponse.results.bindings.forEach((binding: any) => {
        const sourceQid = binding.sourceItem.value.split("/").pop();
        const targetQid = binding.targetItem.value.split("/").pop();
        const propertyId = binding.propertyID.value;
        const propertyLabel = binding.propertyLabel?.value || propertyId;
        const targetLabel = binding.targetItemLabel?.value || targetQid;

        if (!targetQid || targetQid.length === 0) return;

        allRelations.push({
          source: sourceQid,
          target: targetQid,
          property: { id: propertyId, label: propertyLabel },
          isIndirectPart: true,
        });
        if (!itemMasterMap.has(targetQid)) {
          itemMasterMap.set(targetQid, {
            id: targetQid,
            label: targetLabel,
            isInitial: false,
            group: targetItemGroup,
          });
          newTargetsFoundThisLevel.add(targetQid);
        }
      });
    } catch (error) {
      console.error(`Error fetching P31/P279 ${levelName} for chunk starting with ${chunkOfCurrentLevelQids[0]}:`, error);
    }
  }
  return newTargetsFoundThisLevel;
}

async function fetchData(language: string, initialItemsData: InitialItemInput[]): Promise<{ allItems: WikidataItem[]; allRelations: WikidataRelation[] }> {
    const initialItemInputsForFetch = initialItemsData.map((item) => ({ qid: item.id.trim(), isInitial: true, weight: item.weight, infoLinks: item.infoLinks }));
    const itemMasterMap = await fetchItemDetails(language, initialItemInputsForFetch);
    const allRelations: WikidataRelation[] = [];
    const uniqueInitialQIds = Array.from(new Set(initialItemsData.map(item => item.id.trim())));
  
    if (uniqueInitialQIds.length >= 1) {
      const initialValuesClause = uniqueInitialQIds.map((id) => `wd:${id}`).join(" ");
      const directRelationsQuery = `SELECT ?item1 ?prop ?propLabel ?item2 WHERE { VALUES ?item1 { ${initialValuesClause} } VALUES ?item2 { ${initialValuesClause} } FILTER(?item1 != ?item2) ?item1 ?p ?item2 . ?property_entity wikibase:directClaim ?p . BIND(REPLACE(STR(?p), STR(wdt:), "") AS ?prop) SERVICE wikibase:label { bd:serviceParam wikibase:language "${language},en". ?property_entity rdfs:label ?propLabel . } } LIMIT ${MAX_RESULTS_DIRECT}`;
      try {
        const directJson = await executeSparqlQuery(directRelationsQuery);
        directJson.results.bindings.forEach((binding: any) => { allRelations.push({ source: binding.item1.value.split("/").pop(), target: binding.item2.value.split("/").pop(), property: { id: binding.prop.value, label: binding.propLabel?.value || binding.prop.value }, isIndirectPart: false }); });
      } catch (error) { console.error("Error fetching direct relations:", error); }
    }
  
    if (uniqueInitialQIds.length >= 2) {
      const initialValuesClause = uniqueInitialQIds.map((id) => `wd:${id}`).join(" ");
      const indirectRelationsQuery = `SELECT ?initial1 ?prop1_id ?prop1Label ?intermediate ?intermediateLabel ?prop2_id ?prop2Label ?initial2 WHERE { VALUES ?initial1 { ${initialValuesClause} } VALUES ?initial2 { ${initialValuesClause} } FILTER(?initial1 != ?initial2) ?initial1 ?p1 ?intermediate . ?intermediate ?p2 ?initial2 . FILTER NOT EXISTS { VALUES ?item { ${initialValuesClause} } . FILTER (?intermediate = ?item) } ?property1 wikibase:directClaim ?p1 . BIND(REPLACE(STR(?p1), STR(wdt:), "") AS ?prop1_id) ?property2 wikibase:directClaim ?p2 . BIND(REPLACE(STR(?p2), STR(wdt:), "") AS ?prop2_id) SERVICE wikibase:label { bd:serviceParam wikibase:language "${language},en". ?intermediate rdfs:label ?intermediateLabel . ?property1 rdfs:label ?prop1Label . ?property2 rdfs:label ?prop2Label . } } LIMIT ${MAX_RESULTS_INDIRECT}`;
      try {
        const indirectJson = await executeSparqlQuery(indirectRelationsQuery);
        const newIntermediateQInputsForFetch: { qid: string; isInitial: boolean }[] = [];
        indirectJson.results.bindings.forEach((binding: any) => {
          const intermediateQid = binding.intermediate.value.split("/").pop();
          allRelations.push({ source: binding.initial1.value.split("/").pop(), target: intermediateQid, property: { id: binding.prop1_id.value, label: binding.prop1Label?.value || binding.prop1_id.value }, isIndirectPart: true });
          allRelations.push({ source: intermediateQid, target: binding.initial2.value.split("/").pop(), property: { id: binding.prop2_id.value, label: binding.prop2Label?.value || binding.prop2_id.value }, isIndirectPart: true });
          if (!itemMasterMap.has(intermediateQid) && !newIntermediateQInputsForFetch.some((item) => item.qid === intermediateQid)) { newIntermediateQInputsForFetch.push({ qid: intermediateQid, isInitial: false }); }
        });
        if (newIntermediateQInputsForFetch.length > 0) {
          const intermediateDetails = await fetchItemDetails(language, newIntermediateQInputsForFetch);
          intermediateDetails.forEach((item, qid) => { if (!itemMasterMap.has(qid)) itemMasterMap.set(qid, item); });
        }
      } catch (error) { console.error("Error fetching indirect relations:", error); }
    }
  
    const processedForP31P279 = new Set<string>();
    const qidsForLevel1 = Array.from(itemMasterMap.keys());
    const level1Targets = await fetchAndProcessP31P279Level(qidsForLevel1, language, itemMasterMap, allRelations, processedForP31P279, 3, "Level 1");
    if (level1Targets.size > 0) { await fetchAndProcessP31P279Level(Array.from(level1Targets), language, itemMasterMap, allRelations, processedForP31P279, 4, "Level 2"); }
  
    // Corrected the line that caused the error
    const allQidsInRelations = new Set<string>(allRelations.flatMap(r => [r.source, r.target]));
    const missingQidInputs = Array.from(allQidsInRelations).filter(qid => qid && !itemMasterMap.has(qid)).map(qid => ({ qid: qid, isInitial: false }));
    if (missingQidInputs.length > 0) {
      console.warn(`Fetching details for ${missingQidInputs.length} items found only in relations.`);
      const missingDetails = await fetchItemDetails(language, missingQidInputs);
      missingDetails.forEach((item, qid) => { if (!itemMasterMap.has(qid)) itemMasterMap.set(qid, item); });
    }
  
    return { allItems: Array.from(itemMasterMap.values()), allRelations };
}


// --- Graph Pruning Logic ---
function findConnectedComponents(nodeIds: string[], adjacency: Map<string, string[]>): Set<string>[] {
    const components: Set<string>[] = [];
    const visited = new Set<string>();
    for (const nodeId of nodeIds) {
      if (!visited.has(nodeId)) {
        const currentComponent = new Set<string>();
        const queue = [nodeId];
        visited.add(nodeId);
        while (queue.length > 0) {
          const u = queue.shift()!;
          currentComponent.add(u);
          const neighbors = adjacency.get(u) || [];
          for (const v of neighbors) {
            if (!visited.has(v)) {
              visited.add(v);
              queue.push(v);
            }
          }
        }
        components.push(currentComponent);
      }
    }
    return components;
}
  
function pruneGraph(items: WikidataItem[], relations: WikidataRelation[]): { prunedItems: WikidataItem[]; prunedRelations: WikidataRelation[] } {
    if (items.length === 0) return { prunedItems: [], prunedRelations: [] };
  
    const initialItems = items.filter(item => item.isInitial);
    const initialItemIds = new Set(initialItems.map(item => item.id));
    const nonInitialItems = items.filter(item => !item.isInitial);
  
    if (initialItemIds.size < 2) {
      const prunedRelations = relations.filter(rel => initialItemIds.has(rel.source) && initialItemIds.has(rel.target));
      console.log(`Pruning all non-initial nodes as there are fewer than 2 initial nodes.`);
      return { prunedItems: initialItems, prunedRelations };
    }
  
    const fullAdjacency = new Map<string, string[]>();
    items.forEach(item => fullAdjacency.set(item.id, []));
    relations.forEach(rel => { fullAdjacency.get(rel.source)!.push(rel.target); fullAdjacency.get(rel.target)!.push(rel.source); });
  
    const graySubgraphAdjacency = new Map<string, string[]>();
    nonInitialItems.forEach(item => graySubgraphAdjacency.set(item.id, []));
    relations.forEach(rel => { if (graySubgraphAdjacency.has(rel.source) && graySubgraphAdjacency.has(rel.target)) { graySubgraphAdjacency.get(rel.source)!.push(rel.target); graySubgraphAdjacency.get(rel.target)!.push(rel.source); } });
  
    const grayComponents = findConnectedComponents(nonInitialItems.map(item => item.id), graySubgraphAdjacency);
    const nodesToKeep = new Set<string>(initialItemIds);
  
    grayComponents.forEach(component => {
      const attachmentPoints = new Set<string>();
      component.forEach(grayNodeId => {
        const neighborsInFullGraph = fullAdjacency.get(grayNodeId) || [];
        neighborsInFullGraph.forEach(neighborId => { if (initialItemIds.has(neighborId)) { attachmentPoints.add(neighborId); } });
      });
      if (attachmentPoints.size >= 2) { component.forEach(grayNodeId => nodesToKeep.add(grayNodeId)); }
    });
  
    console.log(`Pruning ${items.length - nodesToKeep.size} non-essential non-initial nodes.`);
    const prunedItems = items.filter(item => nodesToKeep.has(item.id));
    const prunedRelations = relations.filter(rel => nodesToKeep.has(rel.source) && nodesToKeep.has(rel.target));
    return { prunedItems, prunedRelations };
}


// --- D3.js Rendering ---
function renderGraph(items: WikidataItem[], relations: WikidataRelation[], vizOptions: VisualizationRenderOptions): void {
  const svg = d3.select("svg");
  const width = +svg.attr("width")!;
  const height = +svg.attr("height")!;
  const tooltip = d3.select("#tooltip");

  svg.selectAll("*").remove();
  const container = svg.append("g").attr("class", "graph-container");

  if (items.length === 0) {
    svg.append("text").attr("x", "50%").attr("y", "50%").attr("text-anchor", "middle").text("No connecting items found.");
    return;
  }

  const nodes: GraphNode[] = items.map((item) => ({
    ...item,
    radius: item.isInitial ? (item.weight || DEFAULT_INITIAL_RADIUS) : vizOptions.intermediateItemRadius,
  }));

  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  const links: GraphLink[] = relations.map((rel) => ({ source: nodeMap.get(rel.source)!, target: nodeMap.get(rel.target)!, propertyLabel: rel.property.label, propertyId: rel.property.id, isIndirectPart: rel.isIndirectPart })).filter((link) => link.source && link.target);

  const simulation = d3.forceSimulation<GraphNode>(nodes)
    .force("link", d3.forceLink<GraphNode, GraphLink>(links).id((d: any) => d.id)
        .distance(d => ((d.source as GraphNode).isInitial && (d.target as GraphNode).isInitial) ? vizOptions.linkDistanceII : vizOptions.linkDistanceIX)
        .strength(0.7))
    .force("charge", d3.forceManyBody().strength(-400))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collision", d3.forceCollide<GraphNode>().radius(d => d.radius + vizOptions.collisionPadding).strength(0.8));

  const linkGroup = container.append("g").attr("class", "links");
  const nodeGroup = container.append("g").attr("class", "nodes");
  const labelGroup = container.append("g").attr("class", "labels");
  const linkLabelGroup = container.append("g").attr("class", "link-labels");

  const linkElements = linkGroup.selectAll("line").data(links).enter().append("line").attr("class", "link").style("stroke-opacity", d => d.isIndirectPart ? 0.3 : 0.6);
  const linkLabelElements = linkLabelGroup.selectAll("text").data(links).enter().append("text").attr("class", "link-label").text(d => d.propertyLabel).style("opacity", d => d.isIndirectPart ? 0.5 : 1.0);
  const nodeElements = nodeGroup.selectAll("g.node").data(nodes, (d: any) => d.id).enter().append("g").attr("class", "node").call(drag(simulation) as any);
  const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

  nodeElements.append("circle")
    .attr("r", d => d.radius)
    .attr("fill", d => !d.isInitial ? vizOptions.nonInitialItemColor : colorScale(d.group?.toString() ?? d.id))
    .attr("stroke", "#fff")
    .attr("stroke-width", 1.5)
    .style("opacity", d => d.isInitial ? 1.0 : 0.6);

  const nodeLabelElements = labelGroup.selectAll("text.node-label").data(nodes, (d: any) => d.id).enter().append("text")
    .attr("class", "node-label")
    .text(d => d.label)
    .attr("dx", d => d.radius + 5)
    .attr("dy", ".35em")
    .style("opacity", d => d.isInitial ? 1.0 : 0.6);

  nodeElements.sort((a: any, b: any) => (a.isInitial ? 1 : 0) - (b.isInitial ? 1 : 0));
  nodeLabelElements.sort((a: any, b: any) => (a.isInitial ? 1 : 0) - (b.isInitial ? 1 : 0));

  nodeElements
    .on("mouseover", (event, d_node: any) => {
      tooltip.transition().duration(200).style("opacity", 0.95);
      let htmlContent = `<strong>${d_node.label}</strong> (Q${d_node.id})<br/>`;
      htmlContent += `<a href="https://www.wikidata.org/wiki/${d_node.id}" target="_blank" rel="noopener noreferrer" style="font-size: 0.9em; color: #369;">View on Wikidata</a><br/>`;
      htmlContent += `<em>${d_node.isInitial ? "Initial Item" + (d_node.weight !== undefined ? " (Weight: " + d_node.weight + ")" : "") : "Non-Initial Item"}</em>`;
      if (d_node.isInitial && d_node.infoLinks && d_node.infoLinks.length > 0) {
        htmlContent += "<br/><br/><strong>More Info:</strong><ul>";
        d_node.infoLinks.forEach((link: any) => { htmlContent += `<li><a href="${link.url}" target="_blank" rel="noopener noreferrer">${link.label}</a></li>`; });
        htmlContent += "</ul>";
      }
      tooltip.html(htmlContent).style("left", event.pageX + 15 + "px").style("top", event.pageY - 28 + "px");

      const connectedNodeIds = new Set([d_node.id]);
      links.forEach(l => {
        if ((l.source as GraphNode).id === d_node.id) connectedNodeIds.add((l.target as GraphNode).id);
        if ((l.target as GraphNode).id === d_node.id) connectedNodeIds.add((l.source as GraphNode).id);
      });
      nodeElements.style("opacity", n => connectedNodeIds.has((n as any).id) ? 1 : 0.1);
      nodeLabelElements.style("opacity", n => connectedNodeIds.has((n as any).id) ? 1 : 0.1);
      linkElements.style("stroke-opacity", l => ((l.source as GraphNode).id === d_node.id || (l.target as GraphNode).id === d_node.id) ? 1 : 0.1);
      linkLabelElements.style("opacity", l => ((l.source as GraphNode).id === d_node.id || (l.target as GraphNode).id === d_node.id) ? 1.0 : (l.isIndirectPart ? 0.2 : 0.3));
    })
    .on("mouseout", () => {
      tooltip.transition().duration(500).style("opacity", 0);
      nodeElements.style("opacity", (d: any) => d.isInitial ? 1.0 : 0.6);
      nodeLabelElements.style("opacity", (d: any) => d.isInitial ? 1.0 : 0.6);
      linkElements.style("stroke-opacity", (d: any) => d.isIndirectPart ? 0.3 : 0.6);
      linkLabelElements.style("opacity", (d: any) => d.isIndirectPart ? 0.5 : 1.0);
    })
    .on("click", (event, d_node: any) => { window.open(`https://www.wikidata.org/wiki/${d_node.id}`, "_blank"); });

  const tick = () => {
    linkElements.attr("x1", d => (d.source as GraphNode).x!).attr("y1", d => (d.source as GraphNode).y!).attr("x2", d => (d.target as GraphNode).x!).attr("y2", d => (d.target as GraphNode).y!);
    nodeElements.attr("transform", d => `translate(${(d as any).x},${(d as any).y})`);
    nodeLabelElements.attr("x", d => (d as any).x! + (d as any).radius + 5).attr("y", d => (d as any).y!);
    linkLabelElements.attr("x", d => ((d.source as GraphNode).x! + (d.target as GraphNode).x!) / 2).attr("y", d => ((d.source as GraphNode).y! + (d.target as GraphNode).y!) / 2);
  };
  simulation.on("tick", tick);

  const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.1, 10])
    .on("zoom", (event) => {
      const { transform } = event;
      container.attr("transform", transform);

      const BASE_FONT_SIZE = 12;
      const MIN_FONT_SIZE = 8;
      const MAX_FONT_SIZE = 18;
      
      const newFontSize = BASE_FONT_SIZE / transform.k;
      const clampedNodeFontSize = Math.max(MIN_FONT_SIZE, Math.min(newFontSize, MAX_FONT_SIZE));
      const clampedLinkFontSize = Math.max(MIN_FONT_SIZE - 2, Math.min(newFontSize, MAX_FONT_SIZE - 2));

      nodeLabelElements.style("font-size", `${clampedNodeFontSize}px`).attr("dx", d => (d as any).radius + (5 / transform.k));
      linkLabelElements.style("font-size", `${clampedLinkFontSize}px`);
    });
  svg.call(zoomBehavior);

  simulation.on("end", () => {
    if (nodes.length === 0) return;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    nodes.forEach((node: any) => {
        const r = node.radius;
        if (node.x! - r < minX) minX = node.x! - r; if (node.x! + r > maxX) maxX = node.x! + r;
        if (node.y! - r < minY) minY = node.y! - r; if (node.y! + r > maxY) maxY = node.y! + r;
    });
    const PADDING = 50;
    const graphContentWidth = maxX - minX;
    const graphContentHeight = maxY - minY;
    if (graphContentWidth <= 0 || graphContentHeight <= 0) return;

    const scale = Math.min((width - 2 * PADDING) / graphContentWidth, (height - 2 * PADDING) / graphContentHeight, 1.5);
    const translateX = (width / 2) - (minX + graphContentWidth / 2) * scale;
    const translateY = (height / 2) - (minY + graphContentHeight / 2) * scale;
    const transform = d3.zoomIdentity.translate(translateX, translateY).scale(scale);
    svg.transition().duration(750).call(zoomBehavior.transform, transform);
  });
}

// --- D3 Drag Handler ---
function drag(simulation: d3.Simulation<GraphNode, any>) {
    function dragstarted(event: d3.D3DragEvent<SVGGElement, GraphNode, any>, d: GraphNode) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }
    function dragged(event: d3.D3DragEvent<SVGGElement, GraphNode, any>, d: GraphNode) {
      d.fx = event.x;
      d.fy = event.y;
    }
    function dragended(event: d3.D3DragEvent<SVGGElement, GraphNode, any>, d: GraphNode) {
      if (!event.active) simulation.alphaTarget(0);
    }
    return d3.drag<SVGGElement, GraphNode>().on("start", dragstarted).on("drag", dragged).on("end", dragended);
}