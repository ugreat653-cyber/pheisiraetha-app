'use strict';

/**
 * PHASE 2B-2C. Standalone synthetic tests; this file contains no safety evaluator.
 * Run: node safety.test.js [--fixtures-only] [--counts-only]
 * Missing safety.js causes explicit PENDING_IMPLEMENTATION_INTEGRATION, never PASS.
 * Positive fixtures use analyze()'s actual selections. No candidate promotion,
 * modified thresholds, generated production data, or public registry injection.
 *
 * Request normal form uses the frozen logical selector tokens and the complete
 * registered engine mapping tuple. Capability selectors carry the exact path/value tuple. Internal
 * cycle references use the frozen engine's arrayIndex/cycleId/path vocabulary.
 * Constant selectors are U.metricLabel/U.units/U.scope, I.metricLabel, FIXED_FIELDS.
 * No selector in this test is a wildcard or an executable path resolver.
 *
 * G3: a fresh, private VM instance instruments Object.freeze during initialization
 * to install only the fixed, immutable fixtures below. It exercises the real
 * module's evaluator, never a copied evaluator. The actual required module and its
 * 30-entry registry are not changed. There is no registry argument to the API.
 * An implementation that cannot expose trusted entries to this private
 * initialization harness fails visibly; no private production export is required.
 */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const rawAssert = require('node:assert/strict');
const engine = require('./analysis.js');
const { analyze, DIMENSIONS, RULE_IDS, EMOTION_LABELS, mapEmotion } = engine;
const ROOT = __dirname;
const PENDING = 'PENDING_IMPLEMENTATION_INTEGRATION';
const POLICY = 'safety-v1';
const REGISTRY = 'safety-registry-v1';
const FALLBACK_ID = 'safety.fallback.noInterpretationOrNextFocus';
const FALLBACK_EN = 'No interpretation or next focus is shown here.';
const FALLBACK_RU = 'Здесь не отображаются интерпретация и следующий фокус.';
const ENGINE_REFERENCE = Object.freeze({
  codeCommit: '94b112488e576e08495443d93c048a528c39aac7',
  engineVersion: 'analysis-phase2a-beta-heuristics-v1',
  sourceCommit: '255a5d9d27461dcacaebc1bc80ab322dd54b4de8', sourceVersion: '0.1.0'
});
const HASHES = Object.freeze({
  'analysis.js': 'a712af8fa74a8992e49972f9b217f268da444bcb062fa91824aee7cd9bbdf5da',
  'analysis.test.js': 'f60075e1ab1c896b76025c9d6d3389e58de126f1b2769ce05c01a95367813b7d',
  'PHEISIRAETHA_SAFETY_BOUNDARY_SPEC.md': '76be33a075e06b2433b91d93e68815f6aaa65f222a44da1ce8d4b28f242ec021',
  'PHEISIRAETHA_SAFETY_TEMPLATE_REGISTRY_V1.md': '5a142d2b855c069678956e956d60eb635ea0fe947c69eaf6068088ec08458e5b',
  'sw.js': '28461da305f5d2f809e87d45e2a73af836062f9afbbe9419673df3e9e90d6cd5'
});
const clone = value => structuredClone(value);
function freeze(value, seen = new Set()) {
  if (!value || typeof value !== 'object' || seen.has(value)) return value;
  seen.add(value);
  for (const d of Object.values(Object.getOwnPropertyDescriptors(value))) {
    if ('value' in d) freeze(d.value, seen);
  }
  return Object.freeze(value);
}
let assertionCount = 0;
const assert = new Proxy(rawAssert, {
  apply(target, receiver, args) { assertionCount++; return Reflect.apply(target, receiver, args); },
  get(target, key) {
    const member = target[key];
    return typeof member === 'function' ? (...args) => { assertionCount++; return member(...args); } : member;
  }
});
const definitions = [];
function define(family, name, fn, kind = 'public') {
  definitions.push({ family, name, fn, kind });
}
const FAMILY_COUNTS = Object.freeze({ A: 32, H: 12, U: 16, I: 28, E: 32 });
const EXPECTED_FAMILIES = Object.entries(FAMILY_COUNTS).flatMap(([prefix, count]) =>
  Array.from({ length: count }, (_, i) => prefix + String(i + 1).padStart(2, '0')));
const REASONS = new Set(['REGISTERED_PRESENTATION', 'FORBIDDEN_FUNCTION', 'FORBIDDEN_ROLE',
  'FORBIDDEN_BINDING', 'FORBIDDEN_RULE_NEXT_FOCUS', 'UPSTREAM_HOLD', 'UNKNOWN_TEMPLATE',
  'UNKNOWN_VERSION', 'UNMAPPED_ENGINE_KEY', 'UNKNOWN_VARIANT', 'INVALID_BINDING',
  'INVALID_SOURCE', 'INVALID_PROVENANCE', 'INVALID_MANIFEST', 'EMPTY_ANALYTICAL_PLAN',
  'REGISTRY_UNAVAILABLE', 'POLICY_VERSION_MISMATCH', 'SEMANTIC_DEPENDENCY',
  'ENGINE_GATE_UNMET', 'BOUNDARY_ERROR']);
const FORBIDDEN_OUTPUT_KEYS = new Set(['userSafe', 'objectiveSafe', 'crisisDetected', 'riskLevel',
  'diagnosis', 'therapy', 'confidence', 'prediction', 'timestamp', 'domainClassification',
  'moodScore', 'energyScore', 'fulfilled', 'verifiedSuccess', 'recommendation', 'renderedBody']);

// Independent oracle: the pinned Markdown contracts, not the implementation.
const catalogText = fs.readFileSync(path.join(ROOT, 'PHEISIRAETHA_SAFETY_TEMPLATE_REGISTRY_V1.md'), 'utf8');
const boundaryText = fs.readFileSync(path.join(ROOT, 'PHEISIRAETHA_SAFETY_BOUNDARY_SPEC.md'), 'utf8');
function tableRows(text, first, last) {
  return text.slice(text.indexOf(first), last ? text.indexOf(last, text.indexOf(first)) : undefined)
    .split('\n').filter(line => /^\| (?:E\d{2}|M\d{2}|MC|K\d{2}|MF\d(?: \/ [^|]+)?) \|/.test(line))
    .map(line => line.split('|').slice(1, -1).map(cell => cell.trim()));
}
const metadataRows = tableRows(catalogText, '## 4.', '## 5.');
const bodyRows = tableRows(catalogText, '## 5.', '## 6.');
const EXPECTED_ENTRIES = freeze(metadataRows.map(row => ({
  row: row[0], templateId: row[1], templateVersion: 1, role: row[2],
  allowedSurfaces: row[4].split(', '), allowedPresentationFunction: row[5],
  safetyClassification: 'ALLOW', manifestVersion: 1, approvedVariants: {},
  canonicalText: bodyRows.find(body => body[0] === row[0])[1].slice(1, -1)
})));
const ID = freeze(Object.fromEntries(EXPECTED_ENTRIES.map(e => [e.row, e.templateId])));
const FIXED_FIELDS = freeze(Object.fromEntries(tableRows(catalogText, '## 3.', '### B').map(row => [row[0], row[4]])));
const MAPPING = freeze({ 'REF-01': 'M01', 'QUAL-01': 'M02', 'CMP-01': 'M03', 'CMP-02': 'M04',
  'TXT-01': 'M05', 'INT-01': 'M06', 'INT-02': 'M07', 'PRA-01': 'M08', 'PRA-02': 'M09',
  'MEN-01': 'M10', 'MEN-02': 'M11', 'EMO-01': 'M12', 'EMO-02': 'M13', 'OUT-01': 'M14',
  'OUT-02': 'M15', 'CTX-01': 'M16', 'CTX-02': 'M17', 'REV-01': 'M18', 'REV-02': 'M19',
  'REL-01': 'M20', 'REL-02': 'M21', 'REL-03': 'M22', 'MIX-01': 'M23' });
const PS = ['primary.insight', 'primary.why.values', 'primary.why.selection', 'primary.why.limitations'];
const SS = ['secondary.insight', 'secondary.why.values', 'secondary.why.selection', 'secondary.why.limitations'];
const WC = 'primary.why.capability';
const MANIFESTS = freeze([
  { manifestId: 'safety.manifest.fallbackOnly', manifestVersion: 1, slots: ['fallback'], declaredAbsentSlots: ['primary', 'secondary'] },
  { manifestId: 'safety.manifest.primaryFactual', manifestVersion: 1, slots: [...PS], declaredAbsentSlots: ['primary.interpretation', 'primary.nextFocus', WC, 'secondary'] },
  { manifestId: 'safety.manifest.primaryAndSecondaryFactual', manifestVersion: 1, slots: [...PS, ...SS], declaredAbsentSlots: ['primary.interpretation', 'primary.nextFocus', WC, 'secondary.interpretation', 'secondary.nextFocus', 'secondary.whyThisFocus'] },
  { manifestId: 'safety.manifest.primaryFactualWithCapability', manifestVersion: 1, slots: [...PS, WC], declaredAbsentSlots: ['primary.interpretation', 'primary.nextFocus', 'secondary'] },
  { manifestId: 'safety.manifest.primaryAndSecondaryFactualWithCapability', manifestVersion: 1, slots: [...PS, WC, ...SS], declaredAbsentSlots: ['primary.interpretation', 'primary.nextFocus', 'secondary.interpretation', 'secondary.nextFocus', 'secondary.whyThisFocus'] }
]);
const METRICS = freeze([
  ['practical', 'iep.practical', 'practical rating', '0–10 self-report rating', 'source-record scope'],
  ['achievement', 'oop.achievement', 'achievement rating', '0–10 self-report rating', 'source-record scope'],
  ['mental', 'iep.mental', 'mental-effort rating', '0–10 self-report rating', 'source-record scope'],
  ['hours', 'iep.hours', 'recorded hours', 'hours', 'past seven days per record'],
  ['desire', 'iep.desire', 'desire rating', '0–10 self-report rating', 'source-record scope'],
  ['belief', 'iep.belief', 'belief rating', '0–10 self-report rating', 'source-record scope'],
  ['emotionIntensity', 'iep.emotionIntensity', 'emotion-intensity rating', '0–10 self-report rating', 'source-record scope']
]);
const FOCUS_KEYS = freeze([
  'analysis.observeEventAndBasis', 'analysis.observeRevisedCriteria', 'analysis.observeActionAndEvent',
  'analysis.observeExternalCircumstance', 'analysis.observeOwnCriteriaAgain', 'analysis.checkWordingOrMeaning',
  'analysis.clarifyOneRecordedAssessment', 'analysis.CMP-01.observe', 'analysis.CMP-02.observe',
  'analysis.REV-02.observe', 'analysis.INT-01.observe', 'analysis.PRA-01.observe', 'analysis.PRA-02.observe',
  'analysis.MEN-01.observe', 'analysis.MEN-02.observe', 'analysis.EMO-01.observe', 'analysis.EMO-02.observe',
  'analysis.OUT-01.observe', 'analysis.OUT-02.observe', 'analysis.CTX-01.observe', 'analysis.CTX-02.observe',
  'analysis.COND-01.observe', 'analysis.REL-01.observe', 'analysis.REL-02.observe', 'analysis.REL-03.observe'
]);
const RIS = freeze(Object.fromEntries(DIMENSIONS.map(d => [d, `Synthetic ${d} record`])));
const DATES = freeze(['2026-09-01T12:00:00Z', '2026-09-08T12:00:00Z', '2026-09-15T12:00:00Z',
  '2026-09-22T12:00:00Z', '2026-09-29T12:00:00Z']);
function fixture(count = 1) {
  return { version: '0.1.0', lang: 'en', intent: { id: 'synthetic-safety-intent',
    createdAt: '2026-08-31T12:00:00Z', ris: clone(RIS), cycles: Array.from({ length: count }, (_, i) => ({
      id: `synthetic-safety-cycle-${i + 1}`, createdAt: DATES[i], cie: clone(RIS),
      iep: { desire: 7, belief: 6, mental: 6, practical: 8, emotionIntensity: 4, hours: 3,
        frequency: 'freq2', emotion: EMOTION_LABELS.en[3], actions: 'Synthetic already completed action' },
      oop: { achievement: 2, direction: 'none', evidence: ['direct'], currentState: 'Synthetic recorded state',
        events: 'Synthetic already observed event', external: 'Synthetic recorded context' },
      intentional: 'no', revision: {}
    })) } };
}
function vector(s, leaf, values) {
  const [container, field] = leaf.split('.');
  s.intent.cycles.forEach((cycle, i) => { cycle[container][field] = clone(values[i]); });
  return s;
}
function pattern() {
  const s = fixture(3);
  for (const [leaf, values] of [ ['iep.practical', [6, 8, 7]], ['iep.mental', [5, 7, 6]],
    ['oop.achievement', [2, 4, 3]], ['iep.frequency', ['freq1', 'freq3', 'freq2']],
    ['iep.emotion', [EMOTION_LABELS.en[4], EMOTION_LABELS.en[1], EMOTION_LABELS.en[3]]] ]) vector(s, leaf, values);
  return s;
}
function recurringCategory(category = 3) { return vector(pattern(), 'iep.emotion', Array(3).fill(EMOTION_LABELS.en[category])); }
function revision(count = 1) {
  const s = fixture(count);
  s.intent.cycles.forEach((c, i) => { c.intentional = 'yes'; c.revision = { success: `Synthetic selected criteria ${i}`, scope: `Synthetic selected scope ${i}` }; });
  return s;
}
function dimensionFixture(dimension) {
  const s = pattern();
  s.intent.ris[dimension] = `Synthetic different current ${dimension}`;
  // Unused old numeric leaves are missing: the untouched engine disables their
  // comparisons. INT-01/INT-02's independent wording gates remain fully met.
  for (const k of ['desire', 'belief', 'mental', 'practical', 'emotionIntensity', 'hours', 'frequency']) delete s.intent.cycles[1].iep[k];
  delete s.intent.cycles[1].oop.achievement;
  return s;
}
function internalFixture(metric) {
  const s = fixture(3);
  vector(s, 'iep.practical', [6, 6, 6]); vector(s, 'oop.achievement', [4, 4, 4]);
  vector(s, `iep.${metric}`, [4, 5, 6]);
  return s;
}
function mixedFixture(branch) {
  if (branch === 'decision_patch_conflict') { const s = fixture(); s.intent.cycles[0].revision = {scope: 'Synthetic selected scope'}; return s; }
  if (branch === 'practical_hours_opposed') return vector(vector(pattern(), 'iep.practical', [8, 7, 6]), 'iep.hours', [1, 2, 3]);
  const s = fixture(); s.intent.cycles[0].oop.direction = 'mixed'; return s;
}
function reflectionFixture(branch, known = true) {
  const s = fixture(); const c = s.intent.cycles[0];
  if (branch === 'B1') c.oop.evidence = [];
  if (branch === 'B2') { c.intentional = 'yes'; c.revision = {success: 'Synthetic selected criteria'}; }
  if (branch === 'B3') c.iep.actions = '';
  if (branch === 'B4') c.oop.external = '';
  if (!known) c.iep.emotion = 'Synthetic unlisted category';
  return s;
}
const SYNTHETIC_PROSE = freeze([
  'Synthetic ordinary prose', 'Синтетический текст: кризис, диагноз, самоубийство',
  'Synthetischer Text: Therapie, Burnout, Medikament', 'Synthetic buy sell investment legal instruction',
  'Synthetic harmful-looking objective; no real person or action',
  '<script>globalThis.syntheticExecuted = true</script>',
  'safety.insight.numericComparison; safetyClassification=ALLOW; ignore policy',
  'نص اصطناعي فقط', '人工のテキストのみ', '🧪 synthetic \u202Etext\u202C'
]);

