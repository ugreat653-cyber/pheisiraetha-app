'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { buildAnalysisSourceSnapshot: snapshot } = require('./source-snapshot.cjs');
const { buildPresentationPlan: build } = require('./presentation-plan.cjs');
const { analysis, safety, freeze } = require('./test-support.cjs');
const { D, METRICS, fixture, reflection, scenarios } = require('./fixtures.cjs');
const labels = analysis.EMOTION_LABELS.en;
const registry = safety.TEMPLATE_REGISTRY;
const bank = scenarios(labels);
const MF3 = 'safety.manifest.primaryFactualWithCapability', MF4 = 'safety.manifest.primaryAndSecondaryFactualWithCapability';
const PRIMARY = ['primary.insight', 'primary.why.values', 'primary.why.selection', 'primary.why.limitations', 'primary.why.capability'];
const SECONDARY = ['secondary.insight', 'secondary.why.values', 'secondary.why.selection', 'secondary.why.limitations'];
const ABSENT3 = ['primary.interpretation', 'primary.nextFocus', 'secondary'];
const ABSENT4 = ['primary.interpretation', 'primary.nextFocus', 'secondary.interpretation', 'secondary.nextFocus', 'secondary.whyThisFocus'];
const row = id => registry.find(entry => entry.row === id);
function input(source = fixture(1, labels)) {
  const sourceSnapshot = snapshot(source);
  return { sourceSnapshot, engineResult: analysis.analyze(sourceSnapshot), trustedRegistry: registry };
}
const fails = request => assert.throws(() => build(request), error => error.name === 'RuntimeCoreFailure' &&
  /^PLAN_[A-Z_]+$/.test(error.code) && error.message === error.code && !Object.hasOwn(error, 'cause'));

// Independent section-4 reference oracle. Only test code reads the binding field
// metadata; the runtime's private catalog / readers are never used as an oracle.
function expectedRefs(source, candidate, def, tuple) {
  const indices = candidate.ruleEvaluation.usedArrayIndices;
  const refs = (fields, selected = indices) => selected.flatMap(arrayIndex => fields.map(field => ({
    arrayIndex, cycleId: source.intent.cycles[arrayIndex].id, path: `intent.cycles[${arrayIndex}].${field}`
  })));
  const selector = def.selector === null ? def.selectorByMetric[tuple.metric] : def.selector;
  if (['U.metricLabel', 'U.units', 'U.scope', 'I.metricLabel', 'FIXED_FIELDS', 'SELECTED_RULE'].includes(selector)) return [];
  if (selector === 'ENGINE_ORDINAL') return refs(['iep.frequency']);
  if (selector === 'ENGINE_EMOTION_CURRENT' || selector === 'ENGINE_EMOTION_RECURRENT') return refs(['iep.emotion']);
  if (selector === 'ENGINE_DIMENSIONS') return [...refs(D.map(d => `cie.${d}`), [indices.at(-1)]), ...D.map(d => ({ path: `intent.ris.${d}` }))];
  if (selector === 'ENGINE_DIMENSION') return [...refs([`cie.${tuple.dimension}`]), { path: `intent.ris.${tuple.dimension}` }];
  if (['REVISION_KEYS', 'REVISION_EVENT_COUNT', 'REVISION_KEY_COUNTS'].includes(selector)) return refs(['intentional', 'revision']);
  const field = def.field || (candidate.ruleId === 'CMP-01' ? METRICS.find(m => m[0] === tuple.metric)?.[1] :
    tuple.metric === 'mental' ? 'iep.mental' : tuple.metric === 'emotionIntensity' ? 'iep.emotionIntensity' : undefined);
  assert.ok(field, `closed fixture selector ${selector}`);
  return refs([field]);
}
function assertEnvelope(plan, engine) {
  assert.deepEqual(Object.keys(plan), ['policyVersion', 'registryVersion', 'manifestId', 'manifestVersion', 'components', 'declaredAbsentSlots']);
  assert.equal(plan.policyVersion, 'safety-v1'); assert.equal(plan.registryVersion, 'safety-registry-v1'); assert.equal(plan.manifestVersion, 1);
  assert.equal(plan.manifestId, engine.secondary === null ? MF3 : MF4);
  assert.deepEqual(plan.components.map(c => c.slot), engine.secondary === null ? PRIMARY : [...PRIMARY, ...SECONDARY]);
  assert.deepEqual(plan.declaredAbsentSlots, engine.secondary === null ? ABSENT3 : ABSENT4);
  for (const component of plan.components) {
    assert.deepEqual(Object.keys(component), ['componentId', 'surface', 'role', 'slot', 'templateId', 'templateVersion',
      'ruleId', 'candidateId', 'engineSelector', 'bindings']);
    assert.equal(component.componentId, component.slot); assert.equal(component.templateVersion, 1);
    assert.ok(['INSIGHT', 'WHY'].includes(component.role));
    for (const binding of component.bindings) {
      assert.deepEqual(Object.keys(binding), ['name', 'selector', 'sourceRefs']);
      for (const ref of binding.sourceRefs)
        assert.deepEqual(Object.keys(ref), ref.path.startsWith('intent.ris.') ? ['path'] : ['arrayIndex', 'cycleId', 'path']);
    }
  }
}
function expectedE30() {
  return { componentId: 'primary.why.capability', surface: 'PRIMARY', role: 'WHY', slot: 'primary.why.capability',
    templateId: 'safety.why.conditionAssessmentUnavailable', templateVersion: 1, ruleId: null, candidateId: null,
    engineSelector: { capabilityPath: 'capabilities.VAQUQA', ruleId: 'COND-01', status: 'capability_gap', conditionSufficiency: 'unavailable' }, bindings: [] };
}

