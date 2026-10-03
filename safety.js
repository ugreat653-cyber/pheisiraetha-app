'use strict';

/**
 * Standalone Safety v1 boundary. Contracts are the two frozen Safety documents
 * at ba46070bbcd42af51fb534c3282dd8a350bcfb20. No production integration.
 * The only dependency supplies the frozen dictionary/literal/timestamp helpers;
 * analyze is never called. No new semantic or chronological selection is made.
 * Binding references use {arrayIndex, cycleId, path}; current RIS references
 * use {path}. All selector spellings below are closed, never executable paths.
 */
const frozenEngine = require('./analysis.js');
const SAFETY_VERSION = 'safety-v1';
const REGISTRY_VERSION = 'safety-registry-v1';
const FALLBACK_ID = 'safety.fallback.noInterpretationOrNextFocus';
const FALLBACK_TEXT = 'No interpretation or next focus is shown here.';
const ENGINE_REFERENCE = Object.freeze({
  codeCommit: '94b112488e576e08495443d93c048a528c39aac7',
  engineVersion: 'analysis-phase2a-beta-heuristics-v1',
  sourceCommit: '255a5d9d27461dcacaebc1bc80ab322dd54b4de8', sourceVersion: '0.1.0'
});
const D = Object.freeze(['primary', 'success', 'scope', 'nonGoals', 'constraints', 'rationale']);
const FREQUENCIES = Object.freeze(['freq0', 'freq1', 'freq2', 'freq3', 'freq4', 'freq5']);
const DIRECTIONS = Object.freeze(['toward', 'none', 'away', 'mixed', 'unknown']);
const BASES = Object.freeze(['direct', 'documented', 'otherPerson', 'subjective', 'insufficient', 'other']);
const STATUSES = Object.freeze(['EMPTY', 'READY', 'LIMITED', 'INSUFFICIENT', 'MIXED', 'SAFETY_HOLD', 'UNSUPPORTED_SOURCE']);
const LEVELS = Object.freeze(['EARLY_OBSERVATION', 'COMPARISON', 'REPEATED_PATTERN', 'CONSISTENT_PATTERN']);
const REASONS = Object.freeze(['REGISTERED_PRESENTATION', 'FORBIDDEN_FUNCTION', 'FORBIDDEN_ROLE',
  'FORBIDDEN_BINDING', 'FORBIDDEN_RULE_NEXT_FOCUS', 'UPSTREAM_HOLD', 'UNKNOWN_TEMPLATE',
  'UNKNOWN_VERSION', 'UNMAPPED_ENGINE_KEY', 'UNKNOWN_VARIANT', 'INVALID_BINDING',
  'INVALID_SOURCE', 'INVALID_PROVENANCE', 'INVALID_MANIFEST', 'EMPTY_ANALYTICAL_PLAN',
  'REGISTRY_UNAVAILABLE', 'POLICY_VERSION_MISMATCH', 'SEMANTIC_DEPENDENCY', 'ENGINE_GATE_UNMET', 'BOUNDARY_ERROR']);
const COMMON_LIMITS = Object.freeze(['self_reported', 'historical_RIS_unavailable', 'rating_confirmation_unrecorded']);

function freezeTrusted(value) {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freezeTrusted);
    Object.freeze(value);
  }
  return value;
}
const equal = (a, b) => {
  if (Object.is(a, b)) return true;
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object' || Array.isArray(a) !== Array.isArray(b)) return false;
  const ak = Object.keys(a), bk = Object.keys(b);
  return ak.length === bk.length && ak.every(k => Object.hasOwn(b, k) && equal(a[k], b[k]));
};
const plainRecord = v => v !== null && typeof v === 'object' && !Array.isArray(v) &&
  [Object.prototype, null].includes(Object.getPrototypeOf(v));
const exactKeys = (v, keys) => plainRecord(v) && Object.keys(v).length === keys.length && keys.every(k => Object.hasOwn(v, k));
const nonblank = v => typeof v === 'string' && frozenEngine.normalizeText(v) !== '';
const bounded = (v, max) => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= max;
const count = v => Number.isSafeInteger(v) && v >= 0;
const orderedDimensions = v => Array.isArray(v) && v.length > 0 && equal(v, D.filter(d => v.includes(d)));
const uniqueOne = values => values.length === 1 ? values[0] : null;
const reasonOrder = values => REASONS.filter(r => values.includes(r));

/** Descriptor-only plain-data validation, not recursive property/selector search.
 * Reject accessors/functions/cycles without evaluating them. Repeated aliases
 * are permitted; all public output is constructed separately. Proxies are
 * outside this contract, as specified in boundary section 39.
 */
function plainData(value) {
  const work = [{ value, ancestors: new Set() }];
  while (work.length) {
    const item = work.pop(), v = item.value;
    if (v === null || ['string', 'number', 'boolean'].includes(typeof v)) continue;
    if (typeof v !== 'object' || item.ancestors.has(v)) return false;
    const array = Array.isArray(v);
    if (array ? Object.getPrototypeOf(v) !== Array.prototype : !plainRecord(v)) return false;
    const descriptors = Object.getOwnPropertyDescriptors(v), keys = Reflect.ownKeys(descriptors);
    if (keys.some(k => typeof k !== 'string')) return false;
    if (array && keys.length !== v.length + 1) return false;
    const ancestors = new Set(item.ancestors); ancestors.add(v);
    for (const key of keys) {
      const descriptor = descriptors[key];
      if (!Object.hasOwn(descriptor, 'value')) return false;
      if (array && key === 'length') continue;
      if (!descriptor.enumerable || (array && (!/^(0|[1-9][0-9]*)$/.test(key) || Number(key) >= v.length))) return false;
      work.push({ value: descriptor.value, ancestors });
    }
  }
  return true;
}

// G1: exact locations verified against analysis.js, SHA-256 a712af8f...df5da.
// C is exclusively the selected E.primary or E.secondary. Named array rows are
// matched exactly and uniquely (identical engine-duplicated evidence is inert).
// No caller path is split, traversed, searched recursively, or evaluated.
const PHYSICAL_SELECTORS = freezeTrusted({
  RECORDS: ['C.ruleEvaluation.usedArrayIndices', 'C.ruleEvaluation.usedCycleIds', 'C.evidence'],
  CURRENT: ['C.ruleEvaluation.usedArrayIndices', 'C.evidence[].path', 'C.evidence[].rawValue'],
  PAIR: ['C.ruleEvaluation.usedArrayIndices', 'C.evidence[].path', 'C.evidence[].rawValue'],
  SERIES: ['C.ruleEvaluation.usedArrayIndices', 'C.evidence[].path', 'C.evidence[].rawValue'],
  ENGINE_DELTA: ['E.comparisons[ruleId=CMP-01,metric].before', 'E.comparisons[ruleId=CMP-01,metric].after',
    'E.comparisons[ruleId=CMP-01,metric].delta', 'E.comparisons[ruleId=CMP-01,metric].inputPaths',
    'C.interpretation.data.before', 'C.interpretation.data.after', 'C.interpretation.data.delta',
    'C.ruleEvaluation.derivedMeasures[name=signed_delta].value', 'C.ruleEvaluation.derivedMeasures[name=signed_delta].inputPaths'],
  ENGINE_ORDINAL: ['C.interpretation.data.before', 'C.interpretation.data.after', 'C.interpretation.data.change'],
  ENGINE_DIMENSIONS: ['C.interpretation.data.currentReferenceDifferences', 'C.interpretation.data.adjacentWordingDifferences'],
  ENGINE_DIMENSION: ['C.interpretation.data.dimension'],
  ENGINE_EMOTION_CURRENT: ['C.interpretation.data.emotion.category', 'C.interpretation.data.emotion.status',
    'C.evidence[path=iep.emotion].derivedValue'],
  ENGINE_EMOTION_RECURRENT: ['C.interpretation.data.category', 'C.interpretation.data.otherCategory',
    'C.ruleEvaluation.conditions[name=same_uniquely_mapped_emotion_category].observed', 'C.evidence[path=iep.emotion].derivedValue'],
  ENGINE_EMOTION_OTHER: ['C.interpretation.data.category', 'C.interpretation.data.otherCategory'],
  ENGINE_EMOTION_SERIES_GATE: ['C.ruleEvaluation.conditions[name=same_known_non_Other_emotion].observed',
    'C.ruleEvaluation.conditions[name=internal_rating_changed].observed.sameKnownNonOtherEmotion',
    'C.evidence[path=iep.emotion].derivedValue'],
  REVISION_KEYS: ['C.interpretation.data.selectedDimensions', 'C.ruleEvaluation.conditions[name=latest_explicit_valid_revision].observed.selectedDimensions'],
  REVISION_EVENT_COUNT: ['C.interpretation.data.eventCount', 'C.ruleEvaluation.derivedMeasures[name=revision_event_count].value'],
  REVISION_KEY_COUNTS: ['C.interpretation.data.dimensionCounts', 'C.ruleEvaluation.derivedMeasures[name=revision_selection_count:dimension].value'],
  EXTERNAL_RECORD_PRESENT: ['C.ruleEvaluation.conditions[name=recorded_external_text_present].observed', 'C.evidence[path=oop.external]'],
  MIX_BRANCH: ['C.interpretation.data.triggers', 'C.ruleEvaluation.conditions[name=mixed_signal_present].observed',
    'C.ruleEvaluation.triggerEvaluations', 'C.nextFocus.variablePaths'],
  SELECTED_RULE: ['C.ruleId', 'C.candidateId', 'C.titleKey'],
  FIXED_FIELDS: ['trusted M01-M23 FIXED_FIELDS constants'],
  CAPABILITY_GAP: ['E.capabilities.VAQUQA.ruleId', 'E.capabilities.VAQUQA.status', 'E.capabilities.VAQUQA.conditionSufficiency'],
  SELECTION_BASIS: ['E.ruleEvaluations', 'E.selectionExplanation.data.selectedCandidate',
    'E.selectionExplanation.data.selectedTuple', 'E.selectionExplanation.data.secondaryCandidate'],
  CAPABILITY_ABSENCE: [] // MF1/MF2 are unreachable with a selected frozen-engine primary.
});

// These are the only source leaf readers. They are fixed code, not a general
// traversal helper. CIE/RIS/revision/text reads below are gate checks only.
const LEAF_READERS = freezeTrusted({
  'iep.desire': r => r.iep?.desire, 'iep.belief': r => r.iep?.belief,
  'iep.mental': r => r.iep?.mental, 'iep.practical': r => r.iep?.practical,
  'iep.emotionIntensity': r => r.iep?.emotionIntensity, 'iep.hours': r => r.iep?.hours,
  'iep.frequency': r => r.iep?.frequency, 'iep.emotion': r => r.iep?.emotion,
  'iep.actions': r => r.iep?.actions, 'oop.achievement': r => r.oop?.achievement,
  'oop.direction': r => r.oop?.direction, 'oop.evidence': r => r.oop?.evidence,
  'oop.currentState': r => r.oop?.currentState, 'oop.events': r => r.oop?.events,
  'oop.external': r => r.oop?.external, 'intentional': r => r.intentional,
  'revision': r => r.revision, 'id': r => r.id, 'createdAt': r => r.createdAt,
  'cie.primary': r => r.cie?.primary, 'cie.success': r => r.cie?.success,
  'cie.scope': r => r.cie?.scope, 'cie.nonGoals': r => r.cie?.nonGoals,
  'cie.constraints': r => r.cie?.constraints, 'cie.rationale': r => r.cie?.rationale
});
const RIS_READERS = freezeTrusted({ primary: r => r.primary, success: r => r.success,
  scope: r => r.scope, nonGoals: r => r.nonGoals, constraints: r => r.constraints, rationale: r => r.rationale });
const U = freezeTrusted([
  ['practical', 'iep.practical', 'practical rating', '0–10 self-report rating', 'source-record scope'],
  ['achievement', 'oop.achievement', 'achievement rating', '0–10 self-report rating', 'source-record scope'],
  ['mental', 'iep.mental', 'mental-effort rating', '0–10 self-report rating', 'source-record scope'],
  ['hours', 'iep.hours', 'recorded hours', 'hours', 'past seven days per record'],
  ['desire', 'iep.desire', 'desire rating', '0–10 self-report rating', 'source-record scope'],
  ['belief', 'iep.belief', 'belief rating', '0–10 self-report rating', 'source-record scope'],
  ['emotionIntensity', 'iep.emotionIntensity', 'emotion-intensity rating', '0–10 self-report rating', 'source-record scope']
]);
const I = freezeTrusted([['mental', 'iep.mental', 'mental-effort'], ['emotionIntensity', 'iep.emotionIntensity', 'emotion-intensity']]);
const B = freezeTrusted([
  ['B1', 'analysis.observeEventAndBasis'], ['B2', 'analysis.observeRevisedCriteria'],
  ['B3', 'analysis.observeActionAndEvent'], ['B4', 'analysis.observeExternalCircumstance'],
  ['B5', 'analysis.observeOwnCriteriaAgain']
]);
const CAPABILITY_SELECTOR = freezeTrusted({ capabilityPath: 'capabilities.VAQUQA', ruleId: 'COND-01',
  status: 'capability_gap', conditionSufficiency: 'unavailable' });

