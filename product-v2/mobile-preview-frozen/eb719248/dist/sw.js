'use strict';
const ASSETS=[{"path":"app.css","sha256":"95d12899a06bc778f9421bf90b207c05454a588321907f1dfbebab6fdefcfab9","bytes":12767,"type":"text/css"},{"path":"app.js","sha256":"a12b7147004228d1906a412126429fa8de9637a9ed88f4e8dc33a0ee1de2ebf0","bytes":43891,"type":"text/javascript"},{"path":"foundation.mjs","sha256":"eb33bd8c39ed94a52d4fbeb2196d1fa6f5c44771d5307b73906c260c023e0de8","bytes":26284,"type":"text/javascript"},{"path":"icon-192.png","sha256":"f46acccdbfbd3a2cfe856465d56867dd6c94288e059fdfd3cb1897e7067356bf","bytes":36361,"type":"image/png"},{"path":"icon-512.png","sha256":"b93cd8d5f742f07b22de6ed6ee503edd6fcfbf2c8897b7402d72f82062990788","bytes":204172,"type":"image/png"},{"path":"index.html","sha256":"b3c63e4314b6dae643efc6296230ba5f55d289acc86f36e7f8ca3f8547bb6d0a","bytes":1072,"type":"text/html"},{"path":"manifest.webmanifest","sha256":"762dbdb5ee2449b6d7db7a33227c74a027eff918d05343875967d9813d12bd76","bytes":398,"type":"application/manifest+json"},{"path":"preview-store.mjs","sha256":"606643f08266468cf48c949ebecc768d86f29e09c7a9f9206a2d33a8c3512eff","bytes":25235,"type":"text/javascript"},{"path":"register-sw.js","sha256":"f3d584fd1df88df6b4bf4b6b7075fd9f3d0a8d4560aea30cee3ee9a075538bc7","bytes":268,"type":"text/javascript"}];
const DIGEST="c31387f2ae30830ee8668a788c989fbdf3c35132b0dbb2089dbbc0e6ee599991";
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
