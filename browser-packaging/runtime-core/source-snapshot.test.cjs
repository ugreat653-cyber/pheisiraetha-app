'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { buildAnalysisSourceSnapshot: snapshot } = require('./source-snapshot.cjs');

const source = () => ({ version: '0.1.0', lang: 'unrecognized legacy language', unknown: { nested: [null, false, 0, '  unchanged\r\n'] },
  intent: { id: '', createdAt: 'invalid intent timestamp', ris: { primary: ' Current RIS ', extra: { retained: true } },
    cycles: [{ id: '', createdAt: 'invalid cycle timestamp', cie: { primary: 'Historical CIE' },
      iep: { practical: '07.50', emotion: 'unknown emotion', extra: [1, { flag: true }] },
      oop: { achievement: 'not a number', external: '<script>opaque</script>' }, intentional: 'no',
      revision: { primary: 'conflicting yes-like patch', unknownDimension: null }, unknownCycle: { x: ['a', 'b'] } },
    { id: 'duplicate', createdAt: 'earlier', intentional: 'yes', revision: {} },
    { id: 'duplicate', createdAt: 'earlier', intentional: null, revision: 'malformed literal' }] } });

function assertDetached(a, b) {
  if (a === null || typeof a !== 'object') { assert.ok(Object.is(a, b)); return; }
  assert.notEqual(a, b);
  assert.deepEqual(Reflect.ownKeys(a), Reflect.ownKeys(b));
  for (const key of Object.keys(a)) assertDetached(a[key], b[key]);
}
test('adapter deep detachment and exact malformed JSON data, no input mutation', () => {
  const input = source(), before = structuredClone(input), output = snapshot(input);
  assert.deepEqual(input, before);
  assert.deepEqual(output, before);
  assertDetached(input, output);
});
for (const [name, inspect] of [
  ['cycle membership/order', s => s.intent.cycles], ['unknown stored properties', s => [s.unknown, s.intent.ris.extra, s.intent.cycles[0].unknownCycle]],
  ['blank IDs', s => [s.intent.id, s.intent.cycles[0].id]], ['duplicate IDs', s => s.intent.cycles.slice(1).map(c => c.id)],
  ['invalid timestamps', s => [s.intent.createdAt, ...s.intent.cycles.map(c => c.createdAt)]],
  ['numeric strings', s => [s.intent.cycles[0].iep.practical, s.intent.cycles[0].oop.achievement]],
  ['unknown emotion', s => s.intent.cycles[0].iep.emotion], ['conflicting revision metadata', s => s.intent.cycles.map(c => [c.intentional, c.revision])],
  ['current RIS / CIE / IEP / OOP', s => [s.intent.ris, s.intent.cycles[0].cie, s.intent.cycles[0].iep, s.intent.cycles[0].oop]],
  ['strings / whitespace / legacy lang', s => [s.lang, s.unknown.nested[3], s.intent.ris.primary]]
]) test(`adapter preserves ${name}`, () => { const input = source(); assert.deepEqual(inspect(snapshot(input)), inspect(input)); });
test('missing properties remain missing; nulls remain own members', () => {
  const output = snapshot(source());
  assert.equal(Object.hasOwn(output.intent.ris, 'success'), false);
  assert.equal(Object.hasOwn(output.intent.cycles[1], 'iep'), false);
  assert.equal(Object.hasOwn(output.intent.cycles[0].revision, 'unknownDimension'), true);
  assert.equal(output.intent.cycles[0].revision.unknownDimension, null);
});
test('source mutation after capture cannot change the snapshot', () => {
  const input = source(), output = snapshot(input), before = structuredClone(output);
  input.intent.ris.primary = 'changed'; input.intent.cycles.reverse(); input.unknown.nested.push({ changed: true });
  assert.deepEqual(output, before);
});
test('snapshot mutation cannot change committed state', () => {
  const input = source(), before = structuredClone(input), output = snapshot(input);
  output.intent.cycles[0].iep.extra[1].flag = false; output.intent.cycles.pop(); output.intent.ris.extra.retained = false;
  assert.deepEqual(input, before);
});
test('own __proto__, constructor and prototype keys remain inert own data', () => {
  const input = JSON.parse('{"__proto__":{"syntheticPolluted":true},"constructor":{"prototype":3},"prototype":null}');
  const output = snapshot(input);
  assert.deepEqual(output, input); assertDetached(input, output);
  assert.equal(Object.getPrototypeOf(output), Object.prototype);
  assert.equal(Object.prototype.syntheticPolluted, undefined);
  assert.ok(Object.hasOwn(output, '__proto__'));
});
test('null-prototype records, frozen descriptors, signed zero and finite endpoints', () => {
  const input = Object.assign(Object.create(null), { signedZero: -0, small: Number.MIN_VALUE, large: Number.MAX_VALUE, nested: Object.freeze([1]) });
  Object.freeze(input);
  const output = snapshot(input);
  assert.equal(Object.getPrototypeOf(output), null); assert.ok(Object.is(output.signedZero, -0)); assertDetached(input, output);
});
test('repeated input aliases are independently detached JSON values', () => {
  const shared = { child: [1, 2] }, input = { a: shared, b: shared }, output = snapshot(input);
  assertDetached(input, output); assert.notEqual(output.a, output.b);
  output.a.child.push(3); assert.deepEqual(output.b.child, [1, 2]); assert.deepEqual(shared.child, [1, 2]);
});
test('deep plain data does not depend on recursion depth', () => {
  const input = {}; let current = input;
  for (let i = 0; i < 10000; i++) current = current.child = {};
  current.value = 'end'; let output = snapshot(input);
  for (let i = 0; i < 10000; i++) output = output.child;
  assert.equal(output.value, 'end');
});
for (const [name, make] of [
  ['undefined own member', () => ({ x: undefined })], ['undefined root', () => undefined],
  ['function', () => ({ x: () => 1 })], ['toJSON callback', () => ({ toJSON() { throw new Error('must not run'); } })],
  ['bigint', () => ({ x: 1n })], ['symbol value', () => ({ x: Symbol('x') })], ['symbol key', () => ({ [Symbol('x')]: 1 })],
  ['NaN', () => ({ x: NaN })], ['infinity', () => ({ x: Infinity })], ['negative infinity', () => ({ x: -Infinity })],
  ['Date', () => ({ x: new Date('2026-09-01') })], ['Map', () => ({ x: new Map() })],
  ['custom prototype', () => Object.create({ inherited: 1 })], ['class instance', () => new (class Source { constructor() { this.x = 1; } })()],
  ['circular object', () => { const x = {}; x.self = x; return x; }],
  ['circular array', () => { const x = []; x.push(x); return x; }],
  ['sparse array', () => [1, , 3]], ['extra array own property', () => Object.assign([1], { extra: 2 })],
  ['nonenumerable stored member', () => Object.defineProperty({}, 'hidden', { value: 1 })]
]) test(`adapter fails closed: ${name}`, () => {
  assert.throws(() => snapshot(make()), error => error.name === 'RuntimeCoreFailure' && error.code === 'SOURCE_NOT_JSON_PLAIN_DATA');
});
test('object/array accessors fail without executing getters', () => {
  let calls = 0;
  for (const input of [Object.defineProperty({}, 'x', { enumerable: true, get() { calls++; return 1; } }),
    Object.defineProperty([1], '0', { enumerable: true, get() { calls++; return 1; } })])
    assert.throws(() => snapshot(input), { code: 'SOURCE_NOT_JSON_PLAIN_DATA' });
  assert.equal(calls, 0);
});
test('JSON primitive roots are transported literally, without an empty recovery state', () => {
  for (const value of [null, true, false, 0, -0, 2.75, 'opaque']) assert.ok(Object.is(snapshot(value), value));
});