// The 23 literal M rows; candidate identities are pinned from makeCandidate and
// its exact metric/dimension calls, not constructed from caller data.
const M_ROWS = freezeTrusted([
  ['M01', 'REF-01', ['PRIMARY'], 'desire, belief, mental-effort, practical, emotion-intensity and achievement ratings; hours; frequency and outcome direction'],
  ['M02', 'QUAL-01', ['PRIMARY'], 'assessment-basis limitation metadata'],
  ['M03', 'CMP-01', ['PRIMARY', 'SECONDARY'], 'selected recorded metric, units and before/after/delta'],
  ['M04', 'CMP-02', ['PRIMARY', 'SECONDARY'], 'frequency category pair and ordinal-change metadata'],
  ['M05', 'TXT-01', ['PRIMARY', 'SECONDARY'], 'fixed dimension names with literal wording-difference metadata'],
  ['M06', 'INT-01', ['PRIMARY', 'SECONDARY'], 'six-dimension normalized wording-recurrence metadata'],
  ['M07', 'INT-02', ['PRIMARY', 'SECONDARY'], 'one fixed dimension name with recurring wording-mismatch metadata'],
  ['M08', 'PRA-01', ['PRIMARY', 'SECONDARY'], 'practical-rating series'],
  ['M09', 'PRA-02', ['PRIMARY', 'SECONDARY'], 'practical-rating series and separate past-seven-days hours'],
  ['M10', 'MEN-01', ['PRIMARY', 'SECONDARY'], 'mental-effort rating series'],
  ['M11', 'MEN-02', ['PRIMARY', 'SECONDARY'], 'recorded frequency-category series'],
  ['M12', 'EMO-01', ['PRIMARY', 'SECONDARY'], 'recorded mapped-category recurrence metadata'],
  ['M13', 'EMO-02', ['PRIMARY', 'SECONDARY'], 'emotion-intensity ratings within one mapped non-Other category'],
  ['M14', 'OUT-01', ['PRIMARY', 'SECONDARY'], 'achievement-rating, outcome-direction and evidence-basis selections'],
  ['M15', 'OUT-02', ['PRIMARY', 'SECONDARY'], 'nearby achievement ratings and recorded none direction'],
  ['M16', 'CTX-01', ['PRIMARY', 'SECONDARY'], 'separate practical and achievement rating series'],
  ['M17', 'CTX-02', ['SECONDARY'], 'external-context record-presence metadata'],
  ['M18', 'REV-01', ['PRIMARY', 'SECONDARY'], 'recorded revision-selection dimension keys'],
  ['M19', 'REV-02', ['PRIMARY', 'SECONDARY'], 'revision-selection event count and six dimension-key counts'],
  ['M20', 'REL-01', ['PRIMARY', 'SECONDARY'], 'separate practical and achievement rating series'],
  ['M21', 'REL-02', ['PRIMARY', 'SECONDARY'], 'practical and achievement rating series in the same observations'],
  ['M22', 'REL-03', ['PRIMARY', 'SECONDARY'], 'selected internal rating and separate practical and achievement rating series'],
  ['M23', 'MIX-01', ['PRIMARY', 'SECONDARY'], 'mixed or different-scope rating, hours, direction or decision/patch metadata']
]);
function engineTuple(row, candidateId, metric = null, dimension = null, branch = 'recorded', variant = 'recordedObservation') {
  return { ruleId: row[1], candidateId, key: `analysis.${row[1]}.title`,
    metric, dimension, branch, variant };
}
const MAPPINGS = freezeTrusted(M_ROWS.flatMap(row => {
  const rule = row[1];
  let tuples;
  if (rule === 'REF-01') tuples = B.flatMap(b => ['CURRENT_CATEGORY_UNAVAILABLE', 'CURRENT_KNOWN_CATEGORY']
    .map(v => engineTuple(row, 'REF-01', null, null, b[0], v)));
  else if (rule === 'QUAL-01') tuples = ['insufficient_basis', 'possible_default_profile'].map(b => engineTuple(row, rule, null, null, b));
  else if (rule === 'CMP-01') tuples = U.map(u => engineTuple(row, `CMP-01:${u[0]}`, u[0]));
  else if (rule === 'CMP-02') tuples = [engineTuple(row, 'CMP-02:frequency', 'frequency')];
  else if (rule === 'INT-02') tuples = D.map(d => engineTuple(row, `INT-02:${d}`, null, d));
  else if (rule === 'MEN-01') tuples = ['low_range', 'decreasing'].map(b => engineTuple(row, rule, null, null, b));
  else if (rule === 'MEN-02') tuples = ['same_category_repeated', 'category_decreased'].map(b => engineTuple(row, rule, null, null, b));
  else if (rule === 'EMO-01') tuples = ['known_non_other', 'other'].map(b => engineTuple(row, rule, null, null, b));
  else if (['EMO-02', 'OUT-01'].includes(rule)) tuples = ['increased', 'decreased'].map(b => engineTuple(row, rule, null, null, b));
  else if (rule === 'REL-03') tuples = I.map(i => engineTuple(row, rule, i[0]));
  else if (rule === 'MIX-01') tuples = ['decision_patch_conflict', 'practical_hours_opposed', 'recorded_direction']
    .map(b => engineTuple(row, rule, null, null, b));
  else tuples = [engineTuple(row, rule)];
  return tuples.map(selector => ({ mappingId: row[0], selector, allowedSurfaces: row[2], fixedFields: row[3] }));
}));

// Explicit logical selector table expanded only by the frozen U/I/D catalogs.
// U.metricLabel/U.units/U.scope and I.metricLabel are names for section 4's
// exact catalog constants, not source paths or new transformations.
const SELECTOR_TABLE = freezeTrusted([
  ...['iep.desire', 'iep.belief', 'iep.mental', 'iep.practical', 'iep.emotionIntensity',
    'oop.achievement', 'iep.hours', 'iep.frequency', 'oop.direction'].map(f => `CURRENT(${f})`),
  ...U.flatMap(u => [`PAIR(${u[1]})`, `ENGINE_DELTA(${u[1]})`]), 'PAIR(iep.frequency)',
  ...['iep.practical', 'iep.hours', 'iep.mental', 'iep.frequency', 'iep.emotionIntensity',
    'oop.achievement', 'oop.direction', 'oop.evidence'].map(f => `SERIES(${f})`),
  'ENGINE_ORDINAL', 'ENGINE_DIMENSIONS', 'ENGINE_DIMENSION', 'ENGINE_EMOTION_CURRENT',
  'ENGINE_EMOTION_RECURRENT', 'ENGINE_EMOTION_OTHER', 'ENGINE_EMOTION_SERIES_GATE',
  'REVISION_KEYS', 'REVISION_EVENT_COUNT', 'REVISION_KEY_COUNTS', 'EXTERNAL_RECORD_PRESENT',
  'MIX_BRANCH', 'SELECTED_RULE', 'FIXED_FIELDS', 'CAPABILITY_GAP', 'U.metricLabel', 'U.units', 'U.scope', 'I.metricLabel'
]);
const FACTUAL_MANIFEST_IDS = Object.freeze(['safety.manifest.primaryFactual', 'safety.manifest.primaryAndSecondaryFactual',
  'safety.manifest.primaryFactualWithCapability', 'safety.manifest.primaryAndSecondaryFactualWithCapability']);
const SURFACE_SLOTS = freezeTrusted({
  PRIMARY: ['primary.insight', 'primary.why.values', 'primary.why.selection', 'primary.why.limitations'],
  SECONDARY: ['secondary.insight', 'secondary.why.values', 'secondary.why.selection', 'secondary.why.limitations']
});
const MANIFESTS = freezeTrusted([
  { manifestId: 'safety.manifest.fallbackOnly', slots: ['fallback'], declaredAbsentSlots: ['primary', 'secondary'] },
  { manifestId: FACTUAL_MANIFEST_IDS[0], slots: [...SURFACE_SLOTS.PRIMARY],
    declaredAbsentSlots: ['primary.interpretation', 'primary.nextFocus', 'primary.why.capability', 'secondary'] },
  { manifestId: FACTUAL_MANIFEST_IDS[1], slots: [...SURFACE_SLOTS.PRIMARY, ...SURFACE_SLOTS.SECONDARY],
    declaredAbsentSlots: ['primary.interpretation', 'primary.nextFocus', 'primary.why.capability', 'secondary.interpretation', 'secondary.nextFocus', 'secondary.whyThisFocus'] },
  { manifestId: FACTUAL_MANIFEST_IDS[2], slots: [...SURFACE_SLOTS.PRIMARY, 'primary.why.capability'],
    declaredAbsentSlots: ['primary.interpretation', 'primary.nextFocus', 'secondary'] },
  { manifestId: FACTUAL_MANIFEST_IDS[3], slots: [...SURFACE_SLOTS.PRIMARY, 'primary.why.capability', ...SURFACE_SLOTS.SECONDARY],
    declaredAbsentSlots: ['primary.interpretation', 'primary.nextFocus', 'secondary.interpretation', 'secondary.nextFocus', 'secondary.whyThisFocus'] }
].map(m => ({ ...m, manifestVersion: 1, policyVersion: SAFETY_VERSION, registryVersion: REGISTRY_VERSION })));

function binding(name, type, selector, extra = {}) {
  const range = ['rating', 'ratingList'].includes(type) ? [0, 10] : ['hours', 'hoursList'].includes(type) ? [0, 168] :
    type === 'emotionIndex' ? [0, 9] : type === 'count' ? [0, Number.MAX_SAFE_INTEGER] : null;
  return { name, type, selector, required: true, range, transform: type.endsWith('List') ?
    type === 'basisList' ? 'enum_record_groups_comma_then_semicolon' : 'exact_values_comma_space' :
    type === 'dimensions' ? 'fixed_D_order_comma_space' : 'exact_inert_value', ...extra };
}
const CURRENT_BINDINGS = [
  ...[['desire', 'iep.desire'], ['belief', 'iep.belief'], ['mental', 'iep.mental'], ['practical', 'iep.practical'],
    ['intensity', 'iep.emotionIntensity'], ['achievement', 'oop.achievement']].map(([n, f]) => binding(n, 'rating', `CURRENT(${f})`, { field: f })),
  binding('hours', 'hours', 'CURRENT(iep.hours)', { field: 'iep.hours' }),
  binding('frequency', 'frequency', 'CURRENT(iep.frequency)', { field: 'iep.frequency' }),
  binding('direction', 'direction', 'CURRENT(oop.direction)', { field: 'oop.direction' })
];
const comparisonBinding = (name, type, prefix, extra = {}) => binding(name, type, null, {
  selectorByMetric: Object.fromEntries(U.map(u => [u[0], `${prefix}(${u[1]})`])), ...extra });
const seriesBinding = (n, t, f) => binding(n, t, `SERIES(${f})`, { field: f });
const COCHANGE_BINDINGS = [seriesBinding('practical', 'ratingList', 'iep.practical'), seriesBinding('achievement', 'ratingList', 'oop.achievement')];
const BINDINGS_BY_ROW = freezeTrusted({
  E01: [], E02: CURRENT_BINDINGS, E03: [...CURRENT_BINDINGS, binding('categoryIndex', 'emotionIndex', 'ENGINE_EMOTION_CURRENT')], E04: [],
  E05: [binding('metricLabel', 'metricLabel', 'U.metricLabel'), binding('units', 'units', 'U.units'), binding('scope', 'scope', 'U.scope'),
    comparisonBinding('before', 'rating', 'PAIR', { pairIndex: 0, typeByMetric: Object.fromEntries(U.map(u => [u[0], u[0] === 'hours' ? 'hours' : 'rating'])),
      rangeByMetric: Object.fromEntries(U.map(u => [u[0], [0, u[0] === 'hours' ? 168 : 10]])) }),
    comparisonBinding('after', 'rating', 'PAIR', { pairIndex: 1, typeByMetric: Object.fromEntries(U.map(u => [u[0], u[0] === 'hours' ? 'hours' : 'rating'])),
      rangeByMetric: Object.fromEntries(U.map(u => [u[0], [0, u[0] === 'hours' ? 168 : 10]])) }),
    comparisonBinding('delta', 'delta', 'ENGINE_DELTA', { rangeByMetric: Object.fromEntries(U.map(u => [u[0], u[0] === 'hours' ? [-168, 168] : [-10, 10]])) })],
  E06: [binding('before', 'frequency', 'PAIR(iep.frequency)', { field: 'iep.frequency', pairIndex: 0 }),
    binding('after', 'frequency', 'PAIR(iep.frequency)', { field: 'iep.frequency', pairIndex: 1 }), binding('ordinalChange', 'ordinalChange', 'ENGINE_ORDINAL')],
  E07: [binding('dimensions', 'dimensions', 'ENGINE_DIMENSIONS')], E08: [], E09: [binding('dimension', 'dimension', 'ENGINE_DIMENSION')],
  E10: [seriesBinding('ratings', 'ratingList', 'iep.practical')],
  E11: [seriesBinding('ratings', 'ratingList', 'iep.practical'), seriesBinding('hours', 'hoursList', 'iep.hours')],
  E12: [seriesBinding('ratings', 'ratingList', 'iep.mental')], E13: [seriesBinding('categories', 'frequencyList', 'iep.frequency')],
  E14: [binding('categoryIndex', 'emotionIndex', 'ENGINE_EMOTION_RECURRENT')], E15: [],
  E16: [seriesBinding('intensities', 'ratingList', 'iep.emotionIntensity')],
  E17: [seriesBinding('ratings', 'ratingList', 'oop.achievement'), seriesBinding('directions', 'directionList', 'oop.direction'), seriesBinding('bases', 'basisList', 'oop.evidence')],
  E18: [seriesBinding('ratings', 'ratingList', 'oop.achievement')], E19: COCHANGE_BINDINGS, E20: [],
  E21: [binding('dimensions', 'dimensions', 'REVISION_KEYS')],
  E22: [binding('eventCount', 'count', 'REVISION_EVENT_COUNT'), ...D.map(d => binding(`${d}Count`, 'count', 'REVISION_KEY_COUNTS', { dimension: d }))],
  E23: COCHANGE_BINDINGS, E24: COCHANGE_BINDINGS,
  E25: [binding('metricLabel', 'metricLabel', 'I.metricLabel'), binding('internal', 'ratingList', null, {
    selectorByMetric: Object.fromEntries(I.map(i => [i[0], `SERIES(${i[1]})`])) }), ...COCHANGE_BINDINGS],
  E26: [], E27: [binding('fieldNames', 'fieldNames', 'FIXED_FIELDS')], E28: [binding('ruleId', 'ruleId', 'SELECTED_RULE')], E29: [], E30: []
});

