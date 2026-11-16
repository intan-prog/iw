import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

// Vignette sederhana: tepi layar sedikit digelapkan
const VignetteShader = {
  uniforms: { tDiffuse: { value: null }, uIntensity: { value: 0.3 } },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse; uniform float uIntensity; varying vec2 vUv;
    void main(){
      vec4 c = texture2D(tDiffuse, vUv);
      float v = 1.0 - smoothstep(0.3, 0.9, distance(vUv, vec2(0.5)));
      c.rgb *= mix(1.0 - uIntensity, 1.0, v);
      gl_FragColor = c;
    }`,
};

export function createComposer(renderer, scene, camera, quality) {
  // samples: 4 = antialiasing (MSAA) tetap aktif walau memakai composer
  const target = new THREE.WebGLRenderTarget(1, 1, {
    type: THREE.HalfFloatType,
    samples: quality.msaa ? 4 : 0,
  });
  const composer = new EffectComposer(renderer, target);
  composer.addPass(new RenderPass(scene, camera));

  // Bloom ringan (dimatikan di mobile)
  if (quality.bloom) {
    composer.addPass(new UnrealBloomPass(
      new THREE.Vector2(innerWidth, innerHeight), 0.25, 0.6, 0.9));
  }
  composer.addPass(new ShaderPass(VignetteShader));
  composer.addPass(new OutputPass()); // tone mapping + color space
  return composer;
}