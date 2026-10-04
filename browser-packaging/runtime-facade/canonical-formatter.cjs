'use strict';

// The exact frozen registry is an internal dependency, never a formatter argument.
const { TEMPLATE_REGISTRY } = require('../frozen/safety.js');
const { assertPlainData, exactKeys, record, equalData, requireContract: need } = require('../runtime-core/plain-data.cjs');
const { D } = require('../runtime-core/closed-catalog.cjs');
const CODE = 'CANONICAL_FORMAT_FAILURE';
const FREQUENCIES = Object.freeze(['freq0', 'freq1', 'freq2', 'freq3', 'freq4', 'freq5']);
const DIRECTIONS = Object.freeze(['toward', 'none', 'away', 'mixed', 'unknown']);
const BASES = Object.freeze(['direct', 'documented', 'otherPerson', 'subjective', 'insufficient', 'other']);
// Only U/I fixed binding constants need a local closed table: the frozen registry
// exports their metric discriminators/ranges but not these private scalar labels.
// All 30 canonical bodies and every binding definition come from the registry.
const U = Object.freeze([
  ['practical', 'practical rating', '0–10 self-report rating', 'source-record scope'],
  ['achievement', 'achievement rating', '0–10 self-report rating', 'source-record scope'],
  ['mental', 'mental-effort rating', '0–10 self-report rating', 'source-record scope'],
  ['hours', 'recorded hours', 'hours', 'past seven days per record'],
  ['desire', 'desire rating', '0–10 self-report rating', 'source-record scope'],
  ['belief', 'belief rating', '0–10 self-report rating', 'source-record scope'],
  ['emotionIntensity', 'emotion-intensity rating', '0–10 self-report rating', 'source-record scope']
].map(Object.freeze));
const I = Object.freeze([['mental', 'mental-effort'], ['emotionIntensity', 'emotion-intensity']].map(Object.freeze));
const WHY = Object.freeze(['safety.why.recordedInformationUsed', 'safety.why.ruleSelectionBasis',
  'safety.why.recordedDataLimitations', 'safety.why.conditionAssessmentUnavailable']);
const MF3 = 'safety.manifest.primaryFactualWithCapability', MF4 = 'safety.manifest.primaryAndSecondaryFactualWithCapability';

function trustedEntry(templateId, role, surface) {
  need(Array.isArray(TEMPLATE_REGISTRY) && Object.isFrozen(TEMPLATE_REGISTRY) && TEMPLATE_REGISTRY.length === 30, CODE);
  const matches = TEMPLATE_REGISTRY.filter(entry => entry.templateId === templateId);
  need(matches.length === 1, CODE);
  const entry = matches[0];
  need(Object.isFrozen(entry) && entry.templateVersion === 1 && entry.policyVersion === 'safety-v1' &&
    entry.registryVersion === 'safety-registry-v1' && entry.safetyClassification === 'ALLOW' && entry.role === role &&
    entry.allowedSurfaces.includes(surface) && typeof entry.canonicalText === 'string' &&
    Array.isArray(entry.allowedBindings) && Array.isArray(entry.manifestMembership), CODE);
  return entry;
}
function numberText(value) {
  need(typeof value === 'number' && Number.isFinite(value), CODE);
  // ECMAScript's shortest round-trip numeral, with explicit signed-zero retention.
  // No rounding operation, locale separator, unit conversion or derived arithmetic.
  return Object.is(value, -0) ? '-0' : String(value);
}
function numeric(value, range, integer = false) {
  need(typeof value === 'number' && Number.isFinite(value) && Array.isArray(range) && range.length === 2 &&
    value >= range[0] && value <= range[1] && (!integer || Number.isSafeInteger(value)), CODE);
  return numberText(value);
}
function list(value, format) {
  need(Array.isArray(value) && value.length > 0, CODE);
  return value.map(format).join(', ');
}
function token(value, values) { need(typeof value === 'string' && values.includes(value), CODE); return value; }

