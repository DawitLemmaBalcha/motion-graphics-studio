// Page "Minimal" (bg 33-40). One or two large elements, generous space, slow confident motion.
(function () {
  const { TAU, clamp, lerp, phase, win, ease, rand, rgba, smoothstep, mod, mixColor } = M;
  const Q = Math.PI / 2;
  const rgbA = (c, a) => (c[0] === '#' ? rgba(c, a) : c.replace('rgb(', 'rgba(').replace(')', ',' + a.toFixed(4) + ')'));

  // 33 Breathing Circle: one large disc inhales and exhales; three soft echoes follow a beat behind.
  tile('bg.breathing-circle', {
    name: 'Breathing Circle',
    draw(ctx, w, h, t, P) {
      const u = h / 100, cx = w / 2, cy = h / 2;
      // 6 s breath: inhale, a short hold at the top, exhale.
      const breath = (tt) => {
        const p = phase(tt, 6);
        return p < 0.46 ? ease.inOutSine(p / 0.46) : p < 0.56 ? 1 : 1 - ease.inOutSine((p - 0.56) / 0.44);
      };
      const R0 = 27 * u;
      for (let k = 3; k >= 1; k--) {
        const b = breath(t - k * 0.34);
        const r = R0 * (0.9 + 0.14 * b) + k * u * lerp(3.5, 7, b);
        ctx.fillStyle = rgba(P.fg, 0.08 + (3 - k) * 0.045);
        M.circle(ctx, cx, cy, r); ctx.fill();
      }
      const b = breath(t);
      ctx.fillStyle = P.fg;
      M.circle(ctx, cx, cy, R0 * (0.9 + 0.14 * b)); ctx.fill();
    },
  });

  // 34 Split Panels: a Swiss poster of three flat blocks that slide apart one by one and lock back together.
  tile('bg.split-panels', {
    name: 'Split Panels',
    draw(ctx, w, h, t, P) {
      const half = Math.floor(t / 6) % 2, tt = mod(t, 6);
      // Closed layout (fractions of w, h): A ink tall left, B paper top, C ink bottom right.
      const blocks = [
        { x: 0, y: 0, w: 0.44, h: 1, c: P.fg },
        { x: 0.44, y: 0, w: 0.3, h: 0.56, c: P.fg2 },
        { x: 0.44, y: 0.56, w: 0.56, h: 0.44, c: P.fg },
      ];
      // Two different openings, alternating every 6 s: [dx, dy] per block.
      const opens = [
        [[-0.12, 0], [0, -0.2], [0, 0.18]],
        [[0, 0.22], [0.14, 0], [0.1, 0]],
      ][half];
      const ex = 0.5; // overlap so closed seams never show the ground
      blocks.forEach((B, i) => {
        const o = ease.inOutQuart(win(tt, 0.1 + i * 0.6, 1.6 + i * 0.6));
        const c = ease.inOutQuart(win(tt, 3.0 + i * 0.6, 4.5 + i * 0.6));
        const k = o - c;
        const x = (B.x + opens[i][0] * k) * w, y = (B.y + opens[i][1] * k) * h;
        ctx.fillStyle = B.c;
        ctx.fillRect(x - ex, y - ex, B.w * w + 2 * ex, B.h * h + 2 * ex);
      });
    },
  });

  // 35 Arc Rotation: concentric thick arcs spin at different whole-turn speeds and lock back into line.
  tile('bg.arc-rotation', {
    name: 'Arc Rotation',
    draw(ctx, w, h, t, P) {
      const u = h / 100, cx = w / 2, cy = h / 2;
      const rings = [
        { r: 42, span: 0.72, n: 1 },
        { r: 34.4, span: 0.5, n: -1 },
        { r: 26.8, span: 0.8, n: 2, acc: true },
        { r: 19.2, span: 0.6, n: -1 },
        { r: 11.6, span: 0.75, n: 1 },
      ];
      const p = phase(t, 6);
      ctx.lineCap = 'round'; ctx.lineWidth = 5 * u;
      rings.forEach((R, i) => {
        const k = ease.inOutCubic(win(p, 0.02 + i * 0.03, 0.82 + i * 0.03));
        const a = R.n * TAU * k;
        const g = (1 - R.span) * TAU;
        ctx.strokeStyle = R.acc ? P.fg2 : P.fg;
        ctx.beginPath(); ctx.arc(cx, cy, R.r * u, a + g / 2, a + TAU - g / 2); ctx.stroke();
      });
    },
  });

  // 36 Sliding Stripes: thick diagonal bands that shift one place at a time, each a beat after the last.
  tile('bg.sliding-stripes', {
    name: 'Sliding Stripes',
    draw(ctx, w, h, t, P) {
      const u = h / 100, cx = w / 2, cy = h / 2;
      const th = Math.PI / 3.2, dx = Math.cos(th), dy = Math.sin(th);
      const ex = -dy, ey = dx; // along the stripe
      const pitch = 46 * u, per = 3;
      const widths = [26, 7, 16, 7], cols = [P.fg, P.fg2, P.fg, P.fg];
      const R = (w * Math.abs(dx) + h * Math.abs(dy)) / 2 + pitch;
      const L = Math.hypot(w, h);
      const n0 = Math.floor(-R / pitch) - 5, n1 = Math.ceil(R / pitch) + 1;
      for (let n = n0; n <= n1; n++) {
        // Four one-pitch steps per loop; each stripe's step is delayed by where it sits (an accordion ripple).
        let S = 0;
        for (let k = 0; k < 4; k++) {
          const pos = (n + k) * pitch;
          const del = k * per + 0.15 + clamp((pos + R) / (2 * R)) * 1.2;
          S += ease.inOutQuart(clamp((t - del) / 1.55));
        }
        const s = (n + S) * pitch;
        const id = mod(n, 4), sw = widths[id] * u; // identity travels with the stripe
        const sx = cx + dx * s, sy = cy + dy * s;
        ctx.fillStyle = cols[id];
        ctx.beginPath();
        ctx.moveTo(sx + ex * L, sy + ey * L); ctx.lineTo(sx - ex * L, sy - ey * L);
        ctx.lineTo(sx - ex * L + dx * sw, sy - ey * L + dy * sw); ctx.lineTo(sx + ex * L + dx * sw, sy + ey * L + dy * sw);
        ctx.closePath(); ctx.fill();
      }
    },
  });

  // 37 Nested Squares: squares inscribed in squares (each 1/sqrt2 of the last, so they touch but never
  // cross). A quarter turn ripples from the outside in, one square after another: a spiral cascade.
  tile('bg.nested-squares', {
    name: 'Nested Squares',
    draw(ctx, w, h, t, P) {
      const u = h / 100, cx = w / 2, cy = h / 2;
      const N = 7, per = 3;
      ctx.lineJoin = 'round';
      for (let i = 0; i < N; i++) {
        const a = 42 * u * Math.pow(Math.SQRT1_2, i);
        let q = 0;
        for (let k = 0; k < 4; k++) q += ease.inOutCubic(clamp((t - (k * per + 0.1 + i * 0.23)) / 1.5));
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(i * Math.PI / 4 + q * Q);
        if (i === N - 1) { ctx.fillStyle = P.fg; ctx.fillRect(-a, -a, 2 * a, 2 * a); }
        else {
          const lw = Math.max(0.7 * u, a * 0.075);
          ctx.strokeStyle = i === 2 ? P.fg2 : P.fg;
          ctx.lineWidth = lw;
          ctx.strokeRect(-a + lw / 2, -a + lw / 2, 2 * a - lw, 2 * a - lw);
        }
        ctx.restore();
      }
    },
  });

  // 38 Soft Orbs: three large colour fields drifting on slow Lissajous paths (the one soft-gradient tile).
  tile('bg.soft-orbs', {
    name: 'Soft Orbs',
    draw(ctx, w, h, t, P) {
      const u = h / 100, cx = w / 2, cy = h / 2;
      const T = TAU * (t / 12);
      const orbs = [
        { c: mixColor(P.bg, P.fg, 0.2), r: 92, x: Math.sin(T + 0.4) * 0.3, y: Math.sin(2 * T + 1.1) * 0.22, a: 1 },
        { c: mixColor(P.bg, P.fg2, 0.88), r: 80, x: Math.sin(T + 3.0) * 0.32, y: Math.cos(2 * T + 0.3) * 0.2, a: 1 },
        { c: mixColor(P.bg, P.fg2, 0.45), r: 58, x: Math.cos(T + 1.9) * 0.26, y: Math.sin(T + 2.6) * 0.2, a: 0.9 },
      ];
      for (const O of orbs) {
        const x = cx + O.x * w, y = cy + O.y * h * 1.4, r = O.r * u;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        // Gaussian-like falloff: several stops so no ring ever shows.
        const e3 = Math.exp(-3.2);
        for (let s = 0; s <= 10; s++) { const k = s / 10; g.addColorStop(k, rgbA(O.c, (O.a * (Math.exp(-3.2 * k * k) - e3)) / (1 - e3))); }
        ctx.fillStyle = g;
        // Only fill the part of the orb that is on screen.
        const x0 = Math.max(0, x - r), y0 = Math.max(0, y - r), x1 = Math.min(w, x + r), y1 = Math.min(h, y + r);
        if (x1 > x0 && y1 > y0) ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
      }
    },
  });

  // 39 Single Wave: one thick line flowing across the frame; a small float rides it.
  tile('bg.single-wave', {
    name: 'Single Wave',
    draw(ctx, w, h, t, P) {
      const u = h / 100, cy = h / 2;
      const lam = 125 * u, kx = TAU / lam;
      const A = 17 * u * (0.86 + 0.14 * Math.sin(TAU * (t / 6)));
      const y = (x) => cy + A * (0.86 * Math.sin(kx * x - TAU * (t / 4)) + 0.14 * Math.sin(2 * kx * x + TAU * (t / 6) + 0.8));
      const pts = [];
      const n = 160;
      for (let i = 0; i <= n; i++) { const x = -0.04 * w + (i / n) * 1.08 * w; pts.push([x, y(x)]); }
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.strokeStyle = P.fg; ctx.lineWidth = 3.8 * u;
      M.polyline(ctx, pts); ctx.stroke();
      const bx = w * 0.62;
      ctx.fillStyle = P.fg2; M.circle(ctx, bx, y(bx), 4.2 * u); ctx.fill();
    },
  });

  // 40 Quarter Turns: large quarter discs in a two-row grid, turning one after another.
  tile('bg.quarter-turns', {
    name: 'Quarter Turns',
    draw(ctx, w, h, t, P) {
      const rows = 2, c = h / rows, hc = c / 2;
      const cols = 2 * Math.ceil(w / c / 2);
      const x0 = w / 2 - (cols * c) / 2;
      const per = 3, sweep = 2.6, dur = 0.85;
      // Each 2x2 block starts as a full circle (discs meeting at its centre) or as a four-point star.
      // The two rows are mirror images and turn in opposite directions, so the frame stays symmetric.
      const CIRCLE = [[2, 1], [3, 0]]; // [left col][row]
      ctx.fillStyle = P.fg;
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const ci = i - cols / 2, lr = mod(ci, 2), pair = Math.floor(ci / 2);
          const del = 0.1 + (i / Math.max(1, cols - 1)) * (sweep - dur);
          let q = 0;
          for (let k = 0; k < 4; k++) q += ease.inOutCubic(clamp((t - k * per - del) / dur));
          const base = CIRCLE[lr][j] + (mod(pair, 2) ? 2 : 0);
          if (j === 1) q = -q;
          const a = (base + q) * Q;
          const x = x0 + i * c + hc, y = j * c + hc;
          // Quarter disc anchored on a corner of its cell; the cell clips it while it turns.
          const co = Math.cos(a), si = Math.sin(a);
          const ax = x + (-hc * co + hc * si), ay = y + (-hc * si - hc * co);
          ctx.save();
          ctx.beginPath(); ctx.rect(x - hc - 0.5, y - hc - 0.5, c + 1, c + 1); ctx.clip();
          ctx.beginPath(); ctx.moveTo(ax, ay); ctx.arc(ax, ay, c, a, a + Q); ctx.closePath(); ctx.fill();
          ctx.restore();
        }
      }
    },
  });
})();
