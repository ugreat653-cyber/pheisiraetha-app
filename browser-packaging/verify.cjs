'use strict';

// Build/composition verification only. Never runs the complete frozen suites.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync, spawn } = require('node:child_process');
const { createRequire } = require('node:module');
const { createHash } = require('node:crypto');
// Also applies to the existing build.git helper and Git children of suites.
process.env.GIT_OPTIONAL_LOCKS = '0';
let build;
const UPDATED = ['README.md', 'build.cjs', 'entry.cjs', 'verify.cjs', 'build-manifest.json', 'verification-results.json']
  .map(file => `browser-packaging/${file}`);
const NEW_RUNTIME = ['safety-contract.cjs', 'canonical-formatter.cjs', 'runtime.cjs', 'test-support.cjs',
  'runtime.test.cjs', 'formatter.test.cjs', 'browser.test.cjs'].map(file => `browser-packaging/runtime-facade/${file}`);
const TESTS = ['runtime.test.cjs', 'formatter.test.cjs', 'browser.test.cjs'];

function focusedTests() {
  return TESTS.map(file => {
    const output = execFileSync(process.execPath, ['--test', '--test-reporter=tap', path.join(__dirname, 'runtime-facade', file)],
      { encoding: 'utf8', timeout: 30000, maxBuffer: 4 * 1024 * 1024 });
    const count = name => Number(output.match(new RegExp(`^# ${name} (\\d+)$`, 'm'))?.[1]);
    assert.ok(Number.isSafeInteger(count('tests')) && count('tests') > 0);
    assert.equal(count('fail'), 0); assert.equal(count('cancelled'), 0); assert.equal(count('skipped'), 0);
    assert.equal(count('pass'), count('tests'));
    return { file: `browser-packaging/runtime-facade/${file}`, passed: count('pass'), failed: 0,
      cases: [...output.matchAll(/^ok \d+ - (.*)$/gm)].map(m => m[1]) };
  });
}
function scope(manifest) {
  assert.equal(build.git('branch', '--show-current').toString().trim(), 'phase2b-analytics-runtime-facade');
  const head = build.git('rev-parse', 'HEAD').toString().trim();
  if (head !== build.CORE_COMMIT) assert.equal(build.git('show', '-s', '--format=%P', head).toString().trim(), build.CORE_COMMIT);
  const basePaths = build.git('ls-tree', '-r', '-z', '--name-only', build.CORE_COMMIT).toString().split('\0').filter(Boolean);
  const preserved = basePaths.filter(file => !UPDATED.includes(file));
  for (const file of preserved) assert.deepEqual(fs.readFileSync(path.join(build.ROOT, file)),
    build.git('show', `${build.CORE_COMMIT}:${file}`), `${file}: accepted base bytes changed`);
  const changed = [...new Set([...build.git('diff', '--name-only', build.CORE_COMMIT).toString().trim().split('\n'),
    ...build.git('ls-files', '--others', '--exclude-standard').toString().trim().split('\n')].filter(Boolean))].sort();
  const allowed = [...UPDATED, ...NEW_RUNTIME, manifest.output.file];
  assert.ok(changed.every(file => allowed.includes(file)), `out-of-scope paths: ${changed.filter(file => !allowed.includes(file))}`);
  const productionPaths = build.git('ls-tree', '-r', '-z', '--name-only', build.SPEC_COMMIT).toString().split('\0').filter(Boolean);
  for (const file of productionPaths) assert.deepEqual(fs.readFileSync(path.join(build.ROOT, file)),
    build.git('show', `${build.SPEC_COMMIT}:${file}`), `${file}: production/spec bytes changed`);
  assert.match(fs.readFileSync(path.join(build.ROOT, 'sw.js'), 'utf8'), /^const CACHE='pheisiraetha-v16';/);
  assert.match(fs.readFileSync(path.join(build.ROOT, 'app.js'), 'utf8'), /const APP_VERSION = '0\.1\.0';/);
  assert.equal(build.git('rev-parse', 'refs/remotes/origin/main').toString().trim(), build.PRODUCTION_COMMIT);
  return { changedFiles: changed, preservedBaseFiles: preserved.length, productionSpecFilesUnchanged: productionPaths.length,
    acceptedCoreProductionFilesUnchanged: build.CORE_FILES.length, requiredSoleParent: build.CORE_COMMIT,
    originMainLastObserved: build.PRODUCTION_COMMIT, CACHE: 'pheisiraetha-v16', APP_VERSION: '0.1.0',
    productionWiringChanged: false, legacyHardeningMerged: false, deployment: false, pullRequest: false, merge: false };
}
function cleanInstall(manifest, artifact) {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'pheisiraetha-facade-clean-'));
  try {
    const checkout = path.join(temporary, 'repo');
    execFileSync('git', ['clone', '--quiet', '--no-hardlinks', build.ROOT, checkout]);
    execFileSync('git', ['-C', checkout, 'checkout', '--quiet', '--detach', build.CORE_COMMIT]);
    // Only production build inputs enter this clean build. The accepted core,
    // lock and historical artifact already exist in the exact base checkout.
    for (const file of ['build.cjs', 'entry.cjs', ...build.FACADE_FILES]) {
      const target = path.join(checkout, 'browser-packaging', file);
      fs.mkdirSync(path.dirname(target), { recursive: true }); fs.copyFileSync(path.join(__dirname, file), target);
    }
    const packaging = path.join(checkout, 'browser-packaging');
    execFileSync('npm', ['ci', '--prefix', packaging, '--cache', path.join(temporary, 'empty-npm-cache'),
      '--ignore-scripts', '--no-audit', '--no-fund'], { stdio: 'pipe', timeout: 120000 });
    execFileSync('npm', ['run', 'build', '--prefix', packaging], { stdio: 'pipe', timeout: 30000 });
    const cleanArtifact = fs.readFileSync(path.join(checkout, manifest.output.file));
    assert.deepEqual(cleanArtifact, artifact);
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(packaging, 'build-manifest.json'))), manifest);
    return { result: 'PASS', baseCommit: build.CORE_COMMIT, initialDependencyDirectory: 'absent', initialNpmCache: 'empty',
      install: manifest.commands.install, lifecycleScripts: false, sha256: build.sha256(cleanArtifact),
      artifactByteIdentical: true, manifestIdentical: true };
  } finally { fs.rmSync(temporary, { recursive: true, force: true }); }
}
async function verify() {
  const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, 'build-manifest.json')));
  assert.equal(manifest.phase, '2B-3B-2B'); assert.equal(manifest.requiredSoleParent, build.CORE_COMMIT);
  const historicalManifest = JSON.parse(build.git('show', `${build.CORE_COMMIT}:browser-packaging/build-manifest.json`));
  assert.deepEqual(manifest.profile, historicalManifest.profile); assert.deepEqual(manifest.toolchain, historicalManifest.toolchain);
  for (const file of ['package.json', 'package-lock.json']) assert.deepEqual(fs.readFileSync(path.join(__dirname, file)),
    build.git('show', `${build.CORE_COMMIT}:browser-packaging/${file}`));
  const artifact = fs.readFileSync(path.join(build.ROOT, manifest.output.file));
  assert.equal(build.sha256(artifact), manifest.output.sha256);
  assert.equal(path.basename(manifest.output.file), `analytics-v1.${manifest.output.sha256}.js`);
  assert.notEqual(manifest.output.sha256, build.OLD_ARTIFACT_SHA256);
  assert.equal(build.sha256(fs.readFileSync(path.join(build.ROOT, manifest.historicalArtifact.file))), build.OLD_ARTIFACT_SHA256);
  assert.equal(build.sha256(fs.readFileSync(path.join(__dirname, 'entry.cjs'))), manifest.entry.sha256);
  assert.equal(build.sha256(fs.readFileSync(path.join(__dirname, 'package-lock.json'))), manifest.toolchain.lockfileSha256);
  assert.deepEqual(build.sourceBlobs().map(({ bytes, ...input }) => input), manifest.inputs);
  assert.deepEqual(build.runtimeSources().map(({ bytes, ...input }) => ({ ...input, file: `browser-packaging/${input.file}` })), manifest.runtimeSources);
  for (let i = 0; i < 2; i++) {
    const repeated = await build.compile(); assert.deepEqual(repeated.bytes, artifact); assert.deepEqual(repeated.inputGraph, manifest.inputGraph);
  }
  const stage = fs.mkdtempSync(path.join(os.tmpdir(), 'pheisiraetha-frozen-resolution-'));
  try {
    const sources = build.materialize(stage, fs.readFileSync(path.join(__dirname, 'entry.cjs')));
    const safety = require(path.join(stage, 'frozen/safety.js')); assert.ok(safety.TEMPLATE_REGISTRY.every(Object.isFrozen));
    assert.deepEqual(require.cache[path.join(stage, 'frozen/safety.js')].children.map(child => child.filename),
      [path.join(stage, 'frozen/analysis.js')]);
    build.assertSourcesUnchanged(stage, sources);
  } finally { fs.rmSync(stage, { recursive: true, force: true }); }
  const suites = focusedTests(), branchScope = scope(manifest);
  const clean = process.argv.includes('--clean-install') ? cleanInstall(manifest, artifact) : { result: 'NOT_REQUESTED' };
  const browser = suites.find(suite => suite.file.endsWith('browser.test.cjs'));
  const report = {
    phase: '2B-3B-2B', branch: 'phase2b-analytics-runtime-facade', requiredSoleParent: build.CORE_COMMIT,
    frozenInputs: manifest.inputs, frozenInputBytesUnchanged: true, acceptedCoreBytesUnchanged: true,
    SafetyAnalysisResolution: 'one exact frozen Analysis module; literal ./analysis.js resolution unchanged',
    pipeline: 'snapshot -> frozen Analysis -> closed plan -> frozen Safety exactly once -> coherence gate -> presentation-only formatter -> immutable render-only DTO',
    canonicalFormatter: { insightTemplates: 25, whyTemplates: 4, fallbackTemplates: 1, actualSafetyApprovedScenarios: 48,
      textOracleRegistryCommit: 'ba46070bbcd42af51fb534c3282dd8a350bcfb20', catalogBodiesDuplicated: false,
      numericRendering: 'exact non-locale numeric text; negative zero -0; no rounding, percent conversion or recomputation',
      listSeparator: ', ', basisRecordSeparator: '; ', revisionDimensions: ['primary', 'success', 'scope', 'nonGoals', 'constraints', 'rationale'] },
    focusedTests: { passed: suites.reduce((n, suite) => n + suite.passed, 0), failed: 0, suites },
    browserParity: { passed: browser.cases.filter(name => name.startsWith('Node vs bundled evaluate parity:')).length, failed: 0 },
    publicFacade: { global: 'PHEISIRAETHA_ANALYTICS_V1', operations: ['evaluate'], immutableObject: true,
      immutableGlobalBinding: true, collisionRejectedWithoutOverwrite: true, rawAndTestApisAbsent: true,
      DTO: 'new detached deeply frozen plain data; exact five top-level / seven component keys', lang: 'en', dir: 'ltr' },
    browserExecution: { artifactTested: manifest.output.file, environment: 'isolated JavaScript VM with trapped browser APIs',
      externalNodeGlobalsRequired: false, runtimeDOMStorageNetworkClockRandomLocaleAccesses: 0, loadEvaluations: 0 },
    artifacts: { historical: manifest.historicalArtifact, current: manifest.output },
    reproducibility: { repeatedFreshStages: 2, artifactByteIdentical: true, profileAndPinnedLockUnchanged: true, cleanLockedBuild: clean },
    scope: branchScope,
    fullFrozenSafetySuiteRerun: false, fullFrozenAnalysisSuiteRerun: false,
    phase3B3IntegrationSuite: false, phase3B4Arbitration: false
  };
  if (process.argv.includes('--write-evidence')) fs.writeFileSync(path.join(__dirname, 'verification-results.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ focusedTests: report.focusedTests.passed, browserParity: report.browserParity.passed,
    formatterBodies: 30, artifactSha256: manifest.output.sha256, reproducibility: report.reproducibility, scope: branchScope }, null, 2));
}

