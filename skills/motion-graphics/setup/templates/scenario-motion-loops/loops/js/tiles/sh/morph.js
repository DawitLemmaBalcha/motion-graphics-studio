// Page "Morph" (sh 01-08): one shape changing form. Lime accent.
// Every tile is a pure function of t; cycles are 2, 3, 4 or 6 s so the 12 s loop closes.
(function () {
  const { TAU, clamp, lerp, phase, win, ease, rgba, mixColor, smoothstep, mod, rand } = M;
  const PI = Math.PI;
  const spring = ease.spring;

  // Polar boundary of a regular n-gon (circumradius 1) whose first vertex sits at angle v0.
  const ngon = (a, n, v0) => { const s = TAU / n; return Math.cos(PI / n) / Math.cos(mod(a - v0, s) - s / 2); };

  // Trace a closed outline r(a) around (cx, cy). rot turns the shape; sx, sy squash it in screen axes.
  const radial = (ctx, cx, cy, rf, rot = 0, sx = 1, sy = 1, N = 240) => {
    ctx.beginPath();
    for (let i = 0; i < N; i++) {
      const a = (i / N) * TAU, r = rf(a);
      const x = cx + Math.cos(a + rot) * r * sx, y = cy + Math.sin(a + rot) * r * sy;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.closePath();
  };

  // Damped oscillation starting at 0: the after-shake of an impact.
  const shake = (tau, freq, decay) => (tau <= 0 ? 0 : Math.exp(-tau / decay) * Math.sin(TAU * freq * tau));
  // Same, but guaranteed to be exactly 0 from `end` on, so a cycle closes cleanly.
  const settle = (tau, freq, decay, end) => shake(tau, freq, decay) * (1 - smoothstep(end * 0.7, end, tau));

  // 01 Circle to Square: wind-up, a turning morph that overshoots into a pinched square, and back.
  tile('sh.circle-to-square', {
    name: 'Circle to Square',
    draw(ctx, w, h, t, P) {
      const u = h / 100, cx = w / 2, cy = h / 2;
      const R = 19 * u, Rs = R * Math.sqrt(PI / 2); // equal area, so the mass never jumps
      const s = phase(t, 4) * 4;
      let m = 0, rot = 0, sx = 1, sy = 1;
      if (s < 2.4) {
        // wind-up squash, then the turning morph springs past the square (sides pinch in) and settles
        const a = ease.inOutSine(win(s, 0.15, 0.8)), k = win(s, 0.8, 2.0);
        m = spring(k, 0.5, 1.2);
        rot = lerp(-0.22 * a, PI / 2, spring(k, 0.55, 1.1));
        const sq = 0.11 * a * (1 - spring(k, 0.35, 2.2));
        sx = 1 + sq * 0.7; sy = 1 - sq;
      } else {
        // pinch a little further, then round off while turning, and land with a jelly wobble
        const a = ease.inOutSine(win(s, 2.4, 2.75)), k = ease.inOutCubic(win(s, 2.75, 3.3));
        m = (1 + 0.08 * a) * (1 - k);
        rot = lerp(PI / 2 - 0.18 * a, PI, k);
        const j = 0.085 * settle(s - 3.18, 2.6, 0.2, 0.8);
        sx = 1 + j; sy = 1 - j;
      }
      ctx.fillStyle = P.fg;
      radial(ctx, cx, cy, (q) => lerp(R, Rs * ngon(q, 4, PI / 4), m), rot, sx, sy);
      ctx.fill();
    },
  });

  // Regular n-gon (circumradius Rn, first vertex up) with every corner rounded by rho.
  // At rho = Rn cos(pi/n), the inradius, the arcs meet at the edge midpoints and it is exactly a circle.
  const roundGon = (ctx, Rn, n, rho, rot) => {
    const V = [];
    for (let i = 0; i < n; i++) { const a = rot + (i / n) * TAU - PI / 2; V.push([Math.cos(a) * Rn, Math.sin(a) * Rn]); }
    const r = Math.min(rho, Rn * Math.cos(PI / n) * 0.9995);
    ctx.beginPath();
    ctx.moveTo((V[n - 1][0] + V[0][0]) / 2, (V[n - 1][1] + V[0][1]) / 2);
    for (let i = 0; i < n; i++) { const A = V[i], B = V[(i + 1) % n]; ctx.arcTo(A[0], A[1], (A[0] + B[0]) / 2, (A[1] + B[1]) / 2, r); }
    ctx.closePath();
  };

  // 02 Shape Cycle: circle, triangle, square. Each change melts the corners round and re-sharpens them
  // while the shape winds back, turns and overshoots.
  tile('sh.shape-cycle', {
    name: 'Shape Cycle',
    draw(ctx, w, h, t, P) {
      const u = h / 100, cx = w / 2, cy = h / 2;
      const R = 18.5 * u;
      // [sides, circumradius, own rotation offset, optical drop]; sides 0 = circle
      const SH = [[0, R, 0, 0], [3, 1.45 * R, 0, 0.11 * 1.45 * R], [4, 1.25 * R, PI / 4, 0]];
      const turn = [(2 * PI) / 3, (5 * PI) / 6, PI / 2]; // 120 + 150 + 90 = one full turn per cycle
      const s = phase(t, 6) * 3, i = Math.floor(s), k = s - i, j = (i + 1) % 3;
      const kk = win(k, 0, 0.62);
      const m = ease.inOutCubic(win(kk, 0.1, 0.8));
      const turnK = ease.inOutBack(kk, 1.7);
      let base = 0; for (let n = 0; n < i; n++) base += turn[n];
      const rot = base + turn[i] * turnK;
      // which shape is on screen and how round it is (f = 1 means fully a circle)
      let sh, f;
      if (SH[i][0] === 0) { sh = SH[j]; f = 1 - m; }
      else if (SH[j][0] === 0) { sh = SH[i]; f = m; }
      else if (m < 0.5) { sh = SH[i]; f = m * 2; } else { sh = SH[j]; f = 2 - m * 2; }
      const [n, Rn, off, drop] = sh;
      const sc = 1 - 0.08 * Math.sin(PI * kk) + 0.05 * settle(k * 2 - 0.95, 2.4, 0.16, 1.0);
      ctx.save();
      ctx.translate(cx, cy + drop * (1 - f)); ctx.scale(sc, sc);
      ctx.fillStyle = P.fg;
      const fe = ease.inOutSine(f), Rd = Rn * lerp(1, R / (Rn * Math.cos(PI / n)), fe);
      roundGon(ctx, Rd, n, fe * Rd * Math.cos(PI / n), rot + off);
      ctx.fill();
      ctx.restore();
    },
  });

  // 03 Blob Morph: an organic body easing between four poses, with slow currents running round its edge.
  tile('sh.blob-morph', {
    name: 'Blob Morph',
    draw(ctx, w, h, t, P) {
      const u = h / 100, cx = w / 2, cy = h / 2, R = 21 * u;
      // Four designed poses: bean, soft triangle, peanut, pebble. [harmonic, amplitude, angle]
      const POSES = [
        [[2, 0.13, 0.3], [3, 0.07, 1.2], [4, 0.02, 0]],
        [[3, 0.11, -0.4], [2, 0.04, 1.0], [5, 0.015, 0.2]],
        [[2, 0.16, 1.9], [4, -0.065, 1.9], [3, 0.03, 0.5]],
        [[2, 0.08, 2.6], [3, 0.05, 2.2], [4, 0.035, 0.7]],
      ];
      const coefs = (pose) => {
        const c = { 2: [0, 0], 3: [0, 0], 4: [0, 0], 5: [0, 0] };
        for (const [n, a, ph] of POSES[mod(pose, 4)]) { c[n][0] += a * Math.cos(n * ph); c[n][1] += a * Math.sin(n * ph); }
        return c;
      };
      const s = t / 3, i = Math.floor(s), k = s - i;
      const m = spring(win(k, 0.0, 0.95), 0.62, 1.05);
      const A = coefs(i), Bc = coefs(i + 1), C = [];
      for (let n = 2; n <= 5; n++) C.push([n, lerp(A[n][0], Bc[n][0], m), lerp(A[n][1], Bc[n][1], m)]);
      const T1 = TAU * (t / 3), T2 = TAU * (t / 2);
      const rf = (q) => {
        let r = 1;
        for (const [n, a, b] of C) r += a * Math.cos(n * q) + b * Math.sin(n * q);
        r += 0.02 * Math.sin(3 * q - T1) + 0.008 * Math.sin(5 * q + T2 + 1.3);
        return R * r;
      };
      ctx.fillStyle = P.fg;
      radial(ctx, cx, cy, rf, TAU * (t / 12), 1, 1, 200);
      ctx.fill();
    },
  });

  // Metaball neck between two circles (after the Paper.js metaball construction).
  // v fades to 0 as the circles separate, so the neck thins and lets go instead of popping.
  function neck(ctx, c1, r1, c2, r2) {
    const dx = c2[0] - c1[0], dy = c2[1] - c1[1], d = Math.hypot(dx, dy);
    const maxD = (r1 + r2) * 1.55;
    if (r1 <= 0 || r2 <= 0 || d > maxD || d <= Math.abs(r1 - r2) + 1e-3) return false;
    const v = 0.5 * (1 - smoothstep(r1 + r2, maxD, d));
    if (v <= 0.001) return false;
    let u1 = 0, u2 = 0;
    if (d < r1 + r2) {
      u1 = Math.acos(clamp((r1 * r1 + d * d - r2 * r2) / (2 * r1 * d), -1, 1));
      u2 = Math.acos(clamp((r2 * r2 + d * d - r1 * r1) / (2 * r2 * d), -1, 1));
    }
    const ab = Math.atan2(dy, dx), spread = Math.acos(clamp((r1 - r2) / d, -1, 1));
    const a1 = ab + u1 + (spread - u1) * v, a2 = ab - u1 - (spread - u1) * v;
    const a3 = ab + PI - u2 - (PI - u2 - spread) * v, a4 = ab - PI + u2 + (PI - u2 - spread) * v;
    const at = (c, a, r) => [c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r];
    const p1 = at(c1, a1, r1), p2 = at(c1, a2, r1), p3 = at(c2, a3, r2), p4 = at(c2, a4, r2);
    const tr = r1 + r2;
    const hs = Math.min(v * 2.4, Math.hypot(p1[0] - p3[0], p1[1] - p3[1]) / tr) * Math.min(1, (d * 2) / tr);
    const h1 = at(p1, a1 - PI / 2, r1 * hs), h2 = at(p2, a2 + PI / 2, r1 * hs);
    const h3 = at(p3, a3 + PI / 2, r2 * hs), h4 = at(p4, a4 - PI / 2, r2 * hs);
    ctx.beginPath();
    ctx.moveTo(p1[0], p1[1]);
    ctx.bezierCurveTo(h1[0], h1[1], h3[0], h3[1], p3[0], p3[1]);
    ctx.lineTo(p4[0], p4[1]);
    ctx.bezierCurveTo(h4[0], h4[1], h2[0], h2[1], p2[0], p2[1]);
    ctx.closePath();
    return true;
  }

  // 04 Split & Merge: one cell divides into two, then four, turns, and is pulled back into one.
  tile('sh.split-merge', {
    name: 'Split & Merge',
    draw(ctx, w, h, t, P) {
      const u = h / 100, cx = w / 2, cy = h / 2;
      const R = 17 * u, r2 = R / Math.SQRT2, r4 = R / 2;
      const D2 = 1.28 * R, D4 = 0.92 * R;
      const s = phase(t, 6) * 6;
      // Gooey separation: a slow pull that stretches the neck, then a snap apart with overshoot.
      const goo = (k) => (k < 0.55 ? 0.7 * ease.inOutSine(k / 0.55) : lerp(0.7, 1, spring((k - 0.55) / 0.45, 0.4, 1.3)));
      let balls = [], gsx = 1, gsy = 1, grot = 0;
      if (s < 2.2) { // one -> two (sideways)
        const a = Math.sin(PI * win(s, 0.2, 0.75)) * (s < 0.75 ? 1 : 0);
        const sep = goo(win(s, 0.55, 1.95));
        const rr = lerp(R, r2, clamp(sep * 1.4));
        gsx = 1 - 0.07 * a; gsy = 1 + 0.07 * a;
        balls = [[-D2 * sep, 0, rr], [D2 * sep, 0, rr]];
      } else if (s < 4.3) { // two -> four (each splits vertically)
        const a = Math.sin(PI * win(s, 2.15, 2.6)) * (s < 2.6 ? 1 : 0);
        const k = win(s, 2.45, 3.75), sep = goo(k);
        const x = lerp(D2, D4, ease.inOutCubic(k)), rr = lerp(r2, r4, clamp(sep * 1.4));
        gsx = 1 + 0.06 * a; gsy = 1 - 0.06 * a;
        grot = (PI / 2) * ease.inOutBack(win(s, 3.7, 4.35), 1.2);
        const y = D4 * sep;
        balls = [[-x, -y, rr], [-x, y, rr], [x, -y, rr], [x, y, rr]];
      } else { // four -> one: drawn outward first, then snapped together
        grot = PI / 2;
        const k = win(s, 4.4, 5.15);
        const pull = ease.inBack(k, 2.2);
        const d = D4 * (1 - pull), rr = lerp(r4, R, smoothstep(0.55, 1, k));
        const pop = 1 + 0.16 * settle(s - 5.15, 2.4, 0.14, 0.8);
        gsx = pop; gsy = 2 - pop;
        balls = [[-d, -d, rr], [-d, d, rr], [d, -d, rr], [d, d, rr]];
      }
      ctx.save();
      ctx.translate(cx, cy); ctx.rotate(grot); ctx.scale(gsx, gsy);
      ctx.fillStyle = P.fg;
      for (const [x, y, r] of balls) { M.circle(ctx, x, y, r); ctx.fill(); }
      for (let i = 0; i < balls.length; i++) for (let j = i + 1; j < balls.length; j++) {
        const A = balls[i], B = balls[j];
        if (neck(ctx, [A[0], A[1]], A[2], [B[0], B[1]], B[2])) ctx.fill();
      }
      ctx.restore();
    },
  });

  // 05 Star Morph: a pentagon pushes out its points one after another, spins, and pulls them back in.
  tile('sh.star-morph', {
    name: 'Star Morph',
    draw(ctx, w, h, t, P) {
      const u = h / 100, cx = w / 2, cy = h / 2 + 1.6 * u, n = 5;
      const Rp = 19.5 * u, Rs = 25.5 * u, inS = 0.43;
      const s = phase(t, 4) * 4, cyc = Math.floor(t / 4);
      const g = [];
      for (let i = 0; i < n; i++) {
        const grow = spring(win(s, 0.45 + i * 0.08, 1.45 + i * 0.08), 0.38, 1.6);
        const relax = ease.inOutCubic(win(s, 2.5 + i * 0.03, 3.2 + i * 0.03));
        g.push(s < 2.5 ? grow : 1 - relax);
      }
      // a slow drift keeps it alive at rest; the eased spin rides on top (72 degrees per cycle in total)
      const rot = (TAU / n) * (cyc + 0.75 * ease.inOutCubic(win(s, 0.4, 2.0)) + 0.25 * (s / 4));
      const pop = 1 + 0.07 * settle(s - 3.15, 2.6, 0.16, 0.8);
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const ao = rot + (i / n) * TAU - PI / 2, ai = ao + PI / n;
        const ro = lerp(Rp, Rs, g[i]) * pop;
        const ri = lerp(Rp * Math.cos(PI / n), Rs * inS, (g[i] + g[(i + 1) % n]) / 2) * pop;
        const xo = cx + Math.cos(ao) * ro, yo = cy + Math.sin(ao) * ro;
        i ? ctx.lineTo(xo, yo) : ctx.moveTo(xo, yo);
        ctx.lineTo(cx + Math.cos(ai) * ri, cy + Math.sin(ai) * ri);
      }
      ctx.closePath();
      ctx.fillStyle = P.fg; ctx.strokeStyle = P.fg;
      ctx.lineJoin = 'round'; ctx.lineWidth = 3.2 * u;
      ctx.fill(); ctx.stroke();
    },
  });

  // 06 Paper Fold: a sheet seen at an angle folds right over left, then top over bottom, shows its other side, then opens.
  tile('sh.paper-fold', {
    name: 'Paper Fold',
    draw(ctx, w, h, t, P) {
      const u = h / 100, cx = w / 2, cy = h / 2;
      const s = phase(t, 6) * 6;
      // Fold: smooth lift, slap down, small rebound. Open: smooth, a touch past flat, settle back.
      const fold = (k) => (k < 0.8 ? ease.inOutCubic(k / 0.8) : 1 - 0.07 * Math.sin((PI * (k - 0.8)) / 0.2));
      const open = (k) => (k < 0.8 ? 1.05 * ease.inOutCubic(k / 0.8) : 1.05 - 0.05 * ease.inOutSine((k - 0.8) / 0.2));
      const th1 = PI * (s < 3 ? fold(win(s, 0.3, 1.25)) : 1 - open(win(s, 4.05, 5.0)));
      const th2 = PI * (s < 3 ? fold(win(s, 1.45, 2.4)) : 1 - open(win(s, 3.05, 3.95)));
      const c1 = (1 - Math.cos(th1)) / 2, c2 = (1 - Math.cos(th2)) / 2;
      const ox = 0.5 * c1, oy = -0.5 * c2; // keep the visible paper centred
      const S = 20.5 * u * (1 + 0.34 * c1 + 0.34 * c2), Dc = 4.2;
      // Camera: looking down onto the sheet, with a slow sway so it is never frozen.
      const ax = 0.46, ay = 0.26 + 0.1 * Math.sin(TAU * (t / 6)), az = -0.06;
      const eps = 0.004, z1 = -eps / 2, z2 = -1.5 * eps;
      const rot = (a, z, th, zc) => { const Z = z - zc, c = Math.cos(th), sn = Math.sin(th); return [a * c + Z * sn, -a * sn + Z * c + zc]; };
      const f1 = ([x, y, z]) => { const [a, b] = rot(x, z, th1, z1); return [a, y, b]; };
      const f2 = ([x, y, z]) => { const [a, b] = rot(y, z, -th2, z2); return [x, a, b]; }; // top half folds down, toward the camera
      const world = ([x, y, z]) => {
        x += ox; y += oy;
        let Y = y * Math.cos(ax) + z * Math.sin(ax), Z = -y * Math.sin(ax) + z * Math.cos(ax);
        let X = x * Math.cos(ay) - Z * Math.sin(ay); Z = x * Math.sin(ay) + Z * Math.cos(ay);
        const X2 = X * Math.cos(az) - Y * Math.sin(az); Y = X * Math.sin(az) + Y * Math.cos(az);
        return [X2, Y, Z];
      };
      const quad = (x0, y0, x1, y1) => [[x0, y0, 0], [x1, y0, 0], [x1, y1, 0], [x0, y1, 0]];
      const pieces = [
        { q: quad(-1, -1, 0, 0), f: [f2] },
        { q: quad(0, -1, 1, 0), f: [f1, f2] },
        { q: quad(0, 0, 1, 1), f: [f1] },
        { q: quad(-1, 0, 0, 1), f: [] },
      ];
      const L = [-0.35, -0.75, -0.56];
      const items = pieces.map((pc) => {
        const loc = pc.q.map((p) => pc.f.reduce((acc, fn) => fn(acc), p));
        const wp = loc.map(world);
        const q2 = wp.map(([x, y, z]) => { const k = Dc / (Dc + z); return [cx + x * S * k, cy + y * S * k]; });
        let area = 0;
        for (let i = 0; i < 4; i++) { const a = q2[i], b = q2[(i + 1) % 4]; area += a[0] * b[1] - b[0] * a[1]; }
        const e1 = wp[1].map((v, i) => v - wp[0][i]), e2 = wp[3].map((v, i) => v - wp[0][i]);
        let n = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
        const nl = Math.hypot(n[0], n[1], n[2]) || 1; n = n.map((v) => v / nl);
        const c = wp.reduce((acc, p) => [acc[0] + p[0] / 4, acc[1] + p[1] / 4, acc[2] + p[2] / 4], [0, 0, 0]);
        const view = [-c[0], -c[1], -Dc - c[2]];
        if (n[0] * view[0] + n[1] * view[1] + n[2] * view[2] < 0) n = n.map((v) => -v);
        const lit = clamp(n[0] * L[0] + n[1] * L[1] + n[2] * L[2]);
        const zLoc = loc.reduce((acc, p) => acc + p[2], 0) / 4;
        return { q2, front: area > 0, lit, zLoc };
      });
      items.sort((A, B) => B.zLoc - A.zLoc);
      ctx.lineJoin = 'round'; ctx.lineWidth = 0.5;
      for (const it of items) {
        const col = it.front ? mixColor(P.fg, P.fg2, 0.12 * it.lit * it.lit) : mixColor(P.fg2, P.fg, 0.32 * (1 - it.lit));
        ctx.beginPath(); it.q2.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath();
        ctx.fillStyle = col; ctx.strokeStyle = col; ctx.fill(); ctx.stroke();
      }
    },
  });

  // 07 Flip Tiles: a 3x3 grid flips tile by tile through six patterns, each wave taking a new route.
  tile('sh.flip-tiles', {
    name: 'Flip Tiles',
    draw(ctx, w, h, t, P) {
      const u = h / 100, cx = w / 2, cy = h / 2;
      const T = 12.4 * u, G = 2.6 * u, step = T + G, cr = 1.7 * u;
      const PATS = [
        [0, 0, 0, 0, 0, 0, 0, 0, 0], // all
        [0, 0, 0, 0, 1, 0, 0, 0, 0], // centre
        [1, 0, 1, 0, 1, 0, 1, 0, 1], // X
        [0, 1, 0, 1, 0, 1, 0, 1, 0], // inverse
        [1, 0, 0, 0, 1, 0, 0, 0, 1], // diagonal
        [0, 0, 1, 0, 1, 0, 1, 0, 0], // other diagonal
      ];
      const NP = PATS.length;
      const slot = [1.6, 2.0, 2.3, 2.0, 2.0, 2.1]; // seconds per pattern (sums to 12): busier waves get more room
      const start = slot.map((_, j) => slot.slice(0, j).reduce((a, b) => a + b, 0));
      const cw = { 0: 0, 2: 1, 8: 2, 6: 3 }; // corners clockwise
      const order = [() => 0, (r, c) => cw[r * 3 + c] || 0, (r, c) => c + r * 0.45, (r, c) => r + c * 0.45, (r, c) => c, (r, c) => r];
      const axis = ['y', 'x', 'y', 'x', 'y', 'x'];
      const flipEase = (k) => (k < 0.2 ? -0.05 * Math.sin((PI * k) / 0.2) : spring((k - 0.2) / 0.8, 0.5, 1.25));
      const outline = [];
      const hs = T / 2, cn = [[hs - cr, -hs + cr], [hs - cr, hs - cr], [-hs + cr, hs - cr], [-hs + cr, -hs + cr]];
      cn.forEach(([ox, oy], q) => { for (let i = 0; i <= 5; i++) { const a = -PI / 2 + (q + i / 5) * (PI / 2); outline.push([ox + Math.cos(a) * cr, oy + Math.sin(a) * cr]); } });
      const F = 3.2 * T;
      for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
        const idx = r * 3 + c, tx = cx + (c - 1) * step, ty = cy + (r - 1) * step;
        let col = PATS[0][idx], ang = 0, ax = 'y', live = 0;
        for (let j = 0; j < NP; j++) {
          if (PATS[j][idx] === PATS[(j + 1) % NP][idx]) continue;
          const k = clamp((t - (start[j] + 0.1 + order[j](r, c) * 0.18)) / 0.85);
          if (k >= 1) col ^= 1;
          else if (k > 0) { ang = PI * flipEase(k); ax = axis[j]; live = k; }
        }
        const lift = 1 + 0.08 * Math.sin(PI * clamp(live * 1.4));
        const ca = Math.cos(ang), sa = Math.sin(ang);
        ctx.beginPath();
        outline.forEach(([x, y], i) => {
          let X = x * lift, Y = y * lift, Z = 0;
          if (ax === 'y') { Z = X * sa; X = X * ca; } else { Z = Y * sa; Y = Y * ca; }
          const k = F / (F + Z), px = tx + X * k, py = ty + Y * k;
          i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
        });
        ctx.closePath();
        ctx.fillStyle = (ca >= 0 ? col : col ^ 1) ? P.fg2 : P.fg;
        ctx.fill();
      }
    },
  });

  // 08 Corner Twist: nested squares turn a quarter at a time, each ring lagging the one outside it,
  // rounding to a circle mid-turn, so the stack wrings like a twisted cloth.
  tile('sh.corner-twist', {
    name: 'Corner Twist',
    draw(ctx, w, h, t, P) {
      const u = h / 100, cx = w / 2, cy = h / 2;
      const sizes = [23, 16.4, 9.8, 4.3], step = 1.5;
      ctx.lineJoin = 'round';
      sizes.forEach((sz, i) => {
        const half = sz * u, tt = t - i * 0.1;
        const cyc = Math.floor(tt / step), k = win(mod(tt, step), 0, 0.85);
        const e = ease.inOutBack(k, 1.5);
        const cr = half * (0.14 + 0.86 * Math.sin(PI * clamp(e)));
        ctx.save();
        ctx.translate(cx, cy); ctx.rotate((PI / 2) * (cyc + e));
        M.roundRect(ctx, -half, -half, half * 2, half * 2, cr);
        if (i === sizes.length - 1) { ctx.fillStyle = P.fg; ctx.fill(); }
        else { ctx.strokeStyle = P.fg; ctx.lineWidth = 2 * u; ctx.stroke(); }
        ctx.restore();
      });
    },
  });
})();
