// Denah meja interaktif + mode admin (ubah status meja)
import gsap from 'gsap';
import {
  rooms, statusOf, getSelected, setSelected,
  isAdmin, loginAdmin, logoutAdmin, setStatus, freeAll, resetStatus, busyMap,
} from '../data/rooms.js';

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const toInput = (u) => (/^\d{1,2}[.:]\d{2}$/.test(u || '') ? u.replace('.', ':').padStart(5, '0') : '');

function copyText(text) {
  const fallback = () => {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch { /* abaikan */ }
    ta.remove();
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).catch(fallback);
  } else {
    fallback();
  }
}

export function initInterior() {
  const root = document.getElementById('interior-app');
  if (!root) return;

  let current = rooms[0].id;
  let showLogin = false;

  root.innerHTML = `
    <div class="venue__top">
      <div class="venue__tabs" role="tablist" aria-label="Pilih ruangan">
        ${rooms.map((r) => `<button class="venue__tab" type="button" role="tab" data-room="${r.id}" aria-selected="${r.id === current}">${r.name}</button>`).join('')}
      </div>
      <div class="admin-box" id="admin-box"></div>
    </div>
    <div class="venue__layout">
      <div class="venue__stage">
        <div class="plan-wrap"><div class="plan" id="plan"></div></div>
        <ul class="legend" aria-label="Keterangan warna">
          <li><i style="background:var(--free)"></i>Kosong</li>
          <li><i style="background:var(--busy)"></i>Terisi</li>
        </ul>
      </div>
      <aside class="venue__side" id="venue-side" aria-live="polite"></aside>
    </div>`;

  const plan = root.querySelector('#plan');
  const side = root.querySelector('#venue-side');
  const adminBox = root.querySelector('#admin-box');
  const tabs = root.querySelectorAll('.venue__tab');
  const roomOf = () => rooms.find((r) => r.id === current);

  // ---------- Kotak admin (tombol / form PIN) ----------
  function renderAdminBox() {
    if (isAdmin()) {
      adminBox.innerHTML = '<span class="admin-pill">Mode Admin</span><button class="mini-btn" type="button" data-admin="logout">Keluar</button>';
    } else if (showLogin) {
      adminBox.innerHTML = `
        <form class="admin-form" id="admin-form">
          <input type="password" id="admin-pin" placeholder="PIN admin" autocomplete="off" aria-label="PIN admin" />
          <button class="mini-btn mini-btn--solid" type="submit">Masuk</button>
        </form>
        <span class="admin-err" id="admin-err" hidden>PIN salah</span>`;
      adminBox.querySelector('#admin-pin').focus();
    } else {
      adminBox.innerHTML = '<button class="mini-btn" type="button" data-admin="open">Admin</button>';
    }
  }

  // ---------- Denah ----------
  function renderPlan(animate) {
    const room = roomOf();
    const sel = getSelected();
    plan.innerHTML =
      room.deco.map((d) => `<div class="deco deco--${d.cls}" style="left:${d.x}%;top:${d.y}%;width:${d.w}%;height:${d.h}%">${d.label || ''}</div>`).join('') +
      room.tables.map((t) => {
        const s = statusOf(t.id);
        const cls = ['tbl', s.busy ? 'is-busy' : 'is-free', t.shape === 'round' ? 'is-round' : '', t.id === sel ? 'is-selected' : ''].join(' ');
        return `<button type="button" class="${cls}" data-id="${t.id}" style="left:${t.x}%;top:${t.y}%;width:${t.w}%;height:${t.h}%" aria-label="Meja ${t.id}, ${t.seats} kursi, ${s.busy ? 'terisi' : 'kosong'}">
          <span class="tbl__id">${t.id}</span>${t.w >= 12 ? `<span class="tbl__seats">${t.seats} kursi</span>` : ''}
        </button>`;
      }).join('');

    if (animate && !reduced) {
      gsap.from(plan.querySelectorAll('.tbl'), {
        scale: 0.3, opacity: 0, stagger: 0.05, duration: 0.55, ease: 'back.out(1.8)', clearProps: 'transform,opacity',
      });
      gsap.from(plan.querySelectorAll('.deco'), { opacity: 0, duration: 0.5, clearProps: 'opacity' });
    }
  }

  // ---------- Panel kanan ----------
  function pickHtml(room) {
    const t = room.tables.find((x) => x.id === getSelected());
    if (!t) return '<p class="pick__hint">Klik salah satu meja di denah untuk melihat detailnya.</p>';
    const s = statusOf(t.id);
    return `
      <h4>Meja ${t.id} <span class="badge ${s.busy ? 'is-busy' : 'is-free'}">${s.busy ? 'Terisi' : 'Kosong'}</span></h4>
      <p class="pick__meta">${t.seats} kursi${t.note ? ' · ' + t.note : ''}</p>
      ${s.busy
        ? `<p class="pick__meta">${s.reserved ? 'Dipesan jam ' + s.from + ' – ' + s.until + '.' : s.until ? 'Perkiraan kosong sekitar jam ' + s.until + '.' : 'Sedang terisi.'}</p>`
        : '<button class="btn btn--primary" type="button" data-go="reservasi">Pesan meja ini</button>'}`;
  }

  function adminHtml(room) {
    const t = room.tables.find((x) => x.id === getSelected());
    const s = t ? statusOf(t.id) : null;
    return `
      <div class="admin-tools">
        <p class="eyebrow">Panel admin</p>
        ${t ? `
          <p class="pick__meta">Ubah status Meja ${t.id}:</p>
          <div class="seg">
            <button type="button" class="seg__btn ${!s.busy ? 'is-on is-free' : ''}" data-set="free">Kosong</button>
            <button type="button" class="seg__btn ${s.busy ? 'is-on is-busy' : ''}" data-set="busy">Terisi</button>
          </div>
          <label class="time-field">Perkiraan kosong jam <input type="time" id="until" value="${toInput(s.until)}"></label>`
          : '<p class="pick__meta">Klik meja di denah untuk mengubah statusnya.</p>'}
        <div class="admin-actions">
          <button class="mini-btn" type="button" data-bulk>Kosongkan semua meja di ruangan ini</button>
          <button class="mini-btn" type="button" data-copy>Salin data meja</button>
          <button class="mini-btn" type="button" data-reset>Reset perubahan</button>
        </div>
      </div>`;
  }

  function renderSide() {
    const room = roomOf();
    const total = room.tables.length;
    const free = room.tables.filter((t) => !statusOf(t.id).busy).length;
    side.innerHTML = `
      <p class="eyebrow">${room.tag}</p>
      <h3>${room.name}</h3>
      <p class="venue__desc">${room.desc}</p>
      <div class="meter">
        <div class="meter__bar"><span style="width:${(free / total) * 100}%"></span></div>
        <p><strong>${free}</strong> dari ${total} meja kosong</p>
      </div>
      <ul class="perks">${room.perks.map((p) => `<li>${p}</li>`).join('')}</ul>
      <div class="pick">${pickHtml(room)}</div>
      ${isAdmin() ? adminHtml(room) : ''}`;
    if (!reduced) gsap.from(side.querySelectorAll('.pick > *'), { y: 12, opacity: 0, duration: 0.35, stagger: 0.05, clearProps: 'transform,opacity' });
  }

  // ---------- Event ----------
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      current = tab.dataset.room;
      tabs.forEach((t) => t.setAttribute('aria-selected', String(t === tab)));
      renderPlan(true);
      renderSide();
    });
  });

  root.addEventListener('click', (e) => {
    const tbl = e.target.closest('.tbl');
    if (tbl) { setSelected(tbl.dataset.id); return; }

    if (e.target.closest('[data-go]')) {
      document.getElementById('reservasi')?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
      return;
    }

    const adm = e.target.closest('[data-admin]');
    if (adm) {
      if (adm.dataset.admin === 'open') { showLogin = true; renderAdminBox(); }
      if (adm.dataset.admin === 'logout') { showLogin = false; logoutAdmin(); }
      return;
    }

    const set = e.target.closest('[data-set]');
    if (set) {
      const id = getSelected();
      if (!id) return;
      const busy = set.dataset.set === 'busy';
      const time = (root.querySelector('#until')?.value || '').replace(':', '.');
      setStatus(id, busy, busy ? time : '');
      return;
    }

    if (e.target.closest('[data-bulk]')) {
      freeAll(roomOf().tables.map((t) => t.id));
      return;
    }

    const copy = e.target.closest('[data-copy]');
    if (copy) {
      const lines = Object.entries(busyMap()).map(([id, u]) => `  ${id}: '${u}',`);
      copyText(`const demoBusy = {\n${lines.join('\n')}\n};`);
      copy.textContent = 'Tersalin!';
      setTimeout(() => { copy.textContent = 'Salin data meja'; }, 1600);
      return;
    }

    if (e.target.closest('[data-reset]')) {
      if (confirm('Hapus semua perubahan admin di browser ini?')) resetStatus();
    }
  });

  // Login admin
  root.addEventListener('submit', (e) => {
    if (e.target.id !== 'admin-form') return;
    e.preventDefault();
    if (loginAdmin(root.querySelector('#admin-pin').value)) {
      showLogin = false;
    } else {
      root.querySelector('#admin-err').hidden = false;
    }
  });

  // Ubah jam perkiraan kosong
  root.addEventListener('change', (e) => {
    if (e.target.id !== 'until') return;
    const id = getSelected();
    if (id && statusOf(id).busy) setStatus(id, true, e.target.value.replace(':', '.'));
  });

  window.addEventListener('tanspace:select', () => {
    plan.querySelectorAll('.tbl').forEach((b) => b.classList.toggle('is-selected', b.dataset.id === getSelected()));
    renderSide();
  });
  window.addEventListener('tanspace:bookings', () => { renderPlan(false); renderSide(); });
  window.addEventListener('tanspace:admin', () => { renderAdminBox(); renderSide(); });

  renderAdminBox();
  renderPlan(false);
  renderSide();
}