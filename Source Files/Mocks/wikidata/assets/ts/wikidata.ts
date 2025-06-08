import * as d3 from "d3";
import type { InfoLink, InitialItemInput } from "./transformations";

// --- Configuration Constants (defaults) ---
const DEFAULT_INITIAL_RADIUS = 15;
const DEFAULT_INTERMEDIATE_ITEM_RADIUS = 8; // Still used if nonInitialItemColor is not specified for radius
const DEFAULT_NON_INITIAL_ITEM_COLOR = "#D3D3D3"; // Light Grey for non-initial items
const DEFAULT_LINK_DISTANCE_II = 100; // Adjusted from previous
const DEFAULT_LINK_DISTANCE_IX = 70;  // Adjusted from previous
const DEFAULT_COLLISION_PADDING = 1;  // Adjusted from previous

const WIKIDATA_SPARQL_ENDPOINT = "https://query.wikidata.org/sparql";
const MAX_RESULTS_DIRECT = 100;
const MAX_RESULTS_INDIRECT = 50;
const MAX_P31_P279_RESULTS_PER_CHUNK_LEVEL = 10; // Limit for P31/P279 results per chunk per level
const P31_P279_CHUNK_SIZE = 30; // Number of source items for P31/P279 query in one go


export interface VisualizationRenderOptions {
  intermediateItemRadius: number; // Retained for now, but color is primary for non-initial
  nonInitialItemColor: string;    // New: Color for all non-initial items
  linkDistanceII: number;
  linkDistanceIX: number;
  collisionPadding: number;
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
  language: string,
  initialItemsData: InitialItemInput[],
  options?: Partial<VisualizationRenderOptions>
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
   const renderOptions: VisualizationRenderOptions = {
    intermediateItemRadius: options?.intermediateItemRadius ?? DEFAULT_INTERMEDIATE_ITEM_RADIUS,
    nonInitialItemColor: options?.nonInitialItemColor ?? DEFAULT_NON_INITIAL_ITEM_COLOR,
    linkDistanceII: options?.linkDistanceII ?? DEFAULT_LINK_DISTANCE_II,
    linkDistanceIX: options?.linkDistanceIX ?? DEFAULT_LINK_DISTANCE_IX,
    collisionPadding: options?.collisionPadding ?? DEFAULT_COLLISION_PADDING,

  };