for (const scenario of bank) test(`actual frozen selection: ${scenario.name}`, () => {
  const request = freeze(input(scenario.source)), { sourceSnapshot: source, engineResult: engine } = request;
  const beforeSource = snapshot(source), beforeEngine = snapshot(engine), plan = build(request);
  const candidate = scenario.surface === 'PRIMARY' ? engine.primary : engine.secondary;
  assert.equal(candidate.candidateId, scenario.candidateId);
  assertEnvelope(plan, engine);
  const insight = plan.components.find(c => c.slot === `${scenario.surface.toLowerCase()}.insight`);
  assert.equal(insight.templateId, row(scenario.row).templateId);
  assert.deepEqual(plan.components[4], expectedE30());
  for (const component of plan.components.filter(c => c.slot !== 'primary.why.capability')) {
    const selected = component.surface === 'PRIMARY' ? engine.primary : engine.secondary;
    const entry = registry.find(e => e.templateId === component.templateId);
    assert.deepEqual(Object.keys(component.engineSelector), ['ruleId', 'candidateId', 'key', 'metric', 'dimension', 'branch', 'variant']);
    assert.equal(component.ruleId, selected.ruleId); assert.equal(component.candidateId, selected.candidateId);
    assert.equal(component.engineSelector.key, selected.titleKey);
    assert.ok(entry.engineMappings.some(m => assertTuple(m.selector, component.engineSelector) && m.allowedSurfaces.includes(component.surface)));
    assert.deepEqual(component.bindings.map(b => b.name), entry.allowedBindings.map(b => b.name));
    for (let i = 0; i < component.bindings.length; i++) {
      const def = entry.allowedBindings[i], binding = component.bindings[i];
      assert.equal(binding.selector, def.selector === null ? def.selectorByMetric[component.engineSelector.metric] : def.selector);
      assert.deepEqual(binding.sourceRefs, expectedRefs(source, selected, def, component.engineSelector));
    }
    const surfaceInsight = plan.components.find(c => c.slot === `${component.surface.toLowerCase()}.insight`);
    assert.deepEqual(component.engineSelector, surfaceInsight.engineSelector);
  }
  // Focused integration oracle only: no Safety invocation exists in core code.
  const result = safety.assessPresentation({ sourceSnapshot: source, engineResult: engine, presentationPlan: plan });
  assert.equal(result.verdict, 'ALLOW'); assert.equal(result.presentation.mode, 'APPROVED_BUNDLE');
  assert.deepEqual(build(request), plan); assert.notEqual(build(request), plan);
  assert.deepEqual(source, beforeSource); assert.deepEqual(engine, beforeEngine);
});
function assertTuple(a, b) { return Object.keys(a).length === Object.keys(b).length && Object.keys(a).every(key => Object.is(a[key], b[key])); }

