'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { harness, build, TOP_KEYS, COMPONENT_KEYS, UNAVAILABLE } = require('./test-support.cjs');
const h = harness(), labels = h.analysis.EMOTION_LABELS.en;
const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'build-manifest.json')));
assert.equal(manifest.phase, '2B-3B-2B');
const artifact = fs.readFileSync(path.join(build.ROOT, manifest.output.file));
assert.equal(build.sha256(artifact), manifest.output.sha256);
const code = artifact.toString(), GLOBAL = 'PHEISIRAETHA_ANALYTICS_V1';
const TEST_COUNTER = '__PHEISIRAETHA_TEST_ONLY_PIPELINE_COUNTS';

function browser(beforeLoad = '') {
  const context = vm.createContext(Object.create(null), { codeGeneration: { strings: false, wasm: false } });
  const run = text => vm.runInContext(text, context, { timeout: 10000 });
  run(`
    let violations = [], currentInput, inputBefore;
    const forbidden = name => { violations.push(name); throw new Error('FORBIDDEN_RUNTIME_IO'); };
    for (const name of ${JSON.stringify(['window', 'document', 'navigator', 'localStorage', 'sessionStorage', 'indexedDB',
      'fetch', 'XMLHttpRequest', 'WebSocket', 'EventSource', 'Worker', 'importScripts', 'performance', 'crypto',
      'Intl', 'require', 'module', 'exports', 'process', 'Buffer', 'setTimeout', 'setInterval'])})
      Object.defineProperty(globalThis, name, { configurable: true, get() { return forbidden(name); } });
    const NativeDate = Date;
    globalThis.Date = new Proxy(NativeDate, {
      apply() { return forbidden('Date()'); }, construct() { return forbidden('new Date()'); },
      get(target, key) { return key === 'now' ? () => forbidden('Date.now') : Reflect.get(target, key); }
    });
    Math.random = () => forbidden('Math.random');
    Number.prototype.toLocaleString = () => forbidden('Number.toLocaleString');
    ${beforeLoad}
    const beforeKeys = Reflect.ownKeys(globalThis);
    const beforeDescriptors = Object.getOwnPropertyDescriptors(globalThis);
  `);
  function load(bytes = code) { return run(bytes); }
  function evaluate(source, adjustment = '') {
    context.inputJSON = JSON.stringify(source);
    run(`currentInput = JSON.parse(inputJSON); ${adjustment} inputBefore = JSON.stringify(currentInput);`);
    const dto = run(`${GLOBAL}.evaluate(currentInput)`);
    assert.equal(run('JSON.stringify(currentInput)'), run('inputBefore'), 'browser input remains unchanged');
    // Transfer primitive DTO data; check realm-local immutability before transfer.
    context.currentDto = dto;
    assert.equal(run(`Object.isFrozen(currentDto) && Object.isFrozen(currentDto.components) &&
      currentDto.components.every(c => Object.isFrozen(c) && Object.getPrototypeOf(c) === Object.prototype) &&
      Object.getPrototypeOf(currentDto) === Object.prototype`), true);
    const transferred = JSON.parse(run('JSON.stringify(currentDto)'));
    assert.deepEqual(Object.keys(transferred), TOP_KEYS);
    for (const c of transferred.components) assert.deepEqual(Object.keys(c), COMPONENT_KEYS);
    return transferred;
  }
  function noIO() { assert.deepEqual(JSON.parse(run('JSON.stringify(violations)')), []); }
  return { context, run, load, evaluate, noIO };
}

