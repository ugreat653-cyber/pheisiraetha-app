'use strict';

// S3 only: execute the real app generation gates after S1 has been aggregated.
// The shard's 3B-4 base intentionally has no analytics wiring yet. Missing S1
// fails explicitly; these cases are never skipped or replaced with a model of
// the future renderer. No production file, bundle or facade API is modified.
// The DOM below is a private structural harness, not real-browser evidence.
// Delivery faults resume within the same evaluate call; no Promise is returned.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createHash, randomUUID } = require('node:crypto');
const fixtures = require('../runtime-core/fixtures.cjs');

const ROOT = path.resolve(__dirname, '../..');
const STORAGE_KEY = 'pheisiraetha_v01';
const LANGUAGE_KEY = 'pheisiraetha_language_v01';
const ONBOARDING_KEY = 'pheisiraetha_onboarding_v01';
const GLOBAL = 'PHEISIRAETHA_ANALYTICS_V1';
const PRIVATE_API = '__APP_ANALYTICS_GENERATION_TEST_ONLY__';
const APP_SOURCE = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
const LOCALES_SOURCE = fs.readFileSync(path.join(ROOT, 'locales.js'), 'utf8');
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'browser-packaging/build-manifest.json'), 'utf8'));
const artifact = fs.readFileSync(path.join(ROOT, manifest.output.file), 'utf8');
assert.equal(createHash('sha256').update(artifact).digest('hex'), manifest.output.sha256);

function replaceExactly(source, needle, replacement) {
  assert.equal(source.split(needle).length, 2, `Exactly one test-only anchor: ${needle}`);
  return source.replace(needle, replacement);
}

function instrumentApp() {
  // Flip only the frozen static flag in the private VM copy. Keep the real
  // render(), mutation code, DOM construction and both commit gates intact.
  const enabled = replaceExactly(APP_SOURCE,
    'const ANALYTICS_ENABLED = false;', 'const ANALYTICS_ENABLED = true;');
  return replaceExactly(enabled, '\n  render();\n\n})();', `
  Object.defineProperty(globalThis, '${PRIVATE_API}', {
    value: Object.freeze({
      render: () => render(),
      generation: () => analyticsGeneration,
      invalidateTokenForFault: () => { analyticsGeneration += 1; }
    }), writable: false, configurable: false
  });
  render();

})();`);
}

let oracle;
function frozenDtos() {
  if (oracle) return oracle;
  const input = fixtures.fixture(1, Array(10).fill('Calm / contentment'));
  const next = structuredClone(input);
  next.intent.cycles[0].iep.practical = 9;
  function obtain(source, hold = false) {
    const context = vm.createContext(Object.create(null), { codeGeneration: { strings: false, wasm: false } });
    // This is the already accepted private HOLD technique: real frozen Safety
    // receives a cloned engine result with an upstream HOLD. Nothing fakes its
    // verdict, presentation, formatter or DTO. There is no build or disk edit.
    const call = 'const result = safety.assessPresentation({ sourceSnapshot, engineResult, presentationPlan });';
    const code = replaceExactly(artifact, call, `
          const request = { sourceSnapshot, engineResult, presentationPlan };
          ${hold ? `const held = JSON.parse(JSON.stringify(engineResult));
          held.safety.externalDecision = 'HOLD'; request.engineResult = held;` : ''}
          const result = safety.assessPresentation(request);
          globalThis.__S3_ORACLE_VERDICT = result.verdict;`);
    vm.runInContext(code, context, { timeout: 10000 });
    context.inputJSON = JSON.stringify(source);
    const dto = JSON.parse(vm.runInContext(
      `JSON.stringify(${GLOBAL}.evaluate(JSON.parse(inputJSON)))`, context, { timeout: 10000 }));
    return { dto, verdict: context.__S3_ORACLE_VERDICT };
  }
  const allow = obtain(input), newer = obtain(next);
  const hold = obtain(input, true), unknown = obtain(fixtures.fixture(0, Array(10).fill('Calm / contentment')));
  for (const result of [allow, newer]) {
    assert.equal(result.verdict, 'ALLOW');
    assert.equal(result.dto.mode, 'APPROVED_BUNDLE');
    assert.equal(result.dto.components.length, 9);
  }
  assert.notEqual(allow.dto.components[0].text, newer.dto.components[0].text,
    'Distinct actual canonical bodies must expose an old-ALLOW overwrite');
  for (const [name, result] of [['HOLD', hold], ['UNKNOWN', unknown]]) {
    assert.equal(result.verdict, name);
    assert.equal(result.dto.mode, 'FALLBACK_ONLY');
    assert.equal(result.dto.components.length, 1);
    assert.equal(result.dto.components[0].text, 'No interpretation or next focus is shown here.');
  }
  oracle = { input, allow: allow.dto, newer: newer.dto, hold: hold.dto, unknown: unknown.dto,
    unavailable: { dtoVersion: 'pheisiraetha-render-v1', mode: 'UNAVAILABLE', lang: 'en', dir: 'ltr', components: [] } };
  return oracle;
}

