import * as d3 from "d3";
import type { InfoLink, InitialItemInput } from "./transformations";

// --- Configuration ---
const WIKIDATA_SPARQL_ENDPOINT = "https://query.wikidata.org/sparql";
// const LANGUAGE = "en"; // REMOVED - now a parameter
const DEFAULT_INITIAL_RADIUS = 15; // Fallback if weight is not provided for an initial item
const INTERMEDIATE_ITEM_RADIUS = 8;
const MAX_RESULTS_DIRECT = 100;
const MAX_RESULTS_INDIRECT = 50;

interface WikidataItemBase {
  id: string;
  label: string;
  isInitial: boolean;
  weight?: number; // Store the input weight for initial items
  infoLinks?: InfoLink[]; // Store custom links for initial items
  group?: number; // For coloring or grouping
}

interface WikidataItem extends WikidataItemBase {
  // any specific item properties if needed later
}

interface WikidataRelation {
  source: string; // Wikidata ID (QID)
  target: string; // Wikidata ID (QID)
  property: {
    id: string; // Property ID (PID)
    label: string;
  };
  isIndirectPart?: boolean; // Added for opacity styling
}

interface GraphNode extends d3.SimulationNodeDatum, WikidataItemBase {
  radius: number; // Calculated radius for D3
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
  propertyLabel: string;
  propertyId: string;
  isIndirectPart?: boolean; // Added for opacity styling
}

// --- Configuration Constants (Defaults) ---
const DEFAULT_INITIAL_RADIUS_CONST = 15;
const DEFAULT_INTERMEDIATE_ITEM_RADIUS_CONST = 8;
const DEFAULT_NODE_COLLISION_PADDING = 3; // Tighter default
const DEFAULT_LINK_DISTANCE_INITIAL_TO_INITIAL = 150; // Shorter default
const DEFAULT_LINK_DISTANCE_OTHER = 90; // Shorter default

// --- Exposed Configuration Interface ---
export interface GraphRenderOptions {
  defaultInitialRadius?: number;
  intermediateItemRadius?: number;
  intermediateItemColor?: string;
  nodeCollisionPadding?: number;
  linkDistanceInitialToInitial?: number;
  linkDistanceOther?: number;
}

// --- Main Visualization Function (Single Entry Point) ---
export async function visualizeRelations(
  language: string, // Language remains a primary parameter for data fetching
  initialItemsData: InitialItemInput[],
  renderOptions?: Partial<GraphRenderOptions> // Optional rendering overrides
): Promise<void> {
  const itemListDisplay = document.getElementById("item-list-display");
  if (!itemListDisplay) {
    console.error("Element with ID 'item-list-display' not found.");
    return;
  }

  if (!initialItemsData || initialItemsData.length === 0) {
    console.error("No initial item data provided.");
    itemListDisplay.textContent = "None";
    d3.select("svg").selectAll("*").remove();
    return;
  }
  itemListDisplay.textContent = initialItemsData.map((item) => `${item.id} (w:${item.weight})`).join(", ");

  // Consolidate effective rendering options
  const effectiveRenderOptions: Required<Omit<GraphRenderOptions, 'intermediateItemColor'>> & { intermediateItemColor?: string } = {
    defaultInitialRadius: renderOptions?.defaultInitialRadius ?? DEFAULT_INITIAL_RADIUS_CONST,
    intermediateItemRadius: renderOptions?.intermediateItemRadius ?? DEFAULT_INTERMEDIATE_ITEM_RADIUS_CONST,
    intermediateItemColor: renderOptions?.intermediateItemColor, // Can be undefined
    nodeCollisionPadding: renderOptions?.nodeCollisionPadding ?? DEFAULT_NODE_COLLISION_PADDING,
    linkDistanceInitialToInitial: renderOptions?.linkDistanceInitialToInitial ?? DEFAULT_LINK_DISTANCE_INITIAL_TO_INITIAL,
    linkDistanceOther: renderOptions?.linkDistanceOther ?? DEFAULT_LINK_DISTANCE_OTHER,
  };

  try {
    // Pass language directly, as fetchData needs it.
    const { allItems, allRelations } = await fetchData(language, initialItemsData);
    // Pass the consolidated render options to renderGraph.
    renderGraph(allItems, allRelations, effectiveRenderOptions);
  } catch (error) {
    console.error("Error visualizing relations:", error);
    const svg = d3.select("svg");
    svg.selectAll("*").remove();
    svg
      .append("text")
      .attr("x", +svg.attr("width")! / 2)
      .attr("y", +svg.attr("height")! / 2)
      .attr("text-anchor", "middle")
      .text("Failed to load data. Check console for details.");
  }
}

