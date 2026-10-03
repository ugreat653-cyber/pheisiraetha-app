'use strict';

// Private representation checks, not a source schema or an object-path API.
class RuntimeCoreFailure extends Error {
  constructor(code) {
    super(code);
    this.name = 'RuntimeCoreFailure';
    this.code = code;
  }
}

function requireContract(ok, code) {
  if (!ok) throw new RuntimeCoreFailure(code);
}

const record = value => value !== null && typeof value === 'object' && !Array.isArray(value) &&
  [Object.prototype, null].includes(Object.getPrototypeOf(value));
const exactKeys = (value, keys) => record(value) && Reflect.ownKeys(value).length === keys.length &&
  keys.every(key => Object.hasOwn(value, key));

// Descriptor-only traversal: never call getters, toJSON, or caller callbacks.
// Dense arrays and enumerable string-keyed plain records have JSON membership.
// Repeated aliases are copied independently; only ancestor cycles are rejected.
// An explicit work stack also permits deeply nested data without a recursion cap.
function visitPlainData(value, code, copy) {
  let result;
  const ancestors = new Set();
  const work = [{ value, parent: null, key: null }];
  while (work.length) {
    const item = work.pop();
    if (item.exit) { ancestors.delete(item.exit); continue; }
    const current = item.value;
    let output = current;
    if (current !== null && typeof current === 'object') {
      const array = Array.isArray(current), prototype = Object.getPrototypeOf(current);
      requireContract((array ? prototype === Array.prototype : record(current)) && !ancestors.has(current), code);
      const descriptors = Object.getOwnPropertyDescriptors(current);
      const keys = Reflect.ownKeys(descriptors);
      requireContract(keys.every(key => typeof key === 'string'), code);
      const length = array ? descriptors.length.value : null;
      requireContract(!array || keys.length === length + 1, code);
      const children = [];
      for (const key of keys) {
        const descriptor = descriptors[key];
        requireContract(Object.hasOwn(descriptor, 'value'), code);
        if (array && key === 'length') continue;
        requireContract(descriptor.enumerable && (!array ||
          (/^(0|[1-9][0-9]*)$/.test(key) && Number(key) < length)), code);
        children.push({ key, value: descriptor.value });
      }
      output = copy ? (array ? new Array(length) : Object.create(prototype)) : null;
      ancestors.add(current);
      work.push({ exit: current });
      for (let i = children.length - 1; i >= 0; i--)
        work.push({ ...children[i], parent: output });
    } else {
      requireContract(current === null || ['string', 'boolean'].includes(typeof current) ||
        (typeof current === 'number' && Number.isFinite(current)), code);
    }
    if (copy) {
      if (item.key === null) result = output;
      else Object.defineProperty(item.parent, item.key,
        { value: output, enumerable: true, configurable: true, writable: true });
    }
  }
  return result;
}

function clonePlainData(value, code) { return visitPlainData(value, code, true); }
function assertPlainData(value, code) { visitPlainData(value, code, false); }

// Called only after descriptor validation. Equality is by data, including -0,
// exact own membership, and array order, never by property-path interpretation.
function equalData(left, right) {
  const work = [[left, right]];
  while (work.length) {
    const [a, b] = work.pop();
    if (Object.is(a, b)) continue;
    if (!a || !b || typeof a !== 'object' || typeof b !== 'object' || Array.isArray(a) !== Array.isArray(b)) return false;
    const keys = Object.keys(a);
    if (keys.length !== Object.keys(b).length) return false;
    for (const key of keys) {
      if (!Object.hasOwn(b, key)) return false;
      work.push([a[key], b[key]]);
    }
  }
  return true;
}

module.exports = { RuntimeCoreFailure, requireContract, record, exactKeys, clonePlainData, assertPlainData, equalData };
