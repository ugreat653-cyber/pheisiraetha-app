'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const esbuild = require('../node_modules/esbuild');
const { analysis, safety, packaging, stage } = require('./test-support.cjs');
const { buildAnalysisSourceSnapshot: snapshot } = require('./source-snapshot.cjs');
const { buildPresentationPlan: plan } = require('./presentation-plan.cjs');
const { scenarios } = require('./fixtures.cjs');
const ARTIFACT_SHA = '45deb294b2ecc2a8a1f3bf7067d5822d0676841ab82c36d4c95db08b9bfa821a';
const artifact = path.join(__dirname, '..', 'artifacts', `analytics-v1.${ARTIFACT_SHA}.js`);

function browser() {
  const sandbox = {}, attempts = [];
  const blocked = ['fetch', 'XMLHttpRequest', 'WebSocket', 'EventSource', 'navigator', 'document',
    'localStorage', 'sessionStorage', 'indexedDB', 'caches', 'console', 'require', 'module', 'exports', 'process', 'Buffer'];
  for (const name of blocked) Object.defineProperty(sandbox, name, {
    configurable: true, get() { attempts.push(name); throw new Error('TEST_ONLY_BLOCKED_INTERFACE'); }
  });
  sandbox.window = sandbox; sandbox.self = sandbox;
  const context = vm.createContext(sandbox);
  vm.runInContext('Date.now = () => { throw new Error("TEST_ONLY_CLOCK"); }; Math.random = () => { throw new Error("TEST_ONLY_RANDOM"); };', context);
  return { context, attempts };
}
test('committed 3B-1 artifact is byte-identical and still exposes no global analytical API', () => {
  const bytes = fs.readFileSync(artifact);
  assert.equal(packaging.sha256(bytes), ARTIFACT_SHA);
  const { context, attempts } = browser();
  const before = vm.runInContext('Reflect.ownKeys(globalThis)', context);
  vm.runInContext(bytes.toString('utf8'), context);
  assert.deepEqual(vm.runInContext('Reflect.ownKeys(globalThis)', context), before);
  assert.deepEqual(attempts, []);
});
test('pure core test IIFE has Node/browser parity without runtime IO, clock, random or public registration', () => {
  assert.equal(esbuild.version, '0.25.5');
  // Temporary in-memory test exposure only; never written to an artifact or entry.
  const entry = `const snapshot = require(${JSON.stringify(path.join(__dirname, 'source-snapshot.cjs'))}).buildAnalysisSourceSnapshot;
const plan = require(${JSON.stringify(path.join(__dirname, 'presentation-plan.cjs'))}).buildPresentationPlan;
const registry = require(${JSON.stringify(path.join(stage, 'frozen', 'safety.js'))}).TEMPLATE_REGISTRY;
globalThis.__TEST_ONLY_CORE = { snapshot, plan: (sourceSnapshot, engineResult) => plan({sourceSnapshot, engineResult, trustedRegistry: registry}) };`;
  const bundle = esbuild.buildSync({ stdin: { contents: entry, resolveDir: __dirname, sourcefile: 'test-only-entry.cjs' },
    bundle: true, platform: 'browser', format: 'iife', minify: false, treeShaking: false, plugins: [],
    write: false, metafile: true, logLevel: 'silent' });
  assert.equal(bundle.metafile.outputs[Object.keys(bundle.metafile.outputs)[0]].imports.length, 0);
  const { context, attempts } = browser();
  vm.runInContext(bundle.outputFiles[0].text, context);
  for (const scenario of scenarios(analysis.EMOTION_LABELS.en)) {
    const sourceSnapshot = snapshot(scenario.source), engineResult = analysis.analyze(sourceSnapshot);
    const expected = plan({ sourceSnapshot, engineResult, trustedRegistry: safety.TEMPLATE_REGISTRY });
    const result = vm.runInContext(`JSON.stringify((() => {
      const source = __TEST_ONLY_CORE.snapshot(JSON.parse(${JSON.stringify(JSON.stringify(scenario.source))}));
      const engine = JSON.parse(${JSON.stringify(JSON.stringify(engineResult))});
      return { source, plan: __TEST_ONLY_CORE.plan(source, engine) };
    })())`, context);
    assert.deepEqual(JSON.parse(result), { source: sourceSnapshot, plan: expected }, scenario.name);
  }
  assert.deepEqual(attempts, []);
  vm.runInContext('delete globalThis.__TEST_ONLY_CORE', context);
  assert.equal(vm.runInContext('Object.hasOwn(globalThis, "__TEST_ONLY_CORE")', context), false);
});
