'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { harness, assertDto, freeze } = require('./test-support.cjs');

const h = harness(), labels = h.analysis.EMOTION_LABELS.en;
const MF3 = 'safety.manifest.primaryFactualWithCapability';
const MF4 = 'safety.manifest.primaryAndSecondaryFactualWithCapability';
const FALLBACK_ID = 'safety.fallback.noInterpretationOrNextFocus';
const FALLBACK_TEXT = 'No interpretation or next focus is shown here.';
const PRIMARY_SLOTS = ['primary.insight', 'primary.why.values', 'primary.why.selection',
  'primary.why.limitations', 'primary.why.capability'];
const SECONDARY_SLOTS = ['secondary.insight', 'secondary.why.values',
  'secondary.why.selection', 'secondary.why.limitations'];

function assertRejectedPlan(source, manifestId, corrupt) {
  let actualPlanBuilds = 0, expectedPlan;
  // Only the private plan hook changes data. Analysis, Safety, the coherence gate
  // and formatter delegate to their actual implementations without result mocks.
  h.reset({ plan: (actual, args) => {
    const plan = actual(...args);
    actualPlanBuilds++;
    const engine = args[0].engineResult;
    assert.notEqual(engine.primary, null);
    assert.equal(engine.secondary === null, manifestId === MF3);
    assert.equal(plan.manifestId, manifestId);
    assert.equal(plan.manifestVersion, 1);
    assert.deepEqual(plan.components.map(c => c.slot),
      manifestId === MF3 ? PRIMARY_SLOTS : [...PRIMARY_SLOTS, ...SECONDARY_SLOTS]);
    const original = structuredClone(plan);
    expectedPlan = corrupt(plan, original);
    assert.deepEqual(plan, expectedPlan, 'only the specified plan fault is injected');
    return plan;
  } });

  const dto = h.evaluate(freeze(source));
  assert.equal(actualPlanBuilds, 1, 'actual plan built once; no weaker-plan retry');
  for (const stage of ['snapshot', 'analyze', 'plan', 'assess', 'gate', 'format'])
    assert.equal(h.calls[stage].length, 1, `${stage} called exactly once`);

  const captured = h.calls.snapshot[0].result;
  assert.equal(h.calls.analyze[0].args.length, 1);
  assert.equal(h.calls.analyze[0].args[0], captured);
  assert.equal(h.calls.plan[0].args[0].sourceSnapshot, captured);
  assert.equal(h.calls.plan[0].args[0].engineResult, h.calls.analyze[0].result);
  assert.equal(h.calls.plan[0].args[0].trustedRegistry, h.registry);
  const assessed = h.calls.assess[0];
  assert.equal(assessed.args.length, 1);
  const request = assessed.args[0];
  assert.deepEqual(Object.keys(request), ['sourceSnapshot', 'engineResult', 'presentationPlan']);
  assert.equal(request.sourceSnapshot, captured);
  assert.equal(request.engineResult, h.calls.analyze[0].result);
  assert.equal(request.presentationPlan, h.calls.plan[0].result);
  assert.deepEqual(request.presentationPlan, expectedPlan);
  assert.equal(request.presentationPlan.manifestId, manifestId, 'original manifest retained');

  const result = assessed.result;
  assert.equal(result.verdict, 'UNKNOWN');
  assert.equal(result.componentResults.find(c => c.componentId === 'primary.insight').verdict, 'ALLOW',
    'otherwise allowed primary is suppressed by the failed bundle');
  assert.equal(result.fallbackVerdict, 'ALLOW');
  assert.deepEqual(result.presentation, {
    dtoVersion: 'safety-presentation-v1', mode: 'FALLBACK_ONLY', primary: null, secondary: null,
    fallback: { templateId: FALLBACK_ID, templateVersion: 1, role: 'FALLBACK', bindings: {} }
  });
  assert.equal(h.calls.gate[0].args.length, 1);
  assert.equal(h.calls.gate[0].args[0], result);
  assert.equal(h.calls.gate[0].result, result.presentation);
  assert.equal(h.calls.format[0].args.length, 1);
  assert.equal(h.calls.format[0].args[0], result.presentation,
    'formatter receives the actual Safety presentation; no manufactured fallback');

  const entry = h.registry.find(e => e.templateId === FALLBACK_ID);
  assert.equal(entry.role, 'FALLBACK');
  assert.equal(entry.templateVersion, 1);
  assert.equal(entry.canonicalText, FALLBACK_TEXT);
  const components = [{ componentId: 'fallback', surface: 'FALLBACK', role: 'FALLBACK', slot: 'fallback',
    templateId: FALLBACK_ID, templateVersion: 1, text: entry.canonicalText }];
  assert.deepEqual(h.calls.format[0].result, components);
  assertDto(dto, 'FALLBACK_ONLY');
  assert.deepEqual(dto, { dtoVersion: 'pheisiraetha-render-v1', mode: 'FALLBACK_ONLY',
    lang: 'en', dir: 'ltr', components });
  assert.notEqual(dto.components, h.calls.format[0].result);
}

test('failed MF4 secondary reaches actual Safety UNKNOWN and suppresses the complete bundle without downgrade or retry', () => {
  const unregistered = 'private.unregistered.secondary.insight';
  assert.equal(h.registry.some(e => e.templateId === unregistered), false);
  assertRejectedPlan(h.fixtures.fixture(1, labels), MF4, (plan, original) => {
    const index = original.components.findIndex(c => c.slot === 'secondary.insight');
    assert.equal(index, 5);
    assert.ok(h.registry.some(e => e.templateId === original.components[index].templateId));
    plan.components[index].templateId = unregistered;
    original.components[index].templateId = unregistered;
    assert.equal(plan.components.length, 9);
    return original;
  });
  assert.equal(h.calls.assess[0].result.componentResults
    .find(c => c.componentId === 'secondary.insight').verdict, 'UNKNOWN');
});

test('missing MF3 E30 reaches actual Safety UNKNOWN and leaves only its exact fallback without primary salvage', () => {
  assertRejectedPlan(h.fixtures.reflection(labels, 'B4', true), MF3, (plan, original) => {
    const index = original.components.findIndex(c => c.slot === 'primary.why.capability');
    assert.equal(index, 4);
    assert.equal(original.components[index].templateId, 'safety.why.conditionAssessmentUnavailable');
    plan.components.splice(index, 1);
    original.components.splice(index, 1);
    assert.equal(plan.components.length, 4);
    return original;
  });
});
