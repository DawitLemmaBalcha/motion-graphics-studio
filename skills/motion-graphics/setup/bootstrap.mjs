#!/usr/bin/env node
/**
 * bootstrap.mjs - build the motion-graphics studio on a machine that has nothing.
 * Cross-platform: Windows, Linux, macOS. Needs git, node >= 22, ffmpeg + ffprobe.
 *
 *   node skills/motion-graphics/setup/bootstrap.mjs
 *   node .../bootstrap.mjs --studio /srv/studio --latest
 *
 * Idempotent: without --force the kit is merged (missing files added, existing kept), and repos that
 * are already present are left alone.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SETUP = path.dirname(fileURLToPath(import.meta.url));
const WIN = process.platform === 'win32';

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const k = a.slice(2);
      const n = argv[i + 1];
      if (n === undefined || n.startsWith('--')) out[k] = true;
      else {
        out[k] = n;
        i++;
      }
    } else out._.push(a);
  }
  return out;
}

const opts = parseArgs(process.argv.slice(2));
const manifestPath = path.join(SETUP, 'studio.json');
if (!fs.existsSync(manifestPath)) {
  console.error(`bootstrap: studio.json is missing next to bootstrap.mjs (${SETUP})`);
  process.exit(1);
}
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

const studio = path.resolve(
  opts.studio || process.env.MG_STUDIO || path.join(os.homedir(), 'projects', 'motion-graphics')
);
const reposDir = path.join(studio, 'repos');
let problems = 0;

function run(cmd, args, extra = {}) {
  return spawnSync(cmd, args, { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, ...extra });
}

console.log('\n=== motion-graphics studio bootstrap ===');
console.log(`  kit    : ${SETUP}`);
console.log(`  studio : ${studio}\n`);

// ---------------------------------------------------------------- 1. prerequisites
console.log('[1/5] prerequisites');
const missing = [];
const nodeMajor = Number(process.versions.node.split('.')[0]);
console.log(`  node   ${process.versions.node}`);
if (nodeMajor < 22) missing.push('node>=22');
if (run('git', ['--version']).status !== 0) missing.push('git');
if (run('ffmpeg', ['-version']).status !== 0) missing.push('ffmpeg');
if (run('ffprobe', ['-version']).status !== 0) missing.push('ffprobe');

if (missing.length) {
  console.log(`  MISSING: ${missing.join(', ')}`);
  if (opts['install-missing']) {
    if (WIN) {
      if (missing.includes('git')) run('winget', ['install', '--id', 'Git.Git', '-e', '--accept-source-agreements', '--accept-package-agreements'], { stdio: 'inherit' });
      if (missing.some((m) => m.startsWith('node'))) run('winget', ['install', '--id', 'OpenJS.NodeJS.LTS', '-e', '--accept-source-agreements', '--accept-package-agreements'], { stdio: 'inherit' });
      if (missing.includes('ffmpeg')) run('winget', ['install', '--id', 'Gyan.FFmpeg', '-e', '--accept-source-agreements', '--accept-package-agreements'], { stdio: 'inherit' });
      console.log('  attempted installs with winget. OPEN A NEW SHELL and re-run this script.');
    } else {
      console.log('  run one of these, then re-run this script:');
      if (missing.includes('git')) console.log('    sudo apt install -y git        (or: sudo dnf install -y git)');
      if (missing.some((m) => m.startsWith('node'))) console.log('    install Node 22+ (nvm, or nodejs.org, or: sudo apt install -y nodejs)');
      if (missing.includes('ffmpeg')) console.log('    sudo apt install -y ffmpeg     (or: sudo dnf install -y ffmpeg)');
    }
    process.exit(1);
  }
  console.log('  install them, then re-run. Or re-run with --install-missing.');
  problems++;
} else {
  console.log('  git, node >= 22, ffmpeg, ffprobe  OK');
}

// ---------------------------------------------------------------- 2. studio + kit
console.log('\n[2/5] studio folders and kit');
for (const d of ['', 'repos', 'work']) {
  const p = d ? path.join(studio, d) : studio;
  if (!fs.existsSync(p)) {
    fs.mkdirSync(p, { recursive: true });
    console.log(`  created ${d || 'studio root'}`);
  }
}

let written = 0;
let kept = 0;
function copyTree(src, dst) {
  for (const ent of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, ent.name);
    const t = path.join(dst, ent.name);
    if (ent.isDirectory()) {
      fs.mkdirSync(t, { recursive: true });
      copyTree(s, t);
    } else {
      if (fs.existsSync(t) && !opts.force) {
        kept++;
        continue;
      }
      fs.mkdirSync(path.dirname(t), { recursive: true });
      fs.copyFileSync(s, t);
      written++;
    }
  }
}

for (const name of ['tools', 'prompts', 'templates']) {
  const src = path.join(SETUP, name);
  if (!fs.existsSync(src)) continue;
  const dst = path.join(studio, name);
  fs.mkdirSync(dst, { recursive: true });
  copyTree(src, dst);
  const n = (function count(p) {
    return fs.readdirSync(p, { withFileTypes: true }).reduce((n, e) => (e.isDirectory() ? n + count(path.join(p, e.name)) : n + 1), 0);
  })(dst);
  console.log(`  ${name.padEnd(10)} ${String(n).padStart(3)} file(s) installed`);
}
console.log(`  kit: ${written} written, ${kept} kept (use --force to overwrite)`);

fs.copyFileSync(manifestPath, path.join(studio, 'studio.json'));

const reposManifestSrc = path.join(SETUP, 'repos-MANIFEST.md');
const reposManifestDst = path.join(studio, 'repos', 'MANIFEST.md');
if (fs.existsSync(reposManifestSrc) && (!fs.existsSync(reposManifestDst) || opts.force)) {
  fs.copyFileSync(reposManifestSrc, reposManifestDst);
}

const workReadme = path.join(studio, 'work', 'README.md');
if (!fs.existsSync(workReadme)) {
  fs.writeFileSync(
    workReadme,
    `# work/ - one folder per piece

    work/NN-slug/
        INSPIRATION.md   what it borrows and from where, filled before the lane is locked
        BRIEF.md         the brief, tokens, copy, measured results, critic verdict
        BEATMAP.md       cuts in seconds and frames, on measured beats
        inventory.md     catalog candidates, with rejections
        ledger.json      seam ledger, written before authoring
        attribution.md   what was reused and under which licence
        index.html       the composition
        assets/          fonts, audio, logos, footage
        renders/         mp4 output
        stills/          frames for portfolio thumbnails

Numbering is permanent. Retire a piece by prefixing \`_\`, never by renumbering.
`
  );
}

// ---------------------------------------------------------------- 3. repos
console.log('\n[3/5] upstream repos (pinned)');
if (opts['no-repos']) {
  console.log('  skipped (--no-repos)');
} else {
  for (const r of manifest.repos) {
    const dest = path.join(reposDir, r.name);
    if (fs.existsSync(dest)) {
      const have = run('git', ['-C', dest, 'rev-parse', '--short=12', 'HEAD']).stdout?.trim();
      console.log(`  ${r.name.padEnd(24)} present (${have})`);
      continue;
    }
    process.stdout.write(`  ${r.name.padEnd(24)} cloning...`);
    const env = { ...process.env };
    if (r.lfsSkipSmudge) env.GIT_LFS_SKIP_SMUDGE = '1';
    else delete env.GIT_LFS_SKIP_SMUDGE;

    let ok = false;
    if (r.commit && !opts.latest) {
      fs.mkdirSync(dest, { recursive: true });
      run('git', ['init', '--quiet', dest], { env });
      run('git', ['-C', dest, 'remote', 'add', 'origin', r.url], { env });
      const fetched = run('git', ['-C', dest, 'fetch', '--quiet', '--depth', '1', 'origin', r.commit], { env });
      if (fetched.status === 0) {
        const co = run('git', ['-C', dest, 'checkout', '--quiet', 'FETCH_HEAD'], { env });
        if (co.status === 0) ok = true;
      }
    }
    if (!ok) {
      fs.rmSync(dest, { recursive: true, force: true });
      const cl = run('git', ['clone', '--quiet', '--depth', '1', r.url, dest], { env, stdio: 'pipe' });
      if (cl.status === 0) ok = true;
    }
    if (!ok) {
      console.log(' FAILED');
      console.log(`      ${r.url}`);
      problems++;
      continue;
    }
    for (const t of r.trim || []) {
      const p = path.join(dest, t);
      if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true });
    }
    const sha = run('git', ['-C', dest, 'rev-parse', '--short=12', 'HEAD']).stdout?.trim();
    let bytes = 0;
    (function size(p) {
      for (const e of fs.readdirSync(p, { withFileTypes: true })) {
        const q = path.join(p, e.name);
        if (e.isDirectory()) size(q);
        else try { bytes += fs.statSync(q).size; } catch {}
      }
    })(dest);
    console.log(` OK  ${(bytes / 1048576).toFixed(1)} MB  ${sha}`);
  }
}

// ---------------------------------------------------------------- 4. env var
console.log('\n[4/5] environment variable');
process.env.MG_STUDIO = studio;
if (WIN) {
  const r = run('setx', ['MG_STUDIO', studio]);
  if (r.status === 0) console.log(`  MG_STUDIO = ${studio}  (persisted for this user)`);
  else {
    console.log('  could not persist MG_STUDIO. Set it yourself:');
    console.log(`    setx MG_STUDIO "${studio}"`);
  }
} else {
  // PLATFORM: do not edit the user's shell rc without being asked
  console.log(`  MG_STUDIO is set for this process only. To persist it, add to your shell profile:`);
  console.log(`    export MG_STUDIO="${studio}"`);
}

// ---------------------------------------------------------------- 5. verify
console.log('\n[5/5] verify');
if (opts['skip-check']) {
  console.log('  skipped (--skip-check)');
} else if (opts['no-repos']) {
  console.log('  skipped: --no-repos was passed, so the repo checks cannot pass yet.');
  console.log('  run again without --no-repos for a full verification.');
} else {
  const mg = path.join(studio, 'tools', 'mg.mjs');
  if (!fs.existsSync(mg)) {
    console.log('  tools/mg.mjs is missing - kit did not install');
    problems++;
  } else {
    const r = spawnSync(process.execPath, [mg, 'env'], { stdio: 'inherit' });
    if (r.status !== 0) problems++;
  }
}

// ---------------------------------------------------------------- summary
let total = 0;
(function size(p) {
  for (const e of fs.readdirSync(p, { withFileTypes: true })) {
    const q = path.join(p, e.name);
    if (e.isDirectory()) size(q);
    else try { total += fs.statSync(q).size; } catch {}
  }
})(studio);

console.log('\n=== done ===');
console.log(`  studio : ${studio}  (${(total / 1048576).toFixed(1)} MB)`);
console.log(`  hyperframes CLI recorded: ${manifest.hyperframesCliTested}`);
console.log('\n  Next: open a session and ask it to make a motion graphic.');
console.log('  The skill resolves the studio from MG_STUDIO, or from the current directory.\n');

if (problems) {
  console.log(`${problems} problem(s) above.`);
  process.exit(1);
}
process.exit(0);