// Minimal DOM operations needed by the unchanged shell and actual S1 renderer.
// All parentage, IDs, containment, text writes and host commits are observable.
const decode = value => String(value).replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (_, key) =>
  key[0] === '#' ? String.fromCodePoint(key[1].toLowerCase() === 'x' ? parseInt(key.slice(2), 16) : Number(key.slice(1))) :
    ({ amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" })[key.toLowerCase()]);

function descendants(node) { return node.childNodes.flatMap(child => [child, ...descendants(child)]); }
function matchesSimple(node, selector, scope) {
  if (node.nodeType !== 1) return false;
  let query = selector.trim();
  if (query.includes(':scope')) { if (node !== scope) return false; query = query.replace(':scope', ''); }
  if (query.includes(':last-child')) {
    if (node.parentElement?.lastElementChild !== node) return false;
    query = query.replace(':last-child', '');
  }
  if (query.includes(':first-child')) {
    if (node.parentElement?.firstElementChild !== node) return false;
    query = query.replace(':first-child', '');
  }
  query = query.replace(/:not\(([^)]+)\)/g, (_, excluded) => matchesSimple(node, excluded, scope) ? '__NO_MATCH__' : '');
  if (query.includes('__NO_MATCH__')) return false;
  const attrs = [...query.matchAll(/\[([^\]=\s]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\]\s]+)))?\]/g)];
  for (const [, name, double, single, bare] of attrs) {
    if (!node.hasAttribute(name)) return false;
    const value = double ?? single ?? bare;
    if (value !== undefined && node.getAttribute(name) !== value) return false;
  }
  query = query.replace(/\[[^\]]*\]/g, '');
  const id = query.match(/#([\w-]+)/)?.[1];
  if (id && node.id !== id) return false;
  for (const [, name] of query.matchAll(/\.([\w-]+)/g)) if (!node.classList.contains(name)) return false;
  const tag = query.match(/^[a-z][\w-]*/i)?.[0];
  return !tag || node.tagName.toLowerCase() === tag.toLowerCase();
}
function matches(node, selector, scope) {
  const parts = selector.trim().replace(/\s*>\s*/g, ' > ').split(/\s+/);
  function at(candidate, index) {
    if (!candidate || !matchesSimple(candidate, parts[index], scope)) return false;
    if (index === 0) return true;
    if (parts[index - 1] === '>') return at(candidate.parentElement, index - 2);
    for (let parent = candidate.parentElement; parent; parent = parent.parentElement)
      if (at(parent, index - 1)) return true;
    return false;
  }
  return at(node, parts.length - 1);
}

