/*
 * Isolated business-data foundation. Importing this module performs no I/O.
 * Nothing here reads/writes localStorage, calls analytics, or finishes an observation.
 */
export const DB_NAME = 'pheisiraetha_business_v2';
export const DB_VERSION = 1;
export const SCHEMA_VERSION = 2;
export const BACKUP_FORMAT = 'pheisiraetha-business-backup';
export const STORES = Object.freeze({
  meta: 'meta',
  intentions: 'intentions',
  drafts: 'drafts',
  legacySnapshots: 'legacySnapshots',
  operations: 'operations'
});

const STORE_NAMES = Object.freeze(Object.values(STORES));
const RIS_FIELDS = Object.freeze(['primary', 'success', 'scope', 'nonGoals', 'constraints', 'rationale']);
const has = (value, key) => Object.hasOwn(value, key);
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);

export class FoundationError extends Error {
  constructor(code, message = code) {
    super(message);
    this.name = 'FoundationError';
    this.code = code;
  }
}

function fail(code) { throw new FoundationError(code); }
function need(condition, code = 'INVALID_ARGUMENT') { if (!condition) fail(code); }

// Own data descriptors only. An own __proto__ is copied as data, never assigned.
// Aliases are copied independently; cycles, accessors and unsupported values fail
// closed. Numbers remain literal, including overflow from JSON.parse (1e400).
function plainClone(value, ancestors = new Set()) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number') return value;
  need(typeof value === 'object', 'NON_JSON_DATA');
  const array = Array.isArray(value);
  const prototype = Object.getPrototypeOf(value);
  need(array ? prototype === Array.prototype : prototype === Object.prototype || prototype === null, 'NON_JSON_DATA');
  need(!ancestors.has(value), 'NON_JSON_DATA');
  const descriptors = Object.getOwnPropertyDescriptors(value);
  const keys = Reflect.ownKeys(descriptors);
  need(keys.every(key => typeof key === 'string'), 'NON_JSON_DATA');
  ancestors.add(value);
  try {
    if (array) {
      const length = descriptors.length?.value;
      need(Number.isSafeInteger(length) && length >= 0 && keys.length === length + 1, 'NON_JSON_DATA');
      const result = [];
      for (let index = 0; index < length; index++) {
        const descriptor = descriptors[String(index)];
        need(descriptor && has(descriptor, 'value') && descriptor.enumerable, 'NON_JSON_DATA');
        result.push(plainClone(descriptor.value, ancestors));
      }
      return result;
    }
    const result = {};
    for (const key of keys) {
      const descriptor = descriptors[key];
      need(has(descriptor, 'value') && descriptor.enumerable, 'NON_JSON_DATA');
      Object.defineProperty(result, key, {
        value: plainClone(descriptor.value, ancestors), enumerable: true, writable: true, configurable: true
      });
    }
    return result;
  } finally {
    ancestors.delete(value);
  }
}

// This is a receipt identity, not JSON for interchange and not a lossy clone.
// Unquoted numeric tokens cannot collide with JSON-quoted strings or null.
// Object key order is immaterial; arrays, field presence and raw strings are not.
function canonical(value) {
  if (value === null) return 'null';
  if (typeof value === 'number') {
    if (Number.isNaN(value)) return 'NaN';
    if (value === Infinity) return 'Infinity';
    if (value === -Infinity) return '-Infinity';
    return Object.is(value, -0) ? '-0' : JSON.stringify(value);
  }
  if (typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  return '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + canonical(value[key])).join(',') + '}';
}

function textFields(value, fields) {
  return record(value) && fields.every(key => typeof value[key] === 'string');
}
function numberIn(value, min, max) { return Number.isFinite(value) && value >= min && value <= max; }
function timestamp(value) { return typeof value === 'string' && !Number.isNaN(Date.parse(value)); }

