// Page "Depth" (bg 01-08). Reference implementations: these set the bar for every other tile.
(function () {
  const { TAU, clamp, lerp, phase, ease, rand, rgba, smoothstep, proj, rotX, rotY, mod } = M;

  // 01 Perspective Floor: an endless grid floor and ceiling streaming toward the camera.
  tile('bg.perspective-floor', {
    name: 'Perspective Floor',
    draw(ctx, w, h, t, P) {
      const u = h / 100, cx = w / 2, cy = h * 0.5, f = h * 0.55;
      const p = phase(t, 1.5);
      const zNear = 0.35, zFar = 26;
      for (const side of [1, -1]) {
        const eye = side * 1; // floor below, ceiling above
        // Rows streaming toward the camera.
        for (let k = 0; k < 60; k++) {
          const z = k + 1 - p;
          if (z < zNear || z > zFar) continue;
          const y = cy + (f * eye) / z;
          const a = (1 - smoothstep(2.5, 9, z)) * clamp((z - zNear) * 3);
          ctx.strokeStyle = rgba(P.fg, a);
          ctx.lineWidth = Math.max(0.06 * u, (0.55 * u) / Math.sqrt(z));
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
        }
        // Converging columns: drawn in short depth segments so they fade into the horizon.
        const span = Math.ceil((w / 2) / ((f * 1) / zNear)) + 18;
        for (let i = -span; i <= span; i++) {
          const x = i * 1;
          let zPrev = zNear;
          for (let s = 1; s <= 24; s++) {
            const z = zNear * Math.pow(zFar / zNear, s / 24);
            const [x0, y0] = proj(x, -eye, zPrev, f, cx, cy);
            const [x1, y1] = proj(x, -eye, z, f, cx, cy);
            const a = 1 - smoothstep(2.5, 11, (zPrev + z) / 2);
            ctx.strokeStyle = rgba(P.fg, a);
            ctx.lineWidth = Math.max(0.06 * u, (0.55 * u) / Math.sqrt(zPrev));
            ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
            zPrev = z;
          }
        }
      }
      // Horizon glow.
      const g = ctx.createLinearGradient(0, cy - 14 * u, 0, cy + 14 * u);
      g.addColorStop(0, rgba(P.bg, 0)); g.addColorStop(0.5, rgba(P.bg, 1)); g.addColorStop(1, rgba(P.bg, 0));
      ctx.fillStyle = g; ctx.fillRect(0, cy - 14 * u, w, 28 * u);
      ctx.fillStyle = rgba(P.fg2, 0.9); ctx.fillRect(0, cy - 0.12 * u, w, 0.24 * u);
    },
  });

  // 02 Grid Tunnel: rectangular frames rushing past, walls ruled with depth lines.
  tile('bg.grid-tunnel', {
    name: 'Grid Tunnel',
    draw(ctx, w, h, t, P) {
      const u = h / 100;
      const sway = 0; // keep the vanishing point centred: steadier, more usable as a background
      const cx = w / 2 + sway, cy = h / 2, f = h * 0.5;
      const RX = (w / h) * 1.0, RY = 1.0; // tunnel cross-section matches the frame
      const p = phase(t, 2);
      const zNear = 0.5, zFar = 22;
      // Frames.
      for (let k = 0; k < 40; k++) {
        const z = (k + 1 - p) * 0.75;
        if (z < zNear * 0.6 || z > zFar) continue;
        const sx = (f * RX) / z, sy = (f * RY) / z;
        const a = (1 - smoothstep(5, zFar, z)) * clamp((z - zNear * 0.6) * 2);
        ctx.strokeStyle = rgba(P.fg, a);
        ctx.lineWidth = Math.max(0.06 * u, (0.6 * u) / Math.sqrt(z));
        ctx.strokeRect(cx - sx, cy - sy, sx * 2, sy * 2);
      }
      // Longitudinal wall lines.
      const lines = [];
      const nx = 8, ny = 5;
      for (let i = 0; i <= nx; i++) { const x = lerp(-RX, RX, i / nx); lines.push([x, RY], [x, -RY]); }
      for (let j = 1; j < ny; j++) { const y = lerp(-RY, RY, j / ny); lines.push([RX, y], [-RX, y]); }
      for (const [x, y] of lines) {
        let zPrev = zNear * 0.6;
        for (let s = 1; s <= 20; s++) {
          const z = zPrev * Math.pow(zFar / (zNear * 0.6), 1 / 20);
          const [x0, y0] = proj(x, y, zPrev, f, cx, cy), [x1, y1] = proj(x, y, z, f, cx, cy);
          ctx.strokeStyle = rgba(P.fg, 1 - smoothstep(5, zFar, (z + zPrev) / 2));
          ctx.lineWidth = Math.max(0.06 * u, (0.6 * u) / Math.sqrt(zPrev));
          ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
          zPrev = z;
        }
      }
      // Soft core at the vanishing point.
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 16 * u);
      g.addColorStop(0, rgba(P.bg, 1)); g.addColorStop(1, rgba(P.bg, 0));
      ctx.fillStyle = g; ctx.fillRect(cx - 16 * u, cy - 16 * u, 32 * u, 32 * u);
    },
  });

  // 03 Wave Ridges: hidden-line ridgelines (the "Unknown Pleasures" plot), swells rolling forward.
  tile('bg.wave-mesh', {
    name: 'Wave Ridges',
    draw(ctx, w, h, t, P) {
      const u = h / 100;
      const rows = 30, cols = 140;
      const top = h * 0.16, bottom = h * 1.04;
      ctx.lineJoin = 'round';
      for (let j = 0; j < rows; j++) {
        const k = j / (rows - 1);              // 0 = far, 1 = near
        const yb = lerp(top, bottom, Math.pow(k, 1.35));
        const amp = lerp(4, 13, k) * u;
        const pts = [];
        for (let i = 0; i <= cols; i++) {
          const x = (i / cols) * w;
          const xn = x / h;                     // aspect-independent coordinate
          const env = Math.exp(-Math.pow((x - w / 2) / (w * 0.26), 2));
          const v =
            0.55 * Math.sin(xn * 6.1 + j * 0.55 - TAU * (t / 3)) +
            0.3 * Math.sin(xn * 11.3 - j * 0.31 - TAU * (t / 2) + 1.7) +
            0.15 * Math.sin(xn * 19.7 + j * 0.9 - TAU * (t / 1.5) + 0.4);
          pts.push([x, yb - amp * (0.12 + env * (0.65 + 0.35 * v)) - amp * 0.25 * env * v]);
        }
        // Occlude the rows behind, then stroke.
        ctx.beginPath(); ctx.moveTo(0, h + 2);
        for (const [x, y] of pts) ctx.lineTo(x, y);
        ctx.lineTo(w, h + 2); ctx.closePath();
        ctx.fillStyle = P.bg; ctx.fill();
        ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
        ctx.strokeStyle = rgba(P.fg, lerp(0.55, 1, k));
        ctx.lineWidth = lerp(0.22, 0.42, k) * u;
        ctx.stroke();
      }
    },
  });

  // 04 Dot Tunnel: rings of dots spiralling toward the camera.
  tile('bg.dot-tunnel', {
    name: 'Dot Tunnel',
    draw(ctx, w, h, t, P) {
      const u = h / 100, cx = w / 2, cy = h / 2, f = h * 0.5;
      const p = phase(t, 1);
      const N = 30, R = 1.6, zN = 0.35, zF = 16;
      const spin = (TAU / N) * (t / 12) * 4; // four dot-steps per loop
      const items = [];
      for (let k = 0; k < 60; k++) {
        const z = (k + 1 - p) * 0.45;
        if (z < zN || z > zF) continue;
        const twist = z * 0.32;
        for (let n = 0; n < N; n++) {
          const a = (n / N) * TAU + twist + spin;
          const [x, y, s] = proj(Math.cos(a) * R, Math.sin(a) * R, z, f, cx, cy);
          items.push([x, y, s, z]);
        }
      }
      items.sort((A, B) => B[3] - A[3]);
      for (const [x, y, s, z] of items) {
        const a = (1 - smoothstep(zF * 0.4, zF, z)) * smoothstep(zN, 1.1, z);
        ctx.fillStyle = rgba(P.fg, a);
        M.circle(ctx, x, y, 0.05 * s); ctx.fill();
      }
    },
  });

  // 05 Infinite Zoom: nested rotating squares, an endless dive.
  tile('bg.infinite-zoom', {
    name: 'Infinite Zoom',
    draw(ctx, w, h, t, P) {
      const cx = w / 2, cy = h / 2;
      const period = 2, p = phase(t, period), cycle = Math.floor(t / period);
      const r = 0.78, rot = 0.22;
      const base = Math.hypot(w, h) * 0.75;
      for (let k = -2; k < 26; k++) {
        const e = k - p;
        const s = base * Math.pow(r, e);
        if (s < 1) break;
        const n = k + cycle; // world index, keeps colours continuous
        ctx.save();
        ctx.translate(cx, cy); ctx.rotate(e * rot);
        ctx.fillStyle = mod(n, 2) ? P.fg : P.bg;
        ctx.fillRect(-s / 2, -s / 2, s, s);
        ctx.restore();
      }
    },
  });

  // 06 Warp Stars: hyperspace streaks from a single vanishing point.
  tile('bg.warp-stars', {
    name: 'Warp Stars',
    draw(ctx, w, h, t, P) {
      const u = h / 100, cx = w / 2, cy = h / 2, f = h * 0.6;
      const zN = 0.2, zF = 10;
      const periods = [1, 1.5, 2, 3];
      ctx.lineCap = 'round';
      for (let i = 0; i < 320; i++) {
        const a = rand(i, 1) * TAU;
        const R = lerp(0.25, 1.4, Math.sqrt(rand(i, 2))) * (w / h);
        const per = periods[Math.floor(rand(i, 3) * 4)];
        const k = phase(t, per, rand(i, 4) * per);
        const z = lerp(zF, zN, ease.inQuad(k));
        const trail = 0.9 * (1 - k * 0.4);
        const [x0, y0] = proj(Math.cos(a) * R, Math.sin(a) * R, z, f, cx, cy);
        const [x1, y1] = proj(Math.cos(a) * R, Math.sin(a) * R, z + trail, f, cx, cy);
        const alpha = smoothstep(0, 0.25, k) * (i % 7 === 0 ? 1 : 0.75);
        ctx.strokeStyle = rgba(i % 7 === 0 ? P.fg2 : P.fg, alpha);
        ctx.lineWidth = Math.max(0.18 * u, (0.5 * u) / z);
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x0, y0); ctx.stroke();
      }
    },
  });

  // 07 Isometric Cubes: the tumbling-blocks tiling, cubes lifting in a diagonal wave.
  tile('bg.iso-cubes', {
    name: 'Isometric Cubes',
    draw(ctx, w, h, t, P) {
      const u = h / 100;
      const s = 9 * u;                     // half-width of a cube
      const q = s * Math.tan(Math.PI / 6); // quarter of the hexagon height
      let cTop, cLeft, cRight, edge;
      if (P.bg === P.paper) { cTop = P.paper; cLeft = M.mixColor(P.paper, P.ink, 0.12); cRight = M.mixColor(P.paper, P.ink, 0.28); edge = rgba(P.ink, 0.55); }
      else if (P.bg === P.accent) { cTop = P.paper; cLeft = P.accent; cRight = M.mixColor(P.accent, P.ink, 0.38); edge = rgba(P.ink, 0.3); }
      else { cTop = P.accent; cLeft = M.mixColor(P.accent, P.bg, 0.5); cRight = M.mixColor(P.accent, P.bg, 0.76); edge = rgba(P.bg, 0.35); }
      const rows = Math.ceil(h / (3 * q)) + 3, cols = Math.ceil(w / (2 * s)) + 2;
      const face = (pts, fill) => {
        ctx.beginPath(); pts.forEach(([a, b], n) => (n ? ctx.lineTo(a, b) : ctx.moveTo(a, b))); ctx.closePath();
        ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = edge; ctx.lineWidth = 0.16 * u; ctx.stroke();
      };
      for (let j = -2; j < rows; j++) {
        for (let i = -1; i < cols; i++) {
          const x = i * 2 * s + (M.mod(j, 2) ? s : 0), y0 = j * 3 * q;
          const k = 0.5 + 0.5 * Math.sin(TAU * (t / 4) - (x / w) * 5 - (y0 / h) * 3);
          const y = y0 - ease.inOutCubic(k) * 1.5 * q;
          const drop = y0 - y + 2 * q; // extend the sides down so a lifted cube stands on a column
          face([[x - s, y - q], [x, y], [x, y + 2 * q + drop], [x - s, y + q + drop]], cLeft);
          face([[x + s, y - q], [x, y], [x, y + 2 * q + drop], [x + s, y + q + drop]], cRight);
          face([[x, y - 2 * q], [x + s, y - q], [x, y], [x - s, y - q]], cTop);
        }
      }
    },
  });

  // 08 Gyro Rings: an armillary sphere of rings turning on different axes.
  tile('bg.tilted-rings', {
    name: 'Gyro Rings',
    draw(ctx, w, h, t, P) {
      const u = h / 100, cx = w / 2, cy = h / 2, f = h * 1.3, D = 4.2;
      const T = TAU * (t / 12);
      const rings = [
        { r: 1.5, ax: T, ay: 0.5, c: P.fg },
        { r: 1.5, ax: 1.2, ay: T, c: P.fg },
        { r: 1.5, ax: -T + 0.7, ay: -T + 2.1, c: P.fg2 },
        { r: 1.15, ax: 2 * T, ay: 0.9, c: P.fg },
        { r: 1.15, ax: 0.4, ay: -2 * T + 1, c: P.fg },
        { r: 0.8, ax: -2 * T, ay: T + 0.3, c: P.fg2 },
        { r: 0.8, ax: T + 1.6, ay: 2 * T, c: P.fg },
      ];
      const segs = [];
      for (const R of rings) {
        const N = 160; let prev = null;
        for (let i = 0; i <= N; i++) {
          const a = (i / N) * TAU;
          let v = [Math.cos(a) * R.r, Math.sin(a) * R.r, 0];
          v = rotX(v, R.ax); v = rotY(v, R.ay);
          const pp = proj(v[0], v[1], v[2] + D, f, cx, cy);
          if (prev) segs.push([prev, pp, v[2], R.c]);
          prev = pp;
        }
      }
      segs.sort((A, B) => B[2] - A[2]);
      ctx.lineCap = 'round';
      for (const [a, b, z, c] of segs) {
        const k = clamp(0.5 - z / 3);
        ctx.strokeStyle = rgba(c, lerp(0.2, 1, k));
        ctx.lineWidth = lerp(0.45, 1.25, k) * u;
        ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
      }
      ctx.fillStyle = P.fg2; M.circle(ctx, cx, cy, 1.4 * u); ctx.fill();
    },
  });
})();
