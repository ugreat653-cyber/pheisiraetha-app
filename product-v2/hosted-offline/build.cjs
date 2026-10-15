'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process'),assert=require('node:assert/strict');
const ROOT=path.resolve(__dirname,'../..');
cp.execFileSync(process.execPath,[path.join(ROOT,'product-v2/verify-frozen-preview.cjs')],{stdio:'inherit'});
const source=path.join(ROOT,'product-v2/mobile-preview-frozen/eb719248');
const target=path.resolve(process.argv[2]||'');
const normalizedTarget=target.toLowerCase(),normalizedRoot=ROOT.toLowerCase();
assert.ok(process.argv[2]&&normalizedTarget!==normalizedRoot&&!normalizedTarget.startsWith(normalizedRoot+path.sep),'Output must be outside the review checkout');
const manifestPath=path.join(target,'.openai/hosting.json');
const hosting=fs.existsSync(manifestPath)?JSON.parse(fs.readFileSync(manifestPath,'utf8')):{};
if(hosting.project_id)assert.equal(hosting.project_id,'appgprj_6ad1432fd3608191b240f03b8aa8d970','Only the separate approved test Site may be rebuilt');
if(fs.existsSync(target)&&fs.readdirSync(target).length)assert.ok(hosting.project_id,'Existing output requires the separate Site identity; use a fresh empty directory for local tests');
hosting.static={directory:'dist'};
const manifest=JSON.parse(fs.readFileSync(path.join(ROOT,'product-v2/frozen-preview-manifest.json'),'utf8'));
for(const row of manifest.files){
 if(row.sourcePath==='.openai/hosting.json'||row.sourcePath==='prepare-preview.cjs')continue;
 const out=path.join(target,row.sourcePath);fs.mkdirSync(path.dirname(out),{recursive:true});
 fs.copyFileSync(path.join(ROOT,row.repositoryPath),out);
}
fs.mkdirSync(path.dirname(manifestPath),{recursive:true});
fs.writeFileSync(manifestPath+'.tmp',JSON.stringify(hosting,null,2)+'\n');fs.renameSync(manifestPath+'.tmp',manifestPath);
let builder=fs.readFileSync(path.join(source,'build-preview.cjs'),'utf8');
function replaceOnce(before,after){assert.equal(builder.split(before).length,2,'Patch anchor must occur exactly once: '+before.slice(0,60));builder=builder.replace(before,after);}
replaceOnce("const CACHE='pheisi-mobile-preview-'+DIGEST;",`const SHELL_BASE64=\${JSON.stringify(fs.readFileSync(path.join(dist,'index.html')).toString('base64'))};
const POLICY='embedded-shell-v1';
const SHELL=ASSETS.find(asset=>asset.path==='index.html');
const CACHE='pheisi-mobile-preview-'+POLICY+'-'+DIGEST;
const SEAL=POLICY+':'+DIGEST;`);
replaceOnce(`  const response=await fetch(assetURL(asset),{cache:'reload',credentials:'same-origin'});
  if(!response.ok||response.redirected||response.type==='opaque')throw Error('Preview asset unavailable');
  const bytes=await response.arrayBuffer();`,`  let bytes;
  if(asset===SHELL){
    bytes=Uint8Array.from(atob(SHELL_BASE64),character=>character.charCodeAt(0)).buffer;
  }else{
    const response=await fetch(assetURL(asset),{cache:'reload',credentials:'same-origin'});
    if(!response.ok||response.redirected||response.type==='opaque')throw Error('Preview asset unavailable');
    bytes=await response.arrayBuffer();
  }`);
replaceOnce('new Response(DIGEST)','new Response(SEAL)');
replaceOnce("(await seal.text())!==DIGEST","(await seal.text())!==SEAL");
replaceOnce("  const asset=request.mode==='navigate'?ASSETS.find(a=>a.path==='index.html'):ASSETS.find(a=>assetURL(a)===url.href);",`  const root=new URL('./',self.registration.scope),index=new URL('index.html',self.registration.scope);
  const navigation=request.mode==='navigate';
  if(navigation&&(url.search||![root.pathname,index.pathname].includes(url.pathname)))return;
  const asset=navigation?SHELL:ASSETS.find(a=>assetURL(a)===url.href);`);
replaceOnce("scope:'SEPARATE_MOBILE_PREVIEW',digest","scope:'SEPARATE_HOSTED_OFFLINE_PREVIEW',offlinePolicy:'embedded-shell-v1',workerSha256:sha(Buffer.from(worker)),digest");
fs.writeFileSync(path.join(target,'build-preview.cjs'),builder);
const foundation=fs.readFileSync(path.join(ROOT,'product-v2/storage.mjs'));
const foundationTarget=path.resolve(target,'../source/product-v2/storage.mjs');
if(fs.existsSync(foundationTarget))assert.ok(fs.readFileSync(foundationTarget).equals(foundation),'Existing sibling foundation differs');
else{fs.mkdirSync(path.dirname(foundationTarget),{recursive:true});fs.writeFileSync(foundationTarget,foundation);}
cp.execFileSync(process.execPath,[path.join(target,'build-preview.cjs')],{stdio:'inherit'});
for(const row of manifest.files.filter(x=>x.sourcePath.startsWith('dist/')&&x.sourcePath!=='dist/sw.js')){
 assert.ok(fs.readFileSync(path.join(target,row.sourcePath)).equals(fs.readFileSync(path.join(ROOT,row.repositoryPath))),'UX/domain asset changed: '+row.sourcePath);
}
const receipt=JSON.parse(fs.readFileSync(path.join(target,'preview-build.json'),'utf8'));
assert.equal(receipt.digest,manifest.previewDigest);assert.equal(receipt.foundationSha256,manifest.foundationSha256);
console.log(JSON.stringify({status:'PASS',policy:receipt.offlinePolicy,workerSha256:receipt.workerSha256,originalAssetsUnchanged:9,target}));