const AGGREGATION_BASE = '26d6685cdfd94a68befdb8eff54431bf92bc8b8f';
const AGGREGATION_TESTS = Object.freeze([
  'runtime-core/source-snapshot.test.cjs',
  'runtime-core/presentation-plan.test.cjs',
  'runtime-core/browser-isolation.test.cjs',
  'runtime-facade/runtime.test.cjs',
  'runtime-facade/formatter.test.cjs',
  'runtime-facade/browser.test.cjs',
  'runtime-facade/safety-plan-boundary.integration.test.cjs',
  'runtime-facade/state-data.test.cjs',
  'runtime-facade/browser-package-gap.test.cjs',
  'integration/app-state-baseline.test.cjs'
]);
const AGGREGATION_ADDITIONS = Object.freeze(AGGREGATION_TESTS.slice(6).map(file => `browser-packaging/${file}`));
const AGGREGATION_VERIFIER = 'browser-packaging/verify.cjs';

function aggregationScope() {
  const head = build.git('rev-parse', 'HEAD').toString().trim();
  assert.equal(build.git('diff', '--cached', '--name-only', '-z', head).length, 0,
    'aggregation verification requires no staged changes relative to HEAD');
  assert.equal(build.git('diff', '--name-only', '-z').length, 0,
    'aggregation verification requires no unstaged changes');
  build.git('merge-base', '--is-ancestor', AGGREGATION_BASE, head);
  const tree = ref => new Map(build.git('ls-tree', '-r', '-z', ref).toString().split('\0').filter(Boolean).map(entry => {
    const separator = entry.indexOf('\t');
    const [mode, type, blob] = entry.slice(0, separator).split(' ');
    return [entry.slice(separator + 1), { mode, type, blob }];
  }));
  const baseline = tree(AGGREGATION_BASE), current = tree(head);
  const allowed = new Set([AGGREGATION_VERIFIER, ...AGGREGATION_ADDITIONS]);
  for (const [file, identity] of baseline) {
    assert.ok(current.has(file), `${file}: baseline file removed`);
    if (file === AGGREGATION_VERIFIER) {
      assert.equal(current.get(file).mode, identity.mode);
      assert.equal(current.get(file).type, identity.type);
    } else assert.deepEqual(current.get(file), identity, `${file}: committed baseline identity changed`);
  }
  for (const [file, identity] of current) {
    if (!baseline.has(file)) assert.ok(AGGREGATION_ADDITIONS.includes(file), `${file}: unexpected committed addition`);
    if (allowed.has(file)) assert.deepEqual({ mode: identity.mode, type: identity.type },
      { mode: '100644', type: 'blob' }, `${file}: expected regular non-executable file`);
    const local = path.join(build.ROOT, file), stat = fs.lstatSync(local);
    assert.ok(stat.isFile(), `${file}: expected regular worktree file`);
    assert.equal(Boolean(stat.mode & 0o111), identity.mode === '100755', `${file}: worktree executable mode changed`);
    assert.deepEqual(fs.readFileSync(local), build.git('show', `${head}:${file}`),
      `${file}: worktree bytes differ from the scoped commit`);
  }
  for (const file of AGGREGATION_TESTS) {
    const relative = `browser-packaging/${file}`;
    assert.ok(current.has(relative), `${relative}: required test is not committed`);
    assert.ok(fs.lstatSync(path.join(__dirname, file)).isFile(), `${relative}: required test is missing`);
  }
  const untracked = build.git('ls-files', '--others', '--exclude-standard', '-z').toString().split('\0').filter(Boolean);
  assert.equal(untracked.length, 0, 'aggregation verification requires no untracked files');
  assert.ok(untracked.every(file => allowed.has(file)), `out-of-scope untracked paths: ${untracked.filter(file => !allowed.has(file))}`);
  return { baseCommit: AGGREGATION_BASE, headCommit: head, allowedChanges: [...allowed] };
}

