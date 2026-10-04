'use strict';

// S2 owns this test file only. Behavioral execution requires the aggregated S1
// app.js; on this branch run node --check only. Missing S1 is an assertion
// failure, never a skipped/passing substitute for wiring coverage.
// The sole app-source transformation is the exact private OFF -> ON change.
// No render/loader/mutation function is replaced or exposed.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createHash } = require('node:crypto');
const fixtures = require('../runtime-core/fixtures.cjs');

const ROOT = path.resolve(__dirname, '../..');
const APP_SOURCE = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
const LOCALES_SOURCE = fs.readFileSync(path.join(ROOT, 'locales.js'), 'utf8');
const OFF = 'const ANALYTICS_ENABLED = false;';
const ON = 'const ANALYTICS_ENABLED = true;';
const GLOBAL = 'PHEISIRAETHA_ANALYTICS_V1';
const STORAGE = 'pheisiraetha_v01';
const LANGUAGE = 'pheisiraetha_language_v01';
const ONBOARDING = 'pheisiraetha_onboarding_v01';
const FALLBACK = 'No interpretation or next focus is shown here.';
const ARTIFACT_SHA256 = 'f1f975900faaa64649bcef42412c1856543c8716711d4119df9b964f4bf8c824';
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'browser-packaging/build-manifest.json'), 'utf8'));
const artifact = fs.readFileSync(path.join(ROOT, manifest.output.file));
assert.equal(manifest.phase, '2B-3B-2B');
assert.equal(manifest.output.sha256, ARTIFACT_SHA256);
assert.equal(createHash('sha256').update(artifact).digest('hex'), ARTIFACT_SHA256);
const ARTIFACT_SOURCE = artifact.toString('utf8');
const labels = Array(10).fill('Calm / contentment');
const primary = () => fixtures.reflection(labels, 'B4', true);
const both = () => fixtures.fixture(1, labels);
const emptyCycles = () => fixtures.fixture(0, labels);
const unavailable = { dtoVersion: 'pheisiraetha-render-v1', mode: 'UNAVAILABLE', lang: 'en', dir: 'ltr', components: [] };
const PRIMARY_SLOTS = ['primary.insight', 'primary.why.values', 'primary.why.selection',
  'primary.why.limitations', 'primary.why.capability'];
const SECONDARY_SLOTS = ['secondary.insight', 'secondary.why.values',
  'secondary.why.selection', 'secondary.why.limitations'];

// Actual already-built frozen runtime, evaluated in a separate private realm.
// App tests inject fresh realm-local copies of these real render DTO fixtures,
// so they test host behavior without rerunning or mocking Analysis/Safety.
// Literal-text and malformed-DTO cases are explicit private boundary faults.
function actualDto(source) {
  const context = vm.createContext(Object.create(null), { codeGeneration: { strings: false, wasm: false } });
  context.inputJSON = JSON.stringify(source);
  vm.runInContext(ARTIFACT_SOURCE, context, { timeout: 10000 });
  return structuredClone(vm.runInContext(GLOBAL + '.evaluate(JSON.parse(inputJSON))', context, { timeout: 10000 }));
}

function descendants(root) {
  const out = [];
  for (const child of root.childNodes) { out.push(child); out.push(...descendants(child)); }
  return out;
}
const leafBodies = root => descendants(root)
  .filter(node => node.nodeType === 1 && node.children.length === 0 && node.textContent !== '')
  .map(node => node.textContent);
function subtreeSnapshot(node) {
  return Object.freeze({ node, connected: node.isConnected, text: node.textContent,
    nodes: Object.freeze([node, ...descendants(node)]), bodies: Object.freeze(leafBodies(node)) });
}
const decode = text => text.replace(/&(?:amp|lt|gt|quot|apos|#\d+|#x[\da-f]+);/gi, entity => {
  const named = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&apos;': "'" };
  if (named[entity.toLowerCase()]) return named[entity.toLowerCase()];
  return String.fromCodePoint(parseInt(entity.slice(entity[2].toLowerCase() === 'x' ? 3 : 2, -1),
    entity[2].toLowerCase() === 'x' ? 16 : 10));
});
const escapeText = text => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

