// Data ruangan & meja Tanspace
// Posisi (x, y, w, h) dalam persen dari kotak denah (rasio 16:10).
// Status "terisi" di bawah ini adalah data contoh (demo).

const stool = (id, x, y, note) => ({ id, x, y, w: 7, h: 11.2, seats: 1, shape: 'round', note });

export const rooms = [
  {
    id: 'working',
    name: 'Ruang Working',
    tag: 'Fokus & kerja',
    desc: 'Meja lebar dengan colokan di setiap meja dan Wi-Fi paling kencang. Suasananya tenang, tanpa musik keras.',
    perks: ['Colokan tiap meja', 'Wi-Fi cepat', 'Area tenang'],
    deco: [
      { cls: 'window', x: 6, y: 0, w: 88, h: 3 },
      { cls: 'door', x: 86, y: 94, w: 10, h: 6, label: 'Pintu' },
    ],
    tables: [
      { id: 'A1', x: 6, y: 10, w: 26, h: 16, seats: 2, note: 'Dekat jendela' },
      { id: 'A2', x: 37, y: 10, w: 26, h: 16, seats: 2, note: 'Dekat jendela' },
      { id: 'A3', x: 68, y: 10, w: 26, h: 16, seats: 2, note: 'Dekat jendela' },
      { id: 'A4', x: 6, y: 36, w: 26, h: 16, seats: 2 },
      { id: 'A5', x: 37, y: 36, w: 26, h: 16, seats: 4 },
      { id: 'A6', x: 68, y: 36, w: 26, h: 16, seats: 2 },
      { id: 'A7', x: 6, y: 64, w: 56, h: 20, seats: 8, note: 'Meja panjang untuk kerja bareng' },
      { id: 'A8', x: 68, y: 64, w: 26, h: 20, seats: 4 },
    ],
  },
  {
    id: 'bar',
    name: 'Coffee Bar',
    tag: 'Dekat barista',
    desc: 'Duduk di depan barista dan lihat kopimu diseduh langsung. Cocok untuk ngobrol santai atau minum cepat.',
    perks: ['Depan barista', 'Musik santai', 'Meja kecil'],
    deco: [
      { cls: 'bar', x: 6, y: 6, w: 88, h: 10, label: 'Bar' },
      { cls: 'door', x: 86, y: 94, w: 10, h: 6, label: 'Pintu' },
    ],
    tables: [
      stool('B1', 12, 20, 'Kursi bar'),
      stool('B2', 26, 20, 'Kursi bar'),
      stool('B3', 40, 20, 'Kursi bar'),
      stool('B4', 54, 20, 'Kursi bar'),
      stool('B5', 68, 20, 'Kursi bar'),
      { id: 'B6', x: 6, y: 50, w: 24, h: 18, seats: 2 },
      { id: 'B7', x: 38, y: 50, w: 24, h: 18, seats: 2 },
      { id: 'B8', x: 68, y: 48, w: 26, h: 24, seats: 4 },
    ],
  },
  {
    id: 'lounge',
    name: 'Sudut Santai',
    tag: 'Ngobrol & kumpul',
    desc: 'Sofa empuk dan cahaya hangat untuk ngobrol panjang bersama teman atau keluarga.',
    perks: ['Sofa empuk', 'Cocok rombongan', 'Cahaya hangat'],
    deco: [
      { cls: 'rug', x: 4, y: 8, w: 92, h: 84 },
      { cls: 'window', x: 6, y: 0, w: 88, h: 3 },
      { cls: 'door', x: 86, y: 94, w: 10, h: 6, label: 'Pintu' },
    ],
    tables: [
      { id: 'C1', x: 6, y: 12, w: 28, h: 24, seats: 4, note: 'Sofa' },
      { id: 'C2', x: 40, y: 12, w: 22, h: 24, seats: 2 },
      { id: 'C3', x: 68, y: 12, w: 26, h: 24, seats: 4, note: 'Sofa' },
      { id: 'C4', x: 6, y: 48, w: 28, h: 22, seats: 6, note: 'Sofa besar' },
      { id: 'C5', x: 42, y: 52, w: 14, h: 22.4, seats: 2, shape: 'round' },
      { id: 'C6', x: 66, y: 48, w: 28, h: 22, seats: 4, note: 'Sofa' },
    ],
  },
];

// Meja yang terisi (contoh) = perkiraan jam kosong
// Bagian ini bisa diganti dengan hasil tombol "Salin data meja" di mode admin.
const demoBusy = {
  A2: '15.30', A5: '16.00', A6: '14.45',
  B2: '15.15', B7: '17.00',
  C1: '16.30', C4: '15.45',
};

// PIN admin (ganti sesuai keinginanmu)
const ADMIN_PIN = '1234';

const KEY_BOOK = 'tanspace-bookings';
const KEY_OVR = 'tanspace-status';
const KEY_ADMIN = 'tanspace-admin';