async function verifyAggregationTestsOnly() {
  // Full focused suites, without name filters or exclusions. Their private test
  // instrumentation remains owned by the tests; this route never rebuilds the
  // production artifact, runs cleanInstall/scope, or writes historical evidence.
  const before = aggregationScope();
  const suites = AGGREGATION_TESTS.map(file => {
    const output = execFileSync(process.execPath, ['--test', '--test-reporter=tap', path.join(__dirname, file)],
      { cwd: build.ROOT, encoding: 'utf8', timeout: 30000, maxBuffer: 4 * 1024 * 1024 });
    const count = name => {
      const matches = [...output.matchAll(new RegExp(`^# ${name} (\\d+)$`, 'gm'))];
      assert.equal(matches.length, 1, `${file}: one ${name} summary required`);
      const value = Number(matches[0][1]);
      assert.ok(Number.isSafeInteger(value), `${file}: invalid ${name} summary`);
      return value;
    };
    const tests = count('tests'), passed = count('pass');
    assert.ok(tests > 0, `${file}: no tests executed`);
    for (const name of ['fail', 'cancelled', 'skipped', 'todo']) assert.equal(count(name), 0, `${file}: ${name} tests`);
    assert.equal(passed, tests, `${file}: every selected test must pass`);
    return { file: `browser-packaging/${file}`, passed, failed: 0 };
  });
  const after = aggregationScope();
  assert.deepEqual(after, before, 'aggregation scope changed during focused tests');
  console.log(JSON.stringify({ phase: '2B-3B-3', route: 'tests-only', scope: after,
    focusedTests: { passed: suites.reduce((total, suite) => total + suite.passed, 0), failed: 0, suites } }, null, 2));
}
const APP_INTEGRATION_BASE = '8abdd344cf9ef9c7feafb0da70c3c245ee319d63';
const APP_INTEGRATION_ADDITIONS = Object.freeze([
  'app-analytics-basic.test.cjs',
  'app-analytics-generation.test.cjs',
  'app-analytics-persistence.test.cjs',
  'app-analytics-dom-isolation.test.cjs'
].map(file => `browser-packaging/integration/${file}`));
const APP_INTEGRATION_ALLOWED = Object.freeze(['app.js', AGGREGATION_VERIFIER, ...APP_INTEGRATION_ADDITIONS]);
const APP_INTEGRATION_TESTS = Object.freeze([
  ...AGGREGATION_TESTS.map(file => `browser-packaging/${file}`),
  'legacy-dom.test.js',
  ...APP_INTEGRATION_ADDITIONS
]);

function appIntegrationScope() {
  const head = build.git('rev-parse', 'HEAD').toString().trim();
  assert.equal(build.git('diff', '--cached', '--name-only', '-z', head).length, 0,
    '3B-5 verification requires no staged changes relative to HEAD');
  assert.equal(build.git('diff', '--name-only', '-z').length, 0,
    '3B-5 verification requires no unstaged changes');
  assert.equal(build.git('ls-files', '--others', '--exclude-standard', '-z').length, 0,
    '3B-5 verification requires no untracked files');
  build.git('merge-base', '--is-ancestor', APP_INTEGRATION_BASE, head);
  const tree = ref => new Map(build.git('ls-tree', '-r', '-z', ref).toString().split('\0').filter(Boolean).map(entry => {
    const separator = entry.indexOf('\t');
    const [mode, type, blob] = entry.slice(0, separator).split(' ');
    return [entry.slice(separator + 1), { mode, type, blob }];
  }));
  const baseline = tree(APP_INTEGRATION_BASE), current = tree(head);
  const allowed = new Set(APP_INTEGRATION_ALLOWED);
  // Every protected base blob and mode is pinned, including all frozen runtime,
  // facade, artifact and accepted test bytes, especially legacy-dom.test.js.
  for (const [file, identity] of baseline) {
    assert.ok(current.has(file), `${file}: 3B-5 baseline file removed`);
    if (allowed.has(file)) assert.deepEqual(
      { mode: current.get(file).mode, type: current.get(file).type },
      { mode: identity.mode, type: identity.type }, `${file}: baseline mode/type changed`);
    else assert.deepEqual(current.get(file), identity, `${file}: protected 3B-5 baseline identity changed`);
  }
  for (const [file, identity] of current) {
    if (!baseline.has(file)) assert.ok(APP_INTEGRATION_ADDITIONS.includes(file),
      `${file}: unexpected 3B-5 committed addition`);
    if (allowed.has(file)) assert.deepEqual({ mode: identity.mode, type: identity.type },
      { mode: '100644', type: 'blob' }, `${file}: expected regular non-executable file`);
    const local = path.join(build.ROOT, file), stat = fs.lstatSync(local);
    assert.ok(stat.isFile(), `${file}: expected regular worktree file`);
    assert.equal(Boolean(stat.mode & 0o111), identity.mode === '100755', `${file}: worktree executable mode changed`);
    assert.deepEqual(fs.readFileSync(local), build.git('show', `${head}:${file}`),
      `${file}: worktree bytes differ from the scoped commit`);
  }
  for (const file of APP_INTEGRATION_TESTS) {
    assert.ok(current.has(file), `${file}: required 3B-5 route test is not committed`);
    assert.ok(fs.lstatSync(path.join(build.ROOT, file)).isFile(), `${file}: required test is missing`);
  }
  return { baseCommit: APP_INTEGRATION_BASE, headCommit: head, allowedChanges: [...allowed],
    protectedBaseFiles: [...baseline.keys()].filter(file => !allowed.has(file)).length };
}

