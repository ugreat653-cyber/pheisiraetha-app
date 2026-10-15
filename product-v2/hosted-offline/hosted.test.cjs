'use strict';
// Synthetic fresh browser contexts on the separate owner-private Sites origin.
// Credential arrives only on hidden stdin; it is never written or reported.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const ROOT=path.resolve(process.env.PHEISI_OFFLINE_ROOT||'');
assert.ok(process.env.PHEISI_OFFLINE_ROOT);
const build=JSON.parse(fs.readFileSync(path.join(ROOT,'preview-build.json'),'utf8'));
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const playwright=require(process.env.PREVIEW_PLAYWRIGHT);
assert.equal(process.version,'v24.19.0');assert.equal(require(process.env.PREVIEW_PLAYWRIGHT+'/package.json').version,'1.62.1');
const report={harnessSha256:hash(fs.readFileSync(__filename)),scope:'Actual separate Sites origin; synthetic new browser contexts; service-access authentication',physicalDeviceTests:false,results:[]};
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function until(read,accept,label,timeout=20000){let last;const end=Date.now()+timeout;while(Date.now()<end){last=await read();if(accept(last))return last;await pause(100);}throw Error(label+': '+JSON.stringify(last));}
async function state(page){return page.evaluate(async()=>{const {openPreviewStore}=await import('/preview-store.mjs');const s=await openPreviewStore();try{const records=await s.listIntentions();return {records,drafts:await Promise.all(records.map(r=>s.readDraft(r.intentKey)))};}finally{s.close();}});}
async function create(page,label,go){await page.locator('#navHome').click();await page.locator('#addIntention').click();for(const f of ['primary','success','scope','nonGoals','constraints','rationale'])await page.locator('#ris-'+f).fill('SYNTHETIC '+label+' '+f);await page.locator(go?'#risContinue':'#risLater').click();return (await until(()=>state(page),s=>s.records.some(r=>r.sourceEnvelope.intent.ris.primary==='SYNTHETIC '+label+' primary'),'RIS commit')).records.find(r=>r.sourceEnvelope.intent.ris.primary==='SYNTHETIC '+label+' primary');}
async function open(page,key){await page.locator('#navHome').click();await page.locator('[data-action="open"][data-key="'+key+'"]').click();if(await page.locator('#resumeObservation').count())await page.locator('#resumeObservation').click();else await page.locator('#newObservation').click();await page.locator('#actions').waitFor();}
async function finish(page,key){for(const id of ['desire','belief','emotionIntensity','mental','practical','hours'])await page.locator('#'+id).fill(id==='hours'?'2.5':'6');await page.locator('#emotion').selectOption({index:1});await page.locator('#frequency').selectOption('freq2');await page.locator('#nextStep').click();await page.locator('#achievement').fill('7');await page.locator('#direction').selectOption('toward');await page.locator('[name="evidence"][value="direct"]').check();for(const id of ['currentState','events','external'])await page.locator('#'+id).fill('SYNTHETIC OBSERVED '+id);await page.locator('#nextStep').click();if(await page.locator('#intentional').count())await page.locator('#intentional').selectOption('no');await page.locator('#completeObservation').click();return until(()=>state(page),s=>s.records.find(r=>r.intentKey===key)?.sourceEnvelope.intent.cycles.length===1,'Explicit offline completion');}
async function transportProxy(origin){
 const http=require('node:http'),net=require('node:net'),allowed=new URL(origin).hostname+':443';
 let offline=false,connected=0,upstreamBytes=0,forwardedAfterIsolation=0;const sockets=new Set();
 const server=http.createServer((req,res)=>{res.writeHead(502);res.end();});
 server.on('connect',(req,client,head)=>{
  client.on('error',()=>{});if(offline||req.url!==allowed){client.end('HTTP/1.1 502 Bad Gateway\r\n\r\n');return;}
  const upstream=net.connect({host:new URL(origin).hostname,port:443});sockets.add(client);sockets.add(upstream);
  const clear=()=>{client.destroy();upstream.destroy();sockets.delete(client);sockets.delete(upstream);};
  client.once('close',clear);upstream.once('close',clear);upstream.on('error',clear);
  upstream.on('data',bytes=>{if(offline)forwardedAfterIsolation+=bytes.length;else upstreamBytes+=bytes.length;});
  upstream.once('connect',()=>{if(offline){clear();return;}connected++;client.write('HTTP/1.1 200 Connection Established\r\n\r\n');if(head.length)upstream.write(head);client.pipe(upstream);upstream.pipe(client);});
 });
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
 return {server:'http://127.0.0.1:'+server.address().port,stats:()=>({connected,upstreamBytes,forwardedAfterIsolation}),
 async isolate(){offline=true;const all=[...sockets];for(const socket of all)socket.destroy();await Promise.all(all.filter(s=>!s.closed).map(s=>new Promise(r=>s.once('close',r))));},
 async close(){offline=true;for(const socket of sockets)socket.destroy();await new Promise(r=>server.close(r));}};
}
async function run(input){
 const parsed=new URL(input.url);assert.equal(parsed.protocol,'https:');const origin=parsed.origin;assert.equal(origin,'https://pheisi-v2-hosted-offline-20261015.shrewdalder64.chatgpt.site');
 const hosting=JSON.parse(fs.readFileSync(path.join(ROOT,'.openai/hosting.json'),'utf8'));assert.equal(hosting.project_id,input.projectId);assert.notEqual(input.projectId,'appgprj_6ad0ea446798819185547a04e5655bc4');
 Object.assign(report,{origin,projectId:input.projectId,sourceCommit:input.sourceCommit,deploymentId:input.deploymentId,workerSha256:build.workerSha256,offlinePolicy:build.offlinePolicy,assetDigest:build.digest});
 const headers={'OAI-Sites-Authorization':'Bearer '+input.token};
 const get=async p=>fetch(origin+p,{headers,redirect:'manual',signal:AbortSignal.timeout(20000)});
 const index=await get('/index.html');assert.equal(index.status,307);assert.equal(new URL(index.headers.get('location'),origin).href,origin+'/');
 const root=await get('/');assert.equal(root.status,200);const html=Buffer.from(await root.arrayBuffer());
 report.hosting={indexStatus:index.status,rootBytes:html.length,sourceShellBytes:fs.readFileSync(path.join(ROOT,'dist/index.html')).length};
 report.staticAssets=[];
 for(const name of [...build.assets.filter(a=>a.path!=='index.html').map(a=>a.path),'sw.js']){const r=await get('/'+name);assert.equal(r.status,200,name);const bytes=Buffer.from(await r.arrayBuffer());assert.ok(bytes.equals(fs.readFileSync(path.join(ROOT,'dist',name))),name+' exact hosted bytes');report.staticAssets.push({path:name,sha256:hash(bytes)});}
 report.results.push({name:'actual-host-routing-and-nine-static-byte-bindings',status:'PASS'});
 async function contextFor(browser,options={},fault){
  const context=await browser.newContext({...options,extraHTTPHeaders:headers,acceptDownloads:true});
  let hits=0,isolated=false;
  // Block all foreign requests; the service-access header is only sent to this Site.
  await context.route('**/*',async route=>{
   const request=route.request(),url=new URL(request.url());
   if(url.origin!==origin){await route.abort('blockedbyclient');return;}
   if(isolated){await route.abort('internetdisconnected');return;}
   if(fault&&request.serviceWorker()&&url.pathname==='/app.js'){
    hits++;
    if(fault==='abort'){await route.abort('failed');return;}
    if(fault==='redirect'){if(hits===1)await route.fulfill({status:302,headers:{location:origin+'/app.js','cache-control':'no-store'},body:''});else await route.continue();return;}
    if(['auth-html','auth-html-200'].includes(fault)){await route.fulfill({status:fault==='auth-html'?401:200,contentType:'text/html',body:'<html>Sign in required</html>'});return;}
    const bytes=fs.readFileSync(path.join(ROOT,'dist/app.js'));bytes[0]^=1;await route.fulfill({status:200,contentType:'text/javascript',body:bytes});return;
   }
   await route.continue();
  });
  return {context,hits:()=>hits,isolate:()=>{isolated=true;}};
 }
 for(const [name,type,options] of [['desktop','chromium',{}],['samsung','chromium',{...playwright.devices['Galaxy S9+'],viewport:{width:360,height:800}}],['iphone-webkit','webkit',{...playwright.devices['iPhone 13']}] ]){
  const transport=await transportProxy(origin);const browser=await playwright[type].launch({headless:true,proxy:{server:transport.server}}).catch(async e=>{await transport.close();throw e;});assert.equal(browser.version(),type==='webkit'?'26.5':'151.0.7922.34');let holder;
  try{
   holder=await contextFor(browser,options);const {context}=holder,page=await context.newPage();page.setDefaultTimeout(15000);
   await page.goto(origin+'/',{waitUntil:'domcontentloaded'});await page.locator('#addIntention').waitFor();
   await until(()=>page.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration();return r?.active?.state;}),s=>s==='activated','Hosted worker activation');
   await page.reload({waitUntil:'domcontentloaded'});await page.locator('#addIntention').waitFor();
   const controller=await page.evaluate(()=>navigator.serviceWorker.controller?.scriptURL);assert.equal(controller,origin+'/sw.js');
   const cache=await page.evaluate(async()=>{const names=await caches.keys();const name=names.find(n=>n.startsWith('pheisi-mobile-preview-embedded-shell-v1-'));const c=await caches.open(name);const keys=(await c.keys()).map(r=>r.url).sort();const r=await c.match(new URL('index.html',location.origin+'/').href);const bytes=await r.arrayBuffer();const sha=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),x=>x.toString(16).padStart(2,'0')).join('');return {name,keys,bytes:bytes.byteLength,sha,seal:await(await c.match(new URL('__preview_complete',location.origin+'/').href)).text()};});
   const shell=build.assets.find(a=>a.path==='index.html');assert.equal(cache.sha,shell.sha256);assert.equal(cache.bytes,shell.bytes);assert.equal(cache.seal,'embedded-shell-v1:'+build.digest);assert.deepEqual(cache.keys,[...build.assets.map(a=>origin+'/'+a.path),origin+'/__preview_complete'].sort());
   report.results.push({profile:name,name:'actual-worker-controller-and-exact-sealed-cache',status:'PASS',browserVersion:browser.version()});
   const network=await page.goto(origin+'/?network_probe=online',{waitUntil:'domcontentloaded'});assert.equal(network.fromServiceWorker(),false);await page.goto(origin+'/',{waitUntil:'domcontentloaded'});await page.locator('#addIntention').waitFor();
   const first=await create(page,'HOSTED-A',false),second=await create(page,'HOSTED-B',false);await page.locator('[data-action="open"][data-key="'+first.intentKey+'"]').click();if(await page.locator('#resumeObservation').count())await page.locator('#resumeObservation').click();else await page.locator('#newObservation').click();await page.locator('#actions').fill('SYNTHETIC HOSTED OFFLINE DRAFT');
   await until(()=>state(page),s=>s.drafts.some(d=>d?.values?.iep?.actions==='SYNTHETIC HOSTED OFFLINE DRAFT'),'Draft durable before disconnect');
   assert.ok(transport.stats().connected>0&&transport.stats().upstreamBytes>0,'Online transport must carry real Site bytes');
   await transport.isolate();
   const probe=await page.evaluate(async()=>{try{await fetch('/?network_probe=offline',{cache:'no-store'});return false;}catch{return true;}});assert.equal(probe,true,'Independent network request must fail');
   const workerProbeResponse=page.waitForResponse(r=>r.url()===origin+'/icon-512.png');
   const workerProbeStatus=await page.evaluate(async()=>{for(const name of await caches.keys())if(name.startsWith('pheisi-mobile-preview-embedded-shell-v1-'))await(await caches.open(name)).delete(location.origin+'/icon-512.png');return (await fetch('/icon-512.png',{cache:'no-store'})).status;});
   const workerProbe=await workerProbeResponse;assert.equal(workerProbe.fromServiceWorker(),true);assert.equal(workerProbeStatus,503,'Actual worker fallback network must fail too');
   assert.equal(transport.stats().forwardedAfterIsolation,0);
   for(const p of ['/','/index.html']){const response=await page.goto(origin+p,{waitUntil:'domcontentloaded'});assert.equal(response.fromServiceWorker(),true,p+' must come from SW');await page.locator('#addIntention').waitFor();await open(page,first.intentKey);assert.equal(await page.locator('#actions').inputValue(),'SYNTHETIC HOSTED OFFLINE DRAFT');}
   const committed=await finish(page,first.intentKey);assert.equal(committed.records.find(r=>r.intentKey===second.intentKey).sourceEnvelope.intent.cycles.length,0);assert.equal(committed.drafts.some(d=>d?.intentKey===first.intentKey),false);
   const response=await page.reload({waitUntil:'domcontentloaded'});assert.equal(response.fromServiceWorker(),true);await page.locator('#addIntention').waitFor();const final=await state(page);assert.equal(final.records.find(r=>r.intentKey===first.intentKey).sourceEnvelope.intent.cycles.length,1);
   report.results.push({profile:name,name:'hosted-offline-root-index-draft-resume-explicit-completion-isolated-history',status:'PASS',networkIsolation:'CONNECT proxy tunnels destroyed; independent frame and worker cache-miss probes failed',transport:transport.stats()});
  }catch(error){report.results.push({profile:name,name:'hosted-positive',status:'FAIL',error:String(error.message)});}
  finally{if(holder)await holder.context.close();await browser.close();await transport.close();}
 }
 const browser=await playwright.chromium.launch({headless:true});
 try{for(const fault of ['corrupt','redirect','auth-html','auth-html-200','abort']){
  const h=await contextFor(browser,{},fault);
  try{
   await h.context.addInitScript(()=>{const original=navigator.serviceWorker.register;window.__swStates=[];navigator.serviceWorker.register=function(...args){return original.apply(this,args).then(reg=>{window.__swOutcome='resolved';const watched=new Set();const watch=worker=>{if(!worker||watched.has(worker))return;watched.add(worker);const record=()=>{window.__swStates.push(worker.state);if(['redundant','activated'].includes(worker.state))window.__swTerminal=worker.state;};worker.addEventListener('statechange',record);record();};watch(reg.installing);watch(reg.waiting);watch(reg.active);reg.addEventListener('updatefound',()=>watch(reg.installing));return reg;},error=>{window.__swOutcome='rejected';throw error;});};});
   const p=await h.context.newPage();await p.goto(origin+'/',{waitUntil:'domcontentloaded'});await p.locator('#addIntention').waitFor();
   const terminal=await until(()=>p.evaluate(()=>window.__swTerminal),x=>['redundant','activated'].includes(x),'Fault must finish actual worker installation');assert.equal(terminal,'redundant');assert.equal(await p.evaluate(()=>window.__swOutcome),'resolved');
   assert.ok(h.hits()>0,'Must intercept a real service-worker-owned fetch');
   const out=await p.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration();let seal=false;for(const n of await caches.keys()){if(await(await caches.open(n)).match(location.origin+'/__preview_complete'))seal=true;}return {active:!!r?.active,seal};});assert.equal(out.active,false);assert.equal(out.seal,false);
   report.results.push({name:'actual-host-worker-rejects-'+fault,status:'PASS',interceptedWorkerRequests:h.hits()});
  }catch(error){report.results.push({name:'actual-host-worker-rejects-'+fault,status:'FAIL',error:String(error.message)});}
  finally{await h.context.close();}
 }}finally{await browser.close();}
}
async function input(){process.stdin.setRawMode(true);process.stdin.resume();console.log('HOSTED_TEST_READY');return new Promise((resolve,reject)=>{let text='';const timer=setTimeout(()=>reject(Error('Input timeout')),120000);process.stdin.on('data',chunk=>{text+=chunk.toString('utf8');if(/[\r\n]/.test(text)){clearTimeout(timer);process.stdin.pause();process.stdin.setRawMode(false);resolve(JSON.parse(text.trim()));text='';}});});}
input().then(run).catch(error=>{report.fatal=String(error.message);}).finally(()=>{report.passed=report.results.filter(r=>r.status==='PASS').length;report.failed=report.results.filter(r=>r.status==='FAIL').length;report.status=report.fatal||report.failed||report.results.length!==12?'FAIL':'PASS';const dir=path.join(ROOT,'test-results');fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'HOSTED_OFFLINE_RESULT.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));if(report.status!=='PASS')process.exitCode=1;});
