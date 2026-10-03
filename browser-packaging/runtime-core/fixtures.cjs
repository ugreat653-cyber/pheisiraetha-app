'use strict';

// TEST ONLY, synthetic committed states; no production data or engine options.
const D = ['primary', 'success', 'scope', 'nonGoals', 'constraints', 'rationale'];
const METRICS = [['practical', 'iep.practical'], ['achievement', 'oop.achievement'], ['mental', 'iep.mental'],
  ['hours', 'iep.hours'], ['desire', 'iep.desire'], ['belief', 'iep.belief'], ['emotionIntensity', 'iep.emotionIntensity']];
const RIS = Object.fromEntries(D.map(d => [d, `Synthetic ${d} record`]));
const DATES = ['2026-09-01T12:00:00Z', '2026-09-08T12:00:00Z', '2026-09-15T12:00:00Z', '2026-09-22T12:00:00Z'];

function fixture(count = 1, labels) {
  return { version: '0.1.0', lang: 'en', intent: { id: 'synthetic-core-intent', createdAt: '2026-08-31T12:00:00Z',
    ris: structuredClone(RIS), cycles: Array.from({ length: count }, (_, i) => ({
      id: `synthetic-core-cycle-${i + 1}`, createdAt: DATES[i], cie: structuredClone(RIS),
      iep: { desire: 7, belief: 6, mental: 6, practical: 8, emotionIntensity: 4, hours: 3,
        frequency: 'freq2', emotion: labels[3], actions: 'Synthetic already completed action' },
      oop: { achievement: 2, direction: 'none', evidence: ['direct'], currentState: 'Synthetic recorded state',
        events: 'Synthetic already observed event', external: 'Synthetic recorded context' }, intentional: 'no', revision: {}
    })) } };
}
// Test-fixture writer only, never a runtime selector API.
function vector(s, field, values) {
  const [container, key] = field.split('.');
  s.intent.cycles.forEach((c, i) => { c[container][key] = structuredClone(values[i]); });
  return s;
}
function pattern(labels) {
  const s = fixture(3, labels);
  for (const [field, values] of [['iep.practical', [6, 8, 7]], ['iep.mental', [5, 7, 6]],
    ['oop.achievement', [2, 4, 3]], ['iep.frequency', ['freq1', 'freq3', 'freq2']],
    ['iep.emotion', [labels[4], labels[1], labels[3]]]]) vector(s, field, values);
  return s;
}
function reflection(labels, branch, known) {
  const s = fixture(1, labels), c = s.intent.cycles[0];
  if (branch === 'B1') c.oop.evidence = [];
  if (branch === 'B2') { c.intentional = 'yes'; c.revision = { success: 'Synthetic selected criteria' }; }
  if (branch === 'B3') c.iep.actions = '';
  if (branch === 'B4') c.oop.external = '';
  if (!known) c.iep.emotion = 'Synthetic unlisted category';
  return s;
}
function revision(labels, count = 1) {
  const s = fixture(count, labels);
  s.intent.cycles.forEach((c, i) => { c.intentional = 'yes'; c.revision = { success: `Synthetic criteria ${i}`, scope: `Synthetic scope ${i}` }; });
  return s;
}

