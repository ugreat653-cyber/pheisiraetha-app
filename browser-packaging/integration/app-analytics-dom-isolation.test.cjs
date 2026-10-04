'use strict';

// S5 host/renderer tests, to execute after aggregation with the S1 app.js shard.
// The 3B-4 base intentionally has no wiring: missing S1 is a failure, never a
// skip or a substitute renderer. No test builds, installs, or loads a CDN.
// Only the OFF constant, final private observation API, and artifact entry
// observer are instrumented IN MEMORY. Real app render/templates/bindings and
// the actual frozen Analysis/Safety/formatter remain executable and unchanged.
// The small DOM below records structural/text operations for unit isolation;
// real browser layout, bidi shaping and accessibility-tree QA belong to 3B-6.
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
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'browser-packaging/build-manifest.json'), 'utf8'));
const artifactBytes = fs.readFileSync(path.join(ROOT, manifest.output.file));
assert.equal(manifest.phase, '2B-3B-2B');
assert.equal(createHash('sha256').update(artifactBytes).digest('hex'), manifest.output.sha256);
const ARTIFACT_SOURCE = artifactBytes.toString('utf8');
const GLOBAL = 'PHEISIRAETHA_ANALYTICS_V1';
const PRIVATE_API = '__S5_DOM_APP_TEST_ONLY__';
const REPORT = '__S5_DOM_DTO_TEST_ONLY__';
const REWRITE = '__S5_DOM_TEXT_TEST_ONLY__';
const LOOKUP = '__S5_DOM_LOOKUP_TEST_ONLY__';
const STORAGE_KEY = 'pheisiraetha_v01';
const LANGUAGE_KEY = 'pheisiraetha_language_v01';
const ONBOARDING_KEY = 'pheisiraetha_onboarding_v01';
const TAIL = '\n  render();\n\n})();';
const ENTRY = 'var { evaluate } = require_runtime();';
const LABELS = Array(10).fill('Calm / contentment');
const RAW = Object.freeze({
  interpretation: '__S5_RAW_INTERPRETATION_73c4__',
  nextFocus: '__S5_RAW_NEXT_FOCUS_82e5__',
  whyThisFocus: '__S5_RAW_WHY_THIS_FOCUS_19b6__',
  titleKey: '__S5_RAW_TITLE_KEY_35d7__',
  debug: '__S5_RAW_DEBUG_44a8__'
});

function sourceState(kind = 'MF4') {
  const state = kind === 'MF3' ? fixtures.reflection(LABELS, 'B4', true) : fixtures.fixture(1, LABELS);
  state.opaque = structuredClone(RAW);
  state.intent.opaque = { debug: RAW.debug, interpretation: RAW.interpretation };
  state.intent.cycles[0].opaque = { nextFocus: RAW.nextFocus, whyThisFocus: RAW.whyThisFocus };
  return state;
}
const copy = value => structuredClone(value);

function instrumentApp(enabled) {
  const flag = /\bconst\s+ANALYTICS_ENABLED\s*=\s*false\s*;/g;
  assert.equal((APP_SOURCE.match(flag) || []).length, 1,
    'S5 requires the aggregated S1 static default-OFF wiring in actual app.js');
  assert.equal(APP_SOURCE.split(TAIL).length, 2, 'Locate exactly the actual final app render');
  const source = enabled ? APP_SOURCE.replace(flag, 'const ANALYTICS_ENABLED = true;') : APP_SOURCE;
  return source.replace(TAIL, '\n  globalThis.' + PRIVATE_API + ' = Object.freeze({\n' +
    '    readState: () => state,\n' +
    '    rerender: () => render(),\n' +
    '    language: code => setLanguage(code),\n' +
    '    onboarding: () => { onboardingStep = 1; render(); }\n' +
    '  });\n  render();\n\n})();');
}

function instrumentArtifact() {
  assert.equal(ARTIFACT_SOURCE.split(ENTRY).length, 2, 'Private observation replaces only the one facade entry binding');
  return ARTIFACT_SOURCE.replace(ENTRY, 'var { evaluate: s5RealEvaluate } = require_runtime();\n' +
    '      var evaluate = Object.freeze({ evaluate(state) {\n' +
    '        const canonical = s5RealEvaluate(state);\n' +
    '        const replacement = globalThis.' + REWRITE + '(canonical);\n' +
    '        const dto = replacement === null ? canonical : Object.freeze({\n' +
    '          dtoVersion: canonical.dtoVersion, mode: canonical.mode,\n' +
    '          lang: canonical.lang, dir: canonical.dir,\n' +
    '          components: Object.freeze(canonical.components.map((c, i) => Object.freeze({\n' +
    '            componentId: c.componentId, surface: c.surface, role: c.role, slot: c.slot,\n' +
    '            templateId: c.templateId, templateVersion: c.templateVersion, text: replacement[i]\n' +
    '          })))\n' +
    '        });\n' +
    '        globalThis.' + REPORT + '(state, canonical, dto);\n' +
    '        return dto;\n' +
    '      } }.evaluate);');
}

// Independent oracle: uninstrumented, pinned artifact. No production host calls
// this oracle; it supplies exact canonical output for DOM comparisons only.
function oracle(state) {
  const context = vm.createContext({ inputJSON: JSON.stringify(state) },
    { codeGeneration: { strings: false, wasm: false } });
  vm.runInContext(ARTIFACT_SOURCE, context, { timeout: 10000 });
  return copy(vm.runInContext(GLOBAL + '.evaluate(JSON.parse(inputJSON))', context, { timeout: 10000 }));
}

