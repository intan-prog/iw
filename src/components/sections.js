// Interaksi bagian Tentang, Interior, dan Menu: tab menu + animasi saat di-scroll
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initInterior } from './floorplan.js';
import { initMenu } from './menu.js';
import { initReservation } from './reservation.js';

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

function initMenuTabs() {
  const tabs = document.querySelectorAll('.menu-tab');
  const panels = document.querySelectorAll('.menu-panel');
  if (!tabs.length) return;

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const targetId = tab.dataset.panel;

      tabs.forEach((t) => t.setAttribute('aria-pressed', String(t === tab)));
      panels.forEach((p) => { p.hidden = p.id !== targetId; });

      const panel = document.getElementById(targetId);
      if (!reduced && panel) {
        gsap.from(panel.querySelectorAll('.menu-item'), {
          y: 20, opacity: 0, stagger: 0.06, duration: 0.5, ease: 'power2.out',
        });
      }
      // Tinggi halaman berubah, hitung ulang posisi ScrollTrigger
      ScrollTrigger.refresh();
    });
  });
}

function initScrollReveal() {
  document.querySelectorAll('[data-scroll]').forEach((el) => {
    gsap.from(el, {
      y: 40, opacity: 0, duration: 0.9, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    });
  });
}
// Angka di bagian Tentang berhitung naik saat terlihat
function initCounters() {
  document.querySelectorAll('[data-count]').forEach((el) => {
    const end = Number(el.dataset.count);
    if (reduced) { el.textContent = end; return; }
    el.textContent = '0';
    const o = { v: 0 };
    gsap.to(o, {
      v: end, duration: 1.8, ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      onUpdate: () => { el.textContent = Math.round(o.v); },
    });
  });
}

export function initSections() {
  initMenuTabs();
  initInterior();
  initMenu();
  initReservation();
  initCounters();
  if (!reduced) initScrollReveal();
}