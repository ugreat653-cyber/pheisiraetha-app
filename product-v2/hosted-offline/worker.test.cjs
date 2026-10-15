'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {createHash,webcrypto}=require('node:crypto');
assert.ok(process.env.PHEISI_OFFLINE_ROOT);
const ROOT=path.resolve(process.env.PHEISI_OFFLINE_ROOT),DIST=path.join(ROOT,'dist');
const BUILD=JSON.parse(fs.readFileSync(path.join(ROOT,'preview-build.json'),'utf8'));
const SOURCE=fs.readFileSync(path.join(DIST,'sw.js'),'utf8'),BASE='https://hosted-preview.example/',POLICY='embedded-shell-v1';
const CACHE='pheisi-mobile-preview-'+POLICY+'-'+BUILD.digest,SEAL_URL=new URL('__preview_complete',BASE).href,SEAL=POLICY+':'+BUILD.digest,ASSETS=BUILD.assets;
const BYTES=new Map(ASSETS.map(a=>[a.path,fs.readFileSync(path.join(DIST,a.path))])),ASSET_URLS=ASSETS.map(a=>new URL(a.path,BASE).href).sort();
const sha=b=>createHash('sha256').update(b).digest('hex'),T=(n,fn)=>test(n,{timeout:5000},fn);
const keyOf=v=>typeof v==='string'?new URL(v,BASE).href:v.url;
function harness({source=SOURCE,fault=null,putFailureAt=0}={}){
 const listeners=new Map(),stores=new Map(),network=[];let putCount=0,forced=0;
 function cacheObject(name){if(!stores.has(name))stores.set(name,new Map());const rows=stores.get(name);return {
 async match(k){return rows.get(keyOf(k))?.clone();},
 async put(k,r){putCount++;if(putFailureAt&&putCount===putFailureAt)throw new DOMException('Synthetic quota','QuotaExceededError');rows.set(keyOf(k),r.clone());},
 async keys(){return [...rows.keys()].map(url=>new Request(url));},async delete(k){return rows.delete(keyOf(k));}};}
 const caches={async open(n){return cacheObject(n);},async keys(){return [...stores.keys()];},async delete(n){return stores.delete(n);}};
 function response(bytes,{status=200,redirected=false,type='basic',url=''}={}){const r=new Response(bytes,{status,headers:{'content-type':'application/octet-stream'}});Object.defineProperties(r,{redirected:{value:redirected},type:{value:type},url:{value:url}});return r;}
 const fetch=async(input,options)=>{const url=keyOf(input),p=new URL(url).pathname;network.push({url,options});
 if(p==='/'||p==='/index.html')return response('<html>HOSTING-INJECTION<script src="/cdn-cgi/challenge-platform/scripts/jsd/main.js"></script></html>',{redirected:p==='/index.html',url:BASE});
 const asset=ASSETS.find(a=>new URL(a.path,BASE).href===url);if(!asset)return response('Not found',{status:404,url});
 const bytes=Buffer.from(BYTES.get(asset.path));
 if(fault?.path===asset.path){if(fault.kind==='abort')throw new TypeError('Synthetic network failure');
 if(fault.kind==='corrupt'){bytes[0]^=1;return response(bytes,{url});}
 if(fault.kind==='redirect')return response(bytes,{redirected:true,url:BASE+'redirect-target'});
 if(fault.kind==='opaque')return response(bytes,{type:'opaque',url});
 if(fault.kind==='status')return response('Synthetic HTTP failure',{status:fault.status,url});
 if(fault.kind==='html')return response('<html>Sign in required</html>',{url});}
 return response(bytes,{url});};
 const sandbox={URL,Request,Response,Headers,TextEncoder,TextDecoder,Uint8Array,ArrayBuffer,atob,btoa,crypto:webcrypto,caches,fetch,console,location:{origin:new URL(BASE).origin,href:BASE+'sw.js'},registration:{scope:BASE},
 addEventListener(t,l){assert.equal(listeners.has(t),false);listeners.set(t,l);},skipWaiting(){forced++;throw Error('Forced activation forbidden');},clients:{claim(){forced++;throw Error('Forced claim forbidden');}}};
 sandbox.self=sandbox;vm.runInContext(source,vm.createContext(sandbox),{filename:'candidate-sw.js',timeout:1000});
 async function dispatch(type,extra={}){assert.ok(listeners.has(type));const waits=[];let intercepted=false,p;listeners.get(type)({...extra,waitUntil(v){waits.push(Promise.resolve(v));},respondWith(v){assert.equal(intercepted,false);intercepted=true;p=Promise.resolve(v);}});await Promise.all(waits);return {intercepted,response:intercepted?await p:undefined};}
 return {stores,network,caches,install:()=>dispatch('install'),activate:()=>dispatch('activate'),request:(url,{mode='navigate',method='GET'}={})=>dispatch('fetch',{request:{url:new URL(url,BASE).href,mode,method}}),hasSeal:()=>[...stores.values()].some(r=>r.has(SEAL_URL)),forced:()=>forced};
}
function mutateShell(fn){const m=SOURCE.match(/\bconst\s+SHELL_BASE64\s*=\s*("(?:[^"\\]|\\.)*")\s*;/);assert.ok(m);return SOURCE.replace(m[0],'const SHELL_BASE64='+JSON.stringify(fn(Buffer.from(JSON.parse(m[1]),'base64')).toString('base64'))+';');}
async function rejectedInstall(h){await assert.rejects(h.install());assert.equal(h.hasSeal(),false);await assert.rejects(h.activate());assert.equal(h.forced(),0);}
T('HOF01 pinned nine assets and worker receipt coherent',()=>{assert.equal(BUILD.offlinePolicy,POLICY);assert.equal(BUILD.digest,'c31387f2ae30830ee8668a788c989fbdf3c35132b0dbb2089dbbc0e6ee599991');assert.equal(BUILD.foundationSha256,'eb33bd8c39ed94a52d4fbeb2196d1fa6f5c44771d5307b73906c260c023e0de8');assert.equal(sha(Buffer.from(JSON.stringify(ASSETS))),BUILD.digest);assert.equal(sha(Buffer.from(SOURCE)),BUILD.workerSha256);assert.deepEqual(ASSETS.map(a=>a.path).sort(),['app.css','app.js','foundation.mjs','icon-192.png','icon-512.png','index.html','manifest.webmanifest','preview-store.mjs','register-sw.js']);for(const a of ASSETS){assert.equal(BYTES.get(a.path).length,a.bytes);assert.equal(sha(BYTES.get(a.path)),a.sha256);}});
T('HOF02 install activates exact sealed set; zero shell fetches',async()=>{const h=harness();await h.install();await h.activate();assert.deepEqual([...h.stores.keys()],[CACHE]);const rows=h.stores.get(CACHE);assert.deepEqual([...rows.keys()].sort(),[...ASSET_URLS,SEAL_URL].sort());assert.equal(await rows.get(SEAL_URL).clone().text(),SEAL);for(const a of ASSETS){const r=rows.get(new URL(a.path,BASE).href);assert.ok(Buffer.from(await r.clone().arrayBuffer()).equals(BYTES.get(a.path)));assert.ok(r.headers.get('content-type').startsWith(a.type));const cached=await h.request('/'+a.path,{mode:'cors'});assert.equal(cached.intercepted,true);assert.ok(Buffer.from(await cached.response.arrayBuffer()).equals(BYTES.get(a.path)));}assert.equal(h.network.length,8);assert.ok(h.network.every(r=>!['/','/index.html'].includes(new URL(r.url).pathname)));for(const c of h.network){assert.equal(c.options.cache,'reload');assert.equal(c.options.credentials,'same-origin');}assert.equal(h.forced(),0);});
T('HOF03 only exact root and index navigation receive verified shell',async()=>{const h=harness();await h.install();await h.activate();for(const url of ['/','/index.html']){const r=await h.request(url);assert.equal(r.intercepted,true);assert.equal(r.response.status,200);const b=Buffer.from(await r.response.arrayBuffer());assert.ok(b.equals(BYTES.get('index.html')));assert.equal(b.includes(Buffer.from('HOSTING-INJECTION')),false);assert.equal(b.includes(Buffer.from('/cdn-cgi/')),false);}assert.equal(h.network.length,8);});
T('HOF04 query platform deep foreign nonGET and nonexact routes untouched',async()=>{const h=harness();await h.install();await h.activate();for(const [u,o] of [['/?network_probe=1',{}],['/index.html?token=synthetic',{}],['/signin-with-chatgpt',{}],['/_sites/dispatch-assets/status.css',{}],['/cdn-cgi/challenge-platform/scripts/jsd/main.js',{}],['/unknown',{}],['/deep/index.html',{}],['/index.html/',{}],['https://other.example/index.html',{}],['/app.js',{method:'POST',mode:'cors'}],['/app.js?x=1',{mode:'cors'}]])assert.equal((await h.request(u,o)).intercepted,false,u);assert.equal(h.network.length,8);});
T('HOF05 one byte embedded shell corruption fails SHA without seal',async()=>{const h=harness({source:mutateShell(b=>{b[0]^=1;return b;})});await rejectedInstall(h);assert.ok(h.network.every(r=>new URL(r.url).pathname!=='/index.html'));});
T('HOF06 truncated embedded shell never seals',async()=>{await rejectedInstall(harness({source:mutateShell(b=>b.subarray(0,b.length-1))}));});
for(const a of ASSETS.filter(a=>a.path!=='index.html'))T('HOF07 corrupted asset rejected '+a.path,async()=>{await rejectedInstall(harness({fault:{path:a.path,kind:'corrupt'}}));});
for(const status of [401,403,404,500,503])T('HOF08 HTTP '+status+' never seals',async()=>{await rejectedInstall(harness({fault:{path:'app.js',kind:'status',status}}));});
T('HOF09 redirect with exact eventual bytes rejected',async()=>{await rejectedInstall(harness({fault:{path:'app.js',kind:'redirect'}}));});
T('HOF10 opaque rejected',async()=>{await rejectedInstall(harness({fault:{path:'app.js',kind:'opaque'}}));});
T('HOF11 HTTP200 auth HTML rejected',async()=>{await rejectedInstall(harness({fault:{path:'app.js',kind:'html'}}));});
T('HOF12 partial interrupted install never seals',async()=>{const h=harness({fault:{path:'app.js',kind:'abort'}});await rejectedInstall(h);assert.equal(h.stores.get(CACHE).size,1);});
for(const putFailureAt of [3,10])T('HOF13 put/quota failure '+putFailureAt+' never seals',async()=>{await rejectedInstall(harness({putFailureAt}));});
T('HOF14 legacy namespace cannot satisfy activation',async()=>{const h=harness(),old=await h.caches.open('pheisi-mobile-preview-'+BUILD.digest);await old.put(SEAL_URL,new Response(BUILD.digest));await assert.rejects(h.activate());assert.equal(await(await old.match(SEAL_URL)).text(),BUILD.digest);assert.equal(h.forced(),0);});
T('HOF15 old plain digest seal in new namespace rejected',async()=>{const h=harness(),c=await h.caches.open(CACHE);await c.put(SEAL_URL,new Response(BUILD.digest));await assert.rejects(h.activate());assert.equal(h.forced(),0);});
T('HOF16 failed candidate preserves previous cache',async()=>{const h=harness({fault:{path:'app.js',kind:'corrupt'}}),oldName='pheisi-mobile-preview-'+BUILD.digest,old=await h.caches.open(oldName);await old.put(SEAL_URL,new Response(BUILD.digest));await old.put(BASE+'app.js',new Response('PREVIOUS-VERIFIED-VERSION'));await assert.rejects(h.install());await assert.rejects(h.activate());assert.equal(await(await old.match(SEAL_URL)).text(),BUILD.digest);assert.equal(await(await old.match(BASE+'app.js')).text(),'PREVIOUS-VERIFIED-VERSION');assert.equal(h.stores.get(CACHE).has(SEAL_URL),false);assert.equal(h.forced(),0);});
T('HOF17 absent cached shell reconstructed only from verified embedded bytes',async()=>{const h=harness();await h.install();await h.activate();h.stores.get(CACHE).delete(BASE+'index.html');const r=await h.request('/');assert.equal(r.intercepted,true);assert.equal(r.response.status,200);assert.ok(Buffer.from(await r.response.arrayBuffer()).equals(BYTES.get('index.html')));assert.equal(h.network.length,8);});