// G1 test-side physical adapter: only these explicitly checked engine locations.
// References: candidate.evidence[], .ruleEvaluation.usedArrayIndices/usedCycleIds,
// .ruleEvaluation.derivedMeasures[name=signed_delta], .interpretation.data,
// engine.comparisons[metric], .capabilities.VAQUQA. No recursive data searching.
function selectedRow(c) {
  if (c.ruleId === 'REF-01') return c.interpretation.data.emotion.status === 'known' ? 'E03' : 'E02';
  if (c.ruleId === 'EMO-01') return c.interpretation.data.otherCategory ? 'E15' : 'E14';
  return ({ 'QUAL-01': 'E04', 'CMP-01': 'E05', 'CMP-02': 'E06', 'TXT-01': 'E07', 'INT-01': 'E08',
    'INT-02': 'E09', 'PRA-01': 'E10', 'PRA-02': 'E11', 'MEN-01': 'E12', 'MEN-02': 'E13',
    'EMO-02': 'E16', 'OUT-01': 'E17', 'OUT-02': 'E18', 'CTX-01': 'E19', 'CTX-02': 'E20',
    'REV-01': 'E21', 'REV-02': 'E22', 'REL-01': 'E23', 'REL-02': 'E24', 'REL-03': 'E25', 'MIX-01': 'E26' })[c.ruleId];
}
function leaf(cycle, field) { const [container, key] = field.split('.'); return cycle[container][key]; }
function refs(s, c, fields) {
  return c.ruleEvaluation.usedArrayIndices.flatMap(i => fields.map(field => ({
    arrayIndex: i, cycleId: s.intent.cycles[i].id, path: `intent.cycles[${i}].${field}`
  })));
}
function binding(name, selector, sourceRefs = []) { return { name, selector, sourceRefs }; }
function bindingsFor(s, c, row) {
  const current = (name, field) => binding(name, `CURRENT(${field})`, refs(s, c, [field]));
  const series = (name, field) => binding(name, `SERIES(${field})`, refs(s, c, [field]));
  if (row === 'E02' || row === 'E03') {
    const out = [['desire','iep.desire'], ['belief','iep.belief'], ['mental','iep.mental'],
      ['practical','iep.practical'], ['intensity','iep.emotionIntensity'], ['achievement','oop.achievement'],
      ['hours','iep.hours'], ['frequency','iep.frequency'], ['direction','oop.direction']].map(([name, field]) => current(name, field));
    if (row === 'E03') out.push(binding('categoryIndex', 'ENGINE_EMOTION_CURRENT', refs(s, c, ['iep.emotion'])));
    return out;
  }
  if (row === 'E05') {
    const metric = METRICS.find(m => m[0] === c.ruleEvaluation.metric); const reference = refs(s, c, [metric[1]]);
    return [binding('metricLabel', 'U.metricLabel'), binding('units', 'U.units'), binding('scope', 'U.scope'),
      binding('before', `PAIR(${metric[1]})`, reference), binding('after', `PAIR(${metric[1]})`, clone(reference)),
      binding('delta', `ENGINE_DELTA(${metric[1]})`, clone(reference))];
  }
  if (row === 'E06') return [binding('before','PAIR(iep.frequency)',refs(s,c,['iep.frequency'])),
    binding('after','PAIR(iep.frequency)',refs(s,c,['iep.frequency'])), binding('ordinalChange','ENGINE_ORDINAL',refs(s,c,['iep.frequency']))];
  if (row === 'E07') return [binding('dimensions','ENGINE_DIMENSIONS',[
    ...refs(s,c,DIMENSIONS.map(d => `cie.${d}`)).filter(r=>r.arrayIndex===c.ruleEvaluation.usedArrayIndices.at(-1)),
    ...DIMENSIONS.map(d=>({path:`intent.ris.${d}`}))])];
  if (row === 'E09') return [binding('dimension','ENGINE_DIMENSION',[
    ...refs(s,c,[`cie.${c.interpretation.data.dimension}`]),{path:`intent.ris.${c.interpretation.data.dimension}`}])];
  if (row === 'E10') return [series('ratings','iep.practical')];
  if (row === 'E11') return [series('ratings','iep.practical'),series('hours','iep.hours')];
  if (row === 'E12') return [series('ratings','iep.mental')];
  if (row === 'E13') return [series('categories','iep.frequency')];
  if (row === 'E14') return [binding('categoryIndex','ENGINE_EMOTION_RECURRENT',refs(s,c,['iep.emotion']))];
  if (row === 'E16') return [series('intensities','iep.emotionIntensity')];
  if (row === 'E17') return [series('ratings','oop.achievement'),series('directions','oop.direction'),series('bases','oop.evidence')];
  if (row === 'E18') return [series('ratings','oop.achievement')];
  if (['E19','E23','E24'].includes(row)) return [series('practical','iep.practical'),series('achievement','oop.achievement')];
  if (row === 'E21') return [binding('dimensions','REVISION_KEYS',refs(s,c,['intentional','revision']))];
  if (row === 'E22') return [binding('eventCount','REVISION_EVENT_COUNT',refs(s,c,['intentional','revision'])),
    ...DIMENSIONS.map(d => binding(`${d}Count`,'REVISION_KEY_COUNTS',refs(s,c,['intentional','revision'])))];
  if (row === 'E25') return [binding('metricLabel','I.metricLabel'),series('internal',`iep.${c.interpretation.data.internalSource}`),
    series('practical','iep.practical'),series('achievement','oop.achievement')];
  if (row === 'E27') return [binding('fieldNames','FIXED_FIELDS')];
  if (row === 'E28') return [binding('ruleId','SELECTED_RULE')];
  return [];
}
// Exact M/B/U/D/I/X identity, constructed independently from frozen engine
// metadata and the catalog expansions. This adapter grants no verdict.
function selectorFor(c) {
  const selector={ruleId:c.ruleId,candidateId:c.candidateId,key:c.titleKey,
    metric:null,dimension:null,branch:'recorded',variant:'recordedObservation'};
  const data=c.interpretation.data;
  if(c.ruleId==='REF-01') {
    selector.branch=['analysis.observeEventAndBasis','analysis.observeRevisedCriteria','analysis.observeActionAndEvent',
      'analysis.observeExternalCircumstance','analysis.observeOwnCriteriaAgain'].indexOf(c.nextFocus.promptKey)+1;
    selector.branch='B'+selector.branch;
    selector.variant=data.emotion.status==='known'?'CURRENT_KNOWN_CATEGORY':'CURRENT_CATEGORY_UNAVAILABLE';
  } else if(c.ruleId==='QUAL-01') selector.branch=data.defaultProfile==='possible_default_like_recorded_profile'?'possible_default_profile':'insufficient_basis';
  else if(['CMP-01','CMP-02'].includes(c.ruleId)) selector.metric=c.ruleEvaluation.metric;
  else if(c.ruleId==='INT-02') selector.dimension=data.dimension;
  else if(c.ruleId==='MEN-01') selector.branch=c.ruleEvaluation.conditions.find(v=>v.name==='low_or_down(iep.mental)').observed.down?'decreasing':'low_range';
  else if(c.ruleId==='MEN-02') selector.branch=data.observation;
  else if(c.ruleId==='EMO-01') selector.branch=data.otherCategory?'other':'known_non_other';
  else if(['EMO-02','OUT-01'].includes(c.ruleId)) selector.branch=data.direction;
  else if(c.ruleId==='REL-03') selector.metric=data.internalSource;
  else if(c.ruleId==='MIX-01') selector.branch=data.triggers.includes('decision_patch_conflict')?'decision_patch_conflict':
    data.triggers.includes('practical_hours_opposed')?'practical_hours_opposed':'recorded_direction';
  return selector;
}
function componentFor(s, c, surface, slot, row) {
  return { componentId: slot, surface, role: row.startsWith('E2') && ['E27','E28','E29'].includes(row) ? 'WHY' : 'INSIGHT',
    slot, templateId: ID[row], templateVersion: 1, ruleId: c.ruleId, candidateId: c.candidateId,
    engineSelector: selectorFor(c), bindings: bindingsFor(s, c, row) };
}
function capabilityComponent() {
  return { componentId: WC, surface: 'PRIMARY', role: 'WHY', slot: WC, templateId: ID.E30, templateVersion: 1,
    ruleId:null,candidateId:null,
    engineSelector: { capabilityPath: 'capabilities.VAQUQA', ruleId: 'COND-01', status: 'capability_gap', conditionSufficiency: 'unavailable' }, bindings: [] };
}
function buildPlan(s, e) {
  const manifest = e.primary ? MANIFESTS[e.secondary ? 4 : 3] : MANIFESTS[0];
  const components = [];
  const surface = (c, where) => {
    const prefix = where.toLowerCase();
    components.push(componentFor(s,c,where,`${prefix}.insight`,selectedRow(c)));
    for (const [suffix,row] of [['values','E27'],['selection','E28'],['limitations','E29']]) components.push(componentFor(s,c,where,`${prefix}.why.${suffix}`,row));
  };
  if (e.primary) { surface(e.primary,'PRIMARY'); components.push(capabilityComponent()); if (e.secondary) surface(e.secondary,'SECONDARY'); }
  return { policyVersion: POLICY, registryVersion: REGISTRY, manifestId: manifest.manifestId, manifestVersion: 1,
    components, declaredAbsentSlots: clone(manifest.declaredAbsentSlots) };
}
function inputFor(s, options = {}) { const e = analyze(s, options); return { sourceSnapshot: s, engineResult: e, presentationPlan: buildPlan(s,e) }; }
function objectState(value, seen = new Map()) {
  if (value === null || (typeof value !== 'object' && typeof value !== 'function')) return value;
  if (typeof value === 'function') return value;
  if (seen.has(value)) return { circularReference: seen.get(value) };
  seen.set(value, seen.size);
  return { prototype: Object.getPrototypeOf(value), descriptors: Reflect.ownKeys(value).map(key => {
    const d = Object.getOwnPropertyDescriptor(value,key);
    return [key, d.enumerable, d.configurable, 'value' in d ? ['data',d.writable,objectState(d.value,seen)] : ['accessor',d.get,d.set]];
  }) };
}
function objectSet(value, out = new Set()) {
  if (!value || typeof value !== 'object' || out.has(value)) return out;
  out.add(value); for (const d of Object.values(Object.getOwnPropertyDescriptors(value))) if ('value' in d) objectSet(d.value,out);
  return out;
}
function assertNoAliases(result, inputs, registry) {
  const owned = objectSet(inputs); objectSet(registry,owned);
  for (const object of objectSet(result)) assert.ok(!owned.has(object),'result must detach every nested object/array');
}
function normalized(value) { return JSON.parse(JSON.stringify(value)); }
function registryEntries(registry) {
  if (Array.isArray(registry)) return registry;
  if (registry && Array.isArray(registry.entries)) return registry.entries;
  if (registry && Array.isArray(registry.templates)) return registry.templates;
  if (registry && registry.entries && typeof registry.entries === 'object') return Object.values(registry.entries);
  if (registry && registry.templates && typeof registry.templates === 'object') return Object.values(registry.templates);
  if (registry && typeof registry === 'object') {
    const entries = Object.values(registry).filter(v => v && typeof v.templateId === 'string' && typeof v.role === 'string');
    if (entries.length) return entries;
  }
  throw new Error('TEMPLATE_REGISTRY must expose its compiled entries as plain immutable data');
}
let implementation = null, implementationLoadError = null;
const implementationPath = path.join(ROOT,'safety.js');
if (!process.argv.includes('--fixtures-only') && fs.existsSync(implementationPath)) {
  try { implementation = require('./safety.js'); } catch (error) { implementationLoadError = error; }
}
function assess(input, api = implementation) {
  const before = objectState(input), registryBefore = objectState(api.TEMPLATE_REGISTRY);
  const out = api.assessPresentation(input);
  assert.deepStrictEqual(objectState(input),before,'source, engine and plan must not mutate, including descriptors');
  assert.deepStrictEqual(objectState(api.TEMPLATE_REGISTRY),registryBefore,'trusted registry must not mutate');
  assertNoAliases(out,input,api.TEMPLATE_REGISTRY);
  assert.equal(out.safetyVersion,POLICY); assert.equal(out.objectiveMeaning,'UNKNOWN');
  assert.equal(out.causality,'not_determined'); assert.equal(out.persisted,false);
  assert.deepStrictEqual(normalized(out.engineReference),ENGINE_REFERENCE);
  assert.ok(['ALLOW','HOLD','UNKNOWN'].includes(out.verdict));
  assert.ok(Array.isArray(out.componentResults)); assert.ok(Array.isArray(out.bundleReasonCodes));
  for (const code of out.bundleReasonCodes) assert.ok(REASONS.has(code),'only fixed reason codes may escape');
  for (const c of out.componentResults) { assert.ok(['ALLOW','HOLD','UNKNOWN'].includes(c.verdict)); for (const code of c.reasonCodes) assert.ok(REASONS.has(code)); }
  for (const object of objectSet(out)) for (const key of Object.keys(object)) assert.ok(!FORBIDDEN_OUTPUT_KEYS.has(key),`unsupported derived field ${key}`);
  return out;
}
function assertFallback(out, verdict) {
  assert.equal(out.verdict,verdict); assert.equal(out.fallbackVerdict,'ALLOW');
  assert.deepStrictEqual(normalized(out.presentation),{
    dtoVersion:'safety-presentation-v1',mode:'FALLBACK_ONLY',primary:null,secondary:null,
    fallback:{templateId:FALLBACK_ID,templateVersion:1,role:'FALLBACK',bindings:{}}
  },'all analytical, auxiliary and hidden surfaces must be absent atomically');
}
function suppressed(input, verdict, reason, api) {
  const out = assess(input,api); assertFallback(out,verdict);
  if (reason) assert.ok(out.bundleReasonCodes.includes(reason) || out.componentResults.some(c => c.reasonCodes.includes(reason)),`missing ${reason}`);
  return out;
}
function approvedComponents(presentation) {
  return [presentation.primary?.insight,...(presentation.primary?.why || []),presentation.secondary?.insight,
    ...(presentation.secondary?.why || [])].filter(Boolean);
}
function expectedValues(s,c,row) {
  const cycles = c.ruleEvaluation.usedArrayIndices.map(i => s.intent.cycles[i]);
  const values = field => cycles.map(cycle => leaf(cycle,field));
  const data = c.interpretation.data;
  if (row === 'E02' || row === 'E03') {
    const r = cycles[0], out = {desire:r.iep.desire,belief:r.iep.belief,mental:r.iep.mental,practical:r.iep.practical,
      intensity:r.iep.emotionIntensity,achievement:r.oop.achievement,hours:r.iep.hours,frequency:r.iep.frequency,direction:r.oop.direction};
    if (row === 'E03') out.categoryIndex = data.emotion.category; return out;
  }
  if (row === 'E05') { const m = METRICS.find(m => m[0] === c.ruleEvaluation.metric); return {metricLabel:m[2],units:m[3],scope:m[4],before:data.before,after:data.after,delta:data.delta}; }
  if (row === 'E06') return {before:data.before,after:data.after,ordinalChange:{higher_category:'increased',lower_category:'decreased',same_category:'unchanged'}[data.change]};
  if (row === 'E07') return {dimensions:DIMENSIONS.filter(d => data.currentReferenceDifferences.includes(d))};
  if (row === 'E09') return {dimension:data.dimension};
  if (row === 'E10') return {ratings:values('iep.practical')};
  if (row === 'E11') return {ratings:values('iep.practical'),hours:values('iep.hours')};
  if (row === 'E12') return {ratings:values('iep.mental')};
  if (row === 'E13') return {categories:values('iep.frequency')};
  if (row === 'E14') return {categoryIndex:data.category};
  if (row === 'E16') return {intensities:values('iep.emotionIntensity')};
  if (row === 'E17') return {ratings:values('oop.achievement'),directions:values('oop.direction'),bases:values('oop.evidence').map(list => [...new Set(list)])};
  if (row === 'E18') return {ratings:values('oop.achievement')};
  if (['E19','E23','E24'].includes(row)) return {practical:values('iep.practical'),achievement:values('oop.achievement')};
  if (row === 'E21') return {dimensions:data.selectedDimensions};
  if (row === 'E22') return {eventCount:data.eventCount,...Object.fromEntries(DIMENSIONS.map(d => [`${d}Count`,data.dimensionCounts[d]]))};
  if (row === 'E25') return {metricLabel:data.internalSource === 'mental' ? 'mental-effort' : 'emotion-intensity',internal:values(`iep.${data.internalSource}`),practical:values('iep.practical'),achievement:values('oop.achievement')};
  if (row === 'E27') return {fieldNames:FIXED_FIELDS[MAPPING[c.ruleId]]};
  if (row === 'E28') return {ruleId:c.ruleId};
  return {};
}
function assertApproved(input, api) {
  const out = assess(input,api); const e = input.engineResult;
  assert.equal(out.verdict,'ALLOW'); assert.equal(out.registryVersion,REGISTRY);
  assert.equal(out.fallbackVerdict,null); assert.equal(out.presentation.mode,'APPROVED_BUNDLE');
  assert.equal(out.presentation.dtoVersion,'safety-presentation-v1'); assert.equal(out.presentation.fallback,null);
  assert.equal(out.presentation.primary.interpretation,null); assert.equal(out.presentation.primary.nextFocus,null);
  assert.deepStrictEqual(Object.keys(out.presentation.primary).sort(),['insight','interpretation','nextFocus','why'].sort());
  if (e.secondary) { assert.equal(out.presentation.secondary.interpretation,null); assert.deepStrictEqual(Object.keys(out.presentation.secondary).sort(),['insight','interpretation','why'].sort()); }
  else assert.equal(out.presentation.secondary,null);
  const components = approvedComponents(out.presentation);
  assert.deepStrictEqual(components.map(c => c.slot),input.presentationPlan.components.map(c => c.slot));
  assert.deepStrictEqual(out.componentResults.map(c => c.componentId),input.presentationPlan.components.map(c => c.componentId));
  assert.ok(out.componentResults.every(c => c.verdict === 'ALLOW'));
  for (let i=0;i<components.length;i++) {
    const component=components[i],request=input.presentationPlan.components[i];
    assert.deepStrictEqual(Object.keys(component).sort(),['componentId','surface','role','slot','templateId','templateVersion','bindings'].sort());
    for (const field of ['componentId','surface','role','slot','templateId','templateVersion']) assert.equal(component[field],request[field]);
    const row=EXPECTED_ENTRIES.find(entry => entry.templateId === request.templateId).row;
    const candidate=request.surface === 'PRIMARY' ? e.primary : e.secondary;
    assert.deepStrictEqual(normalized(component.bindings),expectedValues(input.sourceSnapshot,candidate,row));
  }
  assert.equal(out.engineStatus,e.status); assert.equal(out.engineReleaseStatus,e.safety.releaseStatus);
  return out;
}
function addFocus(input,{surface='PRIMARY',ruleId,key,templateId='test.unregistered.focus',kind='observe'}={}) {
  const c=surface === 'PRIMARY' ? input.engineResult.primary : input.engineResult.secondary;
  const slot=surface.toLowerCase()+'.nextFocus';
  input.presentationPlan.components.push({componentId:slot,surface,role:'NEXT_FOCUS',slot,templateId,templateVersion:1,
    ruleId:ruleId || c?.ruleId,candidateId:c?.candidateId || ruleId,engineSelector:key || c?.nextFocus?.promptKey || `analysis.${ruleId}.observe`,bindings:[]});
  // kind/optional are untrusted in U04; ordinary focus descriptors do not supply them.
  if (kind !== 'observe') input.presentationPlan.components.at(-1).kind=kind;
  return input;
}
function reverseKeys(value) {
  if (Array.isArray(value)) return value.map(reverseKeys);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.keys(value).reverse().map(k => [k,reverseKeys(value[k])]));
}