async function verifyAppIntegrationTestsOnly() {
  assert.deepEqual(process.argv.slice(2), ['--3b5-tests-only'], 'select the 3B-5 tests-only route on its own');
  // Run the accepted ten 3B-3 suites, the unchanged legacy hardening suite and
  // all four wiring suites. No build, clean install, full frozen suites or writes.
  const before = appIntegrationScope();
  let suites, after;
  try {
    suites = APP_INTEGRATION_TESTS.map(file => {
      const output = execFileSync(process.execPath, ['--test', '--test-reporter=tap', path.join(build.ROOT, file)],
        { cwd: build.ROOT, encoding: 'utf8', timeout: 120000, maxBuffer: 4 * 1024 * 1024 });
      const count = name => {
        const matches = [...output.matchAll(new RegExp(`^# ${name} (\\d+)$`, 'gm'))];
        assert.equal(matches.length, 1, `${file}: one ${name} summary required`);
        const value = Number(matches[0][1]);
        assert.ok(Number.isSafeInteger(value), `${file}: invalid ${name} summary`);
        return value;
      };
      const tests = count('tests'), passed = count('pass');
      assert.ok(tests > 0, `${file}: no tests executed`);
      for (const name of ['fail', 'cancelled', 'skipped', 'todo']) assert.equal(count(name), 0, `${file}: ${name} tests`);
      assert.equal(passed, tests, `${file}: every selected test must pass`);
      return { file, passed, failed: 0 };
    });
  } finally {
    // Check the committed tree and all local bytes even when a suite fails.
    after = appIntegrationScope();
    assert.deepEqual(after, before, '3B-5 scope changed during focused tests');
  }
  console.log(JSON.stringify({ phase: '2B-3B-5', route: '3b5-tests-only', scope: after,
    focusedTests: { passed: suites.reduce((total, suite) => total + suite.passed, 0), failed: 0, suites } }, null, 2));
}

const ACCEPTED_3B5_BASE = '0593d4b62f30c978260c6a15ff54323bc1351cbd';
const ACCEPTED_S1_COMMIT = '9f327acae82054d2b9a28ea6f05ac48c53c65d71';
const ACCEPTED_S1_HARNESS_BLOB = 'd13700b967f82e1b4796655e4701315e338f676d';
const ACCEPTED_S2_COMMIT = '9ab969284ff9fbc09af4ee1cc277eb8d7a0766b9';
const ACCEPTED_S2_TEST_BLOB = 'ad41025cdee7f4222e8fd85205c669c146e7207a';
const EXPECTED_PRODUCTION_MAIN = '255a5d9d27461dcacaebc1bc80ab322dd54b4de8';
const SOURCE_ROOT = fs.realpathSync(path.resolve(__dirname, '..'));
const S1_HARNESS = 'browser-packaging/integration/real-browser-harness.cjs';
const S2_TEST = 'browser-packaging/integration/real-browser.test.cjs';
const DEPENDENCY_DIRECTORY = 'browser-packaging/node_modules';
const REAL_BROWSER_TESTS = Object.freeze([...APP_INTEGRATION_TESTS, S2_TEST]);
const MAX_CAPTURED_OUTPUT = 16 * 1024 * 1024;

function environmentBlocked(message, cause) {
  const error = new Error(`ENVIRONMENT_BLOCKED: ${message}`, { cause });
  error.code = 'ENVIRONMENT_BLOCKED';
  return error;
}

function inside(root, file) {
  const relative = path.relative(root, file);
  return relative === '' || (relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative));
}

function processEnvironment() {
  const env = { ...process.env };
  // Neither Git overrides nor Node preload/resolution overrides may redirect
  // pinned objects, the external runtime, or the clean clone.
  for (const key of Object.keys(env)) if (key.startsWith('GIT_') || key === 'NODE_OPTIONS' ||
    key === 'NODE_PATH' || key === 'NODE_REPL_EXTERNAL_MODULE') delete env[key];
  return { ...env, GIT_OPTIONAL_LOCKS: '0', GIT_NO_REPLACE_OBJECTS: '1',
    GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null', GIT_ATTR_NOSYSTEM: '1',
    GIT_TERMINAL_PROMPT: '0', GIT_CONFIG_COUNT: '2',
    GIT_CONFIG_KEY_0: 'core.hooksPath', GIT_CONFIG_VALUE_0: '/dev/null',
    GIT_CONFIG_KEY_1: 'core.fsmonitor', GIT_CONFIG_VALUE_1: 'false' };
}

function gitAt(root, args, env = processEnvironment()) {
  return execFileSync('git', ['-c', 'core.fsmonitor=false', '-C', root, ...args],
    { env: { ...env, GIT_OPTIONAL_LOCKS: '0' }, timeout: 30000, maxBuffer: MAX_CAPTURED_OUTPUT, stdio: 'pipe' });
}

function gitString(root, args, env) { return gitAt(root, args, env).toString('utf8').trim(); }
function hash(bytes) { return createHash('sha256').update(bytes).digest('hex'); }
function gitTree(root, ref, env) {
  return new Map(gitAt(root, ['ls-tree', '-r', '-z', ref], env).toString('utf8').split('\0').filter(Boolean).map(entry => {
    const split = entry.indexOf('\t');
    const [mode, type, blob] = entry.slice(0, split).split(' ');
    return [entry.slice(split + 1), { mode, type, blob }];
  }));
}

function exactDelta(root, base, head, expected, env) {
  assert.deepEqual(gitAt(root, ['diff', '--no-renames', '--name-status', '-z', base, head], env)
    .toString('utf8').split('\0').filter(Boolean), expected, 'Exact committed path/status delta required');
}

function acceptedBrowserCheckpoint(root, env) {
  gitAt(root, ['merge-base', '--is-ancestor', ACCEPTED_3B5_BASE, ACCEPTED_S1_COMMIT], env);
  assert.equal(gitString(root, ['show', '-s', '--format=%P', ACCEPTED_S2_COMMIT], env), ACCEPTED_S1_COMMIT);
  assert.equal(gitString(root, ['rev-parse', `${ACCEPTED_S1_COMMIT}:${S1_HARNESS}`], env), ACCEPTED_S1_HARNESS_BLOB);
  assert.equal(gitString(root, ['rev-parse', `${ACCEPTED_S2_COMMIT}:${S2_TEST}`], env), ACCEPTED_S2_TEST_BLOB);
  exactDelta(root, ACCEPTED_3B5_BASE, ACCEPTED_S1_COMMIT, ['A', S1_HARNESS], env);
  exactDelta(root, ACCEPTED_S1_COMMIT, ACCEPTED_S2_COMMIT, ['A', S2_TEST], env);
  const baseline = gitTree(root, ACCEPTED_3B5_BASE, env);
  const expected = new Map(baseline);
  assert.ok(!expected.has(S1_HARNESS) && !expected.has(S2_TEST));
  expected.set(S1_HARNESS, { mode: '100644', type: 'blob', blob: ACCEPTED_S1_HARNESS_BLOB });
  expected.set(S2_TEST, { mode: '100644', type: 'blob', blob: ACCEPTED_S2_TEST_BLOB });
  assert.deepEqual(gitTree(root, ACCEPTED_S2_COMMIT, env), expected,
    'All accepted S2 tree entries must match the baseline plus the two pinned additions');
  return expected;
}

function metadata(stat) {
  // Reads can change atime. Write/identity metadata is captured at nanosecond
  // precision; content, links and their external targets are captured below.
  return Object.fromEntries(['dev', 'ino', 'mode', 'nlink', 'uid', 'gid', 'size', 'mtimeNs', 'ctimeNs']
    .map(key => [key, stat[key].toString()]));
}

