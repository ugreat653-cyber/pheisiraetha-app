'use strict';

// Focused packaging equivalence, not a rerun of the frozen semantic suites.
// A separate temporary entry exposes internals ONLY inside an isolated test VM.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const { execFileSync } = require('node:child_process');
const build = require('./build.cjs');
const TEST_GLOBAL = '__PHEISIRAETHA_PACKAGING_TEST_ONLY__';
const clone = value => structuredClone(value);

function productionSandbox(code) {
  const context = vm.createContext(Object.create(null), { codeGeneration: { strings: false, wasm: false } });
  vm.runInContext(`
    globalThis.window = globalThis;
    globalThis.self = globalThis;
    globalThis.networkCalls = 0;
    const deny = () => { networkCalls++; throw new Error('runtime I/O prohibited'); };
    for (const name of ['fetch', 'XMLHttpRequest', 'WebSocket', 'EventSource', 'importScripts']) globalThis[name] = deny;
    for (const name of ['document', 'localStorage', 'sessionStorage', 'navigator'])
      Object.defineProperty(globalThis, name, { get: deny, configurable: false });
  `, context);
  const before = vm.runInContext('Object.getOwnPropertyDescriptors(globalThis)', context);
  vm.runInContext(code, context, { timeout: 10000 });
  vm.runInContext(code, context, { timeout: 10000 });
  const after = vm.runInContext('Object.getOwnPropertyDescriptors(globalThis)', context);
  assert.deepEqual(after, before, 'production load must add/change no global property');
  assert.equal(vm.runInContext('networkCalls', context), 0);
  for (const name of ['require', 'module', 'exports', 'process', 'Buffer', '__dirname', '__filename',
    'analyze', 'assessPresentation', 'TEMPLATE_REGISTRY', 'Analysis', 'Safety', 'PHEISIRAETHA',
    'engineResult', 'presentationPlan', 'normalizeText', 'mapEmotion', 'parseTimestamp',
    'PHEISIRAETHA_ANALYTICS_V1', TEST_GLOBAL]) {
    assert.equal(vm.runInContext(`typeof globalThis[${JSON.stringify(name)}]`, context), 'undefined', name);
  }
  assert.ok(!code.includes(TEST_GLOBAL), 'test-only surface leaked into production bytes');
}

function fixture(count = 1) {
  const ris = Object.fromEntries(['primary', 'success', 'scope', 'nonGoals', 'constraints', 'rationale']
    .map(d => [d, `Synthetic ${d} record`]));
  const dates = ['2026-09-01T12:00:00Z', '2026-09-08T12:00:00Z', '2026-09-15T12:00:00Z',
    '2026-09-22T12:00:00Z', '2026-09-29T12:00:00Z'];
  return { version: '0.1.0', lang: 'en', intent: { id: 'synthetic-packaging-intent',
    createdAt: '2026-08-31T12:00:00Z', ris, cycles: Array.from({ length: count }, (_, i) => ({
      id: `synthetic-packaging-${i + 1}`, createdAt: dates[i], cie: clone(ris),
      iep: { desire: 7, belief: 6, mental: 6, practical: 8, emotionIntensity: 4, hours: 3,
        frequency: 'freq2', emotion: 'Calm / contentment', actions: 'Synthetic completed action' },
      oop: { achievement: 2, direction: 'none', evidence: ['direct'],
        currentState: 'Synthetic recorded state', events: 'Synthetic observed event', external: 'Synthetic context' },
      intentional: 'no', revision: {}
    })) } };
}
function changed(count, change) { const s = fixture(count); change(s); return s; }
function vector(s, section, field, values) { s.intent.cycles.forEach((c, i) => { c[section][field] = values[i]; }); }

