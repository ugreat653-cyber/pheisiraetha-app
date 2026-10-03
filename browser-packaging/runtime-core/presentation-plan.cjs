'use strict';

const { RuntimeCoreFailure, requireContract: need, record, exactKeys, assertPlainData, equalData } = require('./plain-data.cjs');
const { D, U, I, B, X, CAPABILITY, MANIFEST3, MANIFEST4, ABSENT3, ABSENT4, MAPPINGS, ENTRIES } = require('./closed-catalog.cjs');
const POLICY = 'safety-v1', REGISTRY = 'safety-registry-v1';
const PROVENANCE = 'PLAN_PROVENANCE_MISMATCH', MAPPING = 'PLAN_MAPPING_MISMATCH';

// Every reader is fixed code for a registered leaf. No arbitrary path splitting,
// eval, recursive selector search, display-value resolution, or helper injection.
const leaf = (object, key) => record(object) && Object.hasOwn(object, key) ?
  { present: true, value: object[key] } : { present: false, value: null };
const LEAVES = Object.freeze({
  id: c => leaf(c, 'id'), createdAt: c => leaf(c, 'createdAt'),
  intentional: c => leaf(c, 'intentional'), revision: c => leaf(c, 'revision'),
  'iep.desire': c => leaf(c.iep, 'desire'), 'iep.belief': c => leaf(c.iep, 'belief'),
  'iep.mental': c => leaf(c.iep, 'mental'), 'iep.practical': c => leaf(c.iep, 'practical'),
  'iep.emotionIntensity': c => leaf(c.iep, 'emotionIntensity'), 'iep.hours': c => leaf(c.iep, 'hours'),
  'iep.frequency': c => leaf(c.iep, 'frequency'), 'iep.emotion': c => leaf(c.iep, 'emotion'), 'iep.actions': c => leaf(c.iep, 'actions'),
  'oop.achievement': c => leaf(c.oop, 'achievement'), 'oop.direction': c => leaf(c.oop, 'direction'),
  'oop.evidence': c => leaf(c.oop, 'evidence'), 'oop.currentState': c => leaf(c.oop, 'currentState'),
  'oop.events': c => leaf(c.oop, 'events'), 'oop.external': c => leaf(c.oop, 'external'),
  'cie.primary': c => leaf(c.cie, 'primary'), 'cie.success': c => leaf(c.cie, 'success'),
  'cie.scope': c => leaf(c.cie, 'scope'), 'cie.nonGoals': c => leaf(c.cie, 'nonGoals'),
  'cie.constraints': c => leaf(c.cie, 'constraints'), 'cie.rationale': c => leaf(c.cie, 'rationale')
});
const RIS = Object.freeze({ primary: r => leaf(r, 'primary'), success: r => leaf(r, 'success'),
  scope: r => leaf(r, 'scope'), nonGoals: r => leaf(r, 'nonGoals'),
  constraints: r => leaf(r, 'constraints'), rationale: r => leaf(r, 'rationale') });

function unique(rows, code) { need(Array.isArray(rows) && rows.length === 1, code); return rows[0]; }
function immutable(value) {
  const work = [value], seen = new Set();
  while (work.length) {
    const v = work.pop();
    if (v && typeof v === 'object' && !seen.has(v)) {
      need(Object.isFrozen(v), 'PLAN_REGISTRY_MISMATCH');
      seen.add(v);
      work.push(...Object.values(v));
    }
  }
}
const bindingIdentity = b => b.selector === null ?
  { name: b.name, selector: null, selectorByMetric: b.selectorByMetric } : { name: b.name, selector: b.selector };
const mappingIdentity = m => ({ mappingId: m.mappingId, selector: m.selector, allowedSurfaces: m.allowedSurfaces });