function compoundMatches(node, selector, scope) {
  if (node.nodeType !== 1) return false;
  let rest = selector, matches = true;
  rest = rest.replace(/:scope/g, () => { matches &&= node === scope; return ''; });
  rest = rest.replace(/^(\*|[A-Za-z][\w:-]*)/, tag => {
    matches &&= tag === '*' || node.localName === tag.toLowerCase(); return '';
  });
  rest = rest.replace(/\[([\w:-]+)(?:=(?:"([^"]*)"|'([^']*)'|([^\]]+)))?\]/g, (_, name, a, b, c) => {
    const expected = a ?? b ?? c;
    matches &&= expected === undefined ? node.hasAttribute(name) : node.getAttribute(name) === expected;
    return '';
  });
  rest = rest.replace(/([#.])([\w-]+)/g, (_, kind, value) => {
    matches &&= kind === '#' ? node.id === value : node.classList.contains(value); return '';
  });
  assert.equal(rest, '', 'Unsupported selector in the DOM harness: ' + selector);
  return matches;
}
function selectorMatches(node, selector, scope) {
  const parts = selector.replace(/\s*>\s*/g, ' > ').trim().split(/\s+/);
  let current = node, index = parts.length - 1;
  if (!compoundMatches(current, parts[index--], scope)) return false;
  while (index >= 0) {
    const direct = parts[index] === '>';
    if (direct) index--;
    const wanted = parts[index--];
    current = current.parentElement;
    if (direct) {
      if (!current || !compoundMatches(current, wanted, scope)) return false;
    } else {
      while (current && !compoundMatches(current, wanted, scope)) current = current.parentElement;
      if (!current) return false;
    }
  }
  return true;
}

// Small tree-backed DOM, not selector-specific dummy nodes. Legacy shell HTML
// is parsed, public controls really receive listeners, and new analytics nodes
// exist only if app.js constructs/inserts them. It intentionally parses HTML
// sinks too: an unsafe analytical innerHTML produces actual unwanted nodes.
class DomNode {
  constructor(type, document) {
    this.nodeType = type; this.ownerDocument = document; this.parentNode = null;
    this.childNodes = []; this.listeners = new Map();
  }
  get parentElement() { return this.parentNode?.nodeType === 1 ? this.parentNode : null; }
  get children() { return this.childNodes.filter(child => child.nodeType === 1); }
  get childElementCount() { return this.children.length; }
  get firstChild() { return this.childNodes[0] ?? null; }
  get lastChild() { return this.childNodes.at(-1) ?? null; }
  get firstElementChild() { return this.children[0] ?? null; }
  get lastElementChild() { return this.children.at(-1) ?? null; }
  get nextSibling() { return this.parentNode?.childNodes[this.parentNode.childNodes.indexOf(this) + 1] ?? null; }
  get nextElementSibling() { return this.parentNode?.children[this.parentNode.children.indexOf(this) + 1] ?? null; }
  get isConnected() {
    let node = this; while (node.parentNode) node = node.parentNode;
    return node.nodeType === 9;
  }
  contains(other) {
    for (let node = other; node; node = node.parentNode) if (node === this) return true;
    return false;
  }
  insertBefore(child, reference) {
    assert.ok(reference === null || reference.parentNode === this, 'Reference belongs to this parent');
    if (child === reference) return child;
    if (child.nodeType === 11) {
      for (const item of [...child.childNodes]) this.insertBefore(item, reference);
      return child;
    }
    assert.equal(child.contains(this), false, 'DOM insertion cannot create a cycle');
    const childSnapshot = subtreeSnapshot(child);
    child.remove();
    const index = reference === null ? this.childNodes.length : this.childNodes.indexOf(reference);
    const event = this.ownerDocument.recordMutation('insert', this, { child, childSnapshot });
    this.childNodes.splice(index, 0, child); child.parentNode = this;
    if (event.connected) this.ownerDocument.insertions.push(event);
    return child;
  }
  appendChild(child) { return this.insertBefore(child, null); }
  append(...values) {
    for (const value of values) this.appendChild(typeof value === 'string' ? this.ownerDocument.createTextNode(value) : value);
  }
  replaceChildren(...values) {
    const nodes = values.map(value => typeof value === 'string' ? this.ownerDocument.createTextNode(value) : value);
    const event = this.ownerDocument.recordMutation('replaceChildren', this, {
      inputs: Object.freeze(nodes.map(subtreeSnapshot)), before: Object.freeze([...this.childNodes])
    });
    const previous = this.ownerDocument.activeReplacement;
    this.ownerDocument.activeReplacement = event;
    try {
      for (const child of [...this.childNodes]) this.removeChild(child);
      this.append(...nodes);
      if (this.id === 'analyticsHost') this.ownerDocument.commits.push(Object.freeze({
        host: this, entry: event, children: Object.freeze([...this.childNodes]), text: this.textContent
      }));
    } finally { this.ownerDocument.activeReplacement = previous; }
  }
  removeChild(child) {
    const index = this.childNodes.indexOf(child); assert.ok(index >= 0);
    this.ownerDocument.recordMutation('remove', this, { child, childSnapshot: subtreeSnapshot(child) });
    this.childNodes.splice(index, 1); child.parentNode = null; return child;
  }
  remove() { this.parentNode?.removeChild(this); }
  before(...values) {
    if (this.parentNode) for (const value of values)
      this.parentNode.insertBefore(typeof value === 'string' ? this.ownerDocument.createTextNode(value) : value, this);
  }
  get textContent() { return this.childNodes.map(child => child.textContent).join(''); }
  set textContent(value) {
    const text = value === null ? '' : String(value);
    this.ownerDocument.recordMutation('text', this, { value: text });
    this.replaceChildren(...(text === '' ? [] : [this.ownerDocument.createTextNode(text)]));
  }
  querySelectorAll(selector) {
    const groups = selector.split(',').map(value => value.trim());
    return descendants(this).filter(node => node.nodeType === 1 && groups.some(group => selectorMatches(node, group, this)));
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0] ?? null; }
  addEventListener(type, callback, options = {}) {
    const entries = this.listeners.get(type) ?? [];
    entries.push({ callback, signal: options.signal }); this.listeners.set(type, entries);
  }
  click() {
    const event = { target: this, currentTarget: this, preventDefault() {}, stopPropagation() {} };
    for (const listener of this.listeners.get('click') ?? [])
      if (!listener.signal?.aborted) listener.callback.call(this, event);
  }
  focus() { this.ownerDocument.activeElement = this; }
}
Object.assign(DomNode, { ELEMENT_NODE: 1, TEXT_NODE: 3, DOCUMENT_NODE: 9, DOCUMENT_FRAGMENT_NODE: 11 });
class DomText extends DomNode {
  constructor(value, document) { super(3, document); this.data = value; }
  get data() { return this._data; }
  set data(value) {
    const text = String(value);
    this.ownerDocument.recordMutation('text', this, { value: text });
    this._data = text;
  }
  get nodeValue() { return this.data; }
  set nodeValue(value) { this.data = value; }
  get textContent() { return this.data; }
  set textContent(value) { this.data = String(value); }
}
class DomElement extends DomNode {
  constructor(tag, document) {
    super(1, document); this.localName = tag.toLowerCase(); this.tagName = tag.toUpperCase();
    this.attrs = new Map(); this.style = {};
    const names = () => new Set((this.className || '').split(/\s+/).filter(Boolean));
    this.classList = {
      contains: name => names().has(name),
      add: (...values) => { this.className = [...new Set([...names(), ...values])].join(' '); },
      remove: (...values) => { this.className = [...names()].filter(name => !values.includes(name)).join(' '); },
      toggle: (name, force) => {
        const wanted = force ?? !names().has(name);
        if (wanted) this.classList.add(name); else this.classList.remove(name); return wanted;
      }
    };
    this.dataset = new Proxy({}, {
      get: (_, key) => this.getAttribute('data-' + String(key).replace(/[A-Z]/g, letter => '-' + letter.toLowerCase())) ?? undefined
    });
  }
  get id() { return this.getAttribute('id') ?? ''; } set id(value) { this.setAttribute('id', value); }
  get className() { return this.getAttribute('class') ?? ''; } set className(value) { this.setAttribute('class', value); }
  get lang() { return this.getAttribute('lang') ?? ''; } set lang(value) { this.setAttribute('lang', value); }
  get dir() { return this.getAttribute('dir') ?? ''; } set dir(value) { this.setAttribute('dir', value); }
  get hidden() { return this.hasAttribute('hidden'); }
  set hidden(value) { if (value) this.setAttribute('hidden', ''); else this.removeAttribute('hidden'); }
  get attributes() { return [...this.attrs].map(([name, value]) => ({ name, value })); }
  setAttribute(name, value) {
    const key = String(name).toLowerCase(), text = String(value);
    const event = this.ownerDocument.recordMutation('setAttribute', this, { name: key, value: text });
    this.attrs.set(key, text);
    if (key === 'id') this.ownerDocument.idAssignments.push(event);
  }
  getAttribute(name) { return this.attrs.get(String(name).toLowerCase()) ?? null; }
  hasAttribute(name) { return this.attrs.has(String(name).toLowerCase()); }
  removeAttribute(name) {
    const key = String(name).toLowerCase();
    this.ownerDocument.recordMutation('removeAttribute', this, { name: key });
    this.attrs.delete(key);
  }
  closest(selector) {
    for (let node = this; node; node = node.parentElement) if (selectorMatches(node, selector, this)) return node;
    return null;
  }
  matches(selector) { return selectorMatches(this, selector, this); }
  get innerHTML() { return this.childNodes.map(serialize).join(''); }
  set innerHTML(value) {
    const text = String(value); this.ownerDocument.htmlSinks.push({ element: this, text });
    this.replaceChildren();
    parseShell(text, this, this.ownerDocument);
  }
  insertAdjacentHTML() { throw new Error('Unexpected HTML insertion sink'); }
}
function serialize(node) {
  if (node.nodeType === 3) return escapeText(node.data);
  return '<' + node.localName + [...node.attrs].map(([name, value]) => ' ' + name + '="' + escapeText(value) + '"').join('') +
    '>' + node.childNodes.map(serialize).join('') + '</' + node.localName + '>';
}
function parseShell(html, root, document) {
  const stack = [root], voidTags = new Set(['input', 'br', 'img', 'hr', 'meta', 'link', 'area', 'source', 'wbr']);
  for (const token of html.match(/<!--[\s\S]*?-->|<\/?[A-Za-z][^>]*>|[^<]+|</g) ?? []) {
    if (token.startsWith('<!--')) continue;
    if (token.startsWith('</')) {
      const name = token.match(/^<\/([^\s>]+)/)[1].toLowerCase();
      const index = stack.findLastIndex(node => node.localName === name);
      if (index > 0) stack.length = index;
    } else if (/^<[A-Za-z]/.test(token)) {
      const name = token.match(/^<([^\s/>]+)/)[1], element = document.createElement(name);
      const attributes = token.slice(name.length + 1).replace(/\/?>$/, '');
      for (const match of attributes.matchAll(/([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>]+)))?/g))
        element.setAttribute(match[1], decode(match[2] ?? match[3] ?? match[4] ?? ''));
      stack.at(-1).appendChild(element);
      if (!voidTags.has(element.localName) && !token.endsWith('/>')) stack.push(element);
    } else stack.at(-1).appendChild(document.createTextNode(decode(token)));
  }
}
class DomDocument extends DomNode {
  constructor() {
    super(9, null); this.ownerDocument = this; this.created = []; this.htmlSinks = []; this.commits = [];
    this.mutations = []; this.idAssignments = []; this.insertions = []; this.activeReplacement = null;
    this.cookieWrites = [];
    Object.defineProperty(this, 'cookie', {
      enumerable: true, configurable: false, get: () => '',
      set: value => { this.cookieWrites.push(String(value)); }
    });
    this.documentElement = this.createElement('html'); this.body = this.createElement('body');
    this.appendChild(this.documentElement); this.documentElement.appendChild(this.body);
    const app = this.createElement('div'); app.id = 'app'; this.body.appendChild(app);
    this.activeElement = this.body;
  }
  recordMutation(type, target, details = {}) {
    const ancestors = [];
    for (let node = target; node; node = node.parentNode) ancestors.push(node);
    const event = Object.freeze({ sequence: this.mutations.length, type, target,
      connected: target.isConnected, ancestors: Object.freeze(ancestors),
      replacement: this.activeReplacement, ...details });
    this.mutations.push(event);
    return event;
  }
  createElement(tag) { const element = new DomElement(tag, this); this.created.push(element); return element; }
  createTextNode(text) { return new DomText(String(text), this); }
  createDocumentFragment() { return new DomNode(11, this); }
  getElementById(id) { return descendants(this).find(node => node.nodeType === 1 && node.id === id) ?? null; }
}

