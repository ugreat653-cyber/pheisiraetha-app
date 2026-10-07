'use strict';

// S2: public production controls and observation in an actual Chromium DOM.
// Run node --check, commit this file, require a clean tree, THEN node --test.
// S1 alone owns routing, the in-memory OFF -> ON change, artifact injection,
// request accounting, Chromium selection, and infrastructure cleanup.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');
const harness = require('./real-browser-harness.cjs');
const fixtures = require('../runtime-core/fixtures.cjs');

const ACCEPTED_HARNESS = '9f327acae82054d2b9a28ea6f05ac48c53c65d71';
const PRODUCTION_CHECKPOINT = '0593d4b62f30c978260c6a15ff54323bc1351cbd';
const MAIN = '255a5d9d27461dcacaebc1bc80ab322dd54b4de8';
const THIS_FILE = 'browser-packaging/integration/real-browser.test.cjs';
const HARNESS_FILE = 'browser-packaging/integration/real-browser-harness.cjs';
const STORAGE = 'pheisiraetha_v01';
const LANGUAGE = 'pheisiraetha_language_v01';
const ONBOARDING = 'pheisiraetha_onboarding_v01';
const HOST = '#app > .shell > main > #analyticsHost';
const FALLBACK = 'No interpretation or next focus is shown here.';
const labels = Array(10).fill('Calm / contentment');
const LOCALE_ORDER = Object.freeze([
  'en', 'de', 'ru', 'fr', 'es', 'it', 'pt', 'nl', 'pl', 'uk', 'cs', 'sk',
  'hu', 'ro', 'bg', 'el', 'tr', 'sv', 'no', 'da', 'fi', 'ar', 'he', 'hi',
  'zh', 'ja', 'ko', 'id', 'ms', 'th', 'vi'
]);
// Nonpublic raw/stale values stored only as opaque fixture data. These exact
// markers must never become body, metadata, comment, hidden, or debug copies.
const RAW_SENTINELS = Object.freeze({
  raw: '__S2_RAW_INTERPRETATION_73c4__',
  focus: '__S2_RAW_NEXT_FOCUS_82e5__',
  why: '__S2_RAW_WHY_THIS_FOCUS_19b6__',
  debug: '__S2_RAW_DEBUG_44a8__',
  stale: '__S2_STALE_APPROVED_BODY_35d7__'
});

function git(...args) {
  return execFileSync('git', ['--no-optional-locks', ...args], { cwd: harness.ROOT });
}

function captureS2Repository() {
  const production = harness.captureRepositoryState();
  const head = production.head;
  assert.equal(git('show', '-s', '--format=%P', head).toString('utf8').trim(),
    ACCEPTED_HARNESS, 'S2 must have exactly the accepted S1 commit as its sole parent');
  assert.equal(git('diff', '--name-status', ACCEPTED_HARNESS, head).toString('utf8'),
    `A\t${THIS_FILE}\n`, 'S2 must add only real-browser.test.cjs');
  assert.equal(harness.EXPECTED_BASE_HEAD, PRODUCTION_CHECKPOINT);
  assert.equal(git('rev-parse', 'main').toString('utf8').trim(), MAIN);
  assert.deepEqual(fs.readFileSync(path.join(harness.ROOT, HARNESS_FILE)),
    git('show', `${ACCEPTED_HARNESS}:${HARNESS_FILE}`), 'Accepted S1 harness bytes');
  // Include every tracked byte, including verifier, runtime, facade, artifacts,
  // and S1/S2 infrastructure, beyond S1's explicit production protection list.
  const tracked = git('ls-files', '-z').toString('utf8').split('\0').filter(Boolean);
  const hashes = Object.fromEntries(tracked.map(file =>
    [file, harness.sha256(fs.readFileSync(path.join(harness.ROOT, file)))]));
  return { head, production, hashes };
}

function assertS2RepositoryUnchanged(before) {
  harness.assertRepositoryUnchanged(before.production);
  assert.deepEqual(captureS2Repository(), before,
    'HEAD, index/worktree/untracked, or a tracked/protected byte changed');
}

function actualDto(source) {
  // Execute the exact already committed artifact, never a substitute facade,
  // hard-coded approved prose, rebuilt bundle, or invented boundary DTO.
  const sourceBefore = structuredClone(source);
  const artifact = harness.readExactArtifact();
  const realm = vm.createContext(Object.create(null),
    { codeGeneration: { strings: false, wasm: false } });
  realm.inputJSON = JSON.stringify(sourceBefore);
  try {
    vm.runInContext(artifact.toString('utf8'), realm, { timeout: 10000 });
    return structuredClone(vm.runInContext(
      'PHEISIRAETHA_ANALYTICS_V1.evaluate(JSON.parse(inputJSON))', realm, { timeout: 10000 }));
  } finally {
    assert.deepEqual(source, sourceBefore, 'Exact-artifact oracle must not mutate original source');
  }
}

function committedLocales() {
  const realm = vm.createContext({ window: Object.create(null) });
  vm.runInContext(fs.readFileSync(path.join(harness.ROOT, 'locales.js'), 'utf8'),
    realm, { timeout: 10000 });
  assert.deepEqual(Object.keys(realm.window.PHEISIRAETHA_LOCALES), LOCALE_ORDER,
    'Committed locales.js keys must match the frozen exact locale order');
  return Object.entries(realm.window.PHEISIRAETHA_LOCALES).map(([code, locale]) => ({
    code, htmlLang: locale.htmlLang, dir: locale.dir,
    recommended: locale.translations.recommended,
    imported: locale.translations.imported,
    deleteConfirm: locale.translations.deleteConfirm,
    cancelCheckinConfirm: locale.translations.cancelCheckinConfirm
  }));
}

const bodiesOf = dto => dto.components.map(component => component.text);

async function seedBeforeProduction(session, source, language = 'en') {
  await session.context.addInitScript(({ origin, stateJSON, language, keys }) => {
    if (location.origin !== origin) return;
    localStorage.setItem(keys.state, stateJSON);
    localStorage.setItem(keys.language, language);
    localStorage.setItem(keys.onboarding, '1');
  }, { origin: session.origin, stateJSON: JSON.stringify(source), language,
    keys: { state: STORAGE, language: LANGUAGE, onboarding: ONBOARDING } });
}