test('actual artifact creates exactly the one immutable facade global; all earlier globals unchanged', () => {
  const b = browser(); b.load();
  assert.deepEqual(JSON.parse(b.run('JSON.stringify(Reflect.ownKeys(globalThis).filter(k => !beforeKeys.includes(k)))')), [GLOBAL]);
  assert.equal(b.run(`beforeKeys.every(key => {
    const a = beforeDescriptors[key], b = Object.getOwnPropertyDescriptor(globalThis, key);
    return Object.is(a.value, b.value) && a.get === b.get && a.set === b.set && a.enumerable === b.enumerable &&
      a.configurable === b.configurable && a.writable === b.writable;
  })`), true);
  assert.deepEqual(JSON.parse(b.run(`JSON.stringify(Reflect.ownKeys(${GLOBAL}))`)), ['evaluate']);
  assert.equal(b.run(`Object.isFrozen(${GLOBAL}) && Object.isFrozen(${GLOBAL}.evaluate) &&
    ${GLOBAL}.evaluate.length === 1 && !Object.hasOwn(${GLOBAL}.evaluate, 'prototype')`), true);
  assert.equal(b.run(`(() => { const d = Object.getOwnPropertyDescriptor(globalThis, '${GLOBAL}');
    return d.writable === false && d.configurable === false && d.set === undefined && d.get === undefined; })()`), true);
  assert.throws(() => b.run(`'use strict'; ${GLOBAL} = {};`));
  assert.throws(() => b.run(`'use strict'; ${GLOBAL}.evaluate = () => {};`));
  assert.throws(() => b.run(`Object.defineProperty(globalThis, '${GLOBAL}', { value: {} });`));
  assert.equal(b.run(`Reflect.deleteProperty(globalThis, '${GLOBAL}')`), false);
  assert.equal(b.run(`'use strict'; delete globalThis.${GLOBAL};`), false); // Node VM global proxy returns false.
  assert.throws(() => b.run(`new ${GLOBAL}.evaluate({});`));
  b.noIO();
});
test('artifact loads with no external Node/CommonJS globals at all', () => {
  const context = vm.createContext(Object.create(null)); vm.runInContext(code, context, { timeout: 10000 });
  for (const name of ['require', 'module', 'exports', 'process', 'Buffer', 'analyze', 'assessPresentation', 'TEMPLATE_REGISTRY',
    'Analysis', 'Safety', 'sourceSnapshot', 'engineResult', 'presentationPlan', 'formatter', 'canonicalCatalog',
    'buildAnalysisSourceSnapshot', 'buildPresentationPlan', 'nextFocus', 'interpretation', TEST_COUNTER])
    assert.equal(vm.runInContext(`'${name}' in globalThis`, context), false, name);
  assert.equal(code.includes(TEST_COUNTER), false);
  for (const file of ['test-support.cjs', 'fixtures.cjs', 'runtime.test.cjs', 'formatter.test.cjs', 'browser.test.cjs'])
    assert.equal(manifest.inputGraph.some(input => input.includes(file)), false);
});
test('same actual artifact rejects a second load without replacing the first facade', () => {
  const b = browser(); b.load(); const facade = b.run(GLOBAL);
  assert.throws(() => b.load(), /ANALYTICS_NAMESPACE_COLLISION/); assert.equal(b.run(GLOBAL), facade); b.noIO();
});
for (const [name, setup] of [
  ['ordinary own', `globalThis.${GLOBAL} = { unexpected: true };`],
  ['nonconfigurable own', `Object.defineProperty(globalThis, '${GLOBAL}', { value: { unexpected: true } });`],
  ['accessor own', `Object.defineProperty(globalThis, '${GLOBAL}', { configurable: true, get() { return forbidden('collision getter'); } });`],
  ['inherited', `Object.setPrototypeOf(globalThis, { ${GLOBAL}: { unexpected: true } });`]
]) test(`namespace collision ${name}: no overwrite, alternate authority or getter invocation`, () => {
  const b = browser(setup), before = b.run(`Object.getOwnPropertyDescriptor(globalThis, '${GLOBAL}')`), keys = b.run('Reflect.ownKeys(globalThis)');
  assert.throws(() => b.load(), /ANALYTICS_NAMESPACE_COLLISION/);
  const after = b.run(`Object.getOwnPropertyDescriptor(globalThis, '${GLOBAL}')`);
  assert.equal(after?.value, before?.value); assert.equal(after?.get, before?.get);
  assert.deepEqual(b.run('Reflect.ownKeys(globalThis)'), keys); b.noIO();
});
test('load never evaluates; private instrumentation verifies exactly one Analyze/Safety call per explicit evaluate', async () => {
  const entry = fs.readFileSync(path.join(__dirname, '..', 'entry.cjs'));
  const instrument = Buffer.from(`
    const testAnalysis = require('./frozen/analysis.js'), testSafety = require('./frozen/safety.js');
    let analysisCalls = 0, safetyCalls = 0;
    const realAnalyze = testAnalysis.analyze, realAssess = testSafety.assessPresentation;
    testAnalysis.analyze = (...args) => { analysisCalls++; return realAnalyze(...args); };
    testSafety.assessPresentation = (...args) => { safetyCalls++; return realAssess(...args); };
    globalThis.${TEST_COUNTER} = () => ({ analysisCalls, safetyCalls });
  `);
  const bundled = await build.compile(Buffer.concat([instrument, entry]));
  assert.notEqual(bundled.hash, manifest.output.sha256);
  const b = browser(); b.load(bundled.bytes.toString());
  const counts = () => JSON.parse(b.run(`JSON.stringify(${TEST_COUNTER}())`));
  assert.deepEqual(counts(), { analysisCalls: 0, safetyCalls: 0 });
  b.evaluate(h.fixtures.reflection(labels, 'B4', true)); assert.deepEqual(counts(), { analysisCalls: 1, safetyCalls: 1 });
  b.evaluate({ version: '0.1.0', intent: null }); assert.deepEqual(counts(), { analysisCalls: 2, safetyCalls: 2 });
  assert.deepEqual(JSON.parse(b.run(`JSON.stringify(${GLOBAL}.evaluate({bad: undefined}))`)), UNAVAILABLE);
  assert.deepEqual(counts(), { analysisCalls: 2, safetyCalls: 2 }); b.noIO();
});