// Exact 30 canonical bodies/identities copied from the frozen catalog.
const ENTRY_BODIES = [
  {
    "row": "E01",
    "templateId": "safety.fallback.noInterpretationOrNextFocus",
    "role": "FALLBACK",
    "allowedPresentationFunction": "FIXED_FALLBACK",
    "canonicalText": "No interpretation or next focus is shown here."
  },
  {
    "row": "E02",
    "templateId": "safety.insight.currentRecordedAssessments",
    "role": "INSIGHT",
    "allowedPresentationFunction": "DESCRIBE_RECORDED_VALUES",
    "canonicalText": "Current recorded self-report ratings (0–10): desire {desire}; belief {belief}; mental effort {mental}; practical {practical}; emotion intensity {intensity}; achievement {achievement}. Recorded hours for the past seven days: {hours}. Recorded frequency category: {frequency}. Recorded outcome direction: {direction}."
  },
  {
    "row": "E03",
    "templateId": "safety.insight.currentRecordedAssessmentsAndCategory",
    "role": "INSIGHT",
    "allowedPresentationFunction": "DESCRIBE_RECORDED_VALUES",
    "canonicalText": "Current recorded self-report ratings (0–10): desire {desire}; belief {belief}; mental effort {mental}; practical {practical}; emotion intensity {intensity}; achievement {achievement}. Recorded hours for the past seven days: {hours}. Recorded frequency category: {frequency}. Recorded outcome direction: {direction}. Recorded mapped emotion-category index: {categoryIndex}. The category does not establish a mood or a specific emotion within Other."
  },
  {
    "row": "E04",
    "templateId": "safety.insight.assessmentBasisLimitation",
    "role": "INSIGHT",
    "allowedPresentationFunction": "STATE_DATA_LIMITATION",
    "canonicalText": "The selected saved assessment has an assessment-basis limitation under the frozen rule. Missing information does not establish that no event occurred."
  },
  {
    "row": "E05",
    "templateId": "safety.insight.numericComparison",
    "role": "INSIGHT",
    "allowedPresentationFunction": "DESCRIBE_RECORDED_VALUES",
    "canonicalText": "Recorded {metricLabel}: before {before}; after {after}; engine-reported difference {delta}. Units: {units}. Time scope: {scope}. These are recorded self-reports."
  },
  {
    "row": "E06",
    "templateId": "safety.insight.frequencyComparison",
    "role": "INSIGHT",
    "allowedPresentationFunction": "DESCRIBE_RECORDED_CATEGORIES",
    "canonicalText": "Recorded frequency categories: before {before}; after {after}. The engine's ordinal comparison is {ordinalChange}. The categories are not thought counts or equal-interval measurements."
  },
  {
    "row": "E07",
    "templateId": "safety.insight.literalWordingDifferences",
    "role": "INSIGHT",
    "allowedPresentationFunction": "DESCRIBE_WORDING_METADATA",
    "canonicalText": "Literal wording differences were recorded for: {dimensions}. This compares recorded wording with the current saved RIS; it does not determine meaning or reconstruct an earlier RIS."
  },
  {
    "row": "E08",
    "templateId": "safety.insight.normalizedWordingRecurrence",
    "role": "INSIGHT",
    "allowedPresentationFunction": "DESCRIBE_WORDING_METADATA",
    "canonicalText": "Normalized CIE wording recurred across primary, success, scope, nonGoals, constraints and rationale in the selected saved observations. Wording recurrence does not establish functional retention."
  },
  {
    "row": "E09",
    "templateId": "safety.insight.recurringWordingMismatch",
    "role": "INSIGHT",
    "allowedPresentationFunction": "DESCRIBE_WORDING_METADATA",
    "canonicalText": "Recurring recorded wording for {dimension} differs from the current saved RIS wording. Earlier RIS versions are unavailable; no semantic drift is determined."
  },
  {
    "row": "E10",
    "templateId": "safety.insight.practicalRatingDecrease",
    "role": "INSIGHT",
    "allowedPresentationFunction": "DESCRIBE_RECORDED_VALUES",
    "canonicalText": "Recorded practical ratings in the selected observations: {ratings} (0–10 self-reports). The frozen rule identified a decrease in these ratings."
  },
  {
    "row": "E11",
    "templateId": "safety.insight.practicalLowRangeAndHours",
    "role": "INSIGHT",
    "allowedPresentationFunction": "DESCRIBE_RECORDED_VALUES",
    "canonicalText": "Recorded practical ratings in the selected observations: {ratings} (0–10 self-reports), within the frozen rule's low range. Separately recorded hours for the past seven days per record: {hours}. The ratings do not establish absence of action."
  },
  {
    "row": "E12",
    "templateId": "safety.insight.mentalEffortRatings",
    "role": "INSIGHT",
    "allowedPresentationFunction": "DESCRIBE_RECORDED_VALUES",
    "canonicalText": "Recorded mental-effort ratings in the selected observations: {ratings} (0–10 self-reports). These ratings are not a measure of health or available energy."
  },
  {
    "row": "E13",
    "templateId": "safety.insight.frequencyCategories",
    "role": "INSIGHT",
    "allowedPresentationFunction": "DESCRIBE_RECORDED_CATEGORIES",
    "canonicalText": "Recorded frequency categories in the selected observations: {categories}. These selections are not a cognitive-performance score."
  },
  {
    "row": "E14",
    "templateId": "safety.insight.knownCategoryRecurrence",
    "role": "INSIGHT",
    "allowedPresentationFunction": "DESCRIBE_RECORDED_CATEGORIES",
    "canonicalText": "Recorded mapped emotion-category index {categoryIndex} recurred in the selected saved observations. Category recurrence does not establish a chronic mood."
  },
  {
    "row": "E15",
    "templateId": "safety.insight.otherCategorySelected",
    "role": "INSIGHT",
    "allowedPresentationFunction": "DESCRIBE_RECORDED_CATEGORIES",
    "canonicalText": "Other was selected in the saved observations used by the rule. This does not identify one specific emotion."
  },
  {
    "row": "E16",
    "templateId": "safety.insight.sameCategoryIntensityChange",
    "role": "INSIGHT",
    "allowedPresentationFunction": "DESCRIBE_RECORDED_VALUES",
    "canonicalText": "Recorded emotion-intensity ratings in the selected observations: {intensities} (0–10 self-reports). The existing comparison uses one uniquely mapped non-Other category. Intensity change is not a wellbeing assessment."
  },
  {
    "row": "E17",
    "templateId": "safety.insight.achievementRatingChange",
    "role": "INSIGHT",
    "allowedPresentationFunction": "DESCRIBE_RECORDED_VALUES",
    "canonicalText": "Recorded achievement ratings in the selected observations: {ratings} (0–10 self-reports). Recorded outcome directions: {directions}. Recorded evidence-basis selections, grouped by record: {bases}. These selections do not verify success, failure or completion."
  },
  {
    "row": "E18",
    "templateId": "safety.insight.nearbyAchievementRatings",
    "role": "INSIGHT",
    "allowedPresentationFunction": "DESCRIBE_RECORDED_VALUES",
    "canonicalText": "Recorded achievement ratings in the selected observations: {ratings} (0–10 self-reports). These ratings are nearby under the frozen rule. The recorded outcome direction is none in each selected observation. This does not establish stagnation."
  },
  {
    "row": "E19",
    "templateId": "safety.insight.contextSeriesFacts",
    "role": "INSIGHT",
    "allowedPresentationFunction": "DESCRIBE_RECORDED_COCHANGE",
    "canonicalText": "Recorded practical ratings: {practical}; recorded achievement ratings: {achievement} (separate 0–10 self-reports). The practical ratings are nearby and the achievement ratings decrease under the frozen rule. An external cause is not determined."
  },
  {
    "row": "E20",
    "templateId": "safety.insight.externalRecordPresent",
    "role": "INSIGHT",
    "allowedPresentationFunction": "DESCRIBE_WORDING_METADATA",
    "canonicalText": "An external-context record is present in the selected saved observation. Its meaning and any causal role are not determined."
  },
  {
    "row": "E21",
    "templateId": "safety.insight.recordedRevisionSelections",
    "role": "INSIGHT",
    "allowedPresentationFunction": "DESCRIBE_REVISION_SELECTIONS",
    "canonicalText": "The saved explicit revision selection includes: {dimensions}. Selected dimension keys do not establish that wording changed, and no revision is applied here."
  },
  {
    "row": "E22",
    "templateId": "safety.insight.recordedRevisionCounts",
    "role": "INSIGHT",
    "allowedPresentationFunction": "DESCRIBE_REVISION_SELECTIONS",
    "canonicalText": "Recorded explicit revision-selection events: {eventCount}. Selected dimension-key counts: primary {primaryCount}; success {successCount}; scope {scopeCount}; nonGoals {nonGoalsCount}; constraints {constraintsCount}; rationale {rationaleCount}. These counts do not assess revision quality or apply a revision."
  },
  {
    "row": "E23",
    "templateId": "safety.insight.practicalDecreaseNearbyAchievement",
    "role": "INSIGHT",
    "allowedPresentationFunction": "DESCRIBE_RECORDED_COCHANGE",
    "canonicalText": "Recorded practical ratings: {practical}; recorded achievement ratings: {achievement} (separate 0–10 self-reports). The practical ratings decrease while the achievement ratings remain nearby under the frozen rule. No action–outcome cause is determined."
  },
  {
    "row": "E24",
    "templateId": "safety.insight.recordedRatingCoIncrease",
    "role": "INSIGHT",
    "allowedPresentationFunction": "DESCRIBE_RECORDED_COCHANGE",
    "canonicalText": "Recorded practical ratings: {practical}; recorded achievement ratings: {achievement} (separate 0–10 self-reports). Both rating series increase in the selected observations under the frozen rule. Co-change does not establish an effect or efficacy."
  },
  {
    "row": "E25",
    "templateId": "safety.insight.internalRatingSeriesFacts",
    "role": "INSIGHT",
    "allowedPresentationFunction": "DESCRIBE_RECORDED_COCHANGE",
    "canonicalText": "Recorded {metricLabel} ratings: {internal}; recorded practical ratings: {practical}; recorded achievement ratings: {achievement} (separate 0–10 self-reports). The selected internal-rating series changes while practical and achievement ratings remain nearby under the frozen rule. Causality is not determined."
  },
  {
    "row": "E26",
    "templateId": "safety.insight.mixedRecordMetadata",
    "role": "INSIGHT",
    "allowedPresentationFunction": "STATE_DATA_LIMITATION",
    "canonicalText": "The selected saved records contain mixed or different-scope assessment metadata under the frozen rule. Ratings, hours, outcome directions and revision-decision metadata are not combined into one measure or automatically reconciled."
  },
  {
    "row": "E27",
    "templateId": "safety.why.recordedInformationUsed",
    "role": "WHY",
    "allowedPresentationFunction": "EXPLAIN_SELECTION_BASIS",
    "canonicalText": "The selected saved record references supply the recorded information shown here: {fieldNames}. Each value, category or structural fact retains its own source scope."
  },
  {
    "row": "E28",
    "templateId": "safety.why.ruleSelectionBasis",
    "role": "WHY",
    "allowedPresentationFunction": "EXPLAIN_SELECTION_BASIS",
    "canonicalText": "Rule {ruleId} supplied the existing eligibility and selection basis for this factual presentation. This explains the selection of recorded information, not why an event occurred."
  },
  {
    "row": "E29",
    "templateId": "safety.why.recordedDataLimitations",
    "role": "WHY",
    "allowedPresentationFunction": "STATE_DATA_LIMITATION",
    "canonicalText": "Recorded self-reports and category selections are not independently verified outcomes. Actual reporting periods and earlier RIS versions are not reconstructed. Objective meaning and causality remain undetermined; no recommendation follows from this presentation."
  },
  {
    "row": "E30",
    "templateId": "safety.why.conditionAssessmentUnavailable",
    "role": "WHY",
    "allowedPresentationFunction": "STATE_CAPABILITY_LIMITATION",
    "canonicalText": "Typed linked condition assessment is unavailable in the current data. This does not establish that any condition is missing, necessary or sufficient."
  }
];

const RULE_BY_ROW = freezeTrusted({ E04: 'QUAL-01', E05: 'CMP-01', E06: 'CMP-02', E07: 'TXT-01',
  E08: 'INT-01', E09: 'INT-02', E10: 'PRA-01', E11: 'PRA-02', E12: 'MEN-01', E13: 'MEN-02',
  E16: 'EMO-02', E17: 'OUT-01', E18: 'OUT-02', E19: 'CTX-01', E20: 'CTX-02', E21: 'REV-01',
  E22: 'REV-02', E23: 'REL-01', E24: 'REL-02', E25: 'REL-03', E26: 'MIX-01' });