function fingerprintDirectory(directory, { followLinks = false, noHardlinks = false } = {}) {
  if (!fs.existsSync(directory)) return null;
  const records = [];
  function visit(file, label, ancestors) {
    const stat = fs.lstatSync(file, { bigint: true });
    if (stat.isSymbolicLink()) {
      assert.ok(followLinks, `${label}: unexpected symbolic link`);
      const canonical = fs.realpathSync(file);
      records.push({ label, ...metadata(stat), link: fs.readlinkSync(file), canonical });
      visit(canonical, `${label}/@target`, ancestors);
    } else if (stat.isDirectory()) {
      const canonical = fs.realpathSync(file);
      assert.ok(!ancestors.has(canonical), `${label}: cyclic dependency link`);
      const next = new Set([...ancestors, canonical]);
      for (const child of fs.readdirSync(file).sort()) visit(path.join(file, child), `${label}/${child}`, next);
      records.push({ label, ...metadata(fs.lstatSync(file, { bigint: true })), kind: 'directory' });
    } else {
      assert.ok(stat.isFile(), `${label}: unexpected special file`);
      if (noHardlinks) assert.equal(stat.nlink, 1n, `${label}: hardlink dependence is forbidden`);
      records.push({ label, ...metadata(stat), sha256: hash(fs.readFileSync(file)) });
    }
  }
  visit(directory, '.', new Set());
  return hash(JSON.stringify(records));
}

function dependencyFingerprint() {
  const directory = path.join(SOURCE_ROOT, DEPENDENCY_DIRECTORY);
  if (!fs.existsSync(directory)) return null;
  assert.ok(fs.lstatSync(directory).isDirectory(), 'Allowed node_modules root must be an existing ordinary directory');
  return fingerprintDirectory(directory, { followLinks: true });
}

function checkoutFiles(root, tree, allowDependencies, env) {
  const directories = new Set(['']);
  for (const file of tree.keys()) {
    let directory = path.posix.dirname(file);
    while (directory !== '.') { directories.add(directory); directory = path.posix.dirname(directory); }
  }
  const state = [];
  function walk(directory, relative) {
    for (const name of fs.readdirSync(directory).sort()) {
      if (relative === '' && name === '.git') continue;
      const file = relative ? `${relative}/${name}` : name, absolute = path.join(directory, name);
      if (allowDependencies && file === DEPENDENCY_DIRECTORY) {
        assert.ok(fs.lstatSync(absolute).isDirectory(), 'Only an ordinary ignored dependency directory is allowed');
        continue;
      }
      const stat = fs.lstatSync(absolute, { bigint: true });
      if (stat.isDirectory()) {
        assert.ok(directories.has(file), `${file}: unexpected source directory, including empty/ignored directories`);
        walk(absolute, file);
        state.push({ file, ...metadata(fs.lstatSync(absolute, { bigint: true })), kind: 'directory' });
      } else {
        const identity = tree.get(file);
        assert.ok(identity, `${file}: unexpected source file, including ignored files`);
        assert.equal(identity.type, 'blob', `${file}: blob required`);
        assert.ok(stat.isFile(), `${file}: ordinary worktree file required`);
        assert.ok(['100644', '100755'].includes(identity.mode), `${file}: unexpected Git type/mode`);
        assert.equal(Boolean(stat.mode & 0o111n), identity.mode === '100755', `${file}: executable mode mismatch`);
        const bytes = fs.readFileSync(absolute);
        assert.deepEqual(bytes, gitAt(root, ['cat-file', 'blob', identity.blob], env), `${file}: committed bytes required`);
        state.push({ file, ...metadata(stat), sha256: hash(bytes) });
      }
    }
  }
  walk(root, '');
  assert.equal(state.filter(entry => entry.sha256).length, tree.size, 'Every Git leaf must exist in the worktree');
  return state;
}

function captureCheckout(root, { cleanS2 = false, env } = {}) {
  assert.equal(fs.realpathSync(gitString(root, ['rev-parse', '--show-toplevel'], env)), root);
  const head = gitString(root, ['rev-parse', 'HEAD'], env);
  const parent = gitString(root, ['show', '-s', '--format=%P', head], env);
  const expected = acceptedBrowserCheckpoint(root, env), tree = gitTree(root, head, env);
  if (cleanS2) {
    assert.equal(head, ACCEPTED_S2_COMMIT); assert.equal(parent, ACCEPTED_S1_COMMIT);
    assert.equal(gitString(root, ['rev-parse', 'refs/heads/main'], env), EXPECTED_PRODUCTION_MAIN);
  } else {
    assert.equal(parent, ACCEPTED_S2_COMMIT, 'Verifier candidate must have accepted S2 as its sole parent');
    exactDelta(root, ACCEPTED_S2_COMMIT, head, ['M', AGGREGATION_VERIFIER], env);
    exactDelta(root, ACCEPTED_3B5_BASE, head, ['A', S1_HARNESS, 'A', S2_TEST, 'M', AGGREGATION_VERIFIER], env);
    const verifier = tree.get(AGGREGATION_VERIFIER);
    assert.ok(verifier); assert.equal(verifier.mode, '100644'); assert.equal(verifier.type, 'blob');
    expected.set(AGGREGATION_VERIFIER, verifier);
    assert.equal(gitString(root, ['rev-parse', 'refs/remotes/origin/main'], env), EXPECTED_PRODUCTION_MAIN,
      'Local origin/main must retain the expected production main');
  }
  assert.deepEqual(tree, expected, 'Full tree scope: no additional path, blob, mode or type substitution');
  const index = gitAt(root, ['ls-files', '--stage', '-z'], env).toString('base64');
  const staged = gitAt(root, ['diff', '--cached', '--raw', '-z', head], env).toString('base64');
  const unstaged = gitAt(root, ['diff', '--raw', '-z'], env).toString('base64');
  const untracked = gitAt(root, ['ls-files', '--others', '--exclude-standard', '-z'], env).toString('base64');
  const ignored = gitAt(root, ['ls-files', '--others', '--ignored', '--exclude-standard', '-z'], env)
    .toString('utf8').split('\0').filter(Boolean);
  assert.equal(staged, ''); assert.equal(unstaged, ''); assert.equal(untracked, '');
  assert.ok(ignored.every(file => !cleanS2 && file.startsWith(`${DEPENDENCY_DIRECTORY}/`)),
    'Only existing ignored browser-packaging/node_modules content is permitted');
  if (cleanS2) assert.equal(gitAt(root, ['ls-files', '--others', '-z'], env).length, 0);
  const gitDirectory = fs.realpathSync(path.resolve(root, gitString(root, ['rev-parse', '--absolute-git-dir'], env)));
  const gitCommonDirectory = fs.realpathSync(path.resolve(root, gitString(root, ['rev-parse', '--git-common-dir'], env)));
  assert.ok(fs.lstatSync(gitDirectory).isDirectory() && fs.lstatSync(gitCommonDirectory).isDirectory());
  const dotGitPath = path.join(root, '.git'), dotGitStat = fs.lstatSync(dotGitPath, { bigint: true });
  assert.ok(dotGitStat.isDirectory() || dotGitStat.isFile(), '.git must be an ordinary directory or regular Git pointer file');
  const dotGitType = dotGitStat.isDirectory() ? 'directory' : 'regular file';
  const dotGitPointerBytes = dotGitStat.isFile() ? fs.readFileSync(dotGitPath).toString('base64') : null;
  if (dotGitStat.isDirectory()) assert.equal(fs.realpathSync(dotGitPath), gitDirectory);
  if (cleanS2) {
    assert.equal(dotGitType, 'directory', 'Clean S2 clone requires an ordinary .git directory');
    assert.equal(gitDirectory, dotGitPath, 'Clean S2 clone must own its standalone Git directory');
    assert.equal(gitCommonDirectory, gitDirectory, 'Clean S2 clone must not share a common Git directory');
    assert.ok(!fs.existsSync(path.join(gitDirectory, 'commondir')), 'Clean S2 clone must have no commondir indirection');
  }
  for (const directory of new Set([gitDirectory, gitCommonDirectory])) {
    for (const file of ['objects/info/alternates', 'objects/info/http-alternates'])
      assert.ok(!fs.existsSync(path.join(directory, file)), `${file}: shared object storage is forbidden`);
  }
  const refs = gitAt(root, ['for-each-ref', '--format=%(refname)%00%(objectname)%00%(symref)'], env).toString('utf8');
  const remotes = gitString(root, ['remote'], env);
  if (cleanS2) {
    assert.equal(remotes, '', 'Clean S2 clone must have no remote');
    assert.ok(!/^refs\/(?:remotes\/origin|origin)(?:\/|\0)/m.test(refs), 'No origin refs may be recreated');
    assert.ok(!fs.existsSync(path.join(root, DEPENDENCY_DIRECTORY)), 'No repository-local node_modules in S2');
    fingerprintDirectory(gitDirectory, { noHardlinks: true });
  }
  const files = checkoutFiles(root, tree, !cleanS2, env);
  return { head, parent, tree: [...tree], index, staged, unstaged, untracked, ignored, refs, remotes,
    gitDir: gitDirectory, gitCommonDir: gitCommonDirectory, dotGitType, dotGitPointerBytes,
    dotGitMetadata: metadata(dotGitStat),
    indexBytes: fs.readFileSync(path.join(gitDirectory, 'index')).toString('base64'),
    headBytes: fs.readFileSync(path.join(gitDirectory, 'HEAD')).toString('base64'),
    headFile: hash(fs.readFileSync(path.join(gitDirectory, 'HEAD'))), files,
    gitStorage: fingerprintDirectory(gitDirectory),
    gitCommonStorage: gitCommonDirectory === gitDirectory ? null : fingerprintDirectory(gitCommonDirectory),
    originMain: cleanS2 ? null : gitString(root, ['rev-parse', 'refs/remotes/origin/main'], env) };
}