function scenarios(labels) {
  const bank = [];
  const add = (name, source, candidateId, row, surface = 'PRIMARY') => bank.push({ name, source, candidateId, row, surface });
  for (const branch of ['B3', 'B4', 'B5']) for (const known of [false, true])
    add(`REF ${branch}/${known ? 'known' : 'unmapped'}`, reflection(labels, branch, known), 'REF-01', known ? 'E03' : 'E02');
  add('QUAL insufficient basis', reflection(labels, 'B1', true), 'QUAL-01', 'E04');
  const defaults = fixture(1, labels), c = defaults.intent.cycles[0];
  c.iep = { desire: 5, belief: 5, mental: 5, practical: 5, emotionIntensity: 5, hours: 0,
    frequency: 'freq2', emotion: labels[2], actions: '' };
  c.oop = { achievement: 0, direction: 'none', evidence: [], currentState: '', events: '', external: '' };
  add('QUAL possible default profile', defaults, 'QUAL-01', 'E04');
  for (const [metric, field] of METRICS)
    add(`CMP ${metric}`, vector(fixture(2, labels), field, metric === 'hours' ? [1, 3] : [4, 6]), `CMP-01:${metric}`, 'E05');
  add('CMP frequency', vector(fixture(2, labels), 'iep.frequency', ['freq0', 'freq1']), 'CMP-02:frequency', 'E06');
  const wording = fixture(1, labels); wording.intent.cycles[0].cie.primary = 'Synthetic different wording';
  add('TXT current reference differences', wording, 'TXT-01', 'E07');
  add('INT wording recurrence', pattern(labels), 'INT-01', 'E08');
  for (const dimension of D) {
    const s = pattern(labels); s.intent.ris[dimension] = `Synthetic different current ${dimension}`;
    for (const key of ['desire', 'belief', 'mental', 'practical', 'emotionIntensity', 'hours', 'frequency']) delete s.intent.cycles[1].iep[key];
    delete s.intent.cycles[1].oop.achievement;
    add(`INT dimension ${dimension}`, s, `INT-02:${dimension}`, 'E09', 'SECONDARY');
  }
  add('PRA decrease', vector(pattern(labels), 'iep.practical', [8, 7, 6]), 'PRA-01', 'E10');
  add('PRA low range', vector(pattern(labels), 'iep.practical', [1, 1, 1]), 'PRA-02', 'E11');
  for (const [name, values] of [['low', [2, 2, 2]], ['down', [8, 7, 6]]])
    add(`MEN ${name}`, vector(pattern(labels), 'iep.mental', values), 'MEN-01', 'E12');
  for (const [name, values] of [['repeated', ['freq2', 'freq2', 'freq2']], ['decreased', ['freq4', 'freq3', 'freq2']]])
    add(`MEN frequency ${name}`, vector(pattern(labels), 'iep.frequency', values), 'MEN-02', 'E13');
  const category = n => vector(pattern(labels), 'iep.emotion', Array(3).fill(labels[n]));
  add('EMO known', category(3), 'EMO-01', 'E14');
  add('EMO Other', category(9), 'EMO-01', 'E15');
  for (const [name, values] of [['increased', [4, 5, 6]], ['decreased', [6, 5, 4]]])
    add(`EMO intensity ${name}`, vector(category(3), 'iep.emotionIntensity', values), 'EMO-02', 'E16');
  for (const [name, values, direction] of [['increased', [2, 3, 4], 'toward'], ['decreased', [6, 5, 4], 'away']])
    add(`OUT ${name}`, vector(vector(pattern(labels), 'oop.achievement', values), 'oop.direction', Array(3).fill(direction)), 'OUT-01', 'E17');
  add('OUT nearby', vector(pattern(labels), 'oop.achievement', [4, 4, 4]), 'OUT-02', 'E18');
  add('CTX series', vector(vector(vector(pattern(labels), 'iep.practical', [6, 6, 6]),
    'oop.achievement', [6, 5, 4]), 'oop.direction', ['away', 'away', 'away']), 'CTX-01', 'E19');
  add('CTX external secondary', fixture(1, labels), 'CTX-02', 'E20', 'SECONDARY');
  add('REV selected keys', revision(labels), 'REV-01', 'E21');
  add('REV counts', revision(labels, 3), 'REV-02', 'E22', 'SECONDARY');
  add('REL decrease', vector(vector(vector(fixture(3, labels), 'iep.practical', [8, 7, 6]),
    'iep.hours', [3, 2, 1]), 'oop.achievement', [2, 2, 2]), 'REL-01', 'E23');
  add('REL co-increase', vector(vector(vector(vector(fixture(3, labels), 'iep.practical', [3, 4, 5]),
    'iep.hours', [1, 2, 3]), 'oop.achievement', [2, 3, 4]), 'oop.direction', ['toward', 'toward', 'toward']), 'REL-02', 'E24');
  for (const metric of ['mental', 'emotionIntensity']) {
    const s = vector(vector(fixture(3, labels), 'iep.practical', [6, 6, 6]), 'oop.achievement', [4, 4, 4]);
    add(`REL internal ${metric}`, vector(s, `iep.${metric}`, [4, 5, 6]), 'REL-03', 'E25');
  }
  const conflict = fixture(1, labels); conflict.intent.cycles[0].revision = { scope: 'Synthetic selected scope' };
  add('MIX decision patch', conflict, 'MIX-01', 'E26');
  add('MIX practical hours', vector(vector(pattern(labels), 'iep.practical', [8, 7, 6]), 'iep.hours', [1, 2, 3]), 'MIX-01', 'E26');
  const mixed = fixture(1, labels); mixed.intent.cycles[0].oop.direction = 'mixed';
  add('MIX recorded direction', mixed, 'MIX-01', 'E26');
  return bank;
}
module.exports = { D, METRICS, fixture, vector, pattern, reflection, revision, scenarios };