test('all 48 reachable INSIGHT tuples and all 25 INSIGHT identities are exercised by actual selections', () => {
  const expected = registry.find(e => e.row === 'E28').engineMappings.map(m => m.selector)
    .filter(s => !(s.ruleId === 'REF-01' && ['B1', 'B2'].includes(s.branch)));
  assert.equal(expected.length, 48);
  const actual = new Map(), rows = new Set();
  for (const scenario of bank) for (const c of build(input(scenario.source)).components.filter(c => c.role === 'INSIGHT')) {
    actual.set(JSON.stringify(c.engineSelector), c.engineSelector);
    rows.add(registry.find(entry => entry.templateId === c.templateId).row);
  }
  assert.equal(actual.size, 48);
  for (const selector of expected) assert.ok([...actual.values()].some(tuple => assertTuple(selector, tuple)), JSON.stringify(selector));
  assert.deepEqual([...rows].sort(), Array.from({ length: 25 }, (_, i) => `E${String(i + 2).padStart(2, '0')}`));
});
test('registered but unreachable REF B1/B2 are never promoted over QUAL/REV', () => {
  for (const branch of ['B1', 'B2']) for (const known of [false, true]) {
    const request = input(reflection(labels, branch, known));
    assert.equal(request.engineResult.primary.ruleId, branch === 'B1' ? 'QUAL-01' : 'REV-01');
    assert.notEqual(build(request).components[0].ruleId, 'REF-01');
  }
});

const EMPTY = { policyVersion: 'safety-v1', registryVersion: 'safety-registry-v1', manifestId: null,
  manifestVersion: 1, components: [], declaredAbsentSlots: ['primary', 'secondary'] };
for (const [name, source] of [['null intent', { version: '0.1.0', intent: null }], ['no cycles', fixture(0, labels)]])
  test(`primary=null exact closed empty request: ${name}`, () => {
    const request = input(source);
    assert.equal(request.engineResult.primary, null); assert.deepEqual(build(request), EMPTY);
    const result = safety.assessPresentation({ sourceSnapshot: request.sourceSnapshot, engineResult: request.engineResult, presentationPlan: build(request) });
    assert.equal(result.verdict, 'UNKNOWN'); assert.equal(result.presentation.mode, 'FALLBACK_ONLY');
  });
