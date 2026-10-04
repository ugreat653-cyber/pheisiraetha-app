'use strict';

// Pre-3B-5 baseline only. app.js is unchanged from production reference
// 255a5d9d27461dcacaebc1bc80ab322dd54b4de8 at base 26d6685.
// Execute its real loader, validator, persist function and import callback in a
// private VM. Only initial rendering and the post-import UI callback are stubbed
// in memory. No host wiring, generation, DOM removal, reset or save-hook coverage.
// Run only: node --test browser-packaging/integration/app-state-baseline.test.cjs
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createHash } = require('node:crypto');
const fixtures = require('../runtime-core/fixtures.cjs');

const ROOT = path.resolve(__dirname, '../..');
const STORAGE_KEY = 'pheisiraetha_v01';
const LANGUAGE_KEY = 'pheisiraetha_language_v01';
const ONBOARDING_KEY = 'pheisiraetha_onboarding_v01';
const PRIVATE_API = '__APP_STATE_BASELINE_TEST_ONLY__';
const APP_SOURCE = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
const LOCALES_SOURCE = fs.readFileSync(path.join(ROOT, 'locales.js'), 'utf8');
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'browser-packaging/build-manifest.json'), 'utf8'));
const artifact = fs.readFileSync(path.join(ROOT, manifest.output.file));
assert.equal(manifest.phase, '2B-3B-2B');
assert.equal(createHash('sha256').update(artifact).digest('hex'), manifest.output.sha256);

const TAIL = '\n  render();\n\n})();';
assert.equal(APP_SOURCE.split(TAIL).length, 2, 'Locate exactly the existing final render call');
const TEST_SOURCE = APP_SOURCE.replace(TAIL, `
  renderAndFocusHeading = () => {};
  bindData();
  globalThis.${PRIVATE_API} = Object.freeze({ readState: () => state, validate: isValidBackup });
})();`);
// Existing fixture writer; the stored label is an ordinary frozen English label.
const fixture = (count = 1) => fixtures.fixture(count, Array(10).fill('Calm / contentment'));
// Transfer VM data without dropping any newly added undefined property.
const plain = value => structuredClone(value);

function appHarness(raw) {
  let phase = 'app';
  const entries = new Map([[STORAGE_KEY, raw], [LANGUAGE_KEY, 'en'], [ONBOARDING_KEY, '1']]);
  const writes = [], forbidden = [], alerts = [], listeners = new Map();
  const snapshotStorage = () => [...entries].sort(([a], [b]) => a.localeCompare(b));
  function deny(name) {
    forbidden.push(name);
    throw new Error(`TEST_ONLY_FORBIDDEN_IO: ${name}`);
  }
  function guard(name, value) {
    if (phase === 'facade') deny(name);
    return value;
  }
  const storage = {
    getItem(key) { guard('localStorage.getItem'); return entries.get(key) ?? null; },
    setItem(key, value) {
      guard('localStorage.setItem');
      writes.push(['setItem', key, String(value)]); entries.set(key, String(value));
    },
    removeItem(key) {
      guard('localStorage.removeItem'); writes.push(['removeItem', key]); entries.delete(key);
    },
    clear() { guard('localStorage.clear'); writes.push(['clear']); entries.clear(); }
  };
  const elements = new Map(['#exportBtn', '#importBtn', '#importFile', '#deleteBtn'].map(selector => [selector, {
    addEventListener(type, callback) { listeners.set(`${selector}:${type}`, callback); },
    click() { deny('unrequested control click'); }
  }]));
  const document = {
    querySelector(selector) {
      guard('document.querySelector');
      assert.ok(elements.has(selector), `Unexpected private harness selector: ${selector}`);
      return elements.get(selector);
    }
  };
  const sandbox = Object.create(null);
  for (const [name, value] of [['window', sandbox], ['document', document], ['localStorage', storage], ['navigator', {}]])
    Object.defineProperty(sandbox, name, { get() { return guard(name, value); } });
  for (const name of ['sessionStorage', 'indexedDB', 'caches', 'fetch', 'XMLHttpRequest', 'WebSocket',
    'EventSource', 'Worker', 'importScripts', 'crypto'])
    Object.defineProperty(sandbox, name, { get() { return deny(name); } });
  sandbox.alert = message => { guard('alert'); alerts.push(message); };
  sandbox.confirm = () => deny('confirm');
  const context = vm.createContext(sandbox, { codeGeneration: { strings: false, wasm: false } });
  const run = source => vm.runInContext(source, context, { timeout: 10000 });
  run(LOCALES_SOURCE);
  run(TEST_SOURCE);
  const app = context[PRIVATE_API];
  const importChange = listeners.get('#importFile:change');
  assert.equal(typeof importChange, 'function', 'Capture the actual production import callback');
  assert.deepEqual(writes, [], 'Seeded UI preferences must not create unrelated initialization writes');
  phase = 'facade';
  try { run(artifact.toString('utf8')); } finally { phase = 'app'; }
  assert.deepEqual(forbidden, []);
  const facade = context.PHEISIRAETHA_ANALYTICS_V1;

  return {
    readState: app.readState, validate: app.validate, writes, forbidden, alerts, snapshotStorage,
    messages: context.PHEISIRAETHA_LOCALES.en.translations,
    stored: key => entries.get(key),
    importRaw: text => importChange({ target: { files: [{ text: async () => text }] } }),
    evaluate() {
      // This is an explicit test invocation against committed state, never an
      // automatic import hook or production analytics transaction.
      const state = app.readState(), before = plain(state);
      const storageBefore = snapshotStorage(), writesBefore = writes.slice();
      phase = 'facade';
      let dto;
      try { dto = facade.evaluate(state); } finally { phase = 'app'; }
      assert.equal(app.readState(), state);
      assert.deepEqual(plain(state), before, 'Direct evaluation cannot add fields or mutate imported/loaded state');
      assert.deepEqual(snapshotStorage(), storageBefore, 'All stored bytes and keys remain unchanged');
      assert.deepEqual(writes, writesBefore, 'Direct evaluation cannot persist');
      assert.deepEqual(forbidden, [], 'Direct evaluation cannot access DOM, storage or network');
      assert.equal(dto.dtoVersion, 'pheisiraetha-render-v1');
      assert.ok(['APPROVED_BUNDLE', 'FALLBACK_ONLY', 'UNAVAILABLE'].includes(dto.mode));
      return dto;
    }
  };
}