function canonicalPlaywright(packageFile, entryFile) {
  const files = [packageFile, entryFile].map(file => fs.realpathSync(file));
  if ([packageFile, entryFile, ...files].some(file => inside(SOURCE_ROOT, path.resolve(file))))
    throw environmentBlocked('Repository-local Playwright is forbidden; no fallback is permitted');
  const [canonicalPackage, entry] = files, packageRoot = path.dirname(canonicalPackage);
  const nodeModules = fs.realpathSync(path.dirname(packageRoot));
  assert.equal(path.basename(nodeModules), 'node_modules');
  assert.equal(packageRoot, path.join(nodeModules, 'playwright'));
  assert.equal(canonicalPackage, path.join(packageRoot, 'package.json'));
  assert.ok(fs.statSync(packageRoot).isDirectory() && fs.statSync(entry).isFile() && inside(packageRoot, entry));
  const pkg = JSON.parse(fs.readFileSync(canonicalPackage, 'utf8'));
  assert.equal(pkg.name, 'playwright'); assert.match(pkg.version, /^\d+\.\d+\.\d+(?:[-+].+)?$/);
  assert.equal(typeof require(entry).chromium?.launch, 'function');
  return Object.freeze({ packageRoot, entry, version: pkg.version, nodeModules });
}

function selectPlaywright() {
  const resolved = [], failures = [];
  for (const specifier of ['playwright/package.json', 'playwright']) {
    try { resolved.push(require.resolve(specifier)); }
    catch (error) { resolved.push(null); failures.push(error); }
  }
  // Inspect every successful resolution even if its companion resolution failed.
  // A repository-local partial candidate can never authorize fallback.
  for (const file of resolved.filter(Boolean)) {
    if (inside(SOURCE_ROOT, path.resolve(file)))
      throw environmentBlocked('Repository-local Playwright is forbidden; no fallback is permitted');
    try {
      if (inside(SOURCE_ROOT, fs.realpathSync(file)))
        throw environmentBlocked('Repository-local Playwright is forbidden; no fallback is permitted');
    } catch (error) {
      if (error.code === 'ENVIRONMENT_BLOCKED') throw error;
      failures.push(error);
    }
  }
  if (resolved.every(Boolean)) {
    try { return canonicalPlaywright(...resolved); }
    catch (error) { if (error.code === 'ENVIRONMENT_BLOCKED') throw error; failures.push(error); }
  }
  try {
    const fallback = process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;
    assert.ok(fallback && path.isAbsolute(fallback), 'Fallback node_modules root must be absolute');
    const canonical = fs.realpathSync(fallback);
    assert.equal(fallback, canonical, 'Fallback node_modules root must already be canonical');
    assert.ok(fs.statSync(canonical).isDirectory() && !inside(SOURCE_ROOT, canonical));
    const resolver = createRequire(path.join(path.dirname(canonical), '__pheisiraetha_external_probe__.cjs'));
    const candidate = canonicalPlaywright(resolver.resolve('playwright/package.json'), resolver.resolve('playwright'));
    assert.equal(candidate.nodeModules, canonical, 'Fallback must be the exact parent of the resolved installation');
    return candidate;
  } catch (cause) {
    throw environmentBlocked('No valid canonical external Playwright installation', new AggregateError([...failures, cause]));
  }
}

async function capturedChild(command, args, { cwd, env, timeout }) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, env, stdio: ['ignore', 'pipe', 'pipe'], detached: true });
    const stdout = [], stderr = [];
    let length = 0, primary, cleanupFailure, timer;
    function terminate() {
      if (!child.pid) return;
      try { process.kill(-child.pid, 'SIGKILL'); }
      catch (error) { if (error.code !== 'ESRCH') cleanupFailure ??= error; }
    }
    function receive(destination, bytes) {
      length += bytes.length;
      if (length > MAX_CAPTURED_OUTPUT) {
        primary ??= new Error('Child output exceeded the frozen 16 MiB limit'); terminate();
      } else destination.push(bytes);
    }
    child.stdout.on('data', bytes => receive(stdout, bytes));
    child.stderr.on('data', bytes => receive(stderr, bytes));
    child.once('error', error => { primary ??= error; terminate(); });
    timer = setTimeout(() => { primary ??= new Error(`Child exceeded its ${timeout} ms timeout`); terminate(); }, timeout);
    child.once('close', (code, signal) => {
      clearTimeout(timer);
      // A killed test runner must not leave its test worker or browser alive.
      terminate();
      const result = { code, signal, stdout: Buffer.concat(stdout).toString('utf8'),
        stderr: Buffer.concat(stderr).toString('utf8') };
      const error = primary && cleanupFailure ? new AggregateError([primary, cleanupFailure], 'Child execution and process cleanup failed') :
        primary || cleanupFailure;
      if (error) { error.child = result; reject(error); } else resolve(result);
    });
  });
}