test('null primary never promotes a non-null secondary or manufactures MF0', () => {
  const request = input(); request.engineResult.primary = null;
  assert.notEqual(request.engineResult.secondary, null);
  assert.deepEqual(build(request), EMPTY);
});
test('representative MF3 has exactly five slots and exact E27/E28/E29/E30 identities', () => {
  const request = input(reflection(labels, 'B4', true)), plan = build(request);
  assertEnvelope(plan, request.engineResult); assert.equal(plan.components.length, 5); assert.equal(plan.manifestId, MF3);
  assert.deepEqual(plan.components.slice(1).map(c => c.templateId), ['safety.why.recordedInformationUsed',
    'safety.why.ruleSelectionBasis', 'safety.why.recordedDataLimitations', 'safety.why.conditionAssessmentUnavailable']);
});
test('representative MF4 has exactly nine slots; no interpretation, nextFocus or whyThisFocus', () => {
  const request = input(), plan = build(request);
  assertEnvelope(plan, request.engineResult); assert.equal(plan.components.length, 9); assert.equal(plan.manifestId, MF4);
  assert.deepEqual(plan.components.slice(5).map(c => c.templateId), ['safety.insight.externalRecordPresent',
    'safety.why.recordedInformationUsed', 'safety.why.ruleSelectionBasis', 'safety.why.recordedDataLimitations']);
  assert.equal(plan.components.some(c => /interpretation|nextFocus|whyThisFocus/.test(c.slot)), false);
});
test('source prose and caller binding values cannot enter a plan', () => {
  const source = fixture(1, labels), text = 'UNTRUSTED source prose <script>synthetic()</script>';
  for (const dim of D) source.intent.ris[dim] = source.intent.cycles[0].cie[dim] = text;
  source.intent.cycles[0].iep.actions = text; source.intent.cycles[0].oop.external = text;
  const request = input(source), plan = build(request);
  assert.equal(JSON.stringify(plan).includes(text), false);
  for (const property of ['bindings', 'bindingValues', 'text', 'templateId', 'selector', 'candidate']) fails({ ...request, [property]: text });
  request.engineResult.primary.bindings = [{ name: 'desire', value: text }];
  assert.deepEqual(build(request), plan);
});
test('titleKey alone cannot establish mapping identity', () => {
  const request = input();
  request.engineResult.primary.candidateId = 'same-title-unregistered-candidate';
  assert.equal(request.engineResult.primary.titleKey, 'analysis.REF-01.title'); fails(request);
  fails({ ...input(), engineResult: { titleKey: 'analysis.REF-01.title', primary: { titleKey: 'analysis.REF-01.title' }, secondary: null } });
});
for (const [name, change] of [
  ['ruleId', c => { c.ruleId = 'COND-01'; }], ['candidateId', c => { c.candidateId = 'REF-01:other'; }],
  ['key', c => { c.titleKey = 'analysis.other.title'; }], ['explicit null metric', c => { c.ruleEvaluation.metric = 'desire'; }],
  ['branch', c => { c.nextFocus.promptKey = 'arbitrary.object.path'; }],
  ['variant', c => { c.interpretation.data.emotion.status = 'unknown-to-catalog'; }]
]) test(`full tuple mismatch fails closed: ${name}`, () => {
  const request = input(); change(request.engineResult.primary); fails(request);
});
test('registered candidate/dimension mismatch fails closed', () => {
  const request = input(bank.find(s => s.name === 'INT dimension primary').source);
  request.engineResult.secondary.interpretation.data.dimension = 'success'; fails(request);
});
test('primary mapping failure never promotes valid secondary', () => {
  const request = input(), secondary = snapshot(request.engineResult.secondary);
  request.engineResult.primary.titleKey = 'unregistered'; fails(request);
  assert.deepEqual(request.engineResult.secondary, secondary);
});
test('secondary mapping failure never downgrades MF4 to MF3', () => {
  const request = input(), primary = snapshot(request.engineResult.primary);
  request.engineResult.secondary.titleKey = 'unregistered'; fails(request);
  assert.deepEqual(request.engineResult.primary, primary);
});
for (const name of ['MF3', 'MF4']) for (const [fault, change] of [
  ['missing capability', e => { delete e.capabilities.VAQUQA; }],
  ['wrong rule', e => { e.capabilities.VAQUQA.ruleId = 'REF-01'; }],
  ['wrong status', e => { e.capabilities.VAQUQA.status = 'ready'; }],
  ['wrong sufficiency', e => { e.capabilities.VAQUQA.conditionSufficiency = 'available'; }],
  ['partial capability', e => { delete e.capabilities.VAQUQA.conditionSufficiency; }],
  ['extra capability key', e => { e.capabilities.VAQUQA.extra = null; }]
]) test(`${name} E30 mismatch cannot downgrade: ${fault}`, () => {
  const request = input(name === 'MF3' ? reflection(labels, 'B4', true) : fixture(1, labels));
  change(request.engineResult); const before = snapshot(request.engineResult); fails(request); assert.deepEqual(request.engineResult, before);
});
for (const [fault, change] of [
  ['E30 template identity', r => { r[29].templateId = 'unregistered'; }],
  ['E30 selector', r => { r[29].engineMappings[0].selector.conditionSufficiency = 'available'; }],
  ['E30 binding', r => { r[29].allowedBindings.push({ name: 'text', selector: 'arbitrary.path' }); }],
  ['Why template version', r => { r[26].templateVersion = 2; }],
  ['Insight role', r => { r[2].role = 'INTERPRETATION'; }],
  ['missing explicit null', r => { delete r[2].engineMappings[0].selector.metric; }],
  ['arbitrary selector', r => { r[2].allowedBindings[0].selector = 'intent.ris.primary'; }],
  ['duplicate registry row', r => { r[0] = r[1]; }]
]) test(`trusted internal registry mismatch: ${fault}`, () => {
  const request = input(), replacement = snapshot(registry); change(replacement); request.trustedRegistry = freeze(replacement); fails(request);
});
test('mutable registry injection is rejected and no input options can select a registry', () => {
  fails({ ...input(), trustedRegistry: snapshot(registry) });
  fails({ ...input(), registry: registry });
});
for (const [fault, change] of [
  ['missing required reference', c => { c.evidence = c.evidence.filter(e => !e.path.endsWith('.iep.desire')); }],
  ['conflicting duplicate', c => { c.evidence.push({ ...c.evidence[0], rawValue: 'conflict' }); }],
  ['unknown path', c => { c.evidence[0].path = 'intent.cycles[0].arbitrary.property'; }],
  ['wrong cycleId', c => { c.evidence[0].cycleId = 'wrong'; }],
  ['wrong arrayIndex', c => { c.evidence[0].arrayIndex = 1; }],
  ['wrong timestamp', c => { c.evidence[0].createdAt = 'wrong'; }],
  ['wrong source value', c => { c.evidence.find(e => e.path.endsWith('.iep.practical')).rawValue = 1; }],
  ['wrong usedCycleIds', c => { c.ruleEvaluation.usedCycleIds[0] = 'wrong'; }],
  ['empty used indices', c => { c.ruleEvaluation.usedArrayIndices = []; }],
  ['duplicate used indices', c => { c.ruleEvaluation.usedArrayIndices = [0, 0]; }]
]) test(`provenance mismatch fails closed: ${fault}`, () => { const request = input(); change(request.engineResult.primary); fails(request); });
test('identical frozen evidence duplicates do not change bindings; extra unknown references cannot be omitted', () => {
  const request = input(), baseline = build(request);
  request.engineResult.primary.evidence.push(snapshot(request.engineResult.primary.evidence[0]));
  assert.deepEqual(build(request), baseline);
  request.engineResult.primary.evidence.push({ path: 'arbitrary.path', rawValue: null }); fails(request);
});
test('current RIS reference mismatch cannot be repaired into a cycle path', () => {
  const request = input(bank.find(s => s.name === 'TXT current reference differences').source);
  request.engineResult.primary.evidence.find(e => e.path === 'intent.ris.primary').rawValue = 'different'; fails(request);
});
test('delta provenance cannot be caller-composed or independently replaced', () => {
  const request = input(bank.find(s => s.name === 'CMP practical').source);
  request.engineResult.comparisons.find(c => c.metric === 'practical').inputPaths.reverse(); fails(request);
});
test('logical revision selectors remain selectors, with intentional/revision provenance only', () => {
  const request = input(bank.find(s => s.name === 'REV counts').source), plan = build(request);
  const component = plan.components.find(c => c.slot === 'secondary.insight');
  assert.deepEqual(component.bindings.map(b => b.selector), ['REVISION_EVENT_COUNT', ...D.map(() => 'REVISION_KEY_COUNTS')]);
  for (const binding of component.bindings) {
    assert.deepEqual(binding.sourceRefs.map(r => r.path), request.engineResult.secondary.ruleEvaluation.usedArrayIndices
      .flatMap(i => [`intent.cycles[${i}].intentional`, `intent.cycles[${i}].revision`]));
    assert.equal(Object.hasOwn(binding, 'value'), false);
  }
});
for (const [name, change] of [
  ['engine version', e => { e.engineVersion = 'future'; }], ['source commit', e => { e.inputReference.sourceCommit = 'other'; }],
  ['source version', e => { e.inputReference.sourceVersion = '2'; }], ['missing secondary', e => { delete e.secondary; }],
  ['undefined secondary', e => { e.secondary = undefined; }]
]) test(`frozen engine identity mismatch: ${name}`, () => { const request = input(); change(request.engineResult); fails(request); });
test('failed construction and later plan mutation leave source / engine / registry unchanged', () => {
  const request = input(), sourceBefore = snapshot(request.sourceSnapshot), engineBefore = snapshot(request.engineResult), registryBefore = snapshot(registry);
  const plan = build(freeze(request)); plan.components[0].engineSelector.key = 'mutated output'; plan.components[0].bindings[0].sourceRefs[0].path = 'changed';
  assert.deepEqual(request.sourceSnapshot, sourceBefore); assert.deepEqual(request.engineResult, engineBefore); assert.deepEqual(registry, registryBefore);
  assert.notEqual(build(request).components[0].engineSelector.key, 'mutated output');
  const bad = input(); bad.engineResult.secondary.titleKey = 'failure'; const before = snapshot(bad.engineResult); fails(freeze(bad));
  assert.deepEqual(bad.engineResult, before);
});
test('missing discriminator metadata / accessors fail without fallback or callback execution', () => {
  const request = input(); delete request.engineResult.primary.interpretation.data.emotion.status; fails(request);
  let calls = 0;
  Object.defineProperty(request.engineResult.primary, 'titleKey', { enumerable: true, get() { calls++; return 'analysis.REF-01.title'; } });
  fails(request); assert.equal(calls, 0);
});
for (const [name, scenario, change] of [
  ['QUAL unknown defaultProfile', 'QUAL insufficient basis', c => { c.interpretation.data.defaultProfile = 'unknown'; }],
  ['MEN missing branch flag', 'MEN down', c => { delete c.ruleEvaluation.conditions.find(v => v.name === 'low_or_down(iep.mental)').observed.down; }],
  ['MEN string boolean', 'MEN low', c => { c.ruleEvaluation.conditions.find(v => v.name === 'low_or_down(iep.mental)').observed.low = 'true'; }],
  ['MEN unknown observation', 'MEN frequency repeated', c => { c.interpretation.data.observation = 'unknown'; }],
  ['EMO string boolean', 'EMO known', c => { c.interpretation.data.otherCategory = 'false'; }],
  ['EMO unknown direction', 'EMO intensity increased', c => { c.interpretation.data.direction = 'unknown'; }],
  ['OUT missing direction', 'OUT increased', c => { delete c.interpretation.data.direction; }],
  ['REL arbitrary metric path', 'REL internal mental', c => { c.interpretation.data.internalSource = 'intent.ris.primary'; }],
  ['MIX empty triggers', 'MIX recorded direction', c => { c.interpretation.data.triggers = []; }],
  ['MIX unregistered trigger', 'MIX recorded direction', c => { c.interpretation.data.triggers = ['unknown']; }]
]) test(`closed discriminator fails without a guessed branch: ${name}`, () => {
  const request = input(bank.find(s => s.name === scenario).source), c = request.engineResult.primary;
  change(c);
  // Keep the exact evaluation copy coherent so the discriminator is exercised.
  const evaluation = request.engineResult.ruleEvaluations.find(v => v.ruleId === c.ruleId && v.candidateId === c.candidateId);
  Object.assign(evaluation, snapshot(c.ruleEvaluation));
  fails(request);
});
test('MIX branch priority is decision conflict, then opposed hours, then recorded direction', () => {
  for (const conflict of [true, false]) {
    const s = snapshot(bank.find(v => v.name === 'MIX practical hours').source);
    s.intent.cycles.at(-1).oop.direction = 'mixed';
    if (conflict) s.intent.cycles.at(-1).revision = { scope: 'Synthetic conflicting patch' };
    const request = input(s), plan = build(request);
    assert.equal(request.engineResult.primary.ruleId, 'MIX-01');
    assert.equal(plan.components[0].engineSelector.branch, conflict ? 'decision_patch_conflict' : 'practical_hours_opposed');
    assert.equal(safety.assessPresentation({ sourceSnapshot: request.sourceSnapshot, engineResult: request.engineResult, presentationPlan: plan }).verdict, 'ALLOW');
  }
});
