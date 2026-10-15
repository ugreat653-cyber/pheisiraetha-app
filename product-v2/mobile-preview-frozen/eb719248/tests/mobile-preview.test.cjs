'use strict';
// Private localhost browser verification. Never opens an existing user profile.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const crypto = require('node:crypto');
const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const RESULTS = path.join(ROOT, 'test-results');
const SOURCE = path.resolve(ROOT, '../source/product-v2/storage.mjs');
const playwright = require(process.env.PREVIEW_PLAYWRIGHT || 'C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const FIELDS = ['primary', 'success', 'scope', 'nonGoals', 'constraints', 'rationale'];
const NUMBERS = ['desire', 'belief', 'emotionIntensity', 'mental', 'practical', 'hours'];
const report = {scope: 'Separate mobile preview only; synthetic records in new localhost browser contexts', profiles: [], results: [], browserAvailability: {}, physicalDeviceTests: false};
let originDisconnected=false;
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const title = suffix => ({primary: 'TEST intention ' + suffix, success: 'Observed TEST result ' + suffix,
  scope: 'One private TEST activity ' + suffix, nonGoals: 'No public event', constraints: 'Two TEST hours per week', rationale: 'User authored TEST reason ' + suffix});
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
async function eventually(read, accepts, label, timeout = 10000) {
  const end = Date.now() + timeout;
  let last;
  while (Date.now() < end) { last = await read(); if (accepts(last)) return last; await pause(60); }
  assert.fail(label + ': ' + JSON.stringify(last));
}
function staticServer() {
  return http.createServer((request, response) => {
    if(originDisconnected){request.socket.destroy();return;}
    if (!['GET', 'HEAD'].includes(request.method)) {response.writeHead(405); response.end(); return;}
    let pathname;
    try { pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname); }
    catch {response.writeHead(400); response.end(); return;}
    if (pathname.includes('\0')) {response.writeHead(400); response.end(); return;}
    const file = path.resolve(DIST, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(DIST + path.sep)) {response.writeHead(403); response.end(); return;}
    let bytes;
    try {if (!fs.statSync(file).isFile()) throw Error(); bytes = fs.readFileSync(file);}
    catch {response.writeHead(404); response.end(); return;}
    const mime = {'.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.webmanifest': 'application/manifest+json', '.png': 'image/png'}[path.extname(file)] || 'application/octet-stream';
    response.writeHead(200, {'Content-Type': mime, 'Cache-Control': 'no-cache', 'Service-Worker-Allowed': '/'});
    response.end(request.method === 'HEAD' ? undefined : bytes);
  });
}
async function state(page) {
  return page.evaluate(async () => {
    const {openPreviewStore} = await import('/preview-store.mjs');
    const store = await openPreviewStore();
    try {return {workspace: await store.readWorkspace(), records: await store.listIntentions(),
      drafts: await Promise.all((await store.listIntentions()).map(row => store.readDraft(row.intentKey)))};}
    finally {store.close();}
  });
}
async function serializedState(page) {
  return page.evaluate(async () => {const {openPreviewStore, encodePreviewBackup} = await import('/preview-store.mjs');
    const store = await openPreviewStore(); try {return encodePreviewBackup(await store.exportWorkspace());} finally {store.close();}});
}
async function goHome(page) {
  await page.locator('#navHome').click();
  await page.locator('#addIntention').waitFor();
}
async function create(page, suffix, continueNow = false) {
  await goHome(page); await page.locator('#addIntention').click();
  await page.locator('#risForm').waitFor();
  const values = title(suffix);
  for (const field of FIELDS) {
    assert.equal(await page.locator('#ris-' + field).inputValue(), '', 'Example never populates ' + field);
    assert.ok((await page.locator('#example-' + field).textContent()).trim(), 'Example is visible guidance for ' + field);
    await page.locator('#ris-' + field).fill(values[field]);
  }
  await page.locator(continueNow ? '#risContinue' : '#risLater').click();
  const snapshot = await eventually(() => state(page), data => data.records.some(row => row.sourceEnvelope.intent.ris.primary === values.primary), 'RIS must commit');
  const row = snapshot.records.find(value => value.sourceEnvelope.intent.ris.primary === values.primary);
  assert.deepEqual(row.sourceEnvelope.intent.ris, values, 'Only supplied answers are saved');
  assert.equal(row.sourceEnvelope.intent.cycles.length, 0);
  return row;
}
async function openIntent(page, key) {
  await goHome(page);
  await page.locator('[data-action="open"][data-key="' + key + '"]').click();
  await page.locator('.detail-hero h1').waitFor();
  await page.locator('#backHome').waitFor();
}
async function resume(page) {
  const resumeButton = page.locator('#resumeObservation');
  if (await resumeButton.count()) await resumeButton.click(); else await page.locator('#newObservation').click();
  await page.locator('#observationForm').waitFor();
}
async function fillIEP(page, marker) {
  for (const id of NUMBERS) await page.locator('#' + id).fill(id === 'hours' ? '2.5' : '6');
  await page.locator('#emotion').selectOption({index: 1});
  await page.locator('#frequency').selectOption('freq2');
  if (await page.locator('#actions').count()) await page.locator('#actions').fill(marker);
}
async function fillOOP(page, marker) {
  await page.locator('#achievement').fill('7');
  await page.locator('#direction').selectOption('toward');
  await page.locator('[name="evidence"][value="direct"]').check();
  for (const [id, value] of [['currentState', marker], ['events', marker], ['external', 'No TEST external event']])
    if (await page.locator('#' + id).count()) await page.locator('#' + id).fill(value);
}
async function finish(page, key, marker) {
  await fillIEP(page, marker); await page.locator('#nextStep').click();
  await page.locator('#achievement').waitFor(); await fillOOP(page, marker);
  await page.locator('#nextStep').click(); await page.locator('#completeObservation').waitFor();
  if (await page.locator('#intentional').count()) await page.locator('#intentional').selectOption('no');
  await page.locator('#completeObservation').evaluate(button => {button.click(); button.click();});
  const committed=await eventually(() => state(page), data => data.records.find(row => row.intentKey === key)?.sourceEnvelope.intent.cycles.length === 1, 'Completed observation commits exactly once');
  await page.locator('#newObservation').waitFor();return committed;
}
async function fit(page) {
  const widths = await page.evaluate(() => ({viewport: innerWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth}));
  assert.ok(widths.document <= widths.viewport + 1 && widths.body <= widths.viewport + 1, 'No horizontal page overflow: ' + JSON.stringify(widths));
}
async function browserCase(browser, profile, origin, name, body) {
  const selectedCases = process.env.PREVIEW_CASES?.split(',').map(value => value.trim());
  if (selectedCases && !selectedCases.includes(name)) return;
  const context = await browser.newContext({...profile.context, acceptDownloads: true, serviceWorkers: 'allow'});
  const page = await context.newPage(), errors = [], requests = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => requests.push({url: request.url(), method: request.method()}));
  await page.addInitScript(() => {window.__previewAnalyticsCalls = 0;
    Object.defineProperty(window, 'PHEISIRAETHA_ANALYTICS_V1', {value: Object.freeze({evaluate() {window.__previewAnalyticsCalls++; throw Error('Analytics forbidden in preview');}}), enumerable: true});});
  try {
    await page.goto(origin, {waitUntil: 'networkidle'}); await page.locator('#addIntention').waitFor();
    await body(page, context);
    assert.deepEqual(errors, [], 'No uncaught browser errors');
    assert.equal(await page.evaluate(() => window.__previewAnalyticsCalls), 0, 'No analytics evaluation');
    assert.ok(requests.every(request => request.url.startsWith(origin + '/') || request.url.startsWith('blob:' + origin)), 'Preview requests remain on its own localhost origin');
    report.results.push({profile: profile.name, name, status: 'PASS'}); console.log('PASS ' + profile.name + ' ' + name);
  } catch (error) {
    try {await page.screenshot({path: path.join(RESULTS, profile.name + '-' + name + '-FAIL.png'), fullPage: true});} catch {}
    report.results.push({profile: profile.name, name, status: 'FAIL', error: error.stack || String(error)}); console.error('FAIL ' + profile.name + ' ' + name + ': ' + (error.stack || error.message));
  } finally {await context.close();}
}
async function runProfile(browser, profile, origin) {
  report.profiles.push({name: profile.name, engine: profile.engine, version: browser.version(), physicalDevice: false, emulation: profile.emulation});
  await browserCase(browser, profile, origin, 'first-run-ownership-complete', async page => {
    assert.equal((await state(page)).records.length, 0);
    const first = await create(page, 'A', true);
    await page.locator('#desire').waitFor();
    for (const id of NUMBERS) assert.equal(await page.locator('#' + id).inputValue(), '', 'Numeric answer must be explicitly entered: ' + id);
    assert.equal(await page.locator('#cieConfirm').count(), 0, 'First observation starts in IEP');
    await page.screenshot({path: path.join(RESULTS, profile.name + '-first-IEP.png'), fullPage: true});
    await fillIEP(page,'RANGE-PROBE');
    await page.locator('#hours').fill('169');
    await page.locator('#nextStep').click();
    assert.equal(await page.locator('#desire').count(), 1, 'Invalid/incomplete numeric values cannot advance');
    assert.equal((await state(page)).records[0].sourceEnvelope.intent.cycles.length, 0);
    const saved = await finish(page, first.intentKey, 'OBSERVATION-A');
    assert.equal(saved.drafts.filter(Boolean).length, 0, 'Completed draft is consumed');
    assert.equal(saved.records[0].sourceEnvelope.intent.cycles.length, 1);
    const second = await create(page, 'B');
    const third = await create(page, 'C');
    assert.notEqual(first.intentKey, second.intentKey); assert.notEqual(second.intentKey, third.intentKey);
    assert.equal((await state(page)).records.length, 3);
    await openIntent(page, first.intentKey);
    assert.equal(await page.locator('.history-item').count(), 1);
    assert.ok((await page.locator('.history-item').textContent()).includes('OBSERVATION-A'));
    await openIntent(page, second.intentKey); assert.equal(await page.locator('.history-item').count(), 0);
    await openIntent(page, third.intentKey); assert.equal(await page.locator('.history-item').count(), 0);
    await page.screenshot({path: path.join(RESULTS, profile.name + '-independent-intentions.png'), fullPage: true});
  });
  await browserCase(browser, profile, origin, 'autosave-reload-offline', async (page, context) => {
    const first = await create(page, 'DRAFT-A', true); await page.locator('#actions').fill('DRAFT-A-AUTOSAVE');
    await eventually(() => state(page), data => data.drafts.some(draft => draft?.intentKey === first.intentKey && draft.values.iep?.actions === 'DRAFT-A-AUTOSAVE'), 'Autosave A');
    await page.reload({waitUntil: 'networkidle'}); await page.locator('#addIntention').waitFor();
    await openIntent(page, first.intentKey); await resume(page); assert.equal(await page.locator('#actions').inputValue(), 'DRAFT-A-AUTOSAVE');
    const second = await create(page, 'DRAFT-B', true); await page.locator('#actions').fill('DRAFT-B-AUTOSAVE');
    await eventually(() => state(page), data => data.drafts.some(draft => draft?.intentKey === second.intentKey && draft.values.iep?.actions === 'DRAFT-B-AUTOSAVE'), 'Autosave B');
    await page.reload({waitUntil: 'networkidle'}); await page.locator('#addIntention').waitFor();
    await openIntent(page, second.intentKey); await resume(page); assert.equal(await page.locator('#actions').inputValue(), 'DRAFT-B-AUTOSAVE');
    await context.setOffline(true);
    try {await page.locator('#actions').fill('OFFLINE-B');
      await eventually(() => state(page), data => data.drafts.some(draft => draft?.intentKey === second.intentKey && draft.values.iep?.actions === 'OFFLINE-B'), 'Offline autosave B');
      await openIntent(page, first.intentKey); await resume(page); assert.equal(await page.locator('#actions').inputValue(), 'DRAFT-A-AUTOSAVE');
      assert.ok((await state(page)).records.every(row => row.sourceEnvelope.intent.cycles.length === 0));
    } finally {await context.setOffline(false);}
  });
  await browserCase(browser, profile, origin, 'real-file-roundtrip-invalid-atomic', async page => {
    await create(page, 'BACKUP-A'); await create(page, 'BACKUP-B');
    await page.locator('#navData').click();
    const downloaded = page.waitForEvent('download'); await page.locator('#exportBackup').click();
    const download = await downloaded, chunks = [];
    for await (const chunk of await download.createReadStream()) chunks.push(chunk);
    const bytes = Buffer.concat(chunks); assert.ok(bytes.length > 100);
    fs.writeFileSync(path.join(RESULTS, profile.name + '-actual-downloaded-backup.json'), bytes);
    await page.locator('#importBackup').setInputFiles({name: download.suggestedFilename(), mimeType: 'application/json', buffer: bytes});
    const imported = await eventually(() => state(page), data => data.records.length === 4, 'File import adds two copies');
    await page.locator('#importStatus[data-state="success"]').waitFor();
    assert.equal(new Set(imported.records.map(row => row.intentKey)).size, 4);
    assert.deepEqual(imported.records.map(row => row.sourceEnvelope.intent.ris.primary).sort(), [title('BACKUP-A').primary, title('BACKUP-A').primary, title('BACKUP-B').primary, title('BACKUP-B').primary].sort());
    const before = await serializedState(page);
    await page.locator('#importBackup').setInputFiles({name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from('{"format":"not-a-preview-backup"}')});
    await page.locator('#importStatus[data-state="error"]').waitFor();
    assert.equal(await serializedState(page), before, 'Invalid UI import changes no records');
  });
  await browserCase(browser, profile, origin, '320px-no-analytics', async page => {
    await page.setViewportSize({width: 320, height: 740});
    await fit(page); await page.locator('#addIntention').click(); await page.locator('#risForm').waitFor(); await fit(page);
    for (const field of FIELDS) {assert.equal(await page.locator('#ris-' + field).inputValue(), ''); await page.locator('#ris-' + field).fill(title('NARROW')[field]);}
    await page.locator('#risContinue').click(); await page.locator('#desire').waitFor(); await fit(page);
    const prose = await page.locator('body').textContent(); assert.ok(/аналитик|analytics/i.test(prose), 'Preview explains analytical availability');
    assert.equal(await page.locator('#analyticsHost').count(), 0);
    await page.screenshot({path: path.join(RESULTS, profile.name + '-320px.png'), fullPage: true});
  });
  await browserCase(browser, profile, origin, 'codec-cas-corruption-exactly-once', async page => {
    const out = await page.evaluate(async () => {
      const api = await import('/preview-store.mjs'); const store = await api.openPreviewStore({dbName: 'private-test-' + crypto.randomUUID()});
      const ris = {primary: 'Private CAS', success: 'Recorded', scope: 'One', nonGoals: 'None', constraints: 'None', rationale: 'Test'};
      try {
        await store.addIntention({operationId: crypto.randomUUID(), ris}); let row = (await store.listIntentions())[0];
        const values = {cie: ris, iep: {desire: 6, belief: 6, emotionIntensity: 6, mental: 6, practical: 6, hours: 2.5, emotion: 'Calm / contentment', frequency: 'freq2', actions: 'CAS'},
          oop: {achievement: 7, currentState: 'Observed', events: 'Observed', external: '', direction: 'toward', evidence: ['direct']}, intentional: 'no', revision: {}, answered: {cie: true}};
        for (const key of ['iep.desire', 'iep.belief', 'iep.emotionIntensity', 'iep.mental', 'iep.practical', 'iep.hours', 'oop.achievement']) values.answered[key] = true;
        const command = {operationId: crypto.randomUUID(), intentKey: row.intentKey, expectedIntentRevision: row.revision, expectedDraftRevision: null, draft: {kind: 'first', step: 3, values}};
        const writes = await Promise.allSettled([store.saveObservationDraft(command), store.saveObservationDraft({...command, operationId: crypto.randomUUID()})]);
        let draft = await store.readDraft(row.intentKey);
        const complete = {operationId: crypto.randomUUID(), intentKey: row.intentKey, expectedIntentRevision: row.revision, expectedDraftRevision: draft.revision};
        const completions = await Promise.all([store.completeObservation(complete), store.completeObservation(complete)]);
        row = await store.readIntention(row.intentKey);
        const original = await store.exportWorkspace(); original.opaque = {negativeZero: -0, nan: NaN, positive: Infinity, negative: -Infinity, tiny: Number.MIN_VALUE, huge: Number.MAX_VALUE};
        Object.defineProperty(original.opaque, '__proto__', {value: {inert: true}, enumerable: true});
        const decoded = api.decodePreviewBackup(api.encodePreviewBackup(original));
        const checks = {negativeZero: Object.is(decoded.opaque.negativeZero, -0), nan: Number.isNaN(decoded.opaque.nan), positive: decoded.opaque.positive === Infinity,
          negative: decoded.opaque.negative === -Infinity, tiny: decoded.opaque.tiny === Number.MIN_VALUE, huge: decoded.opaque.huge === Number.MAX_VALUE,
          inert: Object.hasOwn(decoded.opaque, '__proto__') && decoded.opaque.__proto__.inert === true && Object.prototype.inert === undefined};
        const invalid = await store.exportWorkspace(); invalid.workspace.selectedIntentKey = 'missing-owner';
        const before = api.encodePreviewBackup(await store.exportWorkspace()); let corruptionRejected = false;
        try {await store.importFile({operationId: crypto.randomUUID(), text: api.encodePreviewBackup(invalid)});} catch {corruptionRejected = true;}
        const corruptionUnchanged =
          before === api.encodePreviewBackup(await store.exportWorkspace());

        // Root backup depth: workspace=1, opaqueDepth=2, leaf=100.
        // Codec accepts this. Storing its workspace under restoreSources adds
        // nesting and must be rejected atomically before any writes commit.
        const depthBackup = await store.exportWorkspace();
        let depthChain = 'depth-leaf';
        for (let depth = 0; depth < 98; depth++) depthChain = {child: depthChain};
        Object.defineProperty(depthBackup.workspace, 'opaqueDepth', {
          value: depthChain, enumerable: true, writable: true, configurable: true
        });
        const depthText = api.encodePreviewBackup(depthBackup);
        const depthDecoded = api.decodePreviewBackup(depthText);
        let depthLeaf = depthDecoded.workspace.opaqueDepth;
        for (let depth = 0; depth < 98; depth++) depthLeaf = depthLeaf.child;
        const depthCodecAccepted = depthLeaf === 'depth-leaf';
        const depthBefore = api.encodePreviewBackup(await store.exportWorkspace());
        let depthRejected = false, depthErrorCode = null;
        try {
          await store.importFile({operationId: crypto.randomUUID(), text: depthText});
        } catch (error) {
          depthRejected = true;
          depthErrorCode = error.code || error.name;
        }
        const depthUnchanged =
          depthBefore === api.encodePreviewBackup(await store.exportWorkspace());
        return {
          writes: writes.map(value => value.status),
          completions,
          cycles: row.sourceEnvelope.intent.cycles.length,
          draft: await store.readDraft(row.intentKey),
          checks,
          corruptionRejected,
          unchanged: corruptionUnchanged,
          depthCodecAccepted,
          depthRejected,
          depthErrorCode,
          depthUnchanged
        };
      } finally {store.close();}
    });
    assert.deepEqual(out.writes.sort(), ['fulfilled', 'rejected']); assert.deepEqual(out.completions[0], out.completions[1]);
    assert.equal(out.cycles, 1); assert.equal(out.draft, null);
    assert.ok(Object.values(out.checks).every(Boolean)); assert.equal(out.corruptionRejected, true); assert.equal(out.unchanged, true);
    assert.equal(out.depthCodecAccepted, true, 'Input codec accepts the depth-boundary fixture');
    assert.equal(out.depthRejected, true, 'Restore rejects excessive projected provenance depth');
    assert.equal(out.depthErrorCode, 'BACKUP_LIMIT_EXCEEDED');
    assert.equal(out.depthUnchanged, true, 'Rejected deep import commits no state changes');
  });
  await browserCase(browser, profile, origin, 'own-service-worker-offline-reload', async (page, context) => {
    await create(page, 'OFFLINE-SHELL');
    await page.evaluate(() => Promise.race([navigator.serviceWorker.ready, new Promise((_, reject) => setTimeout(() => reject(Error('Preview service worker not ready')), 10000))]));
    await page.reload({waitUntil: 'networkidle'}); await page.locator('#addIntention').waitFor();
    const scope = await page.evaluate(() => navigator.serviceWorker.controller?.scriptURL);
    assert.equal(scope, origin + '/sw.js', 'Only this separate localhost preview worker controls the page');
    const originFailureMode=profile.name==='iphone-webkit';
    if(originFailureMode){originDisconnected=true;const disconnected=await new Promise(resolve=>{const r=http.get(origin+'/__network_probe',response=>{response.resume();resolve(false);});r.on('error',()=>resolve(true));});assert.equal(disconnected,true,'Origin is actually unreachable while verifying cached WebKit reload');}else await context.setOffline(true);
    report.offlineNavigationMethods??={};report.offlineNavigationMethods[profile.name]=originFailureMode?'origin socket disconnected; Playwright offline-emulation issue42775':'browserContext.setOffline(true)';
    try {await page.reload({waitUntil: 'domcontentloaded'}); await page.locator('#addIntention').waitFor();
      assert.equal((await state(page)).records[0].sourceEnvelope.intent.ris.primary, title('OFFLINE-SHELL').primary);
      const urls = await page.evaluate(async () => {const keys = await caches.keys(); return (await Promise.all(keys.map(async key => (await (await caches.open(key)).keys()).map(request => request.url)))).flat();});
      assert.ok(urls.length > 0 && urls.every(url => url.startsWith(origin + '/')), 'Static cache stays on preview origin');
      assert.ok(urls.every(url => !/analytics-v1|release-inventory|pheisiraetha_v01/.test(url)), 'No production analytics/release/user-data cache');
    } finally {originDisconnected=false;await context.setOffline(false);}
  });
  await browserCase(browser, profile, origin, 'repeat-revision-confirmation', async page => {
    const first = await create(page, 'REPEAT', true);
    const oldRIS = structuredClone(first.sourceEnvelope.intent.ris);
    await finish(page, first.intentKey, 'FIRST-REPEAT-OBSERVATION');

    await openIntent(page, first.intentKey);
    await page.locator('#newObservation').click();
    await page.locator('#cieConfirm').waitFor();
    assert.equal(await page.locator('#cieConfirm').isChecked(), false);

    // All other IEP answers are valid, so this isolates the CIE confirmation gate.
    await fillIEP(page, 'SECOND-REPEAT-OBSERVATION');
    await page.locator('#nextStep').click();
    assert.equal(await page.locator('#desire').count(), 1);
    assert.equal(await page.locator('#achievement').count(), 0);
    assert.equal(
      (await state(page)).records.find(row => row.intentKey === first.intentKey)
        .sourceEnvelope.intent.cycles.length,
      1,
      'Untouched CIE confirmation cannot advance or add a cycle'
    );

    await page.locator('#cieConfirm').check();
    await page.locator('#nextStep').click();
    await page.locator('#achievement').waitFor();
    await fillOOP(page, 'SECOND-REPEAT-OBSERVATION');
    await page.locator('#nextStep').click();
    await page.locator('#intentional').selectOption('yes');
    const revisedPrimary = oldRIS.primary + ' REVISED BY EXPLICIT USER ANSWER';
    await page.locator('#revision-primary').fill(revisedPrimary);
    await page.locator('#completeObservation').evaluate(button => {
      button.click();
      button.click();
    });

    const completed = await eventually(
      () => state(page),
      data => data.records.find(row => row.intentKey === first.intentKey)
        ?.sourceEnvelope.intent.cycles.length === 2,
      'Second observation and explicit revision commit once'
    );
    await page.locator('#newObservation').waitFor();
    const updated = completed.records.find(row => row.intentKey === first.intentKey);
    const cycles = updated.sourceEnvelope.intent.cycles;
    assert.deepEqual(cycles[0].cie, oldRIS, 'Earlier CIE remains unchanged');
    assert.deepEqual(cycles[1].cie, oldRIS, 'Revision observation retains its original CIE');
    assert.deepEqual(cycles[0].revision, {});
    assert.deepEqual(cycles[1].revision, {primary: revisedPrimary});
    assert.equal(cycles[1].intentional, 'yes');
    assert.deepEqual(updated.sourceEnvelope.intent.ris, {...oldRIS, primary: revisedPrimary});
    assert.equal(completed.drafts.filter(Boolean).length, 0);
    assert.equal(await page.locator('.history-item').count(), 2);

    await page.locator('#newObservation').click();
    await page.locator('#cieConfirm').waitFor();
    assert.equal(await page.locator('#cieConfirm').isChecked(), false);
    assert.equal(await page.locator('#desire').inputValue(), '');
    await page.locator('#desire').fill('4');
    await eventually(
      () => state(page),
      data => data.drafts.some(draft =>
        draft?.intentKey === first.intentKey &&
        draft.values.iep?.desire === 4 &&
        draft.values.cie?.primary === revisedPrimary),
      'Next progress draft uses revised RIS as its basis'
    );

    await page.reload({waitUntil: 'networkidle'});
    await page.locator('#addIntention').waitFor();
    await openIntent(page, first.intentKey);
    await page.locator('#resumeObservation').click();
    await page.locator('#desire').waitFor();
    assert.equal(await page.locator('#desire').inputValue(), '4');
    assert.equal(await page.locator('#cieConfirm').isChecked(), false);
    const resumed = await state(page);
    const owner = resumed.records.find(row => row.intentKey === first.intentKey);
    const draft = resumed.drafts.find(value => value?.intentKey === first.intentKey);
    assert.equal(draft.kind, 'progress');
    assert.equal(draft.basedOnIntentRevision, owner.revision);
    assert.deepEqual(draft.values.cie, {...oldRIS, primary: revisedPrimary});
    assert.equal(draft.values.answered.cie, false);
    assert.equal(owner.sourceEnvelope.intent.cycles.length, 2);
    assert.deepEqual(owner.sourceEnvelope.intent.cycles[0].cie, oldRIS);
  });
await browserCase(browser, profile, origin, 'complete-abort-quota-retry-atomic', async page => {
  const out = await page.evaluate(async () => {
    const api = await import('/preview-store.mjs');
    const dbName = 'private-atomic-complete-' + crypto.randomUUID();
    const store = await api.openPreviewStore({dbName});
    const names = ['meta', 'intentions', 'drafts', 'legacySnapshots', 'operations'];

    async function dump() {
      const db = await new Promise((resolve, reject) => {
        const r = indexedDB.open(dbName);
        r.onsuccess = () => resolve(r.result);
        r.onerror = () => reject(r.error);
      });
      try {
        return await new Promise((resolve, reject) => {
          const t = db.transaction(names, 'readonly');
          const data = {};
          for (const name of names) {
            const r = t.objectStore(name).getAll();
            r.onsuccess = () => { data[name] = r.result; };
          }
          t.oncomplete = () => resolve(data);
          t.onabort = () => reject(t.error || Error('Private dump aborted'));
        });
      } finally {
        db.close();
      }
    }

    const ris = {
      primary: 'Atomic completion TEST',
      success: 'One recorded TEST observation',
      scope: 'Private synthetic activity',
      nonGoals: 'No public event',
      constraints: 'Two TEST hours',
      rationale: 'User authored TEST reason'
    };
    const originalPut = IDBObjectStore.prototype.put;
    const originalAdd = IDBObjectStore.prototype.add;

    try {
      const created = await store.addIntention({
        operationId: crypto.randomUUID(), ris
      });
      const row = await store.readIntention(created.intentKey);
      const values = {
        cie: ris,
        iep: {
          desire: 6, belief: 6, emotionIntensity: 6,
          mental: 6, practical: 6, hours: 2.5,
          emotion: 'Calm / contentment',
          frequency: 'freq2',
          actions: 'Explicit TEST action'
        },
        oop: {
          achievement: 7,
          currentState: 'Observed TEST state',
          events: 'Observed TEST event',
          external: '',
          direction: 'toward',
          evidence: ['direct']
        },
        intentional: 'no',
        revision: {},
        answered: {cie: true}
      };
      for (const key of [
        'iep.desire', 'iep.belief', 'iep.emotionIntensity',
        'iep.mental', 'iep.practical', 'iep.hours', 'oop.achievement'
      ]) values.answered[key] = true;

      const saved = await store.saveObservationDraft({
        operationId: crypto.randomUUID(),
        intentKey: row.intentKey,
        expectedIntentRevision: row.revision,
        expectedDraftRevision: null,
        draft: {kind: 'first', step: 3, values}
      });
      const command = {
        operationId: crypto.randomUUID(),
        intentKey: row.intentKey,
        expectedIntentRevision: row.revision,
        expectedDraftRevision: saved.draftRevision
      };
      const beforeData = await dump();
      const before = api.encodePreviewBackup(beforeData);

      // Throw after intention.put and draft.delete have already been queued.
      let quotaHits = 0;
      IDBObjectStore.prototype.put = function (...args) {
        if (this.transaction.db.name === dbName &&
            this.name === 'meta' && quotaHits === 0) {
          quotaHits++;
          throw new DOMException('Private TEST quota fault', 'QuotaExceededError');
        }
        return originalPut.apply(this, args);
      };
      let quotaCode = null;
      try {
        await store.completeObservation(command);
      } catch (e) {
        quotaCode = e.code || e.name;
      } finally {
        IDBObjectStore.prototype.put = originalPut;
      }
      const afterQuota = api.encodePreviewBackup(await dump());

      // Abort after the receipt request succeeds, but before tx.oncomplete.
      let receiptSuccessSeen = false;
      let abortInjectionError = null;
      let completionResolvedDespiteAbort = false;
      IDBObjectStore.prototype.add = function (...args) {
        const r = originalAdd.apply(this, args);
        if (this.transaction.db.name === dbName &&
            this.name === 'operations' &&
            args[0]?.operationId === command.operationId &&
            args[0]?.command === 'preview.completeObservation') {
          const transaction = this.transaction;
          r.addEventListener('success', () => {
            receiptSuccessSeen = true;
            try { transaction.abort(); }
            catch (e) { abortInjectionError = e.name; }
          }, {once: true});
        }
        return r;
      };
      let abortCode = null;
      try {
        await store.completeObservation(command);
        completionResolvedDespiteAbort = true;
      } catch (e) {
        abortCode = e.code || e.name;
      } finally {
        IDBObjectStore.prototype.add = originalAdd;
      }
      const afterAbort = api.encodePreviewBackup(await dump());

      // Same logical command succeeds once; concurrent and later retries replay it.
      const retries = await Promise.all([
        store.completeObservation(command),
        store.completeObservation(command)
      ]);
      const replay = await store.completeObservation(command);
      const finalData = await dump();
      const finalRow = await store.readIntention(row.intentKey);
      const receiptRows = finalData.operations.filter(
        value => value.operationId === command.operationId
      );

      return {
        quotaHits,
        quotaCode,
        unchangedAfterQuota: before === afterQuota,
        receiptSuccessSeen,
        abortInjectionError,
        abortCode,
        completionResolvedDespiteAbort,
        unchangedAfterAbort: before === afterAbort,
        retries,
        replay,
        cycles: finalRow.sourceEnvelope.intent.cycles.length,
        draft: await store.readDraft(row.intentKey),
        intentionRevisionDelta: finalRow.revision - row.revision,
        workspaceRevisionDelta:
          finalData.meta[0].revision - beforeData.meta[0].revision,
        operationCountDelta:
          finalData.operations.length - beforeData.operations.length,
        completionReceipts: receiptRows.length,
        receiptMatchesResult:
          receiptRows.length === 1 &&
          api.encodePreviewBackup(receiptRows[0].result) ===
          api.encodePreviewBackup(retries[0])
      };
    } finally {
      IDBObjectStore.prototype.put = originalPut;
      IDBObjectStore.prototype.add = originalAdd;
      store.close();
    }
  });

  assert.equal(out.quotaHits, 1);
  assert.equal(out.quotaCode, 'STORAGE_QUOTA');
  assert.equal(out.unchangedAfterQuota, true,
    'Failed quota completion preserves every store, including draft and receipts');

  assert.equal(out.receiptSuccessSeen, true);
  assert.equal(out.abortInjectionError, null);
  assert.equal(out.abortCode, 'TRANSACTION_ABORTED');
  assert.equal(out.completionResolvedDespiteAbort, false,
    'Receipt request success must not resolve completion before transaction commit');
  assert.equal(out.unchangedAfterAbort, true,
    'Abort after receipt request success rolls back every store');

  assert.deepEqual(out.retries[0], out.retries[1]);
  assert.deepEqual(out.replay, out.retries[0]);
  assert.equal(out.cycles, 1);
  assert.equal(out.draft, null);
  assert.equal(out.intentionRevisionDelta, 1);
  assert.equal(out.workspaceRevisionDelta, 1);
  assert.equal(out.operationCountDelta, 1);
  assert.equal(out.completionReceipts, 1);
  assert.equal(out.receiptMatchesResult, true);
});
  await browserCase(browser, profile, origin, 'real-file-history-draft-and-en-reload', async page => {
    const first = await create(page, 'FILE-HISTORY', true);
    await finish(page, first.intentKey, 'FILE-HISTORY-EVENT');

    const second = await create(page, 'FILE-DRAFT', true);
    await page.locator('#desire').fill('4');
    await page.locator('#actions').fill('FILE-PARTIAL-DRAFT');
    await eventually(
      () => state(page),
      data => data.drafts.some(draft =>
        draft?.intentKey === second.intentKey &&
        draft.values.iep?.desire === 4 &&
        draft.values.iep?.actions === 'FILE-PARTIAL-DRAFT'),
      'Partial draft is committed before export'
    );

    await page.locator('#navData').click();
    await page.locator('#exportBackup').waitFor();
    const before = await state(page);
    const originalKeys = new Set(before.records.map(row => row.intentKey));
    const originalDrafts = before.drafts.filter(Boolean);
    assert.equal(before.records.length, 2);
    assert.equal(originalDrafts.length, 1);
    assert.equal(
      before.records.find(row => row.intentKey === first.intentKey)
        .sourceEnvelope.intent.cycles.length,
      1
    );

    const downloaded = page.waitForEvent('download');
    await page.locator('#exportBackup').click();
    const download = await downloaded;
    const chunks = [];
    for await (const chunk of await download.createReadStream()) chunks.push(chunk);
    const bytes = Buffer.concat(chunks);
    assert.ok(bytes.length > 100);
    fs.writeFileSync(
      path.join(RESULTS, profile.name + '-history-and-draft-actual-backup.json'),
      bytes
    );

    await page.locator('#importBackup').setInputFiles({
      name: download.suggestedFilename(),
      mimeType: 'application/json',
      buffer: bytes
    });
    await page.locator('#importStatus[data-state="success"]').waitFor();
    const imported = await eventually(
      () => state(page),
      data => data.records.length === 4,
      'Actual file restores history and partial draft as copies'
    );
    const copies = imported.records.filter(row => !originalKeys.has(row.intentKey));
    assert.equal(copies.length, 2);
    assert.equal(new Set(imported.records.map(row => row.intentKey)).size, 4);

    for (const original of before.records) {
      const retained = imported.records.find(row => row.intentKey === original.intentKey);
      assert.deepEqual(retained, original, 'Existing intention is unchanged');
      const copy = copies.find(row =>
        row.sourceEnvelope.intent.id === original.sourceEnvelope.intent.id);
      assert.ok(copy, 'A copied owner exists for each exported intention');
      assert.notEqual(copy.intentKey, original.intentKey);
      assert.deepEqual(copy.sourceEnvelope, original.sourceEnvelope,
        'Full source envelope, including completed history, round-trips');

      const originalDraft = originalDrafts.find(draft => draft.intentKey === original.intentKey);
      const copiedDraft = imported.drafts.find(draft => draft?.intentKey === copy.intentKey);
      if (originalDraft) {
        assert.ok(copiedDraft);
        assert.notEqual(copiedDraft.intentKey, originalDraft.intentKey);
        assert.notEqual(copiedDraft.draftId, originalDraft.draftId);
        assert.equal(copiedDraft.kind, originalDraft.kind);
        assert.equal(copiedDraft.step, originalDraft.step);
        assert.equal(copiedDraft.basedOnIntentRevision, copy.revision);
        assert.deepEqual(copiedDraft.values, originalDraft.values,
          'Partial answers and explicit-answer markers round-trip exactly');
        assert.deepEqual(
          imported.drafts.find(draft => draft?.intentKey === original.intentKey),
          originalDraft,
          'Existing draft is unchanged'
        );
      } else {
        assert.equal(copiedDraft, undefined, 'Completed owner gains no invented draft');
      }
    }
    assert.equal(imported.drafts.filter(Boolean).length, 2);
    assert.equal(
      new Set(imported.drafts.filter(Boolean).map(draft => draft.draftId)).size,
      2
    );

    const historyCopy = copies.find(row =>
      row.sourceEnvelope.intent.id === first.sourceEnvelope.intent.id);
    await openIntent(page, historyCopy.intentKey);
    assert.equal(await page.locator('.history-item').count(), 1);
    assert.ok((await page.locator('.history-item').textContent())
      .includes('FILE-HISTORY-EVENT'));

    const draftCopy = copies.find(row =>
      row.sourceEnvelope.intent.id === second.sourceEnvelope.intent.id);
    await openIntent(page, draftCopy.intentKey);
    await resume(page);
    assert.equal(await page.locator('#desire').inputValue(), '4');
    assert.equal(await page.locator('#actions').inputValue(), 'FILE-PARTIAL-DRAFT');
    assert.equal(await page.locator('#belief').inputValue(), '');

    await page.locator('#navData').click();
    await page.locator('#exportBackup').waitFor();
    const beforeLanguageChange = await serializedState(page);
    await page.locator('#langToggle').click();
    await page.waitForFunction(() => document.documentElement.lang === 'en');
    assert.equal(await page.locator('#navHome').textContent(), 'Intentions');
    assert.equal(await page.locator('#navData').textContent(), 'Data');
    assert.equal(await page.locator('#exportBackup').textContent(), 'Download backup');

    await page.reload({waitUntil: 'networkidle'});
    await page.locator('#addIntention').waitFor();
    assert.equal(await page.locator('html').getAttribute('lang'), 'en');
    assert.equal(await page.locator('main h1').textContent(), 'My intentions');
    assert.equal(await page.locator('#navHome').textContent(), 'Intentions');
    assert.equal(await page.locator('#navData').textContent(), 'Data');
    assert.equal(await serializedState(page), beforeLanguageChange,
      'Locale persistence does not alter business data');
  });
}
async function main() {
  fs.mkdirSync(RESULTS, {recursive: true});
  report.previewDigest=JSON.parse(fs.readFileSync(path.join(ROOT,'preview-build.json'),'utf8')).digest;
  report.selectedCaseFilter=process.env.PREVIEW_CASES||null;
  const sourceBytes = fs.readFileSync(SOURCE), copied = fs.readFileSync(path.join(DIST, 'foundation.mjs'));
  assert.deepEqual(copied, sourceBytes, 'Preview foundation is an exact byte copy');
  report.foundationSha256 = hash(copied); report.sourceFoundationPath = SOURCE;
  for (const type of ['chromium', 'webkit']) {const file = playwright[type].executablePath(); report.browserAvailability[type] = {executable: file, exists: fs.existsSync(file)};}
  const server = staticServer(); await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = 'http://127.0.0.1:' + server.address().port; report.origin = origin;
  const requested = (process.env.PREVIEW_PROFILES || 'desktop,samsung,iphone-webkit').split(',');
  try {
    for (const name of requested) {
      const webkit = name === 'iphone-webkit'; const type = webkit ? playwright.webkit : playwright.chromium;
      let executablePath = type.executablePath(), engine = webkit ? 'Pinned Playwright WebKit' : 'Pinned Playwright Chromium';
      if (!fs.existsSync(executablePath)) {
        if (!webkit && fs.existsSync(EDGE)) {executablePath = EDGE; engine = 'Installed Microsoft Edge Chromium fallback';}
        else {report.results.push({profile: name, name: 'browser-availability', status: 'ENVIRONMENT_BLOCKED', reason: executablePath + ' is absent; no substitute labeled WebKit'}); continue;}
      }
      const device = webkit ? playwright.devices['iPhone 13'] : name === 'samsung' ? playwright.devices['Galaxy S9+'] : {viewport: {width: 1280, height: 900}};
      const {defaultBrowserType, ...settings} = device;
      const profile = {name, engine, context: {...settings, locale: 'ru-RU'}, emulation: name !== 'desktop'};
      const browser = await type.launch({headless: true, executablePath});
      try {await runProfile(browser, profile, origin);} finally {await browser.close();}
    }
  } finally {await new Promise(resolve => server.close(resolve));}
  assert.deepEqual(fs.readFileSync(path.join(DIST, 'foundation.mjs')), sourceBytes, 'Browser tests never rewrite foundation');
}
main().catch(error => {report.fatal = error.stack || String(error); console.error(report.fatal); process.exitCode = 1;}).finally(() => {
  report.passed = report.results.filter(value => value.status === 'PASS').length;
  report.failed = report.results.filter(value => value.status === 'FAIL').length;
  report.blocked = report.results.filter(value => value.status === 'ENVIRONMENT_BLOCKED').length;
  report.status = report.fatal || report.failed ? 'FAIL' : report.blocked ? 'PARTIAL_ENVIRONMENT_BLOCKED' : 'PASS';
  fs.mkdirSync(RESULTS, {recursive: true}); fs.writeFileSync(path.join(RESULTS, 'MOBILE_PREVIEW_RESULT.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({status: report.status, passed: report.passed, failed: report.failed, blocked: report.blocked}));
  if (report.status === 'FAIL') process.exitCode = 1;
});