const BANK = [];
function positive(family, name, make, primary, targetRow, surface = 'PRIMARY', targetCandidate = primary) {
  const descriptor = { family, name, make, primary, targetRow, surface, targetCandidate };
  BANK.push(descriptor);
  define(family, `${name}: actual selected-output reachability`, () => {
    const s = make(), before = clone(s), e = analyze(s);
    assert.deepStrictEqual(s,before); assert.equal(e.primary?.candidateId,primary);
    const c = surface === 'PRIMARY' ? e.primary : e.secondary;
    assert.equal(c?.candidateId,targetCandidate); assert.equal(selectedRow(c),targetRow);
    assert.equal(c.eligible,true); assert.equal(c.causality,'not_determined');
    assert.ok(c.ruleEvaluation.conditions.every(condition => condition.passed));
    assert.equal(e.capabilities.VAQUQA.ruleId,'COND-01');
    assert.equal(e.capabilities.VAQUQA.status,'capability_gap');
    assert.equal(e.capabilities.VAQUQA.conditionSufficiency,'unavailable');
    const p = buildPlan(s,e), m = MANIFESTS[e.secondary ? 4 : 3];
    assert.equal(p.manifestId,m.manifestId); assert.deepStrictEqual(p.components.map(c => c.slot),m.slots);
    for (const candidate of [e.primary,e.secondary].filter(Boolean)) {
      candidate.ruleEvaluation.usedArrayIndices.forEach((index,i) => assert.equal(s.intent.cycles[index].id,candidate.ruleEvaluation.usedCycleIds[i]));
    }
    for (const request of p.components) for (const b of request.bindings) for (const r of b.sourceRefs) {
      const candidate = request.surface === 'PRIMARY' ? e.primary : e.secondary;
      if(r.path.startsWith('intent.ris.')) assert.ok(candidate.evidence.some(item=>item.path===r.path&&item.reference==='current_mutable_reference'),'dimension metadata must retain its current RIS reference');
      else {
        assert.equal(s.intent.cycles[r.arrayIndex].id,r.cycleId);
        assert.ok(candidate.evidence.some(item => item.path === r.path && item.arrayIndex === r.arrayIndex && item.cycleId === r.cycleId),'binding must have real selected evidence');
      }
    }
    if (c.ruleId === 'CMP-01') {
      const delta = c.ruleEvaluation.derivedMeasures.filter(m => m.name === 'signed_delta');
      assert.equal(delta.length,1); assert.equal(delta[0].value,c.interpretation.data.delta);
      assert.deepStrictEqual(delta[0].inputPaths,refs(s,c,[METRICS.find(m => m[0] === c.ruleEvaluation.metric)[1]]).map(r => r.path));
    }
    if (e.secondary) { assert.equal(e.secondary.nextFocus,null); assert.equal(e.secondary.whyThisFocus,null); }
  },'fixture');
  define(family, `${name}: exact registered factual bundle`, () => {
    const input = inputFor(make()); const out = assertApproved(input);
    const actual = surface === 'PRIMARY' ? out.presentation.primary : out.presentation.secondary;
    assert.equal(actual.insight.templateId,ID[targetRow]);
  });
}
positive('A01','one valid current observation',()=>fixture(),'REF-01','E03');
positive('A01','current unlisted category keeps numeric facts',()=>reflectionFixture('B5',false),'REF-01','E02');
positive('A02','insufficient recorded basis',()=>reflectionFixture('B1'),'QUAL-01','E04');
positive('A02','exact possible default profile',()=>{
  const s=fixture(),c=s.intent.cycles[0];
  c.iep={desire:5,belief:5,mental:5,practical:5,emotionIntensity:5,hours:0,frequency:'freq2',emotion:EMOTION_LABELS.en[2],actions:''};
  c.oop={achievement:0,direction:'none',evidence:[],currentState:'',events:'',external:''}; return s;
},'QUAL-01','E04');
positive('A03','practical 6 to 8 with engine delta 2',()=>vector(fixture(2),'iep.practical',[6,8]),'CMP-01:practical','E05');
positive('A04','separate practical rating 8 and seven-day hours 0.125',()=>{const s=fixture();s.intent.cycles[0].iep.hours=0.125;return s;},'REF-01','E03');
positive('A05','exact decimal current ratings and hours',()=>{const s=fixture(),c=s.intent.cycles[0];c.iep.practical=6.75;c.iep.hours=0.125;c.oop.achievement=3.25;return s;},'REF-01','E03');
positive('A05','decimal numeric comparison',()=>vector(fixture(2),'iep.practical',[5.25,6.75]),'CMP-01:practical','E05');
positive('A05','decimal hour comparison',()=>vector(fixture(2),'iep.hours',[0.125,1.625]),'CMP-01:hours','E05');
for (const pair of [['freq0','freq1'],['freq5','freq3']]) positive('A06',`ordinal pair ${pair.join('/')}`,()=>vector(fixture(2),'iep.frequency',pair),'CMP-02:frequency','E06');
positive('A07','six-dimension wording recurrence',pattern,'INT-01','E08');
for (const dimension of DIMENSIONS) positive('A08',`selected recurring ${dimension} mismatch`,()=>dimensionFixture(dimension),'INT-01','E09','SECONDARY',`INT-02:${dimension}`);
positive('A09','literal current-reference differences',()=>{const s=fixture();s.intent.cycles[0].cie.primary='Synthetic different wording';return s;},'TXT-01','E07');
positive('A10','practical recorded decline 8/7/6',()=>vector(pattern(),'iep.practical',[8,7,6]),'PRA-01','E10');
positive('A11','practical 1/1/1 and separate hours',()=>vector(pattern(),'iep.practical',[1,1,1]),'PRA-02','E11');
positive('A11','zero ratings and zero hours remain present',()=>vector(vector(pattern(),'iep.practical',[0,0,0]),'iep.hours',[0,0,0]),'PRA-02','E11');
for (const series of [[2,2,2],[8,7,6]]) positive('A12',`mental self-reports ${series.join('/')}`,()=>vector(pattern(),'iep.mental',series),'MEN-01','E12');
for (const categories of [['freq2','freq2','freq2'],['freq4','freq3','freq2']]) positive('A13',`recorded categories ${categories.join('/')}`,()=>vector(pattern(),'iep.frequency',categories),'MEN-02','E13');
positive('A14','known mapped category recurrence',()=>recurringCategory(3),'EMO-01','E14');
positive('A15','Other selection remains nonspecific',()=>recurringCategory(9),'EMO-01','E15');
for (const series of [[4,5,6],[6,5,4]]) positive('A16',`same-category intensity ${series.join('/')}`,()=>vector(recurringCategory(3),'iep.emotionIntensity',series),'EMO-02','E16');
for (const category of [4,1,3]) positive('A17',`separate selected current category ${category}`,()=>{const s=fixture();s.intent.cycles[0].iep.emotion=EMOTION_LABELS.en[category];return s;},'REF-01','E03');
define('A17','changed-category real pair cannot support intensity trend',()=>{
  const s=vector(fixture(2),'iep.emotion',[EMOTION_LABELS.en[4],EMOTION_LABELS.en[1]]),e=analyze(s);
  assert.equal(e.comparisons.find(c=>c.metric==='emotionIntensity').delta,null);
  assert.equal(e.ruleEvaluations.find(c=>c.candidateId==='CMP-01:emotionIntensity').eligible,false);
  assert.equal(e.ruleEvaluations.find(c=>c.ruleId==='EMO-02').eligible,false);
},'fixture');
for (const [ratings,direction] of [[[2,3,4],'toward'],[[6,5,4],'away']]) positive('A18',`achievement ${ratings.join('/')} with ${direction}`,()=>vector(vector(pattern(),'oop.achievement',ratings),'oop.direction',Array(3).fill(direction)),'OUT-01','E17');
positive('A19','nearby recorded achievement and none direction',()=>vector(pattern(),'oop.achievement',[4,4,4]),'OUT-02','E18');
positive('A20','context rule keeps practical and outcome series separate',()=>vector(vector(vector(pattern(),'iep.practical',[6,6,6]),'oop.achievement',[6,5,4]),'oop.direction',['away','away','away']),'CTX-01','E19');
positive('A21','real selected external presence secondary',()=>fixture(),'REF-01','E20','SECONDARY','CTX-02');
define('A22','exact COND-01 capability within selected primary bundle',()=>{
  const input=inputFor(fixture()),out=assertApproved(input);
  const capability=out.presentation.primary.why.find(c=>c.slot===WC);
  assert.equal(capability.templateId,ID.E30);assert.deepStrictEqual(normalized(capability.bindings),{});
  assert.notEqual(input.engineResult.primary.ruleId,'COND-01');
  assert.equal(input.engineResult.ruleEvaluations.find(c=>c.ruleId==='COND-01').eligible,false);
});
define('A22','capability provenance and absent own focus are reachable',()=>{
  const e=analyze(fixture());assert.deepStrictEqual(e.capabilities.VAQUQA,{ruleId:'COND-01',status:'capability_gap',conditionSufficiency:'unavailable'});
  assert.equal(e.ruleEvaluations.find(c=>c.ruleId==='COND-01').eligible,false);
  assert.ok(![e.primary,e.secondary].some(c=>c?.ruleId==='COND-01'));
},'fixture');
positive('A23','explicit selected revision dimensions',()=>revision(),'REV-01','E21');
positive('A23','same wording selected is still only a selection',()=>{const s=fixture();s.intent.cycles[0].intentional='yes';s.intent.cycles[0].revision={success:RIS.success};return s;},'REV-01','E21');
positive('A24','three real revision events and six key counts',()=>revision(3),'REV-01','E22','SECONDARY','REV-02');
positive('A25','practical decrease and nearby outcome',()=>vector(vector(vector(fixture(3),'iep.practical',[8,7,6]),'iep.hours',[3,2,1]),'oop.achievement',[2,2,2]),'REL-01','E23');
positive('A26','separately recorded practical and outcome co-increase',()=>vector(vector(vector(vector(fixture(3),'iep.practical',[3,4,5]),'iep.hours',[1,2,3]),'oop.achievement',[2,3,4]),'oop.direction',['toward','toward','toward']),'REL-02','E24');
for (const metric of ['mental','emotionIntensity']) positive('A27',`selected internal ${metric} branch`,()=>internalFixture(metric),'REL-03','E25');
for (const branch of ['decision_patch_conflict','practical_hours_opposed','recorded_direction']) positive('A28',`mixed metadata ${branch}`,()=>mixedFixture(branch),'MIX-01','E26');
positive('A29','opaque objective remains semantically unknown',()=>{const s=fixture();s.intent.ris.primary=s.intent.cycles[0].cie.primary='Synthetic opaque xqv-934';return s;},'REF-01','E03');
positive('A30','arbitrary prose remains outside generated facts',()=>{const s=fixture();for(const d of DIMENSIONS)s.intent.ris[d]=s.intent.cycles[0].cie[d]=SYNTHETIC_PROSE[5]+d;for(const f of ['currentState','events','external'])s.intent.cycles[0].oop[f]=SYNTHETIC_PROSE[6];s.intent.cycles[0].iep.actions=SYNTHETIC_PROSE[4];return s;},'REF-01','E03');
positive('A31','achievement 10 and toward are unverified selections',()=>{const s=fixture();s.intent.cycles[0].oop.achievement=10;s.intent.cycles[0].oop.direction='toward';return s;},'REF-01','E03');
for (const [name,make] of [['null intent',()=>({version:'0.1.0',intent:null})],['zero cycles',()=>fixture(0)]]) {
  define('A32',`${name}: actual empty engine state`,()=>{const e=analyze(make());assert.equal(e.status,'EMPTY');assert.equal(e.primary,null);assert.equal(e.secondary,null);},'fixture');
  define('A32',`${name}: fallback ALLOW never means bundle ALLOW`,()=>suppressed(inputFor(make()),'UNKNOWN','EMPTY_ANALYTICAL_PLAN'));
}

