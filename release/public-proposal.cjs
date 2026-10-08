'use strict';
// Staged release preparation only. The explicit CLI writes fresh external artifacts; it never deploys.
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { readInputs, assemble, rollbackRelease, sha256, canonical } = require('./build.cjs');

const ROOT = path.resolve(__dirname, '..');
const PIN = '/*__RELEASE_CONFIG__*/null';
const OFF = 'const ANALYTICS_ENABLED = false;';
const ON = 'const ANALYTICS_ENABLED = true;';
const BUILDER_BLOB = '7982555aba12baf5323672da2371ed4a4829b893';
const WORKER_BLOB = '45438c5b650ea252ab861a7a11a4a149e470c2b4';
const SOURCE = '7e583ac695be2b213d25591deab430664e682988';
const APP_BLOB = '23a293db0bad74bbf565ae7780ba6ab249ca0a95';
const ARTIFACT_SHA = 'f1f975900faaa64649bcef42412c1856543c8716711d4119df9b964f4bf8c824';
const ARTIFACT = 'browser-packaging/artifacts/analytics-v1.' + ARTIFACT_SHA + '.js';

function flag(bytes) {
  const matches = bytes.toString('utf8').match(/const ANALYTICS_ENABLED = (?:false|true);/g) || [];
  assert.equal(matches.length, 1, 'Exactly one static analytics declaration required');
  return matches[0];
}

// Produces a new Buffer; never changes the frozen source or any input Map.
function enabledCandidate(inputs) {
  const original = inputs.candidate.get('app.js');
  assert.equal(flag(original), OFF);
  assert.equal(sha256(original), inputs.sourceAppSha256);
  const at = original.indexOf(Buffer.from(OFF));
  assert.ok(at >= 0);
  const changed = Buffer.concat([
    original.subarray(0, at), Buffer.from(ON), original.subarray(at + Buffer.byteLength(OFF))
  ]);
  assert.equal(flag(changed), ON);
  assert.deepEqual(changed.subarray(0, at), original.subarray(0, at));
  assert.deepEqual(changed.subarray(at + Buffer.byteLength(ON)),
    original.subarray(at + Buffer.byteLength(OFF)));
  const candidate = new Map(inputs.candidate);
  candidate.set('app.js', changed);
  return candidate;
}

function integrity(bytes) {
  return 'sha256-' + createHash('sha256').update(bytes).digest('base64');
}

function assertBootstrap(inputs, off) {
  const app = inputs.candidate.get('app.js');
  const appURL = 'release-assets/app.' + inputs.sourceAppSha256 + '.js';
  assert.equal(flag(app), OFF);
  assert.deepEqual(off.assets.get(appURL), app);
  const html = off.entry.toString('utf8');
  assert.ok(html.includes('<script src="' + appURL + '" integrity="' + integrity(app) +
    '" crossorigin="anonymous"></script>'), 'OFF bootstrap must pin frozen S3 application bytes');
  assert.ok(html.includes('<script src="' + ARTIFACT + '" integrity="' +
    integrity(inputs.candidate.get(ARTIFACT)) + '" crossorigin="anonymous"></script>'),
    'OFF bootstrap must pin the exact dormant artifact');
  assert.ok(html.indexOf('<script src="' + ARTIFACT + '"') < html.indexOf('<script src="' + appURL + '"'),
    'Artifact must precede the application');
  for (const file of ['app.css', 'launch.js', 'locales.js', 'app.js']) {
    const bytes = inputs.candidate.get(file);
    const dot = file.lastIndexOf('.');
    const url = 'release-assets/' + file.slice(0, dot) + '.' + sha256(bytes) + file.slice(dot);
    assert.deepEqual(off.assets.get(url), bytes);
    assert.ok(html.includes('"' + url + '" integrity="' + integrity(bytes) + '" crossorigin="anonymous"'),
      'Every bootstrap stylesheet/script must use a pinned immutable alias');
  }
  return appURL;
}

