#!/usr/bin/env node
/**
 * mg.mjs - the studio's tool layer, in one cross-platform CLI.
 *
 * Runs on Windows, Linux and macOS. Only Node 18+ and ffmpeg/ffprobe are required; `npx` is used to
 * reach the HyperFrames CLI. All three platform-specific spots are marked PLATFORM below.
 *
 *   node tools/mg.mjs check
 *   node tools/mg.mjs render --piece 02-full-stop
 *   node tools/mg.mjs render --piece 02-full-stop --aspect 9:16 --draft
 *   node tools/mg.mjs measure --piece 02-full-stop
 *   node tools/mg.mjs safeguards --piece 02-full-stop --at 1,4.5,9
 *   node tools/mg.mjs find --loop tunnel
 *   node tools/mg.mjs poster --piece 02-full-stop --at 12.5
 *   node tools/mg.mjs poster --grid
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url)); // <studio>/tools
const STUDIO = path.dirname(HERE); // <studio>
const WIN = process.platform === 'win32';
const NPX = WIN ? 'npx.cmd' : 'npx'; // PLATFORM 1: the npm shim name

// ----------------------------------------------------------------------------- helpers
function run(cmd, args, opts = {}) {
  // PLATFORM 2: a .cmd shim cannot be spawned directly on Windows, so route it through the shell and
  // quote the arguments ourselves. Everywhere else spawn with an argv array, which is safer.
  const viaShell = WIN && /\.(cmd|bat)$/i.test(cmd);
  const argv = viaShell
    ? args.map((a) => (/[\s"&|<>^]/.test(a) ? `"${String(a).replace(/"/g, '""')}"` : a))
    : args;
  return spawnSync(cmd, argv, {
    encoding: 'utf8',
    shell: viaShell,
    maxBuffer: 256 * 1024 * 1024,
    ...opts,
  });
}

function must(cmd, args, label) {
  const r = run(cmd, args);
  if (r.error) throw new Error(`${label || cmd} failed to start: ${r.error.message}`);
  return r;
}

function ffmpeg(args) {
  return run('ffmpeg', ['-hide_banner', '-nostats', ...args]);
}
function ffprobeJson(args) {
  const r = run('ffprobe', ['-v', 'error', '-of', 'json', ...args]);
  if (r.status !== 0) throw new Error(`ffprobe failed: ${(r.stderr || '').trim()}`);
  return JSON.parse(r.stdout);
}

const pad = (s, n) => String(s).padEnd(n);
const kb = (n) => `${Math.round(n / 1024)} KB`;
const mb = (n) => `${(n / 1048576).toFixed(1)} MB`;

function fail(msg) {
  console.error(`mg: ${msg}`);
  process.exit(1);
}

/** Resolve a work/ piece folder. Accepts a name or a path. */
function pieceDir(piece) {
  if (!piece) fail('--piece is required');
  const direct = path.resolve(piece);
  if (fs.existsSync(direct) && fs.statSync(direct).isDirectory()) return direct;
  const inWork = path.join(STUDIO, 'work', piece);
  if (fs.existsSync(inWork)) return inWork;
  fail(`piece folder not found: ${piece} (looked in ${inWork})`);
}

function newestMp4(dir) {
  if (!fs.existsSync(dir)) return null;
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.toLowerCase().endsWith('.mp4'))
    .map((f) => path.join(dir, f))
    .map((f) => ({ f, t: fs.statSync(f).mtimeMs }))
    .sort((a, b) => b.t - a.t);
  return files.length ? files[0].f : null;
}

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) out[key] = true;
      else {
        out[key] = next;
        i++;
      }
    } else out._.push(a);
  }
  return out;
}