function checkRegistry(registry) {
  const code = 'PLAN_REGISTRY_MISMATCH';
  assertPlainData(registry, code);
  need(Array.isArray(registry) && registry.length === 30, code);
  immutable(registry);
  return ENTRIES.map(expected => {
    const entry = unique(registry.filter(e => e.row === expected.row), code);
    need(entry.templateId === expected.templateId && entry.templateVersion === 1 && entry.role === expected.role &&
      entry.policyVersion === POLICY && entry.registryVersion === REGISTRY && entry.manifestVersion === 1 &&
      entry.safetyClassification === 'ALLOW', code);
    need(Array.isArray(entry.engineMappings) && equalData(entry.engineMappings.map(mappingIdentity), expected.mappings), code);
    need(Array.isArray(entry.allowedBindings) && equalData(entry.allowedBindings.map(bindingIdentity), expected.bindings), code);
    const paths = [...new Set(expected.bindings.flatMap(b => b.selector === null ? Object.values(b.selectorByMetric) : [b.selector]))];
    const surfaces = expected.row === 'E01' ? ['FALLBACK'] :
      ['PRIMARY', 'SECONDARY'].filter(s => expected.mappings.some(m => m.allowedSurfaces.includes(s)));
    need(equalData(entry.allowedSourcePaths, paths) && equalData(entry.allowedSurfaces, surfaces) &&
      Array.isArray(entry.manifestMembership), code);
    return entry;
  });
}

function checkEngine(source, e) {
  const code = 'PLAN_ENGINE_IDENTITY_MISMATCH';
  need(record(e) && e.engineVersion === 'analysis-phase2a-beta-heuristics-v1' &&
    e.specVersion === 'analysis-phase1-proposal-1' && e.adapterVersion === 'raw-0.1.0-conservative-v1' &&
    e.dictionaryVersion === 'production-v16-31-locales' && e.heuristicStatus === 'PRODUCT_HEURISTICS_FOR_BETA' &&
    e.causality === 'not_determined' && record(e.inputReference) &&
    e.inputReference.sourceCommit === '255a5d9d27461dcacaebc1bc80ab322dd54b4de8' &&
    e.inputReference.sourceVersion === '0.1.0' && source?.version === '0.1.0' &&
    e.inputReference.referenceProvenance === 'current_mutable_RIS_only' &&
    e.inputReference.intentId === (typeof source?.intent?.id === 'string' ? source.intent.id : null) &&
    Object.hasOwn(e, 'primary') && Object.hasOwn(e, 'secondary') &&
    Array.isArray(e.ruleEvaluations) && Array.isArray(e.comparisons), code);
}

