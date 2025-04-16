import OpenSeadragon from "openseadragon";
import * as Annotorious from "@annotorious/openseadragon";
import { Manifest } from "manifesto.js";

import { loadManifest, getServiceId, loadInfoJson, getAnnotations } from "./manifest-loader.js";


const debug = false;

export default async function touchViewer(containerId, manifestUrl, page = 0) {
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

  const options = {
    showNavigator: false,
    showNavigationControl: false,
    id: containerId,
    preserveViewport: true,
    visibilityRatio: 1,
    minZoomLevel: 0.5,
    defaultZoomLevel: 0.5,
    drawer: "canvas",
    crossOriginPolicy: "Anonymous",
    //sequenceMode: true,
    tileSources: [service],
    gestureSettingsMouse: {
      clickToZoom: false
    },
    gestureSettingsTouch: {
      pinchRotate: false,
      dragToPan: false
    }
  };

  if (debug) {
    options.showNavigationControl = true;
    //options.debugMode: true;
  }

  const viewer = OpenSeadragon(options);

  //viewer.addHandler("canvas-click", (e) => {console.log(e)})

  const annoStyle = (an, state) => {
    //console.log(an, state);
    let touchState = false;
    if (an.bodies[0].type == "Boolean") {
      touchState = an.bodies[0].value;
    }
    const { hovered, selected } = state || {};
    if (touchState && debug) {
      return {
        fill: "#000000",
        stroke: "#ff0000",
        fillOpacity: hovered ? 0.7 : 0.3,
        strokeOpacity: hovered ? 0.7 : 0.5,
        strokeWidth: hovered ? 2 : 1
      };
    }
    if (an.bodies[0].type == "TextualBody") {
      return {
        fill: "#ffffff",
        stroke: "#ff0000",
        fillOpacity: hovered ? 0.2 : 0,
        strokeOpacity: hovered ? 0.7 : 0.5,
        strokeWidth: hovered ? 2 : 1
      };
    }
    return {
      fillOpacity: 0,
      strokeOpacity: 0
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
    if (annotation.body[0].type == "InteractiveResource") {
      touchState = annotation.body[0].haptics.vibrate;
    }
    if ("vibrate" in window.navigator) {
      if (touchState) {
        window.navigator.vibrate(200);
      }
    } else {
      console.warn("Vibrate not supported!");
    }
  });

  anno.on("mouseLeaveAnnotation", function (annotation) {
    if ("vibrate" in window.navigator) {
      window.navigator.vibrate(0);
    }
  });

  const annotations = getAnnotations(manifest, page);
  let annotationsJson = annotations.map((a) => {
    return a.__jsonld;
  });

  if (debug) {
    console.log(`Loaded annotations`, annotations);
  }

  anno.setAnnotations(annotationsJson);
  window.anno = anno;
  return viewer;
}
