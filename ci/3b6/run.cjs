'use strict';
// CI orchestration stays outside the frozen source checkout.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {createHash} = require('node:crypto');
const {execFileSync, spawnSync} = require('node:child_process');
const PIN = Object.freeze({
  head: '7e583ac695be2b213d25591deab430664e682988',
  parent: '9ab969284ff9fbc09af4ee1cc277eb8d7a0766b9',
  main: '255a5d9d27461dcacaebc1bc80ab322dd54b4de8',
  verifier: 'b86df83a9f928a6c679804fa4557e71b0ee70639',
  s1: '9f327acae82054d2b9a28ea6f05ac48c53c65d71',
  harness: 'd13700b967f82e1b4796655e4701315e338f676d',
  test: 'ad41025cdee7f4222e8fd85205c669c146e7207a'
});
const source = fs.realpathSync(process.argv[2]);
const evidence = path.resolve(process.argv[3]);
const outside = target => { const relative=path.relative(source,target); return relative==='..' || relative.startsWith('..'+path.sep) || path.isAbsolute(relative); };
assert.ok(outside(evidence),'Evidence must be outside source');
fs.mkdirSync(evidence, {recursive:true});
const env = {...process.env, GIT_OPTIONAL_LOCKS:'0', GIT_TERMINAL_PROMPT:'0'};
const git = args => execFileSync('git', ['-c','core.fsmonitor=false','-C',source,...args],
  {env,encoding:'utf8',timeout:30000,maxBuffer:16*1024*1024}).trim();
const digest = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const save = (name, data) => fs.writeFileSync(path.join(evidence,name), JSON.stringify(data,null,2)+String.fromCharCode(10));
async function main() {
  assert.equal(process.platform,'linux');
  assert.equal(process.version,'v24.19.0');
  assert.equal(require('esbuild').version,'0.25.5');
  assert.equal(require('playwright/package.json').version,'1.62.1');
  assert.equal(git(['rev-parse','HEAD']),PIN.head);
  assert.equal(git(['show','-s','--format=%P','HEAD']),PIN.parent);
  assert.equal(git(['rev-parse','HEAD:browser-packaging/verify.cjs']),PIN.verifier);
  assert.equal(git(['rev-parse','refs/remotes/origin/main']),PIN.main);
  assert.equal(git(['status','--porcelain']),'');
  const tools = fs.realpathSync(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES);
  assert.ok(outside(tools),'Tools must be external');
  const candidates = ['/opt/google/chrome/chrome','/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'];
  const rejected = [], seen = new Set();
  let selected;
  for (const candidate of candidates) {
    if (!fs.existsSync(candidate)) continue;
    const file = fs.realpathSync(candidate);
    if (seen.has(file)) continue;
    seen.add(file);
    try {
      assert.ok(fs.lstatSync(file).isFile());
      fs.accessSync(file,fs.constants.X_OK);
      const sha256 = digest(file);
      const version = spawnSync(file,['--version'],{env,encoding:'utf8',timeout:15000});
      assert.equal(version.status,0);
      assert.equal(version.signal,null);
      assert.match(version.stdout.trim(),/^(?:Chromium|Google Chrome|Chrome for Testing|HeadlessChrome) +[0-9]+/);
      const probe = String.raw`const {chromium}=require(process.argv[1]);
        (async()=>{let browser;try{
          browser=await chromium.launch({headless:true,executablePath:process.argv[2]});
          const page=await browser.newPage();await page.close();
          console.log(browser.version());
        }finally{if(browser)await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});`;
      const launch = spawnSync(process.execPath,['-e',probe,require.resolve('playwright'),file],
        {env,encoding:'utf8',timeout:30000});
      assert.equal(launch.status,0);
      assert.equal(launch.signal,null);
      assert.ok(version.stdout.includes(launch.stdout.trim()));
      assert.equal(digest(file),sha256);
      selected = {path:file,sha256,version:version.stdout.trim()};
      break;
    } catch(error) {rejected.push({path:file,reason:error.message});}
  }
  save('qualification.json',{node:process.version,platform:process.platform,tools,selected,rejected});
  assert.ok(selected,'ENVIRONMENT_BLOCKED_NO_USABLE_CHROMIUM');
  const out = fs.openSync(path.join(evidence,'verifier.stdout'),'w');
  const err = fs.openSync(path.join(evidence,'verifier.stderr'),'w');
  let result;
  try {
    result = spawnSync(process.execPath,['browser-packaging/verify.cjs','--3b6-tests-only'],
      {cwd:source,env:{...env,LEGACY_DOM_CHROMIUM_EXECUTABLE_PATH:selected.path},
      stdio:['ignore',out,err],timeout:20*60*1000});
  } finally {fs.closeSync(out);fs.closeSync(err);}
  save('process.json',{status:result.status,signal:result.signal,error:result.error?.message});
  assert.equal(result.error,undefined);
  assert.equal(result.status,0);
  assert.equal(result.signal,null);
  const report = JSON.parse(fs.readFileSync(path.join(evidence,'verifier.stdout'),'utf8'));
  assert.equal(report.route,'3b6-tests-only');
  assert.equal(report.suiteCount,16);
  assert.ok(report.tests>0);
  assert.equal(report.pass,report.tests);
  for(const key of ['fail','cancelled','skipped','todo','protectedChangedPathCount']) assert.equal(report[key],0);
  for(const key of ['repositoryUnchanged','cleanCloneUnchanged','cleanCloneRemoved','chromiumHashCheckpointsIdentical']) assert.equal(report[key],true);
  assert.equal(report.s1Commit,PIN.s1);assert.equal(report.s1HarnessBlob,PIN.harness);
  assert.equal(report.s2Commit,PIN.parent);assert.equal(report.s2TestBlob,PIN.test);
  assert.equal(report.chromiumPath,selected.path);assert.equal(report.chromiumSha256,selected.sha256);
  assert.equal(report.playwrightVersion,'1.62.1');
  assert.equal(git(['rev-parse','HEAD']),PIN.head);
  assert.equal(git(['rev-parse','HEAD:browser-packaging/verify.cjs']),PIN.verifier);
  assert.equal(git(['status','--porcelain']),'');
  assert.equal(digest(selected.path),selected.sha256);
  save('acceptance.json',{status:'PASS',testedCommit:PIN.head,verifierBlob:PIN.verifier,
    suiteCount:report.suiteCount,tests:report.tests,pass:report.pass,
    browser:selected,publicActivation:false,acceptedBranchCreated:false});
  console.log(JSON.stringify({status:'PASS',testedCommit:PIN.head,suiteCount:16,tests:report.tests}));
}
main().catch(error=>{
  save('failure.json',{status:'NOT_ACCEPTED',message:error.message,stack:error.stack});
  console.error(error);process.exitCode=1;
});
