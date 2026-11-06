// Page "Rhythm" (sh 25-32, accent sky). Sequenced motion: staggers, cascades, beats. Each tile runs on a
// cycle that divides 12 s, with overlap and follow-through so nothing moves in lockstep.
(function () {
  const { TAU, clamp, lerp, win, ease, rand, rrange, rgba, smoothstep, mod, circle, poly, roundRect } = M;
  const dot = (ctx, x, y, r) => { if (r <= 0) return; ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, TAU); };

  // ---------- 25 Domino Fall ----------
  // Corners of a domino (thickness T, height H, bottom-right corner at bx on the floor `base`) rotated by phi.
  // phi >= 0 tips right about the bottom-right corner; phi < 0 rocks back about the bottom-left corner.
  const domQuad = (bx, T, H, base, phi) => {
    const c = Math.cos(phi), s = Math.sin(phi);
    const px = phi >= 0 ? bx : bx - T;
    const loc = phi >= 0 ? [[0, 0], [-T, 0], [-T, -H], [0, -H]] : [[T, 0], [0, 0], [0, -H], [T, -H]];
    return loc.map(([x, y]) => [px + x * c - y * s, base + x * s + y * c]);
  };
  // Separating-axis test for two convex quads.
  const overlap = (A, B) => {
    for (const Q of [A, B]) for (let i = 0; i < 4; i++) {
      const [x1, y1] = Q[i], [x2, y2] = Q[(i + 1) % 4], nx = y2 - y1, ny = x1 - x2;
      let a0 = Infinity, a1 = -Infinity, b0 = Infinity, b1 = -Infinity;
      for (const [x, y] of A) { const d = x * nx + y * ny; if (d < a0) a0 = d; if (d > a1) a1 = d; }
      for (const [x, y] of B) { const d = x * nx + y * ny; if (d < b0) b0 = d; if (d > b1) b1 = d; }
      if (a1 <= b0 || b1 <= a0) return false;
    }
    return true;
  };

  tile('sh.domino-fall', {
    name: 'Domino Fall',
    draw(ctx, w, h, t, P) {
      const u = h / 100, cx = w / 2;
      const N = 10, H = 24 * u, T = 4 * u, D = 8.5 * u, base = h / 2 + 13 * u;
      const x0 = cx - 50 * u; // left face of the first domino
      const bxs = Array.from({ length: N }, (_, i) => x0 + i * D + T);
      // Free fall of a pushed domino: phi = w0*tau + c*tau^2. Each one starts when the previous reaches contact.
      const W0 = 0.8, C = 2.2, PHC = Math.asin((D - T) / H);
      const DT = (-W0 + Math.sqrt(W0 * W0 + 4 * C * PHC)) / (2 * C);
      const TF = (-W0 + Math.sqrt(W0 * W0 + 4 * C * (Math.PI / 2))) / (2 * C);
      const free = (tau, last) => {
        if (tau <= 0) return 0;
        if (tau < TF || !last) return Math.min(Math.PI / 2, W0 * tau + C * tau * tau);
        const x = tau - TF; // the last one lands flat and bounces twice
        return Math.PI / 2 - (x < 0.14 ? 0.08 * Math.sin((Math.PI * x) / 0.14) : x < 0.22 ? 0.02 * Math.sin((Math.PI * (x - 0.14)) / 0.08) : 0);
      };
      // Timeline (6 s): hold, rock back, cascade, hold, rewind, hold.
      const s = mod(t, 6);
      const SET = 2.45;
      let sig = 0, rock = 0;
      if (s < 0.45) rock = -0.075 * Math.sin(Math.PI * ease.inOutSine(win(s, 0.08, 0.45)));
      else if (s < 3.3) sig = Math.min(SET, s - 0.45);
      else sig = SET * (1 - ease.inOutCubic(win(s, 3.3, 5.15)));
      // Solve the chain right to left: each domino falls freely but cannot pass through its neighbour.
      const phi = new Array(N);
      phi[N - 1] = free(sig - (N - 1) * DT, true);
      for (let i = N - 2; i >= 0; i--) {
        let f = free(sig - i * DT, false);
        if (f > 0) {
          const B = domQuad(bxs[i + 1], T, H, base, phi[i + 1]);
          if (overlap(domQuad(bxs[i], T, H, base, f), B)) {
            let lo = 0, hi = f;
            for (let k = 0; k < 18; k++) { const m = (lo + hi) / 2; overlap(domQuad(bxs[i], T, H, base, m), B) ? (hi = m) : (lo = m); }
            f = lo;
          }
        }
        phi[i] = f;
      }
      if (rock < 0) phi[0] = rock;
      // Floor.
      ctx.fillStyle = P.mid;
      ctx.fillRect(x0 - 5 * u, base, (N - 1) * D + T + H + 9 * u, 0.5 * u);
      for (let i = 0; i < N; i++) {
        const a = phi[i];
        ctx.save();
        ctx.translate(a >= 0 ? bxs[i] : bxs[i] - T, base); ctx.rotate(a);
        ctx.fillStyle = i === 0 ? P.fg2 : P.fg;
        roundRect(ctx, a >= 0 ? -T : 0, -H, T, H, 0.9 * u); ctx.fill();
        ctx.restore();
      }
    },
  });

  // ---------- 26 Wave Dots ----------
  // A pulse runs along a row of dots, each answering like a damped spring: a small dip (anticipation), a rise
  // with scale, an undershoot and a settle (follow-through). Pulses alternate direction every 2 s.
  tile('sh.wave-dots', {
    name: 'Wave Dots',
    draw(ctx, w, h, t, P) {
      const u = h / 100, cx = w / 2, cy = h / 2 + 7 * u;
      const N = 11, GAP = 7.6 * u, R0 = 2.7 * u, A = 19 * u, CYC = 2, STEP = 0.09;
      const resp = (x) => {
        if (x < -0.12) return 0;
        if (x < 0) return -0.14 * Math.sin((Math.PI * (x + 0.12)) / 0.12);
        return (Math.exp(-x / 0.32) * Math.sin((Math.PI * x) / 0.36)) / 0.608;
      };
      const c = Math.floor(t / CYC);
      for (let i = 0; i < N; i++) {
        let y = 0;
        for (let back = 0; back < 2; back++) {
          const cc = c - back, ltr = mod(cc, 2) === 0;
          const idx = ltr ? i : N - 1 - i;
          y += resp(t - cc * CYC - 0.15 - idx * STEP);
        }
        const env = 0.55 + 0.45 * Math.sin((Math.PI * i) / (N - 1));
        const yy = y * env;
        const r = R0 * (yy > 0 ? 1 + 0.85 * yy : 1 + 0.35 * yy);
        ctx.fillStyle = yy > 0.62 ? P.fg2 : P.fg;
        circle(ctx, cx + (i - (N - 1) / 2) * GAP, cy - yy * A, r); ctx.fill();
      }
    },
  });

  // ---------- 27 Grid Cascade ----------
  // A 5 x 5 grid; a diagonal wave turns each square a quarter turn, dips its scale and flips its colour at the
  // smallest point. Each wave ends in the corner where the next one starts, so it ping-pongs (8 waves per loop).
  tile('sh.grid-cascade', {
    name: 'Grid Cascade',
    draw(ctx, w, h, t, P) {
      const u = h / 100, cx = w / 2, cy = h / 2;
      const n = 5, cell = 8.6 * u, S = 6.4 * u, CYC = 1.5, DUR = 0.8, STEP = 0.085;
      const c = Math.floor(t / CYC), s = t - c * CYC, fromTL = mod(c, 2) === 0;
      for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
        const d = fromTL ? i + j : 2 * (n - 1) - i - j;
        const k = clamp((s - 0.05 - d * STEP) / DUR);
        const flips = c + (k >= 0.5 ? 1 : 0);
        const rot = (fromTL ? 1 : -1) * (Math.PI / 2) * ease.inOutBack(k, 1.2);
        const sc = 1 - 0.6 * Math.pow(Math.sin(Math.PI * k), 1.4);
        ctx.save();
        ctx.translate(cx + (i - (n - 1) / 2) * cell, cy + (j - (n - 1) / 2) * cell);
        ctx.rotate(rot); ctx.scale(sc, sc);
        ctx.fillStyle = mod(flips, 2) ? P.fg2 : P.fg;
        roundRect(ctx, -S / 2, -S / 2, S, S, 0.7 * u); ctx.fill();
        ctx.restore();
      }
    },
  });

  // ---------- 28 Equalizer ----------
  // 120 BPM: one 2 s bar = 16 sixteenths; the 12 s loop is six bars with a fill at the end. Kick drives the low
  // bands, snare the mids, hats the highs, an offbeat lead walks across the middle. Fast attack, slow release,
  // and peak caps that hold, then fall with gravity.
  const KICK = ['x.......x.......', 'x.......x.x.....', 'x.......x.......', 'x..x....x.x.....', 'x.......x.......', 'x.....x.x...x...'];
  const SNARE = ['....x.......x...', '....x.......x...', '....x.......x..x', '....x.......x...', '....x.......x...', '....x.......xxxx'];
  const HAT = ['x.x.x.x.x.x.x.x.', 'x.x.x.xxx.x.x.x.', 'x.x.x.x.x.x.x.x.', 'x.x.x.x.x.x.xxx.', 'x.xxx.x.x.x.x.x.', 'x.x.x.x.x.x.....'];
  const LEAD = [0.34, 0.58, 0.46, 0.7, 0.4, 0.62, 0.5, 0.74]; // band of each offbeat note, cycling
  const STEP = 0.125;
  const env = (dt, dec) => (dt < 0 ? 0 : dt < 0.03 ? dt / 0.03 : Math.exp(-(dt - 0.03) / dec));
  const g2 = (x, s) => Math.exp(-(x * x) / (s * s));
  const level = (f, tt) => {
    let v = 0.05 + 0.04 * (1 + Math.sin((TAU * tt) / 2 + f * 9));
    const s0 = Math.floor(tt / STEP);
    for (let k = s0 - 10; k <= s0; k++) {
      const st = mod(k, 96), dt = tt - k * STEP, bar = Math.floor(st / 16), i = st % 16;
      if (KICK[bar][i] === 'x') v += 1.2 * g2(f - 0.08, 0.2) * env(dt, 0.2);
      if (SNARE[bar][i] === 'x') v += (0.3 + 0.65 * g2(f - 0.5, 0.24)) * env(dt, 0.13);
      if (HAT[bar][i] === 'x') v += 0.8 * g2(f - 0.9, 0.14) * env(dt, 0.06);
      if (st % 4 === 2) v += 0.6 * g2(f - LEAD[(st >> 2) % 8], 0.09) * env(dt, 0.28);
    }
    return 1 - Math.exp(-1.5 * v);
  };
  tile('sh.equalizer', {
    name: 'Equalizer',
    draw(ctx, w, h, t, P) {
      const u = h / 100, cx = w / 2, base = h / 2 + 18 * u;
      const N = 13, BW = 3.6 * u, PITCH = 5.6 * u, MAXH = 40 * u, MINH = 2.2 * u;
      for (let b = 0; b < N; b++) {
        const f = b / (N - 1), x = cx + (b - (N - 1) / 2) * PITCH;
        const L = level(f, t);
        let cap = 0;
        for (let m = 0; m <= 30; m++) {
          const back = m / 36, fall = back < 0.1 ? 0 : 3.4 * (back - 0.1) * (back - 0.1);
          cap = Math.max(cap, level(f, t - back) - fall);
        }
        const bh = lerp(MINH, MAXH, L), ch = lerp(MINH, MAXH, Math.max(cap, L));
        ctx.fillStyle = P.fg; roundRect(ctx, x - BW / 2, base - bh, BW, bh, BW / 2); ctx.fill();
        ctx.fillStyle = P.fg2; roundRect(ctx, x - BW / 2, base - ch - 2.4 * u, BW, 1.4 * u, 0.7 * u); ctx.fill();
      }
    },
  });

  // ---------- 29 Shape Parade ----------
  // Circle, square, triangle, hexagon march left to right. Every hop: crouch, stretch on take-off, tumble by
  // the shape's own symmetry in the air, squash on landing. The hops ripple back from the leader like a conga.
  tile('sh.shape-parade', {
    name: 'Shape Parade',
    draw(ctx, w, h, t, P) {
      const u = h / 100, cx = w / 2, ground = h / 2 + 13 * u;
      const SP = 20 * u, HALF = 50 * u, HOP = 15 * u;
      const SYM = [0, Math.PI / 2, TAU / 3, Math.PI / 3];
      ctx.fillStyle = P.mid;
      ctx.fillRect(cx - HALF - 6 * u, ground, 2 * HALF + 12 * u, 0.45 * u);
      const lo = Math.floor(-HALF / SP - t) - 3, hi = Math.ceil(HALF / SP - t) + 3;
      for (let k = lo; k <= hi; k++) {
        const o = mod(k / 6, 1), ph = t + o, q = ph - Math.floor(ph);
        const air = win(q, 0.16, 0.72);
        const xf = (k + Math.floor(ph) - o) * SP, xt = xf + SP, x = xf + air * SP;
        // Pop in on the first hop into the stage, shrink away on the last hop out of it.
        let sc = 1;
        if (xt < -HALF || xf > HALF) continue;
        if (xf < -HALF) sc = ease.outBack(air, 2);
        else if (xt > HALF) sc = 1 - ease.inCubic(air);
        if (sc <= 0) continue;
        const y = HOP * 4 * air * (1 - air);
        let sy;
        if (q < 0.16) sy = 1 - 0.24 * ease.inOutSine(q / 0.16);
        else if (q < 0.72) sy = lerp(0.76, 1 + 0.2 * Math.pow(1 - 2 * air, 2), smoothstep(0, 0.14, air));
        else if (q < 0.88) sy = 1 - 0.26 * Math.sin(Math.PI * win(q, 0.72, 0.88));
        else sy = 1 + 0.05 * Math.sin(Math.PI * win(q, 0.88, 1));
        const sx = 1 / Math.pow(sy, 0.8);
        const kind = mod(k, 4);
        const rot = SYM[kind] * ease.inOutCubic(air);
        let rest, r;
        if (kind === 0) { r = 5.9 * u; rest = r; }
        else if (kind === 1) { r = 5.2 * u * Math.SQRT2; rest = 5.2 * u; }
        else if (kind === 2) { r = 7.6 * u; rest = r / 2; }
        else { r = 6.5 * u; rest = r * Math.cos(Math.PI / 6); }
        ctx.save();
        ctx.translate(cx + x, ground - y); ctx.scale(sx * sc, sy * sc); ctx.translate(0, -rest); ctx.rotate(rot);
        ctx.fillStyle = kind === 1 ? P.fg2 : P.fg;
        if (kind === 0) circle(ctx, 0, 0, r);
        else if (kind === 1) poly(ctx, 0, 0, r, 4, Math.PI / 4);
        else if (kind === 2) poly(ctx, 0, 0, r, 3, 0);
        else poly(ctx, 0, 0, r, 6, Math.PI / 6);
        ctx.fill();
        ctx.restore();
      }
    },
  });

  // ---------- 30 Stack Up ----------
  // Five blocks drop under gravity and stack; each impact squashes the block and ripples down the stack.
  // Then the stack is dealt off, top first, alternating sides, and the next drop is already falling.
  tile('sh.stack-up', {
    name: 'Stack Up',
    draw(ctx, w, h, t, P) {
      const u = h / 100, cx = w / 2, floor = h / 2 + 20 * u;
      const CYC = 4, NB = 5, BH = 7.4 * u, GAP = 0.36, G = 640 * u, CLR = 2.45, D0 = -0.5;
      const WID = [30, 25, 21, 17, 12];
      const imp = (x) => (x < 0 ? 0 : 0.26 * Math.exp(-x / 0.1) * Math.sin((x * TAU) / 0.2));
      ctx.fillStyle = P.fg; ctx.fillRect(cx - 24 * u, floor, 48 * u, 0.5 * u);
      const cycle = (cc, s) => {
        const vr = mod(cc, 3);
        const startBottom = -3 * u;
        const land = [], sq = [];
        for (let j = 0; j < NB; j++) {
          const d = floor - j * BH - startBottom;
          land.push(D0 + j * GAP + Math.sqrt((2 * d) / G));
        }
        for (let m = 0; m < NB; m++) {
          let v = 0;
          for (let j = m; j < NB; j++) v += imp(s - land[j] - 0.03 * (j - m)) * Math.pow(0.55, j - m);
          sq.push(v);
        }
        let top = floor;
        for (let j = 0; j < NB; j++) {
          const d0 = D0 + j * GAP;
          if (s < d0) break;
          let bottom, sy;
          if (s < land[j]) {
            const tf = s - d0;
            bottom = Math.min(top, startBottom + 0.5 * G * tf * tf);
            sy = 1 + 0.14 * clamp((G * tf) / (G * 0.45));
          } else { bottom = top; sy = 1 - sq[j]; }
          const sx = 1 + 0.7 * (1 - sy);
          const off = j === 0 ? 0 : rrange(vr * 11 + j, -2.6, 2.6, 3) * u;
          const dir = (j % 2 ? 1 : -1) * (vr % 2 ? -1 : 1);
          const ex = ease.inBack(win(s, CLR + (NB - 1 - j) * 0.075, CLR + (NB - 1 - j) * 0.075 + 0.42), 2.2);
          const W = WID[j] * u;
          ctx.save();
          ctx.translate(cx + off + dir * 150 * u * ex, bottom); ctx.rotate(dir * 0.25 * ex); ctx.scale(sx, sy);
          ctx.fillStyle = j % 2 ? P.fg2 : P.fg;
          roundRect(ctx, -W / 2, -BH, W, BH, 1.4 * u); ctx.fill();
          ctx.restore();
          top = bottom - BH * sy;
        }
      };
      // Offset the timeline so the loop point falls in the finished-stack hold.
      const tt = t + 2, c = Math.floor(tt / CYC);
      cycle(c, tt - c * CYC);
      cycle(c + 1, tt - (c + 1) * CYC);
    },
  });

  // ---------- 31 Stair Hop ----------
  // A ball climbs a floating staircase: crouch, arc, squash on each tread. The camera eases after it one step
  // per hop; new steps pop in at the top, old ones pop out at the bottom.
  tile('sh.stair-hop', {
    name: 'Stair Hop',
    draw(ctx, w, h, t, P) {
      const u = h / 100, cx = w / 2, cy = h / 2;
      const SW = 15 * u, SH = 6.5 * u, TH = 3.4 * u, HOP = 11 * u, R = 4.4 * u;
      const n = Math.floor(t), q = t - n;
      const cam = n + ease.inOutCubic(win(q, 0.12, 0.92));
      const ox = cx - 0.5 * SW, oy = cy - 1 * u; // screen position of the current tread's top centre
      ctx.fillStyle = P.fg;
      const full = new Path2D();
      for (let m = n - 4; m <= n + 5; m++) {
        const rel = m - cam;
        if (rel < -2.5 || rel > 3.5) continue;
        const X = ox + rel * SW, Y = oy - rel * SH, BHt = SH + TH;
        const sIn = clamp(3.5 - rel), sOut = clamp(rel + 2.5);
        if (sIn >= 1 && sOut >= 1) { full.rect(X - SW / 2, Y, SW, BHt); continue; }
        const sc = sIn < 1 ? ease.outBack(sIn, 1.8) : ease.outBack(sOut, 1.8);
        if (sc <= 0) continue;
        ctx.save(); ctx.translate(X, Y + BHt / 2); ctx.scale(sc, sc);
        ctx.fillRect(-SW / 2, -BHt / 2, SW, BHt);
        ctx.restore();
      }
      ctx.fill(full);
      // Ball.
      const air = win(q, 0.18, 0.66);
      let sy;
      if (q < 0.18) sy = 1 - 0.22 * ease.inOutSine(q / 0.18);
      else if (q < 0.66) sy = lerp(0.78, 1 + 0.18 * Math.pow(1 - 2 * air, 2), smoothstep(0, 0.14, air));
      else if (q < 0.82) sy = 1 - 0.25 * Math.sin(Math.PI * win(q, 0.66, 0.82));
      else sy = 1 + 0.05 * Math.sin(Math.PI * win(q, 0.82, 1));
      const sx = 1 / Math.pow(sy, 0.8);
      const wx = n + air - cam;
      const bx = ox + wx * SW, by = oy - wx * SH - HOP * 4 * air * (1 - air);
      ctx.save(); ctx.translate(bx, by); ctx.scale(sx, sy);
      ctx.fillStyle = P.fg2; circle(ctx, 0, -R, R); ctx.fill();
      ctx.restore();
    },
  });

  // ---------- 32 Loader Dots ----------
  // Three dots jump in sequence: crouch, stretch, round at the apex, stretch, squash, a little wobble to settle.
  // Each takes off while the previous is still rising.
  tile('sh.loader-dots', {
    name: 'Loader Dots',
    draw(ctx, w, h, t, P) {
      const u = h / 100, cx = w / 2, ground = h / 2 + 11 * u;
      const R = 5.6 * u, GAP = 16.5 * u, JUMP = 16 * u, CYC = 1.5, LAG = 0.13;
      for (let i = 0; i < 3; i++) {
        const x = mod(t - i * LAG, CYC);
        const air = win(x, 0.1, 0.52);
        let sy;
        if (x < 0.1) sy = 1 - 0.24 * ease.inOutSine(x / 0.1);
        else if (x < 0.52) sy = lerp(0.76, 1 + 0.26 * Math.pow(Math.abs(1 - 2 * air), 1.5), smoothstep(0, 0.12, air));
        else if (x < 0.64) sy = 1 - 0.3 * Math.sin(Math.PI * win(x, 0.52, 0.64));
        else sy = 1 + 0.09 * Math.exp(-(x - 0.64) / 0.12) * Math.sin(((x - 0.64) * TAU) / 0.2);
        const sx = 1 / Math.pow(sy, 0.85);
        const y = JUMP * (1 - Math.pow(1 - 2 * air, 2));
        ctx.save();
        ctx.translate(cx + (i - 1) * GAP, ground - y); ctx.scale(sx, sy);
        ctx.fillStyle = P.fg; circle(ctx, 0, -R, R); ctx.fill();
        ctx.restore();
      }
    },
  });
})();
