// Reservasi: form bertahap, ringkasan, validasi, konfirmasi, dan daftar admin
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  rooms, statusOf, isTableFree, addReservation, removeReservation, getReservations,
  todayStr, fmtMin, isAdmin, getSelected, setSelected,
} from '../data/rooms.js';
import { CAFE } from '../data/config.js';

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const MAX_PEOPLE = 8;

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const dateObj = (v) => new Date(v + 'T00:00:00');
const dateLong = (v) => dateObj(v).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' });
const dateShort = (v) => dateObj(v).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });

export function initReservation() {
  const root = document.getElementById('reserve-app');
  if (!root) return;

  const state = {
    room: rooms[0].id, date: todayStr(), start: null, dur: 2,
    people: 2, table: null, name: '', phone: '', note: '',
  };
  let notice = '';

  root.innerHTML = `
    <div class="rsv__grid">
      <form class="rsv__form" id="rsv-form" novalidate>
        <section class="rsv-step" data-step="1">
          <header class="rsv-step__head"><span class="rsv-num">1</span><h3>Pilih ruangan</h3></header>
          <div class="rsv-rooms" id="rsv-rooms"></div>
        </section>

        <section class="rsv-step" data-step="2">
          <header class="rsv-step__head"><span class="rsv-num">2</span><h3>Kapan dan berapa orang?</h3></header>
          <p class="rsv-label">Tanggal</p>
          <div class="rsv-dates" id="rsv-dates"></div>
          <p class="rsv-label">Jam mulai</p>
          <div class="rsv-times" id="rsv-times"></div>
          <div class="rsv-row">
            <div>
              <p class="rsv-label">Durasi</p>
              <div class="seg seg--3" id="rsv-dur"></div>
            </div>
            <div>
              <p class="rsv-label">Jumlah orang</p>
              <div class="rsv-people">
                <button class="mn-step" type="button" data-people="-1" aria-label="Kurangi">−</button>
                <span class="mn-qty" id="rsv-pcount">2</span>
                <button class="mn-step" type="button" data-people="1" aria-label="Tambah">+</button>
              </div>
            </div>
          </div>
        </section>

        <section class="rsv-step" data-step="3">
          <header class="rsv-step__head"><span class="rsv-num">3</span><h3>Pilih meja</h3></header>
          <p class="rsv-hint" id="rsv-tablehint"></p>
          <div class="rsv-tables" id="rsv-tables"></div>
        </section>

        <section class="rsv-step" data-step="4">
          <header class="rsv-step__head"><span class="rsv-num">4</span><h3>Data dirimu</h3></header>
          <div class="rsv-fields">
            <label class="rsv-field"><span>Nama</span><input id="rsv-name" type="text" autocomplete="name" placeholder="Nama lengkap" maxlength="60"></label>
            <label class="rsv-field"><span>Nomor HP / WhatsApp</span><input id="rsv-phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="08xxxxxxxxxx" maxlength="20"></label>
            <label class="rsv-field rsv-field--wide"><span>Catatan (opsional)</span><textarea id="rsv-note" rows="2" maxlength="160" placeholder="Misal: ulang tahun, butuh colokan, kursi bayi"></textarea></label>
          </div>
        </section>
      </form>

      <aside class="rsv__sum" aria-live="polite">
        <div class="rsv-sum__top"><p class="eyebrow">Ringkasan</p><span id="sum-step">1/4</span></div>
        <div class="rsv-prog"><span id="sum-prog"></span></div>
        <dl class="rsv-sum__list">
          <div><dt>Ruangan</dt><dd id="sum-room"></dd></div>
          <div><dt>Tanggal</dt><dd id="sum-date"></dd></div>
          <div><dt>Jam</dt><dd id="sum-time"></dd></div>
          <div><dt>Meja</dt><dd id="sum-table"></dd></div>
          <div><dt>Jumlah</dt><dd id="sum-people"></dd></div>
          <div><dt>Atas nama</dt><dd id="sum-name"></dd></div>
        </dl>
        <button class="btn btn--primary rsv-submit" id="rsv-submit" type="submit" form="rsv-form" disabled>Konfirmasi reservasi</button>
        <p class="rsv-sum__hint" id="sum-hint"></p>
        <p class="rsv-sum__note">Demo: data tersimpan di browser ini. Konfirmasi final lewat WhatsApp.</p>
      </aside>
    </div>
    <div class="rsv-done" id="rsv-done" hidden></div>
    <div class="rsv-admin" id="rsv-admin" hidden></div>`;

  const el = {
    rooms: root.querySelector('#rsv-rooms'),
    dates: root.querySelector('#rsv-dates'),
    times: root.querySelector('#rsv-times'),
    dur: root.querySelector('#rsv-dur'),
    pcount: root.querySelector('#rsv-pcount'),
    tables: root.querySelector('#rsv-tables'),
    tableHint: root.querySelector('#rsv-tablehint'),
    submit: root.querySelector('#rsv-submit'),
    done: root.querySelector('#rsv-done'),
    admin: root.querySelector('#rsv-admin'),
  };
  const form = root.querySelector('#rsv-form');

  // ---------- Bantuan ----------
  const roomObj = () => rooms.find((r) => r.id === state.room);
  const tableObj = () => {
    for (const r of rooms) {
      const t = r.tables.find((x) => x.id === state.table);
      if (t) return t;
    }
    return null;
  };
  const durMin = () => state.dur * 60;
  const nameOk = () => state.name.trim().length >= 2;
  const phoneOk = () => { const d = state.phone.replace(/\D/g, ''); return d.length >= 9 && d.length <= 15; };
  const pop = (node) => {
    if (node && !reduced) gsap.fromTo(node, { scale: 0.86 }, { scale: 1, duration: 0.45, ease: 'back.out(3)', clearProps: 'transform' });
  };

  function dateList() {
    const out = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      out.push({
        value: todayStr(d),
        dow: i === 0 ? 'Hari ini' : i === 1 ? 'Besok' : DAYS[d.getDay()],
        num: d.getDate(),
        mon: d.toLocaleDateString('id-ID', { month: 'short' }),
      });
    }
    return out;
  }
  const DATES = dateList();

  function slotBlock(m) {
    const n = new Date();
    if (state.date === todayStr() && m <= n.getHours() * 60 + n.getMinutes()) return true;
    return m + durMin() > CAFE.close * 60;
  }

  // Bersihkan pilihan meja jika sudah tidak cocok
  function syncTable() {
    if (!state.table) return;
    const t = tableObj();
    if (!t || !roomObj().tables.some((x) => x.id === t.id)) { state.table = null; return; }
    if (t.seats < state.people) {
      notice = `Meja ${t.id} hanya ${t.seats} kursi. Pilih meja lain.`;
      state.table = null;
      return;
    }
    if (state.start === null) return;
    if (!isTableFree(t.id, state.date, state.start, durMin())) {
      notice = `Meja ${t.id} tidak tersedia di jam itu. Pilih meja lain.`;
      state.table = null;
    }
  }

  // ---------- Render ----------
  function renderRooms() {
    el.rooms.innerHTML = rooms.map((r) => {
      const free = state.start === null
        ? `${r.tables.length} meja`
        : `${r.tables.filter((t) => isTableFree(t.id, state.date, state.start, durMin())).length} meja kosong`;
      const on = r.id === state.room;
      return `<button type="button" class="rsv-room${on ? ' is-on' : ''}" data-room="${r.id}" aria-pressed="${on}">
        <strong>${r.name}</strong><small>${r.tag}</small><span class="rsv-room__free">${free}</span></button>`;
    }).join('');
  }

  function renderDates() {
    el.dates.innerHTML = DATES.map((d) => {
      const on = d.value === state.date;
      return `<button type="button" class="rsv-date${on ? ' is-on' : ''}" data-date="${d.value}" aria-pressed="${on}">
        <small>${d.dow}</small><b>${d.num}</b><small>${d.mon}</small></button>`;
    }).join('');
  }

  function renderTimes() {
    const slots = [];
    for (let h = CAFE.open; h < CAFE.close; h++) slots.push(h * 60);
    let open = 0;
    const html = slots.map((m) => {
      const block = slotBlock(m);
      if (!block) open++;
      const on = state.start === m;
      return `<button type="button" class="rsv-time${on ? ' is-on' : ''}" data-time="${m}" aria-pressed="${on}" ${block ? 'disabled' : ''}>${fmtMin(m)}</button>`;
    }).join('');
    el.times.innerHTML = html + (open === 0 ? '<p class="rsv-hint rsv-hint--wide">Tidak ada jam tersisa di tanggal ini. Coba tanggal lain atau durasi lebih pendek.</p>' : '');
  }

  function renderDur() {
    el.dur.innerHTML = [1, 2, 3].map((n) =>
      `<button type="button" class="seg__btn${state.dur === n ? ' is-on' : ''}" data-dur="${n}" aria-pressed="${state.dur === n}">${n} jam</button>`).join('');
  }

  function renderPeople() { el.pcount.textContent = state.people; }

  function renderTables() {
    const room = roomObj();
    const ready = state.start !== null;
    el.tableHint.textContent = notice
      || (ready ? `${room.name}: pilih salah satu meja hijau.` : 'Pilih tanggal dan jam dulu, nanti meja yang kosong akan muncul di sini.');
    el.tableHint.classList.toggle('is-warn', !!notice);
    el.tables.innerHTML = room.tables.map((t) => {
      const free = ready && isTableFree(t.id, state.date, state.start, durMin());
      const small = t.seats < state.people;
      const disabled = !ready || !free || small;
      const status = !ready ? 'is-wait' : free ? 'is-free' : 'is-busy';
      const sub = !ready ? `${t.seats} kursi` : !free ? 'Terisi' : small ? 'Kursi kurang' : `${t.seats} kursi`;
      const on = state.table === t.id;
      return `<button type="button" class="rsv-table ${status}${on ? ' is-on' : ''}" data-table="${t.id}" aria-pressed="${on}" ${disabled ? 'disabled' : ''}>
        <i></i><b>${t.id}</b><small>${sub}</small>${t.note ? `<em>${t.note}</em>` : ''}</button>`;
    }).join('');
  }

  function setText(id, text, flash = true) {
    const node = root.querySelector('#' + id);
    if (node.textContent === text) return;
    node.textContent = text;
    if (flash && !reduced) gsap.fromTo(node, { y: 6, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: 'power2.out', clearProps: 'transform,opacity' });
  }

  function missing() {
    const m = [];
    if (state.start === null) m.push('pilih jam');
    if (!state.table) m.push('pilih meja');
    if (!nameOk()) m.push('isi nama');
    if (!phoneOk()) m.push('isi nomor HP');
    return m;
  }

  function updateSummary() {
    const t = tableObj();
    const s2 = state.start !== null, s3 = !!state.table, s4 = nameOk() && phoneOk();
    const done = 1 + (s2 ? 1 : 0) + (s3 ? 1 : 0) + (s4 ? 1 : 0);
    [true, s2, s3, s4].forEach((v, i) => root.querySelector(`[data-step="${i + 1}"]`).classList.toggle('is-done', v));

    setText('sum-room', roomObj().name);
    setText('sum-date', dateLong(state.date));
    setText('sum-time', s2 ? `${fmtMin(state.start)} – ${fmtMin(state.start + durMin())}` : '—');
    setText('sum-table', t ? `Meja ${t.id} · ${t.seats} kursi` : '—');
    setText('sum-people', `${state.people} orang`);
    setText('sum-name', state.name.trim() || '—', false);
    setText('sum-step', `${done}/4`, false);
    root.querySelector('#sum-prog').style.width = `${(done / 4) * 100}%`;

    const miss = missing();
    el.submit.disabled = miss.length > 0;
    setText('sum-hint', miss.length ? `Tinggal: ${miss.join(', ')}.` : 'Semua sudah lengkap. Klik untuk mengonfirmasi.', false);
  }

  function renderAdmin() {
    if (!isAdmin()) { el.admin.hidden = true; el.admin.innerHTML = ''; return; }
    const list = getReservations().sort((a, b) => a.date.localeCompare(b.date) || a.start - b.start);
    el.admin.hidden = false;
    el.admin.innerHTML = `
      <p class="eyebrow">Panel admin</p>
      <h3>Daftar reservasi</h3>
      ${list.length ? `<ul class="rsv-admin__list">${list.map((r) => `
        <li>
          <div><strong>${esc(r.name)}</strong><small>${esc(r.phone)} · ${r.people} orang${r.note ? ' · ' + esc(r.note) : ''}</small></div>
          <div class="rsv-admin__when"><b>Meja ${esc(r.table)} · ${esc(r.code)}</b><small>${dateShort(r.date)} · ${fmtMin(r.start)}–${fmtMin(r.end)}</small></div>
          <button class="mini-btn" type="button" data-del="${r.id}">Hapus</button>
        </li>`).join('')}</ul>` : '<p class="pick__hint">Belum ada reservasi.</p>'}`;
  }

  function renderAll() {
    renderRooms(); renderDates(); renderTimes(); renderDur(); renderPeople(); renderTables(); updateSummary();
  }

  function after(container) {
    notice = '';
    syncTable();
    renderAll();
    if (container) pop(container.querySelector('.is-on'));
  }

  // ---------- Konfirmasi ----------
  function confetti() {
    if (reduced) return;
    const colors = ['#ff5a1f', '#111111', '#F5EFE6', '#2fa36b'];
    for (let i = 0; i < 46; i++) {
      const p = document.createElement('span');
      p.className = 'rsv-conf';
      p.style.background = colors[i % colors.length];
      document.body.appendChild(p);
      const ang = Math.random() * Math.PI * 2;
      const dist = 120 + Math.random() * 260;
      gsap.fromTo(p, { x: 0, y: 0, rotate: 0 }, {
        x: Math.cos(ang) * dist, y: Math.sin(ang) * dist + 220, rotate: Math.random() * 720 - 360,
        opacity: 0, duration: 1.4 + Math.random() * 0.8, ease: 'power2.out', onComplete: () => p.remove(),
      });
    }
  }

  function waMessage(r) {
    const lines = [
      'Halo Tanspace, saya mau konfirmasi reservasi:',
      `Kode: ${r.code}`,
      `Nama: ${r.name}`,
      `Ruangan: ${r.roomName}`,
      `Meja: ${r.table}`,
      `Tanggal: ${dateLong(r.date)}`,
      `Jam: ${fmtMin(r.start)} - ${fmtMin(r.end)}`,
      `Jumlah: ${r.people} orang`,
    ];
    if (r.note) lines.push(`Catatan: ${r.note}`);
    return lines.join('\n');
  }

  function showDone(r) {
    root.classList.add('is-done');
    el.done.hidden = false;
    el.done.dataset.msg = waMessage(r);
    el.done.innerHTML = `
      <div class="rsv-check">
        <svg viewBox="0 0 52 52" width="76" height="76" aria-hidden="true">
          <circle cx="26" cy="26" r="24" fill="none" stroke="currentColor" stroke-width="2.5"/>
          <path d="M15 27l8 8 15-17" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <p class="eyebrow">Reservasi berhasil</p>
      <h3>Sampai jumpa, ${esc(r.name.split(' ')[0])}!</h3>
      <p class="rsv-code">${esc(r.code)}</p>
      <ul class="rsv-done__list">
        <li><span>Ruangan</span><b>${esc(r.roomName)}</b></li>
        <li><span>Meja</span><b>${esc(r.table)}</b></li>
        <li><span>Tanggal</span><b>${dateLong(r.date)}</b></li>
        <li><span>Jam</span><b>${fmtMin(r.start)} – ${fmtMin(r.end)}</b></li>
        <li><span>Jumlah</span><b>${r.people} orang</b></li>
      </ul>
      <div class="rsv-done__cta">
        <button class="btn btn--primary" type="button" data-act="wa">Kirim konfirmasi via WhatsApp</button>
        <button class="mini-btn" type="button" data-act="again">Buat reservasi lagi</button>
      </div>`;
    if (!reduced) gsap.from(el.done.children, { y: 24, opacity: 0, stagger: 0.07, duration: 0.6, ease: 'power3.out', clearProps: 'transform,opacity' });
    confetti();
    ScrollTrigger.refresh();
    el.done.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' });
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (missing().length) {
      if (!nameOk()) root.querySelector('#rsv-name').focus();
      else if (!phoneOk()) root.querySelector('#rsv-phone').focus();
      return;
    }
    const t = tableObj();
    if (!isTableFree(t.id, state.date, state.start, durMin())) { after(); return; }
    const room = roomObj();
    const item = addReservation({
      code: 'TSP-' + Math.random().toString(36).slice(2, 6).toUpperCase(),
      table: t.id, room: room.id, roomName: room.name,
      date: state.date, start: state.start, end: state.start + durMin(),
      people: state.people, name: state.name.trim(), phone: state.phone.trim(), note: state.note.trim(),
      created: Date.now(),
    });
    showDone(item);
  });

  // ---------- Event ----------
  root.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b || b.disabled) return;
    const d = b.dataset;

    if (d.room) {
      state.room = d.room;
      after(el.rooms);
      if (!reduced) gsap.from(el.tables.children, { y: 14, opacity: 0, stagger: 0.04, duration: 0.4, ease: 'power2.out', clearProps: 'transform,opacity' });
    } else if (d.date) {
      state.date = d.date;
      if (state.start !== null && slotBlock(state.start)) state.start = null;
      after(el.dates);
    } else if (d.time) {
      state.start = Number(d.time);
      after(el.times);
    } else if (d.dur) {
      state.dur = Number(d.dur);
      if (state.start !== null && slotBlock(state.start)) state.start = null;
      after(el.dur);
    } else if (d.people) {
      state.people = Math.min(MAX_PEOPLE, Math.max(1, state.people + Number(d.people)));
      after();
      pop(el.pcount);
    } else if (d.table) {
      state.table = d.table;
      notice = '';
      renderTables();
      updateSummary();
      pop(el.tables.querySelector('.is-on'));
      setSelected(d.table); // sinkron dengan denah Interior
    } else if (d.del) {
      removeReservation(d.del);
    } else if (d.act === 'wa') {
      window.open(`https://wa.me/${CAFE.wa}?text=${encodeURIComponent(el.done.dataset.msg || '')}`, '_blank', 'noopener');
    } else if (d.act === 'again') {
      state.start = null; state.table = null; state.note = ''; notice = '';
      root.querySelector('#rsv-note').value = '';
      root.classList.remove('is-done');
      el.done.hidden = true;
      renderAll();
      ScrollTrigger.refresh();
      root.scrollIntoView({ block: 'start', behavior: reduced ? 'auto' : 'smooth' });
    }
  });

  root.addEventListener('input', (e) => {
    const t = e.target;
    if (t.id === 'rsv-name') state.name = t.value;
    else if (t.id === 'rsv-phone') { t.value = t.value.replace(/[^\d+\s-]/g, ''); state.phone = t.value; }
    else if (t.id === 'rsv-note') state.note = t.value;
    else return;
    updateSummary();
  });

  // Meja dipilih dari denah Interior
  function adopt() {
    const id = getSelected();
    if (!id || id === state.table || statusOf(id).busy) return;
    const r = rooms.find((x) => x.tables.some((t) => t.id === id));
    if (!r) return;
    state.room = r.id;
    state.table = id;
    notice = '';
    syncTable();
    renderAll();
  }

  window.addEventListener('tanspace:select', adopt);
  window.addEventListener('tanspace:bookings', () => { notice = ''; syncTable(); renderAll(); renderAdmin(); });
  window.addEventListener('tanspace:admin', renderAdmin);

  renderAll();
  renderAdmin();
  adopt();
}