'use strict';

// Private infrastructure only: no navigation, fixtures, product assertions, or
// repository writes. Callers own try/finally and close each context, browser,
// and server. Playwright may come from NODE_PATH or the shared runtime.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { createHash } = require('node:crypto');
const { createServer } = require('node:http');

const ROOT = path.resolve(__dirname, '../..');
const EXPECTED_BASE_HEAD = '0593d4b62f30c978260c6a15ff54323bc1351cbd';
const ARTIFACT_SHA256 = 'f1f975900faaa64649bcef42412c1856543c8716711d4119df9b964f4bf8c824';
const ARTIFACT_PATH = `browser-packaging/artifacts/analytics-v1.${ARTIFACT_SHA256}.js`;
const OFF_FLAG = 'const ANALYTICS_ENABLED = false;';
const ON_FLAG = 'const ANALYTICS_ENABLED = true;';
const PROTECTED_FILES = Object.freeze([
  'index.html', 'app.js', 'app.css', 'launch.js', 'locales.js', 'sw.js',
  'manifest.webmanifest', 'browser-packaging/package.json',
  'browser-packaging/package-lock.json', 'browser-packaging/build-manifest.json',
  ARTIFACT_PATH
]);
const MIME_TYPES = Object.freeze({
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.cjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png', '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.ico': 'image/x-icon'
});
const serverHandles = new WeakMap();

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function gitBytes(...args) {
  // Avoid even optional status/index refresh writes while collecting evidence.
  return execFileSync('git', ['--no-optional-locks', ...args], { cwd: ROOT });
}

function gitText(...args) {
  return gitBytes(...args).toString('utf8');
}

function assertCleanRepository(expectedHead = EXPECTED_BASE_HEAD) {
  assert.match(expectedHead, /^[a-f0-9]{40}$/, 'An exact expected HEAD is required');
  assert.equal(fs.realpathSync(gitText('rev-parse', '--show-toplevel').trim()),
    fs.realpathSync(ROOT), 'Harness must run against its own repository');
  assert.equal(gitText('rev-parse', 'HEAD').trim(), expectedHead, 'Unexpected HEAD');
  assert.equal(gitText('status', '--porcelain=v1', '--untracked-files=all'), '',
    'Index and working tree must be clean');
  // No exclude rules: ignored, untracked files are also detected.
  assert.equal(gitBytes('ls-files', '--others', '-z').length, 0, 'No untracked files');
  gitBytes('merge-base', '--is-ancestor', EXPECTED_BASE_HEAD, expectedHead);
  return expectedHead;
}

// S1 and subsequent test commits can add infrastructure. Pin their exact HEAD
// explicitly when known; all protected production bytes must still match BASE.
function captureRepositoryState(expectedHead = gitText('rev-parse', 'HEAD').trim()) {
  assertCleanRepository(expectedHead);
  const files = {};
  for (const file of PROTECTED_FILES) {
    const bytes = fs.readFileSync(path.join(ROOT, file));
    assert.deepEqual(bytes, gitBytes('show', `${EXPECTED_BASE_HEAD}:${file}`),
      `Protected file differs from committed 3B-5 BASE: ${file}`);
    files[file] = Object.freeze({ sha256: sha256(bytes), bytes: bytes.toString('base64') });
  }
  return Object.freeze({ head: expectedHead, files: Object.freeze(files) });
}

function assertRepositoryUnchanged(before) {
  const after = captureRepositoryState(before.head);
  assert.deepEqual(after, before, 'Protected hashes/bytes or repository HEAD changed');
  return after;
}

function readExactArtifact() {
  const bytes = fs.readFileSync(path.join(ROOT, ARTIFACT_PATH));
  assert.equal(sha256(bytes), ARTIFACT_SHA256, 'Unexpected analytics artifact bytes');
  assert.deepEqual(Buffer.from(bytes.toString('utf8'), 'utf8'), bytes,
    'Pre-document injection must preserve every artifact byte');
  return bytes;
}

function flagOffset(source) {
  assert.ok(Buffer.isBuffer(source), 'app.js source must be a byte Buffer');
  const offset = source.indexOf(OFF_FLAG);
  assert.ok(offset >= 0, 'Exactly one production OFF declaration is required');
  assert.equal(source.indexOf(OFF_FLAG, offset + 1), -1,
    'Exactly one production OFF declaration is required');
  return offset;
}

