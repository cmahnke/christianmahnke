import { Manifest } from "manifesto.js";
import { getAnnotationPages } from "./manifesto-util.ts";

async function loadManifest(url: URL): Manifest | undefined {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Response status: ${response.status}`);
  }
  const json = await response.json();

  return new Manifest(json);
}

async function loadInfoJson(id) {
  const url = id + "/info.json";
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Response status: ${response.status}`);
  }
  return await response.json();
}

function getCanvas(manifest: Manifest, page = 0) {
  const sequence = manifest.getSequenceByIndex(page);
  const canvas = sequence.getCanvasByIndex(0);
  return canvas;
}

function getCanvases(manifest: Manifest, page = 0) {
  const sequence = manifest.getSequenceByIndex(page);
  return sequence.getCanvases();
}

function getServiceId(manifest: Manifest, page = 0) {
  const canvas = getCanvas(manifest, page);
  const content = canvas.getContent()[0];
  const body = content.getBody()[0];
  const service = body.getServices()[0];
  return service.id;
}

function getAnnotations(manifest: Manifest, page = 0) {
  const canvases = getCanvases(manifest, page);
  const pages = getAnnotationPages(canvases);

  const annotations = pages[0].getItems();
  const updatedAnnotations = [];
  for (const annotation of annotations) {
    // Update annotation
    let target = annotation.getTarget();
    if (target === undefined) {
      continue;
    }
    if (typeof target === "string" && target.match(/#xywh/gi)) {
      const xywhPattern = /#xywh=(\d+,\d+,\d+,\d+)$/i;
      const match = target.match(xywhPattern);
      target = {
        source: target.replace(xywhPattern, ""),
        selector: {
          type: "FragmentSelector",
          conformsTo: "http://www.w3.org/TR/media-frags/",
          value: `xywh=pixel:${match[1]}`
        }
      };
      annotation.__jsonld.target = target;
    }
    updatedAnnotations.push(annotation);
  }
  return updatedAnnotations;
}

export { loadManifest, loadInfoJson, getCanvas, getServiceId, getAnnotations };