// --- Data Fetching Logic ---
async function executeSparqlQuery(query: string): Promise<any> {
  const fullUrl = `${WIKIDATA_SPARQL_ENDPOINT}?query=${encodeURIComponent(query)}&format=json`;
  const response = await fetch(fullUrl, {
    headers: { Accept: "application/sparql-results+json" }
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Wikidata SPARQL query failed: ${response.statusText}\n${errorText}\nQuery:\n${query}`);
  }
  return response.json();
}

async function fetchItemDetails(
  language: string,
  itemInputs: { qid: string; isInitial: boolean; weight?: number; infoLinks?: InfoLink[] }[]
): Promise<Map<string, WikidataItem>> {
  const itemMap = new Map<string, WikidataItem>();
  if (itemInputs.length === 0) return itemMap;

  const qidsToFetch = itemInputs.map((input) => input.qid);

  const chunkSize = 50;
  for (let i = 0; i < qidsToFetch.length; i += chunkSize) {
    const chunkQids = qidsToFetch.slice(i, i + chunkSize);
    const valuesClause = chunkQids.map((id) => `wd:${id.trim()}`).join(" ");
    const query = `
            SELECT ?item ?itemLabel WHERE {
                VALUES ?item { ${valuesClause} }
                SERVICE wikibase:label { bd:serviceParam wikibase:language "${language},en". } # MODIFIED for English fallback
            }
        `;
    try {
      const json = await executeSparqlQuery(query);
      json.results.bindings.forEach((binding: any) => {
        const qid = binding.item.value.split("/").pop();
        const inputData = itemInputs.find((inp) => inp.qid === qid);
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
          const inputData = itemInputs.find((inp) => inp.qid === qid);
          if (inputData) {
            itemMap.set(qid, {
              id: qid,
              label: qid,
              isInitial: inputData.isInitial,
              weight: inputData.isInitial ? inputData.weight : undefined,
              infoLinks: inputData.isInitial ? inputData.infoLinks : undefined,
              group: inputData.isInitial ? 1 : 2
            });
          }
        }
      });
    }
  }
  itemInputs.forEach((input) => {
    if (!itemMap.has(input.qid)) {
      itemMap.set(input.qid, {
        id: input.qid,
        label: input.qid,
        isInitial: input.isInitial,
        weight: input.isInitial ? input.weight : undefined,
        infoLinks: input.isInitial ? input.infoLinks : undefined,
        group: input.isInitial ? 1 : 2
      });
    }
  });
  return itemMap;
}

async function fetchData(
  language: string,
  initialItemsData: InitialItemInput[]
): Promise<{ allItems: WikidataItem[]; allRelations: WikidataRelation[] }> {
  const initialItemInputsForFetch = initialItemsData.map((item) => ({
    qid: item.id.trim(),
    isInitial: true,
    weight: item.weight,
    infoLinks: item.infoLinks
  }));

  const itemMasterMap = await fetchItemDetails(language, initialItemInputsForFetch);
  const allRelations: WikidataRelation[] = [];
  // const discoveredQIds = new Set<string>(initialItemsData.map((item) => item.id.trim())); // Not used directly later for adding to map

  const uniqueInitialQIds = Array.from(new Set(initialItemsData.map(item => item.id.trim())));


  // 2. Fetch direct relations BETWEEN initial items
  if (uniqueInitialQIds.length >= 1) { // Changed from >=2 to allow direct relations for single initial items if they link to themselves (though rare) or to handle future cases. For between items, >=2 is practical.
    const initialValuesClause = uniqueInitialQIds.map((id) => `wd:${id}`).join(" ");
    const directRelationsQuery = `
            SELECT ?item1 ?prop ?propLabel ?item2 WHERE {
                VALUES ?item1 { ${initialValuesClause} }
                VALUES ?item2 { ${initialValuesClause} }
                FILTER(?item1 != ?item2) # Ensure different items for direct relations
                ?item1 ?p ?item2 .
                ?property wikibase:directClaim ?p .
                BIND(REPLACE(STR(?p), STR(wdt:), "") AS ?prop)
                SERVICE wikibase:label { bd:serviceParam wikibase:language "${language},en". } # MODIFIED for English fallback
            } LIMIT ${MAX_RESULTS_DIRECT}
        `;
    try {
      const directJson = await executeSparqlQuery(directRelationsQuery);
      directJson.results.bindings.forEach((binding: any) => {
        const sourceQid = binding.item1.value.split("/").pop();
        const targetQid = binding.item2.value.split("/").pop();
        allRelations.push({
          source: sourceQid,
          target: targetQid,
          property: {
            id: binding.prop.value,
            label: binding.propLabel?.value || binding.prop.value
          },
          isIndirectPart: false // MODIFIED: Mark as not indirect
        });
      });
    } catch (error) {
      console.error("Error fetching direct relations:", error);
    }
  }

  // 3. Fetch intermediate items and their relations to initial items
  if (uniqueInitialQIds.length >= 2) {
    const initialValuesClause = uniqueInitialQIds.map((id) => `wd:${id}`).join(" ");
    const indirectRelationsQuery = `
            SELECT ?initial1 ?prop1_id ?prop1Label ?intermediate ?intermediateLabel ?prop2_id ?prop2Label ?initial2 WHERE {
                VALUES ?initial1 { ${initialValuesClause} }
                VALUES ?initial2 { ${initialValuesClause} }
                FILTER(?initial1 != ?initial2)

                ?initial1 ?p1 ?intermediate .
                ?intermediate ?p2 ?initial2 .

                FILTER NOT EXISTS { VALUES ?initialItemInList { ${initialValuesClause} } . FILTER (?intermediate = ?initialItemInList) }

                ?property1 wikibase:directClaim ?p1 . BIND(REPLACE(STR(?p1), STR(wdt:), "") AS ?prop1_id)
                ?property2 wikibase:directClaim ?p2 . BIND(REPLACE(STR(?p2), STR(wdt:), "") AS ?prop2_id)

                SERVICE wikibase:label {
                    bd:serviceParam wikibase:language "${language},en". # MODIFIED for English fallback
                    ?intermediate rdfs:label ?intermediateLabel .
                    ?property1 rdfs:label ?prop1Label .
                    ?property2 rdfs:label ?prop2Label .
                }
            } LIMIT ${MAX_RESULTS_INDIRECT}
        `;
    try {
      const indirectJson = await executeSparqlQuery(indirectRelationsQuery);
      const newIntermediateQInputsForFetch: { qid: string; isInitial: boolean }[] = [];

      indirectJson.results.bindings.forEach((binding: any) => {
        const initial1Qid = binding.initial1.value.split("/").pop();
        const intermediateQid = binding.intermediate.value.split("/").pop();
        const initial2Qid = binding.initial2.value.split("/").pop();

        allRelations.push({
          source: initial1Qid,
          target: intermediateQid,
          property: { id: binding.prop1_id.value, label: binding.prop1Label?.value || binding.prop1_id.value },
          isIndirectPart: true // MODIFIED: Mark as indirect
        });
        allRelations.push({
          source: intermediateQid,
          target: initial2Qid,
          property: { id: binding.prop2_id.value, label: binding.prop2Label?.value || binding.prop2_id.value },
          isIndirectPart: true // MODIFIED: Mark as indirect
        });

        if (!itemMasterMap.has(intermediateQid) && !newIntermediateQInputsForFetch.some((item) => item.qid === intermediateQid)) {
          newIntermediateQInputsForFetch.push({ qid: intermediateQid, isInitial: false });
        }
      });

      if (newIntermediateQInputsForFetch.length > 0) {
        const intermediateDetails = await fetchItemDetails(language, newIntermediateQInputsForFetch);
        intermediateDetails.forEach((item, qid) => {
          if (!itemMasterMap.has(qid)) itemMasterMap.set(qid, item);
        });
      }
    } catch (error) {
      console.error("Error fetching indirect relations:", error);
    }
  }

  const allQidsInRelations = new Set<string>();
  allRelations.forEach((rel) => {
    allQidsInRelations.add(rel.source);
    allQidsInRelations.add(rel.target);
  });
  const missingQidInputs = Array.from(allQidsInRelations)
    .filter((qid) => !itemMasterMap.has(qid))
    .map((qid) => ({ qid, isInitial: false }));

  if (missingQidInputs.length > 0) {
    console.warn(
      "Fetching details for items found only in relations (assumed intermediate):",
      missingQidInputs.map((i) => i.qid)
    );
    const missingDetails = await fetchItemDetails(language, missingQidInputs);
    missingDetails.forEach((item, qid) => itemMasterMap.set(qid, item));
  }

  const allItems = Array.from(itemMasterMap.values());
  return { allItems, allRelations };
}

// --- D3.js Rendering ---
function renderGraph(items: WikidataItem[], relations: WikidataRelation[]): void {
  const svg = d3.select("svg");
  const width = +svg.attr("width")!;
  const height = +svg.attr("height")!;
  const tooltip = d3.select("#tooltip");

  svg.selectAll("*").remove();
  const container = svg.append("g").attr("class", "graph-container");

  if (items.length === 0) {
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", height / 2)
      .attr("text-anchor", "middle")
      .text("No items to display.");
    return;
  }

  const nodes: GraphNode[] = items.map((item) => ({
    ...item, // Spreads all properties from WikidataItem
    id: item.id, // Ensure id is directly available
    label: item.label,
    isInitial: item.isInitial,
    weight: item.weight,
    infoLinks: item.infoLinks,
    group: item.group,
    radius: item.isInitial ? item.weight || DEFAULT_INITIAL_RADIUS : INTERMEDIATE_ITEM_RADIUS,
    // Explicitly ensure x, y, vx, vy for D3 simulation if not already part of ...item spread
    x: undefined, 
    y: undefined,
    vx: undefined,
    vy: undefined,
    fx: null, // Add fx and fy for fixing nodes on drag
    fy: null,
  }));

  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  const links: GraphLink[] = relations
    .map((rel) => ({
      source: nodeMap.get(rel.source)!,
      target: nodeMap.get(rel.target)!,
      propertyLabel: rel.property.label,
      propertyId: rel.property.id,
      isIndirectPart: rel.isIndirectPart
    }))
    .filter((link) => link.source && link.target);

  const simulation = d3
    .forceSimulation<GraphNode>(nodes)
    .force("link", d3.forceLink<GraphNode, GraphLink>(links)
        .id(d => d.id) // Link nodes by their ID
        .distance(d => ((d.source as GraphNode).isInitial && (d.target as GraphNode).isInitial ? 180 : 120))
        .strength(0.7))
    .force("charge", d3.forceManyBody().strength(-400))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collision", d3.forceCollide<GraphNode>().radius(d => d.radius + 8).strength(0.8));

  const linkGroup = container.append("g").attr("class", "links");
  const nodeGroup = container.append("g").attr("class", "nodes");
  const labelGroup = container.append("g").attr("class", "labels");
  const linkLabelGroup = container.append("g").attr("class", "link-labels");

  const linkElements = linkGroup
    .selectAll("line")
    .data(links)
    .enter()
    .append("line")
    .attr("class", "link")
    .attr("stroke-width", 1.5)
    .style("stroke-opacity", d => d.isIndirectPart ? 0.3 : 0.6);

  const linkLabelElements = linkLabelGroup
    .selectAll("text")
    .data(links)
    .enter()
    .append("text")
    .attr("class", "link-label")
    .text((d) => d.propertyLabel)
    .style("opacity", d => d.isIndirectPart ? 0.5 : 1.0);

  const nodeElements = nodeGroup
    .selectAll("g")
    .data(nodes)
    .enter()
    .append("g")
    .attr("class", "node")
    .call(drag(simulation) as any);

  const colorScale = d3.scaleOrdinal(d3.schemeCategory10);
  nodeElements
    .append("circle")
    .attr("r", (d) => d.radius)
    .attr("fill", (d) => colorScale(d.group?.toString() ?? d.id))
    .attr("stroke", "#fff")
    .attr("stroke-width", 1.5)
    .style("opacity", d => d.isInitial ? 1.0 : 0.6);

  const nodeLabelElements = labelGroup
    .selectAll("text")
    .data(nodes)
    .enter()
    .append("text")
    .attr("class", "node-label")
    .text((d) => d.label)
    .attr("dx", (d) => d.radius + 4)
    .attr("dy", ".35em")
    .style("opacity", d => d.isInitial ? 1.0 : 0.6);

  nodeElements
    .on("mouseover", (event, d_node) => {
      tooltip.transition().duration(200).style("opacity", 0.95);
      
      // --- START: RESTORED TOOLTIP CONTENT AND POSITIONING ---
      let htmlContent = `<strong>${d_node.label}</strong> (Q${d_node.id})<br/>`;
      htmlContent += `<em>${d_node.isInitial ? "Initial Item" + (d_node.weight !== undefined ? " (Weight: " + d_node.weight + ")" : "") : "Intermediate Item"}</em>`;

      if (d_node.isInitial && d_node.infoLinks && d_node.infoLinks.length > 0) {
        htmlContent += "<br/><br/><strong>More Info:</strong><ul>";
        d_node.infoLinks.forEach((link) => {
          htmlContent += `<li><a href="${link.url}" target="_blank" rel="noopener noreferrer">${link.label}</a></li>`;
        });
        htmlContent += "</ul>";
      }

      tooltip
        .html(htmlContent)
        .style("left", event.pageX + 15 + "px")
        .style("top", event.pageY - 28 + "px");
      // --- END: RESTORED TOOLTIP CONTENT AND POSITIONING ---

      linkElements
        .style("stroke-opacity", l => ((l.source as GraphNode).id === d_node.id || (l.target as GraphNode).id === d_node.id) ? 1 : 0.1)
        .style("stroke", l => ((l.source as GraphNode).id === d_node.id || (l.target as GraphNode).id === d_node.id) ? "#ff5722" : "#999");

      nodeElements.style("opacity", n =>
        n.id === d_node.id || links.some(link => ((link.source as GraphNode).id === d_node.id && (link.target as GraphNode).id === n.id) || ((link.target as GraphNode).id === d_node.id && (link.source as GraphNode).id === n.id)) ? 1 : 0.1
      );
      nodeLabelElements.style("opacity", n =>
        n.id === d_node.id || links.some(link => ((link.source as GraphNode).id === d_node.id && (link.target as GraphNode).id === n.id) || ((link.target as GraphNode).id === d_node.id && (link.source as GraphNode).id === n.id)) ? 1 : 0.1
      );
      
      linkLabelElements.style("opacity", l => {
        if ((l.source as GraphNode).id === d_node.id || (l.target as GraphNode).id === d_node.id) return 1.0;
        return l.isIndirectPart ? 0.2 : 0.3; 
      });
    })
    .on("mouseout", () => {
      tooltip.transition().duration(500).style("opacity", 0);
      linkElements
        .style("stroke-opacity", d => d.isIndirectPart ? 0.3 : 0.6)
        .style("stroke", "#999");
      nodeElements.style("opacity", d => d.isInitial ? 1.0 : 0.6);
      nodeLabelElements.style("opacity", d => d.isInitial ? 1.0 : 0.6);
      linkLabelElements.style("opacity", d => d.isIndirectPart ? 0.5 : 1.0);
    })
    .on("click", (event, d_node) => {
      window.open(`https://www.wikidata.org/wiki/${d_node.id}`, "_blank");
    });

  simulation.on("tick", () => {
    linkElements
      .attr("x1", (d) => (d.source as GraphNode).x!)
      .attr("y1", (d) => (d.source as GraphNode).y!)
      .attr("x2", (d) => (d.target as GraphNode).x!)
      .attr("y2", (d) => (d.target as GraphNode).y!);
    nodeElements.attr("transform", (d) => `translate(${d.x},${d.y})`);
    nodeLabelElements.attr("x", (d) => d.x! + d.radius + 4).attr("y", (d) => d.y! + 4); // Position relative to node
    linkLabelElements
      .attr("x", (d) => ((d.source as GraphNode).x! + (d.target as GraphNode).x!) / 2)
      .attr("y", (d) => ((d.source as GraphNode).y! + (d.target as GraphNode).y!) / 2);
  });

  const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.1, 10])
    .on("zoom", (event) => {
      container.attr("transform", event.transform);
    });
  svg.call(zoomBehavior);

  simulation.on("end", () => {
    if (nodes.length === 0) return;

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    nodes.forEach(node => {
      const r = node.radius;
      if (node.x! - r < minX) minX = node.x! - r;
      if (node.x! + r > maxX) maxX = node.x! + r;
      if (node.y! - r < minY) minY = node.y! - r;
      if (node.y! + r > maxY) maxY = node.y! + r;
    });

    const PADDING = 50;
    const graphContentWidth = maxX - minX;
    const graphContentHeight = maxY - minY;

    const effectiveGraphWidth = graphContentWidth <= 0 ? (2 * PADDING) : graphContentWidth;
    const effectiveGraphHeight = graphContentHeight <= 0 ? (2 * PADDING) : graphContentHeight;
    
    if (effectiveGraphWidth <=0 || effectiveGraphHeight <=0) {
        svg.call(zoomBehavior.transform, d3.zoomIdentity.translate(width / 2, height / 2).scale(1));
        return;
    }

    let scaleX = (width - 2 * PADDING) / effectiveGraphWidth;
    let scaleY = (height - 2 * PADDING) / effectiveGraphHeight;
    let scale = Math.min(scaleX, scaleY);
    
    scale = Math.min(scale, 1.5); 
    scale = Math.max(scale, 0.1);


    const translateX = (width / 2) - (minX + graphContentWidth / 2) * scale;
    const translateY = (height / 2) - (minY + graphContentHeight / 2) * scale;
    
    const transform = d3.zoomIdentity.translate(translateX, translateY).scale(scale);
    svg.call(zoomBehavior.transform, transform);
  });
}

// The drag function remains the same:
// function drag(simulation: d3.Simulation<GraphNode, undefined>) { ... }
// --- D3 Drag Handler (same as before) ---
function drag(simulation: d3.Simulation<GraphNode, undefined>) {
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