function mappingsForRow(row) {
  if (row === 'E01') return [];
  if (row === 'E30') return [{ mappingId: 'MC', selector: CAPABILITY_SELECTOR, allowedSurfaces: ['PRIMARY'] }];
  if (['E27', 'E28', 'E29'].includes(row)) return MAPPINGS;
  if (['E02', 'E03'].includes(row)) return MAPPINGS.filter(m => m.selector.ruleId === 'REF-01' &&
    m.selector.variant === (row === 'E02' ? 'CURRENT_CATEGORY_UNAVAILABLE' : 'CURRENT_KNOWN_CATEGORY'));
  if (['E14', 'E15'].includes(row)) return MAPPINGS.filter(m => m.selector.ruleId === 'EMO-01' &&
    m.selector.branch === (row === 'E14' ? 'known_non_other' : 'other'));
  return MAPPINGS.filter(m => m.selector.ruleId === RULE_BY_ROW[row]);
}
const ENTRY_GATES = freezeTrusted({ E03: ['ENGINE_EMOTION_CURRENT'], E05: ['ENGINE_DELTA'],
  E06: ['ENGINE_ORDINAL'], E07: ['ENGINE_DIMENSIONS'], E08: ['normalized_six_dimension_recurrence'],
  E09: ['ENGINE_DIMENSION'], E14: ['ENGINE_EMOTION_RECURRENT'], E15: ['ENGINE_EMOTION_OTHER'],
  E16: ['ENGINE_EMOTION_SERIES_GATE'], E17: ['outcomeEligible'], E18: ['all_directions_none', 'outcomeEligible'],
  E20: ['EXTERNAL_RECORD_PRESENT'], E21: ['REVISION_KEYS'], E22: ['REVISION_EVENT_COUNT', 'REVISION_KEY_COUNTS'],
  E25: ['internal_rating_changed', 'ENGINE_EMOTION_SERIES_GATE_if_intensity'], E26: ['MIX_BRANCH'], E30: ['CAPABILITY_GAP'] });
const TEMPLATE_REGISTRY = freezeTrusted(ENTRY_BODIES.map(body => {
  const engineMappings = mappingsForRow(body.row), allowedBindings = BINDINGS_BY_ROW[body.row];
  const allowedSurfaces = body.row === 'E01' ? ['FALLBACK'] : body.row === 'E30' ? ['PRIMARY'] :
    ['PRIMARY', 'SECONDARY'].filter(s => engineMappings.some(m => m.allowedSurfaces.includes(s)));
  const manifests = body.row === 'E01' ? [MANIFESTS[0].manifestId] : body.row === 'E30' || body.row === 'E20' ?
    body.row === 'E30' ? [FACTUAL_MANIFEST_IDS[2], FACTUAL_MANIFEST_IDS[3]] : [FACTUAL_MANIFEST_IDS[1], FACTUAL_MANIFEST_IDS[3]] : FACTUAL_MANIFEST_IDS;
  const slotSuffix = body.role === 'INSIGHT' ? 'insight' : body.row === 'E27' ? 'why.values' :
    body.row === 'E28' ? 'why.selection' : body.row === 'E29' ? 'why.limitations' : 'why.capability';
  return { ...body, templateVersion: 1, policyVersion: SAFETY_VERSION, registryVersion: REGISTRY_VERSION,
    allowedRuleIds: body.row === 'E01' || body.row === 'E30' ? [] : M_ROWS.map(m => m[1]).filter(r => engineMappings.some(m => m.selector.ruleId === r)),
    allowedBindings, allowedSourcePaths: [...new Set(allowedBindings.flatMap(b => b.selector === null ? Object.values(b.selectorByMetric) : [b.selector]))],
    allowedSurfaces, engineMappings, safetyClassification: 'ALLOW', approvedVariants: {}, localeVariantsExist: false,
    requiredEvidence: { common: body.row === 'E01' ? [] : ['plain_data', 'frozen_engine_and_source_identity',
      'exact_selected_candidate', 'existing_eligibility_and_limitations', 'complete_manifest', 'typed_exact_provenance'],
      gates: ENTRY_GATES[body.row] || [], mappings: engineMappings }, manifestVersion: 1,
    manifestMembership: manifests.flatMap(manifestId => body.row === 'E01' ? [{ manifestId, slot: 'fallback' }] :
      allowedSurfaces.filter(s => s === 'PRIMARY' || [FACTUAL_MANIFEST_IDS[1], FACTUAL_MANIFEST_IDS[3]].includes(manifestId))
        .map(s => ({ manifestId, slot: `${s === 'PRIMARY' ? 'primary' : 'secondary'}.${slotSuffix}` }))) };
}));
freezeTrusted(ENTRY_BODIES);
const entryByRow = row => TEMPLATE_REGISTRY.find(e => e.row === row);

function registryValid() {
  const fields = ['templateId', 'templateVersion', 'role', 'allowedRuleIds', 'allowedBindings', 'allowedSourcePaths',
    'allowedPresentationFunction', 'safetyClassification', 'canonicalText', 'approvedVariants', 'allowedSurfaces', 'engineMappings',
    'requiredEvidence', 'manifestVersion'];
  return TEMPLATE_REGISTRY.length === 30 && MANIFESTS.length === 5 &&
    new Set(TEMPLATE_REGISTRY.map(e => `${e.templateId}/${e.templateVersion}/${e.role}`)).size === 30 &&
    TEMPLATE_REGISTRY.every(e => Object.isFrozen(e) && fields.every(f => Object.hasOwn(e, f)) &&
      e.templateVersion === 1 && e.manifestVersion === 1 && ['ALLOW', 'HOLD', 'UNKNOWN'].includes(e.safetyClassification) &&
      e.policyVersion === SAFETY_VERSION && e.registryVersion === REGISTRY_VERSION &&
      !['NEXT_FOCUS', 'INTERPRETATION'].includes(e.role) &&
      e.allowedSourcePaths.every(p => SELECTOR_TABLE.includes(p)) &&
      equal([...e.canonicalText.matchAll(/\{([A-Za-z]+)\}/g)].map(m => m[1]).sort(), e.allowedBindings.map(b => b.name).sort())) &&
    entryByRow('E01').templateId === FALLBACK_ID && entryByRow('E01').canonicalText === FALLBACK_TEXT;
}
function reject(code) { throw { code }; }
function requireGate(passed, code = 'INVALID_PROVENANCE') { if (!passed) reject(code); }
function engineContract(e, source) {
  return plainRecord(e) && e.engineVersion === ENGINE_REFERENCE.engineVersion && e.specVersion === 'analysis-phase1-proposal-1' &&
    e.adapterVersion === 'raw-0.1.0-conservative-v1' && e.dictionaryVersion === 'production-v16-31-locales' &&
    e.heuristicStatus === 'PRODUCT_HEURISTICS_FOR_BETA' && e.causality === 'not_determined' && STATUSES.includes(e.status) &&
    exactKeys(e.safety, ['externalDecision', 'releaseStatus', 'classifierImplemented']) &&
    ['ALLOW', 'HOLD', 'UNKNOWN'].includes(e.safety.externalDecision) && e.safety.releaseStatus === 'NOT_RELEASED_TO_USER' &&
    e.safety.classifierImplemented === false && e.inputReference?.sourceCommit === ENGINE_REFERENCE.sourceCommit &&
    e.inputReference.sourceVersion === source?.version && e.inputReference.referenceProvenance === 'current_mutable_RIS_only' &&
    e.inputReference.intentId === (typeof source?.intent?.id === 'string' ? source.intent.id : null) &&
    Object.hasOwn(e, 'primary') && Object.hasOwn(e, 'secondary') && Array.isArray(e.ruleEvaluations) && Array.isArray(e.comparisons);
}
function helpersValid() {
  return frozenEngine.ENGINE_VERSION === ENGINE_REFERENCE.engineVersion && frozenEngine.SOURCE_COMMIT === ENGINE_REFERENCE.sourceCommit &&
    frozenEngine.SOURCE_VERSION === ENGINE_REFERENCE.sourceVersion && equal(frozenEngine.DIMENSIONS, D) &&
    ['normalizeText', 'mapEmotion', 'parseTimestamp'].every(k => typeof frozenEngine[k] === 'function') &&
    frozenEngine.EMOTION_LABELS.en[9] === 'Other';
}

// Exact trusted negative functions for the private kernel, never caller claims.
const FORBIDDEN_FUNCTIONS = Object.freeze(['BEHAVIOURAL_OPTIMISATION', 'EFFORT_INCREASE', 'EFFORT_DECREASE',
  'ACTION_PRESCRIPTION', 'PERSISTENCE_ADVICE', 'MINDSET_MODIFICATION', 'BELIEF_MODIFICATION', 'EMOTION_MODIFICATION',
  'OBSTACLE_REMOVAL', 'EXECUTION_PLANNING', 'DIAGNOSTIC_FRAMING', 'THERAPEUTIC_FRAMING', 'TREATMENT_ADVICE',
  'CAUSAL_CLAIM', 'PREDICTION', 'AUTOMATIC_REVISION', 'OBJECTIVE_OPTIMISATION', 'CRITERIA_OPTIMISATION',
  'SCOPE_OPTIMISATION', 'HIGH_STAKES_DIRECTIVE', 'GLOBAL_SAFETY_CLAIM']);
const RAW_FIELDS = Object.freeze([...D.map(d => `cie.${d}`), 'iep.actions', 'iep.emotion',
  'oop.currentState', 'oop.events', 'oop.external', 'revision']);
const FORBIDDEN_RAW_SELECTORS = Object.freeze([
  ...RAW_FIELDS.flatMap(f => [`CURRENT(${f})`, `PAIR(${f})`, `SERIES(${f})`]),
  ...D.map(d => `intent.ris.${d}`)
]);
const KNOWN_SLOTS = Object.freeze([...SURFACE_SLOTS.PRIMARY, ...SURFACE_SLOTS.SECONDARY, 'primary.why.capability',
  'primary.interpretation', 'primary.nextFocus', 'secondary.interpretation', 'secondary.nextFocus',
  'secondary.whyThisFocus', 'secondary.recommendation', 'fallback']);
function ownData(value, key) {
  if (value === null || typeof value !== 'object') return undefined;
  const descriptor = Object.getOwnPropertyDescriptor(value, key);
  return descriptor && Object.hasOwn(descriptor, 'value') ? descriptor.value : undefined;
}
// Trusted metadata only. The actual immutable catalog has 30 ALLOW entries;
// private fixed kernel fixtures exercise the other policy verdicts. A known
// prohibited function must survive a malformed plan or companion entry.
function trustedEntryReasons(request) {
  const entry = TEMPLATE_REGISTRY.find(e => e.templateId === ownData(request, 'templateId') &&
    e.templateVersion === ownData(request, 'templateVersion'));
  return entry && (entry.safetyClassification === 'HOLD' || FORBIDDEN_FUNCTIONS.includes(entry.allowedPresentationFunction)) ?
    ['FORBIDDEN_FUNCTION'] : [];
}
function structuralHolds(request) {
  const reasons = [], role = ownData(request, 'role'), surface = ownData(request, 'surface'), slot = ownData(request, 'slot');
  const focus = role === 'NEXT_FOCUS' || ['primary.nextFocus', 'secondary.nextFocus', 'secondary.recommendation'].includes(slot);
  const selector = ownData(request, 'engineSelector');
  const forbiddenRule = [ownData(request, 'ruleId'), ownData(selector, 'ruleId')].some(r => ['CTX-02', 'COND-01'].includes(r));
  const forbiddenKey = [selector, ownData(selector, 'key'), ownData(selector, 'promptKey')]
    .some(k => ['analysis.CTX-02.observe', 'analysis.COND-01.observe'].includes(k));
  if (focus && (forbiddenRule || forbiddenKey)) reasons.push('FORBIDDEN_RULE_NEXT_FOCUS');
  if ((surface === 'SECONDARY' && (focus || ['RECOMMENDATION', 'ADVICE'].includes(role) ||
      ownData(request, 'recommendation') !== undefined || ownData(request, 'advice') !== undefined)) ||
      ['secondary.nextFocus', 'secondary.recommendation', 'secondary.whyThisFocus'].includes(slot)) reasons.push('FORBIDDEN_ROLE');
  const bindings = ownData(request, 'bindings');
  if (Array.isArray(bindings)) {
    for (let i = 0; i < bindings.length; i++) {
      if (FORBIDDEN_RAW_SELECTORS.includes(ownData(ownData(bindings, String(i)), 'selector'))) reasons.push('FORBIDDEN_BINDING');
    }
  }
  return reasonOrder(reasons);
}
function trustedUpstreamHold(e) {
  const safety = ownData(e, 'safety'), reference = ownData(e, 'inputReference');
  return ownData(e, 'engineVersion') === ENGINE_REFERENCE.engineVersion &&
    ownData(e, 'specVersion') === 'analysis-phase1-proposal-1' &&
    ownData(e, 'adapterVersion') === 'raw-0.1.0-conservative-v1' &&
    ownData(e, 'dictionaryVersion') === 'production-v16-31-locales' &&
    ownData(reference, 'sourceCommit') === ENGINE_REFERENCE.sourceCommit &&
    ownData(reference, 'sourceVersion') === ENGINE_REFERENCE.sourceVersion &&
    ownData(safety, 'externalDecision') === 'HOLD' && ownData(safety, 'releaseStatus') === 'NOT_RELEASED_TO_USER' &&
    ownData(safety, 'classifierImplemented') === false;
}