class TestNode {
  constructor(document, type, name = '') {
    this.ownerDocument = document; this.nodeType = type; this.nodeName = type === 1 ? name.toUpperCase() : name;
    if (type === 1) this.tagName = name.toUpperCase();
    this.childNodes = []; this.parentNode = null; this._attributes = new Map();
    this._listeners = new Map(); this._data = '';
    this.classList = {
      contains: name => this.className.split(/\s+/).includes(name),
      add: (...names) => { this.className = [...new Set([...this.className.split(/\s+/).filter(Boolean), ...names])].join(' '); },
      remove: (...names) => { this.className = this.className.split(/\s+/).filter(name => name && !names.includes(name)).join(' '); },
      toggle: (name, force) => {
        const add = force ?? !this.classList.contains(name);
        this.classList[add ? 'add' : 'remove'](name); return add;
      }
    };
    this.dataset = new Proxy(Object.create(null), {
      get: (_, name) => this.getAttribute('data-' + String(name).replace(/[A-Z]/g, c => '-' + c.toLowerCase())) ?? undefined,
      set: (_, name, value) => { this.setAttribute('data-' + String(name).replace(/[A-Z]/g, c => '-' + c.toLowerCase()), value); return true; }
    });
  }
  get parentElement() { return this.parentNode?.nodeType === 1 ? this.parentNode : null; }
  get children() { return this.childNodes.filter(node => node.nodeType === 1); }
  get firstChild() { return this.childNodes[0] ?? null; }
  get lastChild() { return this.childNodes.at(-1) ?? null; }
  get firstElementChild() { return this.children[0] ?? null; }
  get lastElementChild() { return this.children.at(-1) ?? null; }
  get nextSibling() { return this.parentNode?.childNodes[this.parentNode.childNodes.indexOf(this) + 1] ?? null; }
  get nextElementSibling() {
    let next = this.nextSibling; while (next && next.nodeType !== 1) next = next.nextSibling; return next;
  }
  get isConnected() { return this.ownerDocument.documentElement.contains(this); }
  get attributes() { return [...this._attributes].map(([name, value]) => ({ name, value })); }
  get textContent() { return this.nodeType === 3 ? this._data : this.childNodes.map(node => node.textContent).join(''); }
  set textContent(value) {
    const text = value == null ? '' : String(value);
    if (this.nodeType === 3) this._data = text;
    else { this.replaceChildren(); if (text) this.appendChild(this.ownerDocument._text(text)); }
    this.ownerDocument._wroteText(this, text);
  }
  get data() { return this._data; }
  set data(value) { this.textContent = value; }
  get nodeValue() { return this.nodeType === 3 ? this._data : null; }
  set nodeValue(value) { if (this.nodeType === 3) this.textContent = value; }
  get id() { return this.getAttribute('id') || ''; }
  set id(value) { this.setAttribute('id', value); }
  get className() { return this.getAttribute('class') || ''; }
  set className(value) { this.setAttribute('class', value); }
  get lang() { return this.getAttribute('lang') || ''; }
  set lang(value) { this.setAttribute('lang', value); }
  get dir() { return this.getAttribute('dir') || ''; }
  set dir(value) { this.setAttribute('dir', value); }
  get hidden() { return this.hasAttribute('hidden'); }
  set hidden(value) { if (value) this.setAttribute('hidden', ''); else this.removeAttribute('hidden'); }
  setAttribute(name, value) { this._attributes.set(String(name), String(value)); }
  getAttribute(name) { return this._attributes.get(String(name)) ?? null; }
  hasAttribute(name) { return this._attributes.has(String(name)); }
  removeAttribute(name) { this._attributes.delete(String(name)); }
  contains(node) { return this === node || this.childNodes.some(child => child.contains(node)); }
  appendChild(node) {
    if (node.nodeType === 11) { for (const child of [...node.childNodes]) this.appendChild(child); return node; }
    node.parentNode?.removeChild(node); this.childNodes.push(node); node.parentNode = this; return node;
  }
  append(...nodes) { for (const node of nodes) this.appendChild(typeof node === 'string' ? this.ownerDocument.createTextNode(node) : node); }
  removeChild(node) {
    const index = this.childNodes.indexOf(node); assert.notEqual(index, -1, 'removeChild needs an actual child');
    this.childNodes.splice(index, 1); node.parentNode = null; return node;
  }
  insertBefore(node, reference) {
    if (reference === null) return this.appendChild(node);
    assert.equal(reference.parentNode, this);
    if (node.nodeType === 11) { for (const child of [...node.childNodes]) this.insertBefore(child, reference); return node; }
    node.parentNode?.removeChild(node);
    this.childNodes.splice(this.childNodes.indexOf(reference), 0, node); node.parentNode = this; return node;
  }
  replaceChildren(...nodes) {
    const content = nodes.map(node => typeof node === 'string' ? node : node.textContent).join('');
    this.ownerDocument.commits.push({ host: this, content, connected: this.isConnected, nodes: [...nodes] });
    for (const child of [...this.childNodes]) this.removeChild(child);
    this.append(...nodes);
  }
  replaceWith(...nodes) {
    const parent = this.parentNode; if (!parent) return;
    for (const node of nodes) parent.insertBefore(node, this); parent.removeChild(this);
  }
  before(...nodes) {
    if (!this.parentNode) return;
    for (const node of nodes) this.parentNode.insertBefore(typeof node === 'string' ? this.ownerDocument.createTextNode(node) : node, this);
  }
  after(...nodes) {
    if (!this.parentNode) return;
    const reference = this.nextSibling;
    for (const node of nodes) this.parentNode.insertBefore(typeof node === 'string' ? this.ownerDocument.createTextNode(node) : node, reference);
  }
  replaceChild(node, old) { this.insertBefore(node, old); this.removeChild(old); return old; }
  remove() { this.parentNode?.removeChild(this); }
  cloneNode(deep = false) {
    const clone = new TestNode(this.ownerDocument, this.nodeType, this.nodeName);
    clone._attributes = new Map(this._attributes); clone._data = this._data;
    if (deep) clone.append(...this.childNodes.map(node => node.cloneNode(true)));
    return clone;
  }
  querySelectorAll(selector) {
    const options = selector.split(',').map(value => value.trim());
    return descendants(this).filter(node => options.some(option => matches(node, option, this)));
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0] ?? null; }
  matches(selector) { return matches(this, selector, this); }
  closest(selector) { for (let node = this; node; node = node.parentElement) if (node.matches(selector)) return node; return null; }
  addEventListener(type, listener) {
    const entries = this._listeners.get(type) || []; entries.push(listener); this._listeners.set(type, entries);
  }
  removeEventListener(type, listener) {
    this._listeners.set(type, (this._listeners.get(type) || []).filter(entry => entry !== listener));
  }
  dispatchEvent(event) {
    for (const listener of this._listeners.get(event.type) || []) listener.call(this, { ...event, target: this, preventDefault() {} });
    return true;
  }
  click() { this.dispatchEvent({ type: 'click' }); }
  focus() { this.ownerDocument.activeElement = this; }
  scrollIntoView() {}
  set innerHTML(html) {
    const fragment = new TestNode(this.ownerDocument, 11, '#document-fragment'), stack = [fragment];
    const voids = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
    for (const token of String(html).match(/<!--[\s\S]*?-->|<[^>]+>|[^<]+/g) || []) {
      if (token.startsWith('<!--') || token.startsWith('<!')) continue;
      if (token.startsWith('</')) { if (stack.length > 1) stack.pop(); continue; }
      if (token[0] !== '<') { stack.at(-1).appendChild(this.ownerDocument._text(decode(token))); continue; }
      const tag = token.match(/^<([\w-]+)/)?.[1]; assert.ok(tag, 'Structural shell tag');
      const element = this.ownerDocument.createElement(tag);
      const attributes = token.slice(tag.length + 1).replace(/\/?\s*>$/, '');
      for (const [, name, double, single, bare] of attributes.matchAll(/([^\s=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s]+)))?/g))
        element.setAttribute(name, decode(double ?? single ?? bare ?? ''));
      stack.at(-1).appendChild(element);
      if (!voids.has(tag.toLowerCase()) && !token.endsWith('/>')) stack.push(element);
    }
    this.replaceChildren(...fragment.childNodes);
  }
}