for (const raw of ['{"version":', '{"version":"0.1.0","intent":null} trailing'])
  test(`invalid localStorage JSON retains original bytes: ${raw}`, () => {
    const app = appHarness(raw), storageBefore = app.snapshotStorage();
    const empty = { version: '0.1.0', lang: 'ru', intent: null };
    assert.deepEqual(plain(app.readState()), empty, 'Actual loader catch returns the existing fresh state');
    assert.equal(app.stored(STORAGE_KEY), raw, 'Loader does not repair the malformed entry');
    assert.deepEqual(app.writes, []);
    assert.deepEqual(app.alerts, []);
    assert.equal(app.evaluate().mode, 'FALLBACK_ONLY', 'Evaluate the fresh state separately, without parsing/salvaging storage');
    assert.deepEqual(app.snapshotStorage(), storageBefore);
    assert.equal(app.stored(STORAGE_KEY), raw);
  });

const accepted = [
  ['empty backup', () => ({ version: '0.1.0', lang: 'ru', intent: null })],
  ['intent without cycles', () => fixture(0)],
  ['ordinary completed cycle', () => fixture()],
  ['unknown stored properties', () => {
    const value = fixture();
    value.opaque = { keep: ['root', null] };
    value.intent.unknown = { keep: true };
    value.intent.cycles[0].unknown = { keep: ['cycle'] };
    return value;
  }],
  ['existing permissive ID/chronology/revision acceptance', () => {
    const value = fixture(2), [first, second] = value.intent.cycles;
    first.id = second.id = '';
    [first.createdAt, second.createdAt] = [second.createdAt, first.createdAt];
    first.intentional = 'unsure'; first.revision = { scope: 'Synthetic existing patch' };
    second.intentional = 'yes'; second.revision = {};
    return value;
  }]
];
for (const [name, make] of accepted) test(`accepted import baseline: ${name}`, async () => {
  const value = make(), raw = JSON.stringify(value), app = appHarness(JSON.stringify(fixture()));
  const old = app.readState(), keysBefore = app.snapshotStorage().map(([key]) => key);
  assert.equal(app.validate(value), true, 'Use the actual production validator, without adding analytical restrictions');
  await app.importRaw(raw);
  const imported = app.readState();
  assert.notEqual(imported, old, 'Actual accepted import replaces committed state');
  assert.deepEqual(plain(imported), value, 'Preserve the entire parsed accepted backup');
  assert.deepEqual(app.alerts, [app.messages.imported]);
  assert.deepEqual(app.writes, [['setItem', STORAGE_KEY, raw]], 'Only existing production persist writes the accepted backup');
  assert.deepEqual(app.snapshotStorage().map(([key]) => key), keysBefore);
  assert.equal(app.stored(LANGUAGE_KEY), 'en');
  assert.equal(app.stored(ONBOARDING_KEY), '1');
  app.evaluate();
  assert.equal(app.readState(), imported);
  assert.deepEqual(plain(imported), value);
});