async function openProduction(session, page, analyticsEnabled, expectShell = true) {
  page.setDefaultTimeout(15000);
  page.setDefaultNavigationTimeout(20000);
  // Read this single payload to prove its exact bytes. Do not register another
  // network log, route, request/response listener, or competing failure classifier.
  const responsePromise = page.waitForResponse(response => {
    const url = new URL(response.url());
    return url.origin === session.origin && url.pathname === '/app.js';
  });
  const [documentResponse, appResponse] = await Promise.all([
    page.goto(session.origin + '/', { waitUntil: 'load' }), responsePromise
  ]);
  assert.equal(documentResponse.status(), 200, 'Normal production document response');
  assert.equal(appResponse.status(), 200, 'Normal app.js response status');
  assert.equal(await appResponse.finished(), null, 'app.js must terminate successfully');
  const source = fs.readFileSync(path.join(harness.ROOT, 'app.js'));
  assert.deepEqual(await appResponse.body(), analyticsEnabled ? harness.enableAppJs(source) : source,
    analyticsEnabled ? 'Exact single-flag in-memory app.js response' : 'Untouched production OFF app.js response');
  // Allow the actual production launch overlay/timer to finish; no bypass hook.
  await page.waitForFunction(() => !document.body.classList.contains('is-launching'));
  if (expectShell) assert.equal(await page.locator('#app > .shell').count(), 1, 'Normal PWA shell');
}

function assertRequestEvidence(session, server, analyticsEnabled) {
  session.assertHealthy(); // close() has already drained S1's route handlers.
  const requests = session.requestLog;
  const appRequests = requests.filter(entry => new URL(entry.url).pathname === '/app.js');
  assert.equal(appRequests.length, 1, 'Exactly one production app.js request per page');
  assert.equal(requests.filter(entry => entry.transformed).length, analyticsEnabled ? 1 : 0,
    'Exactly the expected transformed app.js delivery');
  assert.equal(requests.filter(entry => entry.transformationPrepared).length, analyticsEnabled ? 1 : 0,
    'Exactly the expected in-memory app.js transformation');
  const app = appRequests[0];
  assert.equal(app.method, 'GET');
  assert.equal(app.status, 200);
  assert.equal(app.outcome, 'finished', 'Terminal successful app.js request evidence');
  assert.equal(app.error, null);
  assert.equal(app.blocked, false);
  assert.equal(app.transformed, analyticsEnabled);
  if (analyticsEnabled) {
    const source = fs.readFileSync(path.join(harness.ROOT, 'app.js'));
    assert.equal(app.sourceSha256, harness.sha256(source));
    assert.equal(app.enabledSha256, harness.sha256(harness.enableAppJs(source)));
  }
  for (const entry of requests) {
    assert.equal(new URL(entry.url).origin, session.origin,
      `Unexpected external request: ${entry.url}`);
    assert.equal(entry.blocked, false, 'Ordinary resources must use the private origin');
    // S1 is the sole classifier of authenticated teardown failures. Preserve its
    // raw evidence; only app.js has the stricter successful-delivery contract.
    assert.notEqual(entry.outcome, 'pending', `Non-terminal resource evidence: ${entry.url}`);
    assert.equal(/\/analytics-v1\.[^/]+\.js$/.test(new URL(entry.url).pathname), false,
      'Analytics artifact must never be requested over HTTP');
  }
  for (const entry of server.requestLog) {
    assert.equal(new URL(entry.url).origin, server.origin);
    assert.equal(entry.error, null, 'Private HTTP server resource error');
    assert.notEqual(entry.resource, harness.ARTIFACT_PATH,
      'Artifact injection must not create an HTTP artifact request');
    assert.equal(/\/analytics-v1\.[^/]+\.js$/.test(new URL(entry.url).pathname), false);
  }
  assert.ok(requests.some(entry => new URL(entry.url).pathname === '/locales.js'),
    'Actual production locale script requested');
  assert.ok(requests.some(entry => new URL(entry.url).pathname === '/app.css'),
    'Actual production stylesheet requested');
}

function forbiddenStoredFields(value, prefix = '') {
  if (value === null || typeof value !== 'object') return [];
  const found = [];
  for (const [key, child] of Object.entries(value)) {
    const location = `${prefix}/${key}`;
    if (/analytics|dto|generation|approval|interpretation|next[_-]?focus|whythisfocus/i.test(key))
      found.push(location);
    found.push(...forbiddenStoredFields(child, location));
  }
  return found;
}

async function assertStorage(page, context, expectedBytes, language = 'en') {
  const stored = await page.evaluate(() => {
    const entries = storage => Object.fromEntries(Array.from({ length: storage.length }, (_, i) => {
      const key = storage.key(i);
      return [key, storage.getItem(key)];
    }));
    return { local: entries(localStorage), session: entries(sessionStorage), cookie: document.cookie };
  });
  const expected = { [LANGUAGE]: language, [ONBOARDING]: '1' };
  if (expectedBytes !== null) expected[STORAGE] = expectedBytes;
  assert.deepEqual(stored.local, expected,
    'Exact production keys/bytes; language preference is the only permitted locale write');
  assert.deepEqual(stored.session, {}, 'No analytics sessionStorage persistence');
  assert.equal(stored.cookie, '', 'No document cookie persistence');
  assert.deepEqual(await context.cookies(), [], 'No analytics/context cookie persistence');
  if (expectedBytes !== null) {
    assert.deepEqual(forbiddenStoredFields(JSON.parse(stored.local[STORAGE])), [],
      'No DTO/generation/approval/interpretation/next-focus/analytics fields in stored state');
  }
  return stored;
}

async function assertLanguage(page, locale) {
  assert.deepEqual(await page.evaluate(() => ({
    lang: document.documentElement.lang, dir: document.documentElement.dir,
    shellDir: getComputedStyle(document.querySelector('#app > .shell')).direction
  })), { lang: locale.htmlLang, dir: locale.dir, shellDir: locale.dir },
  `Actual document/shell locale ${locale.code}`);
}

