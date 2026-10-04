'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { harness, freeze, build } = require('./test-support.cjs');
const h = harness();
// Independent text oracle: the frozen registry specification, not formatter code.
const doc = build.git('show', 'ba46070bbcd42af51fb534c3282dd8a350bcfb20:PHEISIRAETHA_SAFETY_TEMPLATE_REGISTRY_V1.md').toString();
const canonical = new Map([...doc.matchAll(/^\| (E\d+) \| "(.*)" \|$/gm)].map(m => [m[1], m[2]]));
assert.equal(canonical.size, 30);
const approved = h.bank.map(f => ({ ...f, result: h.approved(f.source) }));
const fallback = h.approved({ version: '0.1.0', intent: null }).presentation;
const components = p => [p.primary?.insight, ...(p.primary?.why ?? []), p.secondary?.insight, ...(p.secondary?.why ?? [])].filter(Boolean);
const seen = new Set();
function inert(value) {
  if (Array.isArray(value)) return value.map(inert).join(Array.isArray(value[0]) ? '; ' : ', ');
  return Object.is(value, -0) ? '-0' : String(value);
}
function expected(row, bindings) { return canonical.get(row).replace(/\{([^}]+)\}/g, (_, name) => inert(bindings[name])); }
function presentation(row) { return structuredClone(approved.find(f => f.row === row).result.presentation); }
function insight(p, row) { return components(p).find(c => h.registry.find(e => e.templateId === c.templateId).row === row); }
function formatted(p, c) { return h.format(p).find(out => out.componentId === c.componentId).text; }

for (const fixture of approved) test(`actual frozen Safety presentation formats: ${fixture.name}`, () => {
  assert.equal(fixture.result.verdict, 'ALLOW');
  const p = freeze(structuredClone(fixture.result.presentation)), before = structuredClone(p), out = h.format(p);
  const inputs = components(p);
  assert.equal(out.length, p.secondary === null ? 5 : 9);
  for (let i = 0; i < out.length; i++) {
    const entry = h.registry.find(e => e.templateId === inputs[i].templateId);
    seen.add(entry.row); assert.equal(entry.canonicalText, canonical.get(entry.row));
    assert.equal(out[i].text, expected(entry.row, inputs[i].bindings));
    assert.equal(out[i].componentId, inputs[i].componentId);
    assert.equal(/[{}]/.test(out[i].text), false);
  }
  assert.deepEqual(p, before);
});
test('coverage includes every one of 25 INSIGHT bodies and E27/E28/E29/E30', () => {
  assert.deepEqual([...seen].sort(), h.registry.filter(e => e.role !== 'FALLBACK').map(e => e.row).sort());
  assert.equal(h.registry.filter(e => e.role === 'INSIGHT' && seen.has(e.row)).length, 25);
});
test('actual Safety fallback formats the exact registered E01 body and identity', () => {
  assert.deepEqual(h.format(fallback), [{ componentId: 'fallback', surface: 'FALLBACK', role: 'FALLBACK', slot: 'fallback',
    templateId: 'safety.fallback.noInterpretationOrNextFocus', templateVersion: 1, text: canonical.get('E01') }]);
  assert.equal(canonical.get('E01'), 'No interpretation or next focus is shown here.');
});
test('E27/E28/E29/E30 are exact, complete and ordered', () => {
  const p = presentation('E02'), out = h.format(p);
  for (let i = 0; i < 4; i++) assert.equal(out[i + 1].text, expected(`E${27 + i}`, p.primary.why[i].bindings));
  assert.deepEqual(out.slice(1, 5).map(c => c.slot), ['primary.why.values', 'primary.why.selection', 'primary.why.limitations', 'primary.why.capability']);
  assert.equal(out[4].text, 'Typed linked condition assessment is unavailable in the current data. This does not establish that any condition is missing, necessary or sufficient.');
});
test('decimal numerals, negative zero, tiny values and approved delta are preserved without recomputation', () => {
  const p = presentation('E05'), c = insight(p, 'E05');
  for (const [before, after, delta] of [[-0, 0.30000000000000004, 0.125], [1e-7, 9.999999999999998, -9.75]]) {
    Object.assign(c.bindings, { before, after, delta });
    assert.equal(formatted(p, c), expected('E05', c.bindings));
    assert.ok(formatted(p, c).includes(`before ${inert(before)}; after ${inert(after)}`));
    assert.ok(formatted(p, c).includes(inert(delta)));
  }
});
test('hours use their own frozen range without conversion or locale separators', () => {
  const p = structuredClone(approved.find(f => f.name === 'CMP hours').result.presentation), c = insight(p, 'E05');
  Object.assign(c.bindings, { before: 0.125, after: 168, delta: 167.875 });
  assert.equal(formatted(p, c), expected('E05', c.bindings));
  c.bindings.after = 168.00000000000003; assert.throws(() => h.format(p));
});
test('ordinary approved numeric/enum lists use comma-space in record order', () => {
  const p = presentation('E17'), c = insight(p, 'E17');
  c.bindings.ratings = [0, 2.125, 10]; c.bindings.directions = ['none', 'toward', 'away'];
  assert.equal(formatted(p, c), expected('E17', c.bindings));
  assert.ok(formatted(p, c).includes('0, 2.125, 10')); assert.ok(formatted(p, c).includes('none, toward, away'));
});
test('basis record groups use inner comma-space and outer semicolon-space', () => {
  const p = presentation('E17'), c = insight(p, 'E17');
  c.bindings.bases = [['direct', 'documented'], ['subjective'], ['otherPerson', 'other']];
  assert.equal(formatted(p, c), expected('E17', c.bindings));
  assert.ok(formatted(p, c).includes('direct, documented; subjective; otherPerson, other'));
});
test('revision dimensions follow frozen D order; no sorting or repair of malformed lists', () => {
  const p = presentation('E21'), c = insight(p, 'E21'); c.bindings.dimensions = [...h.fixtures.D];
  assert.ok(formatted(p, c).includes('primary, success, scope, nonGoals, constraints, rationale'));
  for (const invalid of [['scope', 'success'], ['success', 'success'], [], ['unknown']]) {
    c.bindings.dimensions = invalid; assert.throws(() => h.format(p));
  }
});
test('revision count formatting retains all six counts including zeros', () => {
  const p = presentation('E22'), c = insight(p, 'E22');
  assert.deepEqual(c.bindings, { eventCount: 3, primaryCount: 0, successCount: 3, scopeCount: 3,
    nonGoalsCount: 0, constraintsCount: 0, rationaleCount: 0 });
  assert.equal(formatted(p, c), 'Recorded explicit revision-selection events: 3. Selected dimension-key counts: primary 0; success 3; scope 3; nonGoals 0; constraints 0; rationale 0. These counts do not assess revision quality or apply a revision.');
  c.bindings.primaryCount = 4; assert.throws(() => h.format(p));
});
test('ordinal is limited to increased/decreased/unchanged; fixed enums are inert exact strings', () => {
  const p = presentation('E06'), c = insight(p, 'E06');
  for (const ordinalChange of ['increased', 'decreased', 'unchanged']) {
    c.bindings.ordinalChange = ordinalChange; assert.equal(formatted(p, c), expected('E06', c.bindings));
  }
  c.bindings.ordinalChange = 'improved'; assert.throws(() => h.format(p));
  c.bindings.ordinalChange = 'unchanged'; c.bindings.before = 'freq6'; assert.throws(() => h.format(p));
});

