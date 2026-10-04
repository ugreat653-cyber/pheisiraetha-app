'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { harness, build, assertDto, TOP_KEYS, COMPONENT_KEYS, UNAVAILABLE } = require('./test-support.cjs');

const h = harness(), labels = h.analysis.EMOTION_LABELS.en;
const GLOBAL = 'PHEISIRAETHA_ANALYTICS_V1';
const PROBE = '__PHEISIRAETHA_TEST_ONLY_BROWSER_GAP';
const STAGES = ['snapshot', 'analyze', 'plan', 'assess', 'gate', 'format'];
const MF3 = 'safety.manifest.primaryFactualWithCapability';
const MF4 = 'safety.manifest.primaryAndSecondaryFactualWithCapability';
const FALLBACK = 'No interpretation or next focus is shown here.';
const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'build-manifest.json')));
const artifact = fs.readFileSync(path.join(build.ROOT, manifest.output.file));
assert.equal(build.sha256(artifact), manifest.output.sha256);
assert.equal(artifact.includes(PROBE), false, 'private capture must not exist in the shipped artifact');
assert.equal(manifest.inputGraph.includes('runtime-facade/browser-package-gap.test.cjs'), false);

// The identical test-only fault is applied to the real Analysis result at the
// Safety boundary in both realms. Neither Analysis nor Safety is replaced.
function holdRequest(request) {
  return { ...request, engineResult: { ...request.engineResult,
    safety: { ...request.engineResult.safety, externalDecision: 'HOLD' } } };
}

// Reuse the existing temporary materialization/bundling harness. Only this
// private entry prefix is instrumented; frozen modules and the real entry stay
// byte-identical, and compile() writes no production artifact or manifest.
const instrument = Buffer.from(`
  const probe = { fault: 'none', calls: Object.fromEntries(${JSON.stringify(STAGES)}.map(s => [s, []])) };
  const holdRequest = (${holdRequest.toString()});
  function capture(target, name, stage) {
    const actual = target[name];
    target[name] = (...args) => {
      const call = { args }; probe.calls[stage].push(call);
      try { call.result = actual(...args); return call.result; }
      catch (error) { call.errorCode = error.code; throw error; }
    };
  }
  capture(require('./runtime-core/source-snapshot.cjs'), 'buildAnalysisSourceSnapshot', 'snapshot');
  capture(require('./frozen/analysis.js'), 'analyze', 'analyze');
  capture(require('./runtime-core/presentation-plan.cjs'), 'buildPresentationPlan', 'plan');
  const safety = require('./frozen/safety.js'), actualAssess = safety.assessPresentation;
  safety.assessPresentation = request => {
    const effectiveRequest = probe.fault === 'hold' ? holdRequest(request) : request;
    const call = { args: [effectiveRequest] }; probe.calls.assess.push(call);
    call.result = actualAssess(effectiveRequest);
    call.returned = probe.fault === 'registry-version'
      ? { ...call.result, registryVersion: 'test-only-incompatible-registry' } : call.result;
    return call.returned;
  };
  capture(require('./runtime-facade/safety-contract.cjs'), 'validateSafetyResult', 'gate');
  capture(require('./runtime-facade/canonical-formatter.cjs'), 'formatPresentation', 'format');
  globalThis.${PROBE} = probe;
`);
let bundlePromise;

async function browser() {
  bundlePromise ||= build.compile(Buffer.concat([instrument,
    fs.readFileSync(path.join(__dirname, '..', 'entry.cjs'))]));
  const bundled = await bundlePromise;
  assert.notEqual(bundled.hash, manifest.output.sha256);
  const context = vm.createContext(Object.create(null), { codeGeneration: { strings: false, wasm: false } });
  const run = code => vm.runInContext(code, context, { timeout: 10000 });
  run(bundled.bytes.toString());
  const probe = run(PROBE);
  for (const stage of STAGES) assert.equal(probe.calls[stage].length, 0, 'load must not evaluate');
  assert.deepEqual(structuredClone(run(`Reflect.ownKeys(${GLOBAL})`)), ['evaluate']);
  function evaluate(source) {
    context.inputJSON = JSON.stringify(source);
    context.currentInput = run('JSON.parse(inputJSON)');
    const before = structuredClone(context.currentInput);
    const dto = run(`${GLOBAL}.evaluate(currentInput)`);
    assert.deepEqual(structuredClone(context.currentInput), before);
    context.currentDto = dto;
    assert.equal(run(`Object.isFrozen(currentDto) && Object.isFrozen(currentDto.components) &&
      Object.getPrototypeOf(currentDto) === Object.prototype && currentDto.components.every(c =>
        Object.isFrozen(c) && Object.getPrototypeOf(c) === Object.prototype)`), true);
    assert.deepEqual(Object.keys(dto), TOP_KEYS);
    for (const component of dto.components) assert.deepEqual(Object.keys(component), COMPONENT_KEYS);
    return dto;
  }
  return { probe, evaluate };
}

