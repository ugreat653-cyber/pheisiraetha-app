'use strict';

// Focused UX checks only: serve the PR's ordinary source files, never a release archive.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const http = require('node:http');
const crypto = require('node:crypto');
const { chromium, webkit, devices } = require('playwright');

const ROOT = process.cwd();
const PROFILE = process.env.UX_PROFILE || 'desktop-chrome';
const OUT = path.resolve(process.env.UX_EVIDENCE || path.join(ROOT, 'first-checkin-evidence'));
const STORAGE = 'pheisiraetha_v01';
const ONBOARDING = 'pheisiraetha_onboarding_v01';
const LANGUAGE = 'pheisiraetha_language_v01';
const ARTIFACT_SHA = 'f1f975900faaa64649bcef42412c1856543c8716711d4119df9b964f4bf8c824';
const ARTIFACT_PATH = 'browser-packaging/artifacts/analytics-v1.' + ARTIFACT_SHA + '.js';
const OFF_FLAG = 'const ANALYTICS_ENABLED = false;';
const ON_FLAG = 'const ANALYTICS_ENABLED = true;';
const RIS_FIELDS = ['primary', 'success', 'scope', 'nonGoals', 'constraints', 'rationale'];
const RIS = {
  primary: 'Prepare a small reading group / Создать группу чтения',
  success: 'Three participants agree on the first meeting',
  scope: 'One book and one meeting',
  nonGoals: 'No public event or mailing list',
  constraints: 'Two hours per week; keep names private',
  rationale: 'I want a regular space for reading'
};
const NEW_RIS = { ...RIS, primary: 'Revised objective / Обновлённая цель' };
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};
const results = [];
let server, browser, baseURL;

function existingRecord(cycles = []) {
  return {
    version: '0.1.0',
    lang: 'ru',
    intent: {
      id: 'existing-intent-unchanged',
      createdAt: '2026-01-02T10:11:12.000Z',
      ris: { ...RIS },
      cycles
    }
  };
}
function existingCycle() {
  return {
    id: 'existing-cycle-unchanged',
    createdAt: '2026-01-09T10:11:12.000Z',
    cie: { ...RIS },
    iep: {
      desire: 6, belief: 7, emotion: 'Calm / contentment', emotionIntensity: 4,
      mental: 5, practical: 3, frequency: 'freq2', actions: 'Read chapter one', hours: 1.5
    },
    oop: {
      currentState: 'Chapter one read', achievement: 2, events: 'Read 12 pages',
      direction: 'toward', evidence: ['direct'], external: 'None known'
    },
    intentional: 'no',
    revision: {}
  };
}
async function stored(page) {
  return page.evaluate(key => JSON.parse(localStorage.getItem(key)), STORAGE);
}
async function equalStored(page, expected) {
  assert.deepEqual(await stored(page), expected, 'Saved user record must stay unchanged');
}
async function cycles(page, count) {
  assert.equal((await stored(page)).intent.cycles.length, count, 'Only completed, valid saves add cycles');
}
async function step(page, value) {
  await page.locator('.progress').waitFor({ state: 'visible' });
  assert.equal(await page.locator('.progress').getAttribute('aria-valuenow'), String(value));
}
async function fillRIS(page, values = RIS) {
  for (const key of RIS_FIELDS) await page.locator('#' + key).fill(values[key]);
}
async function newRIS(page, { fullOnboarding = false } = {}) {
  if (fullOnboarding) {
    for (let n = 0; n < 3; n++) await page.locator('#onboardingNext').click();
    await page.locator('#onboardingStart').click();
  } else if (await page.locator('#onboardingSkip').count()) {
    await page.locator('#onboardingSkip').click();
  }
  await page.locator('#createGoal').click();
  await fillRIS(page);
  await page.locator('#risSave').click();
  await page.locator('#continueFirstCheckin').waitFor({ state: 'visible' });
  await cycles(page, 0);
}
async function toRevision(page, hours = '1.5') {
  await step(page, 2);
  await page.locator('#actions').fill('Read one chapter / Прочитать главу');
  await page.locator('#hours').fill(hours);
  await page.locator('#wizNext').click();
  await step(page, 3);
  await page.locator('#currentState').fill('One chapter read');
  await page.locator('#events').fill('Read 12 pages');
  await page.locator('#direction').selectOption('toward');
  await page.locator('[data-evidence="direct"]').check();
  await page.locator('#external').fill('None known');
  await page.locator('#wizNext').click();
  await step(page, 4);
}
async function complete(page) {
  const event = page.waitForEvent('dialog');
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#wizComplete').click();
  await event;
  await page.locator('#startCheckin').waitFor({ state: 'visible' });
}
async function beginReturning(page) {
  await page.locator('#startCheckin').click();
  await step(page, 1);
  for (const key of RIS_FIELDS) assert.equal(await page.locator('#' + key).inputValue(), RIS[key]);
  await page.locator('#wizNext').click();
  await step(page, 2);
}
async function localized(page, lang, key) {
  return page.evaluate(({ lang, key }) => window.PHEISIRAETHA_LOCALES[lang].translations[key], { lang, key });
}
async function switchLanguage(page, lang) {
  await page.locator('#langBtn').click();
  await page.locator('[data-language="' + lang + '"]').click();
  assert.equal(await page.locator('html').getAttribute('lang'), lang);
}
async function clickWithDialog(page, selector, accept) {
  const event = page.waitForEvent('dialog');
  page.once('dialog', dialog => accept ? dialog.accept() : dialog.dismiss());
  await page.locator(selector).click();
  await event;
}
async function installStorageFailure(page) {
  await page.evaluate(key => {
    window.__uxOriginalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function(k, v) {
      if (k === key) throw new DOMException('Focused storage failure fixture', 'QuotaExceededError');
      return window.__uxOriginalSetItem.call(this, k, v);
    };
  }, STORAGE);
}
async function removeStorageFailure(page) {
  await page.evaluate(() => {
    Storage.prototype.setItem = window.__uxOriginalSetItem;
    delete window.__uxOriginalSetItem;
  });
}
async function assertMobileFit(page) {
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), true,
    'Focused flow must fit its mobile viewport without horizontal scrolling');
  for (const selector of ['#continueFirstCheckin', '#finishFirstCheckinLater']) {
    const rect = await page.locator(selector).boundingBox();
    const viewport = page.viewportSize();
    assert.ok(rect && rect.width > 0 && rect.x >= -1 && rect.x + rect.width <= viewport.width + 1,
      selector + ' must remain visible inside the viewport');
  }
}
async function assertFlowFit(page, selectors = []) {
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), true,
    'Localized flow must fit its viewport without horizontal scrolling');
  for (const selector of selectors) {
    const rect = await page.locator(selector).boundingBox();
    const viewport = page.viewportSize();
    assert.ok(rect && rect.width > 0 && rect.x >= -1 && rect.x + rect.width <= viewport.width + 1,
      selector + ' must be visible inside the viewport');
    assert.equal(await page.locator(selector).evaluate(element => element.scrollWidth <= element.clientWidth + 1), true,
      selector + ' must wrap localized text without clipping');
  }
}
async function assertLocale(page, lang) {
  const expected = await page.evaluate(code => {
    const locale = window.PHEISIRAETHA_LOCALES[code];
    return { htmlLang: locale.htmlLang, dir: locale.dir };
  }, lang);
  assert.equal(await page.locator('html').getAttribute('lang'), expected.htmlLang);
  assert.equal(await page.locator('html').getAttribute('dir'), expected.dir);
  assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).direction), expected.dir);
}
async function assertLocaleText(page, selector, lang, key) {
  assert.equal(await page.locator(selector).textContent(), await localized(page, lang, key),
    lang + '.' + key + ' must render without fallback');
}
async function assertRISHelp(page, lang) {
  for (const key of RIS_FIELDS) {
    const helpID = await page.locator('#' + key).getAttribute('aria-describedby');
    assert.equal(helpID, key + 'Help', 'Each RIS field keeps an accessible explanation');
    await assertLocaleText(page, '#' + helpID, lang, key + 'Help');
    assert.equal(await page.locator('#' + key).getAttribute('dir'), 'auto',
      'User-entered RIS remains direction-aware');
  }
  await assertFlowFit(page, RIS_FIELDS.flatMap(key => ['#' + key, '#' + key + 'Help']));
}
async function assertCanonicalEmptyDTO(page) {
  const witness = await page.evaluate(key => {
    const dto = window.PHEISIRAETHA_ANALYTICS_V1.evaluate(JSON.parse(localStorage.getItem(key)));
    return {
      dtoVersion: dto.dtoVersion, mode: dto.mode, lang: dto.lang, dir: dto.dir,
      frozen: Object.isFrozen(dto) && Object.isFrozen(dto.components) && dto.components.every(Object.isFrozen),
      components: dto.components.map(component => ({
        templateId: component.templateId, text: component.text, surface: component.surface, role: component.role
      }))
    };
  }, STORAGE);
  assert.deepEqual(witness, {
    dtoVersion: 'pheisiraetha-render-v1', mode: 'FALLBACK_ONLY', lang: 'en', dir: 'ltr', frozen: true,
    components: [{
      templateId: 'safety.fallback.noInterpretationOrNextFocus',
      text: 'No interpretation or next focus is shown here.', surface: 'FALLBACK', role: 'FALLBACK'
    }]
  }, 'UI translations never change the frozen canonical DTO or add interpretation');
}