function metricFor(entry, bindings) {
  if (entry.row === 'E05') {
    const matches = U.filter(row => bindings.metricLabel === row[1] && bindings.units === row[2] && bindings.scope === row[3]);
    need(matches.length === 1, CODE); return matches[0][0];
  }
  if (entry.row === 'E25') {
    const matches = I.filter(row => row[1] === bindings.metricLabel);
    need(matches.length === 1, CODE); return matches[0][0];
  }
  return null;
}
function bindingText(def, value, entry, context, metric, bindings) {
  const type = def.typeByMetric ? def.typeByMetric[metric] : def.type;
  const transform = type === 'basisList' ? 'enum_record_groups_comma_then_semicolon' : type === 'dimensions' ?
    'fixed_D_order_comma_space' : ['ratingList', 'hoursList', 'frequencyList', 'directionList'].includes(type) ?
      'exact_values_comma_space' : 'exact_inert_value';
  need(def.required === true && def.transform === transform, CODE);
  const range = def.rangeByMetric ? def.rangeByMetric[metric] : def.range;
  if (['rating', 'hours', 'delta'].includes(type)) return numeric(value, range);
  if (type === 'ratingList' || type === 'hoursList') return list(value, item => numeric(item, range));
  if (type === 'emotionIndex') {
    need(entry.row !== 'E14' || value !== 9, CODE);
    return numeric(value, range, true);
  }
  if (type === 'count') {
    need(def.selector !== 'REVISION_KEY_COUNTS' || value <= bindings.eventCount, CODE);
    return numeric(value, range, true);
  }
  if (type === 'frequency') return token(value, FREQUENCIES);
  if (type === 'direction') return token(value, DIRECTIONS);
  if (type === 'frequencyList') return list(value, item => token(item, FREQUENCIES));
  if (type === 'directionList') return list(value, item => token(item, DIRECTIONS));
  if (type === 'basisList') {
    need(Array.isArray(value) && value.length > 0, CODE);
    return value.map(group => {
      need(Array.isArray(group) && group.length > 0 && new Set(group).size === group.length, CODE);
      return group.map(item => token(item, BASES)).join(', ');
    }).join('; ');
  }
  if (type === 'dimension') return token(value, D);
  if (type === 'dimensions') {
    need(Array.isArray(value) && value.length > 0 && equalData(value, D.filter(d => value.includes(d))), CODE);
    return value.join(', ');
  }
  if (type === 'ordinalChange') return token(value, ['increased', 'decreased', 'unchanged']);
  if (type === 'ruleId') {
    need(context.insight.allowedRuleIds.length === 1 && value === context.insight.allowedRuleIds[0] && value !== 'COND-01', CODE);
    return value;
  }
  if (type === 'fieldNames') {
    need(typeof value === 'string' && context.insight.engineMappings.every(m => m.fixedFields === value), CODE);
    return value;
  }
  if (['metricLabel', 'units', 'scope'].includes(type)) {
    const row = def.selector === 'I.metricLabel' ? I.find(i => i[0] === metric) : U.find(u => u[0] === metric);
    need(row !== undefined && value === row[type === 'metricLabel' ? 1 : type === 'units' ? 2 : 3], CODE);
    return value;
  }
  need(false, CODE);
}
function body(entry, bindings, context) {
  const definitions = entry.allowedBindings;
  need(exactKeys(bindings, definitions.map(def => def.name)) && new Set(definitions.map(def => def.name)).size === definitions.length, CODE);
  const placeholders = [...entry.canonicalText.matchAll(/\{([A-Za-z][A-Za-z0-9]*)\}/g)].map(match => match[1]);
  const names = new Set(placeholders);
  need(names.size === definitions.length && definitions.every(def => names.has(def.name)) &&
    !/[{}]/.test(entry.canonicalText.replace(/\{([A-Za-z][A-Za-z0-9]*)\}/g, '')), CODE);
  const metric = metricFor(entry, bindings), texts = Object.create(null), lengths = [];
  for (const def of definitions) {
    texts[def.name] = bindingText(def, bindings[def.name], entry, context, metric, bindings);
    if (def.type.endsWith('List')) lengths.push(bindings[def.name].length);
  }
  need(lengths.every(length => length === lengths[0]), CODE);
  // Exactly one pass over the trusted body. Substituted strings are never parsed.
  return entry.canonicalText.replace(/\{([A-Za-z][A-Za-z0-9]*)\}/g, (_, name) => texts[name]);
}
function component(value, slot, surface, role, manifestId, context, expectedId = null) {
  need(exactKeys(value, ['componentId', 'surface', 'role', 'slot', 'templateId', 'templateVersion', 'bindings']) &&
    value.componentId === slot && value.slot === slot && value.surface === surface && value.role === role &&
    value.templateVersion === 1 && (expectedId === null || value.templateId === expectedId), CODE);
  const entry = trustedEntry(value.templateId, role, surface);
  need(entry.manifestMembership.some(member => member.manifestId === manifestId && member.slot === slot), CODE);
  return { componentId: slot, surface, role, slot, templateId: entry.templateId, templateVersion: 1,
    text: body(entry, value.bindings, context) };
}
function surface(value, name, manifestId) {
  const primary = name === 'PRIMARY', prefix = primary ? 'primary' : 'secondary';
  need(exactKeys(value, primary ? ['insight', 'interpretation', 'why', 'nextFocus'] : ['insight', 'interpretation', 'why']) &&
    value.interpretation === null && (!primary || value.nextFocus === null) && Array.isArray(value.why) &&
    value.why.length === (primary ? 4 : 3) && record(value.insight), CODE);
  const context = { insight: trustedEntry(value.insight.templateId, 'INSIGHT', name) };
  const out = [component(value.insight, `${prefix}.insight`, name, 'INSIGHT', manifestId, context)];
  const suffixes = ['values', 'selection', 'limitations', 'capability'];
  for (let i = 0; i < value.why.length; i++) out.push(component(value.why[i], `${prefix}.why.${suffixes[i]}`,
    name, 'WHY', manifestId, context, WHY[i]));
  return out;
}

