'use strict';

// Build-internal identities only. No canonical prose or display values.
// Contracts: integration 87c4e91..., registry ba46070..., executable 74b77f0....
// This table constrains the trusted dependency; it is not a registry override.
const D = ['primary', 'success', 'scope', 'nonGoals', 'constraints', 'rationale'];
const U = [
  ['practical', 'iep.practical'], ['achievement', 'oop.achievement'], ['mental', 'iep.mental'],
  ['hours', 'iep.hours'], ['desire', 'iep.desire'], ['belief', 'iep.belief'], ['emotionIntensity', 'iep.emotionIntensity']
];
const I = [['mental', 'iep.mental'], ['emotionIntensity', 'iep.emotionIntensity']];
const B = ['analysis.observeEventAndBasis', 'analysis.observeRevisedCriteria', 'analysis.observeActionAndEvent',
  'analysis.observeExternalCircumstance', 'analysis.observeOwnCriteriaAgain'];
const X = ['decision_patch_conflict', 'direction_mixed', 'achievement_direction_opposed',
  'flat_achievement_direction_varied', 'practical_hours_opposed'];
const CAPABILITY = { capabilityPath: 'capabilities.VAQUQA', ruleId: 'COND-01',
  status: 'capability_gap', conditionSufficiency: 'unavailable' };
const MANIFEST3 = 'safety.manifest.primaryFactualWithCapability';
const MANIFEST4 = 'safety.manifest.primaryAndSecondaryFactualWithCapability';
const ABSENT3 = ['primary.interpretation', 'primary.nextFocus', 'secondary'];
const ABSENT4 = ['primary.interpretation', 'primary.nextFocus', 'secondary.interpretation',
  'secondary.nextFocus', 'secondary.whyThisFocus'];
const RULES = ['REF-01', 'QUAL-01', 'CMP-01', 'CMP-02', 'TXT-01', 'INT-01', 'INT-02', 'PRA-01', 'PRA-02',
  'MEN-01', 'MEN-02', 'EMO-01', 'EMO-02', 'OUT-01', 'OUT-02', 'CTX-01', 'CTX-02', 'REV-01', 'REV-02',
  'REL-01', 'REL-02', 'REL-03', 'MIX-01'];
const FIXED_ROWS = { 'QUAL-01': 'E04', 'CMP-01': 'E05', 'CMP-02': 'E06', 'TXT-01': 'E07', 'INT-01': 'E08',
  'INT-02': 'E09', 'PRA-01': 'E10', 'PRA-02': 'E11', 'MEN-01': 'E12', 'MEN-02': 'E13', 'EMO-02': 'E16',
  'OUT-01': 'E17', 'OUT-02': 'E18', 'CTX-01': 'E19', 'CTX-02': 'E20', 'REV-01': 'E21', 'REV-02': 'E22',
  'REL-01': 'E23', 'REL-02': 'E24', 'REL-03': 'E25', 'MIX-01': 'E26' };

const MAPPINGS = RULES.flatMap((ruleId, n) => {
  const tuple = (metric = null, dimension = null, branch = 'recorded', variant = 'recordedObservation') => ({
    ruleId, candidateId: ruleId === 'CMP-01' || ruleId === 'CMP-02' ? `${ruleId}:${metric}` :
      ruleId === 'INT-02' ? `${ruleId}:${dimension}` : ruleId,
    key: `analysis.${ruleId}.title`, metric, dimension, branch, variant
  });
  let selectors;
  if (ruleId === 'REF-01') selectors = B.flatMap((_, i) =>
    ['CURRENT_CATEGORY_UNAVAILABLE', 'CURRENT_KNOWN_CATEGORY'].map(v => tuple(null, null, `B${i + 1}`, v)));
  else if (ruleId === 'QUAL-01') selectors = ['insufficient_basis', 'possible_default_profile'].map(b => tuple(null, null, b));
  else if (ruleId === 'CMP-01') selectors = U.map(u => tuple(u[0]));
  else if (ruleId === 'CMP-02') selectors = [tuple('frequency')];
  else if (ruleId === 'INT-02') selectors = D.map(d => tuple(null, d));
  else if (ruleId === 'MEN-01') selectors = ['low_range', 'decreasing'].map(b => tuple(null, null, b));
  else if (ruleId === 'MEN-02') selectors = ['same_category_repeated', 'category_decreased'].map(b => tuple(null, null, b));
  else if (ruleId === 'EMO-01') selectors = ['known_non_other', 'other'].map(b => tuple(null, null, b));
  else if (['EMO-02', 'OUT-01'].includes(ruleId)) selectors = ['increased', 'decreased'].map(b => tuple(null, null, b));
  else if (ruleId === 'REL-03') selectors = I.map(i => tuple(i[0]));
  else if (ruleId === 'MIX-01') selectors = ['decision_patch_conflict', 'practical_hours_opposed', 'recorded_direction'].map(b => tuple(null, null, b));
  else selectors = [tuple()];
  return selectors.map(selector => ({ mappingId: `M${String(n + 1).padStart(2, '0')}`, selector,
    allowedSurfaces: ['REF-01', 'QUAL-01'].includes(ruleId) ? ['PRIMARY'] :
      ruleId === 'CTX-02' ? ['SECONDARY'] : ['PRIMARY', 'SECONDARY'] }));
});