function nodeEvaluate(source, fault) {
  let safetyRequest;
  h.reset({ assess: (actual, [request]) => {
    safetyRequest = fault === 'hold' ? holdRequest(request) : request;
    return actual(safetyRequest);
  } });
  const input = h.freeze(structuredClone(source)), before = structuredClone(input);
  const dto = h.evaluate(input);
  assert.deepEqual(input, before);
  return { calls: h.calls, safetyRequest, dto };
}

async function internalParity(source, mode, count, fault = 'none') {
  const node = nodeEvaluate(source, fault), b = await browser();
  b.probe.fault = fault;
  const bundledDto = b.evaluate(source), bundled = b.probe.calls;
  assertDto(node.dto, mode);
  assert.equal(bundledDto.mode, mode);
  assert.equal(node.dto.components.length, count);
  assert.equal(bundledDto.components.length, count);
  for (const stage of STAGES) {
    assert.equal(node.calls[stage].length, 1, `Node ${stage} executes once`);
    assert.equal(bundled[stage].length, 1, `bundled ${stage} executes once`);
  }
  const analysisResult = node.calls.analyze[0].result, safetyResult = node.calls.assess[0].result;
  assert.equal(analysisResult.engineVersion, 'analysis-phase2a-beta-heuristics-v1');
  assert.equal(safetyResult.safetyVersion, 'safety-v1');
  assert.equal(safetyResult.registryVersion, 'safety-registry-v1');
  // Transfer the ENTIRE internal results, not the render DTO, a projection, or
  // JSON-normalized data. structuredClone preserves numeric values/membership.
  assert.deepEqual(structuredClone(bundled.analyze[0].result), analysisResult, 'complete AnalysisResult parity');
  assert.deepEqual(structuredClone(bundled.assess[0].result), safetyResult, 'complete SafetyResult parity');
  assert.deepEqual(structuredClone(bundled.snapshot[0].result), node.calls.snapshot[0].result);
  assert.deepEqual(structuredClone(bundled.plan[0].result), node.calls.plan[0].result);
  assert.deepEqual(structuredClone(bundled.assess[0].args[0]), node.safetyRequest, 'same effective Safety input');
  for (const [calls, request] of [[node.calls, node.safetyRequest], [bundled, bundled.assess[0].args[0]]]) {
    const snapshot = calls.snapshot[0].result;
    assert.equal(calls.analyze[0].args[0], snapshot);
    assert.equal(calls.plan[0].args[0].sourceSnapshot, snapshot);
    assert.equal(calls.plan[0].args[0].engineResult, calls.analyze[0].result);
    assert.equal(request.sourceSnapshot, snapshot);
    assert.equal(request.presentationPlan, calls.plan[0].result);
    if (fault === 'none') assert.equal(request.engineResult, calls.analyze[0].result);
    else {
      assert.notEqual(request.engineResult, calls.analyze[0].result);
      assert.equal(request.engineResult.safety.externalDecision, 'HOLD');
      assert.equal(calls.analyze[0].result.safety.externalDecision, 'UNKNOWN', 'fault must not mutate actual AnalysisResult');
    }
    assert.equal(calls.gate[0].args[0], calls.assess[0].result);
    assert.equal(calls.format[0].args[0], calls.assess[0].result.presentation);
  }
  return { analysisResult, safetyResult, plan: node.calls.plan[0].result, dto: node.dto };
}

function approved(result, manifestId, count, secondary) {
  assert.notEqual(result.analysisResult.primary, null);
  assert.equal(result.analysisResult.secondary !== null, secondary);
  assert.equal(result.plan.manifestId, manifestId);
  assert.equal(result.plan.components.length, count);
  assert.equal(result.safetyResult.verdict, 'ALLOW');
  assert.equal(result.safetyResult.componentResults.length, count);
  assert.equal(result.safetyResult.componentResults.every(c => c.verdict === 'ALLOW'), true);
  assert.equal(result.safetyResult.presentation.mode, 'APPROVED_BUNDLE');
  assert.notEqual(result.safetyResult.presentation.primary, null);
  assert.equal(result.safetyResult.presentation.secondary !== null, secondary);
  assert.equal(result.safetyResult.presentation.fallback, null);
}

