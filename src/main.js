import './styles/style.css'
import './styles/sections.css'
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { initNavbar } from './components/navbar.js';
import { initCursor } from './components/cursor.js';
import { initSections } from './components/sections.js';
import { createScene } from './three/scene.js';
import { createHero } from './three/hero.js';
import { createParticles } from './three/particles.js';

gsap.registerPlugin(ScrollTrigger);

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const root = document.documentElement;

// Cek dukungan WebGL
function webglSupported() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch { return false; }
}

initNavbar();
initCursor();
initSections();

// ---------- Smooth scroll (dimatikan jika reduced motion) ----------
let lenis = null;
if (!reduced) {
  lenis = new Lenis({ lerp: 0.1 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  lenis.stop(); // ditahan sampai loader selesai
}

// Anchor link ikut smooth scroll
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    if (id.length < 2) return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    lenis ? lenis.scrollTo(target) : target.scrollIntoView();
  });
});

// ---------- Scene 3D ----------
if (webglSupported()) {
  try {
    const world = createScene(document.getElementById('webgl'));
    const hero = createHero(world);
    const particles = createParticles(world);

    world.onUpdate((t, dt) => { hero.update(t, dt); particles.update(t, dt); });

    if (!reduced) {
      const st = { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true };
      // Cangkir naik & mengecil saat hero di-scroll
      gsap.to(hero.group.position, { y: 2.4, scrollTrigger: st });
      gsap.to(hero.group.scale, { x: 0.7, y: 0.7, z: 0.7, scrollTrigger: st });
    }
    // Hemat GPU: render dihentikan saat hero sudah tidak terlihat
    ScrollTrigger.create({
      trigger: '#hero', start: 'top top', end: 'bottom top',
      onLeave: () => world.setActive(false),
      onEnterBack: () => world.setActive(true),
    });
    gsap.to('#webgl', {
      opacity: 0, ease: 'none',
      scrollTrigger: { trigger: '#hero', start: '60% top', end: 'bottom top', scrub: true },
    });
  } catch (err) {
    console.warn('3D gagal dimuat, memakai fallback:', err);
    root.classList.add('no-webgl');
  }
} else {
  root.classList.add('no-webgl');
}

// ---------- Loading screen ----------
const loader = document.querySelector('.loader');
const bar = document.querySelector('.loader__bar span');
const pct = document.querySelector('.loader__pct');

function finish() {
  document.body.classList.remove('is-loading');
  lenis?.start();
  if (reduced) { loader.remove(); return; }
  gsap.to(loader, { yPercent: -100, duration: 0.9, ease: 'power4.inOut', onComplete: () => loader.remove() });
  gsap.from('[data-reveal]', { y: 40, opacity: 0, stagger: 0.12, duration: 1, delay: 0.5, ease: 'power3.out' });
}

const progress = { p: 0 };
gsap.to(progress, {
  p: 100,
  duration: reduced ? 0.1 : 1.8,
  ease: 'power2.inOut',
  onUpdate() {
    bar.style.transform = `scaleX(${progress.p / 100})`;
    pct.textContent = `${Math.round(progress.p)}%`;
  },
  // tunggu font siap supaya teks tidak "loncat"
  onComplete: () => document.fonts.ready.then(finish),
});