function cycleField(source, index, field) {
  requireGate(Number.isSafeInteger(index) && index >= 0 && index < source.intent.cycles.length && Object.hasOwn(LEAF_READERS, field));
  return LEAF_READERS[field](source.intent.cycles[index]);
}
function evidenceAt(context, index, field) {
  const { c, source } = context, cycle = source.intent.cycles[index], path = `intent.cycles[${index}].${field}`;
  const matches = c.evidence.filter(e => e.path === path);
  requireGate(matches.length > 0 && matches.every(e => equal(e, matches[0])));
  const ev = matches[0];
  requireGate(ev.arrayIndex === index && ev.cycleId === cycle.id && ev.createdAt === cycle.createdAt &&
    ev.present === true && equal(ev.rawValue, cycleField(source, index, field)));
  return ev;
}
function risEvidence(context, dimension) {
  const matches = context.c.evidence.filter(e => e.path === `intent.ris.${dimension}`);
  requireGate(matches.length > 0 && matches.every(e => equal(e, matches[0])));
  const e = matches[0], raw = RIS_READERS[dimension](context.source.intent.ris);
  requireGate(e.reference === 'current_mutable_reference' && equal(e.rawValue, raw) &&
    e.transformation === 'NFC_line_endings_outer_trim' && e.derivedValue === frozenEngine.normalizeText(raw));
  return e;
}
function conditionAt(context, name) {
  const c = uniqueOne(context.c.ruleEvaluation.conditions.filter(c => c.name === name));
  requireGate(c !== null && c.passed === true, 'ENGINE_GATE_UNMET');
  return c;
}
function measureAt(context, name) {
  const measure = uniqueOne((context.c.ruleEvaluation.derivedMeasures || []).filter(m => m.name === name));
  requireGate(measure !== null && Array.isArray(measure.inputPaths));
  return measure;
}
function sourceRefs(context, fields, indices = context.indices) {
  return indices.flatMap(arrayIndex => fields.map(field => {
    evidenceAt(context, arrayIndex, field);
    return { arrayIndex, cycleId: context.source.intent.cycles[arrayIndex].id, path: `intent.cycles[${arrayIndex}].${field}` };
  }));
}
function gateEmotion(context, indices, nonOther) {
  const mappings = indices.map(i => {
    const ev = evidenceAt(context, i, 'iep.emotion'), m = frozenEngine.mapEmotion(ev.rawValue);
    requireGate(ev.transformation === 'NFC_line_endings_outer_trim_then_frozen_dictionary_v16' &&
      equal(ev.derivedValue, { category: m.category, status: m.status }));
    requireGate(m.status === 'known' && Number.isInteger(m.category) && bounded(m.category, 9) && (!nonOther || m.category !== 9), 'ENGINE_GATE_UNMET');
    return m;
  });
  requireGate(mappings.length > 0 && mappings.every(m => m.category === mappings[0].category), 'ENGINE_GATE_UNMET');
  return mappings[0].category;
}
function revisionAt(context, i) {
  const decision = evidenceAt(context, i, 'intentional').rawValue, patch = evidenceAt(context, i, 'revision').rawValue;
  requireGate(decision === 'yes' && plainRecord(patch) && Object.keys(patch).length > 0 &&
    Object.keys(patch).every(k => D.includes(k) && nonblank(patch[k])), 'ENGINE_GATE_UNMET');
  return D.filter(d => Object.hasOwn(patch, d));
}

function validateSource(source, e) {
  requireGate(helpersValid() && plainRecord(source) && source.version === ENGINE_REFERENCE.sourceVersion, 'INVALID_SOURCE');
  requireGate(engineContract(e, source), 'INVALID_SOURCE');
  if (source.intent === null) return;
  const intent = source.intent;
  requireGate(plainRecord(intent) && Array.isArray(intent.cycles) && plainRecord(intent.ris) &&
    nonblank(intent.id) && frozenEngine.parseTimestamp(intent.createdAt).valid, 'INVALID_SOURCE');
  const ids = new Set();
  let previous = frozenEngine.parseTimestamp(intent.createdAt).milliseconds;
  for (const cycle of intent.cycles) {
    requireGate(plainRecord(cycle) && nonblank(cycle.id) && !ids.has(cycle.id), 'INVALID_SOURCE');
    ids.add(cycle.id);
    const stamp = frozenEngine.parseTimestamp(cycle.createdAt);
    requireGate(stamp.valid && stamp.milliseconds >= previous &&
      (ids.size === 1 || stamp.milliseconds > previous), 'INVALID_SOURCE');
    previous = stamp.milliseconds;
  }
}
function candidateContext(source, engine, surface) {
  const c = surface === 'PRIMARY' ? engine.primary : engine.secondary;
  requireGate(plainRecord(c) && c.eligible === true && c.causality === 'not_determined' &&
    c.safetyDisposition === 'requires_separate_presentation_gate' && STATUSES.includes(c.status) && LEVELS.includes(c.evidenceLevel) &&
    Array.isArray(c.limitations) && COMMON_LIMITS.every(l => c.limitations.includes(l)) &&
    Array.isArray(c.missingData) && c.missingData.includes('historical_RIS_versions') &&
    Array.isArray(c.exclusionReasons) && c.exclusionReasons.length === 0 &&
    plainRecord(c.ruleEvaluation) && Array.isArray(c.ruleEvaluation.conditions) && c.ruleEvaluation.conditions.length > 0 &&
    c.ruleEvaluation.conditions.every(v => exactKeys(v, ['name', 'observed', 'required', 'passed', 'inputPaths', 'formula']) &&
      typeof v.name === 'string' && v.passed === true && Array.isArray(v.inputPaths)) &&
    Array.isArray(c.ruleEvaluation.failedConditions) && c.ruleEvaluation.failedConditions.length === 0 &&
    Array.isArray(c.evidence), 'ENGINE_GATE_UNMET');
  requireGate(surface !== 'PRIMARY' || c.secondaryOnly === false, 'ENGINE_GATE_UNMET');
  requireGate(surface !== 'SECONDARY' || (c.nextFocus === null && c.whyThisFocus === null), 'ENGINE_GATE_UNMET');
  const indices = c.ruleEvaluation.usedArrayIndices;
  requireGate(Array.isArray(indices) && indices.length > 0 && indices.every((i, n) => Number.isSafeInteger(i) &&
    i >= 0 && i < source.intent.cycles.length && (n === 0 || i > indices[n - 1])));
  requireGate(equal(c.ruleEvaluation.usedCycleIds, indices.map(i => source.intent.cycles[i].id)) &&
    c.priority?.supportingObservations === indices.length && c.priority.evidenceLevel === c.evidenceLevel && c.priority.ruleId === c.ruleId);
  const evaluation = uniqueOne(engine.ruleEvaluations.filter(v => v.ruleId === c.ruleId && v.candidateId === c.candidateId));
  requireGate(evaluation !== null && evaluation.eligible === true && equal(evaluation.priority, c.priority));
  const evaluationData = Object.fromEntries(Object.entries(evaluation).filter(([k]) => !['ruleId', 'candidateId', 'eligible', 'priority'].includes(k)));
  requireGate(equal(evaluationData, c.ruleEvaluation));
  requireGate(engine.selectionExplanation?.key === 'analysis.fixedPriorityTuple' &&
    engine.selectionExplanation.data.selectedCandidate === engine.primary?.candidateId &&
    engine.selectionExplanation.data.secondaryCandidate === (engine.secondary?.candidateId || null) &&
    equal(engine.selectionExplanation.data.selectedTuple, engine.primary?.priority));
  requireGate(plainRecord(c.interpretation) && plainRecord(c.interpretation.data));
  const context = { source, engine, surface, c, indices, data: c.interpretation.data };
  for (const i of indices) { evidenceAt(context, i, 'id'); evidenceAt(context, i, 'createdAt'); }
  // Validate every supplied cycle-evidence reference using the closed leaf table;
  // duplicated refs generated by the frozen engine are accepted only if equal.
  for (const ev of c.evidence) {
    requireGate(plainRecord(ev) && typeof ev.path === 'string');
    const risKey = D.find(d => ev.path === `intent.ris.${d}`);
    if (risKey) { risEvidence(context, risKey); continue; }
    requireGate(Number.isSafeInteger(ev.arrayIndex) && ev.arrayIndex >= 0 && ev.arrayIndex < source.intent.cycles.length);
    const field = Object.keys(LEAF_READERS).find(f => ev.path === `intent.cycles[${ev.arrayIndex}].${f}`);
    requireGate(field !== undefined);
    // Malformed raw fields can supply factual QUAL/MIX limitation metadata, but
    // a missing reference never authorizes a value binding.
    const raw = cycleField(source, ev.arrayIndex, field);
    requireGate(ev.cycleId === source.intent.cycles[ev.arrayIndex].id && ev.createdAt === source.intent.cycles[ev.arrayIndex].createdAt &&
      equal(ev.rawValue, raw === undefined ? null : raw));
    if (field.startsWith('cie.') && ev.transformation) requireGate(ev.transformation === 'NFC_line_endings_outer_trim' &&
      ev.derivedValue === frozenEngine.normalizeText(raw));
    if (field === 'createdAt') requireGate(ev.transformation === 'strict_ISO_calendar_to_epoch_milliseconds' &&
      ev.derivedValue === frozenEngine.parseTimestamp(raw).milliseconds);
    if (field === 'iep.emotion') {
      const m = frozenEngine.mapEmotion(raw);
      requireGate(ev.transformation === m.transformation && equal(ev.derivedValue, { category: m.category, status: m.status }));
    }
    if (field === 'oop.evidence' && ev.transformation) requireGate(ev.transformation === 'derived_set_then_basisStatus_v1' &&
      Array.isArray(raw) && raw.every(b => BASES.includes(b)) && equal(ev.derivedValue?.selectedSet, [...new Set(raw)]));
  }
  // Concrete condition/measure provenance must refer to existing evidence, never
  // caller-composed paths. No new selection, chronology sorting, or threshold run.
  for (const condition of c.ruleEvaluation.conditions) {
    for (const path of condition.inputPaths) requireGate(c.evidence.some(e => e.path === path));
  }
  if (surface === 'PRIMARY') requireGate(c.whyThisFocus?.key === `analysis.${c.ruleId}.selectionBasis` &&
    equal(c.whyThisFocus.data?.conditionNames, c.ruleEvaluation.conditions.map(v => v.name)) &&
    plainRecord(c.nextFocus) && c.nextFocus.optional === true && c.nextFocus.releaseStatus === 'NOT_RELEASED_TO_USER' &&
    ['observe', 'clarify'].includes(c.nextFocus.kind));
  return context;
}

const PATTERN_CONDITIONS = Object.freeze(['minimum_spaced_observations', 'traceability', 'recordedBasisSame',
  'required_inputs_all_intermediate_cycles', 'POSSIBLE_UNREVIEWED_DEFAULTS']);
