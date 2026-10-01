'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { analyze, normalizeText, mapEmotion, parseTimestamp, RULE_IDS, DIMENSIONS, HEURISTICS, EMOTION_LABELS } = require('./analysis.js');
const DAY = 86400000;
const START = Date.parse('2026-09-01T12:00:00.000Z');
const RIS = {
  primary: 'Prepare three short study notes', success: 'Three notes drafted and discussed',
  scope: 'One chosen topic', nonGoals: 'No public publication',
  constraints: 'Use freely available materials', rationale: 'Understand the topic more clearly'
};
const clone = value => structuredClone(value);
function freeze(value) {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}
function fixture(count = 3) {
  return { version: '0.1.0', lang: 'ru', intent: { id: 'synthetic-intent',
    createdAt: '2026-08-31T12:00:00.000Z', ris: clone(RIS),
    cycles: Array.from({length: count}, (_, i) => ({ id: `synthetic-c${i + 1}`,
      createdAt: new Date(START + i * 7 * DAY).toISOString(), cie: clone(RIS),
      iep: { desire: 7, belief: 6, emotion: 'Calm / contentment', emotionIntensity: 4,
        mental: 6, practical: 8, frequency: 'freq2', actions: 'Outlined one note', hours: 3 },
      oop: { currentState: 'One note outlined', achievement: 2, events: 'An outline was created',
        direction: 'none', evidence: ['direct'], external: 'Study partner unavailable this week' },
      intentional: 'no', revision: {} })) } };
}
function vector(raw, path, values) {
  const [container, key] = path.split('.');
  raw.intent.cycles.forEach((c, i) => { c[container][key] = clone(values[i]); });
  return raw;
}
function caseA(count = 3) {
  const raw = fixture(count);
  vector(raw, 'iep.practical', count === 5 ? [9, 9, 8, 7, 6] : count === 4 ? [9, 8, 7, 6] : [8, 7, 6]);
  vector(raw, 'iep.hours', count === 5 ? [5, 4, 3, 2, 1] : count === 4 ? [4, 3, 2, 1] : [3, 2, 1]);
  return raw;
}
const testedRules = new Set();
let runs = 0;
/** Every single engine invocation gets its own deep before/after checks. */
function run(raw, options = {}) {
  const before = clone(raw);
  const jsonBefore = JSON.stringify(raw);
  const result = analyze(raw, options);
  runs++;
  assert.deepStrictEqual(raw, before, 'entire raw snapshot must not mutate');
  assert.deepStrictEqual(raw?.intent?.ris, before?.intent?.ris, 'RIS unchanged');
  assert.deepStrictEqual(raw?.intent?.cycles, before?.intent?.cycles, 'cycles unchanged');
  assert.deepStrictEqual(raw?.intent?.cycles?.map(c => c?.createdAt), before?.intent?.cycles?.map(c => c?.createdAt), 'timestamps unchanged');
  assert.deepStrictEqual(raw?.intent?.cycles?.map(c => c?.revision), before?.intent?.cycles?.map(c => c?.revision), 'revision unchanged');
  assert.deepStrictEqual(raw?.lang, before?.lang, 'legacy language metadata unchanged');
  assert.deepStrictEqual(raw?.presentationPreferences, before?.presentationPreferences, 'language preference untouched');
  assert.equal(JSON.stringify(raw), jsonBefore, 'JSON-compatible state unchanged');
  assert.ok(result.primary === null || result.primary.nextFocus?.releaseStatus === 'NOT_RELEASED_TO_USER');
  assert.ok(result.secondary === null || result.secondary.nextFocus === null, 'secondary cannot recommend');
  assert.ok(!Object.hasOwn(raw?.intent || {}, 'analysis'));
  assert.equal(result.causality, 'not_determined');
  assert.ok(result.limitations.includes('rating_confirmation_unrecorded'));
  for (const evaluation of result.ruleEvaluations) testedRules.add(evaluation.ruleId);
  return result;
}
function evaluation(result, id) {
  const found = result.ruleEvaluations.find(r => r.candidateId === id || r.ruleId === id);
  assert.ok(found, `missing evaluation ${id}`);
  return found;
}
function eligible(result, id) { return evaluation(result, id).eligible; }
function suppression(result, id) {
  return result.suppressedCandidates.find(c => c.candidateId === id || c.ruleId === id);
}
function hasReason(result, reason) {
  return JSON.stringify(result.validation).includes(reason) || result.limitations.includes(reason);
}