function finishProposal({files, assets, entry, entryURL, inventory, workerTemplate}) {
  const releaseDigest = sha256(canonical(inventory));
  const cacheName = 'pheisiraetha-release-' + inventory.generation + '-' + releaseDigest;
  const cacheKeyPrefix = '__pheisiraetha_release_cache__/' + releaseDigest + '/';
  const template = workerTemplate.toString('utf8');
  assert.equal(template.split(PIN).length, 2, 'Unique unchanged worker configuration pin');
  const worker = Buffer.from(template.replace(PIN, JSON.stringify({inventory, releaseDigest, cacheName})));
  files.set('sw.js', worker);
  files.set('release-inventory.json', Buffer.from(
    JSON.stringify({releaseDigest, inventory}, null, 2) + '\n'));
  return {files, assets, entry, entryURL, inventory, releaseDigest, cacheName, worker,
    workerTemplate, cacheKeyPrefix, sealURL: cacheKeyPrefix + 'complete',
    cacheKey: url => cacheKeyPrefix + encodeURIComponent(url)};
}

function verifyStagedRelease(release) {
  const {inventory, files, assets} = release;
  assert.ok(['STAGED_OFF_RELEASE_PROPOSAL', 'STAGED_ON_RELEASE_PROPOSAL'].includes(inventory.scope));
  assert.equal(inventory.provenance.integrationCommit, SOURCE);
  assert.equal(inventory.provenance.integrationAppBlob, APP_BLOB);
  assert.equal(inventory.provenance.proposalBuilderBlob, BUILDER_BLOB);
  assert.equal(inventory.provenance.sourceFlag, 'OFF');
  assert.equal(inventory.provenance.bootstrapKind, 'HARDENED_S3_OFF');
  assert.equal(inventory.provenance.bootstrapEntrySha256, sha256(files.get('index.html')));
  assert.deepEqual(files.get('index.html'), assets.get('index.html'));
  assert.equal(inventory.workerTemplateSha256, sha256(release.workerTemplate));
  assert.equal(release.releaseDigest, sha256(canonical(inventory)));
  assert.equal(release.cacheName, 'pheisiraetha-release-' + inventory.generation + '-' + release.releaseDigest);
  assert.equal(inventory.entryURL, release.entryURL);
  assert.deepEqual(release.entry, assets.get(release.entryURL));
  const config = {inventory, releaseDigest: release.releaseDigest, cacheName: release.cacheName};
  assert.deepEqual(release.worker, Buffer.from(
    release.workerTemplate.toString('utf8').replace(PIN, JSON.stringify(config))));
  assert.deepEqual(files.get('sw.js'), release.worker);
  const metadata = JSON.parse(files.get('release-inventory.json'));
  assert.equal(metadata.releaseDigest, release.releaseDigest);
  assert.deepEqual(metadata.inventory, inventory);
  const seen = new Set();
  for (const asset of inventory.assets) {
    assert.ok(!seen.has(asset.url), 'Duplicate inventory URL');
    seen.add(asset.url);
    const bytes = assets.get(asset.url);
    assert.ok(Buffer.isBuffer(bytes), asset.url);
    assert.equal(bytes.length, asset.sizeBytes, asset.url);
    assert.equal(sha256(bytes), asset.sha256, asset.url);
    assert.deepEqual(files.get(asset.url.split('?')[0]), bytes, asset.url);
  }
  assert.equal(seen.size, assets.size, 'All served assets must be covered by the inventory');
  assert.equal(sha256(assets.get(ARTIFACT)), ARTIFACT_SHA);
  assert.equal(inventory.baselineCache, 'pheisiraetha-v16');
  assert.equal(inventory.proposal.format, 'pheisiraetha-public-release-proposal-v1');
  assert.equal(inventory.proposal.delivery, 'STAGED_NOT_DEPLOYED');
  assert.deepEqual(assets.get(inventory.proposal.bootstrapEntryURL), files.get('index.html'));
  assert.equal(release.cacheKeyPrefix, '__pheisiraetha_release_cache__/' + release.releaseDigest + '/');
  assert.equal(release.sealURL, release.cacheKeyPrefix + 'complete');
  const emittedAppURL = 'release-assets/app.' + inventory.provenance.emittedAppSha256 + '.js';
  const emittedApp = assets.get(emittedAppURL);
  assert.equal(sha256(emittedApp), inventory.provenance.emittedAppSha256);
  assert.equal(flag(emittedApp), inventory.provenance.emittedFlag === 'ON' ? ON : OFF);
  assert.equal(inventory.provenance.emittedFlag, inventory.proposal.activeMode);
  const selectedHTML = release.entry.toString('utf8');
  assert.ok(selectedHTML.includes('<script src="' + emittedAppURL + '" integrity="' +
    integrity(emittedApp) + '" crossorigin="anonymous"></script>'));
  assert.ok(selectedHTML.indexOf('<script src="' + ARTIFACT + '"') >= 0);
  assert.ok(selectedHTML.indexOf('<script src="' + ARTIFACT + '"') <
    selectedHTML.indexOf('<script src="' + emittedAppURL + '"'));
  const bootstrapAppURL = inventory.proposal.bootstrapAppURL;
  assert.equal(sha256(assets.get(bootstrapAppURL)), inventory.provenance.sourceAppSha256);
  assert.equal(flag(assets.get(bootstrapAppURL)), OFF);
  assert.equal(inventory.proposal.activeMode, inventory.scope === 'STAGED_ON_RELEASE_PROPOSAL' ? 'ON' : 'OFF');
  return release;
}
// Pure assembly. mode selects static staged bytes; it creates no product runtime toggle.
function createStagedRelease(inputs, {generation, mode = 'OFF'} = {}) {
  assert.ok(mode === 'OFF' || mode === 'ON', 'Staging mode must be OFF or ON');
  const off = assemble({...inputs, generation, privateFixture: false});
  const bootstrapAppURL = assertBootstrap(inputs, off);
  const candidate = mode === 'ON' ? enabledCandidate(inputs) : inputs.candidate;
  const selected = mode === 'ON'
    ? assemble({...inputs, candidate, generation, privateFixture: true})
    : off;

  const files = new Map(selected.files), assets = new Map(selected.assets);
  // The ON active entry also needs the immutable OFF bootstrap application and entry.
  for (const [url, bytes] of off.assets) {
    if (url === 'index.html') continue;
    if (assets.has(url)) assert.deepEqual(assets.get(url), bytes, 'Alias collision: ' + url);
    assets.set(url, bytes);
    const file = url.split('?')[0];
    if (files.has(file)) assert.deepEqual(files.get(file), bytes, 'Physical alias collision: ' + file);
    files.set(file, bytes);
  }
  // An uncontrolled document always starts with the hardened frozen S3 OFF application.
  // Existing v16 clients retain all their canonical legacy executable URLs.
  files.set('index.html', off.entry);
  assets.set('index.html', off.entry);
  for (const [file, bytes] of inputs.legacy) {
    if (file !== 'index.html') assert.deepEqual(files.get(file), bytes, 'Legacy path changed: ' + file);
  }

  const descriptors = new Map([...off.inventory.assets, ...selected.inventory.assets]
    .map(asset => [asset.url, asset]));
  const assetRecords = [...assets].map(([url, bytes]) => {
    const descriptor = descriptors.get(url);
    assert.ok(descriptor, 'Asset descriptor missing: ' + url);
    return {url, sha256: sha256(bytes), sizeBytes: bytes.length, mime: descriptor.mime};
  }).sort((a, b) => a.url < b.url ? -1 : a.url > b.url ? 1 : 0);
  const inventory = {
    ...selected.inventory,
    scope: mode === 'ON' ? 'STAGED_ON_RELEASE_PROPOSAL' : 'STAGED_OFF_RELEASE_PROPOSAL',
    provenance: {
      ...selected.inventory.provenance,
      proposalBuilderBlob: BUILDER_BLOB,
      bootstrapKind: 'HARDENED_S3_OFF',
      bootstrapEntrySha256: sha256(off.entry),
      bootstrapAppSha256: inputs.sourceAppSha256,
      emittedAppSha256: sha256(candidate.get('app.js')),
      emittedFlag: mode,
      fixtureFlag: null
    },
    proposal: {
      format: 'pheisiraetha-public-release-proposal-v1',
      delivery: 'STAGED_NOT_DEPLOYED',
      bootstrapURL: 'index.html',
      bootstrapEntryURL: off.entryURL,
      bootstrapAppURL,
      activeMode: mode
    },
    assets: assetRecords
  };
  const release = finishProposal({files, assets, entry: selected.entry,
    entryURL: selected.entryURL, inventory, workerTemplate: selected.workerTemplate});
  release.bootstrap = files.get('index.html');
  release.bootstrapAppURL = bootstrapAppURL;
  return verifyStagedRelease(release);
}