const CONDITION_NAMES = freezeTrusted({
  'REF-01': ['record_present'], 'QUAL-01': ['quality_limitation_present'],
  'CMP-01': ['two_adjacent_saved_records', 'valid_numeric_pair', 'same_known_non_Other_emotion', 'boundary', 'POSSIBLE_UNREVIEWED_DEFAULTS'],
  'CMP-02': ['valid_frequency_pair', 'boundary', 'POSSIBLE_UNREVIEWED_DEFAULTS'],
  'TXT-01': ['different_wording'], 'REV-01': ['latest_explicit_valid_revision'], 'REV-02': ['minimum_revision_events', 'traceability'],
  'INT-01': PATTERN_CONDITIONS, 'INT-02': [...PATTERN_CONDITIONS, 'repeated_wording_differs_from_current_reference'],
  'PRA-01': [...PATTERN_CONDITIONS, 'LARGE_STEP_REQUIRES_REPEAT', 'down(iep.practical)', 'practical_hours_opposed'],
  'PRA-02': [...PATTERN_CONDITIONS, 'LARGE_STEP_REQUIRES_REPEAT', 'low(iep.practical)'],
  'MEN-01': [...PATTERN_CONDITIONS, 'LARGE_STEP_REQUIRES_REPEAT', 'low_or_down(iep.mental)'],
  'MEN-02': [...PATTERN_CONDITIONS, 'frequency_recurrence_or_decrease'],
  'EMO-01': [...PATTERN_CONDITIONS, 'same_uniquely_mapped_emotion_category'],
  'EMO-02': [...PATTERN_CONDITIONS, 'LARGE_STEP_REQUIRES_REPEAT', 'up_or_down(iep.emotionIntensity)', 'same_known_non_Other_emotion'],
  'OUT-01': [...PATTERN_CONDITIONS, 'LARGE_STEP_REQUIRES_REPEAT', 'up_or_down(oop.achievement)', 'outcomeEligible', 'opposing_recorded_directions'],
  'OUT-02': [...PATTERN_CONDITIONS, 'LARGE_STEP_REQUIRES_REPEAT', 'flat(oop.achievement)', 'outcomeEligible', 'all_directions_none'],
  'REL-01': [...PATTERN_CONDITIONS, 'outcomeEligible', 'mixed_evidence', 'LARGE_STEP_REQUIRES_REPEAT', 'down(iep.practical)',
    'LARGE_STEP_REQUIRES_REPEAT', 'flat(oop.achievement)', 'all_directions_none', 'no_Hup'],
  'REL-02': [...PATTERN_CONDITIONS, 'outcomeEligible', 'mixed_evidence', 'LARGE_STEP_REQUIRES_REPEAT', 'up(iep.practical)',
    'LARGE_STEP_REQUIRES_REPEAT', 'up(oop.achievement)', 'direction_not_away', 'no_Hdown'],
  'REL-03': [...PATTERN_CONDITIONS, 'outcomeEligible', 'mixed_evidence', 'LARGE_STEP_REQUIRES_REPEAT', 'flat(iep.practical)',
    'LARGE_STEP_REQUIRES_REPEAT', 'flat(oop.achievement)', 'internal_rating_changed'],
  'CTX-01': [...PATTERN_CONDITIONS, 'outcomeEligible', 'mixed_evidence', 'LARGE_STEP_REQUIRES_REPEAT', 'flat(iep.practical)',
    'LARGE_STEP_REQUIRES_REPEAT', 'down(oop.achievement)', 'directions_not_toward', 'no_Hup_or_Hdown'],
  'CTX-02': ['recorded_external_text_present'], 'MIX-01': ['mixed_signal_present']
});
const FOCUS_KEYS = freezeTrusted({
  'QUAL-01': 'analysis.observeEventAndBasis', 'REV-01': 'analysis.observeRevisedCriteria',
  'TXT-01': 'analysis.checkWordingOrMeaning', 'INT-02': 'analysis.checkWordingOrMeaning', 'MIX-01': 'analysis.clarifyOneRecordedAssessment',
  'CMP-01': 'analysis.CMP-01.observe', 'CMP-02': 'analysis.CMP-02.observe', 'REV-02': 'analysis.REV-02.observe',
  'INT-01': 'analysis.INT-01.observe', 'PRA-01': 'analysis.PRA-01.observe', 'PRA-02': 'analysis.PRA-02.observe',
  'MEN-01': 'analysis.MEN-01.observe', 'MEN-02': 'analysis.MEN-02.observe', 'EMO-01': 'analysis.EMO-01.observe',
  'EMO-02': 'analysis.EMO-02.observe', 'OUT-01': 'analysis.OUT-01.observe', 'OUT-02': 'analysis.OUT-02.observe',
  'CTX-01': 'analysis.CTX-01.observe', 'REL-01': 'analysis.REL-01.observe', 'REL-02': 'analysis.REL-02.observe', 'REL-03': 'analysis.REL-03.observe'
});
function valuesFor(context, field, indices = context.indices) {
  return indices.map(i => evidenceAt(context, i, field).rawValue);
}
function validMeasurement(values, field) {
  if (field === 'iep.hours') return values.every(v => bounded(v, 168));
  if (field === 'iep.frequency') return values.every(v => FREQUENCIES.includes(v));
  if (field === 'oop.direction') return values.every(v => DIRECTIONS.includes(v));
  if (field === 'oop.evidence') return values.every(v => Array.isArray(v) && v.every(b => BASES.includes(b)));
  return values.every(v => bounded(v, 10));
}
function guardScope(context) {
  const indices = [...new Set(context.c.evidence.filter(e => Number.isSafeInteger(e.arrayIndex)).map(e => e.arrayIndex))];
  requireGate(equal(context.c.ruleEvaluation.validatedIntermediateCycleIds, indices.map(i => context.source.intent.cycles[i].id)));
  return indices;
}
function validatePattern(context) {
  const { engine, indices, c } = context, guards = guardScope(context);
  requireGate(indices.length >= 3 && indices.length <= 5 &&
    equal(indices, engine.timeWindow.usedArrayIndices) && equal(c.ruleEvaluation.usedCycleIds, engine.timeWindow.usedCycleIds) &&
    engine.timeWindow.N_spaced === indices.length && engine.segmentation.recordedBasisSame === true &&
    engine.validation.globalTraceabilityDefect === false && guards.length >= indices.length &&
    guards.every((i, n) => n === 0 || i === guards[n - 1] + 1) &&
    guards[0] === indices[0] && guards.at(-1) === indices.at(-1), 'ENGINE_GATE_UNMET');
  requireGate(conditionAt(context, 'minimum_spaced_observations').observed === indices.length &&
    conditionAt(context, 'recordedBasisSame').observed === true, 'ENGINE_GATE_UNMET');
  const signature = D.map(d => frozenEngine.normalizeText(evidenceAt(context, guards[0], `cie.${d}`).rawValue));
  requireGate(signature.every(nonblank), 'ENGINE_GATE_UNMET');
  for (const i of guards) {
    requireGate(equal(D.map(d => frozenEngine.normalizeText(evidenceAt(context, i, `cie.${d}`).rawValue)), signature) &&
      evidenceAt(context, i, 'intentional').rawValue === 'no' && exactKeys(evidenceAt(context, i, 'revision').rawValue, []), 'ENGINE_GATE_UNMET');
  }
  // Spacing/segmentation are inherited, not selected again. Verify the supplied
  // selected set's invariant with the existing timestamp parser only.
  const times = indices.map(i => frozenEngine.parseTimestamp(context.source.intent.cycles[i].createdAt).milliseconds);
  requireGate(times.every((t, n) => n === 0 || (t - times[n - 1] >= 604800000 && t - times[n - 1] <= 2419200000)), 'ENGINE_GATE_UNMET');
  const required = conditionAt(context, 'required_inputs_all_intermediate_cycles');
  requireGate(Array.isArray(required.observed) && equal(required.observed.map(r => r.arrayIndex), guards) &&
    required.observed.every(r => Array.isArray(r.invalidPaths) && r.invalidPaths.length === 0));
  return guards;
}
function validatePair(context, field) {
  const { indices, source, c } = context;
  requireGate(indices.length === 2 && indices[0] === source.intent.cycles.length - 2 && indices[1] === source.intent.cycles.length - 1 &&
    c.evidenceLevel === 'COMPARISON', 'ENGINE_GATE_UNMET');
  for (const i of indices) requireGate(evidenceAt(context, i, 'intentional').rawValue === 'no' &&
    exactKeys(evidenceAt(context, i, 'revision').rawValue, []), 'ENGINE_GATE_UNMET');
  const signatures = indices.map(i => D.map(d => frozenEngine.normalizeText(evidenceAt(context, i, `cie.${d}`).rawValue)));
  requireGate(signatures[0].every(nonblank) && equal(signatures[0], signatures[1]), 'ENGINE_GATE_UNMET');
  const values = valuesFor(context, field);
  requireGate(validMeasurement(values, field), 'INVALID_BINDING');
  return values;
}
function validateNumericPair(context, u) {
  const values = validatePair(context, u[1]);
  const comparison = uniqueOne(context.engine.comparisons.filter(c => c.ruleId === 'CMP-01' && c.metric === u[0]));
  const measure = measureAt(context, 'signed_delta');
  const paths = context.indices.map(i => `intent.cycles[${i}].${u[1]}`), max = u[0] === 'hours' ? 168 : 10;
  requireGate(comparison !== null && comparison.comparableBasis === true && equal(comparison.inputPaths, paths) &&
    equal(measure.inputPaths, paths) && comparison.formula === 'after-before' && measure.formula === 'after-before' &&
    comparison.before === values[0] && comparison.after === values[1] &&
    context.data.before === comparison.before && context.data.after === comparison.after &&
    context.data.delta === comparison.delta && measure.value === comparison.delta &&
    Number.isFinite(comparison.delta) && comparison.delta >= -max && comparison.delta <= max &&
    context.data.changeClass === comparison.changeClass &&
    comparison.limitations.every(l => context.c.limitations.includes(l)));
  if (u[0] === 'emotionIntensity') gateEmotion(context, context.indices, true);
  // Use the existing delta; no replacement difference is computed here.
  context.comparison = comparison;
}
function validateOutcome(context, guards) {
  const gate = conditionAt(context, 'outcomeEligible');
  requireGate(Array.isArray(gate.observed) && equal(gate.observed.map(r => r.cycleId), guards.map(i => context.source.intent.cycles[i].id)));
  for (let n = 0; n < guards.length; n++) {
    const i = guards[n], basis = evidenceAt(context, i, 'oop.evidence'), achievement = evidenceAt(context, i, 'oop.achievement').rawValue,
      direction = evidenceAt(context, i, 'oop.direction').rawValue;
    requireGate(bounded(achievement, 10) && ['toward', 'none', 'away'].includes(direction) &&
      basis.derivedValue?.basisStatus === 'reported' && !basis.rawValue.includes('insufficient') &&
      basis.rawValue.some(b => ['direct', 'documented', 'otherPerson', 'subjective'].includes(b)) &&
      gate.observed[n].basisStatus === 'reported' && gate.observed[n].direction === direction, 'ENGINE_GATE_UNMET');
  }
}
function validateSeriesMetadata(context, field, dataValues) {
  const values = valuesFor(context, field);
  requireGate(validMeasurement(values, field) && equal(values, dataValues), 'INVALID_BINDING');
  const paths = context.indices.map(i => `intent.cycles[${i}].${field}`);
  const rangeMeasure = measureAt(context, `${field}:range`);
  requireGate(equal(rangeMeasure.inputPaths, paths));
  return values;
}

