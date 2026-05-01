// aframe-orbit-controls.ts
import "aframe";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

AFRAME.registerComponent("orbit-controls", {
  schema: {
    enabled:          { type: "boolean", default: true },
    target:           { type: "vec3",    default: { x: 0, y: 0, z: 0 } },
    minDistance:      { type: "number",  default: 0 },
    maxDistance:      { type: "number",  default: Infinity },
    minPolarAngle:    { type: "number",  default: 0 },
    maxPolarAngle:    { type: "number",  default: Math.PI },
    minAzimuthAngle:  { type: "number",  default: -Infinity },
    maxAzimuthAngle:  { type: "number",  default: Infinity },
    enableDamping:    { type: "boolean", default: true },
    dampingFactor:    { type: "number",  default: 0.05 },
    enableZoom:       { type: "boolean", default: true },
    zoomSpeed:        { type: "number",  default: 1.0 },
    enableRotate:     { type: "boolean", default: true },
    rotateSpeed:      { type: "number",  default: 1.0 },
    enablePan:        { type: "boolean", default: true },
    panSpeed:         { type: "number",  default: 1.0 },
    autoRotate:       { type: "boolean", default: false },
    autoRotateSpeed:  { type: "number",  default: 2.0 },
    initialPosition:  { type: "vec3",    default: { x: 0, y: 0, z: 5 } },
  },

  controls: null as InstanceType<typeof OrbitControls> | null,

  init() {
    const sceneEl = this.el.sceneEl!;

    const setup = () => {
      const camera = (sceneEl as any).camera as THREE.Camera;
      const renderer = sceneEl.renderer as THREE.WebGLRenderer;

      const { x, y, z } = this.data.initialPosition;
      camera.position.set(x, y, z);

      this.controls = new OrbitControls(camera, renderer.domElement);
      this.applySchema();
    };

    if (sceneEl.hasLoaded) {
      setup();
    } else {
      sceneEl.addEventListener("loaded", setup, { once: true });
    }
  },

  applySchema() {
    const c = this.controls;
    if (!c) return;

    const d = this.data;

    c.enabled           = d.enabled;
    c.target.set(d.target.x, d.target.y, d.target.z);
    c.minDistance       = d.minDistance;
    c.maxDistance       = d.maxDistance;
    c.minPolarAngle     = d.minPolarAngle;
    c.maxPolarAngle     = d.maxPolarAngle;
    c.minAzimuthAngle   = d.minAzimuthAngle;
    c.maxAzimuthAngle   = d.maxAzimuthAngle;
    c.enableDamping     = d.enableDamping;
    c.dampingFactor     = d.dampingFactor;
    c.enableZoom        = d.enableZoom;
    c.zoomSpeed         = d.zoomSpeed;
    c.enableRotate      = d.enableRotate;
    c.rotateSpeed       = d.rotateSpeed;
    c.enablePan         = d.enablePan;
    c.panSpeed          = d.panSpeed;
    c.autoRotate        = d.autoRotate;
    c.autoRotateSpeed   = d.autoRotateSpeed;

    c.update();
  },

  update() {
    this.applySchema();
  },

  tick() {
    this.controls?.update();
  },

  remove() {
    this.controls?.dispose();
    this.controls = null;
  },
});