function createStagedPair(inputs, {offGeneration, onGeneration} = {}) {
  assert.notEqual(offGeneration, onGeneration, 'Each proposal needs a distinct explicit generation');
  const pair = {
    off: createStagedRelease(inputs, {generation: offGeneration, mode: 'OFF'}),
    on: createStagedRelease(inputs, {generation: onGeneration, mode: 'ON'})
  };
  assert.deepEqual(pair.off.bootstrap, pair.on.bootstrap, 'Both proposals need the same hardened OFF bootstrap');
  assert.equal(pair.off.bootstrapAppURL, pair.on.bootstrapAppURL);
  assert.deepEqual(pair.off.assets.get(ARTIFACT), pair.on.assets.get(ARTIFACT));
  assert.notEqual(pair.off.releaseDigest, pair.on.releaseDigest);
  assert.notEqual(pair.off.entryURL, pair.on.entryURL);
  return pair;
}

// Roll back the whole prior proposal, including its OFF bootstrap and exact aliases.
// Only generation/inventory/worker metadata are regenerated; no source is recompiled.
function rollbackStagedRelease(previous, generation) {
  verifyStagedRelease(previous);
  const restored = rollbackRelease(previous, generation);
  restored.bootstrap = restored.files.get('index.html');
  restored.bootstrapAppURL = restored.inventory.proposal.bootstrapAppURL;
  assert.deepEqual(restored.bootstrap, previous.bootstrap);
  assert.equal(restored.entryURL, previous.entryURL);
  assert.deepEqual([...restored.assets], [...previous.assets]);
  assert.notEqual(restored.releaseDigest, previous.releaseDigest);
  assert.notEqual(restored.cacheName, previous.cacheName);
  return verifyStagedRelease(restored);
}