class TestDocument {
  constructor() {
    this.commits = []; this.textWrites = []; this.created = []; this.onText = null; this.faultErrors = [];
    this.documentElement = new TestNode(this, 1, 'html'); this.body = new TestNode(this, 1, 'body');
    this.documentElement.appendChild(this.body);
    const app = new TestNode(this, 1, 'div'); app.id = 'app'; this.body.appendChild(app);
  }
  createElement(name) { const node = new TestNode(this, 1, name); this.created.push(node); return node; }
  createDocumentFragment() { const node = new TestNode(this, 11, '#document-fragment'); this.created.push(node); return node; }
  _text(text) { const node = new TestNode(this, 3, '#text'); node._data = String(text); this.created.push(node); return node; }
  createTextNode(text) { const node = this._text(text); this._wroteText(node, String(text)); return node; }
  _wroteText(node, text) {
    this.textWrites.push({ node, text, connected: node.isConnected });
    const hook = this.onText;
    if (hook && text === hook.text && --hook.remaining === 0) {
      this.onText = null;
      try { hook.run(node); }
      catch (error) { this.faultErrors.push(error); throw error; }
    }
  }
  querySelectorAll(selector) { return this.documentElement.querySelectorAll(selector); }
  querySelector(selector) { return this.querySelectorAll(selector)[0] ?? null; }
  getElementById(id) { return descendants(this.documentElement).find(node => node.id === id) ?? null; }
  contains(node) { return this.documentElement.contains(node); }
  addEventListener() {}
  removeEventListener() {}
}

