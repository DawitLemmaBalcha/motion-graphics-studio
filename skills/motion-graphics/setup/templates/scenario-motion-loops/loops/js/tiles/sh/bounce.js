// Page "Bounce" (sh 09-16): weight, timing and elasticity. Orange accent.
// Every tile is a pure function of t; cycles are 1.5, 2, 3 or 6 s so the 12 s loop closes.
(function () {
  const { TAU, clamp, lerp, phase, win, ease, rgba, smoothstep, mod } = M;
  const PI = Math.PI;
  const spring = ease.spring;

  // Damped oscillation starting at 0: the after-shake of an impact.
  const shake = (tau, freq, decay) => (tau <= 0 ? 0 : Math.exp(-tau / decay) * Math.sin(TAU * freq * tau));
  // Same, but guaranteed to be exactly 0 from `end` on, so a cycle closes cleanly.
  const settle = (tau, freq, decay, end) => shake(tau, freq, decay) * (1 - smoothstep(end * 0.7, end, tau));
  const ellipse = (ctx, x, y, rx, ry) => { ctx.beginPath(); ctx.ellipse(x, y, Math.max(0, rx), Math.max(0, ry), 0, 0, TAU); };
  // Contact shadow: a darker pool on light and accent tiles, a faint lit pool on dark ones.
  const shadowCol = (P, a) => (P.bg === P.paper || P.bg === P.accent ? rgba(P.ink, a) : rgba(P.paper, a * 0.75));

  // 09 Bounce Drop: the ball winds up, leaps out of frame, drops back in and bounces down to rest.
  tile('sh.bounce-drop', {
    name: 'Bounce Drop',
    draw(ctx, w, h, t, P) {
      const u = h / 100, cx = w / 2;
      const rb = 10.5 * u, ground = 82 * u;
      const s = phase(t, 3) * 3;
      const T0 = 0.4, H0 = 88, g = (2 * H0) / (T0 * T0), v0 = g * T0, e = 0.5; // heights in u, time in s
      let y = 0, sy = 1;
      if (s < 0.4) {
        // wind-up squash, then a fast release into stretch
        sy = s < 0.32 ? 1 - 0.3 * ease.inOutSine(win(s, 0.02, 0.32)) : lerp(0.7, 1.28, ease.inQuad(win(s, 0.32, 0.4)));
      } else {
        let t0 = 0.4, v = v0;
        for (;;) {
          const fd = (2 * v) / g;
          if (s < t0 + fd) {
            const tau = s - t0, vel = v - g * tau;
            y = v * tau - 0.5 * g * tau * tau;
            sy = 1 + 0.28 * (Math.abs(vel) / v0) * smoothstep(0, 2.5, y);
            break;
          }
          t0 += fd;
          const cd = 0.045 + 0.06 * (v / v0); // contact time: harder hits squash longer
          if (s < t0 + cd) { sy = 1 - 0.42 * Math.pow(v / v0, 0.7) * Math.sin((PI * (s - t0)) / cd); break; }
          t0 += cd; v *= e;
          if (v < 0.07 * v0) { sy = 1 + 0.05 * settle(s - t0, 4, 0.1, 0.5); break; }
        }
      }
      const sx = 1 / Math.pow(sy, 0.75);
      const hn = clamp(y / 70);
      ctx.fillStyle = shadowCol(P, 0.26 * (1 - 0.8 * hn));
      ellipse(ctx, cx, ground + 0.7 * u, rb * 1.15 * sx * (1 - 0.45 * hn), 1.9 * u * (1 - 0.3 * hn)); ctx.fill();
      ctx.fillStyle = P.fg;
      ellipse(ctx, cx, ground - y * u - rb * sy, rb * sx, rb * sy); ctx.fill();
    },
  });

  // 10 Squash & Stretch: hop, hop, then a big jump with a front flip. Every take-off and landing is acted.
  tile('sh.squash-stretch', {
    name: 'Squash & Stretch',
    draw(ctx, w, h, t, P) {
      const u = h / 100, cx = w / 2, ground = 80 * u, B = 30 * u;
      const s = phase(t, 6) * 6;
      // [start, wind-up start, launch, squash depth, flight time, height, flip, landing strength, segment end]
      const J = s < 1.5 ? [0, 0.1, 0.38, 0.2, 0.46, 12, 0, 0.55, 1.5]
        : s < 3 ? [1.5, 1.6, 1.88, 0.22, 0.48, 13, 0, 0.6, 3]
        : [3, 3.25, 3.85, 0.36, 0.86, 44, 1, 1, 6];
      const [, tA, tL, depth, Tf, H, flip, land, end] = J;
      const tO = tL + 0.07, tLand = tO + Tf;
      let y = 0, sy = 1, rot = 0;
      if (s < tL) sy = 1 - depth * ease.inOutCubic(win(s, tA, tL));
      else if (s < tO) sy = lerp(1 - depth, 1.3, ease.inQuad(win(s, tL, tO)));
      else if (s < tLand) {
        const x = (s - tO) / Tf;
        y = 4 * H * x * (1 - x);
        sy = 1 + 0.3 * Math.abs(1 - 2 * x) * smoothstep(0, 3, y);
        if (flip) rot = TAU * ease.inOutCubic(win(x, 0.1, 0.9));
      } else {
        const l = s - tLand;
        sy = 1 - 0.95 * land * Math.exp(-l / 0.13) * Math.sin(TAU * 2.2 * l) * (1 - smoothstep((end - tLand) * 0.6, end - tLand, l));
      }
      const sx = 1 + (1 - sy) * 0.8;
      const hn = clamp(y / 45);
      ctx.fillStyle = shadowCol(P, 0.2 * (1 - 0.7 * hn));
      ellipse(ctx, cx, ground + 0.7 * u, B * 0.62 * sx * (1 - 0.4 * hn), 2 * u * (1 - 0.3 * hn)); ctx.fill();
      const bh = B * sy, bw = B * sx;
      ctx.save();
      ctx.translate(cx, ground - y * u - bh / 2); ctx.rotate(rot);
      ctx.fillStyle = P.fg;
      M.roundRect(ctx, -bw / 2, -bh / 2, bw, bh, 6 * u); ctx.fill();
      ctx.restore();
    },
  });

  // 11 Elastic Pop: a seed dot springs in, the shape blooms around it with a jelly wobble, holds,
  // and they pop out in turn. Four shapes, one per beat.
  tile('sh.elastic-pop', {
    name: 'Elastic Pop',
    draw(ctx, w, h, t, P) {
      const u = h / 100, cx = w / 2, cy = h / 2;
      const per = 3, s = phase(t, per) * per, kind = Math.floor(t / per) % 4;
      const popIn = (a, b, z, f) => spring(win(s, a, b), z, f);
      const popOut = (a, b, c) => (s < b ? 1 + 0.12 * ease.outQuad(win(s, a, b)) : 1.12 * (1 - ease.inBack(win(s, b, c), 2.2)));
      const shape = Math.max(0, s < 2.25 ? popIn(0.08, 1.0, 0.42, 1.7) : popOut(2.25, 2.43, 2.59));
      const dot = Math.max(0, s < 2.53 ? popIn(0.0, 0.75, 0.4, 1.9) : popOut(2.53, 2.65, 2.77));
      const jig = 0.09 * settle(s - 0.12, 3, 0.2, 1.4);
      const breathe = 1 + 0.015 * Math.sin(PI * win(s, 1.0, 2.25));
      const spin = [0, -0.5, 0.6, -0.4][kind] * (1 - spring(win(s, 0.08, 1.0), 0.45, 1.5));
      if (shape > 0) {
        ctx.save();
        ctx.translate(cx, cy); ctx.rotate(spin);
        ctx.scale(shape * breathe * (1 + jig), shape * breathe * (1 - jig));
        ctx.fillStyle = P.fg; ctx.strokeStyle = P.fg; ctx.lineJoin = 'round';
        if (kind === 0) { M.circle(ctx, 0, 0, 19.5 * u); ctx.fill(); }
        else if (kind === 1) { M.roundRect(ctx, -17 * u, -17 * u, 34 * u, 34 * u, 7 * u); ctx.fill(); }
        else if (kind === 2) { M.poly(ctx, 0, 3 * u, 20 * u, 3); ctx.lineWidth = 7 * u; ctx.fill(); ctx.stroke(); }
        else { M.roundRect(ctx, -25 * u, -13.5 * u, 50 * u, 27 * u, 13.5 * u); ctx.fill(); }
        ctx.restore();
      }
      if (dot > 0) { ctx.fillStyle = P.fg2; M.circle(ctx, cx, cy + (kind === 2 ? 4 * u : 0), 6.5 * u * dot); ctx.fill(); }
    },
  });

  // 12 Newton's Cradle: five balls; the outer two trade a pendulum swing and the middle three pass the knock.
  tile('sh.pendulum', {
    name: "Newton's Cradle",
    draw(ctx, w, h, t, P) {
      const u = h / 100, cx = w / 2;
      const rb = 7.4 * u, L = 44 * u, top = 21 * u, n = 5, amp = 0.5;
      const T = 2, s = phase(t, T) * T, half = T / 2;
      // each outer ball goes out and back in half a period: a small-angle pendulum, so it hangs at the top
      const thL = s < half ? -amp * Math.sin((PI * s) / half) : 0;
      const thR = s >= half ? amp * Math.sin((PI * (s - half)) / half) : 0;
      const since = s < half ? s : s - half;
      const knock = 0.4 * u * shake(since, 9, 0.05) * (s < half ? -1 : 1);
      ctx.lineCap = 'round';
      ctx.strokeStyle = rgba(P.fg2, 0.85); ctx.lineWidth = 1 * u;
      ctx.beginPath(); ctx.moveTo(cx - (n - 1) * rb - 9 * u, top); ctx.lineTo(cx + (n - 1) * rb + 9 * u, top); ctx.stroke();
      const balls = [];
      for (let i = 0; i < n; i++) {
        const px = cx + (i - (n - 1) / 2) * 2 * rb;
        const th = i === 0 ? thL : i === n - 1 ? thR : 0;
        const jx = i > 0 && i < n - 1 ? knock * (1 - Math.abs(i - 2) * 0.3) : 0;
        balls.push([px, px + Math.sin(th) * L + jx, top + Math.cos(th) * L]);
      }
      ctx.strokeStyle = rgba(P.fg2, 0.55); ctx.lineWidth = 0.45 * u;
      ctx.beginPath();
      for (const [px, x, y] of balls) { ctx.moveTo(px, top); ctx.lineTo(x, y); }
      ctx.stroke();
      ctx.fillStyle = P.fg;
      for (const [, x, y] of balls) { M.circle(ctx, x, y, rb); ctx.fill(); }
    },
  });

  // 13 Jelly Wobble: a ball smacks the jelly from one side, then the other; it dents, sways and settles.
  tile('sh.jelly-wobble', {
    name: 'Jelly Wobble',
    draw(ctx, w, h, t, P) {
      const u = h / 100, cx = w / 2, base = 78 * u, W = 36 * u, H = 32 * u, cr = 7 * u;
      const hits = [];
      for (let k = -2; k < 7; k++) hits.push([k * 2 + 1.0, mod(k, 2) ? -1 : 1]); // every 2 s, alternating sides (+1 = pushed right)
      let shear = 0, bend = 0, vert = 0, dent = 0, dentSide = 1, slide = 0;
      for (const [th, dir] of hits) {
        const tau = t - th;
        if (tau <= 0 || tau > 4) continue;
        shear += dir * 0.3 * shake(tau, 1.5, 0.75);
        bend += dir * 0.09 * shake(tau, 3.1, 0.35);
        vert += -0.11 * shake(tau, 2.3, 0.5);
        slide += dir * 2.6 * u * Math.exp(-tau / 0.45) * (1 - Math.exp(-tau / 0.04));
        const d = Math.exp(-tau / 0.1) * (1 - Math.exp(-tau / 0.015));
        if (d > dent) { dent = d; dentSide = -dir; }
      }
      // rounded-rect outline, then deform every point
      const pts = [];
      const edge = (x0, y0, x1, y1, n) => { for (let i = 0; i < n; i++) pts.push([lerp(x0, x1, i / n), lerp(y0, y1, i / n)]); };
      const arc = (ox, oy, a0) => { for (let i = 0; i < 8; i++) { const a = a0 + (i / 8) * (PI / 2); pts.push([ox + Math.cos(a) * cr, oy + Math.sin(a) * cr]); } };
      const x0 = -W / 2, x1 = W / 2, y0 = -H, y1 = 0;
      edge(x0 + cr, y0, x1 - cr, y0, 14); arc(x1 - cr, y0 + cr, -PI / 2);
      edge(x1, y0 + cr, x1, y1 - cr, 16); arc(x1 - cr, y1 - cr, 0);
      edge(x1 - cr, y1, x0 + cr, y1, 14); arc(x0 + cr, y1 - cr, PI / 2);
      edge(x0, y1 - cr, x0, y0 + cr, 16); arc(x0 + cr, y0 + cr, PI);
      ctx.fillStyle = shadowCol(P, 0.18);
      ellipse(ctx, cx + slide * 0.4, base + 0.7 * u, W * 0.62, 1.8 * u); ctx.fill();
      ctx.beginPath();
      pts.forEach(([x, y], i) => {
        const Y = -y / H; // 0 bottom .. 1 top
        let X = x * (1 - vert * (0.3 + 0.7 * Y));
        X += shear * H * Y * Y + bend * H * Math.sin(PI * Y);
        const side = Math.sign(x) === dentSide ? smoothstep(0.4, 1, Math.abs(x) / (W / 2)) : 0;
        X -= dentSide * dent * 6 * u * side * Math.exp(-Math.pow((Y - 0.5) / 0.3, 2));
        const px = cx + slide * (0.4 + 0.6 * Y) + X, py = base + y * (1 + vert);
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      });
      ctx.closePath();
      ctx.fillStyle = P.fg; ctx.fill();
      // the striker: flies in fast on a shallow arc, rebounds and drops away out of frame
      const rb = 5 * u, contactY = base - H * 0.5;
      for (const [th, dir] of hits) {
        const tau = t - th;
        if (tau < -0.3 || tau > 0.7) continue;
        const side = -dir, xc = cx + side * (W / 2 + rb);
        let x, y;
        if (tau < 0) { const k = -tau / 0.3; x = xc + side * k * (w * 0.5); y = contactY - 10 * u * k + 12 * u * k * k; }
        else { const k = tau / 0.7; x = xc + side * k * (w * 0.3); y = contactY - 12 * u * k + 70 * u * k * k; }
        ctx.fillStyle = P.fg2; M.circle(ctx, x, y, rb); ctx.fill();
      }
    },
  });

  // 14 Spin Snap: a leaf shape winds back, snaps a quarter turn, overshoots and settles. Two beats, then a rest.
  tile('sh.spin-snap', {
    name: 'Spin Snap',
    draw(ctx, w, h, t, P) {
      const u = h / 100, cx = w / 2, cy = h / 2, a = 38 * u;
      const per = 1.5, s = phase(t, per) * per, cyc = Math.floor(t / per);
      const snap = (tau) => {
        if (tau <= 0) return 0;
        if (tau < 0.17) return -0.14 * ease.inOutSine(tau / 0.17);
        return lerp(-0.14, 1, spring(win(tau, 0.17, 0.64), 0.5, 1.9));
      };
      const q = snap(s) + snap(s - 0.5);
      const pinch = (tau) => 0.06 * Math.sin(PI * clamp(tau / 0.22));
      const sc = 1 - pinch(s) - pinch(s - 0.5);
      ctx.save();
      ctx.translate(cx, cy); ctx.rotate((PI / 2) * (cyc * 2 + q)); ctx.scale(sc, sc);
      ctx.fillStyle = P.fg;
      ctx.beginPath(); ctx.roundRect(-a / 2, -a / 2, a, a, [a / 2, 0.08 * a, a / 2, 0.08 * a]); ctx.fill();
      ctx.restore();
    },
  });

  // 15 Slide Through: a capsule shoots in, brakes past its mark and settles back, waits, winds back
  // and shoots out as the next one arrives. Stretch comes from speed, squash from braking.
  tile('sh.slide-through', {
    name: 'Slide Through',
    draw(ctx, w, h, t, P) {
      const u = h / 100, cx = w / 2, cy = h / 2, R = 13 * u;
      const per = 2, lead = 0.15, D = w / 2 + 4 * R;
      const xAt = (tau) => { // tau: time since this capsule set off
        if (tau < 0.8) return cx - D * Math.exp(-tau / 0.12) * Math.cos(TAU * 1.45 * tau) * (1 - smoothstep(0.55, 0.8, tau));
        if (tau < 1.48) return cx - 4 * u * ease.inOutSine(win(tau, 1.2, 1.48));
        return lerp(cx - 4 * u, cx + D, ease.inQuart(win(tau, 1.48, 1.9)));
      };
      // a new capsule sets off every 2 s; the last one is just leaving as the next arrives
      const cyc = Math.floor((t + lead) / per);
      for (const c of [cyc - 1, cyc]) {
        const tt = t + lead - c * per;
        if (tt < 0 || tt > 1.95) continue;
        const dt = 1 / 240, x = xAt(tt), v = (xAt(tt + dt) - xAt(tt - dt)) / (2 * dt);
        const acc = (xAt(tt + dt) - 2 * x + xAt(tt - dt)) / (dt * dt);
        const stretch = clamp(Math.abs(v) / (h * 4.2), 0, 1.3);
        const brake = v * acc < 0 ? clamp(Math.abs(acc) / (h * 160), 0, 0.24) : 0;
        const sx = 1 + stretch - brake, sy = 1 / Math.sqrt(sx);
        ctx.fillStyle = mod(c, 2) ? P.fg2 : P.fg;
        const bw = 2 * R * sx, bh = 2 * R * sy;
        M.roundRect(ctx, x - bw / 2, cy - bh / 2, bw, bh, bh / 2); ctx.fill();
      }
    },
  });

  // 16 Heartbeat: lub-dub. A sharp beat and a softer echo, each sending out a ripple of the heart.
  tile('sh.heartbeat', {
    name: 'Heartbeat',
    draw(ctx, w, h, t, P) {
      const u = h / 100, cx = w / 2, cy = h / 2, d = 16.5 * u;
      const per = 1.5, s = phase(t, per) * per;
      // Geometric heart: a square on its corner plus two half-discs on its upper edges.
      const heart = (sc) => {
        const k = d * sc, oy = 0.1 * k;
        ctx.beginPath();
        ctx.moveTo(0, k + oy);
        ctx.lineTo(-k, oy);
        ctx.arc(-k / 2, -k / 2 + oy, k / Math.SQRT2, (3 * PI) / 4, (7 * PI) / 4, false);
        ctx.arc(k / 2, -k / 2 + oy, k / Math.SQRT2, (5 * PI) / 4, (9 * PI) / 4, false);
        ctx.closePath();
      };
      const beat = (tau, amp, rise, fall) => (tau < 0 ? 0 : tau < rise ? amp * ease.outCubic(tau / rise) : amp * (1 - ease.inOutSine(clamp((tau - rise) / fall))));
      const pre = -0.035 * Math.sin(PI * win(s, 1.3, 1.5));
      const sc = 1 + pre + beat(s, 0.17, 0.07, 0.16) + beat(s - 0.24, 0.1, 0.06, 0.2) - 0.025 * settle(s - 0.5, 2.5, 0.15, 0.75);
      ctx.save(); ctx.translate(cx, cy);
      ctx.lineJoin = 'round';
      for (const [t0, a0, grow, lw] of [[0.02, 1, 0.75, 2.1], [0.26, 0.6, 0.5, 1.5]]) {
        const k = win(s, t0, t0 + 0.95);
        if (k <= 0 || k >= 1) continue;
        heart(1.15 + grow * ease.outQuart(k));
        ctx.strokeStyle = rgba(P.fg, a0 * Math.pow(1 - k, 2));
        ctx.lineWidth = lerp(lw, 0.3, k) * u;
        ctx.stroke();
      }
      heart(sc);
      ctx.fillStyle = P.fg; ctx.strokeStyle = P.fg; ctx.lineWidth = 2 * u;
      ctx.fill(); ctx.stroke();
      ctx.restore();
    },
  });
})();