// Method reads are the normal Storage API. All named-property channels are
// recorded before rejecting them, so a production catch cannot hide an attempt.
function monitoredStorage(methods, namedAccesses) {
  const target = Object.freeze(Object.assign(Object.create(null), methods));
  function unexpected(operation, key) {
    namedAccesses.push(Object.freeze([operation, String(key)]));
    throw new Error('Unexpected named localStorage ' + operation + ': ' + String(key));
  }
  return new Proxy(target, {
    get(object, key, receiver) {
      if (!Object.hasOwn(methods, key)) return unexpected('get', key);
      return Reflect.get(object, key, receiver);
    },
    set(_object, key) { return unexpected('set', key); },
    defineProperty(_object, key) { return unexpected('defineProperty', key); },
    deleteProperty(_object, key) { return unexpected('deleteProperty', key); }
  });
}
function persistenceHarness(source) {
  const entries = new Map([[STORAGE, JSON.stringify(source)], [LANGUAGE, 'en'], [ONBOARDING, '1']]);
  const writes = [], namedAccesses = [];
  const storage = monitoredStorage({
    getItem: key => entries.get(String(key)) ?? null,
    setItem(key, value) {
      const name = String(key), text = String(value);
      writes.push(['setItem', name, text]); entries.set(name, text);
    },
    removeItem(key) { const name = String(key); writes.push(['removeItem', name]); entries.delete(name); },
    clear() { writes.push(['clear']); entries.clear(); }
  }, namedAccesses);
  return { storage, writes, namedAccesses, initialEntries: [...entries].sort(),
    storageEntries: () => [...entries].sort() };
}