function selectedContext(source, e, surface) {
  const c = surface === 'PRIMARY' ? e.primary : e.secondary;
  need(record(source.intent) && Array.isArray(source.intent.cycles) && record(c) && c.eligible === true &&
    record(c.ruleEvaluation) && Array.isArray(c.ruleEvaluation.conditions) && Array.isArray(c.evidence) &&
    record(c.interpretation) && record(c.interpretation.data), MAPPING);
  need(c.interpretation.key === `analysis.${c.ruleId}.recordedObservation` &&
    (surface === 'PRIMARY' ? c.secondaryOnly === false : c.nextFocus === null && c.whyThisFocus === null), MAPPING);
  const indices = c.ruleEvaluation.usedArrayIndices;
  need(Array.isArray(indices) && indices.length > 0 && indices.every((i, n) => Number.isSafeInteger(i) &&
    i >= 0 && i < source.intent.cycles.length && (n === 0 || i > indices[n - 1]) && record(source.intent.cycles[i])), PROVENANCE);
  need(equalData(c.ruleEvaluation.usedCycleIds, indices.map(i => source.intent.cycles[i].id)) &&
    c.priority?.ruleId === c.ruleId && c.priority.supportingObservations === indices.length &&
    c.priority.evidenceLevel === c.evidenceLevel, PROVENANCE);
  const evaluation = unique(e.ruleEvaluations.filter(v => v.ruleId === c.ruleId && v.candidateId === c.candidateId), PROVENANCE);
  need(evaluation.eligible === true && equalData(evaluation.priority, c.priority) &&
    equalData(Object.fromEntries(Object.entries(evaluation).filter(([key]) =>
      !['ruleId', 'candidateId', 'eligible', 'priority'].includes(key))), c.ruleEvaluation), PROVENANCE);
  need(e.selectionExplanation?.key === 'analysis.fixedPriorityTuple' &&
    e.selectionExplanation.data?.selectedCandidate === e.primary.candidateId &&
    e.selectionExplanation.data.secondaryCandidate === (e.secondary === null ? null : e.secondary.candidateId) &&
    equalData(e.selectionExplanation.data.selectedTuple, e.primary.priority), PROVENANCE);

  const evidence = new Map();
  for (const ev of c.evidence) {
    need(record(ev) && typeof ev.path === 'string', PROVENANCE);
    if (evidence.has(ev.path)) need(equalData(evidence.get(ev.path), ev), PROVENANCE);
    evidence.set(ev.path, ev);
    const dim = D.find(d => ev.path === `intent.ris.${d}`);
    if (dim) {
      const raw = RIS[dim](source.intent.ris);
      need(ev.reference === 'current_mutable_reference' && ev.transformation === 'NFC_line_endings_outer_trim' &&
        equalData(ev.rawValue, raw.value), PROVENANCE);
    } else {
      need(Number.isSafeInteger(ev.arrayIndex) && ev.arrayIndex >= 0 && ev.arrayIndex < source.intent.cycles.length &&
        record(source.intent.cycles[ev.arrayIndex]), PROVENANCE);
      const field = Object.keys(LEAVES).find(f => ev.path === `intent.cycles[${ev.arrayIndex}].${f}`);
      need(field !== undefined, PROVENANCE);
      const cycle = source.intent.cycles[ev.arrayIndex], raw = LEAVES[field](cycle);
      need(ev.cycleId === cycle.id && ev.createdAt === cycle.createdAt &&
        ev.present === raw.present && equalData(ev.rawValue, raw.value), PROVENANCE);
    }
  }
  need(c.ruleEvaluation.conditions.length > 0 && c.ruleEvaluation.conditions.every(condition =>
    record(condition) && condition.passed === true && Array.isArray(condition.inputPaths) &&
    condition.inputPaths.every(path => evidence.has(path))), PROVENANCE);
  const context = { source, e, c, surface, indices, evidence, data: c.interpretation.data };
  for (const index of indices) { cycleRef(context, index, 'id'); cycleRef(context, index, 'createdAt'); }
  return context;
}