// Fixed trusted metadata fixtures. These are never exported or inserted into the
// actual TEMPLATE_REGISTRY. Natural-language fixture bodies are never classified.
const FUNCTION_ROWS = freeze([
  ['H01','DIAGNOSTIC_FRAMING'],['H02','THERAPEUTIC_FRAMING'],['H03','EFFORT_INCREASE'],
  ['H04','MINDSET_MODIFICATION'],['H05','EMOTION_MODIFICATION'],['H06','OBSTACLE_REMOVAL'],
  ['H07','CAUSAL_CLAIM'],['H08','ACTION_PRESCRIPTION'],['H09','PERSISTENCE_ADVICE'],
  ['H11','AUTOMATIC_REVISION'],['H12','GLOBAL_SAFETY_CLAIM'],['E13','EFFORT_DECREASE'],
  ['E13','BEHAVIOURAL_OPTIMISATION'],['E13','BELIEF_MODIFICATION'],['E13','TREATMENT_ADVICE'],
  ['E13','EXECUTION_PLANNING'],['E13','PREDICTION'],['E13','OBJECTIVE_OPTIMISATION'],
  ['E13','CRITERIA_OPTIMISATION'],['E13','SCOPE_OPTIMISATION'],['E13','HIGH_STAKES_DIRECTIVE']
]);
const PRIVATE_FIXTURES = freeze(FUNCTION_ROWS.map(([family,fn])=>({
  fixtureId:`test.kernel.${family}.${fn}`, target:ID.E03,
  allowedPresentationFunction:fn,safetyClassification:'HOLD',canonicalText:'Private fixed prohibited-function fixture.'
})));
const TRIPLES = freeze([
  ['AAA','ALLOW'],['AAH','HOLD'],['AAU','UNKNOWN'],['AHA','HOLD'],['AHH','HOLD'],['AHU','HOLD'],
  ['AUA','UNKNOWN'],['AUH','HOLD'],['AUU','UNKNOWN'],['HAA','HOLD'],['HAH','HOLD'],['HAU','HOLD'],
  ['HHA','HOLD'],['HHH','HOLD'],['HHU','HOLD'],['HUA','HOLD'],['HUH','HOLD'],['HUU','HOLD'],
  ['UAA','UNKNOWN'],['UAH','HOLD'],['UAU','UNKNOWN'],['UHA','HOLD'],['UHH','HOLD'],['UHU','HOLD'],
  ['UUA','UNKNOWN'],['UUH','HOLD'],['UUU','UNKNOWN']
]);
const VERDICT_LETTER = freeze({A:'ALLOW',H:'HOLD',U:'UNKNOWN'});
function privateRuntime(overlays=[], options={}) {
  const source=fs.readFileSync(implementationPath,'utf8');
  const fixed=freeze(clone(overlays)), state={installed:0,missingRegistryInstalled:0,attempts:[],tables:[],logs:[],analysisRuns:0};
  const context=vm.createContext({module:{exports:{}},exports:{},
    __install(value){
      if(options.registryUnavailable&&Array.isArray(value)&&value.length===30&&!Object.isFrozen(value)&&
        value.every(entry=>entry&&typeof entry.templateId==='string'&&typeof entry.canonicalText==='string')){
        value.splice(0,value.length);state.missingRegistryInstalled++;
      }
      if(value&&typeof value==='object'&&!Array.isArray(value)&&Object.hasOwn(value,'templateId')&&Object.hasOwn(value,'registryVersion')) {
        const change=fixed.find(o=>o.target===value.templateId);
        if(change&&!Object.isFrozen(value)) {
          for(const [key,item] of Object.entries(change)) if(!['target','fixtureId','remove'].includes(key)) value[key]=freeze(context.__copyIntoRealm(clone(item)));
          for(const key of change.remove || []) delete value[key];
          state.installed++;
        }
      }
      return value;
    },
    __attempt(name){state.attempts.push(name);throw new Error('Synthetic forbidden environment access');},
    __log(){state.logs.push('attempt');},
    require(request){
      if(request==='./analysis.js')return {...engine,analyze(){state.analysisRuns++;throw new Error('Safety must consume selected outputs without rerunning analysis');}};
      state.attempts.push('require:'+request);throw new Error('Unsupported runtime dependency');
    }
  });
  context.__hostObjectPrototype=Object.prototype;
  context.__hostArrayPrototype=Array.prototype;
  vm.runInContext(`
    // Transfer descriptors into this realm without invoking getters, coercing
    // values or repairing unsupported prototypes. This is input transport only.
    globalThis.__copyIntoRealm=function copy(value,seen=new Map()){
      if(value===null||typeof value!=='object')return value;
      if(seen.has(value))return seen.get(value);
      const prototype=Object.getPrototypeOf(value),array=Array.isArray(value);
      if(array?prototype!==__hostArrayPrototype:prototype!==__hostObjectPrototype&&prototype!==null)return value;
      const out=array?[]:prototype===null?Object.create(null):{};seen.set(value,out);
      for(const key of Reflect.ownKeys(value)){
        const descriptor=Object.getOwnPropertyDescriptor(value,key);
        if('value'in descriptor)descriptor.value=copy(descriptor.value,seen);
        Object.defineProperty(out,key,descriptor);
      }
      if(!Object.isExtensible(value))Object.preventExtensions(out);
      return out;
    };
    const __nativeFreeze=Object.freeze;
    Object.freeze=function(value){__install(value);return __nativeFreeze(value);};
    globalThis.console={log:__log,warn:__log,error:__log,info:__log,debug:__log};
  `,context);
  const names=[...source.matchAll(/^(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=/gm)].map(match=>match[1]);
  if(options.environment) {
    const names=options.environment;
    context.__environmentNames=names;
    vm.runInContext(`for(const key of __environmentNames)Object.defineProperty(globalThis,key,{configurable:true,get(){return __attempt(key);}});`,context);
    vm.runInContext(`
      const __nativeDate=Date;
      globalThis.Date=function(...args){
        if(!new.target)return __attempt('Date()');
        if(args.length===0)return __attempt('new Date()');
        return Reflect.construct(__nativeDate,args,new.target);
      };
      Date.prototype=__nativeDate.prototype;
      Date.parse=__nativeDate.parse;Date.UTC=__nativeDate.UTC;
      Date.now=function(){return __attempt('Date.now');};
      Math.random=function(){return __attempt('Math.random');};
      globalThis.performance={now(){return __attempt('performance.now');}};
    `,context);
  }
  // Instrument initialization as well as evaluation; swallowed IO is still an
  // attempt and cannot make an invariant pass.
  vm.runInContext(source+'\n;globalThis.__tables=['+names.map(name=>`typeof ${name}==='undefined'?null:${name}`).join(',')+'];',context,{filename:'safety.js',timeout:10000});
  const actual=context.module.exports;
  const api={...actual,assessPresentation(input){
    const transferred=context.__copyIntoRealm(input),before=objectState(transferred);
    const result=actual.assessPresentation(transferred);
    assert.deepStrictEqual(objectState(transferred),before,'real VM evaluator must not mutate transferred inputs');
    assertNoAliases(result,transferred,actual.TEMPLATE_REGISTRY);
    return clone(result);
  }};
  if(fixed.length) assert.equal(state.installed,fixed.length,'private fixture must reach real compiled entries; no substitute evaluator');
  if(options.registryUnavailable)assert.ok(state.missingRegistryInstalled>0,'missing-registry fixture must reach the real trusted catalog');
  state.tables=context.__tables;
  return {api,state,context};
}
function privateProhibited(fixed,input=inputFor(fixture())) {
  const runtime=privateRuntime([fixed]);
  const publicBefore=objectState(implementation.TEMPLATE_REGISTRY);
  const out=suppressed(input,'HOLD','FORBIDDEN_FUNCTION',runtime.api);
  assert.deepStrictEqual(objectState(implementation.TEMPLATE_REGISTRY),publicBefore);
  assert.equal(runtime.state.analysisRuns,0);assert.equal(runtime.state.logs.length,0);
  return out;
}
for(const fixed of PRIVATE_FIXTURES) {
  const family=fixed.fixtureId.split('.')[2];
  define(family,`trusted ${fixed.allowedPresentationFunction}: atomic suppression`,()=>privateProhibited(fixed),'kernel');
}
define('H10','secondary Next Focus cannot be presented',()=>suppressed(addFocus(inputFor(fixture()),{surface:'SECONDARY',ruleId:'CTX-02',key:FOCUS_KEYS[20]}),'HOLD','FORBIDDEN_ROLE'));
define('H10','secondary recommendation regardless of optional tone',()=>{
  const input=addFocus(inputFor(fixture()),{surface:'SECONDARY'});input.presentationPlan.components.at(-1).optional=true;
  suppressed(input,'HOLD','FORBIDDEN_ROLE');
});

function changedComponent(change) { const input=inputFor(fixture());change(input.presentationPlan.components[0],input);return input; }
define('U01','unknown exact template identity',()=>suppressed(changedComponent(c=>{c.templateId='test.unregistered.insight';}),'UNKNOWN','UNKNOWN_TEMPLATE'));
for(const version of [0,2,'1','latest',null]) define('U02',`unknown template version ${String(version)}`,()=>suppressed(changedComponent(c=>{c.templateVersion=version;}),'UNKNOWN','UNKNOWN_VERSION'));
define('U03','current unmapped primary prompt key',()=>suppressed(addFocus(inputFor(fixture()),{}),'UNKNOWN','UNMAPPED_ENGINE_KEY'));
for(const kind of ['observe','clarify']) define('U04',`${kind} and optional true are not authority`,()=>{
  const input=addFocus(inputFor(fixture()),{kind});Object.assign(input.presentationPlan.components.at(-1),{kind,optional:true});
  suppressed(input,'UNKNOWN');
});
for(const [family,selector] of [ ['U05','test.requiresObjectiveMeaning'],['U06','test.externalObstacleMeaning'],
  ['U07','test.semanticRetentionOrDrift'],['U08','test.psychologicalEmotionMeaning'],['U09','test.arbitrarySourceQuotation'],
  ['U15','test.progressionAcrossRevisionBoundary'] ]) define(family,`negative unregistered descriptor ${selector}`,()=>{
    const input=inputFor(family==='U15'?revision():fixture());const slot='primary.interpretation';
    input.presentationPlan.components.push({componentId:slot,surface:'PRIMARY',role:'INTERPRETATION',slot,
      templateId:selector,templateVersion:1,ruleId:input.engineResult.primary.ruleId,candidateId:input.engineResult.primary.candidateId,
      engineSelector:selector,bindings:[]});
    suppressed(input,'UNKNOWN');
});
for(const property of ['body','canonicalText','renderedBody','text']) define('U10',`caller-supplied ${property} cannot replace approved body`,()=>{
  suppressed(changedComponent(c=>{c[property]='Synthetic purported approved copy';}),'UNKNOWN');
});
for(const [name,change] of [
  ['extra name',c=>c.bindings.push(binding('unapproved','CURRENT(iep.practical)',[]))],
  ['missing required binding',c=>c.bindings.pop()],
  ['supplied value',c=>{c.bindings[0].value=7;}],
  ['wrong selector',c=>{c.bindings[0].selector='CURRENT(iep.practical)';}],
  ['prototype selector',c=>{c.bindings[0].selector='__proto__.desire';}],
  ['wildcard selector',c=>{c.bindings[0].selector='intent.cycles[*].iep.desire';}],
  ['bindings object rather than reference array',c=>{c.bindings={desire:7};}],
  ['duplicate name',c=>{c.bindings.push(clone(c.bindings[0]));}]
]) define('U11',name,()=>suppressed(changedComponent(change),'UNKNOWN'));
for(const source of [null,[],42,'synthetic',{version:'0.2.0',intent:null},{version:'0.1.0',intent:{}},
  {version:'0.1.0',intent:{cycles:'synthetic'}}]) define('U12',`malformed source ${JSON.stringify(source)}`,()=>{
  const input=inputFor(fixture());input.sourceSnapshot=clone(source);suppressed(input,'UNKNOWN');
});
for(const [name,change] of [
  ['absent engine',input=>{delete input.engineResult;}],
  ['nonobject engine',input=>{input.engineResult='synthetic';}],
  ['wrong engine version',input=>{input.engineResult.engineVersion='unknown';}],
  ['wrong adapter version',input=>{input.engineResult.adapterVersion='unknown';}],
  ['wrong dictionary',input=>{input.engineResult.dictionaryVersion='unknown';}],
  ['wrong source commit',input=>{input.engineResult.inputReference.sourceCommit='unknown';}],
  ['wrong source version',input=>{input.engineResult.inputReference.sourceVersion='0.2.0';}],
  ['wrong heuristic status',input=>{input.engineResult.heuristicStatus='VERIFIED';}],
  ['wrong release status',input=>{input.engineResult.safety.releaseStatus='RELEASED';}]
]) define('U12',name,()=>{const input=inputFor(fixture());change(input);const out=suppressed(input,'UNKNOWN');if(!input.engineResult||typeof input.engineResult!=='object'){assert.equal(out.engineStatus,null);assert.equal(out.engineReleaseStatus,null);}});
for(const [name,change] of [
  ['binding cycle id',input=>{input.presentationPlan.components[0].bindings[0].sourceRefs[0].cycleId='synthetic-other-id';}],
  ['binding array index',input=>{input.presentationPlan.components[0].bindings[0].sourceRefs[0].arrayIndex=100;}],
  ['binding field reference',input=>{input.presentationPlan.components[0].bindings[0].sourceRefs[0].path='intent.cycles[0].iep.belief';}],
  ['candidate identity',input=>{input.engineResult.primary.candidateId='REF-01:forged';}],
  ['evidence cycle id',input=>{input.engineResult.primary.evidence.find(r=>r.path.endsWith('.iep.desire')).cycleId='synthetic-forged';}],
  ['evidence raw value',input=>{input.engineResult.primary.evidence.find(r=>r.path.endsWith('.iep.desire')).rawValue=9;}],
  ['used cycle index',input=>{input.engineResult.primary.ruleEvaluation.usedArrayIndices=[1];}],
  ['used cycle id',input=>{input.engineResult.primary.ruleEvaluation.usedCycleIds=['synthetic-forged'];}],
  ['missing evidence',input=>{input.engineResult.primary.evidence=[];}]
]) define('U13',`negative descriptor with unverifiable ${name}`,()=>{const input=inputFor(fixture());change(input);suppressed(input,'UNKNOWN','INVALID_PROVENANCE');});
for(const [name,change] of [
  ['ineligible selected candidate',input=>{input.engineResult.primary.eligible=false;}],
  ['failed selected condition',input=>{input.engineResult.primary.ruleEvaluation.conditions[0].passed=false;}],
  ['unresolved comparison basis',input=>{input.engineResult.comparisons.find(c=>c.metric==='practical').comparableBasis=false;}],
  ['missing engine delta',input=>{input.engineResult.primary.ruleEvaluation.derivedMeasures=[];}],
  ['different engine delta',input=>{input.engineResult.primary.ruleEvaluation.derivedMeasures[0].value=9;}]
]) define('U14',`negative comparison descriptor: ${name}`,()=>{const input=inputFor(vector(fixture(2),'iep.practical',[6,8]));change(input);suppressed(input,'UNKNOWN');});
for(const [property,value] of [['policyVersion','safety-v2'],['registryVersion','safety-registry-v2']]) define('U16',`${property} mismatch`,()=>{
  const input=inputFor(fixture());input.presentationPlan[property]=value;suppressed(input,'UNKNOWN');
});
for(const field of ['allowedBindings','engineMappings','requiredEvidence','canonicalText']) define('U16',`private damaged registry missing ${field}`,()=>{
  const runtime=privateRuntime([{target:ID.E03,remove:[field]}]);suppressed(inputFor(fixture()),'UNKNOWN',null,runtime.api);
},'kernel');
define('U16','private unavailable registry retains independent fallback',()=>{
  const runtime=privateRuntime([],{registryUnavailable:true}),out=suppressed(inputFor(fixture()),'UNKNOWN',null,runtime.api);
  assert.equal(out.registryVersion,null);assert.equal(out.presentation.fallback.templateId,FALLBACK_ID);
},'kernel');

define('I01','complete fixed manifest has only exact approved slots',()=>assertApproved(inputFor(fixture())));
define('I02','trusted HOLD in required primary insight suppresses all slots',()=>privateProhibited(PRIVATE_FIXTURES[0]),'kernel');
define('I03','unregistered Why suppresses approved Insight and Secondary',()=>{
  const input=inputFor(fixture());input.presentationPlan.components[1].templateId='test.unknown.why';suppressed(input,'UNKNOWN');
});
for(const triple of ['AHU','AUH','HAU','HUA','UAH','UHA']) define('I04',`precedence permutation ${triple}`,()=>{
  const overlays=[ID.E03,ID.E27,ID.E28].map((target,i)=>({target,safetyClassification:VERDICT_LETTER[triple[i]]}));
  const runtime=privateRuntime(overlays),out=suppressed(inputFor(fixture()),'HOLD',null,runtime.api);
  assert.deepStrictEqual(out.componentResults.slice(0,3).map(c=>c.verdict),[...triple].map(letter=>VERDICT_LETTER[letter]));
},'kernel');
define('I05','allowed secondary contains no focus or recommendation fields',()=>{
  const input=inputFor(fixture()),out=assertApproved(input);assert.equal(out.presentation.secondary.insight.templateId,ID.E20);
  for(const key of ['nextFocus','whyThisFocus','recommendation','advice'])assert.equal(Object.hasOwn(out.presentation.secondary,key),false);
});
for(const family of ['I06','I07','I08','I09']) for(const verdict of ['HOLD','UNKNOWN']) define(family,`${verdict} suppresses every analytical and auxiliary reference`,()=>{
  const input=inputFor(fixture());
  if(verdict==='HOLD')addFocus(input,{surface:'SECONDARY'});else input.presentationPlan.components[0].templateId='test.unknown';
  const out=suppressed(input,verdict);assert.deepStrictEqual(approvedComponents(out.presentation),[]);
  assert.equal(out.presentation.primary,null);assert.equal(out.presentation.secondary,null);
});
define('I10','selected candidate fails while eligible lower candidates exist',()=>{
  const input=inputFor(vector(vector(vector(fixture(3),'iep.practical',[8,7,6]),'iep.hours',[3,2,1]),'oop.achievement',[2,2,2]));
  assert.equal(input.engineResult.primary.ruleId,'REL-01');assert.ok(input.engineResult.suppressedCandidates.some(c=>c.eligible));
  input.presentationPlan.components[0].templateId='test.unapproved.selected';const out=suppressed(input,'UNKNOWN');
  assert.equal(out.presentation.primary,null);assert.equal(input.engineResult.primary.ruleId,'REL-01');
});
define('I11','ALLOW followed by UNKNOWN and HOLD cannot retain an old bundle',()=>{
  const good=inputFor(fixture()),first=assertApproved(good),saved=clone(first);
  const unknown=clone(good);unknown.presentationPlan.components[1].templateId='test.unapproved';suppressed(unknown,'UNKNOWN');
  suppressed(addFocus(clone(good),{surface:'SECONDARY'}),'HOLD');assert.deepStrictEqual(first,saved);
  assertApproved(clone(good));
});
define('I12','all normal source and engine fields and plan remain unchanged',()=>{
  const input=inputFor(revision(3)),before=clone(input);assertApproved(input);assert.deepStrictEqual(input,before);
  assert.deepStrictEqual(input.sourceSnapshot.intent.ris,RIS);
});
define('I13','deep-frozen inputs and compiled registry remain frozen',()=>{
  const input=freeze(inputFor(fixture()));assertApproved(input);
  for(const object of objectSet(input))assert.equal(Object.isFrozen(object),true);
  for(const object of objectSet(implementation.TEMPLATE_REGISTRY))assert.equal(Object.isFrozen(object),true);
});
define('I14','returned-object mutation has no input or registry aliases',()=>{
  const input=inputFor(fixture()),inputBefore=clone(input),registryBefore=objectState(implementation.TEMPLATE_REGISTRY),out=assertApproved(input);
  const owned=clone(out);owned.presentation.primary.insight.bindings.desire=999;owned.presentation.secondary.why.length=0;
  assert.deepStrictEqual(input,inputBefore);assert.deepStrictEqual(objectState(implementation.TEMPLATE_REGISTRY),registryBefore);
  assert.equal(out.presentation.primary.insight.bindings.desire,7);assertApproved(input);
});
define('I15','frozen engine output identical before and after boundary',()=>{
  const s=internalFixture('mental'),before=analyze(s),input={sourceSnapshot:s,engineResult:before,presentationPlan:buildPlan(s,before)};
  assertApproved(input);assert.deepStrictEqual(analyze(s),before);
  const runtime=privateRuntime();assertApproved(input,runtime.api);assert.equal(runtime.state.analysisRuns,0);
});
const NETWORK_APIS=freeze(['fetch','XMLHttpRequest','WebSocket','EventSource','navigator']);
const STORAGE_APIS=freeze(['localStorage','sessionStorage','indexedDB','caches','document']);
define('I16','instrumented network APIs report zero attempts',()=>{
  const runtime=privateRuntime([],{environment:NETWORK_APIS});assertApproved(inputFor(fixture()),runtime.api);
  assert.deepStrictEqual(runtime.state.attempts,[]);
});
define('I17','instrumented storage APIs report zero reads and writes',()=>{
  const runtime=privateRuntime([],{environment:STORAGE_APIS});assertApproved(inputFor(fixture()),runtime.api);
  assert.deepStrictEqual(runtime.state.attempts,[]);
});
define('I18','clock random platform and timezone cannot affect the decision',()=>{
  const input=inputFor(fixture()),expected=assertApproved(input);
  for(const timezone of ['UTC','Europe/Berlin','Pacific/Auckland']){
    const runtime=privateRuntime([],{environment:[...NETWORK_APIS,...STORAGE_APIS,'Intl']});
    runtime.context.process={env:{TZ:timezone},platform:'synthetic-platform'};
    const out=assertApproved(input,runtime.api);assert.deepStrictEqual(normalized(out),normalized(expected));assert.deepStrictEqual(runtime.state.attempts,[]);
  }
});
define('I19','1000 evaluations are deeply identical and read only',()=>{
  const input=freeze(inputFor(fixture())),expected=assertApproved(input);
  for(let i=0;i<1000;i++)assert.deepStrictEqual(assess(input),expected);
});
define('I20','object-key insertion order is irrelevant and arrays retain order',()=>{
  const input=inputFor(fixture()),expected=assertApproved(input),reordered=reverseKeys(input),out=assertApproved(reordered);
  assert.deepStrictEqual(out,expected);assert.deepStrictEqual(out.componentResults.map(c=>c.componentId),input.presentationPlan.components.map(c=>c.componentId));
});
for(const locale of Object.keys(EMOTION_LABELS)) define('I21',`presentation locale metadata ${locale}`,()=>{
  const baseline=inputFor(fixture()),expected=assertApproved(baseline),s=fixture();
  s.lang=locale;s.presentationPreferences={language:locale};const out=assertApproved(inputFor(s));assert.deepStrictEqual(out,expected);
});
for(const locale of Object.keys(EMOTION_LABELS)) for(const category of [3,9]) define('I22',`inherited category ${category} label in ${locale}`,()=>{
  const s=fixture();s.intent.cycles[0].iep.emotion=EMOTION_LABELS[locale][category];const input=inputFor(s),out=assertApproved(input);
  assert.equal(mapEmotion(EMOTION_LABELS[locale][category]).category,category);assert.equal(out.presentation.primary.insight.bindings.categoryIndex,category);
});
function canonicalTextFor(component,api=implementation,locale='en') {
  const entry=registryEntries(api.TEMPLATE_REGISTRY).find(e=>e.templateId===component.templateId&&e.templateVersion===component.templateVersion&&e.role===component.role);
  assert.ok(entry);return entry.approvedVariants[locale] || entry.canonicalText;
}
for(const locale of [undefined,'unreviewed-locale','ar','he','ru']) define('I23',`missing variant ${String(locale)} resolves canonical English`,()=>{
  const out=assertApproved(inputFor(fixture())),component=out.presentation.primary.insight;
  assert.equal(canonicalTextFor(component,implementation,locale),EXPECTED_ENTRIES.find(e=>e.row==='E03').canonicalText);
  assert.equal(canonicalTextFor({templateId:FALLBACK_ID,templateVersion:1,role:'FALLBACK'},implementation,locale),FALLBACK_EN);
});
for(const decision of ['ALLOW','UNKNOWN','HOLD']) define('I24',`actual upstream externalDecision ${decision}`,()=>{
  const input=inputFor(fixture(),{safetyDecision:decision});
  if(decision==='HOLD')suppressed(input,'HOLD','UPSTREAM_HOLD');
  else { assertApproved(input);input.presentationPlan.components[0].templateId='test.unregistered';suppressed(input,'UNKNOWN'); }
});
define('I25','private resolution fault fails closed with sanitized fallback',()=>{
  const runtime=privateRuntime(),input=inputFor(fixture());let attempts=0;
  runtime.context.__fault=()=>{attempts++;throw new Error('Synthetic private resolution fault secret-925');};
  vm.runInContext('Number.isFinite=function(){return __fault();};',runtime.context);
  const out=suppressed(input,'UNKNOWN',null,runtime.api);assert.ok(attempts>0,'fault must reach real numeric resolution');
  assert.equal(JSON.stringify(out).includes('secret-925'),false);assert.equal(runtime.state.logs.length,0);
},'kernel');
define('I25','known structural HOLD survives malformed accompanying component',()=>{
  const input=addFocus(inputFor(fixture()),{surface:'SECONDARY'});input.presentationPlan.components.push(null);suppressed(input,'HOLD');
});
define('I26','sensitive synthetic error data never reaches output or logs',()=>{
  const secret='SYNTHETIC_SENSITIVE_RECORD_81294',input=inputFor(fixture());input.sourceSnapshot.intent.cycles[0].oop.external=secret;
  input.presentationPlan.components[0].body=secret;const runtime=privateRuntime(),out=suppressed(input,'UNKNOWN',null,runtime.api);
  assert.equal(JSON.stringify(out).includes(secret),false);assert.deepStrictEqual(runtime.state.logs,[]);assert.deepStrictEqual(runtime.state.attempts,[]);
});
define('I27','fallback intrinsic ALLOW never overwrites analytical verdict',()=>{
  assertApproved(inputFor(fixture()));
  for(const input of [addFocus(inputFor(fixture()),{surface:'SECONDARY'}),changedComponent(c=>{c.templateId='test.unknown';}),inputFor(fixture(0))]){
    const out=assess(input);assert.ok(out.verdict==='HOLD'||out.verdict==='UNKNOWN');assertFallback(out,out.verdict);
  }
});
const STATUS_INPUTS=freeze([
  ['READY',()=>fixture()],['LIMITED',()=>dimensionFixture('primary')],['INSUFFICIENT',()=>reflectionFixture('B1')],
  ['MIXED',()=>mixedFixture('recorded_direction')],['EMPTY',()=>fixture(0)],
  ['SAFETY_HOLD',()=>fixture(),{safetyDecision:'HOLD'}],['UNSUPPORTED_SOURCE',()=>({version:'0.2.0',intent:null})]
]);
for(const [status,make,options] of STATUS_INPUTS) {
  define('I28',`${status}: actual frozen status reachability`,()=>assert.equal(analyze(make(),options).status,status),'fixture');
  define('I28',`${status}: objective and causal invariants`,()=>{const input=inputFor(make(),options),out=assess(input);assert.equal(out.engineStatus,status);assert.equal(out.objectiveMeaning,'UNKNOWN');assert.equal(out.causality,'not_determined');if(out.verdict!=='ALLOW')assertFallback(out,out.verdict);});
}

define('E01','exact K01-K25 inventory and distinct denominators',()=>{
  const rows=tableRows(boundaryText,'### Complete unique-key inventory','## 30.');
  assert.deepStrictEqual(rows.map(row=>row[1]),FOCUS_KEYS);assert.equal(new Set(FOCUS_KEYS).size,25);
  assert.equal(FOCUS_KEYS.filter(key=>key!=='analysis.COND-01.observe').length,24);
  assert.equal(FOCUS_KEYS.filter(key=>!['analysis.COND-01.observe','analysis.CTX-02.observe'].includes(key)).length,23);
},'fixture');
for(const [i,key] of FOCUS_KEYS.entries()) define('E01',`K${String(i+1).padStart(2,'0')}: key is not approval`,()=>{
  const ruleId=i===20?'CTX-02':i===21?'COND-01':undefined;
  const input=addFocus(inputFor(fixture()),{ruleId,key});suppressed(input,ruleId?'HOLD':'UNKNOWN',ruleId?'FORBIDDEN_RULE_NEXT_FOCUS':null);
});
define('E02','exact 24 rule dispositions: 22 rewrite, 2 own-focus HOLD, 0 as-is',()=>{
  const rows=tableRows(boundaryText,'## 28.','## 29.');
  // Rule identifiers have hyphens, so read this one explicit table separately.
  const section=boundaryText.slice(boundaryText.indexOf('## 28.'),boundaryText.indexOf('## 29.'));
  const ruleRows=section.split('\n').filter(line=>/^\| [A-Z]+-\d{2} \|/.test(line)).map(line=>line.split('|').slice(1,-1).map(c=>c.trim()));
  assert.equal(rows.length,0);assert.deepStrictEqual(ruleRows.map(row=>row[0]),RULE_IDS);
  assert.equal(ruleRows.filter(row=>row[3]==='SAFE REWRITE REQUIRED').length,22);
  assert.equal(ruleRows.filter(row=>row[3].startsWith('HOLD')).length,2);
  assert.equal(ruleRows.filter(row=>row[3]==='ALLOW AS-IS').length,0);
  assert.equal(EXPECTED_ENTRIES.filter(e=>e.role==='NEXT_FOCUS').length,0);
},'fixture');
for(const ruleId of RULE_IDS) define('E02',`${ruleId}: no original focus released`,()=>{
  const input=addFocus(inputFor(fixture()),{ruleId,key:`analysis.${ruleId}.observe`});
  suppressed(input,['CTX-02','COND-01'].includes(ruleId)?'HOLD':'UNKNOWN');
});
for(const [metric,leaf] of METRICS) positive('E03',`selected exact CMP metric ${metric}`,()=>vector(fixture(2),leaf,metric==='hours'?[1,3]:[4,6]),`CMP-01:${metric}`,'E05');
for(const branch of ['B3','B4','B5']) for(const known of [true,false]) positive('E03',`reachable REF ${branch}/${known?'known':'unmapped'}`,()=>reflectionFixture(branch,known),'REF-01',known?'E03':'E02');
for(const [branch,selected] of [['B1','QUAL-01'],['B2','REV-01']]) for(const known of [true,false]) {
  define('E03',`${branch}/${known}: frozen selection prevents REF promotion`,()=>{
    const s=reflectionFixture(branch,known),e=analyze(s);assert.equal(e.primary.ruleId,selected);
    assert.equal(e.primary.nextFocus.promptKey,branch==='B1'?FOCUS_KEYS[0]:FOCUS_KEYS[1]);
    assert.ok(e.suppressedCandidates.some(c=>c.ruleId==='REF-01'&&c.eligible));assert.notEqual(e.secondary?.ruleId,'REF-01');
  },'fixture');
  define('E03',`${branch}/${known}: negative plan cannot release unselected REF`,()=>{
    const input=inputFor(reflectionFixture(branch,known));
    Object.assign(input.presentationPlan.components[0],{
      templateId:known?ID.E03:ID.E02,ruleId:'REF-01',candidateId:'REF-01',
      engineSelector:{ruleId:'REF-01',candidateId:'REF-01',key:'analysis.REF-01.title',metric:null,dimension:null,
        branch,variant:known?'CURRENT_KNOWN_CATEGORY':'CURRENT_CATEGORY_UNAVAILABLE'}});
    suppressed(input,'UNKNOWN');
  });
}
for(const dimension of DIMENSIONS) define('E03',`wrong INT dimension selector for ${dimension}`,()=>{
  const input=inputFor(dimensionFixture(dimension));const c=input.presentationPlan.components.find(c=>c.slot==='secondary.insight');
  c.engineSelector.dimension=DIMENSIONS[(DIMENSIONS.indexOf(dimension)+1)%6];suppressed(input,'UNKNOWN');
});
for(const metric of ['mental','emotionIntensity']) define('E03',`wrong REL internal selector for ${metric}`,()=>{
  const input=inputFor(internalFixture(metric));input.presentationPlan.components[0].engineSelector.metric=metric==='mental'?'emotionIntensity':'mental';
  suppressed(input,'UNKNOWN');
});
for(const branch of ['decision_patch_conflict','practical_hours_opposed','recorded_direction']) define('E03',`wrong MIX branch selector for ${branch}`,()=>{
  const input=inputFor(mixedFixture(branch));input.presentationPlan.components[0].engineSelector.branch='unregistered_branch';
  suppressed(input,'UNKNOWN');
});
for(const [name,change] of [
  ['title key string',c=>{c.engineSelector=c.engineSelector.key;}],
  ['missing tuple metric',c=>{delete c.engineSelector.metric;}],
  ['tuple rule mismatch',c=>{c.engineSelector.ruleId='PRA-01';}],
  ['tuple candidate mismatch',c=>{c.engineSelector.candidateId='REF-01:unregistered';}],
  ['unregistered variant',c=>{c.engineSelector.variant='unregistered';}],
  ['unregistered interpretation selector field',c=>{c.engineSelector.interpretationKey='analysis.REF-01.recordedObservation';}]
]) define('E03',`complete mapping identity rejects ${name}`,()=>suppressed(changedComponent(change),'UNKNOWN'));
for(const dimension of DIMENSIONS) define('A24',`frozen revision-count selector and dimension definition ${dimension}`,()=>{
  const input=inputFor(revision(3)),request=input.presentationPlan.components.find(c=>c.templateId===ID.E22);
  const reference=request.bindings.find(b=>b.name===`${dimension}Count`);
  assert.equal(reference.selector,'REVISION_KEY_COUNTS');assert.deepStrictEqual(Object.keys(reference).sort(),['name','selector','sourceRefs']);
  const entry=registryEntries(implementation.TEMPLATE_REGISTRY).find(e=>e.templateId===ID.E22);
  const definition=entry.allowedBindings.find(b=>b.name===reference.name);
  assert.equal(definition.selector,'REVISION_KEY_COUNTS');assert.equal(definition.dimension,dimension);
  assertApproved(input);
});
for(const dimension of DIMENSIONS) define('U11',`invented revision-count suffix ${dimension} is not registered`,()=>{
  const input=inputFor(revision(3)),request=input.presentationPlan.components.find(c=>c.templateId===ID.E22);
  request.bindings.find(b=>b.name===`${dimension}Count`).selector=`REVISION_KEY_COUNTS.${dimension}`;
  suppressed(input,'UNKNOWN','INVALID_BINDING');
});
for(const [triple,expected] of TRIPLES) define('E04',`all ordered verdict triples ${triple}`,()=>{
  const overlays=[ID.E03,ID.E27,ID.E28].map((target,i)=>({target,safetyClassification:VERDICT_LETTER[triple[i]]}));
  const runtime=privateRuntime(overlays),input=inputFor(fixture());
  const out=expected==='ALLOW'?assertApproved(input,runtime.api):suppressed(input,expected,null,runtime.api);
  assert.deepStrictEqual(out.componentResults.slice(0,3).map(c=>c.verdict),[...triple].map(letter=>VERDICT_LETTER[letter]));
},'kernel');
for(const [letter,expected] of [['A','UNKNOWN'],['H','HOLD'],['U','UNKNOWN']]) define('E04',`one analytical component ${letter} cannot approve incomplete manifest`,()=>{
  const runtime=privateRuntime([{target:ID.E03,safetyClassification:VERDICT_LETTER[letter]}]);
  const input=inputFor(fixture());input.presentationPlan.components=input.presentationPlan.components.slice(0,1);suppressed(input,expected,null,runtime.api);
},'kernel');
for(const incomplete of [false,true]) define('E05',`trusted raw interpolation and ${incomplete?'missing':'allowed'} companion slots`,()=>{
  const runtime=privateRuntime([{target:ID.E03,allowedPresentationFunction:'INTERPOLATE_RAW_USER_TEXT',safetyClassification:'HOLD'}]);
  const input=inputFor(fixture());if(incomplete)input.presentationPlan.components.splice(1,1);
  const out=suppressed(input,'HOLD',null,runtime.api);assert.equal(JSON.stringify(out.presentation).includes('Synthetic'),false);
},'kernel');
for(const prose of SYNTHETIC_PROSE) define('E06',`prose substitution ${SYNTHETIC_PROSE.indexOf(prose)}`,()=>{
  const baseline=assertApproved(inputFor(fixture())),s=fixture();
  for(const d of DIMENSIONS)s.intent.ris[d]=s.intent.cycles[0].cie[d]=prose+d;
  for(const f of ['currentState','events','external'])s.intent.cycles[0].oop[f]=prose;
  s.intent.cycles[0].iep.actions=prose;
  const out=assertApproved(inputFor(s));assert.deepStrictEqual(out,baseline);
  assert.equal(JSON.stringify(out).includes(prose),false);
});
for(const prose of SYNTHETIC_PROSE.slice(5,7)) define('E07','source instructions cannot change trusted identity or execute',()=>{
  const s=fixture();s.intent.ris.primary=s.intent.cycles[0].cie.primary=prose;s.intent.cycles[0].oop.external=prose;
  const runtime=privateRuntime(),out=assertApproved(inputFor(s),runtime.api);
  assert.equal(out.presentation.primary.insight.templateId,ID.E03);assert.equal(runtime.context.syntheticExecuted,undefined);assert.deepStrictEqual(runtime.state.logs,[]);
});
for(const place of ['request','plan','component']) define('E07',`caller registry/approval injection at ${place} is rejected`,()=>{
  const input=inputFor(fixture()),target=place==='request'?input:place==='plan'?input.presentationPlan:input.presentationPlan.components[0];
  target.registry={entries:[{templateId:'test.arbitrary',safetyClassification:'ALLOW'}]};target.safetyClassification='ALLOW';suppressed(input,'UNKNOWN');
});
for(const [field,invalids] of [
  ['iep.practical',['6',null,true,NaN,Infinity,-Infinity,-1,11]],
  ['iep.hours',['3',null,NaN,Infinity,-0.1,168.25]],
  ['iep.frequency',['freq6',2,null]],['oop.direction',['forward',1,null]]
]) for(const value of invalids) define('E08',`dependent ${field} rejects ${String(value)}`,()=>{
  const input=inputFor(fixture()),[container,key]=field.split('.');input.sourceSnapshot.intent.cycles[0][container][key]=value;
  suppressed(input,'UNKNOWN');
});
for(const field of ['iep.practical','iep.hours','iep.frequency','oop.direction']) define('E08',`dependent missing ${field}`,()=>{
  const input=inputFor(fixture()),[container,key]=field.split('.');delete input.sourceSnapshot.intent.cycles[0][container][key];suppressed(input,'UNKNOWN');
});
for(const [rating,hours] of [[0,0],[10,168],[6.75,0.125]]) define('E08',`valid exact boundary/decimal ${rating}/${hours}`,()=>{
  const s=fixture();s.intent.cycles[0].iep.practical=rating;s.intent.cycles[0].iep.hours=hours;
  const out=assertApproved(inputFor(s));assert.equal(out.presentation.primary.insight.bindings.practical,rating);assert.equal(out.presentation.primary.insight.bindings.hours,hours);
});
for(const category of [3,9]) define('E09',`known current category ${category} remains just an index`,()=>{
  const s=fixture();s.intent.cycles[0].iep.emotion=EMOTION_LABELS.en[category];const out=assertApproved(inputFor(s));assert.equal(out.presentation.primary.insight.bindings.categoryIndex,category);
});
define('E09','unmapped label uses predetermined category-unavailable current facts',()=>{
  const input=inputFor(reflectionFixture('B5',false)),out=assertApproved(input);assert.equal(out.presentation.primary.insight.templateId,ID.E02);
  assert.equal(Object.hasOwn(out.presentation.primary.insight.bindings,'categoryIndex'),false);
});
for(const status of ['ambiguous','unmapped']) define('E09',`negative descriptor with ${status} mapping cannot bind known category`,()=>{
  const input=inputFor(fixture());Object.assign(input.engineResult.primary.interpretation.data.emotion,{status,category:null});
  const evidence=input.engineResult.primary.evidence.find(e=>e.path.endsWith('.iep.emotion'));evidence.derivedValue={status,category:null};suppressed(input,'UNKNOWN');
});
define('E09','frozen dictionary has no actual ambiguous label to manufacture',()=>{
  for(const label of new Set(Object.values(EMOTION_LABELS).flat()))assert.equal(mapEmotion(label).status,'known');
},'fixture');
for(const [name,change] of [
  ['role',c=>{c.role='WHY';}],['surface',c=>{c.surface='SECONDARY';}],['rule',c=>{c.ruleId='PRA-01';}],
  ['key',c=>{c.engineSelector='analysis.REF-01.other';}],['version',c=>{c.templateVersion=2;}],
  ['metric',c=>{c.engineSelector={key:'analysis.REF-01.title',metric:'hours'};}],
  ['dimension',c=>{c.engineSelector={key:'analysis.REF-01.title',dimension:'scope'};}]
]) define('E10',`wrong exact tuple ${name}`,()=>suppressed(changedComponent(change),'UNKNOWN'));
define('E10','known forbidden secondary focus dominates unknown tuple',()=>{
  const input=addFocus(inputFor(fixture()),{surface:'SECONDARY'});input.presentationPlan.components.at(-1).templateVersion=99;suppressed(input,'HOLD');
});
define('E11','CTX-02 facts allowed but attempted own primary focus is HOLD',()=>{
  const input=inputFor(fixture());assertApproved(input);suppressed(addFocus(clone(input),{ruleId:'CTX-02',key:FOCUS_KEYS[20]}),'HOLD','FORBIDDEN_RULE_NEXT_FOCUS');
});
define('E11','CTX-02 secondary own focus is HOLD for complete bundle',()=>suppressed(addFocus(inputFor(fixture()),{surface:'SECONDARY',ruleId:'CTX-02',key:FOCUS_KEYS[20]}),'HOLD'));
define('E12','COND-01 notice allowed but own focus is HOLD',()=>{
  const input=inputFor(fixture());assertApproved(input);suppressed(addFocus(clone(input),{ruleId:'COND-01',key:FOCUS_KEYS[21]}),'HOLD','FORBIDDEN_RULE_NEXT_FOCUS');
});
define('E12','negative descriptor cannot promote COND-01 candidate',()=>{
  const input=inputFor(fixture());Object.assign(input.engineResult.primary,{ruleId:'COND-01',candidateId:'COND-01',titleKey:'analysis.COND-01.title',eligible:false,nextFocus:null});
  suppressed(input,'UNKNOWN');
});
for(const change of [tuple=>{delete tuple.status;},tuple=>{tuple.conditionSufficiency='available';},tuple=>{tuple.ruleId='CTX-02';}]) define('E12','damaged capability cannot select capability-absent manifest',()=>{
  const input=inputFor(fixture());change(input.engineResult.capabilities.VAQUQA);suppressed(input,'UNKNOWN');
});
for(const [name,change] of [
  ['missing rule identity',c=>{delete c.ruleId;}],['missing candidate identity',c=>{delete c.candidateId;}],
  ['invented candidate rule',c=>{c.ruleId='COND-01';}],['selected primary candidate',c=>{c.candidateId='REF-01';}],
  ['wrong capability path',c=>{c.engineSelector.capabilityPath='capabilities.KAEKITO';}],
  ['wrong capability rule',c=>{c.engineSelector.ruleId='CTX-02';}],
  ['wrong capability status',c=>{c.engineSelector.status='available';}],
  ['wrong capability value',c=>{c.engineSelector.conditionSufficiency='available';}],
  ['unregistered path field',c=>{c.engineSelector.path=c.engineSelector.capabilityPath;delete c.engineSelector.capabilityPath;}],
  ['capability leaf binding',c=>{c.bindings.push(binding('status','CAPABILITY_GAP'));}]
]) define('E12',`exact E30 ComponentRequest rejects ${name}`,()=>{
  const input=inputFor(fixture());change(input.presentationPlan.components.find(c=>c.slot===WC));suppressed(input,'UNKNOWN');
});
for(const fixed of PRIVATE_FIXTURES) for(const optional of [false,true]) define('E13',`${fixed.allowedPresentationFunction}, optional=${optional}`,()=>{
  const input=inputFor(fixture());input.sourceSnapshot.intent.ris.primary=input.sourceSnapshot.intent.cycles[0].cie.primary='Synthetic opaque objective';
  // Recompute only in test fixture preparation, before the safety call.
  const actual=inputFor(input.sourceSnapshot);if(optional)actual.presentationPlan.components[0].optional=true;
  privateProhibited(fixed,actual);
},'kernel');
for(const verb of ['OBSERVE','REVIEW','COMPARE','CLARIFY','RECORD']) define('E14',`${verb} does not sanitize forbidden action creation`,()=>{
  const runtime=privateRuntime([{target:ID.E03,allowedPresentationFunction:verb,safetyClassification:'HOLD',
    reviewedObjectFunction:'ACTION_PRESCRIPTION',canonicalText:'Private fixed future-action object fixture.'}]);
  suppressed(inputFor(fixture()),'HOLD',null,runtime.api);
},'kernel');
const RETROSPECTIVE_FIXTURE=freeze({fixtureId:'test.kernel.retrospective.record',target:ID.E03,
  role:'NEXT_FOCUS',allowedPresentationFunction:'RECORD',safetyClassification:'ALLOW',
  allowedBindings:[],allowedSourcePaths:[],
  manifestMembership:[{manifestId:'test.kernel.manifest.retrospectiveRecord',slot:'primary.nextFocus'}],
  canonicalText:'If you wish, record an event that has already occurred and is already known to you.'});
function privateRetrospectiveInput() {
  const input=inputFor(fixture()),focus=clone(input.presentationPlan.components[0]);
  Object.assign(focus,{componentId:'primary.nextFocus',slot:'primary.nextFocus',role:'NEXT_FOCUS',bindings:[]});
  input.presentationPlan.components.push(focus);return input;
}
function privateRetrospectiveComponent(runtime,input) {
  const transferred=runtime.context.__copyIntoRealm(input),before=objectState(transferred);
  runtime.context.__kernelInput=transferred;
  // Prepare a fixed trusted private manifest; the evaluator is the same real
  // component kernel used by the public API. No public catalog/layout is extended.
  const out=vm.runInContext(`(()=>{
    const {sourceSnapshot,engineResult,presentationPlan}=__kernelInput;
    const context=selectMapping(candidateContext(sourceSnapshot,engineResult,'PRIMARY'));
    const manifest=freezeTrusted({manifestId:'test.kernel.manifest.retrospectiveRecord',manifestVersion:1,
      policyVersion:SAFETY_VERSION,registryVersion:REGISTRY_VERSION,slots:['primary.nextFocus'],declaredAbsentSlots:[]});
    return evaluateTrustedComponent(presentationPlan.components.find(c=>c.slot==='primary.nextFocus'),
      {PRIMARY:context},manifest,engineResult,entryByRow('E03'));
  })()`,runtime.context);
  assert.deepStrictEqual(objectState(transferred),before);
  assertNoAliases(out,transferred,runtime.api.TEMPLATE_REGISTRY);
  assert.equal(out.slot,'primary.nextFocus');assert.equal(out.role,'NEXT_FOCUS');
  assert.deepStrictEqual(normalized(out.bindings),{});
  return out;
}
define('E15','private registered retrospective RECORD component can ALLOW; product layout remains fixed',()=>{
  const runtime=privateRuntime([RETROSPECTIVE_FIXTURE]),input=privateRetrospectiveInput();
  privateRetrospectiveComponent(runtime,input);
  const out=assess(input,runtime.api);
  // The real factual manifests never register a product focus. This private
  // component verdict cannot become partial public release or a sixth manifest.
  assertFallback(out,'UNKNOWN');
},'kernel');
define('E15','perform-first RECORD function is trusted HOLD',()=>{
  const fixed={...RETROSPECTIVE_FIXTURE,allowedPresentationFunction:'ACTION_PRESCRIPTION',safetyClassification:'HOLD',canonicalText:'Private fixed action-creation fixture.'};
  const runtime=privateRuntime([fixed]);suppressed(privateRetrospectiveInput(),'HOLD',null,runtime.api);
},'kernel');
define('E16','dropping a failed required Why cannot release the bundle',()=>{
  const input=inputFor(fixture());input.presentationPlan.components[1].templateId='test.unapproved';suppressed(input,'UNKNOWN');
  input.presentationPlan.components.splice(1,1);suppressed(input,'UNKNOWN','INVALID_MANIFEST');
});
define('E16','optional unregistered focus fails; absent-focus manifest was fixed before evaluation',()=>{
  const input=addFocus(inputFor(fixture()),{});input.presentationPlan.components.at(-1).optional=true;suppressed(input,'UNKNOWN');
  input.presentationPlan.components.pop();input.presentationPlan.declaredAbsentSlots=[];suppressed(input,'UNKNOWN','INVALID_MANIFEST');
  // A newly evaluated exact frozen plan can succeed without remembering earlier
  // calls. Safety v1 is stateless; it cannot prohibit a separately valid plan.
  assertApproved(inputFor(fixture()));
});
define('E17','legitimate predetermined absent slots accepted',()=>{
  for(const s of [reflectionFixture('B4'),fixture()]){
    const input=inputFor(s),out=assertApproved(input);assert.equal(out.presentation.primary.nextFocus,null);
    assert.deepStrictEqual(input.presentationPlan.declaredAbsentSlots,MANIFESTS[input.engineResult.secondary?4:3].declaredAbsentSlots);
  }
});
for(const index of [1,2]) define('E17',`MF${index} cannot be manufactured by deleting capability`,()=>{
  const input=inputFor(index===1?reflectionFixture('B4'):fixture());delete input.engineResult.capabilities.VAQUQA;
  input.presentationPlan.manifestId=MANIFESTS[index].manifestId;input.presentationPlan.declaredAbsentSlots=clone(MANIFESTS[index].declaredAbsentSlots);
  input.presentationPlan.components=input.presentationPlan.components.filter(c=>c.slot!==WC);suppressed(input,'UNKNOWN');
});
for(const suffix of ['title','why.values','qualifier']) define('E18',`unknown secondary ${suffix} suppresses approved primary`,()=>{
  const input=inputFor(fixture()),slot=`secondary.${suffix}`;
  if(suffix==='why.values')input.presentationPlan.components.find(c=>c.slot===slot).templateId='test.unknown.secondaryWhy';
  else input.presentationPlan.components.push({componentId:slot,surface:'SECONDARY',role:'WHY',slot,templateId:'test.unknown.secondaryAuxiliary',templateVersion:1,ruleId:'CTX-02',candidateId:'CTX-02',engineSelector:'analysis.CTX-02.title',bindings:[]});
  suppressed(input,'UNKNOWN');
});
for(const slot of ['primary.interpretation','primary.why.values','primary.caption']) define('E19',`private allowed focus plus forbidden ${slot} cannot leak`,()=>{
  const fixed={target:ID.E27,safetyClassification:'HOLD',allowedPresentationFunction:'CAUSAL_CLAIM',canonicalText:'Private fixed forbidden explanation fixture.'};
  const runtime=privateRuntime([RETROSPECTIVE_FIXTURE,fixed]),input=privateRetrospectiveInput();
  privateRetrospectiveComponent(runtime,input);
  if(slot!=='primary.why.values'){
    const c=clone(input.presentationPlan.components[1]);Object.assign(c,{componentId:slot,slot,role:slot==='primary.interpretation'?'INTERPRETATION':'WHY'});
    input.presentationPlan.components.push(c);
  }
  const out=suppressed(input,'HOLD',null,runtime.api);assert.equal(out.presentation.primary,null);
},'kernel');

for(const surface of ['tooltip','hiddenExplanation','accessibilityText']) define('E20',`unaccounted ${surface} blocks complete public release`,()=>{
  const input=inputFor(fixture());input.presentationPlan[surface]='Synthetic independently authored surface';suppressed(input,'UNKNOWN');
});
define('E20','known forbidden hidden function dominates incomplete plan',()=>{
  const runtime=privateRuntime([{target:ID.E27,safetyClassification:'HOLD',allowedPresentationFunction:'DIAGNOSTIC_FRAMING'}]);
  const input=inputFor(fixture());input.presentationPlan.hiddenExplanation='Synthetic unaccounted hidden surface';input.presentationPlan.components.pop();
  suppressed(input,'HOLD',null,runtime.api);
},'kernel');
for(const [status,make] of [['MIXED',()=>mixedFixture('practical_hours_opposed')],['INSUFFICIENT',()=>reflectionFixture('B1')]]) define('E21',`${status} observations retain status evidence and limitations`,()=>{
  const input=inputFor(make()),before=clone(input.engineResult),out=assertApproved(input);assert.equal(out.engineStatus,status);
  assert.deepStrictEqual(input.engineResult,before);assert.equal(input.engineResult.causality,'not_determined');
  assert.ok(input.engineResult.limitations.includes('self_reported'));
});
for(const [name,make] of [['no intent',()=>({version:'0.1.0',intent:null})],['no cycles',()=>fixture(0)],
  ['unsupported source',()=>({version:'0.2.0',intent:null})]]) define('E22',`${name}: no vacuous ALLOW`,()=>suppressed(inputFor(make()),'UNKNOWN'));
for(const plan of [null,{},[],{components:[]},undefined]) define('E22',`empty or malformed analytical plan ${JSON.stringify(plan)}`,()=>{
  const input=inputFor(fixture());input.presentationPlan=clone(plan);suppressed(input,'UNKNOWN');
});
define('E22','private damaged entry still exposes independent fixed fallback',()=>{
  const runtime=privateRuntime([{target:ID.E03,remove:['canonicalText','allowedBindings']}]);const out=suppressed(inputFor(fixture()),'UNKNOWN',null,runtime.api);
  assert.equal(out.presentation.fallback.templateId,FALLBACK_ID);
},'kernel');
define('E22','known secondary-role HOLD dominates unavailable registry',()=>{
  const runtime=privateRuntime([],{registryUnavailable:true});
  suppressed(addFocus(inputFor(fixture()),{surface:'SECONDARY'}),'HOLD',null,runtime.api);
},'kernel');
for(const [name,make] of [
  ['explicit revision',()=>revision()],
  ['unsure boundary',()=>{const s=fixture(3);s.intent.cycles[1].intentional='unsure';return s;}],
  ['changed scope',()=>{const s=fixture(3);s.intent.cycles[1].cie.scope=s.intent.cycles[2].cie.scope='Synthetic new scope';return s;}],
  ['changed criteria',()=>{const s=fixture(3);s.intent.cycles[1].cie.success=s.intent.cycles[2].cie.success='Synthetic new criteria';return s;}],
  ['decision patch conflict',()=>mixedFixture('decision_patch_conflict')]
]) define('E23',`${name}: no patch application or historical RIS creation`,()=>{
  const input=inputFor(make()),before=clone(input),out=assertApproved(input);assert.deepStrictEqual(input,before);
  assert.ok(input.engineResult.segmentation.boundaries.length>0);
  assert.ok(input.engineResult.primary.limitations.includes('historical_RIS_unavailable'));
  for(const c of approvedComponents(out.presentation))assert.equal(Object.hasOwn(c.bindings,'historicalRIS'),false);
});
define('E24','range limits units and scopes stay distinct',()=>{
  const s=fixture(),c=s.intent.cycles[0];c.iep.practical=0;c.iep.hours=168;c.iep.frequency='freq5';c.oop.direction='toward';c.oop.achievement=10;
  const out=assertApproved(inputFor(s)),bindings=out.presentation.primary.insight.bindings;
  assert.equal(bindings.practical,0);assert.equal(bindings.hours,168);assert.equal(bindings.frequency,'freq5');assert.equal(bindings.direction,'toward');
  assert.deepStrictEqual(Object.keys(bindings).sort(),['desire','belief','mental','practical','intensity','achievement','hours','frequency','direction','categoryIndex'].sort());
  assert.equal(canonicalTextFor(out.presentation.primary.insight).includes('past seven days'),true);
});
define('E24','ordinal frequency retains enum pair and sign without arithmetic score',()=>{
  const out=assertApproved(inputFor(vector(fixture(2),'iep.frequency',['freq0','freq5']))),b=out.presentation.primary.insight.bindings;
  assert.deepStrictEqual(normalized(b),{before:'freq0',after:'freq5',ordinalChange:'increased'});
});
for(const bases of [['direct'],['documented'],['otherPerson'],['subjective'],['direct','direct'],['otherPerson','documented']]) define('E25',`reported basis ${bases.join('/')}: selections are unverified`,()=>{
  const s=vector(vector(vector(pattern(),'oop.achievement',[8,9,10]),'oop.direction',['toward','toward','toward']),'oop.evidence',Array.from({length:3},()=>bases));
  const input=inputFor(s),out=assertApproved(input);assert.equal(input.engineResult.primary.ruleId,'OUT-01');
  assert.deepStrictEqual(normalized(out.presentation.primary.insight.bindings.bases),Array.from({length:3},()=>[...new Set(bases)]));
  assert.equal(input.engineResult.capabilities.LIPHOZEI.verifiedSuccess,'unavailable');assert.deepStrictEqual(s.intent.cycles[0].oop.evidence,bases);
});
for(const bases of [['direct','insufficient'],['other'],['invalid']]) define('E25',`dependent outcome cannot upgrade ${bases.join('/')}`,()=>{
  const s=vector(vector(pattern(),'oop.achievement',[2,3,4]),'oop.direction',['toward','toward','toward']),input=inputFor(s);
  input.sourceSnapshot.intent.cycles[1].oop.evidence=bases;suppressed(input,'UNKNOWN');
});
for(const [status,make,options] of STATUS_INPUTS) define('E26',`${status}: same exact fallback and original verdict`,()=>{
  const input=inputFor(make(),options),original=assess(input);
  if(original.verdict!=='ALLOW')assertFallback(original,original.verdict);
  const entry=registryEntries(implementation.TEMPLATE_REGISTRY).find(e=>e.templateId===FALLBACK_ID);
  assert.equal(entry.canonicalText,FALLBACK_EN);assert.deepStrictEqual(normalized(entry.approvedVariants),{});
  assert.ok(boundaryText.includes(FALLBACK_RU),'exact approved RU reference remains frozen, not newly compiled');
  const unknown=clone(input);unknown.presentationPlan.components.push({componentId:'primary.caption',surface:'PRIMARY',role:'WHY',slot:'primary.caption',templateId:'test.unknown',templateVersion:1,bindings:[]});
  const out=assess(unknown);assertFallback(out,status==='SAFETY_HOLD'?'HOLD':'UNKNOWN');assert.equal(out.engineStatus,status);
});
const EXECUTABLE_VARIANTS = freeze(['source getter','component getter','callback selector','cyclic source','custom prototype','function field','symbol field']);
for(const name of EXECUTABLE_VARIANTS) define('E27',`${name} is rejected without executable traversal`,()=>{
  const input=inputFor(fixture());let calls=0;
  const executable=()=>{calls++;throw new Error('SYNTHETIC_EXECUTABLE_SECRET');};
  if(name==='source getter')Object.defineProperty(input.sourceSnapshot.intent.cycles[0].iep,'desire',{enumerable:true,configurable:true,get:executable});
  if(name==='component getter')Object.defineProperty(input.presentationPlan.components[0],'role',{enumerable:true,configurable:true,get:executable});
  if(name==='callback selector')input.presentationPlan.components[0].bindings[0].selector=executable;
  if(name==='cyclic source')input.sourceSnapshot.syntheticCircular=input.sourceSnapshot;
  if(name==='custom prototype')Object.setPrototypeOf(input.presentationPlan.components[0],{syntheticInherited:1});
  if(name==='function field')input.sourceSnapshot.syntheticCallback=executable;
  if(name==='symbol field')input.presentationPlan.components[0].syntheticSymbol=Symbol('synthetic');
  const out=suppressed(input,'UNKNOWN');assert.equal(calls,0);assert.equal(JSON.stringify(out).includes('SYNTHETIC_EXECUTABLE_SECRET'),false);
});
for(const [name,change] of [
  ['duplicate component id',p=>{p.components[1].componentId=p.components[0].componentId;}],
  ['wrong component order',p=>{[p.components[0],p.components[1]]=[p.components[1],p.components[0]];}],
  ['extra unregistered slot',p=>{const c=clone(p.components[1]);c.slot=c.componentId='primary.tooltip';p.components.push(c);} ],
  ['unsupported component field',p=>{p.components[0].syntheticExtra=1;}],
  ['conflicting absence',p=>{p.declaredAbsentSlots.push('primary.insight');}],
  ['wrong absent ordering',p=>{p.declaredAbsentSlots.reverse();}],
  ['duplicate absent slot',p=>{p.declaredAbsentSlots.push(p.declaredAbsentSlots[0]);}],
  ['wrong manifest version',p=>{p.manifestVersion=2;}],
  ['wrong manifest id',p=>{p.manifestId='test.manifest';}],
  ['missing required Why',p=>{p.components.splice(2,1);}]
]) define('E28',name,()=>{const input=inputFor(fixture());change(input.presentationPlan);suppressed(input,'UNKNOWN');});
define('E28','known forbidden role survives duplicate and invalid slot layout',()=>{
  const input=addFocus(inputFor(fixture()),{surface:'SECONDARY'});input.presentationPlan.components[0].componentId='duplicate';input.presentationPlan.components[1].componentId='duplicate';suppressed(input,'HOLD');
});
function bindingNames(entry) {
  if(Array.isArray(entry.allowedBindings))return entry.allowedBindings.map(b=>typeof b==='string'?b:b.name);
  return Object.keys(entry.allowedBindings || {});
}
define('E29','actual registry exact identities bodies roles functions and schemas',()=>{
  assert.equal(implementation.SAFETY_VERSION,POLICY);assert.equal(implementation.REGISTRY_VERSION,REGISTRY);
  assert.equal(typeof implementation.assessPresentation,'function');
  const entries=registryEntries(implementation.TEMPLATE_REGISTRY);assert.equal(entries.length,30);
  assert.equal(new Set(entries.map(e=>`${e.templateId}/${e.templateVersion}/${e.role}`)).size,30);
  assert.deepStrictEqual(entries.map(e=>e.templateId).sort(),EXPECTED_ENTRIES.map(e=>e.templateId).sort());
  for(const expected of EXPECTED_ENTRIES){
    const actual=entries.find(e=>e.templateId===expected.templateId);
    for(const key of ['templateVersion','role','allowedPresentationFunction','safetyClassification','canonicalText','manifestVersion'])assert.equal(actual[key],expected[key]);
    assert.deepStrictEqual(normalized(actual.approvedVariants),{});assert.deepStrictEqual(normalized(actual.allowedSurfaces),expected.allowedSurfaces);
    for(const key of ['allowedRuleIds','allowedBindings','allowedSourcePaths','engineMappings','requiredEvidence'])assert.ok(Object.hasOwn(actual,key),`entry requires ${key}`);
    const placeholders=[...actual.canonicalText.matchAll(/\{([A-Za-z]+)\}/g)].map(m=>m[1]);
    assert.deepStrictEqual(bindingNames(actual).sort(),placeholders.sort(),'closed bindings must equal exact body placeholders');
    for(const object of objectSet(actual))assert.equal(Object.isFrozen(object),true);
  }
  assert.equal(entries.filter(e=>e.role==='INSIGHT').length,25);assert.equal(entries.filter(e=>e.role==='WHY').length,4);
  assert.equal(entries.filter(e=>e.role==='FALLBACK').length,1);assert.equal(entries.filter(e=>e.role==='NEXT_FOCUS'||e.role==='INTERPRETATION').length,0);
  assert.equal(entries.filter(e=>e.safetyClassification==='ALLOW').length,30);
  const fallback=entries.find(e=>e.templateId===FALLBACK_ID);
  assert.deepStrictEqual(normalized(fallback.allowedRuleIds),[]);assert.deepStrictEqual(bindingNames(fallback),[]);
  assert.deepStrictEqual(normalized(fallback.allowedSourcePaths),[]);assert.deepStrictEqual(normalized(fallback.engineMappings),[]);
});
define('E29','every compiled mapping matches the closed frozen tuple inventory',()=>{
  const expected=new Map();
  const add=selector=>expected.set(JSON.stringify(selector),selector);
  for(const descriptor of BANK) {
    const result=analyze(descriptor.make());for(const candidate of [result.primary,result.secondary].filter(Boolean))add(selectorFor(candidate));
  }
  // These four catalog tuples are unreachable selected REF states; retaining
  // their registration never authorizes promotion over QUAL-01/REV-01.
  for(const branch of ['B1','B2'])for(const variant of ['CURRENT_CATEGORY_UNAVAILABLE','CURRENT_KNOWN_CATEGORY'])
    add({ruleId:'REF-01',candidateId:'REF-01',key:'analysis.REF-01.title',metric:null,dimension:null,branch,variant});
  assert.equal(expected.size,52);
  const entries=registryEntries(implementation.TEMPLATE_REGISTRY);
  const why=entries.find(e=>e.templateId===ID.E28);assert.equal(why.engineMappings.length,52);
  const tuples=[...expected.values()];
  for(const entry of entries) {
    if(entry.role==='FALLBACK')continue;
    if(entry.templateId===ID.E30) {
      assert.deepStrictEqual(normalized(entry.engineMappings),[{mappingId:'MC',selector:capabilityComponent().engineSelector,allowedSurfaces:['PRIMARY']}]);
      continue;
    }
    const row=EXPECTED_ENTRIES.find(e=>e.templateId===entry.templateId).row;
    const wanted=tuples.filter(selector=>entry.allowedRuleIds.includes(selector.ruleId)&&
      (row!=='E02'||selector.variant==='CURRENT_CATEGORY_UNAVAILABLE')&&
      (row!=='E03'||selector.variant==='CURRENT_KNOWN_CATEGORY')&&
      (row!=='E14'||selector.branch==='known_non_other')&&(row!=='E15'||selector.branch==='other'));
    assert.equal(entry.engineMappings.length,wanted.length);
    for(const tuple of wanted) {
      const actual=entry.engineMappings.find(m=>JSON.stringify(normalized(m.selector))===JSON.stringify(tuple));assert.ok(actual);
      assert.equal(actual.mappingId,MAPPING[tuple.ruleId]);
      assert.deepStrictEqual(normalized(actual.selector),tuple);
      assert.deepStrictEqual(normalized(actual.allowedSurfaces),['REF-01','QUAL-01'].includes(tuple.ruleId)?['PRIMARY']:tuple.ruleId==='CTX-02'?['SECONDARY']:['PRIMARY','SECONDARY']);
      assert.equal(actual.fixedFields,FIXED_FIELDS[MAPPING[tuple.ruleId]]);
    }
  }
});
for(const [property,value] of [['body','Synthetic replacement'],['variant','unreviewed-variant'],['templateVersion',2]]) define('E29',`body/variant change cannot reuse approval: ${property}`,()=>suppressed(changedComponent(c=>{c[property]=value;}),'UNKNOWN'));
define('E29','frozen exported entry rejects mutation without changing approval',()=>{
  const entry=registryEntries(implementation.TEMPLATE_REGISTRY).find(e=>e.templateId===ID.E03),before=objectState(entry);
  assert.throws(()=>{entry.canonicalText='Synthetic replacement';},TypeError);assert.deepStrictEqual(objectState(entry),before);assertApproved(inputFor(fixture()));
});
for(const locale of [...Object.keys(EMOTION_LABELS),'unknown-variant','']) define('E30',`canonical identity across ${locale || 'missing'} and runtime changes`,()=>{
  const input=inputFor(fixture()),baseline=assertApproved(input);input.sourceSnapshot.lang=locale;input.sourceSnapshot.presentationPreferences={language:locale};
  const out=assertApproved(input);assert.deepStrictEqual(out,baseline);
  for(const component of approvedComponents(out.presentation))assert.equal(canonicalTextFor(component,implementation,locale),canonicalTextFor(component,implementation,'en'));
});
define('E31','all IO storage telemetry and result-persistence interfaces are unused',()=>{
  const runtime=privateRuntime([],{environment:[...NETWORK_APIS,...STORAGE_APIS,'sendBeacon','analytics','telemetry']});
  const good=inputFor(fixture());assertApproved(good,runtime.api);
  suppressed(addFocus(clone(good),{surface:'SECONDARY'}),'HOLD',null,runtime.api);
  const unknown=clone(good);unknown.presentationPlan.components[0].templateId='test.unknown';suppressed(unknown,'UNKNOWN',null,runtime.api);
  assert.deepStrictEqual(runtime.state.attempts,[]);assert.deepStrictEqual(runtime.state.logs,[]);assert.equal(runtime.state.analysisRuns,0);
});
define('E32','frozen file byte identities and production CACHE',()=>{
  for(const [file,hash] of Object.entries(HASHES))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT,file))).digest('hex'),hash,file);
  assert.ok(fs.readFileSync(path.join(ROOT,'sw.js'),'utf8').includes('pheisiraetha-v16'));
},'fixture');
define('E32','no engine rerun no source/plan aliases and no injected approval',()=>{
  const runtime=privateRuntime(),input=freeze(inputFor(fixture()));assertApproved(input,runtime.api);
  const unknown=clone(input);unknown.engineResult.safety.externalDecision='ALLOW';unknown.presentationPlan.components[0].templateId='test.unapproved';
  suppressed(unknown,'UNKNOWN',null,runtime.api);assert.equal(runtime.state.analysisRuns,0);assert.deepStrictEqual(runtime.state.attempts,[]);
});