// ----------------------------------------------------------------------------- check
function cmdCheck(opts) {
  const dir = opts.piece ? pieceDir(opts.piece) : STUDIO;
  console.log(`check ${dir}`);
  const r = run(NPX, ['--yes', 'hyperframes@latest', 'check', dir, '--json']);
  const raw = `${r.stdout || ''}`;
  const s = raw.indexOf('{');
  const e = raw.lastIndexOf('}');
  if (s < 0 || e < s) {
    console.log(raw.slice(0, 4000));
    fail('check produced no JSON (run it by hand)');
  }
  const j = JSON.parse(raw.slice(s, e + 1));
  const lint = j.lint || {};
  const contrast = j.contrast || {};
  const errs = lint.errorCount ?? (j.ok ? 0 : 1);
  const warns = lint.warningCount ?? 0;
  const findings = Array.isArray(contrast.findings) ? contrast.findings.length : 0;
  console.log(`  lint      ${errs} error(s), ${warns} warning(s)`);
  console.log(`  runtime   ${j.runtime && j.runtime.ok === false ? 'FAILED' : 'ok'}`);
  console.log(`  contrast  ${contrast.passed ?? '?'}/${contrast.checked ?? '?'} samples, ${findings} finding(s)`);
  const ok = errs === 0 && findings === 0 && !(j.runtime && j.runtime.ok === false);
  console.log(ok ? '\n  clean' : '\n  NOT clean');
  process.exit(ok ? 0 : 1);
}

// ----------------------------------------------------------------------------- render
function cmdRender(opts) {
  const dir = pieceDir(opts.piece);
  const slug = path.basename(dir);
  const renders = path.join(dir, 'renders');
  fs.mkdirSync(renders, { recursive: true });

  const aspect = opts.aspect || '16:9';
  const tag = aspect.replace(':', 'x');
  let comp = 'index.html';
  if (aspect !== '16:9') {
    const candidates = [`index-${tag}.html`, `index_${tag}.html`, path.join('compositions', `index-${tag}.html`)];
    const found = candidates.find((c) => fs.existsSync(path.join(dir, c)));
    if (!found)
      fail(
        `no ${aspect} composition in ${dir}. A vertical cut must be RECOMPOSED, not cropped.\n` +
          `Create compositions/index-${tag}.html first, or render 16:9 only.`
      );
    comp = found;
  }
  const compCli = comp.split(path.sep).join('/');

  if (!opts['no-check']) {
    const check = run(NPX, ['--yes', 'hyperframes@latest', 'check', dir, '--json']);
    const raw = `${check.stdout || ''}`;
    const s = raw.indexOf('{');
    const e = raw.lastIndexOf('}');
    if (s >= 0 && e > s) {
      try {
        const j = JSON.parse(raw.slice(s, e + 1));
        const errs = (j.lint && j.lint.errorCount) ?? (j.ok ? 0 : 1);
        if (errs > 0 && !opts.force) {
          console.log(raw.slice(s, e + 1));
          fail(`${errs} lint error(s). Fix them, or pass --force.`);
        }
        console.log(`  check: ${errs === 0 ? 'clean' : errs + ' error(s), forced'}`);
      } catch {
        console.log('  check: output unparseable, continuing');
      }
    }
  }

  const stamp = new Date()
    .toISOString()
    .replace(/[-:T]/g, '')
    .replace(/\..+$/, '')
    .replace(/^(\d{8})(\d{6})$/, '$1-$2');
  const out = path.join(renders, `${slug}_${tag}_${stamp}.mp4`);

  const args = ['--yes', 'hyperframes@latest', 'render', dir, '-o', out, '-f', String(opts.fps || 30), '-w', 'auto'];
  const quality = opts.draft ? 'draft' : opts.quality || 'delivery';
  args.push('-q', quality);
  if (opts.workers && Number(opts.workers) > 1) {
    args.push('--no-low-memory-mode', '-w', String(opts.workers));
  }
  if (comp !== 'index.html') args.push('-c', compCli);

  console.log(`\nrender -> ${out}`);
  console.log(`  ${quality}, ${opts.fps || 30}fps`);
  const t0 = Date.now();
  // go through run() so the argv is quoted for the shell on Windows (the studio path contains a space)
  const r = run(NPX, args, { stdio: 'inherit' });
  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  if (r.status !== 0 || !fs.existsSync(out)) fail(`render failed after ${secs}s (exit ${r.status})`);

  const probe = ffprobeJson([
    '-show_entries',
    'format=duration,size',
    '-show_entries',
    'stream=codec_name,width,height,r_frame_rate',
    out,
  ]);
  const v = (probe.streams || []).find((s) => s.codec_type !== 'audio') || {};
  console.log(`\ndone in ${secs}s`);
  console.log(`  ${Number(probe.format.duration).toFixed(3)}s  ${v.width}x${v.height}  ${v.r_frame_rate}`);
  console.log(`  next: node tools/mg.mjs measure --piece ${slug}`);
  process.exit(0);
}