async function assertAnalytics(page, dto, locale) {
  const texts = bodiesOf(dto);
  const surface = await page.evaluate(({ selector, texts }) => {
    const host = document.querySelector(selector);
    const root = host?.firstElementChild;
    const paragraphs = root ? [...root.children] : [];
    const attrs = node => node ? Object.fromEntries([...node.attributes].map(a => [a.name, a.value])) : null;
    const visible = node => {
      if (!node?.isConnected) return false;
      const rect = node.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return false;
      for (let current = node; current; current = current.parentElement) {
        const style = getComputedStyle(current);
        if (current.hidden || current.inert || current.getAttribute('aria-hidden') === 'true' ||
            style.display === 'none' || style.visibility === 'hidden' || style.visibility === 'collapse' ||
            Number(style.opacity) === 0 || style.contentVisibility === 'hidden' ||
            [...current.classList].some(c => /^(sr-only|visually-hidden|screen-reader-only)$/i.test(c))) return false;
      }
      return true;
    };
    const leaks = [];
    const uniqueTexts = [...new Set(texts)];
    const occurrences = Object.fromEntries(uniqueTexts.map(text => [text, 0]));
    const walker = document.createTreeWalker(document, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_COMMENT);
    let node;
    while ((node = walker.nextNode())) {
      for (const text of uniqueTexts) {
        if (!node.data.includes(text)) continue;
        if (node.nodeType === Node.COMMENT_NODE) leaks.push({ kind: 'comment', text });
        else {
          occurrences[text]++;
          if (!root?.contains(node) || node.parentElement?.tagName !== 'P' ||
              node.data !== text || !visible(node.parentElement))
            leaks.push({ kind: 'text outside intended visible paragraph', text });
        }
      }
    }
    for (const element of document.querySelectorAll('*')) {
      const outside = host && !host.contains(element) && !element.contains(host);
      if (outside && uniqueTexts.some(text => element.textContent.includes(text)))
        leaks.push({ kind: 'outside/hidden aggregate copy', tag: element.tagName });
      for (const attribute of element.attributes) {
        if (uniqueTexts.some(text => attribute.value.includes(text)))
          leaks.push({ kind: 'attribute prose', attribute: attribute.name, tag: element.tagName });
      }
    }
    const analyticalElements = host ? [host, ...host.querySelectorAll('*')] : [];
    return {
      hostCount: document.querySelectorAll('#analyticsHost').length,
      hostAttrs: attrs(host), hostNodes: host?.childNodes.length,
      nextIsFinalNotice: !!host && host.nextElementSibling === host.parentElement.lastElementChild &&
        host.nextElementSibling.matches('.notice.smalltext'),
      noticeText: host?.nextElementSibling?.textContent,
      rootTag: root?.tagName, rootAttrs: attrs(root), rootVisible: visible(root),
      rootComputedDirection: root ? getComputedStyle(root).direction : null,
      rootNodes: root?.childNodes.length, tags: paragraphs.map(p => p.tagName),
      texts: paragraphs.map(p => p.textContent), paragraphAttrs: paragraphs.map(attrs),
      paragraphTextNodes: paragraphs.map(p => p.childNodes.length === 1 &&
        p.firstChild.nodeType === Node.TEXT_NODE), paragraphVisible: paragraphs.map(visible),
      dangerousTags: host ? [...host.querySelectorAll('script,img,svg,iframe,object,embed')]
        .map(element => element.tagName) : [],
      inlineHandlers: analyticalElements.flatMap(element => [...element.attributes]
        .filter(attribute => /^on/i.test(attribute.name)).map(attribute => attribute.name)),
      occurrences, leaks
    };
  }, { selector: HOST, texts });
  assert.equal(surface.hostCount, 1, 'Exactly one host in the actual Home main');
  assert.deepEqual(surface.hostAttrs, { id: 'analyticsHost', lang: 'en', dir: 'ltr' });
  assert.equal(surface.hostNodes, 1, 'Exactly one analytical root, no extra caption/text/comment');
  assert.equal(surface.nextIsFinalNotice, true, 'Host immediately before the existing final notice');
  assert.equal(surface.noticeText, locale.recommended);
  assert.equal(surface.rootTag, 'SECTION');
  assert.deepEqual(surface.rootAttrs, { class: 'card', lang: 'en', dir: 'ltr' });
  assert.equal(surface.rootVisible, true, 'Visible analytical root');
  assert.equal(surface.rootComputedDirection, 'ltr', 'LTR analytical subtree in the real CSS cascade');
  assert.equal(surface.rootNodes, texts.length, 'No invented heading/caption or hidden copy');
  assert.deepEqual(surface.tags, texts.map(() => 'P'));
  assert.deepEqual(surface.texts, texts, 'Exact real evaluator bodies and canonical component order');
  assert.deepEqual(surface.paragraphAttrs, texts.map(() => ({})),
    'Body paragraphs have no title/aria/role/data/hidden surface');
  assert.deepEqual(surface.paragraphTextNodes, texts.map(() => true), 'Literal text-only bodies');
  assert.deepEqual(surface.paragraphVisible, texts.map(() => true), 'No hidden/SR-only body');
  assert.deepEqual(surface.dangerousTags, [], 'No executable/media analytics elements');
  assert.deepEqual(surface.inlineHandlers, [], 'No inline on* handlers');
  // Exact structure/attribute allowlists and DTO bodies reject extra fields.
  // Do not ban words occurring in the valid frozen fallback/capability prose.
  assert.deepEqual(surface.leaks, [], 'No analytical prose outside the intended visible subtree');
  assert.deepEqual(surface.occurrences, Object.fromEntries([...new Set(texts)]
    .map(text => [text, texts.filter(body => body === text).length])),
  'No duplicate analytical body, including attribute/comment/hidden copies');
  return surface.texts;
}

async function assertBodiesAbsent(page, texts) {
  const found = await page.evaluate(texts => {
    const surfaces = [document.documentElement.textContent,
      ...[...document.querySelectorAll('*')].flatMap(element => [...element.attributes].map(a => a.value))];
    const walker = document.createTreeWalker(document, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_COMMENT);
    let node;
    while ((node = walker.nextNode())) surfaces.push(node.data);
    return texts.filter(text => surfaces.some(surface => surface.includes(text)));
  }, [...new Set(texts)]);
  assert.deepEqual(found, [], 'No previous ALLOW/fallback prose anywhere in the active document');
}

async function assertNoAnalytics(page, allBodies, { allowEmptyHost = false } = {}) {
  const hosts = await page.locator('#analyticsHost').count();
  if (allowEmptyHost) {
    assert.equal(hosts, 1, 'Eligible UNAVAILABLE Home must retain exactly one analytics host');
    const host = page.locator(HOST);
    assert.equal(await host.count(), 1, 'UNAVAILABLE host occupies the exact eligible Home position');
    assert.deepEqual(await host.evaluate(node => ({
      connected: node.isConnected, childNodes: node.childNodes.length,
      analyticalRoots: node.querySelectorAll('section.card').length,
      analyticalBodies: node.querySelectorAll('p').length, text: node.textContent
    })), { connected: true, childNodes: 0, analyticalRoots: 0, analyticalBodies: 0, text: '' },
    'Connected UNAVAILABLE host has no analytical root/body/text');
  } else assert.equal(hosts, 0, 'Ineligible/OFF views have zero analytics hosts');
  await assertBodiesAbsent(page, allBodies);
}