test('01 zero cycles: EMPTY without an invented insight', () => {
  for (const raw of [fixture(0), {version: '0.1.0', lang: 'ru', intent: null}]) {
    const out = run(freeze(raw));
    assert.equal(out.status, 'EMPTY');
    assert.equal(out.primary, null);
    assert.equal(out.timeWindow.N_completed, 0);
  }
});
test('02 first completed cycle: REF-01 EARLY_OBSERVATION', () => {
  const out = run(freeze(fixture(1)));
  assert.equal(out.primary.ruleId, 'REF-01');
  assert.equal(out.primary.evidenceLevel, 'EARLY_OBSERVATION');
  assert.equal(out.primary.nextFocus.promptKey, 'analysis.observeOwnCriteriaAgain');
  assert.equal(eligible(out, 'REL-01'), false);
});
test('03 two-cycle increase: exact signed raw delta, COMPARISON', () => {
  const raw = vector(fixture(2), 'iep.practical', [6, 8]);
  const out = run(raw);
  assert.equal(out.primary.candidateId, 'CMP-01:practical');
  assert.equal(out.primary.evidenceLevel, 'COMPARISON');
  assert.equal(out.primary.interpretation.data.delta, 2);
});
test('04 two-cycle decrease: no repeated pattern', () => {
  const out = run(vector(fixture(2), 'iep.practical', [8, 6]));
  assert.equal(out.primary.candidateId, 'CMP-01:practical');
  assert.equal(out.primary.interpretation.data.delta, -2);
  assert.equal(eligible(out, 'PRA-01'), false);
});
test('05 same values: exact same recorded value', () => {
  const out = run(fixture(2));
  assert.equal(out.primary.interpretation.data.changeClass, 'same_recorded_value');
  assert.equal(out.primary.interpretation.data.delta, 0);
});
test('06 decimal small change: no rounding or notable classification', () => {
  const out = run(vector(fixture(2), 'iep.practical', [5.25, 6.75]));
  assert.equal(out.primary.interpretation.data.delta, 1.5);
  assert.equal(out.primary.interpretation.data.changeClass, 'small_recorded_change');
  assert.equal(out.primary.priority.comparisonClass, 'neutral');
});
test('07 exact notable rating threshold is 2 points', () => {
  const out = run(vector(fixture(2), 'iep.practical', [5.5, 7.5]));
  assert.equal(out.primary.priority.comparisonClass, 'notable_recorded_change');
});
test('08 missing practical measurement: independent outcome survives', () => {
  const raw = caseA();
  delete raw.intent.cycles[1].iep.practical;
  const out = run(raw);
  assert.equal(eligible(out, 'PRA-01'), false);
  assert.equal(eligible(out, 'REL-01'), false);
  assert.equal(out.primary.ruleId, 'OUT-02');
  assert.ok(hasReason(out, 'missing_field'));
  assert.equal(Object.hasOwn(raw.intent.cycles[1].iep, 'practical'), false);
});
test('09 invalid numeric values are not coerced, clipped, filled, or rounded', () => {
  for (const value of ['5', null, true, NaN, Infinity, -1, 11]) {
    const raw = caseA();
    raw.intent.cycles[2].iep.practical = value;
    const out = run(raw);
    assert.equal(eligible(out, 'PRA-01'), false);
    assert.equal(eligible(out, 'CMP-01:practical'), false);
    assert.deepStrictEqual(raw.intent.cycles[2].iep.practical, value);
  }
});
test('10 invalid enums disable dependent rules only', () => {
  const raw = caseA();
  raw.intent.cycles[1].oop.direction = 'forward';
  raw.intent.cycles[2].iep.frequency = 'freq6';
  const out = run(raw);
  assert.equal(eligible(out, 'OUT-02'), false);
  assert.equal(eligible(out, 'REL-01'), false);
  assert.equal(eligible(out, 'MEN-02'), false);
  assert.equal(out.primary.ruleId, 'PRA-01');
  assert.ok(hasReason(out, 'invalid_enum'));
});
test('11 duplicate cycle IDs: global traceability hold and no pattern', () => {
  const raw = caseA();
  raw.intent.cycles[1].id = raw.intent.cycles[0].id;
  const out = run(raw);
  assert.equal(out.primary.ruleId, 'QUAL-01');
  assert.equal(out.status, 'INSUFFICIENT');
  assert.ok(hasReason(out, 'duplicate_cycle_id'));
  assert.equal(eligible(out, 'REL-01'), false);
});
test('12 invalid chronology is preserved and never sorted', () => {
  const raw = caseA();
  raw.intent.cycles[1].createdAt = '2026-08-30T12:00:00.000Z';
  const out = run(raw);
  assert.equal(out.primary.ruleId, 'QUAL-01');
  assert.ok(hasReason(out, 'invalid_chronology'));
  assert.equal(eligible(out, 'OUT-02'), false);
  assert.deepEqual(raw.intent.cycles.map(c => c.id), ['synthetic-c1', 'synthetic-c2', 'synthetic-c3']);
});
test('13 overlapping seven-day windows: three completions are one spaced observation', () => {
  const raw = caseA();
  raw.intent.cycles.forEach((c, i) => { c.createdAt = new Date(START + i * 3600000).toISOString(); });
  const out = run(raw);
  assert.equal(out.timeWindow.N_completed, 3);
  assert.equal(out.timeWindow.N_spaced, 1);
  assert.equal(out.primary.evidenceLevel, 'COMPARISON');
  assert.equal(out.timeWindow.excludedCycles.length, 2);
  assert.ok(out.timeWindow.excludedCycles.every(e => e.reason === 'overlapping_7_day_reporting_window'));
  assert.ok(out.primary.limitations.includes('overlapping_reporting_windows'));
});
test('14 long observation gap stops the window at the closest spaced record', () => {
  const raw = caseA();
  raw.intent.cycles[1].createdAt = new Date(START + 29 * DAY).toISOString();
  raw.intent.cycles[2].createdAt = new Date(START + 36 * DAY).toISOString();
  const out = run(raw);
  assert.equal(out.timeWindow.N_spaced, 2);
  assert.ok(out.limitations.includes('long_observation_gap'));
  assert.equal(eligible(out, 'REL-01'), false);
});
test('15 three-cycle trend uses frozen D3 and REPEATED_PATTERN', () => {
  const out = run(caseA());
  assert.equal(out.primary.ruleId, 'REL-01');
  assert.equal(out.primary.evidenceLevel, 'REPEATED_PATTERN');
  assert.deepEqual(out.primary.ruleEvaluation.usedCycleIds, ['synthetic-c1', 'synthetic-c2', 'synthetic-c3']);
});
test('16 four-cycle trend uses latest three and retains fourth guard scope', () => {
  const out = run(caseA(4));
  assert.equal(out.primary.ruleId, 'REL-01');
  assert.equal(out.primary.evidenceLevel, 'REPEATED_PATTERN');
  assert.equal(out.primary.priority.supportingObservations, 4);
  assert.ok(out.primary.ruleEvaluation.excludedCycles.some(e => e.reason === 'four_observation_trend_uses_latest_three_only'));
});
test('17 five-cycle trend uses D5 and CONSISTENT_PATTERN', () => {
  const out = run(caseA(5));
  assert.equal(out.primary.ruleId, 'REL-01');
  assert.equal(out.primary.evidenceLevel, 'CONSISTENT_PATTERN');
  const practical = out.primary.ruleEvaluation.conditions.find(c => c.name === 'down(iep.practical)');
  assert.equal(practical.observed.endpointOrMidpointChange, -2.5);
});
test('18 single large step cannot create a practical pattern', () => {
  for (const values of [[8, 8, 1], [8, 7, 1]]) {
    const out = run(vector(caseA(), 'iep.practical', values));
    assert.equal(eligible(out, 'PRA-01'), false);
    assert.equal(eligible(out, 'REL-01'), false);
    assert.ok(suppression(out, 'PRA-01').reasons.includes('LARGE_STEP_REQUIRES_REPEAT'));
    assert.ok(out.comparisons.find(c => c.metric === 'practical').delta < -4);
  }
});
test('19 intentional revision is a boundary, never DEITHIATHO', () => {
  const raw = caseA();
  const last = raw.intent.cycles[2];
  last.intentional = 'yes'; last.revision = {success: 'Two notes drafted and discussed'};
  raw.intent.ris.success = last.revision.success;
  const out = run(raw);
  assert.equal(out.primary.ruleId, 'REV-01');
  assert.equal(out.primary.concept, 'DEINEIZA');
  assert.deepEqual(out.segmentation.currentSegment, []);
  assert.equal(out.timeWindow.N_spaced, 0);
  assert.equal(eligible(out, 'REL-01'), false);
  assert.equal(out.primary.interpretation.data.beforeValues, 'unavailable');
});
test('20 unsure cycle is excluded from the post-boundary suffix', () => {
  const raw = caseA(4);
  raw.intent.cycles[2].intentional = 'unsure';
  const out = run(raw);
  assert.deepEqual(out.segmentation.currentSegment.map(c => c.cycleId), ['synthetic-c4']);
  assert.equal(eligible(out, 'REL-01'), false);
  assert.ok(out.segmentation.boundaries.some(b => b.reasons.includes('unsure_boundary')));
});
test('21 changed CIE signature starts a new segment with that cycle', () => {
  const raw = caseA();
  raw.intent.cycles[2].cie.primary = 'Draft study summaries';
  const out = run(raw);
  assert.equal(out.primary.ruleId, 'TXT-01');
  assert.equal(out.status, 'LIMITED');
  assert.deepEqual(out.segmentation.currentSegment.map(c => c.cycleId), ['synthetic-c3']);
  assert.equal(out.primary.interpretation.data.semanticMeaning, 'not_determined');
});
test('22 success-criteria wording change blocks goal-specific outcome pattern', () => {
  const raw = caseA();
  raw.intent.cycles[1].cie.success = 'Two study notes reviewed';
  const out = run(raw);
  assert.equal(out.timeWindow.N_spaced, 1);
  assert.equal(eligible(out, 'OUT-02'), false);
  assert.equal(eligible(out, 'REL-01'), false);
});
test('23 scope wording change cannot be skipped across an overlap', () => {
  const raw = caseA(4);
  raw.intent.cycles[1].createdAt = new Date(START + DAY).toISOString();
  raw.intent.cycles[1].cie.scope = 'A different scope description';
  const out = run(raw);
  assert.deepEqual(out.segmentation.currentSegment.map(c => c.cycleId), ['synthetic-c3', 'synthetic-c4']);
  assert.equal(eligible(out, 'REL-01'), false);
});
test('24 decision/patch conflict gets MIX-01 group 1 without patch application', () => {
  const raw = caseA();
  raw.intent.cycles[2].revision = {scope: 'New recorded scope'};
  const out = run(raw);
  assert.equal(out.primary.ruleId, 'MIX-01');
  assert.equal(out.primary.priority.group, 1);
  assert.equal(out.status, 'MIXED');
  assert.ok(out.primary.interpretation.data.triggers.includes('decision_patch_conflict'));
  assert.equal(eligible(out, 'REV-01'), false);
  assert.equal(raw.intent.ris.scope, RIS.scope);
});
test('25 exact default-like profile: possible profile, never an unanswered assertion', () => {
  const raw = fixture();
  raw.intent.cycles.forEach(c => {
    c.iep = {desire: 5, belief: 5, emotion: 'Hope / positive anticipation', emotionIntensity: 5,
      mental: 5, practical: 5, frequency: 'freq2', actions: ' ', hours: 0};
    c.oop = {achievement: 0, direction: 'none', evidence: [], currentState: '', events: '', external: ''};
  });
  const out = run(raw);
  assert.equal(out.primary.ruleId, 'QUAL-01');
  assert.equal(out.status, 'INSUFFICIENT');
  assert.ok(out.primary.limitations.includes('POSSIBLE_UNREVIEWED_DEFAULTS'));
  assert.equal(out.primary.interpretation.data.defaultProfile, 'possible_default_like_recorded_profile');
  assert.equal(eligible(out, 'INT-01'), false);
  assert.equal(eligible(out, 'OUT-02'), false);
});
test('26 practical down / achievement nearby: REL-01, no causal claim', () => {
  assert.equal(run(caseA()).primary.ruleId, 'REL-01');
});
test('27 practical up / achievement up: REL-02 co-change', () => {
  const raw = vector(fixture(), 'iep.practical', [3, 4, 5]);
  vector(raw, 'iep.hours', [1, 2, 3]); vector(raw, 'oop.achievement', [2, 3, 4]);
  vector(raw, 'oop.direction', ['toward', 'toward', 'toward']);
  assert.equal(run(raw).primary.ruleId, 'REL-02');
});
test('28 practical up / achievement down: no invented coherent co-change', () => {
  const raw = vector(fixture(), 'iep.practical', [3, 4, 5]);
  vector(raw, 'iep.hours', [1, 2, 3]); vector(raw, 'oop.achievement', [5, 4, 3]);
  vector(raw, 'oop.direction', ['away', 'away', 'away']);
  const out = run(raw);
  assert.equal(out.primary.ruleId, 'OUT-01');
  assert.equal(eligible(out, 'REL-02'), false);
  assert.equal(out.primary.interpretation.data.direction, 'decreased');
});
test('29 practical down / achievement up: no manifestation inference', () => {
  const raw = caseA();
  vector(raw, 'oop.achievement', [2, 3, 4]); vector(raw, 'oop.direction', ['toward', 'toward', 'toward']);
  const out = run(raw);
  assert.equal(out.primary.ruleId, 'OUT-01');
  assert.equal(eligible(out, 'REL-01'), false);
  assert.equal(eligible(out, 'REL-02'), false);
});
test('30 practical and hours opposed: MIXED, both separate vectors', () => {
  const out = run(vector(caseA(), 'iep.hours', [1, 2, 3]));
  assert.equal(out.primary.ruleId, 'MIX-01');
  assert.equal(out.status, 'MIXED');
  assert.ok(out.primary.interpretation.data.triggers.includes('practical_hours_opposed'));
  assert.deepEqual(out.primary.interpretation.data.practical, [8, 7, 6]);
  assert.deepEqual(out.primary.interpretation.data.hours, [1, 2, 3]);
  assert.equal(eligible(out, 'REL-01'), false);
});
test('31 internal change / practical nearby / outcome nearby: REL-03 mental priority', () => {
  const raw = vector(fixture(), 'iep.mental', [7, 6, 5]);
  vector(raw, 'iep.practical', [6, 6, 6]); vector(raw, 'oop.achievement', [4, 4, 4]);
  vector(raw, 'iep.emotion', Array(3).fill('Sadness / disappointment'));
  vector(raw, 'iep.emotionIntensity', [4, 5, 6]);
  const out = run(raw);
  assert.equal(out.primary.ruleId, 'REL-03');
  assert.equal(out.primary.interpretation.data.internalSource, 'mental');
  assert.equal(out.secondary.ruleId, 'EMO-02');
});
test('32 known same emotion category: intensity comparison and EMO-02', () => {
  const raw = vector(fixture(), 'iep.emotionIntensity', [4, 5, 6]);
  const out = run(raw);
  assert.equal(eligible(out, 'EMO-02'), true);
  assert.equal(eligible(out, 'CMP-01:emotionIntensity'), true);
});
test('33 changing category: intensity delta unavailable, other domains remain eligible', () => {
  const raw = caseA();
  vector(raw, 'iep.emotion', ['Fear / anxiety', 'Joy / excitement', 'Calm / contentment']);
  const out = run(raw);
  assert.equal(eligible(out, 'EMO-01'), false);
  assert.equal(eligible(out, 'EMO-02'), false);
  assert.equal(out.comparisons.find(c => c.metric === 'emotionIntensity').delta, null);
  assert.equal(out.primary.ruleId, 'REL-01');
});
test('34 Other can recur as a category but never identify an intensity trend', () => {
  const raw = vector(fixture(), 'iep.emotion', ['Other', 'Other', 'Other']);
  vector(raw, 'iep.emotionIntensity', [4, 5, 6]);
  const out = run(raw);
  assert.equal(eligible(out, 'EMO-01'), true);
  assert.equal(eligible(out, 'EMO-02'), false);
  assert.equal(eligible(out, 'CMP-01:emotionIntensity'), false);
});
test('35 unknown imported emotion is literal and never classified', () => {
  const raw = vector(caseA(), 'iep.emotion', Array(3).fill('depression'));
  const out = run(raw);
  assert.equal(out.primary.ruleId, 'REL-01');
  assert.equal(eligible(out, 'EMO-01'), false);
  assert.equal(eligible(out, 'EMO-02'), false);
  assert.ok(out.limitations.includes('unmapped_emotion_label'));
  assert.equal(mapEmotion('depression').category, null);
});
test('36 external free text is retained literally and never classified', () => {
  const raw = fixture(1);
  raw.intent.cycles[0].oop.external = 'rejected rain depression suicide anxiety burnout';
  const out = run(raw);
  assert.equal(eligible(out, 'CTX-02'), true);
  assert.equal(out.safety.externalDecision, 'UNKNOWN');
  assert.equal(out.safety.classifierImplemented, false);
  assert.equal(out.primary.ruleId, 'REF-01');
  assert.equal(out.secondary.interpretation.data.literalRecord, raw.intent.cycles[0].oop.external);
});
test('37 insufficient checkbox dominates direct and leaves independent practical analysis', () => {
  const raw = vector(caseA(), 'oop.evidence', Array.from({length: 3}, () => ['direct', 'insufficient']));
  const out = run(raw);
  assert.equal(out.primary.ruleId, 'PRA-01');
  assert.equal(eligible(out, 'REL-01'), false);
  assert.equal(eligible(out, 'OUT-02'), false);
  assert.equal(out.status, 'LIMITED');
});
test('38 direction=mixed is MIXED, unknown is insufficient', () => {
  const raw = fixture(1);
  raw.intent.cycles[0].oop.direction = 'mixed';
  const out = run(raw);
  assert.equal(out.primary.ruleId, 'MIX-01');
  assert.ok(out.primary.interpretation.data.triggers.includes('direction_mixed'));
  raw.intent.cycles[0].oop.direction = 'unknown';
  assert.equal(run(raw).primary.ruleId, 'QUAL-01');
});
test('39 achievement trend opposed by direction: MIX-01, not coherent outcome improvement', () => {
  const raw = vector(fixture(), 'oop.achievement', [2, 3, 4]);
  vector(raw, 'oop.direction', ['away', 'away', 'away']);
  const out = run(raw);
  assert.equal(out.primary.ruleId, 'MIX-01');
  assert.ok(out.primary.interpretation.data.triggers.includes('achievement_direction_opposed'));
  assert.equal(eligible(out, 'OUT-01'), false);
});
test('40 revision selection counts use all explicit events, with fixed-order ties', () => {
  const raw = fixture(3);
  raw.intent.cycles.forEach((c, i) => {
    c.createdAt = new Date(START + i * DAY).toISOString();
    c.intentional = 'yes'; c.revision = {scope: `Scope ${i}`, success: `Criteria ${i}`};
  });
  const out = run(raw);
  assert.equal(eligible(out, 'REV-02'), true);
  assert.equal(out.primary.ruleId, 'REV-01');
  assert.equal(out.secondary.ruleId, 'REV-02');
  assert.deepEqual(out.secondary.interpretation.data.mostSelectedDimensions, ['success', 'scope']);
  assert.equal(out.secondary.interpretation.data.dimensionCounts.scope, 3);
  assert.equal(out.timeWindow.N_spaced, 0);
  assert.ok(out.secondary.limitations.includes('revision_selections_are_not_independent_process_observations'));
});
test('41 priority ties: notable class then fixed metric order, never magnitude ranking', () => {
  const raw = fixture(2);
  vector(raw, 'iep.practical', [4, 6]); vector(raw, 'oop.achievement', [2, 5]);
  vector(raw, 'iep.mental', [2, 9]); vector(raw, 'iep.hours', [1, 8]);
  const out = run(raw);
  assert.equal(out.primary.candidateId, 'CMP-01:practical');
  assert.equal(out.secondary.candidateId, 'CMP-01:achievement');
  assert.equal(Object.hasOwn(out.primary, 'importanceScore'), false);
});
test('42 no eligible focused insight: honest insufficient assessment', () => {
  const raw = fixture(1);
  raw.intent.cycles[0].oop.evidence = [];
  raw.intent.cycles[0].oop.direction = 'unknown';
  const out = run(raw);
  assert.equal(out.primary.ruleId, 'QUAL-01');
  assert.equal(out.status, 'INSUFFICIENT');
  assert.equal(out.ruleEvaluations.some(c => c.eligible && [4, 5, 6].includes(c.priority.group)), false);
});
test('43 malformed backup-compatible historical data: no silent repair', () => {
  for (const patch of [{}, {success: ''}, {unknownDimension: 'literal'}]) {
    const raw = fixture(1);
    raw.intent.cycles[0].intentional = 'yes'; raw.intent.cycles[0].revision = patch;
    const out = run(raw);
    assert.equal(out.primary.ruleId, 'MIX-01');
    assert.equal(eligible(out, 'REV-01'), false);
    assert.equal(out.segmentation.currentSegment.length, 0);
  }
  const raw = fixture(1);
  raw.intent.cycles[0].cie.primary = '';
  const out = run(raw);
  assert.equal(out.status, 'INSUFFICIENT');
  assert.ok(hasReason(out, 'blank_required_text'));
});
test('44 same frozen input run 100 times: structurally identical result', () => {
  const raw = freeze({...caseA(), presentationPreferences: {language: 'de'}});
  const expected = run(raw);
  for (let i = 0; i < 100; i++) assert.deepStrictEqual(run(raw), expected);
});
test('45 every production UI locale produces exactly the same engine decision', () => {
  const raw = freeze(caseA());
  const expected = run(raw, {presentationLocale: 'en'});
  for (const presentationLocale of Object.keys(EMOTION_LABELS)) assert.deepStrictEqual(run(raw, {presentationLocale}), expected);
});

