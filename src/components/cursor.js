import gsap from 'gsap';

// Cursor kustom: cincin mengikuti mouse, membesar + label saat hover elemen interaktif
export function initCursor() {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  document.documentElement.classList.add('has-cursor');

  const ring = document.querySelector('.cursor');
  const dot = document.querySelector('.cursor-dot');
  gsap.set([ring, dot], { xPercent: -50, yPercent: -50 });

  const rx = gsap.quickTo(ring, 'x', { duration: 0.35, ease: 'power3' });
  const ry = gsap.quickTo(ring, 'y', { duration: 0.35, ease: 'power3' });
  const dx = gsap.quickTo(dot, 'x', { duration: 0.08 });
  const dy = gsap.quickTo(dot, 'y', { duration: 0.08 });

  window.addEventListener('pointermove', (e) => {
    rx(e.clientX); ry(e.clientY); dx(e.clientX); dy(e.clientY);
  });
  document.addEventListener('pointerover', (e) => {
    const el = e.target.closest('a, button, [data-cursor]');
    ring.classList.toggle('is-active', !!el);
    ring.dataset.label = el?.dataset.cursor || '';
  });
}