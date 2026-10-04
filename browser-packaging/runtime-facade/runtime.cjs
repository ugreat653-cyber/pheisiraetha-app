'use strict';

const analysis = require('../frozen/analysis.js');
const safety = require('../frozen/safety.js');
const { buildAnalysisSourceSnapshot } = require('../runtime-core/source-snapshot.cjs');
const { buildPresentationPlan } = require('../runtime-core/presentation-plan.cjs');
const { assertPlainData, exactKeys, requireContract: need } = require('../runtime-core/plain-data.cjs');
const { validateSafetyResult } = require('./safety-contract.cjs');
const { formatPresentation } = require('./canonical-formatter.cjs');

function renderDto(mode, components) {
  need(['APPROVED_BUNDLE', 'FALLBACK_ONLY', 'UNAVAILABLE'].includes(mode), 'RENDER_DTO_FAILURE');
  assertPlainData(components, 'RENDER_DTO_FAILURE');
  need(Array.isArray(components) && (mode === 'UNAVAILABLE' ? components.length === 0 :
    mode === 'FALLBACK_ONLY' ? components.length === 1 : [5, 9].includes(components.length)), 'RENDER_DTO_FAILURE');
  const copied = components.map(c => {
    need(exactKeys(c, ['componentId', 'surface', 'role', 'slot', 'templateId', 'templateVersion', 'text']) &&
      ['componentId', 'surface', 'role', 'slot', 'templateId', 'text'].every(key => typeof c[key] === 'string') &&
      c.templateVersion === 1, 'RENDER_DTO_FAILURE');
    return Object.freeze({ componentId: c.componentId, surface: c.surface, role: c.role, slot: c.slot,
      templateId: c.templateId, templateVersion: 1, text: c.text });
  });
  return Object.freeze({ dtoVersion: 'pheisiraetha-render-v1', mode, lang: 'en', dir: 'ltr', components: Object.freeze(copied) });
}
function unavailable() { return renderDto('UNAVAILABLE', []); }

// Method syntax gives the sole operation no constructor/prototype surface.
// No mutable cache, options, locale, plan/registry injection, logging or I/O.
const evaluate = Object.freeze({ evaluate(committedState) {
  try {
    if (arguments.length !== 1) return unavailable();
    const sourceSnapshot = buildAnalysisSourceSnapshot(committedState);
    const engineResult = analysis.analyze(sourceSnapshot);
    const presentationPlan = buildPresentationPlan({ sourceSnapshot, engineResult, trustedRegistry: safety.TEMPLATE_REGISTRY });
    const result = safety.assessPresentation({ sourceSnapshot, engineResult, presentationPlan });
    const presentation = validateSafetyResult(result);
    const components = formatPresentation(presentation);
    return renderDto(presentation.mode, components);
  } catch {
    // A new, body-free DTO for every failure. No direct Safety fallback shortcut.
    return unavailable();
  }
} }.evaluate);

module.exports = { evaluate };