function walk(root) {
  return [root, ...root.childNodes.flatMap(walk)];
}
function elements(root) {
  return walk(root).filter(node => node.nodeType === 1);
}
function bodyTexts(root) {
  return walk(root).filter(node => node.nodeType === 3 && node.data.trim() !== '').map(node => node.data);
}
function decode(text) {
  const entities = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
  return text.replace(/&(#x[0-9a-f]+|#[0-9]+|amp|lt|gt|quot|apos);/gi, (all, token) => {
    if (token[0] === '#') return String.fromCodePoint(parseInt(token.slice(token[1].toLowerCase() === 'x' ? 2 : 1),
      token[1].toLowerCase() === 'x' ? 16 : 10));
    return entities[token.toLowerCase()];
  });
}
function inlineStyle(node) {
  const declarations = () => new Map((node.getAttribute('style') || '').split(';').filter(Boolean).map(entry => {
    const colon = entry.indexOf(':');
    return [entry.slice(0, colon).trim().toLowerCase(), entry.slice(colon + 1).trim()];
  }));
  const cssName = key => String(key).replace(/[A-Z]/g, letter => '-' + letter.toLowerCase());
  const set = (key, value) => {
    const values = declarations();
    if (value === '') values.delete(key); else values.set(key, String(value));
    node.setAttribute('style', [...values].map(([name, text]) => name + ': ' + text).join('; '));
  };
  return new Proxy(Object.create(null), {
    get: (_, key) => {
      if (key === 'cssText') return node.getAttribute('style') || '';
      if (key === 'getPropertyValue') return name => declarations().get(String(name)) || '';
      if (key === 'setProperty') return (name, value) => set(String(name), value);
      if (key === 'removeProperty') return name => { const old = declarations().get(String(name)) || ''; set(String(name), ''); return old; };
      return declarations().get(cssName(key)) || '';
    },
    set: (_, key, value) => {
      if (key === 'cssText') node.setAttribute('style', value); else set(cssName(key), value);
      return true;
    }
  });
}

