'use strict';

// S4 only. These tests require the separately aggregated S1 app.js wiring.
// Reuse the baseline suite's private VM + real artifact pattern and its fixture
// writer. Do not import another test suite (which would register extra tests).
// Only the static flag and a private observation bridge change in-memory app
// text. Save/import/reset/render functions and the frozen artifact stay intact.
// The only injected failure is localStorage.setItem for the existing state key.
// This shard is syntax-checked only until aggregation with S1.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');
const { createHash } = require('node:crypto');
const fixtures = require('../runtime-core/fixtures.cjs');

const ROOT = path.resolve(__dirname, '../..');
const BASE = '8abdd344cf9ef9c7feafb0da70c3c245ee319d63';
const STORAGE_KEY = 'pheisiraetha_v01';
const LANGUAGE_KEY = 'pheisiraetha_language_v01';
const ONBOARDING_KEY = 'pheisiraetha_onboarding_v01';
const STORAGE_KEYS = [STORAGE_KEY, LANGUAGE_KEY, ONBOARDING_KEY].sort();
const PRIVATE_API = '__APP_ANALYTICS_PERSISTENCE_TEST_ONLY__';
const APP_SOURCE = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
const BASE_SOURCE = execFileSync('git', ['show', `${BASE}:app.js`], { cwd: ROOT, encoding: 'utf8' });
const LOCALES_SOURCE = fs.readFileSync(path.join(ROOT, 'locales.js'), 'utf8');
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'browser-packaging/build-manifest.json'), 'utf8'));
const artifact = fs.readFileSync(path.join(ROOT, manifest.output.file));
assert.equal(manifest.output.sha256, 'f1f975900faaa64649bcef42412c1856543c8716711d4119df9b964f4bf8c824');
assert.equal(createHash('sha256').update(artifact).digest('hex'), manifest.output.sha256);