// VM-side private fixture facade has exactly the real immutable method/object/
// global-descriptor shape. It returns a new deeply frozen local DTO each time.
// Counters remain in the test environment; app.js receives no test API/options.
function installPrivateFacade() {
  const control = globalThis.__basicTestControl;
  const name = 'PHEISIRAETHA_ANALYTICS_V1';
  const originalDescriptor = Object.getOwnPropertyDescriptor;
  const originalDescriptors = Object.getOwnPropertyDescriptors;
  const originalHasOwn = Object.hasOwn;
  const originalReflectDescriptor = Reflect.getOwnPropertyDescriptor;
  const originalReflectGet = Reflect.get;
  const originalReflectHas = Reflect.has;
  const track = (object, key) => { if (object === globalThis && key === name) control.lookups++; };
  Object.getOwnPropertyDescriptor = (object, key) => { track(object, key); return originalDescriptor(object, key); };
  Object.getOwnPropertyDescriptors = object => {
    if (object === globalThis) control.lookups++;
    return originalDescriptors(object);
  };
  Object.hasOwn = (object, key) => { track(object, key); return originalHasOwn(object, key); };
  Reflect.getOwnPropertyDescriptor = (object, key) => { track(object, key); return originalReflectDescriptor(object, key); };
  Reflect.get = (object, key, receiver) => { track(object, key); return originalReflectGet(object, key, receiver ?? object); };
  Reflect.has = (object, key) => { track(object, key); return originalReflectHas(object, key); };
  function freezeData(value) {
    if (value && typeof value === 'object') {
      for (const key of Reflect.ownKeys(value)) {
        const descriptor = originalDescriptor(value, key);
        if (Object.hasOwn(descriptor, 'value')) freezeData(descriptor.value);
      }
      Object.freeze(value);
    }
    return value;
  }
  if (control.facade === 'absent') return;
  if (control.facade === 'poison') {
    Object.defineProperty(globalThis, name, {
      configurable: false, get() { control.facadeGets++; throw new Error('Facade getter must not execute'); }
    });
    return;
  }
  const evaluate = Object.freeze({ evaluate(state) {
    const dto = JSON.parse(control.next(state, arguments.length));
    if (globalThis.__basicTestMutate) globalThis.__basicTestMutate(dto);
    return freezeData(dto);
  } }.evaluate);
  Object.defineProperty(globalThis, name, {
    value: Object.freeze({ evaluate }), enumerable: true, writable: false, configurable: false
  });
}
function appHarness(source, { enabled = true, facade = 'fixture', response = actualDto(source), mutate = null, throws = false } = {}) {
  assert.equal(APP_SOURCE.split(OFF).length, 2, 'Exactly one frozen S1 OFF declaration is required; no pre-S1 behavioral pass');
  const appSource = enabled ? APP_SOURCE.replace(OFF, ON) : APP_SOURCE;
  const document = new DomDocument(), persistence = persistenceHarness(source);
  const { storage } = persistence;
  const alerts = [], calls = [], forbiddenIO = [];
  const denyIO = name => { forbiddenIO.push(name); throw new Error('Unexpected analytical I/O: ' + name); };
  const control = { facade, response, throws, lookups: 0, facadeGets: 0, dtoGets: 0, argumentCounts: [],
    next(state, argumentCount) {
      calls.push(structuredClone(state));
      control.argumentCounts.push(argumentCount);
      if (control.throws) throw new Error('private evaluate fault');
      return JSON.stringify(control.response);
    }
  };
  const sandbox = { document, localStorage: storage, navigator: { language: 'en', languages: ['en'] },
    location: { protocol: 'test:' }, AbortController, Node: DomNode, Element: DomElement, HTMLElement: DomElement,
    crypto: { randomUUID: () => 'test-only-unused-id' }, alert: message => alerts.push(message),
    confirm: () => false, __basicTestControl: control };
  for (const name of ['sessionStorage', 'indexedDB', 'caches', 'fetch', 'XMLHttpRequest', 'WebSocket',
    'EventSource', 'Worker', 'importScripts'])
    Object.defineProperty(sandbox, name, { get() { return denyIO(name); } });
  sandbox.navigator.sendBeacon = () => denyIO('navigator.sendBeacon');
  sandbox.window = sandbox;
  const context = vm.createContext(sandbox, { codeGeneration: { strings: false, wasm: false } });
  const run = code => vm.runInContext(code, context, { timeout: 10000 });
  run(LOCALES_SOURCE);
  if (mutate) context.__basicTestMutate = run('(' + mutate.toString() + ')');
  run('(' + installPrivateFacade.toString() + ')()');
  // Installation is outside the measured application transaction.
  control.lookups = 0;
  let mutationStart = document.mutations.length;
  run(appSource);
  assert.ok(document.querySelector('#app main h1'), 'Real production boot/render executed');
  return { document, calls, alerts, forbiddenIO, control, ...persistence,
    get mutationStart() { return mutationStart; },
    click(selector) {
      const button = document.querySelector(selector);
      assert.ok(button, 'Public production control exists: ' + selector);
      assert.ok(button.listeners.get('click')?.length, 'Production listener is attached: ' + selector);
      mutationStart = document.mutations.length;
      button.click();
    }
  };
}