async function assertPublicOracle(page, source, expected) {
  const sourceBefore = structuredClone(source);
  const dto = await page.evaluate(source => globalThis.PHEISIRAETHA_ANALYTICS_V1.evaluate(source), source);
  assert.deepEqual(source, sourceBefore, 'Browser oracle observation must not mutate original source');
  assert.deepEqual(dto, expected, 'Actual Chromium frozen public evaluator agrees with the exact artifact oracle');
}

async function freshHost(page, previousHosts) {
  const host = await page.$(HOST);
  assert.ok(host, 'Actual eligible Home host');
  for (const previous of previousHosts) {
    assert.equal(await previous.evaluate(node => node.isConnected), false, 'Previous host remains disconnected');
    assert.equal(await host.evaluate((node, previous) => node === previous, previous), false,
      'Return/rerender must create a fresh host object, even with the same ID');
  }
  previousHosts.push(host);
  return host;
}

async function switchLanguage(page, code) {
  await page.locator('#langBtn').click();
  await page.locator(`#langMenu [data-language="${code}"]`).click();
}

const dialogAuditByPage = new WeakMap();

function observePageDialogs(page) {
  assert.equal(dialogAuditByPage.has(page), false, 'One private dialog audit per page');
  const audit = { expected: [], observed: [], unexpected: [] };
  dialogAuditByPage.set(page, audit);
  page.on('dialog', dialog => {
    const observed = { type: dialog.type(), message: dialog.message() };
    audit.observed.push(observed);
    const expected = audit.expected.find(record => record.seen === 0);
    if (expected && observed.type === expected.type && observed.message === expected.message)
      expected.seen++;
    else audit.unexpected.push(observed);
    // Observation never accepts/dismisses a dialog. Real expected-event handlers
    // own acceptance; unexpected blocking dialogs retain the primary failure.
  });
  return audit;
}

function expectPageDialog(page, type, message) {
  const audit = dialogAuditByPage.get(page);
  assert.ok(audit, 'Dialog observation must precede expectation and action');
  audit.expected.push({ type, message, seen: 0 });
}

function assertPageDialogAudit(audit) {
  assert.deepEqual(audit.unexpected, [], 'No unexpected real browser dialog');
  for (const expected of audit.expected)
    assert.equal(expected.seen, 1, `Expected dialog observed exactly once: ${expected.type} ${expected.message}`);
  assert.deepEqual(audit.observed, audit.expected.map(({ type, message }) => ({ type, message })),
    'Every registered exact type/message matches one real dialog in order');
}

async function acceptControlDialog(page, selector, type, expectedMessage) {
  expectPageDialog(page, type, expectedMessage);
  await Promise.all([
    page.waitForEvent('dialog').then(async dialog => {
      assert.equal(dialog.type(), type, 'Real production dialog type');
      assert.equal(dialog.message(), expectedMessage, 'Real production dialog message');
      await dialog.accept();
    }),
    page.locator(selector).click()
  ]);
}

async function withProductionPage(browser, server, source, options, run) {
  const session = await harness.createFreshContext(browser, server, options);
  activeSessions.add(session);
  const errors = [], pageErrors = [];
  const expected = { bytes: JSON.stringify(source), language: options.language || 'en' };
  let dialogAudit;
  try {
    if (options.injectArtifactWhileOff) {
      assert.equal(options.analyticsEnabled, false);
      await session.context.addInitScript({ content: harness.readExactArtifact().toString('utf8') });
    }
    await seedBeforeProduction(session, source, expected.language);
    // Register storage seeding before even creating the page. Enabled artifact
    // injection is exclusively S1's; OFF-B registers its exact artifact once.
    const page = await session.context.newPage();
    dialogAudit = observePageDialogs(page);
    page.on('pageerror', error => pageErrors.push(error.message));
    await openProduction(session, page, options.analyticsEnabled);
    await assertStorage(page, session.context, expected.bytes, expected.language);
    await run(page, session.context, expected);
    await assertStorage(page, session.context, expected.bytes, expected.language);
  } catch (error) { errors.push(error); }
  finally {
    try { await session.close(); contextsClosed++; }
    catch (error) { errors.push(error); }
    finally { activeSessions.delete(session); }
    try {
      assertRequestEvidence(session, server, options.analyticsEnabled);
      requestAudits++;
      assert.deepEqual(pageErrors, [], 'Normal PWA must have no uncaught browser error');
    } catch (error) { errors.push(error); }
    try { if (dialogAudit) assertPageDialogAudit(dialogAudit); }
    catch (error) { errors.push(error); }
  }
  if (errors.length === 1) throw errors[0];
  if (errors.length) throw new AggregateError(errors, 'Scenario assertion and/or infrastructure cleanup failed');
  return session; // already closed/drained; dedicated request tests inspect it.
}

// Shared infrastructure, with exactly nineteen independent top-level tests.
// Each production scenario still gets its own fresh, seeded BrowserContext.
let before, repositoryState, server, browser;
let mf3, mf4, empty, unavailable, mf3Dto, mf4Dto, emptyDto, unavailableDto;
let allBodies, locales, localeByCode, en;
let contextsClosed = 0, requestAudits = 0;
const activeSessions = new Set();
const enabled = Object.freeze({ analyticsEnabled: true });

test.before(async () => {
  before = captureS2Repository();
  repositoryState = before.production;
  mf3 = fixtures.reflection(labels, 'B4', true);
  mf4 = fixtures.fixture(1, labels);
  empty = fixtures.fixture(0, labels);
  unavailable = structuredClone(mf4);
  unavailable.version = '0.1.1';
  locales = committedLocales();
  localeByCode = Object.fromEntries(locales.map(locale => [locale.code, locale]));
  en = localeByCode.en;
  server = await harness.startServer({ expectedHead: repositoryState.head });
  browser = await harness.launchChromium();
}, { timeout: 60000 });

async function closeInfrastructure() {
  const errors = [];
  try { if (browser) await browser.close(); } catch (error) { errors.push(error); }
  try { if (server) await server.close(); } catch (error) { errors.push(error); }
  if (errors.length === 1) throw errors[0];
  if (errors.length) throw new AggregateError(errors, 'Browser/server cleanup failed');
}

test.after(async () => {
  const errors = [];
  try { await closeInfrastructure(); } catch (error) { errors.push(error); }
  try { if (before) assertS2RepositoryUnchanged(before); } catch (error) { errors.push(error); }
  if (errors.length === 1) throw errors[0];
  if (errors.length) throw new AggregateError(errors, 'Final cleanup/repository immutability failed');
}, { timeout: 60000 });