function condition(context, name) {
  return unique(context.c.ruleEvaluation.conditions.filter(row => row.name === name), MAPPING);
}
function selectorFor(context) {
  const { c, data } = context;
  let metric = null, dimension = null, branch = 'recorded', variant = 'recordedObservation';
  if (c.ruleId === 'REF-01') {
    const index = B.indexOf(c.nextFocus?.promptKey), emotion = data.emotion;
    need(index >= 0 && record(emotion) && ['known', 'ambiguous', 'unmapped'].includes(emotion.status), MAPPING);
    need(emotion.status === 'known' ? Number.isInteger(emotion.category) && emotion.category >= 0 && emotion.category <= 9 :
      emotion.category === null, MAPPING);
    branch = `B${index + 1}`;
    variant = emotion.status === 'known' ? 'CURRENT_KNOWN_CATEGORY' : 'CURRENT_CATEGORY_UNAVAILABLE';
    const ev = context.evidence.get(cycleRef(context, context.indices[0], 'iep.emotion').path);
    need(equalData(ev.derivedValue, { category: emotion.category, status: emotion.status }), MAPPING);
  } else if (c.ruleId === 'QUAL-01') {
    need(data.defaultProfile === null || data.defaultProfile === 'possible_default_like_recorded_profile', MAPPING);
    branch = data.defaultProfile === null ? 'insufficient_basis' : 'possible_default_profile';
  } else if (c.ruleId === 'CMP-01' || c.ruleId === 'CMP-02') {
    metric = c.ruleEvaluation.metric;
    need(c.ruleId === 'CMP-01' ? U.some(u => u[0] === metric) : metric === 'frequency', MAPPING);
  } else if (c.ruleId === 'INT-02') {
    dimension = data.dimension; need(D.includes(dimension), MAPPING);
  } else if (c.ruleId === 'MEN-01') {
    const observed = condition(context, 'low_or_down(iep.mental)').observed;
    need(record(observed) && typeof observed.down === 'boolean' && typeof observed.low === 'boolean' &&
      (observed.down || observed.low), MAPPING);
    branch = observed.down ? 'decreasing' : 'low_range';
  } else if (c.ruleId === 'MEN-02') {
    branch = data.observation; need(['same_category_repeated', 'category_decreased'].includes(branch), MAPPING);
  } else if (c.ruleId === 'EMO-01') {
    need(typeof data.otherCategory === 'boolean' && Number.isInteger(data.category) && data.category >= 0 && data.category <= 9 &&
      data.otherCategory === (data.category === 9), MAPPING);
    branch = data.otherCategory ? 'other' : 'known_non_other';
  } else if (c.ruleId === 'EMO-02' || c.ruleId === 'OUT-01') {
    branch = data.direction; need(['increased', 'decreased'].includes(branch), MAPPING);
  } else if (c.ruleId === 'REL-03') {
    metric = data.internalSource; need(I.some(i => i[0] === metric), MAPPING);
  } else if (c.ruleId === 'MIX-01') {
    need(Array.isArray(data.triggers) && data.triggers.length > 0 && data.triggers.every(t => X.includes(t)) &&
      new Set(data.triggers).size === data.triggers.length &&
      equalData(condition(context, 'mixed_signal_present').observed, data.triggers), MAPPING);
    branch = data.triggers.includes('decision_patch_conflict') ? 'decision_patch_conflict' :
      data.triggers.includes('practical_hours_opposed') ? 'practical_hours_opposed' : 'recorded_direction';
  }
  need(c.ruleEvaluation.metric === (['CMP-01', 'CMP-02'].includes(c.ruleId) ? metric : null), MAPPING);
  const selector = { ruleId: c.ruleId, candidateId: c.candidateId, key: c.titleKey, metric, dimension, branch, variant };
  const mapping = unique(MAPPINGS.filter(m => equalData(m.selector, selector) && m.allowedSurfaces.includes(context.surface)), MAPPING);
  return mapping.selector;
}

function cycleRef(context, arrayIndex, field) {
  const path = `intent.cycles[${arrayIndex}].${field}`, ev = context.evidence.get(path);
  need(Object.hasOwn(LEAVES, field) && ev !== undefined, PROVENANCE);
  const cycle = context.source.intent.cycles[arrayIndex], raw = LEAVES[field](cycle);
  need(raw.present && ev.present === true && ev.arrayIndex === arrayIndex && ev.cycleId === cycle.id &&
    ev.createdAt === cycle.createdAt && equalData(ev.rawValue, raw.value), PROVENANCE);
  return { arrayIndex, cycleId: cycle.id, path };
}
function cycleRefs(context, fields, indices = context.indices) {
  return indices.flatMap(index => fields.map(field => cycleRef(context, index, field)));
}
function risRef(context, dimension) {
  need(D.includes(dimension), PROVENANCE);
  const path = `intent.ris.${dimension}`, ev = context.evidence.get(path), raw = RIS[dimension](context.source.intent.ris);
  need(raw.present && ev !== undefined && ev.reference === 'current_mutable_reference' &&
    equalData(ev.rawValue, raw.value), PROVENANCE);
  return { path };
}

