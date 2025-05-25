import * as d3 from "d3";

// --- Configuration ---
const WIKIDATA_SPARQL_ENDPOINT = "https://query.wikidata.org/sparql";
// const LANGUAGE = "en"; // REMOVED - now a parameter
const DEFAULT_INITIAL_RADIUS = 15; // Fallback if weight is not provided for an initial item
const INTERMEDIATE_ITEM_RADIUS = 8;
const MAX_RESULTS_DIRECT = 100;
const MAX_RESULTS_INDIRECT = 50;

// --- Interfaces for Data Structure ---
interface InfoLink {
  label: string;
  url: string;
}

interface InitialItemInput {
  id: string; // Wikidata QID
  weight: number; // For initial node size
  infoLinks?: InfoLink[];
}

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
}

interface GraphNode extends d3.SimulationNodeDatum, WikidataItemBase {
  radius: number; // Calculated radius for D3
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
  propertyLabel: string;
  propertyId: string;
}

// --- Main Visualization Function (Single Entry Point) ---
async function visualizeRelations(language: string, initialItemsData: InitialItemInput[]): Promise<void> {
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

  try {
    const { allItems, allRelations } = await fetchData(language, initialItemsData);
    renderGraph(allItems, allRelations); // Language not directly needed by renderGraph, but kept for consistency if styles change
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

  // Fetch in chunks
  const chunkSize = 50;
  for (let i = 0; i < qidsToFetch.length; i += chunkSize) {
    const chunkQids = qidsToFetch.slice(i, i + chunkSize);
    const valuesClause = chunkQids.map((id) => `wd:${id.trim()}`).join(" ");
    const query = `
            SELECT ?item ?itemLabel WHERE {
                VALUES ?item { ${valuesClause} }
                SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],${language}". }
            }
        `;
    try {
      const json = await executeSparqlQuery(query);
      json.results.bindings.forEach((binding: any) => {
        const qid = binding.item.value.split("/").pop();
        const inputData = itemInputs.find((inp) => inp.qid === qid); // Find corresponding input data
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
        // Add fallbacks if API call failed for this chunk
        if (!itemMap.has(qid)) {
          const inputData = itemInputs.find((inp) => inp.qid === qid);
          if (inputData) {
            itemMap.set(qid, {
              id: qid,
              label: qid, // Fallback label
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
  // Ensure all input items have an entry, even if label fetching failed
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
  const discoveredQIds = new Set<string>(initialItemsData.map((item) => item.id.trim()));

  const uniqueInitialQIds = Array.from(discoveredQIds);

  // 2. Fetch direct relations BETWEEN initial items
  if (uniqueInitialQIds.length >= 1) {
    const initialValuesClause = uniqueInitialQIds.map((id) => `wd:${id}`).join(" ");
    const directRelationsQuery = `
            SELECT ?item1 ?prop ?propLabel ?item2 WHERE {
                VALUES ?item1 { ${initialValuesClause} }
                VALUES ?item2 { ${initialValuesClause} }
                FILTER(?item1 != ?item2)
                ?item1 ?p ?item2 .
                ?property wikibase:directClaim ?p .
                BIND(REPLACE(STR(?p), STR(wdt:), "") AS ?prop)
                SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],${language}". }
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
          }
        });
        // No need to add to discoveredQIds here as they are already initial items
      });
    } catch (error) {
      console.error("Error fetching direct relations:", error);
    }
  }

  // 3. Fetch intermediate items and their relations to initial items
  if (uniqueInitialQIds.length >= 2) {
    const initialValuesClause = uniqueInitialQIds.map((id) => `wd:${id}`).join(" ");
    const indirectRelationsQuery = `
            SELECT ?initial1 ?prop1 ?prop1Label ?intermediate ?intermediateLabel ?prop2 ?prop2Label ?initial2 WHERE {
                VALUES ?initial1 { ${initialValuesClause} }
                VALUES ?initial2 { ${initialValuesClause} }
                FILTER(?initial1 != ?initial2)

                ?initial1 ?p1 ?intermediate .
                ?intermediate ?p2 ?initial2 .

                FILTER NOT EXISTS { VALUES ?initialItemInList { ${initialValuesClause} } . FILTER (?intermediate = ?initialItemInList) }

                ?property1 wikibase:directClaim ?p1 . BIND(REPLACE(STR(?p1), STR(wdt:), "") AS ?prop1_id)
                ?property2 wikibase:directClaim ?p2 . BIND(REPLACE(STR(?p2), STR(wdt:), "") AS ?prop2_id)

                SERVICE wikibase:label {
                    bd:serviceParam wikibase:language "[AUTO_LANGUAGE],${language}".
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
          property: { id: binding.prop1_id.value, label: binding.prop1Label?.value || binding.prop1_id.value }
        });
        allRelations.push({
          source: intermediateQid,
          target: initial2Qid,
          property: { id: binding.prop2_id.value, label: binding.prop2Label?.value || binding.prop2_id.value }
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

  // Final check for any QIDs in relations that are not in itemMasterMap
  const allQidsInRelations = new Set<string>();
  allRelations.forEach((rel) => {
    allQidsInRelations.add(rel.source);
    allQidsInRelations.add(rel.target);
  });
  const missingQidInputs = Array.from(allQidsInRelations)
    .filter((qid) => !itemMasterMap.has(qid))
    .map((qid) => ({ qid, isInitial: false })); // Assume non-initial if not explicitly defined

  if (missingQidInputs.length > 0) {
    console.warn(
      "Fetching details for items found only in relations:",
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
    ...item,
    radius: item.isInitial ? item.weight || DEFAULT_INITIAL_RADIUS : INTERMEDIATE_ITEM_RADIUS
  }));

  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  const links: GraphLink[] = relations
    .map((rel) => ({
      source: nodeMap.get(rel.source)!,
      target: nodeMap.get(rel.target)!,
      propertyLabel: rel.property.label,
      propertyId: rel.property.id
    }))
    .filter((link) => link.source && link.target);

  const simulation = d3
    .forceSimulation<GraphNode>(nodes)
    .force(
      "link",
      d3
        .forceLink<GraphNode, GraphLink>(links)
        .distance((d) => ((d.source as GraphNode).isInitial && (d.target as GraphNode).isInitial ? 180 : 120))
        .strength(0.7)
    )
    .force("charge", d3.forceManyBody().strength(-400)) // Increased repulsion for clarity with weights
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force(
      "collision",
      d3
        .forceCollide<GraphNode>()
        .radius((d) => d.radius + 8)
        .strength(0.8)
    );

  const linkGroup = svg.append("g").attr("class", "links");
  const nodeGroup = svg.append("g").attr("class", "nodes");
  const labelGroup = svg.append("g").attr("class", "labels");
  const linkLabelGroup = svg.append("g").attr("class", "link-labels");

  const linkElements = linkGroup.selectAll("line").data(links).enter().append("line").attr("class", "link").attr("stroke-width", 1.5);

  const linkLabelElements = linkLabelGroup
    .selectAll("text")
    .data(links)
    .enter()
    .append("text")
    .attr("class", "link-label")
    .text((d) => d.propertyLabel);

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
    .attr("stroke-width", 1.5);

  const nodeLabelElements = labelGroup
    .selectAll("text")
    .data(nodes)
    .enter()
    .append("text")
    .attr("class", "node-label")
    .text((d) => d.label)
    .attr("dx", (d) => d.radius + 4)
    .attr("dy", ".35em");

  nodeElements
    .on("mouseover", (event, d_node) => {
      tooltip.transition().duration(200).style("opacity", 0.95);
      let htmlContent = `<strong>${d_node.label}</strong> (Q${d_node.id})<br/>`;
      htmlContent += `<em>${d_node.isInitial ? "Initial Item (Weight: " + d_node.weight + ")" : "Intermediate Item"}</em>`;

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

      linkElements
        .style("stroke-opacity", (l) => (l.source === d_node || l.target === d_node ? 1 : 0.1))
        .style("stroke", (l) => (l.source === d_node || l.target === d_node ? "#ff5722" : "#999"));
      nodeElements.style("opacity", (n) =>
        links.some((l) => (l.source === d_node && l.target === n) || (l.target === d_node && l.source === n) || n === d_node) ? 1 : 0.3
      );
      nodeLabelElements.style("opacity", (n) =>
        links.some((l) => (l.source === d_node && l.target === n) || (l.target === d_node && l.source === n) || n === d_node) ? 1 : 0.3
      );
    })
    .on("mouseout", () => {
      tooltip.transition().duration(500).style("opacity", 0);
      linkElements.style("stroke-opacity", 0.6).style("stroke", "#999");
      nodeElements.style("opacity", 1);
      nodeLabelElements.style("opacity", 1);
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
    nodeLabelElements.attr("x", (d) => d.x! + d.radius + 4).attr("y", (d) => d.y! + 4);
    linkLabelElements
      .attr("x", (d) => ((d.source as GraphNode).x! + (d.target as GraphNode).x!) / 2)
      .attr("y", (d) => ((d.source as GraphNode).y! + (d.target as GraphNode).y!) / 2);
  });
}

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

// --- Example Usage ---
const exampleLanguage = "en";
const exampleInitialItems: InitialItemInput[] = [
  {
    id: "Q937",
    weight: 25, // Albert Einstein, larger weight
    infoLinks: [{ label: "Nobel Prize Bio", url: "https://www.nobelprize.org/prizes/physics/1921/einstein/biographical/" }]
  },
  {
    id: "Q76330",
    weight: 15, // Mileva Marić
    infoLinks: [
      { label: "ETH Zurich Archive", url: "https://www.library.ethz.ch/en/ms/autographen альберта-эйнштейна-и-милевы-марик.html" }
    ] // Example link
  },
  {
    id: "Q9095",
    weight: 20, // Max Planck
    infoLinks: [
      { label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Max_Planck" },
      { label: "Planck Society", url: "https://www.mpg.de/en" }
    ]
  },
  { id: "Q123990", weight: 12 } // Hans Albert Einstein (no custom links for this example)
];

// --- HTML Interaction Setup (assumes you have these elements in your index.html) ---
const langSelectElement = document.getElementById("language-select") as HTMLSelectElement;
const qidInputElement = document.getElementById("wikidata-ids-input") as HTMLTextAreaElement;
const submitButton = document.getElementById("wikidata-submit-button");

function parseInputAndVisualize() {
  const lang = langSelectElement ? langSelectElement.value : "en";
  const inputText = qidInputElement ? qidInputElement.value : "";
  /* Expecting input format: QID,weight[,link_label|link_url[,link_label2|link_url2,...]] per line
       Example line: Q937,25,Nobel Bio|https://nobelprize.org,ETH Archive|https://ethz.ch
    */
  const lines = inputText.split("\n").filter((line) => line.trim() !== "");
  const items: InitialItemInput[] = [];
  lines.forEach((line) => {
    const parts = line.split(",").map((p) => p.trim());
    if (parts.length >= 2 && parts[0].match(/^Q\d+$/i) && !isNaN(parseInt(parts[1]))) {
      const qid = parts[0].toUpperCase();
      const weight = parseInt(parts[1]);
      const infoLinks: InfoLink[] = [];
      if (parts.length > 2) {
        for (let i = 2; i < parts.length; i++) {
          const linkParts = parts[i].split("|");
          if (linkParts.length === 2) {
            infoLinks.push({ label: linkParts[0], url: linkParts[1] });
          }
        }
      }
      items.push({ id: qid, weight: weight, infoLinks: infoLinks.length > 0 ? infoLinks : undefined });
    } else {
      console.warn(`Skipping malformed line: ${line}`);
    }
  });

  if (items.length > 0) {
    visualizeRelations(lang, items);
  } else if (inputText.trim() !== "") {
    // If input was not empty but parsing failed
    alert("No valid items parsed. Please check input format: QID,weight[,label1|url1,...] per line.");
    d3.select("svg").selectAll("*").remove(); // Clear SVG
    document.getElementById("item-list-display")!.textContent = "Invalid input";
  } else {
    // If input was genuinely empty (e.g. after clearing)
    d3.select("svg").selectAll("*").remove();
    document.getElementById("item-list-display")!.textContent = "None";
  }
}

if (submitButton) {
  submitButton.onclick = parseInputAndVisualize;
  // Optionally load default example if input is empty on page load
  if (qidInputElement && !qidInputElement.value.trim()) {
    // Pre-fill text area with example format
    qidInputElement.value = exampleInitialItems
      .map((item) => `${item.id},${item.weight}` + (item.infoLinks ? item.infoLinks.map((l) => `,${l.label}|${l.url}`).join("") : ""))
      .join("\n");
    visualizeRelations(langSelectElement ? langSelectElement.value : exampleLanguage, exampleInitialItems);
  } else if (qidInputElement && qidInputElement.value.trim()) {
    // If there's pre-existing text (e.g. from browser cache), parse it
    parseInputAndVisualize();
  }
} else {
  // Fallback if no input elements for dynamic visualization
  visualizeRelations(exampleLanguage, exampleInitialItems);
}

document.addEventListener("DOMContentLoaded", () => {
  //  fetch('/meta/tags/index.json')
  //    .then((response) => response.json())
  //    .then((data) => {
  //visualizeRelations(exampleItemIds);
});
// You can also make it interactive, e.g., by taking input from the user
// const inputElement = document.getElementById('wikidata-ids') as HTMLInputElement;
// const submitButton = document.getElementById('submit-button');
//
// submitButton.onclick = () => {
//     const ids = inputElement.value.split(',').map(id => id.trim()).filter(id => id);
//     visualizeRelations(ids);
// };
