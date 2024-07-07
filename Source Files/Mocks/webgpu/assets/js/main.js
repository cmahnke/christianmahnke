import { initModel } from "./hdr-model"

const modelUrl = '/model/uranium.glb';
const canvas = document.querySelector('#renderer');

initModel(canvas, modelUrl);