function appHarness() {
  const data = frozenDtos(), document = new TestDocument();
  const storage = new Map([[STORAGE_KEY, JSON.stringify(data.input)], [LANGUAGE_KEY, 'en'], [ONBOARDING_KEY, '1']]);
  const calls = [], pending = [], writes = [], timers = [];
  let context, deferred = null, api;
  function deliver(state) {
    const response = pending.shift() || { dto: data.allow };
    const call = { generation: context[PRIVATE_API].generation(), host: document.getElementById('analyticsHost'),
      state: structuredClone(state), response, writesAtEntry: document.textWrites.length };
    calls.push(call);
    const hook = deferred; deferred = null;
    let resumed = false;
    const resume = () => {
      assert.equal(resumed, false, 'A private delivery may resume exactly once'); resumed = true;
      if (response.error) throw response.error;
      return JSON.stringify(response.dto);
    };
    try {
      const result = hook ? hook(call, resume) : resume();
      assert.equal(resumed, true, 'No asynchronous/deferred Promise delivery is permitted');
      assert.equal(typeof result, 'string', 'evaluate remains synchronous');
      return result;
    } catch (error) {
      // Production correctly catches evaluator/renderer exceptions. Assertions
      // inside a test fault must still fail the test, rather than being mistaken
      // for the expected closed result of the transaction under observation.
      if (error !== response.error) document.faultErrors.push(error);
      throw error;
    }
  }
  const sandbox = { document, navigator: { language: 'en-US', languages: ['en-US'] },
    location: { protocol: 'https:' }, crypto: { randomUUID }, AbortController,
    Node: TestNode, Element: TestNode, HTMLElement: TestNode, DocumentFragment: TestNode,
    localStorage: {
      getItem: key => storage.get(key) ?? null,
      setItem: (key, value) => { writes.push(['setItem', key, String(value)]); storage.set(key, String(value)); },
      removeItem: key => { writes.push(['removeItem', key]); storage.delete(key); }
    },
    setTimeout: (callback, delay) => { timers.push({ callback, delay }); return timers.length; }, clearTimeout() {},
    alert() {}, confirm: () => true, __S3_DELIVER: deliver };
  sandbox.window = sandbox;
  context = vm.createContext(sandbox, { codeGeneration: { strings: false, wasm: false } });
  vm.runInContext(LOCALES_SOURCE, context, { timeout: 10000 });
  // Only the test facade is controlled. Its surface, property descriptors,
  // method shape and DTO realms match the immutable synchronous facade. All
  // delivered bodies originate from the actual frozen pipeline above.
  vm.runInContext(`
    const freezeDto = value => {
      if (value && typeof value === 'object') { Object.values(value).forEach(freezeDto); Object.freeze(value); }
      return value;
    };
    Object.defineProperty(globalThis, '${GLOBAL}', {
      value: Object.freeze({ evaluate: Object.freeze({ evaluate(committedState) {
        if (arguments.length !== 1) throw new Error('Exactly one committed-state argument');
        return freezeDto(JSON.parse(__S3_DELIVER(committedState)));
      } }.evaluate) }), enumerable: true, writable: false, configurable: false
    });`, context, { timeout: 10000 });
  vm.runInContext(instrumentApp(), context, { timeout: 10000 });
  assert.deepEqual(document.faultErrors, [], 'Do not swallow private-harness failures during boot');
  api = context[PRIVATE_API];
  assert.equal(calls.length, 1, 'Positive control: initial eligible Home must actually evaluate');
  assert.ok(document.getElementById('analyticsHost'), 'Positive control: actual S1 must create its host');
  const invoke = action => {
    try { return action(); }
    finally { if (document.faultErrors.length) throw document.faultErrors[0]; }
  };
  const h = { document, context, data, calls, storage, writes, timers,
    generation: () => api.generation(), invalidateTokenForFault: () => api.invalidateTokenForFault(),
    render: () => invoke(() => api.render()), host: () => document.getElementById('analyticsHost'),
    app: () => document.getElementById('app'),
    next: dto => pending.push({ dto }), failNext: () => pending.push({ error: new Error('S3_PRIVATE_DELIVERY_FAILURE') }),
    deferNextDelivery: callback => { assert.equal(deferred, null); deferred = callback; },
    duringDetachedText: (text, callback) => {
      assert.equal(document.onText, null);
      document.onText = { text, run: callback, remaining: data.allow.components.filter(component => component.text === text).length };
    },
    click(selector) { const element = document.querySelector(selector); assert.ok(element, selector); invoke(() => element.click()); },
    navigate: view => h.click(`[data-nav="${view}"]`),
    locale: code => h.click(`[data-language="${code}"]`),
    replaceHost(id = 'analyticsHost') {
      const original = h.host(); assert.ok(original); const replacement = original.cloneNode(false); replacement.id = id;
      original.replaceWith(replacement); assert.equal(original.isConnected, false); assert.equal(replacement.isConnected, true);
      return { original, replacement };
    }
  };
  assertMounted(h, data.allow);
  return h;
}

