'use strict';

// Private, real-browser qualification. No production page, service worker,
// installed user profile, or real user records are opened by this harness.
const {test, before, after} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const vm = require('node:vm');
const {createServer} = require('node:http');
const {randomUUID} = require('node:crypto');
const {chromium} = require('playwright');
const {fixture} = require('../browser-packaging/runtime-core/fixtures.cjs');

const ROOT = path.resolve(__dirname, '..');
const MODULE = path.join(__dirname, 'storage.mjs');
const legacy = () => fixture(2, Array(10).fill('Calm / contentment'));
const newIntent = () => ({...legacy(), intent: {...legacy().intent, cycles: []}});
let server, browser, context, page, origin;
const launchOptions = {headless: true};
if (process.env.PHEISI_BROWSER_EXECUTABLE)
  launchOptions.executablePath = process.env.PHEISI_BROWSER_EXECUTABLE;
const dbName = () => 'pheisi-test-' + randomUUID();
const operationId = () => randomUUID();

async function initialize(target) {
  await target.goto(origin);
  await target.evaluate(async () => {
    globalThis.foundation = await import('/storage.mjs');
    globalThis.dumpFoundation = name => new Promise((resolve, reject) => {
      const request = indexedDB.open(name);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result, names = [...db.objectStoreNames], data = {};
        const tx = db.transaction(names, 'readonly');
        tx.oncomplete = () => { db.close(); resolve(data); };
        tx.onabort = () => { db.close(); reject(tx.error); };
        for (const store of names) {
          const read = tx.objectStore(store).getAll();
          read.onsuccess = () => { data[store] = read.result; };
        }
      };
    });
  });
}
async function run(fn, args) { return page.evaluate(fn, args); }

