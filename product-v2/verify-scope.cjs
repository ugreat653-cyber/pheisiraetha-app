'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {execFileSync} = require('node:child_process');
const ROOT = path.resolve(__dirname, '..');
const BASE = 'db6920193fb76028947ce148cd8ed61c847c5c3d';
const git = args => execFileSync('git', ['--no-optional-locks', ...args], {
  cwd: ROOT, env: {...process.env, GIT_NO_REPLACE_OBJECTS: '1', GIT_OPTIONAL_LOCKS: '0'},
  maxBuffer: 64 * 1024 * 1024
});
git(['merge-base', '--is-ancestor', BASE, 'HEAD']);
const baseline = git(['ls-tree', '-r', '-z', '--name-only', BASE]).toString('utf8').split('\0').filter(Boolean);
for (const file of baseline) {
  const actual = fs.readFileSync(path.join(ROOT, file));
  assert.ok(actual.equals(git(['show', BASE + ':' + file])), 'Frozen baseline bytes changed: ' + file);
}
const allowed = file => file.startsWith('product-v2/') || file.startsWith('docs/product-v2/') ||
  file === '.github/workflows/pheisi-data-foundation.yml';
const changed = git(['diff', '--name-only', '-z', BASE, '--']).toString('utf8').split('\0').filter(Boolean);
const staged = git(['diff', '--cached', '--name-only', '-z', BASE, '--']).toString('utf8').split('\0').filter(Boolean);
const untracked = git(['ls-files', '--others', '--exclude-standard', '-z']).toString('utf8').split('\0').filter(Boolean);
for (const file of [...changed, ...staged, ...untracked]) assert.ok(allowed(file), 'Outside foundation scope: ' + file);
console.log(JSON.stringify({status: 'PASS', baseline: BASE, preservedFiles: baseline.length,
  scope: 'ISOLATED_DATA_FOUNDATION_ONLY', productionModified: false, deploymentPerformed: false}));