  try {
    const { allItems, allRelations } = await fetchData(language, initialItemsData);

    // NEW: Prune the graph to remove non-essential nodes before rendering
    const { prunedItems, prunedRelations } = pruneGraph(allItems, allRelations);

    // Render the pruned graph
    renderGraph(prunedItems, prunedRelations, renderOptions);
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
    const errorMessage = `Wikidata SPARQL query failed with status ${response.status} ${response.statusText}.\n` +
                         `Query:\n${query}\n` +
                         `Response body:\n${errorBody}`;
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

/*
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
*/
async function fetchData(
  language: string,
  initialItemsData: InitialItemInput[]
): Promise<{ allItems: WikidataItem[]; allRelations: WikidataRelation[] }> {
  const initialItemInputsForFetch = initialItemsData.map((item) => ({
    qid: item.id.trim(),
    isInitial: true,
    weight: item.weight,
    infoLinks: item.infoLinks,
  }));
  const itemMasterMap = await fetchItemDetails(language, initialItemInputsForFetch);
  const allRelations: WikidataRelation[] = [];
  const uniqueInitialQIds = Array.from(new Set(initialItemsData.map(item => item.id.trim())));

  // 1. Fetch direct relations BETWEEN initial items (Code from your previous version)
  if (uniqueInitialQIds.length >= 1) {
    const initialValuesClause = uniqueInitialQIds.map((id) => `wd:${id}`).join(" ");
    const directRelationsQuery = `
            SELECT ?item1 ?prop ?propLabel ?item2 WHERE {
                VALUES ?item1 { ${initialValuesClause} }
                VALUES ?item2 { ${initialValuesClause} }
                FILTER(?item1 != ?item2)
                ?item1 ?p ?item2 .
                ?property_entity wikibase:directClaim ?p .
                BIND(REPLACE(STR(?p), STR(wdt:), "") AS ?prop)
                SERVICE wikibase:label { bd:serviceParam wikibase:language "${language},en". ?property_entity rdfs:label ?propLabel . }
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
            label: binding.propLabel?.value || binding.prop.value,
          },
          isIndirectPart: false,
        });
      });
    } catch (error) {
      console.error("Error fetching direct relations:", error);
    }
  }

  // 2. Fetch intermediate items and their relations (Code from your previous version)
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
                    bd:serviceParam wikibase:language "${language},en".
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
          isIndirectPart: true,
        });
        allRelations.push({
          source: intermediateQid,
          target: initial2Qid,
          property: { id: binding.prop2_id.value, label: binding.prop2Label?.value || binding.prop2_id.value },
          isIndirectPart: true,
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

  // 3. Fetch P31/P279 relations - Level 1 & 2
  const processedForP31P279 = new Set<string>(); // Track QIDs processed for P31/P279 expansion

  // Level 1: From all items currently in itemMasterMap (initial + path intermediates)
  let qidsForLevel1 = Array.from(itemMasterMap.keys());
  const level1Targets = await fetchAndProcessP31P279Level(
    qidsForLevel1, language, itemMasterMap, allRelations, processedForP31P279, 3, "Level 1"
  );

  // Level 2: From the new targets found in Level 1
  if (level1Targets.size > 0) {
    await fetchAndProcessP31P279Level(
      Array.from(level1Targets), language, itemMasterMap, allRelations, processedForP31P279, 4, "Level 2"
    );
  }
 /*
  const itemsToQueryForP31P279 = Array.from(itemMasterMap.keys());
  const MAX_P31_P279_RESULTS_PER_CHUNK = 20; // Limit results per chunk query for these types
  const P31_P279_CHUNK_SIZE = 30; // Number of source items to query for in one go

  if (itemsToQueryForP31P279.length > 0) {
    console.log(`Fetching P31/P279 for ${itemsToQueryForP31P279.length} items.`);
    for (let i = 0; i < itemsToQueryForP31P279.length; i += P31_P279_CHUNK_SIZE) {
      const chunkOfSourceQids = itemsToQueryForP31P279.slice(i, i + P31_P279_CHUNK_SIZE);
      const valuesClauseP31P279 = chunkOfSourceQids.map(id => `wd:${id.trim()}`).join(" ");

      const p31p279Query = `
        SELECT ?sourceItem ?property_entity ?propertyID ?propertyLabel ?targetItem ?targetItemLabel WHERE {
          VALUES ?sourceItem { ${valuesClauseP31P279} }
          VALUES ?property_entity { wd:P31 wd:P279 } # Wikidata entities for properties P31, P279

          ?sourceItem ?p_wdt ?targetItem .         # ?p_wdt is the statement property like wdt:P31
          ?property_entity wikibase:directClaim ?p_wdt . # Connects wd:P31 (property_entity) to wdt:P31 (p_wdt)

          # Ensure targetItem is a Wikidata item (not a literal, blank node, or external URI)
          FILTER(ISIRI(?targetItem) && STRSTARTS(STR(?targetItem), "http://www.wikidata.org/entity/Q"))


          BIND(REPLACE(STR(?property_entity), STR(wd:), "") AS ?propertyID) # Extracts "P31", "P279"

          SERVICE wikibase:label {
            bd:serviceParam wikibase:language "${language},en".
            ?property_entity rdfs:label ?propertyLabel .
            ?targetItem rdfs:label ?targetItemLabel .
          }
        } LIMIT ${MAX_P31_P279_RESULTS_PER_CHUNK}
      `;

      try {
        const p31p279Json = await executeSparqlQuery(p31p279Query);
        p31p279Json.results.bindings.forEach((binding: any) => {
          const sourceQid = binding.sourceItem.value.split("/").pop();
          const targetQid = binding.targetItem.value.split("/").pop();
          const propertyId = binding.propertyID.value; 
          const propertyLabel = binding.propertyLabel?.value || propertyId;
          const targetLabel = binding.targetItemLabel?.value || targetQid;

          // Avoid adding relation if targetQid is somehow empty or invalid (due to robust filtering)
          if (!targetQid || targetQid.length === 0) return;


          allRelations.push({
            source: sourceQid,
            target: targetQid,
            property: { id: propertyId, label: propertyLabel },
            isIndirectPart: true, // Style these as less prominent (e.g., lighter opacity)
          });

          if (!itemMasterMap.has(targetQid)) {
            itemMasterMap.set(targetQid, {
              id: targetQid,
              label: targetLabel,
              isInitial: false,
              group: 3, // Assign to a new group for P31/P279 targets
            });
          }
        });
      } catch (error) {
        console.error(`Error fetching P31/P279 relations for chunk starting with ${chunkOfSourceQids[0]}:`, error);
      }
    }
  }
  */
  // 4. Final check for any QIDs in relations that are not in itemMasterMap
  const allQidsInRelations = new Set<string>();
  allRelations.forEach((rel) => {
    allQidsInRelations.add(rel.source);
    allQidsInRelations.add(rel.target);
  });
  const missingQidInputs = Array.from(allQidsInRelations)
    .filter((qid) => qid && qid.trim().length > 0 && !itemMasterMap.has(qid)) // Ensure qid is valid before processing
    .map((qid) => ({ qid: qid.trim(), isInitial: false }));

  if (missingQidInputs.length > 0) {
    console.warn(
      `Fetching details for ${missingQidInputs.length} items found only in relations (assumed intermediate or contextual):`,
      missingQidInputs.map((i) => i.qid)
    );
    const missingDetails = await fetchItemDetails(language, missingQidInputs);
    missingDetails.forEach((item, qid) => {
        // Only add if truly missing; respect existing group if somehow set (e.g. group 3 for P31/P279)
        if (!itemMasterMap.has(qid)) {
            itemMasterMap.set(qid, item); // fetchItemDetails assigns group 1 or 2 by default for these
        } else {
            // If it was already there (e.g. a P31/P279 target set to group 3), ensure label is updated if better one found
            const existingItem = itemMasterMap.get(qid)!;
            if (item.label !== qid && existingItem.label === qid) { // Update label if current is just QID
                existingItem.label = item.label;
            }
        }
    });
  }

  const allItems = Array.from(itemMasterMap.values());
  return { allItems, allRelations };
}

// --- D3.js Rendering ---
function renderGraph(
  items: WikidataItem[],
  relations: WikidataRelation[],
  vizOptions: VisualizationRenderOptions // Receives resolved options
): void {
  const svg = d3.select("svg");
  const width = +svg.attr("width")!;
  const height = +svg.attr("height")!;
  const tooltip = d3.select("#tooltip");

  svg.selectAll("*").remove();
  const container = svg.append("g").attr("class", "graph-container");

  if (items.length === 0) { /* ... no change ... */ return; }

  const nodes: GraphNode[] = items.map((item) => ({
    ...item,
    id: item.id,
    label: item.label,
    isInitial: item.isInitial, // Crucial for styling and ordering
    weight: item.weight,
    infoLinks: item.infoLinks,
    group: item.group, // group 1 for initial, 2 for path intermediate, 3 for P31/P279 L1, 4 for P31/P279 L2
    radius: item.isInitial ? (item.weight || DEFAULT_INITIAL_RADIUS) : vizOptions.intermediateItemRadius,
    x: undefined, y: undefined, vx: undefined, vy: undefined, fx: null, fy: null,
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

 const simulation = d3.forceSimulation<GraphNode>(nodes) /* ... force setup using vizOptions ... */;
  // Use vizOptions.linkDistanceII, vizOptions.linkDistanceIX, vizOptions.collisionPadding

  const linkGroup = container.append("g").attr("class", "links");
  const nodeGroup = container.append("g").attr("class", "nodes"); // Parent for all node Gs
  const labelGroup = container.append("g").attr("class", "labels"); // Parent for all labels
 
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
    .selectAll("g.node") // Select all nodes (will be empty on first pass)
    .data(nodes, (d: GraphNode) => d.id) // Use a key function
    .enter()
    .append("g")
    .attr("class", "node") // Generic class for all nodes
    .call(drag(simulation) as any);

  const colorScale = d3.scaleOrdinal(d3.schemeCategory10); // For initial items primarily now

  nodeElements
    .append("circle")
    .attr("r", (d) => d.radius)
    .attr("fill", (d) => {
      if (!d.isInitial) {
        return vizOptions.nonInitialItemColor; // Use configured color for ALL non-initial items
      }
      return colorScale(d.group?.toString() ?? d.id); // Initial items use color scale
    })
    .attr("stroke", "#fff")
    .attr("stroke-width", 1.5)
    .style("opacity", d => d.isInitial ? 1.0 : 0.6); // Base opacity

  // Create all node labels
  const nodeLabelElements = labelGroup
    .selectAll("text.node-label")
    .data(nodes, (d: GraphNode) => d.id) // Use a key function
    .enter()
    .append("text")
    .attr("class", "node-label")
    .text((d) => d.label)
    .attr("dx", (d) => d.radius + 4)
    .attr("dy", ".35em")
    .style("opacity", d => d.isInitial ? 1.0 : 0.6); // Base opacity

  // Sort DOM elements for Z-Ordering: initial items on top
  // This reorders the <g> elements within nodeGroup and <text> within labelGroup
  nodeElements.sort((a, b) => (a.isInitial ? 1 : 0) - (b.isInitial ? 1 : 0));
  nodeLabelElements.sort((a, b) => (a.isInitial ? 1 : 0) - (b.isInitial ? 1 : 0));

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
    nodeLabelElements.attr("x", (d) => d.x! + d.radius + 4).attr("y", (d) => d.y! + 4);
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

async function fetchAndProcessP31P279Level(
  sourceQidsBatch: string[],
  language: string,
  itemMasterMap: Map<string, WikidataItem>,
  allRelations: WikidataRelation[],
  processedForP31P279: Set<string>,
  targetItemGroup: number,
  levelName: string // For logging (e.g., "Level 1", "Level 2")
): Promise<Set<string>> {
  const newTargetsFoundThisLevel = new Set<string>();
  const qidsToQueryThisIteration = sourceQidsBatch.filter(qid => !processedForP31P279.has(qid));

  if (qidsToQueryThisIteration.length === 0) {
    return newTargetsFoundThisLevel;
  }

  console.log(`Fetching P31/P279 ${levelName} for ${qidsToQueryThisIteration.length} items.`);

  for (let i = 0; i < qidsToQueryThisIteration.length; i += P31_P279_CHUNK_SIZE) {
    const chunkOfCurrentLevelQids = qidsToQueryThisIteration.slice(i, i + P31_P279_CHUNK_SIZE);
    chunkOfCurrentLevelQids.forEach(qid => processedForP31P279.add(qid)); // Mark as processed for P31/P279 expansion

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
            group: targetItemGroup, // Assign to the specified group for this level's targets
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

/**
 * Finds all connected components in a subgraph using BFS.
 * @param nodeIds The IDs of the nodes in the subgraph to consider.
 * @param adjacency The adjacency list for the subgraph.
 * @returns An array of Sets, where each Set contains the node IDs of a component.
 */
function findConnectedComponents(
  nodeIds: string[],
  adjacency: Map<string, string[]>
): Set<string>[] {
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

/**
 * Prunes non-initial nodes that do not help connect at least two initial nodes.
 * @param items The full list of items from fetchData.
 * @param relations The full list of relations from fetchData.
 * @returns An object containing the pruned lists of items and relations.
 */
function pruneGraph(
  items: WikidataItem[],
  relations: WikidataRelation[]
): { prunedItems: WikidataItem[]; prunedRelations: WikidataRelation[] } {

  if (items.length === 0) {
    return { prunedItems: [], prunedRelations: [] };
  }

  const initialItems = items.filter(item => item.isInitial);
  const initialItemIds = new Set(initialItems.map(item => item.id));
  const nonInitialItems = items.filter(item => !item.isInitial);
  const nonInitialItemIds = nonInitialItems.map(item => item.id);

  if (initialItemIds.size < 2) {
    const prunedRelations = relations.filter(rel => initialItemIds.has(rel.source) && initialItemIds.has(rel.target));
    console.log(`Pruning all non-initial nodes as there are fewer than 2 initial nodes.`);
    return { prunedItems: initialItems, prunedRelations };
  }

  // Build adjacency list for the full graph (all nodes)
  const fullAdjacency = new Map<string, string[]>();
  items.forEach(item => fullAdjacency.set(item.id, []));
  relations.forEach(rel => {
    fullAdjacency.get(rel.source)!.push(rel.target);
    fullAdjacency.get(rel.target)!.push(rel.source);
  });

  // Build adjacency list for the subgraph of only non-initial ("gray") nodes
  const graySubgraphAdjacency = new Map<string, string[]>();
  nonInitialItems.forEach(item => graySubgraphAdjacency.set(item.id, []));
  relations.forEach(rel => {
    if (graySubgraphAdjacency.has(rel.source) && graySubgraphAdjacency.has(rel.target)) {
      graySubgraphAdjacency.get(rel.source)!.push(rel.target);
      graySubgraphAdjacency.get(rel.target)!.push(rel.source);
    }
  });

  // Find connected components within the gray subgraph
  const grayComponents = findConnectedComponents(nonInitialItemIds, graySubgraphAdjacency);

  const nodesToKeep = new Set<string>(initialItemIds);

  grayComponents.forEach(component => {
    const attachmentPoints = new Set<string>();
    // For each gray node in the component, check its neighbors in the full graph
    component.forEach(grayNodeId => {
      const neighborsInFullGraph = fullAdjacency.get(grayNodeId) || [];
      neighborsInFullGraph.forEach(neighborId => {
        // If a neighbor is an initial node, it's an "attachment point"
        if (initialItemIds.has(neighborId)) {
          attachmentPoints.add(neighborId);
        }
      });
    });

    // If the component attaches to two or more initial nodes, it's essential
    if (attachmentPoints.size >= 2) {
      component.forEach(grayNodeId => nodesToKeep.add(grayNodeId));
    }
  });

  console.log(`Pruning ${items.length - nodesToKeep.size} non-essential non-initial nodes.`);

  const prunedItems = items.filter(item => nodesToKeep.has(item.id));
  const prunedRelations = relations.filter(rel => nodesToKeep.has(rel.source) && nodesToKeep.has(rel.target));

  return { prunedItems, prunedRelations };
}