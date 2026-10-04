'use strict';

const { assertPlainData, exactKeys, equalData, requireContract: need } = require('../runtime-core/plain-data.cjs');
const ENGINE_REFERENCE = Object.freeze({ codeCommit: '94b112488e576e08495443d93c048a528c39aac7',
  engineVersion: 'analysis-phase2a-beta-heuristics-v1', sourceCommit: '255a5d9d27461dcacaebc1bc80ab322dd54b4de8', sourceVersion: '0.1.0' });
const STATUSES = Object.freeze(['EMPTY', 'READY', 'LIMITED', 'INSUFFICIENT', 'MIXED', 'SAFETY_HOLD', 'UNSUPPORTED_SOURCE']);
const nullableString = value => value === null || (typeof value === 'string' && value.length > 0);
// Validate diagnostic shape only. Neither diagnostics nor their verdict/reasons
// grant formatting permission: the actual coherent presentation is still required.
function diagnostic(value) {
  return exactKeys(value, ['componentId', 'surface', 'role', 'templateId', 'templateVersion', 'verdict', 'reasonCodes']) &&
    nullableString(value.componentId) && nullableString(value.templateId) &&
    (value.surface === null || ['PRIMARY', 'SECONDARY', 'FALLBACK'].includes(value.surface)) &&
    (value.role === null || ['INSIGHT', 'INTERPRETATION', 'WHY', 'NEXT_FOCUS', 'FALLBACK'].includes(value.role)) &&
    (value.templateVersion === null || (Number.isSafeInteger(value.templateVersion) && value.templateVersion > 0)) &&
    ['ALLOW', 'HOLD', 'UNKNOWN'].includes(value.verdict) && Array.isArray(value.reasonCodes) &&
    value.reasonCodes.length > 0 && value.reasonCodes.every(code => typeof code === 'string' && code.length > 0);
}

// Private compatibility gate. Diagnostic arrays never grant presentation authority.
// Its only returned value is the actual presentation in the supplied Safety result.
function validateSafetyResult(result) {
  const code = 'INCOMPATIBLE_SAFETY_RESULT';
  assertPlainData(result, code);
  need(exactKeys(result, ['safetyVersion', 'registryVersion', 'verdict', 'objectiveMeaning', 'causality', 'engineReference',
    'engineStatus', 'engineReleaseStatus', 'componentResults', 'bundleReasonCodes', 'presentation', 'fallbackVerdict', 'persisted']), code);
  need(result.safetyVersion === 'safety-v1' && result.registryVersion === 'safety-registry-v1' &&
    result.objectiveMeaning === 'UNKNOWN' && result.causality === 'not_determined' && result.persisted === false &&
    equalData(result.engineReference, ENGINE_REFERENCE) && (result.engineStatus === null || STATUSES.includes(result.engineStatus)) &&
    (result.engineReleaseStatus === null || result.engineReleaseStatus === 'NOT_RELEASED_TO_USER') &&
    Array.isArray(result.componentResults) && result.componentResults.every(diagnostic) && Array.isArray(result.bundleReasonCodes) &&
    result.bundleReasonCodes.every(value => typeof value === 'string' && value.length > 0), code);
  const presentation = result.presentation;
  need(exactKeys(presentation, ['dtoVersion', 'mode', 'primary', 'secondary', 'fallback']) &&
    presentation.dtoVersion === 'safety-presentation-v1', code);
  if (result.verdict === 'ALLOW') {
    need(presentation.mode === 'APPROVED_BUNDLE' && presentation.primary !== null && presentation.fallback === null &&
      result.fallbackVerdict === null && result.engineStatus !== null && result.engineReleaseStatus === 'NOT_RELEASED_TO_USER', code);
  } else {
    need(['HOLD', 'UNKNOWN'].includes(result.verdict) && presentation.mode === 'FALLBACK_ONLY' &&
      presentation.primary === null && presentation.secondary === null && result.fallbackVerdict === 'ALLOW' &&
      exactKeys(presentation.fallback, ['templateId', 'templateVersion', 'role', 'bindings']) &&
      presentation.fallback.templateId === 'safety.fallback.noInterpretationOrNextFocus' &&
      presentation.fallback.templateVersion === 1 && presentation.fallback.role === 'FALLBACK' &&
      exactKeys(presentation.fallback.bindings, []), code);
  }
  return presentation;
}

module.exports = { validateSafetyResult };
