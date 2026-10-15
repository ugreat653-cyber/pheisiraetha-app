'use strict';
const fs = require('node:fs');
const path = require('node:path');
const {createHash} = require('node:crypto');
const root = __dirname, dist = path.join(root, 'dist');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const expectedFoundation = fs.readFileSync(path.join(root, '..', 'source', 'product-v2', 'storage.mjs'));
if (!fs.readFileSync(path.join(dist, 'foundation.mjs')).equals(expectedFoundation)) throw Error('Foundation bytes differ');
for (const name of ['index.html', 'app.js', 'app.css', 'preview-store.mjs', 'register-sw.js', 'manifest.webmanifest']) {
  const text = fs.readFileSync(path.join(dist, name), 'utf8');
  if (/ugreat653-cyber\.github\.io|PHEISIRAETHA_ANALYTICS_V1|analytics-v1\./.test(text)) throw Error('Production/analytics reference: '+name);
}
const mime = {'.html':'text/html', '.js':'text/javascript', '.mjs':'text/javascript', '.css':'text/css', '.webmanifest':'application/manifest+json', '.png':'image/png'};
const assets = fs.readdirSync(dist).filter(name => name !== 'sw.js').sort().map(name => {
  if (!mime[path.extname(name)] || !fs.statSync(path.join(dist,name)).isFile()) throw Error('Unexpected public asset: '+name);
  const bytes = fs.readFileSync(path.join(dist,name));
  return {path:name,sha256:sha(bytes),bytes:bytes.length,type:mime[path.extname(name)]};
});
const digest = sha(Buffer.from(JSON.stringify(assets)));
const worker = `'use strict';
const ASSETS=${JSON.stringify(assets)};
const DIGEST=${JSON.stringify(digest)};
const CACHE='pheisi-mobile-preview-'+DIGEST;
const assetURL=asset=>new URL(asset.path,self.registration.scope).href;
async function verified(asset){
  const response=await fetch(assetURL(asset),{cache:'reload',credentials:'same-origin'});
  if(!response.ok||response.redirected||response.type==='opaque')throw Error('Preview asset unavailable');
  const bytes=await response.arrayBuffer();
  const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),x=>x.toString(16).padStart(2,'0')).join('');
  if(bytes.byteLength!==asset.bytes||hash!==asset.sha256)throw Error('Preview asset integrity');
  return new Response(bytes,{status:200,headers:{'content-type':asset.type}});
}
self.addEventListener('install',event=>event.waitUntil((async()=>{
  const cache=await caches.open(CACHE);
  for(const asset of ASSETS)await cache.put(assetURL(asset),await verified(asset));
  await cache.put(new URL('__preview_complete',self.registration.scope).href,new Response(DIGEST));
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  const cache=await caches.open(CACHE),seal=await cache.match(new URL('__preview_complete',self.registration.scope).href);
  if(!seal||(await seal.text())!==DIGEST)throw Error('Incomplete preview cache');
})()));
self.addEventListener('fetch',event=>{
  const request=event.request,url=new URL(request.url);
  if(request.method!=='GET'||url.origin!==self.location.origin)return;
  const asset=request.mode==='navigate'?ASSETS.find(a=>a.path==='index.html'):ASSETS.find(a=>assetURL(a)===url.href);
  if(!asset)return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE),response=await cache.match(assetURL(asset));
    if(response)return response;
    try{return await verified(asset);}catch{return new Response('Preview shell unavailable offline',{status:503,headers:{'content-type':'text/plain; charset=utf-8'}});}
  })());
});
`;
fs.writeFileSync(path.join(dist,'sw.js'),worker);
fs.writeFileSync(path.join(root,'preview-build.json'),JSON.stringify({scope:'SEPARATE_MOBILE_PREVIEW',digest,foundationSha256:sha(expectedFoundation),assets,analyticsEnabled:false,productionModified:false},null,2)+'\n');
console.log(JSON.stringify({status:'PASS',digest,assets:assets.length,foundationUnchanged:true,analyticsEnabled:false}));