function assertMounted(h, dto) {
  const host = h.host(); assert.ok(host?.isConnected, 'Current live analytics host');
  assert.equal(h.app().contains(host), true);
  const texts = descendants(host).filter(node => node.nodeType === 3).map(node => node.textContent).filter(Boolean);
  assert.deepEqual(texts, dto.components.map(component => component.text), 'Complete canonical bodies in exact DTO order');
  assert.equal(host.querySelectorAll('[lang="en"][dir="ltr"]').length >= 1 || (host.lang === 'en' && host.dir === 'ltr'), true);
  const expected = new Set(dto.components.map(component => component.text));
  for (const entry of h.document.textWrites.filter(entry => expected.has(entry.text)))
    assert.equal(entry.connected, false, 'Analytics must be constructed while detached');
}
function assertNoOldNodes(h, oldNodes) {
  for (const node of oldNodes) assert.equal(h.app().contains(node), false, 'No old ALLOW node is restored');
}
function assertNoAnalytics(h) {
  assert.equal(h.host()?.textContent || '', '', 'No analytical body after a rejected transaction');
  for (const text of h.data.allow.components.map(component => component.text))
    assert.equal(h.app().textContent.includes(text), false, 'No old ALLOW hidden in the app');
}
function assertOneEvaluationPerGeneration(h) {
  const seen = new Set();
  for (const call of h.calls) {
    assert.equal(Number.isSafeInteger(call.generation), true);
    assert.equal(seen.has(call.generation), false, 'Exactly one evaluate in each eligible render generation');
    seen.add(call.generation);
    assert.deepEqual(call.state, h.data.input, 'Locale/navigation never becomes analytical input');
  }
}
function commitsSince(h, start, host) {
  return h.document.commits.slice(start).filter(commit => commit.host === host && commit.content !== '');
}

for (const [verdict, key] of [['HOLD', 'hold'], ['UNKNOWN', 'unknown']]) {
  test(`ALLOW -> ${verdict}: actual fallback replaces the whole bundle and never restores old ALLOW`, () => {
    const h = appHarness(), oldHost = h.host(), oldNodes = descendants(oldHost);
    h.next(h.data[key]);
    let observed = false;
    h.deferNextDelivery((call, resume) => {
      observed = true;
      assert.notEqual(call.host, oldHost);
      assert.equal(call.host.textContent, '', 'Remove old ALLOW before evaluation/delivery');
      assertNoOldNodes(h, oldNodes); assertNoAnalytics(h);
      return resume();
    });
    h.render();
    assert.equal(observed, true); assert.equal(h.calls.length, 2);
    assertMounted(h, h.data[key]); assertNoOldNodes(h, oldNodes); assertOneEvaluationPerGeneration(h);
  });
}

test('old ALLOW is removed before a synchronous held delivery, even when the replacement is another ALLOW', () => {
  const h = appHarness(), oldNodes = descendants(h.host());
  h.next(h.data.newer);
  let observed = false;
  h.deferNextDelivery((call, resume) => {
    observed = true; assert.equal(call.host.textContent, ''); assertNoAnalytics(h); assertNoOldNodes(h, oldNodes);
    return resume();
  });
  h.render();
  assert.equal(observed, true); assertMounted(h, h.data.newer); assertNoOldNodes(h, oldNodes);
  assert.equal(h.calls.length, 2); assertOneEvaluationPerGeneration(h);
});