function runtimeEnvironment(playwright, extra = {}) {
  return { ...processEnvironment(), ...extra, NODE_PATH: playwright.nodeModules,
    CODEX_PRIMARY_RUNTIME_NODE_MODULES: playwright.nodeModules, GIT_OPTIONAL_LOCKS: '0' };
}

async function probePlaywright(cwd, file, env, expected) {
  const script = `const fs=require('node:fs'),path=require('node:path');
    const r=require('node:module').createRequire(process.argv[1]);
    const p=fs.realpathSync(r.resolve('playwright/package.json'));
    const entry=fs.realpathSync(r.resolve('playwright'));
    console.log(JSON.stringify({packageRoot:path.dirname(p),entry,version:JSON.parse(fs.readFileSync(p)).version}));`;
  try {
    const output = await capturedChild(process.execPath, ['-e', script, path.join(cwd, file)], { cwd, env, timeout: 15000 });
    assert.equal(output.code, 0); assert.equal(output.stderr.trim(), '');
    assert.deepEqual(JSON.parse(output.stdout), { packageRoot: expected.packageRoot, entry: expected.entry, version: expected.version });
  } catch (cause) { throw environmentBlocked('Playwright root/entry/version changed before a browser suite', cause); }
}

function chromiumIdentity(executable) {
  const canonical = fs.realpathSync(executable);
  assert.equal(canonical, executable, 'Chromium must retain its selected canonical path');
  assert.ok(fs.lstatSync(canonical).isFile(), 'Chromium must be an existing regular executable');
  fs.accessSync(canonical, fs.constants.X_OK);
  const stat = fs.statSync(canonical);
  assert.ok(stat.mode & 0o111, 'Chromium must have executable permission');
  return { path: canonical, sha256: hash(fs.readFileSync(canonical)) };
}

async function qualifyChromium(env, playwright) {
  try {
    const requested = process.env.LEGACY_DOM_CHROMIUM_EXECUTABLE_PATH;
    assert.ok(requested, 'LEGACY_DOM_CHROMIUM_EXECUTABLE_PATH must explicitly select an existing browser');
    const identity = chromiumIdentity(fs.realpathSync(requested));
    const version = await capturedChild(identity.path, ['--version'], { cwd: SOURCE_ROOT, env, timeout: 15000 });
    assert.equal(version.code, 0); assert.equal(version.stderr.trim(), '');
    assert.match(version.stdout.trim(), /^(?:Chromium|Google Chrome|Chrome for Testing|HeadlessChrome)\s+\d+/);
    const qualifiedEnv = { ...env, LEGACY_DOM_CHROMIUM_EXECUTABLE_PATH: identity.path };
    const script = `const {chromium}=require(process.argv[1]);
      (async()=>{let browser,primary,cleanup;try{browser=await chromium.launch({headless:true,
        executablePath:process.env.LEGACY_DOM_CHROMIUM_EXECUTABLE_PATH});
        console.log(JSON.stringify({version:browser.version()}));}catch(e){primary=e;}
        finally{try{await browser?.close();}catch(e){cleanup=e;}}
        if(primary&&cleanup)throw new AggregateError([primary,cleanup]);
        if(primary||cleanup)throw primary||cleanup;})()
        .catch(e=>{console.error(e);process.exitCode=1;});`;
    const launch = await capturedChild(process.execPath, ['-e', script, playwright.entry],
      { cwd: SOURCE_ROOT, env: qualifiedEnv, timeout: 30000 });
    assert.equal(launch.code, 0); assert.equal(launch.stderr.trim(), '');
    assert.ok(JSON.parse(launch.stdout).version);
    assert.ok(version.stdout.includes(JSON.parse(launch.stdout).version), 'Plain and launched Chromium versions must agree');
    assert.deepEqual(chromiumIdentity(identity.path), identity, 'Chromium changed during qualification');
    return { ...identity, version: version.stdout.trim() };
  } catch (cause) { throw environmentBlocked('Selected existing Chromium could not be qualified', cause); }
}

async function strictSuite(file, cwd, env, timeout, browserSuite) {
  let output;
  try { output = await capturedChild(process.execPath, ['--test', '--test-reporter=tap', path.join(cwd, file)], { cwd, env, timeout }); }
  catch (error) { output = error.child; if (!output) throw error; output.executionError = error; }
  if (browserSuite && /browserType\.launch:|Installed Playwright Chromium failed to launch|No usable installed Chromium executable/
    .test(output.stdout + output.stderr)) throw environmentBlocked(`${file}: accepted browser suite could not launch Chromium`);
  if (output.executionError) throw output.executionError;
  assert.equal(output.stderr.trim(), '', `${file}: child stderr must be empty`);
  assert.equal(output.code, 0, `${file}: child failed (${output.signal || output.code})\n${output.stdout.slice(-8192)}`);
  const counts = {};
  for (const name of ['tests', 'pass', 'fail', 'cancelled', 'skipped', 'todo']) {
    const matches = [...output.stdout.matchAll(new RegExp(`^# ${name} (\\d+)$`, 'gm'))];
    assert.equal(matches.length, 1, `${file}: exactly one ${name} summary required`);
    counts[name] = Number(matches[0][1]);
    assert.ok(Number.isSafeInteger(counts[name]), `${file}: invalid ${name} count`);
  }
  assert.ok(counts.tests > 0, `${file}: no tests executed`); assert.equal(counts.pass, counts.tests);
  for (const name of ['fail', 'cancelled', 'skipped', 'todo']) assert.equal(counts[name], 0, `${file}: ${name} tests`);
  return { file, ...counts };
}

function makeCloneEnvironment(temporary, playwright, chromium) {
  const env = {};
  for (const key of ['PATH', 'LD_LIBRARY_PATH', 'LANG', 'LC_ALL', 'TZ']) if (process.env[key] !== undefined) env[key] = process.env[key];
  const paths = { HOME: 'home', XDG_CONFIG_HOME: 'config', XDG_CACHE_HOME: 'cache', XDG_DATA_HOME: 'data',
    XDG_STATE_HOME: 'state', XDG_RUNTIME_DIR: 'runtime', TMP: 'tmp', TEMP: 'tmp', TMPDIR: 'tmp' };
  for (const [key, directory] of Object.entries(paths)) {
    env[key] = path.join(temporary, directory); fs.mkdirSync(env[key], { recursive: true, mode: 0o700 });
  }
  const hooks = path.join(temporary, 'hooks'); fs.mkdirSync(hooks);
  return { ...env, NODE_PATH: playwright.nodeModules, CODEX_PRIMARY_RUNTIME_NODE_MODULES: playwright.nodeModules,
    LEGACY_DOM_CHROMIUM_EXECUTABLE_PATH: chromium.path, GIT_OPTIONAL_LOCKS: '0', GIT_NO_REPLACE_OBJECTS: '1',
    GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null', GIT_ATTR_NOSYSTEM: '1', GIT_TERMINAL_PROMPT: '0',
    GIT_ALLOW_PROTOCOL: 'file', GIT_CONFIG_COUNT: '2', GIT_CONFIG_KEY_0: 'core.hooksPath', GIT_CONFIG_VALUE_0: hooks,
    GIT_CONFIG_KEY_1: 'core.fsmonitor', GIT_CONFIG_VALUE_1: 'false' };
}