// ----------------------------------------------------------------------------- measure
function cmdMeasure(opts) {
  let file = opts.file ? path.resolve(opts.file) : null;
  let projDir;
  if (!file) {
    const dir = pieceDir(opts.piece);
    projDir = dir;
    file = newestMp4(path.join(dir, 'renders'));
    if (!file) fail(`no .mp4 in ${path.join(dir, 'renders')}`);
  } else {
    const parent = path.dirname(file);
    projDir = path.basename(parent) === 'renders' ? path.dirname(parent) : parent;
  }

  console.log(`measuring ${file}\n`);
  const probe = ffprobeJson([
    '-show_entries',
    'format=duration,size,bit_rate',
    '-show_entries',
    'stream=codec_name,width,height,r_frame_rate,pix_fmt,codec_type',
    file,
  ]);
  const dur = Number(probe.format.duration);
  const v = (probe.streams || []).find((s) => s.codec_type === 'video') || {};
  const hasAudio = (probe.streams || []).some((s) => s.codec_type === 'audio');
  const [num, den] = String(v.r_frame_rate || '0/1').split('/').map(Number);
  const fps = den ? num / den : num;

  const rows = [];
  const add = (metric, target, actual, ok) => rows.push({ metric, target, actual, ok });

  // duration vs the declared data-duration
  const indexHtml = path.join(projDir, 'index.html');
  let declared = null;
  if (fs.existsSync(indexHtml)) {
    const html = fs.readFileSync(indexHtml, 'utf8');
    const m1 = html.match(/data-composition-id\s*=\s*"main"[\s\S]{0,400}?data-duration\s*=\s*"([\d.]+)"/);
    const m2 = html.match(/data-duration\s*=\s*"([\d.]+)"/);
    const m = m1 || m2;
    if (m) declared = Number(m[1]);
  }
  if (declared !== null) add('Duration', `declared ${declared.toFixed(2)}s`, `${dur.toFixed(3)}s`, Math.abs(dur - declared) <= 1 / fps);
  else add('Duration', 'exact to brief (declared)', `${dur.toFixed(3)}s`, true);

  add('Frame rate', '30 (or 60)', `${fps} fps`, fps === 30 || fps === 60);
  add('Resolution', '1920x1080 or 1080x1920', `${v.width}x${v.height}`,
    (v.width === 1920 && v.height === 1080) || (v.width === 1080 && v.height === 1920));
  add('Pixel format', 'yuv420p (player-safe)', v.pix_fmt || '?', v.pix_fmt === 'yuv420p');
  add('Video codec', 'h264', v.codec_name || '?', v.codec_name === 'h264');
  add('Audio stream', 'present', hasAudio ? 'yes' : 'none', hasAudio || !!opts['allow-silence']);

  // frozen frames: ffmpeg emits freeze_start always, but freeze_duration only when the freeze closes;
  // an unclosed freeze runs to EOF, so its length is duration - start.
  const fd = ffmpeg(['-i', file, '-vf', 'freezedetect=n=0.001:d=0.4', '-an', '-f', 'null', '-']);
  const text = `${fd.stderr || ''}`;
  const starts = [...text.matchAll(/freeze_start:\s*([\d.]+)/g)].map((m) => Number(m[1]));
  const lens = [...text.matchAll(/freeze_duration:\s*([\d.]+)/g)].map((m) => Number(m[1]));
  let worstMid = 0;
  let worstAt = 0;
  let finalHold = 0;
  starts.forEach((s, i) => {
    const closed = i < lens.length;
    const len = closed ? lens[i] : dur - s;
    const reach = s + len;
    const isFinal = !closed || reach >= dur - 0.45;
    if (isFinal) {
      if (len > finalHold) finalHold = len;
    } else if (len > worstMid) {
      worstMid = len;
      worstAt = s;
    }
  });
  add('Frozen frame (mid)', '< 0.5s', worstMid > 0 ? `${worstMid.toFixed(2)}s at ${worstAt.toFixed(2)}s` : 'none', worstMid < 0.5);
  add('Held end state', '0.4s - 2.5s composed', `${finalHold.toFixed(2)}s`, finalHold >= 0.4 && finalHold <= 2.5);
  const frozenShare = finalHold / Math.max(dur, 0.001);
  add('Not a static piece', '< 60% of runtime frozen', `${Math.round(frozenShare * 100)}%`, frozenShare < 0.6);

  // loudness: level and RANGE are different goals
  if (hasAudio) {
    const ln = ffmpeg(['-i', file, '-vn', '-af', 'loudnorm=print_format=summary', '-f', 'null', '-']);
    const lt = `${ln.stderr || ''}`;
    const mi = lt.match(/Input Integrated:\s*(-?[\d.]+)\s*LUFS/);
    const mt = lt.match(/Input True Peak:\s*(-?[\d.]+)\s*dBTP/);
    const ml = lt.match(/Input LRA:\s*(-?[\d.]+)\s*LU/);
    const targetLufs = opts.target ? Number(opts.target) : -14;
    if (mi) {
      const lufs = Number(mi[1]);
      add('Integrated loudness', `${targetLufs} +/- 1 LUFS`, `${lufs.toFixed(1)} LUFS`, Math.abs(lufs - targetLufs) <= 1);
    } else add('Integrated loudness', 'measurable', 'unreadable', false);
    if (mt) {
      const tp = Number(mt[1]);
      add('True peak', '< -1 dBTP', `${tp.toFixed(1)} dBTP`, tp < -1);
    }
    if (ml && dur >= 10) {
      const lra = Number(ml[1]);
      add('Loudness range', '4 - 9 LU', `${lra.toFixed(1)} LU`, lra >= 4 && lra <= 9);
    }
  }

  // contrast audit (spawns a browser)
  if (opts.check) {
    process.stdout.write('running contrast audit...');
    const r = run(NPX, ['--yes', 'hyperframes@latest', 'check', projDir, '--json']);
    const raw = `${r.stdout || ''}`;
    const s = raw.indexOf('{');
    const e = raw.lastIndexOf('}');
    process.stdout.write('\n');
    try {
      const j = JSON.parse(raw.slice(s, e + 1));
      const c = j.contrast || {};
      const findings = Array.isArray(c.findings) ? c.findings.length : 0;
      add('Contrast findings', '0', `${findings} finding(s); ${c.passed}/${c.checked} samples`, findings === 0);
    } catch {
      add('Contrast findings', '0', 'audit unparseable', false);
    }
  }

  const widths = [22, 26, 30, 5];
  const line = (a, b, c, d) => `${pad(a, widths[0])}${pad(b, widths[1])}${pad(c, widths[2])}${d}`;
  console.log(line('Metric', 'Target', 'Actual', 'Result'));
  console.log(line('-'.repeat(21), '-'.repeat(25), '-'.repeat(29), '------'));
  for (const r of rows) console.log(line(r.metric, r.target, r.actual, r.ok ? 'PASS' : 'FAIL'));

  const fails = rows.filter((r) => !r.ok);
  const stills = path.join(projDir, 'stills');
  fs.mkdirSync(stills, { recursive: true });
  const summary = [
    `MEASURED ${new Date().toISOString()}`,
    `FILE ${file}`,
    '',
    ...rows.map((r) => `${pad(r.metric, 22)}${pad(r.target, 26)}${pad(r.actual, 30)}${r.ok ? 'PASS' : 'FAIL'}`),
    '',
    `FAILS: ${fails.length}`,
  ].join('\n');
  const outTxt = path.join(stills, 'measure.txt');
  fs.writeFileSync(outTxt, summary + '\n');
  console.log(`\nwrote ${outTxt}`);
  if (fails.length) {
    console.log(`\n${fails.length} metric(s) failing.`);
    process.exit(1);
  }
  console.log('\nAll measured metrics pass. Now look at the stills.');
  process.exit(0);
}