test('first gate rejects a stale generation before any analytical DOM construction', () => {
  const h = appHarness(), start = h.document.commits.length;
  let rejected, observed = false;
  h.deferNextDelivery((call, resume) => {
    observed = true; rejected = call; h.invalidateTokenForFault(); return resume();
  });
  h.render();
  assert.equal(observed, true); assert.ok(h.generation() > rejected.generation);
  assert.equal(h.document.textWrites.slice(rejected.writesAtEntry)
    .some(write => h.data.allow.components.some(component => component.text === write.text)), false,
  'First gate rejects before constructing any component');
  assert.deepEqual(commitsSince(h, start, rejected.host), []); assertNoAnalytics(h);
  assert.equal(h.calls.length, 2); assertOneEvaluationPerGeneration(h);
});

for (const id of ['replacementAnalyticsHost', 'analyticsHost']) {
  test(`first gate rejects an exact host-object replacement (${id}) without relying on generation changes`, () => {
    const h = appHarness(), start = h.document.commits.length;
    let rejected, replacement, observed = false;
    h.deferNextDelivery((call, resume) => {
      observed = true; rejected = call; replacement = h.replaceHost(id).replacement;
      if (id === 'analyticsHost') {
        // Keep the captured object live as well: connectivity/containment alone
        // must not authorize a mount when the selector owns another object.
        replacement.parentNode.appendChild(call.host);
        assert.equal(call.host.isConnected, true); assert.equal(h.app().contains(call.host), true);
      }
      assert.equal(h.generation(), call.generation, 'Identity fault does not alter generation');
      if (id === 'analyticsHost') assert.equal(h.host(), replacement, 'Same selector resolves to a different object');
      return resume();
    });
    h.render();
    assert.equal(observed, true); assert.notEqual(replacement, rejected.host);
    assert.equal(replacement.textContent, ''); assert.equal(rejected.host.textContent, '');
    assert.deepEqual(commitsSince(h, start, rejected.host), []);
    assert.deepEqual(commitsSince(h, start, replacement), []);
    assertNoAnalytics(h); assert.equal(h.calls.length, 2); assertOneEvaluationPerGeneration(h);
  });
}

test('navigation away/back during private delivery keeps the new Home generation and discards old ALLOW', () => {
  const h = appHarness(), oldNodes = descendants(h.host()), start = h.document.commits.length;
  let stale, current, observed = false;
  h.deferNextDelivery((call, resume) => {
    observed = true; stale = call;
    h.navigate('history'); assert.equal(h.host(), null); assert.equal(h.calls.length, 2);
    h.next(h.data.newer); h.navigate('home'); current = h.host(); assertMounted(h, h.data.newer);
    return resume();
  });
  h.render();
  assert.equal(observed, true); assert.notEqual(current, stale.host); assert.equal(h.host(), current);
  assert.ok(h.generation() > stale.generation); assertMounted(h, h.data.newer);
  assert.deepEqual(commitsSince(h, start, stale.host), []); assertNoOldNodes(h, oldNodes);
  assert.equal(h.calls.length, 3); assertOneEvaluationPerGeneration(h);
});

test('locale rerender owns a fresh host and rejects a late older delivery without changing committed input', () => {
  const h = appHarness(), oldNodes = descendants(h.host()), start = h.document.commits.length;
  let stale, current, observed = false;
  h.deferNextDelivery((call, resume) => {
    observed = true; stale = call; h.next(h.data.newer); h.locale('de'); current = h.host();
    assertMounted(h, h.data.newer); return resume();
  });
  h.render();
  assert.equal(observed, true); assert.equal(h.document.documentElement.lang, 'de');
  assert.equal(h.host(), current); assert.notEqual(current, stale.host); assertMounted(h, h.data.newer);
  assert.deepEqual(commitsSince(h, start, stale.host), []); assertNoOldNodes(h, oldNodes);
  assert.equal(h.storage.get(LANGUAGE_KEY), 'de'); assert.equal(h.storage.get(STORAGE_KEY), JSON.stringify(h.data.input));
  assert.equal(h.calls.length, 3); assertOneEvaluationPerGeneration(h);
});

test('second gate rejects a generation that becomes stale during detached construction', () => {
  const h = appHarness(), oldNodes = descendants(h.host()), start = h.document.commits.length;
  let staged, observed = false;
  h.duringDetachedText(h.data.allow.components.at(-1).text, node => {
    observed = true; staged = node;
    assert.equal(node.isConnected, false); assert.equal(h.host().textContent, '');
    h.invalidateTokenForFault();
  });
  h.render();
  assert.equal(observed, true, 'Positive control: first gate passed and construction reached the final component');
  assert.equal(staged.isConnected, false); assertNoAnalytics(h); assertNoOldNodes(h, oldNodes);
  assert.deepEqual(commitsSince(h, start, h.calls.at(-1).host), []);
  assert.equal(h.calls.length, 2); assertOneEvaluationPerGeneration(h);
});