function selectMapping(context) {
  const { c, data, indices, source, surface } = context;
  requireGate(Object.hasOwn(CONDITION_NAMES, c.ruleId) && equal(c.ruleEvaluation.conditions.map(v => v.name), CONDITION_NAMES[c.ruleId]), 'UNMAPPED_ENGINE_KEY');
  let branch = 'recorded', metric = null, dimension = null, variant = 'recordedObservation';
  const pattern = CONDITION_NAMES[c.ruleId].includes('minimum_spaced_observations');
  const guards = pattern ? validatePattern(context) : guardScope(context);
  if (['REF-01', 'QUAL-01', 'REV-01', 'CTX-02'].includes(c.ruleId)) requireGate(indices.length === 1 && indices[0] === source.intent.cycles.length - 1);
  if (['REF-01', 'QUAL-01'].includes(c.ruleId)) requireGate(surface === 'PRIMARY', 'UNMAPPED_ENGINE_KEY');
  if (c.ruleId === 'REF-01') {
    const i = indices[0], emotion = frozenEngine.mapEmotion(evidenceAt(context, i, 'iep.emotion').rawValue);
    requireGate(equal(data.emotion, emotion));
    const basis = evidenceAt(context, i, 'oop.evidence'), decision = evidenceAt(context, i, 'intentional').rawValue,
      patch = evidenceAt(context, i, 'revision').rawValue;
    const defaultProfile = c.limitations.includes('POSSIBLE_UNREVIEWED_DEFAULTS');
    const good = bounded(cycleField(source, i, 'oop.achievement'), 10) &&
      ['toward', 'none', 'away'].includes(cycleField(source, i, 'oop.direction')) && basis.derivedValue?.basisStatus === 'reported';
    const explicit = decision === 'yes' && plainRecord(patch) && Object.keys(patch).length > 0 &&
      Object.keys(patch).every(d => D.includes(d) && nonblank(patch[d]));
    branch = !good || defaultProfile ? 'B1' : explicit ? 'B2' : !nonblank(cycleField(source, i, 'iep.actions')) ? 'B3' :
      !nonblank(cycleField(source, i, 'oop.external')) ? 'B4' : 'B5';
    requireGate(c.nextFocus.promptKey === B.find(b => b[0] === branch)[1] && c.nextFocus.kind === 'observe', 'UNKNOWN_VARIANT');
    variant = emotion.status === 'known' ? 'CURRENT_KNOWN_CATEGORY' : 'CURRENT_CATEGORY_UNAVAILABLE';
    for (const d of D) risEvidence(context, d);
  } else if (c.ruleId === 'QUAL-01') {
    requireGate(c.status === 'INSUFFICIENT' && conditionAt(context, 'quality_limitation_present').observed === true, 'ENGINE_GATE_UNMET');
    if (data.defaultProfile === 'possible_default_like_recorded_profile') branch = 'possible_default_profile';
    else {
      const i = indices[0];
      requireGate(data.defaultProfile === null && (!['reported'].includes(data.basisStatus) ||
        !bounded(cycleField(source, i, 'oop.achievement'), 10) || !['toward', 'none', 'away', 'mixed'].includes(cycleField(source, i, 'oop.direction'))), 'UNKNOWN_VARIANT');
      branch = 'insufficient_basis';
    }
  } else if (c.ruleId === 'CMP-01') {
    const u = U.find(u => c.candidateId === `CMP-01:${u[0]}`);
    requireGate(u !== undefined && c.ruleEvaluation.metric === u[0], 'UNKNOWN_VARIANT');
    metric = u[0]; validateNumericPair(context, u);
  } else if (c.ruleId === 'CMP-02') {
    metric = 'frequency'; const values = validatePair(context, 'iep.frequency');
    requireGate(data.before === values[0] && data.after === values[1] &&
      ['higher_category', 'lower_category', 'same_category'].includes(data.change), 'ENGINE_GATE_UNMET');
    const expected = values[0] === values[1] ? 'same_category' : FREQUENCIES.indexOf(values[1]) > FREQUENCIES.indexOf(values[0]) ? 'higher_category' : 'lower_category';
    requireGate(data.change === expected);
  } else if (c.ruleId === 'TXT-01') {
    // The body is explicitly current-RIS scoped. Adjacent-only differences
    // cannot be substituted for this selector and remain UNKNOWN.
    requireGate(orderedDimensions(data.currentReferenceDifferences) && Array.isArray(data.adjacentWordingDifferences), 'ENGINE_GATE_UNMET');
    const last = indices.at(-1);
    for (const d of D) risEvidence(context, d);
    const actual = D.filter(d => nonblank(cycleField(source, last, `cie.${d}`)) && nonblank(source.intent.ris[d]) &&
      frozenEngine.normalizeText(cycleField(source, last, `cie.${d}`)) !== frozenEngine.normalizeText(source.intent.ris[d]));
    requireGate(equal(data.currentReferenceDifferences, actual));
  } else if (c.ruleId === 'INT-01') {
    requireGate(equal(data.normalizedCIESignature, D.map(d => frozenEngine.normalizeText(cycleField(source, indices[0], `cie.${d}`)))) &&
      data.functionalRetention === 'unavailable');
  } else if (c.ruleId === 'INT-02') {
    dimension = data.dimension;
    requireGate(D.includes(dimension), 'UNKNOWN_VARIANT'); risEvidence(context, dimension);
    requireGate(data.currentReference === source.intent.ris[dimension] && data.recordedWording === cycleField(source, indices[0], `cie.${dimension}`) &&
      data.semanticDrift === 'unavailable' && frozenEngine.normalizeText(data.recordedWording) !== frozenEngine.normalizeText(data.currentReference));
  } else if (['PRA-01', 'PRA-02', 'MEN-01', 'EMO-02', 'OUT-01', 'OUT-02'].includes(c.ruleId)) {
    const field = ['PRA-01', 'PRA-02'].includes(c.ruleId) ? 'iep.practical' : c.ruleId === 'MEN-01' ? 'iep.mental' :
      c.ruleId === 'EMO-02' ? 'iep.emotionIntensity' : 'oop.achievement';
    validateSeriesMetadata(context, field, data.values);
    if (c.ruleId === 'MEN-01') {
      const observed = conditionAt(context, 'low_or_down(iep.mental)').observed;
      requireGate(observed.down === true || observed.low === true, 'ENGINE_GATE_UNMET');
      branch = observed.down === true ? 'decreasing' : 'low_range';
    }
    if (['EMO-02', 'OUT-01'].includes(c.ruleId)) { branch = data.direction; requireGate(['increased', 'decreased'].includes(branch), 'UNKNOWN_VARIANT'); }
    if (c.ruleId === 'EMO-02') {
      gateEmotion(context, guards, true);
      requireGate(equal(conditionAt(context, 'same_known_non_Other_emotion').observed,
        guards.map(i => frozenEngine.mapEmotion(cycleField(source, i, 'iep.emotion')))));
    }
    if (c.ruleId === 'PRA-02') {
      const hours = valuesFor(context, 'iep.hours');
      requireGate(validMeasurement(hours, 'iep.hours') && equal(data.hours?.values, hours) &&
        equal(c.ruleEvaluation.hoursCorroboration?.values, hours) &&
        equal(c.ruleEvaluation.hoursCorroboration.inputPaths, indices.map(i => `intent.cycles[${i}].iep.hours`)), 'INVALID_BINDING');
    }
    if (['OUT-01', 'OUT-02'].includes(c.ruleId)) validateOutcome(context, guards);
    if (c.ruleId === 'OUT-02') requireGate(valuesFor(context, 'oop.direction').every(d => d === 'none'), 'ENGINE_GATE_UNMET');
  } else if (c.ruleId === 'MEN-02') {
    requireGate(equal(data.categories, valuesFor(context, 'iep.frequency')) && validMeasurement(data.categories, 'iep.frequency'));
    branch = data.observation; requireGate(['same_category_repeated', 'category_decreased'].includes(branch), 'UNKNOWN_VARIANT');
  } else if (c.ruleId === 'EMO-01') {
    const category = gateEmotion(context, guards, false);
    requireGate(data.category === category && data.otherCategory === (category === 9) &&
      equal(conditionAt(context, 'same_uniquely_mapped_emotion_category').observed,
        guards.map(i => frozenEngine.mapEmotion(cycleField(source, i, 'iep.emotion')))));
    branch = category === 9 ? 'other' : 'known_non_other';
  } else if (c.ruleId === 'CTX-02') {
    requireGate(surface === 'SECONDARY' && c.secondaryOnly === true &&
      conditionAt(context, 'recorded_external_text_present').observed === true &&
      nonblank(evidenceAt(context, indices[0], 'oop.external').rawValue) &&
      data.literalRecord === cycleField(source, indices[0], 'oop.external') && data.semanticClassification === 'unavailable', 'ENGINE_GATE_UNMET');
  } else if (c.ruleId === 'REV-01') {
    const keys = revisionAt(context, indices[0]);
    requireGate(equal(data.selectedDimensions, keys) && data.beforeValues === 'unavailable' &&
      equal(conditionAt(context, 'latest_explicit_valid_revision').observed.selectedDimensions, keys));
  } else if (c.ruleId === 'REV-02') {
    requireGate(count(data.eventCount) && data.eventCount === indices.length && data.eventCount >= 3 &&
      exactKeys(data.dimensionCounts, D) && conditionAt(context, 'minimum_revision_events').observed === data.eventCount);
    const events = indices.map(i => revisionAt(context, i)), eventMeasure = measureAt(context, 'revision_event_count');
    requireGate(eventMeasure.value === data.eventCount && equal(eventMeasure.inputPaths, indices.flatMap(i =>
      [`intent.cycles[${i}].intentional`, `intent.cycles[${i}].revision`])));
    for (const d of D) {
      const m = measureAt(context, `revision_selection_count:${d}`), n = data.dimensionCounts[d];
      requireGate(count(n) && n <= data.eventCount && n === events.filter(keys => keys.includes(d)).length && m.value === n &&
        equal(m.inputPaths, indices.map(i => `intent.cycles[${i}].revision`)));
    }
  } else if (['REL-01', 'REL-02', 'REL-03', 'CTX-01'].includes(c.ruleId)) {
    validateOutcome(context, guards);
    validateSeriesMetadata(context, 'iep.practical', data.practical);
    validateSeriesMetadata(context, 'oop.achievement', data.achievement);
    if (c.ruleId === 'REL-03') {
      metric = data.internalSource; const i = I.find(i => i[0] === metric);
      requireGate(i !== undefined, 'UNKNOWN_VARIANT'); validateSeriesMetadata(context, i[1], data.internalValues);
      const internal = conditionAt(context, 'internal_rating_changed').observed;
      requireGate(internal.branch === metric);
      if (metric === 'emotionIntensity') { gateEmotion(context, guards, true); requireGate(internal.sameKnownNonOtherEmotion === true, 'ENGINE_GATE_UNMET'); }
    }
    if (c.ruleId === 'REL-01') requireGate(valuesFor(context, 'oop.direction').every(d => d === 'none'), 'ENGINE_GATE_UNMET');
  } else if (c.ruleId === 'MIX-01') {
    requireGate(c.status === 'MIXED' && context.engine.status === 'MIXED' && Array.isArray(data.triggers) && data.triggers.length > 0 &&
      data.triggers.every(t => ['decision_patch_conflict', 'direction_mixed', 'achievement_direction_opposed',
        'flat_achievement_direction_varied', 'practical_hours_opposed'].includes(t)) &&
      equal(conditionAt(context, 'mixed_signal_present').observed, data.triggers));
    const evaluations = c.ruleEvaluation.triggerEvaluations;
    requireGate(Array.isArray(evaluations) && equal(evaluations.map(v => v.name),
      ['decision_patch_conflict', 'direction_mixed', 'achievement_direction_opposed', 'flat_achievement_direction_varied', 'practical_hours_opposed']) &&
      evaluations.every(v => v.passed === data.triggers.includes(v.name) && v.inputPaths.every(p => c.evidence.some(e => e.path === p))));
    branch = data.triggers.includes('decision_patch_conflict') ? 'decision_patch_conflict' :
      data.triggers.includes('practical_hours_opposed') ? 'practical_hours_opposed' : 'recorded_direction';
    if (surface === 'PRIMARY') requireGate(equal(c.nextFocus.variablePaths, branch === 'decision_patch_conflict' ?
      ['C.intentional', 'C.revision'] : branch === 'practical_hours_opposed' ? ['C.iep.practical'] : ['C.oop.direction']));
  }
  const mapping = uniqueOne(MAPPINGS.filter(m => m.selector.ruleId === c.ruleId && m.selector.candidateId === c.candidateId &&
    m.selector.metric === metric && m.selector.dimension === dimension && m.selector.branch === branch && m.selector.variant === variant && m.allowedSurfaces.includes(surface)));
  requireGate(mapping !== null, 'UNKNOWN_VARIANT');
  requireGate(c.titleKey === mapping.selector.key && c.interpretation.key === `analysis.${c.ruleId}.recordedObservation`, 'UNMAPPED_ENGINE_KEY');
  requireGate(c.ruleEvaluation.metric === (['CMP-01', 'CMP-02'].includes(c.ruleId) ? metric : null), 'UNKNOWN_VARIANT');
  if (surface === 'PRIMARY' && c.ruleId !== 'REF-01') requireGate(c.nextFocus.promptKey === FOCUS_KEYS[c.ruleId] &&
    c.nextFocus.kind === (['QUAL-01', 'MIX-01'].includes(c.ruleId) ? 'clarify' : 'observe'), 'UNKNOWN_VARIANT');
  context.mapping = mapping;
  context.guards = guards;
  context.insightEntry = c.ruleId === 'REF-01' ? entryByRow(variant === 'CURRENT_KNOWN_CATEGORY' ? 'E03' : 'E02') :
    c.ruleId === 'EMO-01' ? entryByRow(branch === 'other' ? 'E15' : 'E14') :
    TEMPLATE_REGISTRY.find(e => e.role === 'INSIGHT' && RULE_BY_ROW[e.row] === c.ruleId);
  requireGate(context.insightEntry !== undefined, 'UNMAPPED_ENGINE_KEY');
  return context;
}

function resolveBinding(context, def) {
  const { mapping, indices, data } = context, metric = mapping.selector.metric;
  const selector = def.selector === null ? def.selectorByMetric[metric] : def.selector;
  requireGate(SELECTOR_TABLE.includes(selector), 'INVALID_BINDING');
  const u = U.find(u => u[0] === metric), internal = I.find(i => i[0] === metric);
  let value, refs = [];
  if (selector === 'U.metricLabel' || selector === 'U.units' || selector === 'U.scope') {
    requireGate(u !== undefined, 'UNKNOWN_VARIANT');
    value = selector === 'U.metricLabel' ? u[2] : selector === 'U.units' ? u[3] : u[4];
  } else if (selector === 'I.metricLabel') {
    requireGate(internal !== undefined, 'UNKNOWN_VARIANT'); value = internal[2];
  } else if (selector === 'FIXED_FIELDS') value = mapping.fixedFields;
  else if (selector === 'SELECTED_RULE') value = mapping.selector.ruleId;
  else if (selector === 'ENGINE_ORDINAL') {
    refs = sourceRefs(context, ['iep.frequency']);
    value = ({ higher_category: 'increased', lower_category: 'decreased', same_category: 'unchanged' })[data.change];
  } else if (selector === 'ENGINE_EMOTION_CURRENT' || selector === 'ENGINE_EMOTION_RECURRENT') {
    refs = sourceRefs(context, ['iep.emotion']);
    value = gateEmotion(context, indices, selector === 'ENGINE_EMOTION_RECURRENT');
  } else if (selector === 'ENGINE_DIMENSIONS') {
    refs = [...sourceRefs(context, D.map(d => `cie.${d}`), [indices.at(-1)]), ...D.map(d => ({ path: risEvidence(context, d).path }))];
    value = data.currentReferenceDifferences.slice();
  } else if (selector === 'ENGINE_DIMENSION') {
    refs = [...sourceRefs(context, [`cie.${mapping.selector.dimension}`]), { path: risEvidence(context, mapping.selector.dimension).path }];
    value = data.dimension;
  } else if (selector === 'REVISION_KEYS' || selector === 'REVISION_EVENT_COUNT' || selector === 'REVISION_KEY_COUNTS') {
    refs = sourceRefs(context, ['intentional', 'revision']);
    value = selector === 'REVISION_KEYS' ? data.selectedDimensions.slice() :
      selector === 'REVISION_EVENT_COUNT' ? data.eventCount : data.dimensionCounts[def.dimension];
  } else {
    // The schema, never caller text, selects an already enumerated field/reader.
    const field = def.field || (context.c.ruleId === 'CMP-01' ? u?.[1] : internal?.[1]);
    requireGate(Object.hasOwn(LEAF_READERS, field), 'INVALID_BINDING');
    refs = sourceRefs(context, [field]);
    if (selector === `CURRENT(${field})`) { requireGate(indices.length === 1); value = valuesFor(context, field)[0]; }
    else if (selector === `PAIR(${field})`) { requireGate(indices.length === 2); value = valuesFor(context, field)[def.pairIndex]; }
    else if (selector === `ENGINE_DELTA(${field})`) value = context.comparison?.delta;
    else if (selector === `SERIES(${field})`) {
      value = field === 'oop.evidence' ? indices.map(i => {
        const ev = evidenceAt(context, i, field);
        requireGate(Array.isArray(ev.derivedValue?.selectedSet), 'INVALID_BINDING');
        return ev.derivedValue.selectedSet.slice();
      }) : valuesFor(context, field);
    } else reject('INVALID_BINDING');
  }
  requireGate(validBindingValue(def, value, context), 'INVALID_BINDING');
  return { selector, sourceRefs: refs, value };
}
function validBindingValue(def, value, context) {
  const metric = context.mapping.selector.metric, type = def.typeByMetric ? def.typeByMetric[metric] : def.type;
  if (type === 'rating' || type === 'hours') return bounded(value, type === 'hours' ? 168 : 10);
  if (type === 'ratingList' || type === 'hoursList') return Array.isArray(value) && value.length === context.indices.length &&
    value.every(v => bounded(v, type === 'hoursList' ? 168 : 10));
  if (type === 'delta') return typeof value === 'number' && Number.isFinite(value) &&
    value >= def.rangeByMetric[metric][0] && value <= def.rangeByMetric[metric][1];
  if (type === 'frequency' || type === 'direction') return (type === 'frequency' ? FREQUENCIES : DIRECTIONS).includes(value);
  if (type === 'frequencyList' || type === 'directionList') return Array.isArray(value) && value.length === context.indices.length &&
    value.every(v => (type === 'frequencyList' ? FREQUENCIES : DIRECTIONS).includes(v));
  if (type === 'basisList') return Array.isArray(value) && value.length === context.indices.length &&
    value.every(group => Array.isArray(group) && group.every(b => BASES.includes(b)) && new Set(group).size === group.length);
  if (type === 'emotionIndex') return Number.isInteger(value) && bounded(value, 9) &&
    (context.c.ruleId !== 'EMO-01' || value !== 9);
  if (type === 'dimension') return value === context.mapping.selector.dimension && D.includes(value);
  if (type === 'dimensions') return orderedDimensions(value);
  if (type === 'count') return count(value) && value <= context.indices.length;
  if (type === 'ordinalChange') return ['increased', 'decreased', 'unchanged'].includes(value);
  if (type === 'ruleId') return value === context.mapping.selector.ruleId && value !== 'COND-01';
  if (type === 'fieldNames') return value === context.mapping.fixedFields;
  if (['metricLabel', 'units', 'scope'].includes(type)) {
    const u = U.find(u => u[0] === metric), i = I.find(i => i[0] === metric);
    return value === (def.selector === 'I.metricLabel' ? i?.[2] : type === 'metricLabel' ? u?.[2] : type === 'units' ? u?.[3] : u?.[4]);
  }
  return false;
}