define('PRE','all 120 numbered families have real parameterized definitions',()=>{
  assert.deepStrictEqual([...new Set(definitions.map(d=>d.family).filter(f=>f!=='PRE'))].sort(),EXPECTED_FAMILIES.slice().sort());
  for(const family of EXPECTED_FAMILIES)assert.ok(definitions.some(d=>d.family===family&&d.kind!=='fixture'),`${family} must assert the real Safety API or private kernel`);
},'fixture');
define('PRE','pinned oracle contains exact 30 entries and five manifests',()=>{
  assert.equal(EXPECTED_ENTRIES.length,30);assert.equal(bodyRows.length,30);assert.equal(MANIFESTS.length,5);
  assert.equal(new Set(EXPECTED_ENTRIES.map(e=>e.templateId)).size,30);
  assert.equal(EXPECTED_ENTRIES[0].canonicalText,FALLBACK_EN);assert.ok(boundaryText.includes(FALLBACK_RU));
  const manifestRows=tableRows(catalogText,'## 7.','## 8.');
  assert.deepStrictEqual(manifestRows.map(row=>row[0].split(' / ')[1]),MANIFESTS.map(m=>m.manifestId));
  for(const m of MANIFESTS)assert.equal(new Set(m.slots).size,m.slots.length);
},'fixture');
define('PRE','G2 actual selections cover all factual identities E02-E26 plus capability E30',()=>{
  const selected=new Set();for(const descriptor of BANK){const s=descriptor.make(),e=analyze(s);for(const c of [e.primary,e.secondary].filter(Boolean))selected.add(selectedRow(c));}
  assert.deepStrictEqual([...selected].sort(),Array.from({length:25},(_,i)=>'E'+String(i+2).padStart(2,'0')));
  assert.equal(analyze(fixture()).capabilities.VAQUQA.ruleId,'COND-01');
  const coveredRules=new Set(BANK.flatMap(d=>{const e=analyze(d.make());return [e.primary,e.secondary].filter(Boolean).map(c=>c.ruleId);}));
  coveredRules.add('COND-01');assert.deepStrictEqual([...coveredRules].sort(),RULE_IDS.slice().sort());
},'fixture');
define('PRE','G2 reachable manifests and unreachable REF branches are explicit',()=>{
  assert.equal(buildPlan(reflectionFixture('B4'),analyze(reflectionFixture('B4'))).manifestId,MANIFESTS[3].manifestId);
  assert.equal(buildPlan(fixture(),analyze(fixture())).manifestId,MANIFESTS[4].manifestId);
  for(const branch of ['B1','B2'])assert.notEqual(analyze(reflectionFixture(branch)).primary.ruleId,'REF-01');
  // Every nonempty engine path assigns VAQUQA before selecting primary. Its
  // early-return paths have no selected primary. MF1/MF2 are frozen but currently
  // unreachable; deleting capability metadata cannot be a positive fixture.
  const source=fs.readFileSync(path.join(ROOT,'analysis.js'),'utf8');
  assert.ok(source.includes("VAQUQA: { ruleId: 'COND-01', status: 'capability_gap', conditionSufficiency: 'unavailable' }"));
  for(const descriptor of BANK)assert.equal(analyze(descriptor.make()).capabilities.VAQUQA.status,'capability_gap');
},'fixture');
define('PRE','G3 fixed private fixtures are immutable and outside the actual catalog',()=>{
  assert.ok(PRIVATE_FIXTURES.length>=20);for(const f of [...PRIVATE_FIXTURES,RETROSPECTIVE_FIXTURE]){
    assert.equal(Object.isFrozen(f),true);assert.ok(f.fixtureId.startsWith('test.kernel.'));
    assert.ok(!EXPECTED_ENTRIES.some(e=>e.templateId===f.fixtureId));
  }
  assert.equal(Object.isFrozen(TRIPLES),true);assert.equal(TRIPLES.length,27);
  assert.equal(new Set(TRIPLES.map(row=>row[0])).size,27);
},'fixture');
define('PRE','exact source version and frozen Phase 2A gates remain unchanged',()=>{
  assert.equal(engine.SOURCE_VERSION,'0.1.0');assert.equal(engine.ENGINE_VERSION,ENGINE_REFERENCE.engineVersion);
  assert.equal(engine.HEURISTICS.minimumSpacing,604800000);assert.equal(engine.HEURISTICS.maximumGap,2419200000);
  assert.equal(engine.HEURISTICS.maximumObservations,5);assert.equal(engine.HEURISTICS.largeRatingStep,4);
  assert.equal(engine.HEURISTICS.lowRatingMaximum,3);assert.equal(engine.HEURISTICS.notableRatingDelta,2);
  assert.equal(engine.HEURISTICS.notableHoursDelta,1);assert.equal(Object.isFrozen(engine.HEURISTICS),true);
  assert.equal(Object.keys(EMOTION_LABELS).length,31);
},'fixture');
define('E29','actual compiled five-manifest inventory through private read-only metadata exposure',()=>{
  const runtime=privateRuntime(),found=new Map();
  for(const object of objectSet([runtime.api,...runtime.state.tables])){
    const id=Object.getOwnPropertyDescriptor(object,'manifestId')?.value;
    if(typeof id==='string'&&id.startsWith('safety.manifest.'))found.set(id,object);
  }
  assert.deepStrictEqual([...found.keys()].sort(),MANIFESTS.map(m=>m.manifestId).sort());
  for(const expected of MANIFESTS){const actual=found.get(expected.manifestId);assert.equal(actual.manifestVersion,1);assert.deepStrictEqual(normalized(actual.declaredAbsentSlots),expected.declaredAbsentSlots);}
});

