'use strict';

const { clonePlainData, RuntimeCoreFailure } = require('./plain-data.cjs');

// The sole input is already committed state. No field whitelist, defaults,
// loader, normalization, revision application, or external source is involved.
function buildAnalysisSourceSnapshot(committedState) {
  try {
    return clonePlainData(committedState, 'SOURCE_NOT_JSON_PLAIN_DATA');
  } catch {
    // Never attach source values, callback exceptions, or recovery data.
    throw new RuntimeCoreFailure('SOURCE_NOT_JSON_PLAIN_DATA');
  }
}

module.exports = { buildAnalysisSourceSnapshot };