// ----------------------------------------------------------------------------- safeguards
function cmdSafeguards(opts) {
  const file = opts.file ? path.resolve(opts.file) : newestMp4(path.join(pieceDir(opts.piece), 'renders'));
  if (!file) fail('no render found');
  const outDir = opts.out || path.join(path.dirname(path.dirname(file)), 'stills', 'safe');
  fs.mkdirSync(outDir, { recursive: true });

  const probe = ffprobeJson(['-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-show_entries', 'format=duration', file]);
  const w = Number(probe.streams[0].width);
  const h = Number(probe.streams[0].height);
  const dur = Number(probe.format.duration);
  const vertical = h > w;

  const ax = Math.round(w * 0.05);
  const ay = Math.round(h * 0.05);
  const tx = Math.round(w * 0.1);
  const ty = Math.round(h * 0.1);
  const filters = [
    `drawbox=x=${ax}:y=${ay}:w=${w - 2 * ax}:h=${h - 2 * ay}:color=yellow@0.55:t=3`,
    `drawbox=x=${tx}:y=${ty}:w=${w - 2 * tx}:h=${h - 2 * ty}:color=lime@0.55:t=2`,
  ];
  if (vertical) {
    const topH = Math.round(h * 0.12);
    const botY = Math.round(h * 0.85);
    filters.push(`drawbox=x=0:y=0:w=${w}:h=${topH}:color=red@0.14:t=fill`);
    filters.push(`drawbox=x=0:y=${botY}:w=${w}:h=${h - botY}:color=red@0.14:t=fill`);
  }
  const vf = filters.join(',');

  const times = opts.at
    ? String(opts.at).split(',').map(Number)
    : [1, 2, 3, 4, 5].map((i) => Number((dur * i / 6).toFixed(2)));

  console.log(`guides: ${w}x${h}, vertical=${vertical}, ${times.length} frame(s) -> ${outDir}\n`);
  for (const t of times) {
    const out = path.join(outDir, `safe-${t}.png`);
    const r = ffmpeg(['-v', 'error', '-ss', String(t), '-i', file, '-frames:v', '1', '-vf', vf, '-y', out]);
    if (fs.existsSync(out)) console.log(`  ${String(t).padStart(7)}s  -> ${out}`);
    else {
      console.log(`  ${String(t).padStart(7)}s  FAILED`);
      console.log(`           ${(r.stderr || '').split('\n')[0]}`);
    }
  }
  console.log('\nkey text inside GREEN; nothing important in RED (the platform UI band).');
  process.exit(0);
}