const rejected = [
  ['missing intent', () => ({ version: '0.1.0', lang: 'en' })],
  ['unsupported version', () => ({ ...fixture(), version: 'future' })],
  ['UI language outside the existing backup validator', () => ({ ...fixture(), lang: 'de' })],
  ['wrong intent container', () => ({ ...fixture(), intent: [] })],
  ['numeric string rating', () => { const value = fixture(); value.intent.cycles[0].iep.desire = '7'; return value; }],
  ['invalid timestamp', () => { const value = fixture(); value.intent.cycles[0].createdAt = 'invalid'; return value; }],
  ['wrong cycles container', () => { const value = fixture(); value.intent.cycles = {}; return value; }],
  ['unknown revision key', () => { const value = fixture(); value.intent.cycles[0].revision = { unknown: 'text' }; return value; }],
  ['non-string revision value', () => { const value = fixture(); value.intent.cycles[0].revision = { scope: 1 }; return value; }]
];
for (const [name, make] of rejected) test(`rejected import baseline: ${name}`, async () => {
  const value = make(), raw = JSON.stringify(value), initial = fixture(2);
  initial.opaque = { keep: 'original committed state' };
  const app = appHarness(JSON.stringify(initial)), original = app.readState();
  const storageBefore = app.snapshotStorage();
  assert.equal(app.validate(value), false, 'Actual production rejection remains unchanged');
  await app.importRaw(raw);
  assert.equal(app.readState(), original, 'Rejected input cannot replace committed state');
  assert.deepEqual(plain(app.readState()), initial, 'No synthetic cycle, repair or new state');
  assert.deepEqual(app.snapshotStorage(), storageBefore);
  assert.deepEqual(app.writes, []);
  assert.deepEqual(app.alerts, [app.messages.importError]);
  assert.deepEqual(app.forbidden, []);
});

test('malformed import JSON does not replace committed state', async () => {
  const initial = fixture(), app = appHarness(JSON.stringify(initial)), original = app.readState();
  const storageBefore = app.snapshotStorage();
  await app.importRaw('{"version":');
  assert.equal(app.readState(), original);
  assert.deepEqual(plain(app.readState()), initial);
  assert.deepEqual(app.snapshotStorage(), storageBefore);
  assert.deepEqual(app.writes, []);
  assert.deepEqual(app.alerts, [app.messages.importError]);
  assert.deepEqual(app.forbidden, []);
});

const nonPersisting = [
  ['APPROVED_BUNDLE', () => fixture()],
  ['FALLBACK_ONLY', () => ({ version: '0.1.0', lang: 'en', intent: null })],
  ['UNAVAILABLE', () => {
    const value = fixture(2); value.intent.cycles[0].cie.primary = 'Synthetic older wording'; return value;
  }]
];
for (const [mode, make] of nonPersisting) test(`direct facade non-persistence baseline: ${mode}`, () => {
  const value = make(), raw = JSON.stringify(value), app = appHarness(raw);
  const original = app.readState(), storageBefore = app.snapshotStorage();
  const first = app.evaluate(), second = app.evaluate();
  assert.equal(first.mode, mode);
  assert.equal(second.mode, mode);
  assert.notEqual(first, second);
  assert.deepEqual(plain(first), plain(second));
  assert.equal(app.readState(), original);
  assert.deepEqual(plain(original), value, 'No results, approvals, sources or generations added to state');
  assert.deepEqual(app.snapshotStorage(), storageBefore);
  assert.equal(app.stored(STORAGE_KEY), raw);
  assert.deepEqual(app.writes, []);
  assert.deepEqual(app.alerts, []);
  assert.deepEqual(app.snapshotStorage().map(([key]) => key), [LANGUAGE_KEY, ONBOARDING_KEY, STORAGE_KEY].sort());
});