test('second gate rejects a same-id host replacement after construction has started', () => {
  const h = appHarness(), start = h.document.commits.length;
  let staged, original, replacement, observed = false;
  h.duringDetachedText(h.data.allow.components.at(-1).text, node => {
    observed = true; staged = node; const generation = h.generation();
    ({ original, replacement } = h.replaceHost());
    replacement.parentNode.appendChild(original);
    assert.equal(original.isConnected, true); assert.equal(h.app().contains(original), true);
    assert.equal(h.generation(), generation); assert.equal(h.host(), replacement); assert.equal(node.isConnected, false);
  });
  h.render();
  assert.equal(observed, true); assert.equal(staged.isConnected, false); assert.notEqual(original, replacement);
  assert.equal(replacement.id, 'analyticsHost'); assert.equal(replacement.textContent, '');
  assert.deepEqual(commitsSince(h, start, original), []); assert.deepEqual(commitsSince(h, start, replacement), []);
  assertNoAnalytics(h); assert.equal(h.calls.length, 2); assertOneEvaluationPerGeneration(h);
});

test('a detached stale subtree is discarded without clearing or restoring over the newer Home subtree', () => {
  const h = appHarness(), oldNodes = descendants(h.host()), start = h.document.commits.length;
  let staged, staleHost, currentHost, stagedNodes, observed = false;
  h.duringDetachedText(h.data.allow.components.at(-1).text, node => {
    observed = true; staged = node; staleHost = h.host();
    assert.equal(node.isConnected, false);
    const call = h.calls.at(-1);
    stagedNodes = h.document.textWrites.slice(call.writesAtEntry)
      .filter(write => h.data.allow.components.some(component => component.text === write.text)).map(write => write.node);
    assert.equal(stagedNodes.length, h.data.allow.components.length, 'Observe every required detached component');
    h.navigate('history'); h.next(h.data.newer); h.navigate('home'); currentHost = h.host();
    assertMounted(h, h.data.newer);
  });
  h.render();
  assert.equal(observed, true); assert.equal(staged.isConnected, false); assert.equal(h.host(), currentHost);
  for (const node of stagedNodes) assert.equal(node.isConnected, false, 'Every stale component stays discarded');
  assert.notEqual(staleHost, currentHost); assertMounted(h, h.data.newer);
  assert.deepEqual(commitsSince(h, start, staleHost), []); assertNoOldNodes(h, oldNodes);
  assert.equal(h.app().textContent.includes(h.data.allow.components[0].text), false);
  assert.equal(h.calls.length, 3); assertOneEvaluationPerGeneration(h);
});

for (const failure of ['UNAVAILABLE', 'throw']) {
  test(`${failure} cannot restore a previous ALLOW before a subsequent UNKNOWN generation`, () => {
    const h = appHarness(), oldNodes = descendants(h.host());
    if (failure === 'throw') h.failNext(); else h.next(h.data.unavailable);
    h.render(); assertNoAnalytics(h); assertNoOldNodes(h, oldNodes); assert.equal(h.calls.length, 2);
    h.next(h.data.unknown); h.render();
    assertMounted(h, h.data.unknown); assertNoOldNodes(h, oldNodes);
    assert.equal(h.calls.length, 3); assertOneEvaluationPerGeneration(h);
  });
}

test('each eligible render generation evaluates exactly once; away navigation evaluates zero times', () => {
  const h = appHarness();
  h.navigate('history'); assert.equal(h.host(), null); assert.equal(h.calls.length, 1);
  h.navigate('data'); assert.equal(h.host(), null); assert.equal(h.calls.length, 1);
  h.navigate('home'); assertMounted(h, h.data.allow); assert.equal(h.calls.length, 2);
  h.locale('de'); assertMounted(h, h.data.allow); assert.equal(h.calls.length, 3);
  h.render(); assertMounted(h, h.data.allow); assert.equal(h.calls.length, 4);
  assertOneEvaluationPerGeneration(h);
  for (let index = 1; index < h.calls.length; index++)
    assert.ok(h.calls[index].generation > h.calls[index - 1].generation, 'New render authority is strictly newer');
  assert.equal(h.storage.get(STORAGE_KEY), JSON.stringify(h.data.input));
});
