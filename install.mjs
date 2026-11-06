#!/usr/bin/env node
/**
 * install.mjs - put the two skills where an agent can see them. Cross-platform (Windows, Linux, macOS).
 *
 *   node install.mjs                       link both skills into ~/.dsh/skills
 *   node install.mjs --skills-dir <path>   different agent, different location
 *   node install.mjs --copy                copy instead of link
 *   node install.mjs --bootstrap           also build the studio
 *
 * Windows uses directory junctions (no admin needed); everywhere else a symlink. If linking is not
 * permitted on the filesystem it falls back to a copy automatically.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const WIN = process.platform === 'win32';
const SKILLS = ['motion-graphics', 'motion-critic'];

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
const skillsDir = opts['skills-dir'] || path.join(os.homedir(), '.dsh', 'skills');

console.log('\n=== motion-graphics-studio: install skills ===');
console.log(`  repo       : ${HERE}`);
console.log(`  skills dir : ${skillsDir}\n`);

fs.mkdirSync(skillsDir, { recursive: true });

function copyDir(src, dst) {
  fs.cpSync(src, dst, { recursive: true, force: true });
}

/** true when dst is already a link pointing at src */
function isOurLink(dst, src) {
  try {
    return path.resolve(fs.readlinkSync(dst)) === path.resolve(src);
  } catch {
    return false;
  }
}

let installed = 0;
for (const name of SKILLS) {
  const src = path.join(HERE, 'skills', name);
  const dst = path.join(skillsDir, name);
  if (!fs.existsSync(path.join(src, 'SKILL.md'))) {
    console.log(`  ${name.padEnd(16)} SKILL.md missing in repo - skipped`);
    continue;
  }

  if (fs.existsSync(dst) || fs.existsSync(path.join(dst, 'SKILL.md'))) {
    if (isOurLink(dst, src)) {
      console.log(`  ${name.padEnd(16)} already linked to this repo`);
      installed++;
      continue;
    }
    if (!opts.force) {
      console.log(`  ${name.padEnd(16)} already exists and is not from this repo - use --force`);
      continue;
    }
    fs.rmSync(dst, { recursive: true, force: true });
  }

  if (opts.copy) {
    copyDir(src, dst);
    console.log(`  ${name.padEnd(16)} copied`);
    installed++;
    continue;
  }

  try {
    // PLATFORM: junction on Windows (no privileges), symlink elsewhere
    fs.symlinkSync(src, dst, WIN ? 'junction' : 'dir');
    console.log(`  ${name.padEnd(16)} linked`);
    installed++;
  } catch (e) {
    copyDir(src, dst);
    console.log(`  ${name.padEnd(16)} copied (linking not permitted: ${e.code || e.message})`);
    installed++;
  }
}

console.log('');
if (!installed) {
  console.error('  Nothing installed. Check --skills-dir or use --force.');
  process.exit(1);
}
console.log('  Skills installed. RESTART the agent session so the catalog picks them up.');
console.log('  Then ask it to make a motion graphic; the skill builds the studio if it is missing.');

if (opts.bootstrap) {
  console.log('');
  const boot = path.join(HERE, 'skills', 'motion-graphics', 'setup', 'bootstrap.mjs');
  if (!fs.existsSync(boot)) {
    console.error('  bootstrap.mjs not found - skills installed, studio NOT built.');
    process.exit(1);
  }
  const argv = [boot];
  if (opts.studio) argv.push('--studio', opts.studio);
  const r = spawnSync(process.execPath, argv, { stdio: 'inherit' });
  process.exit(r.status ?? 1);
}

console.log('\n  Build the studio now:  node install.mjs --bootstrap\n');
process.exit(0);