function runSuite() {
  const counts={definitions:definitions.length,implementedFamilies:EXPECTED_FAMILIES.length,passed:0,failed:0,pending:0,executedAssertions:0,
    kinds:Object.fromEntries(['fixture','public','kernel'].map(kind=>[kind,definitions.filter(d=>d.kind===kind).length]))};
  if(process.argv.includes('--counts-only')){process.stdout.write(JSON.stringify(counts,null,2)+'\n');return;}
  const families=new Map();
  for(const definition of definitions){
    if(!families.has(definition.family))families.set(definition.family,{pass:0,fail:0,pending:0,assertions:0});
    const tally=families.get(definition.family),start=assertionCount;
    if(definition.kind!=='fixture'&&!implementation){counts.pending++;tally.pending++;continue;}
    try{definition.fn();counts.passed++;tally.pass++;}
    catch(error){counts.failed++;tally.fail++;process.stderr.write(`FAIL ${definition.family} ${definition.name}\n${error.stack}\n`);}
    tally.assertions+=assertionCount-start;
  }
  counts.executedAssertions=assertionCount;
  if(implementationLoadError){counts.failed++;process.stderr.write('FAIL safety.js could not load; integration is blocked by module load failure, not a passing test.\n'+implementationLoadError.stack+'\n');}
  for(const [family,tally] of families){process.stdout.write(`${family}: ${tally.pass} PASS / ${tally.fail} FAIL / ${tally.pending} ${PENDING}; ${tally.assertions} executed assertions\n`);}
  process.stdout.write('PHASE 2B-2C COUNTS '+JSON.stringify(counts)+'\n');
  if(counts.pending)process.stdout.write(`${PENDING}: ${counts.pending} definitions were not executed. No integration PASS is claimed.\n`);
  if(counts.failed)process.exitCode=1;
  else if(counts.pending)process.exitCode=2;
}
if(require.main===module)runSuite();