for (const [name, mutate] of [
  ['missing binding', c => { delete c.bindings.before; }], ['extra binding', c => { c.bindings.text = 'caller prose'; }],
  ['numeric string', c => { c.bindings.before = '4'; }], ['wrong range', c => { c.bindings.after = 11; }],
  ['delta wrong range', c => { c.bindings.delta = -11; }], ['nonfinite', c => { c.bindings.before = NaN; }],
  ['unknown template', c => { c.templateId = 'caller.template'; }], ['wrong version', c => { c.templateVersion = 2; }],
  ['role', c => { c.role = 'INTERPRETATION'; }], ['surface', c => { c.surface = 'SECONDARY'; }],
  ['slot', c => { c.slot = 'primary.nextFocus'; }], ['component identity', c => { c.componentId = 'another'; }],
  ['extra component key', c => { c.rawSelector = 'iep.practical'; }], ['missing component key', c => { delete c.slot; }],
  ['wrong metric scalar tuple', c => { c.bindings.units = 'percent'; }], ['free HTML string', c => { c.bindings.metricLabel = '<b>practical</b>'; }],
  ['free Markdown string', c => { c.bindings.scope = '**source**'; }]
]) test(`malformed component ${name}: entire format rejected`, () => {
  const p = presentation('E05'); mutate(p.primary.insight); assert.throws(() => h.format(p));
});
for (const [name, mutate] of [
  ['missing E30', p => { p.primary.why.pop(); }], ['wrong E30', p => { p.primary.why[3].templateId = p.primary.why[2].templateId; }],
  ['Why order', p => { p.primary.why.reverse(); }], ['secondary missing component', p => { p.secondary.why.pop(); }],
  ['secondary mismatch', p => { p.secondary.insight.templateId = 'unknown'; }], ['primary missing', p => { p.primary = null; }],
  ['interpretation', p => { p.primary.interpretation = {}; }], ['nextFocus', p => { p.primary.nextFocus = {}; }],
  ['secondary nextFocus', p => { p.secondary.nextFocus = null; }], ['extra top key', p => { p.sourceSnapshot = {}; }],
  ['missing top key', p => { delete p.fallback; }], ['unknown mode', p => { p.mode = 'ALLOW'; }],
  ['wrong DTO version', p => { p.dtoVersion = 'future'; }], ['fallback in approved', p => { p.fallback = fallback.fallback; }],
  ['Why fixed fields mismatch', p => { p.primary.why[0].bindings.fieldNames = 'caller fields'; }],
  ['Why selected rule mismatch', p => { p.primary.why[1].bindings.ruleId = 'COND-01'; }]
]) test(`presentation ${name}: no component salvage or manifest downgrade`, () => {
  const p = presentation('E05'); mutate(p); assert.throws(() => h.format(p));
});
test('list lengths/types, basis enums/duplicates and fractional counts reject whole format', () => {
  for (const mutate of [c => { c.bindings.ratings.pop(); }, c => { c.bindings.ratings[0] = '2'; },
    c => { c.bindings.bases[0] = []; }, c => { c.bindings.bases[0] = ['direct', 'direct']; },
    c => { c.bindings.bases[0] = ['caller words']; }]) {
    const p = presentation('E17'); mutate(insight(p, 'E17')); assert.throws(() => h.format(p));
  }
  const p = presentation('E22'); insight(p, 'E22').bindings.eventCount = 1.5; assert.throws(() => h.format(p));
});
for (const [name, mutate] of [
  ['missing placeholder', e => { e.canonicalText = e.canonicalText.replace('{before}', 'removed'); }],
  ['extra placeholder', e => { e.canonicalText += ' {callerText}'; }],
  ['malformed placeholder', e => { e.canonicalText += ' {bad_placeholder}'; }],
  ['unsupported transform', e => { e.allowedBindings[0].transform = 'locale_percentage'; }],
  ['missing required flag', e => { e.allowedBindings[0].required = false; }],
  ['registry version', e => { e.registryVersion = 'future'; }]
]) test(`private registry fault ${name}: format rejects (no production injection API)`, () => {
  const edited = harness(registry => mutate(registry.find(e => e.row === 'E05')));
  assert.throws(() => edited.format(presentation('E05')));
});
test('formatter has one presentation argument; all upstream/authority inputs are rejected', () => {
  assert.equal(h.format.length, 1); assert.throws(() => h.format(presentation('E05'), h.registry));
  assert.throws(() => h.format({ ...presentation('E05'), engineResult: {} }));
  const p = presentation('E05'); Object.defineProperty(p, 'mode', { enumerable: true, get() { throw new Error('getter must not run'); } });
  assert.throws(() => h.format(p), /CANONICAL_FORMAT_FAILURE/);
});
test('fallback extra/missing/wrong data reject rather than manufacturing a registered body', () => {
  for (const mutate of [p => { p.fallback.bindings.text = 'caller'; }, p => { p.fallback.templateId = 'other'; },
    p => { p.fallback.templateVersion = 2; }, p => { p.fallback.role = 'INSIGHT'; }, p => { p.primary = {}; },
    p => { delete p.fallback.bindings; }]) {
    const p = structuredClone(fallback); mutate(p); assert.throws(() => h.format(p));
  }
});
test('formatting never accesses Intl/toLocaleString and never interprets caller HTML/Markdown', () => {
  const intl = global.Intl, localeNumber = Number.prototype.toLocaleString;
  try {
    global.Intl = new Proxy({}, { get() { throw new Error('Intl forbidden'); } });
    Number.prototype.toLocaleString = () => { throw new Error('locale forbidden'); };
    assert.equal(h.format(presentation('E05'))[0].text, expected('E05', presentation('E05').primary.insight.bindings));
  } finally { global.Intl = intl; Number.prototype.toLocaleString = localeNumber; }
  const source = structuredClone(h.bank.find(f => f.row === 'E02').source);
  source.intent.cycles[0].iep.actions = '<script>alert(1)</script> **caller prose** {after}';
  source.intent.cycles[0].oop.events = '<b>caller event</b>';
  assert.deepEqual(h.evaluate(source), h.evaluate(h.bank.find(f => f.row === 'E02').source));
});
