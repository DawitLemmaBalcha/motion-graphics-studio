// Page "Draw" (sh 33-40): line-draw shape animations in the After Effects trim-paths style.
// One uniform stroke weight, round caps, the end draws on with an ease and the start chases it off.
(function () {
  const { TAU, clamp, lerp, phase, win, ease, mixColor } = M;

  // ---------- Shared helpers ----------
  // CSS-style cubic-bezier easing (y may leave 0..1 for overshoot), Newton + bisection solve.
  const bez = (x1, y1, x2, y2) => {
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
    const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    const fx = (s) => ((ax * s + bx) * s + cx) * s;
    const fy = (s) => ((ay * s + by) * s + cy) * s;
    const dx = (s) => (3 * ax * s + 2 * bx) * s + cx;
    return (k) => {
      if (k <= 0) return 0; if (k >= 1) return 1;
      let s = k;
      for (let i = 0; i < 6; i++) { const e = fx(s) - k, d = dx(s); if (Math.abs(e) < 1e-6 || Math.abs(d) < 1e-6) break; s -= e / d; }
      if (s < 0 || s > 1 || Math.abs(fx(s) - k) > 1e-4) {
        let lo = 0, hi = 1; s = k;
        for (let i = 0; i < 24; i++) { if (fx(s) < k) lo = s; else hi = s; s = (lo + hi) / 2; }
      }
      return fy(s);
    };
  };
  const E = {
    on: bez(0.25, 0.15, 0.2, 1),   // trim end: launches with speed, long soft landing
    off: bez(0.55, 0, 0.8, 0.6),   // trim start: gathers speed and whips the line off, no lingering dot
    io: bez(0.65, 0, 0.35, 1),     // symmetric in-out for a visible pen that must not jerk
    snap: bez(0.2, 0.85, 0.25, 1), // fast attack
  };

  // A sampled path with cumulative length, so trims are by true length (like AE trim paths).
  const mkPath = (pts) => {
    const L = new Float64Array(pts.length);
    for (let i = 1; i < pts.length; i++) L[i] = L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    return { pts, L, total: L[pts.length - 1] };
  };
  const segAt = (P, d) => {
    let lo = 0, hi = P.pts.length - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (P.L[m] <= d) lo = m; else hi = m; }
    return lo;
  };
  // [x, y, tangent angle] at length fraction f.
  const pointAt = (P, f) => {
    const d = clamp(f) * P.total, i = segAt(P, d);
    const a = P.pts[i], b = P.pts[i + 1], k = (d - P.L[i]) / Math.max(1e-9, P.L[i + 1] - P.L[i]);
    return [lerp(a[0], b[0], k), lerp(a[1], b[1], k), Math.atan2(b[1] - a[1], b[0] - a[0])];
  };
  // Append the part of the path between fractions a and b to the current path.
  const trace = (ctx, P, a, b) => {
    a = clamp(a); b = clamp(b);
    if ((b - a) * P.total < 0.02) return false;
    const i0 = segAt(P, a * P.total), i1 = segAt(P, b * P.total);
    const A = pointAt(P, a), B = pointAt(P, b);
    ctx.moveTo(A[0], A[1]);
    for (let i = i0 + 1; i <= i1; i++) ctx.lineTo(P.pts[i][0], P.pts[i][1]);
    ctx.lineTo(B[0], B[1]);
    return true;
  };
  const strokeTrim = (ctx, P, a, b, col, lw) => {
    ctx.beginPath();
    if (!trace(ctx, P, a, b)) return;
    ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.stroke();
  };
  // Centre the tile and work in u = h/100 units. Round caps and joins everywhere.
  const setup = (ctx, w, h) => {
    const u = h / 100;
    ctx.translate(w / 2, h / 2); ctx.scale(u, u);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  };
  const dot = (ctx, x, y, r, col) => { ctx.fillStyle = col; M.circle(ctx, x, y, r); ctx.fill(); };

  const LW = 2.8; // the page's stroke weight, in u

  // ---------- 33 Squiggle Draw ----------
  // A four-wave sine. The line travels through it, then the next pass comes back the other way.
  const SQUIGGLE = (() => {
    const pts = [], N = 360, W = 96, A = 11, waves = 4;
    for (let i = 0; i <= N; i++) { const s = i / N; pts.push([-W / 2 + W * s, -A * Math.sin(TAU * waves * s)]); }
    return mkPath(pts);
  })();
  tile('sh.squiggle-draw', {
    name: 'Squiggle Draw',
    draw(ctx, w, h, t, P) {
      setup(ctx, w, h);
      const T = 3, p = phase(t, T), back = Math.floor(t / T) % 2 === 1;
      const e = E.on(win(p, 0.02, 0.62)), s = E.off(win(p, 0.3, 0.97));
      strokeTrim(ctx, SQUIGGLE, back ? 1 - e : s, back ? 1 - s : e, P.fg, LW);
    },
  });

  // ---------- 34 Circle Draw ----------
  // A ring drawn by a dot pen; it clicks shut, then the pen erases it. The whole turn rotates once per loop.
  tile('sh.circle-draw', {
    name: 'Circle Draw',
    draw(ctx, w, h, t, P) {
      setup(ctx, w, h);
      const T = 3, p = phase(t, T), R = 17;
      ctx.rotate(-Math.PI / 2 + TAU * (t / 12));
      const e = E.io(win(p, 0, 0.44)), s = E.io(win(p, 0.54, 1));
      if ((e - s) * R * TAU > 0.02) {
        ctx.beginPath(); ctx.arc(0, 0, R, s * TAU, e * TAU);
        ctx.strokeStyle = P.fg; ctx.lineWidth = LW; ctx.stroke();
      }
      const a = (p < 0.49 ? e : s) * TAU;
      const k = win(p, 0.41, 0.62);
      const pop = Math.exp(-5 * k) * Math.sin(2.4 * Math.PI * k) * 1.6;
      dot(ctx, R * Math.cos(a), R * Math.sin(a), 2.7 * (1 + 0.5 * pop), P.fg2);
    },
  });

  // ---------- 35 Check Draw ----------
  // Ring draws, a disc blooms inside, the check snaps in with a pop, everything trims out.
  const CHECK = mkPath([[-8.6, 0.4], [-2.6, 6.4], [9.2, -6.2]]);
  tile('sh.check-draw', {
    name: 'Check Draw',
    draw(ctx, w, h, t, P) {
      setup(ctx, w, h);
      const T = 3, p = phase(t, T), R = 18;
      const kp = win(p, 0.33, 0.62);
      const sc = 1 + 0.16 * Math.exp(-6 * kp) * Math.sin(3 * Math.PI * kp);
      ctx.scale(sc, sc);
      // Disc.
      const dIn = ease.outBack(win(p, 0.22, 0.38), 1.6), dOut = ease.inBack(win(p, 0.62, 0.79), 2);
      const dr = (R - 0.4) * Math.max(0, dIn - dOut);
      if (dr > 0.05) dot(ctx, 0, 0, dr, P.fg2);
      // Ring.
      const e = E.on(win(p, 0, 0.3)), s = E.off(win(p, 0.63, 0.95));
      if ((e - s) * R * TAU > 0.02) {
        ctx.beginPath(); ctx.arc(0, 0, R, -Math.PI / 2 + s * TAU, -Math.PI / 2 + e * TAU);
        ctx.strokeStyle = P.fg; ctx.lineWidth = LW; ctx.stroke();
      }
      // Check.
      const ce = E.snap(win(p, 0.27, 0.38)), cs = E.off(win(p, 0.6, 0.72));
      strokeTrim(ctx, CHECK, cs, ce, P.fg, LW);
    },
  });

  // ---------- 36 Underline Swipe ----------
  // The stroke swipes in at page weight, swells into a bold bar on a spring, holds,
  // thins (anticipation) and whips off to the right.
  const swIn = bez(0.2, 0.7, 0.25, 1.04), swOut = bez(0.6, 0, 0.85, 0.55);
  tile('sh.underline-swipe', {
    name: 'Underline Swipe',
    draw(ctx, w, h, t, P) {
      setup(ctx, w, h);
      const T = 3, p = phase(t, T), L = 88, th = 10;
      const x0 = -L / 2;
      const right = x0 + L * swIn(win(p, 0, 0.2)) + 8 * swOut(win(p, 0.64, 0.92));
      const left = x0 + (L + 8) * swOut(win(p, 0.66, 0.94));
      const swell = ease.spring(win(p, 0.14, 0.44), 0.5, 2.2);
      const thin = E.io(win(p, 0.58, 0.72));
      const thick = lerp(LW, th, swell * (1 - 0.7 * thin));
      if (right - left < 0.02) return;
      ctx.beginPath(); ctx.moveTo(left, 0); ctx.lineTo(right, 0);
      ctx.strokeStyle = P.fg; ctx.lineWidth = thick; ctx.stroke();
    },
  });

  // ---------- 37 Arrow Draw ----------
  // A clean circular arc; the folded head rides the tip and springs open when it lands.
  const ARROW = (() => {
    const pts = [], N = 180, Ra = 40, al = 0.26, cy = 25;
    for (let i = 0; i <= N; i++) { const a = Math.PI + al + (Math.PI - 2 * al) * (i / N); pts.push([Ra * Math.cos(a), cy + Ra * Math.sin(a)]); }
    return mkPath(pts);
  })();
  tile('sh.arrow-draw', {
    name: 'Arrow Draw',
    draw(ctx, w, h, t, P) {
      setup(ctx, w, h);
      const T = 3, p = phase(t, T);
      const e = E.on(win(p, 0, 0.44)), s = E.off(win(p, 0.56, 0.95));
      strokeTrim(ctx, ARROW, s, e, P.fg, LW);
      // Head: folded while travelling, opens with overshoot on landing, shrinks with the shaft as the tail eats it.
      const open = lerp(0.35, 1, ease.outBack(win(p, 0.3, 0.5), 2.8));
      const hs = open * clamp(((e - s) * ARROW.total) / 12);
      if (hs <= 0.01) return;
      const [x, y, ang] = pointAt(ARROW, e);
      const hl = 8.5 * hs, spread = 0.72 * lerp(0.6, 1, clamp(open));
      ctx.beginPath();
      ctx.moveTo(x + hl * Math.cos(ang + Math.PI - spread), y + hl * Math.sin(ang + Math.PI - spread));
      ctx.lineTo(x, y);
      ctx.lineTo(x + hl * Math.cos(ang + Math.PI + spread), y + hl * Math.sin(ang + Math.PI + spread));
      ctx.strokeStyle = P.fg; ctx.lineWidth = LW; ctx.stroke();
    },
  });

  // ---------- 38 Spirograph ----------
  // A nine-petal hypotrochoid. The whole figure sits as a faint hairline; the pen inks it at full
  // weight and the ink fades back to the hairline behind it. One full trace per loop.
  const SPIRO = (() => {
    const R = 9, r = 5, d = 3, turns = 5, N = 2000, k = 23 / (R - r + d);
    const pts = [];
    for (let i = 0; i <= N; i++) {
      const a = (i / N) * TAU * turns;
      pts.push([k * ((R - r) * Math.cos(a) + d * Math.cos(((R - r) / r) * a)), k * ((R - r) * Math.sin(a) - d * Math.sin(((R - r) / r) * a))]);
    }
    return pts;
  })();
  tile('sh.spirograph', {
    name: 'Spirograph',
    draw(ctx, w, h, t, P) {
      setup(ctx, w, h);
      const N = SPIRO.length - 1, floor = 0.32, fw = 1.2;
      const head = (t / 12) * N, trail = 0.4 * N, chunks = 90;
      const at = (f) => { const i = M.mod(f, N), i0 = Math.floor(i), k = i - i0, a = SPIRO[i0], b = SPIRO[Math.min(N, i0 + 1)]; return [lerp(a[0], b[0], k), lerp(a[1], b[1], k)]; };
      // The figure as a hairline.
      ctx.beginPath();
      SPIRO.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.strokeStyle = mixColor(P.bg, P.fg, floor); ctx.lineWidth = fw; ctx.stroke();
      // The ink behind the pen, oldest first so the newest line sits on top.
      for (let c = 0; c < chunks; c++) {
        const f0 = head - trail * (1 - c / chunks), f1 = head - trail * (1 - (c + 1) / chunks);
        const kk = (c + 1) / chunks;
        ctx.beginPath();
        const p0 = at(f0); ctx.moveTo(p0[0], p0[1]);
        for (let f = Math.floor(f0) + 1; f < f1; f++) { const q = at(f); ctx.lineTo(q[0], q[1]); }
        const p1 = at(f1); ctx.lineTo(p1[0], p1[1]);
        ctx.strokeStyle = mixColor(P.bg, P.fg, lerp(floor, 1, Math.pow(kk, 1.5)));
        ctx.lineWidth = lerp(fw, LW, Math.pow(kk, 1.2));
        ctx.stroke();
      }
      const q = at(head);
      dot(ctx, q[0], q[1], 2.5, P.fg2);
    },
  });

  // ---------- 39 Path Follow ----------
  // A dot runs a rounded-square track in four eased legs; its comet tail stretches with speed.
  const TRACK = (() => {
    const S = 20, rc = 11, pts = [];
    const line = (x0, y0, x1, y1) => { for (let i = 0; i < 8; i++) pts.push([lerp(x0, x1, i / 8), lerp(y0, y1, i / 8)]); };
    const arc = (cx, cy, a0) => { for (let i = 0; i < 24; i++) { const a = a0 + (Math.PI / 2) * (i / 24); pts.push([cx + rc * Math.cos(a), cy + rc * Math.sin(a)]); } };
    line(0, -S, S - rc, -S); arc(S - rc, -S + rc, -Math.PI / 2);
    line(S, -S + rc, S, S - rc); arc(S - rc, S - rc, 0);
    line(S - rc, S, -S + rc, S); arc(-S + rc, S - rc, Math.PI / 2);
    line(-S, S - rc, -S, -S + rc); arc(-S + rc, -S + rc, Math.PI);
    line(-S + rc, -S, 0, -S); pts.push([0, -S]);
    return mkPath(pts);
  })();
  const legEase = bez(0.6, 0.1, 0.4, 0.9); // equal end slopes: velocity is continuous leg to leg, never zero
  tile('sh.path-follow', {
    name: 'Path Follow',
    draw(ctx, w, h, t, P) {
      setup(ctx, w, h);
      const leg = 0.75, lag = 0.17, dotR = 3.4;
      // Unwrapped position in legs (4 legs per lap).
      const F = (tt) => { const i = Math.floor(tt / leg); return i + legEase((tt - i * leg) / leg); };
      const fh = F(t), ft = F(t - lag);
      // Track.
      ctx.beginPath(); trace(ctx, TRACK, 0, 1); ctx.closePath();
      ctx.strokeStyle = P.fg2; ctx.lineWidth = 1.3; ctx.stroke();
      // Comet tail as one filled tapered shape.
      if (fh - ft > 0.004) {
        const n = 28, L = [], R = [];
        let prev = null;
        for (let i = 0; i <= n; i++) {
          const k = i / n, f = M.mod(lerp(ft, fh, k) / 4, 1);
          const [x, y, a] = pointAt(TRACK, f);
          const hw = lerp(0.12, LW * 0.62, Math.pow(k, 0.85));
          L.push([x + hw * Math.cos(a - Math.PI / 2), y + hw * Math.sin(a - Math.PI / 2)]);
          R.push([x + hw * Math.cos(a + Math.PI / 2), y + hw * Math.sin(a + Math.PI / 2)]);
          prev = [x, y];
        }
        ctx.beginPath();
        L.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
        for (let i = R.length - 1; i >= 0; i--) ctx.lineTo(R[i][0], R[i][1]);
        ctx.closePath(); ctx.fillStyle = P.fg; ctx.fill();
      }
      const [x, y] = pointAt(TRACK, M.mod(fh / 4, 1));
      dot(ctx, x, y, dotR, P.fg);
    },
  });

  // ---------- 40 Infinity Draw ----------
  // A lemniscate in two colours: a paper stroke leads the draw-on and trails the trim-off of the mint one.
  const INFINITY = (() => {
    const pts = [], N = 520, a = 42, sy = 1.3;
    for (let i = 0; i <= N; i++) {
      const th = Math.PI / 2 + (i / N) * TAU, d = 1 + Math.sin(th) ** 2;
      pts.push([(-a * Math.cos(th)) / d, (sy * a * Math.sin(th) * Math.cos(th)) / d]);
    }
    return mkPath(pts);
  })();
  tile('sh.infinity-draw', {
    name: 'Infinity Draw',
    draw(ctx, w, h, t, P) {
      setup(ctx, w, h);
      const T = 3, p = phase(t, T);
      const e2 = E.on(win(p, 0, 0.44)), s2 = E.off(win(p, 0.55, 0.99));
      const e1 = E.on(win(p, 0.05, 0.5)), s1 = E.off(win(p, 0.48, 0.93));
      strokeTrim(ctx, INFINITY, s2, e2, P.fg2, LW);
      strokeTrim(ctx, INFINITY, s1, e1, P.fg, LW);
    },
  });
})();
