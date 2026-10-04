'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { harness, assertDto, UNAVAILABLE, freeze } = require('./test-support.cjs');
const h = harness(), labels = h.analysis.EMOTION_LABELS.en;
const primary = () => h.fixtures.reflection(labels, 'B4', true);
const both = () => h.fixtures.fixture(1, labels);
const empty = () => ({ version: '0.1.0', intent: null });
const FALLBACK = 'No interpretation or next focus is shown here.';
function unavailable(value) { assertDto(value, 'UNAVAILABLE'); assert.deepEqual(value, UNAVAILABLE); }

for (const [name, make, count] of [['MF3', primary, 5], ['MF4', both, 9]]) test(`evaluate ${name}: exact immutable render-only DTO`, () => {
  h.reset(); const source = make(), before = structuredClone(source), dto = h.evaluate(freeze(source));
  assertDto(dto, 'APPROVED_BUNDLE'); assert.equal(dto.components.length, count);
  assert.deepEqual(dto.components.map(c => c.slot), ['primary.insight', 'primary.why.values', 'primary.why.selection',
    'primary.why.limitations', 'primary.why.capability', ...(count === 9 ? ['secondary.insight', 'secondary.why.values',
      'secondary.why.selection', 'secondary.why.limitations'] : [])]);
  assert.deepEqual(source, before);
  for (const stage of ['snapshot', 'analyze', 'plan', 'assess', 'gate', 'format']) assert.equal(h.calls[stage].length, 1, stage);
  const captured = h.calls.snapshot[0].result;
  assert.notEqual(captured, source);
  assert.equal(h.calls.analyze[0].args.length, 1); assert.equal(h.calls.analyze[0].args[0], captured);
  assert.equal(h.calls.plan[0].args[0].sourceSnapshot, captured);
  assert.equal(h.calls.plan[0].args[0].trustedRegistry, h.registry);
  assert.equal(h.calls.assess[0].args.length, 1);
  assert.deepEqual(Object.keys(h.calls.assess[0].args[0]), ['sourceSnapshot', 'engineResult', 'presentationPlan']);
  assert.equal(h.calls.assess[0].args[0].sourceSnapshot, captured);
  assert.equal(h.calls.assess[0].args[0].engineResult, h.calls.analyze[0].result);
  assert.equal(h.calls.assess[0].args[0].presentationPlan, h.calls.plan[0].result);
  assert.equal(h.calls.format[0].args.length, 1);
  assert.equal(h.calls.format[0].args[0], h.calls.assess[0].result.presentation);
});
test('empty primary uses null-manifest request, invokes actual frozen Safety once, and formats its actual fallback', () => {
  h.reset(); const dto = h.evaluate(empty());
  assertDto(dto, 'FALLBACK_ONLY'); assert.equal(dto.components.length, 1); assert.equal(dto.components[0].text, FALLBACK);
  assert.equal(h.calls.analyze[0].result.primary, null); assert.equal(h.calls.plan[0].result.manifestId, null);
  assert.deepEqual(h.calls.plan[0].result.components, []); assert.equal(h.calls.assess.length, 1);
  assert.equal(h.calls.assess[0].result.verdict, 'UNKNOWN');
  assert.equal(h.calls.format[0].args[0], h.calls.assess[0].result.presentation);
});
test('a new deterministic DTO is constructed for every success, fallback and failure', () => {
  for (const source of [primary(), both(), empty(), { invalid: undefined }]) {
    h.reset(); const first = h.evaluate(source), second = h.evaluate(source);
    assert.deepEqual(first, second); assert.notEqual(first, second); assert.notEqual(first.components, second.components);
    for (let i = 0; i < first.components.length; i++) assert.notEqual(first.components[i], second.components[i]);
  }
});
test('caller state changes cannot affect an already returned DTO; DTO mutation cannot affect caller state', () => {
  h.reset(); const source = both(), dto = h.evaluate(source), before = structuredClone(dto);
  source.intent.cycles[0].iep.practical = 1; source.intent.ris.primary = 'changed'; source.intent.cycles = [];
  assert.deepEqual(dto, before);
  assert.throws(() => { dto.mode = 'UNAVAILABLE'; }, TypeError);
  assert.throws(() => { dto.components[0].text = 'changed'; }, TypeError);
  assert.throws(() => { dto.components.push({}); }, TypeError);
  assert.equal(source.intent.ris.primary, 'changed');
});
for (const [name, source] of [['undefined', undefined], ['nonfinite', { value: Infinity }], ['executable', { callback() {} }],
  ['circular', (() => { const s = {}; s.self = s; return s; })()]]) test(`adapter failure ${name}: UNAVAILABLE before Analysis or Safety`, () => {
    h.reset(); unavailable(h.evaluate(source)); assert.equal(h.calls.analyze.length, 0); assert.equal(h.calls.assess.length, 0); assert.equal(h.calls.format.length, 0);
  });