function assertNoAnalytics(app, previous = []) {
  const host = app.document.getElementById('analyticsHost');
  if (host) { assert.equal(host.childNodes.length, 0); assert.equal(host.textContent, ''); }
  const content = app.document.getElementById('app').textContent;
  for (const text of previous) assert.equal(content.includes(text), false, 'Old analytic body removed');
  assert.deepEqual(app.alerts, []);
}
function hostHistoryPosition(document) {
  return Object.freeze({ ids: document.idAssignments.length, insertions: document.insertions.length });
}
function assertNoAnalyticsHostHistory(document, position = { ids: 0, insertions: 0 }) {
  const assignments = document.idAssignments.filter(event => event.value === 'analyticsHost');
  const everHosts = new Set(assignments.map(event => event.target));
  assert.deepEqual(document.idAssignments.slice(position.ids).filter(event => event.value === 'analyticsHost'), [],
    'Zero analyticsHost ID assignments during an ineligible render');
  assert.deepEqual(document.insertions.slice(position.insertions)
    .filter(event => event.childSnapshot.nodes.some(node => everHosts.has(node))), [],
  'Zero insertions of a node ever assigned analyticsHost during an ineligible render');
}
function assertAtomicMount(document, host, root, texts, since = 0) {
  const commits = document.commits.filter(commit => commit.host === host &&
    commit.entry.sequence >= since && commit.children.length > 0);
  assert.equal(commits.length, 1, 'The current host receives exactly one nonempty replaceChildren commit');
  const commit = commits[0], entry = commit.entry;
  assert.equal(entry.connected, true, 'Atomic commit targets the connected host');
  assert.equal(entry.inputs.length, 1, 'Commit receives one already-complete subtree');
  const input = entry.inputs[0];
  assert.equal(input.node, root);
  assert.equal(input.connected, false, 'The complete root is detached at replaceChildren entry');
  assert.deepEqual(input.bodies, texts, 'All bodies exist in exact order before any commit mutation');
  assert.equal(input.text, texts.join(''));
  assert.deepEqual(commit.children, [root]);
  assert.equal(commit.text, input.text);

  const nodes = new Set(input.nodes), mutations = document.mutations.slice(since);
  const textWrites = mutations.filter(event => event.type === 'text' && nodes.has(event.target));
  for (const text of texts) assert.ok(textWrites.some(event => event.value === text),
    'Each analytical body has an observed inert text write');
  for (const event of textWrites) {
    assert.equal(event.connected, false, 'Every analytical text write occurs while detached');
    assert.ok(event.sequence < entry.sequence, 'Analytical text is complete before the host commit');
  }

  // Classify historical node identities/ancestry, never their final connection
  // state. Native replaceChildren's internal insertion is part of that single
  // operation; standalone appends/inserts and live subtree edits are not.
  const touchesAnalytics = event => event.ancestors.some(node => node === host || nodes.has(node)) ||
    event.childSnapshot?.nodes.some(node => node === host || nodes.has(node)) ||
    event.inputs?.some(snapshot => snapshot.nodes.some(node => node === host || nodes.has(node)));
  for (const event of mutations.filter(touchesAnalytics)) {
    if (!event.connected) {
      if (event.type === 'insert' && nodes.has(event.target))
        assert.equal(event.childSnapshot.connected, false, 'Subtree child construction moves only detached nodes');
      continue;
    }
    if (event.type === 'insert' && event.child === host) {
      assert.equal(event.childSnapshot.connected, false);
      assert.deepEqual(event.childSnapshot.nodes, [host], 'Only the empty host may be inserted before the commit');
      assert.equal(event.childSnapshot.text, '');
      continue;
    }
    if (event.type === 'replaceChildren' && event.target === host) {
      assert.ok(event === entry || (event.inputs.length === 0 && event.before.length === 0),
        'No earlier nonempty host replacement or partial subtree');
      continue;
    }
    if (event.type === 'insert' && event.target === host && event.child === root && event.replacement === entry) {
      assert.equal(event.childSnapshot.connected, false);
      assert.deepEqual(event.childSnapshot.bodies, texts);
      continue;
    }
    assert.fail('No connected analytical subtree mutation outside the one complete atomic commit');
  }
  assert.equal(mutations.filter(event => event.type === 'insert' && event.target === host &&
    event.replacement === entry && event.child === root).length, 1, 'Exactly one complete root insertion inside the commit');
}
function assertNoHandlerAttributes(host, root) {
  assert.equal([host, root, ...descendants(root)].some(node => node.nodeType === 1 &&
    node.attributes.some(attribute => /^on/i.test(attribute.name))), false,
  'No event-handler attribute on the host, root or any analytical descendant');
}
function assertMount(app, dto, slots) {
  assert.deepEqual(dto.components.map(component => component.slot), slots);
  assert.deepEqual(dto.components.map(component => component.componentId), slots);
  assert.deepEqual(dto.components.map(component => component.surface),
    slots.map(slot => slot.startsWith('secondary.') ? 'SECONDARY' : slot === 'fallback' ? 'FALLBACK' : 'PRIMARY'));
  assert.deepEqual(dto.components.map(component => component.role),
    slots.map(slot => slot === 'fallback' ? 'FALLBACK' : slot.endsWith('.insight') ? 'INSIGHT' : 'WHY'));
  assert.equal(dto.components.every(component => component.templateVersion === 1), true);
  const host = app.document.getElementById('analyticsHost'), main = app.document.querySelector('#app main');
  assert.ok(host && host.isConnected && main.contains(host), 'App constructs the live analytics host');
  assert.equal(app.document.querySelectorAll('#analyticsHost').length, 1);
  assert.equal(host.parentNode, main);
  assert.equal(host.nextElementSibling, main.querySelector('.notice.smalltext'), 'Exact placement before recommended notice');
  assert.equal(host.childNodes.length, 1, 'Exactly one complete analytical root');
  const root = host.firstElementChild; assert.ok(root);
  assert.equal(root.getAttribute('lang'), 'en'); assert.equal(root.getAttribute('dir'), 'ltr');
  assert.deepEqual(leafBodies(root), dto.components.map(component => component.text),
    'Every MF3/MF4/fallback component appears exactly once, in exact order, with no invented heading or body');
  assert.equal(root.textContent, dto.components.map(component => component.text).join(''));
  assertAtomicMount(app.document, host, root, dto.components.map(component => component.text), app.mutationStart);
  assert.equal(app.document.htmlSinks.some(sink => host.contains(sink.element)), false, 'Analytics never uses innerHTML');
  return root;
}
function assertNoPersistence(app, source) {
  assert.deepEqual(app.writes, [], 'Boot/evaluate/navigation do not persist analytics');
  assert.deepEqual(app.namedAccesses, [], 'No unexpected named-property storage channel, including caught attempts');
  assert.deepEqual(app.document.cookieWrites, [], 'No analytical cookie persistence');
  assert.deepEqual(app.forbiddenIO, [], 'Analytics never touches alternate storage, caches or network persistence');
  assert.deepEqual(app.storageEntries(), app.initialEntries, 'Stored bytes and complete key set unchanged');
  assert.deepEqual(app.control.argumentCounts, Array(app.calls.length).fill(1), 'Only one committed-state argument is passed');
  for (const state of app.calls) assert.deepEqual(state, source, 'Facade receives committed source without analytical fields');
}

