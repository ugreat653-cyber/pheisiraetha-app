'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { harness, assertDto, UNAVAILABLE } = require('./test-support.cjs');
const h = harness(), labels = h.analysis.EMOTION_LABELS.en;
const fixture = () => h.fixtures.fixture(2, labels);
const last = source => source.intent.cycles.at(-1);
const stages = ['analyze', 'plan', 'assess', 'gate', 'format'];

function objects(value, found = new Set()) {
  if (value && typeof value === 'object' && !found.has(value)) {
    found.add(value);
    Object.values(value).forEach(child => objects(child, found));
  }
  return found;
}
function detached(value, ...upstream) {
  const references = new Set();
  upstream.forEach(item => objects(item, references));
  for (const item of objects(value)) assert.equal(references.has(item), false, 'no upstream object alias');
}

// Trap access, including accesses whose exceptions evaluate might catch.
// Harness staging occurs before these synchronous, transaction-only traps.
function withoutIO(operation) {
  const names = ['window', 'document', 'navigator', 'localStorage', 'sessionStorage', 'indexedDB', 'caches',
    'fetch', 'XMLHttpRequest', 'WebSocket', 'EventSource', 'Worker', 'importScripts'];
  const descriptors = names.map(name => [name, Object.getOwnPropertyDescriptor(globalThis, name)]);
  const attempts = [];
  try {
    for (const name of names) Object.defineProperty(globalThis, name, {
      configurable: true, get() { attempts.push(name); throw new Error('STATE_DATA_FORBIDDEN_IO'); }
    });
    return operation();
  } finally {
    for (const [name, descriptor] of descriptors) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else delete globalThis[name];
    }
    assert.deepEqual(attempts, [], 'no DOM, storage or network access');
  }
}

// Independent literal input copy: do not use the adapter to manufacture the
// expected state. Untouched frozen modules determine the outcome, not a blanket
// assumption that malformed data must HOLD/UNKNOWN. No harness fault hooks.
function reference(source) {
  const literal = structuredClone(source), expected = { attempted: [], dto: structuredClone(UNAVAILABLE) };
  const call = (stage, ...args) => {
    expected.attempted.push(stage);
    expected[stage] = h.originals[stage](...args);
    return expected[stage];
  };
  withoutIO(() => {
    try {
      const engineResult = call('analyze', literal);
      const presentationPlan = call('plan', { sourceSnapshot: literal, engineResult, trustedRegistry: h.registry });
      const result = call('assess', { sourceSnapshot: literal, engineResult, presentationPlan });
      const presentation = call('gate', result);
      const components = call('format', presentation);
      expected.dto = { dtoVersion: 'pheisiraetha-render-v1', mode: presentation.mode, lang: 'en', dir: 'ltr', components };
    } catch (error) {
      // The facade must represent a genuine closed pipeline failure as body-free
      // UNAVAILABLE; it must not repair the state or invent a Safety fallback.
      expected.failure = error;
    }
  });
  assert.deepEqual(literal, source, 'frozen reference computation preserves literal input');
  return expected;
}

function evaluateOnce(source, literal, expected) {
  h.reset();
  const dto = withoutIO(() => h.evaluate(source));
  assert.deepEqual(source, literal, 'committed state is not mutated');
  assert.equal(h.calls.snapshot.length, 1, 'one snapshot capture');
  assert.equal(h.calls.snapshot[0].args.length, 1);
  assert.equal(h.calls.snapshot[0].args[0], source);
  const snapshot = h.calls.snapshot[0].result;
  assert.deepEqual(snapshot, literal, 'all values, own fields, containers and array order remain literal');
  detached(snapshot, source);
  for (const stage of stages) {
    assert.equal(h.calls[stage].length, expected.attempted.includes(stage) ? 1 : 0, `${stage}: no retry or salvage`);
    if (Object.hasOwn(expected, stage)) assert.deepEqual(h.calls[stage][0].result, expected[stage], `${stage}: actual frozen result`);
  }
  assert.equal(h.calls.analyze[0].args.length, 1);
  assert.equal(h.calls.analyze[0].args[0], snapshot);
  const planCall = h.calls.plan[0];
  if (planCall) {
    assert.equal(planCall.args.length, 1);
    assert.equal(planCall.args[0].sourceSnapshot, snapshot);
    assert.equal(planCall.args[0].engineResult, h.calls.analyze[0].result);
    assert.equal(planCall.args[0].trustedRegistry, h.registry);
  }
  const safetyCall = h.calls.assess[0];
  if (safetyCall) {
    assert.equal(safetyCall.args.length, 1);
    assert.deepEqual(Object.keys(safetyCall.args[0]), ['sourceSnapshot', 'engineResult', 'presentationPlan']);
    assert.equal(safetyCall.args[0].sourceSnapshot, snapshot, 'Safety receives the same captured object');
    assert.equal(safetyCall.args[0].engineResult, h.calls.analyze[0].result);
    assert.equal(safetyCall.args[0].presentationPlan, planCall.result);
  }
  if (h.calls.gate.length) assert.equal(h.calls.gate[0].args[0], safetyCall.result);
  if (h.calls.format.length) {
    assert.equal(h.calls.format[0].args.length, 1);
    assert.equal(h.calls.format[0].args[0], safetyCall.result.presentation);
  }
  assertDto(dto, expected.dto.mode);
  assert.deepEqual(dto, expected.dto, 'full evaluate agrees with frozen Analysis/Safety and approved formatting');
  detached(dto, source, snapshot, h.registry, ...Object.values(h.calls).flatMap(calls =>
    calls.flatMap(call => [call.args, call.result])));
  return { dto, snapshot };
}