async function verifyRealBrowserTestsOnly() {
  let before, dependenciesBefore, chromium, playwright, temporary, checkout, cloneEnv, cloneBefore;
  let primary, postSourceFailure, chromiumFailure, dependencyFailure;
  const cloneFailures = [], suites = [];
  try {
    before = captureCheckout(SOURCE_ROOT);
    dependenciesBefore = dependencyFingerprint();
    try {
      assert.equal(process.version, 'v24.19.0');
      assert.equal(require('esbuild').version, '0.25.5');
      build = require('./build.cjs');
    } catch (cause) { throw environmentBlocked('Exact Node v24.19.0 / esbuild 0.25.5 runtime is required', cause); }
    playwright = selectPlaywright();
    process.env.NODE_PATH = playwright.nodeModules;
    process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES = playwright.nodeModules;
    const selectedEnv = runtimeEnvironment(playwright);
    chromium = await qualifyChromium(selectedEnv, playwright);
    const sourceEnv = { ...selectedEnv, LEGACY_DOM_CHROMIUM_EXECUTABLE_PATH: chromium.path };
    let B0;
    assert.equal(REAL_BROWSER_TESTS.length, 16);
    for (const file of APP_INTEGRATION_TESTS) {
      if (file === 'legacy-dom.test.js') {
        await probePlaywright(SOURCE_ROOT, file, sourceEnv, playwright);
        B0 = chromiumIdentity(chromium.path);
        assert.deepEqual(B0, { path: chromium.path, sha256: chromium.sha256 });
      }
      suites.push(await strictSuite(file, SOURCE_ROOT, sourceEnv, 120000, file === 'legacy-dom.test.js'));
    }
    const tempRoot = fs.realpathSync(os.tmpdir());
    assert.ok(!inside(SOURCE_ROOT, tempRoot), 'Clean-clone temporary root must be external to the source');
    temporary = fs.mkdtempSync(path.join(tempRoot, 'pheisiraetha-3b6-'));
    cloneEnv = makeCloneEnvironment(temporary, playwright, chromium);
    checkout = path.join(temporary, 'repo');
    gitAt(SOURCE_ROOT, ['clone', '--quiet', '--no-local', '--no-hardlinks', '--no-checkout', '--no-tags', SOURCE_ROOT, checkout], cloneEnv);
    gitAt(checkout, ['checkout', '--quiet', '--detach', ACCEPTED_S2_COMMIT], cloneEnv);
    gitAt(checkout, ['remote', 'remove', 'origin'], cloneEnv);
    // S2 observes the production main ref. Retain only this exact local ref,
    // independent of the source branch which git clone initially selected.
    const refs = gitString(checkout, ['for-each-ref', '--format=%(refname)'], cloneEnv).split('\n').filter(Boolean);
    for (const ref of refs) gitAt(checkout, ['update-ref', '-d', ref], cloneEnv);
    gitAt(checkout, ['update-ref', 'refs/heads/main', EXPECTED_PRODUCTION_MAIN], cloneEnv);
    cloneBefore = captureCheckout(checkout, { cleanS2: true, env: cloneEnv });
    await probePlaywright(checkout, S2_TEST, cloneEnv, playwright);
    const B1 = chromiumIdentity(chromium.path);
    assert.deepEqual(B1, B0, 'B0 and immediately-before-S2 Chromium bytes must match');
    try { suites.push(await strictSuite(S2_TEST, checkout, cloneEnv, 180000, true)); }
    finally {
      try {
        const B2 = chromiumIdentity(chromium.path);
        assert.deepEqual(B2, B1, 'B2 Chromium bytes must match B1');
        assert.deepEqual(B2, B0, 'B2 Chromium bytes must match B0');
      }
      catch (error) { chromiumFailure = error; }
    }
  } catch (error) { primary = error; }
  finally {
    // Never let cleanup or a later invariant replace the first test failure.
    if (cloneBefore) {
      try { assert.deepEqual(captureCheckout(checkout, { cleanS2: true, env: cloneEnv }), cloneBefore, 'Clean S2 clone mutated'); }
      catch (error) { cloneFailures.push(error); }
    }
    if (temporary) {
      try { fs.rmSync(temporary, { recursive: true, force: true }); assert.ok(!fs.existsSync(temporary)); }
      catch (error) { cloneFailures.push(error); }
    }
    if (before) {
      try { assert.deepEqual(captureCheckout(SOURCE_ROOT), before, 'Source scope changed during verification'); }
      catch (error) { postSourceFailure = error; }
    }
    if (chromium) {
      try { assert.deepEqual(chromiumIdentity(chromium.path), { path: chromium.path, sha256: chromium.sha256 }, 'Qualified Chromium identity changed'); }
      catch (error) { chromiumFailure ??= error; }
    }
    if (dependenciesBefore !== undefined) {
      try { assert.equal(dependencyFingerprint(), dependenciesBefore, 'Allowed ignored dependency bytes/metadata changed'); }
      catch (error) { dependencyFailure = error; }
    }
  }
  const errors = [primary, ...cloneFailures, postSourceFailure, chromiumFailure, dependencyFailure].filter(Boolean);
  if (errors.length === 1) throw errors[0];
  if (errors.length > 1) {
    const error = new AggregateError(errors, '3B-6 verification failed; primary error precedes cleanup/source/browser/dependency failures');
    if (primary?.code === 'ENVIRONMENT_BLOCKED') error.code = 'ENVIRONMENT_BLOCKED';
    throw error;
  }
  assert.equal(suites.length, 16);
  const totals = Object.fromEntries(['tests', 'pass', 'fail', 'cancelled', 'skipped', 'todo']
    .map(name => [name, suites.reduce((total, suite) => total + suite[name], 0)]));
  console.log(JSON.stringify({ route: '3b6-tests-only', base: ACCEPTED_3B5_BASE,
    s1Commit: ACCEPTED_S1_COMMIT, s1HarnessBlob: ACCEPTED_S1_HARNESS_BLOB,
    s2Commit: ACCEPTED_S2_COMMIT, s2TestBlob: ACCEPTED_S2_TEST_BLOB, suiteCount: suites.length, ...totals,
    playwrightVersion: playwright.version, playwrightPackageRoot: playwright.packageRoot, playwrightEntry: playwright.entry,
    chromiumPath: chromium.path, chromiumVersion: chromium.version, chromiumSha256: chromium.sha256,
    changedPathCount: 3, protectedChangedPathCount: 0, repositoryUnchanged: true,
    dependencyFingerprint: dependenciesBefore, cleanCloneUnchanged: true, cleanCloneRemoved: true,
    chromiumHashCheckpointsIdentical: true, suites }, null, 2));
}

function verifierRoute(args) {
  const routes = new Map([['--tests-only', verifyAggregationTestsOnly], ['--3b5-tests-only', verifyAppIntegrationTestsOnly],
    ['--3b6-tests-only', verifyRealBrowserTestsOnly]]);
  const selected = args.filter(arg => routes.has(arg));
  if (selected.length) {
    assert.equal(args.length, 1, 'A tests-only route must be selected exactly once and on its own');
    return routes.get(selected[0]);
  }
  assert.ok(args.every(arg => ['--clean-install', '--write-evidence'].includes(arg)), 'Unknown verifier argument');
  return verify;
}

(async () => {
  const route = verifierRoute(process.argv.slice(2));
  if (route !== verifyRealBrowserTestsOnly) build = require('./build.cjs');
  await route();
})().catch(error => { console.error(error); process.exitCode = 1; });