before(async () => {
  server = createServer((req, res) => {
    if (req.url.split('?')[0] === '/storage.mjs') {
      res.writeHead(200, {'content-type': 'text/javascript; charset=utf-8', 'cache-control': 'no-store'});
      res.end(fs.readFileSync(MODULE));
    } else if (req.url === '/') {
      res.writeHead(200, {'content-type': 'text/html; charset=utf-8'});
      res.end('<!doctype html><meta charset="utf-8"><title>Private storage qualification</title>');
    } else { res.writeHead(404); res.end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  origin = 'http://127.0.0.1:' + server.address().port;
  browser = await chromium.launch(launchOptions);
  console.log('Browser: ' + browser.version() + '; driver: ' + require('playwright/package.json').version);
  context = await browser.newContext();
  page = await context.newPage();
  await initialize(page);
});
after(async () => {
  await context?.close();
  await browser?.close();
  if (server) await new Promise(resolve => server.close(resolve));
});

test('FND-01: module import performs no storage or analytics operations', async () => {
  const other = await context.newPage();
  try {
    await other.goto(origin);
    assert.deepEqual(await other.evaluate(async () => {
      const touched = [];
      for (const name of ['indexedDB', 'localStorage', 'sessionStorage', 'PHEISIRAETHA_ANALYTICS_V1'])
        Object.defineProperty(globalThis, name, {configurable: true, get() { touched.push(name); throw Error(name); }});
      await import('/storage.mjs?side-effects');
      return touched;
    }), []);
  } finally { await other.close(); }
});

test('FND-02: preserves complete legacy envelope, opaque fields, IDs, order and revisions', async () => {
  const value = legacy();
  value.intent.id = '';
  value.intent.cycles[0].id = value.intent.cycles[1].id = '';
  value.intent.cycles[0].intentional = 'unsure';
  value.intent.cycles[0].revision = {scope: 'An existing contradictory patch'};
  value.intent.ris.unknown = {text: 'العربية / עברית / русский / 日本語'};
  value.unknown = {keep: [null, false, 0, '']};
  const raw = JSON.stringify(value).replace('"unknown":{', '"__proto__":{"literal":"retained"},"unknown":{');
  const result = await run(async ({dbName, raw, op}) => {
    const store = await foundation.openStore({dbName});
    try {
      await store.captureLegacyBaseline({operationId: op, rawState: raw});
      const intentions = await store.listIntentions();
      const backup = await store.exportWorkspace();
      return {count: intentions.length, envelopeJSON: JSON.stringify(intentions[0].sourceEnvelope),
        ownProto: Object.hasOwn(intentions[0].sourceEnvelope.intent.ris, '__proto__'),
        backupJSON: JSON.stringify(backup), polluted: Object.prototype.literal ?? null};
    } finally { store.close(); }
  }, {dbName: dbName(), raw, op: operationId()});
  assert.equal(result.count, 1);
  assert.equal(result.ownProto, true);
  assert.deepEqual(JSON.parse(result.envelopeJSON), JSON.parse(raw));
  assert.equal(result.polluted, null);
  assert.ok(result.backupJSON.includes(JSON.stringify(raw)), 'Original raw JSON is exportable');
});

test('FND-03: equal and empty legacy IDs do not collide across separate imports', async () => {
  const value = legacy(); value.intent.id = '';
  const out = await run(async ({dbName, raw, ops}) => {
    const store = await foundation.openStore({dbName});
    try {
      for (const op of ops) await store.importLegacy({operationId: op, rawState: raw, mode: 'add-copy'});
      return await store.listIntentions();
    } finally { store.close(); }
  }, {dbName: dbName(), raw: JSON.stringify(value), ops: [operationId(), operationId()]});
  assert.equal(out.length, 2);
  assert.equal(new Set(out.map(x => x.intentKey)).size, 2);
  assert.ok(out.every(x => x.sourceEnvelope.intent.id === ''));
});

test('FND-04: retries are idempotent; reused operation IDs reject different commands', async () => {
  const out = await run(async ({dbName, value, op}) => {
    const store = await foundation.openStore({dbName});
    try {
      const first = await store.createIntention({operationId: op, sourceEnvelope: value});
      const second = await store.createIntention({operationId: op, sourceEnvelope: value});
      const before = await dumpFoundation(dbName);
      let conflict;
      try { await store.createIntention({operationId: op, sourceEnvelope: {...value, opaque: true}}); }
      catch (error) { conflict = error.code; }
      return {first, second, before, after: await dumpFoundation(dbName), conflict};
    } finally { store.close(); }
  }, {dbName: dbName(), value: newIntent(), op: operationId()});
  assert.deepEqual(out.first, out.second);
  assert.equal(out.conflict, 'IDEMPOTENCY_CONFLICT');
  assert.deepEqual(out.before, out.after);
});

test('FND-05: draft survives reload without changing completed cycles or legacy keys', async () => {
  const name = dbName();
  const seeded = await run(async ({dbName, value}) => {
    localStorage.setItem('pheisiraetha_v01', '{"literal":"legacy"}');
    localStorage.setItem('pheisiraetha_language_v01', 'he');
    localStorage.setItem('pheisiraetha_onboarding_v01', '1');
    const store = await foundation.openStore({dbName});
    try {
      const created = await store.createIntention({operationId: crypto.randomUUID(), sourceEnvelope: value});
      const record = (await store.listIntentions())[0];
      await store.saveDraft({operationId: crypto.randomUUID(), intentKey: record.intentKey,
        expectedIntentRevision: record.revision, expectedDraftRevision: null,
        draft: {kind: 'first', step: 2, values: {iep: {desire: null, actions: 'Незавершённый ответ'},
          answerStatus: {'iep.desire': 'unanswered', 'iep.actions': 'answered'}}}});
      return {intentKey: record.intentKey, created, draft: await store.readDraft(record.intentKey),
        keys: [localStorage.getItem('pheisiraetha_v01'), localStorage.getItem('pheisiraetha_language_v01'), localStorage.getItem('pheisiraetha_onboarding_v01')]};
    } finally { store.close(); }
  }, {dbName: name, value: newIntent()});
  await page.reload();
  await initialize(page);
  const restored = await run(async ({dbName, key}) => {
    const store = await foundation.openStore({dbName});
    try { return {draft: await store.readDraft(key), record: await store.readIntention(key),
      keys: [localStorage.getItem('pheisiraetha_v01'), localStorage.getItem('pheisiraetha_language_v01'), localStorage.getItem('pheisiraetha_onboarding_v01')]}; }
    finally { store.close(); }
  }, {dbName: name, key: seeded.intentKey});
  assert.deepEqual(restored.draft, seeded.draft);
  assert.equal(restored.record.sourceEnvelope.intent.cycles.length, 0);
  assert.deepEqual(restored.keys, seeded.keys);
});

test('FND-06: two concurrent connections cannot overwrite the same draft revision', async () => {
  const out = await run(async ({dbName, value}) => {
    const a = await foundation.openStore({dbName}), b = await foundation.openStore({dbName});
    try {
      await a.createIntention({operationId: crypto.randomUUID(), sourceEnvelope: value});
      const record = (await a.listIntentions())[0];
      const command = text => ({operationId: crypto.randomUUID(), intentKey: record.intentKey,
        expectedIntentRevision: record.revision, expectedDraftRevision: null,
        draft: {kind: 'first', step: 2, values: {text}}});
      const results = await Promise.allSettled([a.saveDraft(command('tab A')), b.saveDraft(command('tab B'))]);
      return {results: results.map(r => r.status === 'fulfilled' ? {status: r.status} : {status: r.status, code: r.reason.code}),
        draft: await a.readDraft(record.intentKey)};
    } finally { a.close(); b.close(); }
  }, {dbName: dbName(), value: newIntent()});
  assert.equal(out.results.filter(x => x.status === 'fulfilled').length, 1);
  assert.equal(out.results.find(x => x.status === 'rejected').code, 'REVISION_CONFLICT');
  assert.equal(out.draft.revision, 1);
});

test('FND-07: drafts and selection remain isolated between three intentions', async () => {
  const out = await run(async ({dbName, value}) => {
    const store = await foundation.openStore({dbName});
    try {
      for (let i = 0; i < 3; i++) await store.createIntention({operationId: crypto.randomUUID(), sourceEnvelope: value});
      const records = await store.listIntentions();
      for (let i = 0; i < records.length; i++) await store.saveDraft({operationId: crypto.randomUUID(),
        intentKey: records[i].intentKey, expectedIntentRevision: records[i].revision, expectedDraftRevision: null,
        draft: {kind: 'first', step: i + 1, values: {ownerAnswer: i}}});
      const before = await store.listIntentions();
      const workspace = await store.readWorkspace();
      await store.selectIntention({operationId: crypto.randomUUID(), expectedWorkspaceRevision: workspace.revision,
        intentKey: records[2].intentKey});
      return {before, after: await store.listIntentions(), drafts: await Promise.all(records.map(r => store.readDraft(r.intentKey))),
        workspace: await store.readWorkspace(), selected: records[2].intentKey};
    } finally { store.close(); }
  }, {dbName: dbName(), value: newIntent()});
  assert.deepEqual(out.before, out.after);
  assert.deepEqual(out.drafts.map(x => x.values.ownerAnswer), [0, 1, 2]);
  assert.equal(new Set(out.drafts.map(x => x.draftId)).size, 3);
  assert.equal(out.workspace.selectedIntentKey, out.selected);
});

test('FND-08: malformed/future legacy bytes are retained without synthetic records', async () => {
  for (const raw of ['{"version":', '{"version":"9.0","intent":null}', '{"version":"0.1.0","lang":"de","intent":null}', null]) {
    const out = await run(async ({dbName, raw}) => {
      const store = await foundation.openStore({dbName});
      try { const result = await store.captureLegacyBaseline({operationId: crypto.randomUUID(), rawState: raw});
        return {result, records: await store.listIntentions(), backup: await store.exportWorkspace()}; }
      finally { store.close(); }
    }, {dbName: dbName(), raw});
    assert.equal(out.records.length, 0);
    if (raw !== null) assert.ok(JSON.stringify(out.backup).includes(JSON.stringify(raw)));
  }
});

test('FND-09: later legacy writes are archived as conflicts, never applied over v2', async () => {
  const original = legacy(), later = legacy(); later.intent.ris.primary = 'Written by historical OFF';
  const out = await run(async ({dbName, original, later}) => {
    const store = await foundation.openStore({dbName});
    try {
      await store.captureLegacyBaseline({operationId: crypto.randomUUID(), rawState: original});
      const before = await store.listIntentions();
      const unchanged = await store.observeLegacyChange({operationId: crypto.randomUUID(), rawState: original});
      const conflict = await store.observeLegacyChange({operationId: crypto.randomUUID(), rawState: later});
      return {before, after: await store.listIntentions(), unchanged, conflict, backup: await store.exportWorkspace()};
    } finally { store.close(); }
  }, {dbName: dbName(), original: JSON.stringify(original), later: JSON.stringify(later)});
  assert.deepEqual(out.before, out.after);
  assert.equal(out.unchanged.status, 'unchanged');
  assert.equal(out.conflict.status, 'conflict');
  assert.ok(JSON.stringify(out.backup).includes('Written by historical OFF'));
});

test('FND-10: injected quota failure aborts prior writes and operation receipt', async () => {
  const out = await run(async ({dbName, value}) => {
    const store = await foundation.openStore({dbName});
    const before = await dumpFoundation(dbName);
    const add = IDBObjectStore.prototype.add, put = IDBObjectStore.prototype.put;
    let writes = 0, injected = false, failure;
    const wrap = original => function (...args) {
      if (this.transaction.mode === 'readwrite') {
        writes++;
        if (writes === 2) { injected = true; throw new DOMException('Private fault injection', 'QuotaExceededError'); }
      }
      return original.apply(this, args);
    };
    IDBObjectStore.prototype.add = wrap(add); IDBObjectStore.prototype.put = wrap(put);
    try { await store.createIntention({operationId: crypto.randomUUID(), sourceEnvelope: value}); }
    catch (error) { failure = {code: error.code, name: error.name}; }
    finally { IDBObjectStore.prototype.add = add; IDBObjectStore.prototype.put = put; }
    try { return {before, after: await dumpFoundation(dbName), injected, writes, failure}; }
    finally { store.close(); }
  }, {dbName: dbName(), value: newIntent()});
  assert.equal(out.injected, true);
  assert.ok(out.failure);
  assert.deepEqual(out.before, out.after);
});

test('FND-11: stale revisions and invalid owners reject without any writes', async () => {
  const out = await run(async ({dbName, value}) => {
    const store = await foundation.openStore({dbName});
    try {
      await store.createIntention({operationId: crypto.randomUUID(), sourceEnvelope: value});
      const record = (await store.listIntentions())[0], before = await dumpFoundation(dbName);
      const failures = [];
      for (const command of [
        () => store.saveDraft({operationId: crypto.randomUUID(), intentKey: record.intentKey, expectedIntentRevision: 999,
          expectedDraftRevision: null, draft: {kind: 'first', step: 2, values: {}}}),
        () => store.saveDraft({operationId: crypto.randomUUID(), intentKey: 'missing-owner', expectedIntentRevision: 1,
          expectedDraftRevision: null, draft: {kind: 'first', step: 2, values: {}}}),
        () => store.selectIntention({operationId: crypto.randomUUID(), expectedWorkspaceRevision: -1, intentKey: record.intentKey})
      ]) { try { await command(); } catch (e) { failures.push(e.code); } }
      return {failures, before, after: await dumpFoundation(dbName)};
    } finally { store.close(); }
  }, {dbName: dbName(), value: newIntent()});
  assert.equal(out.failures.length, 3);
  assert.deepEqual(out.before, out.after);
});

test('FND-12: draft update keeps stable identity; old operation replay cannot revert it', async () => {
  const out = await run(async ({dbName, value}) => {
    const store = await foundation.openStore({dbName});
    try {
      await store.createIntention({operationId: crypto.randomUUID(), sourceEnvelope: value});
      const record = (await store.listIntentions())[0];
      const initial = {operationId: crypto.randomUUID(), intentKey: record.intentKey, expectedIntentRevision: record.revision,
        expectedDraftRevision: null, draft: {kind: 'first', step: 2, values: {answer: 'A'}}};
      const first = await store.saveDraft(initial), draft1 = await store.readDraft(record.intentKey);
      await store.saveDraft({...initial, operationId: crypto.randomUUID(), expectedDraftRevision: draft1.revision,
        draft: {kind: 'first', step: 3, values: {answer: 'B'}}});
      const second = await store.readDraft(record.intentKey), receipt = await store.saveDraft(initial);
      return {first, receipt, draft1, second, after: await store.readDraft(record.intentKey)};
    } finally { store.close(); }
  }, {dbName: dbName(), value: newIntent()});
  assert.deepEqual(out.first, out.receipt);
  assert.equal(out.draft1.draftId, out.second.draftId);
  assert.equal(out.second.revision, 2);
  assert.deepEqual(out.second, out.after);
});

test('FND-13: inaccessible storage fails without localStorage fallback', async () => {
  const other = await context.newPage();
  try {
    await initialize(other);
    const out = await other.evaluate(async () => {
      const writes = [], original = IDBFactory.prototype.open;
      IDBFactory.prototype.open = function () { throw new DOMException('Private denial', 'SecurityError'); };
      const put = Storage.prototype.setItem;
      Storage.prototype.setItem = function (...args) { writes.push(args); throw Error('Forbidden fallback'); };
      let error;
      try { await foundation.openStore({dbName: 'private-denied'}); } catch (e) { error = e.code || e.name; }
      finally { IDBFactory.prototype.open = original; Storage.prototype.setItem = put; }
      return {writes, error};
    });
    assert.deepEqual(out.writes, []);
    assert.ok(out.error);
  } finally { await other.close(); }
});

test('FND-14: a future database/schema is never reset or overwritten', async () => {
  const out = await run(async ({dbName}) => {
    await new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName, 99);
      request.onupgradeneeded = () => request.result.createObjectStore('future').put('keep', 'record');
      request.onsuccess = () => { request.result.close(); resolve(); };
      request.onerror = () => reject(request.error);
    });
    let failure;
    try { const store = await foundation.openStore({dbName}); store.close(); } catch (error) { failure = error.code || error.name; }
    const preserved = await new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName);
      request.onsuccess = () => {
        const db = request.result, read = db.transaction('future').objectStore('future').get('record');
        read.onsuccess = () => { resolve({version: db.version, value: read.result}); db.close(); };
      };
      request.onerror = () => reject(request.error);
    });
    return {failure, preserved};
  }, {dbName: dbName()});
  assert.ok(out.failure);
  assert.deepEqual(out.preserved, {version: 99, value: 'keep'});
});

