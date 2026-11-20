(async () => {
  const SKEL = `<header class="top">
  <a class="brand" href="#/" aria-label="Focus Survey Solution, ke beranda">
    <svg width="38" height="38" viewBox="0 0 40 40" aria-hidden="true">
      <path d="M20 19 37 28 20 37 3 28Z" fill="#0f6b6a" stroke="var(--bg)" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M20 11 37 20 20 29 3 20Z" fill="#ff8a00" stroke="var(--bg)" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M20 3 37 12 20 21 3 12Z" fill="#0a2e2f" stroke="var(--bg)" stroke-width="1.5" stroke-linejoin="round"/>
    </svg>
    <span>Focus Survey Solution</span>
  </a>
  <nav class="nav" id="nav" aria-label="Menu utama"></nav>
  <a class="btn primary sm" href="#/kontak">Hubungi kami</a>
  <a class="adm" href="#/admin"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg> Admin</a>
  <div class="menu-wrap">
    <button class="burger" id="burger" aria-label="Buka menu" aria-expanded="false" data-act="menu"></button>
    <div class="drawer" id="drawer" role="dialog" aria-label="Menu">
      <div class="d-head" hidden>
        <span class="brand"><span>Menu</span></span>
        <button class="burger" aria-label="Tutup menu" data-act="menu" id="closeBtn"></button>
      </div>
      <div id="dlinks" style="display:flex;flex-direction:column"></div>
    </div>
  </div>
</header>

<main id="view" tabindex="-1"></main>

<footer class="pager">
  <button class="round" id="prev" aria-label="Halaman sebelumnya"></button>
  <nav class="ruler" id="ruler" aria-label="Navigasi halaman"></nav>
  <button class="round" id="next" aria-label="Halaman berikutnya"></button>
</footer>`;
  document.body.insertAdjacentHTML("afterbegin", SKEL);
  /* ====== Pengaturan: ganti nomor WhatsApp (format 628xxxxxxxxxx) ====== */
  const WA_DEFAULT = '6285974008882';   // nomor bawaan (opsional). Lebih mudah diatur lewat Admin > Pengaturan.
  function waDigits(v){
    let d = String(v || '').replace(/\D/g, '');
    if (d.indexOf('00') === 0) d = d.slice(2);
    if (d.charAt(0) === '0') d = '62' + d.slice(1);
    else if (d.charAt(0) === '8') d = '62' + d;
    return d;
  }
  const waShow = d => d ? '+' + d.replace(/^(\d{2})(\d{3})(\d{4})(\d*)$/, (m, a, b, c, e) => a + ' ' + b + '-' + c + (e ? '-' + e : '')) : '';
  const waNum = () => waDigits((SETTINGS && SETTINGS.wa) || WA_DEFAULT);
  const wa = t => `https://wa.me/${waNum()}?text=${encodeURIComponent(t)}`;

  /* ====== Identitas (nama, logo) dan tema warna ====== */
  const DEFAULT_NAME = 'Multidaya Cipta Solusi', DEFAULT_SHORT = 'MCS', DEF_C1 = '#0a2e2f', DEF_C2 = '#ff8a00';
  const PRESETS = [
    ['Biru Logo & Merah (MCS)', '#344e69', '#e63946'],
    ['Biru Logo & Merah Terang', '#243b53', '#ff3b3b'],
    ['Biru Logo & Cyan', '#344e69', '#00b4d8'],
    ['Biru Logo & Oranye', '#344e69', '#ff7a1a'],
    ['Biru Logo & Emas', '#344e69', '#f59e0b'],
    ['Merah & Biru Logo', '#7f1d1d', '#38bdf8'],
    ['Merah & Emas', '#4a0f1c', '#f2b01e'],
    ['Merah Crimson & Putih', '#881337', '#fb7185'],
    ['Biru Tua & Cyan', '#0a1f44', '#19c3e6'],
    ['Biru Laut & Kuning', '#0b2a4a', '#ffc21a'],
    ['Slate & Biru Muda', '#1e293b', '#38bdf8'],
    ['Teal & Oranye (bawaan)', '#0a2e2f', '#ff8a00']
  ];
  const nameOf = s => (s && s.name) || DEFAULT_NAME;
  const brand = () => nameOf(SETTINGS);
  const short = () => (SETTINGS && SETTINGS.short) || DEFAULT_SHORT;
  const hex2rgb = h => { const n = parseInt(String(h).slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const rgb2hex = (r, g, b) => '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  function rgb2hsl(r, g, b){
    r /= 255; g /= 255; b /= 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b); let h = 0, s = 0; const l = (mx + mn) / 2;
    if (mx !== mn){
      const d = mx - mn; s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn);
      h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60;
    }
    return [h, s, l];
  }
  function hsl2rgb(h, s, l){
    h = ((h % 360) + 360) % 360;
    const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2; let r = 0, g = 0, b = 0;
    if (h < 60) [r, g, b] = [c, x, 0]; else if (h < 120) [r, g, b] = [x, c, 0]; else if (h < 180) [r, g, b] = [0, c, x];
    else if (h < 240) [r, g, b] = [0, x, c]; else if (h < 300) [r, g, b] = [x, 0, c]; else [r, g, b] = [c, 0, x];
    return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
  }
  const hsl = (h, s, l) => rgb2hex(...hsl2rgb(h, s, l));
  const lum = ([r, g, b]) => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(r) + .7152 * f(g) + .0722 * f(b); };
  const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
  function themeCss(c1, c2){
    const [h, s0, l0] = rgb2hsl(...hex2rgb(c1));
    const sat = s0 < .1 ? s0 : Math.min(.9, Math.max(.3, s0));
    const dL = Math.min(l0, .22), deep = l0 <= .22 ? c1.toLowerCase() : hsl(h, sat, .2), dRgb = hex2rgb(deep);
    const deep2 = hsl(h, sat * .95, dL + .07), deep3 = hsl(h, sat, dL * .62), deep4 = hsl(h, sat, dL * .4);
    const mid = hsl(h, sat * .9, Math.min(.4, dL + .14)), glow = hex2rgb(hsl(h, Math.min(1, sat + .1), .3)), onSoft = hsl(h, Math.min(.5, sat), .85);
    const tint = Math.min(.3, sat * .35), tintD = Math.min(.6, sat);
    const bg = hsl(h, tint, .945), s2 = hsl(h, tint, .975), muted = hsl(h, Math.min(.2, sat * .25), .36);
    const bgD = hsl(h, tintD, .075), sfD = hsl(h, Math.min(.5, sat * .8), .115), s2D = hsl(h, Math.min(.5, sat * .8), .15);
    const txD = hsl(h, Math.min(.25, sat), .93), muD = hsl(h, Math.min(.2, sat), .7);
    const deepD = hsl(h, sat, dL + .03), deep2D = hsl(h, sat * .95, dL + .09);
    const ar = hex2rgb(c2), [ah, as, al] = rgb2hsl(...ar);
    const lighten = (rgb, f) => rgb2hex(...rgb.map(v => v + (255 - v) * f));
    const onAcc = contrast(ar, [17, 17, 17]) >= contrast(ar, [255, 255, 255]) ? '#161616' : '#ffffff';
    let L = al, t = ar;
    while (contrast(t, [255, 255, 255]) < 4.5 && L > .04){ L -= .02; t = hsl2rgb(ah, as, L); }
    const atL = rgb2hex(...t);
    L = al; t = ar; const dk = hex2rgb(bgD);
    while (contrast(t, dk) < 4.5 && L < .96){ L += .02; t = hsl2rgb(ah, as, L); }
    const atD = rgb2hex(...t);
    const common = `--accent:${c2};--accent-rgb:${ar.join(',')};--accent-2:${lighten(ar, .28)};--accent-hover:${lighten(ar, .14)};--on-accent:${onAcc};--accent-soft:rgba(${ar.join(',')},.16);--deep:${deep};--deep-2:${deep2};--deep-3:${deep3};--deep-4:${deep4};--deep-mid:${mid};--deep3-rgb:${hex2rgb(deep3).join(',')};--deep4-rgb:${hex2rgb(deep4).join(',')};--glow-rgb:${glow.map(Math.round).join(',')};--on-deep-soft:${onSoft}`;
    const light = `--bg:${bg};--surface-2:${s2};--text:${deep};--muted:${muted};--line:rgba(${dRgb.join(',')},.14);--tick:rgba(${dRgb.join(',')},.35);--accent-text:${atL}`;
    const dark = `--bg:${bgD};--surface:${sfD};--surface-2:${s2D};--text:${txD};--muted:${muD};--accent-text:${atD};--deep:${deepD};--deep-2:${deep2D}`;
    return `:root{${common};${light}}\n@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){${dark}}}\n:root[data-theme="dark"]{${dark}}`;
  }
  function applyTheme(s){
    const ok = v => /^#[0-9a-fA-F]{6}$/.test(v || '');
    const c1 = ok(s && s.color1) ? s.color1 : DEF_C1, c2 = ok(s && s.color2) ? s.color2 : DEF_C2;
    let st = document.getElementById('theme-style');
    if (c1.toLowerCase() === DEF_C1 && c2.toLowerCase() === DEF_C2){ if (st) st.remove(); }
    else { if (!st){ st = document.createElement('style'); st.id = 'theme-style'; document.head.appendChild(st); } st.textContent = themeCss(c1, c2); }
    const root = document.documentElement, m = (s && s.mode) || 'auto';
    if (m === 'light' || m === 'dark'){ root.setAttribute('data-theme', m); root.dataset.fssMode = '1'; }
    else if (root.dataset.fssMode){ root.removeAttribute('data-theme'); delete root.dataset.fssMode; }
  }
  function logoHtml(s, size, onDark){
    const lg = s && s.logo && (s.logo.s || (typeof s.logo === 'string' ? s.logo : ''));
    if (lg) return `<img class="logo-img" src="${esc(lg)}" alt="" style="height:${size}px;max-width:${Math.round(size * 3.2)}px">`;
    const top = onDark ? '#ffffff' : '#0a2e2f', edge = onDark ? 'stroke="#0a2e2f"' : 'style="stroke:var(--bg)"';
    return `<svg width="${size}" height="${size}" viewBox="0 0 40 40" aria-hidden="true"><path d="M20 19 37 28 20 37 3 28Z" fill="#0f6b6a" ${edge} stroke-width="1.5" stroke-linejoin="round"/><path d="M20 11 37 20 20 29 3 20Z" fill="#ff8a00" ${edge} stroke-width="1.5" stroke-linejoin="round"/><path d="M20 3 37 12 20 21 3 12Z" fill="${top}" ${edge} stroke-width="1.5" stroke-linejoin="round"/></svg>`;
  }
  function applyBrand(s){
    const hb = document.querySelector('header.top .brand');
    if (hb){
      const hide = !!(s && s.logo && s.logoName === false);
      hb.innerHTML = logoHtml(s, 38, false) + (hide ? '' : '<span>' + esc(nameOf(s)) + '</span>');
      hb.setAttribute('aria-label', nameOf(s) + ', ke beranda');
    }
    const tc = document.querySelector('meta[name="theme-color"]');
    if (tc && s && s.color1) tc.setAttribute('content', s.color1);
    const ti = document.querySelector('meta[name="apple-mobile-web-app-title"]');
    if (ti) ti.setAttribute('content', (s && s.short) || DEFAULT_SHORT);
  }
  const applyAll = s => { s = s || SETTINGS; applyTheme(s); applyBrand(s); };

  /* ====== Ikon ====== */
  const I = {
    scale:'<path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>',
    gauge:'<path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/>',
    zap:'<path d="M13 2 3 14h9l-1 8 10-12h-9z"/>',
    wrench:'<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
    ruler:'<path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z"/><path d="m14.5 12.5 2-2"/><path d="m11.5 9.5 2-2"/><path d="m8.5 6.5 2-2"/><path d="m17.5 15.5 2-2"/>',
    flask:'<path d="M10 2v7.5L4.7 20.5a1 1 0 0 0 .9 1.5h12.8a1 1 0 0 0 .9-1.5L14 9.5V2"/><path d="M8.5 2h7"/><path d="M7 16h10"/>',
    hardhat:'<path d="M2 18a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1z"/><path d="M10 10V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5"/><path d="M4 15v-3a6 6 0 0 1 6-6"/><path d="M14 6a6 6 0 0 1 6 6v3"/>',
    steth:'<path d="M11 2v2"/><path d="M5 2v2"/><path d="M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1"/><path d="M8 15a6 6 0 0 0 12 0v-3"/><circle cx="20" cy="10" r="2"/>',
    thermo:'<path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/>',
    clock:'<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    shield:'<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
    filecheck:'<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="m9 15 2 2 4-4"/>',
    arrowR:'<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    arrowL:'<path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>',
    award:'<circle cx="12" cy="8" r="6"/><path d="m15.48 12.89 1.52 9.11-5-3-5 3 1.52-9.11"/>',
    calendar:'<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    pin:'<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    bell:'<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    star:'<path fill="currentColor" d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/>',
    check:'<path d="M20 6 9 17l-5-5"/>',
    mail:'<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>',
    chat:'<path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 20.5l1.7-5.4A8.4 8.4 0 1 1 21 11.5Z"/>',
    menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',
    close:'<path d="M18 6 6 18M6 6l12 12"/>',
    truck:'<path d="M10 17h4V5H2v12h3"/><path d="M14 8h4l4 4v5h-3"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>',
    search:'<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    clip:'<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/>'
  };
  Object.assign(I, {
    box:'<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
    gear:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
    activity:'<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
    edit:'<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
    chevU:'<path d="m18 15-6-6-6 6"/>',
    chevD:'<path d="m6 9 6 6 6-6"/>',
    lock:'<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    plus:'<path d="M12 5v14M5 12h14"/>',
    trash:'<path d="M3 6h18"/><path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"/><path d="m19 6-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/>',
    image:'<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/>',
    upload:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/>',
    logout:'<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
    key:'<circle cx="7.5" cy="15.5" r="4.5"/><path d="m10.7 12.3 9.3-9.3"/><path d="m16 7 3 3"/>',
    chevL:'<path d="m15 18-6-6 6-6"/>',
    chevR:'<path d="m9 18 6-6-6-6"/>',
    expand:'<path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>',
    refresh:'<path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/>'
  });
  Object.assign(I, {
    news:'<path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/>',
    route:'<circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/>',
    download:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
    file:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>',
    rotate:'<path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-1.19"/>'
  });
  const ic = (n, s = 20, sw = 1.8) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[n]}</svg>`;

  /* ====== Konten ====== */
  let SERVICES = [
    { id:'massa', t:'Kalibrasi Massa & Timbangan', icon:'scale',
      s:'Akurasi tinggi untuk timbangan analitik, presisi, dan anak timbangan.',
      l:'Timbangan yang akurat menjaga mutu produk dan keabsahan transaksi. Kami mengkalibrasi berbagai jenis timbangan dan anak timbangan dengan standar massa yang tertelusur.',
      items:['Timbangan analitik','Timbangan presisi','Timbangan industri dan lantai','Anak timbangan'] },
    { id:'tekanan', t:'Kalibrasi Tekanan & Vacuum', icon:'gauge',
      s:'Kalibrasi pressure gauge, transmitter, dan alat ukur tekanan lainnya.',
      l:'Pengukuran tekanan yang meleset berisiko pada keselamatan proses. Kami memeriksa dan mengkalibrasi alat ukur tekanan dan vacuum agar pembacaannya sesuai standar.',
      items:['Pressure gauge','Pressure transmitter','Vacuum gauge','Digital manometer'] },
    { id:'listrik', t:'Kalibrasi Alat Listrik', icon:'zap',
      s:'Pengukuran presisi untuk multimeter, clamp meter, dan instrumen kelistrikan.',
      l:'Alat ukur listrik yang terkalibrasi memastikan hasil pengujian dan pemeliharaan instalasi dapat dipercaya. Kami mengkalibrasi instrumen kelistrikan untuk kebutuhan industri dan laboratorium.',
      items:['Multimeter','Clamp meter','Insulation tester','Instrumen kelistrikan lainnya'] },
    { id:'torsi', t:'Kalibrasi Torsi & Gaya', icon:'wrench',
      s:'Standar kalibrasi untuk torque wrench, push pull gauge, dan mesin uji.',
      l:'Torsi dan gaya yang tidak tepat dapat merusak komponen atau menurunkan keamanan perakitan. Kami mengkalibrasi alat torsi dan gaya sesuai standar yang tertelusur.',
      items:['Torque wrench','Push pull gauge','Mesin uji tarik dan tekan','Load cell'] },
    { id:'dimensi', t:'Kalibrasi Dimensi & Volume', icon:'ruler',
      s:'Presisi ukuran untuk caliper, mikrometer, dan alat ukur volumetrik.',
      l:'Ketelitian dimensi menentukan kualitas hasil produksi. Kami mengkalibrasi alat ukur panjang dan volume agar hasil inspeksi Anda konsisten.',
      items:['Caliper','Mikrometer','Dial gauge','Alat ukur volumetrik'] },
    { id:'analitik', t:'Instrument Analitic', icon:'flask',
      s:'Kalibrasi pH meter, spektrofotometer, dan instrumen analitik lainnya.',
      l:'Hasil analisis laboratorium bergantung pada instrumen yang terkalibrasi. Kami melayani kalibrasi berbagai instrumen analitik.',
      items:['pH meter','Spektrofotometer','Instrumen analitik lainnya'] },
    { id:'suhu', t:'Kalibrasi Suhu', icon:'thermo',
      s:'Kalibrasi termometer, oven, furnace, dan sensor suhu industri.',
      l:'Proses yang bergantung pada suhu menuntut pembacaan yang tepat. Kami mengkalibrasi alat ukur suhu dan peralatan pemanas untuk kebutuhan industri.',
      items:['Termometer','Oven','Furnace','Sensor suhu industri'] },
    { id:'waktu', t:'Kalibrasi Waktu & Frekuensi', icon:'clock',
      s:'Pengukuran presisi untuk stopwatch, timer, dan frequency counter.',
      l:'Pengukuran waktu dan frekuensi menjadi dasar banyak pengujian. Kami mengkalibrasi alat ukur waktu dengan standar yang tertelusur.',
      items:['Stopwatch','Timer','Frequency counter'] },
    { id:'pengadaan', t:'Pengadaan Instrument, Alat Teknik, Dll', icon:'box',
      s:'Siap Melayani seluruh pengadaan kebutuhan Industri anda.',
      l:'Siap Melayani seluruh pengadaan kebutuhan Industri anda, meliputi berbagai instrumen ukur, alat teknik, dan perlengkapan industri lainnya.',
      items:['Instrument ukur & uji','Alat teknik & perkakas','Kebutuhan industri lainnya'] }
  ];

  const ADV = [
    { icon:'award', t:'Teknisi tersertifikasi', p:'Didukung tim ahli berpengalaman yang memiliki sertifikasi kompetensi di bidang kalibrasi.' },
    { icon:'shield', t:'Standar traceable', p:'Semua alat standar kami tertelusur ke standar nasional maupun internasional (KAN/NIST).' },
    { icon:'filecheck', t:'Sertifikat lengkap', p:'Sertifikat mencakup nilai ketidakpastian (MU) dan traceability yang jelas untuk kebutuhan audit.' },
    { icon:'pin', t:'Onsite dan inlab', p:'Kalibrasi di pabrik atau fasilitas Anda, atau di laboratorium kami. Pilih yang paling praktis.' },
    { icon:'clock', t:'Emergency service 24/7', p:'Respons cepat saat alat harus segera kembali beroperasi.' }
  ];

  const FLOW = {
    onsite:[
      ['filecheck','Pengajuan & validasi alat','Kirim daftar alat, tim kami memvalidasi ruang lingkup dan rentang ukur.'],
      ['calendar','Penjadwalan & konfirmasi','Menentukan jadwal kunjungan teknisi ke lokasi fasilitas Anda.'],
      ['wrench','Persiapan standar','Teknisi menyiapkan alat standar kalibrator yang sesuai dan tertelusur.'],
      ['pin','Kalibrasi di lokasi','Pelaksanaan kalibrasi langsung pada lini produksi atau fasilitas Anda.'],
      ['users','Verifikasi bersama','Pengecekan hasil awal bersama PIC perusahaan Anda di lapangan.'],
      ['award','Sertifikat diterbitkan','Penerbitan sertifikat resmi digital dan fisik setelah proses review.']
    ],
    inlab:[
      ['box','Penerimaan & Registrasi','Alat diterima di lab, diregistrasi ke sistem, dan diberi barcode unik.'],
      ['search','Pemeriksaan Awal','Pengecekan fisik dan fungsi dasar alat sebelum proses kalibrasi dimulai.'],
      ['gear','Pengujian & Kalibrasi','Proses kalibrasi di ruang terkondisi (suhu & kelembaban stabil).'],
      ['activity','Analisis & Verifikasi','Perhitungan ketidakpastian (MU) dan verifikasi data oleh penyelia.'],
      ['edit','Penerbitan Sertifikat','Sertifikat resmi dicetak dan ditandatangani oleh manajer teknis.'],
      ['truck','Pengembalian Alat','Alat dikemas aman dan siap diambil atau dikirim kembali ke pelanggan.']
    ],
    pengadaan:[
      ['chat','Konsultasi (kebutuhan)','Diskusi kebutuhan spesifikasi instrumen, alat teknik, atau perlengkapan industri Anda.'],
      ['file','Quotation','Kami mengirimkan penawaran harga resmi beserta spesifikasi dan estimasi ketersediaan barang.'],
      ['filecheck','Approval dan Purchase Order','Persetujuan penawaran dan penerbitan Purchase Order (PO) dari perusahaan Anda.'],
      ['gear','Pesanan di Proses','Tim kami menyiapkan, memeriksa kualitas, dan memproses pesanan sesuai spesifikasi PO.'],
      ['truck','Pengiriman Barang','Pengemasan aman dan pengiriman barang tepat waktu ke lokasi atau fasilitas Anda.'],
      ['clip','Tanda Terima dan Penagihan','Serah terima barang beserta tanda terima dan dokumen penagihan (invoice).']
    ]
  };

  const TESTI = [
    { i:'PN', c:'#0b86c0', n:'PT. Manufaktur Nusantara', s:'Industri otomotif', r:'4.8',
      q:'Sangat profesional. Teknisi Focus Survey Solution sangat paham standar ISO 17025. Sertifikat cepat keluar dan sangat membantu audit.' },
    { i:'RU', c:'#0e9e72', n:'RS Medika Utama', s:'Kesehatan', r:'5',
      q:'Kalibrasi alkes onsite sangat membantu kami karena alat tidak perlu keluar rumah sakit. Akurasi terjamin!' },
    { i:'PJ', c:'#c26a00', n:'PT. Petrokimia Jaya', s:'Minyak & gas', r:'5',
      q:'Alat kami terkalibrasi tepat waktu dan dokumentasinya rapi. Traceability yang jelas memudahkan proses audit.' }
  ];

  const PAGES = [
    ['','Beranda'],['layanan','Layanan'],['portofolio','Portofolio'],['berita','Berita'],['keunggulan','Keunggulan'],
    ['alur','Alur kerja'],['kontak','Kontak']
  ];

  /* ====== Portofolio, berita, ruang lingkup, dan admin ====== */
  const LIMIT = 14 * 1024 * 1024;
  const FONT_HREF = 'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..800&family=Instrument+Sans:wght@400..700&display=swap';
  const SCRIPT_END = '<' + '/script>';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const BULAN = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  const fmtDate = ym => { const m = /^(\d{4})-(\d{2})/.exec(ym || ''); return m ? BULAN[+m[2] - 1] + ' ' + m[1] : (ym || '-'); };
  const fmtFull = d => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d || ''); return m ? (+m[3]) + ' ' + BULAN[+m[2] - 1] + ' ' + m[1] : (d || '-'); };
  const catLabel = c => { const s = SERVICES.find(x => x.id === c); return s ? s.t.replace(/^Kalibrasi /, '') : 'Lainnya'; };
  const MODES = ['Onsite', 'Inlab', 'Onsite dan inlab'];
  const NCATS = ['Berita', 'Tips', 'Pengumuman', 'Kegiatan'];
  const ICON_CHOICES = [['scale','Timbangan'],['gauge','Alat ukur tekanan'],['zap','Listrik'],['wrench','Torsi atau perkakas'],['ruler','Dimensi'],['flask','Laboratorium'],['hardhat','Konstruksi'],['steth','Kesehatan'],['thermo','Suhu'],['clock','Waktu'],['shield','Standar'],['award','Sertifikasi'],['activity','Sinyal'],['gear','Mesin'],['box','Paket'],['bell','Pengingat']];
  const sess = {
    get(k){ try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set(k, v){ try { if (v == null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, v); } catch (e) {} }
  };

  let DATA = {};
  try { DATA = JSON.parse(document.getElementById('fss-data').textContent) || {}; } catch (e) { DATA = {}; }
  let serverDataVersion = null, hasBackendApi = false;
  if (location.protocol.startsWith('http')) {
    try {
      const apiRes = await fetch('/api/data', { cache: 'no-store' });
      const ct = (apiRes.headers.get('content-type') || '').toLowerCase();
      if (apiRes.ok && ct.includes('application/json')) {
        DATA = await apiRes.json();
        serverDataVersion = apiRes.headers.get('X-Data-Version');
        hasBackendApi = true;
      } else {
        const staticRes = await fetch('data.json', { cache: 'no-store' });
        if (staticRes.ok) DATA = await staticRes.json();
      }
    } catch (e) {}
  }
  if (!hasBackendApi) {
    try {
      const localDemo = localStorage.getItem('fss_demo_data');
      if (localDemo) DATA = Object.assign({}, DATA, JSON.parse(localDemo));
    } catch (e) {}
  }
  if (Array.isArray(DATA.services)) SERVICES = DATA.services;

  function svgPhoto(icon, c1, c2, label, v){
    let deco = '';
    if (v === 0) for (let i = 0; i < 14; i++) deco += `<line x1="${i * 100 - 200}" y1="800" x2="${i * 100 + 200}" y2="0"/>`;
    else if (v === 1) for (let i = 1; i < 8; i++) deco += `<circle cx="1000" cy="150" r="${i * 90}"/>`;
    else for (let i = 1; i < 12; i++) deco += `<line x1="${i * 100}" y1="0" x2="${i * 100}" y2="800"/><line x1="0" y1="${i * 70}" x2="1200" y2="${i * 70}"/>`;
    const lab = esc(label.length > 44 ? label.slice(0, 43) + '...' : label);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs><rect width="1200" height="800" fill="url(#g)"/><g stroke="rgba(255,255,255,.12)" stroke-width="2" fill="none">${deco}</g><g transform="translate(480 200) scale(10)" fill="none" stroke="#fff" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">${I[icon] || ''}</g><text x="600" y="640" text-anchor="middle" font-family="Arial,sans-serif" font-size="40" fill="#fff" fill-opacity=".92">${lab}</text><text x="600" y="700" text-anchor="middle" font-family="Arial,sans-serif" font-size="28" fill="#fff" fill-opacity=".6">Foto contoh</text></svg>`;
    return { s: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg) };
  }
  function seedProjects(){
    const base = [
      ['massa','scale','Kalibrasi timbangan lini produksi','Klien contoh A','Malang, Jawa Timur','2026-03','Onsite',24,'ISO 17025, KAN','2 hari','#0f6b6a','#0a2e2f'],
      ['tekanan','gauge','Kalibrasi pressure gauge dan transmitter','Klien contoh B','Surabaya, Jawa Timur','2026-04','Onsite',48,'ISO 17025, KAN','3 hari','#14504f','#06201f'],
      ['kesehatan','steth','Kalibrasi alat kesehatan rumah sakit','Klien contoh C','Malang, Jawa Timur','2026-05','Onsite',36,'ISO 17025','1 hari','#0e7a78','#0a2e2f'],
      ['suhu','thermo','Kalibrasi oven dan furnace laboratorium','Klien contoh D','Pasuruan, Jawa Timur','2026-06','Inlab',12,'ISO 17025, KAN','3 hari','#b35c00','#5a2d00'],
      ['listrik','zap','Kalibrasi multimeter dan clamp meter','Klien contoh E','Sidoarjo, Jawa Timur','2026-07','Onsite dan inlab',60,'ISO 17025','4 hari','#0b5d8a','#0a2e2f'],
      ['dimensi','ruler','Kalibrasi caliper dan mikrometer','Klien contoh F','Pasuruan, Jawa Timur','2026-08','Inlab',80,'ISO 17025, KAN','3 hari','#0f6b6a','#14383a']
    ];
    return base.map((b, i) => ({
      id: 's' + (i + 1), cat: b[0], title: b[2], client: b[3], loc: b[4], date: b[5], mode: b[6], count: b[7], std: b[8], dur: b[9],
      desc: 'Ini proyek contoh untuk menunjukkan tampilan portofolio. Admin dapat mengganti judul, data, dan foto lewat menu Admin.',
      photos: [0, 1, 2].map(v => svgPhoto(b[1], b[10], b[11], b[2], v))
    }));
  }
  function seedNews(){
    const base = [
      ['Tips','Pentingnya kalibrasi berkala untuk alat ukur industri','2026-08-12','Alat ukur yang tidak dikalibrasi dapat menyimpang tanpa disadari. Ini alasan kalibrasi berkala penting.','gauge','#0f6b6a','#0a2e2f'],
      ['Pengumuman','Layanan kalibrasi onsite untuk pabrik dan fasilitas Anda','2026-09-02','Teknisi FSS siap datang ke lokasi Anda untuk kalibrasi langsung tanpa menghentikan operasional terlalu lama.','truck','#14504f','#06201f'],
      ['Kegiatan','Mengenal alur kalibrasi inlab di laboratorium FSS','2026-09-20','Dari penerimaan alat hingga sertifikat terbit, begini tahapan kalibrasi inlab.','flask','#b35c00','#5a2d00']
    ];
    return base.map((b, i) => ({
      id: 'n' + (i + 1), cat: b[0], title: b[1], date: b[2], summary: b[3],
      body: 'Ini artikel contoh untuk menunjukkan tampilan halaman berita. Admin dapat mengganti judul, tanggal, ringkasan, isi artikel, dan foto lewat menu Admin.\n\nKalibrasi berkala memastikan alat ukur tetap memberikan hasil yang sesuai standar. Hubungi tim FSS untuk konsultasi jadwal dan ruang lingkup kalibrasi alat Anda.',
      photos: [0, 1].map(v => svgPhoto(b[4], b[5], b[6], b[1], v))
    }));
  }
  const R = (a, b) => ({ r: a, u: b });
  const SCOPE_SEED = {
    massa: [{ id:'m1', group:'Massa', tool:'Anak Timbangan', method:'SK Dirjen Pelayanan Kesehatan No. HK.02.02/V/0412/2020 (MK 073 - 2019); (MK 074 - 2019); OIML R111-1 : 2004',
      ranges:[R('1 mg ~ 5 mg','0.28 mg'),R('10 mg','0.28 mg'),R('20 mg','0.28 mg'),R('50 mg','0.28 mg'),R('100 mg','0.28 mg'),R('200 mg','0.28 mg'),R('500 mg','0.29 mg'),R('1 g','0.29 mg'),R('2 g','0.29 mg'),R('5 g','0.29 mg'),R('10 g','0.29 mg'),R('20 g','0.29 mg'),R('50 g','0.30 mg')] }],
    suhu: [
      { id:'t1', group:'Suhu', tool:'Termokopel', method:'EURAMET/cg-8/v3.1:2020',
        ranges:[R('-30 °C ~ 0 °C','0.63 °C'),R('0 °C ~ 200 °C','0.33 °C'),R('200 °C ~ 500 °C','0.62 °C'),R('500 °C ~ 1000 °C','2.7 °C')] },
      { id:'t2', group:'Suhu', tool:'Resistance Thermometer', method:'EPE.02.01.III.014',
        ranges:[R('-30 °C ~ 0 °C','0.63 °C'),R('0 °C ~ 200 °C','0.29 °C'),R('200 °C ~ 500 °C','0.49 °C')] },
      { id:'t3', group:'Suhu', tool:'Temperature Indicator without sensor for thermocouple, resistance thermometer Tc Type J Tc Type K Tc Type R Tc Type S Tc Type T RTD', method:'EURAMET/cg-11/v 2.0:2011',
        ranges:[R('-200 °C ~ 1200 °C','0.18 °C'),R('-200 °C ~ 1300 °C','0.18 °C'),R('0 °C ~ 1600 °C','0.61 °C'),R('0 °C ~ 1600 °C','0.61 °C'),R('-200 °C ~ 400 °C','0.18 °C')] }
    ]
  };

  let P = Array.isArray(DATA.projects) ? DATA.projects : seedProjects();
  let N = Array.isArray(DATA.news) ? DATA.news : seedNews();
  let SCOPE = (DATA.scope && typeof DATA.scope === 'object' && !Array.isArray(DATA.scope)) ? DATA.scope : SCOPE_SEED;
  let SETTINGS = (DATA.settings && typeof DATA.settings === 'object' && !Array.isArray(DATA.settings)) ? DATA.settings : {};
  let PAGES_TXT = (DATA.pages && typeof DATA.pages === 'object' && !Array.isArray(DATA.pages)) ? DATA.pages : {};
  const DEFAULT_PIN_HASH = 'c9f4c8d978856cbcc0b683b5db475aaee5c893dbfa94bb987c4680e2a5c7c3dc';
  let pinHash = DATA.pinHash || DEFAULT_PIN_HASH;
  let pf = { cat: 'all', page: 0 };
  const nf = { page: 0 };
  let gal = { id: null, i: 0 };
  const adm = { authed: sess.get('fss_admin') === '1', tab: 'porto', sel: null, draft: null, isNew: false, delArm: false, tries: 0, lockUntil: 0, repIdx: 0, pendingReviews: [] };

  const cover = p => (p.photos && p.photos[0]) ? p.photos[0] : svgPhoto('image', '#0f6b6a', '#0a2e2f', 'Belum ada foto', 0);
  const thumbOf = x => x.t || x.s;
  const photosOf = it => (it.photos && it.photos.length) ? it.photos : [cover(it)];
  const byDate = (a, b) => (b.date || '').localeCompare(a.date || '');
  const sortedP = () => [...P].sort(byDate);
  const sortedN = () => [...N].sort(byDate);
  const galItem = () => P.find(x => x.id === gal.id) || N.find(x => x.id === gal.id) || (gal.id === 'gmaps' ? { id: 'gmaps', title: 'Foto lokasi', photos: GOOGLE.photos } : null);

  function pnav(state, pages, act){
    return pages > 1 ? `<div class="pnav"><button class="round" data-act="${act}" data-d="-1" aria-label="Halaman sebelumnya">${ic('chevL', 20)}</button><span>${state.page + 1} dari ${pages}</span><button class="round" data-act="${act}" data-d="1" aria-label="Halaman berikutnya">${ic('chevR', 20)}</button></div>` : '';
  }
  function dnav(list, it, base, key){
    if (list.length < 2) return '';
    const k = list.findIndex(x => x.id === it.id), pv = list[(k + list.length - 1) % list.length], nx = list[(k + 1) % list.length];
    return `<div class="d-nav">
      <a href="#/${base}/${esc(pv.id)}">${ic('arrowL', 18)}<span><small>Sebelumnya</small>${esc(pv[key])}</span></a>
      <a href="#/${base}/${esc(nx.id)}"><span><small>Berikutnya</small>${esc(nx[key])}</span>${ic('arrowR', 18)}</a>
    </div>`;
  }
  function galleryHtml(it){
    const ph = photosOf(it);
    return `<div class="pd-gal">
      <div class="stage" id="stage">
        <img id="gmain" data-act="zoom" src="${ph[0].s}" alt="Foto 1 ${esc(it.title)}">
        ${ph.length > 1 ? `<button class="gnav l" data-act="gprev" aria-label="Foto sebelumnya">${ic('chevL', 22)}</button><button class="gnav r" data-act="gnext" aria-label="Foto berikutnya">${ic('chevR', 22)}</button>` : ''}
        <button class="gzoom" data-act="zoom" aria-label="Perbesar foto">${ic('expand', 18)}</button>
        <span class="gcount" id="gcount">1 / ${ph.length}</span>
      </div>
      ${ph.length > 1 ? `<div class="thumbs">${ph.map((x, i) => `<button data-act="gset" data-i="${i}" class="${i === 0 ? 'on' : ''}" aria-label="Lihat foto ${i + 1}"><img src="${thumbOf(x)}" alt=""></button>`).join('')}</div>` : ''}
    </div>`;
  }

  /* ---- Portofolio ---- */
  function pcard(p, i){
    const c = cover(p);
    return `<a class="pcard" style="--i:${i}" href="#/portofolio/${esc(p.id)}">
      <span class="pimg"><img src="${thumbOf(c)}" alt="Foto ${esc(p.title)}" loading="lazy"><span class="pcount">${ic('image', 14)} ${(p.photos || []).length}</span></span>
      <span class="pbody"><span class="ptag">${esc(catLabel(p.cat))}</span><h3>${esc(p.title)}</h3>
        <span class="pmeta"><span>${ic('pin', 14)} ${esc(p.loc)}</span><span>${ic('calendar', 14)} ${esc(fmtDate(p.date))}</span></span></span>
    </a>`;
  }
  function perPage(kind){
    const w = window.innerWidth, h = window.innerHeight;
    if (w < 1000) return 6;                                   // tablet dan HP: boleh digulir
    const img = kind === 'news' ? Math.min(150, Math.max(80, .14 * h)) : Math.min(190, Math.max(96, .19 * h));
    const card = img + (kind === 'news' ? 185 : 142);
    return 3 * Math.min(2, Math.max(1, Math.floor((h - 350) / card)));   // 1 atau 2 baris agar muat dalam satu layar
  }
  function portoList(){
    const cats = ['all', ...new Set(P.map(p => p.cat))];
    if (!cats.includes(pf.cat)) pf.cat = 'all';
    const list = sortedP().filter(p => pf.cat === 'all' || p.cat === pf.cat);
    const per = perPage('porto'), pages = Math.max(1, Math.ceil(list.length / per));
    if (pf.page < 0) pf.page = pages - 1;
    if (pf.page >= pages) pf.page = 0;
    const cur = list.slice(pf.page * per, (pf.page + 1) * per);
    return `
      <section class="page">
        <div class="head">
          <h2>Portofolio proyek kalibrasi</h2>
          <p>Pekerjaan nyata di lapangan dan laboratorium. Pilih proyek untuk melihat foto dan datanya.</p>
        </div>
        <div class="fchips" role="group" aria-label="Filter kategori">
          ${cats.map(c => `<button class="fchip" data-act="pcat" data-v="${esc(c)}" aria-pressed="${pf.cat === c}">${c === 'all' ? 'Semua' : esc(catLabel(c))}</button>`).join('')}
        </div>
        ${cur.length ? `<div class="pgrid">${cur.map(pcard).join('')}</div>` : '<p class="empty">Belum ada proyek di kategori ini.</p>'}
        ${pnav(pf, pages, 'ppage')}
      </section>`;
  }
  function portoDetail(p){
    gal = { id: p.id, i: 0 };
    const facts = [
      ['users', 'Klien', p.client], ['pin', 'Lokasi', p.loc], ['calendar', 'Waktu', fmtDate(p.date)],
      ['wrench', 'Layanan', p.mode], ['gauge', 'Jumlah alat', p.count !== '' && p.count != null ? p.count + ' alat' : '-'],
      ['shield', 'Standar', p.std], ['clock', 'Durasi', p.dur]
    ];
    return `
      <section class="page">
        <div class="pd">
          ${galleryHtml(p)}
          <div class="pd-info">
            <div class="crumb2"><a href="#/portofolio">Portofolio</a><span>/</span><span>${esc(catLabel(p.cat))}</span></div>
            <h2>${esc(p.title)}</h2>
            <p class="pdesc">${esc(p.desc)}</p>
            <dl class="facts">${facts.map(f => `<div><dt>${ic(f[0], 16)} ${f[1]}</dt><dd>${esc(f[2] || '-')}</dd></div>`).join('')}</dl>
            <div class="cta-row" style="margin:0">
              <a class="btn primary" href="${wa('Halo ' + brand() + ', saya tertarik dengan layanan seperti proyek ' + p.title + '.')}" target="_blank" rel="noopener">${ic('chat', 20)} Konsultasi proyek serupa</a>
              <a class="btn ghost" href="#/portofolio">Semua proyek</a>
            </div>
          </div>
        </div>
        ${dnav(sortedP(), p, 'portofolio', 'title')}
      </section>`;
  }

  /* ---- Berita ---- */
  function ncard(n, i){
    const c = cover(n);
    return `<a class="pcard" style="--i:${i}" href="#/berita/${esc(n.id)}">
      <span class="pimg"><img src="${thumbOf(c)}" alt="Foto ${esc(n.title)}" loading="lazy"><span class="pcount">${ic('image', 14)} ${(n.photos || []).length}</span></span>
      <span class="pbody"><span class="ptag">${esc(n.cat)}</span><h3>${esc(n.title)}</h3><span class="nsum">${esc(n.summary)}</span>
        <span class="pmeta"><span>${ic('calendar', 14)} ${esc(fmtFull(n.date))}</span></span></span>
    </a>`;
  }
  function newsList(){
    const list = sortedN(), per = perPage('news'), pages = Math.max(1, Math.ceil(list.length / per));
    if (nf.page < 0) nf.page = pages - 1;
    if (nf.page >= pages) nf.page = 0;
    const cur = list.slice(nf.page * per, (nf.page + 1) * per);
    return `
      <section class="page">
        <div class="head">
          <h2>Berita dan artikel</h2>
          <p>Kabar terbaru, tips kalibrasi, dan informasi layanan dari ${esc(brand())}.</p>
        </div>
        ${cur.length ? `<div class="pgrid news">${cur.map(ncard).join('')}</div>` : '<p class="empty">Belum ada berita.</p>'}
        ${pnav(nf, pages, 'npage')}
      </section>`;
  }
  function newsDetail(n){
    gal = { id: n.id, i: 0 };
    const paras = String(n.body || '').split(/\n\s*\n/).filter(x => x.trim()).map(x => `<p>${esc(x.trim()).replace(/\n/g, '<br>')}</p>`).join('');
    return `
      <section class="page">
        <div class="pd">
          ${galleryHtml(n)}
          <div class="pd-info">
            <div class="crumb2"><a href="#/berita">Berita</a><span>/</span><span>${esc(n.cat)}</span></div>
            <h2>${esc(n.title)}</h2>
            <div class="ameta"><span>${ic('calendar', 16)} ${esc(fmtFull(n.date))}</span><span class="ptag">${esc(n.cat)}</span></div>
            <div class="abody">${paras || '<p>Isi artikel belum ditulis.</p>'}</div>
            <div class="cta-row" style="margin:0">
              <a class="btn primary" href="${wa('Halo ' + brand() + ', saya membaca artikel "' + n.title + '" dan ingin berkonsultasi.')}" target="_blank" rel="noopener">${ic('chat', 20)} Tanya tim ${esc(short())}</a>
              <a class="btn ghost" href="#/berita">Semua berita</a>
            </div>
          </div>
        </div>
        ${dnav(sortedN(), n, 'berita', 'title')}
      </section>`;
  }

  /* ---- Galeri dan lightbox ---- */
  function showPhoto(i){
    const it = galItem(); if (!it) return;
    const ph = photosOf(it);
    gal.i = (i + ph.length) % ph.length;
    const g = document.getElementById('gmain');
    if (g){ g.src = ph[gal.i].s; g.alt = 'Foto ' + (gal.i + 1) + ' ' + it.title; g.classList.remove('swap'); void g.offsetWidth; g.classList.add('swap'); }
    const c = document.getElementById('gcount'); if (c) c.textContent = (gal.i + 1) + ' / ' + ph.length;
    document.querySelectorAll('.thumbs button').forEach((b, j) => b.classList.toggle('on', j === gal.i));
    const li = document.getElementById('lbimg');
    if (li){ li.src = ph[gal.i].s; li.classList.remove('swap'); void li.offsetWidth; li.classList.add('swap'); }
  }
  function lbOpen(){
    let lb = document.getElementById('lb');
    if (!lb){
      lb = document.createElement('div'); lb.id = 'lb'; lb.className = 'lb';
      lb.innerHTML = `<button class="lbx" data-act="lbclose" aria-label="Tutup">${ic('close', 24)}</button>
        <button class="gnav l" data-act="gprev" aria-label="Foto sebelumnya">${ic('chevL', 22)}</button>
        <img id="lbimg" alt="">
        <button class="gnav r" data-act="gnext" aria-label="Foto berikutnya">${ic('chevR', 22)}</button>`;
      document.body.appendChild(lb);
    }
    lb.classList.add('open'); showPhoto(gal.i);
  }

  /* ---- Layanan dan ruang lingkup akreditasi ---- */
  const PAGE_DEF = {
    title: () => 'Ruang lingkup kalibrasi ' + short(),
    desc: () => 'Layanan kalibrasi untuk berbagai besaran ukur dengan standar yang tertelusur secara nasional dan internasional. Pilih satu untuk melihat detailnya.',
    toolsTitle: () => 'Alat yang kami kalibrasi',
    benefitsTitle: () => 'Yang Anda terima',
    scopeBtn: () => 'Lihat ruang lingkup akreditasi',
    consultBtn: () => 'Konsultasi'
  };
  const ptx = k => { const v = PAGES_TXT && PAGES_TXT.layanan && PAGES_TXT.layanan[k]; return (v && String(v).trim()) ? String(v) : PAGE_DEF[k](); };
  const DEF_BENEFITS = ['Sertifikat resmi dengan nilai ketidakpastian (MU)', 'Traceability ke standar KAN/NIST', 'Pilihan layanan onsite atau inlab'];
  const BEN_ICONS = ['filecheck', 'shield', 'pin', 'award', 'clock', 'check'];
  const svcBenefits = s => (Array.isArray(s.benefits) && s.benefits.length) ? s.benefits : DEF_BENEFITS;
  const scopeTools = s => [...new Set((SCOPE[s.id] || []).map(r => r.tool).filter(Boolean))].map(x => x.length > 64 ? x.slice(0, 62) + '...' : x);
  const svcTools = s => (Array.isArray(s.items) && s.items.length) ? s.items : scopeTools(s);
  function svcRowHtml(x, i, preview){
    const inner = `<span class="ico">${ic(x.icon || 'gauge', 22)}</span><span><h3>${esc(x.t)}</h3><p>${esc(x.s)}</p></span><span class="go">${ic('arrowR', 20)}</span>`;
    return preview ? `<div class="row" style="--i:${i}">${inner}</div>` : `<a class="row" style="--i:${i}" href="#/layanan/${esc(x.id)}">${inner}</a>`;
  }
  function svcDetailInner(s, preview, T){
    const tx = k => (T && T[k] && String(T[k]).trim()) ? String(T[k]) : ptx(k);
    const tools = svcTools(s), ben = svcBenefits(s);
    const crumb = preview ? '<span>Layanan</span>' : '<a href="#/layanan">Layanan</a>';
    const scopeBtn = preview
      ? `<span class="btn primary">${ic('clip', 20)} ${esc(tx('scopeBtn'))}</span>`
      : `<button class="btn primary" data-act="scope" data-id="${esc(s.id)}">${ic('clip', 20)} ${esc(tx('scopeBtn'))}</button>`;
    const consult = preview
      ? `<span class="btn ghost on-deep">${ic('chat', 20)} ${esc(tx('consultBtn'))}</span>`
      : `<a class="btn ghost on-deep" href="${wa('Halo ' + brand() + ', saya ingin konsultasi ' + s.t + '.')}" target="_blank" rel="noopener">${ic('chat', 20)} ${esc(tx('consultBtn'))}</a>`;
    return `
        <div class="detail">
          <div class="d-main">
            <div class="crumb">${crumb}<span>/</span><span>${esc(s.t)}</span></div>
            <div class="big">${ic(s.icon || 'gauge', 32)}</div>
            <h2>${esc(s.t)}</h2>
            <p>${esc(s.l)}</p>
            <div class="cta-row" style="margin-top:auto">${scopeBtn}${consult}</div>
          </div>
          <div class="d-side">
            ${tools.length ? `<div>
              <h3>${esc(tx('toolsTitle'))}</h3>
              <ul class="checks">${tools.map(x => `<li>${ic('check', 18, 2.4)}${esc(x)}</li>`).join('')}</ul>
            </div>` : ''}
            <div>
              <h3>${esc(tx('benefitsTitle'))}</h3>
              <ul class="checks">${ben.map((x, k) => `<li>${ic(BEN_ICONS[k % BEN_ICONS.length], 18, 2)}${esc(x)}</li>`).join('')}</ul>
            </div>
          </div>
        </div>`;
  }
  function scopeTable(rows){
    const head = '<thead><tr><th>No.</th><th>Kelompok pengukuran</th><th>Jenis alat atau standar atau bahan yang dikalibrasi atau yang diukur</th><th>Rentang ukur</th><th>Ketidakpastian yang diperluas *)</th><th>Metode kalibrasi/ dokumen standar dan teknik yang digunakan</th></tr></thead>';
    if (!rows.length) return `<table class="stbl">${head}<tbody><tr><td colspan="6" class="sempty">Data ruang lingkup sedang diperbarui. Silakan hubungi kami untuk informasi lebih lanjut.</td></tr></tbody></table>`;
    const body = rows.map((r, i) => {
      const rg = (r.ranges && r.ranges.length) ? r.ranges : [{ r: '', u: '' }], n = rg.length;
      return rg.map((x, j) => `<tr class="${j === 0 ? 'first' : ''}">${j === 0 ? `<td rowspan="${n}">${i + 1}</td><td rowspan="${n}"><b>${esc(r.group)}</b></td><td rowspan="${n}">${esc(r.tool)}</td>` : ''}<td>${esc(x.r)}</td><td>${esc(x.u)}</td>${j === 0 ? `<td rowspan="${n}" class="smeth">${esc(r.method)}</td>` : ''}</tr>`).join('');
    }).join('');
    return `<table class="stbl">${head}<tbody>${body}</tbody></table>`;
  }
  function scopeModal(id, rowsOverride){
    const s = SERVICES.find(x => x.id === id); if (!s) return;
    const rows = rowsOverride || SCOPE[id] || [];
    let m = document.getElementById('sm');
    if (!m){ m = document.createElement('div'); m.id = 'sm'; m.className = 'modal'; document.body.appendChild(m); }
    m.innerHTML = `
      <div class="mbox" role="dialog" aria-modal="true" aria-label="Ruang lingkup akreditasi ${esc(s.t)}">
        <div class="mhead">
          <div><h2>${esc(s.t)}</h2><p>Ruang lingkup akreditasi</p></div>
          <button class="round" data-act="mclose" aria-label="Tutup" id="mclose">${ic('close', 22)}</button>
        </div>
        <div class="twrap">${scopeTable(rows)}</div>
        <div class="mfoot">
          <span class="mhelp"><span class="mi">${ic('arrowR', 18)}</span>Butuh bantuan atau informasi lebih lanjut?</span>
          <a class="btn primary" href="${wa('Halo ' + brand() + ', saya ingin bertanya tentang ruang lingkup ' + s.t + '.')}" target="_blank" rel="noopener">${ic('chat', 20)} Hubungi kami via WhatsApp</a>
        </div>
      </div>`;
    m.classList.add('open');
    const c = document.getElementById('mclose'); if (c) c.focus();
  }
  const closeModal = () => { const m = document.getElementById('sm'); if (m) m.classList.remove('open'); };

  function layananView(id){
    const s = SERVICES.find(x => x.id === id);
    if (!s) return `
      <section class="page">
        <div class="head">
          <h2>${esc(ptx('title'))}</h2>
          <p>${esc(ptx('desc'))}</p>
        </div>
        ${SERVICES.length ? `<div class="ledger">${SERVICES.map((x, i) => svcRowHtml(x, i)).join('')}</div>` : '<p class="empty">Belum ada layanan.</p>'}
      </section>`;
    return `
      <section class="page">${svcDetailInner(s, false)}
        ${dnav(SERVICES, s, 'layanan', 't')}
      </section>`;
  }

  /* ---- Penilaian pelanggan dan Google Maps ---- */
  const mapsQuery = () => brand() + ' Surabaya';
  const safeUrl = u => /^https:\/\//i.test(String(u || '').trim()) ? String(u).trim() : '';
  const hasNum = v => v !== '' && v != null && !isNaN(Number(v));
  const GOOGLE_SEED = { rating: '', count: '', mapsUrl: '', reviewUrl: '', photos: [] };
  let GOOGLE = (DATA.google && typeof DATA.google === 'object' && !Array.isArray(DATA.google)) ? Object.assign({}, GOOGLE_SEED, DATA.google) : GOOGLE_SEED;
  const REVIEWS_SEED = TESTI.map((t, i) => ({ id: 'v' + (i + 1), name: '', org: t.n, sector: t.s, rating: 5, date: ['2026-07-10', '2026-08-14', '2026-09-05'][i] || '2026-09-05', text: t.q, show: true }));
  let REVIEWS = Array.isArray(DATA.reviews) ? DATA.reviews : REVIEWS_SEED;
  let tTab = 'rev', rIdx = 0, lastMine = null;
  const mapsLink = () => safeUrl(GOOGLE.mapsUrl) || 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(mapsQuery());
  const reviewLink = () => safeUrl(GOOGLE.reviewUrl) || mapsLink();
  const visibleReviews = () => REVIEWS.filter(r => r.show !== false).sort(byDate);
  const AVCOL = ['#0b86c0', '#0e9e72', '#c26a00', '#7a4fd1', '#c2410c', '#0f6b6a'];
  const initials = s => { const w = String(s || '').replace(/^(PT|CV|RS)\.?\s+/i, '').trim().split(/\s+/).filter(Boolean); return ((w[0] || '?').charAt(0) + (w[1] || '').charAt(0)).toUpperCase(); };
  const avColor = s => AVCOL[[...String(s || '')].reduce((a, c) => a + c.charCodeAt(0), 0) % AVCOL.length];
  function stars(r, size){
    const pct = Math.max(0, Math.min(100, (Number(r) || 0) / 5 * 100)), one = ic('star', size || 18, 0), row = one.repeat(5);
    return `<span class="sr" role="img" aria-label="Penilaian ${Number(r).toFixed(1)} dari 5"><span class="sb">${row}</span><span class="sf" style="width:${pct}%">${row}</span></span>`;
  }
  function reviewStats(){
    const v = visibleReviews(), count = v.length, dist = [0, 0, 0, 0, 0, 0];
    let sum = 0; v.forEach(r => { const n = Math.max(1, Math.min(5, Math.round(Number(r.rating) || 0))); dist[n]++; sum += Number(r.rating) || 0; });
    return { count, avg: count ? sum / count : 0, dist };
  }
  function homeTrust(){
    const st = reviewStats(); let h = '';
    if (st.count) h += `<a class="gchip" href="#/testimoni" data-act="torev">${ic('star', 14, 0)} ${st.avg.toFixed(1)} dari ${st.count} penilaian</a>`;
    if (hasNum(GOOGLE.rating) && Number(GOOGLE.rating) > 0) h += `<a class="gchip" href="#/testimoni" data-act="togm">${ic('star', 14, 0)} ${Number(GOOGLE.rating).toFixed(1)} di Google Maps</a>`;
    return h;
  }
  function reviewsHtml(){
    const st = reviewStats();
    return `
      <div class="rv">
        <div class="rsum">
          ${st.count ? `<div class="rbig"><b>${st.avg.toFixed(1)}</b>${stars(st.avg, 22)}<span>dari ${st.count} penilaian pelanggan</span></div>
          <div class="rbars">${[5, 4, 3, 2, 1].map(n => `<div class="rbar"><span>${n}</span><i><u style="width:${Math.round(st.dist[n] / st.count * 100)}%"></u></i><em>${st.dist[n]}</em></div>`).join('')}</div>` : '<p class="hint">Belum ada penilaian. Jadilah yang pertama memberi penilaian.</p>'}
          <div class="cta-row" style="margin:0">
            <button class="btn primary" data-act="rate">${ic('star', 18, 0)} Beri penilaian</button>
            <a class="btn ghost" href="${esc(reviewLink())}" target="_blank" rel="noopener">Tulis ulasan di Google</a>
          </div>
        </div>
        <div>
          <div id="rq" aria-live="polite"></div>
          ${st.count > 1 ? `<div class="rctl">
            <button class="round" data-act="rprev" aria-label="Penilaian sebelumnya">${ic('arrowL', 20)}</button>
            <button class="round" data-act="rnext" aria-label="Penilaian berikutnya">${ic('arrowR', 20)}</button>
            <div class="dots" id="rdots"></div>
          </div>` : ''}
        </div>
      </div>`;
  }
  function drawReview(dir){
    const v = visibleReviews(), el = document.getElementById('rq'); if (!el) return;
    if (!v.length){ el.innerHTML = ''; return; }
    if (rIdx >= v.length || rIdx < 0) rIdx = 0;
    const r = v[rIdx], who = r.org || r.name, sub = [r.name && r.org ? r.name : '', r.sector].filter(Boolean).join(', ');
    el.innerHTML = `
      <figure class="rcard" style="margin:0;--dx:${dir < 0 ? '-30px' : '30px'}">
        ${r.mine ? '<span class="rbadge">' + ic('star', 14, 0) + ' Penilaian Anda, menunggu ditinjau tim ' + esc(short()) + '</span>' : ''}
        <blockquote>“${esc(r.text)}”</blockquote>
        <figcaption class="rwho">
          <span class="av" style="background:${avColor(who)}">${esc(initials(who))}</span>
          <span><b>${esc(who)}</b><small>${esc(sub)}</small></span>
          <span class="rr">${stars(r.rating, 16)}<span>${esc(fmtFull(r.date))}</span></span>
        </figcaption>
      </figure>`;
    const dots = document.getElementById('rdots');
    if (dots) dots.innerHTML = v.map((_, i) => `<i class="${i === rIdx ? 'on' : ''}"></i>`).join('');
  }
  function mapSvg(){
    return `<svg class="gmap" viewBox="0 0 520 230" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Ilustrasi peta lokasi">
      <rect width="520" height="230" fill="var(--surface-2)"/>
      <g fill="var(--line)"><rect x="20" y="20" width="90" height="50" rx="10"/><rect x="190" y="150" width="120" height="60" rx="10"/><rect x="390" y="30" width="110" height="70" rx="10"/><rect x="40" y="150" width="70" height="60" rx="10"/><rect x="380" y="150" width="100" height="60" rx="10"/></g>
      <g fill="none" stroke-linecap="round"><path d="M-10 118 L540 108" stroke="var(--tick)" stroke-width="15" opacity=".35"/><path d="M150 -10 L170 240" stroke="var(--tick)" stroke-width="15" opacity=".35"/><path d="M350 -10 L335 240" stroke="var(--tick)" stroke-width="15" opacity=".35"/>
        <path d="M-10 118 L540 108" stroke="var(--surface)" stroke-width="10"/><path d="M150 -10 L170 240" stroke="var(--surface)" stroke-width="10"/><path d="M350 -10 L335 240" stroke="var(--surface)" stroke-width="10"/></g>
      <path d="M260 150 C236 122 224 108 224 94 a36 36 0 1 1 72 0 C296 108 284 122 260 150Z" fill="#ff8a00"/><circle cx="260" cy="94" r="13" fill="#fff"/>
    </svg>`;
  }
  function gmapsHtml(){
    const ph = GOOGLE.photos || [], show = ph.slice(0, 6), extra = ph.length - 6;
    const rated = hasNum(GOOGLE.rating) && Number(GOOGLE.rating) > 0;
    return `
      <div class="gm">
        <div class="gcard">
          ${mapSvg()}
          <div class="gbody">
            ${rated ? `<div class="grate"><b>${Number(GOOGLE.rating).toFixed(1)}</b>${stars(Number(GOOGLE.rating), 22)}<span class="t">${hasNum(GOOGLE.count) && Number(GOOGLE.count) > 0 ? esc(GOOGLE.count) + ' ulasan di Google' : 'Penilaian di Google Maps'}</span></div>` : ''}
            <p class="gaddr">${ic('pin', 16)} Perumahan Araya Block N1/14, Malang 65125</p>
            <div class="cta-row" style="margin:0">
              <a class="btn primary" href="${esc(mapsLink())}" target="_blank" rel="noopener">${ic('pin', 18)} Buka di Google Maps</a>
              <a class="btn ghost" href="${esc(reviewLink())}" target="_blank" rel="noopener">Tulis ulasan di Google</a>
            </div>
          </div>
        </div>
        ${show.length ? `<div class="gphotos">${show.map((x, i) => `<button class="gph" data-act="gphoto" data-i="${i}" aria-label="Lihat foto ${i + 1}"><img src="${thumbOf(x)}" alt="Foto lokasi ${i + 1}" loading="lazy">${i === 5 && extra > 0 ? `<span class="more">+${extra}</span>` : ''}</button>`).join('')}</div>`
        : `<div class="gnote"><h3>Lihat kami di Google Maps</h3><p>Foto lokasi, jam layanan, dan ulasan terbaru dari pelanggan tersedia langsung di halaman Google Maps kami.</p><a class="btn ghost" href="${esc(mapsLink())}" target="_blank" rel="noopener">Buka halaman kami</a></div>`}
      </div>`;
  }
  function testiView(){
    return `
      <section class="page">
        <div class="head">
          <h2>Kata pelanggan kami</h2>
          <p>Penilaian dari pelanggan dan tampilan lokasi kami di Google Maps.</p>
        </div>
        <div class="seg" role="tablist" aria-label="Jenis penilaian">
          <button role="tab" data-act="ttab" data-v="rev" aria-selected="${tTab === 'rev'}">Penilaian pelanggan</button>
          <button role="tab" data-act="ttab" data-v="gmaps" aria-selected="${tTab === 'gmaps'}">Google Maps</button>
        </div>
        ${tTab === 'gmaps' ? gmapsHtml() : reviewsHtml()}
      </section>`;
  }
  function rateModal(){
    let m = document.getElementById('sm');
    if (!m){ m = document.createElement('div'); m.id = 'sm'; m.className = 'modal'; document.body.appendChild(m); }
    m.innerHTML = `
      <div class="mbox narrow" role="dialog" aria-modal="true" aria-label="Beri penilaian">
        <div class="mhead"><div><h2>Beri penilaian</h2><p>Ulasan akan ditampilkan setelah disetujui admin.</p></div>
          <button class="round" data-act="mclose" aria-label="Tutup" id="mclose">${ic('close', 22)}</button></div>
        <form class="rateform" id="rateform" autocomplete="off">
          <div class="field">Penilaian Anda
            <div class="starpick" role="radiogroup" aria-label="Jumlah bintang">
              ${[5, 4, 3, 2, 1].map(n => `<input type="radio" name="rating" id="st${n}" value="${n}" ${n === 5 ? 'required' : ''}><label for="st${n}" title="${n} bintang">${ic('star', 34, 0)}</label>`).join('')}
            </div>
          </div>
          <div class="two">
            <label class="field">Nama<input name="nama" required autocomplete="name"></label>
            <label class="field">Perusahaan<input name="pt" autocomplete="organization"></label>
          </div>
          <label class="field">Ulasan<textarea name="ulasan" rows="3" required placeholder="Ceritakan pengalaman Anda"></textarea></label>
          <p class="err" id="rateerr" role="alert"></p>
          <button class="btn primary" type="submit">${ic('star', 18, 0)} Beri penilaian</button>
        </form>
      </div>`;
    m.classList.add('open');
  }

  function rateDone(m){
    const box = document.querySelector('#sm .mbox'); if (!box) return;
    box.innerHTML = `
      <div class="rdone" role="status" aria-live="polite">
        <svg class="rdsvg" viewBox="0 0 120 120" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle class="rd-ring" cx="60" cy="60" r="52" stroke="#ff8a00" stroke-width="5" pathLength="100" transform="rotate(-90 60 60)"/><path class="rd-check" d="M38 62 54 78 84 44" stroke="currentColor" stroke-width="7" pathLength="100"/></svg>
        <h2>Terima kasih, ${esc(m.name)}!</h2>
        <div>${stars(m.rating, 30)}</div>
        <p>Ulasan Anda sudah dikirim dan menunggu persetujuan admin. Setelah disetujui, ulasan akan tampil untuk semua pengunjung.</p>
        <div class="rdg">
          <b>Bagikan juga di Google Maps (opsional)</b>
          <p>Klik tombol ini: ulasan Anda disalin lalu Google Maps terbuka. Pilih ${m.rating} bintang, tempel ulasan, dan kirim dengan akun Google Anda.</p>
          <button class="btn primary" data-act="rcopy" id="rcopy">${ic('pin', 18)} Salin ulasan dan buka Google Maps</button>
          <textarea class="rdtxt" id="rdtxt" rows="2" readonly aria-label="Teks ulasan untuk disalin">${esc(m.text)}</textarea>
          <small class="hint">Google tidak mengizinkan ulasan dikirim otomatis dari website, jadi langkah terakhir ini Anda selesaikan sendiri.</small>
        </div>
        <button class="btn ghost" data-act="mclose">Selesai</button>
      </div>`;
  }
  function celebrate(before, n){
    const rs = document.querySelector('.rsum'); if (!rs) return;
    rs.classList.add('just');
    const big = rs.querySelector('.rbig');
    if (big){ const p = document.createElement('span'); p.className = 'rplus'; p.textContent = '+' + n + ' bintang'; big.appendChild(p); setTimeout(() => p.remove(), 2300); }
    const el = rs.querySelector('.rbig b'), to = reviewStats().avg, from = before.avg;
    if (el){ const t0 = performance.now(); const step = now => { const p = Math.min(1, (now - t0) / 900); el.textContent = (from + (to - from) * p).toFixed(1); if (p < 1) requestAnimationFrame(step); }; requestAnimationFrame(step); }
  }
  function copySync(txt){
    try {
      const ta = document.createElement('textarea'); ta.value = txt; ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0'; document.body.appendChild(ta);
      ta.select(); ta.setSelectionRange(0, txt.length); const ok = document.execCommand('copy'); ta.remove(); return ok;
    } catch (e) { return false; }
  }

  /* ---- Editor admin: ulasan dan Google Maps ---- */
  const gdraft = () => ({ id: 'gmaps', rating: GOOGLE.rating, count: GOOGLE.count, mapsUrl: GOOGLE.mapsUrl, reviewUrl: GOOGLE.reviewUrl, photos: JSON.parse(JSON.stringify(GOOGLE.photos || [])) });
  function rEditor(){
    const d = adm.draft;
    return `
      <form id="rform" autocomplete="off">
        <h3>${adm.isNew ? 'Ulasan baru' : 'Ubah ulasan'}</h3>
        ${adm.isNew ? `<div class="field"><span>Impor dari pesan WhatsApp pelanggan (opsional)</span>
          <textarea id="rimp" rows="3" placeholder="Tempel pesan penilaian yang masuk lewat WhatsApp"></textarea>
          <div><button type="button" class="btn ghost sm" data-act="rimport">Isi otomatis dari pesan</button></div></div>` : ''}
        <div class="two">
          <label class="field">Perusahaan atau instansi<input name="org" value="${esc(d.org)}" required></label>
          <label class="field">Nama pemberi ulasan (opsional)<input name="name" value="${esc(d.name)}"></label>
        </div>
        <div class="three">
          <label class="field">Bidang<input name="sector" value="${esc(d.sector)}" placeholder="Kesehatan"></label>
          <label class="field">Bintang<select name="rating">${[5, 4, 3, 2, 1].map(n => `<option value="${n}" ${String(d.rating) === String(n) ? 'selected' : ''}>${n} bintang</option>`).join('')}</select></label>
          <label class="field">Tanggal<input type="date" name="date" value="${esc(d.date)}"></label>
        </div>
        <label class="field">Isi ulasan<textarea name="text" rows="4" required>${esc(d.text)}</textarea></label>
        <label class="cbx"><input type="checkbox" name="show" ${d.show !== false ? 'checked' : ''}> Tampilkan di website</label>
        ${saveBar('Simpan', true)}
      </form>`;
  }
  function gEditor(){
    const d = adm.draft;
    return `
      <form id="gform" autocomplete="off">
        <h3>Google Maps</h3>
        <p class="hint">Website tidak bisa mengambil data Google secara otomatis. Salin rating dan jumlah ulasan dari profil Google Maps Anda, lalu unggah foto lokasi milik Anda sendiri.</p>
        <div class="two">
          <label class="field">Rating Google (0 sampai 5)<input type="number" step="0.1" min="0" max="5" name="rating" value="${esc(d.rating)}" placeholder="4.9"></label>
          <label class="field">Jumlah ulasan Google<input type="number" min="0" name="count" value="${esc(d.count)}" placeholder="120"></label>
        </div>
        <label class="field">Tautan Google Maps<input type="url" name="mapsUrl" value="${esc(d.mapsUrl)}" placeholder="https://maps.app.goo.gl/..."></label>
        <label class="field">Tautan tulis ulasan Google<input type="url" name="reviewUrl" value="${esc(d.reviewUrl)}" placeholder="https://g.page/r/.../review"></label>
        <span class="hint">Tautan ulasan bisa diambil dari Google Business Profile, menu "Minta ulasan". Jika kosong, tombol mengarah ke halaman Google Maps.</span>
        ${photoField()}
        ${saveBar('Simpan', false)}
      </form>`;
  }

  /* ---- Admin: PIN ---- */
  function shaFallback(bytes){
    const k = [
      0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
      0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
      0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
      0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
      0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
      0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
      0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
      0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2
    ];
    const state = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
    const rotate = (value, bits) => (value >>> bits) | (value << (32 - bits));
    const bitLength = bytes.length * 8;
    const paddedLength = Math.ceil((bytes.length + 9) / 64) * 64;
    const padded = new Uint8Array(paddedLength);
    padded.set(bytes);
    padded[bytes.length] = 0x80;
    const view = new DataView(padded.buffer);
    view.setUint32(paddedLength - 8, Math.floor(bitLength / 0x100000000), false);
    view.setUint32(paddedLength - 4, bitLength >>> 0, false);

    for (let offset = 0; offset < paddedLength; offset += 64){
      const words = new Uint32Array(64);
      for (let i = 0; i < 16; i++) words[i] = view.getUint32(offset + i * 4, false);
      for (let i = 16; i < 64; i++){
        const a = words[i - 15], b = words[i - 2];
        const s0 = rotate(a, 7) ^ rotate(a, 18) ^ (a >>> 3);
        const s1 = rotate(b, 17) ^ rotate(b, 19) ^ (b >>> 10);
        words[i] = (words[i - 16] + s0 + words[i - 7] + s1) >>> 0;
      }

      let [a, b, c, d, e, f, g, h] = state;
      for (let i = 0; i < 64; i++){
        const s1 = rotate(e, 6) ^ rotate(e, 11) ^ rotate(e, 25);
        const choice = (e & f) ^ (~e & g);
        const t1 = (h + s1 + choice + k[i] + words[i]) >>> 0;
        const s0 = rotate(a, 2) ^ rotate(a, 13) ^ rotate(a, 22);
        const majority = (a & b) ^ (a & c) ^ (b & c);
        const t2 = (s0 + majority) >>> 0;
        h = g; g = f; f = e; e = (d + t1) >>> 0;
        d = c; c = b; b = a; a = (t1 + t2) >>> 0;
      }
      state[0] = (state[0] + a) >>> 0; state[1] = (state[1] + b) >>> 0;
      state[2] = (state[2] + c) >>> 0; state[3] = (state[3] + d) >>> 0;
      state[4] = (state[4] + e) >>> 0; state[5] = (state[5] + f) >>> 0;
      state[6] = (state[6] + g) >>> 0; state[7] = (state[7] + h) >>> 0;
    }
    return state.map(word => word.toString(16).padStart(8, '0')).join('');
  }
  async function sha(s){
    const input = new TextEncoder().encode('fss-pin:' + s);
    if (globalThis.crypto && globalThis.crypto.subtle){
      const b = await globalThis.crypto.subtle.digest('SHA-256', input);
      return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
    }
    return shaFallback(input);
  }
  async function pinOk(s){ try { return Boolean(pinHash) && (await sha(s)) === pinHash; } catch (e) { return false; } }
  function pinGate(){
    return `
      <section class="page">
        <form class="gatecard" id="pinform">
          <span class="lockic">${ic('lock', 28)}</span>
          <h2>Masuk admin</h2>
          <p>Masukkan PIN untuk mengelola website.</p>
          <input id="pin" type="password" inputmode="numeric" autocomplete="off" maxlength="12" aria-label="PIN admin" required>
          <p class="err" id="perr" role="alert"></p>
          <button class="btn primary" type="submit">Masuk</button>
          <a class="btn ghost" href="#/">Kembali ke website</a>
        </form>
      </section>`;
  }
  async function onPin(){
    const form = document.getElementById('pinform'), inp = document.getElementById('pin'), err = document.getElementById('perr');
    const btn = form.querySelector('button[type=submit]');
    const wait = adm.lockUntil - Date.now();
    if (wait > 0){ err.textContent = 'Terlalu banyak percobaan. Coba lagi dalam ' + Math.ceil(wait / 1000) + ' detik.'; return; }
    const label = btn.textContent; btn.disabled = true; btn.innerHTML = '<span class="spin"></span>Memeriksa PIN...';
    let good = false, loginError = '';
    if (hasBackendApi){
      try {
        const response = await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pin: inp.value })
        });
        const result = await response.json().catch(() => ({}));
        if (response.ok){
          const dataResponse = await fetch('/api/data', { cache: 'no-store' });
          if (!dataResponse.ok) throw new Error('Sesi Admin gagal disiapkan. Coba masuk kembali.');
          const adminData = await dataResponse.json();
          pinHash = adminData.pinHash || DEFAULT_PIN_HASH;
          good = true;
        } else {
          loginError = result.error || 'PIN admin salah.';
        }
      } catch (error){
        btn.disabled = false; btn.textContent = label;
        err.textContent = error.message;
        return;
      }
    } else {
      good = await pinOk(inp.value);
    }
    await new Promise(r => setTimeout(r, REDUCE ? 0 : 450));
    if (good){
      adm.tries = 0; adm.authed = true; sess.set('fss_admin', '1'); loginOk(() => render()); return;
    }
    btn.disabled = false; btn.textContent = label;
    adm.tries++; inp.value = '';
    if (adm.tries >= 5){ adm.lockUntil = Date.now() + 30000; adm.tries = 0; err.textContent = 'Terlalu banyak percobaan. Tunggu 30 detik.'; }
    else err.textContent = loginError || 'PIN salah. Coba lagi.';
    form.classList.remove('shake'); void form.offsetWidth; form.classList.add('shake');
    inp.focus();
  }


  /* ---- Admin: panel ---- */
  function setMsg(t, bad){ const m = document.getElementById('amsg'); if (!m) return; m.textContent = t || ''; m.className = 'a-msg' + (bad ? ' bad' : ''); }
  function bytes(){
    let n = 0;
    const add = arr => { for (const p of arr){ if (adm.draft && p.id === adm.draft.id) continue; for (const x of (p.photos || [])) n += (x.s || '').length + (x.t || '').length; } };
    add(P); add(N); add([{ id: 'gmaps', photos: GOOGLE.photos }]);
    if (adm.draft && adm.draft.photos) for (const x of adm.draft.photos) n += (x.s || '').length + (x.t || '').length;
    return n;
  }
  function drawSize(){
    const el = document.getElementById('psize'); if (!el) return;
    const mb = bytes() / 1048576, over = bytes() > LIMIT * 0.85;
    el.innerHTML = `<span class="${over ? 'warn' : ''}">(${mb.toFixed(1)} MB dari ${(LIMIT / 1048576).toFixed(0)} MB)</span>`;
  }
  function drawPhotos(){
    const el = document.getElementById('photos'); if (!el || !adm.draft || !adm.draft.photos) return;
    const ph = adm.draft.photos;
    el.innerHTML = ph.length ? ph.map((x, i) => `
      <figure class="ph">
        <img src="${thumbOf(x)}" alt="Foto ${i + 1}">
        ${i === 0 ? '<span class="cover">Sampul</span>' : ''}
        <figcaption>
          <button type="button" data-act="phl" data-i="${i}" ${i === 0 ? 'disabled' : ''} aria-label="Geser ke kiri">${ic('chevL', 16)}</button>
          <button type="button" data-act="phr" data-i="${i}" ${i === ph.length - 1 ? 'disabled' : ''} aria-label="Geser ke kanan">${ic('chevR', 16)}</button>
          <button type="button" data-act="phrep" data-i="${i}" aria-label="Ganti foto ${i + 1}">${ic('refresh', 16)}</button>
          <button type="button" data-act="phdel" data-i="${i}" aria-label="Hapus foto ${i + 1}">${ic('trash', 16)}</button>
        </figcaption>
      </figure>`).join('') : '<p class="hint">Belum ada foto. Tambahkan minimal satu foto.</p>';
    drawSize();
  }
  const photoField = () => `
    <div class="field">
      <span>Foto <span id="psize"></span></span>
      <div class="photos" id="photos"></div>
      <div><button type="button" class="btn ghost sm" data-act="pick">${ic('upload', 18)} Tambah foto</button></div>
      <input type="file" id="fadd" accept="image/*" multiple data-fx="add" hidden>
      <input type="file" id="frep" accept="image/*" data-fx="rep" hidden>
      <span class="hint">Foto pertama menjadi sampul. Foto dikecilkan otomatis agar halaman tetap ringan.</span>
    </div>`;
  const saveBar = (label, canDelete) => `
    <div class="a-save">
      <button class="btn primary" type="submit" id="asave">${label}</button>
      <button class="btn ghost" type="button" data-act="acancel">Batal</button>
      ${canDelete && !adm.isNew ? '<button class="btn danger" type="button" data-act="adel">Hapus</button>' : ''}
    </div>`;

  function editor(){
    const d = adm.draft;
    return `
      <form id="pform" autocomplete="off">
        <h3>${adm.isNew ? 'Proyek baru' : 'Ubah proyek'}</h3>
        <label class="field">Judul proyek<input name="title" value="${esc(d.title)}" required></label>
        <div class="two">
          <label class="field">Klien<input name="client" value="${esc(d.client)}"></label>
          <label class="field">Lokasi<input name="loc" value="${esc(d.loc)}"></label>
        </div>
        <div class="two">
          <label class="field">Kategori<select name="cat">${SERVICES.map(s => `<option value="${esc(s.id)}" ${d.cat === s.id ? 'selected' : ''}>${esc(s.t)}</option>`).join('')}</select></label>
          <label class="field">Layanan<select name="mode">${MODES.map(m => `<option ${d.mode === m ? 'selected' : ''}>${m}</option>`).join('')}</select></label>
        </div>
        <div class="three">
          <label class="field">Waktu<input type="month" name="date" value="${esc(d.date)}"></label>
          <label class="field">Jumlah alat<input type="number" min="0" name="count" value="${esc(d.count)}"></label>
          <label class="field">Durasi<input name="dur" value="${esc(d.dur)}" placeholder="2 hari"></label>
        </div>
        <label class="field">Standar<input name="std" value="${esc(d.std)}" placeholder="ISO 17025, KAN"></label>
        <label class="field">Deskripsi<textarea name="desc" rows="3">${esc(d.desc)}</textarea></label>
        ${photoField()}
        ${saveBar('Simpan', true)}
      </form>`;
  }
  function newsEditor(){
    const d = adm.draft;
    return `
      <form id="nform" autocomplete="off">
        <h3>${adm.isNew ? 'Artikel baru' : 'Ubah artikel'}</h3>
        <label class="field">Judul artikel<input name="title" value="${esc(d.title)}" required></label>
        <div class="two">
          <label class="field">Tanggal<input type="date" name="date" value="${esc(d.date)}"></label>
          <label class="field">Kategori<select name="cat">${NCATS.map(c => `<option ${d.cat === c ? 'selected' : ''}>${c}</option>`).join('')}</select></label>
        </div>
        <label class="field">Ringkasan (tampil di daftar berita)<textarea name="summary" rows="2">${esc(d.summary)}</textarea></label>
        <label class="field">Isi artikel<textarea name="body" rows="9">${esc(d.body)}</textarea></label>
        <span class="hint">Pisahkan paragraf dengan satu baris kosong.</span>
        ${photoField()}
        ${saveBar('Simpan', true)}
      </form>`;
  }
  const lines = t => String(t || '').split('\n').map(x => x.trim()).filter(Boolean);
  const svcFromDraft = d => ({ id: d.id || 'preview', t: String(d.t || '').trim() || '(Nama layanan)', icon: d.icon || 'gauge', s: d.s || '', l: d.l || '', items: lines(d.itemsText), benefits: lines(d.benefitsText) });
  const pgdraft = () => ({ pageTxt: true, id: '__page', title: ptx('title'), desc: ptx('desc'), toolsTitle: ptx('toolsTitle'), benefitsTitle: ptx('benefitsTitle'), scopeBtn: ptx('scopeBtn'), consultBtn: ptx('consultBtn') });
  function fitPreview(){
    document.querySelectorAll('.pvbox').forEach(b => { const pv = b.firstElementChild; if (pv) pv.style.zoom = String(Math.max(.3, Math.min(1, (b.clientWidth - 24) / 1000))); });
  }
  function drawSvcPreview(){
    const el = document.getElementById('svcprev'); if (!el || !adm.draft) return;
    const d = adm.draft;
    if (d.pageTxt){
      const T = { title: d.title, desc: d.desc, toolsTitle: d.toolsTitle, benefitsTitle: d.benefitsTitle, scopeBtn: d.scopeBtn, consultBtn: d.consultBtn };
      const tx = k => (T[k] && String(T[k]).trim()) ? String(T[k]) : PAGE_DEF[k]();
      const first = SERVICES[0] || svcFromDraft({ t: 'Contoh layanan', icon: 'gauge', s: 'Ringkasan layanan.', l: 'Penjelasan layanan.', itemsText: 'Contoh alat', benefitsText: '' });
      el.innerHTML = `<h4 class="sec">Pratinjau halaman pengunjung</h4>
        <div class="pvbox"><div class="pv"><div class="head"><h2>${esc(tx('title'))}</h2><p>${esc(tx('desc'))}</p></div><div class="ledger">${svcRowHtml(first, 0, true)}</div></div></div>
        <div class="pvbox"><div class="pv">${svcDetailInner(first, true, T)}</div></div>`;
    } else {
      const ds = svcFromDraft(d);
      el.innerHTML = `<h4 class="sec">Pratinjau halaman pengunjung</h4>
        <p class="hint">Daftar layanan</p>
        <div class="pvbox"><div class="pv"><div class="ledger">${svcRowHtml(ds, 0, true)}</div></div></div>
        <p class="hint">Halaman detail layanan</p>
        <div class="pvbox"><div class="pv">${svcDetailInner(ds, true)}</div></div>`;
    }
    fitPreview();
  }
  function svcEditor(){
    const d = adm.draft;
    return `
      <form id="lform" autocomplete="off">
        <h3>${adm.isNew ? 'Layanan baru' : 'Ubah layanan'}</h3>
        <p class="hint">Isian di bawah sama dengan yang tampil di halaman Layanan pengunjung. Pratinjau di bagian bawah berubah saat Anda mengetik.</p>
        <label class="field">Nama layanan<input name="t" value="${esc(d.t)}" required></label>
        <div class="two">
          <label class="field">Ikon<select name="icon">${ICON_CHOICES.map(c => `<option value="${c[0]}" ${d.icon === c[0] ? 'selected' : ''}>${c[1]}</option>`).join('')}</select></label>
          <label class="field">Urutan tampil<input type="number" min="1" max="${SERVICES.length + (adm.isNew ? 1 : 0)}" name="order" value="${esc(d.order)}"></label>
        </div>
        <label class="field">Ringkasan (tampil di daftar layanan)<textarea name="s" rows="2">${esc(d.s)}</textarea></label>
        <label class="field">Penjelasan lengkap (panel kiri halaman detail)<textarea name="l" rows="4">${esc(d.l)}</textarea></label>
        <label class="field">${esc(ptx('toolsTitle'))} (satu per baris)<textarea name="itemsText" rows="5" placeholder="Timbangan analitik">${esc(d.itemsText)}</textarea></label>
        <div class="a-save">
          <button type="button" class="btn ghost sm" data-act="fillTools">Isi dari tabel ruang lingkup</button>
          ${adm.isNew ? '' : '<button type="button" class="btn ghost sm" data-act="gotoscope">Edit tabel ruang lingkup layanan ini</button>'}
        </div>
        <span class="hint">Jika dikosongkan, daftar alat diambil otomatis dari tabel ruang lingkup layanan ini.</span>
        <label class="field">${esc(ptx('benefitsTitle'))} (satu per baris)<textarea name="benefitsText" rows="4" placeholder="Sertifikat resmi dengan nilai ketidakpastian (MU)">${esc(d.benefitsText)}</textarea></label>
        <span class="hint">Jika dikosongkan, dipakai tiga poin bawaan.</span>
        ${saveBar('Simpan', true)}
        <div class="svc-prev" id="svcprev"></div>
      </form>`;
  }
  function pgEditor(){
    const d = adm.draft;
    return `
      <form id="pgform" autocomplete="off">
        <h3>Judul dan teks halaman Layanan</h3>
        <p class="hint">Teks yang tampil di halaman Layanan pengunjung. Kosongkan sebuah kolom untuk memakai teks bawaan.</p>
        <label class="field">Judul halaman daftar layanan<input name="title" value="${esc(d.title)}"></label>
        <label class="field">Deskripsi di bawah judul<textarea name="desc" rows="3">${esc(d.desc)}</textarea></label>
        <div class="two">
          <label class="field">Judul daftar alat (halaman detail)<input name="toolsTitle" value="${esc(d.toolsTitle)}"></label>
          <label class="field">Judul poin yang diterima<input name="benefitsTitle" value="${esc(d.benefitsTitle)}"></label>
        </div>
        <div class="two">
          <label class="field">Tulisan tombol ruang lingkup<input name="scopeBtn" value="${esc(d.scopeBtn)}"></label>
          <label class="field">Tulisan tombol konsultasi<input name="consultBtn" value="${esc(d.consultBtn)}"></label>
        </div>
        ${saveBar('Simpan', false)}
        <div class="svc-prev" id="svcprev"></div>
      </form>`;
  }
  function scopeEditor(){
    const s = SERVICES.find(x => x.id === adm.draft.svc);
    return `
      <form id="sform" autocomplete="off">
        <h3>Ruang lingkup: ${esc(s ? s.t : '')}</h3>
        <p class="hint">Isi ini tampil di jendela "Ruang lingkup akreditasi". Tulis rentang ukur dan ketidakpastian satu pasang per baris, dipisah tanda | (contoh: 1 mg ~ 5 mg | 0.28 mg). Dua kolom dari Excel juga bisa ditempel langsung.</p>
        <div id="srows"></div>
        <div class="a-save"><button type="button" class="btn ghost sm" data-act="rowadd">${ic('plus', 18)} Tambah baris</button></div>
        <div class="a-save">
          <button class="btn primary" type="submit" id="asave">Simpan ruang lingkup</button>
          <button class="btn ghost" type="button" data-act="rowpreview">Pratinjau</button>
          <button class="btn ghost" type="button" data-act="acancel">Batal</button>
        </div>
      </form>`;
  }
  function drawRows(){
    const el = document.getElementById('srows'); if (!el || !adm.draft || !adm.draft.rows) return;
    const rows = adm.draft.rows;
    el.innerHTML = rows.length ? rows.map((r, i) => `
      <fieldset class="srow">
        <legend>Baris ${i + 1}</legend>
        <div class="two">
          <label class="field">Kelompok pengukuran<input data-r="${i}" data-k="group" value="${esc(r.group)}"></label>
          <label class="field">Jenis alat atau standar<input data-r="${i}" data-k="tool" value="${esc(r.tool)}"></label>
        </div>
        <label class="field">Rentang ukur | ketidakpastian (satu pasang per baris)<textarea data-r="${i}" data-k="text" rows="5" placeholder="0 °C ~ 200 °C | 0.33 °C">${esc(r.text)}</textarea></label>
        <label class="field">Metode kalibrasi atau dokumen standar<input data-r="${i}" data-k="method" value="${esc(r.method)}"></label>
        <div class="rtools">
          <button type="button" data-act="rowup" data-i="${i}" ${i === 0 ? 'disabled' : ''}>${ic('chevU', 16)} Naik</button>
          <button type="button" data-act="rowdown" data-i="${i}" ${i === rows.length - 1 ? 'disabled' : ''}>${ic('chevD', 16)} Turun</button>
          <button type="button" class="del" data-act="rowdel" data-i="${i}">${ic('trash', 16)} Hapus baris</button>
        </div>
      </fieldset>`).join('') : '<p class="hint">Belum ada baris. Pengunjung akan melihat pesan bahwa data sedang diperbarui.</p>';
  }
  const parseRanges = t => String(t || '').split('\n').map(l => l.trim()).filter(Boolean).map(l => { const p = l.split(/\s*\|\s*|\t/); return { r: (p[0] || '').trim(), u: p.slice(1).join(' ').trim() }; });
  const rowsToStore = rows => rows.filter(r => (r.group || '').trim() || (r.tool || '').trim() || (r.text || '').trim()).map(r => ({ id: r.id, group: (r.group || '').trim(), tool: (r.tool || '').trim(), method: (r.method || '').trim(), ranges: parseRanges(r.text) }));
  const rowsToDraft = list => (list || []).map(r => ({ id: r.id, group: r.group, tool: r.tool, method: r.method, text: (r.ranges || []).map(x => x.r + ' | ' + x.u).join('\n') }));

  function pinPanel(){
    return `
      <form id="pinchg">
        <h3>Ubah PIN admin</h3>
        <label class="field">PIN lama<input type="password" inputmode="numeric" name="old" autocomplete="off" required></label>
        <label class="field">PIN baru (6 sampai 12 angka)<input type="password" inputmode="numeric" name="n1" autocomplete="off" required></label>
        <label class="field">Ulangi PIN baru<input type="password" inputmode="numeric" name="n2" autocomplete="off" required></label>
        <div class="a-save"><button class="btn primary" type="submit">Simpan PIN</button></div>
      </form>`;
  }
  const sdraft = () => ({ id: 'settings', wa: waDigits(SETTINGS.wa || WA_DEFAULT), name: SETTINGS.name || DEFAULT_NAME, short: SETTINGS.short || DEFAULT_SHORT, logo: SETTINGS.logo || null, logoName: SETTINGS.logoName !== false, color1: SETTINGS.color1 || DEF_C1, color2: SETTINGS.color2 || DEF_C2, mode: SETTINGS.mode || 'auto' });
  const waPrev = cur => cur ? 'Akan dipakai sebagai: <b>' + esc(waShow(cur)) + '</b>' : 'Belum diisi. Tombol WhatsApp akan membuka WhatsApp tanpa nomor tujuan.';
  function settingsPanel(){
    const d = adm.draft || sdraft();
    return `
      <form id="wform" autocomplete="off">
        <h3>Pengaturan website</h3>
        <p class="hint">Perubahan langsung terlihat sebagai pratinjau di seluruh website. Klik Simpan agar tetap dipakai.</p>
        <h4 class="sec">Identitas perusahaan</h4>
        <div class="two">
          <label class="field">Nama perusahaan<input name="name" value="${esc(d.name)}" maxlength="80" required></label>
          <label class="field">Singkatan (dipakai di teks)<input name="short" value="${esc(d.short)}" maxlength="14"></label>
        </div>
        <div class="field"><span>Logo</span>
          <div class="logobox">
            <span class="logoprev" id="logoprev">${logoHtml(d, 56, false)}</span>
            <div class="logoact">
              <button type="button" class="btn ghost sm" data-act="logopick">${ic('upload', 18)} Unggah logo</button>
              <button type="button" class="btn ghost sm" data-act="logoreset">Pakai logo bawaan</button>
            </div>
          </div>
          <input type="file" id="flogo" accept="image/*" data-fx="logo" hidden>
          <label class="check"><input type="checkbox" name="logoName" ${d.logoName !== false ? 'checked' : ''}> Tampilkan nama perusahaan di samping logo</label>
          <span class="hint">Gunakan PNG berlatar transparan agar rapi. Logo dikecilkan otomatis dan juga dipakai sebagai ikon tab browser.</span>
        </div>
        <h4 class="sec">Kontak</h4>
        <label class="field">Nomor WhatsApp perusahaan<input type="tel" inputmode="tel" name="wa" id="wainput" value="${esc(d.wa)}" placeholder="081234567890 atau 6281234567890"></label>
        <p class="hint" id="wapreview">${waPrev(waDigits(d.wa))}</p>
        <div><button type="button" class="btn ghost sm" data-act="watest">${ic('chat', 18)} Tes nomor ini</button></div>
        <h4 class="sec">Warna tema</h4>
        <div class="presets" role="group" aria-label="Pilihan warna cepat">${PRESETS.map((p, k) => `<button type="button" class="pset${String(d.color1).toLowerCase() === p[1] && String(d.color2).toLowerCase() === p[2] ? ' on' : ''}" data-act="preset" data-i="${k}" style="--a:${p[1]};--b:${p[2]}" aria-label="${esc(p[0])}" title="${esc(p[0])}"><i></i><span>${esc(p[0])}</span></button>`).join('')}</div>
        <div class="two">
          <label class="field">Warna utama (latar dan panel gelap)<span class="colrow"><input type="color" name="color1" value="${esc(d.color1)}"><code id="hx1">${esc(String(d.color1).toUpperCase())}</code></span></label>
          <label class="field">Warna aksen (tombol dan sorotan)<span class="colrow"><input type="color" name="color2" value="${esc(d.color2)}"><code id="hx2">${esc(String(d.color2).toUpperCase())}</code></span></label>
        </div>
        <label class="field">Mode tampilan
          <select name="mode">${[['auto', 'Otomatis (ikuti perangkat)'], ['light', 'Selalu terang'], ['dark', 'Selalu gelap']].map(m => `<option value="${m[0]}" ${d.mode === m[0] ? 'selected' : ''}>${m[1]}</option>`).join('')}</select>
        </label>
        <p class="hint">Warna utama otomatis digelapkan bila terlalu terang, supaya teks putih di atasnya tetap terbaca.</p>
        <div><button type="button" class="btn ghost sm" data-act="colreset">Kembalikan warna bawaan</button></div>
        <div class="a-save">
          <button class="btn primary" type="submit" id="asave">Simpan pengaturan</button>
          <button class="btn ghost" type="button" data-act="acancel">Batal</button>
        </div>
      </form>`;
  }
  function syncColorInputs(){
    const f = document.getElementById('wform'); if (!f || !adm.draft) return;
    f.elements.color1.value = adm.draft.color1; f.elements.color2.value = adm.draft.color2;
    const h1 = document.getElementById('hx1'), h2 = document.getElementById('hx2');
    if (h1) h1.textContent = String(adm.draft.color1).toUpperCase(); if (h2) h2.textContent = String(adm.draft.color2).toUpperCase();
    document.querySelectorAll('.pset').forEach((b, k) => b.classList.toggle('on', PRESETS[k][1] === String(adm.draft.color1).toLowerCase() && PRESETS[k][2] === String(adm.draft.color2).toLowerCase()));
  }
  function drawLogoPrev(){ const el = document.getElementById('logoprev'); if (el && adm.draft) el.innerHTML = logoHtml(adm.draft, 56, false); }
  async function makeLogo(file){
    if (!/^image\//.test(file.type)) throw new Error('type');
    const im = await loadImg(file);
    const w0 = im.naturalWidth || im.width || 300, h0 = im.naturalHeight || im.height || 100;
    let r = Math.min(1, 480 / w0, 160 / h0);
    for (let k = 0; k < 4; k++){
      const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w0 * r)); c.height = Math.max(1, Math.round(h0 * r));
      c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
      const u = c.toDataURL('image/png');
      if (u.length < 400000 || k === 3) return u;
      r *= .7;
    }
  }
  const TABS = [['porto', 'Portofolio'], ['layanan', 'Layanan'], ['scope', 'Ruang lingkup'], ['berita', 'Berita'], ['ulasan', 'Ulasan'], ['google', 'Google Maps'], ['pengaturan', 'Pengaturan'], ['pin', 'Keamanan']];
  const HINTS = {
    porto: 'Pilih proyek di daftar untuk mengubah data dan fotonya, atau tambahkan proyek baru.',
    layanan: 'Pilih layanan untuk mengubah nama, penjelasan, atau ikonnya. Anda juga bisa menambah layanan baru atau menghapusnya.',
    scope: 'Pilih layanan untuk mengubah isi tabel ruang lingkup akreditasi yang tampil saat pengunjung membukanya.',
    berita: 'Pilih artikel untuk mengubah judul, foto, atau isinya, atau tambahkan artikel baru.',
    ulasan: 'Ulasan pelanggan yang masuk hanya dapat disetujui atau ditolak; isinya tidak dapat diedit.'
  };
  const ADDLAB = { porto: 'Tambah proyek', layanan: 'Tambah layanan', berita: 'Tambah artikel', ulasan: 'Tambah ulasan' };
  function pendingReviewMarkup(){
    if (!adm.pendingReviews.length) return '<p class="hint">Tidak ada ulasan yang menunggu persetujuan.</p>';
    return adm.pendingReviews.map(review => `
      <article class="bitem pending-review">
        <div class="bitem-info">
          <b>${esc(review.name)}${review.org ? ' · ' + esc(review.org) : ''}</b>
          <span>${stars(review.rating, 16)}</span>
          <small>Dikirim ${esc(fmtFull((review.created_at || review.date || '').slice(0, 10)))}</small>
          <p>${esc(review.text)}</p>
        </div>
        <div class="bitem-act">
          <button type="button" class="btn primary sm" data-act="review-approve" data-id="${esc(review.id)}">${ic('check', 16)} Setujui</button>
          <button type="button" class="btn ghost sm" data-act="review-reject" data-id="${esc(review.id)}">${ic('close', 16)} Tolak</button>
        </div>
      </article>`).join('');
  }
  function pendingReviewsPanel(){
    return `<section class="bcard review-queue">
      <div class="bhead"><div><h4>Menunggu persetujuan <span class="review-pending-count">${adm.pendingReviews.length}</span></h4><p class="hint">Ulasan pelanggan hanya dapat disetujui atau ditolak. Isinya tidak dapat diedit.</p></div></div>
      <div class="blist" id="pending-reviews">${pendingReviewMarkup()}</div>
    </section>`;
  }
  async function refreshPendingReviews(){
    if (!adm.authed || !location.protocol.startsWith('http')) return;
    try {
      const response = await fetch('/api/admin/reviews/pending', { cache: 'no-store' });
      if (response.status === 401){
        adm.authed = false;
        sess.set('fss_admin', null);
        if (parse().key === 'admin') rerender(true);
        return;
      }
      if (!response.ok) return;
      const result = await response.json();
      adm.pendingReviews = result.reviews || [];
      document.querySelectorAll('.review-pending-count').forEach(count => { count.textContent = adm.pendingReviews.length; });
      const tab = document.querySelector('[data-v="ulasan"] .review-tab-count');
      if (tab){ tab.textContent = adm.pendingReviews.length || ''; tab.hidden = !adm.pendingReviews.length; }
      const list = document.getElementById('pending-reviews');
      if (list) list.innerHTML = pendingReviewMarkup();
    } catch (e) {}
  }
  async function decidePendingReview(id, decision){
    const button = document.querySelector(`[data-act="review-${decision}"][data-id="${CSS.escape(id)}"]`);
    if (button) button.disabled = true;
    try {
      const response = await fetch('/api/admin/reviews/' + encodeURIComponent(id) + '/' + decision, { method: 'POST' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Gagal memproses ulasan.');
      adm.pendingReviews = adm.pendingReviews.filter(review => review.id !== id);
      if (decision === 'approve'){
        setMsg('Ulasan disetujui dan akan tampil untuk semua perangkat.');
        location.reload();
        return;
      }
      setMsg('Ulasan ditolak.');
      refreshPendingReviews();
    } catch (error){
      setMsg(error.message, true);
      if (button) button.disabled = false;
    }
  }
  function arow(id, img, title, sub, icon){
    return `<button class="arow ${adm.sel === id ? 'on' : ''}" data-act="asel" data-id="${esc(id)}">${img ? `<img src="${img}" alt="">` : `<span class="aico">${ic(icon || 'gauge', 20)}</span>`}<span><b>${esc(title)}</b><small>${esc(sub)}</small></span></button>`;
  }
  function adminList(){
    const t = adm.tab;
    if (t === 'porto') return P.map(p => arow(p.id, thumbOf(cover(p)), p.title, (p.photos || []).length + ' foto, ' + fmtDate(p.date))).join('');
    if (t === 'layanan') return arow('__page', null, 'Judul dan teks halaman', 'Teks halaman Layanan', 'edit') + SERVICES.map(s => arow(s.id, null, s.t, (s.s || '').slice(0, 42), s.icon)).join('');
    if (t === 'scope') return SERVICES.map(s => arow(s.id, null, s.t, (SCOPE[s.id] || []).length + ' baris', s.icon)).join('');
    if (t === 'berita') return N.map(n => arow(n.id, thumbOf(cover(n)), n.title, fmtFull(n.date))).join('');
    if (t === 'ulasan') return [...REVIEWS].sort(byDate).map(r => arow(r.id, null, r.org || r.name, r.rating + ' bintang, ' + fmtFull(r.date) + (r.show === false ? ', disembunyikan' : ''), 'users')).join('');
    return '';
  }
  function adminBody(){
    const t = adm.tab;
    if (t === 'pin') return pinPanel();
    if (t === 'pengaturan'){ if (!adm.draft) adm.draft = sdraft(); return settingsPanel(); }
    if (t === 'google'){ if (!adm.draft) adm.draft = gdraft(); return gEditor(); }
    if (t === 'ulasan') return pendingReviewsPanel() + (!adm.draft ? `<p class="hint">${HINTS[t]}</p>` : rEditor());
    if (!adm.draft) return `<p class="hint">${HINTS[t]}</p>`;
    return t === 'porto' ? editor() : t === 'layanan' ? (adm.draft.pageTxt ? pgEditor() : svcEditor()) : t === 'scope' ? scopeEditor() : t === 'ulasan' ? rEditor() : newsEditor();
  }
  function adminPanel(){
    const t = adm.tab, solo = t === 'pin' || t === 'google' || t === 'pengaturan';
    return `
      <section class="page" style="justify-content:flex-start">
        <div class="a-top">
          <div><h2>Kelola website</h2><p class="a-sub">Atur portofolio, layanan, ruang lingkup kalibrasi, dan berita.</p></div>
          <div class="a-actions"><button class="btn ghost sm" data-act="alogout">${ic('logout', 18)} Keluar</button></div>
        </div>
        <div class="atabs" role="tablist" aria-label="Bagian admin">
          ${TABS.map(x => `<button class="fchip" role="tab" data-act="atab" data-v="${x[0]}" aria-pressed="${t === x[0]}">${x[1]}${x[0] === 'ulasan' ? `<span class="review-tab-count" ${adm.pendingReviews.length ? '' : 'hidden'}>${adm.pendingReviews.length || ''}</span>` : ''}</button>`).join('')}
        </div>
        <div class="a-msg" id="amsg" role="status"></div>
        <div class="a-grid ${solo ? 'solo' : ''}">
          ${solo ? '' : `<div class="a-side">
            ${ADDLAB[t] ? `<button class="btn primary sm" data-act="anew">${ic('plus', 18)} ${ADDLAB[t]}</button>` : ''}
            <div class="a-list">${adminList() || '<p class="hint">Belum ada data.</p>'}</div>
          </div>`}
          <div class="a-edit">${adminBody()}</div>
        </div>
      </section>`;
  }

  /* ---- Admin: foto ---- */
  function loadImg(file){
    return new Promise((res, rej) => {
      const u = URL.createObjectURL(file), im = new Image();
      im.onload = () => { URL.revokeObjectURL(u); res(im); };
      im.onerror = () => { URL.revokeObjectURL(u); rej(new Error('bad')); };
      im.src = u;
    });
  }
  function scaled(im, max, q){
    const r = Math.min(1, max / Math.max(im.width, im.height));
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(im.width * r)); c.height = Math.max(1, Math.round(im.height * r));
    const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(im, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', q);
  }
  async function makePhoto(file){
    if (!/^image\//.test(file.type)) throw new Error('type');
    const im = await loadImg(file);
    return { s: scaled(im, 1600, 0.8), t: scaled(im, 640, 0.72) };
  }

  /* ---- Admin: simpan permanen (publish ulang halaman ini) ---- */
  function buildHtml(){
    const css = document.getElementById('fss-css').textContent;
    const app = document.getElementById('fss-app').textContent;
    const json = JSON.stringify({ v: 2, pinHash: pinHash, projects: P, services: SERVICES, scope: SCOPE, news: N, reviews: REVIEWS, google: GOOGLE, settings: SETTINGS, pages: PAGES_TXT }).replace(/</g, '\\u003c');
    return '<!doctype html>\n<html lang="id">\n<head>\n<meta charset="utf-8">\n'
      + '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
      + '<title>' + esc(brand()) + ' | Kalibrasi Onsite &amp; Inlab</title>\n'
      + '<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
      + '<link href="' + FONT_HREF + '" rel="stylesheet">\n'
      + '<style id="fss-css">' + css + '</style>\n</head>\n<body>\n'
      + '<script type="application/json" id="fss-data">' + json + SCRIPT_END + '\n'
      + '<script id="fss-app">' + app + SCRIPT_END + '\n</body>\n</html>';
  }
  async function persist(){
    const dataObj = { v: 2, pinHash: pinHash, projects: P, services: SERVICES, scope: SCOPE, news: N, reviews: REVIEWS, google: GOOGLE, settings: SETTINGS, pages: PAGES_TXT };
    if (hasBackendApi) {
      try {
        const res = await fetch('/api/data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dataObj)
        });
        if (res.ok) {
          sess.set('fss_reload', '1');
          return { ok: true, msg: 'Perubahan berhasil disimpan permanen ke server!' };
        }
        const result = await res.json().catch(() => ({}));
        return { ok: false, msg: result.error || 'Server menolak penyimpanan. Login Admin mungkin perlu diulang.' };
      } catch (e) {
        return { ok: false, msg: 'Koneksi ke server gagal. Perubahan belum disimpan.' };
      }
    }
    try { localStorage.setItem('fss_demo_data', JSON.stringify(dataObj)); } catch (e) {}
    const html = buildHtml();
    if (new Blob([html]).size > 15.5 * 1048576) return { ok: false, msg: 'Ukuran halaman melebihi batas 16 MB. Hapus beberapa foto.' };
    let art = null;
    try { art = window.claude ? await window.claude.use('artifact') : null; } catch (e) { art = null; }
    if (!art) return { ok: false, local: true, msg: 'Perubahan tersimpan untuk sesi ini (jalankan "node server.js" untuk simpan permanen ke file).' };
    try { sess.set('fss_reload', '1'); await art.publish(html); return { ok: true }; }
    catch (err) {
      sess.set('fss_reload', null);
      const c = err && err.code;
      if (c === 'not_writer' || c === 'not_granted' || c === 'consent_required' || c === 'not_declared' || c === 'capability_disabled' || c === 'capability_removed')
        return { ok: false, msg: 'Akun ini tidak punya izin menyimpan ke halaman. Buka halaman dari akun claude.ai pemilik atau editor.' };
      if (c === 'conflict') return { ok: false, msg: 'Ada versi baru yang baru saja dipublikasikan. Halaman dimuat ulang, mohon ulangi perubahan Anda.' };
      if (c === 'too_large') return { ok: false, msg: 'Ukuran halaman terlalu besar. Hapus beberapa foto.' };
      if (c === 'rate_limited') return { ok: false, msg: 'Terlalu sering menyimpan. Tunggu sebentar lalu coba lagi.' };
      return { ok: false, msg: 'Gagal menyimpan. Coba lagi.' };
    }
  }
  const snapshot = () => ({ P: P.slice(), S: SERVICES.slice(), SC: Object.assign({}, SCOPE), N: N.slice(), RV: REVIEWS.slice(), G: GOOGLE, ST: SETTINGS, PT: PAGES_TXT, pin: pinHash });
  const restore = s => { P = s.P; SERVICES = s.S; SCOPE = s.SC; N = s.N; REVIEWS = s.RV; GOOGLE = s.G; SETTINGS = s.ST; PAGES_TXT = s.PT; pinHash = s.pin; };
  function busy(){ const b = document.getElementById('asave'); if (b){ b.dataset.t = b.textContent; b.disabled = true; b.textContent = 'Menyimpan...'; } }
  async function commit(mutate, okMsg, after){
    const snap = snapshot(); busy(); mutate();
    const r = await persist();
    if (r.ok){ setMsg(okMsg + ' Memuat ulang halaman...'); return true; }
    if (r.local){ if (after) after(); rerender(true); setMsg(r.msg, true); return false; }
    restore(snap);
    const b = document.getElementById('asave'); if (b){ b.disabled = false; b.textContent = b.dataset.t || 'Simpan'; }
    setMsg(r.msg, true); return false;
  }
  async function saveCurrent(){
    const d = adm.draft; if (!d) return;
    const t = adm.tab;
    if (t === 'porto' || t === 'berita'){
      if (!String(d.title).trim()){ setMsg('Judul wajib diisi.', true); return; }
      if (!d.photos.length){ setMsg('Tambahkan minimal satu foto.', true); return; }
      if (bytes() > LIMIT){ setMsg('Total ukuran foto terlalu besar. Hapus beberapa foto.', true); return; }
      const copy = JSON.parse(JSON.stringify(d)), list = t === 'porto' ? P : N;
      await commit(() => { const k = list.findIndex(x => x.id === copy.id); if (k >= 0) list[k] = copy; else list.push(copy); }, 'Tersimpan.', () => { adm.isNew = false; adm.sel = copy.id; });
    } else if (t === 'layanan' && d.pageTxt){
      const keys = ['title', 'desc', 'toolsTitle', 'benefitsTitle', 'scopeBtn', 'consultBtn'], o = {};
      keys.forEach(k => { const v = String(d[k] || '').trim(); o[k] = (v === PAGE_DEF[k]()) ? '' : v; });
      await commit(() => { PAGES_TXT = Object.assign({}, PAGES_TXT, { layanan: o }); }, 'Teks halaman Layanan tersimpan.', () => { adm.sel = '__page'; });
    } else if (t === 'layanan'){
      if (!String(d.t).trim()){ setMsg('Nama layanan wajib diisi.', true); return; }
      const obj = { id: d.id, t: d.t.trim(), icon: d.icon, s: (d.s || '').trim(), l: (d.l || '').trim(), items: lines(d.itemsText) };
      const bn = lines(d.benefitsText); if (bn.length) obj.benefits = bn;
      await commit(() => {
        const arr = SERVICES.filter(x => x.id !== obj.id);
        const pos = Math.min(Math.max(1, parseInt(d.order, 10) || arr.length + 1), arr.length + 1) - 1;
        arr.splice(pos, 0, obj); SERVICES = arr;
      }, 'Tersimpan.', () => { adm.isNew = false; adm.sel = obj.id; });
    } else if (t === 'ulasan'){
      if (!String(d.org || d.name).trim()){ setMsg('Isi nama perusahaan atau pemberi ulasan.', true); return; }
      if (!String(d.text).trim()){ setMsg('Isi ulasan wajib diisi.', true); return; }
      const rv = { id: d.id, org: String(d.org || '').trim(), name: String(d.name || '').trim(), sector: String(d.sector || '').trim(), rating: Math.max(1, Math.min(5, Number(d.rating) || 5)), date: d.date, text: String(d.text).trim(), show: d.show !== false };
      await commit(() => { const k = REVIEWS.findIndex(x => x.id === rv.id); if (k >= 0) REVIEWS[k] = rv; else REVIEWS.push(rv); }, 'Ulasan tersimpan.', () => { adm.isNew = false; adm.sel = rv.id; });
    } else if (t === 'google'){
      if (d.rating !== '' && d.rating != null && (isNaN(Number(d.rating)) || Number(d.rating) < 0 || Number(d.rating) > 5)){ setMsg('Rating harus antara 0 dan 5.', true); return; }
      if (d.count !== '' && d.count != null && (isNaN(Number(d.count)) || Number(d.count) < 0)){ setMsg('Jumlah ulasan harus berupa angka.', true); return; }
      const mu = String(d.mapsUrl || '').trim(), ru = String(d.reviewUrl || '').trim();
      if ((mu && !safeUrl(mu)) || (ru && !safeUrl(ru))){ setMsg('Tautan harus diawali https://', true); return; }
      if (bytes() > LIMIT){ setMsg('Total ukuran foto terlalu besar. Hapus beberapa foto.', true); return; }
      const g = { rating: d.rating === '' || d.rating == null ? '' : Number(d.rating), count: d.count === '' || d.count == null ? '' : Math.round(Number(d.count)), mapsUrl: mu, reviewUrl: ru, photos: JSON.parse(JSON.stringify(d.photos || [])) };
      await commit(() => { GOOGLE = g; }, 'Data Google Maps tersimpan.', () => {});
    } else if (t === 'scope'){
      const stored = rowsToStore(d.rows), svc = d.svc;
      await commit(() => { SCOPE = Object.assign({}, SCOPE, { [svc]: stored }); }, 'Ruang lingkup tersimpan.', () => { adm.draft = { svc, rows: rowsToDraft(stored) }; });
    } else if (t === 'pengaturan'){
      const w = String(d.wa || '').trim() === '' ? '' : waDigits(d.wa);
      if (w !== '' && !/^\d{10,15}$/.test(w)){ setMsg('Nomor WhatsApp tidak valid. Contoh: 081234567890 atau 6281234567890.', true); return; }
      const nm = String(d.name || '').trim();
      if (!nm){ setMsg('Nama perusahaan wajib diisi.', true); return; }
      const hexOk = v => /^#[0-9a-fA-F]{6}$/.test(v || '');
      const st = {
        wa: w, name: nm.slice(0, 80), short: (String(d.short || '').trim() || DEFAULT_SHORT).slice(0, 14), logoName: d.logoName !== false,
        color1: hexOk(d.color1) ? d.color1.toLowerCase() : DEF_C1, color2: hexOk(d.color2) ? d.color2.toLowerCase() : DEF_C2,
        mode: ['auto', 'light', 'dark'].includes(d.mode) ? d.mode : 'auto'
      };
      if (d.logo && d.logo.s) st.logo = { s: d.logo.s };
      await commit(() => { SETTINGS = st; }, 'Pengaturan tersimpan.', () => { applyAll(SETTINGS); });
    }
  }
  async function delCurrent(){
    const d = adm.draft; if (!d) return;
    const t = adm.tab;
    await commit(() => {
      if (t === 'porto') P = P.filter(p => p.id !== d.id);
      else if (t === 'berita') N = N.filter(n => n.id !== d.id);
      else if (t === 'ulasan') REVIEWS = REVIEWS.filter(r => r.id !== d.id);
      else if (t === 'layanan'){ SERVICES = SERVICES.filter(s => s.id !== d.id); const sc = Object.assign({}, SCOPE); delete sc[d.id]; SCOPE = sc; }
    }, 'Dihapus.', () => { adm.draft = null; adm.sel = null; });
  }
  async function changePin(f){
    const v = Object.fromEntries(new FormData(f));
    if (!(await pinOk(v.old))){ setMsg('PIN lama salah.', true); return; }
    if (!/^\d{6,12}$/.test(v.n1)){ setMsg('PIN baru harus 6 sampai 12 angka.', true); return; }
    if (v.n1 !== v.n2){ setMsg('Pengulangan PIN baru tidak sama.', true); return; }
    const prev = pinHash; pinHash = await sha(v.n1);
    const r = await persist();
    if (r.ok){ setMsg('PIN diperbarui. Memuat ulang halaman...'); return; }
    if (r.local){ setMsg('PIN baru hanya berlaku di sesi ini. ' + r.msg, true); return; }
    pinHash = prev; setMsg(r.msg, true);
  }

  function rerender(noAnim){
    const st = view.scrollTop, { key, id } = parse();
    view.innerHTML = (views[key || 'home'])(id);
    if (noAnim && view.firstElementChild) view.firstElementChild.style.animation = 'none';
    afterRender(key);
    view.scrollTop = st;
  }
  function afterRender(key){
    document.body.classList.toggle('is-admin', key === 'admin');
    if (key === 'admin'){ drawPhotos(); drawRows(); drawSvcPreview(); refreshPendingReviews(); }
    if (key === 'testimoni') drawReview(1);
  }

  /* ---- Event ---- */
  const today = () => new Date().toISOString().slice(0, 10);
  document.addEventListener('click', async e => {
    const lb = document.getElementById('lb');
    if (lb && e.target === lb){ lb.classList.remove('open'); return; }
    const sm = document.getElementById('sm');
    if (sm && e.target === sm){ closeModal(); return; }
    const t = e.target.closest('[data-act]'); if (!t) return;
    const a = t.dataset.act, i = +t.dataset.i;
    switch (a) {
      case 'pcat': pf.cat = t.dataset.v; pf.page = 0; rerender(true); break;
      case 'ppage': pf.page += +t.dataset.d; rerender(true); break;
      case 'npage': nf.page += +t.dataset.d; rerender(true); break;
      case 'gprev': showPhoto(gal.i - 1); break;
      case 'gnext': showPhoto(gal.i + 1); break;
      case 'gset': showPhoto(i); break;
      case 'zoom': lbOpen(); break;
      case 'lbclose': document.getElementById('lb').classList.remove('open'); break;
      case 'scope': scopeModal(t.dataset.id); break;
      case 'mclose': closeModal(); break;
      case 'ttab': tTab = t.dataset.v; rerender(true); break;
      case 'togm': tTab = 'gmaps'; break;
      case 'torev': tTab = 'rev'; break;
      case 'rcopy': {
        const txt = lastMine ? lastMine.text : '';
        const copied = copySync(txt);
        const l = document.createElement('a'); l.href = reviewLink(); l.target = '_blank'; l.rel = 'noopener';
        document.body.appendChild(l); l.click(); l.remove();
        if (!copied && navigator.clipboard) navigator.clipboard.writeText(txt).catch(() => {});
        t.innerHTML = ic('check', 18, 2.4) + (copied ? ' Ulasan tersalin, Google Maps dibuka' : ' Google Maps dibuka, salin ulasan di bawah');
        break;
      }
      case 'rimport': {
        const raw = (document.getElementById('rimp') || {}).value || '';
        const mR = /penilaian\s+(\d(?:[.,]\d)?)\s+dari\s+5/i.exec(raw), mN = /Nama:\s*([\s\S]*?)(?:,\s*perusahaan:|\.\s*Ulasan:|\n|$)/i.exec(raw);
        const mP = /perusahaan:\s*([\s\S]*?)(?:\.\s*Ulasan:|\n|$)/i.exec(raw), mU = /Ulasan:\s*([\s\S]+)$/i.exec(raw);
        if (!mR && !mU){ setMsg('Format pesan tidak dikenali. Isi kolom secara manual.', true); break; }
        const d = adm.draft;
        if (mR) d.rating = String(Math.min(5, Math.max(1, Math.round(parseFloat(mR[1].replace(',', '.'))))));
        if (mN) d.name = mN[1].trim();
        if (mP) d.org = mP[1].trim();
        if (mU) d.text = mU[1].trim();
        if (!d.org) d.org = d.name;
        rerender(true); setMsg('Data terisi dari pesan. Periksa lalu klik Simpan.'); break;
      }
      case 'fillTools': {
        if (!adm.draft || adm.draft.pageTxt) break;
        const tl = scopeTools({ id: adm.draft.id });
        if (!tl.length){ setMsg('Tabel ruang lingkup layanan ini masih kosong. Isi dulu di tab Ruang lingkup.', true); break; }
        adm.draft.itemsText = tl.join('\n');
        const ta = document.querySelector('#lform [name=itemsText]'); if (ta) ta.value = adm.draft.itemsText;
        setMsg(''); drawSvcPreview(); break;
      }
      case 'gotoscope': {
        const sid = adm.draft && adm.draft.id; if (!sid) break;
        adm.tab = 'scope'; adm.sel = sid; adm.draft = { svc: sid, rows: rowsToDraft(SCOPE[sid]) }; adm.isNew = false; rerender(true); break;
      }
      case 'logopick': document.getElementById('flogo').click(); break;
      case 'logoreset': adm.draft.logo = null; drawLogoPrev(); applyAll(adm.draft); break;
      case 'preset': { const pr = PRESETS[i]; if (!pr) break; adm.draft.color1 = pr[1]; adm.draft.color2 = pr[2]; syncColorInputs(); applyAll(adm.draft); break; }
      case 'colreset': adm.draft.color1 = DEF_C1; adm.draft.color2 = DEF_C2; syncColorInputs(); applyAll(adm.draft); break;
      case 'watest': {
        const d = waDigits((document.getElementById('wainput') || {}).value || '');
        if (!/^\d{10,15}$/.test(d)){ setMsg('Isi nomor WhatsApp yang valid dulu.', true); break; }
        const tl = document.createElement('a');
        tl.href = 'https://wa.me/' + d + '?text=' + encodeURIComponent('Halo, ini tes nomor WhatsApp ' + brand() + '.');
        tl.target = '_blank'; tl.rel = 'noopener'; document.body.appendChild(tl); tl.click(); tl.remove(); break;
      }
      case 'rnext': rIdx++; drawReview(1); break;
      case 'rprev': rIdx = (rIdx - 1 + Math.max(1, visibleReviews().length)) % Math.max(1, visibleReviews().length); drawReview(-1); break;
      case 'rate': rateModal(); break;
      case 'gphoto': gal = { id: 'gmaps', i: i }; lbOpen(); break;
      case 'atab': applyAll(SETTINGS); adm.tab = t.dataset.v; adm.draft = adm.tab === 'google' ? gdraft() : adm.tab === 'pengaturan' ? sdraft() : null; adm.sel = null; adm.isNew = false; setMsg(''); rerender(true); break;
      case 'asel': {
        const id = t.dataset.id, tab = adm.tab;
        adm.sel = id; adm.isNew = false;
        if (tab === 'porto'){ const p = P.find(x => x.id === id); if (!p) break; adm.draft = JSON.parse(JSON.stringify(p)); }
        else if (tab === 'berita'){ const n = N.find(x => x.id === id); if (!n) break; adm.draft = JSON.parse(JSON.stringify(n)); }
        else if (tab === 'layanan'){
          if (id === '__page'){ adm.draft = pgdraft(); }
          else { const k = SERVICES.findIndex(x => x.id === id); if (k < 0) break; const s = SERVICES[k]; adm.draft = { id: s.id, t: s.t, icon: s.icon, s: s.s, l: s.l, itemsText: (s.items || []).join('\n'), benefitsText: (s.benefits || []).join('\n'), order: k + 1 }; }
        }
        else if (tab === 'ulasan'){ const r = REVIEWS.find(x => x.id === id); if (!r) break; adm.draft = JSON.parse(JSON.stringify(r)); }
        else if (tab === 'scope'){ adm.draft = { svc: id, rows: rowsToDraft(SCOPE[id]) }; }
        rerender(true); break;
      }
      case 'anew': {
        adm.sel = null; adm.isNew = true;
        if (adm.tab === 'porto'){ const n = new Date(); adm.draft = { id: 'p' + Date.now().toString(36), cat: (SERVICES[0] || {}).id || '', title: '', client: '', loc: '', date: n.getFullYear() + '-' + String(n.getMonth() + 1).padStart(2, '0'), mode: 'Onsite', count: '', std: 'ISO 17025', dur: '', desc: '', photos: [] }; }
        else if (adm.tab === 'ulasan'){ adm.draft = { id: 'v' + Date.now().toString(36), org: '', name: '', sector: '', rating: '5', date: today(), text: '', show: true }; }
        else if (adm.tab === 'berita'){ adm.draft = { id: 'n' + Date.now().toString(36), cat: 'Berita', title: '', date: today(), summary: '', body: '', photos: [] }; }
        else if (adm.tab === 'layanan'){ adm.draft = { id: 'sv' + Date.now().toString(36), t: '', icon: 'gauge', s: '', l: '', itemsText: '', benefitsText: '', order: SERVICES.length + 1 }; }
        rerender(true); break;
      }
      case 'acancel': applyAll(SETTINGS); adm.draft = null; adm.sel = null; adm.isNew = false; setMsg(''); rerender(true); break;
      case 'alogout':
        if (location.protocol.startsWith('http')) fetch('/api/admin/logout', { method: 'POST' }).catch(() => {});
        adm.authed = false; adm.draft = null; sess.set('fss_admin', null); location.hash = '#/'; break;
      case 'review-approve': await decidePendingReview(t.dataset.id, 'approve'); break;
      case 'review-reject': await decidePendingReview(t.dataset.id, 'reject'); break;
      case 'pick': document.getElementById('fadd').click(); break;
      case 'phl': case 'phr': {
        const ph = adm.draft.photos, j = i + (a === 'phl' ? -1 : 1);
        if (j < 0 || j >= ph.length) break;
        [ph[i], ph[j]] = [ph[j], ph[i]]; drawPhotos(); break;
      }
      case 'phdel': adm.draft.photos.splice(i, 1); drawPhotos(); break;
      case 'phrep': adm.repIdx = i; document.getElementById('frep').click(); break;
      case 'rowadd': {
        const rows = adm.draft.rows;
        rows.push({ id: 'r' + Date.now().toString(36) + rows.length, group: rows.length ? rows[rows.length - 1].group : '', tool: '', method: '', text: '' });
        drawRows(); break;
      }
      case 'rowdel': adm.draft.rows.splice(i, 1); drawRows(); break;
      case 'rowup': case 'rowdown': {
        const rows = adm.draft.rows, j = i + (a === 'rowup' ? -1 : 1);
        if (j < 0 || j >= rows.length) break;
        [rows[i], rows[j]] = [rows[j], rows[i]]; drawRows(); break;
      }
      case 'rowpreview': scopeModal(adm.draft.svc, rowsToStore(adm.draft.rows)); break;
      case 'adel':
        if (!adm.delArm){
          adm.delArm = true; t.textContent = 'Yakin hapus?';
          setTimeout(() => { adm.delArm = false; if (t.isConnected) t.textContent = 'Hapus'; }, 4000);
        } else { adm.delArm = false; await delCurrent(); }
        break;
    }
  });
  document.addEventListener('change', async e => {
    const t = e.target;
    if (!t.matches || !t.matches('input[type=file][data-fx]')) return;
    const files = [...t.files]; t.value = '';
    if (t.dataset.fx === 'logo'){
      if (!files.length || !adm.draft) return;
      setMsg('Memproses logo...');
      try { adm.draft.logo = { s: await makeLogo(files[0]) }; setMsg(''); drawLogoPrev(); applyAll(adm.draft); }
      catch (err) { setMsg('Logo tidak dapat dibaca. Gunakan file PNG, JPG, WebP, atau SVG.', true); }
      return;
    }
    if (!files.length || !adm.draft || !adm.draft.photos) return;
    setMsg('Memproses foto...');
    try {
      if (t.dataset.fx === 'add') { for (const f of files.slice(0, 12)) adm.draft.photos.push(await makePhoto(f)); }
      else adm.draft.photos[adm.repIdx] = await makePhoto(files[0]);
      setMsg(''); drawPhotos();
    } catch (err) { setMsg('Foto tidak dapat dibaca. Gunakan file JPG, PNG, atau WebP.', true); }
  });
  document.addEventListener('input', e => {
    const el = e.target;
    if (el.form && el.form.id === 'wform' && adm.draft){
      const n = el.name; if (!n) return;
      adm.draft[n] = el.type === 'checkbox' ? el.checked : el.value;
      if (n === 'wa'){ const pv = document.getElementById('wapreview'); if (pv) pv.innerHTML = waPrev(waDigits(el.value)); }
      if (n === 'color1' || n === 'color2') syncColorInputs();
      applyAll(adm.draft);
      return;
    }
    if (el.dataset && el.dataset.k && adm.draft && adm.draft.rows){ const r = adm.draft.rows[+el.dataset.r]; if (r) r[el.dataset.k] = el.value; return; }
    const f = el.form;
    if (!f || !adm.draft || !el.name || !['pform', 'lform', 'nform', 'rform', 'gform', 'pgform'].includes(f.id)) return;
    const n = el.name;
    adm.draft[n] = el.type === 'checkbox' ? el.checked : (n === 'count' && f.id === 'pform' ? (el.value === '' ? '' : Number(el.value)) : el.value);
    if (f.id === 'lform' || f.id === 'pgform') drawSvcPreview();
  });
  document.addEventListener('submit', async e => {
    const f = e.target;
    if (f.id === 'pinform'){ e.preventDefault(); await onPin(); }
    else if (['pform', 'lform', 'sform', 'nform', 'rform', 'gform', 'wform', 'pgform'].includes(f.id)){ e.preventDefault(); await saveCurrent(); }
    else if (f.id === 'rateform'){
      e.preventDefault();
      const fd = new FormData(f), n = Number(fd.get('rating')) || 5;
      const review = {
        name: String(fd.get('nama') || '').trim(),
        org: String(fd.get('pt') || '').trim(),
        rating: n,
        text: String(fd.get('ulasan') || '').trim()
      };
      const button = f.querySelector('button[type="submit"]');
      const error = document.getElementById('rateerr');
      button.disabled = true;
      try {
        const response = await fetch('/api/reviews', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(review)
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Ulasan gagal dikirim.');
        lastMine = Object.assign({ id: 'pending', date: today(), sector: '' }, review);
        rateDone(lastMine);
      } catch (errorValue){
        error.textContent = errorValue.message;
        button.disabled = false;
      }
    }
    else if (f.id === 'pinchg'){ e.preventDefault(); await changePin(f); }
  });
  document.addEventListener('keydown', e => {
    const lb = document.getElementById('lb'), lbOn = lb && lb.classList.contains('open');
    const sm = document.getElementById('sm'), smOn = sm && sm.classList.contains('open');
    if (e.key === 'Escape'){
      if (smOn) closeModal();
      else if (lbOn) lb.classList.remove('open');
      else document.getElementById('drawer').classList.remove('open');
    }
    const typing = /INPUT|TEXTAREA|SELECT/.test(e.target.tagName || '');
    const r = parse();
    if (!typing && !smOn && (lbOn || ((r.key === 'portofolio' || r.key === 'berita') && r.id))){
      if (e.key === 'ArrowLeft') showPhoto(gal.i - 1);
      if (e.key === 'ArrowRight') showPhoto(gal.i + 1);
    }
  });
  let tx = null;
  document.addEventListener('touchstart', e => { tx = (e.target.closest && e.target.closest('#stage,#lb')) ? e.touches[0].clientX : null; }, { passive: true });
  document.addEventListener('touchend', e => {
    if (tx == null) return;
    const dx = e.changedTouches[0].clientX - tx; tx = null;
    if (Math.abs(dx) > 45) showPhoto(gal.i + (dx < 0 ? 1 : -1));
  }, { passive: true });

  /* ====== Dial pengukur ====== */
  function dial(){
    const cx = 200, cy = 200, r = 165;
    let ticks = '';
    for (let i = 0; i <= 40; i++){
      const a = (180 - i * 4.5) * Math.PI / 180, major = i % 5 === 0, r2 = r - (major ? 24 : 12);
      ticks += `<line class="tk${major ? ' major' : ''}" x1="${(cx + r * Math.cos(a)).toFixed(1)}" y1="${(cy - r * Math.sin(a)).toFixed(1)}" x2="${(cx + r2 * Math.cos(a)).toFixed(1)}" y2="${(cy - r2 * Math.sin(a)).toFixed(1)}"/>`;
    }
    const rb = r + 12, p = d => [cx + rb * Math.cos(d * Math.PI / 180), cy - rb * Math.sin(d * Math.PI / 180)];
    const [x1, y1] = p(95), [x2, y2] = p(85);
    return `<svg class="dial" viewBox="0 0 400 285" role="img" aria-label="Dial pengukur menunjukkan standar deviasi plus minus 0,01 persen">
      ${ticks}
      <path class="band" d="M${x1.toFixed(1)} ${y1.toFixed(1)} A${rb} ${rb} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)}"/>
      <g class="needle"><line x1="200" y1="200" x2="200" y2="62" stroke="#ff8a00" stroke-width="4" stroke-linecap="round"/></g>
      <circle cx="200" cy="200" r="11" fill="#ff8a00"/><circle cx="200" cy="200" r="4" fill="#0a2e2f"/>
      <text class="read" x="200" y="252" text-anchor="middle">±0.01%</text>
      <text class="sub" x="200" y="275" text-anchor="middle">Standar deviasi, ISO 17025</text>
    </svg>`;
  }

  /* ====== Halaman ====== */
  const view = document.getElementById('view');
  let flow = 'onsite', tIdx = 0;

  const views = {
    home: () => `
      <section class="page">
        <div class="hero">
          <div>
            <h1>MCS Menghadirkan Pelayanan untuk memenuhi kebutuhan Industri Anda : Instrument, Technical, dll.</h1>
            <p class="lead">Kalibrasi On site dan in lab dengan standart ISO 17025, teknisi berpengalaman dan sertifikat akreditasi yang tertelusur.</p>
            <div class="cta-row">
              <a class="btn primary" href="${wa('Halo ' + brand() + ', saya ingin konsultasi kalibrasi.')}" target="_blank" rel="noopener">${ic('chat',20)} Konsultasi sekarang</a>
              <a class="btn ghost on-deep" href="#/layanan">Lihat layanan</a>
            </div>
          </div>
          <div class="dial-wrap">
            ${dial()}
            <div class="badges">
              <div><b>ISO 17025</b>Mengikuti Standart ISO 17025, Standart Laboratorium Kalibrasi.</div>
              <div><b>KAN</b>Tertelusur dan Terakreditasi KAN</div>
            </div>
          </div>
          <div class="trusted"><b>General Trading</b><b>Calibration</b><b>Procurement</b><b>Service Maintenance &amp; Supplier</b><b>Layanan Seluruh Indonesia</b></div>
        </div>
      </section>`,

    layanan: id => layananView(id),

    keunggulan: () => `
      <section class="page">
        <div class="head">
          <h2>Kenapa industri memilih ${esc(short())}</h2>
          <p>Standar tertinggi, teknisi ahli, dan proses yang efisien untuk menjaga operasional Anda tetap lancar.</p>
        </div>
        <div class="adv">
          <div class="stats">
            <div class="stat"><b>1000+</b><span>alat sudah terkalibrasi</span></div>
            <div class="stat"><b>97%</b><span>tingkat kepuasan pelanggan</span></div>
            <div class="stat"><b>7-14 Hari</b><span>SLA kalibrasi inlab standar</span></div>
          </div>
          <div class="feats">
            ${ADV.map(a => `
            <div class="feat"><span class="ico">${ic(a.icon,22)}</span><div><h3>${a.t}</h3><p>${a.p}</p></div></div>`).join('')}
          </div>
        </div>
      </section>`,

    alur: () => `
      <section class="page">
        <div class="head">
          <h2>Alur kalibrasi yang terstruktur</h2>
          <p>Proses transparan dan sistematis agar akurasi dan waktu Anda terjaga.</p>
        </div>
        <div class="seg" role="tablist" aria-label="Jenis layanan">
          <button role="tab" data-act="flow" data-v="onsite" aria-selected="${flow==='onsite'}">Layanan onsite</button>
          <button role="tab" data-act="flow" data-v="inlab" aria-selected="${flow==='inlab'}">Layanan inlab</button>
          <button role="tab" data-act="flow" data-v="pengadaan" aria-selected="${flow==='pengadaan'}">Pengadaan</button>
        </div>
        <div class="steps" id="steps">${steps()}</div>
      </section>`,

    testimoni: () => testiView(),

    kontak: () => `
      <section class="page">
        <div class="contact">
          <div class="c-left">
            <h2>Butuh kalibrasi sekarang? Konsultasikan alat Anda hari ini.</h2>
            <p class="sub">Respon cepat, konsultasi gratis, tanpa komitmen.</p>
            <div class="cta-row" style="margin:0">
              <a class="btn primary" href="${wa('Halo ' + brand() + ', saya ingin konsultasi kalibrasi.')}" target="_blank" rel="noopener">${ic('chat',20)} Konsultasi via WhatsApp</a>
            </div>
            <div class="info">
              <div><b>Alamat</b><span>Surabaya</span></div>
              <div><b>Kontak</b><a href="${wa('Halo ' + brand() + ', saya ingin konsultasi kalibrasi.')}" target="_blank" rel="noopener">0859 7400 8882</a></div>
              <div><b>Email</b><a href="mailto:headoffice@mcs.co.id">headoffice@mcs.co.id</a></div>
              <div><b>Instagram</b><a href="https://www.instagram.com/cv.multidayaciptasolusi" target="_blank" rel="noopener">cv.multidayaciptasolusi</a></div>
              <div><b>Facebook</b><a href="https://www.facebook.com/cv.multidayaciptasolusi" target="_blank" rel="noopener">cv.multidayaciptasolusi</a></div>
            </div>
            <p class="copy">© 2026 ${esc(brand())}</p>
          </div>
          <form class="form" id="form">
            <h3>Kirim permintaan lewat WhatsApp</h3>
            <div class="two">
              <label class="field">Nama<input name="nama" required autocomplete="name"></label>
              <label class="field">Perusahaan<input name="pt" autocomplete="organization"></label>
            </div>
            <label class="field">Jenis alat
              <select name="jenis">${SERVICES.map(s => `<option>${esc(s.t)}</option>`).join('')}<option>Lainnya</option></select>
            </label>
            <div class="field">Layanan
              <div class="pills">
                <label><input type="radio" name="mode" value="onsite" checked><span>Onsite</span></label>
                <label><input type="radio" name="mode" value="inlab"><span>Inlab</span></label>
                <label><input type="radio" name="mode" value="belum tahu"><span>Belum tahu</span></label>
              </div>
            </div>
            <label class="field">Pesan<textarea name="pesan" placeholder="Jumlah dan jenis alat, lokasi, target waktu"></textarea></label>
            <button class="btn primary" type="submit">${ic('chat',20)} Kirim lewat WhatsApp</button>
          </form>
        </div>
      </section>`
  };

  views.portofolio = id => { const p = P.find(x => x.id === id); return p ? portoDetail(p) : portoList(); };
  views.admin = () => adm.authed ? adminPanel() : pinGate();
  views.berita = id => { const n = N.find(x => x.id === id); return n ? newsDetail(n) : newsList(); };

  function steps(){
    return FLOW[flow].map((s, i) => `
      <div class="step" style="--i:${i}">
        <div class="n">${i + 1}</div>
        <span class="ico">${ic(s[0],26)}</span>
        <h3>${s[1]}</h3>
        <p>${s[2]}</p>
      </div>`).join('');
  }
  /* ====== Router ====== */
  const nav = document.getElementById('nav'), ruler = document.getElementById('ruler'), dlinks = document.getElementById('dlinks');
  let lastIdx = 0, curKey = null, introOn = false, trBusy = false, trMid = false;
  const parse = () => {
    const h = location.hash.replace(/^#\/?/, '').split('/');
    const key = h[0] === 'admin' ? 'admin' : (PAGES.some(p => p[0] === h[0]) ? h[0] : '');
    return { key, id: h[1] };
  };
  const hrefOf = k => '#/' + k;

  const PICON = { '': 'gauge', layanan: 'gear', portofolio: 'image', berita: 'news', keunggulan: 'shield', alur: 'route', testimoni: 'star', kontak: 'chat', admin: 'lock' };
  const navIco = (k, s) => `<span class="ni" data-k="${k || 'home'}">${ic(PICON[k], s || 16, 2)}</span>`;
  function chrome(key){
    const idx = PAGES.findIndex(p => p[0] === key);
    const cur = p => p[0] === key ? 'aria-current="page"' : '';
    nav.innerHTML = PAGES.slice(0, 7).map(p => `<a href="${hrefOf(p[0])}" ${cur(p)}>${navIco(p[0])}${p[1]}</a>`).join('');
    dlinks.innerHTML = PAGES.map((p, i) => `<a class="d-link" style="--i:${i}" href="${hrefOf(p[0])}" ${cur(p)}>${navIco(p[0], 22)}${p[1]}</a>`).join('')
      + `<a class="d-link small" style="--i:${PAGES.length}" href="#/admin" ${key === 'admin' ? 'aria-current="page"' : ''}>${navIco('admin', 18)} Admin</a>`;
    ruler.innerHTML = PAGES.map(p => `<a href="${hrefOf(p[0])}" ${cur(p)}><span class="ticks"></span><span class="lab">${navIco(p[0], 14)}${p[1]}</span></a>`).join('');
    return idx;
  }

  function render(){
    const { key, id } = parse();
    const idx = chrome(key);
    view.style.setProperty('--dx', (idx >= lastIdx ? 36 : -36) + 'px');
    lastIdx = idx;
    view.innerHTML = (views[key || 'home'])(id);
    view.scrollTop = 0;
    if (key === 'testimoni') drawReview(1);
    afterRender(key);
    curKey = key;
    if (key === 'admin' && adm.authed && view.firstElementChild) view.firstElementChild.classList.add('adm-in');
    const title = idx < 0 ? 'Admin' : PAGES[idx][1];
    document.title = (idx ? title + ' | ' : '') + brand();
    closeDrawer();
  }

  const go = d => { const { key } = parse(); const i = PAGES.findIndex(p => p[0] === key); if (i < 0) { location.hash = '#/'; return; } location.hash = hrefOf(PAGES[(i + d + PAGES.length) % PAGES.length][0]); };
  const drawer = document.getElementById('drawer'), burger = document.getElementById('burger'), menuWrap = burger.closest('.menu-wrap');
  function openDrawer(){ drawer.classList.add('open'); burger.setAttribute('aria-expanded', 'true'); burger.innerHTML = ic('close', 22); }
  function closeDrawer(){ drawer.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); burger.innerHTML = ic('menu', 22); }
  if (menuWrap){
    menuWrap.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') openDrawer(); });
    menuWrap.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') closeDrawer(); });
  }

  /* ====== Animasi: pembuka, pindah halaman, masuk admin ====== */
  const REDUCE = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const TRL = { '': 'Beranda', layanan: 'Layanan', portofolio: 'Portofolio', berita: 'Berita', keunggulan: 'Keunggulan', alur: 'Alur kerja', testimoni: 'Testimoni', kontak: 'Kontak', admin: 'Portal admin' };

  function tachSvg(){
    const cx = 200, cy = 190, r = 150, N = 50, T = 2.2, SW = 0.52, settle = 202 / 270;
    const pt = (deg, rad) => [cx + rad * Math.cos(deg * Math.PI / 180), cy + rad * Math.sin(deg * Math.PI / 180)];
    let ticks = '', nums = '';
    for (let i = 0; i <= N; i++){
      const f = i / N, a = 135 + 270 * f, major = i % 5 === 0, r2 = r - (major ? 22 : 11);
      const [x1, y1] = pt(a, r), [x2, y2] = pt(a, r2);
      const cls = 'tk' + (major ? ' mj' : '') + (f >= 0.8 ? ' hot' : '') + (f > settle ? ' pk' : '');
      ticks += `<line class="${cls}" style="--d:${(f * T * SW).toFixed(2)}" x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/>`;
      if (major){ const [nx, ny] = pt(a, r - 42); nums += `<text x="${nx.toFixed(1)}" y="${(ny + 5).toFixed(1)}" text-anchor="middle">${i / 5}</text>`; }
    }
    const rr = r + 16, [sx, sy] = pt(135, rr), [ex, ey] = pt(405, rr);
    const arc = `M${sx.toFixed(1)} ${sy.toFixed(1)} A${rr} ${rr} 0 1 1 ${ex.toFixed(1)} ${ey.toFixed(1)}`;
    const [tx, ty] = pt(135, r - 14), [bx, by] = pt(315, 24);
    const rgs = pt(135, r + 30), rge = pt(405, r + 30);
    return `<svg class="tach" viewBox="0 0 400 310" aria-hidden="true">
      <defs>
        <linearGradient id="tg1" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#ffc15e"/><stop offset="1" stop-color="#ff6a00"/></linearGradient>
        <filter id="tgf" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="5"/></filter>
      </defs>
      <path class="ring" d="M${rgs[0].toFixed(1)} ${rgs[1].toFixed(1)} A${r + 30} ${r + 30} 0 1 1 ${rge[0].toFixed(1)} ${rge[1].toFixed(1)}"/>
      <path class="arcbg" d="${arc}"/>
      <path class="arc glow" pathLength="100" d="${arc}"/>
      <path class="arc" pathLength="100" d="${arc}"/>
      ${ticks}${nums}
      <g class="ndl"><line x1="${bx.toFixed(1)}" y1="${by.toFixed(1)}" x2="${tx.toFixed(1)}" y2="${ty.toFixed(1)}" stroke="#ff8a00" stroke-width="6" stroke-linecap="round"/><line x1="${cx}" y1="${cy}" x2="${tx.toFixed(1)}" y2="${ty.toFixed(1)}" stroke="#fff" stroke-width="1.5" stroke-linecap="round" opacity=".8"/></g>
      <g class="hub"><circle cx="${cx}" cy="${cy}" r="17" fill="#0a2e2f" stroke="#ff8a00" stroke-width="4"/><circle cx="${cx}" cy="${cy}" r="6" fill="#ff8a00"/></g>
      <text class="tp" id="tpct" x="${cx}" y="268" text-anchor="middle">0%</text>
      <text class="tl" id="tlab" x="${cx}" y="292" text-anchor="middle">Kalibrasi sistem</text>
    </svg>`;
  }
  function startIntro(done){
    const el = document.createElement('div');
    el.id = 'intro'; el.className = 'intro'; el.setAttribute('role', 'status'); el.setAttribute('aria-label', 'Memuat website');
    el.innerHTML = `<div class="intro-in">
        <div class="i-brand">${logoHtml(SETTINGS, 34, true)}${(SETTINGS.logo && SETTINGS.logoName === false) ? '' : '<span>' + esc(brand()) + '</span>'}</div>
        ${tachSvg()}
        <p class="i-tag">Beyond Calibration. Built on Precision.</p>
      </div>
      <button class="i-skip" type="button">Lewati</button>`;
    document.body.appendChild(el); introOn = true;
    const T = 2200, t0 = performance.now(), pct = el.querySelector('#tpct'), lab = el.querySelector('#tlab');
    let finished = false, raf = 0;
    const ease = x => x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
    const exit = () => {
      if (finished) return; finished = true; cancelAnimationFrame(raf); introOn = false;
      done(); el.classList.add('out'); setTimeout(() => el.remove(), 900);
    };
    const tick = now => {
      const p = Math.min(1, (now - t0) / T);
      pct.textContent = Math.round(ease(p) * 100) + '%';
      if (p >= 1){ pct.textContent = '100%'; lab.textContent = 'Siap digunakan'; setTimeout(exit, 450); return; }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    el.querySelector('.i-skip').addEventListener('click', exit);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') exit(); }, { once: true });
  }

  function stingerSvg(k){
    const o = '<svg viewBox="0 0 64 64" aria-hidden="true">';
    switch (k) {
      case '': return o + '<path class="s-draw" pathLength="100" d="M12 46 A26 26 0 1 1 52 46"/><g class="s-needle"><line x1="32" y1="30" x2="32" y2="11" stroke="#ff8a00"/></g><circle cx="32" cy="30" r="4" fill="#ff8a00" stroke="none"/></svg>';
      case 'layanan': return o + `<g class="s-gear"><g transform="translate(6 6) scale(2.2)" stroke-width="1.4">${I.gear}</g></g><circle cx="32" cy="32" r="5" fill="#ff8a00" stroke="none"/></svg>`;
      case 'portofolio': return o + '<rect class="s-draw" pathLength="100" x="10" y="12" width="44" height="40" rx="6"/><path class="s-draw d2" pathLength="100" d="M10 44 26 30 38 42 45 36 54 46"/><circle class="s-pop" cx="24" cy="25" r="4" stroke="#ff8a00"/><circle class="s-flash" cx="32" cy="32" r="31"/></svg>';
      case 'berita': return o + '<path class="s-draw" pathLength="100" d="M12 10H46a4 4 0 0 1 4 4V50a4 4 0 0 1-4 4H18a6 6 0 0 1-6-6Z"/><rect class="s-line" style="--i:0" x="20" y="18" width="22" height="7" rx="1.5" fill="#ff8a00" stroke="none"/><line class="s-line" style="--i:1" x1="20" y1="32" x2="42" y2="32"/><line class="s-line" style="--i:2" x1="20" y1="40" x2="42" y2="40"/><line class="s-line" style="--i:3" x1="20" y1="47" x2="34" y2="47"/></svg>';
      case 'keunggulan': return o + '<path class="s-draw" pathLength="100" d="M32 8 50 15V30C50 42 42 50 32 56 22 50 14 42 14 30V15Z"/><path class="s-draw d2" pathLength="100" stroke="#ff8a00" d="M23 31 30 38 42 24"/><circle class="s-ring" cx="32" cy="32" r="22" stroke="#ff8a00"/></svg>';
      case 'alur': return o + '<path class="s-draw" pathLength="100" d="M12 48C12 32 28 40 32 28S52 24 52 14"/><circle class="s-node" style="--i:0" cx="12" cy="48" r="5" fill="#fff" stroke="none"/><circle class="s-node" style="--i:1" cx="32" cy="28" r="5" fill="#fff" stroke="none"/><circle class="s-node" style="--i:2" cx="52" cy="14" r="5" fill="#ff8a00" stroke="none"/></svg>';
      case 'testimoni': { let s = ''; for (let i = 0; i < 5; i++) s += `<g transform="translate(${(2 + i * 12.4).toFixed(1)} 14)"><path class="s-star" style="--i:${i}" fill="#ff8a00" stroke="none" d="M6 .5 7.8 4.4 12 4.9 8.9 7.8 9.7 12 6 9.9 2.3 12 3.1 7.8 0 4.9 4.2 4.4Z"/></g>`; return `<svg viewBox="0 0 64 40" style="width:88px;height:55px" aria-hidden="true">${s}</svg>`; }
      case 'kontak': return o + '<path class="s-draw" pathLength="100" d="M12 14H52a4 4 0 0 1 4 4V38a4 4 0 0 1-4 4H30L20 52V42H12a4 4 0 0 1-4-4V18a4 4 0 0 1 4-4Z"/><circle class="s-dot" style="--i:0" cx="22" cy="28" r="2.6" fill="#ff8a00" stroke="none"/><circle class="s-dot" style="--i:1" cx="32" cy="28" r="2.6" fill="#ff8a00" stroke="none"/><circle class="s-dot" style="--i:2" cx="42" cy="28" r="2.6" fill="#ff8a00" stroke="none"/></svg>';
      default: return o + '<rect class="s-draw" pathLength="100" x="16" y="30" width="32" height="24" rx="5"/><path class="s-shackle" d="M22 30V22a10 10 0 0 1 20 0V30"/><circle class="s-pop" cx="32" cy="42" r="3.2" fill="#ff8a00" stroke="none"/></svg>';
    }
  }
  function toast(msg){
    const old = document.getElementById('toast'); if (old) old.remove();
    const el = document.createElement('div');
    el.id = 'toast'; el.className = 'toast'; el.setAttribute('role', 'status');
    el.innerHTML = ic('lock', 16, 2) + '<span>' + esc(msg) + '</span>';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3400);
  }
  function lockAdmin(){
    if (!adm.authed) return;
    adm.authed = false; adm.draft = null; adm.sel = null; adm.isNew = false; adm.delArm = false; adm.tab = 'porto';
    sess.set('fss_admin', null);
    applyAll(SETTINGS);
    toast('Admin terkunci. Masukkan PIN untuk masuk lagi.');
  }
  function navigate(){
    const { key } = parse();
    if (curKey === 'admin' && key !== 'admin') lockAdmin();
    if (introOn) return;
    if (trBusy){ if (trMid) render(); return; }
    if (REDUCE || curKey === null || key === curKey){ render(); return; }
    trBusy = true; trMid = false;
    let el = document.getElementById('tr');
    if (!el){ el = document.createElement('div'); el.id = 'tr'; el.className = 'tr'; el.setAttribute('aria-hidden', 'true'); document.body.appendChild(el); }
    el.innerHTML = `<div class="trbox"><span class="trico">${stingerSvg(key)}</span><b>${TRL[key] || ''}</b></div>`;
    el.className = 'tr in';
    setTimeout(() => { render(); trMid = true; el.classList.add('out'); }, 380);
    setTimeout(() => { el.className = 'tr'; el.innerHTML = ''; trBusy = false; }, 730);
  }
  function loginOk(done){
    const el = document.createElement('div');
    el.id = 'ok'; el.className = 'okov' + (REDUCE ? ' rm' : '');
    el.innerHTML = `<div class="okbox" role="status" aria-live="polite">
        <svg class="oksvg" viewBox="0 0 120 120" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle class="ok-ring" cx="60" cy="60" r="52" stroke="#ff8a00" stroke-width="5" pathLength="100" transform="rotate(-90 60 60)"/>
          <g class="ok-lock"><rect x="40" y="58" width="40" height="30" rx="7" stroke="#fff" stroke-width="5"/><path class="ok-shackle" d="M48 58V46a12 12 0 0 1 24 0V58" stroke="#fff" stroke-width="5"/><circle cx="60" cy="73" r="3.5" fill="#ff8a00" stroke="none"/></g>
          <path class="ok-check" d="M38 62 54 78 84 44" stroke="#fff" stroke-width="7" pathLength="100"/>
        </svg>
        <h2>Masuk ke portal admin berhasil</h2>
        <p>Membuka panel admin...</p>
      </div>`;
    document.body.appendChild(el);
    setTimeout(() => { done(); el.classList.add('out'); setTimeout(() => el.remove(), 650); }, REDUCE ? 800 : 2050);
  }

  /* ====== Event ====== */
  document.getElementById('prev').innerHTML = ic('arrowL', 20);
  document.getElementById('next').innerHTML = ic('arrowR', 20);
  burger.innerHTML = ic('menu', 22);
  document.getElementById('closeBtn').innerHTML = ic('close', 22);
  document.getElementById('prev').addEventListener('click', () => go(-1));
  document.getElementById('next').addEventListener('click', () => go(1));

  document.addEventListener('click', e => {
    const nl = e.target.closest('.nav a, .d-link, .ruler a');
    if (nl){ const ni = nl.querySelector('.ni'); if (ni){ ni.classList.remove('pop'); void ni.offsetWidth; ni.classList.add('pop'); } }
    const t = e.target.closest('[data-act]');
    if (!e.target.closest('.menu-wrap') && drawer.classList.contains('open')) closeDrawer();
    if (!t) return;
    const a = t.dataset.act;
    if (a === 'menu'){ if (drawer.classList.contains('open')) closeDrawer(); else openDrawer(); }
    if (a === 'flow'){
      flow = t.dataset.v;
      document.getElementById('steps').innerHTML = steps();
      document.querySelectorAll('.seg button').forEach(b => b.setAttribute('aria-selected', String(b.dataset.v === flow)));
    }
  });

  document.addEventListener('submit', e => {
    if (e.target.id !== 'form') return;
    e.preventDefault();
    const f = new FormData(e.target);
    const msg = `Halo ${brand()}, saya ${f.get('nama')}${f.get('pt') ? ' dari ' + f.get('pt') : ''}. Saya ingin konsultasi ${f.get('jenis')} (layanan ${f.get('mode')}).${f.get('pesan') ? ' ' + f.get('pesan') : ''}`;

    // Catat pesan konsultasi ke backend server jika aktif
    if (location.protocol.startsWith('http')) {
      fetch('/api/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama: f.get('nama'),
          pt: f.get('pt'),
          jenis: f.get('jenis'),
          mode: f.get('mode'),
          pesan: f.get('pesan')
        })
      }).catch(() => {});
    }

    const link = document.createElement('a');
    link.href = wa(msg); link.target = '_blank'; link.rel = 'noopener';
    document.body.appendChild(link); link.click(); link.remove();
  });

  document.addEventListener('touchstart', () => {}, { passive: true });
  window.addEventListener('resize', fitPreview);
  applyAll(SETTINGS);
  (function guardAdmin(){
    // Admin hanya terbuka bila halaman dibuka di #/admin (atau reload otomatis setelah menyimpan).
    const reload = sess.get('fss_reload') === '1'; sess.set('fss_reload', null);
    if (reload && adm.authed){ if (parse().key !== 'admin') location.replace('#/admin'); }
    else if (parse().key !== 'admin'){ adm.authed = false; sess.set('fss_admin', null); }
  })();
  window.addEventListener('hashchange', navigate);
  async function checkForServerUpdates(){
    if (!serverDataVersion || !location.protocol.startsWith('http')) return;
    try {
      const response = await fetch('/api/data/version', { cache: 'no-store' });
      if (!response.ok) return;
      const result = await response.json();
      if (result.version !== serverDataVersion && parse().key !== 'admin') location.reload();
    } catch (e) {}
  }
  setInterval(checkForServerUpdates, 4000);
  setInterval(() => { if (adm.authed) refreshPendingReviews(); }, 5000);
  if (!REDUCE && sess.get('fss_intro') !== '1'){ sess.set('fss_intro', '1'); startIntro(render); } else render();
})();