const plain = value => structuredClone(value);
const fixture = (count = 1) => fixtures.fixture(count, Array(10).fill('Calm / contentment'));
const empty = () => ({ version: '0.1.0', lang: 'ru', intent: null });
const decode = text => String(text).replace(/&(amp|lt|gt|quot|apos|#39);/g,
  (_, name) => ({ amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", '#39': "'" })[name]);

// A small DOM model for production forms/rendering, not a browser/a11y claim.
// Unsupported selectors throw rather than silently hiding an untested path.
class Node {
  constructor(document, tag = null, text = '') {
    this.ownerDocument = document;
    this.tagName = tag?.toUpperCase() ?? null;
    this.nodeType = tag === '#fragment' ? 11 : tag ? 1 : 3;
    this.data = text;
    this.parentNode = null;
    this.childNodes = [];
    this.attrs = new Map();
    this.dataset = {};
    this.listeners = new Map();
    this.style = {};
    this.checked = false;
    this.selected = false;
    this.classList = {
      contains: name => this.className.split(/\s+/).includes(name),
      add: (...names) => { this.className = [...new Set([...this.className.split(/\s+/).filter(Boolean), ...names])].join(' '); },
      remove: (...names) => { this.className = this.className.split(/\s+/).filter(name => !names.includes(name)).join(' '); },
      toggle: (name, force) => {
        const next = force ?? !this.classList.contains(name);
        this.classList[next ? 'add' : 'remove'](name);
        return next;
      }
    };
  }
  get children() { return this.childNodes.filter(node => node.nodeType === 1); }
  get parentElement() { return this.parentNode?.nodeType === 1 ? this.parentNode : null; }
  get firstChild() { return this.childNodes[0] ?? null; }
  get lastElementChild() { return this.children.at(-1) ?? null; }
  get nextSibling() { return this.parentNode?.childNodes[this.parentNode.childNodes.indexOf(this) + 1] ?? null; }
  get isConnected() { return this.ownerDocument.documentElement.contains(this); }
  get id() { return this.getAttribute('id') ?? ''; }
  set id(value) { this.setAttribute('id', value); }
  get className() { return this.getAttribute('class') ?? ''; }
  set className(value) { this.setAttribute('class', value); }
  get attributes() { return [...this.attrs].map(([name, value]) => ({ name, value })); }
  get textContent() { return this.nodeType === 3 ? this.data : this.childNodes.map(node => node.textContent).join(''); }
  set textContent(value) { this.replaceChildren(this.ownerDocument.createTextNode(String(value))); }
  get value() {
    if (this.tagName === 'SELECT') return this.options[this.selectedIndex]?.value ?? '';
    return this._value ?? (this.tagName === 'TEXTAREA' ? this.textContent : this.getAttribute('value') ?? '');
  }
  set value(value) {
    if (this.tagName === 'SELECT') this.options.forEach(option => { option.selected = option.value === String(value); });
    else this._value = String(value);
  }
  get options() { return this.children.filter(node => node.tagName === 'OPTION'); }
  get selectedIndex() { const index = this.options.findIndex(option => option.selected); return index < 0 ? 0 : index; }
  set selectedIndex(index) { this.options.forEach((option, i) => { option.selected = i === index; }); }
  setAttribute(name, value) {
    this.attrs.set(name, String(value));
    if (name.startsWith('data-')) this.dataset[name.slice(5).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())] = String(value);
    if (name === 'checked' || name === 'selected') this[name] = true;
  }
  getAttribute(name) { return this.attrs.get(name) ?? null; }
  hasAttribute(name) { return this.attrs.has(name); }
  removeAttribute(name) { this.attrs.delete(name); }
  contains(node) { return this === node || this.childNodes.some(child => child.contains(node)); }
  remove() {
    if (this.parentNode) this.parentNode.childNodes.splice(this.parentNode.childNodes.indexOf(this), 1);
    this.parentNode = null;
  }
  appendChild(node) {
    if (node.nodeType === 11) { for (const child of [...node.childNodes]) this.appendChild(child); return node; }
    node.remove();
    node.parentNode = this;
    this.childNodes.push(node);
    return node;
  }
  append(...nodes) { nodes.forEach(node => this.appendChild(typeof node === 'string' ? this.ownerDocument.createTextNode(node) : node)); }
  insertBefore(node, reference) {
    if (reference === null) return this.appendChild(node);
    assert.equal(reference.parentNode, this, 'Insertion reference must belong to its actual parent');
    node.remove();
    node.parentNode = this;
    this.childNodes.splice(this.childNodes.indexOf(reference), 0, node);
    return node;
  }
  before(node) { this.parentNode.insertBefore(node, this); }
  replaceChildren(...nodes) { for (const node of [...this.childNodes]) node.remove(); this.append(...nodes); }
  set innerHTML(html) {
    this.replaceChildren();
    const stack = [this];
    const voidTags = new Set(['INPUT', 'IMG', 'BR', 'HR', 'META', 'LINK']);
    for (const token of String(html).matchAll(/<\/?([a-z][\w-]*)\b([^>]*)>|([^<]+)/gi)) {
      if (token[3] !== undefined) { stack.at(-1).appendChild(this.ownerDocument.createTextNode(decode(token[3]))); continue; }
      const tag = token[1].toUpperCase();
      if (token[0].startsWith('</')) {
        const index = stack.findLastIndex(node => node.tagName === tag);
        if (index > 0) stack.length = index;
        continue;
      }
      const node = this.ownerDocument.createElement(tag);
      for (const attr of token[2].matchAll(/([^\s=\/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g))
        node.setAttribute(attr[1], decode(attr[2] ?? attr[3] ?? attr[4] ?? ''));
      stack.at(-1).appendChild(node);
      if (!voidTags.has(tag)) stack.push(node);
    }
  }
  querySelectorAll(selector) {
    const selectors = selector.split(',').map(part => part.trim());
    const out = [];
    const visit = node => {
      for (const child of node.children) {
        if (selectors.some(part => matchesChain(child, part, this))) out.push(child);
        visit(child);
      }
    };
    visit(this);
    return out;
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0] ?? null; }
  closest(selector) { for (let node = this; node; node = node.parentElement) if (matchesSimple(node, selector, node)) return node; return null; }
  addEventListener(type, callback) { const callbacks = this.listeners.get(type) ?? []; callbacks.push(callback); this.listeners.set(type, callbacks); }
  dispatch(type, extra = {}) {
    const event = { target: this, currentTarget: this, preventDefault() {}, ...extra };
    const results = (this.listeners.get(type) ?? []).map(callback => callback(event));
    return Promise.all(results);
  }
  click() {
    if (this.tagName === 'A') { this.ownerDocument.download(this); return; }
    const callbacks = this.listeners.get('click') ?? [];
    assert.ok(callbacks.length, `Control ${this.id || this.tagName} must have a real production listener`);
    for (const callback of callbacks) callback({ target: this, currentTarget: this, preventDefault() {} });
  }
  focus() { this.ownerDocument.activeElement = this; }
  scrollIntoView() {}
}

function matchesSimple(node, selector, scope) {
  let rest = selector;
  const tag = rest.match(/^(?:[a-z][\w-]*|\*)/i);
  if (tag) { if (tag[0] !== '*' && node.tagName !== tag[0].toUpperCase()) return false; rest = rest.slice(tag[0].length); }
  while (rest) {
    let match;
    if ((match = rest.match(/^#([\w-]+)/))) { if (node.id !== match[1]) return false; }
    else if ((match = rest.match(/^\.([\w-]+)/))) { if (!node.classList.contains(match[1])) return false; }
    else if ((match = rest.match(/^\[([\w-]+)(?:=(?:"([^"]*)"|'([^']*)'|([^\]]*)))?\]/))) {
      if (!node.hasAttribute(match[1])) return false;
      const value = match[2] ?? match[3] ?? match[4];
      if (value !== undefined && node.getAttribute(match[1]) !== value) return false;
    } else if ((match = rest.match(/^:(checked|scope|first-child|last-child)\b/))) {
      if (match[1] === 'checked' && !node.checked) return false;
      if (match[1] === 'scope' && node !== scope) return false;
      if (match[1] === 'first-child' && node.parentNode?.children[0] !== node) return false;
      if (match[1] === 'last-child' && node.parentNode?.children.at(-1) !== node) return false;
    } else throw new Error(`Unsupported S4 DOM selector: ${selector}`);
    rest = rest.slice(match[0].length);
  }
  return true;
}
function matchesChain(node, selector, scope) {
  const parts = selector.match(/(?:\[[^\]]*\]|[^\s[\]])+/g) ?? [];
  function at(candidate, index) {
    if (!candidate || !matchesSimple(candidate, parts[index], scope)) return false;
    if (index === 0) return true;
    if (parts[index - 1] === '>') return at(candidate.parentElement, index - 2);
    for (let parent = candidate.parentElement; parent; parent = parent.parentElement) if (at(parent, index - 1)) return true;
    return false;
  }
  return parts.length > 0 && at(node, parts.length - 1);
}

function instrument(source, wired) {
  if (wired) {
    const flag = /\bconst\s+ANALYTICS_ENABLED\s*=\s*false\s*;/g;
    assert.equal([...source.matchAll(flag)].length, 1, 'Requires the aggregated, static default-OFF S1 flag');
    source = source.replace(flag, 'const ANALYTICS_ENABLED = true;');
    assert.match(source, /\blet\s+analyticsCommittedStateValid\s*=\s*true\s*;/, 'Requires the real S1 authority latch');
  }
  const end = /\n\}\)\(\);\s*$/;
  assert.ok(end.test(source), 'Locate the app IIFE end without replacing rendering or business functions');
  return source.replace(end, `
  globalThis.${PRIVATE_API} = Object.freeze({
    readState: () => state, readView: () => view, readLanguage: () => currentLang,
    readWizard: () => wizard, readDraft: () => risDraft,
    readAuthority: () => ${wired ? 'analyticsCommittedStateValid' : 'undefined'},
    validate: isValidBackup, persist, render
  });
})();`);
}

function harness(initial = fixture(), { baseline = false } = {}) {
  const entries = new Map([[STORAGE_KEY, JSON.stringify(initial)], [LANGUAGE_KEY, 'en'], [ONBOARDING_KEY, '1']]);
  const initialBytes = entries.get(STORAGE_KEY);
  const accesses = [], attempts = [], writes = [], writeProbes = [], alerts = [], timers = [], downloads = [], forbidden = [];
  let api, fault = false, uid = 0, timerId = 0;
  const storageError = new Error('TEST_ONLY_STATE_STORAGE_FAILURE');
  const document = {
    activeElement: null,
    createElement(tag) { return new Node(this, tag); },
    createTextNode(text) { return new Node(this, null, String(text)); },
    createDocumentFragment() { return new Node(this, '#fragment'); },
    querySelector(selector) { return this.documentElement.querySelector(selector); },
    querySelectorAll(selector) { return this.documentElement.querySelectorAll(selector); },
    getElementById(id) { return this.querySelector('#' + id); },
    addEventListener() {},
    download(anchor) { assert.ok(blobs.has(anchor.href), 'Real export must use its production Blob URL'); downloads.push(blobs.get(anchor.href)); }
  };
  document.documentElement = document.createElement('html');
  document.body = document.createElement('body');
  document.documentElement.appendChild(document.body);
  const root = document.createElement('div');
  root.id = 'app';
  document.body.appendChild(root);
  const bodies = () => document.getElementById('analyticsHost')?.textContent.trim() ?? '';
  const storage = {
    getItem(key) { accesses.push(['getItem', key]); return entries.get(key) ?? null; },
    setItem(key, value) {
      accesses.push(['setItem', key]);
      const text = String(value), fails = fault && key === STORAGE_KEY;
      attempts.push(['setItem', key, text, fails ? 'failed' : 'succeeded']);
      if (key === STORAGE_KEY && api) writeProbes.push({ authority: api.readAuthority(), bodies: bodies() });
      if (fails) throw storageError;
      writes.push(['setItem', key, text]);
      entries.set(key, text);
    },
    removeItem(key) { accesses.push(['removeItem', key]); attempts.push(['removeItem', key, 'succeeded']); writes.push(['removeItem', key]); entries.delete(key); },
    clear() { accesses.push(['clear']); throw new Error('Unexpected storage.clear in S4'); }
  };
  const blobs = new Map();
  const fixedTime = '2026-10-04T12:00:00.000Z';
  class FixtureDate extends Date {
    constructor(...args) { super(...(args.length ? args : [fixedTime])); }
    static now() { return Date.parse(fixedTime); }
  }
  const sandbox = {
    document, localStorage: storage, navigator: { languages: ['en'], language: 'en' }, location: { protocol: 'file:' },
    Date: FixtureDate, crypto: { randomUUID: () => `synthetic-persistence-id-${++uid}` }, AbortController, Blob,
    URL: { createObjectURL(blob) { const url = `blob:synthetic-${blobs.size}`; blobs.set(url, blob); return url; }, revokeObjectURL(url) { blobs.delete(url); } },
    alert: message => alerts.push(message), confirm: () => true,
    setTimeout(callback, delay) { const id = ++timerId; timers.push({ id, callback, delay }); return id; },
    clearTimeout(id) { const index = timers.findIndex(timer => timer.id === id); if (index >= 0) timers.splice(index, 1); }
  };
  sandbox.window = sandbox;
  for (const name of ['sessionStorage', 'indexedDB', 'caches', 'fetch', 'XMLHttpRequest', 'WebSocket', 'Worker'])
    Object.defineProperty(sandbox, name, { get() { forbidden.push(name); throw new Error(`Unexpected S4 I/O: ${name}`); } });
  const context = vm.createContext(sandbox, { codeGeneration: { strings: false, wasm: false } });
  const run = source => vm.runInContext(source, context, { timeout: 10000 });
  run(LOCALES_SOURCE);
  if (!baseline) run(artifact.toString('utf8')); // Actual frozen facade, never a replacement evaluator.
  run(instrument(baseline ? BASE_SOURCE : APP_SOURCE, !baseline));
  api = context[PRIVATE_API];
  assert.ok(api, 'Observation bridge is private to this VM');
  assert.deepEqual(writes, [], 'Initial render/evaluation must not persist anything');
  assert.deepEqual(forbidden, []);
  function element(selector) { const node = document.querySelector(selector); assert.ok(node, `Production control ${selector} must exist`); return node; }
  const app = {
    api, context, document, root, initialBytes, accesses, attempts, writes, writeProbes, alerts, timers, downloads, forbidden, storageError,
    bodies, element,
    armFault() { fault = true; }, disarmFault() { fault = false; },
    stored(key = STORAGE_KEY) { return entries.get(key) ?? null; },
    keys() { return [...entries.keys()].sort(); },
    click(selector) { element(selector).click(); },
    navigate(view) { app.click(`[data-nav="${view}"]`); assert.equal(api.readView(), view); },
    fillRIS(values) { for (const key of fixtures.D) element('#' + key).value = values[key]; },
    flushTimers() {
      let count = 0;
      while (timers.length) { assert.ok(++count < 20, 'No runaway application timers'); timers.shift().callback(); }
    },
    importRaw(raw) {
      const control = element('#importFile');
      return control.dispatch('change', { target: { files: [{ text: async () => raw }] } });
    },
    messages: context.PHEISIRAETHA_LOCALES.en.translations
  };
  return app;
}

function assertApprovedHome(app) {
  assert.equal(app.api.readAuthority(), true);
  assert.equal(app.api.readView(), 'home');
  assert.ok(app.api.readState().intent);
  const expected = app.context.PHEISIRAETHA_ANALYTICS_V1.evaluate(app.api.readState());
  assert.equal(expected.mode, 'APPROVED_BUNDLE', 'Fixture is a real frozen positive control');
  const host = app.document.getElementById('analyticsHost');
  assert.ok(host && app.root.contains(host), 'Actual production render must mount a live host');
  assert.ok(app.bodies(), 'Positive control must render actual approved bodies');
  for (const component of expected.components) assert.ok(host.textContent.includes(component.text));
}
function assertNoBodies(app) { assert.equal(app.bodies(), '', 'No old/current analytical body may survive lost authority'); }
function assertFailedAuthority(app) {
  assert.equal(app.api.readAuthority(), false, 'A failed state write must leave the real latch false');
  assert.equal(app.stored(), app.initialBytes, 'Failure preserves original stored bytes');
  assert.equal(app.writes.filter(([operation, key]) => operation === 'setItem' && key === STORAGE_KEY).length, 0);
  const probe = app.writeProbes.at(-1);
  assert.deepEqual(probe, { authority: false, bodies: '' }, 'Invalidate authority and remove analytical bodies BEFORE attempted persistence');
  assert.deepEqual(app.forbidden, []);
  assertNoBodies(app);
}

function prepareRIS(app, create = false, values) {
  app.click(create ? '#createGoal' : '#editGoal');
  app.fillRIS(values ?? Object.fromEntries(fixtures.D.map(key => [key, `Synthetic edited ${key}`])));
}
async function prepareCheckin(app, revision = false) {
  const ris = plain(app.api.readState().intent.ris);
  app.click('#startCheckin');
  app.fillRIS(ris);
  app.click('#wizNext');
  for (const [key, value] of Object.entries({ desire: 7, belief: 6, emotionIntensity: 4, mental: 6, practical: 8, hours: 3, actions: 'Synthetic completed action' }))
    app.element('#' + key).value = value;
  app.element('#emotion').value = 'Calm / contentment';
  app.element('#frequency').value = 'freq2';
  app.click('#wizNext');
  for (const [key, value] of Object.entries({ currentState: 'Synthetic new state', achievement: 3, events: 'Synthetic recorded event', direction: 'toward', external: 'Synthetic recorded context' }))
    app.element('#' + key).value = value;
  app.element('[data-evidence="direct"]').checked = true;
  app.click('#wizNext');
  if (revision) {
    for (const radio of app.document.querySelectorAll('input[name=intentional]')) radio.checked = radio.value === 'yes';
    await app.element('input[name=intentional][value="yes"]').dispatch('change');
    const dimension = app.element('[data-dim="scope"]');
    dimension.checked = true;
    await dimension.dispatch('change');
    app.element('#revision-scope').value = 'Synthetic intentional revision scope';
  }
  assert.equal(app.api.readWizard().step, 4, 'Reach actual completion/revision callback');
}

const failureCases = [
  { name: 'RIS create persist failure', initial: empty, prepare: app => prepareRIS(app, true), selector: '#risSave', kind: 'create' },
  { name: 'RIS edit persist failure', initial: fixture, prepare: app => prepareRIS(app), selector: '#risSave', kind: 'edit' },
  { name: 'completed check-in persist failure', initial: fixture, prepare: app => prepareCheckin(app), selector: '#wizComplete', kind: 'checkin' },
  { name: 'intentional revision persist failure', initial: fixture, prepare: app => prepareCheckin(app, true), selector: '#wizComplete', kind: 'revision' },
  { name: 'accepted import persist failure', initial: fixture, prepare: app => app.navigate('data'), kind: 'import' }
];
function acceptedBackup() { const value = fixture(2); value.intent.id = 'synthetic-accepted-import'; return value; }
async function fail(app, scenario) {
  await scenario.prepare(app);
  app.armFault();
  if (scenario.kind === 'import') {
    const value = acceptedBackup();
    assert.equal(app.api.validate(value), true, 'Storage failure must occur after real import acceptance');
    await app.importRaw(JSON.stringify(value));
    assert.deepEqual(app.alerts, [app.messages.importError], 'Existing import catch handles the persistence error');
  } else {
    assert.throws(() => app.click(scenario.selector), error => error === app.storageError, 'Existing uncaught save failure must remain the SAME storage exception');
    assert.deepEqual(app.alerts, []);
    assert.deepEqual(app.timers, [], 'Do not schedule the normal success path after a failed write');
  }
  assert.equal(app.attempts.filter(entry => entry[0] === 'setItem' && entry[1] === STORAGE_KEY && entry.at(-1) === 'failed').length, 1);
}

// Exactly five mutation failure cases plus the nine focused cases below: 14.
for (const scenario of failureCases) test(scenario.name, async () => {
  const initial = scenario.initial(), app = harness(initial), original = app.api.readState();
  if (initial.intent) assertApprovedHome(app);
  await fail(app, scenario);
  assertFailedAuthority(app);
  const state = app.api.readState();
  if (scenario.kind === 'create') {
    assert.equal(state, original);
    assert.ok(state.intent, 'Existing create mutation survives in memory when persist throws');
    assert.equal(state.intent.cycles.length, 0);
    assert.equal(state.intent.ris.primary, 'Synthetic edited primary');
  } else if (scenario.kind === 'edit') {
    assert.equal(state, original);
    assert.equal(state.intent.ris.primary, 'Synthetic edited primary');
    assert.equal(state.intent.cycles.length, initial.intent.cycles.length);
  } else if (scenario.kind === 'import') {
    assert.notEqual(state, original);
    assert.deepEqual(plain(state), acceptedBackup(), 'No rollback or repair of the already accepted in-memory import');
    assert.equal(app.api.readView(), 'data');
  } else {
    assert.equal(state, original);
    assert.equal(state.intent.cycles.length, initial.intent.cycles.length + 1, 'Actual completion appends before failed persistence');
    const cycle = state.intent.cycles.at(-1);
    assert.equal(cycle.intentional, scenario.kind === 'revision' ? 'yes' : 'no');
    assert.equal(app.api.readView(), 'wizard');
    assert.ok(app.api.readWizard(), 'Failure must not clear the existing wizard');
    if (scenario.kind === 'revision') {
      assert.deepEqual(plain(cycle.revision), { scope: 'Synthetic intentional revision scope' });
      assert.equal(state.intent.ris.scope, cycle.revision.scope, 'Actual intentional revision mutates RIS before the failed write');
    } else assert.deepEqual(plain(cycle.revision), {});
  }
});

test('rejected import', async () => {
  const wrongRating = fixture(); wrongRating.intent.cycles[0].iep.desire = '7';
  for (const raw of ['{"version":', JSON.stringify(wrongRating)]) {
    const app = harness();
    assertApprovedHome(app);
    const state = app.api.readState(), before = plain(state);
    app.navigate('data');
    app.armFault();
    await app.importRaw(raw);
    assert.equal(app.api.readState(), state);
    assert.deepEqual(plain(state), before);
    assert.equal(app.api.readAuthority(), true, 'Rejecting input must not revoke the existing committed state authority');
    assert.equal(app.stored(), app.initialBytes);
    assert.deepEqual(app.attempts, [], 'Rejected input never reaches persist');
    assert.deepEqual(app.alerts, [app.messages.importError]);
    app.navigate('home');
    assertApprovedHome(app);
  }
});

test('failed persistence -> navigation', async () => {
  const app = harness();
  assertApprovedHome(app);
  await fail(app, failureCases[1]);
  for (const view of ['home', 'history', 'data', 'home']) {
    app.navigate(view);
    assert.equal(app.api.readAuthority(), false);
    assertNoBodies(app);
    assert.equal(app.stored(), app.initialBytes);
  }
  assert.deepEqual(app.writes, [], 'Navigation cannot repair or commit failed in-memory state');
});

test('failed persistence -> locale switch', async () => {
  const app = harness();
  assertApprovedHome(app);
  await fail(app, failureCases[1]);
  app.navigate('home');
  for (const language of ['de', 'ar', 'en']) {
    app.click(`[data-language="${language}"]`);
    assert.equal(app.api.readLanguage(), language);
    assert.equal(app.api.readAuthority(), false, 'A successful LANGUAGE_KEY write is not a successful state commit');
    assertNoBodies(app);
  }
  assert.equal(app.stored(), app.initialBytes);
  assert.deepEqual(app.writes, ['de', 'ar', 'en'].map(language => ['setItem', LANGUAGE_KEY, language]));
});

test('authority remains false after failure', async () => {
  const app = harness();
  await fail(app, failureCases[1]);
  app.api.render();
  app.api.render();
  assert.throws(() => app.api.persist(), error => error === app.storageError);
  assert.equal(app.api.readAuthority(), false);
  app.disarmFault();
  app.navigate('home');
  app.api.render();
  assert.equal(app.api.readAuthority(), false, 'Removing the injected fault and rerendering cannot restore authority without a successful commit');
  assertNoBodies(app);
  assert.equal(app.stored(), app.initialBytes);
  assert.deepEqual(app.writes, []);
});

test('later successful persist restores authority', async () => {
  const initial = fixture(), app = harness(initial);
  await fail(app, failureCases[1]);
  assertFailedAuthority(app);
  app.disarmFault();
  app.fillRIS(initial.intent.ris);
  app.click('#risSave');
  assert.equal(app.api.readAuthority(), true, 'Only return from the successful actual persist restores authority');
  assert.deepEqual(app.writeProbes.at(-1), { authority: false, bodies: '' }, 'Authority is still false while the successful write is in progress');
  assert.equal(app.stored(), JSON.stringify(app.api.readState()));
  assert.deepEqual(app.writes, [['setItem', STORAGE_KEY, app.stored()]]);
  assert.equal(app.element('#risMsg').textContent, app.messages.updated);
  assert.equal(app.timers.length, 1);
  assert.equal(app.timers[0].delay, 450);
  app.flushTimers();
  assertApprovedHome(app);
});

test('successful reset establishes fresh authority', async () => {
  const app = harness();
  await fail(app, failureCases[1]);
  app.navigate('data');
  app.click('#deleteBtn');
  assert.equal(app.api.readAuthority(), true, 'Successful existing removeItem + fresh reset restores authority without persist');
  assert.deepEqual(plain(app.api.readState()), empty());
  assert.equal(app.stored(), null);
  assert.deepEqual(app.writes, [['removeItem', STORAGE_KEY]]);
  assert.equal(app.api.readView(), 'home');
  assert.equal(app.document.getElementById('analyticsHost'), null, 'Fresh null intent has no analytical host');
  assertNoBodies(app);
  app.disarmFault();
  prepareRIS(app, true, fixture(0).intent.ris);
  app.click('#risSave');
  app.flushTimers();
  assert.equal(app.api.readAuthority(), true);
  const dto = app.context.PHEISIRAETHA_ANALYTICS_V1.evaluate(app.api.readState());
  assert.equal(dto.mode, 'FALLBACK_ONLY', 'New intent without cycles uses actual frozen fallback');
  assert.equal(app.bodies(), dto.components[0].text, 'Only the newly evaluated fresh state is mounted after reset');
});

function businessSnapshot(app) {
  const message = app.document.getElementById('risMsg');
  return {
    state: plain(app.api.readState()), view: app.api.readView(), language: app.api.readLanguage(),
    wizard: plain(app.api.readWizard()), draft: plain(app.api.readDraft()),
    alerts: [...app.alerts], timers: app.timers.map(timer => timer.delay),
    attempts: plain(app.attempts), writes: plain(app.writes), stored: app.stored(), keys: app.keys(),
    message: message ? { text: message.textContent, className: message.className, role: message.getAttribute('role') } : null
  };
}
test('analytics never changes existing business failure semantics', async () => {
  for (const scenario of failureCases) {
    const initial = scenario.initial(), wired = harness(initial), baseline = harness(initial, { baseline: true });
    await fail(wired, scenario);
    await fail(baseline, scenario);
    assert.deepEqual(businessSnapshot(wired), businessSnapshot(baseline), `${scenario.name}: preserve base state mutations, exception/catch, wizard/draft, UI feedback, timers, and storage bytes`);
    assert.equal(wired.api.readAuthority(), false);
    assert.deepEqual(wired.forbidden, []);
  }
});

function assertBusinessStateShape(state) {
  assert.deepEqual(Object.keys(state).sort(), ['intent', 'lang', 'version']);
  if (state.intent === null) return;
  assert.deepEqual(Object.keys(state.intent).sort(), ['createdAt', 'cycles', 'id', 'ris']);
  assert.deepEqual(Object.keys(state.intent.ris).sort(), [...fixtures.D].sort());
  for (const cycle of state.intent.cycles) {
    assert.deepEqual(Object.keys(cycle).sort(), ['cie', 'createdAt', 'id', 'iep', 'intentional', 'oop', 'revision']);
    assert.deepEqual(Object.keys(cycle.cie).sort(), [...fixtures.D].sort());
    assert.deepEqual(Object.keys(cycle.iep).sort(), ['actions', 'belief', 'desire', 'emotion', 'emotionIntensity', 'frequency', 'hours', 'mental', 'practical']);
    assert.deepEqual(Object.keys(cycle.oop).sort(), ['achievement', 'currentState', 'direction', 'events', 'evidence', 'external']);
    for (const [key, value] of Object.entries(cycle.revision)) {
      assert.ok(fixtures.D.includes(key));
      assert.equal(typeof value, 'string');
    }
  }
}
test('no analytics storage/export fields', async () => {
  const app = harness();
  assertApprovedHome(app);
  const initial = plain(app.api.readState());
  app.api.render();
  assert.deepEqual(plain(app.api.readState()), initial, 'Actual app analytics rendering must not mutate business state');
  assert.deepEqual(app.writes, []);
  prepareRIS(app, false, initial.intent.ris);
  app.click('#risSave');
  app.flushTimers();
  assertApprovedHome(app);
  await prepareCheckin(app);
  app.click('#wizComplete');
  app.flushTimers();
  assert.equal(app.api.readAuthority(), true);
  assertBusinessStateShape(app.api.readState());
  for (const [operation, key, raw] of app.writes) {
    assert.equal(operation, 'setItem');
    assert.equal(key, STORAGE_KEY);
    assertBusinessStateShape(JSON.parse(raw));
  }
  const before = plain(app.api.readState()), writesBefore = plain(app.writes), storedBefore = app.stored();
  app.navigate('data');
  app.click('#exportBtn');
  assert.equal(app.downloads.length, 1, 'Execute the actual production export callback');
  const exported = JSON.parse(await app.downloads[0].text());
  assert.deepEqual(exported, before, 'Existing backup contains only unchanged business state, no source/result/DTO/authority/generation fields');
  assertBusinessStateShape(exported);
  assert.deepEqual(app.writes, writesBefore);
  assert.equal(app.stored(), storedBefore);
  assert.deepEqual(plain(app.api.readState()), before);
});

test('no fourth storage key', async () => {
  const app = harness();
  assertApprovedHome(app);
  await fail(app, failureCases[1]);
  app.navigate('home');
  app.click('[data-language="de"]');
  assert.equal(app.api.readAuthority(), false);
  app.navigate('data');
  app.disarmFault();
  await app.importRaw(JSON.stringify(acceptedBackup()));
  assert.equal(app.api.readAuthority(), true);
  app.click('#deleteBtn');
  assert.deepEqual(app.keys(), [LANGUAGE_KEY, ONBOARDING_KEY].sort());
  prepareRIS(app, true, fixture(0).intent.ris);
  app.click('#risSave');
  app.flushTimers();
  assert.deepEqual(app.keys(), STORAGE_KEYS);
  assert.ok(app.accesses.some(([operation]) => operation === 'getItem'));
  assert.ok(app.accesses.some(([operation]) => operation === 'setItem'));
  assert.ok(app.accesses.some(([operation]) => operation === 'removeItem'));
  for (const [operation, key] of app.accesses) {
    assert.ok(['getItem', 'setItem', 'removeItem'].includes(operation));
    assert.ok(STORAGE_KEYS.includes(key), `No fourth key may be read or written: ${key}`);
  }
  assert.deepEqual(app.forbidden, [], 'No alternate storage or loading path');
});
