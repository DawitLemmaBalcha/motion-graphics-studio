// Motion Loops: builds the gallery from SETS/TILES, draws only the tiles on screen,
// and opens any loop with its standalone code (window.SNIPPETS) to copy or download.
(function () {
  const PACKS = { bg: { label: 'Backgrounds', id: 'pack-backgrounds' }, sh: { label: 'Shape animations', id: 'pack-shapes' } };
  const T = { card: '#161616', ink: '#0F0F0F', paper: '#F2EFE9' };
  const FPS = 30;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Same palette rules as the video engine, so the page matches the copied code.
  function palette(accent, tone) {
    const P = { accent, accent2: accent, paper: T.paper, ink: T.ink };
    if (tone === 'accent') Object.assign(P, { bg: accent, fg: T.ink, fg2: T.paper, mid: M.mixColor(accent, T.ink, 0.35) });
    else if (tone === 'light') Object.assign(P, { bg: T.paper, fg: T.ink, fg2: accent, mid: M.mixColor(T.paper, T.ink, 0.25) });
    else Object.assign(P, { bg: T.card, fg: accent, fg2: T.paper, mid: M.mixColor(T.card, accent, 0.35) });
    return P;
  }
  const slug = (s) => s.replace(/'/g, '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const pad = (n) => String(n).padStart(2, '0');

  // ---------- Build ----------
  const items = [];
  const byId = {};
  for (const key of Object.keys(PACKS)) {
    const host = document.getElementById('pack-' + key);
    for (const page of SETS[key].pages) {
      const cat = document.createElement('section');
      cat.className = 'cat';
      cat.id = key + '-' + slug(page.name);
      cat.style.setProperty('--cat', page.accent);
      const last = page.first + page.tiles.length - 1;
      cat.innerHTML = `<div class="cat-head"><h2>${page.name}</h2><span>${pad(page.first)}-${pad(last)}</span></div><ul class="grid"></ul>`;
      const ul = cat.querySelector('ul');
      page.tiles.forEach((tl, i) => {
        const def = TILES[tl.id];
        if (!def) return;
        const n = page.first + i;
        const li = document.createElement('li');
        li.className = 'card';
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'tile';
        btn.id = `open-${key}-${pad(n)}-${slug(def.name)}`;
        btn.setAttribute('aria-label', `${def.name}: view and copy the code`);
        const canvas = document.createElement('canvas');
        canvas.setAttribute('aria-hidden', 'true');
        btn.appendChild(canvas);
        const meta = document.createElement('div');
        meta.className = 'meta';
        meta.innerHTML = `<span class="num">${pad(n)}</span><span class="name"></span>`;
        meta.querySelector('.name').textContent = def.name;
        li.append(btn, meta);
        ul.appendChild(li);
        const item = { id: tl.id, key, n, name: def.name, def, canvas, ctx: canvas.getContext('2d'), P: palette(page.accent, tl.tone), visible: false, w: 0, h: 0, dirty: true };
        items.push(item);
        byId[tl.id] = item;
        btn.addEventListener('click', () => openCode(item, btn));
      });
      host.appendChild(cat);
    }
  }

  // ---------- Hero mosaic: four loops, live, each opens its code ----------
  const HERO = ['bg.infinite-zoom', 'bg.bauhaus-grid', 'sh.pendulum', 'bg.halftone-wave'];
  const mosaic = document.querySelector('.hero-mosaic');
  for (const id of HERO) {
    const src = byId[id];
    if (!src || !mosaic) continue;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tile';
    btn.id = `hero-${src.key}-${pad(src.n)}-${slug(src.name)}`;
    btn.setAttribute('aria-label', `${src.name}: view and copy the code`);
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    btn.appendChild(canvas);
    mosaic.appendChild(btn);
    const item = Object.assign({}, src, { canvas, ctx: canvas.getContext('2d'), visible: false, w: 0, h: 0, dirty: true });
    items.push(item);
    btn.addEventListener('click', () => openCode(src, btn));
  }

  // ---------- Pack tabs and category jump links ----------
  const jump = document.querySelector('.jump');
  // The site counts every URL change as a pageview, so switching never rewrites the URL;
  // #shapes and #sh-<category> still deep-link on arrival.
  function showPack(key) {
    for (const k of Object.keys(PACKS)) {
      const tab = document.getElementById(PACKS[k].id);
      tab.setAttribute('aria-selected', String(k === key));
      tab.tabIndex = k === key ? 0 : -1;
      document.getElementById('pack-' + k).hidden = k !== key;
    }
    jump.innerHTML = '';
    for (const page of SETS[key].pages) {
      const a = document.createElement('a');
      a.href = '#' + key + '-' + slug(page.name);
      a.textContent = page.name;
      a.style.setProperty('--cat', page.accent);
      jump.appendChild(a);
    }
    items.forEach((it) => (it.dirty = true));
  }
  document.querySelectorAll('.pack-tab').forEach((tab) => {
    tab.addEventListener('click', () => showPack(tab.dataset.pack));
    tab.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const next = tab.dataset.pack === 'bg' ? 'sh' : 'bg';
      showPack(next);
      document.getElementById(PACKS[next].id).focus();
    });
  });
  function fromHash() {
    const h = location.hash.slice(1);
    // #how opens the dialog (wired below) over whichever pack is showing; on arrival the
    // gallery still needs its tabs and category links.
    if (h === 'how') { if (!jump.childElementCount) showPack('bg'); return; }
    showPack(h === 'shapes' || h.startsWith('sh-') ? 'sh' : 'bg');
    if (h.startsWith('bg-') || h.startsWith('sh-')) document.getElementById(h)?.scrollIntoView();
  }
  window.addEventListener('hashchange', fromHash);
  fromHash();

  // The importer adds <base href>, which would turn '#x' links into a reload that drops the
  // query string. Handle in-page links here: scroll only, and leave the URL alone (the site
  // counts URL changes as pageviews).
  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a || a.hasAttribute('data-how-open') || e.defaultPrevented) return;
    const id = a.getAttribute('href').slice(1);
    e.preventDefault();
    const el = id ? document.getElementById(id) : null;
    if (id === 'top' || !el) window.scrollTo({ top: 0, behavior: reduce.matches ? 'auto' : 'smooth' });
    else el.scrollIntoView({ behavior: reduce.matches ? 'auto' : 'smooth', block: 'start' });
  });

  // ---------- Visibility and sizing ----------
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) { const it = e.target.__item; it.visible = e.isIntersecting; it.dirty = true; }
  }, { rootMargin: '120px 0px' });
  const ro = new ResizeObserver((entries) => {
    for (const e of entries) {
      const it = e.target.__item; const r = e.contentRect;
      it.w = r.width; it.h = r.height; it.dirty = true;
    }
  });
  for (const it of items) { it.canvas.__item = it; io.observe(it.canvas); ro.observe(it.canvas); }

  function paint(ctx, canvas, w, h, def, P, t) {
    if (!w || !h) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const bw = Math.round(w * dpr), bh = Math.round(h * dpr);
    if (canvas.width !== bw || canvas.height !== bh) { canvas.width = bw; canvas.height = bh; }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = P.bg; ctx.fillRect(0, 0, w, h);
    ctx.save();
    try { def.draw(ctx, w, h, M.mod(t, M.LOOP), P); } catch (err) { console.error(def.id, err); }
    ctx.restore();
  }

  // ---------- Clock, pause, reduced motion ----------
  const toggle = document.getElementById('toggle-motion');
  let paused = reduce.matches;
  let t = paused ? 4 : 0, last = performance.now(), lastPaint = 0;
  function setPaused(p) {
    paused = p;
    toggle.setAttribute('aria-pressed', String(p));
    toggle.textContent = p ? 'Play all' : 'Pause all';
    items.forEach((it) => (it.dirty = true));
  }
  setPaused(paused);
  toggle.addEventListener('click', () => setPaused(!paused));

  const dialog = document.getElementById('code-view');
  const cv = { canvas: document.getElementById('cv-canvas'), item: null };
  cv.ctx = cv.canvas.getContext('2d');

  function frame(now) {
    requestAnimationFrame(frame);
    const dt = (now - last) / 1000; last = now;
    if (!paused && !document.hidden) t += Math.min(dt, 0.1);
    if (now - lastPaint < 1000 / FPS - 2) return;
    lastPaint = now;
    if (dialog.open && cv.item) {
      const r = cv.canvas.getBoundingClientRect();
      paint(cv.ctx, cv.canvas, r.width, r.height, cv.item.def, cv.item.P, t);
      return; // the grid is behind the dialog, so it rests
    }
    for (const it of items) {
      if (!it.visible) continue;
      if (paused && !it.dirty) continue;
      paint(it.ctx, it.canvas, it.w, it.h, it.def, it.P, t);
      it.dirty = false;
    }
  }
  requestAnimationFrame(frame);

  // ---------- Code view ----------
  const $ = (id) => document.getElementById(id);
  const status = $('cv-status');
  // The standalone code for all 80 loops is one 0.5 MB file: load it on first use (and on idle),
  // not with the page.
  let snippetsLoading = null;
  function loadSnippets() {
    if (window.SNIPPETS && Object.keys(window.SNIPPETS).length) return Promise.resolve();
    if (!snippetsLoading) {
      snippetsLoading = new Promise((resolve) => {
        const tag = document.createElement('script');
        tag.src = 'js/snippets.js';
        tag.onload = tag.onerror = () => resolve();
        document.body.appendChild(tag);
      });
    }
    return snippetsLoading;
  }
  (window.requestIdleCallback || ((f) => setTimeout(f, 2500)))(() => loadSnippets());

  function codeFor(it) {
    const s = window.SNIPPETS && window.SNIPPETS[it.id];
    if (s) return s;
    const html = `// ${it.name}\n` + it.def.draw.toString();
    return { html, file: `${it.key}-${pad(it.n)}-${slug(it.name)}.html`, lines: html.split('\n').length };
  }
  function showCode(it) {
    const s = codeFor(it);
    $('cv-meta').textContent = `${s.lines} lines, one HTML file`;
    $('cv-code').innerHTML = highlight(s.html);
  }
  function openCode(it, opener) {
    cv.item = it; cv.opener = opener;
    $('cv-kicker').textContent = `${PACKS[it.key].label} · ${pad(it.n)}`;
    $('cv-title').textContent = it.name;
    status.textContent = '';
    const ready = window.SNIPPETS && window.SNIPPETS[it.id];
    if (ready) showCode(it);
    else { $('cv-meta').textContent = ''; $('cv-code').textContent = 'Loading the code…'; loadSnippets().then(() => { if (cv.item === it) showCode(it); }); }
    dialog.showModal();
    dialog.focus({ preventScroll: true }); // start inside the dialog without ringing a button
    dialog.querySelector('.cv-pre').scrollTop = 0;
  }
  dialog.addEventListener('close', () => { items.forEach((it) => (it.dirty = true)); cv.opener?.focus(); });
  document.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => b.closest('dialog').close()));
  for (const d of document.querySelectorAll('dialog')) d.addEventListener('click', (e) => { if (e.target === d) d.close(); });

  $('copy-code').addEventListener('click', async () => {
    await loadSnippets();
    const text = codeFor(cv.item).html;
    let ok = false;
    try { await navigator.clipboard.writeText(text); ok = true; } catch (_) {
      const ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      dialog.appendChild(ta); ta.select();
      try { ok = document.execCommand('copy'); } catch (_) { ok = false; }
      ta.remove();
    }
    status.textContent = ok ? 'Copied' : 'Select the code and copy it';
  });
  $('download-html').addEventListener('click', async () => {
    await loadSnippets();
    const s = codeFor(cv.item);
    const url = URL.createObjectURL(new Blob([s.html], { type: 'text/html' }));
    const a = document.createElement('a');
    a.href = url; a.download = s.file.split('/').pop();
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    status.textContent = 'Downloaded';
  });

  const how = $('how');
  const openHow = () => { if (!how.open) { how.showModal(); how.focus({ preventScroll: true }); } };
  document.querySelectorAll('[data-how-open]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); openHow(); }));
  how.addEventListener('close', () => {
    if (location.hash === '#how') history.replaceState(null, '', location.pathname + location.search);
  });
  window.addEventListener('hashchange', () => { if (location.hash === '#how') openHow(); });
  if (location.hash === '#how') openHow();

  // ---------- A small, dependency-free highlighter ----------
  const KW = /^(const|let|var|function|return|for|if|else|of|in|new|while|break|continue|true|false|null|undefined|this|typeof|switch|case|default)$/;
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  function highlight(src) {
    let inBlock = null; // '*/' or '-->'
    return src.split('\n').map((line, i) => {
      let out = '', j = 0;
      while (j < line.length) {
        if (inBlock) {
          const end = line.indexOf(inBlock, j);
          const stop = end < 0 ? line.length : end + inBlock.length;
          out += `<span class="tk-c">${esc(line.slice(j, stop))}</span>`;
          j = stop; if (end >= 0) inBlock = null; continue;
        }
        const rest = line.slice(j);
        let m;
        if (rest.startsWith('//')) { out += `<span class="tk-c">${esc(rest)}</span>`; break; }
        if (rest.startsWith('/*')) { inBlock = '*/'; out += `<span class="tk-c">/*</span>`; j += 2; continue; }
        if (rest.startsWith('<!--')) { inBlock = '-->'; out += `<span class="tk-c">&lt;!--</span>`; j += 4; continue; }
        if ((m = rest.match(/^(['"`])(?:\\.|(?!\1).)*\1/))) { out += `<span class="tk-s">${esc(m[0])}</span>`; j += m[0].length; continue; }
        if ((m = rest.match(/^\d+(\.\d+)?(e-?\d+)?/i))) { out += `<span class="tk-n">${m[0]}</span>`; j += m[0].length; continue; }
        if ((m = rest.match(/^[A-Za-z_$][\w$]*/))) {
          const w = m[0];
          const next = rest.slice(w.length).match(/^\s*\(/);
          out += KW.test(w) ? `<span class="tk-k">${w}</span>` : next ? `<span class="tk-f">${w}</span>` : w;
          j += w.length; continue;
        }
        out += esc(line[j]); j++;
      }
      return `<span class="ln">${i + 1}</span>${out}`;
    }).join('\n');
  }
})();
