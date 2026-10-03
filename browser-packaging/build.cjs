'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const esbuild = require('esbuild');

const ROOT = path.resolve(__dirname, '..');
const SPEC_COMMIT = '87c4e91c23d1c59bd4735d7fd75c41f35c533797';
const PRODUCTION_COMMIT = '255a5d9d27461dcacaebc1bc80ab322dd54b4de8';
const ESBUILD_VERSION = '0.25.5';
const INPUTS = Object.freeze([
  Object.freeze({ file: 'analysis.js', commit: '94b112488e576e08495443d93c048a528c39aac7',
    blob: 'cc6c515dd86cd957d2f199d064372ef6817deb7e',
    sha256: 'a712af8fa74a8992e49972f9b217f268da444bcb062fa91824aee7cd9bbdf5da' }),
  Object.freeze({ file: 'safety.js', commit: '74b77f0b821a93e1910e40f5c29c459c126e6d42',
    blob: 'e70d5d5a411d1f47e59ee2203a211cb2b7d15df5',
    sha256: 'ad6f6d57665c23fc87b49c1342e0a88ca32e4f77ceb2bb5377a21c043c177b70' })
]);
// Explicit output-affecting options. absWorkingDir is an isolated temporary
// directory; all entry/import/output names and emitted comments are relative.
// No globalName, environment substitution, banner, footer or custom plugin.
const PROFILE = Object.freeze({
  entryPoints: ['entry.cjs'], outfile: 'analytics-v1.js',
  bundle: true, platform: 'browser', format: 'iife',
  minify: false, treeShaking: false, plugins: [],
  target: ['es2022'], charset: 'utf8', legalComments: 'inline',
  sourcemap: false, sourcesContent: false, splitting: false,
  keepNames: false, external: [], define: {}, inject: [],
  write: false, metafile: true, logLevel: 'silent'
});
const sha256 = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const git = (...args) => execFileSync('git', ['-C', ROOT, ...args], { maxBuffer: 16 * 1024 * 1024 });

function sourceBlobs() {
  return INPUTS.map(input => {
    assert.equal(git('rev-parse', `${input.commit}:${input.file}`).toString().trim(), input.blob);
    const bytes = git('cat-file', 'blob', input.blob);
    assert.equal(sha256(bytes), input.sha256, `${input.file}: frozen hash mismatch`);
    return { ...input, bytes };
  });
}

function materialize(stage, entryBytes) {
  fs.mkdirSync(path.join(stage, 'frozen'));
  const sources = sourceBlobs();
  for (const input of sources) fs.writeFileSync(path.join(stage, 'frozen', input.file), input.bytes);
  fs.writeFileSync(path.join(stage, 'entry.cjs'), entryBytes);
  return sources;
}

function assertSourcesUnchanged(stage, sources) {
  for (const input of sources) {
    assert.deepEqual(fs.readFileSync(path.join(stage, 'frozen', input.file)), input.bytes,
      `${input.file}: bundling must not mutate source bytes`);
  }
  assert.deepEqual(sourceBlobs().map(s => s.bytes), sources.map(s => s.bytes));
}

async function compile(entryBytes = fs.readFileSync(path.join(__dirname, 'entry.cjs'))) {
  assert.equal(esbuild.version, ESBUILD_VERSION, 'wrong esbuild version');
  assert.equal(process.versions.node, '24.19.0', 'use the recorded Node toolchain');
  const stage = fs.mkdtempSync(path.join(os.tmpdir(), 'pheisiraetha-packaging-'));
  try {
    const sources = materialize(stage, entryBytes);
    const result = await esbuild.build({ ...PROFILE, absWorkingDir: stage });
    assert.deepEqual(result.warnings, []);
    assert.deepEqual(Object.keys(result.metafile.inputs).sort(), ['entry.cjs', 'frozen/analysis.js', 'frozen/safety.js']);
    const imports = result.metafile.inputs['frozen/safety.js'].imports;
    assert.deepEqual(imports, [{ path: 'frozen/analysis.js', kind: 'require-call', original: './analysis.js' }],
      'Safety must resolve its literal require to the same exact frozen Analysis module');
    assert.deepEqual(result.metafile.inputs['frozen/analysis.js'].imports, []);
    for (const input of Object.values(result.metafile.inputs)) {
      assert.ok(input.imports.every(i => !i.external), 'no external or runtime dependency');
    }
    assert.equal(result.outputFiles.length, 1);
    assert.deepEqual(result.metafile.outputs['analytics-v1.js'].imports, []);
    assertSourcesUnchanged(stage, sources);
    const bytes = Buffer.from(result.outputFiles[0].contents);
    return { bytes, hash: sha256(bytes), entryHash: sha256(entryBytes) };
  } finally {
    fs.rmSync(stage, { recursive: true, force: true });
  }
}

async function build() {
  const result = await compile();
  const lockBytes = fs.readFileSync(path.join(__dirname, 'package-lock.json'));
  const lock = JSON.parse(lockBytes);
  assert.equal(lock.packages['node_modules/esbuild'].version, ESBUILD_VERSION);
  const file = `analytics-v1.${result.hash}.js`;
  const directory = path.join(__dirname, 'artifacts');
  fs.mkdirSync(directory, { recursive: true });
  // Refuse a stale artifact set rather than deleting or silently replacing it.
  assert.ok(fs.readdirSync(directory).every(name => name === file), 'unexpected/stale artifact: review before rebuilding');
  fs.writeFileSync(path.join(directory, file), result.bytes);
  const manifest = {
    manifestVersion: 1, phase: '2B-3B-1', specCommit: SPEC_COMMIT, productionCommit: PRODUCTION_COMMIT,
    commands: {
      install: 'npm ci --prefix browser-packaging --ignore-scripts --no-audit --no-fund',
      build: 'npm run build --prefix browser-packaging',
      verify: 'npm run verify --prefix browser-packaging'
    },
    toolchain: { node: '24.19.0', npm: '11.9.0', esbuild: ESBUILD_VERSION,
      esbuildPackageIntegrity: lock.packages['node_modules/esbuild'].integrity,
      lockfileSha256: sha256(lockBytes) },
    profile: PROFILE, inputs: INPUTS,
    resolution: { importer: 'frozen/safety.js', specifier: './analysis.js', resolved: 'frozen/analysis.js',
      analysisModuleCount: 1, externalImports: [] },
    entry: { file: 'browser-packaging/entry.cjs', sha256: result.entryHash },
    output: { file: `browser-packaging/artifacts/${file}`, sha256: result.hash, sizeBytes: result.bytes.length },
    exposure: 'private IIFE; no global exports or evaluate facade; no production analytics runtime'
  };
  fs.writeFileSync(path.join(__dirname, 'build-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  console.log(JSON.stringify({ artifact: manifest.output.file, sha256: result.hash, entrySha256: result.entryHash }));
  return manifest;
}

module.exports = { ROOT, SPEC_COMMIT, PRODUCTION_COMMIT, ESBUILD_VERSION, INPUTS, PROFILE,
  sha256, git, sourceBlobs, materialize, assertSourcesUnchanged, compile, build };
if (require.main === module) build().catch(error => { console.error(error); process.exitCode = 1; });