function assertEnabledAppTransformation(source, enabled) {
  const offset = flagOffset(source);
  assert.ok(Buffer.isBuffer(enabled), 'Enabled app.js must be a byte Buffer');
  assert.equal(enabled.length, source.length - Buffer.byteLength(OFF_FLAG) + Buffer.byteLength(ON_FLAG));
  assert.deepEqual(enabled.subarray(0, offset), source.subarray(0, offset),
    'Every byte before the flag must remain unchanged');
  assert.deepEqual(enabled.subarray(offset, offset + Buffer.byteLength(ON_FLAG)), Buffer.from(ON_FLAG));
  assert.deepEqual(enabled.subarray(offset + Buffer.byteLength(ON_FLAG)),
    source.subarray(offset + Buffer.byteLength(OFF_FLAG)),
    'Every byte after the flag must remain unchanged');
  return Object.freeze({ sourceSha256: sha256(source), enabledSha256: sha256(enabled), offset });
}

function enableAppJs(source = fs.readFileSync(path.join(ROOT, 'app.js'))) {
  const offset = flagOffset(source);
  const enabled = Buffer.concat([
    source.subarray(0, offset), Buffer.from(ON_FLAG),
    source.subarray(offset + Buffer.byteLength(OFF_FLAG))
  ]);
  assertEnabledAppTransformation(source, enabled);
  return enabled;
}

function copyLog(entries) {
  return Object.freeze(entries.map(entry => Object.freeze({ ...entry })));
}

function resourcePath(target) {
  // Validate the raw path BEFORE URL normalization can erase dot segments.
  const decoded = decodeURIComponent(target.split('?')[0]);
  assert.ok(decoded.startsWith('/') && !decoded.startsWith('//'));
  assert.ok(!/[\\\u0000-\u001f\u007f#]/.test(decoded));
  assert.ok(!decoded.split('/').some(part => part === '.' || part === '..'));
  return decoded === '/' ? 'index.html' : decoded.slice(1);
}

async function startServer({ expectedHead } = {}) {
  const repositoryState = captureRepositoryState(expectedHead);
  const tracked = new Set(gitText('ls-files', '-z').split('\0').filter(Boolean));
  const committed = new Map();
  const root = fs.realpathSync(ROOT);
  const requests = [];
  const sockets = new Set();
  let origin;
  const server = createServer((request, response) => {
    const entry = { url: `${origin}${request.url}`, target: request.url,
      method: request.method, resource: null, status: null, sha256: null, error: null };
    requests.push(entry);
    let status = 200, bytes, type = 'text/plain; charset=utf-8';
    try {
      if (request.headers.host !== new URL(origin).host) {
        status = 400;
      } else if (!['GET', 'HEAD'].includes(request.method)) {
        status = 405;
      } else {
        let resource;
        try { resource = resourcePath(request.url); } catch { status = 400; }
        if (status === 200) {
          entry.resource = resource;
          if (!tracked.has(resource)) {
            status = 404;
          } else {
            const file = fs.realpathSync(path.join(root, resource));
            const relative = path.relative(root, file);
            assert.ok(relative !== '..' && !relative.startsWith(`..${path.sep}`) &&
              !path.isAbsolute(relative), 'Resource must remain inside the repository');
            assert.ok(fs.statSync(file).isFile(), 'Only repository files may be served');
            bytes = fs.readFileSync(file);
            if (!committed.has(resource)) {
              committed.set(resource, gitBytes('show', `${repositoryState.head}:${resource}`));
            }
            assert.deepEqual(bytes, committed.get(resource), `Uncommitted resource bytes: ${resource}`);
            type = MIME_TYPES[path.extname(resource).toLowerCase()] || 'application/octet-stream';
          }
        }
      }
    } catch (error) {
      status = 500;
      entry.error = error.message;
      bytes = undefined;
    }
    bytes ??= Buffer.from(status === 404 ? 'Not found' : 'Request rejected');
    entry.status = status;
    entry.sha256 = sha256(bytes);
    entry.byteLength = bytes.length;
    response.writeHead(status, { 'Content-Type': type, 'Content-Length': bytes.length });
    response.end(request.method === 'HEAD' ? undefined : bytes);
  });
  server.on('connection', socket => {
    sockets.add(socket);
    socket.once('close', () => sockets.delete(socket));
  });
  try {
    await new Promise((resolve, reject) => {
      const failed = error => { server.off('listening', listening); reject(error); };
      const listening = () => { server.off('error', failed); resolve(); };
      server.once('error', failed);
      server.once('listening', listening);
      server.listen(0, '127.0.0.1');
    });
  } catch (error) {
    server.close();
    for (const socket of sockets) socket.destroy();
    throw error;
  }
  origin = `http://127.0.0.1:${server.address().port}`;
  let closePromise;
  const handle = Object.freeze({
    origin, repositoryState,
    get requestLog() { return copyLog(requests); },
    close() {
      closePromise ??= new Promise((resolve, reject) => {
        server.close(error => error ? reject(error) : resolve());
        for (const socket of sockets) socket.destroy();
      });
      return closePromise;
    }
  });
  serverHandles.set(handle, { server });
  return handle;
}

async function launchChromium() {
  let playwright;
  try {
    playwright = require('playwright');
  } catch (error) {
    if (error.code !== 'MODULE_NOT_FOUND' || !process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES) throw error;
    playwright = require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, 'playwright'));
  }
  const explicitPath = process.env.LEGACY_DOM_CHROMIUM_EXECUTABLE_PATH;
  const executablePath = path.resolve(explicitPath ?? playwright.chromium.executablePath());
  try {
    fs.accessSync(executablePath, process.platform === 'win32' ? fs.constants.F_OK : fs.constants.X_OK);
    assert.ok(fs.statSync(executablePath).isFile(), 'Chromium executable must be a file');
  } catch (cause) {
    throw new Error(`No usable installed Chromium executable: ${executablePath}`, { cause });
  }
  try {
    return await playwright.chromium.launch({ headless: true, executablePath });
  } catch (cause) {
    throw new Error(`Installed Playwright Chromium failed to launch: ${executablePath}`, { cause });
  }
}