test('01 Oracle contract', { timeout: 60000 }, () => {
  assert.deepEqual({ ...unavailable, version: mf4.version }, mf4,
    'UNAVAILABLE source differs from exact MF4 only in root version');
  mf3Dto = actualDto(mf3);
  mf4Dto = actualDto(mf4);
  emptyDto = actualDto(empty);
  unavailableDto = actualDto(unavailable);
  assert.equal(mf3Dto.mode, 'APPROVED_BUNDLE', 'Actual MF3 evaluator mode');
  assert.equal(mf3Dto.components.length, 5, 'Actual MF3 component count');
  assert.equal(mf4Dto.mode, 'APPROVED_BUNDLE', 'Actual MF4 evaluator mode');
  assert.equal(mf4Dto.components.length, 9, 'Actual MF4 component count');
  assert.equal(emptyDto.mode, 'FALLBACK_ONLY', 'Actual valid zero-cycle evaluator mode');
  assert.equal(emptyDto.components.length, 1);
  assert.deepEqual(bodiesOf(emptyDto), [FALLBACK]);
  assert.equal(unavailableDto.mode, 'UNAVAILABLE', 'Root version 0.1.1 actually evaluates UNAVAILABLE');
  assert.deepEqual(unavailableDto.components, []);
  allBodies = [...new Set([...bodiesOf(mf3Dto), ...bodiesOf(mf4Dto), FALLBACK])];
});

test('02 OFF-A', { timeout: 60000 }, async () => {
  await withProductionPage(browser, server, mf4, { analyticsEnabled: false }, async page => {
    assert.equal(await page.evaluate(() => Object.hasOwn(globalThis, 'PHEISIRAETHA_ANALYTICS_V1')), false);
    await assertNoAnalytics(page, allBodies);
    assert.equal(await page.locator('#startCheckin').isVisible(), true, 'Normal MF4 Home');
    assert.equal(await page.locator('#editGoal').isVisible(), true);
  });
});

test('03 OFF-B adversarial artifact-present / app-OFF', { timeout: 60000 }, async () => {
  await withProductionPage(browser, server, mf4,
    { analyticsEnabled: false, injectArtifactWhileOff: true }, async page => {
      await assertPublicOracle(page, mf4, mf4Dto);
      await assertNoAnalytics(page, allBodies);
      assert.equal(await page.locator('#startCheckin').isVisible(), true);
    });
});

test('04 MF3 Home', { timeout: 60000 }, async () => {
  await withProductionPage(browser, server, mf3, enabled, async page => {
    await assertPublicOracle(page, mf3, mf3Dto);
    await assertAnalytics(page, mf3Dto, en);
  });
});

test('05 MF4 Home', { timeout: 60000 }, async () => {
  await withProductionPage(browser, server, mf4, enabled, async page => {
    await assertPublicOracle(page, mf4, mf4Dto);
    await assertAnalytics(page, mf4Dto, en);
  });
});

test('06 FALLBACK Home', { timeout: 60000 }, async () => {
  await withProductionPage(browser, server, empty, enabled, async page => {
    await assertPublicOracle(page, empty, emptyDto);
    await assertAnalytics(page, emptyDto, en);
    await assertBodiesAbsent(page, bodiesOf(mf4Dto));
  });
});

test('07 UNAVAILABLE Home', { timeout: 60000 }, async () => {
  await withProductionPage(browser, server, unavailable, enabled, async (page, context, expected) => {
    await assertPublicOracle(page, unavailable, unavailableDto);
    await assertNoAnalytics(page, allBodies, { allowEmptyHost: true });
    assert.equal(await page.locator('#startCheckin').isVisible(), true);
    await page.locator('[data-nav="data"]').click();
    assert.equal(await page.locator('#importBtn').isVisible(), true);
    await assertNoAnalytics(page, allBodies);
    await assertStorage(page, context, expected.bytes);
    await page.locator('[data-nav="home"]').click();
    assert.equal(await page.locator('#editGoal').isVisible(), true);
    await assertNoAnalytics(page, allBodies, { allowEmptyHost: true });
  });
});

test('08 Intent-null', { timeout: 60000 }, async () => {
  await withProductionPage(browser, server, { version: '0.1.0', lang: 'en', intent: null }, enabled,
    async page => {
      assert.equal(await page.locator('#createGoal').isVisible(), true, 'Normal empty-intent Home');
      await assertNoAnalytics(page, allBodies);
    });
});

async function navigateAndReturn(routes) {
  await withProductionPage(browser, server, mf4, enabled, async (page, context, expected) => {
    const hosts = [];
    await freshHost(page, hosts);
    await assertAnalytics(page, mf4Dto, en);
    for (const route of routes) for (let roundTrip = 0; roundTrip < 2; roundTrip++) {
      await page.locator(route.enter).click();
      assert.equal(await page.locator(route.marker).count(), 1, `Real destination: ${route.enter}`);
      await assertNoAnalytics(page, allBodies);
      for (const old of hosts) assert.equal(await old.evaluate(node => node.isConnected), false);
      await assertStorage(page, context, expected.bytes);
      if (route.confirm) await acceptControlDialog(page, route.leave, 'confirm', en.cancelCheckinConfirm);
      else await page.locator(route.leave).click();
      await freshHost(page, hosts);
      await assertAnalytics(page, mf4Dto, en);
      await assertStorage(page, context, expected.bytes);
    }
  });
}

test('09 Navigation / eligibility / RIS cancel / wizard cancel', { timeout: 60000 }, async () => {
  await navigateAndReturn([
    { enter: '[data-nav="history"]', marker: '.timeline', leave: '[data-nav="home"]' },
    { enter: '[data-nav="data"]', marker: '#importFile', leave: '[data-nav="home"]' },
    { enter: '#editGoal', marker: '#risCancel', leave: '#risCancel' },
    { enter: '#startCheckin', marker: '#wizCancel', leave: '#wizCancel', confirm: true }
  ]);
});

