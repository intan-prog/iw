// Menu modern: tab dengan penanda geser, kartu beranimasi, keranjang pesanan + kirim WhatsApp
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { categories } from '../data/menu.js';

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

// GANTI dengan nomor WhatsApp cafe (format internasional tanpa +, contoh: 6288983266526)
const WA_NUMBER = '6288983266526';

const rupiah = (n) => 'Rp' + n.toLocaleString('id-ID');
const svg = (p) => `<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const ICONS = {
  cup: svg('<path d="M5 8h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5z"/><path d="M16 9h1.5a2.5 2.5 0 0 1 0 5H16"/><path d="M8 3v2M11 3v2"/>'),
  glass: svg('<path d="M6 4h12l-1.5 15a2 2 0 0 1-2 1.8h-5a2 2 0 0 1-2-1.8z"/><path d="M7 9h10"/><path d="M13 4l2-2"/>'),
  plate: svg('<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/>'),
  cake: svg('<path d="M4 20h16v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2z"/><path d="M12 10V6"/><path d="M12 3c1 1 1 2 0 3-1-1-1-2 0-3z"/>'),
};

export function initMenu() {
  const root = document.getElementById('menu-app');
  if (!root) return;

  let current = categories[0].id;
  let sheetOpen = false;
  const cart = new Map(); // id -> jumlah
  const byId = new Map();
  categories.forEach((c) => c.items.forEach((it) => byId.set(it.id, it)));

  root.innerHTML = `
    <div class="mn-tabs" role="tablist" aria-label="Kategori menu">
      <span class="mn-ind" aria-hidden="true"></span>
      ${categories.map((c) => `<button class="mn-tab" type="button" role="tab" data-cat="${c.id}" aria-selected="${c.id === current}">${c.name}<small>${c.items.length}</small></button>`).join('')}
    </div>
    <div class="mn-grid" id="mn-grid"></div>
    <div class="mn-dock" id="mn-dock">
      <div class="mn-sheet" id="mn-sheet" hidden></div>
      <div class="mn-bar is-empty" id="mn-bar">
        <button class="mn-bar__main" type="button" data-act="sheet" aria-expanded="false">
          <span class="mn-bag" id="mn-bag">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 8h12l-1 12H7z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>
            <b id="mn-count">0</b>
          </span>
          <span class="mn-bar__text"><strong id="mn-total">Rp0</strong><small>Lihat pesananmu</small></span>
        </button>
        <button class="mn-send" type="button" data-act="send">Pesan via WhatsApp</button>
      </div>
    </div>`;

  const tabsEl = root.querySelector('.mn-tabs');
  const ind = root.querySelector('.mn-ind');
  const grid = root.querySelector('#mn-grid');
  const dock = root.querySelector('#mn-dock');
  const sheet = root.querySelector('#mn-sheet');
  const bar = root.querySelector('#mn-bar');
  const bag = root.querySelector('#mn-bag');
  const countEl = root.querySelector('#mn-count');
  const totalEl = root.querySelector('#mn-total');
  const sheetBtn = root.querySelector('[data-act="sheet"]');

  const qtyOf = (id) => cart.get(id) || 0;

  function totals() {
    let n = 0, t = 0;
    cart.forEach((q, id) => { n += q; t += q * byId.get(id).price; });
    return { n, t };
  }

  // ---------- Penanda tab ----------
  function moveInd(animate) {
    const t = tabsEl.querySelector('.mn-tab[aria-selected="true"]');
    if (!t) return;
    const props = { x: t.offsetLeft, width: t.offsetWidth };
    if (animate && !reduced) gsap.to(ind, { ...props, duration: 0.55, ease: 'power3.out' });
    else gsap.set(ind, props);
  }

  // ---------- Kartu ----------
  function ctrlHtml(id) {
    const q = qtyOf(id);
    return q
      ? `<button class="mn-step" type="button" data-act="dec" aria-label="Kurangi">−</button><span class="mn-qty">${q}</span><button class="mn-step" type="button" data-act="inc" aria-label="Tambah">+</button>`
      : '<button class="mn-add" type="button" data-act="add">Tambah</button>';
  }

  function cardHtml(it, icon) {
    return `<article class="mn-card${qtyOf(it.id) ? ' is-in' : ''}" data-id="${it.id}">
      <div class="mn-card__top"><span class="mn-icon">${ICONS[icon]}</span>${it.tag ? `<span class="mn-tag">${it.tag}</span>` : ''}</div>
      <h3>${it.name}</h3>
      <p>${it.desc}</p>
      <div class="mn-card__foot"><span class="price">${rupiah(it.price)}</span><div class="mn-ctrl">${ctrlHtml(it.id)}</div></div>
    </article>`;
  }

  function renderGrid(animate) {
    const cat = categories.find((c) => c.id === current);
    grid.innerHTML = cat.items.map((it) => cardHtml(it, cat.icon)).join('');
    if (animate && !reduced) {
      gsap.from(grid.children, {
        y: 40, opacity: 0, scale: 0.94, stagger: 0.05, duration: 0.6, ease: 'power3.out', clearProps: 'transform,opacity',
      });
    }
  }

  // ---------- Efek ----------
  function burst(r) {
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    for (let i = 0; i < 9; i++) {
      const p = document.createElement('span');
      p.className = 'mn-spark';
      p.style.left = cx + 'px';
      p.style.top = cy + 'px';
      document.body.appendChild(p);
      const ang = (i / 9) * Math.PI * 2 + Math.random() * 0.5;
      const dist = 28 + Math.random() * 30;
      gsap.to(p, {
        x: Math.cos(ang) * dist, y: Math.sin(ang) * dist, opacity: 0, scale: 0.2,
        duration: 0.6 + Math.random() * 0.3, ease: 'power2.out', onComplete: () => p.remove(),
      });
    }
  }

  function fly(r) {
    const d = dock.getBoundingClientRect();
    const sx = r.left + r.width / 2, sy = r.top + r.height / 2;
    const dot = document.createElement('span');
    dot.className = 'mn-fly';
    dot.style.left = sx + 'px';
    dot.style.top = sy + 'px';
    document.body.appendChild(dot);
    gsap.to(dot, {
      x: d.left + 46 - sx, y: d.bottom - 30 - sy, scale: 0.4, duration: 0.75, ease: 'power2.in',
      onComplete: () => {
        dot.remove();
        gsap.fromTo(bag, { scale: 1.35 }, { scale: 1, duration: 0.5, ease: 'back.out(3)', clearProps: 'transform' });
      },
    });
  }

  // ---------- Keranjang ----------
  function updateBar() {
    const { n, t } = totals();
    countEl.textContent = n;
    totalEl.textContent = rupiah(t);
    bar.classList.toggle('is-empty', n === 0);
    if (n === 0 && sheetOpen) closeSheet();
  }

  function change(id, delta, src) {
    const rect = src ? src.getBoundingClientRect() : null; // ambil posisi sebelum tombol diganti
    const q = Math.max(0, qtyOf(id) + delta);
    if (q) cart.set(id, q); else cart.delete(id);

    const card = grid.querySelector(`[data-id="${id}"]`);
    if (card) {
      card.classList.toggle('is-in', q > 0);
      card.querySelector('.mn-ctrl').innerHTML = ctrlHtml(id);
      if (!reduced && delta > 0) {
        gsap.fromTo(card.querySelector('.mn-icon'), { rotate: -25, scale: 0.7 }, { rotate: 0, scale: 1, duration: 0.6, ease: 'back.out(2.5)', clearProps: 'transform' });
        const qe = card.querySelector('.mn-qty');
        if (qe) gsap.fromTo(qe, { scale: 1.6 }, { scale: 1, duration: 0.4, ease: 'back.out(3)', clearProps: 'transform' });
      }
    }
    updateBar();
    if (delta > 0 && rect && !reduced) { burst(rect); fly(rect); }
    if (sheetOpen) renderSheet();
  }

  function renderSheet() {
    const rows = [...cart].map(([id, q]) => {
      const it = byId.get(id);
      return `<li data-id="${id}">
        <div><strong>${it.name}</strong><small>${rupiah(it.price)} × ${q} = ${rupiah(it.price * q)}</small></div>
        <div class="mn-ctrl">${ctrlHtml(id)}</div>
      </li>`;
    }).join('');
    sheet.innerHTML = `
      <ul>${rows}</ul>
      <div class="mn-sheet__foot">
        <button class="mini-btn" type="button" data-act="clear">Kosongkan</button>
        <span>Total <strong>${rupiah(totals().t)}</strong></span>
      </div>`;
  }

  function openSheet() {
    renderSheet();
    sheet.hidden = false;
    sheetOpen = true;
    sheetBtn.setAttribute('aria-expanded', 'true');
    if (!reduced) gsap.from(sheet, { y: 24, opacity: 0, duration: 0.4, ease: 'power3.out', clearProps: 'transform,opacity' });
  }
  function closeSheet() {
    sheet.hidden = true;
    sheetOpen = false;
    sheetBtn.setAttribute('aria-expanded', 'false');
  }

  function send() {
    if (!cart.size) return;
    const lines = [...cart].map(([id, q]) => `- ${q}x ${byId.get(id).name} (${rupiah(byId.get(id).price * q)})`);
    const msg = `Halo Tanspace, saya mau pesan:\n${lines.join('\n')}\nTotal: ${rupiah(totals().t)}`;
    window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
  }

  // ---------- Event ----------
  root.addEventListener('click', (e) => {
    const tab = e.target.closest('.mn-tab');
    if (tab) {
      if (tab.dataset.cat === current) return;
      current = tab.dataset.cat;
      tabsEl.querySelectorAll('.mn-tab').forEach((t) => t.setAttribute('aria-selected', String(t === tab)));
      moveInd(true);
      renderGrid(true);
      ScrollTrigger.refresh();
      return;
    }

    const act = e.target.closest('[data-act]');
    if (!act) return;
    const a = act.dataset.act;
    const id = act.closest('[data-id]')?.dataset.id;

    if ((a === 'add' || a === 'inc') && id) change(id, 1, act);
    else if (a === 'dec' && id) change(id, -1);
    else if (a === 'sheet') (sheetOpen ? closeSheet() : openSheet());
    else if (a === 'send') send();
    else if (a === 'clear') { cart.clear(); renderGrid(false); updateBar(); closeSheet(); }
  });

  window.addEventListener('resize', () => moveInd(false));
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => moveInd(false));

  renderGrid(false);
  moveInd(false);
}