// Limited synthetic request construction for packaging fixtures only.
// This is not the future production plan builder: only REF/CMP/CTX examples are
// supported, and an unexpected actual selection throws rather than guessing.
function testPlan(source, engine) {
  const absent = ['primary.interpretation', 'primary.nextFocus',
    ...(engine.secondary ? ['secondary.interpretation', 'secondary.nextFocus', 'secondary.whyThisFocus'] : ['secondary'])];
  const components = [];
  function candidate(c, surface) {
    const prefix = surface.toLowerCase();
    const refs = leaf => c.ruleEvaluation.usedArrayIndices.map(i => ({
      arrayIndex: i, cycleId: source.intent.cycles[i].id, path: `intent.cycles[${i}].${leaf}`
    }));
    const binding = (name, selector, sourceRefs = []) => ({ name, selector, sourceRefs });
    const selector = { ruleId: c.ruleId, candidateId: c.candidateId, key: c.titleKey,
      metric: null, dimension: null, branch: 'recorded', variant: 'recordedObservation' };
    let templateId, bindings;
    if (c.ruleId === 'REF-01') {
      const branch = { 'analysis.observeOwnCriteriaAgain': 'B5', 'analysis.observeExternalCircumstance': 'B4' };
      assert.ok(Object.hasOwn(branch, c.nextFocus.promptKey));
      selector.branch = branch[c.nextFocus.promptKey];
      const known = c.interpretation.data.emotion.status === 'known';
      selector.variant = known ? 'CURRENT_KNOWN_CATEGORY' : 'CURRENT_CATEGORY_UNAVAILABLE';
      templateId = known ? 'safety.insight.currentRecordedAssessmentsAndCategory' : 'safety.insight.currentRecordedAssessments';
      bindings = [['desire', 'iep.desire'], ['belief', 'iep.belief'], ['mental', 'iep.mental'],
        ['practical', 'iep.practical'], ['intensity', 'iep.emotionIntensity'], ['achievement', 'oop.achievement'],
        ['hours', 'iep.hours'], ['frequency', 'iep.frequency'], ['direction', 'oop.direction']]
        .map(([name, leaf]) => binding(name, `CURRENT(${leaf})`, refs(leaf)));
      if (known) bindings.push(binding('categoryIndex', 'ENGINE_EMOTION_CURRENT', refs('iep.emotion')));
    } else if (c.ruleId === 'CMP-01') {
      selector.metric = c.ruleEvaluation.metric;
      const leaf = selector.metric === 'achievement' ? 'oop.achievement' : `iep.${selector.metric}`;
      templateId = 'safety.insight.numericComparison';
      bindings = [binding('metricLabel', 'U.metricLabel'), binding('units', 'U.units'), binding('scope', 'U.scope'),
        binding('before', `PAIR(${leaf})`, refs(leaf)), binding('after', `PAIR(${leaf})`, refs(leaf)),
        binding('delta', `ENGINE_DELTA(${leaf})`, refs(leaf))];
    } else if (c.ruleId === 'CMP-02') {
      selector.metric = 'frequency';
      templateId = 'safety.insight.frequencyComparison';
      bindings = [binding('before', 'PAIR(iep.frequency)', refs('iep.frequency')),
        binding('after', 'PAIR(iep.frequency)', refs('iep.frequency')),
        binding('ordinalChange', 'ENGINE_ORDINAL', refs('iep.frequency'))];
    } else if (c.ruleId === 'CTX-02') {
      assert.equal(surface, 'SECONDARY');
      templateId = 'safety.insight.externalRecordPresent';
      bindings = [];
    } else throw new Error(`unsupported packaging fixture selection: ${c.ruleId}`);
    const component = (slot, role, id, bs) => ({ componentId: slot, surface, role, slot,
      templateId: id, templateVersion: 1, ruleId: c.ruleId, candidateId: c.candidateId,
      engineSelector: clone(selector), bindings: bs });
    components.push(component(`${prefix}.insight`, 'INSIGHT', templateId, bindings),
      component(`${prefix}.why.values`, 'WHY', 'safety.why.recordedInformationUsed', [binding('fieldNames', 'FIXED_FIELDS')]),
      component(`${prefix}.why.selection`, 'WHY', 'safety.why.ruleSelectionBasis', [binding('ruleId', 'SELECTED_RULE')]),
      component(`${prefix}.why.limitations`, 'WHY', 'safety.why.recordedDataLimitations', []));
  }
  if (engine.primary) {
    candidate(engine.primary, 'PRIMARY');
    components.push({ componentId: 'primary.why.capability', surface: 'PRIMARY', role: 'WHY',
      slot: 'primary.why.capability', templateId: 'safety.why.conditionAssessmentUnavailable', templateVersion: 1,
      ruleId: null, candidateId: null, engineSelector: { capabilityPath: 'capabilities.VAQUQA',
        ruleId: 'COND-01', status: 'capability_gap', conditionSufficiency: 'unavailable' }, bindings: [] });
    if (engine.secondary) candidate(engine.secondary, 'SECONDARY');
  }
  return { policyVersion: 'safety-v1', registryVersion: 'safety-registry-v1',
    manifestId: engine.primary ? engine.secondary ? 'safety.manifest.primaryAndSecondaryFactualWithCapability' :
      'safety.manifest.primaryFactualWithCapability' : 'safety.manifest.fallbackOnly',
    manifestVersion: 1, components, declaredAbsentSlots: engine.primary ? absent : ['primary', 'secondary'] };
}

