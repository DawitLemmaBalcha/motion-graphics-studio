// Motion-40 shared library. Every tile is a pure function of time t (seconds, 0..LOOP).
// All motion must repeat exactly every LOOP seconds so the clips loop seamlessly.
(function () {
  const LOOP = 12;
  const TAU = Math.PI * 2;

  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, k) => a + (b - a) * k;
  const fract = (x) => x - Math.floor(x);
  const mod = (x, m) => ((x % m) + m) % m;
  const smoothstep = (a, b, x) => { const k = clamp((x - a) / (b - a)); return k * k * (3 - 2 * k); };
  // Phase 0..1 of a cycle of `period` seconds (period must divide LOOP: 1, 1.5, 2, 3, 4, 6, 12).
  const phase = (t, period = LOOP, offset = 0) => fract((t + offset) / period);
  // Progress 0..1 of a window [a, b] inside a 0..1 phase.
  const win = (p, a, b) => clamp((p - a) / (b - a));

  const ease = {
    linear: (k) => k,
    inSine: (k) => 1 - Math.cos((k * Math.PI) / 2),
    outSine: (k) => Math.sin((k * Math.PI) / 2),
    inOutSine: (k) => -(Math.cos(Math.PI * k) - 1) / 2,
    inQuad: (k) => k * k,
    outQuad: (k) => 1 - (1 - k) * (1 - k),
    inOutQuad: (k) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2),
    inCubic: (k) => k * k * k,
    outCubic: (k) => 1 - Math.pow(1 - k, 3),
    inOutCubic: (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2),
    inQuart: (k) => k * k * k * k,
    outQuart: (k) => 1 - Math.pow(1 - k, 4),
    inOutQuart: (k) => (k < 0.5 ? 8 * k * k * k * k : 1 - Math.pow(-2 * k + 2, 4) / 2),
    outQuint: (k) => 1 - Math.pow(1 - k, 5),
    inOutQuint: (k) => (k < 0.5 ? 16 * k * k * k * k * k : 1 - Math.pow(-2 * k + 2, 5) / 2),
    inExpo: (k) => (k === 0 ? 0 : Math.pow(2, 10 * k - 10)),
    outExpo: (k) => (k === 1 ? 1 : 1 - Math.pow(2, -10 * k)),
    inOutExpo: (k) => (k === 0 ? 0 : k === 1 ? 1 : k < 0.5 ? Math.pow(2, 20 * k - 10) / 2 : (2 - Math.pow(2, -20 * k + 10)) / 2),
    inCirc: (k) => 1 - Math.sqrt(1 - k * k),
    outCirc: (k) => Math.sqrt(1 - Math.pow(k - 1, 2)),
    inOutCirc: (k) => (k < 0.5 ? (1 - Math.sqrt(1 - Math.pow(2 * k, 2))) / 2 : (Math.sqrt(1 - Math.pow(-2 * k + 2, 2)) + 1) / 2),
    outBack: (k, s = 1.70158) => 1 + (s + 1) * Math.pow(k - 1, 3) + s * Math.pow(k - 1, 2),
    inBack: (k, s = 1.70158) => (s + 1) * k * k * k - s * k * k,
    inOutBack: (k, s = 1.70158 * 1.525) => (k < 0.5 ? (Math.pow(2 * k, 2) * ((s + 1) * 2 * k - s)) / 2 : (Math.pow(2 * k - 2, 2) * ((s + 1) * (k * 2 - 2) + s) + 2) / 2),
    // Damped spring settling from 0 to 1. zeta = damping ratio (0.2 bouncy .. 1 critical), freq in cycles over k in 0..1.
    spring: (k, zeta = 0.35, freq = 3.2) => {
      if (k <= 0) return 0; if (k >= 1) return 1;
      const w = TAU * freq, wd = w * Math.sqrt(Math.max(1e-6, 1 - zeta * zeta));
      const v = 1 - Math.exp(-zeta * w * k) * (Math.cos(wd * k) + ((zeta * w) / wd) * Math.sin(wd * k));
      // Pin the end to exactly 1 so loops close cleanly.
      return lerp(v, 1, smoothstep(0.85, 1, k));
    },
    outElastic: (k) => (k === 0 ? 0 : k === 1 ? 1 : Math.pow(2, -10 * k) * Math.sin((k * 10 - 0.75) * (TAU / 3)) + 1),
    outBounce: (k) => {
      const n1 = 7.5625, d1 = 2.75;
      if (k < 1 / d1) return n1 * k * k;
      if (k < 2 / d1) return n1 * (k -= 1.5 / d1) * k + 0.75;
      if (k < 2.5 / d1) return n1 * (k -= 2.25 / d1) * k + 0.9375;
      return n1 * (k -= 2.625 / d1) * k + 0.984375;
    },
  };

  // Deterministic hash randoms. Never use Math.random in a tile.
  const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453123; return s - Math.floor(s); };
  const rand = (i, salt = 0) => hash(i * 12.9898 + salt * 78.233 + 0.5);
  const rrange = (i, a, b, salt = 0) => lerp(a, b, rand(i, salt));

  // Periodic smooth noise: value noise on a circle, so it loops over `period` seconds.
  const loopNoise = (t, seed = 0, period = LOOP, octaves = 2) => {
    let v = 0, amp = 1, norm = 0;
    for (let o = 0; o < octaves; o++) {
      const k = o + 1;
      v += amp * Math.sin(TAU * k * (t / period) + rand(seed + o, 1) * TAU);
      norm += amp; amp *= 0.5;
    }
    return v / norm;
  };

  // Colour helpers (hex or rgb() strings in, css strings out).
  // Accepts '#rgb', '#rrggbb' or 'rgb(r,g,b)' / 'rgba(r,g,b,a)' (P.mid is an rgb() string).
  const hexToRgb = (h) => {
    if (h.startsWith('rgb')) return h.slice(h.indexOf('(') + 1, h.indexOf(')')).split(',').slice(0, 3).map((v) => Math.round(parseFloat(v)));
    h = h.replace('#', ''); if (h.length === 3) h = h.split('').map((c) => c + c).join(''); const n = parseInt(h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const rgba = (hex, a = 1) => { const [r, g, b] = hexToRgb(hex); return `rgba(${r},${g},${b},${a})`; };
  const mixColor = (h1, h2, k) => { const a = hexToRgb(h1), b = hexToRgb(h2); const c = a.map((v, i) => Math.round(lerp(v, b[i], k))); return `rgb(${c[0]},${c[1]},${c[2]})`; };

  // Drawing helpers.
  const circle = (ctx, x, y, r) => { ctx.beginPath(); ctx.arc(x, y, Math.max(0, r), 0, TAU); };
  const roundRect = (ctx, x, y, w, h, r) => { ctx.beginPath(); ctx.roundRect(x, y, w, h, Math.max(0, Math.min(r, w / 2, h / 2))); };
  const poly = (ctx, x, y, r, n, rot = 0) => {
    ctx.beginPath();
    for (let i = 0; i < n; i++) { const a = rot + (i / n) * TAU - Math.PI / 2; const px = x + r * Math.cos(a), py = y + r * Math.sin(a); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
    ctx.closePath();
  };
  const star = (ctx, x, y, r1, r2, n, rot = 0) => {
    ctx.beginPath();
    for (let i = 0; i < n * 2; i++) { const r = i % 2 ? r2 : r1; const a = rot + (i / (n * 2)) * TAU - Math.PI / 2; const px = x + r * Math.cos(a), py = y + r * Math.sin(a); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
    ctx.closePath();
  };
  // Draw a polyline from an array of [x,y] points, optionally only the first fraction `upto` of its length.
  const polyline = (ctx, pts, upto = 1) => {
    if (pts.length < 2) return;
    let total = 0; const seg = [];
    for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(d); total += d; }
    let left = total * clamp(upto);
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length && left > 0; i++) {
      const d = seg[i - 1];
      if (d <= left) { ctx.lineTo(pts[i][0], pts[i][1]); left -= d; }
      else { const k = left / d; ctx.lineTo(lerp(pts[i - 1][0], pts[i][0], k), lerp(pts[i - 1][1], pts[i][1], k)); left = 0; }
    }
  };

  // 3D helpers. Camera at origin looking down +z, y up. Returns [screenX, screenY, scale].
  const proj = (x, y, z, f, cx, cy) => [cx + (f * x) / z, cy - (f * y) / z, f / z];
  const rotX = ([x, y, z], a) => [x, y * Math.cos(a) - z * Math.sin(a), y * Math.sin(a) + z * Math.cos(a)];
  const rotY = ([x, y, z], a) => [x * Math.cos(a) + z * Math.sin(a), y, -x * Math.sin(a) + z * Math.cos(a)];
  const rotZ = ([x, y, z], a) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a), z];

  window.M = { LOOP, TAU, clamp, lerp, fract, mod, smoothstep, phase, win, ease, hash, rand, rrange, loopNoise, hexToRgb, rgba, mixColor, circle, roundRect, poly, star, polyline, proj, rotX, rotY, rotZ };
  window.TILES = window.TILES || {};
  // Register a tile: tile('bg.perspective-floor', { name: 'Perspective Floor', draw(ctx, w, h, t, P) {} })
  window.tile = (id, def) => { window.TILES[id] = Object.assign({ id }, def); };
})();