// Match the historical backup acceptance boundary. Do not add uniqueness,
// chronology, nonblank-ID, revision interpretation or analytical restrictions.
function validLegacyCycle(cycle) {
  if (!record(cycle) || typeof cycle.id !== 'string' || !timestamp(cycle.createdAt) ||
      !textFields(cycle.cie, RIS_FIELDS) || !record(cycle.iep) || !record(cycle.oop) ||
      !['yes', 'no', 'unsure'].includes(cycle.intentional) || !record(cycle.revision)) return false;
  const iep = cycle.iep, oop = cycle.oop;
  return ['desire', 'belief', 'emotionIntensity', 'mental', 'practical'].every(key => numberIn(iep[key], 0, 10)) &&
    typeof iep.emotion === 'string' && ['freq0', 'freq1', 'freq2', 'freq3', 'freq4', 'freq5'].includes(iep.frequency) &&
    typeof iep.actions === 'string' && numberIn(iep.hours, 0, 168) &&
    typeof oop.currentState === 'string' && numberIn(oop.achievement, 0, 10) && typeof oop.events === 'string' &&
    ['toward', 'none', 'away', 'mixed', 'unknown'].includes(oop.direction) && Array.isArray(oop.evidence) &&
    oop.evidence.every(value => ['direct', 'documented', 'otherPerson', 'subjective', 'insufficient', 'other'].includes(value)) &&
    typeof oop.external === 'string' &&
    Object.entries(cycle.revision).every(([key, value]) => RIS_FIELDS.includes(key) && typeof value === 'string');
}
function validLegacyEnvelope(value) {
  if (!record(value) || value.version !== '0.1.0' || !['ru', 'en'].includes(value.lang) || !has(value, 'intent')) return false;
  if (value.intent === null) return true;
  const intent = value.intent;
  return record(intent) && typeof intent.id === 'string' && timestamp(intent.createdAt) &&
    textFields(intent.ris, RIS_FIELDS) && Array.isArray(intent.cycles) && intent.cycles.every(validLegacyCycle);
}

export function classifyLegacy(rawState) {
  need(rawState === null || typeof rawState === 'string');
  if (rawState === null) return {classification: 'empty', sourceEnvelope: null};
  let parsed;
  try { parsed = JSON.parse(rawState); }
  catch { return {classification: 'invalid-json', sourceEnvelope: null}; }
  if (record(parsed) && has(parsed, 'version') && parsed.version !== '0.1.0')
    return {classification: 'unsupported-version', sourceEnvelope: null};
  try {
    const sourceEnvelope = plainClone(parsed);
    if (validLegacyEnvelope(sourceEnvelope)) return {classification: 'valid-v1', sourceEnvelope};
  } catch {
    // Preserve raw bytes through capture/observe; never repair a parsed value.
  }
  return {classification: 'invalid-v1', sourceEnvelope: null};
}

function storageError(error) {
  if (error instanceof FoundationError) return error;
  const code = {
    QuotaExceededError: 'STORAGE_QUOTA', AbortError: 'TRANSACTION_ABORTED',
    VersionError: 'UNSUPPORTED_DATABASE_VERSION', SecurityError: 'STORAGE_UNAVAILABLE',
    InvalidStateError: 'STORAGE_UNAVAILABLE', NotAllowedError: 'STORAGE_UNAVAILABLE'
  }[error?.name] || 'STORAGE_ERROR';
  return new FoundationError(code);
}

function cryptoApi() {
  const api = globalThis.crypto;
  need(api && typeof api.getRandomValues === 'function' && api.subtle && typeof api.subtle.digest === 'function', 'CRYPTO_UNAVAILABLE');
  return api;
}
function uuid() {
  const api = cryptoApi();
  if (typeof api.randomUUID === 'function') return api.randomUUID();
  const bytes = api.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = Array.from(bytes, value => value.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
async function digest(text) {
  const bytes = new TextEncoder().encode(text);
  return Array.from(new Uint8Array(await cryptoApi().subtle.digest('SHA-256', bytes)), value => value.toString(16).padStart(2, '0')).join('');
}
function nonblank(value) { return typeof value === 'string' && value.trim().length > 0; }
function revision(value, allowZero = false) { return Number.isSafeInteger(value) && value >= (allowZero ? 0 : 1); }
function commandArguments(input, allowed, required = allowed) {
  const args = plainClone(input);
  need(record(args) && Object.keys(args).every(key => allowed.includes(key)) && required.every(key => has(args, key)));
  need(nonblank(args.operationId));
  return args;
}
function requireSchema(value) {
  need(record(value), 'INVALID_STORED_RECORD');
  if (Number.isSafeInteger(value.schemaVersion) && value.schemaVersion > SCHEMA_VERSION) fail('UNSUPPORTED_SCHEMA');
  need(value.schemaVersion === SCHEMA_VERSION, 'INVALID_STORED_RECORD');
}
function requestValue(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new FoundationError('STORAGE_ERROR'));
  });
}