function check(source) {
  const literal = structuredClone(source), expected = reference(literal);
  const first = evaluateOnce(source, literal, expected), second = evaluateOnce(source, literal, expected);
  assert.deepEqual(first.dto, second.dto);
  detached(second.dto, first.dto);
  detached(second.snapshot, first.snapshot);
  return { ...first, literal };
}

const cases = [
  ['numeric strings', source => {
    Object.assign(last(source).iep, { desire: '07', belief: ' 6 ', mental: '6', practical: '8', emotionIntensity: '4', hours: '0.125' });
    last(source).oop.achievement = '02';
  }],
  ['unknown properties at every stored object level', source => {
    const payload = { text: '  stored literal  ', list: [null, '08', { nested: true }] };
    for (const container of [source, source.intent, source.intent.ris, last(source), last(source).cie, last(source).iep, last(source).oop])
      container.unknownStored = structuredClone(payload);
  }],
  ['duplicate cycle IDs', source => { last(source).id = source.intent.cycles[0].id; }],
  ['blank cycle ID', source => { last(source).id = ''; }],
  ['whitespace cycle ID', source => { last(source).id = ' \t\r\n '; }],
  ['reversed chronology and supplied array order', source => { source.intent.cycles.reverse(); }],
  ['equal cycle timestamps', source => { last(source).createdAt = source.intent.cycles[0].createdAt; }],
  ['cycle before intent timestamp', source => { source.intent.cycles[0].createdAt = '2026-08-30T12:00:00Z'; }],
  ['invalid timestamp', source => { last(source).createdAt = 'stored-invalid-timestamp'; }],
  ['unsure with nonempty revision patch', source => {
    last(source).intentional = 'unsure'; last(source).revision = { scope: '  conflicting stored scope  ' };
  }],
  ['yes with empty revision patch', source => { last(source).intentional = 'yes'; }],
  ['invalid revision key', source => {
    last(source).intentional = 'yes'; last(source).revision = { unregisteredDimension: 'stored value' };
  }],
  ['invalid revision value types', source => {
    last(source).intentional = 'yes'; last(source).revision = { scope: 7, success: null, rationale: ['stored value'] };
  }],
  ['null cycle entry', source => { source.intent.cycles[1] = null; }],
  ['scalar cycle entry', source => { source.intent.cycles[1] = 'stored malformed cycle'; }]
];
for (const [name, container, key, wrong] of [
  ['intent', source => source, 'intent', 'stored malformed intent'],
  ['RIS', source => source.intent, 'ris', ['stored malformed reference']],
  ['cycles', source => source.intent, 'cycles', { stored: 'malformed cycle container' }],
  ['CIE', last, 'cie', null],
  ['IEP', last, 'iep', 'stored malformed IEP'],
  ['OOP', last, 'oop', []],
  ['revision', last, 'revision', 17]
]) {
  cases.push([`missing ${name} container`, source => { delete container(source)[key]; }]);
  cases.push([`wrong ${name} container`, source => { container(source)[key] = structuredClone(wrong); }]);
}
for (const [name, change] of cases) test(`evaluate stored state: ${name}`, () => {
  const source = fixture(); change(source); check(source);
});

// These are supplied before/after committed states, not production save hooks,
// loader/import behavior, DOM generation checks or a second revision executor.
test('next evaluate after RIS edit preserves current RIS and untouched historical cycles', () => {
  const before = h.fixtures.revision(labels, 2), previous = check(before);
  const oldDto = structuredClone(previous.dto), after = structuredClone(before);
  for (const dimension of h.fixtures.D) after.intent.ris[dimension] = `  committed edited ${dimension}\r\n`;
  const current = check(after);
  assert.deepEqual(current.snapshot.intent.ris, after.intent.ris);
  assert.deepEqual(current.snapshot.intent.cycles, before.intent.cycles, 'RIS editing cannot rewrite stored cycles');
  assert.notEqual(current.snapshot.intent.ris.scope, current.snapshot.intent.cycles.at(-1).revision.scope, 'historical patch is not reapplied');
  assert.deepEqual(previous.snapshot, previous.literal, 'earlier capture remains stable');
  assert.deepEqual(previous.dto, oldDto, 'earlier DTO remains detached from the next transaction');
  assert.deepEqual(before, previous.literal);
  detached(current.snapshot, previous.snapshot, before);
  detached(current.dto, previous.dto);
});

test('next evaluate after completed check-in sees supplied append/order and never reapplies revision', () => {
  const before = fixture(), previous = check(before), oldDto = structuredClone(previous.dto);
  const after = structuredClone(before), completed = structuredClone(h.fixtures.fixture(3, labels).intent.cycles[2]);
  completed.intentional = 'yes';
  completed.revision = { scope: 'stored patch retained as historical metadata' };
  after.intent.ris.scope = '  actual supplied current RIS after commit  ';
  after.intent.cycles.push(completed);
  const current = check(after);
  assert.deepEqual(current.snapshot.intent.ris, after.intent.ris);
  assert.deepEqual(current.snapshot.intent.cycles, after.intent.cycles, 'supplied cycle order and completed record are unchanged');
  assert.deepEqual(current.snapshot.intent.cycles.slice(0, -1), before.intent.cycles, 'historical cycles are not rewritten');
  assert.deepEqual(current.snapshot.intent.cycles.at(-1).revision, completed.revision);
  assert.notEqual(current.snapshot.intent.ris.scope, completed.revision.scope, 'stored revision is not executed again');
  assert.deepEqual(previous.snapshot, previous.literal);
  assert.deepEqual(previous.dto, oldDto);
  assert.deepEqual(before, previous.literal);
  detached(current.snapshot, previous.snapshot, before);
  detached(current.dto, previous.dto);
});
