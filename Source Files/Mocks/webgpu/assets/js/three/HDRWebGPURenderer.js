import WebGPU from 'three/addons/capabilities/WebGPU.js';

import Renderer from 'three/addons/renderers/common/Renderer.js';
import WebGLBackend from 'three/addons/renderers/webgl/WebGLBackend.js';
import WebGPUBackend from 'three/addons/renderers/webgpu/WebGPUBackend.js';
import HDRWebGPUBackend from './HDRWebGPUBackend.js';

class HDRWebGPURenderer extends Renderer {
  constructor( parameters = {} ) {

		let BackendClass;

		if ( parameters.forceWebGL ) {

			BackendClass = WebGLBackend;

		} else if ( WebGPU.isAvailable() ) {

			BackendClass = HDRWebGPUBackend;

		} else {

			BackendClass = WebGLBackend;

			console.warn( 'THREE.WebGPURenderer: WebGPU is not available, running under WebGL2 backend.' );

		}

		const backend = new BackendClass( parameters );

		super( backend, parameters );

		this.isWebGPURenderer = true;

	}

}

export default HDRWebGPURenderer;