// Deliberately independent of the production host/renderer. It implements tree
// ownership, native-style fragment consumption, attributes and text nodes; it
// never decides eligibility, validates DTOs or creates analytical components.
class DomNode {
  constructor(document, type, name = '', data = '') {
    this.ownerDocument = document;
    this.nodeType = type;
    this.nodeName = type === 1 ? name.toUpperCase() : type === 3 ? '#text' : type === 8 ? '#comment' : '#document-fragment';
    this.localName = name.toLowerCase();
    this._data = data;
    this.parentNode = null;
    this.childNodes = [];
    this._attributes = new Map();
    this._listeners = new Map();
    this._value = undefined;
    this._checked = undefined;
    this.style = inlineStyle(this);
    this.classList = {
      contains: token => this.className.split(/\s+/).includes(token),
      add: (...tokens) => { this.className = [...new Set([...this.className.split(/\s+/).filter(Boolean), ...tokens])].join(' '); },
      remove: (...tokens) => { this.className = this.className.split(/\s+/).filter(token => token && !tokens.includes(token)).join(' '); },
      toggle: (token, force) => {
        const add = force === undefined ? !this.classList.contains(token) : Boolean(force);
        if (add) this.classList.add(token); else this.classList.remove(token);
        return add;
      }
    };
    this.dataset = new Proxy(Object.create(null), {
      get: (_, key) => this.getAttribute('data-' + String(key).replace(/[A-Z]/g, c => '-' + c.toLowerCase())),
      set: (_, key, value) => { this.setAttribute('data-' + String(key).replace(/[A-Z]/g, c => '-' + c.toLowerCase()), value); return true; }
    });
  }
  get isConnected() { return this === this.ownerDocument || Boolean(this.parentNode && this.parentNode.isConnected); }
  get data() { return this._data; }
  set data(value) {
    const text = String(value);
    this.ownerDocument.beforeText(this, text);
    this._data = text;
    this.ownerDocument.record('CharacterData', this);
  }
  get nodeValue() { return this.nodeType === 3 || this.nodeType === 8 ? this.data : null; }
  set nodeValue(value) { if (this.nodeType === 3 || this.nodeType === 8) this.data = value == null ? '' : String(value); }
  get parentElement() { return this.parentNode && this.parentNode.nodeType === 1 ? this.parentNode : null; }
  get children() { return this.childNodes.filter(node => node.nodeType === 1); }
  get firstChild() { return this.childNodes[0] || null; }
  get lastChild() { return this.childNodes.at(-1) || null; }
  get firstElementChild() { return this.children[0] || null; }
  get lastElementChild() { return this.children.at(-1) || null; }
  get nextSibling() { return this.parentNode ? this.parentNode.childNodes[this.parentNode.childNodes.indexOf(this) + 1] || null : null; }
  get nextElementSibling() { let node = this.nextSibling; while (node && node.nodeType !== 1) node = node.nextSibling; return node; }
  get attributes() { return [...this._attributes].map(([name, value]) => ({ name, value })); }
  get id() { return this.getAttribute('id') || ''; }
  set id(value) { this.setAttribute('id', value); }
  get className() { return this.getAttribute('class') || ''; }
  set className(value) { this.setAttribute('class', value); }
  get lang() { return this.getAttribute('lang') || ''; }
  set lang(value) { this.setAttribute('lang', value); }
  get dir() { return this.getAttribute('dir') || ''; }
  set dir(value) { this.setAttribute('dir', value); }
  get title() { return this.getAttribute('title') || ''; }
  set title(value) { this.setAttribute('title', value); }
  get hidden() { return this.hasAttribute('hidden'); }
  set hidden(value) { if (value) this.setAttribute('hidden', ''); else this.removeAttribute('hidden'); }
  get value() { return this._value === undefined ? this.getAttribute('value') ?? (this.localName === 'textarea' ? this.textContent : '') : this._value; }
  set value(value) { this._value = String(value); }
  get checked() { return this._checked === undefined ? this.hasAttribute('checked') : this._checked; }
  set checked(value) { this._checked = Boolean(value); }
  get textContent() {
    if (this.nodeType === 3 || this.nodeType === 8) return this.data;
    return this.childNodes.filter(node => node.nodeType !== 8).map(node => node.textContent).join('');
  }
  set textContent(value) {
    const text = value == null ? '' : String(value);
    this.ownerDocument.beforeText(this, text);
    if (this.nodeType === 3 || this.nodeType === 8) this._data = text;
    else this._replace(text === '' ? [] : [new DomNode(this.ownerDocument, 3, '', text)]);
    this.ownerDocument.record('textContent', this);
  }
  setAttribute(name, value) {
    this._attributes.set(String(name).toLowerCase(), String(value));
    this.ownerDocument.record('setAttribute', this);
  }
  getAttribute(name) { return this._attributes.get(String(name).toLowerCase()) ?? null; }
  hasAttribute(name) { return this._attributes.has(String(name).toLowerCase()); }
  removeAttribute(name) { this._attributes.delete(String(name).toLowerCase()); this.ownerDocument.record('removeAttribute', this); }
  contains(node) { return this === node || this.childNodes.some(child => child.contains(node)); }
  _detach() {
    if (this.parentNode) this.parentNode.childNodes.splice(this.parentNode.childNodes.indexOf(this), 1);
    this.parentNode = null;
  }
  _insert(node, index) {
    assert.ok(node instanceof DomNode, 'DOM APIs accept nodes, not synthetic DTO objects');
    assert.ok(node !== this && !node.contains(this), 'Reject a hierarchy cycle');
    if (node.nodeType === 11) {
      for (const child of [...node.childNodes]) this._insert(child, index++);
    } else {
      if (node.parentNode === this && this.childNodes.indexOf(node) < index) index--;
      node._detach();
      node.parentNode = this;
      this.childNodes.splice(index, 0, node);
    }
  }
  appendChild(node) { this._insert(node, this.childNodes.length); this.ownerDocument.record('appendChild', this); return node; }
  insertBefore(node, reference) {
    assert.ok(reference === null || reference.parentNode === this, 'Insertion anchor must belong to the current parent');
    this._insert(node, reference === null ? this.childNodes.length : this.childNodes.indexOf(reference));
    this.ownerDocument.record('insertBefore', this);
    return node;
  }
  append(...nodes) {
    for (const node of nodes) this._insert(typeof node === 'string' ? this.ownerDocument.createTextNode(node) : node, this.childNodes.length);
    this.ownerDocument.record('append', this);
  }
  removeChild(node) { assert.equal(node.parentNode, this); node._detach(); this.ownerDocument.record('removeChild', this); return node; }
  remove() { const parent = this.parentNode; this._detach(); this.ownerDocument.record('remove', parent || this); }
  _replace(nodes) {
    for (const node of this.childNodes) node.parentNode = null;
    this.childNodes = [];
    for (const node of nodes) this._insert(node, this.childNodes.length);
  }
  replaceChildren(...values) {
    const nodes = values.map(value => typeof value === 'string' ? this.ownerDocument.createTextNode(value) : value);
    const texts = nodes.flatMap(bodyTexts);
    const analyticalCommit = this.id === 'analyticsHost' && texts.length > 0;
    let fault = null;
    if (analyticalCommit) {
      this.ownerDocument.commits.push({ host: this, connected: this.isConnected,
        detached: nodes.every(node => !node.isConnected), texts: texts.slice() });
      fault = this.ownerDocument.commitFailure;
      this.ownerDocument.commitFailure = null;
      if (fault === 'before') { this.ownerDocument.commitFaultHits++; throw new Error('S5_PRIVATE_COMMIT_BEFORE'); }
    }
    this._replace(nodes);
    this.ownerDocument.record('replaceChildren', this);
    if (fault === 'after') {
      this.ownerDocument.commitFaultHits++;
      throw new Error('S5_PRIVATE_COMMIT_AFTER');
    }
  }
  get innerHTML() { return this.childNodes.map(serialize).join(''); }
  set innerHTML(html) {
    // Only the actual legacy root uses parsing. Reject ANY analytical parsing,
    // while retaining a violation record even if production catches the error.
    if (this.id !== 'app') return this.ownerDocument.unsafe('innerHTML', this);
    this._replace(parseHTML(this.ownerDocument, String(html)).childNodes.slice());
    this.ownerDocument.record('legacy innerHTML', this);
  }
  get outerHTML() { return serialize(this); }
  set outerHTML(_) { this.ownerDocument.unsafe('outerHTML', this); }
  insertAdjacentHTML() { this.ownerDocument.unsafe('insertAdjacentHTML', this); }
  matches(selector) { return selectorMatches(this, selector, this); }
  closest(selector) { for (let node = this; node && node.nodeType === 1; node = node.parentElement) if (selectorMatches(node, selector, node)) return node; return null; }
  querySelectorAll(selector) {
    return elements(this).filter(node => node !== this && selectorMatches(node, selector, this));
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  addEventListener(type, callback, options = {}) {
    const entries = this._listeners.get(type) || [];
    entries.push({ callback, signal: options.signal });
    this._listeners.set(type, entries);
  }
  removeEventListener(type, callback) {
    this._listeners.set(type, (this._listeners.get(type) || []).filter(entry => entry.callback !== callback));
  }
  dispatchEvent(event) {
    event.target = event.target || this;
    event.currentTarget = this;
    event.preventDefault ||= () => {};
    for (const entry of this._listeners.get(event.type) || []) if (!entry.signal?.aborted) entry.callback(event);
    return true;
  }
  click() { this.dispatchEvent({ type: 'click' }); }
  focus() { this.ownerDocument.activeElement = this; }
  scrollIntoView() {}
}
Object.assign(DomNode, { ELEMENT_NODE: 1, TEXT_NODE: 3, COMMENT_NODE: 8, DOCUMENT_NODE: 9, DOCUMENT_FRAGMENT_NODE: 11 });

function parseHTML(document, html) {
  const fragment = new DomNode(document, 11);
  const stack = [fragment];
  const voidTags = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
  for (const token of html.match(/<!--[\s\S]*?-->|<\/?[A-Za-z][^>]*>|[^<]+|</g) || []) {
    if (token.startsWith('<!--')) {
      stack.at(-1)._insert(new DomNode(document, 8, '', token.slice(4, -3)), stack.at(-1).childNodes.length);
    } else if (token.startsWith('</')) {
      const name = token.match(/^<\/([A-Za-z][A-Za-z0-9-]*)/)[1].toLowerCase();
      const index = stack.findLastIndex(node => node.localName === name);
      assert.ok(index > 0, 'Legacy HTML has a matching open element for ' + name);
      stack.length = index;
    } else if (token.startsWith('<') && token !== '<') {
      const match = token.match(/^<([A-Za-z][A-Za-z0-9-]*)([\s\S]*?)\/?>$/);
      assert.ok(match, 'Parse the actual legacy template token');
      const node = new DomNode(document, 1, match[1]);
      const attributes = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
      for (const attribute of match[2].matchAll(attributes))
        node._attributes.set(attribute[1].toLowerCase(), decode(attribute[2] ?? attribute[3] ?? attribute[4] ?? ''));
      stack.at(-1)._insert(node, stack.at(-1).childNodes.length);
      if (!voidTags.has(node.localName) && !token.endsWith('/>')) stack.push(node);
    } else {
      stack.at(-1)._insert(new DomNode(document, 3, '', decode(token)), stack.at(-1).childNodes.length);
    }
  }
  assert.equal(stack.length, 1, 'Actual legacy shell/template tags are balanced');
  return fragment;
}
function serialize(node) {
  if (node.nodeType === 3) return node.data.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  if (node.nodeType === 8) return '<!--' + node.data + '-->';
  if (node.nodeType !== 1) return node.childNodes.map(serialize).join('');
  const attrs = node.attributes.map(attr => ' ' + attr.name + '="' + attr.value.replace(/[&"]/g, c => c === '&' ? '&amp;' : '&quot;') + '"').join('');
  return '<' + node.localName + attrs + '>' + node.childNodes.map(serialize).join('') + '</' + node.localName + '>';
}

// Closed CSS subset used by production: tag/ID/class/attribute, descendant and
// direct-child combinators, :scope and child-position predicates. Unsupported
// selectors THROW rather than quietly returning a permissive fake match.
function selectorParts(selector) {
  const parts = [];
  let buffer = '', bracket = 0, quote = '', relation = null;
  const flush = () => { if (buffer) { parts.push({ token: buffer, relation }); buffer = ''; relation = ' '; } };
  for (const char of selector.trim()) {
    if (quote) { buffer += char; if (char === quote) quote = ''; continue; }
    if (bracket && (char === '"' || char === "'")) { quote = char; buffer += char; continue; }
    if (char === '[') bracket++;
    if (char === ']') bracket--;
    if (!bracket && char === '>') { flush(); relation = '>'; }
    else if (!bracket && /\s/.test(char)) flush();
    else buffer += char;
  }
  flush();
  assert.ok(parts.length && bracket === 0 && quote === '', 'Supported balanced selector: ' + selector);
  return parts;
}
function compoundMatches(node, token, scope) {
  let remaining = token;
  const tag = remaining.match(/^(\*|[A-Za-z][A-Za-z0-9-]*)/);
  if (tag) {
    remaining = remaining.slice(tag[0].length);
    if (tag[0] !== '*' && node.localName !== tag[0].toLowerCase()) return false;
  }
  while (remaining) {
    let match;
    if ((match = remaining.match(/^#([A-Za-z0-9_-]+)/))) {
      if (node.id !== match[1]) return false;
    } else if ((match = remaining.match(/^\.([A-Za-z0-9_-]+)/))) {
      if (!node.classList.contains(match[1])) return false;
    } else if ((match = remaining.match(/^\[([A-Za-z0-9_-]+)(?:=(?:"([^"]*)"|'([^']*)'|([^\]]+)))?\]/))) {
      if (!node.hasAttribute(match[1])) return false;
      const value = match[2] ?? match[3] ?? match[4];
      if (value !== undefined && node.getAttribute(match[1]) !== value) return false;
    } else if ((match = remaining.match(/^:(scope|first-child|last-child|nth-child\((\d+)\))/))) {
      if (match[1] === 'scope' && node !== scope) return false;
      if (match[1] === 'first-child' && node.parentElement?.firstElementChild !== node) return false;
      if (match[1] === 'last-child' && node.parentElement?.lastElementChild !== node) return false;
      if (match[2] && node.parentElement?.children[Number(match[2]) - 1] !== node) return false;
    } else throw new Error('S5_PRIVATE_UNSUPPORTED_SELECTOR: ' + token);
    remaining = remaining.slice(match[0].length);
  }
  return node.nodeType === 1;
}
function selectorMatches(node, selector, scope) {
  return selector.split(',').some(branch => {
    const parts = selectorParts(branch);
    function at(candidate, index) {
      if (!candidate || candidate.nodeType !== 1 || !compoundMatches(candidate, parts[index].token, scope)) return false;
      if (index === 0) return true;
      if (parts[index].relation === '>') return at(candidate.parentElement, index - 1);
      for (let parent = candidate.parentElement; parent; parent = parent.parentElement) if (at(parent, index - 1)) return true;
      return false;
    }
    return at(node, parts.length - 1);
  });
}

class DomDocument extends DomNode {
  constructor() {
    super(null, 9);
    this.ownerDocument = this;
    this.nodeName = '#document';
    this.events = [];
    this.commits = [];
    this.textWrites = [];
    this.unsafeSinks = [];
    this.expectedTexts = [];
    this.constructionFailureText = null;
    this.constructionFaultHits = 0;
    this.commitFailure = null;
    this.commitFaultHits = 0;
    this.documentElement = new DomNode(this, 1, 'html');
    this.head = new DomNode(this, 1, 'head');
    this.body = new DomNode(this, 1, 'body');
    this._insert(this.documentElement, 0);
    this.documentElement._insert(this.head, 0);
    this.documentElement._insert(this.body, 1);
    const title = new DomNode(this, 1, 'title');
    title._insert(new DomNode(this, 3, '', 'PHEISIRAETHA'), 0);
    this.head._insert(title, 0);
    this.app = new DomNode(this, 1, 'div');
    this.app._attributes.set('id', 'app');
    this.body._insert(this.app, 0);
    this.activeElement = this.body;
  }
  createElement(name) { return new DomNode(this, 1, name); }
  createDocumentFragment() { return new DomNode(this, 11); }
  createTextNode(value) { const node = new DomNode(this, 3, '', String(value)); this.beforeText(node, node.data); return node; }
  createComment(value) { const node = new DomNode(this, 8, '', String(value)); this.record('createComment', node); return node; }
  getElementById(id) { return elements(this).find(node => node.id === id) || null; }
  get title() { return this.head.querySelector('title')?.textContent || ''; }
  set title(value) {
    let node = this.head.querySelector('title');
    if (!node) { node = this.createElement('title'); this.head.appendChild(node); }
    node.textContent = value;
  }
  beforeText(node, text) {
    if (this.expectedTexts.includes(text)) this.textWrites.push({ node, text, connected: node.isConnected });
    if (this.constructionFailureText !== null && text === this.constructionFailureText) {
      this.constructionFailureText = null;
      this.constructionFaultHits++;
      throw new Error('S5_PRIVATE_CONSTRUCTION_FAILURE');
    }
  }
  record(kind, target) {
    if (!this.events) return;
    const host = this.getElementById('analyticsHost');
    this.events.push({ kind, target, host, texts: host ? bodyTexts(host) : [],
      attributes: elements(this).flatMap(node => node.attributes.map(attribute => ({ ...attribute }))),
      comments: walk(this).filter(node => node.nodeType === 8).map(node => node.data),
      surfaces: walk(this).flatMap(node => [node.nodeType === 3 || node.nodeType === 8 ? node.data : '',
        ...node.attributes.flatMap(attribute => [attribute.name, attribute.value])]),
      outside: walk(this).filter(node => node.nodeType === 3 && this.expectedTexts.includes(node.data) &&
        (!host || !host.contains(node))).map(node => node.data) });
  }
  unsafe(kind, node) {
    this.unsafeSinks.push({ kind, node });
    throw new Error('S5_PRIVATE_UNSAFE_PARSE_SINK: ' + kind);
  }
  clearObservations() { this.events = []; this.commits = []; this.textWrites = []; }
}

function appHarness(options = {}) {
  const state = options.state || sourceState();
  const document = new DomDocument();
  const stored = new Map([[STORAGE_KEY, JSON.stringify(state)],
    [LANGUAGE_KEY, options.locale || 'en'], [ONBOARDING_KEY, '1']]);
  const calls = [], logs = [], alerts = [], timers = [];
  let facadeLookups = 0;
  const sandbox = {
    document, Node: DomNode, Element: DomNode, HTMLElement: DomNode,
    AbortController, navigator: { language: 'en', languages: ['en'] },
    location: { protocol: 'file:' },
    localStorage: {
      getItem: key => stored.get(key) ?? null,
      setItem: (key, value) => stored.set(key, String(value)),
      removeItem: key => stored.delete(key)
    },
    crypto: { randomUUID: () => 's5-unused-synthetic-uuid' },
    confirm: () => true,
    alert: message => alerts.push(String(message)),
    setTimeout: callback => { timers.push(callback); return timers.length; },
    clearTimeout: () => {},
    console: Object.fromEntries(['debug', 'log', 'info', 'warn', 'error'].map(name => [name, (...args) => logs.push([name, ...args])]))
  };
  sandbox.window = sandbox;
  sandbox[LOOKUP] = () => { facadeLookups++; };
  sandbox[REWRITE] = dto => {
    if (!options.literalText) return null;
    assert.equal(dto.mode, 'APPROVED_BUNDLE', 'Literal-text fault requires a real complete approved output');
    return dto.components.map((component, index) => options.literalText(component.text, index));
  };
  sandbox[REPORT] = (input, canonical, dto) => {
    assert.equal(input, sandbox[PRIVATE_API]?.readState(),
      'The actual app, rather than a fixture-to-DOM shortcut, invokes the facade with its state');
    calls.push({ input: copy(input), canonical: copy(canonical), dto: copy(dto) });
    document.expectedTexts = dto.components.map(component => component.text);
  };
  const context = vm.createContext(sandbox, { codeGeneration: { strings: false, wasm: false } });
  const run = source => vm.runInContext(source, context, { timeout: 10000 });
  run(LOCALES_SOURCE);
  if (options.facade === 'forbidden') {
    Object.defineProperty(sandbox, GLOBAL, {
      configurable: false, enumerable: true,
      get() { facadeLookups++; throw new Error('S5_PRIVATE_OFF_FACADE_LOOKUP'); }
    });
  } else if (options.facade !== 'absent') {
    run(instrumentArtifact());
  }
  // Observe descriptor lookup too: a getter trap alone cannot catch S1's
  // descriptor-safe namespace inspection. Forward descriptors unchanged.
  run('(() => {\n' +
    '  const objectGet = Object.getOwnPropertyDescriptor;\n' +
    '  const reflectGet = Reflect.getOwnPropertyDescriptor;\n' +
    '  Object.getOwnPropertyDescriptor = function(target, key) {\n' +
    '    if (key === "' + GLOBAL + '") globalThis.' + LOOKUP + '();\n' +
    '    return objectGet(target, key);\n' +
    '  };\n' +
    '  Reflect.getOwnPropertyDescriptor = function(target, key) {\n' +
    '    if (key === "' + GLOBAL + '") globalThis.' + LOOKUP + '();\n' +
    '    return reflectGet(target, key);\n' +
    '  };\n' +
    '})();');
  run(instrumentApp(options.enabled !== false));
  const api = sandbox[PRIVATE_API];
  assert.ok(api && typeof api.rerender === 'function', 'Private observation must execute the actual app IIFE');
  assert.equal(document.querySelectorAll('#app').length, 1);
  return {
    context, document, calls, logs, alerts, timers, stored, api,
    get facadeLookups() { return facadeLookups; },
    get dto() { return calls.at(-1)?.dto; },
    host: () => document.getElementById('analyticsHost'),
    rerender: () => api.rerender(),
    language: code => api.language(code),
    click(selector) {
      const node = document.querySelector(selector);
      assert.ok(node, 'Find an actual production-bound control: ' + selector);
      assert.ok((node._listeners.get('click') || []).length > 0, 'Actual production click callback is bound');
      node.click();
    }
  };
}

function analyticalRoot(host) {
  // Language isolation may live on the host itself or on the one detached
  // subtree root committed into it; do not prescribe that structural choice.
  const root = host.lang === 'en' && host.dir === 'ltr' ? host : host.firstElementChild;
  assert.ok(root, 'Mounted analytics has an explicit root');
  if (root !== host) assert.equal(host.children.length, 1, 'One complete analytical subtree root');
  assert.equal(root.lang, 'en');
  assert.equal(root.dir, 'ltr');
  return root;
}
function requireMounted(app, expectedMode = 'APPROVED_BUNDLE') {
  const host = app.host();
  assert.ok(host, 'Enabled eligible Home must actually mount analytics');
  assert.equal(app.dto.mode, expectedMode);
  assert.equal(host.isConnected, true);
  assert.equal(host.parentElement, app.document.querySelector('#app > .shell > main'));
  assert.equal(app.document.querySelectorAll('#analyticsHost').length, 1);
  analyticalRoot(host);
  assert.deepEqual(bodyTexts(host), app.dto.components.map(component => component.text),
    'All and only the DTO bodies, in manifest order; no headings or semantic additions');
  assert.ok(host.nextElementSibling?.classList.contains('notice'));
  assert.ok(host.nextElementSibling?.classList.contains('smalltext'));
  assert.equal(host.nextElementSibling, host.parentElement.lastElementChild);
  const lang = app.document.documentElement.lang;
  const notice = app.context.PHEISIRAETHA_LOCALES[Object.keys(app.context.PHEISIRAETHA_LOCALES)
    .find(code => app.context.PHEISIRAETHA_LOCALES[code].htmlLang === lang)].translations.recommended;
  assert.equal(host.nextElementSibling.textContent.trim(), notice,
    'Exact live Home recommended notice is the insertion anchor');
  assert.deepEqual(app.document.unsafeSinks, [], 'No caught analytical HTML-parsing attempt');
  return host;
}
function requireAbsent(app) {
  assert.equal(app.host(), null, 'Ineligible views/OFF have no analytical host, including empty or hidden hosts');
  for (const text of app.document.expectedTexts)
    assert.equal(walk(app.document).some(node => node.nodeType === 3 && node.data === text), false,
      'No approved body survives elsewhere after host removal');
}
function assertNoRawLeak(app) {
  const surfaces = [];
  for (const node of walk(app.document)) {
    if (node.nodeType === 3 || node.nodeType === 8) surfaces.push(node.data);
    for (const attribute of node.attributes) surfaces.push(attribute.name, attribute.value);
  }
  surfaces.push(...app.document.events.flatMap(event => event.surfaces));
  surfaces.push(JSON.stringify(app.logs), ...app.alerts);
  for (const marker of Object.values(RAW))
    assert.equal(surfaces.some(value => value.includes(marker)), false, 'No nonpublic raw source/engine/debug sentinel: ' + marker);
}
function attributeHistory(app) {
  return [...elements(app.document).flatMap(node => node.attributes),
    ...app.document.events.flatMap(event => event.attributes)];
}
function assertAtomic(app) {
  const expected = app.dto.components.map(component => component.text);
  assert.ok(expected.length > 0);
  assert.equal(app.document.commits.length, 1, 'One actual replaceChildren commit for the complete transaction');
  const commit = app.document.commits[0];
  assert.equal(commit.host, app.host());
  assert.equal(commit.connected, true);
  assert.equal(commit.detached, true, 'All committed nodes were detached before the host operation');
  assert.deepEqual(commit.texts, expected, 'Every required component is complete before commit');
  assert.equal(app.document.textWrites.length, expected.length, 'Each required body uses one inert text construction');
  assert.ok(app.document.textWrites.every(write => !write.connected), 'No approved body is authored in the live tree');
  for (const event of app.document.events) {
    assert.deepEqual(event.outside, [], 'Analytical text never mounts outside its private host');
    assert.ok(event.texts.length === 0 || JSON.stringify(event.texts) === JSON.stringify(expected),
      'No live partial presentation during ' + event.kind);
    if (event.texts.length) assert.equal(event.kind, 'replaceChildren', 'Only the atomic operation introduces bodies');
  }
}

test('host only on enabled Home with intent; actual navigation excludes History/Data/RIS/Wizard/Onboarding', () => {
  const app = appHarness();
  requireMounted(app);
  assert.equal(app.calls.length, 1);
  for (const selector of ['[data-nav="history"]', '[data-nav="data"]']) {
    const calls = app.calls.length;
    app.click(selector);
    requireAbsent(app);
    assert.equal(app.calls.length, calls);
  }
  app.click('[data-nav="home"]');
  requireMounted(app);
  for (const [open, close] of [['#editGoal', '#risCancel'], ['#startCheckin', '#wizCancel']]) {
    const calls = app.calls.length;
    app.click(open);
    requireAbsent(app);
    assert.equal(app.calls.length, calls);
    app.click(close);
    requireMounted(app);
    assert.equal(app.calls.length, calls + 1);
  }
  const calls = app.calls.length;
  app.api.onboarding();
  requireAbsent(app);
  assert.equal(app.calls.length, calls);
  assertNoRawLeak(app);
});

test('intent=null has no host/evaluate; non-null intent with empty cycles mounts actual Safety fallback', () => {
  const empty = appHarness({ state: { version: '0.1.0', lang: 'en', intent: null } });
  requireAbsent(empty);
  assert.equal(empty.calls.length, 0);
  const state = fixtures.fixture(0, LABELS);
  const expected = oracle(state);
  assert.equal(expected.mode, 'FALLBACK_ONLY');
  assert.equal(expected.components.length, 1);
  const app = appHarness({ state });
  requireMounted(app, 'FALLBACK_ONLY');
  assert.deepEqual(app.dto, expected, 'Fallback is actual frozen Safety/formatter output');
  assert.equal(app.calls.length, 1);
  assertAtomic(app);
});

for (const facade of ['present', 'absent', 'forbidden']) test('OFF has no host or facade access: ' + facade, () => {
  const app = appHarness({ enabled: false, facade });
  requireAbsent(app);
  assert.equal(app.calls.length, 0);
  assert.equal(app.facadeLookups, 0, 'Static OFF guard precedes even namespace property access');
  assert.equal(app.document.commits.length, 0);
  assert.equal(app.document.querySelector('#app main h1').textContent, app.api.readState().intent.ris.primary);
  assertNoRawLeak(app);
});

for (const locale of ['en', 'ar', 'he']) test('analytics root en/ltr isolated from actual ' + locale + ' shell', () => {
  const state = sourceState(), expected = oracle(state);
  assert.equal(expected.mode, 'APPROVED_BUNDLE');
  const app = appHarness({ state, locale });
  const host = requireMounted(app);
  const root = analyticalRoot(host);
  const localeData = app.context.PHEISIRAETHA_LOCALES[locale];
  assert.equal(app.document.documentElement.lang, localeData.htmlLang);
  assert.equal(app.document.documentElement.dir, localeData.dir);
  assert.equal(root.lang, 'en');
  assert.equal(root.dir, 'ltr');
  assert.deepEqual(bodyTexts(host), expected.components.map(component => component.text));
  assertNoRawLeak(app);
});

test('canonical bodies and structure stay unchanged across all 31 actual locale rerenders', () => {
  const state = sourceState(), expected = oracle(state), before = copy(state);
  const app = appHarness({ state });
  const codes = Object.keys(app.context.PHEISIRAETHA_LOCALES);
  assert.equal(codes.length, 31, 'Exercise the complete existing language shell, including ar/he');
  for (const code of codes) {
    const previous = app.host(), calls = app.calls.length;
    app.language(code);
    const host = requireMounted(app);
    assert.notEqual(host, previous, 'Locale render creates a fresh host object');
    assert.equal(previous.isConnected, false);
    assert.equal(app.calls.length, calls + 1);
    assert.deepEqual(app.dto, expected, 'No translated enum/body or locale number formatting for ' + code);
    assert.equal(app.document.documentElement.dir, app.context.PHEISIRAETHA_LOCALES[code].dir);
    assertNoRawLeak(app);
  }
  assert.deepEqual(copy(app.api.readState()), before, 'Locale UI rerenders do not rewrite committed data');
});

test('no analytical title or tooltip prose anywhere in the document', () => {
  const app = appHarness();
  const host = requireMounted(app);
  assert.ok(app.dto.components.length > 0);
  assert.equal(app.document.title, 'PHEISIRAETHA', 'Analytics does not rewrite the document title');
  assert.equal(elements(host).some(node => node.hasAttribute('title')), false);
  for (const attribute of attributeHistory(app))
    if (attribute.name === 'title' || /tooltip/.test(attribute.name))
      for (const component of app.dto.components) assert.equal(attribute.value.includes(component.text), false);
  assertNoRawLeak(app);
});

test('no analytical ARIA prose or accessibility duplicates', () => {
  const app = appHarness();
  const host = requireMounted(app);
  for (const node of elements(host))
    assert.deepEqual(node.attributes.filter(attribute => attribute.name.startsWith('aria-')), [],
      'Minimal analytical subtree adds no independent accessibility prose');
  for (const attribute of attributeHistory(app))
    if (attribute.name.startsWith('aria-'))
      for (const component of app.dto.components) assert.equal(attribute.value.includes(component.text), false);
  assertNoRawLeak(app);
});

test('no hidden, inert, visually hidden or SR-only analytical copy', () => {
  const app = appHarness();
  const host = requireMounted(app);
  for (const node of elements(host)) {
    assert.equal(node.hasAttribute('hidden') || node.hasAttribute('inert') || node.getAttribute('aria-hidden') === 'true', false);
    assert.equal(/(?:^|\s)(?:hidden|sr-only|sr_only|srOnly|visually-hidden|visuallyHidden|screen-reader-only)(?:\s|$)/i.test(node.className), false);
    const style = node.getAttribute('style') || '';
    assert.equal(/display\s*:\s*none|visibility\s*:\s*hidden|clip(?:-path)?\s*:|opacity\s*:\s*0(?:[;\s]|$)/i.test(style), false);
  }
  const outside = walk(app.document).filter(node => node.nodeType === 3 && !host.contains(node));
  for (const component of app.dto.components)
    assert.equal(outside.some(node => node.data.includes(component.text)), false, 'No body copy in a separate hidden/SR node');
  assertNoRawLeak(app);
});

test('no analytical data-* payload on the host, descendants or other legacy surfaces', () => {
  const app = appHarness();
  const host = requireMounted(app);
  for (const node of elements(host))
    assert.deepEqual(node.attributes.filter(attribute => attribute.name.startsWith('data-')), []);
  for (const attribute of attributeHistory(app))
    if (attribute.name.startsWith('data-'))
      for (const component of app.dto.components) assert.equal(attribute.value.includes(component.text), false);
  assertNoRawLeak(app);
});

test('no analytical comments or debug output', () => {
  const app = appHarness();
  const host = requireMounted(app);
  assert.deepEqual(walk(host).filter(node => node.nodeType === 8), []);
  const comments = [...walk(app.document).filter(node => node.nodeType === 8).map(node => node.data),
    ...app.document.events.flatMap(event => event.comments)];
  for (const comment of comments)
    for (const component of app.dto.components) assert.equal(comment.includes(component.text), false);
  assert.deepEqual(app.logs, [], 'No host logging of DTOs, source, engine, plan or internal reasons');
  assertNoRawLeak(app);
});

test('nonpublic Interpretation/Next Focus/whyThisFocus never reach any DOM surface', () => {
  const state = sourceState(), expected = oracle(state);
  assert.equal(expected.mode, 'APPROVED_BUNDLE');
  const app = appHarness({ state });
  requireMounted(app);
  assert.deepEqual(app.dto, expected);
  assert.ok(Object.values(RAW).every(marker => JSON.stringify(app.calls[0].input).includes(marker)),
    'All forbidden sentinels really reach the committed-state pipeline');
  assertNoRawLeak(app);
  assert.equal(bodyTexts(app.host()).length, expected.components.length, 'Only complete registered factual/Why components');
  // Do not ban the words "interpretation"/"next focus" inside the exact allowed
  // capability/fallback body. Banned surfaces are tested by identity/sentinels.
});

test('HTML-like approved text stays literal text, with no parsed elements/comments/attributes', () => {
  // Test-only formatter-output fault, not a claim that the frozen catalog emits
  // arbitrary HTML. Real frozen evaluation still supplies the complete identity.
  const literal = '<img id="s5-injected" src=x onerror="S5_XSS()"><script>S5_XSS()</script>' +
    '</p><!--S5_INJECTED_COMMENT--><span title="S5_TOOLTIP" data-secret="S5_SECRET">&amp;</span>';
  const app = appHarness({ literalText: (text, index) => 'S5_LITERAL_' + index + ' ' + literal + '\n' + text });
  const host = requireMounted(app);
  assert.equal(app.calls[0].canonical.mode, 'APPROVED_BUNDLE');
  assert.equal(app.dto.components.length, app.calls[0].canonical.components.length);
  assert.ok(bodyTexts(host).every(text => text.includes(literal)), 'Assert mounting succeeded, not suppression of the fixture');
  assert.equal(app.document.getElementById('s5-injected'), null);
  assert.equal(elements(host).some(node => ['img', 'script', 'iframe', 'svg'].includes(node.localName)), false);
  assert.equal(walk(host).some(node => node.nodeType === 8), false);
  for (const node of elements(host)) for (const attribute of node.attributes)
    assert.equal(/S5_XSS|S5_TOOLTIP|S5_SECRET|S5_INJECTED_COMMENT/.test(attribute.value), false);
  assert.deepEqual(app.document.unsafeSinks, []);
});

for (const kind of ['MF3', 'MF4']) test('complete ' + kind + ' is constructed detached and committed once', () => {
  const state = sourceState(kind), expected = oracle(state);
  assert.equal(expected.mode, 'APPROVED_BUNDLE');
  assert.equal(expected.components.length, kind === 'MF3' ? 5 : 9);
  const app = appHarness({ state });
  requireMounted(app);
  assert.deepEqual(app.dto, expected);
  assertAtomic(app);
});

test('construction failure after earlier detached components leaves no partial or previous analytical DOM', () => {
  const app = appHarness();
  const previous = requireMounted(app);
  const expected = app.dto.components.map(component => component.text);
  assert.ok(expected.length > 1);
  app.document.clearObservations();
  // Final MF4 component uses limitations copy, shared with the primary. Select
  // the first unique later body instead so earlier components really construct.
  const failing = expected.find((text, index) => index > 0 && expected.indexOf(text) === index);
  assert.ok(failing);
  app.document.constructionFailureText = failing;
  const calls = app.calls.length;
  app.rerender();
  assert.equal(app.calls.length, calls + 1);
  assert.equal(app.document.constructionFaultHits, 1, 'Real inert text construction reached the injected failure');
  assert.equal(previous.isConnected, false, 'Old ALLOW was removed before the new transaction');
  assert.equal(app.document.commits.length, 0);
  assert.ok(app.document.textWrites.some(write => write.text === expected[0]), 'An earlier required component was really attempted');
  assert.ok(app.document.textWrites.every(write => !write.connected));
  assert.ok(app.document.events.every(event => event.texts.length === 0 && event.outside.length === 0),
    'No detached partial component becomes live, even transiently');
  assert.deepEqual(bodyTexts(app.document).filter(text => expected.includes(text)), []);
  assert.equal(app.document.querySelector('#app main h1').textContent, app.api.readState().intent.ris.primary);
  assert.deepEqual(app.document.unsafeSinks, []);
  assertNoRawLeak(app);
});

for (const point of ['before', 'after']) test('replaceChildren commit exception cleanup: ' + point + ' native effect', () => {
  const app = appHarness();
  const previous = requireMounted(app);
  const expected = app.dto.components.map(component => component.text);
  app.document.clearObservations();
  app.document.commitFailure = point;
  const calls = app.calls.length;
  app.rerender();
  assert.equal(app.calls.length, calls + 1);
  assert.equal(app.document.commitFaultHits, 1, 'Fault reaches the actual host replaceChildren operation');
  assert.equal(app.document.commits.length, 1);
  assert.equal(app.document.commits[0].detached, true);
  assert.deepEqual(app.document.commits[0].texts, expected);
  assert.equal(previous.isConnected, false);
  assert.deepEqual(bodyTexts(app.document).filter(text => expected.includes(text)), [],
    'Cleanup removes all analytical bodies even when replacement took effect before the injected throw');
  assert.ok(!app.host() || bodyTexts(app.host()).length === 0, 'No partial/stale replacement remains');
  assert.equal(app.document.querySelector('#app main h1').textContent, app.api.readState().intent.ris.primary);
  assert.deepEqual(app.document.unsafeSinks, []);
  assertNoRawLeak(app);
});

test('only fixed structural IDs/classes and en/ltr attributes accompany approved text', () => {
  const app = appHarness();
  const host = requireMounted(app);
  const ids = [];
  for (const node of elements(host)) {
    assert.ok(['div', 'section', 'article', 'p', 'span'].includes(node.localName), 'Inert fixed structure only');
    for (const attribute of node.attributes) {
      assert.ok(['id', 'class', 'lang', 'dir'].includes(attribute.name), 'No prose or raw-metadata attribute: ' + attribute.name);
      if (attribute.name === 'lang') assert.equal(attribute.value, 'en');
      if (attribute.name === 'dir') assert.equal(attribute.value, 'ltr');
      if (attribute.name === 'id') {
        assert.match(attribute.value, /^[A-Za-z_][A-Za-z0-9_.:-]*$/, 'ID is a structural token');
        ids.push(attribute.value);
      }
      if (attribute.name === 'class')
        for (const token of attribute.value.split(/\s+/).filter(Boolean))
          assert.match(token, /^[A-Za-z_][A-Za-z0-9_-]*$/, 'Classes are structural tokens');
      for (const component of app.dto.components) assert.equal(attribute.value.includes(component.text), false);
    }
    assert.equal(node.hidden, false);
    assert.equal(node.title, '');
  }
  assert.equal(new Set(ids).size, ids.length, 'Structural IDs are unique in the analytical subtree');
  assertNoRawLeak(app);
});
