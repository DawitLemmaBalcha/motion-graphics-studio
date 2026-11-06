// Page "Lines" (bg 09-16).
(function () {
  const { TAU, clamp, lerp, fract, mod, phase, win, ease, rand, rgba, smoothstep } = M;

  // 09 Speed Lines: tapered streaks racing past in three depths; the whole field surges twice a loop.
  tile('bg.speed-lines', {
    name: 'Speed Lines',
    draw(ctx, w, h, t, P) {
      const u = h / 100;
      // Time warp: tw(t + 12) = tw(t) + 12, so every phase below still closes the loop.
      const SP = 6, A = 0.45;
      const tw = t + A * (SP / TAU) * Math.sin((TAU * t) / SP);
      const surge = (Math.cos((TAU * t) / SP) + 1) / 2; // 0 slow .. 1 fast
      const n = Math.round(40 * (w / h));
      const paths = [new Path2D(), new Path2D(), new Path2D()]; // far (mid), near (fg), accent (fg2)
      for (let i = 0; i < n; i++) {
        const d = rand(i, 1); // 0 far .. 1 near
        const tier = d < 0.5 ? 0 : d < 0.9 ? 1 : 2;
        const per = [4, 2, 1.5][tier];
        const k = phase(tw, per, rand(i, 2) * per);
        const y = (rand(i, 3) * 1.04 - 0.02) * h;
        const L = [lerp(10, 22, d / 0.5), lerp(22, 44, (d - 0.5) / 0.4), lerp(52, 80, (d - 0.9) / 0.1)][tier] * u * lerp(0.6, 1.2, surge);
        const r = [0.28, lerp(0.4, 0.62, (d - 0.5) / 0.4), lerp(0.9, 1.25, (d - 0.9) / 0.1)][tier] * u;
        const xh = lerp(-r, w + L + r, k), xt = xh - L;
        const layer = tier === 0 ? 0 : i % 7 === 3 ? 2 : 1;
        const p = paths[layer];
        p.moveTo(xt, y); p.lineTo(xh, y - r); p.arc(xh, y, r, -Math.PI / 2, Math.PI / 2); p.closePath();
      }
      ctx.fillStyle = M.mixColor(P.bg, P.fg, 0.42); ctx.fill(paths[0]);
      ctx.fillStyle = P.fg; ctx.fill(paths[1]);
      ctx.fillStyle = P.fg2; ctx.fill(paths[2]);
    },
  });

  // 10 Sine Stack: stacked sine lines, each a little out of phase, so the stack folds and rolls like cloth.
  tile('bg.sine-stack', {
    name: 'Sine Stack',
    draw(ctx, w, h, t, P) {
      const u = h / 100;
      const s = 6.2 * u, lam = 78 * u, phi = 0.42;
      const aMax = s / (2 * Math.sin(phi / 2)); // above this neighbouring lines would cross
      const extra = Math.ceil(aMax / s) + 1;
      const rows = Math.ceil(h / s);
      const step = Math.max(2, lam / 48);
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      const pathA = new Path2D(), pathB = new Path2D();
      for (let j = -extra; j <= rows + extra; j++) {
        const y0 = j * s + s * 0.5;
        const p = j === Math.round(rows * 0.62) ? pathB : pathA;
        for (let x = -step, first = true; x <= w + step; x += step, first = false) {
          const env = 0.62 + 0.3 * Math.sin((TAU * x) / (lam * 2.6) + (TAU * t) / 12);
          const th = (TAU * x) / lam - (TAU * t) / 4 + j * phi;
          const y = y0 + aMax * env * Math.sin(th);
          first ? p.moveTo(x, y) : p.lineTo(x, y);
        }
      }
      ctx.lineWidth = 0.95 * u;
      ctx.strokeStyle = P.fg; ctx.stroke(pathA);
      ctx.strokeStyle = P.fg2; ctx.stroke(pathB);
    },
  });

  // 11 Line Burst: a sunburst of long and short rays; breaks ripple outward through it in eased waves.
  tile('bg.line-burst', {
    name: 'Line Burst',
    draw(ctx, w, h, t, P) {
      const u = h / 100, cx = w / 2, cy = h / 2;
      const N = 48, R0 = 12 * u, R1 = Math.hypot(w, h) / 2 + 6 * u, Rs = R0 + 0.42 * (R1 - R0) * (h / Math.hypot(w, h)) * 2.2;
      // Two breaks in flight at once; each eases from the core to beyond the corners.
      const per = 3, gaps = [];
      for (let g = 0; g < 2; g++) {
        const k = phase(t, per, g * per / 2);
        const e = ease.inOutSine(k);
        gaps.push([lerp(R0 - 6 * u, R1 + 6 * u, e), lerp(1.2, 9, e) * u]);
      }
      const pa = new Path2D();
      for (let i = 0; i < N; i++) {
        const a = (i / N) * TAU - Math.PI / 2;
        const end = i % 2 ? Math.min(Rs, R1) : R1;
        const ca = Math.cos(a), sa = Math.sin(a);
        // Visible pieces of [R0, end] minus the gaps.
        let segs = [[R0, end]];
        for (const [gc, gw] of gaps) {
          const g0 = gc - gw / 2, g1 = gc + gw / 2, next = [];
          for (const [s0, s1] of segs) {
            if (g1 <= s0 || g0 >= s1) { next.push([s0, s1]); continue; }
            if (g0 > s0) next.push([s0, g0]);
            if (g1 < s1) next.push([g1, s1]);
          }
          segs = next;
        }
        for (const [s0, s1] of segs) {
          if (s1 - s0 < 0.3 * u) continue;
          pa.moveTo(cx + ca * s0, cy + sa * s0); pa.lineTo(cx + ca * s1, cy + sa * s1);
        }
      }
      ctx.lineCap = 'round';
      ctx.lineWidth = 0.7 * u;
      ctx.strokeStyle = P.fg; ctx.stroke(pa);
      // The source: an accent disc that kicks as each wave leaves it.
      const kick = Math.max(...[0, 1].map((g) => { const k = phase(t, per, g * per / 2); return k < 0.25 ? 1 - ease.outCubic(k / 0.25) : 0; }));
      ctx.fillStyle = P.fg2;
      M.circle(ctx, cx, cy, (3.2 + 1.6 * kick) * u); ctx.fill();
    },
  });

  // 12 Flow Lines: one silk ribbon of fine parallel lines flowing across the frame, pinching and opening.
  tile('bg.flow-lines', {
    name: 'Flow Lines',
    draw(ctx, w, h, t, P) {
      const u = h / 100;
      const m = 8; // lines either side of the centre
      const step = Math.max(2, w / 160);
      const T1 = (TAU * t) / 12, T2 = (TAU * t) / 6;
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.lineWidth = 0.5 * u;
      const xs = [];
      for (let x = -step * 2; x <= w + step * 2; x += step) xs.push(x);
      // Centreline and half-width along x (shared by every line of the ribbon).
      const C = [], HW = [];
      for (const x of xs) {
        const a = x / w;
        C.push(h * (0.5 + 0.2 * Math.sin(TAU * a * 0.9 + T1 + 0.6) + 0.07 * Math.sin(TAU * a * 1.9 - T2 + 1.1)));
        HW.push(h * (0.23 + 0.13 * Math.sin(TAU * a * 1.15 - T1 + 2.0)));
      }
      for (let j = -m; j <= m; j++) {
        const s = j / m;
        const sheen = 0.5 + 0.5 * Math.cos(Math.PI * s * 0.9 + 1.2 * Math.sin(T1));
        ctx.strokeStyle = rgba(P.fg, lerp(0.55, 1, sheen * sheen));
        ctx.beginPath();
        for (let q = 0; q < xs.length; q++) {
          const y = C[q] + s * HW[q] * (1 - 0.1 * s * s);
          q ? ctx.lineTo(xs[q], y) : ctx.moveTo(xs[q], y);
        }
        ctx.stroke();
      }
    },
  });

  // 13 Stripe Twist: vertical ribbons twisting about their axis; the twist travels down the frame.
  // Two flat tones: the face side of each ribbon and its darker reverse.
  tile('bg.stripe-twist', {
    name: 'Stripe Twist',
    draw(ctx, w, h, t, P) {
      const u = h / 100;
      const cols = Math.max(4, Math.round((w / h) * 5));
      const pitch = w / cols, half = pitch * 0.39;
      const lam = h * 1.3, steps = 110, dy = (h + 4 * u) / steps;
      const front = new Path2D(), back = new Path2D();
      for (let c = 0; c < cols; c++) {
        const x = (c + 0.5) * pitch;
        const th = (y) => (TAU * y) / lam - (TAU * t) / 6 + c * 0.55;
        let yPrev = -2 * u, hPrev = half * Math.cos(th(yPrev));
        for (let s = 1; s <= steps; s++) {
          const y = -2 * u + s * dy;
          const hw = half * Math.cos(th(y));
          if ((hPrev >= 0) === (hw >= 0)) {
            const p = hw + hPrev >= 0 ? front : back;
            p.moveTo(x - hPrev, yPrev); p.lineTo(x + hPrev, yPrev); p.lineTo(x + hw, y); p.lineTo(x - hw, y); p.closePath();
          } else {
            // The edges cross here: split the slice at the crossing.
            const k = hPrev / (hPrev - hw), ym = lerp(yPrev, y, k);
            const p1 = hPrev >= 0 ? front : back, p2 = hw >= 0 ? front : back;
            p1.moveTo(x - hPrev, yPrev); p1.lineTo(x + hPrev, yPrev); p1.lineTo(x, ym); p1.closePath();
            p2.moveTo(x, ym); p2.lineTo(x + hw, y); p2.lineTo(x - hw, y); p2.closePath();
          }
          yPrev = y; hPrev = hw;
        }
      }
      // The ribbon's thin edge, seen where it turns edge-on, keeps each column one continuous ribbon.
      ctx.strokeStyle = M.mixColor(P.bg, P.fg, 0.55); ctx.lineWidth = 0.55 * u;
      ctx.beginPath();
      for (let c = 0; c < cols; c++) { ctx.moveTo((c + 0.5) * pitch, -2 * u); ctx.lineTo((c + 0.5) * pitch, h + 2 * u); }
      ctx.stroke();
      ctx.fillStyle = M.mixColor(P.bg, P.fg, 0.36); ctx.fill(back);
      ctx.fillStyle = P.fg; ctx.fill(front);
    },
  });

  // 14 Moiré: two families of concentric rings drifting against each other.
  tile('bg.moire', {
    name: 'Moiré',
    draw(ctx, w, h, t, P) {
      const u = h / 100, sp = 3.1 * u;
      const T = (TAU * t) / 12;
      const dx = 0.14 * w * Math.sin(T), dy = 0.16 * h * Math.sin(2 * T + 0.6);
      const centres = [[w / 2 + dx, h / 2 + dy], [w / 2 - dx, h / 2 - dy]];
      ctx.lineWidth = 1.25 * u;
      ctx.strokeStyle = P.fg;
      for (const [cx, cy] of centres) {
        const rMax = Math.hypot(Math.max(cx, w - cx), Math.max(cy, h - cy)) + sp;
        const path = new Path2D();
        for (let r = sp; r < rMax; r += sp) { path.moveTo(cx + r, cy); path.arc(cx, cy, r, 0, TAU); }
        ctx.stroke(path);
      }
    },
  });

  // 15 Scan Bars: a stack of thick bars cut by a scan line that sweeps back and forth;
  // the bars recolour on either side of the cut, and the cut opens as it speeds up.
  tile('bg.scan-bars', {
    name: 'Scan Bars',
    draw(ctx, w, h, t, P) {
      const u = h / 100;
      const n = 8, pitch = h / n, th = pitch * 0.58, r = th / 2;
      const pass = 3; // one sweep; there and back is 6 s
      for (let i = 0; i < n; i++) {
        const y = (i + 0.5) * pitch;
        const lag = 0.5 * (Math.abs(i - (n - 1) / 2) / ((n - 1) / 2)) + 0.05 * (i / (n - 1)); // a chevron front
        const p = phase(t - lag * pass, pass * 2);
        const fwd = p < 0.5, k = fwd ? p * 2 : p * 2 - 1;
        const kk = win(k, 0, 0.6);
        const e = ease.inOutQuad(kk);
        const gap = lerp(1.4, 7.5, Math.sin(Math.PI * kk)) * u;
        const gL = -gap / 2 - r, gR = w + gap / 2 + r;
        const g = fwd ? lerp(gL, gR, e) : lerp(gR, gL, e);
        const aEnd = g - gap / 2, bStart = g + gap / 2;
        if (aEnd > -r) { ctx.fillStyle = P.fg2; M.roundRect(ctx, -2 * r, y - r, aEnd + 2 * r, th, r); ctx.fill(); }
        if (bStart < w + r) { ctx.fillStyle = P.fg; M.roundRect(ctx, bStart, y - r, w + 2 * r - bStart, th, r); ctx.fill(); }
      }
    },
  });

  // 16 Contours: topographic lines of a slowly morphing terrain; contours rise out of the peaks.
  tile('bg.contours', {
    name: 'Contours',
    draw(ctx, w, h, t, P) {
      const u = h / 100;
      const cs = 2.6 * u;
      const cols = Math.ceil(w / cs) + 2, rows = Math.ceil(h / cs) + 2;
      const T = (TAU * t) / 12;
      const bumps = [
        [0.30, 0.42, 0.10, 0.12, 0.34, 1.0, 0],
        [0.72, 0.60, 0.12, 0.10, 0.30, 0.9, 1.7],
        [0.52, 0.18, 0.14, 0.08, 0.26, -0.8, 3.1],
        [0.12, 0.85, 0.08, 0.10, 0.28, -0.7, 4.2],
        [0.90, 0.20, 0.08, 0.12, 0.24, 0.7, 5.0],
      ];
      const asp = w / h;
      const W1 = cols + 1;
      const field = new Float32Array(W1 * (rows + 1));
      for (let j = 0; j <= rows; j++) {
        for (let i = 0; i <= cols; i++) {
          const X = ((i - 1) * cs) / h, Y = ((j - 1) * cs) / h;
          let v = 0.18 * Math.sin(X * 2.3 + Y * 1.4 + T) + 0.12 * Math.sin(-X * 1.6 + Y * 3.1 + 2 * T + 1);
          for (const [bx, by, rx, ry, sg, amp, ph] of bumps) {
            const px = (bx + rx * Math.sin(T + ph)) * asp, py = by + ry * Math.sin(2 * T + ph * 1.3);
            const d2 = (X - px) * (X - px) + (Y - py) * (Y - py);
            v += amp * Math.exp(-d2 / (sg * sg));
          }
          field[j * W1 + i] = v;
        }
      }
      const step = 0.085, shift = (t / 12) * 4 * step; // four levels per loop: index lines stay index lines
      let vmin = Infinity, vmax = -Infinity;
      for (const v of field) { if (v < vmin) vmin = v; if (v > vmax) vmax = v; }
      const nEdges = 2 * W1 * (rows + 1);
      const ex = new Float32Array(nEdges), ey = new Float32Array(nEdges);
      const nb = new Int32Array(nEdges * 2);
      const seen = new Uint8Array(nEdges);
      const minor = new Path2D(), major = new Path2D();
      const k0 = Math.ceil((vmin - shift) / step), k1 = Math.floor((vmax - shift) / step);
      for (let k = k0; k <= k1; k++) {
        const lv = k * step + shift;
        nb.fill(-1); seen.fill(0);
        const used = [];
        const pt = (e) => {
          const q = e >> 1, i0 = q % W1, j0 = (q / W1) | 0;
          const i1 = e & 1 ? i0 : i0 + 1, j1 = e & 1 ? j0 + 1 : j0;
          const a = field[j0 * W1 + i0], b = field[j1 * W1 + i1];
          const f = (lv - a) / (b - a);
          ex[e] = (lerp(i0, i1, f) - 1) * cs; ey[e] = (lerp(j0, j1, f) - 1) * cs;
        };
        const link = (e1, e2) => {
          if (nb[e1 * 2] < 0) { pt(e1); nb[e1 * 2] = e2; used.push(e1); } else nb[e1 * 2 + 1] = e2;
          if (nb[e2 * 2] < 0) { pt(e2); nb[e2 * 2] = e1; used.push(e2); } else nb[e2 * 2 + 1] = e1;
        };
        for (let j = 0; j < rows; j++) {
          for (let i = 0; i < cols; i++) {
            const a = field[j * W1 + i], b = field[j * W1 + i + 1], c = field[(j + 1) * W1 + i + 1], d = field[(j + 1) * W1 + i];
            const idx = (a > lv ? 8 : 0) | (b > lv ? 4 : 0) | (c > lv ? 2 : 0) | (d > lv ? 1 : 0);
            if (idx === 0 || idx === 15) continue;
            const eT = (j * W1 + i) * 2, eB = ((j + 1) * W1 + i) * 2, eL = (j * W1 + i) * 2 + 1, eR = (j * W1 + i + 1) * 2 + 1;
            switch (idx) {
              case 1: case 14: link(eL, eB); break;
              case 2: case 13: link(eB, eR); break;
              case 3: case 12: link(eL, eR); break;
              case 4: case 11: link(eT, eR); break;
              case 6: case 9: link(eT, eB); break;
              case 7: case 8: link(eL, eT); break;
              case 5: case 10: {
                const centre = (a + b + c + d) / 4 > lv;
                if ((idx === 5) === centre) { link(eL, eT); link(eB, eR); } else { link(eL, eB); link(eT, eR); }
                break;
              }
            }
          }
        }
        // Walk the chains and draw them smoothed (quadratic through segment midpoints).
        const path = mod(k, 4) === 0 ? major : minor;
        const walk = (start) => {
          const pts = [start]; seen[start] = 1;
          let cur = start;
          for (;;) {
            const n0 = nb[cur * 2], n1 = nb[cur * 2 + 1];
            const nx = n0 >= 0 && !seen[n0] ? n0 : n1 >= 0 && !seen[n1] ? n1 : -1;
            if (nx < 0) break;
            seen[nx] = 1; pts.push(nx); cur = nx;
          }
          return pts;
        };
        const draw = (pts, closed) => {
          const n = pts.length;
          if (n < 2) return;
          const X = (q) => ex[pts[q]], Y = (q) => ey[pts[q]];
          if (closed && n > 2) {
            path.moveTo((X(n - 1) + X(0)) / 2, (Y(n - 1) + Y(0)) / 2);
            for (let q = 0; q < n; q++) { const r = (q + 1) % n; path.quadraticCurveTo(X(q), Y(q), (X(q) + X(r)) / 2, (Y(q) + Y(r)) / 2); }
          } else {
            path.moveTo(X(0), Y(0));
            for (let q = 1; q < n - 1; q++) path.quadraticCurveTo(X(q), Y(q), (X(q) + X(q + 1)) / 2, (Y(q) + Y(q + 1)) / 2);
            path.lineTo(X(n - 1), Y(n - 1));
          }
        };
        for (const e of used) if (!seen[e] && nb[e * 2 + 1] < 0) draw(walk(e), false);
        for (const e of used) if (!seen[e]) draw(walk(e), true);
      }
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.strokeStyle = M.mixColor(P.bg, P.fg, 0.5); ctx.lineWidth = 0.3 * u; ctx.stroke(minor);
      ctx.strokeStyle = P.fg; ctx.lineWidth = 0.6 * u; ctx.stroke(major);
    },
  });
})();
