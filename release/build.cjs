'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { createHash } = require('node:crypto');
const ROOT = path.resolve(__dirname, '..');
const SOURCE = '7e583ac695be2b213d25591deab430664e682988';
const LEGACY = '255a5d9d27461dcacaebc1bc80ab322dd54b4de8';
const APP_BLOB = '23a293db0bad74bbf565ae7780ba6ab249ca0a95';
const ARTIFACT_SHA = 'f1f975900faaa64649bcef42412c1856543c8716711d4119df9b964f4bf8c824';
const ARTIFACT = `browser-packaging/artifacts/analytics-v1.${ARTIFACT_SHA}.js`;
const PIN = '/*__RELEASE_CONFIG__*/null';
const LEGACY_URLS = ['index.html','app.css','launch.js','app.js','locales.js',
  'manifest.webmanifest?v=07','launch-screen.jpg?v=15','icon-192.png?v=07',
  'icon-512.png?v=07','icon-maskable-192.png?v=07','icon-maskable-512.png?v=07'];
const MEDIA = LEGACY_URLS.slice(5).map(url => url.split('?')[0]);
function sha256(bytes) { return createHash('sha256').update(bytes).digest('hex'); }
function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}
function git(root,args) {
  const env={...process.env};
  for(const key of Object.keys(env)) if(key.startsWith('GIT_')||key==='NODE_OPTIONS') delete env[key];
  return execFileSync('git',['--no-optional-locks','-c','core.fsmonitor=false','-C',root,...args],
    {env:{...env,GIT_NO_REPLACE_OBJECTS:'1',GIT_OPTIONAL_LOCKS:'0'},maxBuffer:64*1024*1024});
}
function tree(root,ref) {
  return new Map(git(root,['ls-tree','-r','-z',ref]).toString('utf8').split('\0').filter(Boolean).map(line=>{
    const at=line.indexOf('\t'); return [line.slice(at+1),line.slice(0,at)];
  }));
}
function readInputs(root=ROOT) {
  root=fs.realpathSync(root);
  assert.equal(git(root,['status','--porcelain']).toString('utf8'),'','Clean candidate checkout required');
  assert.equal(git(root,['rev-parse','refs/remotes/origin/main']).toString('utf8').trim(),LEGACY);
  assert.equal(git(root,['rev-parse',`${SOURCE}:app.js`]).toString('utf8').trim(),APP_BLOB);
  const baseline=tree(root,SOURCE),current=tree(root,'HEAD'),identities=[];
  for(const [file,identity] of baseline) {
    assert.equal(current.get(file),identity,`Frozen Git identity: ${file}`);
    const [mode,type,blob]=identity.split(' ');
    assert.equal(type,'blob'); assert.ok(['100644','100755'].includes(mode));
    const absolute=path.join(root,file),stat=fs.lstatSync(absolute);
    assert.ok(stat.isFile()&&!stat.isSymbolicLink(),file);
    assert.equal(Boolean(stat.mode&0o111),mode==='100755',file);
    const expected=git(root,['cat-file','blob',blob]);
    assert.deepEqual(fs.readFileSync(absolute),expected,file);
    identities.push({file,mode,blob,sha256:sha256(expected)});
  }
  for(const file of current.keys()) if(!baseline.has(file)) assert.ok(
    file.startsWith('release/')||file.startsWith('docs/phase2b-4/')||file.startsWith('.github/workflows/'),`Out-of-scope addition: ${file}`);
  const read=(ref,file)=>git(root,['show',`${ref}:${file}`]);
  const physical=[...new Set(LEGACY_URLS.map(url=>url.split('?')[0]))];
  const legacy=new Map(physical.map(file=>[file,read(LEGACY,file)]));
  const candidate=new Map(physical.map(file=>[file,read(SOURCE,file)]));
  candidate.set(ARTIFACT,read(SOURCE,ARTIFACT));
  const legacyWorker=read(LEGACY,'sw.js').toString('utf8');
  assert.ok(legacyWorker.includes("const CACHE='pheisiraetha-v16'"));
  const workerTemplate=fs.readFileSync(path.join(root,'release/worker-template.js'));
  assert.deepEqual(workerTemplate,read('HEAD','release/worker-template.js'));
  return {legacy,candidate,workerTemplate,
    buildManifestBytes:read(SOURCE,'browser-packaging/build-manifest.json'),entryBytes:read(SOURCE,'browser-packaging/entry.cjs'),
    sourceAppSha256:sha256(candidate.get('app.js')),frozenSourceTreeSha256:sha256(canonical(identities)),legacyWorkerSha256:sha256(Buffer.from(legacyWorker))};
}
function mime(url) {
  return ({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8',
    '.webmanifest':'application/manifest+json; charset=utf-8','.png':'image/png','.jpg':'image/jpeg'})[path.posix.extname(url.split('?')[0])]||'application/octet-stream';
}
function replaceOnce(text,from,to) { assert.equal(text.split(from).length,2,`Unique replacement: ${from}`); return text.replace(from,to); }
function finish({files,assets,entry,entryURL,inventory,workerTemplate}) {
  const releaseDigest=sha256(canonical(inventory));
  const cacheName=`pheisiraetha-release-${inventory.generation}-${releaseDigest}`;
  const cacheKeyPrefix=`__pheisiraetha_release_cache__/${releaseDigest}/`;
  const sealURL=`${cacheKeyPrefix}complete`;
  const config={inventory,releaseDigest,cacheName};
  const template=workerTemplate.toString('utf8');
  assert.equal(template.split(PIN).length,2,'Unique worker configuration pin');
  const worker=Buffer.from(template.replace(PIN,JSON.stringify(config)));
  files.set('sw.js',worker);
  files.set('release-inventory.json',Buffer.from(`${JSON.stringify({releaseDigest,inventory},null,2)}\n`));
  return {files,assets,entry,entryURL,inventory,releaseDigest,cacheName,worker,workerTemplate,cacheKeyPrefix,sealURL,
    cacheKey:url=>`${cacheKeyPrefix}${encodeURIComponent(url)}`};
}
function assemble({legacy,candidate,workerTemplate,buildManifestBytes,entryBytes,sourceAppSha256,
  frozenSourceTreeSha256,legacyWorkerSha256,generation,privateFixture=false}) {
  assert.match(generation,/^(offline-candidate|rollback)-[0-9]{2,}$/); assert.equal(typeof privateFixture,'boolean');
  const artifact=candidate.get(ARTIFACT);
  assert.equal(sha256(artifact),ARTIFACT_SHA); assert.equal(artifact.length,243504);
  const manifest=JSON.parse(buildManifestBytes);
  assert.equal(manifest.output.file,ARTIFACT); assert.equal(manifest.output.sha256,ARTIFACT_SHA);
  assert.equal(manifest.output.sizeBytes,artifact.length); assert.equal(manifest.entry.sha256,sha256(entryBytes));
  const app=candidate.get('app.js');
  const flags=app.toString('utf8').match(/const ANALYTICS_ENABLED = (?:false|true);/g)||[];
  assert.equal(flags.length,1);
  if(!privateFixture) { assert.equal(flags[0],'const ANALYTICS_ENABLED = false;'); assert.equal(sha256(app),sourceAppSha256); }
  for(const file of MEDIA) assert.deepEqual(candidate.get(file),legacy.get(file),`Canonical manifest/media must preserve legacy identity: ${file}`);
  assert.ok(!/url\s*\(/i.test(candidate.get('app.css').toString('utf8')),'Relative CSS resources require an explicit release design');
  const files=new Map(legacy),assets=new Map();
  for(const url of LEGACY_URLS) assets.set(url,legacy.get(url.split('?')[0]));

  const bootstrapIntegrity=bytes=>`sha256-${createHash('sha256').update(bytes).digest('base64')}`;
  const legacyScript=file=>`<script src="${file}" integrity="${bootstrapIntegrity(legacy.get(file))}" crossorigin="anonymous"></script>`;
  let bootstrap=legacy.get('index.html').toString('utf8');
  bootstrap=replaceOnce(bootstrap,'<link rel="stylesheet" href="app.css" />',`<link rel="stylesheet" href="app.css" integrity="${bootstrapIntegrity(legacy.get('app.css'))}" crossorigin="anonymous" />`);
  for(const file of ['launch.js','locales.js','app.js']) bootstrap=replaceOnce(bootstrap,`<script src="${file}"></script>`,legacyScript(file));
  const bootstrapBytes=Buffer.from(bootstrap);
  files.set('index.html',bootstrapBytes); assets.set('index.html',bootstrapBytes);

  const aliases=new Map();
  for(const file of ['app.css','launch.js','locales.js','app.js']) {
    const bytes=candidate.get(file),ext=path.posix.extname(file),name=file.slice(0,-ext.length);
    const url=`release-assets/${name}.${sha256(bytes)}${ext}`;
    files.set(url,bytes); assets.set(url,bytes); aliases.set(file,url);
  }
  files.set(ARTIFACT,artifact); assets.set(ARTIFACT,artifact);
  const integrity=bytes=>`sha256-${createHash('sha256').update(bytes).digest('base64')}`;
  const script=file=>{
    const url=file===ARTIFACT?ARTIFACT:aliases.get(file);
    return `<script src="${url}" integrity="${integrity(candidate.get(file))}" crossorigin="anonymous"></script>`;
  };
  let html=candidate.get('index.html').toString('utf8');
  html=replaceOnce(html,'<link rel="stylesheet" href="app.css" />',`<link rel="stylesheet" href="${aliases.get('app.css')}" integrity="${integrity(candidate.get('app.css'))}" crossorigin="anonymous" />`);
  html=replaceOnce(html,'<script src="launch.js"></script>',script('launch.js'));
  html=replaceOnce(html,'<script src="locales.js"></script>',script('locales.js'));
  html=replaceOnce(html,'<script src="app.js"></script>',`${script(ARTIFACT)}\n  ${script('app.js')}`);
  const entry=Buffer.from(html),entryURL=`release-assets/index.${sha256(entry)}.html`;
  files.set(entryURL,entry); assets.set(entryURL,entry);
  const assetRecords=[...assets].map(([url,bytes])=>({url,sha256:sha256(bytes),sizeBytes:bytes.length,mime:mime(url)})).sort((a,b)=>a.url<b.url?-1:a.url>b.url?1:0);
  const inventory={format:'pheisiraetha-offline-release-v1',generation,scope:privateFixture?'PRIVATE_TEST_FIXTURE':'PRODUCTION_DEFAULT_OFF',
    baselineCache:'pheisiraetha-v16',entryURL,workerTemplateSha256:sha256(workerTemplate),provenance:{productionCommit:LEGACY,
      integrationCommit:SOURCE,integrationAppBlob:APP_BLOB,sourceAppSha256,frozenSourceTreeSha256,legacyWorkerSha256,legacyEntrySha256:sha256(legacy.get('index.html')),bootstrapEntrySha256:sha256(bootstrapBytes),
      entrySha256:sha256(entryBytes),buildManifestSha256:sha256(buildManifestBytes),frozenInputs:manifest.inputs,
      safetyPolicy:'safety-v1',registryVersion:'safety-registry-v1',registryCommit:manifest.frozenRegistryCommit,
      dtoVersion:'pheisiraetha-render-v1',sourceFlag:'OFF',fixtureFlag:privateFixture?flags[0]:null},assets:assetRecords};
  return finish({files,assets,entry,entryURL,inventory,workerTemplate});
}
function rollbackRelease(previous,generation) {
  assert.match(generation,/^rollback-[0-9]{2,}$/); assert.notEqual(generation,previous.inventory.generation);

  assert.equal(previous.releaseDigest,sha256(canonical(previous.inventory)),'Prior inventory digest');
  assert.equal(previous.cacheName,`pheisiraetha-release-${previous.inventory.generation}-${previous.releaseDigest}`,'Prior cache identity');
  assert.equal(previous.inventory.workerTemplateSha256,sha256(previous.workerTemplate),'Prior worker template');
  const previousConfig={inventory:previous.inventory,releaseDigest:previous.releaseDigest,cacheName:previous.cacheName};
  assert.deepEqual(previous.worker,Buffer.from(previous.workerTemplate.toString('utf8').replace(PIN,JSON.stringify(previousConfig))),'Prior worker pin');
  assert.deepEqual(previous.entry,previous.assets.get(previous.entryURL),'Prior entry identity');
  const priorMetadata=JSON.parse(previous.files.get('release-inventory.json'));
  assert.equal(priorMetadata.releaseDigest,previous.releaseDigest);
  assert.deepEqual(priorMetadata.inventory,previous.inventory);

  for(const asset of previous.inventory.assets) { const bytes=previous.assets.get(asset.url); assert.equal(bytes.length,asset.sizeBytes); assert.equal(sha256(bytes),asset.sha256); assert.deepEqual(previous.files.get(asset.url.split('?')[0]),bytes); }
  return finish({files:new Map(previous.files),assets:new Map(previous.assets),entry:previous.entry,entryURL:previous.entryURL,
    workerTemplate:previous.workerTemplate,inventory:{...previous.inventory,generation}});
}
if(require.main===module) {
  assert.equal(process.versions.node,'24.19.0');
  assert.equal(process.argv.length,4,'Usage: build.cjs <external-directory> <generation>');
  const requested=process.argv[2]; assert.ok(path.isAbsolute(requested),'Absolute output directory required');
  const out=path.join(fs.realpathSync(path.dirname(requested)),path.basename(requested));
  const root=fs.realpathSync(ROOT),relative=path.relative(root,out);
  assert.ok(relative==='..'||relative.startsWith(`..${path.sep}`)||path.isAbsolute(relative),'Output must be outside the checkout');
  assert.ok(!fs.existsSync(out),'Output must not already exist');
  const release=assemble({...readInputs(root),generation:process.argv[3],privateFixture:false});
  fs.mkdirSync(out);
  for(const [file,bytes] of release.files) {
    const destination=path.resolve(out,file),inside=path.relative(out,destination);
    assert.ok(inside&&inside!=='..'&&!inside.startsWith(`..${path.sep}`)&&!path.isAbsolute(inside),'Output leaf must stay inside fresh directory');
    fs.mkdirSync(path.dirname(destination),{recursive:true}); fs.writeFileSync(destination,bytes,{flag:'wx'});
  }
  console.log(JSON.stringify({scope:release.inventory.scope,releaseDigest:release.releaseDigest,cacheName:release.cacheName,
    workerSha256:sha256(release.worker),outputDirectory:out}));
}
module.exports={readInputs,assemble,rollbackRelease,sha256,canonical};