test('10 All 31 locales', { timeout: 180000 }, async () => {
  assert.deepEqual(locales.map(locale => locale.code), LOCALE_ORDER);
  assert.equal(locales.length, 31);
  assert.equal(new Set(locales.map(locale => locale.code)).size, 31);
  assert.equal(localeByCode.ar.dir, 'rtl');
  assert.equal(localeByCode.he.dir, 'rtl');
  await withProductionPage(browser, server, mf4, enabled, async (page, context, expected) => {
    assert.deepEqual(await page.evaluate(() => Object.keys(window.PHEISIRAETHA_LOCALES)), LOCALE_ORDER,
      'Production locale registry matches the frozen exact order');
    assert.equal(await page.locator('#langMenu [data-language]').count(), 31, 'Actual language UI offers all 31');
    const hosts = [];
    await freshHost(page, hosts);
    const canonical = await assertAnalytics(page, mf4Dto, en);
    const visited = [];
    for (const code of LOCALE_ORDER) {
      const locale = localeByCode[code];
      await switchLanguage(page, code);
      await assertLanguage(page, locale);
      await freshHost(page, hosts);
      assert.deepEqual(await assertAnalytics(page, mf4Dto, locale), canonical,
        `Byte/text identical canonical body order in locale ${code}`);
      await assertStorage(page, context, expected.bytes, code);
      visited.push(code);
      expected.language = code;
    }
    assert.deepEqual(visited, LOCALE_ORDER);
    assert.ok(visited.includes('ar') && visited.includes('he'), 'Both actual RTL locales exercised');
  });
});

async function responsiveRtl(code) {
  // Exactly one fresh context per RTL locale; resize this same loaded page
  // through every width. No navigation/reload/context replacement between widths.
  await withProductionPage(browser, server, mf4,
    { analyticsEnabled: true, viewport: { width: 360, height: 844 } }, async (page, context, expected) => {
      const hosts = [];
      await freshHost(page, hosts);
      await switchLanguage(page, code);
      expected.language = code;
      const host = await freshHost(page, hosts);
      const root = await page.$(HOST + ' > section.card');
      assert.ok(root, 'Real analytical root identity captured before resize');
      const documentIdentity = await page.evaluateHandle(() => document);
      const canonical = await assertAnalytics(page, mf4Dto, localeByCode[code]);
      const widthsVisited = [];
      for (const width of [360, 390, 430]) {
        await page.setViewportSize({ width, height: 844 });
        assert.equal(await page.evaluate(documentIdentity => document === documentIdentity, documentIdentity), true,
          'Responsive resize preserves the exact document');
        assert.equal(await host.evaluate(node => node.isConnected), true, 'Same host survives pure viewport resize');
        assert.equal(await host.evaluate(node => document.querySelector('#analyticsHost') === node), true,
          'No host replacement or duplicate during responsive resize');
        assert.equal(await root.evaluate(node => node.isConnected &&
          document.querySelector('#analyticsHost > section.card') === node), true,
        'Same connected analytical root survives every viewport resize');
        assert.equal(context.pages().length, 1, 'Same single page throughout RTL width sequence');
        await assertLanguage(page, localeByCode[code]);
        await page.locator(HOST + ' > section.card').scrollIntoViewIfNeeded();
        assert.deepEqual(await assertAnalytics(page, mf4Dto, localeByCode[code]), canonical);
        const layout = await page.evaluate(selector => {
          const host = document.querySelector(selector);
          const rects = [host, ...host.querySelectorAll('*')].map(element => {
            const rect = element.getBoundingClientRect();
            return { tag: element.tagName, left: rect.left, right: rect.right,
              width: rect.width, height: rect.height };
          });
          const glyphRects = [...host.querySelectorAll('p')].flatMap(paragraph => {
            const range = document.createRange();
            range.selectNodeContents(paragraph);
            return [...range.getClientRects()].map(rect => ({ left: rect.left, right: rect.right }));
          });
          return { viewport: innerWidth, documentDir: document.documentElement.dir,
            shellDir: getComputedStyle(document.querySelector('.shell')).direction,
            rootDir: getComputedStyle(host.firstElementChild).direction,
            rootLang: host.firstElementChild.lang, rootExplicitDir: host.firstElementChild.dir,
            documentWidth: document.documentElement.scrollWidth, bodyWidth: document.body.scrollWidth,
            rects, glyphRects };
        }, HOST);
        assert.equal(layout.viewport, width, 'window.innerWidth equals requested viewport width');
        assert.equal(layout.documentDir, 'rtl');
        assert.equal(layout.shellDir, 'rtl');
        assert.equal(layout.rootDir, 'ltr');
        assert.equal(layout.rootExplicitDir, 'ltr');
        assert.equal(layout.rootLang, 'en');
        assert.ok(layout.documentWidth <= width, 'Document has no horizontal overflow');
        assert.ok(layout.bodyWidth <= width, 'Body has no horizontal overflow');
        assert.ok(layout.glyphRects.length > 0, 'Actual laid-out analytical glyphs');
        for (const rect of [...layout.rects, ...layout.glyphRects]) {
          assert.ok(rect.left >= 0 && rect.right <= width,
            `Analytical element/text escapes ${code}/${width}px: ${JSON.stringify(rect)}`);
          if ('width' in rect) assert.ok(rect.width > 0 && rect.height > 0, 'Visible non-zero analytical element bounds');
        }
        await assertStorage(page, context, expected.bytes, code);
        widthsVisited.push(width);
      }
      assert.deepEqual(widthsVisited, [360, 390, 430]);
      await documentIdentity.dispose();
    });
}

test('11 RTL responsive matrix', { timeout: 60000 }, async () => {
  await responsiveRtl('ar');
  await responsiveRtl('he');
});

async function importBackupOnData(page, context, expected, source, locale = en) {
  assert.equal(await page.locator('#importFile').count(), 1, 'Real Data import control');
  const importedBytes = JSON.stringify(source);
  expectPageDialog(page, 'alert', locale.imported);
  await Promise.all([
    page.waitForEvent('dialog').then(async dialog => {
      assert.equal(dialog.type(), 'alert');
      assert.equal(dialog.message(), locale.imported, 'Production accepts the valid backup');
      await dialog.accept();
    }),
    page.locator('#importFile').setInputFiles({ name: 'zero-cycle-backup.json',
      mimeType: 'application/json', buffer: Buffer.from(importedBytes) })
  ]);
  await page.waitForFunction(({ key, bytes }) => localStorage.getItem(key) === bytes,
    { key: STORAGE, bytes: importedBytes });
  assert.deepEqual(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), STORAGE), source);
  expected.bytes = importedBytes;
  assert.equal(await page.locator('[data-nav="data"]').getAttribute('aria-current'), 'page',
    'Accepted import remains on real Data view');
  assert.equal(await page.locator('#importFile').count(), 1);
  assert.equal(await page.locator('#startCheckin').count(), 0, 'No automatic return to Home after import');
  await assertNoAnalytics(page, allBodies);
  await assertStorage(page, context, importedBytes, expected.language);
  return importedBytes;
}

