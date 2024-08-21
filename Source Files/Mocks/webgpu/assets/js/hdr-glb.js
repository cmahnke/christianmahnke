import * as THREE from 'three/src/Three.WebGPU.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import HDRWebGPURenderer from './HDRWebGPURenderer.js';

import {checkHDR, checkHDRCanvas} from 'hdr-canvas';

let scene, renderer, camera, controls, model;

export function initModel(canvas, modelUrl, replacements) {
  if (canvas === null) {
    console.log('Model canvas is null!');
  }

  const loader = new GLTFLoader();
  scene = new THREE.Scene();

  loader.load(modelUrl,
    function (gltf) {
      model = gltf.scene;

      //console.log("Updating material")
      model.traverse((element) => {
        if( element?.material?.type != undefined ) {
          let targetMaterial = new THREE.MeshBasicMaterial();
          THREE.MeshBasicMaterial.prototype.copy.call( targetMaterial, element.material );
          element.material = targetMaterial;
          //console.log(`Replaced texture for ${element.name}`, element)
        }
      });

      scene.add(model);

      // This replaces the texture from the GLB file  - currently the lighting seems wrong
      /*
      if (replacements !== undefined && replacements !== null) {
        for (var materialName in replacements) {
          model.traverse(child => {
            if (child.material && child.material.name === materialName) {
              const newTexture = new THREE.TextureLoader().load(replacements[materialName],
                function ( texture ) {
              		const material = new THREE.MeshBasicMaterial( {
              			map: texture
              		 } );
              	}
              );
              newTexture.flipY = false;
              child.material.map = newTexture;

              console.log(child);
            }
          });
        }
      }
      */

  	},
    function (xhr) {
      //console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
    },
  	function (error) {
  		console.log('An error happened', error);
  	}
  );

  // Add alpha: true for transparency
  if (checkHDR() && checkHDRCanvas()) {
    renderer = new HDRWebGPURenderer({canvas: canvas, antialias: true});
  } else {
    renderer = new THREE.WebGPURenderer({canvas: canvas, antialias: true});
  }
  const parentWidth = renderer.domElement.parentNode.clientWidth;
  const parentHeight = renderer.domElement.parentNode.clientHeight;

  camera = new THREE.PerspectiveCamera(45, parentWidth / parentHeight, 0.25, 20);
	camera.position.set(0, 0, 5);

  const ratio = window.devicePixelRatio || 1;
	renderer.setPixelRatio(ratio);


  renderer.setSize(parentWidth, parentHeight);
  renderer.setAnimationLoop(animate);
  renderer.setClearColor(0x000000, 0);
  controls = new OrbitControls(camera, renderer.domElement);
  controls.autoRotate = true;
  controls.autoRotateSpeed = .15;
  controls.minPolarAngle = 0;
	controls.maxPolarAngle =  Math.PI * 0.5;


  window.addEventListener("resize", () => {
    camera.aspect = canvas.parentNode.clientWidth / canvas.parentNode.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(canvas.parentNode.clientWidth, canvas.parentNode.clientHeight);
  });

  canvas.scene = scene;
};

function animate() {
	requestAnimationFrame(animate);

	// required if controls.enableDamping or controls.autoRotate are set to true
	controls.update();
	renderer.render(scene, camera);
}

/*
function getImageDataFromImg(img) {
  const colorSpace = 'rec2100-hlg';
  const offscreen = new OffscreenCanvas(img.width, img.height);
  const loadCtx = offscreen.getContext("2d", {colorSpace: colorSpace, pixelFormat:'float16'});
  loadCtx.drawImage(img, 0, 0);
  const imData = loadCtx.getImageData(0, 0, img.width, img.height);
  return imData;
}
*/

window.initModel = initModel;