function read(key) {
  try { return JSON.parse(localStorage.getItem(key)) || {}; } catch { return {}; }
}
function write(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* abaikan */ }
}
const notify = () => window.dispatchEvent(new CustomEvent('tanspace:bookings'));

// ---------- Pemesanan (disimpan di browser) ----------
export function getBookings() { return read(KEY_BOOK); }

export function book(id, info) {
  const all = getBookings();
  all[id] = info;
  write(KEY_BOOK, all);
  notify();
}

// ---------- Reservasi (disimpan di browser) ----------
const KEY_RES = 'tanspace-reservations';

export function todayStr(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// "15.30" atau "15:30" -> menit sejak tengah malam
export function toMin(s) {
  const m = /^(\d{1,2})[.:](\d{2})$/.exec(s || '');
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

// menit -> "15.30"
export function fmtMin(n) {
  const p = (x) => String(x).padStart(2, '0');
  return `${p(Math.floor(n / 60))}.${p(n % 60)}`;
}

export function getReservations() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY_RES));
    return Array.isArray(v) ? v : [];
  } catch { return []; }
}

export function addReservation(info) {
  const item = { ...info, id: 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5) };
  try { localStorage.setItem(KEY_RES, JSON.stringify([...getReservations(), item])); } catch { /* abaikan */ }
  notify();
  return item;
}

export function removeReservation(rid) {
  try { localStorage.setItem(KEY_RES, JSON.stringify(getReservations().filter((r) => r.id !== rid))); } catch { /* abaikan */ }
  notify();
}

// Apakah meja kosong untuk tanggal + jam + durasi tertentu? (start & dur dalam menit)
export function isTableFree(id, date, start, dur) {
  const end = start + dur;
  if (getReservations().some((r) => r.table === id && r.date === date && start < r.end && end > r.start)) return false;
  if (date === todayStr()) {
    const o = read(KEY_OVR)[id];
    const busy = o ? o.busy : !!demoBusy[id];
    const until = o ? o.until : demoBusy[id];
    if (busy) {
      const u = toMin(until);
      if (u === null || start < u) return false;
    }
  }
  return true;
}

// Urutan prioritas: perubahan admin > reservasi hari ini > data contoh
export function statusOf(id) {
  const o = read(KEY_OVR)[id];
  if (o) return o.busy ? { busy: true, until: o.until || '', edited: true } : { busy: false, edited: true };

  const n = new Date();
  const nowMin = n.getHours() * 60 + n.getMinutes();
  const today = todayStr();
  const r = getReservations()
    .filter((x) => x.table === id && x.date === today && x.end > nowMin)
    .sort((a, b) => a.start - b.start)[0];
  if (r) return { busy: true, reserved: true, from: fmtMin(r.start), until: fmtMin(r.end) };

  if (demoBusy[id]) return { busy: true, until: demoBusy[id] };
  return { busy: false };
}

// Daftar meja yang sedang terisi (untuk disalin ke demoBusy)
export function busyMap() {
  const map = {};
  rooms.forEach((r) => r.tables.forEach((t) => {
    const s = statusOf(t.id);
    if (s.busy) map[t.id] = s.until || '';
  }));
  return map;
}

// Admin: ubah status satu meja (busy = true/false, until = jam kosong "15.30")
export function setStatus(id, busy, until = '') {
  const all = read(KEY_OVR);
  all[id] = busy ? { busy: true, until } : { busy: false };
  write(KEY_OVR, all);
  notify();
}

// Admin: tandai semua meja kosong (menimpa data contoh & reservasi hari ini)
export function freeAll() {
  const all = {};
  rooms.forEach((r) => r.tables.forEach((t) => { all[t.id] = { busy: false }; }));
  write(KEY_OVR, all);
  notify();
}

// Admin: hapus semua perubahan manual, kembali ke reservasi & data contoh
export function resetStatus() {
  try { localStorage.removeItem(KEY_OVR); } catch { /* abaikan */ }
  notify();
}

// ---------- Admin ----------
export function isAdmin() {
  try { return sessionStorage.getItem(KEY_ADMIN) === '1'; } catch { return false; }
}
export function loginAdmin(pin) {
  if (pin !== ADMIN_PIN) return false;
  try { sessionStorage.setItem(KEY_ADMIN, '1'); } catch { /* abaikan */ }
  window.dispatchEvent(new CustomEvent('tanspace:admin'));
  return true;
}
export function logoutAdmin() {
  try { sessionStorage.removeItem(KEY_ADMIN); } catch { /* abaikan */ }
  window.dispatchEvent(new CustomEvent('tanspace:admin'));
}

// ---------- Meja yang sedang dipilih ----------
let selected = null;
export const getSelected = () => selected;
export function setSelected(id) {
  selected = id;
  window.dispatchEvent(new CustomEvent('tanspace:select', { detail: id }));
}