test('12 Import', { timeout: 60000 }, async () => {
  await withProductionPage(browser, server, mf4, enabled, async (page, context, expected) => {
    const hosts = [];
    await freshHost(page, hosts);
    await assertAnalytics(page, mf4Dto, en);
    await page.locator('[data-nav="data"]').click();
    await assertNoAnalytics(page, allBodies);
    assert.equal(await hosts[0].evaluate(node => node.isConnected), false);
    await importBackupOnData(page, context, expected, empty);
    await page.locator('[data-nav="home"]').click();
    await freshHost(page, hosts);
    await assertAnalytics(page, emptyDto, en);
    const priorApprovedBodies = [...new Set([
      ...bodiesOf(mf3Dto),
      ...bodiesOf(mf4Dto)
    ])];
    await assertBodiesAbsent(page, priorApprovedBodies);
    await assertPublicOracle(page, empty, emptyDto);
  });
});

async function deleteAndReset(source, dto) {
  await withProductionPage(browser, server, source, enabled, async (page, context, expected) => {
    const host = await page.$(HOST);
    await assertAnalytics(page, dto, en);
    await page.locator('[data-nav="data"]').click();
    await assertNoAnalytics(page, allBodies);
    await acceptControlDialog(page, '#deleteBtn', 'confirm', en.deleteConfirm);
    assert.equal(await page.evaluate(key => localStorage.getItem(key), STORAGE), null,
      'Existing reset semantics remove the state key rather than persisting fresh()');
    expected.bytes = null;
    assert.equal(await page.locator('#createGoal').isVisible(), true, 'Reset returns to intent=null Home');
    assert.equal(await host.evaluate(node => node.isConnected), false, 'Pre-reset host never reconnects');
    await assertNoAnalytics(page, allBodies);
    await assertStorage(page, context, null);
    await page.locator('[data-nav="data"]').click();
    await page.locator('[data-nav="home"]').click();
    await assertNoAnalytics(page, allBodies);
  });
}

test('13 Delete / reset', { timeout: 60000 }, async () => {
  await deleteAndReset(mf4, mf4Dto);
  await deleteAndReset(empty, emptyDto);
});

test('14 Persistence invariance', { timeout: 60000 }, async () => {
  await withProductionPage(browser, server, mf4, enabled, async (page, context, expected) => {
    const originalBytes = JSON.stringify(mf4);
    const initial = await assertStorage(page, context, originalBytes);
    const hosts = [];
    await freshHost(page, hosts);
    await assertAnalytics(page, mf4Dto, en);
    await page.locator('[data-nav="history"]').click();
    await assertStorage(page, context, originalBytes);
    await page.locator('[data-nav="home"]').click();
    await freshHost(page, hosts);
    await assertAnalytics(page, mf4Dto, en);
    assert.deepEqual(await assertStorage(page, context, originalBytes), initial,
      'Normal eligible rendering/navigation preserves exact state/storage bytes');

    await switchLanguage(page, 'de');
    expected.language = 'de';
    await freshHost(page, hosts);
    await assertLanguage(page, localeByCode.de);
    await assertAnalytics(page, mf4Dto, localeByCode.de);
    const afterLocale = await assertStorage(page, context, originalBytes, 'de');
    assert.deepEqual(afterLocale, { ...initial, local: { ...initial.local, [LANGUAGE]: 'de' } },
      'Locale changes only the legitimate language preference key');

    await page.locator('[data-nav="data"]').click();
    const uploadedCanonicalBytes = await importBackupOnData(page, context, expected, empty, localeByCode.de);
    assert.equal(await page.evaluate(key => localStorage.getItem(key), STORAGE), uploadedCanonicalBytes,
      'Import persists exactly the uploaded canonical JSON bytes');
    await page.locator('[data-nav="home"]').click();
    await freshHost(page, hosts);
    await assertAnalytics(page, emptyDto, localeByCode.de);
    await assertBodiesAbsent(page, bodiesOf(mf4Dto));
    await assertStorage(page, context, uploadedCanonicalBytes, 'de');

    await page.locator('[data-nav="data"]').click();
    await acceptControlDialog(page, '#deleteBtn', 'confirm', localeByCode.de.deleteConfirm);
    expected.bytes = null;
    assert.equal(await page.evaluate(key => localStorage.getItem(key), STORAGE), null,
      'Delete removes the state key under existing production semantics');
    assert.equal(await page.locator('#createGoal').isVisible(), true);
    await assertNoAnalytics(page, allBodies);
    await assertStorage(page, context, null, 'de');
  });
});

test('15 DOM leakage', { timeout: 90000 }, async () => {
  for (const [name, base, expectedDto] of [
    ['MF3', mf3, mf3Dto], ['MF4', mf4, mf4Dto], ['FALLBACK', empty, emptyDto]
  ]) {
    const source = structuredClone(base);
    source.opaque = structuredClone(RAW_SENTINELS);
    source.intent.opaque = { stale: RAW_SENTINELS.stale, debug: RAW_SENTINELS.debug };
    if (source.intent.cycles[0]) source.intent.cycles[0].opaque = {
      raw: RAW_SENTINELS.raw, focus: RAW_SENTINELS.focus, why: RAW_SENTINELS.why
    };
    const dto = actualDto(source);
    assert.deepEqual(dto, expectedDto, `${name}: opaque raw/stale values do not change canonical DTO`);
    await withProductionPage(browser, server, source, enabled, async page => {
      const stored = await page.evaluate(key => localStorage.getItem(key), STORAGE);
      for (const marker of Object.values(RAW_SENTINELS))
        assert.ok(stored.includes(marker), `Raw/stale sentinel really seeded: ${marker}`);
      await assertPublicOracle(page, source, dto);
      await assertAnalytics(page, dto, en);
      // Exact values, never generic bans on words in the legitimate fallback.
      await assertBodiesAbsent(page, Object.values(RAW_SENTINELS));
      const hosts = [];
      await freshHost(page, hosts);
      await page.locator('[data-nav="data"]').click();
      await assertNoAnalytics(page, allBodies);
      await assertBodiesAbsent(page, Object.values(RAW_SENTINELS));
      await page.locator('[data-nav="home"]').click();
      await freshHost(page, hosts);
      await assertAnalytics(page, dto, en);
      await assertBodiesAbsent(page, Object.values(RAW_SENTINELS));
    });
  }
});