function fallback(result, verdict) {
  assert.equal(result.safetyResult.verdict, verdict);
  assert.equal(result.safetyResult.presentation.mode, 'FALLBACK_ONLY');
  assert.equal(result.safetyResult.presentation.primary, null);
  assert.equal(result.safetyResult.presentation.secondary, null);
  assert.equal(result.safetyResult.fallbackVerdict, 'ALLOW');
  assert.deepEqual(result.safetyResult.presentation.fallback, {
    templateId: 'safety.fallback.noInterpretationOrNextFocus', templateVersion: 1, role: 'FALLBACK', bindings: {}
  });
  assert.equal(result.dto.components[0].text, FALLBACK);
}

test('MF3 ALLOW: complete internal Node vs bundled AnalysisResult and SafetyResult parity', async () => {
  const result = await internalParity(h.fixtures.reflection(labels, 'B4', true), 'APPROVED_BUNDLE', 5);
  approved(result, MF3, 5, false);
});

test('MF4 ALLOW: complete internal Node vs bundled AnalysisResult and SafetyResult parity', async () => {
  const result = await internalParity(h.fixtures.fixture(1, labels), 'APPROVED_BUNDLE', 9);
  approved(result, MF4, 9, true);
});

test('empty primary: actual frozen Safety fallback and complete internal parity', async () => {
  const result = await internalParity({ version: '0.1.0', intent: null }, 'FALLBACK_ONLY', 1);
  assert.equal(result.analysisResult.status, 'EMPTY');
  assert.equal(result.analysisResult.primary, null);
  assert.equal(result.analysisResult.secondary, null);
  assert.equal(result.plan.manifestId, null);
  assert.deepEqual(result.plan.components, []);
  assert.deepEqual(result.safetyResult.componentResults, []);
  assert.ok(result.safetyResult.bundleReasonCodes.includes('EMPTY_ANALYTICAL_PLAN'));
  fallback(result, 'UNKNOWN');
});

test('actual frozen Safety HOLD: identical private fault and complete internal parity', async () => {
  const result = await internalParity(h.fixtures.fixture(1, labels), 'FALLBACK_ONLY', 1, 'hold');
  assert.notEqual(result.analysisResult.primary, null);
  assert.notEqual(result.analysisResult.secondary, null);
  assert.equal(result.plan.manifestId, MF4);
  assert.equal(result.plan.components.length, 9);
  assert.equal(result.safetyResult.componentResults.length, 9);
  assert.ok(result.safetyResult.bundleReasonCodes.includes('UPSTREAM_HOLD'));
  fallback(result, 'HOLD');
});

test('registry-version mismatch after ALLOW: bundled evaluate returns fresh empty UNAVAILABLE', async () => {
  const b = await browser(), source = h.fixtures.fixture(1, labels);
  const first = b.evaluate(source), before = structuredClone(first), calls = b.probe.calls;
  assert.equal(first.mode, 'APPROVED_BUNDLE');
  assert.equal(first.components.length, 9);
  assert.equal(calls.assess[0].result.verdict, 'ALLOW');
  assert.equal(calls.assess[0].result.registryVersion, 'safety-registry-v1');
  assert.equal(calls.plan[0].result.manifestId, MF4);
  b.probe.fault = 'registry-version';
  const failed = b.evaluate(source), failedAgain = b.evaluate(source);
  for (const dto of [failed, failedAgain]) {
    assert.deepEqual(structuredClone(dto), UNAVAILABLE);
    assert.notEqual(dto, first);
    assert.notEqual(dto.components, first.components);
  }
  assert.notEqual(failed, failedAgain);
  assert.notEqual(failed.components, failedAgain.components);
  assert.deepEqual(structuredClone(first), before, 'earlier approved DTO remains unchanged');
  for (const stage of STAGES) assert.equal(calls[stage].length, stage === 'format' ? 1 : 3, stage);
  for (const i of [1, 2]) {
    assert.notEqual(calls.analyze[i].result, calls.analyze[i - 1].result);
    assert.notEqual(calls.assess[i].result, calls.assess[i - 1].result);
    assert.deepEqual(structuredClone(calls.analyze[i].result), structuredClone(calls.analyze[0].result));
    assert.deepEqual(structuredClone(calls.assess[i].result), structuredClone(calls.assess[0].result));
    assert.equal(calls.assess[i].result.verdict, 'ALLOW', 'real Safety runs before the compatibility fault');
    assert.deepEqual(structuredClone(calls.assess[i].returned), {
      ...structuredClone(calls.assess[i].result), registryVersion: 'test-only-incompatible-registry'
    });
    assert.notEqual(calls.assess[i].returned, calls.assess[i].result);
    assert.equal(calls.gate[i].args[0], calls.assess[i].returned);
    assert.equal(calls.gate[i].errorCode, 'INCOMPATIBLE_SAFETY_RESULT');
    assert.equal(Object.hasOwn(calls.gate[i], 'result'), false);
  }
});
