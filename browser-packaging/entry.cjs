'use strict';

// Refuse every pre-existing authority without reading a getter or overwriting it.
if ('PHEISIRAETHA_ANALYTICS_V1' in globalThis) throw new Error('ANALYTICS_NAMESPACE_COLLISION');
const { evaluate } = require('./runtime-facade/runtime.cjs');
Object.defineProperty(globalThis, 'PHEISIRAETHA_ANALYTICS_V1', {
  value: Object.freeze({ evaluate }), enumerable: true, writable: false, configurable: false
});