// Use these entry points for real checkout preparation: readInputs verifies a clean
// physical frozen S3 tree and the exact legacy main, before any pure assembly.
function physicalInputs(root = ROOT) {
  root = fs.realpathSync(root);
  const builderBytes = fs.readFileSync(path.join(root, 'release/build.cjs'));
  const builderBlob = createHash('sha1')
    .update(Buffer.from('blob ' + builderBytes.length + '\0')).update(builderBytes).digest('hex');
  assert.equal(builderBlob, BUILDER_BLOB, 'Qualified physical builder must remain unchanged');
  const workerBytes = fs.readFileSync(path.join(root, 'release/worker-template.js'));
  const workerBlob = createHash('sha1')
    .update(Buffer.from('blob ' + workerBytes.length + '\0')).update(workerBytes).digest('hex');
  assert.equal(workerBlob, WORKER_BLOB, 'Qualified physical worker must remain unchanged');
  return readInputs(root);
}
function prepareStagedRelease(root, options) {
  return createStagedRelease(physicalInputs(root), options);
}
function prepareStagedPair(root, options) {
  return createStagedPair(physicalInputs(root), options);
}

function describeProposal(release) {
  verifyStagedRelease(release);
  const {inventory} = release;
  return {
    generation: inventory.generation,
    scope: inventory.scope,
    releaseDigest: release.releaseDigest,
    cacheName: release.cacheName,
    workerSha256: sha256(release.worker),
    workerTemplateSha256: inventory.workerTemplateSha256,
    inventoryFileSha256: sha256(release.files.get('release-inventory.json')),
    entryURL: release.entryURL,
    entrySha256: sha256(release.entry),
    bootstrapURL: 'index.html',
    bootstrapSha256: sha256(release.files.get('index.html')),
    bootstrapAppURL: inventory.proposal.bootstrapAppURL,
    bootstrapAppSha256: inventory.provenance.bootstrapAppSha256,
    sourceFlag: inventory.provenance.sourceFlag,
    bootstrapFlag: 'OFF',
    activeMode: inventory.proposal.activeMode,
    emittedAppSha256: inventory.provenance.emittedAppSha256,
    exactArtifact: {file: ARTIFACT, sha256: ARTIFACT_SHA, sizeBytes: release.assets.get(ARTIFACT).length},
    provenance: inventory.provenance,
    files: [...release.files].map(([file, bytes]) => ({
      file, sha256: sha256(bytes), sizeBytes: bytes.length
    })).sort((a, b) => a.file < b.file ? -1 : a.file > b.file ? 1 : 0)
  };
}

