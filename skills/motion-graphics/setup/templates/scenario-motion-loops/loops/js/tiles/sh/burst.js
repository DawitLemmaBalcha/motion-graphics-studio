// Page "Burst" (sh 17-24, accent pink). One subject per tile, centred. Every burst has a crisp charge,
// an explosive release (linear drag = a physical outExpo), gravity where it belongs, and a fade that
// clears the stage before the next cycle so the 12 s loop resets unseen.
(function () {
  const { TAU, clamp, lerp, win, ease, rand, rrange, rgba, smoothstep, mod, circle, poly, mixColor } = M;

  // Flight under linear drag k (1/s) and gravity g (+y down). Position offset after s seconds.
  const fly = (vx, vy, k, g, s) => {
    const e = 1 - Math.exp(-k * s);
    return [(vx * e) / k, (vy * e) / k + (g / k) * (s - e / k)];
  };
  // Add a circle to the current path (for batched fills).
  const dot = (ctx, x, y, r) => { if (r <= 0) return; ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, TAU); };
  // Primitive by kind: 0 circle, 1 square, 2 triangle. r is a visual radius.
  const prim = (ctx, kind, x, y, r, rot) => {
    if (kind === 0) circle(ctx, x, y, r * 0.92);
    else if (kind === 1) poly(ctx, x, y, r * 1.12, 4, rot + Math.PI / 4);
    else poly(ctx, x, y, r * 1.3, 3, rot);
  };

  // 17 Confetti Burst: a core swells, squeezes and pops; confetti flies out, slows on drag, flutters
  // (flip = scaleX by cosine, back face darker), drifts down and fades before the next pop.
  tile('sh.confetti-burst', {
    name: 'Confetti Burst',
    draw(ctx, w, h, t, P) {
      const u = h / 100, cx = w / 2, cy = h * 0.54;
      const CYC = 3, POP = 0.6;
      const s = mod(t, CYC);
      const backA = mixColor(P.fg, P.bg, 0.42), backB = P.fg; // paper pieces show their pink back as they flip
      if (s < POP) {
        const r = 4.6 * u * ease.outBack(win(s, 0.0, 0.28), 2.4) * (1 - 0.45 * ease.inCubic(win(s, 0.3, POP)));
        ctx.fillStyle = P.fg2; circle(ctx, cx, cy, r); ctx.fill();
      }
      for (let b = 0; b < 4; b++) {
        const a = mod(t - (b * CYC + POP), 12);
        if (a > 3.2) continue;
        if (a < 0.32) {
          const k = ease.outExpo(a / 0.32);
          ctx.strokeStyle = rgba(P.fg2, 1 - a / 0.32);
          ctx.lineWidth = Math.max(0.01, 2.0 * u * (1 - k));
          circle(ctx, cx, cy, 3 * u + 13 * u * k); ctx.stroke();
        }
        for (let i = 0; i < 38; i++) {
          const id = b * 97 + i;
          const life = rrange(id, 2.0, 3.1, 1);
          if (a > life) continue;
          const ang = rand(id, 2) * TAU;
          const sp = (45 + 150 * Math.pow(rand(id, 3), 0.85)) * u;
          const k = rrange(id, 4.0, 4.8, 4);
          const [dx, dy] = fly(Math.cos(ang) * sp, Math.sin(ang) * sp * 0.7 - 34 * u, k, 52 * u, a);
          const drift = smoothstep(0.25, 1.2, a);
          const x = cx + dx + Math.sin(a * rrange(id, 3, 5, 5) + rand(id, 6) * TAU) * 3.6 * u * drift;
          const y = cy + dy;
          const flip = Math.cos(a * rrange(id, 6, 13, 7) + rand(id, 8) * TAU);
          const rot = rand(id, 9) * TAU + a * rrange(id, -3.5, 3.5, 10);
          const pop = lerp(0.3, 1, ease.outBack(clamp(a / 0.14)));
          const paper = rand(id, 11) < 0.32;
          const round = rand(id, 12) < 0.16;
          ctx.save();
          ctx.globalAlpha = 1 - smoothstep(life - 0.5, life, a);
          ctx.translate(x, y); ctx.rotate(rot); ctx.scale(Math.max(0.1, Math.abs(flip)) * pop, pop);
          ctx.fillStyle = flip >= 0 ? (paper ? P.fg2 : P.fg) : (paper ? backB : backA);
          if (round) { circle(ctx, 0, 0, 1.7 * u); ctx.fill(); }
          else ctx.fillRect(-2.6 * u, -1.2 * u, 5.2 * u, 2.4 * u);
          ctx.restore();
        }
      }
    },
  });

  // 18 Shape Explosion: a shape spins in, winds up and trembles, flashes, then blows into primitives
  // that spin out on drag, drift, and wink out one by one. Circle, square, triangle in turn.
  tile('sh.shape-explosion', {
    name: 'Shape Explosion',
    draw(ctx, w, h, t, P) {
      const u = h / 100, cx = w / 2, cy = h / 2;
      const CYC = 4, BOOM = 1.35, R = 12 * u;
      const c = Math.floor(t / CYC), s = t - c * CYC, kind = c % 3;
      if (s < BOOM) {
        const grow = ease.outBack(win(s, 0, 0.45), 2.2);
        const ch = win(s, 0.55, BOOM);
        const shake = 0.9 * u * ch * ch * ch;
        const x = cx + shake * Math.sin(TAU * 29 * t), y = cy + shake * Math.sin(TAU * 23 * t + 1.3);
        const sc = grow * (1 - 0.22 * ease.inCubic(ch));
        const rot = 0.9 * (1 - ease.outBack(win(s, 0, 0.5))) - 0.35 * ease.inOutCubic(ch);
        ctx.fillStyle = s > BOOM - 0.07 ? P.fg2 : P.fg;
        prim(ctx, kind, x, y, R * sc, rot); ctx.fill();
      }
      for (let e = 0; e < 3; e++) {
        const a = mod(t - (e * CYC + BOOM), 12);
        if (a > 3.0) continue;
        if (a < 0.13) {
          const k = a / 0.13;
          ctx.fillStyle = rgba(P.fg2, 1 - k);
          prim(ctx, e % 3, cx, cy, R * (0.8 + 0.7 * ease.outCubic(k)), -0.35); ctx.fill();
        }
        for (let j = 0; j < 22; j++) {
          const id = e * 53 + j;
          const life = rrange(id, 1.9, 2.75, 1);
          if (a > life) continue;
          const dir = rand(id, 2) * TAU;
          const r0 = (0.15 + 0.45 * rand(id, 3)) * R;
          const sp = (40 + 150 * Math.pow(rand(id, 4), 0.8)) * u, k = 3.4;
          const [dx, dy] = fly(Math.cos(dir) * sp, Math.sin(dir) * sp * 0.78, k, 14 * u, a);
          const x = cx + Math.cos(dir) * r0 + dx, y = cy + Math.sin(dir) * r0 * 0.78 + dy;
          const spin = rrange(id, 5, 12, 6) * (rand(id, 7) < 0.5 ? -1 : 1);
          const rot = rand(id, 8) * TAU + (spin * (1 - Math.exp(-k * a))) / k + 0.5 * a * Math.sign(spin);
          const sc = lerp(0.4, 1, ease.outBack(clamp(a / 0.2))) * (1 - ease.inBack(win(a, life - 0.4, life)));
          const size = lerp(1.8, 4.4, Math.pow(rand(id, 5), 1.4)) * u;
          ctx.fillStyle = j % 4 === 1 ? P.fg2 : P.fg;
          prim(ctx, j % 3, x, y, size * sc, rot); ctx.fill();
        }
      }
    },
  });

  // 19 Firework: a shell climbs and stalls, bursts into drag-slowed streaks around a slower inner ring;
  // gravity bends them into a droop as they burn out. Four shells, colours swap shell to shell.
  tile('sh.firework', {
    name: 'Firework',
    draw(ctx, w, h, t, P) {
      const u = h / 100, cx = w / 2, cy = h / 2;
      const CYC = 3, RISE = 0.72;
      const X = [-9, 12, -3, 8], Y = [-12, -15, -10, -14];
      ctx.lineCap = 'round';
      for (let b = 0; b < 4; b++) {
        const s = mod(t - b * CYC, 12);
        if (s > RISE + 2.2) continue;
        const bx = cx + X[b] * u, by = cy + Y[b] * u, y0 = h + 4 * u;
        const outer = P.fg2, inner = P.fg, n = [14, 12, 16, 12][b], spd = [128, 116, 134, 120][b];
        if (s < RISE) {
          // Shell: a tapered streak, fast off the ground and stalling at the top.
          const k = s / RISE;
          const at = (q) => lerp(y0, by, ease.outCubic(clamp(q)));
          ctx.strokeStyle = P.fg;
          for (let m = 0; m < 4; m++) {
            ctx.lineWidth = (0.5 + 0.4 * m) * u;
            ctx.beginPath(); ctx.moveTo(bx, at(k - 0.26 + m * 0.065)); ctx.lineTo(bx, at(k - 0.26 + (m + 1) * 0.065)); ctx.stroke();
          }
          ctx.fillStyle = P.fg; circle(ctx, bx, at(k), 1.45 * u); ctx.fill();
          continue;
        }
        const a = s - RISE;
        if (a < 0.18) {
          const k = a / 0.18;
          ctx.fillStyle = rgba(outer, 1 - k);
          circle(ctx, bx, by, (2 + 6 * ease.outExpo(k)) * u); ctx.fill();
        }
        // Outer stars: each leaves a tapered trail of where it was 0.3 s ago, so the gravity droop draws itself.
        const fo = 1 - smoothstep(1.0, 2.1, a), K = 3.6, G = 52 * u, SEG = 6, LAG = 0.07;
        if (fo > 0) {
          const vel = [];
          for (let i = 0; i < n; i++) {
            const ang = (i / n) * TAU + b * 0.37;
            const sp = spd * u * (1 + 0.06 * Math.sin(i * 2.3 + b));
            vel.push([Math.cos(ang) * sp, Math.sin(ang) * sp]);
          }
          for (let m = 0; m < SEG; m++) {
            const t1 = a - m * LAG, t0 = a - (m + 1) * LAG;
            if (t1 <= 0) break;
            const k = 1 - (m + 0.5) / SEG;
            ctx.strokeStyle = rgba(outer, fo * (0.25 + 0.75 * k));
            ctx.lineWidth = lerp(0.3, 1.6, k) * u;
            ctx.beginPath();
            for (const [vx, vy] of vel) {
              const [x1, y1] = fly(vx, vy, K, G, t1), [x0, y0b] = fly(vx, vy, K, G, Math.max(0, t0));
              ctx.moveTo(bx + x1, by + y1); ctx.lineTo(bx + x0, by + y0b);
            }
            ctx.stroke();
          }
          ctx.fillStyle = rgba(outer, fo); ctx.beginPath();
          for (const [vx, vy] of vel) { const [x1, y1] = fly(vx, vy, K, G, a); dot(ctx, bx + x1, by + y1, 1.05 * u); }
          ctx.fill();
        }
        // Inner ring: slower dots that burn out first.
        const fi = 1 - smoothstep(0.45, 1.25, a);
        if (fi > 0) {
          ctx.fillStyle = inner; ctx.beginPath();
          for (let i = 0; i < 9; i++) {
            const ang = ((i + 0.5) / 9) * TAU + b * 0.37;
            const [x1, y1] = fly(Math.cos(ang) * 64 * u, Math.sin(ang) * 64 * u, 3.9, 52 * u, a);
            dot(ctx, bx + x1, by + y1, 1.6 * u * fi);
          }
          ctx.fill();
        }
      }
    },
  });

  // 20 Bubble Pop: bubbles rise, wobble and sway, swell for a beat, then the skin shatters into arcs and droplets.
  tile('sh.bubble-pop', {
    name: 'Bubble Pop',
    draw(ctx, w, h, t, P) {
      const u = h / 100, cx = w / 2, cy = h / 2;
      ctx.lineCap = 'round';
      for (let k = 0; k < 12; k++) {
        const born = k + rrange(k, -0.15, 0.15, 1);
        const a = mod(t - born, 12);
        const rise = rrange(k, 1.55, 2.05, 2);
        if (a > rise + 0.5) continue;
        const r = rrange(k, 5.0, 9.5, 3) * u;
        const x0 = cx + (k % 2 ? 1 : -1) * rrange(k, 3, 19, 4) * u;
        const y0 = cy + 30 * u, y1 = cy - rrange(k, 0, 15, 5) * u;
        const kk = clamp(a / rise);
        const sway = Math.sin(TAU * 0.8 * Math.min(a, rise) + rand(k, 6) * TAU) * 2.2 * u * smoothstep(0, 0.5, kk);
        const x = x0 + sway, y = lerp(y0, y1, Math.pow(kk, 1.3));
        if (a < rise) {
          const g = ease.outBack(clamp(a / 0.4), 2) * (1 + 0.14 * ease.inQuad(win(a, rise - 0.14, rise)));
          const wob = 0.06 * Math.sin(a * 10 + rand(k, 7) * TAU);
          ctx.save(); ctx.translate(x, y); ctx.scale(g * (1 + wob), g * (1 - wob));
          ctx.fillStyle = rgba(P.fg, 0.14); circle(ctx, 0, 0, r); ctx.fill();
          ctx.strokeStyle = P.fg; ctx.lineWidth = 1.25 * u; ctx.stroke();
          ctx.strokeStyle = P.fg2; ctx.beginPath(); ctx.arc(0, 0, r * 0.6, -2.6, -1.8); ctx.stroke();
          ctx.restore();
        } else {
          const b = a - rise, rr = r * 1.14;
          // Skin: eight arcs flung outward, shrinking as they go.
          const q = b / 0.3;
          if (q < 1) {
            const k2 = ease.outExpo(q), half = (TAU / 16) * 0.85 * (1 - ease.inQuad(q));
            const R2 = rr * (1 + 0.6 * k2), off = rand(k, 8) * TAU;
            ctx.strokeStyle = P.fg; ctx.lineWidth = 1.25 * u * (1 - 0.5 * q);
            ctx.beginPath();
            for (let j = 0; j < 8; j++) {
              const m = off + (j / 8) * TAU;
              ctx.moveTo(x + Math.cos(m - half) * R2, y + Math.sin(m - half) * R2);
              ctx.arc(x, y, R2, m - half, m + half);
            }
            ctx.stroke();
          }
          // Droplets between the arcs, thrown further and pulled down.
          const dk = b / 0.5;
          ctx.fillStyle = P.fg; ctx.beginPath();
          for (let j = 0; j < 8; j++) {
            const m = rand(k, 8) * TAU + ((j + 0.5) / 8) * TAU;
            const d = rr + 10 * u * ease.outExpo(dk) * rrange(k * 8 + j, 0.6, 1.2, 9);
            dot(ctx, x + Math.cos(m) * d, y + Math.sin(m) * d + 14 * u * b * b, 1.2 * u * (1 - dk));
          }
          ctx.fill();
        }
      }
    },
  });

  // 21 Shockwave: a ring implodes onto a point (the wind-up), the point slams, three rings blast out,
  // thick at the core and thinning as they spread; a halo of dots is shoved outward and springs back.
  tile('sh.shockwave', {
    name: 'Shockwave',
    draw(ctx, w, h, t, P) {
      const u = h / 100, cx = w / 2, cy = h / 2;
      const CYC = 3, HIT = 0.6;
      const a = mod(t - HIT, CYC); // time since the last impact
      // Implosion toward the next impact.
      const im = win(a, 1.7, CYC);
      if (im > 0) {
        const k = ease.inCubic(im);
        ctx.strokeStyle = rgba(P.fg2, smoothstep(0, 0.3, im));
        ctx.lineWidth = lerp(0.35, 2.6, k) * u;
        circle(ctx, cx, cy, lerp(24, 2.8, k) * u); ctx.stroke();
      }
      // Rings.
      const rings = [[0, 1.3, 46, 3.8, P.fg2], [0.07, 1.25, 36, 3.0, P.fg], [0.16, 1.15, 27, 2.2, P.fg]];
      for (const [d, dur, Rm, lw0, col] of rings) {
        const q = (a - d) / dur;
        if (q <= 0 || q >= 1) continue;
        const k = ease.outQuint(q);
        ctx.strokeStyle = rgba(col, 1 - smoothstep(0.35, 1, q));
        ctx.lineWidth = Math.max(0.25 * u, lw0 * u * Math.pow(1 - k, 1.1));
        circle(ctx, cx, cy, lerp(2.8, Rm, k) * u); ctx.stroke();
      }
      // Halo: dots at radius 33 kicked outward when the first ring reaches them.
      // Contact time: when the first ring (outQuint from 2.8 to 46 over 1.3 s) reaches RH.
      const RH = 33, tc = 1.3 * (1 - Math.pow(1 - (RH - 2.8) / (46 - 2.8), 1 / 5));
      const x = a - tc;
      const kick = x > 0 ? 6 * (1 - Math.exp(-x / 0.03)) * Math.exp(-x / 0.3) * Math.cos(x * 6) : 0;
      ctx.fillStyle = P.fg; ctx.beginPath();
      for (let i = 0; i < 20; i++) {
        const m = (i / 20) * TAU, rr = (RH + kick) * u;
        dot(ctx, cx + Math.cos(m) * rr, cy + Math.sin(m) * rr, 0.95 * u);
      }
      ctx.fill();
      // Impact point: slams big, springs back, then shrinks away before the next wind-up.
      if (a < 1.85) {
        const r = 3.0 * u * (1 + 0.9 * (1 - ease.spring(clamp(a / 0.6), 0.32, 2.2))) * (1 - ease.inBack(win(a, 1.45, 1.85)));
        ctx.fillStyle = P.fg2; circle(ctx, cx, cy, r); ctx.fill();
      }
      if (a < 0.13) {
        ctx.fillStyle = rgba(P.fg2, 1 - a / 0.13);
        circle(ctx, cx, cy, (3 + 7 * ease.outCubic(a / 0.13)) * u); ctx.fill();
      }
    },
  });

  // 22 Radial Fan: twelve leaves, each longer than the last, flick open into a nautilus rosette
  // with spring overshoot, then sweep shut onto the longest leaf. The fan creeps round one leaf per cycle.
  tile('sh.radial-fan', {
    name: 'Radial Fan',
    draw(ctx, w, h, t, P) {
      const u = h / 100, cx = w / 2, cy = h / 2;
      const N = 12, SPAN = TAU / N, CYC = 4;
      const c = Math.floor(t / CYC), p = (t - c * CYC) / CYC;
      const open = ease.spring(win(p, 0.0, 0.32), 0.5, 1.3);
      const close = ease.inOutQuart(win(p, 0.5, 0.82));
      // Base angle: shifts by (N-1) leaves per cycle plus a slow creep of one leaf, so every cycle starts at the top.
      const base = c * (N - 1) * SPAN + SPAN * (t / CYC) - Math.PI / 2 - SPAN / 2;
      for (let i = 0; i < N; i++) {
        const a0 = base + i * SPAN * open + (N - 1 - i) * SPAN * close;
        const R = (9 + 16 * (i / (N - 1))) * u;
        ctx.fillStyle = i % 2 ? P.fg : P.fg2;
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, R, a0, a0 + SPAN); ctx.closePath(); ctx.fill();
      }
      ctx.fillStyle = P.fg; circle(ctx, cx, cy, 2.6 * u); ctx.fill();
      ctx.fillStyle = P.fg2; circle(ctx, cx, cy, 1.1 * u); ctx.fill();
    },
  });

  // 23 Particle Orbit: an orrery. Particles on three tilted orbits (inner ones faster) pass in front of
  // and behind the core; nearer means bigger and stronger. Tapered tails follow the paths.
  tile('sh.particle-orbit', {
    name: 'Particle Orbit',
    draw(ctx, w, h, t, P) {
      const u = h / 100, cx = w / 2, cy = h / 2;
      const D = 105 * u, Rmax = 35 * u;
      const orbits = [
        { R: 17, tx: -0.78, tz: 0.42, per: 2, n: 1, sz: 3.2 },
        { R: 26, tx: -0.5, tz: -0.22, per: 3, n: 2, sz: 2.9 },
        { R: 35, tx: -0.4, tz: -0.3, per: 6, n: 3, sz: 2.6 },
      ];
      const pt = (o, a) => {
        let v = [o.R * u * Math.cos(a), 0, o.R * u * Math.sin(a)];
        v = M.rotX(v, o.tx); v = M.rotZ(v, o.tz);
        const [x, y, s] = M.proj(v[0], v[1], v[2] + D, D, cx, cy);
        return [x, y, s, v[2]];
      };
      // Orbit paths split into the half behind the core and the half in front.
      const runs = [[], []], parts = [[], []];
      for (const o of orbits) {
        const SEG = 96;
        let run = null, side = -1;
        for (let i = 0; i <= SEG; i++) {
          const q = pt(o, (i / SEG) * TAU), sd = q[3] > 0 ? 0 : 1;
          if (sd !== side) { if (run) run.push(q); run = [q]; runs[sd].push(run); side = sd; } else run.push(q);
        }
        for (let j = 0; j < o.n; j++) {
          const a = (TAU * t) / o.per + (j / o.n) * TAU + o.R;
          const pts = [];
          for (let m = 0; m <= 14; m++) pts.push(pt(o, a - (m / 14) * (20 / o.R)));
          parts[pts[0][3] > 0 ? 0 : 1].push([pts[0][3], pts, o.sz * u]);
        }
      }
      const strokeRuns = (list, col) => {
        ctx.strokeStyle = col; ctx.lineWidth = 0.32 * u; ctx.beginPath();
        for (const r of list) r.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
        ctx.stroke();
      };
      const drawParts = (list) => {
        list.sort((A, B) => B[0] - A[0]);
        for (const [z, pts, sz] of list) {
          const near = clamp(0.5 - z / (2 * Rmax));
          const L = [], Rr = [], M2 = pts.length - 1;
          for (let m = 0; m <= M2; m++) {
            const A = pts[Math.max(0, m - 1)], B = pts[Math.min(M2, m + 1)];
            let nx = -(B[1] - A[1]), ny = B[0] - A[0];
            const nl = Math.hypot(nx, ny) || 1; nx /= nl; ny /= nl;
            const hw = sz * pts[m][2] * 0.62 * Math.pow(1 - m / M2, 1.1);
            L.push([pts[m][0] + nx * hw, pts[m][1] + ny * hw]); Rr.push([pts[m][0] - nx * hw, pts[m][1] - ny * hw]);
          }
          ctx.fillStyle = mixColor(P.fg2, P.bg, lerp(0.72, 0.5, near));
          ctx.beginPath(); L.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
          for (let m = M2; m >= 0; m--) ctx.lineTo(Rr[m][0], Rr[m][1]);
          ctx.closePath(); ctx.fill();
          ctx.fillStyle = mixColor(P.fg2, P.bg, lerp(0.42, 0, near));
          circle(ctx, pts[0][0], pts[0][1], sz * pts[0][2]); ctx.fill();
        }
      };
      ctx.lineJoin = 'round';
      strokeRuns(runs[0], mixColor(P.fg, P.bg, 0.86));
      drawParts(parts[0]);
      ctx.fillStyle = P.fg; circle(ctx, cx, cy, 8 * u); ctx.fill();
      strokeRuns(runs[1], mixColor(P.fg, P.bg, 0.66));
      drawParts(parts[1]);
    },
  });

  // 24 Spiral Out: three arms of dots stream from the centre, curling as they travel, growing, then dissolving.
  tile('sh.spiral-out', {
    name: 'Spiral Out',
    draw(ctx, w, h, t, P) {
      const u = h / 100, cx = w / 2, cy = h / 2;
      const ARMS = 3, EV = 96, DT = 12 / EV, LIFE = 3.0, TURN = (TAU * 3) / EV, CURL = 0.3;
      const R = 33 * u;
      for (let j = 0; j < ARMS; j++) {
        ctx.fillStyle = j === 0 ? P.fg2 : P.fg;
        ctx.beginPath();
        for (let e = 0; e < EV; e++) {
          const a = mod(t - e * DT, 12);
          if (a > LIFE) continue;
          const k = a / LIFE;
          const r = R * Math.pow(k, 1.1);
          const ang = e * TURN + CURL * a + (j * TAU) / ARMS;
          const size = lerp(0.5, 2.8, k) * u * (1 - ease.inCubic(win(k, 0.68, 1)));
          dot(ctx, cx + Math.cos(ang) * r, cy + Math.sin(ang) * r, size);
        }
        ctx.fill();
      }
    },
  });
})();