test('adapter accessor fails without invoking the getter', () => {
  let calls = 0; h.reset(); unavailable(h.evaluate(Object.defineProperty({}, 'version', { enumerable: true, get() { calls++; return '0.1.0'; } })));
  assert.equal(calls, 0); assert.equal(h.calls.assess.length, 0);
});
test('actual adjacent-only TXT mapping failure returns UNAVAILABLE without Safety or a weaker plan', () => {
  const source = h.fixtures.fixture(2, labels); source.intent.cycles[0].cie.primary = 'Synthetic older wording';
  h.reset(); unavailable(h.evaluate(source));
  assert.equal(h.calls.analyze[0].result.primary.ruleId, 'TXT-01'); assert.equal(h.calls.plan.length, 1);
  assert.equal(h.calls.assess.length, 0); assert.equal(h.calls.format.length, 0);
});
for (const stage of ['analyze', 'plan', 'assess', 'gate', 'format']) test(`private fault at ${stage}: closed UNAVAILABLE, no retry`, () => {
  h.reset({ [stage]: () => { throw new Error('PRIVATE_SYNTHETIC_EXCEPTION_MUST_NOT_LEAK'); } });
  const dto = h.evaluate(both()); unavailable(dto); assert.equal(h.calls[stage].length, 1);
  assert.equal(JSON.stringify(dto).includes('PRIVATE_SYNTHETIC'), false);
  assert.ok(h.calls.assess.length <= 1); assert.ok(h.calls.format.length <= 1);
});
test('DTO construction failure also returns body-free UNAVAILABLE', () => {
  h.reset({ format: () => Array.from({ length: 5 }, () => ({ text: 'PRIVATE_MALFORMED_COMPONENT' })) });
  unavailable(h.evaluate(primary())); assert.equal(h.calls.assess.length, 1);
});
test('a previous successful DTO is never reused after later failure', () => {
  h.reset(); const old = h.evaluate(both()), oldCopy = structuredClone(old);
  h.reset({ assess: () => { throw new Error('private'); } });
  const later = h.evaluate(both()); unavailable(later); assert.notEqual(old, later); assert.deepEqual(old, oldCopy);
  h.reset(); assert.deepEqual(h.evaluate(both()), old);
});
for (const [name, mutate] of [
  ['safetyVersion', r => { r.safetyVersion = 'safety-v2'; }], ['registryVersion', r => { r.registryVersion = null; }],
  ['objectiveMeaning', r => { r.objectiveMeaning = 'SAFE'; }], ['causality', r => { r.causality = 'determined'; }],
  ['persisted', r => { r.persisted = true; }], ['engineReference', r => { r.engineReference.sourceCommit = 'other'; }],
  ['presentation version', r => { r.presentation.dtoVersion = 'future'; }], ['ALLOW/fallback mismatch', r => { r.presentation.mode = 'FALLBACK_ONLY'; }],
  ['ALLOW missing primary', r => { r.presentation.primary = null; }], ['ALLOW fallback present', r => { r.presentation.fallback = {}; }],
  ['unknown verdict', r => { r.verdict = 'APPROVED'; }], ['missing result key', r => { delete r.persisted; }],
  ['extra result key', r => { r.rawSource = { private: true }; }], ['incomplete primary Why', r => { r.presentation.primary.why.pop(); }],
  ['secondary failure', r => { r.presentation.secondary.insight.templateId = 'unregistered'; }],
  ['extra presentation field', r => { r.presentation.interpretation = 'private'; }],
  ['malformed component diagnostic', r => { r.componentResults[0] = 'ALLOW'; }],
  ['extra diagnostic key', r => { r.componentResults[0].approved = true; }],
  ['wrong diagnostic identity type', r => { r.componentResults[0].componentId = 1; }],
  ['malformed diagnostic reasons', r => { r.componentResults[0].reasonCodes = 'REGISTERED_PRESENTATION'; }]
]) test(`malformed/incoherent Safety output ${name}: UNAVAILABLE`, () => {
  h.reset({ assess: (actual, args) => { const result = actual(...args); mutate(result); return result; } });
  unavailable(h.evaluate(both())); assert.equal(h.calls.assess.length, 1);
});
test('coherent actual frozen Safety HOLD fallback is accepted through the Safety-result path only', () => {
  h.reset({ assess: (actual, [request]) => {
    const engineResult = structuredClone(request.engineResult); engineResult.safety.externalDecision = 'HOLD';
    return actual({ ...request, engineResult });
  } });
  const dto = h.evaluate(both()); assertDto(dto, 'FALLBACK_ONLY'); assert.equal(dto.components[0].text, FALLBACK);
  assert.equal(h.calls.assess.length, 1); assert.equal(h.calls.assess[0].result.verdict, 'HOLD');
  assert.equal(h.calls.format[0].args[0], h.calls.assess[0].result.presentation);
});
for (const verdict of ['HOLD', 'UNKNOWN']) test(`${verdict}/APPROVED_BUNDLE mismatch cannot authorize format`, () => {
  h.reset({ assess: (actual, args) => { const result = actual(...args); result.verdict = verdict; return result; } });
  unavailable(h.evaluate(both())); assert.equal(h.calls.format.length, 0);
});
test('componentResults/bundleReasonCodes cannot authorize a missing or fallback presentation', () => {
  const allowed = h.approved(both());
  h.reset({ assess: (actual, args) => { const result = actual(...args); result.presentation = null; return result; } });
  unavailable(h.evaluate(both())); assert.equal(h.calls.format.length, 0);
  h.reset({ assess: (actual, args) => { const result = actual(...args); result.componentResults = allowed.componentResults;
    result.bundleReasonCodes = ['REGISTERED_PRESENTATION']; return result; } });
  const dto = h.evaluate(empty()); assertDto(dto, 'FALLBACK_ONLY'); assert.equal(dto.components[0].text, FALLBACK);
});
test('Safety failure never manufactures a direct fallback', () => {
  h.reset({ assess: () => null }); unavailable(h.evaluate(empty())); assert.equal(h.calls.format.length, 0);
  h.reset({ assess: () => { throw new Error('private'); } }); unavailable(h.evaluate(empty())); assert.equal(h.calls.format.length, 0);
});
test('caller authority options and extra arguments are rejected before the authority chain', () => {
  h.reset(); unavailable(h.evaluate(both(), { registry: h.registry, locale: 'de', approval: true }));
  assert.equal(h.calls.snapshot.length, 0); assert.equal(h.calls.assess.length, 0);
  unavailable(h.evaluate()); assert.equal(h.evaluate.length, 1); assert.ok(Object.isFrozen(h.evaluate));
  assert.equal(Object.hasOwn(h.evaluate, 'prototype'), false);
});
test('legacy lang / unknown stored preference fields cannot select analytics locale or authority', () => {
  h.reset(); const reference = h.evaluate(both());
  for (const lang of ['de', 'ru', 'ar', 'he', 'unknown']) {
    const source = both(); source.lang = lang; source.uiLocale = lang; source.approval = 'ALLOW'; source.registry = 'caller override';
    assert.deepEqual(h.evaluate(source), reference);
  }
});
test('DTO retains no object references to any internal source, plan, result, bindings or registry', () => {
  h.reset(); const source = both(), dto = h.evaluate(source), internal = new Set();
  const collect = value => { if (value && typeof value === 'object' && !internal.has(value)) {
    internal.add(value); Object.values(value).forEach(collect);
  } };
  collect(source); collect(h.registry);
  for (const calls of Object.values(h.calls)) for (const call of calls) { collect(call.args); collect(call.result); }
  const check = value => { if (value && typeof value === 'object') { assert.equal(internal.has(value), false); Object.values(value).forEach(check); } };
  check(dto);
});
test('no raw authority, bindings, selectors, reason codes or upstream structures in public DTO', () => {
  h.reset(); const dto = h.evaluate(both()); assertDto(dto, 'APPROVED_BUNDLE');
  for (const value of [dto, ...dto.components]) for (const forbidden of ['sourceSnapshot', 'committedState', 'engineResult',
    'presentationPlan', 'SafetyResult', 'componentResults', 'bundleReasonCodes', 'bindings', 'registry', 'candidate',
    'interpretation', 'nextFocus', 'whyThisFocus', 'generation', 'stateToken', 'engineSelector', 'diagnostics'])
    assert.equal(Object.hasOwn(value, forbidden), false);
  assert.equal(JSON.stringify(dto).includes('analysis.'), false);
});