function checkoutCommit(root) {
  const env = {...process.env};
  for (const key of Object.keys(env)) if (key.startsWith('GIT_') || key === 'NODE_OPTIONS') delete env[key];
  return execFileSync('git', ['--no-optional-locks', '-c', 'core.fsmonitor=false',
    '-C', root, 'rev-parse', 'HEAD'], {
    env: {...env, GIT_NO_REPLACE_OBJECTS: '1', GIT_OPTIONAL_LOCKS: '0'}
  }).toString('utf8').trim();
}
function writeFiles(out, files) {
  fs.mkdirSync(out);
  for (const [file, bytes] of files) {
    const destination = path.resolve(out, file), inside = path.relative(out, destination);
    assert.ok(inside && inside !== '..' && !inside.startsWith('..' + path.sep) &&
      !path.isAbsolute(inside), 'Output leaf must stay inside the fresh directory');
    fs.mkdirSync(path.dirname(destination), {recursive: true});
    fs.writeFileSync(destination, bytes, {flag: 'wx'});
  }
}

if (require.main === module) {
  assert.equal(process.versions.node, '24.19.0');
  assert.equal(process.argv.length, 5,
    'Usage: public-proposal.cjs <fresh-external-directory> <off-generation> <on-generation>');
  const requested = process.argv[2];
  assert.ok(path.isAbsolute(requested), 'Absolute output directory required');
  const out = path.join(fs.realpathSync(path.dirname(requested)), path.basename(requested));
  const root = fs.realpathSync(ROOT), relative = path.relative(root, out);
  assert.ok(relative === '..' || relative.startsWith('..' + path.sep) || path.isAbsolute(relative),
    'Output must be outside the checkout');
  assert.ok(!fs.existsSync(out), 'Output must not already exist');
  const pair = prepareStagedPair(root, {
    offGeneration: process.argv[3], onGeneration: process.argv[4]
  });
  const evidence = {
    format: 'pheisiraetha-staged-public-proposal-evidence-v1',
    status: 'STAGED_UNQUALIFIED',
    sourceCommit: checkoutCommit(root),
    integrationCommit: SOURCE,
    qualifiedBuilderBlob: BUILDER_BLOB,
    proposalModuleSha256: sha256(fs.readFileSync(__filename)),
    expectedMountPath: '/pheisiraetha-app/',
    deploymentPerformed: false,
    off: describeProposal(pair.off),
    on: describeProposal(pair.on)
  };
  fs.mkdirSync(out);
  writeFiles(path.join(out, 'off'), pair.off.files);
  writeFiles(path.join(out, 'on'), pair.on.files);
  fs.writeFileSync(path.join(out, 'proposal-evidence.json'),
    JSON.stringify(evidence, null, 2) + '\n', {flag: 'wx'});
  console.log(JSON.stringify({status: evidence.status, sourceCommit: evidence.sourceCommit,
    offDigest: pair.off.releaseDigest, onDigest: pair.on.releaseDigest, outputDirectory: out}));
}

module.exports = {createStagedRelease, createStagedPair, rollbackStagedRelease,
  prepareStagedRelease, prepareStagedPair, verifyStagedRelease, describeProposal};
