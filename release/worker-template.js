'use strict';
// Build replaces the complete configuration token; this template parses before generation.
const CONFIG = /*__RELEASE_CONFIG__*/null;
const INVENTORY=CONFIG.inventory;
const SCOPE=self.registration.scope;
const BASE=new URL(SCOPE);
const PREFIX=`__pheisiraetha_release_cache__/${CONFIG.releaseDigest}/`;
const SEAL_URL=new URL(`${PREFIX}complete`,SCOPE).href;
const SEAL_TEXT=JSON.stringify({releaseDigest:CONFIG.releaseDigest,assetCount:INVENTORY.assets.length,complete:true});
const ASSETS=new Map(INVENTORY.assets.map(asset=>[new URL(asset.url,SCOPE).href,asset]));
const ENTRY=INVENTORY.assets.find(asset=>asset.url===INVENTORY.entryURL);
function canonical(value) {
  if(Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if(value&&typeof value==='object') return `{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}
async function sha256(bytes) {
  const result=await crypto.subtle.digest('SHA-256',bytes);
  return [...new Uint8Array(result)].map(value=>value.toString(16).padStart(2,'0')).join('');
}
function key(asset) { return new URL(`${PREFIX}${encodeURIComponent(asset.url)}`,SCOPE).href; }
function response(bytes,asset) { return new Response(bytes,{status:200,headers:{'Content-Type':asset.mime,'Cache-Control':'no-store'}}); }
async function checkedBytes(value,asset) {
  if(!value||value.status!==200) throw new Error('Asset unavailable');
  const bytes=await value.arrayBuffer();
  if(bytes.byteLength!==asset.sizeBytes||await sha256(bytes)!==asset.sha256) throw new Error('Asset integrity mismatch');
  return bytes;
}
async function validateConfiguration() {
  if(!ENTRY||INVENTORY.format!=='pheisiraetha-offline-release-v1'||!/^pheisiraetha-release-/.test(CONFIG.cacheName)||
    await sha256(new TextEncoder().encode(canonical(INVENTORY)))!==CONFIG.releaseDigest||ASSETS.size!==INVENTORY.assets.length) throw new Error('Release configuration mismatch');
  for(const asset of INVENTORY.assets) {
    const url=new URL(asset.url,SCOPE);
    if(url.origin!==BASE.origin||!url.pathname.startsWith(BASE.pathname)||!/^[a-f0-9]{64}$/.test(asset.sha256)||
      !Number.isSafeInteger(asset.sizeBytes)||asset.sizeBytes<0) throw new Error('Invalid release asset');
  }
}
async function isSealed(cache) {
  const marker=await cache.match(SEAL_URL);
  return Boolean(marker&&marker.status===200&&await marker.text()===SEAL_TEXT);
}
async function installRelease() {
  await validateConfiguration();
  if((await caches.keys()).includes(CONFIG.cacheName)) throw new Error('Generation is already present; select a fresh generation');
  let created=false;
  try {
    const cache=await caches.open(CONFIG.cacheName); created=true;
    // Sequential writes leave no pending puts when failure cleanup starts.
    for(const asset of INVENTORY.assets) {
      const url=new URL(asset.url,SCOPE).href;
      const fetched=await fetch(url,{cache:'no-store',redirect:'error',credentials:'same-origin'});
      if(!fetched.ok||fetched.type==='opaque'||fetched.redirected||fetched.url!==url) throw new Error('Unexpected asset response');
      const bytes=await checkedBytes(fetched,asset);
      await cache.put(key(asset),response(bytes,asset));
    }
    await cache.put(SEAL_URL,new Response(SEAL_TEXT,{headers:{'Content-Type':'application/json','Cache-Control':'no-store'}}));
  } catch(error) { if(created) await caches.delete(CONFIG.cacheName); throw error; }
  // Keep the normal waiting phase; no skipWaiting.
}
self.addEventListener('install',event=>{event.waitUntil(installRelease());});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{
  await validateConfiguration(); const cache=await caches.open(CONFIG.cacheName);
  if(!await isSealed(cache)) throw new Error('Unsealed release');
  // Retain prior caches; no clients.claim or cross-generation deletion.
})());});
function unavailable() {return new Response('Release unavailable',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'}});}
async function serve(asset) {
  try {
    const cache=await caches.open(CONFIG.cacheName);
    if(!await isSealed(cache)) return unavailable();
    return response(await checkedBytes(await cache.match(key(asset)),asset),asset);
  } catch {return unavailable();}
}
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  if(url.origin!==BASE.origin||!url.pathname.startsWith(BASE.pathname)) return;
  if(event.request.method!=='GET') {event.respondWith(new Response('Method not allowed',{status:405}));return;}
  if(event.request.mode==='navigate') {
    const root=BASE.pathname,index=new URL('index.html',SCOPE).pathname,candidate=new URL(INVENTORY.entryURL,SCOPE).pathname;
    if(url.pathname===candidate) {event.respondWith(Response.redirect(SCOPE,302));return;}
    if(url.pathname===root||url.pathname===index) {event.respondWith(serve(ENTRY));return;}
    event.respondWith(new Response('Not found',{status:404}));return;
  }
  const asset=ASSETS.get(url.href);
  event.respondWith(asset?serve(asset):new Response('Not found',{status:404}));
});
