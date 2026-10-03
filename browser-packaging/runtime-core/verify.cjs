'use strict';

// Developer verification only. Writes evidence only in this new directory.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const packaging = require('../build.cjs');
const BASE = '05ff32a421b7e013a91932516b97d577eb780405';
const MAIN = '255a5d9d27461dcacaebc1bc80ab322dd54b4de8';
const PREFIX = 'browser-packaging/runtime-core/';
const BRANCH = 'phase2b-analytics-runtime-core';
const ARTIFACT_SHA = '45deb294b2ecc2a8a1f3bf7067d5822d0676841ab82c36d4c95db08b9bfa821a';
const ARTIFACT = `browser-packaging/artifacts/analytics-v1.${ARTIFACT_SHA}.js`;
const files = ['README.md', 'browser-isolation.test.cjs', 'closed-catalog.cjs', 'fixtures.cjs', 'plain-data.cjs',
  'presentation-plan.cjs', 'presentation-plan.test.cjs', 'source-snapshot.cjs', 'source-snapshot.test.cjs',
  'test-support.cjs', 'verification-results.json', 'verify.cjs'];
const text = (...args) => packaging.git(...args).toString('utf8').trim();

function byteIntegrity() {
  const baseline = packaging.git('ls-tree', '-r', '--name-only', '-z', BASE).toString('utf8').split('\0').filter(Boolean);
  for (const file of baseline) assert.deepEqual(fs.readFileSync(path.join(packaging.ROOT, file)),
    packaging.git('show', `${BASE}:${file}`), `baseline bytes changed: ${file}`);
  const changed = text('diff', '--name-only', BASE).split('\n').filter(Boolean);
  const untracked = text('ls-files', '--others', '--exclude-standard').split('\n').filter(Boolean);
  for (const file of [...changed, ...untracked]) assert.ok(file.startsWith(PREFIX) && files.includes(file.slice(PREFIX.length)), file);
  assert.equal(text('symbolic-ref', '--short', 'HEAD'), BRANCH);
  const head = text('rev-parse', 'HEAD');
  if (head !== BASE) assert.equal(text('show', '-s', '--format=%P', head), BASE, 'required exact sole parent');
  assert.equal(text('show', '-s', '--format=%P', BASE), '87c4e91c23d1c59bd4735d7fd75c41f35c533797');
  assert.equal(text('rev-parse', 'refs/remotes/origin/main'), MAIN);
  assert.match(fs.readFileSync(path.join(packaging.ROOT, 'sw.js'), 'utf8'), /^const CACHE='pheisiraetha-v16';/);
  const inputs = packaging.sourceBlobs();
  assert.equal(packaging.sha256(fs.readFileSync(path.join(packaging.ROOT, ARTIFACT))), ARTIFACT_SHA);
  for (const file of ['analysis.js', 'analysis.test.js', 'safety.js', 'safety.test.js',
    'PHEISIRAETHA_SAFETY_BOUNDARY_SPEC.md', 'PHEISIRAETHA_SAFETY_TEMPLATE_REGISTRY_V1.md'])
    assert.equal(fs.existsSync(path.join(packaging.ROOT, file)), false, 'frozen inputs remain Git blobs / temporary test inputs');
  return { baselineFileCount: baseline.length, inputs: inputs.map(({ bytes, ...identity }) => identity) };
}

const before = byteIntegrity();
const testFiles = ['source-snapshot.test.cjs', 'presentation-plan.test.cjs', 'browser-isolation.test.cjs'].map(f => PREFIX + f);
const args = ['--test', '--test-reporter=tap', ...testFiles];
const output = execFileSync(process.execPath, args, { cwd: packaging.ROOT, encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 });
const statistic = name => {
  const match = output.match(new RegExp(`^# ${name} (\\d+)$`, 'm'));
  assert.ok(match, `missing test statistic: ${name}`);
  return Number(match[1]);
};
const tests = Object.fromEntries(['tests', 'pass', 'fail', 'cancelled', 'skipped', 'todo'].map(name => [name, statistic(name)]));
assert.equal(tests.tests, 160); assert.equal(tests.pass, 160);
for (const name of ['fail', 'cancelled', 'skipped', 'todo']) assert.equal(tests[name], 0);
assert.deepEqual(byteIntegrity(), before);

