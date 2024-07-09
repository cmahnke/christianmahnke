import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import HDRWebGPURenderer from 'hdr-canvas/three/HDRWebGPURenderer.js';

let scene, renderer, camera, controls, model;

const colorSpace = 'rec2100-hlg';

function render() {
  //renderer.clear();
  //const ratio = window.devicePixelRatio || 1;
  const parentWidth = renderer.domElement.parentNode.clientWidth;
  const parentHeight = renderer.domElement.parentNode.clientHeight;

  camera.lookAt(model.position);
  controls.update();

  camera.aspect = canvas.parentNode.clientWidth / canvas.parentNode.clientHeight;
  camera.updateProjectionMatrix();

  renderer.renderAsync(scene, camera);
}

export function initModel(canvas, modelUrl, replacements) {
  if (canvas === null) {
    console.log('Model canvas is null!');
  }

  const loader = new GLTFLoader();
  scene = new THREE.Scene();

  loader.load(modelUrl,
    function (gltf) {
      model = gltf.scene;
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

  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.25, 20);
	camera.position.set(0, 0, 5);

  // Add alpha: true for transparency
  renderer = new HDRWebGPURenderer({canvas: canvas, antialias: true});
  const ratio = window.devicePixelRatio || 1;
	renderer.setPixelRatio(ratio);
  const parentWidth = renderer.domElement.parentNode.clientWidth;
  const parentHeight = renderer.domElement.parentNode.clientHeight;
  renderer.setSize(parentWidth, parentHeight);
  renderer.setAnimationLoop( animate );
  renderer.setClearColor(0x000000, 0);
  controls = new OrbitControls( camera, renderer.domElement );

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

function getImageDataFromImg(img) {
  const colorSpace = 'rec2100-hlg';
  const offscreen = new OffscreenCanvas(img.width, img.height);
//  offscreen.configureHighDynamicRange({mode:'extended'});
  const loadCtx = offscreen.getContext("2d", {colorSpace: colorSpace, pixelFormat:'float16'});
  loadCtx.drawImage(img, 0, 0);
  const imData = loadCtx.getImageData(0, 0, img.width, img.height);
  return imData;
}

window.initModel = initModel;