async function runCase(name, callback, { record, lang = 'en', onboarding = true, fixtureMode = 'ON' } = {}) {
  const options = PROFILE === 'iphone-webkit'
    ? { ...devices['iPhone 13'], locale: lang === 'ru' ? 'ru-RU' : 'en-GB' }
    : PROFILE === 'samsung-chrome'
      ? {
          viewport: { width: 360, height: 740 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true,
          locale: lang === 'ru' ? 'ru-RU' : 'en-GB',
          userAgent: 'Mozilla/5.0 (Linux; Android 10; SM-G960F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/' +
            browser.version() + ' Mobile Safari/537.36'
        }
      : { viewport: { width: 1280, height: 900 }, locale: lang === 'ru' ? 'ru-RU' : 'en-GB' };
  delete options.defaultBrowserType;
  const context = await browser.newContext(options);
  const page = await context.newPage();
  const errors = [], externalRequests = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => {
    const url = request.url();
    if (!url.startsWith(baseURL) && !url.startsWith('data:') && !url.startsWith('blob:'))
      externalRequests.push(url);
  });
  await context.addInitScript(({ record, lang, onboarding, storage, language, onboardingKey }) => {
    // Seed only once; a reload must inspect the record produced by the real UI.
    if (!sessionStorage.getItem('ux-test-seeded')) {
      sessionStorage.setItem('ux-test-seeded', '1');
      if (record) localStorage.setItem(storage, JSON.stringify(record));
      localStorage.setItem(language, lang);
      if (onboarding) localStorage.setItem(onboardingKey, '1');
    }
  }, { record, lang, onboarding, storage: STORAGE, language: LANGUAGE, onboardingKey: ONBOARDING });
  let result;
  try {
    await page.goto(baseURL + (fixtureMode === 'ON' ? '__ux_on__/' : ''), { waitUntil: 'networkidle' });
    await callback(page, context);
    assert.deepEqual(errors, [], 'No uncaught runtime errors');
    assert.deepEqual(externalRequests, [], 'UX flow must make no external requests');
    const storageKeys = await page.evaluate(() => Object.keys(localStorage).sort());
    assert.ok(storageKeys.every(key => [STORAGE, LANGUAGE, ONBOARDING].includes(key)), 'No new persistent storage keys');
    assert.deepEqual(await context.cookies(), [], 'No unexpected cookies');
    assert.deepEqual(await page.evaluate(() => Object.keys(sessionStorage).sort()), ['ux-test-seeded'], 'No application session storage keys');
    result = { name, language: lang, fixtureMode, status: 'PASS', runtimeErrors: errors, externalRequests, storageKeys };
  } catch (error) {
    const prefix = name.replace(/[^a-z0-9-]+/gi, '-');
    await fs.writeFile(path.join(OUT, prefix + '.html'), await page.content()).catch(() => {});
    await page.screenshot({ path: path.join(OUT, prefix + '.png'), fullPage: true }).catch(() => {});
    result = { name, language: lang, fixtureMode, status: 'FAIL', error: String(error.stack || error), runtimeErrors: errors, externalRequests };
  } finally {
    await context.close();
  }
  results.push(result);
  console.log(result.status + ' ' + name);
}
async function main() {
  await fs.mkdir(OUT, { recursive: true });
  const sourceApp = await fs.readFile(path.join(ROOT, 'app.js'), 'utf8');
  assert.equal(sourceApp.split(OFF_FLAG).length - 1, 1, 'Integrated source must remain default OFF');
  assert.equal(sourceApp.includes(ON_FLAG), false, 'Do not modify the source analytics flag');
  const artifactBytes = await fs.readFile(path.join(ROOT, ARTIFACT_PATH));
  assert.equal(artifactBytes.length, 243504);
  assert.equal(crypto.createHash('sha256').update(artifactBytes).digest('hex'), ARTIFACT_SHA, 'Use the unchanged frozen artifact without rebuilding');
  const sourceIndex = await fs.readFile(path.join(ROOT, 'index.html'), 'utf8');
  const appScript = '<script src="app.js"></script>';
  assert.equal(sourceIndex.split(appScript).length - 1, 1, 'Expected ordinary candidate entry');
  const fixtureApp = Buffer.from(sourceApp.replace(OFF_FLAG, ON_FLAG));
  const fixtureIndex = Buffer.from(sourceIndex.replace(appScript, '<script src="' + ARTIFACT_PATH + '"></script>\n  ' + appScript));
  server = http.createServer(async (request, response) => {
    try {
      const requested = decodeURIComponent(new URL(request.url, 'http://localhost').pathname).replace(/^\/+/, '');
      const onFixture = requested.startsWith('__ux_on__/');
      const relative = (onFixture ? requested.slice('__ux_on__/'.length) : requested) || 'index.html';
      const file = path.resolve(ROOT, relative);
      if (file !== ROOT && !file.startsWith(ROOT + path.sep)) {
        response.writeHead(403); response.end(); return;
      }
      const bytes = onFixture && relative === 'app.js' ? fixtureApp
        : onFixture && relative === 'index.html' ? fixtureIndex : await fs.readFile(file);
      response.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      response.end(bytes);
    } catch {
      response.writeHead(404); response.end('Not found');
    }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  baseURL = 'http://127.0.0.1:' + server.address().port + '/';
  browser = PROFILE === 'iphone-webkit'
    ? await webkit.launch({ headless: true })
    : await chromium.launch({
        executablePath: process.env.UX_CHROME || '/opt/google/chrome/chrome',
        headless: true,
        args: ['--no-sandbox']
      });

  await runCase('new-RIS-explicit-continue-IEP-valid-save', async page => {
    await newRIS(page, { fullOnboarding: true });
    const before = await stored(page);
    assert.deepEqual(before.intent.ris, RIS);
    await assertMobileFit(page);
    await page.locator('#continueFirstCheckin').click();
    await step(page, 2);
    await equalStored(page, before);
    await toRevision(page);
    await cycles(page, 0);
    await complete(page);
    await cycles(page, 1);
    const after = await stored(page);
    assert.deepEqual(after.intent.cycles[0].cie, RIS, 'Explicit Continue uses just-saved RIS snapshot');
    assert.equal(after.intent.id, before.intent.id);
    assert.equal(after.intent.createdAt, before.intent.createdAt);
    await page.locator('[data-nav="history"]').click();
    assert.equal(await page.locator('.timeline .event').count(), 1);
    await page.screenshot({ path: path.join(OUT, 'completed-first-checkin.png'), fullPage: true });
  }, { onboarding: false });

  await runCase('finish-later-reload-Home-History-resume', async page => {
    await newRIS(page);
    const before = await stored(page);
    await page.locator('#finishFirstCheckinLater').click();
    await equalStored(page, before);
    assert.equal(await page.locator('#startCheckin').textContent(), await localized(page, 'en', 'continueFirstCheckin'));
    await page.reload({ waitUntil: 'networkidle' });
    await equalStored(page, before);
    await page.locator('[data-nav="history"]').click();
    assert.equal(await page.locator('.timeline .event').count(), 0);
    await page.locator('#historyFirstCheckin').click();
    await step(page, 1);
    for (const key of RIS_FIELDS) assert.equal(await page.locator('#' + key).inputValue(), RIS[key]);
    await equalStored(page, before);
    await page.locator('#wizNext').click();
    await step(page, 2);
    await equalStored(page, before);
  });

  await runCase('existing-zero-cycle-Home-review-preserves-record', async page => {
    const before = existingRecord();
    await equalStored(page, before);
    await beginReturning(page);
    await equalStored(page, before);
  }, { record: existingRecord() });

  await runCase('cancel-dismiss-accept-does-not-create-cycle', async page => {
    await newRIS(page);
    const before = await stored(page);
    await page.locator('#continueFirstCheckin').click();
    await page.locator('#actions').fill('Unsaved draft text');
    await clickWithDialog(page, '#wizCancel', false);
    await step(page, 2);
    assert.equal(await page.locator('#actions').inputValue(), 'Unsaved draft text');
    await clickWithDialog(page, '#wizCancel', true);
    await equalStored(page, before);
    await page.locator('#startCheckin').click();
    await step(page, 1);
    await page.locator('#wizNext').click();
    await step(page, 2);
    assert.equal(await page.locator('#actions').inputValue(), '', 'Accepted cancellation discards only the unsaved draft');
    await equalStored(page, before);
  });

  await runCase('invalid-RIS-does-not-save-intent', async page => {
    await page.locator('#createGoal').click();
    await page.locator('#primary').fill(RIS.primary);
    await page.locator('#risSave').click();
    assert.equal((await stored(page))?.intent ?? null, null);
    assert.equal(await page.locator('#success').getAttribute('aria-invalid'), 'true');
    assert.equal(await page.locator('#continueFirstCheckin').count(), 0);
    await page.locator('#risCancel').click();
    assert.equal((await stored(page))?.intent ?? null, null);
    await page.locator('#createGoal').click();
    assert.equal(await page.locator('#primary').inputValue(), '', 'Cancelling unsaved RIS does not create an intention');
    await fillRIS(page);
    await page.locator('#risSave').click();
    await page.locator('#continueFirstCheckin').waitFor({ state: 'visible' });
    await cycles(page, 0);
  });

  await runCase('invalid-CIE-required-fields-do-not-advance', async page => {
    const before = existingRecord();
    await page.locator('#startCheckin').click();
    await step(page, 1);
    await page.locator('#scope').fill('   ');
    await clickWithDialog(page, '#wizNext', true);
    await step(page, 1);
    assert.equal(await page.locator('#scope').getAttribute('aria-invalid'), 'true');
    await equalStored(page, before);
    await page.locator('#scope').fill(RIS.scope);
    await page.locator('#wizNext').click();
    await step(page, 2);
  }, { record: existingRecord() });

  await runCase('invalid-IEP-hours-do-not-save-or-advance', async page => {
    const before = existingRecord();
    await beginReturning(page);
    await page.locator('#hours').fill('169');
    await clickWithDialog(page, '#wizNext', true);
    await step(page, 2);
    await equalStored(page, before);
    await page.locator('#hours').fill('-1');
    await clickWithDialog(page, '#wizNext', true);
    await step(page, 2);
    await equalStored(page, before);
    await page.locator('#hours').fill('0.3');
    await clickWithDialog(page, '#wizNext', true);
    await step(page, 2);
    await equalStored(page, before);
    await page.locator('#hours').fill('168');
    await page.locator('#wizNext').click();
    await step(page, 3);
    await equalStored(page, before);
  }, { record: existingRecord() });

  await runCase('revision-selection-required-before-cycle-save', async page => {
    const before = existingRecord();
    await beginReturning(page);
    await toRevision(page);
    await page.locator('input[name="intentional"][value="yes"]').click();
    await page.locator('#wizComplete').click();
    await step(page, 4);
    await equalStored(page, before);
    await page.locator('[data-dim="primary"]').click();
    await page.locator('#revision-primary').fill(NEW_RIS.primary);
    await cycles(page, 0);
    await complete(page);
    const after = await stored(page);
    assert.equal(after.intent.cycles.length, 1);
    assert.equal(after.intent.ris.primary, NEW_RIS.primary);
    for (const key of RIS_FIELDS.filter(k => k !== 'primary')) assert.equal(after.intent.ris[key], before.intent.ris[key]);
  }, { record: existingRecord() });

  await runCase('back-navigation-keeps-unsaved-fields-no-cycle', async page => {
    const before = existingRecord();
    await beginReturning(page);
    await page.locator('#actions').fill('Keep this action draft');
    await page.locator('#hours').fill('2.5');
    await page.locator('#wizBack').click();
    await step(page, 1);
    assert.equal(await page.locator('#primary').inputValue(), RIS.primary);
    await page.locator('#primary').fill('Current snapshot only');
    await page.locator('#wizNext').click();
    await step(page, 2);
    assert.equal(await page.locator('#actions').inputValue(), 'Keep this action draft');
    assert.equal(await page.locator('#hours').inputValue(), '2.5');
    await equalStored(page, before);
  }, { record: existingRecord() });

  await runCase('edit-existing-RIS-keeps-identity-and-zero-cycles', async page => {
    const before = existingRecord();
    await page.locator('#editGoal').click();
    await fillRIS(page, NEW_RIS);
    await page.locator('#risSave').click();
    await page.locator('#startCheckin').waitFor({ state: 'visible' });
    assert.equal(await page.locator('#continueFirstCheckin').count(), 0, 'Editing RIS does not repeat the creation handoff');
    const after = await stored(page);
    assert.deepEqual(after, { ...before, intent: { ...before.intent, ris: NEW_RIS } });
  }, { record: existingRecord() });

  await runCase('existing-cycle-unmodified-later-checkin-remains-blank-CIE', async page => {
    const before = existingRecord([existingCycle()]);
    await equalStored(page, before);
    assert.equal(await page.locator('#startCheckin').textContent(), await localized(page, 'en', 'checkin'));
    await page.locator('[data-nav="history"]').click();
    assert.equal(await page.locator('.timeline .event').count(), 1);
    assert.equal(await page.locator('#historyFirstCheckin').count(), 0);
    await page.locator('[data-nav="home"]').click();
    await page.locator('#startCheckin').click();
    await step(page, 1);
    for (const key of RIS_FIELDS) assert.equal(await page.locator('#' + key).inputValue(), '');
    await clickWithDialog(page, '#wizCancel', true);
    await equalStored(page, before);
  }, { record: existingRecord([existingCycle()]) });

  await runCase('Russian-Home-copy-RIS-help-and-language-draft', async page => {
    await page.locator('#createGoal').click();
    for (const key of RIS_FIELDS) {
      const helpID = await page.locator('#' + key).getAttribute('aria-describedby');
      assert.ok(helpID, 'RIS field must expose its explanation');
      assert.equal(await page.locator('#' + helpID).textContent(), await localized(page, 'ru', key + 'Help'));
    }
    for (const key of ['scope', 'nonGoals', 'constraints', 'rationale'])
      assert.notEqual(await localized(page, 'ru', key + 'Help'), await localized(page, 'en', key + 'Help'));
    await fillRIS(page);
    await switchLanguage(page, 'en');
    for (const key of RIS_FIELDS) assert.equal(await page.locator('#' + key).inputValue(), RIS[key]);
    await switchLanguage(page, 'ru');
    await page.locator('#risSave').click();
    await page.locator('#continueFirstCheckin').waitFor({ state: 'visible' });
    assert.equal(await page.locator('#continueFirstCheckin').textContent(), await localized(page, 'ru', 'continueFirstCheckin'));
    await page.locator('#finishFirstCheckinLater').click();
    assert.equal(await page.locator('#startCheckin').textContent(), await localized(page, 'ru', 'continueFirstCheckin'));
    assert.ok((await page.locator('main').textContent()).includes(await localized(page, 'ru', 'recommended')));
    assert.ok((await page.locator('main').textContent()).includes(await localized(page, 'ru', 'noCheckinSummary')));
    assert.notEqual(await localized(page, 'ru', 'noCheckinSummary'), await localized(page, 'en', 'noCheckinSummary'));
    assert.equal((await page.locator('main').textContent()).includes('Recommended rhythm:'), false);
    await page.screenshot({ path: path.join(OUT, 'Russian-zero-cycle-Home.png'), fullPage: true });
  }, { lang: 'ru' });

  await runCase('explicit-first-IEP-Back-reviews-just-saved-CIE', async page => {
    await newRIS(page);
    const before = await stored(page);
    await page.locator('#continueFirstCheckin').click();
    await step(page, 2);
    await page.locator('#actions').fill('Preserved while reviewing CIE');
    await page.locator('#wizBack').click();
    await step(page, 1);
    for (const key of RIS_FIELDS) assert.equal(await page.locator('#' + key).inputValue(), RIS[key]);
    await page.locator('#wizNext').click();
    await step(page, 2);
    assert.equal(await page.locator('#actions').inputValue(), 'Preserved while reviewing CIE');
    await equalStored(page, before);
  });

  await runCase('failed-persistence-keeps-RIS-cycles-and-draft', async page => {
    const before = existingRecord();
    await beginReturning(page);
    await toRevision(page);
    await page.locator('input[name="intentional"][value="yes"]').click();
    await page.locator('[data-dim="primary"]').click();
    await page.locator('#revision-primary').fill(NEW_RIS.primary);
    await page.evaluate(key => {
      window.__uxOriginalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = function(k, v) {
        if (k === key) throw new DOMException('Focused storage failure fixture', 'QuotaExceededError');
        return window.__uxOriginalSetItem.call(this, k, v);
      };
    }, STORAGE);
    await page.locator('#wizComplete').click();
    await step(page, 4);
    await equalStored(page, before);
    assert.equal(await page.locator('#revision-primary').inputValue(), NEW_RIS.primary);
    await page.evaluate(() => {
      Storage.prototype.setItem = window.__uxOriginalSetItem;
      delete window.__uxOriginalSetItem;
    });
    await complete(page);
    const after = await stored(page);
    assert.equal(after.intent.cycles.length, 1);
    assert.equal(after.intent.ris.primary, NEW_RIS.primary);
  }, { record: existingRecord() });

  await runCase('existing-backup-import-export-preserves-values', async page => {
    const backup = existingRecord([existingCycle()]);
    await page.locator('[data-nav="data"]').click();
    const dialog = page.waitForEvent('dialog');
    page.once('dialog', event => event.accept());
    await page.locator('#importFile').setInputFiles({
      name: 'existing-backup.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(backup))
    });
    await dialog;
    await equalStored(page, backup);
    const downloadEvent = page.waitForEvent('download');
    await page.locator('#exportBtn').click();
    const download = await downloadEvent;
    const chunks = [];
    for await (const chunk of await download.createReadStream()) chunks.push(chunk);
    assert.deepEqual(JSON.parse(Buffer.concat(chunks).toString('utf8')), backup);
  });


  await runCase('Russian-ON-empty-state-localizes-only-approved-canonical-fallback', async page => {
    const before = existingRecord();
    const witness = await page.evaluate(key => {
      const dto = window.PHEISIRAETHA_ANALYTICS_V1.evaluate(JSON.parse(localStorage.getItem(key)));
      return {
        dtoVersion: dto.dtoVersion, mode: dto.mode, lang: dto.lang, dir: dto.dir,
        frozen: Object.isFrozen(dto) && Object.isFrozen(dto.components) && dto.components.every(Object.isFrozen),
        components: dto.components.map(component => ({
          templateId: component.templateId, text: component.text, surface: component.surface, role: component.role
        }))
      };
    }, STORAGE);
    assert.equal(witness.dtoVersion, 'pheisiraetha-render-v1');
    assert.equal(witness.mode, 'FALLBACK_ONLY');
    assert.equal(witness.lang, 'en', 'Frozen DTO locale contract remains canonical English');
    assert.equal(witness.dir, 'ltr');
    assert.equal(witness.frozen, true);
    assert.deepEqual(witness.components, [{
      templateId: 'safety.fallback.noInterpretationOrNextFocus',
      text: 'No interpretation or next focus is shown here.',
      surface: 'FALLBACK',
      role: 'FALLBACK'
    }]);
    await page.locator('#analyticsHost > section').waitFor({ state: 'visible' });
    assert.equal(await page.locator('#analyticsHost > section').getAttribute('lang'), 'ru');
    assert.equal(await page.locator('#analyticsHost > section').getAttribute('dir'), 'ltr');
    assert.equal(await page.locator('#analyticsHost p').textContent(), await localized(page, 'ru', 'analyticsEmpty'));
    assert.equal((await page.locator('main').textContent()).includes(witness.components[0].text), false);
    await equalStored(page, before);
    await page.screenshot({ path: path.join(OUT, 'Russian-ON-approved-empty-state.png'), fullPage: true });
  }, { record: existingRecord(), lang: 'ru' });

  await runCase('new-RIS-storage-failure-retains-inputs-without-phantom-intent', async page => {
    await page.locator('#createGoal').click();
    await fillRIS(page);
    const before = await stored(page);
    await installStorageFailure(page);
    await page.locator('#risSave').click();
    await equalStored(page, before);
    assert.equal(await page.locator('#continueFirstCheckin').count(), 0);
    assert.equal(await page.locator('#risMsg').getAttribute('role'), 'alert');
    assert.equal(await page.locator('#risMsg').textContent(), await localized(page, 'en', 'risSaveFailed'));
    for (const key of RIS_FIELDS) assert.equal(await page.locator('#' + key).inputValue(), RIS[key]);
    await removeStorageFailure(page);
    await page.locator('#risSave').click();
    await page.locator('#continueFirstCheckin').waitFor({ state: 'visible' });
    await cycles(page, 0);
    assert.deepEqual((await stored(page)).intent.ris, RIS);
  });

  await runCase('edit-RIS-storage-failure-cancel-and-retry-preserve-existing-data', async page => {
    const before = existingRecord([existingCycle()]);
    await page.locator('#editGoal').click();
    await fillRIS(page, NEW_RIS);
    await installStorageFailure(page);
    await page.locator('#risSave').click();
    await equalStored(page, before);
    assert.equal(await page.locator('#risMsg').getAttribute('role'), 'alert');
    for (const key of RIS_FIELDS) assert.equal(await page.locator('#' + key).inputValue(), NEW_RIS[key]);
    await removeStorageFailure(page);
    await page.locator('#risCancel').click();
    await equalStored(page, before);
    assert.equal(await page.locator('main h1').textContent(), before.intent.ris.primary);
    await page.locator('#editGoal').click();
    await fillRIS(page, NEW_RIS);
    await page.locator('#risSave').click();
    await page.locator('#startCheckin').waitFor({ state: 'visible' });
    const after = await stored(page);
    assert.deepEqual(after, { ...before, intent: { ...before.intent, ris: NEW_RIS } });
  }, { record: existingRecord([existingCycle()]) });

  await runCase('OFF-zero-cycle-first-checkin-entry-remains-accessible', async page => {
    const before = existingRecord();
    assert.equal(await page.locator('#analyticsHost').count(), 0);
    assert.equal(await page.locator('#startCheckin').textContent(), await localized(page, 'ru', 'continueFirstCheckin'));
    await beginReturning(page);
    await equalStored(page, before);
  }, { record: existingRecord(), lang: 'ru', fixtureMode: 'OFF' });


  const newLocaleKeys = [
    'risSaveFailed', 'analyticsEmpty', 'firstCheckinTitle', 'firstCheckinIntro',
    'continueFirstCheckin', 'finishLater', 'startFirstCheckin', 'noCheckinSummary',
    'checkinInvalid', 'firstCheckinSnapshotIntro', 'firstCheckinReviewIntro',
    'checkinSaveFailed'
  ];
  const localeContext = { window: {} };
  require('node:vm').runInNewContext(await fs.readFile(path.join(ROOT, 'locales.js'), 'utf8'), localeContext);
  const supportedLocales = Object.keys(localeContext.window.PHEISIRAETHA_LOCALES);
  assert.equal(supportedLocales.length, 31);
  for (const lang of supportedLocales) {
    await runCase('locale-' + lang + '-first-run-help-handoff-resume-storage-errors', async page => {
      await assertLocale(page, lang);
      const dictionary = await page.evaluate(code => {
        const locale = window.PHEISIRAETHA_LOCALES[code];
        return { translations: locale.translations, frozen: Object.isFrozen(locale.translations) && Object.isFrozen(locale) };
      }, lang);
      assert.equal(dictionary.frozen, true);
      for (const key of [...newLocaleKeys, ...RIS_FIELDS.map(field => field + 'Help')]) {
        assert.equal(typeof dictionary.translations[key], 'string', lang + '.' + key);
        assert.ok(dictionary.translations[key].trim(), lang + '.' + key);
        if (lang !== 'en')
          assert.notEqual(dictionary.translations[key], await localized(page, 'en', key), 'No English fallback: ' + lang + '.' + key);
      }
      await page.locator('#onboardingSkip').click();
      await page.locator('#createGoal').click();
      await assertRISHelp(page, lang);
      await fillRIS(page);
      const unsaved = await stored(page);
      await installStorageFailure(page);
      await page.locator('#risSave').click();
      await equalStored(page, unsaved);
      await assertLocaleText(page, '#risMsg', lang, 'risSaveFailed');
      assert.equal(await page.locator('#continueFirstCheckin').count(), 0);
      for (const key of RIS_FIELDS) assert.equal(await page.locator('#' + key).inputValue(), RIS[key]);
      await removeStorageFailure(page);
      await page.locator('#risSave').click();
      await page.locator('#continueFirstCheckin').waitFor({ state: 'visible' });
      const saved = await stored(page);
      await cycles(page, 0);
      await assertLocaleText(page, 'main h1', lang, 'firstCheckinTitle');
      await assertLocaleText(page, 'main .hero .muted', lang, 'firstCheckinIntro');
      await assertLocaleText(page, '#continueFirstCheckin', lang, 'continueFirstCheckin');
      await assertLocaleText(page, '#finishFirstCheckinLater', lang, 'finishLater');
      await assertMobileFit(page);
      await assertFlowFit(page, ['#continueFirstCheckin', '#finishFirstCheckinLater']);
      await page.locator('#continueFirstCheckin').click();
      await step(page, 2);
      assert.ok((await page.locator('main').textContent()).includes(dictionary.translations.firstCheckinSnapshotIntro));
      await page.locator('#hours').fill('169');
      const invalid = page.waitForEvent('dialog');
      page.once('dialog', dialog => dialog.accept());
      await page.locator('#wizNext').click();
      assert.equal((await invalid).message(), dictionary.translations.checkinInvalid);
      await step(page, 2);
      await equalStored(page, saved);
      await clickWithDialog(page, '#wizCancel', true);
      await equalStored(page, saved);
      await assertCanonicalEmptyDTO(page);
      await page.locator('#analyticsHost > section').waitFor({ state: 'visible' });
      const localeMetadata = await page.evaluate(code => ({
        htmlLang: window.PHEISIRAETHA_LOCALES[code].htmlLang,
        dir: window.PHEISIRAETHA_LOCALES[code].dir
      }), lang);
      assert.equal(await page.locator('#analyticsHost > section').getAttribute('lang'), localeMetadata.htmlLang);
      assert.equal(await page.locator('#analyticsHost > section').getAttribute('dir'), localeMetadata.dir);
      await assertLocaleText(page, '#analyticsHost p', lang, 'analyticsEmpty');
      await page.locator('#startCheckin').click();
      await step(page, 1);
      await assertRISHelp(page, lang);
      assert.ok((await page.locator('main').textContent()).includes(dictionary.translations.firstCheckinReviewIntro));
      await page.locator('#wizNext').click();
      await step(page, 2);
      await toRevision(page);
      await installStorageFailure(page);
      await page.locator('#wizComplete').click();
      await step(page, 4);
      await assertLocaleText(page, '#wizMsg', lang, 'checkinSaveFailed');
      await equalStored(page, saved);
      await removeStorageFailure(page);
      await clickWithDialog(page, '#wizCancel', true);
      await assertLocaleText(page, '#firstCheckinHomeTitle', lang, 'startFirstCheckin');
      assert.ok((await page.locator('main').textContent()).includes(dictionary.translations.noCheckinSummary));
      await assertLocaleText(page, '#startCheckin', lang, 'continueFirstCheckin');
      await assertCanonicalEmptyDTO(page);
      await equalStored(page, saved);
      await page.reload({ waitUntil: 'networkidle' });
      await assertLocale(page, lang);
      await equalStored(page, saved);
      await page.locator('#startCheckin').click();
      await step(page, 1);
      assert.ok((await page.locator('main').textContent()).includes(dictionary.translations.firstCheckinReviewIntro));
      await assertRISHelp(page, lang);
      for (const key of RIS_FIELDS) assert.equal(await page.locator('#' + key).inputValue(), RIS[key]);
      await clickWithDialog(page, '#wizCancel', true);
      await equalStored(page, saved);
      await page.locator('[data-nav="history"]').click();
      assert.equal(await page.locator('.timeline .event').count(), 0);
      await assertLocaleText(page, '#historyFirstCheckin', lang, 'continueFirstCheckin');
      await page.locator('#historyFirstCheckin').click();
      await step(page, 1);
      await equalStored(page, saved);
    }, { lang, onboarding: false });
  }

  for (const lang of ['ar', 'he']) {
    await runCase(lang + '-RTL-onboarding-new-RIS-finish-later-resume-cancel-valid-save', async page => {
      const values = lang === 'ar' ? {
        primary: 'قراءة كتاب مع مجموعة صغيرة',
        success: 'اجتماع واحد مع ثلاثة مشاركين',
        scope: 'كتاب واحد واجتماع واحد',
        nonGoals: 'لا فعالية عامة ولا قائمة بريدية',
        constraints: 'ساعتان أسبوعيا مع حفظ الخصوصية',
        rationale: 'أريد تخصيص وقت منتظم للقراءة'
      } : {
        primary: 'קריאת ספר עם קבוצה קטנה',
        success: 'פגישה אחת עם שלושה משתתפים',
        scope: 'ספר אחד ופגישה אחת',
        nonGoals: 'ללא אירוע ציבורי וללא רשימת תפוצה',
        constraints: 'שעתיים בשבוע ושמירה על הפרטיות',
        rationale: 'אני רוצה להקדיש זמן קבוע לקריאה'
      };
      await assertLocale(page, lang);
      for (let index = 0; index < 3; index++) {
        await assertFlowFit(page, ['#onboardingNext', '#onboardingSkip']);
        await page.locator('#onboardingNext').click();
      }
      await assertFlowFit(page, ['#onboardingStart']);
      await page.screenshot({ path: path.join(OUT, lang + '-RTL-onboarding.png'), fullPage: true });
      await page.locator('#onboardingStart').click();
      await page.locator('#createGoal').click();
      await assertRISHelp(page, lang);
      await fillRIS(page, values);
      for (const key of RIS_FIELDS)
        assert.equal(await page.locator('#' + key).evaluate(element => getComputedStyle(element).direction), 'rtl');
      await page.locator('#risSave').click();
      await page.locator('#continueFirstCheckin').waitFor({ state: 'visible' });
      await assertLocale(page, lang);
      await assertMobileFit(page);
      await assertFlowFit(page, ['#continueFirstCheckin', '#finishFirstCheckinLater']);
      await page.screenshot({ path: path.join(OUT, lang + '-RTL-saved-RIS.png'), fullPage: true });
      const saved = await stored(page);
      assert.deepEqual(saved.intent.ris, values);
      await cycles(page, 0);
      await page.locator('#finishFirstCheckinLater').click();
      await equalStored(page, saved);
      await page.reload({ waitUntil: 'networkidle' });
      await equalStored(page, saved);
      await assertLocale(page, lang);
      await assertFlowFit(page, ['#startCheckin']);
      await page.locator('[data-nav="history"]').click();
      assert.equal(await page.locator('.timeline .event').count(), 0);
      await assertFlowFit(page, ['#historyFirstCheckin']);
      await page.locator('#historyFirstCheckin').click();
      await step(page, 1);
      await assertRISHelp(page, lang);
      for (const key of RIS_FIELDS) assert.equal(await page.locator('#' + key).inputValue(), values[key]);
      await page.locator('#wizNext').click();
      await step(page, 2);
      assert.equal(await page.locator('#hours').getAttribute('dir'), 'ltr', 'Numeric input stays left-to-right in RTL UI');
      const draft = lang === 'ar' ? 'قراءة الفصل الأول' : 'קריאת הפרק הראשון';
      await page.locator('#actions').fill(draft);
      await assertFlowFit(page, ['#wizNext', '#wizBack', '#wizCancel', '#actions', '#hours']);
      await page.locator('#wizBack').click();
      await step(page, 1);
      await page.locator('#wizNext').click();
      await step(page, 2);
      assert.equal(await page.locator('#actions').inputValue(), draft);
      await clickWithDialog(page, '#wizCancel', false);
      await step(page, 2);
      assert.equal(await page.locator('#actions').inputValue(), draft);
      await clickWithDialog(page, '#wizCancel', true);
      await equalStored(page, saved);
      await page.locator('#startCheckin').click();
      await step(page, 1);
      await page.locator('#wizNext').click();
      await step(page, 2);
      assert.equal(await page.locator('#actions').inputValue(), '');
      await toRevision(page);
      await assertFlowFit(page, ['#wizComplete', '#wizCancel']);
      await cycles(page, 0);
      await complete(page);
      await cycles(page, 1);
      const after = await stored(page);
      assert.deepEqual(after.intent.ris, values);
      assert.deepEqual(after.intent.cycles[0].cie, values);
      assert.equal(after.intent.id, saved.intent.id);
      assert.equal(after.intent.createdAt, saved.intent.createdAt);
      await page.locator('[data-nav="history"]').click();
      assert.equal(await page.locator('.timeline .event').count(), 1);
      const timeline = await page.locator('.timeline').evaluate(element => {
        const style = getComputedStyle(element);
        return { direction: style.direction, right: parseFloat(style.borderRightWidth), left: parseFloat(style.borderLeftWidth) };
      });
      assert.deepEqual(timeline, { direction: 'rtl', right: 2, left: 0 }, 'History keeps RTL logical timeline alignment');
      await assertFlowFit(page);
      await page.screenshot({ path: path.join(OUT, lang + '-RTL-completed-History.png'), fullPage: true });
    }, { lang, onboarding: false });
  }
  assert.equal(results.length, 52, '19 accepted regressions + 31 locale flows + 2 complete RTL flows');

  assert.equal(await fs.readFile(path.join(ROOT, 'app.js'), 'utf8'), sourceApp, 'Harness must not rewrite source');
  assert.equal(await fs.readFile(path.join(ROOT, 'index.html'), 'utf8'), sourceIndex, 'Harness must not rewrite entry');
  assert.equal(crypto.createHash('sha256').update(await fs.readFile(path.join(ROOT, ARTIFACT_PATH))).digest('hex'), ARTIFACT_SHA, 'Artifact remains untouched');
  const sourceHashes = {};
  for (const file of ['app.js', 'app.css', 'locales.js'])
    sourceHashes[file] = crypto.createHash('sha256').update(await fs.readFile(path.join(ROOT, file))).digest('hex');
  const failed = results.filter(item => item.status !== 'PASS');
  const report = {
    status: failed.length ? 'FAIL' : 'PASS',
    scope: 'Separate development/public-on integration; first check-in, 31 locales and RTL emulated browser profiles; no release archives, frozen verifiers or public deployment',
    fixtureDisclaimer: 'ON cases activate only an in-memory HTTP fixture response and load the existing frozen artifact. Source app/index and approved archives are never rewritten; this is not a release build or qualification rerun.',
    localization: { supported: supportedLocales, newKeys: newLocaleKeys, RISHelpKeys: RIS_FIELDS.map(field => field + 'Help'), allLocaleBrowserFlows: 31, dedicatedRTLFlows: ['ar', 'he'] },
    sourceDefaultAnalyticsFlag: 'OFF',
    originalArtifactSHA256: ARTIFACT_SHA,
    originalArtifactBytes: artifactBytes.length,
    fixtureONAppSHA256: crypto.createHash('sha256').update(fixtureApp).digest('hex'),
    profile: PROFILE,
    engine: PROFILE === 'iphone-webkit' ? 'WebKit' : 'Installed Google Chrome',
    browserVersion: browser.version(),
    deviceLimit: 'Viewport, touch and user-agent emulation; not a physical iPhone or Samsung test',
    repository: process.env.GITHUB_REPOSITORY || null,
    headSHA: process.env.TESTED_HEAD || null,
    runID: process.env.GITHUB_RUN_ID || null,
    sourceHashes,
    passed: results.length - failed.length,
    total: results.length,
    results
  };
  await fs.writeFile(path.join(OUT, 'FIRST_CHECKIN_UX_RESULT.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ profile: PROFILE, status: report.status, passed: report.passed, total: report.total }));
  if (failed.length) process.exitCode = 1;
}
main().catch(async error => {
  console.error(error);
  await fs.mkdir(OUT, { recursive: true });
  await fs.writeFile(path.join(OUT, 'FIRST_CHECKIN_UX_FATAL.json'), JSON.stringify({
    status: 'FAIL', profile: PROFILE, error: String(error.stack || error)
  }, null, 2) + '\n');
  process.exitCode = 1;
}).finally(async () => {
  await browser?.close();
  if (server) await new Promise(resolve => server.close(resolve));
});