async function verify() {
  const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, 'build-manifest.json')));
  const artifact = fs.readFileSync(path.join(build.ROOT, manifest.output.file));
  const entry = fs.readFileSync(path.join(__dirname, 'entry.cjs'));
  assert.equal(build.sha256(artifact), manifest.output.sha256);
  assert.equal(build.sha256(entry), manifest.entry.sha256);
  assert.equal(build.sha256(fs.readFileSync(path.join(__dirname, 'package-lock.json'))), manifest.toolchain.lockfileSha256);
  const repeated = [await build.compile(), await build.compile()];
  for (const result of repeated) assert.deepEqual(result.bytes, artifact, 'canonical clean staging build must match committed bytes');
  productionSandbox(artifact.toString());

  const stage = fs.mkdtempSync(path.join(os.tmpdir(), 'pheisiraetha-parity-'));
  const analysisCases = [], safetyCases = [];
  try {
    const sources = build.materialize(stage, entry);
    const nodeRequire = createRequire(path.join(stage, 'entry.cjs'));
    const analysis = nodeRequire('./frozen/analysis.js');
    const safety = nodeRequire('./frozen/safety.js');
    const safetyPath = nodeRequire.resolve('./frozen/safety.js');
    const analysisPath = nodeRequire.resolve('./frozen/analysis.js');
    assert.equal(require.cache[safetyPath].children.length, 1);
    assert.equal(require.cache[safetyPath].children[0].filename, analysisPath);
    const testEntry = Buffer.concat([entry, Buffer.from(`\nglobalThis.${TEST_GLOBAL} = Object.freeze({ analysis, safety });\n`)]);
    const testBundle = await build.compile(testEntry);
    assert.notEqual(testBundle.hash, manifest.output.sha256);
    const context = vm.createContext(Object.create(null), { codeGeneration: { strings: false, wasm: false } });
    vm.runInContext(testBundle.bytes.toString(), context, { timeout: 10000 });
    function bundled(operation, input) {
      context.__inputJSON = JSON.stringify(input);
      return clone(vm.runInContext(`(() => {
        const input = JSON.parse(__inputJSON);
        const before = JSON.stringify(input);
        const result = ${TEST_GLOBAL}.${operation}(input);
        return { result, before, after: JSON.stringify(input) };
      })()`, context, { timeout: 10000 }));
    }
    function analysisCase(name, source) {
      const before = clone(source), node = analysis.analyze(source);
      const browser = bundled('analysis.analyze', source);
      assert.deepEqual(source, before, name + ': Node input mutation');
      assert.equal(browser.before, browser.after, name + ': bundle input mutation');
      assert.deepEqual(browser.result, node, name + ': complete Analysis parity');
      analysisCases.push({ name, status: node.status, primary: node.primary?.candidateId ?? null,
        secondary: node.secondary?.candidateId ?? null });
    }
    analysisCase('no intent', { version: '0.1.0', lang: 'ru', intent: null });
    analysisCase('zero cycles', fixture(0));
    analysisCase('current known category', fixture());
    analysisCase('current unlisted category', changed(1, s => { s.intent.cycles[0].iep.emotion = 'Synthetic unlisted category'; }));
    for (const lang of ['ru', 'de', 'ar']) analysisCase('mapped category ' + lang,
      changed(1, s => { s.lang = lang; s.intent.cycles[0].iep.emotion = analysis.EMOTION_LABELS[lang][3]; }));
    analysisCase('exact decimals', changed(1, s => { s.intent.cycles[0].iep.hours = 0.125; s.intent.cycles[0].iep.practical = 6.75; }));
    analysisCase('two record increase', changed(2, s => vector(s, 'iep', 'practical', [4, 6])));
    analysisCase('two record decrease', changed(2, s => vector(s, 'iep', 'practical', [8, 6])));
    analysisCase('separate hours comparison', changed(2, s => vector(s, 'iep', 'hours', [1, 3])));
    analysisCase('ordinal frequency comparison', changed(2, s => vector(s, 'iep', 'frequency', ['freq1', 'freq3'])));
    analysisCase('three record decline', changed(3, s => { vector(s, 'iep', 'practical', [8, 7, 6]); vector(s, 'iep', 'hours', [3, 2, 1]); }));
    analysisCase('five record window', fixture(5));
    analysisCase('explicit revision', changed(1, s => { s.intent.cycles[0].intentional = 'yes'; s.intent.cycles[0].revision = { success: 'Synthetic revised criterion' }; }));
    analysisCase('conflicting revision', changed(1, s => { s.intent.cycles[0].revision = { scope: 'Synthetic conflict' }; }));
    analysisCase('mixed outcome direction', changed(1, s => { s.intent.cycles[0].oop.direction = 'mixed'; }));
    analysisCase('numeric string preserved', changed(1, s => { s.intent.cycles[0].iep.practical = '8'; }));
    analysisCase('duplicate IDs', changed(2, s => { s.intent.cycles[1].id = s.intent.cycles[0].id; }));
    analysisCase('blank ID', changed(1, s => { s.intent.cycles[0].id = ''; }));
    analysisCase('invalid chronology', changed(2, s => { s.intent.cycles[1].createdAt = 'invalid timestamp'; }));
    analysisCase('unsupported source version', changed(1, s => { s.version = '0.2.0'; }));

    function inputFor(source) {
      const engineResult = analysis.analyze(source);
      return { sourceSnapshot: source, engineResult, presentationPlan: testPlan(source, engineResult) };
    }
    function safetyCase(name, input, verdict) {
      const before = clone(input), node = safety.assessPresentation(input);
      const browser = bundled('safety.assessPresentation', input);
      assert.deepEqual(input, before, name + ': Node input mutation');
      assert.equal(browser.before, browser.after, name + ': bundle input mutation');
      assert.deepEqual(browser.result, node, name + ': complete Safety parity');
      assert.equal(node.verdict, verdict, name + ': expected representative verdict');
      if (verdict !== 'ALLOW') {
        assert.equal(node.presentation.mode, 'FALLBACK_ONLY');
        assert.equal(node.presentation.primary, null);
        assert.equal(node.presentation.secondary, null);
        assert.equal(node.presentation.fallback.templateId, 'safety.fallback.noInterpretationOrNextFocus');
      }
      safetyCases.push({ name, verdict: node.verdict, mode: node.presentation.mode });
    }
    const primaryOnly = inputFor(changed(1, s => { s.intent.cycles[0].oop.external = ''; }));
    assert.equal(primaryOnly.engineResult.secondary, null, 'MF3 fixture must actually be primary-only');
    safetyCase('MF3 primary plus E30 ALLOW', primaryOnly, 'ALLOW');
    safetyCase('current unlisted category ALLOW', inputFor(changed(1, s => { s.intent.cycles[0].iep.emotion = 'Synthetic unlisted category'; })), 'ALLOW');
    const pair = () => inputFor(changed(2, s => vector(s, 'iep', 'practical', [4, 6])));
    assert.ok(pair().engineResult.secondary, 'MF4 fixture must actually select a secondary');
    safetyCase('MF4 primary and secondary plus E30 ALLOW', pair(), 'ALLOW');
    safetyCase('separate hours ALLOW', inputFor(changed(2, s => vector(s, 'iep', 'hours', [1, 3]))), 'ALLOW');
    safetyCase('ordinal frequency ALLOW', inputFor(changed(2, s => vector(s, 'iep', 'frequency', ['freq1', 'freq3']))), 'ALLOW');
    const invalid = (name, mutate, verdict = 'UNKNOWN', input = inputFor(fixture())) => {
      mutate(input); safetyCase(name, input, verdict);
    };
    invalid('unknown template UNKNOWN', i => { i.presentationPlan.components[0].templateId = 'synthetic.unknown'; });
    invalid('wrong policy UNKNOWN', i => { i.presentationPlan.policyVersion = 'synthetic-wrong-version'; });
    invalid('wrong provenance UNKNOWN', i => { i.presentationPlan.components[0].bindings[0].sourceRefs[0].cycleId = 'wrong-id'; });
    invalid('missing E30 UNKNOWN', i => { i.presentationPlan.components.pop(); });
    invalid('unregistered Interpretation UNKNOWN', i => { i.presentationPlan.components[0].role = 'INTERPRETATION'; });
    invalid('secondary Next Focus HOLD', i => {
      const c = i.presentationPlan.components.find(c => c.surface === 'SECONDARY');
      c.role = 'NEXT_FOCUS'; c.slot = c.componentId = 'secondary.nextFocus';
    }, 'HOLD');
    invalid('capability Next Focus HOLD', i => {
      const c = i.presentationPlan.components.find(c => c.slot === 'primary.why.capability');
      c.role = 'NEXT_FOCUS'; c.ruleId = 'COND-01'; c.slot = c.componentId = 'primary.nextFocus';
    }, 'HOLD');
    invalid('failed secondary atomic UNKNOWN', i => {
      i.presentationPlan.components.find(c => c.surface === 'SECONDARY').templateId = 'synthetic.unknown';
    }, 'UNKNOWN', pair());
    safetyCase('empty analytical plan UNKNOWN', inputFor(fixture(0)), 'UNKNOWN');
    invalid('malformed source UNKNOWN', i => { i.sourceSnapshot.version = '0.2.0'; });
    build.assertSourcesUnchanged(stage, sources);
  } finally {
    fs.rmSync(stage, { recursive: true, force: true });
  }

  // All existing tracked files, including the spec, remain byte-identical.
  const basePaths = build.git('ls-tree', '-r', '-z', '--name-only', build.SPEC_COMMIT).toString().split('\0').filter(Boolean);
  for (const file of basePaths) assert.deepEqual(fs.readFileSync(path.join(build.ROOT, file)),
    build.git('show', `${build.SPEC_COMMIT}:${file}`), file + ': baseline bytes changed');
  assert.match(fs.readFileSync(path.join(build.ROOT, 'sw.js'), 'utf8'), /^const CACHE='pheisiraetha-v16';/);
  assert.match(fs.readFileSync(path.join(build.ROOT, 'app.js'), 'utf8'), /const APP_VERSION = '0\.1\.0';/);
  assert.equal(build.git('rev-parse', 'refs/remotes/origin/main').toString().trim(), build.PRODUCTION_COMMIT);

  let cleanInstall = 'NOT_REQUESTED';
  if (process.argv.includes('--clean-install')) {
    const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'pheisiraetha-clean-rebuild-'));
    try {
      const checkout = path.join(temporary, 'repo');
      execFileSync('git', ['clone', '--quiet', '--no-hardlinks', build.ROOT, checkout]);
      execFileSync('git', ['-C', checkout, 'checkout', '--quiet', '--detach', build.SPEC_COMMIT]);
      const packaging = path.join(checkout, 'browser-packaging');
      fs.mkdirSync(packaging);
      for (const file of ['package.json', 'package-lock.json', 'entry.cjs', 'build.cjs'])
        fs.copyFileSync(path.join(__dirname, file), path.join(packaging, file));
      execFileSync('npm', ['ci', '--prefix', packaging, '--cache', path.join(temporary, 'empty-npm-cache'),
        '--ignore-scripts', '--no-audit', '--no-fund'], { stdio: 'pipe', timeout: 120000 });
      execFileSync('npm', ['run', 'build', '--prefix', packaging], { stdio: 'pipe', timeout: 30000 });
      assert.deepEqual(fs.readFileSync(path.join(checkout, manifest.output.file)), artifact);
      assert.deepEqual(JSON.parse(fs.readFileSync(path.join(packaging, 'build-manifest.json'))), manifest);
      cleanInstall = 'PASS: fresh checkout, empty npm cache, locked install, identical artifact and manifest';
    } finally {
      fs.rmSync(temporary, { recursive: true, force: true });
    }
  }
  console.log(JSON.stringify({ artifactSha256: manifest.output.sha256,
    frozenInputs: 'PASS: exact blobs, hashes, bytes unchanged; one shared Analysis module',
    reproducibility: 'PASS: two fresh staging builds equal recorded artifact byte-for-byte', cleanInstall,
    namespace: 'PASS: zero global additions/changes; two loads; no Node globals, raw APIs or test surface',
    runtimeIO: 'PASS: zero network/DOM/storage accesses; no external imports',
    analysisParity: { passed: analysisCases.length, failed: 0, cases: analysisCases },
    safetyParity: { passed: safetyCases.length, failed: 0, cases: safetyCases },
    sourceMutation: 'PASS: Node and bundled inputs and frozen bytes unchanged',
    production: `PASS: all ${basePaths.length} baseline files unchanged; CACHE v16; APP_VERSION 0.1.0; origin/main unchanged`,
    completeFrozenSuiteRerun: false }, null, 2));
}

verify().catch(error => { console.error(error); process.exitCode = 1; });