// Exact expanded selector -> fixed fields. These strings are compared as whole
// inert identities; their contents are never parsed as an object path.
const FIELD_SELECTORS = new Map([
  ...['iep.desire', 'iep.belief', 'iep.mental', 'iep.practical', 'iep.emotionIntensity', 'oop.achievement',
    'iep.hours', 'iep.frequency', 'oop.direction'].map(field => [`CURRENT(${field})`, { field, prefix: 'CURRENT' }]),
  ...[...U.map(u => u[1]), 'iep.frequency'].map(field => [`PAIR(${field})`, { field, prefix: 'PAIR' }]),
  ...U.map(([, field]) => [`ENGINE_DELTA(${field})`, { field, prefix: 'ENGINE_DELTA' }]),
  ...['iep.practical', 'iep.hours', 'iep.mental', 'iep.frequency', 'iep.emotionIntensity', 'oop.achievement',
    'oop.direction', 'oop.evidence'].map(field => [`SERIES(${field})`, { field, prefix: 'SERIES' }])
]);
function referencesFor(context, selector, tuple) {
  if (['U.metricLabel', 'U.units', 'U.scope', 'I.metricLabel', 'FIXED_FIELDS', 'SELECTED_RULE'].includes(selector)) return [];
  if (selector === 'ENGINE_ORDINAL') { need(context.indices.length === 2, PROVENANCE); return cycleRefs(context, ['iep.frequency']); }
  if (selector === 'ENGINE_EMOTION_CURRENT' || selector === 'ENGINE_EMOTION_RECURRENT') return cycleRefs(context, ['iep.emotion']);
  if (selector === 'ENGINE_DIMENSIONS') {
    const dimensions = context.data.currentReferenceDifferences;
    need(Array.isArray(dimensions) && dimensions.length > 0 && equalData(dimensions, D.filter(d => dimensions.includes(d))), MAPPING);
    return [...cycleRefs(context, D.map(d => `cie.${d}`), [context.indices.at(-1)]), ...D.map(d => risRef(context, d))];
  }
  if (selector === 'ENGINE_DIMENSION') return [...cycleRefs(context, [`cie.${tuple.dimension}`]), risRef(context, tuple.dimension)];
  if (['REVISION_KEYS', 'REVISION_EVENT_COUNT', 'REVISION_KEY_COUNTS'].includes(selector))
    return cycleRefs(context, ['intentional', 'revision']);
  const selected = FIELD_SELECTORS.get(selector);
  need(selected !== undefined, MAPPING);
  if (selected.prefix === 'CURRENT') need(context.indices.length === 1, PROVENANCE);
  if (selected.prefix === 'PAIR' || selected.prefix === 'ENGINE_DELTA') need(context.indices.length === 2, PROVENANCE);
  const refs = cycleRefs(context, [selected.field]);
  if (selected.prefix === 'ENGINE_DELTA') {
    const comparison = unique(context.e.comparisons.filter(row => row.ruleId === 'CMP-01' && row.metric === tuple.metric), PROVENANCE);
    const measure = unique(context.c.ruleEvaluation.derivedMeasures?.filter(row => row.name === 'signed_delta'), PROVENANCE);
    need(equalData(comparison.inputPaths, refs.map(r => r.path)) && equalData(measure.inputPaths, comparison.inputPaths) &&
      equalData(comparison.before, context.data.before) && equalData(comparison.after, context.data.after) &&
      equalData(comparison.delta, context.data.delta) && equalData(measure.value, comparison.delta), PROVENANCE);
  }
  return refs;
}

