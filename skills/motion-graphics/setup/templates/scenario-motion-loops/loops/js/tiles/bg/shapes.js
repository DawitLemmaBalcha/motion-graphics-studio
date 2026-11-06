// Page "Shapes" (bg 25-32). Flat Bauhaus primitives, quarter-turn choreography.
(function () {
  const { TAU, clamp, lerp, phase, win, ease, rand, rgba, smoothstep, mod, mixColor } = M;
  const Q = Math.PI / 2;
  // Quarter-turn ease: a touch of anticipation, a soft overshoot, then it settles.
  const turn = (k, s = 1.25) => ease.inOutBack(clamp(k), s);
  // Two-stage hash so grid cells never fall into visible repeats.
  const cell = (i, j, salt = 0) => rand(i * 3 + 0.37, j * 5 + 0.71 + salt) * 911.3;

  // 25 Bauhaus Grid: cells of quarter discs, half discs, leaves and triangles turning in a diagonal wave.
  tile('bg.bauhaus-grid', {
    name: 'Bauhaus Grid',
    draw(ctx, w, h, t, P) {
      const rows = 3, c = h / rows, hc = c / 2;
      const cols = Math.ceil(w / c / 2) * 2 + 1;
      const x0 = w / 2 - (cols * c) / 2;
      const per = 3;
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          const gi = i - (cols - 1) / 2;          // centred column index, stable across aspects
          const sd = cell(gi, j, 1);
          const x = x0 + i * c, y = j * c;
          // Colours: cell ground + shape, never the same. Paper is the rare accent.
          const rg = rand(sd, 1);
          let ground, ink;
          if (rg < 0.55) { ground = P.bg; ink = rand(sd, 2) < 0.18 ? P.fg2 : P.fg; }
          else { ground = P.fg; ink = rand(sd, 2) < 0.8 ? P.bg : P.mid; }
          const third = [P.mid, P.fg, P.bg].find((col) => col !== ground && col !== ink);
          const rt = rand(sd, 3);
          const type = rt < 0.34 ? 0 : rt < 0.58 ? 1 : rt < 0.76 ? 2 : rt < 0.9 ? 3 : 4;
          const base = Math.floor(rand(sd, 4) * 4);
          const dir = rand(sd, 5) < 0.5 ? 1 : -1;
          // Diagonal wave: each cell turns once every 3 s.
          const del = (i / (cols - 1)) * 1.45 + j * 0.2 + rand(sd, 6) * 0.1;
          const n = Math.floor((t - del) / per);
          const k = win(phase(t - del, per), 0, 0.36);
          const ang = (base + dir * (n + turn(k))) * Q;

          // Cells overlap by half a pixel and every ground is painted, so neighbours never show a seam.
          const e = Math.max(0.5, c * 0.004), he = hc + e;
          ctx.save();
          ctx.beginPath(); ctx.rect(x - e, y - e, c + 2 * e, c + 2 * e); ctx.clip();
          ctx.fillStyle = ground; ctx.fillRect(x - e, y - e, c + 2 * e, c + 2 * e);
          ctx.translate(x + hc, y + hc); ctx.rotate(ang);
          ctx.fillStyle = ink; ctx.beginPath();
          if (type === 0) { ctx.moveTo(-he, -he); ctx.arc(-he, -he, c + 2 * e, 0, Q); ctx.closePath(); }
          else if (type === 1) { ctx.moveTo(hc, -he); ctx.arc(0, -he, hc, 0, Math.PI); ctx.closePath(); }
          else if (type === 2) { ctx.moveTo(hc, -hc); ctx.arc(-hc, -hc, c, 0, Q); ctx.arc(hc, hc, c, Math.PI, Math.PI * 1.5); ctx.closePath(); }
          else if (type === 3) { ctx.moveTo(-he, -he); ctx.lineTo(he + e, -he); ctx.lineTo(-he, he + e); ctx.closePath(); }
          else { ctx.arc(0, 0, hc * 0.9, 0, TAU); }
          ctx.fill();
          if (type === 4) { ctx.fillStyle = third; ctx.beginPath(); ctx.arc(0, 0, hc * 0.9, 0, Math.PI); ctx.closePath(); ctx.fill(); }
          ctx.restore();
        }
      }
    },
  });

  // 26 Truchet Flow: Smith tiles flipping in waves, so the connected paths keep re-routing.
  tile('bg.truchet-flow', {
    name: 'Truchet Flow',
    draw(ctx, w, h, t, P) {
      const rows = 5, c = h / rows, hc = c / 2;
      const cols = Math.ceil(w / c / 2) * 2 + 1;
      const x0 = w / 2 - (cols * c) / 2;
      const pairs = [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3], [0, 1, 2, 3]];
      const dirs = [0, 2.2, 3.6, 5.1];
      // Pass 1: every tile's turn state.
      const G = [];
      for (let j = -1; j <= rows; j++) {
        const row = [];
        for (let i = 0; i < cols; i++) {
          const gi = i - (cols - 1) / 2;
          const sd = cell(gi, j, 2);
          const cx = x0 + i * c + hc, cy = j * c + hc;
          const flips = pairs[Math.floor(rand(sd, 1) * pairs.length)];
          let q = Math.floor(rand(sd, 2) * 2);
          for (const wv of flips) {
            const a = dirs[wv];
            const reach = (Math.abs(Math.cos(a)) * (w + c) + Math.abs(Math.sin(a)) * (h + c)) / 2;
            const d = ((cx - w / 2) * Math.cos(a) + (cy - h / 2) * Math.sin(a)) / reach;
            // Each wave crosses the whole frame in 2.2 s, so one hands over to the next without a pause.
            const start = wv * 3 + 0.05 + clamp(d * 0.5 + 0.5) * 2.2;
            q += turn((t - start) / 0.65, 1.1);
          }
          row.push({ cx, cy, q, moving: Math.abs(q - Math.round(q)) > 1e-4 });
        }
        G.push(row);
      }
      // Pass 2: settled tiles join butt to butt (no cap nubs at the joints); turning tiles get round
      // caps, and a settled tile's end gets a round dot wherever its neighbour is mid-turn.
      const lw = c * 0.2, still = new Path2D(), turning = new Path2D(), dots = new Path2D();
      const ext = 0.012; // a hair of overlap so joints never show a seam
      const isMoving = (j, i) => (G[j] && G[j][i] ? G[j][i].moving : false);
      G.forEach((row, j) => row.forEach((T, i) => {
        const th = T.q * Q, co = Math.cos(th), si = Math.sin(th);
        const pth = T.moving ? turning : still, e = T.moving ? 0 : ext;
        for (const s of [1, -1]) {
          const ax = T.cx + s * (-hc * co + hc * si), ay = T.cy + s * (-hc * si - hc * co);
          const a0 = th + (s > 0 ? 0 : Math.PI) - e;
          pth.moveTo(ax + hc * Math.cos(a0), ay + hc * Math.sin(a0));
          pth.arc(ax, ay, hc, a0, a0 + Q + 2 * e);
        }
        if (!T.moving) {
          for (const [dj, di, mx, my] of [[-1, 0, 0, -hc], [1, 0, 0, hc], [0, -1, -hc, 0], [0, 1, hc, 0]]) {
            if (isMoving(j + dj, i + di)) { dots.moveTo(T.cx + mx + lw / 2, T.cy + my); dots.arc(T.cx + mx, T.cy + my, lw / 2, 0, TAU); }
          }
        }
      }));
      ctx.strokeStyle = P.fg; ctx.lineWidth = lw;
      ctx.lineCap = 'butt'; ctx.stroke(still);
      ctx.lineCap = 'round'; ctx.stroke(turning);
      ctx.fillStyle = P.fg; ctx.fill(dots);
    },
  });

  // 27 Circle Pop: a grid of discs popping out and springing back, a wave travelling across.
  tile('bg.circle-pop', {
    name: 'Circle Pop',
    draw(ctx, w, h, t, P) {
      const rows = 3, c = h / rows, R = c * 0.4;
      const cols = Math.ceil(w / c / 2) * 2 + 1;
      const x0 = w / 2 - (cols * c) / 2;
      const per = 3;
      const paths = { a: new Path2D(), b: new Path2D() };
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          const gi = i - (cols - 1) / 2, sd = cell(gi, j, 3);
          const cx = x0 + i * c + c / 2, cy = j * c + c / 2;
          const del = 0.2 + clamp(cx / w, -0.1, 1.1) * 1.45 + j * 0.12;
          const k = Math.floor((t - del) / per), tau = t - del - k * per;
          const col = (n) => (rand(sd, 10 + mod(n, 4)) < 0.2 ? 'b' : 'a');
          let s, key;
          if (tau < 0.26) { s = 1 - ease.inBack(tau / 0.26, 2.2); key = col(k - 1); }
          else if (tau < 0.36) { s = 0; key = col(k); }
          else { s = ease.spring((tau - 0.36) / 1.15, 0.3, 2.4); key = col(k); }
          if (s <= 0.001) continue;
          const pth = paths[key];
          pth.moveTo(cx + R * s, cy); pth.arc(cx, cy, R * s, 0, TAU);
        }
      }
      ctx.fillStyle = P.fg; ctx.fill(paths.a);
      ctx.fillStyle = P.fg2; ctx.fill(paths.b);
    },
  });

  // Shared primitive drawer: 0 circle, 1 square, 2 triangle, 3 half disc, 4 ring.
  function prim(ctx, type, x, y, r, rot) {
    ctx.beginPath();
    if (type === 0) { ctx.arc(x, y, r, 0, TAU); }
    else if (type === 1) { M.poly(ctx, x, y, r * 1.22, 4, rot + Math.PI / 4); }
    else if (type === 2) { M.poly(ctx, x, y, r * 1.3, 3, rot); }
    else if (type === 3) { ctx.arc(x, y, r * 1.1, rot, rot + Math.PI); ctx.closePath(); }
    else { ctx.arc(x, y, r, 0, TAU); ctx.moveTo(x + r * 0.55, y); ctx.arc(x, y, r * 0.55, 0, TAU, true); }
  }

  // 28 Floating Shapes: a composed field of flat primitives at three depths. A slow orbiting
  // camera gives true parallax (near shapes travel further); each shape bobs and turns on its own.
  tile('bg.floating-shapes', {
    name: 'Floating Shapes',
    draw(ctx, w, h, t, P) {
      const u = h / 100;
      const far = mixColor(P.bg, P.fg, 0.2);
      // [x (frac of w), y (frac of h), radius (u), type, depth]  type: 0 circle 1 square 2 triangle 3 half 4 ring
      const S = [
        [0.05, 0.62, 5.5, 2, 0.3], [0.38, 0.13, 5, 0, 0.3], [0.60, 0.88, 6, 1, 0.3], [0.93, 0.40, 5, 2, 0.3],
        [0.30, 0.26, 9, 4, 0.6], [0.64, 0.42, 8.5, 1, 0.6], [0.22, 0.84, 9.5, 2, 0.6], [0.86, 0.82, 10, 0, 0.6],
        [0.12, 0.32, 18, 0, 1], [0.47, 0.70, 17, 2, 1], [0.79, 0.27, 15.5, 1, 1], [1.0, 0.98, 15, 3, 1],
      ];
      const ca = TAU * (t / 12);
      const camX = Math.cos(ca) * 11 * u, camY = Math.sin(ca) * 6 * u;
      S.forEach(([fx, fy, rr, type, d], i) => {
        const bob = TAU * (t / 6) + rand(i, 1) * TAU;
        const x = fx * w - camX * d * 1.6 + Math.sin(bob) * 1.2 * u * d;
        const y = fy * h - camY * d * 1.6 + Math.cos(bob) * 2 * u * d;
        const r = rr * u;
        const dir = rand(i, 2) < 0.5 ? 1 : -1;
        const sym = [TAU, Q, TAU / 3, TAU, TAU][type];
        const rot = rand(i, 3) * TAU + (type === 3 ? 0.5 * Math.sin(TAU * (t / 12) + rand(i, 4) * TAU) : dir * sym * (t / 12));
        prim(ctx, type, x, y, r, rot);
        ctx.fillStyle = d < 0.5 ? far : d < 1 ? P.mid : i === 10 ? P.fg2 : P.fg;
        ctx.fill('evenodd');
      });
    },
  });

  // 29 Kaleidoscope: a true three-mirror kaleidoscope. One disc wanders through the
  // mirror triangle; the reflections tile the frame with six-fold rosettes.
  tile('bg.kaleidoscope', {
    name: 'Kaleidoscope',
    draw(ctx, w, h, t, P) {
      const u = h / 100, s = 34 * u, h3 = (s * Math.sqrt(3)) / 2;
      const F = [[0, 0], [s, 0], [s / 2, h3]];
      const G = [s / 2, h3 / 3];
      // Path of the disc through the triangle: V0 > centre > V1 > centre > V2 > centre (2 s per leg).
      const route = [F[0], G, F[1], G, F[2], G];
      const at = (tt) => {
        const leg = Math.floor(mod(tt, 12) / 2), k = ease.inOutCubic(win(mod(tt, 2) / 2, 0.05, 0.75));
        const A = route[leg], B = route[(leg + 1) % 6];
        return [lerp(A[0], B[0], k), lerp(A[1], B[1], k)];
      };
      const pa = at(t), pb = at(t + 7); // the small disc runs half a leg out of step, so one disc is always travelling
      const content = () => {
        ctx.fillStyle = P.fg; M.circle(ctx, pa[0], pa[1], s * 0.34); ctx.fill();
        ctx.fillStyle = P.fg2; M.circle(ctx, pb[0], pb[1], s * 0.12); ctx.fill();
      };
      // Triangular lattice; vertex label = (i - j) mod 3 decides how the fundamental triangle maps in.
      const cx = w / 2, cy = h / 2;
      const V = (i, j) => [cx + i * s + j * s / 2, cy + j * h3];
      const jr = Math.ceil(h / 2 / h3) + 1, ir = Math.ceil(w / 2 / s) + jr + 2;
      const ins = 1 + (0.6 * Math.sqrt(12)) / s; // ~0.6 px of overlap between neighbouring mirrors
      for (let j = -jr; j <= jr; j++) {
        for (let i = -ir; i <= ir; i++) {
          for (const tri of [[[i, j], [i + 1, j], [i, j + 1]], [[i + 1, j], [i + 1, j + 1], [i, j + 1]]]) {
            const pts = tri.map(([a, b]) => V(a, b));
            const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
            if (Math.max(...xs) < 0 || Math.min(...xs) > w || Math.max(...ys) < 0 || Math.min(...ys) > h) continue;
            const by = [];
            tri.forEach(([a, b], n) => { by[mod(a - b, 3)] = pts[n]; });
            const [P0, P1, P2] = by;
            const ax = (P1[0] - P0[0]) / s, ay = (P1[1] - P0[1]) / s;
            const bx = (P2[0] - P0[0] - (s / 2) * ax) / h3, byy = (P2[1] - P0[1] - (s / 2) * ay) / h3;
            ctx.save();
            ctx.transform(ax, ay, bx, byy, P0[0], P0[1]);
            ctx.beginPath();
            F.forEach(([x, y], n) => { const X = G[0] + (x - G[0]) * ins, Y = G[1] + (y - G[1]) * ins; n ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); });
            ctx.closePath(); ctx.clip();
            content();
            ctx.restore();
          }
        }
      }
    },
  });

  // 30 Shape Tunnel: nested hexagons in thick strokes, each one smaller and turned a little further,
  // sliding inward forever.
  tile('bg.shape-tunnel', {
    name: 'Shape Tunnel',
    draw(ctx, w, h, t, P) {
      const u = h / 100, cx = w / 2, cy = h / 2;
      const per = 2, p = phase(t, per), cyc = Math.round((t - p * per) / per);
      const ratio = 0.8, twist = Math.PI / 3 / 6; // six rings = one full hexagon step, so the twist reads as a spiral
      const base = Math.hypot(w, h) * 0.56;
      ctx.lineJoin = 'round';
      for (let k = -1; k < 30; k++) {
        const e = k + p;
        const r = base * Math.pow(ratio, e);
        if (r < 1.2 * u) break;
        const n = k - cyc;
        const a = 1 - smoothstep(7 * u, 1.2 * u, r);
        ctx.strokeStyle = rgba(mod(n, 6) === 0 ? P.fg2 : P.fg, a); // 6 ring-steps per loop
        ctx.lineWidth = r * 0.05;
        M.poly(ctx, cx, cy, r, 6, e * twist);
        ctx.stroke();
      }
    },
  });

  // 31 Confetti Fall: flat paper pieces tumbling down, each flipping in 3D (scaleX by cosine).
  tile('bg.confetti-fall', {
    name: 'Confetti Fall',
    draw(ctx, w, h, t, P) {
      const u = h / 100, asp = w / h;
      const n = Math.round(asp * 19);
      const backB = mixColor(P.fg2, P.fg, 0.2);
      const flips = [1.5, 2, 3];
      for (let pass = 0; pass < 2; pass++) for (let i = 0; i < n; i++) {
        const near = rand(i, 1) < 0.45;
        if (near !== (pass === 1)) continue; // far layer first
        const sz = (near ? lerp(8.5, 10.5, rand(i, 2)) : lerp(5.2, 6.4, rand(i, 2))) * u;
        const wraps = near ? 2 : 1;
        const span = h + 26 * u;
        const y = mod(rand(i, 3) * span + (wraps * span * t) / 12, span) - 13 * u;
        const sway = Math.sin(TAU * (t / 3) * (rand(i, 4) < 0.5 ? 1 : 2) + rand(i, 5) * TAU) * 2.5 * u;
        const x = ((i + 0.15 + rand(i, 6) * 0.7) / n) * (w + 8 * u) - 4 * u + sway;
        const fp = flips[Math.floor(rand(i, 7) * 3)];
        const fl = Math.cos(TAU * (t / fp) + rand(i, 8) * TAU);
        const tilt = rand(i, 9) * TAU + Math.sin(TAU * (t / 6) + rand(i, 10) * TAU) * 0.6;
        const lilac = rand(i, 11) < 0.5;
        ctx.fillStyle = lilac ? (fl >= 0 ? P.fg2 : backB) : P.fg;
        ctx.save(); ctx.translate(x, y); ctx.rotate(tilt); ctx.scale(Math.max(0.1, Math.abs(fl)), 1);
        ctx.beginPath();
        if (rand(i, 12) < 0.72) ctx.rect(-sz * 0.4, -sz * 0.8, sz * 0.8, sz * 1.6);
        else ctx.arc(0, 0, sz * 0.62, 0, TAU);
        ctx.fill();
        ctx.restore();
      }
    },
  });

  // 32 Pinwheels: a field of four-blade pinwheels; gusts sweep through and turn each one by quarters.
  tile('bg.pinwheels', {
    name: 'Pinwheels',
    draw(ctx, w, h, t, P) {
      const rows = 3, c = h / rows, r = c * 0.4;
      const cols = Math.ceil(w / c / 2) * 2 + 1;
      const x0 = w / 2 - (cols * c) / 2;
      const per = 3;
      const blades = new Path2D(), pins = new Path2D();
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          const gi = i - (cols - 1) / 2, sd = cell(gi, j, 4);
          const cx = x0 + i * c + c / 2, cy = j * c + c / 2;
          const dir = mod(i + j, 2) ? 1 : -1;
          let q = 0;
          for (let g = 0; g < 4; g++) {
            const del = g * per + 0.1 + clamp(cx / w, -0.05, 1.05) * 1.45 + j * 0.1 + rand(sd, g) * 0.1;
            const steps = rand(sd, 20 + g) < 0.4 ? 2 : 1;
            q += steps * turn((t - del) / (0.55 + steps * 0.25), 1.6); // last gust ends before 12 s
          }
          const a0 = dir * q * Q;
          for (let b = 0; b < 4; b++) {
            const a = a0 + b * Q;
            const co = Math.cos(a), si = Math.sin(a);
            // Blade: centre, tip on the axis, and the corner beside it.
            const p1 = [cx + r * si, cy - r * co];
            const p2 = [cx + r * si + r * co, cy - r * co + r * si];
            blades.moveTo(cx, cy); blades.lineTo(p1[0], p1[1]); blades.lineTo(p2[0], p2[1]); blades.closePath();
          }
          pins.moveTo(cx + r * 0.1, cy); pins.arc(cx, cy, r * 0.1, 0, TAU);
        }
      }
      ctx.fillStyle = P.fg; ctx.fill(blades);
      ctx.fillStyle = P.fg2; ctx.fill(pins);
    },
  });
})();