test('private persistence positive controls detect named-property channels and cookies', () => {
  const source = emptyCycles();
  const probe = () => ({ ...persistenceHarness(source), document: new DomDocument(),
    calls: [], control: { argumentCounts: [] }, forbiddenIO: [] });
  const channels = [
    ['get', storage => storage.analyticsDTO],
    ['get', storage => storage['analyticsDTO']],
    ['set', storage => { storage.analyticsDTO = 'private result'; }],
    ['set', storage => { storage['analyticsDTO'] = 'private result'; }],
    ['defineProperty', storage => Object.defineProperty(storage, 'analyticsDTO', { value: 'private result' })],
    ['deleteProperty', storage => { delete storage.analyticsDTO; }]
  ];
  for (const [operation, attempt] of channels) {
    const app = probe();
    assertNoPersistence(app, source);
    assert.throws(() => attempt(app.storage), /Unexpected named localStorage/);
    assert.deepEqual(app.namedAccesses, [[operation, 'analyticsDTO']]);
    assert.deepEqual(app.writes, []);
    assert.deepEqual(app.storageEntries(), app.initialEntries);
    assert.throws(() => assertNoPersistence(app, source), /No unexpected named-property storage channel/,
      'The same final oracle detects attempts even after their exception is caught');
  }
  const cookie = probe();
  assert.equal(cookie.document.cookie, '');
  assertNoPersistence(cookie, source);
  cookie.document.cookie = 'analyticsDTO=private-result';
  assert.deepEqual(cookie.document.cookieWrites, ['analyticsDTO=private-result']);
  assert.deepEqual(cookie.writes, []); assert.deepEqual(cookie.namedAccesses, []);
  assert.deepEqual(cookie.storageEntries(), cookie.initialEntries);
  assert.throws(() => assertNoPersistence(cookie, source), /No analytical cookie persistence/);

  const normal = probe();
  assert.equal(normal.storage.getItem(STORAGE), JSON.stringify(source));
  assert.equal(normal.storage.getItem('absent'), null);
  assertNoPersistence(normal, source);
  normal.storage.setItem(STORAGE, 'method bytes');
  assert.equal(normal.storage.getItem(STORAGE), 'method bytes');
  normal.storage.removeItem(STORAGE);
  assert.equal(normal.storage.getItem(STORAGE), null);
  normal.storage.clear();
  assert.deepEqual(normal.storageEntries(), []);
  assert.deepEqual(normal.writes, [['setItem', STORAGE, 'method bytes'], ['removeItem', STORAGE], ['clear']]);
  assert.deepEqual(normal.namedAccesses, [], 'All four normal methods remain usable without a named-channel fault');
  assert.throws(() => assertNoPersistence(normal, source), /Boot\/evaluate\/navigation do not persist analytics/);
});

test('private host history positive control retains an inserted host after ID clearing and removal', () => {
  const document = new DomDocument(), position = hostHistoryPosition(document);
  const host = document.createElement('div'); host.id = 'analyticsHost';
  document.body.appendChild(host);
  host.setAttribute('id', ''); host.remove();
  assert.equal(host.id, ''); assert.equal(host.isConnected, false);
  assert.equal(document.getElementById('analyticsHost'), null);
  const assignment = document.idAssignments[position.ids], insertion = document.insertions[position.insertions];
  assert.equal(Object.isFrozen(assignment), true); assert.equal(assignment.value, 'analyticsHost');
  assert.equal(assignment.target, host);
  assert.equal(Object.isFrozen(insertion), true); assert.equal(insertion.connected, true);
  assert.equal(Object.isFrozen(insertion.childSnapshot.nodes), true);
  assert.ok(insertion.childSnapshot.nodes.includes(host));
  assert.throws(() => assertNoAnalyticsHostHistory(document, position), /Zero analyticsHost ID assignments/);
  assert.throws(() => assertNoAnalyticsHostHistory(document, {
    ids: document.idAssignments.length, insertions: position.insertions
  }), /Zero insertions of a node ever assigned analyticsHost/,
  'Insertion history independently detects the cleared and removed host');
});

