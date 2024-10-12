import OpenSeadragon from "openseadragon";
import * as Annotorious from "@annotorious/openseadragon";
import { Manifest } from "manifesto.js";
import { loadManifest, getServiceId, loadInfoJson, getAnnotations } from "./loader.ts";

import "@annotorious/openseadragon/annotorious-openseadragon.css";

// CSS
//import "@annotorious/openseadragon/dist/annotorious-openseadragon.css";

function annotationsToJson(annotations: Annotation[]) {
  const jsonAnnotations = [];
  for (const annotation of annotations) {
    jsonAnnotations.push(annotation.__jsonld);
  }
  return jsonAnnotations;
}

function generateTouchAreaAnnotationsRLE(annotations: Annotation[]) {
  const updatedAnnotations = [];
  for (let annotation of annotations) {
    const target = annotation.getTarget();
    const body = annotation.__jsonld.body;
    if (body.type == "DataSet") {
      const value = body.value;
      const height = value.height;
      const width = value.width;
      const scale = value.meta.scale;
      const x = value.meta.x;
      const y = value.meta.y;
      const data = value.data;
      let touchW = Math.floor(1 * scale);
      const touchH = Math.floor(1 * scale);

      for (var i = 0; i < height; i++) {
        let last = data[i][0];
        let rle = [0];
        for (var j = 0; j < width; j++) {
          if (data[i][j] == last) {
            rle[rle.length - 1] = rle[rle.length - 1] + 1;
          } else {
            rle.push(1);
            last = data[i][j];
          }
        }
        let start = data[i][0];
        let pos = 0;
        for (var k = 0; k < rle.length; k++) {
          const touchState = start + (k % 2) - 1;
          const touchAnnotationId = annotation.id + `/touch/${i}/${k}`;
          const touchX = Math.ceil(1 * scale * pos + x);
          const touchY = Math.ceil(1 * scale * i + y);
          let touchW = Math.floor(1 * scale * rle[k]);
          pos += rle[k];
          const annoBody = {
            id: touchAnnotationId + "/body",
            type: "Boolean",
            value: !!touchState
          };
          const touchTarget = {
            source: target,
            selector: {
              type: "FragmentSelector",
              conformsTo: "http://www.w3.org/TR/media-frags/",
              value: `xywh=pixel:${touchX},${touchY},${touchW},${touchH}`
            }
          };
          const touchAnnotation = {
            id: touchAnnotationId,
            type: "Annotation",
            motivation: "tagging",
            body: annoBody,
            target: touchTarget
          };

          updatedAnnotations.push(touchAnnotation);
        }
      }
    } else {
      updatedAnnotations.push(annotation.__jsonld);
    }
  }
  return updatedAnnotations;
}

function generateTouchAreaAnnotations(annotations: Annotation[]) {
  const updatedAnnotations = [];
  for (let annotation of annotations) {
    const target = annotation.getTarget();
    const body = annotation.__jsonld.body;
    if (body.type == "DataSet") {
      const value = body.value;
      const height = value.height;
      const width = value.width;
      const scale = value.meta.scale;
      const x = value.meta.x;
      const y = value.meta.y;
      const data = value.data;
      const touchW = Math.floor(1 * scale);
      const touchH = Math.floor(1 * scale);

      for (var i = 0; i < height; i++) {
        for (var j = 0; j < width; j++) {
          const touchState = data[i][j];
          const touchAnnotationId = annotation.id + `/touch/${i}/${j}`;

          const touchX = Math.ceil(1 * scale * j + x);
          const touchY = Math.ceil(1 * scale * i + y);

          const annoBody = {
            id: touchAnnotationId + "/body",
            type: "Boolean",
            value: !!touchState
          };
          const touchTarget = {
            source: target,
            selector: {
              type: "FragmentSelector",
              conformsTo: "http://www.w3.org/TR/media-frags/",
              value: `xywh=pixel:${touchX},${touchY},${touchW},${touchH}`
            }
          };
          const touchAnnotation = {
            id: touchAnnotationId,
            type: "Annotation",
            motivation: "tagging",
            body: annoBody,
            target: touchTarget
          };
          updatedAnnotations.push(touchAnnotation);
        }
      }
    } else {
      updatedAnnotations.push(annotation.__jsonld);
    }
  }
  return updatedAnnotations;
}

export default async function createViewer(containerId, manifestUrl: URL, page = 0) {
  const manifest = await loadManifest(manifestUrl);
  const id = getServiceId(manifest, page);
  let service;
  try {
    service = await loadInfoJson(id);
    console.log(`Loaded service`, service);
  } catch {
    console.warn(`Failed to get ${id}`);
  }

  if (service === undefined) {
    throw new Error("Failed to find service");
  }

  const viewer = OpenSeadragon({
    showNavigator: false,
    showNavigationControl: false,
    //debugMode:  true,
    id: containerId,
    preserveViewport: true,
    visibilityRatio: 1,
    minZoomLevel: 0.5,
    defaultZoomLevel: 0.5,
    sequenceMode: true,
    tileSources: [service],
    gestureSettingsMouse: {
      clickToZoom: false
    },
    gestureSettingsTouch: {
      pinchRotate: false
    }
  });

  //viewer.addHandler("canvas-click", (e) => {console.log(e)})

  const annoStyle = (an, state) => {
    console.log(an, state);
    /*
    let touchState = false;
    if (an.bodies[0].type == "Boolean") {
      touchState = an.bodies[0].value;
    }
    */
    const { hovered, selected } = state || {};
    return {
      fill: "#ffffff",
      stroke: "#ff0000",
      fillOpacity: hovered ? 0.2 : 0,
      strokeOpacity: hovered ? 0.7 : 0.5,
      strokeWidth: hovered ? 2 : 1
    };
  };

  const config = {
    autoSave: false,
    drawingEnabled: false,
    style: annoStyle,
    adapter: Annotorious.W3CImageFormat(id)
  };
  const anno = Annotorious.createOSDAnnotator(viewer, config);

  anno.on("mouseEnterAnnotation", function (annotation) {
    let touchState;
    if (annotation.body[0].type == "Boolean") {
      touchState = annotation.body[0].value;
    }
    if ("vibrate" in window.navigator) {
      if (touchState) {
        //console.log(annotation.body[0]);
        window.navigator.vibrate(200);
      }
    } else {
      console.warn("Vibrate not supported!");
    }
  });
  const annotations = getAnnotations(manifest, page);
  let annotationsJson;

  if (true) {
    annotationsJson = generateTouchAreaAnnotationsRLE(annotations);
    //annotationsJson = generateTouchAreaAnnotations(annotations);
  } else {
    annotationsJson = annotationsToJson(annotations);
  }
  /*
  const touchAnnotations = generateTouchAreas(annotations);
  const annotationsJson = annotationsToJson(annotations);
  */
  //console.log(annotationsJson);

  anno.setAnnotations(annotationsJson);
  window.anno = anno;
  return viewer;
}