const planFailure = h.fixtures.fixture(2, labels); planFailure.intent.cycles[0].cie.primary = 'Synthetic older wording';
const parity = [
  ...h.bank.map(f => ({ name: f.name, source: f.source, mode: 'APPROVED_BUNDLE' })),
  { name: 'explicit MF3', source: h.fixtures.reflection(labels, 'B4', true), mode: 'APPROVED_BUNDLE' },
  { name: 'explicit MF4', source: h.fixtures.fixture(1, labels), mode: 'APPROVED_BUNDLE' },
  { name: 'empty primary actual Safety fallback', source: { version: '0.1.0', intent: null }, mode: 'FALLBACK_ONLY' },
  { name: 'nonfinite adapter failure', source: { invalid: null }, adjustment: 'currentInput.invalid = Infinity;', nodeAdjust: s => { s.invalid = Infinity; }, mode: 'UNAVAILABLE' },
  { name: 'actual closed TXT plan failure', source: planFailure, mode: 'UNAVAILABLE' },
  { name: 'exact decimals and negative zero', source: h.fixtures.reflection(labels, 'B4', true),
    adjustment: 'currentInput.intent.cycles[0].iep.practical = -0; currentInput.intent.cycles[0].iep.hours = 0.125;',
    nodeAdjust: s => { s.intent.cycles[0].iep.practical = -0; s.intent.cycles[0].iep.hours = 0.125; }, mode: 'APPROVED_BUNDLE' }
];
for (const f of parity) test(`Node vs bundled evaluate parity: ${f.name}`, () => {
  const nodeInput = structuredClone(f.source); f.nodeAdjust?.(nodeInput); const before = structuredClone(nodeInput);
  const node = h.evaluate(freezeForNode(nodeInput)), b = browser(); b.load();
  assert.equal(node.mode, f.mode); assert.deepEqual(b.evaluate(f.source, f.adjustment), node); assert.deepEqual(nodeInput, before); b.noIO();
});
function freezeForNode(value) { return h.freeze(value); }
test('actual facade returns new deterministic immutable DTOs with no state references', () => {
  const b = browser(); b.load(); b.context.inputJSON = JSON.stringify(h.fixtures.fixture(1, labels));
  assert.equal(b.run(`(() => {
    const input = JSON.parse(inputJSON), a = ${GLOBAL}.evaluate(input), b = ${GLOBAL}.evaluate(input), before = JSON.stringify(a);
    input.intent.cycles.length = 0;
    let blocked = 0;
    try { Object.defineProperty(a.components[0], 'text', { value: 'tamper' }); } catch { blocked++; }
    try { a.components.push({}); } catch { blocked++; }
    return a !== b && a.components !== b.components && a.components.every((c, i) => c !== b.components[i]) &&
      JSON.stringify(a) === JSON.stringify(b) && JSON.stringify(a) === before && blocked === 2;
  })()`), true); b.noIO();
});
test('actual facade rejects caller authority, executable source and getter without exposing raw data', () => {
  const b = browser(); b.load();
  for (const expression of [`${GLOBAL}.evaluate({version:'0.1.0', intent:null}, {registry:[], approval:true})`,
    `${GLOBAL}.evaluate()`, `${GLOBAL}.evaluate({fn(){}})`, `${GLOBAL}.evaluate({get version(){forbidden('source getter')}})`])
    assert.deepEqual(JSON.parse(b.run(`JSON.stringify(${expression})`)), UNAVAILABLE);
  b.noIO();
});
test('valid then failed calls never reuse earlier approved DTO or fallback', () => {
  const b = browser(); b.load(); assert.equal(b.evaluate(h.fixtures.fixture(1, labels)).mode, 'APPROVED_BUNDLE');
  assert.deepEqual(JSON.parse(b.run(`JSON.stringify(${GLOBAL}.evaluate({ invalid: undefined }))`)), UNAVAILABLE);
  assert.equal(b.evaluate({ version: '0.1.0', intent: null }).mode, 'FALLBACK_ONLY'); b.noIO();
});