// ----------------------------------------------------------------------------- find
function cmdFind(opts) {
  const loopsDir = path.join(STUDIO, 'templates', 'scenario-motion-loops', 'loops', 'js', 'tiles');
  const libDir = path.join(STUDIO, 'prompts', 'library');
  const casesDir = path.join(STUDIO, 'repos', 'awesome-ai-motion', 'cases');
  const resources = path.join(STUDIO, 'repos', 'awesome-ai-motion', 'browse', 'resources.en.md');

  const walk = (dir, filter) => {
    if (!fs.existsSync(dir)) return [];
    const out = [];
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, ent.name);
      if (ent.isDirectory()) out.push(...walk(p, filter));
      else if (filter(ent.name)) out.push(p);
    }
    return out;
  };

  if (opts.list || (!opts.loop && !opts.prompt && !opts.repo)) {
    const loopFiles = walk(loopsDir, (n) => n.endsWith('.js'));
    const loopCount = loopFiles.reduce((n, f) => n + (fs.readFileSync(f, 'utf8').match(/tile\('/g) || []).length, 0);
    console.log('\ninspiration sources');
    console.log(`  Scenario loops   ${loopCount} tile() definitions   --loop <pattern>   (code, adapt)`);
    if (fs.existsSync(libDir)) console.log(`  Prompts          ${fs.readdirSync(libDir).filter((f) => f.endsWith('.txt')).length} verbatim + ${(walk(casesDir, (n) => n.endsWith('.en.md'))).length} cases   --prompt <pattern>`);
    if (fs.existsSync(resources)) console.log('  Source repos     190 works, licences       --repo <pattern>   (code, licence)');
    console.log('\n  examples: --loop tunnel   --prompt shader   --repo three\n');
    process.exit(0);
  }

  if (opts.loop) {
    const re = new RegExp(String(opts.loop), 'i');
    const rows = [];
    for (const f of walk(loopsDir, (n) => n.endsWith('.js'))) {
      const t = fs.readFileSync(f, 'utf8');
      for (const m of t.matchAll(/tile\('([^']+)',\s*\{[\s\S]{0,160}?name:\s*'([^']+)'/g)) {
        if (re.test(m[1]) || re.test(m[2])) rows.push({ id: m[1], name: m[2], file: path.relative(STUDIO, f) });
      }
    }
    if (!rows.length) fail(`no loop matched "${opts.loop}"`);
    console.log(`\n${rows.length} loop(s) - adapt P (palette), the period, and the counts\n`);
    for (const r of rows) console.log(`  ${pad(r.id, 20)} ${pad(r.name, 22)} ${r.file}`);
    console.log('\ncopy the tile() block into templates/scenario-motion-loops/scripts/loop-template.html, then');
    console.log('  node .../render-loop.mjs loop.html --check\n');
    process.exit(0);
  }

  if (opts.prompt) {
    const re = new RegExp(String(opts.prompt), 'i');
    let libHits = [];
    if (fs.existsSync(libDir)) {
      libHits = fs.readdirSync(libDir).filter((f) => f.endsWith('.txt')).filter((f) => re.test(fs.readFileSync(path.join(libDir, f), 'utf8')));
    }
    const caseHits = walk(casesDir, (n) => n.endsWith('.en.md')).filter((f) => re.test(fs.readFileSync(f, 'utf8')));
    console.log(`\nlibrary: ${libHits.length} prompt file(s) match "${opts.prompt}"`);
    for (const f of libHits.slice(0, 3)) {
      const t = fs.readFileSync(path.join(libDir, f), 'utf8').replace(/\s+/g, ' ');
      console.log(`\n  ${f}\n  ${t.slice(0, 400)}`);
    }
    console.log(`\ncases: ${caseHits.length} of 1728 match - prompt + "what to learn", no code`);
    for (const f of caseHits.slice(0, 8)) {
      const head = fs.readFileSync(f, 'utf8').split('\n').find((l) => l.startsWith('# '));
      console.log(`\n  ${(head || path.basename(f)).replace(/^#\s*/, '')}\n  ${path.relative(STUDIO, f)}`);
    }
    if (caseHits.length > 8) console.log(`\n  ... ${caseHits.length - 8} more. Narrow the pattern.`);
    process.exit(0);
  }

  if (opts.repo) {
    if (!fs.existsSync(resources)) fail('resources.en.md is missing');
    const re = new RegExp(String(opts.repo), 'i');
    const lines = fs.readFileSync(resources, 'utf8').split('\n');
    let cur = '';
    const hits = [];
    for (const l of lines) {
      if (l.startsWith('## ')) cur = l;
      if (/Related tool|Public web page|Source code/.test(l) && (re.test(l) || re.test(cur))) hits.push({ cur, l: l.trim() });
    }
    if (!hits.length) fail(`no source repo matched "${opts.repo}"`);
    console.log(`\n${hits.length} match(es) - check each entry's licence before adapting`);
    for (const h of hits.slice(0, 12)) console.log(`\n  ${h.cur.replace(/^##\s*/, '')}\n    ${h.l}`);
    process.exit(0);
  }
}

// ----------------------------------------------------------------------------- poster
function cmdPoster(opts) {
  const posters = path.join(STUDIO, 'work', 'posters');
  fs.mkdirSync(posters, { recursive: true });

  if (opts.grid) {
    const thumbs = fs.readdirSync(posters).filter((f) => f.endsWith('_thumb.png')).sort();
    if (!thumbs.length) fail(`no thumbnails yet in ${posters}`);
    const inputs = [];
    const filters = [];
    const labels = [];
    thumbs.forEach((t, i) => {
      inputs.push('-i', path.join(posters, t));
      filters.push(`[${i}:v]scale=-1:240,pad=iw+8:ih+8:4:4:0x141414[v${i}]`);
      labels.push(`[v${i}]`);
    });
    const chain = `${filters.join(';')};${labels.join('')}hstack=inputs=${thumbs.length}[out]`;
    const out = path.join(posters, 'GRID.png');
    const r = run('ffmpeg', ['-hide_banner', '-v', 'error', '-y', ...inputs, '-filter_complex', chain, '-map', '[out]', out]);
    if (!fs.existsSync(out)) fail(`grid failed: ${(r.stderr || '').trim().split('\n')[0]}`);
    console.log(`grid of ${thumbs.length} piece(s) -> ${out}`);
    for (const t of thumbs) console.log(`  ${t.replace(/_thumb\.png$/, '')}`);
    process.exit(0);
  }

  let file = opts.file ? path.resolve(opts.file) : null;
  if (!file) {
    const dir = pieceDir(opts.piece);
    const renders = path.join(dir, 'renders');
    const all = fs.existsSync(renders) ? fs.readdirSync(renders).filter((f) => f.endsWith('.mp4')) : [];
    const masters = all.filter((f) => f.includes('16x9_master'));
    const pick = (masters.length ? masters : all)
      .map((f) => ({ f: path.join(renders, f), t: fs.statSync(path.join(renders, f)).mtimeMs }))
      .sort((a, b) => b.t - a.t)[0];
    if (!pick) fail('no master found. Pass --file.');
    file = pick.f;
  }
  const at = opts.at || 10;
  const slug = opts.piece ? path.basename(String(opts.piece)) : path.basename(file, path.extname(file));
  const thumbW = Number(opts.thumb || 200);
  let poster = path.join(posters, `${slug}_poster.jpg`);
  const thumb = path.join(posters, `${slug}_thumb.png`);

  ffmpeg(['-v', 'error', '-y', '-i', file, '-ss', String(at), '-frames:v', '1', '-q:v', '2', '-vf', 'scale=1600:-2,format=yuvj420p', poster]);
  if (!fs.existsSync(poster)) {
    poster = poster.replace(/\.jpg$/, '.png');
    ffmpeg(['-v', 'error', '-y', '-i', file, '-ss', String(at), '-frames:v', '1', '-vf', 'scale=1600:-2', poster]);
  }
  ffmpeg(['-v', 'error', '-y', '-i', file, '-ss', String(at), '-frames:v', '1', '-vf', `scale=${thumbW}:-1`, thumb]);
  if (!fs.existsSync(poster)) fail('ffmpeg did not write the poster');
  console.log(`poster  ${poster}  (${kb(fs.statSync(poster).size)})`);
  console.log(`thumb   ${thumb}`);
  console.log('\nopen the thumb. If it does not name the job at 200 px, pick a different time.');
  process.exit(0);
}

// ----------------------------------------------------------------------------- check-env
function cmdEnv() {
  const rows = [];
  const add = (item, ok, detail) => rows.push({ item, ok, detail });

  const nodeMajor = Number(process.versions.node.split('.')[0]);
  add('node', nodeMajor >= 22, `v${process.versions.node} (need >= 22)`);
  const ff = run('ffmpeg', ['-version']);
  add('ffmpeg', ff.status === 0, ff.status === 0 ? (ff.stdout || '').split('\n')[0].replace(/\s+/g, ' ').slice(0, 60) : 'not on PATH');
  const fp = run('ffprobe', ['-version']);
  add('ffprobe', fp.status === 0, fp.status === 0 ? 'on PATH' : 'not on PATH');
  const git = run('git', ['--version']);
  add('git', git.status === 0, git.status === 0 ? (git.stdout || '').trim() : 'not on PATH');

  let hfVersion = 'unknown';
  const help = run(NPX, ['--yes', 'hyperframes@latest', '--help']);
  const m = `${help.stdout || ''}${help.stderr || ''}`.match(/hyperframes\s+v([0-9][0-9a-zA-Z.\-]*)/);
  if (m) hfVersion = m[1];
  add('hyperframes', !!m, m ? `v${hfVersion}` : 'CLI not reachable via npx');

  for (const d of ['tools', 'templates', 'prompts', 'work']) add(`folder ${d}`, fs.existsSync(path.join(STUDIO, d)), 'studio shape');
  for (const r of ['hyperframes', 'claude-animation-skill', 'ffmpeg-skill', 'awesome-ai-motion'])
    add(`repo ${r}`, fs.existsSync(path.join(STUDIO, 'repos', r)), 'upstream source');
  add(
    'seam-gate.mjs',
    fs.existsSync(path.join(STUDIO, 'repos', 'hyperframes', '.agents', 'skills', 'motion-doctrine', 'scripts', 'seam-gate.mjs')),
    'motion continuity verifier'
  );
  add('studio.json', fs.existsSync(path.join(STUDIO, 'studio.json')), 'manifest');

  const w = Math.max(...rows.map((r) => r.item.length));
  for (const r of rows) console.log(`  ${pad(r.item, w)} ${r.ok ? 'PASS' : 'FAIL'}  ${r.detail}`);
  console.log(`\nhyperframes version: ${hfVersion}  ->  record this in BRIEF.md`);

  const fails = rows.filter((r) => !r.ok);
  if (fails.length) {
    console.log(`\n${fails.length} check(s) failed. Fix before rendering.`);
    process.exit(1);
  }
  console.log('\nEnvironment ready.');
  process.exit(0);
}

// ----------------------------------------------------------------------------- main
const [, , sub, ...rest] = process.argv;
const opts = parseArgs(rest);

switch (sub) {
  case 'check':
    cmdCheck(opts);
    break;
  case 'render':
    cmdRender(opts);
    break;
  case 'measure':
    cmdMeasure(opts);
    break;
  case 'safeguards':
    cmdSafeguards(opts);
    break;
  case 'find':
    cmdFind(opts);
    break;
  case 'poster':
    cmdPoster(opts);
    break;
  case 'env':
  case 'check-env':
    cmdEnv();
    break;
  default:
    console.log(`mg.mjs - motion-graphics studio tools

  node tools/mg.mjs env                      toolchain and studio readiness
  node tools/mg.mjs check [--piece <p>]      lint + runtime + contrast
  node tools/mg.mjs render --piece <p> [--aspect 9:16] [--draft] [--workers N] [--force]
  node tools/mg.mjs measure --piece <p> [--file <mp4>] [--check] [--allow-silence]
  node tools/mg.mjs safeguards --piece <p> [--at 1,4.5,9]
  node tools/mg.mjs find [--loop p | --prompt p | --repo p | --list]
  node tools/mg.mjs poster --piece <p> [--at 12.5] | --grid

studio: ${STUDIO}`);
    process.exit(sub ? 1 : 0);
}