test('16 Request evidence — enabled', { timeout: 60000 }, async () => {
  const session = await withProductionPage(browser, server, mf4, enabled, async page => {
    await assertAnalytics(page, mf4Dto, en);
    await page.locator('[data-nav="data"]').click();
    await page.locator('[data-nav="home"]').click();
    await assertAnalytics(page, mf4Dto, en);
  });
  await session.close(); // FIRST: complete/drain S1, then inspect terminal evidence.
  const requests = session.requestLog;
  const deliveries = requests.filter(entry => new URL(entry.url).pathname === '/app.js');
  assert.equal(deliveries.length, 1, 'Exactly one transformed /app.js delivery');
  assert.equal(deliveries[0].transformed, true);
  assert.equal(deliveries[0].status, 200);
  assert.equal(deliveries[0].outcome, 'finished');
  assert.equal(deliveries[0].error, null);
  assert.equal(requests.filter(entry => entry.transformed).length, 1);
  assert.deepEqual(requests.filter(entry => new URL(entry.url).origin !== session.origin &&
    entry.outcome === 'finished' && entry.status >= 200 && entry.status < 400), [],
  'No successful external request');
  assertRequestEvidence(session, server, true); // also proves zero HTTP artifact requests.
});

test('17 Request evidence — OFF', { timeout: 60000 }, async () => {
  const session = await withProductionPage(browser, server, mf4, { analyticsEnabled: false }, async page => {
    await assertNoAnalytics(page, allBodies);
    assert.equal(await page.locator('#startCheckin').isVisible(), true);
    await page.locator('[data-nav="data"]').click();
    await page.locator('[data-nav="home"]').click();
    await assertNoAnalytics(page, allBodies);
  });
  await session.close(); // FIRST: complete/drain S1, then inspect terminal evidence.
  const requests = session.requestLog;
  const deliveries = requests.filter(entry => new URL(entry.url).pathname === '/app.js');
  assert.equal(deliveries.length, 1, 'Exactly one normal /app.js delivery');
  assert.equal(deliveries[0].transformed, false);
  assert.equal(deliveries[0].status, 200);
  assert.equal(deliveries[0].outcome, 'finished');
  assert.equal(deliveries[0].error, null);
  assert.equal(requests.filter(entry => entry.transformed).length, 0);
  assertRequestEvidence(session, server, false); // also proves zero HTTP artifact requests.
});

test('18 Fresh-context isolation',
  { timeout: 60000 }, async () => {
    const sessions = [], pageErrors = [], errors = [], dialogAudits = [];
    const marker = '__pheisiraetha_3b6_context_marker';
    const token = 'first-context-only';
    try {
      const first = await harness.createFreshContext(browser, server, enabled);
      sessions.push(first);
      activeSessions.add(first);
      await seedBeforeProduction(first, mf4);
      const firstPage = await first.context.newPage();
      dialogAudits.push(observePageDialogs(firstPage));
      firstPage.on('pageerror', error => pageErrors.push(error.message));
      await openProduction(first, firstPage, true);
      await assertStorage(firstPage, first.context, JSON.stringify(mf4));
      await assertAnalytics(firstPage, mf4Dto, en);
      await firstPage.evaluate(({ marker, token }) => {
        localStorage.setItem(marker, token);
        sessionStorage.setItem(marker, token);
        globalThis[marker] = token;
        document.cookie = `${marker}=${token}; Path=/; SameSite=Lax`;
      }, { marker, token });
      const markers = async page => page.evaluate(marker => ({
        local: localStorage.getItem(marker), session: sessionStorage.getItem(marker),
        global: globalThis[marker] ?? null, ownGlobal: Object.hasOwn(globalThis, marker), cookie: document.cookie
      }), marker);
      const firstMarkers = { local: token, session: token, global: token,
        ownGlobal: true, cookie: `${marker}=${token}` };
      assert.deepEqual(await markers(firstPage), firstMarkers, 'Markers really exist in context one');
      assert.equal((await first.context.cookies()).length, 1);

      const second = await harness.createFreshContext(browser, server, enabled);
      sessions.push(second);
      activeSessions.add(second);
      // Do not seed/clear the second context: that could mask a shared-state leak.
      // Its fresh production onboarding is expected, with only a language write.
      const secondPage = await second.context.newPage();
      dialogAudits.push(observePageDialogs(secondPage));
      secondPage.on('pageerror', error => pageErrors.push(error.message));
      await openProduction(second, secondPage, true, false);
      assert.deepEqual(await markers(secondPage),
        { local: null, session: null, global: null, ownGlobal: false, cookie: '' });
      assert.deepEqual(await second.context.cookies(), []);
      assert.deepEqual(await secondPage.evaluate(() => Object.fromEntries(Object.entries(localStorage))),
        { [LANGUAGE]: 'en' }, 'No shared first-context record or onboarding completion');
      assert.equal(await secondPage.evaluate(key => localStorage.getItem(key), STORAGE), null);
      assert.equal(await secondPage.evaluate(key => localStorage.getItem(key), ONBOARDING), null);
      await assertNoAnalytics(secondPage, allBodies);
      assert.equal(await secondPage.locator('.onboarding-shell').count(), 1, 'Fresh unseeded production state');
      assert.deepEqual(await markers(firstPage), firstMarkers, 'Context two does not alter context one');
    } catch (error) { errors.push(error); }
    finally {
      for (const session of sessions.reverse()) {
        try { await session.close(); contextsClosed++; }
        catch (error) { errors.push(error); }
        finally { activeSessions.delete(session); }
        try { assertRequestEvidence(session, server, true); requestAudits++; }
        catch (error) { errors.push(error); }
      }
      try { assert.deepEqual(pageErrors, []); } catch (error) { errors.push(error); }
      for (const audit of dialogAudits) {
        try { assertPageDialogAudit(audit); } catch (error) { errors.push(error); }
      }
    }
    if (errors.length === 1) throw errors[0];
    if (errors.length) throw new AggregateError(errors, 'Fresh-context isolation or cleanup failed');
  });

test('19 Repository immutability', { timeout: 60000 }, async t => {
  assert.equal(activeSessions.size, 0, 'All scenario contexts closed through session.close()');
  assert.ok(contextsClosed > 0, 'Browser scenarios actually executed');
  assert.equal(requestAudits, contextsClosed, 'Every closed context has terminal S1 request evidence');
  t.diagnostic(`CHROMIUM VERSION: ${browser.version()}`);
  t.diagnostic(`CHROMIUM PATH: ${process.env.LEGACY_DOM_CHROMIUM_EXECUTABLE_PATH || 'Playwright installed default'}`);
  await closeInfrastructure();
  assertS2RepositoryUnchanged(before);
  t.diagnostic(`REQUEST EVIDENCE: PASS for all ${requestAudits} closed contexts; exact enabled/OFF deliveries; zero artifact HTTP/external requests`);
  t.diagnostic('REPOSITORY IMMUTABILITY: PASS after browser/server cleanup');
});