function component(context, entry, slot, manifestId, tuple) {
  need(entry.allowedSurfaces.includes(context.surface) && entry.engineMappings.some(m =>
    equalData(m.selector, tuple) && m.allowedSurfaces.includes(context.surface)) &&
    entry.manifestMembership.some(m => m.manifestId === manifestId && m.slot === slot), 'PLAN_REGISTRY_MISMATCH');
  const bindings = entry.allowedBindings.map(def => {
    const selector = def.selector === null ? def.selectorByMetric[tuple.metric] : def.selector;
    return { name: def.name, selector, sourceRefs: referencesFor(context, selector, tuple) };
  });
  return { componentId: slot, surface: context.surface, role: entry.role, slot,
    templateId: entry.templateId, templateVersion: 1, ruleId: tuple.ruleId, candidateId: tuple.candidateId,
    engineSelector: { ...tuple }, bindings };
}
function surfaceComponents(context, entries, manifestId) {
  const tuple = selectorFor(context);
  const insight = unique(entries.filter(entry => entry.role === 'INSIGHT' && entry.engineMappings.some(m =>
    equalData(m.selector, tuple) && m.allowedSurfaces.includes(context.surface))), MAPPING);
  const prefix = context.surface === 'PRIMARY' ? 'primary' : 'secondary';
  return [[insight, 'insight'], [entries[26], 'why.values'], [entries[27], 'why.selection'], [entries[28], 'why.limitations']]
    .map(([entry, suffix]) => component(context, entry, `${prefix}.${suffix}`, manifestId, tuple));
}
function capabilityComponent(e, entries, manifestId) {
  const capability = e.capabilities?.VAQUQA, entry = entries[29], slot = 'primary.why.capability';
  need(exactKeys(capability, ['ruleId', 'status', 'conditionSufficiency']) &&
    capability.ruleId === CAPABILITY.ruleId && capability.status === CAPABILITY.status &&
    capability.conditionSufficiency === CAPABILITY.conditionSufficiency, 'PLAN_CAPABILITY_MISMATCH');
  need(entry.templateId === 'safety.why.conditionAssessmentUnavailable' && entry.role === 'WHY' &&
    entry.manifestMembership.some(m => m.manifestId === manifestId && m.slot === slot), 'PLAN_REGISTRY_MISMATCH');
  return { componentId: slot, surface: 'PRIMARY', role: 'WHY', slot, templateId: entry.templateId, templateVersion: 1,
    ruleId: null, candidateId: null, engineSelector: { ...CAPABILITY }, bindings: [] };
}

// BUILD-INTERNAL ONLY. trustedRegistry is the immutable registry exported by the
// exact frozen safety.js, supplied by internal composition. No browser global,
// public facade, registry-registration operation, or caller-selected component.
function buildPresentationPlan(input) {
  try {
    assertPlainData(input, 'PLAN_INPUT_NOT_PLAIN_DATA');
    need(exactKeys(input, ['sourceSnapshot', 'engineResult', 'trustedRegistry']), 'PLAN_INPUT_SHAPE_MISMATCH');
    const { sourceSnapshot: source, engineResult: e, trustedRegistry } = input;
    const entries = checkRegistry(trustedRegistry);
    checkEngine(source, e);
    const envelope = { policyVersion: POLICY, registryVersion: REGISTRY, manifestId: null,
      manifestVersion: 1, components: [], declaredAbsentSlots: ['primary', 'secondary'] };
    if (e.primary === null) return envelope;
    need(e.secondary === null || record(e.secondary), MAPPING);
    const manifestId = e.secondary === null ? MANIFEST3 : MANIFEST4;
    const primary = selectedContext(source, e, 'PRIMARY');
    const components = [...surfaceComponents(primary, entries, manifestId), capabilityComponent(e, entries, manifestId)];
    if (e.secondary !== null) components.push(...surfaceComponents(selectedContext(source, e, 'SECONDARY'), entries, manifestId));
    return { ...envelope, manifestId, components, declaredAbsentSlots: [...(e.secondary === null ? ABSENT3 : ABSENT4)] };
  } catch (error) {
    if (error instanceof RuntimeCoreFailure) throw error;
    throw new RuntimeCoreFailure('PLAN_INPUT_NOT_PLAIN_DATA');
  }
}

module.exports = { buildPresentationPlan };
