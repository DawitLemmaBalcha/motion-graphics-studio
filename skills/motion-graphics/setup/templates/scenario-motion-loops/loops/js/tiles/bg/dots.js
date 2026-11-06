// Page "Dots" (bg 17-24).
(function () {
  const { TAU, clamp, lerp, fract, mod, phase, win, ease, rand, rgba, smoothstep } = M;
  const dot = (path, x, y, r) => { path.moveTo(x + r, y); path.arc(x, y, r, 0, TAU); };

  // 17 Halftone Wave: a 45-degree halftone screen; a travelling wave of tone swells the dots until they merge.
  tile('bg.halftone-wave', {
    name: 'Halftone Wave',
    draw(ctx, w, h, t, P) {
      const u = h / 100;
      const p = 6.4 * u, rowH = p / 2, rMax = p * 0.43;
      const T1 = (TAU * t) / 4, T2 = (TAU * t) / 6;
      const a1 = -0.62, c1 = Math.cos(a1), s1 = Math.sin(a1), lam1 = 120;
      const a2 = 0.9, c2 = Math.cos(a2), s2 = Math.sin(a2), lam2 = 210;
      const path = new Path2D();
      const rows = Math.ceil(h / rowH) + 1, cols = Math.ceil(w / p) + 1;
      for (let j = 0; j <= rows; j++) {
        const y = j * rowH;
        for (let i = -1; i <= cols; i++) {
          const x = i * p + (j % 2 ? p / 2 : 0);
          const X = x / u, Y = y / u;
          const v1 = Math.sin((TAU * (X * c1 + Y * s1)) / lam1 - T1);
          const v2 = Math.sin((TAU * (X * c2 + Y * s2)) / lam2 + T2);
          const tone = smoothstep(0.12, 0.98, 0.5 + 0.5 * (0.72 * v1 + 0.28 * v2));
          const r = rMax * Math.pow(tone, 0.75);
          if (r > 0.18 * u) dot(path, x, y, r);
        }
      }
      ctx.fillStyle = P.fg; ctx.fill(path);
    },
  });

  // 18 Halftone Bloom: a halftone glow at the centre that flares and sends rings of light outward.
  tile('bg.halftone-bloom', {
    name: 'Halftone Bloom',
    draw(ctx, w, h, t, P) {
      const u = h / 100, cx = w / 2, cy = h / 2;
      const p = 5.6 * u, rowH = p * 0.866, rMax = p * 0.47;
      const R = Math.hypot(w, h) / 2 + 12 * u;
      const per = 6, n = 3; // a ring every 2 s
      const rings = [];
      let flash = 0;
      for (let k = 0; k < n; k++) {
        const q = phase(t, per, (-k * per) / n);
        rings.push([lerp(6 * u, R, ease.outCubic(q)), lerp(5, 16, q) * u, Math.pow(1 - q, 1.3)]);
        flash = Math.max(flash, 1 - ease.outCubic(win(q, 0, 0.4)));
      }
      const g = (24 + 5 * flash) * u;
      const path = new Path2D();
      const rows = Math.ceil(h / 2 / rowH) + 1, cols = Math.ceil(w / 2 / p) + 1;
      for (let j = -rows; j <= rows; j++) {
        const y = cy + j * rowH;
        for (let i = -cols - 1; i <= cols; i++) {
          const x = cx + i * p + (mod(j, 2) ? p / 2 : 0);
          const d = Math.hypot(x - cx, y - cy);
          let v = Math.exp(-(d * d) / (g * g));
          for (const [rr, bw, amp] of rings) { const z = (d - rr) / bw; v += amp * 0.85 * Math.exp(-z * z); }
          const r = rMax * Math.pow(clamp(v), 0.7);
          if (r > 0.2 * u) dot(path, x, y, r);
        }
      }
      ctx.fillStyle = P.fg; ctx.fill(path);
    },
  });

  // 19 Dot Ripple: drops land on a still dot grid and send damped ripples through it.
  tile('bg.dot-ripple', {
    name: 'Dot Ripple',
    draw(ctx, w, h, t, P) {
      const u = h / 100;
      const p = 6 * u, r0 = 0.95 * u;
      const drops = [];
      for (let i = 0; i < 8; i++) {
        drops.push({ s: i * 1.5 + rand(i, 9) * 0.3, x: lerp(0.1, 0.9, fract(0.15 + i * 0.382 + rand(i, 7) * 0.12)) * w, y: lerp(0.2, 0.8, rand(i, 8)) * h });
      }
      const c = 20 * u, lamW = 17 * u, bw = 10 * u;
      const live = drops.map((d) => ({ ...d, age: mod(t - d.s, 12) })).filter((d) => d.age < 7);
      const path = new Path2D();
      const cols = Math.ceil(w / p) + 1, rows = Math.ceil(h / p) + 1;
      const ox = (w - (cols - 1) * p) / 2, oy = (h - (rows - 1) * p) / 2;
      for (let j = -1; j <= rows; j++) {
        for (let i = -1; i <= cols; i++) {
          const x = ox + i * p, y = oy + j * p;
          let dx = 0, dy = 0, grow = 0;
          for (const d of live) {
            const vx = x - d.x, vy = y - d.y, dist = Math.hypot(vx, vy) + 1e-6;
            const xr = dist - c * d.age;
            if (xr > bw * 2.5 || xr < -bw * 3) continue;
            const env = Math.exp(-(xr * xr) / (bw * bw)) * Math.exp(-d.age / 2.2) * smoothstep(0, 0.3, d.age) * smoothstep(0, 1.6 * p, dist) / (1 + dist / (60 * u));
            const ph = (TAU * xr) / lamW;
            dx += (vx / dist) * Math.sin(ph) * env * 5 * u; dy += (vy / dist) * Math.sin(ph) * env * 5 * u;
            grow += Math.cos(ph) * env;
          }
          const r = r0 * (1 + 2.1 * grow);
          if (r > 0.2 * u) dot(path, x + dx, y + dy, r);
        }
      }
      ctx.fillStyle = P.fg; ctx.fill(path);
      // The drop itself: an accent dot that falls onto the surface just before each ripple.
      for (const d of drops) {
        const k = mod(t - (d.s - 0.45), 12);
        if (k > 1.05) continue;
        const r = k < 0.45 ? lerp(4.8, 1.8, ease.inCubic(k / 0.45)) : lerp(1.8, 0, ease.inOutCubic((k - 0.45) / 0.6));
        ctx.fillStyle = P.fg2; M.circle(ctx, d.x, d.y, r * u); ctx.fill();
      }
    },
  });

  // 20 Phyllotaxis: a sunflower spiral turning slowly; it breathes, and its divergence angle drifts so the arms swirl.
  tile('bg.phyllotaxis', {
    name: 'Phyllotaxis',
    draw(ctx, w, h, t, P) {
      const u = h / 100, cx = w / 2, cy = h / 2;
      const golden = Math.PI * (3 - Math.sqrt(5));
      const T = (TAU * t) / 12;
      const c = 3.5 * u * (1 + 0.05 * Math.sin(2 * T));
      const div = golden + 0.0005 * Math.sin(T);
      const rot = -T;
      const R = Math.hypot(w, h) / 2 + 3 * u;
      const N = Math.ceil((R / c) * (R / c));
      const main = new Path2D(), core = new Path2D();
      for (let i = 1; i < N; i++) {
        const r = c * Math.sqrt(i);
        const a = i * div + rot;
        const x = cx + r * Math.cos(a), y = cy + r * Math.sin(a);
        if (x < -3 * u || x > w + 3 * u || y < -3 * u || y > h + 3 * u) continue;
        const pulse = 0.5 + 0.5 * Math.sin(r / (16 * u) - (TAU * t) / 4);
        const rd = c * lerp(0.2, 0.36, Math.min(1, r / (45 * u))) * lerp(0.82, 1.12, pulse);
        dot(i < 34 ? core : main, x, y, rd);
      }
      ctx.fillStyle = P.fg; ctx.fill(main);
      ctx.fillStyle = P.fg2; ctx.fill(core);
    },
  });

  // 21 Polka Drift: two staggered polka layers drifting on the diagonal at different depths.
  tile('bg.polka-drift', {
    name: 'Polka Drift',
    draw(ctx, w, h, t, P) {
      const u = h / 100;
      // One eased camera move for both layers: tw(t + 12) = tw(t) + 12.
      const tw = t + 0.35 * (6 / TAU) * Math.sin((TAU * t) / 6);
      const layers = [
        { p: 10 * u, r: 1.5 * u, steps: 3, col: M.mixColor(P.bg, P.fg, 0.38) },
        { p: 22 * u, r: 4.2 * u, steps: 6, col: P.fg },
      ];
      for (const L of layers) {
        const s = fract((L.steps * tw) / 12); // whole lattice steps per loop
        const off = s * (L.p / 2);
        const path = new Path2D();
        const rowH = L.p / 2;
        const rows = Math.ceil(h / rowH) + 3, cols = Math.ceil(w / L.p) + 3;
        for (let j = -2; j < rows; j++) {
          for (let i = -2; i < cols; i++) {
            const x = i * L.p + (mod(j, 2) ? L.p / 2 : 0) + off, y = j * rowH + off;
            if (x < -L.r || x > w + L.r || y < -L.r || y > h + L.r) continue;
            dot(path, x, y, L.r);
          }
        }
        ctx.fillStyle = L.col; ctx.fill(path);
      }
    },
  });

  // 22 Dot Sweep: a radar arm sweeps a dot grid; dots flare white at the arm, then cool to ink and shrink.
  tile('bg.dot-sweep', {
    name: 'Dot Sweep',
    draw(ctx, w, h, t, P) {
      const u = h / 100, cx = w / 2, cy = h / 2;
      const p = 6.4 * u, rMin = 0.55 * u, rMax = 2.7 * u;
      const k = (TAU * t) / 3;
      const sweep = k - 0.5 * Math.sin(k); // eased: each turn surges and settles
      const ink = new Path2D(), hot = new Path2D();
      const cols = Math.ceil(w / 2 / p) + 1, rows = Math.ceil(h / 2 / p) + 1;
      for (let j = -rows; j <= rows; j++) {
        for (let i = -cols; i <= cols; i++) {
          const x = cx + i * p, y = cy + j * p;
          if (!i && !j) continue;
          const d = mod(sweep - Math.atan2(y - cy, x - cx), TAU); // angle behind the arm
          const R = lerp(rMin, rMax, Math.exp(-d / 1.25) * smoothstep(0, 0.08, d));
          // The arm itself is a band of white-hot dots a fixed distance wide, so it reads as one straight edge.
          const band = (d * Math.hypot(x - cx, y - cy)) / p;
          dot(band < 1.15 && d < 0.6 ? hot : ink, x, y, R);
        }
      }
      ctx.fillStyle = P.fg; ctx.fill(ink);
      ctx.fillStyle = P.fg2; ctx.fill(hot);
    },
  });

  // 23 Pixel Rain: columns of square pixels falling at different speeds, each trail shrinking away.
  tile('bg.pixel-rain', {
    name: 'Pixel Rain',
    draw(ctx, w, h, t, P) {
      const u = h / 100;
      const cell = 5.2 * u, sq = cell * 0.8;
      const cols = Math.ceil(w / cell), rows = Math.ceil(h / cell);
      const ox = (w - cols * cell) / 2;
      const pers = [2, 3, 3, 4, 6];
      const ink = new Path2D(), head = new Path2D();
      for (let c = 0; c < cols; c++) {
        if (rand(c, 1) < 0.3) continue; // some columns stay dry
        const per = pers[Math.floor(rand(c, 2) * pers.length)];
        const T = 5 + Math.floor(rand(c, 3) * 12);
        const travel = rows + T + 1;
        const hp = phase(t, per, rand(c, 4) * per) * travel;
        const hr = Math.floor(hp);
        const x = ox + c * cell + cell / 2;
        for (let k = 0; k <= T; k++) {
          const r = hr - k;
          if (r < 0 || r >= rows) continue;
          const f = 1 - clamp((hp - r - 1) / T);
          const s = sq * Math.pow(f, 0.7);
          if (s < 0.5 * u) continue;
          const y = r * cell + cell / 2;
          (k === 0 ? head : ink).rect(x - s / 2, y - s / 2, s, s);
        }
      }
      ctx.fillStyle = P.fg; ctx.fill(ink);
      ctx.fillStyle = P.fg2; ctx.fill(head);
    },
  });

  // 24 Orbit Dots: concentric rings of dots; each turn ripples outward ring by ring,
  // bending twelve bright spokes into a spiral and straightening them again.
  tile('bg.orbit-dots', {
    name: 'Orbit Dots',
    draw(ctx, w, h, t, P) {
      const u = h / 100, cx = w / 2, cy = h / 2;
      const g = 6.6 * u, sp = 3.9 * u, rd = 0.95 * u, S = 12;
      const K = Math.ceil(Math.hypot(w, h) / 2 / g) + 1;
      const per = 4, p = phase(t, per), cyc = Math.floor(t / per);
      const field = new Path2D(), spoke = new Path2D();
      for (let k = 1; k <= K; k++) {
        const r = k * g;
        const n = S * Math.max(1, Math.round((TAU * r) / (S * sp)));
        const d0 = 0.38 * ((k - 1) / (K - 1));
        const rot = (cyc + ease.inOutCubic(win(p, d0, d0 + 0.5))) * (TAU / 3);
        const every = n / S;
        for (let j = 0; j < n; j++) {
          const a = (j / n) * TAU + rot;
          const x = cx + r * Math.cos(a), y = cy + r * Math.sin(a);
          if (x < -2 * u || x > w + 2 * u || y < -2 * u || y > h + 2 * u) continue;
          if (j % every === 0) dot(spoke, x, y, rd * 1.35); else dot(field, x, y, rd);
        }
      }
      ctx.fillStyle = M.mixColor(P.bg, P.fg, 0.42); ctx.fill(field);
      ctx.fillStyle = P.fg; ctx.fill(spoke);
      ctx.fillStyle = P.fg2; M.circle(ctx, cx, cy, 2 * u); ctx.fill();
    },
  });
})();