// ONLY SafetyResult.presentation is accepted. The registry and transforms are
// permanently bound above; no upstream data or caller authority is an argument.
function formatPresentation(presentation) {
  need(arguments.length === 1, CODE);
  assertPlainData(presentation, CODE);
  need(exactKeys(presentation, ['dtoVersion', 'mode', 'primary', 'secondary', 'fallback']) &&
    presentation.dtoVersion === 'safety-presentation-v1', CODE);
  if (presentation.mode === 'FALLBACK_ONLY') {
    const fallback = presentation.fallback;
    need(presentation.primary === null && presentation.secondary === null &&
      exactKeys(fallback, ['templateId', 'templateVersion', 'role', 'bindings']) &&
      fallback.templateId === 'safety.fallback.noInterpretationOrNextFocus' && fallback.templateVersion === 1 &&
      fallback.role === 'FALLBACK' && exactKeys(fallback.bindings, []), CODE);
    const entry = trustedEntry(fallback.templateId, 'FALLBACK', 'FALLBACK');
    need(entry.canonicalText === 'No interpretation or next focus is shown here.' &&
      entry.manifestMembership.some(m => m.manifestId === 'safety.manifest.fallbackOnly' && m.slot === 'fallback'), CODE);
    return [{ componentId: 'fallback', surface: 'FALLBACK', role: 'FALLBACK', slot: 'fallback', templateId: entry.templateId,
      templateVersion: 1, text: body(entry, fallback.bindings, { insight: entry }) }];
  }
  need(presentation.mode === 'APPROVED_BUNDLE' && presentation.primary !== null && presentation.fallback === null &&
    (presentation.secondary === null || record(presentation.secondary)), CODE);
  const manifestId = presentation.secondary === null ? MF3 : MF4;
  const out = surface(presentation.primary, 'PRIMARY', manifestId);
  if (presentation.secondary !== null) out.push(...surface(presentation.secondary, 'SECONDARY', manifestId));
  return out;
}

module.exports = { formatPresentation };