const current = [['desire', 'iep.desire'], ['belief', 'iep.belief'], ['mental', 'iep.mental'],
  ['practical', 'iep.practical'], ['intensity', 'iep.emotionIntensity'], ['achievement', 'oop.achievement'],
  ['hours', 'iep.hours'], ['frequency', 'iep.frequency'], ['direction', 'oop.direction']]
  .map(([name, field]) => ({ name, selector: `CURRENT(${field})` }));
const one = (name, selector) => ({ name, selector });
const series = (name, field) => one(name, `SERIES(${field})`);
const cochange = [series('practical', 'iep.practical'), series('achievement', 'oop.achievement')];
const byMetric = (name, prefix, metrics) => ({ name, selector: null,
  selectorByMetric: Object.fromEntries(metrics.map(([metric, field]) => [metric, `${prefix}(${field})`])) });
const BINDINGS = {
  E01: [], E02: current, E03: [...current, one('categoryIndex', 'ENGINE_EMOTION_CURRENT')], E04: [],
  E05: [one('metricLabel', 'U.metricLabel'), one('units', 'U.units'), one('scope', 'U.scope'),
    byMetric('before', 'PAIR', U), byMetric('after', 'PAIR', U), byMetric('delta', 'ENGINE_DELTA', U)],
  E06: [one('before', 'PAIR(iep.frequency)'), one('after', 'PAIR(iep.frequency)'), one('ordinalChange', 'ENGINE_ORDINAL')],
  E07: [one('dimensions', 'ENGINE_DIMENSIONS')], E08: [], E09: [one('dimension', 'ENGINE_DIMENSION')],
  E10: [series('ratings', 'iep.practical')], E11: [series('ratings', 'iep.practical'), series('hours', 'iep.hours')],
  E12: [series('ratings', 'iep.mental')], E13: [series('categories', 'iep.frequency')],
  E14: [one('categoryIndex', 'ENGINE_EMOTION_RECURRENT')], E15: [], E16: [series('intensities', 'iep.emotionIntensity')],
  E17: [series('ratings', 'oop.achievement'), series('directions', 'oop.direction'), series('bases', 'oop.evidence')],
  E18: [series('ratings', 'oop.achievement')], E19: cochange, E20: [], E21: [one('dimensions', 'REVISION_KEYS')],
  E22: [one('eventCount', 'REVISION_EVENT_COUNT'), ...D.map(d => one(`${d}Count`, 'REVISION_KEY_COUNTS'))],
  E23: cochange, E24: cochange, E25: [one('metricLabel', 'I.metricLabel'), byMetric('internal', 'SERIES', I), ...cochange],
  E26: [], E27: [one('fieldNames', 'FIXED_FIELDS')], E28: [one('ruleId', 'SELECTED_RULE')], E29: [], E30: []
};
const IDS = [
  'safety.fallback.noInterpretationOrNextFocus',
  'safety.insight.currentRecordedAssessments', 'safety.insight.currentRecordedAssessmentsAndCategory',
  'safety.insight.assessmentBasisLimitation', 'safety.insight.numericComparison', 'safety.insight.frequencyComparison',
  'safety.insight.literalWordingDifferences', 'safety.insight.normalizedWordingRecurrence', 'safety.insight.recurringWordingMismatch',
  'safety.insight.practicalRatingDecrease', 'safety.insight.practicalLowRangeAndHours', 'safety.insight.mentalEffortRatings',
  'safety.insight.frequencyCategories', 'safety.insight.knownCategoryRecurrence', 'safety.insight.otherCategorySelected',
  'safety.insight.sameCategoryIntensityChange', 'safety.insight.achievementRatingChange', 'safety.insight.nearbyAchievementRatings',
  'safety.insight.contextSeriesFacts', 'safety.insight.externalRecordPresent', 'safety.insight.recordedRevisionSelections',
  'safety.insight.recordedRevisionCounts', 'safety.insight.practicalDecreaseNearbyAchievement', 'safety.insight.recordedRatingCoIncrease',
  'safety.insight.internalRatingSeriesFacts', 'safety.insight.mixedRecordMetadata',
  'safety.why.recordedInformationUsed', 'safety.why.ruleSelectionBasis', 'safety.why.recordedDataLimitations',
  'safety.why.conditionAssessmentUnavailable'
];
const ENTRIES = IDS.map((templateId, i) => {
  const row = `E${String(i + 1).padStart(2, '0')}`;
  const mappings = i === 0 ? [] : row === 'E30' ? [{ mappingId: 'MC', selector: CAPABILITY, allowedSurfaces: ['PRIMARY'] }] :
    MAPPINGS.filter(m => ['E27', 'E28', 'E29'].includes(row) ||
      (['E02', 'E03'].includes(row) ? m.selector.ruleId === 'REF-01' &&
        m.selector.variant === (row === 'E02' ? 'CURRENT_CATEGORY_UNAVAILABLE' : 'CURRENT_KNOWN_CATEGORY') :
        ['E14', 'E15'].includes(row) ? m.selector.ruleId === 'EMO-01' &&
          m.selector.branch === (row === 'E14' ? 'known_non_other' : 'other') : FIXED_ROWS[m.selector.ruleId] === row));
  return { row, templateId, role: i === 0 ? 'FALLBACK' : i < 26 ? 'INSIGHT' : 'WHY',
    bindings: BINDINGS[row], mappings };
});

function freeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}
module.exports = freeze({ D, U, I, B, X, CAPABILITY, MANIFEST3, MANIFEST4, ABSENT3, ABSENT4, MAPPINGS, ENTRIES });
