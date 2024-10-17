import { Canvas, Manifest, AnnotationPage, Annotation } from "manifesto.js";

async function loadManifest(url) {
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

function getCanvas(manifest, page = 0) {
  const sequence = manifest.getSequenceByIndex(page);
  const canvas = sequence.getCanvasByIndex(0);
  return canvas;
}

function getCanvases(manifest, page = 0) {
  const sequence = manifest.getSequenceByIndex(page);
  return sequence.getCanvases();
}

function getServiceId(manifest, page = 0) {
  const canvas = getCanvas(manifest, page);
  const content = canvas.getContent()[0];
  const body = content.getBody()[0];
  const service = body.getServices()[0];
  return service.id;
}

function getAnnotations(manifest, page = 0) {
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

// See https://github.com/IIIF-Commons/manifesto/issues/125


function getAnnotationPages(canvases, options) {
  const annotationPages = [];

  if (canvases.length) {
    canvases.forEach((canvas) => {
      // "getProperty" ejects and results in raw JSON
      // We need to instantiate each level with the appropriate constructor
      const rawAnnotationPages = canvas.getProperty("annotations") || [];

      annotationPages.push(
        ...rawAnnotationPages.map((rawAnnotationPage) => {
          const rawAnnotations = rawAnnotationPage.items;

          return new AnnotationPage(
            {
              ...rawAnnotationPage,
              items: rawAnnotations.map((rawAnnotation) => {
                return new Annotation(rawAnnotation, options);
              }),
              type: rawAnnotationPage.type
            },
            options
          );
        })
      );
      return [];
    });
  }
  return annotationPages;
}

export { loadManifest, loadInfoJson, getCanvas, getServiceId, getAnnotations, getAnnotationPages};