test('FND-15: offline writes and reopen require no network access', async () => {
  await context.setOffline(true);
  try {
    const out = await run(async ({dbName, value}) => {
      const store = await foundation.openStore({dbName});
      await store.createIntention({operationId: crypto.randomUUID(), sourceEnvelope: value});
      store.close();
      const reopened = await foundation.openStore({dbName});
      try { return await reopened.listIntentions(); } finally { reopened.close(); }
    }, {dbName: dbName(), value: newIntent()});
    assert.equal(out.length, 1);
  } finally { await context.setOffline(false); }
});

test('FND-16: legacy classification matches actual historical validator acceptance', async () => {
  const source = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
  const start = source.indexOf('  const RIS_FIELDS = '), end = source.indexOf('  let state = load();');
  assert.ok(start > 0 && end > start);
  const validate = vm.runInNewContext('(function(){const APP_VERSION="0.1.0";\n' + source.slice(start, end) + '\nreturn isValidBackup;})()');
  const bank = [legacy(), newIntent(), {version: '0.1.0', lang: 'ru', intent: null}];
  const duplicate = legacy(); duplicate.intent.cycles[0].id = duplicate.intent.cycles[1].id = '';
  duplicate.intent.cycles[0].intentional = 'unsure'; duplicate.intent.cycles[0].revision = {primary: 'conflict'};
  bank.push(duplicate);
  bank.push(JSON.parse('{"version":"0.1.0","lang":"ru","intent":null,"opaque":1e400}'));
  for (const mutate of [v => {v.lang = 'de';}, v => {v.intent.cycles[0].iep.desire = '7';},
    v => {v.intent.cycles[0].oop.evidence = ['bogus'];}, v => {v.intent.cycles[0].revision = {bogus: 'x'};},
    v => {v.intent.createdAt = 'invalid';}, v => {delete v.intent.ris.scope;}]) {const v = legacy(); mutate(v); bank.push(v);}
  const rawBank = bank.map(value => JSON.stringify(value));
  rawBank[4] = '{"version":"0.1.0","lang":"ru","intent":null,"opaque":1e400}';
  const observed = await run(raws => raws.map(raw => foundation.classifyLegacy(raw).classification), rawBank);
  for (let i = 0; i < bank.length; i++) {
    assert.equal(observed[i] === 'valid-v1', validate(JSON.parse(rawBank[i])), 'Historical acceptance case ' + i);
  }
});