function validateWorkspace(workspace) {
  requireSchema(workspace);
  need(workspace.key === 'workspace' && nonblank(workspace.workspaceKey) && revision(workspace.revision, true) &&
    (workspace.selectedIntentKey === null || nonblank(workspace.selectedIntentKey)) &&
    (workspace.legacyBaselineSnapshotKey === null || nonblank(workspace.legacyBaselineSnapshotKey)) &&
    (workspace.latestObservedLegacySnapshotKey === null || nonblank(workspace.latestObservedLegacySnapshotKey)), 'INVALID_STORED_RECORD');
}

function validateRows(data) {
  need(data.meta.length === 1, 'INVALID_STORED_RECORD');
  const workspace = data.meta[0];
  validateWorkspace(workspace);
  for (const row of data.intentions) {
    requireSchema(row);
    need(nonblank(row.intentKey) && revision(row.revision) && timestamp(row.createdAt) && timestamp(row.updatedAt) &&
      revision(row.createdRevision) && (row.sourceSnapshotKey === null || nonblank(row.sourceSnapshotKey)) &&
      validLegacyEnvelope(row.sourceEnvelope) && row.sourceEnvelope.intent !== null, 'INVALID_STORED_RECORD');
  }
  for (const row of data.drafts) {
    requireSchema(row);
    need(nonblank(row.intentKey) && nonblank(row.draftId) && revision(row.revision) && revision(row.basedOnIntentRevision) &&
      ['first', 'progress'].includes(row.kind) && revision(row.step) && record(row.values) && timestamp(row.updatedAt), 'INVALID_STORED_RECORD');
  }
  for (const row of data.legacySnapshots) {
    requireSchema(row);
    need(nonblank(row.snapshotKey) && ['legacy-storage', 'legacy-import'].includes(row.source) &&
      (row.rawState === null || typeof row.rawState === 'string') && /^[a-f0-9]{64}$/.test(row.rawSha256) && timestamp(row.observedAt) &&
      ['empty', 'valid-v1', 'invalid-json', 'invalid-v1', 'unsupported-version'].includes(row.classification) &&
      (row.materializedIntentKey === null || nonblank(row.materializedIntentKey)) && typeof row.conflictWithBaseline === 'boolean', 'INVALID_STORED_RECORD');
  }
  for (const row of data.operations) {
    requireSchema(row);
    need(nonblank(row.operationId) && nonblank(row.command) && typeof row.requestCanonical === 'string' &&
      /^[a-f0-9]{64}$/.test(row.requestFingerprint) && record(row.result) && timestamp(row.completedAt), 'INVALID_STORED_RECORD');
  }
  const intentionKeys = new Set(data.intentions.map(row => row.intentKey));
  const snapshotKeys = new Set(data.legacySnapshots.map(row => row.snapshotKey));
  need(workspace.selectedIntentKey === null || intentionKeys.has(workspace.selectedIntentKey), 'INVALID_STORED_RECORD');
  need([workspace.legacyBaselineSnapshotKey, workspace.latestObservedLegacySnapshotKey].every(key => key === null || snapshotKeys.has(key)), 'INVALID_STORED_RECORD');
  need(data.drafts.every(row => intentionKeys.has(row.intentKey)), 'INVALID_STORED_RECORD');
  need(data.intentions.every(row => row.sourceSnapshotKey === null || snapshotKeys.has(row.sourceSnapshotKey)), 'INVALID_STORED_RECORD');
  need(data.legacySnapshots.every(row => row.materializedIntentKey === null || intentionKeys.has(row.materializedIntentKey)), 'INVALID_STORED_RECORD');
  return workspace;
}

function openDatabase(dbName) {
  return new Promise((resolve, reject) => {
    let settled = false, request;
    const rejectOnce = error => {
      if (!settled) { settled = true; reject(storageError(error)); }
    };
    try {
      need(globalThis.indexedDB && typeof globalThis.indexedDB.open === 'function', 'STORAGE_UNAVAILABLE');
      request = globalThis.indexedDB.open(dbName, DB_VERSION);
      request.onblocked = () => rejectOnce(new FoundationError('DATABASE_BLOCKED'));
      request.onerror = () => rejectOnce(request.error);
      request.onupgradeneeded = event => {
        if (settled || event.oldVersion !== 0) {
          request.transaction.abort();
          rejectOnce(new FoundationError('UNSUPPORTED_DATABASE_VERSION'));
          return;
        }
        const db = request.result;
        db.createObjectStore(STORES.meta, {keyPath: 'key'});
        db.createObjectStore(STORES.intentions, {keyPath: 'intentKey'});
        db.createObjectStore(STORES.drafts, {keyPath: 'intentKey'});
        db.createObjectStore(STORES.legacySnapshots, {keyPath: 'snapshotKey'});
        db.createObjectStore(STORES.operations, {keyPath: 'operationId'});
      };
      request.onsuccess = () => {
        if (settled) { request.result.close(); return; }
        settled = true;
        resolve(request.result);
      };
    } catch (error) { rejectOnce(error); }
  });
}

