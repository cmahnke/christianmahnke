import * as THREE from 'three/src/Three.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import HDRWebGPURenderer from 'hdr-canvas/three/HDRWebGPURenderer.js';
import WebGPU from 'hdr-canvas/three/WebGPU.js';
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
      model.traverse((element) => {
        if (element?.material?.type != undefined) {
          let targetMaterial = new THREE.MeshBasicMaterial();
          THREE.MeshBasicMaterial.prototype.copy.call(targetMaterial, element.material);
          element.material = targetMaterial;
        }
      });
      model.position.y = -1.0;
      scene.add(model);

  	},
    function (xhr) {
      //console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
    },
  	function (error) {
  		console.log('An error happened', error);
  	}
  );

  // Add alpha: true for transparency
  if (WebGPU.isAvailable() && checkHDRCanvas()) {
    renderer = new HDRWebGPURenderer({canvas: canvas, antialias: true});
  } else {
    renderer = new THREE.WebGLRenderer({canvas: canvas, antialias: true});
  }
  const parentWidth = renderer.domElement.parentNode.clientWidth;
  const parentHeight = renderer.domElement.parentNode.clientHeight;

  camera = new THREE.PerspectiveCamera(40, parentWidth / parentHeight, 0.25, 20);

	camera.position.set(0, 6, 10);
  camera.lookAt(0,0,0)

  const ratio = window.devicePixelRatio || 1;
	renderer.setPixelRatio(ratio);

  renderer.setSize(parentWidth, parentHeight);
  renderer.setAnimationLoop(animate);
  renderer.setClearColor(0x000000, 0);
  controls = new OrbitControls(camera, renderer.domElement);
  controls.autoRotate = true;
  controls.autoRotateSpeed = .05;
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


window.initModel = initModel;
