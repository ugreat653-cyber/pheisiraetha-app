'use strict';

// TEST ONLY: materialize the pinned Git blobs outside the repository.
// Neither frozen test suite is imported or run.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const packaging = require('../build.cjs');
const stage = fs.mkdtempSync(path.join(os.tmpdir(), 'pheisiraetha-core-test-'));
const inputs = packaging.materialize(stage, fs.readFileSync(path.join(__dirname, '..', 'entry.cjs')));
const analysis = require(path.join(stage, 'frozen', 'analysis.js'));
const safety = require(path.join(stage, 'frozen', 'safety.js'));
process.on('exit', () => {
  try { packaging.assertSourcesUnchanged(stage, inputs); }
  finally { fs.rmSync(stage, { recursive: true, force: true }); }
});
function freeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}
module.exports = { analysis, safety, stage, inputs, packaging, freeze };
