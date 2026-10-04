'use strict';

// TEST ONLY. Instrument module exports in memory before composition; source bytes
// and the production entry remain exact. This file is outside the build graph.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const build = require('../build.cjs');
const fixtures = require('../runtime-core/fixtures.cjs');
const temporary = [];
function freeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze); Object.freeze(value);
  }
  return value;
}
function harness(editRegistry = null) {
  const stage = fs.mkdtempSync(path.join(os.tmpdir(), 'pheisiraetha-facade-test-'));
  const sources = build.materialize(stage, fs.readFileSync(path.join(__dirname, '..', 'entry.cjs')));
  temporary.push({ stage, sources });
  const load = file => require(path.join(stage, file));
  const analysis = load('frozen/analysis.js'), safety = load('frozen/safety.js');
  const adapter = load('runtime-core/source-snapshot.cjs'), plans = load('runtime-core/presentation-plan.cjs');
  const original = { analyze: analysis.analyze, assess: safety.assessPresentation,
    snapshot: adapter.buildAnalysisSourceSnapshot, plan: plans.buildPresentationPlan };
  const registry = safety.TEMPLATE_REGISTRY;
  if (editRegistry) {
    const replacement = structuredClone(registry); editRegistry(replacement); safety.TEMPLATE_REGISTRY = freeze(replacement);
  }
  const contract = load('runtime-facade/safety-contract.cjs'), formatter = load('runtime-facade/canonical-formatter.cjs');
  const originals = { ...original, gate: contract.validateSafetyResult, format: formatter.formatPresentation };
  let hooks = {}, calls = {};
  const reset = (next = {}) => { hooks = next; calls = Object.fromEntries(Object.keys(originals).map(key => [key, []])); };
  reset();
  for (const [key, target, name] of [['snapshot', adapter, 'buildAnalysisSourceSnapshot'], ['analyze', analysis, 'analyze'],
    ['plan', plans, 'buildPresentationPlan'], ['assess', safety, 'assessPresentation'], ['gate', contract, 'validateSafetyResult'],
    ['format', formatter, 'formatPresentation']]) target[name] = (...args) => {
      const call = { args }; calls[key].push(call);
      call.result = hooks[key] ? hooks[key](originals[key], args) : originals[key](...args);
      return call.result;
    };
  const runtime = load('runtime-facade/runtime.cjs');
  function approved(source) {
    const sourceSnapshot = originals.snapshot(source), engineResult = originals.analyze(sourceSnapshot);
    const presentationPlan = originals.plan({ sourceSnapshot, engineResult, trustedRegistry: registry });
    return originals.assess({ sourceSnapshot, engineResult, presentationPlan });
  }
  const bank = fixtures.scenarios(analysis.EMOTION_LABELS.en);
  return { stage, sources, originals, reset, get calls() { return calls; }, evaluate: runtime.evaluate,
    format: originals.format, gate: originals.gate, approved, analysis, registry, bank, fixtures, freeze };
}
const TOP_KEYS = ['dtoVersion', 'mode', 'lang', 'dir', 'components'];
const COMPONENT_KEYS = ['componentId', 'surface', 'role', 'slot', 'templateId', 'templateVersion', 'text'];
const UNAVAILABLE = Object.freeze({ dtoVersion: 'pheisiraetha-render-v1', mode: 'UNAVAILABLE', lang: 'en', dir: 'ltr', components: [] });
function assertDto(dto, mode) {
  assert.deepEqual(Object.keys(dto), TOP_KEYS); assert.equal(dto.dtoVersion, 'pheisiraetha-render-v1');
  assert.equal(dto.mode, mode); assert.equal(dto.lang, 'en'); assert.equal(dto.dir, 'ltr');
  assert.ok(Object.isFrozen(dto)); assert.ok(Object.isFrozen(dto.components));
  assert.equal(Object.getPrototypeOf(dto), Object.prototype);
  for (const c of dto.components) {
    assert.deepEqual(Object.keys(c), COMPONENT_KEYS); assert.ok(Object.isFrozen(c));
    assert.equal(Object.getPrototypeOf(c), Object.prototype); assert.equal(c.templateVersion, 1); assert.equal(typeof c.text, 'string');
  }
}
process.on('exit', () => {
  for (const item of temporary) {
    try { build.assertSourcesUnchanged(item.stage, item.sources); }
    finally { fs.rmSync(item.stage, { recursive: true, force: true }); }
  }
});
module.exports = { harness, freeze, assertDto, UNAVAILABLE, COMPONENT_KEYS, TOP_KEYS, build };
