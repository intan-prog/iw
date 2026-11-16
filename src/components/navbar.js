// Navbar: toggle tema gelap/terang + menu mobile + efek saat scroll
export function initNavbar() {
  const root = document.documentElement;
  const nav = document.getElementById('nav');
  const themeBtn = document.getElementById('theme-toggle');
  const menuBtn = document.getElementById('menu-toggle');
  const menu = document.getElementById('menu');

  function applyTheme(mode) {
    root.dataset.theme = mode;
    try { localStorage.setItem('tanspace-theme', mode); } catch {}
    themeBtn.setAttribute('aria-pressed', String(mode === 'dark'));
    document.querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', mode === 'dark' ? '#1A110B' : '#F5EFE6');
    // Scene 3D mendengarkan event ini
    window.dispatchEvent(new CustomEvent('themechange', { detail: mode }));
  }
  applyTheme(root.dataset.theme || 'light');
  themeBtn.addEventListener('click', () =>
    applyTheme(root.dataset.theme === 'dark' ? 'light' : 'dark'));

  // Menu mobile
  function setMenu(open) {
    menu.classList.toggle('is-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Tutup menu' : 'Buka menu');
  }
  menuBtn.addEventListener('click', () => setMenu(!menu.classList.contains('is-open')));
  menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  // Navbar lebih pekat setelah di-scroll
  const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 40);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}