const evidence = {
  phase: '2B-3B-2A', branch: BRANCH, requiredSoleParent: BASE,
  authoritativeSpecCommit: '87c4e91c23d1c59bd4735d7fd75c41f35c533797',
  verificationCommand: 'node browser-packaging/runtime-core/verify.cjs',
  focusedTests: { command: `node ${args.join(' ')}`, nodeVersion: process.versions.node, ...tests },
  adapter: { result: 'PASS', contract: 'detached descriptor-only JSON-compatible plain-data copy',
    schemaValidation: false, valueCoercion: false, defaultRecovery: false, accessorCalls: 0,
    unknownPropertiesPreserved: true, malformedStoredValuesPreserved: true, bidirectionalDetachment: true,
    ownProtoKeyPreserved: true, unsupportedRepresentation: 'SOURCE_NOT_JSON_PLAIN_DATA' },
  plan: { result: 'PASS', contract: 'build-internal exact frozen registry tuple and reference request',
    reachableManifests: [MF3(), MF4()], componentCounts: [5, 9], emptyManifestId: null,
    exactE30: true, fullSevenFieldCandidateIdentity: true, bindingsContainDisplayValues: false,
    secondaryPromotion: false, componentDropping: false, manifestDowngrade: false, inputMutation: false,
    deterministicRepeatedOutput: true, failure: 'fixed RuntimeCoreFailure code; no partial plan or fallback approval' },
  mappingCoverage: { registeredCandidateTuples: 52, reachableCandidateTuples: 48, exercisedReachableTuples: 48,
    insightTemplates: 25, exercisedInsightTemplates: 25, actualSelectionScenarios: 48,
    safetyOracleBundles: { allow: 48, fail: 0 }, additionalMixedPriorityBundles: { allow: 2, fail: 0 },
    genericWhyEntries: ['E27', 'E28', 'E29'], capabilityEntry: 'E30',
    unreachableRegisteredTuples: 'REF B1/B2 x known/unavailable; actual selection remains QUAL/REV',
    nodeBrowserCoreParityCases: 48, fullFrozenSafetySuiteRun: false },
  frozenInputs: before.inputs,
  preservation: { allPackagingBaseFilesByteIdentical: true, checkedBaselineFiles: before.baselineFileCount,
    existingArtifact: ARTIFACT, existingArtifactSha256: ARTIFACT_SHA,
    entrySha256: packaging.sha256(fs.readFileSync(path.join(packaging.ROOT, 'browser-packaging/entry.cjs'))),
    productionFilesUnchanged: true, cache: 'pheisiraetha-v16', mainTrackingCommit: MAIN,
    productionNamespaceAddedOrChangedGlobals: 0, runtimeCoreIoCalls: 0, deploymentCommandsRun: false },
  scope: { addedFiles: files.map(f => PREFIX + f), publicBrowserApiAdded: false, productionCompositionAdded: false,
    facadeAdded: false, runtimeSafetyOrchestrationAdded: false, formatterAdded: false, rendererAdded: false },
  publicationVerification: 'performed separately after the single implementation commit and scoped push'
};
function MF3() { return 'safety.manifest.primaryFactualWithCapability'; }
function MF4() { return 'safety.manifest.primaryAndSecondaryFactualWithCapability'; }
fs.writeFileSync(path.join(__dirname, 'verification-results.json'), JSON.stringify(evidence, null, 2) + '\n');
console.log(JSON.stringify({ result: 'PASS', focusedTests: tests, reachableTuples: 48, insightTemplates: 25,
  nodeBrowserParityCases: 48, unchangedArtifactSha256: ARTIFACT_SHA, unchangedBaselineFiles: before.baselineFileCount }));