test('FND-17: records persist across a real browser process restart', async () => {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'pheisi-private-storage-'));
  const name = dbName();
  let persistent;
  try {
    persistent = await chromium.launchPersistentContext(profile, launchOptions);
    let target = persistent.pages()[0]; await initialize(target);
    await target.evaluate(async ({dbName, value}) => {
      const store = await foundation.openStore({dbName});
      try { await store.createIntention({operationId: crypto.randomUUID(), sourceEnvelope: value}); }
      finally { store.close(); }
    }, {dbName: name, value: newIntent()});
    await persistent.close(); persistent = null;
    persistent = await chromium.launchPersistentContext(profile, launchOptions);
    target = persistent.pages()[0]; await initialize(target);
    const records = await target.evaluate(async dbName => {
      const store = await foundation.openStore({dbName});
      try { return await store.listIntentions(); } finally { store.close(); }
    }, name);
    assert.equal(records.length, 1);
  } finally {
    await persistent?.close();
    // Only the fresh harness-owned temp profile is removed.
    const resolved = fs.realpathSync(profile), temp = fs.realpathSync(os.tmpdir());
    assert.equal(path.dirname(resolved).toLowerCase(), temp.toLowerCase());
    assert.ok(path.basename(resolved).startsWith('pheisi-private-storage-'));
    fs.rmSync(resolved, {recursive: true});
  }
});

