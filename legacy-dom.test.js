// Run: node --test legacy-dom.test.js (Playwright and Chromium required).
// The shared runtime can supply Playwright via NODE_PATH=$CODEX_PRIMARY_RUNTIME_NODE_MODULES.
// LEGACY_DOM_CHROMIUM_EXECUTABLE_PATH optionally selects an installed Chromium binary.
const {before,after,test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {execFileSync}=require('node:child_process');
const {createServer}=require('node:http');
const {join}=require('node:path');
const {chromium}=require('playwright');

const BASE='87c4e91c23d1c59bd4735d7fd75c41f35c533797';
const STORAGE_KEY='pheisiraetha_v01';
const LANGUAGE_KEY='pheisiraetha_language_v01';
const ONBOARDING_KEY='pheisiraetha_onboarding_v01';
const RIS_FIELDS=['primary','success','scope','nonGoals','constraints','rationale'];
const RATING_FIELDS=[['oop','achievement'],['iep','desire'],['iep','mental'],['iep','practical']];
const IMAGE='<img data-legacy-injection src="data:image/png,broken" onerror="window.__legacyExecuted=true">';
let browser,server,origin;

before(async()=>{
  const html='<!doctype html><html><head><link rel="stylesheet" href="app.css"></head><body><div id="app"></div><script src="locales.js"></script><script src="app.js"></script></body></html>';
  const assets=new Map([
    ['/', ['text/html',html]],
    ['/app.css', ['text/css',readFileSync(join(__dirname,'app.css'))]],
    ['/locales.js', ['text/javascript',readFileSync(join(__dirname,'locales.js'))]],
    ['/app.js', ['text/javascript',readFileSync(join(__dirname,'app.js'))]],
    ['/baseline/app.js', ['text/javascript',execFileSync('git',['show',`${BASE}:app.js`],{cwd:__dirname})]]
  ]);
  server=createServer((request,response)=>{
    const path=new URL(request.url,'http://localhost').pathname;
    const asset=assets.get(path)||assets.get(path.replace(/^\/baseline\//,'/'));
    response.writeHead(asset ? 200 : 404,{'Content-Type':asset?.[0]||'text/plain'});
    response.end(asset?.[1]||'Not found');
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  origin=`http://127.0.0.1:${server.address().port}`;
  browser=await chromium.launch({
    headless:true,
    ...(process.env.LEGACY_DOM_CHROMIUM_EXECUTABLE_PATH
      ? {executablePath:process.env.LEGACY_DOM_CHROMIUM_EXECUTABLE_PATH} : {})
  });
});

after(async()=>{
  await browser?.close();
  if(server?.listening) await new Promise(resolve=>server.close(resolve));
});

function fixture(count=2){
  const ris=Object.fromEntries(RIS_FIELDS.map(key=>[key,`Authored ${key}`]));
  return {
    version:'0.1.0',lang:'ru',opaque:{keep:['unchanged']},
    intent:{id:'intent-1',createdAt:'2026-09-01T12:00:00Z',ris,
      cycles:Array.from({length:count},(_,index)=>({
        id:`cycle-${index}`,createdAt:`2026-09-${String(index+2).padStart(2,'0')}T12:00:00Z`,
        cie:{...ris},
        iep:{desire:5,belief:5,emotion:'Calm',emotionIntensity:5,frequency:'freq2',mental:5,practical:5,hours:2,actions:'Work'},
        oop:{achievement:5,currentState:`State ${index}`,events:`Event ${index}`,direction:'toward',evidence:['direct'],external:'None'},
        intentional:['yes','no','unsure'][index%3],revision:{},unknown:{preserve:true}
      }))}
  };
}

function ratings(data,value){
  for(const cycle of data.intent.cycles)
    for(const [group,key] of RATING_FIELDS) cycle[group][key]=value;
  return data;
}

async function withApp(data,check,baseline=false){
  const raw=JSON.stringify(data,null,2);
  const context=await browser.newContext({locale:'en-US',timezoneId:'UTC',serviceWorkers:'block'});
  try{
    await context.addInitScript(({raw,storage,language,onboarding})=>{
      localStorage.setItem(storage,raw);
      localStorage.setItem(language,'en');
      localStorage.setItem(onboarding,'1');
      window.__legacyExecuted=false;
      window.__storageWrites=[];
      window.confirm=()=>true;
      for(const name of ['setItem','removeItem','clear']){
        const original=Storage.prototype[name];
        Storage.prototype[name]=function(...args){
          window.__storageWrites.push([name,...args]);
          return original.apply(this,args);
        };
      }
    },{raw,storage:STORAGE_KEY,language:LANGUAGE_KEY,onboarding:ONBOARDING_KEY});
    const page=await context.newPage();
    const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto(`${origin}/${baseline ? 'baseline/' : ''}`);
    await page.locator('#app main').waitFor();
    const result=await check(page);
    assert.deepEqual(errors,[],'Home/History and navigation must not introduce errors');
    const storage=await page.evaluate(()=>({
      entries:Object.fromEntries(Object.keys(localStorage).map(key=>[key,localStorage.getItem(key)])),
      writes:window.__storageWrites
    }));
    assert.deepEqual(storage.entries,{[STORAGE_KEY]:raw,[LANGUAGE_KEY]:'en',[ONBOARDING_KEY]:'1'},'Stored bytes and all existing keys stay unchanged');
    assert.deepEqual(storage.writes,[],'Rendering/navigation must not repair or persist data');
    return result;
  }finally{
    await context.close();
  }
}

async function snapshot(page){
  return page.locator('#app').evaluate(app=>({
    html:app.innerHTML,
    structure:[...app.querySelectorAll('*')].map(node=>[
      node.tagName,[...node.attributes].map(attribute=>[attribute.name,attribute.value])
    ])
  }));
}

async function surfaces(page){
  const home=await snapshot(page);
  await page.click('[data-nav="history"]');
  return {home,history:await snapshot(page)};
}

async function assertInert(page,expectedStructure){
  const observed=await page.locator('#app').evaluate(app=>({
    executed:window.__legacyExecuted,
    activeNodes:app.querySelectorAll('script,img,svg,iframe,object,embed,style,a[href^="javascript:"],[data-legacy-injection]').length,
    activeAttributes:[...app.querySelectorAll('*')].flatMap(node=>[...node.attributes])
      .filter(attribute=>/^on/i.test(attribute.name)||attribute.name==='srcdoc'||/^\s*(javascript|vbscript):/i.test(attribute.value)).length
  }));
  assert.deepEqual(observed,{executed:false,activeNodes:0,activeAttributes:0});
  assert.deepEqual((await snapshot(page)).structure,expectedStructure,'Persisted content cannot add HTML structure or attributes');
}

test('tampered ratings stay inert in every Home/History sink',async()=>{
  const expected=await withApp(fixture(),surfaces);
  // Positive control: execute the exact base app, proving this harness observes the original bypass.
  await withApp(ratings(fixture(),IMAGE),async page=>{
    assert.equal(await page.locator('[data-legacy-injection]').count(),4);
    await page.waitForFunction(()=>window.__legacyExecuted===true);
    await page.click('[data-nav="history"]');
    assert.equal(await page.locator('[data-legacy-injection]').count(),8);
  },true);
  const payloads=[
    IMAGE,
    `</strong></span>${IMAGE}<span><strong>`,
    '<svg data-legacy-injection onload="window.__legacyExecuted=true"></svg>',
    '<script data-legacy-injection>window.__legacyExecuted=true</script>',
    '<a data-legacy-injection href="javascript:window.__legacyExecuted=true">run</a>',
    '&#60;img src=x onerror=window.__legacyExecuted=true&#62; & "quotes"',
    [IMAGE],[[IMAGE],'&']
  ];
  for(const value of payloads) await withApp(ratings(fixture(),value),async page=>{
    await assertInert(page,expected.home.structure);
    assert.deepEqual(await page.locator('.metric strong').allTextContents(),Array(4).fill(`${String(value)}/10`));
    await page.click('[data-nav="history"]');
    await assertInert(page,expected.history.structure);
    const pills=await page.locator('.event .pill').allTextContents();
    assert.equal(pills.length,8);
    assert.ok(pills.every(text=>text.trim().endsWith(`${String(value)}/10`)));
  });
});

test('a tampered non-array cycles.length cannot inject the Home counter',async()=>{
  const data=fixture(0);
  data.intent.cycles={length:IMAGE,opaque:'keep'};
  const expected=await withApp(fixture(0),snapshot);
  await withApp(data,async page=>{
    assert.equal(await page.locator('[data-legacy-injection]').count(),1);
    await page.waitForFunction(()=>window.__legacyExecuted===true);
  },true);
  await withApp(data,async page=>{
    await assertInert(page,expected.structure);
    assert.equal(await page.locator('main .pill').textContent(),`${IMAGE} cycles`);
  });
});

test('valid 0–10 ratings and fractional numbers preserve exact production DOM',async()=>{
  const values=[...Array(11).keys(),2.5];
  const data=fixture(values.length);
  data.intent.cycles.forEach((cycle,index)=>{
    for(const [group,key] of RATING_FIELDS) cycle[group][key]=values[index];
  });
  assert.deepEqual(await withApp(data,surfaces),await withApp(data,surfaces,true));
  await withApp(data,async page=>{
    assert.deepEqual(await page.locator('.metric strong').allTextContents(),Array(4).fill('2.5/10'));
    await page.click('[data-nav="history"]');
    assert.deepEqual(await page.locator('.event p').allTextContents().then(texts=>texts.map(text=>text.trim())),values.map((_,index)=>`Event ${index}`).reverse());
    const pills=await page.locator('.event .pill').allTextContents();
    assert.ok(pills.every((text,index)=>text.trim().endsWith(`${values[values.length-1-Math.floor(index/4)]}/10`)));
    assert.match(await page.locator('main .muted').textContent(),/12 cycles/);
  });
});

test('non-numeric JSON values retain their previous display and stored representation',async()=>{
  for(const value of [undefined,null,true,false,{}, {text:IMAGE},[3,4],'5','']){
    const data=ratings(fixture(1),value);
    assert.deepEqual(await withApp(data,surfaces),await withApp(data,surfaces,true));
  }
});

test('authored RIS text and History event/current-state fallback keep existing safe paths',async()=>{
  const data=fixture();
  const text='Сергей & Alice: "plan" <b data-legacy-injection>literal</b> \'quotes\'';
  for(const key of RIS_FIELDS) data.intent.ris[key]=`${text} ${key}`;
  data.intent.cycles[0].oop.events=`${text} event`;
  data.intent.cycles[1].oop.events='';
  data.intent.cycles[1].oop.currentState=`${text} fallback`;
  // These existing enum-label paths must remain closed even when persisted labels are tampered.
  data.intent.cycles[1].intentional=IMAGE;
  data.intent.cycles[1].oop.direction=IMAGE;
  const expected=await withApp(data,surfaces,true);
  assert.deepEqual(await withApp(data,surfaces),expected);
  await withApp(data,async page=>{
    await assertInert(page,expected.home.structure);
    assert.equal(await page.locator('main h1').textContent(),`${text} primary`);
    assert.deepEqual(await page.locator('main .card bdi').allTextContents(),RIS_FIELDS.slice(1).map(key=>`${text} ${key}`));
    await page.click('[data-nav="history"]');
    await assertInert(page,expected.history.structure);
    assert.deepEqual(await page.locator('.event p').allTextContents().then(texts=>texts.map(value=>value.trim())),[`${text} fallback`,`${text} event`]);
    assert.match((await page.locator('.event .help').allTextContents())[0],/Not sure[\s\S]*Not enough information/);
  });
});

test('empty states, navigation, editing, blank check-in and export remain unchanged',async()=>{
  for(const data of [{version:'0.1.0',lang:'ru',intent:null},fixture(0),fixture()]){
    const navigate=async page=>{
      const result=await surfaces(page);
      await page.click('[data-nav="home"]');
      if(data.intent){
        await page.click('#editGoal');
        result.edit=await snapshot(page);
        await page.click('#risCancel');
        await page.click('#startCheckin');
        assert.deepEqual(await page.locator('main textarea').allTextContents(),Array(6).fill(''));
        result.checkin=await snapshot(page);
        await page.click('#wizCancel');
      }
      await page.click('[data-nav="data"]');
      result.data=await snapshot(page);
      return result;
    };
    assert.deepEqual(await withApp(data,navigate),await withApp(data,navigate,true));
  }
  const tampered=ratings(fixture(),[IMAGE]);
  await withApp(tampered,async page=>{
    await page.click('[data-nav="history"]');
    await page.click('[data-nav="home"]');
    await page.click('[data-nav="data"]');
    const downloadPromise=page.waitForEvent('download');
    await page.click('#exportBtn');
    const download=await downloadPromise;
    const exported=JSON.parse(readFileSync(await download.path(),'utf8'));
    assert.deepEqual(exported,tampered,'In-memory records, types and unknown fields must survive rendering unchanged');
  });
});
