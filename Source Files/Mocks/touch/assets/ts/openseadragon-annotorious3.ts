import OpenSeadragon from "openseadragon";
import * as Annotorious from "@annotorious/openseadragon";
import { Manifest } from "manifesto.js";
import { optimize } from "svgo";
import {
  tin,
  point,
  explode,
  bboxPolygon,
  bbox,
  centroid,
  intersect,
  difference,
  voronoi,
  union,
  polygonToLine,
  flatten,
  polygon,
  multiPolygon,
  featureCollection
} from "@turf/turf";
//import { polygon, multiPolygon, featureCollection } from "@turf/helpers";
import {GeometryUtil} from "@terrestris/ol-util"
import { loadManifest, getServiceId, loadInfoJson, getAnnotations } from "./loader.ts";

import "@annotorious/openseadragon/annotorious-openseadragon.css";
// CSS
//import "@annotorious/openseadragon/dist/annotorious-openseadragon.css";

const debug = false;

function annotationsToJson(annotations: Annotation[]) {
  const jsonAnnotations = [];
  for (const annotation of annotations) {
    jsonAnnotations.push(annotation.__jsonld);
  }
  return jsonAnnotations;
}

function generateTouchAreaAnnotationsSVG(annotations: Annotation[]) {
  const updatedAnnotations = [];

  for (let annotation of annotations) {
    let svgPolys = [];
    let squares = [];
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
      const touchW = Math.ceil(1 * scale);
      const touchH = Math.ceil(1 * scale);

      for (var i = 0; i < height; i++) {
        for (var j = 0; j < width; j++) {
          const touchState = data[i][j];
          const touchAnnotationId = annotation.id + `/touch/${i}/${j}`;

          const touchX = Math.ceil(1 * scale * j + x);
          const touchY = Math.ceil(1 * scale * i + y);

          //stroke-width="1"
          const poly = `<polygon points="${touchX},${touchY} ${touchX + touchW},${touchY} ${touchX + touchW},${touchY + touchH} ${touchX},${touchY + touchH}" />`;

          let square = [
            [touchX, touchY],
            [touchX + touchW, touchY],
            [touchX + touchW, touchY + touchH],
            [touchX, touchY + touchH],
            [touchX, touchY]
          ];

          square = polygon([square]);

          if (!!touchState) {
            svgPolys.push(poly);
            squares.push(square);
          }
        }
      }

      //<svg viewBox="0 0 ${value.meta.width} ${value.meta.height}"
      const svg = `<svg viewBox="${value.meta.x} ${value.meta.y} ${value.meta.width} ${value.meta.height}" xmlns="http://www.w3.org/2000/svg">${svgPolys.join("")}</svg>`;
      const result = optimize(svg, {
        //path: 'path-to.svg', // recommended
        multipass: true,
        plugins: [
          {
            name: "preset-default",
            params: {
              overrides: {
                mergePaths: true, //{force: true},
                convertPathData: true,
                removeViewBox: false
              }
            }
          }
        ]
      });

      /*
      const paths = [];
      const tempSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      tempSvg.innerHTML = result.data;
      const rootElement = tempSvg.querySelector("svg");
      const pathElements = rootElement.querySelectorAll("path");
      for (const path of pathElements) {
        const d = path.getAttribute("d");
        if (d.slice(-1).toLowerCase() != "z") {
          console.warn(`Path isn't closed: ${d}`);
        }
        //const poly
        paths.push(d);
      }
      */
      /*
      import("svg-path-to-polygons").then((module) => {
        // Use the module here
        const pathDataToPolys = module.default;
        for (const p of paths) {
          console.log(`${p} ${pathDataToPolys(p)}`);
        }
      });
      */

      function bboxToPoints(box, additionalPoints, edges = 4) {
        let points = bboxPolygon(box)
          .geometry.coordinates[0].slice(4 + -edges, -1)
          .map((p) => {
            return point(p);
          });
        if (additionalPoints !== undefined) {
          points.push(
            ...additionalPoints.map((a) => {
              return point(a.geometry.coordinates);
            })
          );
        }
        return explode(featureCollection(points));
      }

      function makeEndImplicit(poly) {
        if (poly[0].every((v, i) => v === poly[poly.length - 1][i])) {
          return poly.slice(0, -1);
        }
        return poly;
      }

      function lineToSVGPolygon(line) {
        return line
          .map((point) => {
            return point.join(",");
          })
          .join(" ");
      }

      function splitPolygon(polygon) {
        if (polygon.length == 1) {
          return polygon;
        }
      }

      function dissolveMultiUnion(polygons) {
        const dissolvedPolygons = [];
        for (const unionPolygon of multiPolygonUnion.geometry.coordinates) {
          if (unionPolygon.length == 1) {
            dissolvedPolygons.push(unionPolygon);
          } else if (unionPolygon.length > 1) {
            const unionMultiPolygon = multiPolygon(unionPolygon);
            dissolveMultiPolygon(unionMultiPolygon).forEach((element) => {
              dissolvedPolygons.push(element);
            });
          }
        }
        return dissolvedPolygons;
      }

      function dissolveMultiPolygon(multipolygons) {
        const polygons = [];
        if (multipolygons.geometry.type == "MultiPolygon") {
          let holes = multipolygons.geometry.coordinates.slice(1).map((p) => {
            return centroid(polygon([p]));
          });
          const box = bbox(polygon([multipolygons.geometry.coordinates[0]]));
          const points = bboxToPoints(box, holes, 4);
          const tinPolygons = tin(points);
          const intersections = tinPolygons.features.map((feature) => {
            return intersect(featureCollection([feature, multipolygons]));
          });
          intersections.forEach((element) => {
            polygons.push(dissolveMultiPolygon(element));
          });
        } else if (multipolygons.geometry.type == "Polygon") {
          polygons.push(intersection.geometry.coordinates[0]);
        } else {
          throw new Error(`Unknown type ${intersection.geometry.type}`);
        }
        return polygons;
      }

      const turfPoly = [];
      const multiPolygonUnion = union(featureCollection(squares));

      //const newPolygons = dissolveMultiUnion(multiPolygonUnion)

      for (const unionPolygon of multiPolygonUnion.geometry.coordinates) {
        if (unionPolygon.length == 1) {
          // "Polygon"
          turfPoly.push(`<polygon points="${lineToSVGPolygon(makeEndImplicit(unionPolygon[0]))}" />`);
        } else if (unionPolygon.length > 1) {
          // "MultiPolygon"
          const unionMultiPolygon = multiPolygon(unionPolygon);
          let holes = unionPolygon.slice(1).map((p) => {
            return centroid(polygon([p]));
          });

          const box = bbox(polygon([unionPolygon[0]]));

          //holes = featureCollection(holes);
          const points = bboxToPoints(box, holes, 4);
          const tinPolygons = tin(points);

          const slices = tinPolygons.features.map((feature) => {
            //console.log(feature);
            let intersection = intersect(featureCollection([feature, unionMultiPolygon]));
            if (intersection.geometry.type == "MultiPolygon") {
              let cut = intersection.geometry.coordinates.slice(1).map((c) => {
                return polygon(c);
              });

              const outerIntersection = polygon(intersection.geometry.coordinates[0]);
              const intersectionDiff = difference(featureCollection([outerIntersection, ...cut]));
              console.log(intersection, polygonToLine(intersection), intersectionDiff);

              //intersection = intersectionDiff.geometry.coordinates[0].slice(0, -1)
              /*
              if (intersection.geometry.coordinates.length > 2) {
                console.log(intersection);
                throw new Error();
              }

              turfPoly.push(`<polygon points="${lineToSVGPolygon(makeEndImplicit(intersection.geometry.coordinates))}" />`);
*/
              for (const flatLine of flatten(intersection).features) {
                console.log("falttended multipoligon", flatLine);
                turfPoly.push(`<polygon stroke="red" points="${lineToSVGPolygon(makeEndImplicit(flatLine.geometry.coordinates[0]))}" />`);
              }
            } else {
              turfPoly.push(`<polygon stroke="red" points="${lineToSVGPolygon(makeEndImplicit(intersection.geometry.coordinates))}" />`);
            }
            //console.log("intersection", intersection);
            /*
            for (const flatLine of flatten(intersection).features) {
              console.log("falttended multipoligon", flatLine);
              turfPoly.push(`<polygon points="${lineToSVGPolygon(makeEndImplicit(flatLine.geometry.coordinates))}" />`);
            }
            */
            //turfPoly.push(`<polygon points="${lineToSVGPolygon(makeEndImplicit(intersection))}" />`);
          });

          console.log(multiPolygon(polygon), slices);
          /*
          for (const flatLine of flatten(line.geometry).features) {
            turfPoly.push(`<polygon points="${lineToSVGPolygon(makeEndImplicit(flatLine.geometry.coordinates))}" />`);
          }
          */
        }
      }

      const lines = polygonToLine(multiPolygonUnion);

      for (const line of lines.features) {
        if (line.geometry.type == "LineString") {
          //turfPoly.push(`<polygon points="${lineToSVGPolygon(makeEndImplicit(line.geometry.coordinates))}" />`);
        } else if (line.geometry.type == "MultiLineString") {
          for (const flatLine of flatten(line.geometry).features) {
            //turfPoly.push(`<polygon points="${lineToSVGPolygon(makeEndImplicit(flatLine.geometry.coordinates))}" />`);
          }
        }
      }

      const turfedSvg = `<svg viewBox="${value.meta.x} ${value.meta.y} ${value.meta.width} ${value.meta.height}" xmlns="http://www.w3.org/2000/svg">${turfPoly.join("")}</svg>`;

      console.log(squares, multiPolygon, lines);
      //console.log(result.data);
      //console.log(paths);
      console.log(svg);
      console.log(turfedSvg);
      console.log(
        `Naive svg size ${svg.length} (count ${svgPolys.length}), turf compressed size ${turfedSvg.length} (count ${turfPoly.length})`
      );
    } else {
      updatedAnnotations.push(annotation.__jsonld);
    }
  }
  return updatedAnnotations;
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
      let touchW = Math.ceil(1 * scale);
      const touchH = Math.ceil(1 * scale);

      for (var i = 0; i < height; i++) {
        let last = data[i][0];
        let rle = [0];
        for (var j = 0; j < width; j++) {
          if (data[i][j] == last) {
            //rle[rle.length - 1] = rle[rle.length - 1] + 1;
            rle[rle.length - 1] += 1;
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
          if (!!touchState) {
            updatedAnnotations.push(touchAnnotation);
          }
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
      pinchRotate: false,
      dragToPan: false
    }
  });

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
        fillOpacity: hovered ? 0.5 : 0,
        strokeOpacity: hovered ? 0.7 : 0.5,
        strokeWidth: hovered ? 2 : 0
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

  generateTouchAreaAnnotationsSVG(annotations);

  if (true) {
    annotationsJson = generateTouchAreaAnnotationsRLE(annotations);
    //annotationsJson = generateTouchAreaAnnotations(annotations);
  } else {
    annotationsJson = annotationsToJson(annotations);
  }
  console.log(`Loading ${annotationsJson.length} annotations`);

  anno.setAnnotations(annotationsJson);
  window.anno = anno;
  return viewer;
}