test('FND-18: abort after receipt write rolls back all stores; retry succeeds exactly once', async () => {
  const out = await run(async ({dbName, value, op}) => {
    const store = await foundation.openStore({dbName});
    const before = await dumpFoundation(dbName), add = IDBObjectStore.prototype.add;
    let receiptSucceeded = false, failure;
    IDBObjectStore.prototype.add = function (...args) {
      const request = add.apply(this, args);
      if (this.name === 'operations') {
        const tx = this.transaction;
        request.addEventListener('success', () => { receiptSucceeded = true; tx.abort(); });
      }
      return request;
    };
    try { await store.createIntention({operationId: op, sourceEnvelope: value}); }
    catch (error) { failure = error.code; }
    finally { IDBObjectStore.prototype.add = add; }
    try {
      const afterAbort = await dumpFoundation(dbName);
      const result = await store.createIntention({operationId: op, sourceEnvelope: value});
      const replay = await store.createIntention({operationId: op, sourceEnvelope: value});
      return {before, afterAbort, receiptSucceeded, failure, result, replay, final: await dumpFoundation(dbName)};
    } finally { store.close(); }
  }, {dbName: dbName(), value: newIntent(), op: operationId()});
  assert.equal(out.receiptSucceeded, true);
  assert.equal(out.failure, 'TRANSACTION_ABORTED');
  assert.deepEqual(out.afterAbort, out.before);
  assert.deepEqual(out.result, out.replay);
  assert.equal(out.final.intentions.length, 1);
  assert.equal(out.final.operations.length, 1);
  assert.equal(out.final.meta[0].revision, 1);
});