export async function openStore(options = {}) {
  const settings = plainClone(options);
  need(record(settings) && Object.keys(settings).every(key => key === 'dbName'));
  const dbName = settings.dbName ?? DB_NAME;
  need(nonblank(dbName));
  const initialWorkspaceKey = uuid();
  const db = await openDatabase(dbName);
  let closed = false;
  const close = () => { closed = true; db.close(); };
  db.onversionchange = close;

  async function transaction(mode, body) {
    need(!closed, 'STORE_CLOSED');
    let tx;
    try { tx = db.transaction(STORE_NAMES, mode); }
    catch (error) { throw storageError(error); }
    const completed = new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onabort = () => reject(tx.error || new FoundationError('TRANSACTION_ABORTED'));
      tx.onerror = () => {}; // A request failure aborts the transaction; onabort is authoritative.
    });
    // The body may fail before the queued abort event is delivered.
    completed.catch(() => {});
    try {
      const result = await body(tx);
      await completed;
      return plainClone(result);
    } catch (error) {
      try { tx.abort(); } catch {}
      try { await completed; } catch {}
      throw storageError(error);
    }
  }

  async function readRows(tx) {
    const entries = await Promise.all(STORE_NAMES.map(async name => [name, await requestValue(tx.objectStore(name).getAll())]));
    return plainClone(Object.fromEntries(entries));
  }

  try {
    need([...db.objectStoreNames].sort().join('\n') === [...STORE_NAMES].sort().join('\n'), 'UNSUPPORTED_SCHEMA');
    await transaction('readwrite', async tx => {
      const data = await readRows(tx);
      if (data.meta.length === 0) {
        need(STORE_NAMES.every(name => data[name].length === 0), 'INVALID_STORED_RECORD');
        tx.objectStore(STORES.meta).add({
          key: 'workspace', schemaVersion: SCHEMA_VERSION, workspaceKey: initialWorkspaceKey,
          revision: 0, selectedIntentKey: null, legacyBaselineSnapshotKey: null, latestObservedLegacySnapshotKey: null
        });
      } else validateRows(data);
      return null;
    });
  } catch (error) { close(); throw storageError(error); }

  async function read(body) {
    return transaction('readonly', async tx => {
      const data = await readRows(tx);
      const workspace = validateRows(data);
      return body(data, workspace);
    });
  }

  async function prepare(command, args) {
    const requestCanonical = canonical({command, args});
    return {
      command, args, requestCanonical, requestFingerprint: await digest(requestCanonical),
      at: new Date().toISOString(), intentKey: uuid(), snapshotKey: uuid(), draftId: uuid()
    };
  }

  async function mutate(prepared, body) {
    return transaction('readwrite', async tx => {
      const data = await readRows(tx);
      const current = validateRows(data);
      const previous = data.operations.find(row => row.operationId === prepared.args.operationId);
      if (previous) {
        need(previous.command === prepared.command && previous.requestCanonical === prepared.requestCanonical &&
          previous.requestFingerprint === prepared.requestFingerprint, 'IDEMPOTENCY_CONFLICT');
        return previous.result;
      }
      need(current.revision < Number.MAX_SAFE_INTEGER, 'REVISION_EXHAUSTED');
      const workspace = {...current, revision: current.revision + 1};
      const result = {...body(tx, data, workspace), workspaceRevision: workspace.revision};
      tx.objectStore(STORES.meta).put(workspace);
      tx.objectStore(STORES.operations).add({
        operationId: prepared.args.operationId, schemaVersion: SCHEMA_VERSION,
        command: prepared.command, requestCanonical: prepared.requestCanonical,
        requestFingerprint: prepared.requestFingerprint, result, completedAt: prepared.at
      });
      return result;
    });
  }

  function addIntention(tx, workspace, prepared, sourceEnvelope, sourceSnapshotKey = null) {
    const value = {
      intentKey: prepared.intentKey, schemaVersion: SCHEMA_VERSION, revision: 1,
      createdRevision: workspace.revision, createdAt: prepared.at, updatedAt: prepared.at,
      sourceSnapshotKey, sourceEnvelope
    };
    tx.objectStore(STORES.intentions).add(value);
    if (workspace.selectedIntentKey === null) workspace.selectedIntentKey = value.intentKey;
    return value;
  }

  function snapshot(prepared, rawSha256, classified, source, intentKey = null, conflictWithBaseline = false) {
    return {
      snapshotKey: prepared.snapshotKey, schemaVersion: SCHEMA_VERSION, source,
      rawState: prepared.args.rawState, rawSha256, observedAt: prepared.at,
      classification: classified.classification, materializedIntentKey: intentKey, conflictWithBaseline
    };
  }

  async function prepareLegacy(command, args) {
    const classified = classifyLegacy(args.rawState);
    const prepared = await prepare(command, args);
    // Hash present source text as UTF-8. Absence uses the empty-byte hash, but
    // rawState equality remains mandatory: null and an empty string differ.
    const rawSha256 = await digest(args.rawState ?? '');
    return {prepared, classified, rawSha256};
  }

  function observedSnapshot(tx, data, workspace, prepared, classified, rawSha256) {
    const baseline = data.legacySnapshots.find(row => row.snapshotKey === workspace.legacyBaselineSnapshotKey);
    need(baseline, 'LEGACY_BASELINE_REQUIRED');
    const conflict = baseline.rawState !== prepared.args.rawState;
    let observed = data.legacySnapshots.find(row => row.source === 'legacy-storage' &&
      row.rawSha256 === rawSha256 && row.rawState === prepared.args.rawState);
    if (!observed) {
      observed = snapshot(prepared, rawSha256, classified, 'legacy-storage', null, conflict);
      tx.objectStore(STORES.legacySnapshots).add(observed);
    }
    workspace.latestObservedLegacySnapshotKey = observed.snapshotKey;
    return {
      snapshotKey: observed.snapshotKey, classification: observed.classification,
      intentKey: observed.materializedIntentKey, status: conflict ? 'conflict' : 'unchanged'
    };
  }

  return Object.freeze({
    close,
    readWorkspace: () => read((_data, workspace) => workspace),
    listIntentions: () => read(data => data.intentions.sort((a, b) => a.createdRevision - b.createdRevision || a.intentKey.localeCompare(b.intentKey))),
    readIntention: intentKey => {
      need(nonblank(intentKey));
      return read(data => data.intentions.find(row => row.intentKey === intentKey) ?? null);
    },
    readDraft: intentKey => {
      need(nonblank(intentKey));
      return read(data => data.drafts.find(row => row.intentKey === intentKey) ?? null);
    },
    exportWorkspace: () => read((data, workspace) => ({
      format: BACKUP_FORMAT, schemaVersion: SCHEMA_VERSION, workspace,
      intentions: data.intentions, drafts: data.drafts, legacySnapshots: data.legacySnapshots
    })),

    async createIntention(input) {
      const args = commandArguments(input, ['operationId', 'sourceEnvelope']);
      need(validLegacyEnvelope(args.sourceEnvelope) && args.sourceEnvelope.intent !== null, 'INVALID_LEGACY_ENVELOPE');
      const prepared = await prepare('createIntention', args);
      return mutate(prepared, (tx, _data, workspace) => {
        const intention = addIntention(tx, workspace, prepared, args.sourceEnvelope);
        return {intentKey: intention.intentKey, intentRevision: intention.revision};
      });
    },

    async selectIntention(input) {
      const args = commandArguments(input, ['operationId', 'expectedWorkspaceRevision', 'intentKey']);
      need(revision(args.expectedWorkspaceRevision, true) && nonblank(args.intentKey));
      const prepared = await prepare('selectIntention', args);
      return mutate(prepared, (_tx, data, workspace) => {
        need(workspace.revision - 1 === args.expectedWorkspaceRevision, 'REVISION_CONFLICT');
        need(data.intentions.some(row => row.intentKey === args.intentKey), 'INTENTION_NOT_FOUND');
        workspace.selectedIntentKey = args.intentKey;
        return {intentKey: args.intentKey};
      });
    },

    async saveDraft(input) {
      const args = commandArguments(input, ['operationId', 'intentKey', 'expectedIntentRevision', 'expectedDraftRevision', 'draft']);
      need(nonblank(args.intentKey) && revision(args.expectedIntentRevision) &&
        (args.expectedDraftRevision === null || revision(args.expectedDraftRevision)) && record(args.draft) &&
        Object.keys(args.draft).every(key => ['kind', 'step', 'values'].includes(key)) &&
        ['first', 'progress'].includes(args.draft.kind) && revision(args.draft.step) && record(args.draft.values));
      const prepared = await prepare('saveDraft', args);
      return mutate(prepared, (tx, data, _workspace) => {
        const intention = data.intentions.find(row => row.intentKey === args.intentKey);
        need(intention, 'INTENTION_NOT_FOUND');
        need(intention.revision === args.expectedIntentRevision, 'REVISION_CONFLICT');
        const previous = data.drafts.find(row => row.intentKey === args.intentKey);
        need((previous?.revision ?? null) === args.expectedDraftRevision, 'REVISION_CONFLICT');
        need(args.draft.kind === (intention.sourceEnvelope.intent.cycles.length === 0 ? 'first' : 'progress') &&
          (!previous || previous.kind === args.draft.kind), 'DRAFT_KIND_CONFLICT');
        // Reusing a draft after its reference changed requires an explicit future
        // rebase policy. A caller cannot silently adopt a different intention revision.
        need(!previous || previous.basedOnIntentRevision === intention.revision, 'REVISION_CONFLICT');
        need(!previous || previous.revision < Number.MAX_SAFE_INTEGER, 'REVISION_EXHAUSTED');
        const draft = {
          ...(previous ?? {}), intentKey: args.intentKey, schemaVersion: SCHEMA_VERSION,
          draftId: previous?.draftId ?? prepared.draftId, revision: previous ? previous.revision + 1 : 1,
          basedOnIntentRevision: intention.revision, ...args.draft, updatedAt: prepared.at
        };
        tx.objectStore(STORES.drafts).put(draft);
        return {intentKey: args.intentKey, draftId: draft.draftId, draftRevision: draft.revision};
      });
    },

    async captureLegacyBaseline(input) {
      const args = commandArguments(input, ['operationId', 'rawState']);
      const {prepared, classified, rawSha256} = await prepareLegacy('captureLegacyBaseline', args);
      return mutate(prepared, (tx, data, workspace) => {
        if (workspace.legacyBaselineSnapshotKey !== null)
          return observedSnapshot(tx, data, workspace, prepared, classified, rawSha256);
        need(data.intentions.length === 0 && data.drafts.length === 0, 'BASELINE_NOT_EMPTY');
        const materialize = classified.classification === 'valid-v1' && classified.sourceEnvelope.intent !== null;
        const source = snapshot(prepared, rawSha256, classified, 'legacy-storage', materialize ? prepared.intentKey : null);
        tx.objectStore(STORES.legacySnapshots).add(source);
        if (materialize) addIntention(tx, workspace, prepared, classified.sourceEnvelope, source.snapshotKey);
        workspace.legacyBaselineSnapshotKey = source.snapshotKey;
        workspace.latestObservedLegacySnapshotKey = source.snapshotKey;
        return {
          snapshotKey: source.snapshotKey, intentKey: source.materializedIntentKey,
          classification: source.classification, status: 'captured'
        };
      });
    },

    async importLegacy(input) {
      const args = commandArguments(input, ['operationId', 'rawState', 'mode']);
      need(args.mode === 'add-copy');
      const {prepared, classified, rawSha256} = await prepareLegacy('importLegacy', args);
      need(classified.classification === 'valid-v1', 'INVALID_LEGACY_IMPORT');
      return mutate(prepared, (tx, _data, workspace) => {
        const materialize = classified.sourceEnvelope.intent !== null;
        const source = snapshot(prepared, rawSha256, classified, 'legacy-import', materialize ? prepared.intentKey : null);
        tx.objectStore(STORES.legacySnapshots).add(source);
        if (materialize) addIntention(tx, workspace, prepared, classified.sourceEnvelope, source.snapshotKey);
        return {snapshotKey: source.snapshotKey, intentKey: source.materializedIntentKey, classification: source.classification};
      });
    },

    async observeLegacyChange(input) {
      const args = commandArguments(input, ['operationId', 'rawState']);
      const {prepared, classified, rawSha256} = await prepareLegacy('observeLegacyChange', args);
      return mutate(prepared, (tx, data, workspace) =>
        observedSnapshot(tx, data, workspace, prepared, classified, rawSha256));
    }
  });
}