async function createFreshContext(browser, server, {
  analyticsEnabled = false, locale = 'en-US', viewport, timezoneId = 'UTC'
} = {}) {
  assert.ok(serverHandles.get(server)?.server.listening, 'A live private server is required');
  assert.equal(typeof analyticsEnabled, 'boolean', 'Enablement must be explicit Boolean data');
  assertRepositoryUnchanged(server.repositoryState);
  const artifact = analyticsEnabled ? readExactArtifact() : null;
  const context = await browser.newContext({
    serviceWorkers: 'block', locale, timezoneId,
    ...(viewport === undefined ? {} : { viewport })
  });
  const requests = [], failures = [], byRequest = new WeakMap();
  const inFlight = new Set();
  const shutdownReason = 'PHEISIRAETHA private browser harness intentional context shutdown';
  let shutdownStarted = false, closePromise;
  function record(request) {
    if (!byRequest.has(request)) {
      const entry = { url: request.url(), method: request.method(),
        resourceType: request.resourceType(), blocked: false, transformed: false,
        outcome: 'pending', status: null, error: null };
      byRequest.set(request, entry);
      requests.push(entry);
    }
    return byRequest.get(request);
  }
  function isShutdownCancellation(error) {
    // Timing alone cannot identify cancellation. Require Playwright's specific
    // closed-target error class AND the reason passed to this context's close.
    return shutdownStarted && error instanceof Error &&
      /^TargetClosedError\d*$/.test(error.constructor.name) &&
      error.message.includes(shutdownReason);
  }
  function accountHandlerError(error, entry) {
    const message = error instanceof Error ? error.message : String(error);
    if (isShutdownCancellation(error)) {
      if (entry) entry.shutdownCancellation = message;
      return;
    }
    if (entry) entry.error ??= message;
    failures.push(message);
  }
  function trackHandler(handler) {
    return resource => {
      // Schedule work after registration so even a synchronous callback fault
      // belongs to a tracked task. The catch also accounts unexpected escapes.
      const task = Promise.resolve().then(() => handler(resource))
        .catch(error => accountHandlerError(error))
        .finally(() => inFlight.delete(task));
      inFlight.add(task);
      return task;
    };
  }
  async function drainHandlers() {
    while (inFlight.size) {
      const settled = await Promise.allSettled([...inFlight]);
      for (const result of settled) {
        if (result.status === 'rejected') accountHandlerError(result.reason);
      }
    }
  }
  function assertHealthy() {
    assert.deepEqual(failures, [], 'Private browser harness infrastructure failed');
    assert.deepEqual(server.requestLog.filter(entry => entry.error), [], 'Private HTTP server failed');
    assert.deepEqual(requests.filter(entry => entry.transformed &&
      (entry.status !== 200 || entry.outcome !== 'finished' || entry.error !== null)), [],
      'Transformed app.js delivery requires terminal successful response evidence');
  }
  function closeAndDrain() {
    if (!closePromise) {
      shutdownStarted = true;
      closePromise = (async () => {
        try { await context.close({ reason: shutdownReason }); }
        catch (error) { accountHandlerError(error); }
        finally { await drainHandlers(); }
        assertHealthy();
      })();
    }
    return closePromise;
  }
  try {
    context.on('request', record);
    context.on('response', response => { record(response.request()).status = response.status(); });
    context.on('requestfinished', request => { record(request).outcome = 'finished'; });
    context.on('requestfailed', request => {
      const entry = record(request);
      entry.outcome = entry.blocked ? 'blocked' : 'failed';
      entry.requestFailure = request.failure()?.errorText || 'Request failed';
      entry.error ??= entry.requestFailure;
      // errorText does not authenticate a shutdown cause. In particular,
      // ERR_ABORTED/ERR_FAILED alone must never exempt a non-blocked failure.
      if (!entry.blocked) failures.push(`${entry.method} ${entry.url}: ${entry.requestFailure}`);
    });
    // HTTP routing does not cover WebSockets. Never connect these to a server.
    assert.equal(typeof context.routeWebSocket, 'function', 'Playwright WebSocket routing is required');
    await context.routeWebSocket(/.*/, trackHandler(async socket => {
      const entry = { url: socket.url(), method: 'GET', resourceType: 'websocket',
        blocked: true, transformed: false, outcome: 'blocked', status: null, error: null };
      requests.push(entry);
      try { await socket.close({ code: 1008, reason: 'Private harness blocks network sockets' }); }
      catch (error) { accountHandlerError(error, entry); }
    }));
    await context.route('**/*', trackHandler(async route => {
      const request = route.request(), entry = record(request);
      try {
        const url = new URL(request.url());
        if (url.origin !== server.origin || url.username || url.password) {
          entry.blocked = true;
          entry.outcome = 'blocked';
          await route.abort('blockedbyclient');
        } else if (analyticsEnabled && url.pathname === '/app.js') {
          assert.equal(request.method(), 'GET', 'Enabled app.js must use its normal GET response');
          const response = await route.fetch({ maxRedirects: 0, maxRetries: 0 });
          try {
            assert.equal(response.status(), 200, 'app.js must be served successfully');
            const source = await response.body();
            assert.deepEqual(source, fs.readFileSync(path.join(ROOT, 'app.js')),
              'Only the exact working-tree app.js response may be transformed');
            const enabled = enableAppJs(source);
            Object.assign(entry, assertEnabledAppTransformation(source, enabled), { transformationPrepared: true });
            await route.fulfill({ response, body: enabled,
              headers: { ...response.headers(), 'content-length': String(enabled.length) } });
            entry.transformed = true;
          } finally {
            // Cleanup must not replace an earlier assertion/fulfillment error.
            try { await response.dispose(); }
            catch (error) { accountHandlerError(error, entry); }
          }
        } else {
          await route.continue();
        }
      } catch (error) {
        accountHandlerError(error, entry);
        try { await route.abort('failed'); }
        catch (abortError) { accountHandlerError(abortError, entry); }
      }
    }));
    if (analyticsEnabled) await context.addInitScript({ content: artifact.toString('utf8') });
  } catch (error) {
    try { await closeAndDrain(); }
    catch (cleanupError) { throw new AggregateError([error, cleanupError], 'Context setup and cleanup failed'); }
    throw error;
  }
  return Object.freeze({
    context, origin: server.origin,
    get requestLog() { return copyLog(requests); },
    assertHealthy,
    close: closeAndDrain
  });
}

async function createFreshPage(browser, server, options) {
  const session = await createFreshContext(browser, server, options);
  try {
    const page = await session.context.newPage();
    return Object.freeze({
      context: session.context, page, origin: session.origin,
      get requestLog() { return session.requestLog; },
      assertHealthy: session.assertHealthy, close: session.close
    });
  } catch (error) {
    await session.close();
    throw error;
  }
}

module.exports = Object.freeze({
  ROOT, EXPECTED_BASE_HEAD, ARTIFACT_PATH, ARTIFACT_SHA256, OFF_FLAG, ON_FLAG,
  PROTECTED_FILES, sha256, assertCleanRepository, captureRepositoryState,
  assertRepositoryUnchanged, readExactArtifact, enableAppJs,
  assertEnabledAppTransformation, startServer, launchChromium,
  createFreshContext, createFreshPage
});
