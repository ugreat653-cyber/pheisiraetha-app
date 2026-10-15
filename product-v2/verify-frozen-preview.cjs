'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const ROOT=path.resolve(__dirname,'..');
const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'frozen-preview-manifest.json'),'utf8'));
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
assert.equal(manifest.sourceCommit,'eb719248edad30f9290dab8fe4bd6b9a199f60d2');
assert.equal(manifest.sourceTree,'bd0910ed7201a586936d21c0ebfe02d532964c8f');
assert.equal(manifest.files.length,19);
assert.equal(hash(Buffer.from(JSON.stringify(manifest.files))), '0ce800f86fb0d6001a7d66de255770c9502ecc8395a03452b84172d7f0ac8116');
const seen=new Set();
for(const row of manifest.files){
 assert.ok(!seen.has(row.repositoryPath));seen.add(row.repositoryPath);
 const bytes=fs.readFileSync(path.join(ROOT,row.repositoryPath));
 assert.equal(bytes.length,row.bytes,row.sourcePath);
 assert.equal(hash(bytes),row.sha256,row.sourcePath);
 assert.equal(crypto.createHash('sha1').update(Buffer.from('blob '+bytes.length+'\0')).update(bytes).digest('hex'),row.gitBlob,row.sourcePath);
}
const folder=path.join(__dirname,'mobile-preview-frozen','eb719248');
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.relative(ROOT,path.join(dir,e.name)).split(path.sep).join('/')]);
assert.deepEqual(walk(folder).sort(),[...seen].sort());
assert.ok(fs.readFileSync(path.join(ROOT,'product-v2/storage.mjs')).equals(fs.readFileSync(path.join(folder,'dist/foundation.mjs'))));
if(process.argv[2]==='--stage'){
 const target=path.resolve(process.argv[3]||'');
 assert.ok(process.argv[3]&&!fs.existsSync(target),'Stage target must be a new directory');
 for(const row of manifest.files){const dest=path.join(target,row.sourcePath);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(path.join(ROOT,row.repositoryPath),dest);}
 const source=path.resolve(target,'../source/product-v2/storage.mjs');
 fs.mkdirSync(path.dirname(source),{recursive:true});fs.copyFileSync(path.join(ROOT,'product-v2/storage.mjs'),source);
}else if(process.argv[2]==='--result'){
 const r=JSON.parse(fs.readFileSync(process.argv[3],'utf8'));
 assert.equal(r.status,'PASS');assert.equal(r.passed,27);assert.equal(r.failed,0);assert.equal(r.blocked,0);assert.equal(r.selectedCaseFilter,null);
 assert.equal(r.previewDigest,manifest.previewDigest);
 assert.equal(r.foundationSha256,manifest.foundationSha256);
 assert.equal(r.results.length,27);assert.equal(r.profiles.length,3);
 const cases=['first-run-ownership-complete','autosave-reload-offline','real-file-roundtrip-invalid-atomic','320px-no-analytics','codec-cas-corruption-exactly-once','own-service-worker-offline-reload','repeat-revision-confirmation','complete-abort-quota-retry-atomic','real-file-history-draft-and-en-reload'];
 for(const p of ['desktop','samsung','iphone-webkit'])assert.deepEqual(r.results.filter(x=>x.profile===p&&x.status==='PASS').map(x=>x.name).sort(),[...cases].sort());
 assert.equal(r.physicalDeviceTests,false);
 assert.equal(process.version,'v24.19.0');
 assert.equal(require(process.env.PREVIEW_PLAYWRIGHT+'/package.json').version,'1.62.1');
 assert.equal(Object.hasOwn(r,'fatal'),false);
 assert.deepEqual(r.profiles.map(p=>p.name).sort(),['desktop','iphone-webkit','samsung']);
 assert.equal(r.browserAvailability.chromium.exists,true);assert.equal(r.browserAvailability.webkit.exists,true);
 for(const p of r.profiles){const webkit=p.name==='iphone-webkit';assert.equal(p.engine,webkit?'Pinned Playwright WebKit':'Pinned Playwright Chromium');assert.equal(p.version,webkit?'26.5':'151.0.7922.34');assert.equal(p.physicalDevice,false);assert.equal(p.emulation,p.name!=='desktop');}
 assert.equal(new Set(r.results.map(x=>x.profile+':'+x.name)).size,27);
 assert.equal(r.offlineNavigationMethods.desktop,'browserContext.setOffline(true)');
 assert.equal(r.offlineNavigationMethods.samsung,'browserContext.setOffline(true)');
 assert.equal(r.offlineNavigationMethods['iphone-webkit'],'origin socket disconnected; Playwright offline-emulation issue42775');
}
console.log(JSON.stringify({status:'PASS',files:19,sourceCommit:manifest.sourceCommit,scope:'EXACT_FROZEN_PREVIEW_FIXTURE',deploymentPerformed:false}));