function expectedEntry(context, slot) {
  if (slot.endsWith('.insight')) return context.insightEntry;
  if (slot.endsWith('.why.values')) return entryByRow('E27');
  if (slot.endsWith('.why.selection')) return entryByRow('E28');
  if (slot.endsWith('.why.limitations')) return entryByRow('E29');
  return null;
}
function approvedComponent(request, bindings) {
  return { componentId: request.componentId, surface: request.surface, role: request.role, slot: request.slot,
    templateId: request.templateId, templateVersion: request.templateVersion, bindings };
}
function evaluateComponent(request, contexts, manifest, engine) {
  requireGate(exactKeys(request, ['componentId', 'surface', 'role', 'slot', 'templateId', 'templateVersion',
    'ruleId', 'candidateId', 'engineSelector', 'bindings']), 'INVALID_MANIFEST');
  // No focus entry exists. An old prompt/kind/optional flag is never authority.
  if (request.role === 'NEXT_FOCUS' || request.slot === 'primary.nextFocus') reject('UNMAPPED_ENGINE_KEY');
  const entry = TEMPLATE_REGISTRY.find(e => e.templateId === request.templateId);
  requireGate(entry !== undefined, 'UNKNOWN_TEMPLATE');
  return evaluateTrustedComponent(request, contexts, manifest, engine, entry);
}
// Shared component kernel. Its entry/manifest are trusted, immutable local
// definitions, never public API parameters. Private synthetic tests can exercise
// a fixed retrospective fixture without registering a product Next Focus.
function evaluateTrustedComponent(request, contexts, manifest, engine, entry) {
  requireGate(exactKeys(request, ['componentId', 'surface', 'role', 'slot', 'templateId', 'templateVersion',
    'ruleId', 'candidateId', 'engineSelector', 'bindings']), 'INVALID_MANIFEST');
  requireGate(request.templateId === entry.templateId, 'UNKNOWN_TEMPLATE');
  requireGate(request.templateVersion === entry.templateVersion, 'UNKNOWN_VERSION');
  if (entry.safetyClassification === 'HOLD' || FORBIDDEN_FUNCTIONS.includes(entry.allowedPresentationFunction)) reject('FORBIDDEN_FUNCTION');
  requireGate(entry.safetyClassification === 'ALLOW', 'UNKNOWN_TEMPLATE');
  requireGate(manifest !== null && manifest.slots.includes(request.slot) && request.componentId === request.slot &&
    entry.manifestMembership.some(m => m.manifestId === manifest.manifestId && m.slot === request.slot), 'INVALID_MANIFEST');
  requireGate(entry.role === request.role && entry.allowedSurfaces.includes(request.surface), 'UNMAPPED_ENGINE_KEY');
  let context;
  if (request.slot === 'primary.why.capability') {
    requireGate(entry.row === 'E30' && request.surface === 'PRIMARY' && request.role === 'WHY' &&
      request.ruleId === null && request.candidateId === null && equal(request.engineSelector, CAPABILITY_SELECTOR), 'UNMAPPED_ENGINE_KEY');
    requireGate(exactKeys(engine.capabilities?.VAQUQA, ['ruleId', 'status', 'conditionSufficiency']) &&
      engine.capabilities.VAQUQA.ruleId === 'COND-01' && engine.capabilities.VAQUQA.status === 'capability_gap' &&
      engine.capabilities.VAQUQA.conditionSufficiency === 'unavailable', 'ENGINE_GATE_UNMET');
    requireGate(Array.isArray(request.bindings) && request.bindings.length === 0, 'INVALID_BINDING');
    return approvedComponent(request, {});
  }
  context = request.surface === 'PRIMARY' ? contexts.PRIMARY : request.surface === 'SECONDARY' ? contexts.SECONDARY : null;
  requireGate(context !== null && context !== undefined, 'ENGINE_GATE_UNMET');
  if (context.error) reject(context.error);
  requireGate(request.ruleId === context.c.ruleId && request.candidateId === context.c.candidateId &&
    request.engineSelector?.key === context.mapping.selector.key, 'UNMAPPED_ENGINE_KEY');
  requireGate(equal(request.engineSelector, context.mapping.selector) &&
    entry.engineMappings.some(m => equal(m.selector, request.engineSelector) && m.allowedSurfaces.includes(request.surface)), 'UNKNOWN_VARIANT');
  if (request.role === 'NEXT_FOCUS') requireGate(request.surface === 'PRIMARY' &&
    ['OBSERVE', 'REVIEW', 'COMPARE', 'CLARIFY', 'RECORD'].includes(entry.allowedPresentationFunction), 'UNMAPPED_ENGINE_KEY');
  else requireGate(expectedEntry(context, request.slot)?.templateId === request.templateId, 'UNKNOWN_VARIANT');
  requireGate(Array.isArray(request.bindings) && request.bindings.length === entry.allowedBindings.length &&
    new Set(request.bindings.map(b => b.name)).size === entry.allowedBindings.length, 'INVALID_BINDING');
  const bindings = {};
  for (const def of entry.allowedBindings) {
    const ref = uniqueOne(request.bindings.filter(b => b.name === def.name));
    requireGate(ref !== null && exactKeys(ref, ['name', 'selector', 'sourceRefs']) && Array.isArray(ref.sourceRefs), 'INVALID_BINDING');
    const resolved = resolveBinding(context, def);
    requireGate(ref.selector === resolved.selector, 'INVALID_BINDING');
    requireGate(equal(ref.sourceRefs, resolved.sourceRefs), 'INVALID_PROVENANCE');
    bindings[def.name] = resolved.value;
  }
  return approvedComponent(request, bindings);
}

function safeComponentIdentity(request) {
  const templateId = ownData(request, 'templateId'), componentId = ownData(request, 'componentId'),
    surface = ownData(request, 'surface'), role = ownData(request, 'role'), version = ownData(request, 'templateVersion');
  return { componentId: KNOWN_SLOTS.includes(componentId) ? componentId : null,
    surface: ['PRIMARY', 'SECONDARY', 'FALLBACK'].includes(surface) ? surface : null,
    role: ['INSIGHT', 'INTERPRETATION', 'WHY', 'NEXT_FOCUS', 'FALLBACK'].includes(role) ? role : null,
    templateId: TEMPLATE_REGISTRY.some(e => e.templateId === templateId) ? templateId : null,
    templateVersion: Number.isSafeInteger(version) && version > 0 ? version : null };
}
function failureCode(error) { return REASONS.includes(ownData(error, 'code')) ? ownData(error, 'code') : 'BOUNDARY_ERROR'; }
function fallbackPresentation() {
  return { dtoVersion: 'safety-presentation-v1', mode: 'FALLBACK_ONLY', primary: null, secondary: null,
    fallback: { templateId: FALLBACK_ID, templateVersion: 1, role: 'FALLBACK', bindings: {} } };
}
function bundlePresentation(components) {
  const makeSurface = surface => {
    const selected = components.filter(c => c.surface === surface);
    if (selected.length === 0) return null;
    const result = { insight: selected.find(c => c.role === 'INSIGHT'), interpretation: null, why: selected.filter(c => c.role === 'WHY') };
    if (surface === 'PRIMARY') result.nextFocus = null;
    return result;
  };
  return { dtoVersion: 'safety-presentation-v1', mode: 'APPROVED_BUNDLE', primary: makeSurface('PRIMARY'),
    secondary: makeSurface('SECONDARY'), fallback: null };
}
function outputResult(verdict, registryAvailable, engineStatus, engineReleaseStatus, results, reasons, approved) {
  const fallback = verdict !== 'ALLOW';
  return { safetyVersion: SAFETY_VERSION, registryVersion: registryAvailable ? REGISTRY_VERSION : null, verdict,
    objectiveMeaning: 'UNKNOWN', causality: 'not_determined', engineReference: { ...ENGINE_REFERENCE },
    engineStatus, engineReleaseStatus, componentResults: results, bundleReasonCodes: reasonOrder(reasons),
    presentation: fallback ? fallbackPresentation() : bundlePresentation(approved), fallbackVerdict: fallback ? 'ALLOW' : null, persisted: false };
}

/** Frozen public API. The plan must supply the exact registered tuple object
 * from engineMappings[].selector, and every binding's entire verified reference
 * set. E30 has null ruleId/candidateId and the fixed capability selector. No body,
 * locale, registry override, supplied binding value, or approval flag is accepted.
 */
function assessPresentation(input) {
  const bundleReasons = [], componentResults = [], approved = [], holds = [];
  let requests = [], source, engine, plan, registryAvailable = false, engineStatus = null, engineReleaseStatus = null;
  let contexts = {}, manifest = null, dataValid = false;
  try {
    source = ownData(input, 'sourceSnapshot'); engine = ownData(input, 'engineResult'); plan = ownData(input, 'presentationPlan');
    if (trustedUpstreamHold(engine)) holds.push('UPSTREAM_HOLD');
    const components = ownData(plan, 'components');
    if (Array.isArray(components)) {
      requests = Array.from({ length: components.length }, (_, i) => ownData(components, String(i)));
      for (const request of requests) holds.push(...structuralHolds(request), ...trustedEntryReasons(request));
    }
    registryAvailable = registryValid();
    if (!registryAvailable) bundleReasons.push('REGISTRY_UNAVAILABLE');
    dataValid = exactKeys(input, ['sourceSnapshot', 'engineResult', 'presentationPlan']) &&
      plainData(source) && plainData(engine) && plainData(plan);
    if (!dataValid) bundleReasons.push('INVALID_SOURCE');
    if (dataValid) {
      if (engineContract(engine, source)) { engineStatus = engine.status; engineReleaseStatus = engine.safety.releaseStatus; }
      try { validateSource(source, engine); } catch (error) { dataValid = false; bundleReasons.push(failureCode(error)); }
    }
    if (dataValid && registryAvailable) {
      if (engine.primary === null) bundleReasons.push('EMPTY_ANALYTICAL_PLAN');
      else {
        const cap = engine.capabilities?.VAQUQA;
        // The frozen engine has no legitimate absent-capability analytic state.
        // MF1/MF2 are retained as exact catalog contracts but cannot be selected.
        if (!exactKeys(cap, ['ruleId', 'status', 'conditionSufficiency']) || cap.ruleId !== 'COND-01' ||
          cap.status !== 'capability_gap' || cap.conditionSufficiency !== 'unavailable') bundleReasons.push('ENGINE_GATE_UNMET');
        else manifest = MANIFESTS[engine.secondary === null ? 3 : 4];
        for (const surface of ['PRIMARY', 'SECONDARY']) {
          if (surface === 'SECONDARY' && engine.secondary === null) continue;
          try { contexts[surface] = selectMapping(candidateContext(source, engine, surface)); }
          catch (error) { contexts[surface] = { error: failureCode(error) }; bundleReasons.push(failureCode(error)); }
        }
        if (engine.secondary !== null && engine.secondary?.candidateId === engine.primary?.candidateId) bundleReasons.push('INVALID_PROVENANCE');
      }
      if (!exactKeys(plan, ['policyVersion', 'registryVersion', 'manifestId', 'manifestVersion', 'components', 'declaredAbsentSlots'])) bundleReasons.push('INVALID_MANIFEST');
      if (plan.policyVersion !== SAFETY_VERSION || plan.registryVersion !== REGISTRY_VERSION) bundleReasons.push('POLICY_VERSION_MISMATCH');
      if (plan.manifestVersion !== 1) bundleReasons.push('UNKNOWN_VERSION');
      if (requests.length === 0) bundleReasons.push('EMPTY_ANALYTICAL_PLAN');
      if (manifest === null || plan.manifestId !== manifest.manifestId || !Array.isArray(plan.components) ||
          !equal(plan.components.map(c => c?.slot), manifest.slots) ||
          !equal(plan.declaredAbsentSlots, manifest.declaredAbsentSlots) ||
          new Set(plan.components.map(c => c?.componentId)).size !== plan.components.length) bundleReasons.push('INVALID_MANIFEST');
    }
    for (const request of requests) {
      const result = safeComponentIdentity(request), componentReasons = reasonOrder([...structuralHolds(request), ...trustedEntryReasons(request)]);
      let component = null;
      if (componentReasons.length === 0) {
        if (!dataValid) componentReasons.push('INVALID_SOURCE');
        else if (!registryAvailable) componentReasons.push('REGISTRY_UNAVAILABLE');
        else {
          try { component = evaluateComponent(request, contexts, manifest, engine); }
          catch (error) { componentReasons.push(failureCode(error)); }
        }
      }
      const hold = componentReasons.some(r => ['FORBIDDEN_FUNCTION', 'FORBIDDEN_ROLE', 'FORBIDDEN_BINDING', 'FORBIDDEN_RULE_NEXT_FOCUS'].includes(r));
      result.verdict = hold ? 'HOLD' : componentReasons.length ? 'UNKNOWN' : 'ALLOW';
      result.reasonCodes = result.verdict === 'ALLOW' ? ['REGISTERED_PRESENTATION'] : reasonOrder(componentReasons);
      componentResults.push(result);
      if (component) approved.push(component);
      if (result.verdict !== 'ALLOW') bundleReasons.push(...result.reasonCodes);
    }
  } catch (error) {
    bundleReasons.push('BOUNDARY_ERROR');
  }
  bundleReasons.push(...holds);
  if (!requests.length && !bundleReasons.includes('EMPTY_ANALYTICAL_PLAN')) bundleReasons.push('EMPTY_ANALYTICAL_PLAN');
  const verdict = holds.length || componentResults.some(r => r.verdict === 'HOLD') ? 'HOLD' :
    bundleReasons.length || !manifest || componentResults.length !== manifest.slots.length || componentResults.some(r => r.verdict !== 'ALLOW') ? 'UNKNOWN' : 'ALLOW';
  if (verdict === 'ALLOW') bundleReasons.push('REGISTERED_PRESENTATION');
  return outputResult(verdict, registryAvailable, engineStatus, engineReleaseStatus, componentResults, bundleReasons, approved);
}

module.exports = { SAFETY_VERSION, REGISTRY_VERSION, TEMPLATE_REGISTRY, assessPresentation };
