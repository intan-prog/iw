import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { createComposer } from './postprocessing.js';

// Warna latar harus sama dengan --bg di CSS agar menyatu
const BG = { light: 0xf5efe6, dark: 0x1a110b };

export function createScene(canvas) {
  // Kualitas otomatis: turunkan di mobile
  const isMobile = matchMedia('(max-width: 768px), (pointer: coarse)').matches;
  const quality = {
    isMobile,
    pixelRatio: Math.min(devicePixelRatio, isMobile ? 1.5 : 2),
    shadows: !isMobile,
    bloom: !isMobile,
    msaa: !isMobile,
    steam: isMobile ? 30 : 70,
    beans: isMobile ? 40 : 90,
  };

  const renderer = new THREE.WebGLRenderer({
    canvas, antialias: false, powerPreference: 'high-performance',
  });
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = quality.shadows;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(BG.light);
  scene.fog = new THREE.Fog(BG.light, 10, 24);

  const camera = new THREE.PerspectiveCamera(35, innerWidth / innerHeight, 0.1, 100);
  camera.position.set(0, 1.2, 9);
  camera.lookAt(0, 0.4, 0);

  // Environment map prosedural (tanpa file HDRI) untuk pantulan realistis
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  // Cahaya utama hangat + soft shadow
  const key = new THREE.DirectionalLight(0xffd7a8, 2.2);
  key.position.set(4, 6, 3);
  key.castShadow = quality.shadows;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.radius = 6;
  Object.assign(key.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4 });
  scene.add(key);
  const rim = new THREE.PointLight(0xc8793a, 12, 14);
  rim.position.set(-4, 2, -2);
  scene.add(rim);

  const composer = createComposer(renderer, scene, camera, quality);

  // ---------- State & event kecil ----------
  const updaters = [];
  const resizers = [];
  const themers = [];
  const state = { active: true };
  const pointer = { x: 0, y: 0 };
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let mode = document.documentElement.dataset.theme || 'light';

  function applyTheme(m) {
    mode = m;
    scene.background.set(BG[m]);
    scene.fog.color.set(BG[m]);
    scene.environmentIntensity = m === 'dark' ? 0.35 : 0.8;
    themers.forEach((fn) => fn(m));
  }
  window.addEventListener('themechange', (e) => applyTheme(e.detail));

  window.addEventListener('pointermove', (e) => {
    pointer.x = (e.clientX / innerWidth) * 2 - 1;
    pointer.y = (e.clientY / innerHeight) * 2 - 1;
  });

function resize() {
  const w = innerWidth, h = innerHeight;

  renderer.setPixelRatio(quality.pixelRatio);
  renderer.setSize(w, h, false);

  const aspect = w / h;
  camera.aspect = aspect;
  // Layar portrait: mundurkan kamera supaya objek tidak terpotong di kiri/kanan
  camera.position.z = aspect < 1 ? 9 + (1 - aspect) * 6 : 9;
  camera.lookAt(0, 0.4, 0);
  camera.updateProjectionMatrix();

  composer.setPixelRatio(quality.pixelRatio);
  composer.setSize(w, h);
  resizers.forEach((fn) => fn(w, h));
}
window.addEventListener('resize', resize);
  const world = {
    renderer, scene, camera, composer, quality, pointer, reduced,
    onUpdate: (fn) => updaters.push(fn),
    onResize: (fn) => { resizers.push(fn); fn(innerWidth, innerHeight); },
    onTheme: (fn) => { themers.push(fn); fn(mode); }, // langsung dipanggil sekali
    setActive: (v) => { state.active = v; },
  };

  applyTheme(mode);
  resize();

  const clock = new THREE.Clock();
  renderer.setAnimationLoop(() => {
    if (!state.active) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    updaters.forEach((fn) => fn(clock.elapsedTime, dt));
    composer.render(dt);
  });

  return world;
}