test('private atomic oracle rejects live population even with a complete final self-replacement', () => {
  const texts = ['private first approved body', 'private second approved body'];
  function probe(attachEarly, detachBeforeCommit = false) {
    const document = new DomDocument(), host = document.createElement('div');
    host.id = 'analyticsHost'; document.body.appendChild(host);
    const root = document.createElement('section'); root.lang = 'en'; root.dir = 'ltr';
    if (attachEarly) host.appendChild(root);
    for (const text of texts) {
      const paragraph = document.createElement('p'); root.appendChild(paragraph); paragraph.textContent = text;
    }
    if (detachBeforeCommit) root.remove();
    host.replaceChildren(root);
    return { document, host, root };
  }
  const detached = probe(false);
  assertAtomicMount(detached.document, detached.host, detached.root, texts);
  for (const detachBeforeCommit of [false, true]) {
    const live = probe(true, detachBeforeCommit);
    assert.deepEqual(leafBodies(live.root), texts);
    assert.equal(live.host.textContent, texts.join(''));
    assert.equal(live.document.commits.filter(commit => commit.children.length > 0).length, 1);
    assert.deepEqual(live.document.commits.at(-1).entry.inputs[0].bodies, texts);
    assert.ok(live.document.mutations.some(event => event.type === 'text' && event.connected && texts.includes(event.value)));
    assert.ok(live.document.mutations.some(event => event.type === 'insert' && event.connected && event.target === live.root));
    assert.throws(() => assertAtomicMount(live.document, live.host, live.root, texts), { code: 'ERR_ASSERTION' },
      'The oracle rejects live construction even if it was detached again before the final complete commit');
  }
});

test('private handler-attribute oracle covers the host, root and descendants independently', () => {
  const document = new DomDocument(), host = document.createElement('div');
  const root = document.createElement('section'), paragraph = document.createElement('p');
  host.appendChild(root); root.appendChild(paragraph);
  for (const node of [host, root, paragraph]) {
    assertNoHandlerAttributes(host, root);
    node.setAttribute('OnClick', 'private handler');
    assert.throws(() => assertNoHandlerAttributes(host, root), /No event-handler attribute/);
    node.removeAttribute('onclick');
  }
  assertNoHandlerAttributes(host, root);
});

test('production OFF: no descriptor lookup, getter/evaluate invocation or host creation', () => {
  for (const facade of ['fixture', 'poison']) {
    const source = both(), app = appHarness(source, { enabled: false, facade });
    assert.equal(app.control.lookups, 0); assert.equal(app.control.facadeGets, 0);
    assert.equal(app.calls.length, 0);
    assert.equal(app.document.getElementById('analyticsHost'), null);
    assertNoAnalyticsHostHistory(app.document);
    assertNoAnalytics(app, [...app.control.response.components.map(component => component.text), FALLBACK]);
    assertNoPersistence(app, source);
  }
});

for (const [name, make, slots] of [
  ['MF3', primary, PRIMARY_SLOTS], ['MF4', both, [...PRIMARY_SLOTS, ...SECONDARY_SLOTS]]
]) test('Home + committed intent enabled: exact ' + name + ' ALLOW structure', () => {
  const source = make(), dto = actualDto(source);
  assert.equal(dto.mode, 'APPROVED_BUNDLE'); assert.equal(dto.components.length, slots.length);
  const app = appHarness(source, { response: dto });
  assert.equal(app.calls.length, 1, 'Exactly one synchronous app evaluation');
  assertMount(app, dto, slots); assertNoPersistence(app, source);
});

test('enabled Home without intent, and non-Home navigation, create no analytical host or authority call', () => {
  const noIntent = { version: '0.1.0', lang: 'en', intent: null };
  const empty = appHarness(noIntent);
  assert.equal(empty.calls.length, 0); assert.equal(empty.control.lookups, 0);
  assert.equal(empty.document.getElementById('analyticsHost'), null);
  assertNoAnalyticsHostHistory(empty.document);
  assertNoAnalytics(empty, [FALLBACK]);
  assertNoPersistence(empty, noIntent);
  const source = both(), app = appHarness(source), lookups = app.control.lookups;
  assert.equal(app.calls.length, 1);
  const historyAtEntry = hostHistoryPosition(app.document);
  app.click('[data-nav="history"]');
  assert.equal(app.calls.length, 1); assert.equal(app.control.lookups, lookups);
  assert.equal(app.document.getElementById('analyticsHost'), null);
  assertNoAnalyticsHostHistory(app.document, historyAtEntry);
  assertNoAnalytics(app, [...app.control.response.components.map(component => component.text), FALLBACK]);
  assertNoPersistence(app, source);
});

test('FALLBACK_ONLY replaces a prior ALLOW with the actual frozen Safety fallback alone', () => {
  const source = both(), allowed = actualDto(source), fallback = actualDto(emptyCycles());
  assert.equal(allowed.mode, 'APPROVED_BUNDLE');
  assert.equal(fallback.mode, 'FALLBACK_ONLY'); assert.equal(fallback.components.length, 1);
  assert.equal(fallback.components[0].text, FALLBACK);
  const app = appHarness(source, { response: allowed });
  const previous = assertMount(app, allowed, [...PRIMARY_SLOTS, ...SECONDARY_SLOTS]);
  app.control.response = fallback;
  app.click('[data-nav="home"]');
  assert.equal(app.calls.length, 2);
  assert.equal(previous.isConnected, false);
  assertMount(app, fallback, ['fallback']);
  for (const component of allowed.components)
    assert.equal(app.document.getElementById('app').textContent.includes(component.text), false);
  assertNoPersistence(app, source);
});

test('UNAVAILABLE after ALLOW removes every prior analytical body and manufactures no fallback', () => {
  const source = both(), allowed = actualDto(source), app = appHarness(source, { response: allowed });
  const previous = assertMount(app, allowed, [...PRIMARY_SLOTS, ...SECONDARY_SLOTS]);
  app.control.response = unavailable; app.click('[data-nav="home"]');
  assert.equal(app.calls.length, 2); assert.equal(previous.isConnected, false);
  assertNoAnalytics(app, [...allowed.components.map(component => component.text), FALLBACK]);
  assertNoPersistence(app, source);
});