test('SPEC A: declining practical, nearby achievement -> REL-01', () => {
  const out = run(caseA());
  assert.equal(out.primary.ruleId, 'REL-01');
  assert.equal(out.secondary.ruleId, 'OUT-02');
  assert.equal(out.primary.causality, 'not_determined');
});
test('SPEC B: nearby practical, decreasing achievement -> CTX-01 without obstacle claim', () => {
  const raw = vector(fixture(), 'iep.practical', [6, 6, 6]);
  vector(raw, 'oop.achievement', [6, 5, 4]); vector(raw, 'oop.direction', ['away', 'away', 'away']);
  vector(raw, 'oop.external', ['Obstacle one', 'Obstacle two and three', 'Many more words about obstacles']);
  const out = run(raw);
  assert.equal(out.primary.ruleId, 'CTX-01');
  assert.equal(out.primary.interpretation.data.externalTrajectory, 'unavailable');
});
test('SPEC C: successive rewording -> TXT-01 LIMITED, no semantic drift', () => {
  const raw = fixture();
  raw.intent.cycles.forEach((c, i) => { c.cie.primary = `Wording ${i}`; });
  const out = run(raw);
  assert.equal(out.primary.ruleId, 'TXT-01');
  assert.equal(out.status, 'LIMITED');
  assert.equal(out.timeWindow.N_spaced, 1);
  assert.equal(eligible(out, 'INT-02'), false);
  assert.equal(out.capabilities.DEITHIATHO.semanticDrift, 'unavailable');
});
test('SPEC D: explicit revision -> REV-01, post-revision segment empty', () => {
  const raw = fixture();
  raw.intent.cycles[2].intentional = 'yes';
  raw.intent.cycles[2].revision = {success: 'Two notes drafted and discussed'};
  raw.intent.ris.success = 'Two notes drafted and discussed';
  const out = run(raw);
  assert.equal(out.primary.ruleId, 'REV-01');
  assert.deepEqual(out.primary.interpretation.data.selectedDimensions, ['success']);
  assert.equal(out.timeWindow.N_spaced, 0);
});
test('SPEC E: REL-03 uses mental before same-category intensity; EMO-02 secondary', () => {
  const raw = vector(fixture(), 'iep.practical', [6, 6, 6]);
  vector(raw, 'iep.mental', [7, 6, 5]); vector(raw, 'oop.achievement', [4, 4, 4]);
  vector(raw, 'iep.emotion', ['Sadness / disappointment', 'Sadness / disappointment', 'Sadness / disappointment']);
  vector(raw, 'iep.emotionIntensity', [4, 5, 6]);
  const out = run(raw);
  assert.equal(out.primary.ruleId, 'REL-03');
  assert.equal(out.primary.interpretation.data.internalSource, 'mental');
  assert.equal(out.secondary.ruleId, 'EMO-02');
});
test('SPEC F: practical and achievement increased together -> REL-02', () => {
  const raw = vector(fixture(), 'iep.practical', [3, 4, 5]);
  vector(raw, 'iep.hours', [1, 2, 3]); vector(raw, 'oop.achievement', [2, 3, 4]);
  vector(raw, 'oop.direction', ['toward', 'toward', 'toward']);
  const out = run(raw);
  assert.equal(out.primary.ruleId, 'REL-02');
  assert.equal(out.primary.evidenceLevel, 'REPEATED_PATTERN');
});