test('FND-19: future business schema in any store is preserved and blocks mutations', async () => {
  for (const storeName of ['meta', 'intentions', 'drafts', 'legacySnapshots', 'operations']) {
    const out = await run(async ({dbName, value, storeName}) => {
      const store = await foundation.openStore({dbName});
      await store.captureLegacyBaseline({operationId: crypto.randomUUID(), rawState: JSON.stringify(value)});
      const record = (await store.listIntentions())[0];
      await store.saveDraft({operationId: crypto.randomUUID(), intentKey: record.intentKey,
        expectedIntentRevision: record.revision, expectedDraftRevision: null,
        draft: {kind: 'first', step: 2, values: {}}});
      await new Promise((resolve, reject) => {
        const open = indexedDB.open(dbName);
        open.onsuccess = () => {
          const db = open.result, tx = db.transaction(storeName, 'readwrite'), os = tx.objectStore(storeName);
          const read = os.getAll();
          read.onsuccess = () => os.put({...read.result[0], schemaVersion: 3});
          tx.oncomplete = () => { db.close(); resolve(); };
          tx.onabort = () => { db.close(); reject(tx.error); };
        };
      });
      const before = await dumpFoundation(dbName);
      let failure, reopenFailure;
      try { await store.createIntention({operationId: crypto.randomUUID(), sourceEnvelope: value}); }
      catch (error) { failure = error.code; }
      store.close();
      try { const reopened = await foundation.openStore({dbName}); reopened.close(); }
      catch (error) { reopenFailure = error.code; }
      return {before, after: await dumpFoundation(dbName), failure, reopenFailure};
    }, {dbName: dbName(), value: newIntent(), storeName});
    assert.equal(out.failure, 'UNSUPPORTED_SCHEMA', storeName);
    assert.equal(out.reopenFailure, 'UNSUPPORTED_SCHEMA', storeName);
    assert.deepEqual(out.before, out.after, storeName);
  }
});

