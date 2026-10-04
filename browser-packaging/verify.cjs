'use strict';

// Build/composition verification only. Never runs the complete frozen suites.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const build = require('./build.cjs');
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
verify().catch(error => { console.error(error); process.exitCode = 1; });