test('NFC, line endings, outer trim only; no case folding or punctuation deletion', () => {
  assert.equal(normalizeText(' \r\nCafe\u0301\rline\r\n '), '\nCafé\nline'.trim());
  assert.notEqual(normalizeText('A'), normalizeText('a'));
  const raw = fixture();
  raw.intent.cycles[1].cie.scope = 'one chosen topic';
  assert.equal(run(raw).timeWindow.N_spaced, 1);
});
test('allowed normalization does not create a wording boundary', () => {
  const raw = fixture();
  raw.intent.ris.primary = 'Café\nnotes';
  raw.intent.cycles.forEach((c, i) => { c.cie.primary = i === 0 ? ' Cafe\u0301\r\nnotes ' : 'Café\nnotes'; });
  const out = run(raw);
  assert.equal(out.timeWindow.N_spaced, 3);
  assert.equal(eligible(out, 'INT-01'), true);
});
test('frozen dictionary matches production labels byte-for-byte, 31 locales / 306 unique labels', () => {
  const context = {window: {}};
  vm.runInNewContext(fs.readFileSync(require.resolve('./locales.js'), 'utf8'), context);
  const actual = Object.fromEntries(Object.entries(context.window.PHEISIRAETHA_LOCALES).map(([code, locale]) => [code, Array.from(locale.translations.emotions)]));
  assert.equal(JSON.stringify(EMOTION_LABELS), JSON.stringify(actual));
  assert.equal(Object.keys(EMOTION_LABELS).length, 31);
  assert.equal(new Set(Object.values(EMOTION_LABELS).flat().map(normalizeText)).size, 306);
  for (const labels of Object.values(EMOTION_LABELS)) labels.forEach((label, i) => assert.equal(mapEmotion(label).category, i));
});
test('multilingual known emotion labels map to the same category without translation', () => {
  const raw = fixture();
  vector(raw, 'iep.emotion', ['Calm / contentment', 'Ruhe / Zufriedenheit', EMOTION_LABELS.ru[3]]);
  vector(raw, 'iep.emotionIntensity', [4, 5, 6]);
  const out = run(raw);
  assert.equal(eligible(out, 'EMO-02'), true);
  assert.equal(raw.intent.cycles[1].iep.emotion, 'Ruhe / Zufriedenheit');
  assert.equal(mapEmotion('calm / contentment').status, 'unmapped');
});
test('all exactly seven-day spacings qualify; one millisecond closer does not', () => {
  const raw = fixture();
  assert.equal(run(raw).timeWindow.N_spaced, 3);
  raw.intent.cycles[1].createdAt = new Date(START + 7 * DAY + 1).toISOString();
  const out = run(raw);
  assert.equal(out.timeWindow.N_spaced, 2);
});
test('exactly 28 days permitted, 28 days plus one millisecond stops window', () => {
  const raw = fixture(2);
  raw.intent.cycles[1].createdAt = new Date(START + 28 * DAY).toISOString();
  assert.equal(run(raw).timeWindow.N_spaced, 2);
  raw.intent.cycles[1].createdAt = new Date(START + 28 * DAY + 1).toISOString();
  assert.equal(run(raw).timeWindow.N_spaced, 1);
});
test('window maximum is five, latest predetermined history only', () => {
  const raw = fixture(8);
  vector(raw, 'iep.practical', [10, 9, 8, 7, 7, 7, 7, 7]);
  const out = run(raw);
  assert.deepEqual(out.timeWindow.usedCycleIds, ['synthetic-c4', 'synthetic-c5', 'synthetic-c6', 'synthetic-c7', 'synthetic-c8']);
  assert.equal(eligible(out, 'PRA-01'), false);
});
test('D5 failure cannot fall back to a favorable latest D3', () => {
  const out = run(vector(fixture(5), 'iep.practical', [4, 5, 5, 4, 3]));
  assert.equal(eligible(out, 'PRA-01'), false);
  assert.equal(eligible(out, 'REL-01'), false);
});
test('fourth earlier large step blocks latest-three trend', () => {
  const out = run(vector(caseA(4), 'iep.practical', [1, 8, 7, 6]));
  assert.equal(eligible(out, 'REL-01'), false);
  assert.ok(suppression(out, 'PRA-01').reasons.includes('LARGE_STEP_REQUIRES_REPEAT'));
});
test('flat and low recurrence at N=4 use all four observations', () => {
  const raw = vector(fixture(4), 'iep.practical', [5, 3, 3, 3]);
  const out = run(raw);
  assert.equal(eligible(out, 'PRA-02'), false);
  vector(raw, 'oop.achievement', [5, 2, 2, 2]);
  assert.equal(eligible(run(raw), 'OUT-02'), false);
});
test('invalid domain data in an overlap-excluded intermediate cycle still blocks its pattern', () => {
  const raw = fixture(4);
  vector(raw, 'iep.practical', [8, 8, 7, 6]);
  raw.intent.cycles[1].createdAt = new Date(START + 13 * DAY).toISOString();
  delete raw.intent.cycles[1].iep.practical;
  const out = run(raw);
  assert.equal(out.timeWindow.N_spaced, 3);
  assert.equal(eligible(out, 'PRA-01'), false);
  assert.equal(eligible(out, 'OUT-02'), true);
});
test('overlap records do not inflate supporting observation count', () => {
  const raw = fixture(4);
  vector(raw, 'iep.practical', [8, 8, 7, 6]);
  vector(raw, 'iep.hours', [3, 3, 2, 1]);
  raw.intent.cycles[1].createdAt = new Date(START + 13 * DAY).toISOString();
  const out = run(raw);
  assert.equal(out.primary.ruleId, 'REL-01');
  assert.equal(out.primary.priority.supportingObservations, 3);
  assert.deepEqual(out.primary.ruleEvaluation.usedCycleIds, ['synthetic-c1', 'synthetic-c3', 'synthetic-c4']);
  assert.equal(out.primary.ruleEvaluation.validatedIntermediateCycleIds.length, 4);
});
test('latest missing outcome never backfills a previously valid assessment', () => {
  const raw = caseA();
  delete raw.intent.cycles[2].oop.achievement;
  const out = run(raw);
  assert.equal(out.primary.ruleId, 'PRA-01');
  assert.equal(eligible(out, 'OUT-02'), false);
  assert.equal(eligible(out, 'REL-01'), false);
  assert.equal(out.comparisons.find(c => c.metric === 'achievement').delta, null);
});
test('missing required CIE boundary cannot be bridged', () => {
  const raw = caseA(5);
  delete raw.intent.cycles[2].cie.rationale;
  const out = run(raw);
  assert.deepEqual(out.segmentation.currentSegment.map(c => c.cycleId), ['synthetic-c4', 'synthetic-c5']);
  assert.equal(eligible(out, 'REL-01'), false);
});
test('post-revision window starts after the revision cycle', () => {
  const raw = fixture(5);
  raw.intent.cycles[1].intentional = 'yes'; raw.intent.cycles[1].revision = {rationale: RIS.rationale};
  vector(raw, 'iep.practical', [10, 9, 8, 7, 6]); vector(raw, 'iep.hours', [5, 4, 3, 2, 1]);
  const out = run(raw);
  assert.deepEqual(out.timeWindow.usedCycleIds, ['synthetic-c3', 'synthetic-c4', 'synthetic-c5']);
  assert.equal(out.primary.ruleId, 'REL-01');
});
test('same text selected for revision still records selection, not a before/after change', () => {
  const raw = fixture(1);
  raw.intent.cycles[0].intentional = 'yes'; raw.intent.cycles[0].revision = {success: RIS.success};
  const out = run(raw);
  assert.equal(out.primary.ruleId, 'REV-01');
  assert.equal(out.primary.interpretation.data.beforeValues, 'unavailable');
});
test('repeated wording differing from current RIS is neutral INT-02, not retention/drift score', () => {
  const raw = fixture();
  raw.intent.ris.primary = 'Current edited objective';
  const out = run(raw);
  assert.equal(eligible(out, 'INT-02:primary'), true);
  assert.equal(out.capabilities.FINAEFIA.functionalAssessment, 'unavailable');
  assert.equal(out.capabilities.DEITHIATHO.semanticDrift, 'unavailable');
  assert.ok(out.primary.limitations.includes('historical_RIS_unavailable'));
});
test('flat achievement with toward/away direction is differently scoped MIXED evidence', () => {
  const raw = fixture();
  vector(raw, 'oop.direction', ['none', 'toward', 'none']);
  const out = run(raw);
  assert.equal(out.primary.ruleId, 'MIX-01');
  assert.ok(out.primary.interpretation.data.triggers.includes('flat_achievement_direction_varied'));
  assert.equal(eligible(out, 'OUT-02'), false);
});
test('basis statuses distinguish not recorded, unspecified, insufficient, reported', () => {
  for (const [basis, expected] of [[[], 'not_recorded'], [['other'], 'unspecified'], [['direct', 'insufficient'], 'insufficient'],
    [['subjective'], 'reported'], [['otherPerson', 'documented'], 'reported']]) {
    const raw = fixture(1); raw.intent.cycles[0].oop.evidence = basis;
    const out = run(raw);
    const reflected = out.primary.ruleId === 'QUAL-01' ? out.primary.interpretation.data :
      out.primary.ruleId === 'REF-01' ? out.primary.interpretation.data : null;
    assert.equal(reflected.basisStatus, expected);
  }
});
test('duplicate evidence checkboxes become a derived set, raw array stays unchanged', () => {
  const raw = fixture();
  vector(raw, 'oop.evidence', Array.from({length: 3}, () => ['direct', 'direct']));
  assert.equal(eligible(run(raw), 'OUT-02'), true);
  assert.deepEqual(raw.intent.cycles[0].oop.evidence, ['direct', 'direct']);
});
test('valid zero measurements are present, not missing', () => {
  const raw = fixture();
  vector(raw, 'iep.practical', [0, 0, 0]); vector(raw, 'iep.hours', [0, 0, 0]);
  const out = run(raw);
  assert.equal(eligible(out, 'PRA-02'), true);
  assert.equal(out.validation.issues.some(i => i.path.endsWith('.iep.practical')), false);
});
test('one rating=5 or achievement=0 is never treated as an unanswered field', () => {
  const raw = fixture();
  vector(raw, 'iep.practical', [5, 5, 5]); vector(raw, 'oop.achievement', [0, 0, 0]);
  const out = run(raw);
  assert.equal(eligible(out, 'OUT-02'), true);
  assert.equal(out.limitations.includes('POSSIBLE_UNREVIEWED_DEFAULTS'), false);
});
test('historical default profile blocks patterns but does not impose a latest whole-result hold', () => {
  const raw = fixture();
  raw.intent.cycles[0].iep = {desire: 5, belief: 5, emotion: 'Hope / positive anticipation', emotionIntensity: 5,
    mental: 5, practical: 5, frequency: 'freq2', actions: '', hours: 0};
  raw.intent.cycles[0].oop = {achievement: 0, direction: 'none', evidence: [], currentState: '', events: '', external: ''};
  const out = run(raw);
  assert.equal(eligible(out, 'INT-01'), false);
  assert.equal(out.primary.ruleId, 'CMP-01');
});
test('low effort with improving outcome: outcome first, no claim effort unnecessary', () => {
  const raw = fixture();
  vector(raw, 'iep.practical', [1, 1, 1]); vector(raw, 'iep.hours', [0, 0, 0]);
  vector(raw, 'oop.achievement', [2, 3, 4]); vector(raw, 'oop.direction', ['toward', 'toward', 'toward']);
  const out = run(raw);
  assert.equal(out.primary.ruleId, 'OUT-01');
  assert.equal(out.secondary.ruleId, 'PRA-02');
});
test('high practical/hours with poor outcome: CTX-01 observation, never increase-effort advice', () => {
  const raw = fixture();
  vector(raw, 'iep.practical', [9, 9, 9]); vector(raw, 'iep.hours', [8, 8, 8]);
  vector(raw, 'oop.achievement', [2, 1, 0]); vector(raw, 'oop.direction', ['away', 'away', 'away']);
  const out = run(raw);
  assert.equal(out.primary.ruleId, 'CTX-01');
  assert.deepEqual(out.primary.nextFocus.variablePaths, ['C.oop.external']);
});
test('COND-01 is a capability gap and never a recurring candidate/card', () => {
  const out = run(fixture(1));
  assert.equal(out.capabilities.VAQUQA.ruleId, 'COND-01');
  assert.equal(out.capabilities.VAQUQA.status, 'capability_gap');
  assert.equal(out.capabilities.VAQUQA.conditionSufficiency, 'unavailable');
  assert.equal(eligible(out, 'COND-01'), false);
  assert.notEqual(out.primary.ruleId, 'COND-01');
});
test('achievement=10 and direction=toward never mean verified/final success', () => {
  const raw = fixture(1);
  raw.intent.cycles[0].oop.achievement = 10; raw.intent.cycles[0].oop.direction = 'toward';
  const out = run(raw);
  assert.equal(out.capabilities.LIPHOZEI.verifiedSuccess, 'unavailable');
  assert.equal(out.capabilities.LIPHOZEI.automaticCriterionFulfilment, 'unavailable');
  assert.equal(Object.hasOwn(out, 'fulfilled'), false);
});
test('strict timestamps: offsets work, impossible/ambiguous dates block patterns', () => {
  assert.equal(parseTimestamp('2026-09-01T14:00:00+02:00').milliseconds, START);
  assert.equal(parseTimestamp('2024-02-29T12:00Z').valid, true);
  for (const stamp of ['2026-02-29T12:00:00Z', '2026-04-31T12:00:00Z', '2026-09-01T24:00:00Z',
    '2026-09-01T12:00:00', '09/01/2026', '2026-09-01T12:00:00-00:00', '2026-09-01T12:00:00+24:00']) {
    assert.equal(parseTimestamp(stamp).valid, false, stamp);
    const raw = caseA(); raw.intent.cycles[1].createdAt = stamp;
    const out = run(raw);
    assert.equal(out.primary.ruleId, 'QUAL-01');
    assert.equal(eligible(out, 'REL-01'), false);
  }
});
test('spacing uses elapsed 7x24 hours, including timezone offsets', () => {
  const raw = fixture(2);
  raw.intent.cycles[0].createdAt = '2026-09-01T14:00:00+02:00';
  raw.intent.cycles[1].createdAt = '2026-09-08T13:00:00+01:00';
  assert.equal(run(raw).timeWindow.N_spaced, 2);
});
test('unknown source version is UNSUPPORTED_SOURCE; no migration', () => {
  for (const version of ['0.2.0', 'pheisiraetha-v16', null, 1]) {
    const raw = fixture(); raw.version = version;
    const out = run(raw);
    assert.equal(out.status, 'UNSUPPORTED_SOURCE');
    assert.equal(out.primary, null);
  }
});
test('missing intent identity and non-object records degrade without exceptions', () => {
  const raw = fixture(1); raw.intent.id = '';
  assert.equal(run(raw).primary.ruleId, 'QUAL-01');
  for (const malformed of [null, [], 5, 'record']) {
    const state = fixture(1); state.intent.cycles[0] = malformed;
    assert.equal(run(state).status, 'INSUFFICIENT');
  }
  assert.equal(run({version: '0.1.0', lang: 'ru', intent: {}}).status, 'INSUFFICIENT');
});
test('safety contract accepts external ALLOW/HOLD/UNKNOWN, engine never infers verdict', () => {
  const raw = freeze(caseA());
  for (const safetyDecision of ['ALLOW', 'UNKNOWN']) {
    const out = run(raw, {safetyDecision});
    assert.equal(out.primary.ruleId, 'REL-01');
    assert.equal(out.safety.externalDecision, safetyDecision);
    assert.equal(out.primary.nextFocus.releaseStatus, 'NOT_RELEASED_TO_USER');
  }
  const held = run(raw, {safetyDecision: 'HOLD'});
  assert.equal(held.status, 'SAFETY_HOLD');
  assert.equal(held.primary, null);
  assert.equal(held.secondary, null);
  assert.ok(held.suppressedCandidates.filter(c => c.eligible).every(c => c.reasons.includes('safety_hold')));
});
test('no environment IO or clock dependency: forbidden APIs throw if touched', () => {
  const oldNow = Date.now;
  const saved = Object.fromEntries(['fetch', 'localStorage', 'XMLHttpRequest', 'navigator'].map(k => [k, Object.getOwnPropertyDescriptor(globalThis, k)]));
  const forbidden = () => { throw new Error('forbidden external dependency'); };
  try {
    Date.now = forbidden;
    for (const key of Object.keys(saved)) Object.defineProperty(globalThis, key, {configurable: true, get: forbidden});
    assert.equal(run(freeze(caseA())).primary.ruleId, 'REL-01');
  } finally {
    Date.now = oldNow;
    for (const [key, descriptor] of Object.entries(saved)) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key];
    }
  }
  const source = fs.readFileSync(require.resolve('./analysis.js'), 'utf8');
  assert.doesNotMatch(source, /\blocalStorage\b|\bfetch\s*\(|\bXMLHttpRequest\b|Date\.now\s*\(|Math\.random\s*\(/);
  assert.doesNotMatch(source, /require\s*\(/, 'module has no runtime imports');
});
test('output does not alias raw objects: editing derived evidence cannot edit state', () => {
  const raw = fixture(1); const before = clone(raw); const out = run(raw);
  out.primary.interpretation.data.currentReference.primary = 'edited derived output';
  out.primary.evidence.find(e => e.path.endsWith('.oop.evidence')).rawValue.push('other');
  assert.deepEqual(raw, before);
});
test('all prerequisite paths referenced by selected REL-01 have evidence', () => {
  const out = run(caseA());
  const paths = new Set(out.primary.evidence.map(e => e.path));
  for (const c of out.primary.ruleEvaluation.conditions) for (const path of c.inputPaths) assert.ok(paths.has(path), `missing provenance ${path}`);
  for (let i = 0; i < 3; i++) {
    for (const path of ['iep.practical', 'iep.hours', 'oop.achievement', 'oop.direction', 'oop.evidence', 'intentional', 'revision']) {
      assert.ok(paths.has(`intent.cycles[${i}].${path}`));
    }
    DIMENSIONS.forEach(k => assert.ok(paths.has(`intent.cycles[${i}].cie.${k}`)));
  }
  assert.equal(out.primary.ruleEvaluation.conditions.find(c => c.name === 'no_Hup').formula,
    'monotone adjacent deltas; abs(endpoint)>=1h; flat range<=0.25h');
});
test('priority output max one focus; PRA-01 subsumed by REL-01, factual OUT-02 secondary', () => {
  const out = run(caseA());
  assert.equal(out.primary.ruleId, 'REL-01');
  assert.equal(out.secondary.ruleId, 'OUT-02');
  assert.equal(out.secondary.nextFocus, null);
  assert.ok(suppression(out, 'PRA-01').reasons.includes('subsumed_by_primary'));
  assert.deepEqual(out.selectionExplanation.data.selectedTuple, out.primary.priority);
});
test('causal-language guard covers internal keys/descriptions, not literal user records', () => {
  const prohibited = /caused|because your thoughts|because of your thoughts|led to the outcome|negative emotion prevented|positive thinking created|manifested because/i;
  const source = fs.readFileSync(require.resolve('./analysis.js'), 'utf8');
  assert.doesNotMatch(source, prohibited);
  for (const raw of [caseA(), fixture(1), vector(fixture(), 'oop.achievement', [2, 3, 4])]) {
    const out = run(raw);
    for (const c of [out.primary, out.secondary].filter(Boolean)) {
      assert.doesNotMatch(JSON.stringify({titleKey: c.titleKey, interpretation: c.interpretation.key,
        focus: c.nextFocus?.promptKey, why: c.whyThisFocus?.key}), prohibited);
      assert.equal(c.causality, 'not_determined');
    }
  }
});
test('no forbidden composite scores or semantic/clinical outputs', () => {
  const out = run(caseA());
  assert.doesNotMatch(JSON.stringify(out), /FINAEFIA score|DEITHIATHO score|VAQUQA score|FINAEFIA confirmed|DEITHIATHO detected|moodScore|mentalHealthScore|conditionSufficiencyPercentage|obstacleSeverity/);
  assert.equal(out.capabilities.VIASIATAE.fullEnergyOrOtherActorMeasurement, 'unavailable');
});
test('hours validity and exact decimal values; no hours sums/ratios/effort conversion', () => {
  const raw = fixture(2); vector(raw, 'iep.hours', [0.125, 1.625]);
  const out = run(raw);
  const comp = out.comparisons.find(c => c.metric === 'hours');
  assert.equal(comp.delta, 1.5);
  assert.equal(comp.changeClass, 'notable_recorded_change');
  raw.intent.cycles[1].iep.hours = 168.25;
  assert.equal(eligible(run(raw), 'CMP-01:hours'), false);
});
test('ordinal frequency changed category is notable without numeric frequency delta', () => {
  const raw = fixture(2); vector(raw, 'iep.frequency', ['freq0', 'freq1']);
  const out = run(raw);
  assert.equal(out.primary.candidateId, 'CMP-02:frequency');
  assert.equal(out.primary.interpretation.data.change, 'higher_category');
  assert.equal(Object.hasOwn(out.primary.interpretation.data, 'delta'), false);
});
test('mental intensity and emotion branch are independent; REL-03 intensity fallback works', () => {
  const raw = fixture();
  vector(raw, 'iep.practical', [6, 6, 6]); vector(raw, 'iep.mental', [6, 6, 6]);
  vector(raw, 'iep.emotionIntensity', [4, 5, 6]);
  const out = run(raw);
  assert.equal(out.primary.ruleId, 'REL-03');
  assert.equal(out.primary.interpretation.data.internalSource, 'emotionIntensity');
  vector(raw, 'iep.emotion', ['Other', 'Other', 'Other']);
  assert.equal(eligible(run(raw), 'REL-03'), false);
});
test('unknown fields and legacy lang cannot influence deterministic decisions', () => {
  const raw = fixture(2); const baseline = run(raw);
  raw.lang = 'de'; raw.presentationPreferences = {language: 'ar'};
  raw.intent.cycles.forEach(c => { c.unapprovedDerivedScore = 999; });
  assert.deepEqual(run(raw), baseline);
});
test('10,000 saved cycles: bounded latest window, no historical all-pairs search', () => {
  const raw = fixture(10000);
  const start = performance.now();
  const out = run(raw);
  const elapsed = performance.now() - start;
  assert.equal(out.timeWindow.N_completed, 10000);
  assert.equal(out.timeWindow.N_spaced, 5);
  assert.deepEqual(out.timeWindow.usedCycleIds, ['synthetic-c9996', 'synthetic-c9997', 'synthetic-c9998', 'synthetic-c9999', 'synthetic-c10000']);
  assert.equal(out.ruleEvaluations.filter(e => e.eligible && [4, 5].includes(e.priority.group)).every(e => e.usedCycleIds.length <= 5), true);
  assert.ok(elapsed < 10000, `bounded history scan took ${elapsed}ms`);
});
test('completed-record count and full field-validation count are explicitly separated', () => {
  const raw = fixture();
  raw.intent.cycles[1].iep.practical = '8';
  const out = run(raw);
  assert.equal(out.timeWindow.N_completed, 3);
  assert.equal(out.validation.fullyValidCycleCount, 2);
  assert.equal(eligible(out, 'OUT-02'), true);
});
test('mixed-signal WHY exposes exact predicates, input paths and rating/hour formulas', () => {
  const out = run(vector(caseA(), 'iep.hours', [1, 2, 3]));
  const trigger = out.primary.ruleEvaluation.triggerEvaluations.find(t => t.name === 'practical_hours_opposed');
  assert.equal(trigger.passed, true);
  assert.equal(trigger.inputPaths.length, 6);
  assert.equal(out.primary.ruleEvaluation.hoursCorroboration.endpointChange, 2);
  assert.equal(out.primary.ruleEvaluation.hoursCorroboration.formulas.endpointChange, 'last-first');
  assert.ok(out.primary.ruleEvaluation.derivedMeasures.some(m => m.name === 'iep.practical:trendChange' && m.value === -2));
});
test('default-profile guard has raw evidence for every default prerequisite', () => {
  const out = run(fixture());
  const paths = new Set(out.primary.evidence.map(e => e.path));
  const check = out.primary.ruleEvaluation.conditions.find(c => c.name === 'POSSIBLE_UNREVIEWED_DEFAULTS');
  assert.ok(check.inputPaths.length > 30);
  check.inputPaths.forEach(path => assert.ok(paths.has(path), path));
});
test('revision counts expose input references and formulas rather than unexplained scalars', () => {
  const raw = fixture();
  raw.intent.cycles.forEach(c => { c.intentional = 'yes'; c.revision = {success: RIS.success}; });
  const out = run(raw);
  const count = out.secondary.ruleEvaluation.derivedMeasures.find(m => m.name === 'revision_selection_count:success');
  assert.equal(count.value, 3);
  assert.equal(count.inputPaths.length, 3);
  assert.match(count.formula, /count\(valid explicit events/);
});
test('primary domain follows REL-03 branch, preserving fixed secondary domain preference', () => {
  const raw = fixture();
  vector(raw, 'iep.practical', [6, 6, 6]); vector(raw, 'iep.mental', [7, 6, 5]);
  vector(raw, 'iep.emotionIntensity', [4, 5, 6]);
  const out = run(raw);
  assert.equal(out.primary.domain, 'mental_contribution');
  assert.equal(out.secondary.ruleId, 'EMO-02');
  assert.equal(out.secondary.domain, 'emotion');
});
test('MIX-01 provenance is complete for all exposed trigger computations without level inflation', () => {
  const raw = fixture();
  raw.intent.cycles[2].oop.direction = 'mixed';
  const out = run(raw);
  assert.equal(out.primary.ruleId, 'MIX-01');
  assert.equal(out.primary.evidenceLevel, 'EARLY_OBSERVATION');
  assert.equal(out.primary.priority.supportingObservations, 1);
  const paths = new Set(out.primary.evidence.map(e => e.path));
  for (const evaluation of [...out.primary.ruleEvaluation.triggerEvaluations, ...out.primary.ruleEvaluation.derivedMeasures]) {
    for (const path of evaluation.inputPaths) assert.ok(paths.has(path), `missing mixed provenance: ${path}`);
  }
});
test('all 24 specification rule IDs evaluated and heuristic constants remain frozen', t => {
  assert.deepEqual([...testedRules].sort(), [...RULE_IDS].sort());
  assert.equal(RULE_IDS.length, 24);
  assert.equal(Object.isFrozen(HEURISTICS), true);
  assert.equal(HEURISTICS.minimumSpacing, 604800000);
  assert.equal(HEURISTICS.maximumGap, 2419200000);
  assert.equal(HEURISTICS.maximumObservations, 5);
  assert.ok(runs >= 200, 'no-mutation assertions executed for all runs');
  t.diagnostic(`Engine runs with complete no-mutation assertions: ${runs}`);
});