test('enabled with the facade absent fails closed while the normal Home renders', () => {
  const source = both(), app = appHarness(source, { facade: 'absent' });
  assert.equal(app.calls.length, 0);
  assertNoAnalytics(app, [FALLBACK]); assertNoPersistence(app, source);
});

test('evaluate exception after ALLOW fails closed and does not retain old approved text', () => {
  const source = both(), allowed = actualDto(source), app = appHarness(source, { response: allowed });
  const previous = assertMount(app, allowed, [...PRIMARY_SLOTS, ...SECONDARY_SLOTS]);
  app.control.throws = true; app.click('[data-nav="home"]');
  assert.equal(app.calls.length, 2); assert.equal(previous.isConnected, false);
  assertNoAnalytics(app, [...allowed.components.map(component => component.text), FALLBACK, 'private evaluate fault']);
  assertNoPersistence(app, source);
});

const malformed = [
  ['DTO version', dto => { dto.dtoVersion = 'future'; }],
  ['unknown mode', dto => { dto.mode = 'ALLOW'; }],
  ['noncanonical language', dto => { dto.lang = 'de'; }],
  ['wrong direction', dto => { dto.dir = 'rtl'; }],
  ['extra raw field', dto => { dto.engineResult = { primary: 'must not render' }; }],
  ['missing required E30', dto => { dto.components.splice(4, 1); }],
  ['duplicate slot', dto => { dto.components[1].slot = 'primary.insight'; }],
  ['wrong surface', dto => { dto.components[0].surface = 'SECONDARY'; }],
  ['wrong role', dto => { dto.components[0].role = 'INTERPRETATION'; }],
  ['nonstring text', dto => { dto.components[0].text = 42; }],
  ['nonplain DTO', dto => { Object.setPrototypeOf(dto, { inherited: true }); }],
  ['accessor text', dto => {
    Object.defineProperty(dto.components[0], 'text', {
      enumerable: true, configurable: true,
      get() { globalThis.__basicTestControl.dtoGets++; throw new Error('DTO getter must not execute'); }
    });
  }]
];
for (const [name, mutate] of malformed) test('malformed render DTO fails closed: ' + name, () => {
  const source = primary(), dto = actualDto(source);
  assert.equal(dto.mode, 'APPROVED_BUNDLE');
  const app = appHarness(source, { response: dto, mutate });
  assert.equal(app.calls.length, 1, 'Malformed fixture reaches the real app evaluation boundary');
  assert.equal(app.control.dtoGets, 0, 'Descriptor validation never invokes a DTO getter');
  assertNoAnalytics(app, [...dto.components.map(component => component.text), FALLBACK, 'must not render']);
  assertNoPersistence(app, source);
});

for (const [name, make, slots] of [
  ['MF3', primary, PRIMARY_SLOTS], ['MF4', both, [...PRIMARY_SLOTS, ...SECONDARY_SLOTS]]
]) test('malformed component order fails closed: actual frozen ' + name, () => {
  const source = make(), dto = actualDto(source);
  assert.equal(dto.mode, 'APPROVED_BUNDLE');
  assert.deepEqual(dto.components.map(component => component.slot), slots);
  const reordered = structuredClone(dto);
  [reordered.components[1], reordered.components[2]] = [reordered.components[2], reordered.components[1]];
  assert.deepEqual(reordered.components[1], dto.components[2]);
  assert.deepEqual(reordered.components[2], dto.components[1]);
  const restored = structuredClone(reordered);
  [restored.components[1], restored.components[2]] = [restored.components[2], restored.components[1]];
  assert.deepEqual(restored, dto, 'Permutation is the only fixture defect; every component field remains actual');

  const app = appHarness(source, { response: reordered });
  assert.equal(app.calls.length, 1, 'Complete reordered objects reach the real app validator');
  const texts = dto.components.map(component => component.text);
  assertNoAnalytics(app, [...texts, FALLBACK]);
  assert.equal(app.document.commits.some(commit => commit.children.length > 0), false,
    'No complete or partially salvaged analytical commit');
  assert.equal(app.document.insertions.some(event => texts.some(text => event.childSnapshot.text.includes(text))), false,
    'No analytical body is ever inserted into the connected tree');
  assert.equal(app.document.mutations.some(event => event.type === 'text' && event.connected &&
    texts.some(text => event.value.includes(text))), false, 'No analytical text is ever written while connected');
  assertNoPersistence(app, source);
});

test('HTML-like analytical text remains exact inert text with no parsed elements or handler attributes', () => {
  const source = primary(), dto = actualDto(source);
  const literal = '<img id="analytics-injected" src=x onerror="bad()"><script>bad()</script><b>literal & text</b>';
  dto.components[0].text = literal;
  const app = appHarness(source, { response: dto });
  assert.equal(app.calls.length, 1);
  const root = assertMount(app, dto, PRIMARY_SLOTS);
  assert.equal(root.textContent.includes(literal), true);
  assert.equal(root.querySelectorAll('img,script,b').length, 0);
  assert.equal(app.document.getElementById('analytics-injected'), null);
  assertNoHandlerAttributes(app.document.getElementById('analyticsHost'), root);
  assert.equal(app.document.htmlSinks.some(sink => sink.text.includes(literal)), false);
  assertNoPersistence(app, source);
});

test('analytics never persists results, approvals, sources or generations across Home rerenders and fail-closed modes', () => {
  const source = both(), dto = actualDto(source), app = appHarness(source, { response: dto });
  assertMount(app, dto, [...PRIMARY_SLOTS, ...SECONDARY_SLOTS]);
  app.click('[data-nav="home"]');
  assertMount(app, dto, [...PRIMARY_SLOTS, ...SECONDARY_SLOTS]);
  app.control.response = actualDto(emptyCycles()); app.click('[data-nav="home"]');
  assertMount(app, app.control.response, ['fallback']);
  app.control.response = unavailable; app.click('[data-nav="home"]');
  assertNoAnalytics(app, [...dto.components.map(component => component.text), FALLBACK]);
  assert.equal(app.calls.length, 4);
  assertNoPersistence(app, source);
});