test('FND-20: detached data retains signed zero and parse-accepted opaque overflow', async () => {
  const value = newIntent();
  const raw = JSON.stringify(value).replace('"version":', '"opaqueOverflow":1e400,"opaqueNegative":-1e400,"opaqueZero":-0,"version":');
  const out = await run(async ({dbName, raw}) => {
    const store = await foundation.openStore({dbName});
    try {
      await store.captureLegacyBaseline({operationId: crypto.randomUUID(), rawState: raw});
      const first = (await store.listIntentions())[0];
      const checks = value => ({positive: value.opaqueOverflow === Infinity, negative: value.opaqueNegative === -Infinity,
        signedZero: Object.is(value.opaqueZero, -0)});
      const retained = checks(first.sourceEnvelope);
      first.sourceEnvelope.intent.ris.primary = 'Only the detached caller object changed';
      const second = await store.readIntention(first.intentKey), backup = await store.exportWorkspace();
      return {retained, exported: checks(backup.intentions[0].sourceEnvelope), secondTitle: second.sourceEnvelope.intent.ris.primary,
        raw: backup.legacySnapshots[0].rawState};
    } finally { store.close(); }
  }, {dbName: dbName(), raw});
  assert.deepEqual(out.retained, {positive: true, negative: true, signedZero: true});
  assert.deepEqual(out.exported, out.retained);
  assert.equal(out.secondTitle, value.intent.ris.primary);
  assert.equal(out.raw, raw);
});

test('FND-21: draft kind and base revision cannot silently change', async () => {
  const out = await run(async ({dbName, value}) => {
    const store = await foundation.openStore({dbName});
    try {
      await store.createIntention({operationId: crypto.randomUUID(), sourceEnvelope: value});
      const record = (await store.listIntentions())[0], before = await dumpFoundation(dbName);
      let error;
      try { await store.saveDraft({operationId: crypto.randomUUID(), intentKey: record.intentKey,
        expectedIntentRevision: record.revision, expectedDraftRevision: null,
        draft: {kind: 'progress', step: 2, values: {}}}); }
      catch (failure) { error = failure.code; }
      return {error, before, after: await dumpFoundation(dbName)};
    } finally { store.close(); }
  }, {dbName: dbName(), value: newIntent()});
  assert.equal(out.error, 'DRAFT_KIND_CONFLICT');
  assert.deepEqual(out.before, out.after);
});
