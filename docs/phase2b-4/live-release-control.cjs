#!/usr/bin/env node
'use strict';
/*
 * Future controller only. Ordinary PR fixture jobs must never invoke preflight
 * or rollback. No network request occurs when this module is imported.
 */
const fs = require('node:fs/promises');
const path = require('node:path');
const https = require('node:https');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');

const P = Object.freeze({
  repository: 'ugreat653-cyber/pheisiraetha-app',
  repositoryID: 1391424322,
  owner: 'ugreat653-cyber',
  originalMain: '255a5d9d27461dcacaebc1bc80ab322dd54b4de8',
  approvedPRHead: '77ce5dcecaa1cf5a891120daed38490d91a71d18',
  branch: 'phase2b-4-live-verification',
  label: 'pheisiraetha-live-on-approved',
  workflow: '.github/workflows/pheisiraetha-live-verification.yml',
  publisher: '.github/workflows/pheisiraetha-publish-approved.yml',
  sourceRun: 37846586369,
  sourceHead: 'db6920193fb76028947ce148cd8ed61c847c5c3d',
  sourceArtifact: 11580506475,
  zipSHA256: '85bfe111a96f0e9773d505cbebe3d4750c4320f00eec6a370ce86147c33766b8',
  browserSHA256: '6c792041b07547a662e1b17974d1dc34a3db630379b45d9d89ddd7e3e68cc587',
  browserVersion: '154.0.8037.97',
  onDigest: '8dc1ede82f5e22c8c64b2f3172993376811bbb61dcec8cff4ef1638a8374963c',
  rollbackDigest: '668b47ed36422df20689f50cd403067e243e2c009c8270667f78b7fb9c32706e',
  target: 'https://ugreat653-cyber.github.io/pheisiraetha-app/',
  files: {
    'docs/phase2b-4/verify-pages-archive.py': '92d1aec6c60326fc576c6fe1ae72eeeb9c1ae87f65966a5c480397319cf8dd8f',
    '.github/workflows/pheisiraetha-pages-transport.yml': '382f9bc8e048aacbfa58e5404f1ff4b9395a08ed7f1a74731a3925f0056cd4ed',
    '.github/workflows/pheisiraetha-publish-approved.yml': '8716314e1cfab1ea4247795f8ff53c50a5ef2cdc5cacad8eff4d4c3658219e7a'
  }
});
function requireTrue(ok, message) { if (!ok) throw new Error(message); }
function sameRepository(item) { return item && item.id === P.repositoryID && item.full_name === P.repository; }
function sha(bytes) { return crypto.createHash('sha256').update(bytes).digest('hex'); }
function checkedEvent(event, context) {
  requireTrue(context.eventName === 'pull_request' && event.action === 'labeled', 'Controller requires the explicit label event');
  requireTrue(context.actor === P.owner && event.sender && event.sender.login === P.owner, 'Controller requires the exact owner actor');
  requireTrue(event.label && event.label.name === P.label, 'Unexpected controller label');
  requireTrue(event.pull_request && event.pull_request.head.ref === P.branch, 'Unexpected verification branch');
  requireTrue(sameRepository(event.repository) && sameRepository(event.pull_request.head.repo), 'Controller requires the exact same repository');
  requireTrue(event.pull_request.base.ref === 'main' && event.pull_request.state === 'open', 'Verification PR must remain open against main');
  requireTrue(context.head === event.pull_request.head.sha && /^[0-9a-f]{40}$/.test(context.head), 'Verification head mismatch');
  requireTrue(Number.isSafeInteger(context.runID) && context.runID > 0, 'Workflow run ID missing');
}
function checkedTransportReceipt(receipt, mode) {
  requireTrue(receipt && receipt.transportGate === 'PASS' && receipt.selectedMode === mode, 'Publisher transport receipt mode/gate mismatch');
  requireTrue(receipt.run === P.sourceRun && receipt.head === P.sourceHead &&
    receipt.artifact === P.sourceArtifact && receipt.zipSha256 === P.zipSHA256, 'Publisher changed the approved source archive');
  requireTrue(receipt.files === (mode === 'ON' ? 21 : 19) && receipt.deploymentPerformed === false, 'Publisher did not copy the complete unchanged overlay');
  requireTrue(Date.parse(receipt.expiresAt) > Date.now(), 'Publisher source archive expired');
}
function lineJSON(log, key, value) {
  const found = [];
  for (const line of log.split(/\r?\n/)) {
    const start = line.indexOf('{');
    if (start < 0 || !line.includes('"' + key + '"')) continue;
    try { const item = JSON.parse(line.slice(start).trim()); if (item[key] === value) found.push(item); } catch {}
  }
  requireTrue(found.length === 1, 'Expected one actual ' + key + '=' + value + ' log receipt');
  return found[0];
}
function checkedFixtureSummary(summary, mode) {
  requireTrue(summary && summary.liveVerificationGate === 'PASS' && summary.targetKind === 'FIXTURE' && summary.mode === mode, 'Fixture mechanism summary is missing or unsuccessful');
  requireTrue(summary.sourceArtifact === P.sourceArtifact && summary.sourceZipSha256 === P.zipSHA256, 'Fixture mechanism used another archive');
  requireTrue(summary.browser && summary.browser.version === P.browserVersion &&
    summary.browser.sha256Before === P.browserSHA256 && summary.browser.sha256After === P.browserSHA256, 'Fixture mechanism browser differs from the accepted runtime');
  const mandatory = ['ENVIRONMENT','PUBLIC_FILES','DEFAULT_OFF_BOOTSTRAP','EXACT_ARTIFACT','FRESH_CONTEXT','ONBOARDING','NATURAL_SERVICE_WORKER','CACHE_INTEGRITY','HOME_HISTORY','ANALYTICS','IMPORT_EXPORT','LOCALES_RTL','OFFLINE_COLD_WARM','NETWORK_STORAGE_ERRORS','FINAL_PUBLIC_BYTES'];
  requireTrue(summary.generation === (mode === 'ON' ? 'offline-candidate-12' : 'rollback-11') &&
    summary.releaseDigest === (mode === 'ON' ? P.onDigest : P.rollbackDigest), 'Fixture generation/inventory digest mismatch');
  requireTrue(summary.checks && mandatory.every(name => summary.checks[name] === 'PASS'), 'Mandatory browser mechanism proof missing');
  requireTrue(summary.negativeControls === 'PASS', 'Mechanism negative controls did not pass');
}
function rollbackRequest() {
  return {
    ref: 'main',
    inputs: {
      mode: 'ROLLBACK',
      confirmation: 'ROLLBACK:' + P.zipSHA256
    }
  };
}
function checkedPublisherRun(run, mainSHA, since = null) {
  requireTrue(run && sameRepository(run.repository) && sameRepository(run.head_repository), 'Publisher repository mismatch');
  requireTrue(run.head_sha === mainSHA && run.head_branch === 'main' && run.event === 'workflow_dispatch' &&
    run.path === P.publisher, 'Publisher workflow/main identity mismatch');
  requireTrue(run.status === 'completed' && run.conclusion === 'success', 'Approved publisher must complete successfully');
  if (since) requireTrue(Date.parse(run.created_at) >= Date.parse(since), 'Publisher preceded the approved merge/dispatch');
}
function request(url, {method = 'GET', token = null, data = null, limit = 8 * 1024 * 1024} = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    requireTrue(parsed.protocol === 'https:', 'HTTPS required');
    requireTrue(!token || parsed.hostname === 'api.github.com', 'Repository token may only be sent to api.github.com');
    const headers = {'User-Agent': 'PHEISIRAETHA-controlled-live-verification'};
    if (token) { headers.Authorization = 'Bearer ' + token; headers.Accept = 'application/vnd.github+json'; headers['X-GitHub-Api-Version'] = '2022-11-28'; }
    const body = data === null ? null : Buffer.from(JSON.stringify(data));
    if (body) { headers['Content-Type'] = 'application/json'; headers['Content-Length'] = body.length; }
    const req = https.request(parsed, {method, headers}, res => {
      const chunks = []; let bytes = 0;
      res.on('data', chunk => { bytes += chunk.length; if (bytes > limit) { req.destroy(new Error('Response exceeds limit')); return; } chunks.push(chunk); });
      res.on('end', () => resolve({status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks)}));
      res.on('error', reject);
    });
    req.setTimeout(45000, () => req.destroy(new Error('HTTPS request timeout')));
    req.on('error', reject);
    if (body) req.write(body); req.end();
  });
}
async function api(suffix, options = {}) {
  requireTrue((suffix === '' || suffix.startsWith('/')) && !suffix.includes('://'), 'Fixed repository API suffix required');
  const token = process.env.GH_TOKEN; requireTrue(token, 'GH_TOKEN missing');
  const reply = await request('https://api.github.com/repos/' + P.repository + suffix, {...options, token});
  requireTrue(reply.status >= 200 && reply.status < 300, 'GitHub API ' + reply.status + ' at ' + suffix);
  return reply.body.length ? JSON.parse(reply.body.toString('utf8')) : null;
}
async function jobLogs(id) {
  requireTrue(Number.isSafeInteger(id) && id > 0, 'Invalid job ID');
  const token = process.env.GH_TOKEN; requireTrue(token, 'GH_TOKEN missing');
  const reply = await request('https://api.github.com/repos/' + P.repository + '/actions/jobs/' + id + '/logs', {token, limit: 12 * 1024 * 1024});
  if (reply.status === 200) return reply.body.toString('utf8');
  requireTrue(reply.status === 302 && reply.headers.location, 'Job logs unavailable');
  const signed = await request(reply.headers.location, {limit: 12 * 1024 * 1024});
  requireTrue(signed.status === 200, 'Signed job logs unavailable');
  return signed.body.toString('utf8');
}
async function jobsFor(runID) {
  const result = await api('/actions/runs/' + runID + '/jobs?filter=latest&per_page=100');
  requireTrue(result.total_count === result.jobs.length, 'Unexpected job pagination');
  return result.jobs;
}
async function fixtureProof(head, currentRunID) {
  const runs = await api('/actions/workflows/pheisiraetha-live-verification.yml/runs?per_page=100&head_sha=' + head);
  requireTrue(Array.isArray(runs.workflow_runs), 'Verification workflow history unavailable');
  const candidates = runs.workflow_runs.filter(run => run.id !== currentRunID && run.head_sha === head &&
    run.path === P.workflow && run.head_branch === P.branch && run.event === 'pull_request' && run.status === 'completed' &&
    run.conclusion === 'success' && sameRepository(run.repository) && sameRepository(run.head_repository))
    .sort((a, b) => b.id - a.id);
  for (const run of candidates) {
    const jobs = await jobsFor(run.id);
    const fixtures = ['ON', 'ROLLBACK'].map(mode => jobs.find(job => job.name === 'fixture (' + mode + ')'));
    if (fixtures.some(job => !job || job.status !== 'completed' || job.conclusion !== 'success')) continue;
    const artifacts = await api('/actions/runs/' + run.id + '/artifacts?per_page=100');
    requireTrue(artifacts.total_count === artifacts.artifacts.length, 'Unexpected fixture artifact pagination');
    const receipts = [];
    for (let index = 0; index < fixtures.length; index++) {
      const mode = index === 0 ? 'ON' : 'ROLLBACK';
      const name = 'pheisiraetha-live-verification-fixture-' + mode + '-' + run.id + '-' + run.run_attempt;
      const artifact = artifacts.artifacts.find(item => item.name === name && !item.expired &&
        Date.parse(item.expires_at) > Date.now() && item.workflow_run && item.workflow_run.id === run.id &&
        item.workflow_run.head_sha === head);
      requireTrue(artifact && /^sha256:[0-9a-f]{64}$/.test(artifact.digest), 'Complete fixture evidence artifact unavailable for ' + mode);
      const summary = lineJSON(await jobLogs(fixtures[index].id), 'liveVerificationGate', 'PASS');
      checkedFixtureSummary(summary, mode);
      receipts.push({mode, jobID: fixtures[index].id, artifactID: artifact.id, artifactSHA256: artifact.digest, summary});
    }
    return {runID: run.id, attempt: run.run_attempt, head, receipts};
  }
  throw new Error('No successful exact-head ON and ROLLBACK browser-mechanism proof');
}
async function checkMainAndPages() {
  const [repository, pr, main, pages] = await Promise.all([api(''), api('/pulls/4'), api('/commits/main'), api('/pages')]);
  requireTrue(sameRepository(repository) && repository.default_branch === 'main' && repository.visibility === 'public', 'Unexpected repository identity/default branch/visibility');
  requireTrue(pr.number === 4 && pr.merged === true && pr.head.sha === P.approvedPRHead &&
    pr.head.ref === 'phase2b-4-pages-transport' && sameRepository(pr.head.repo) &&
    pr.base.ref === 'main' && pr.merge_commit_sha === main.sha, 'PR4/main merge identity mismatch');
  requireTrue(main.parents && main.parents[0] && main.parents[0].sha === P.originalMain &&
    (main.parents.length === 1 || (main.parents.length === 2 && main.parents[1].sha === P.approvedPRHead)), 'Unexpected main parents or newer main commit');
  const compare = await api('/compare/' + P.originalMain + '...' + main.sha);
  requireTrue(compare.merge_base_commit && compare.merge_base_commit.sha === P.originalMain, 'Original main is not the approved base');
  const changed = compare.files || [];
  requireTrue(changed.length === 3 && changed.every(item => item.status === 'added' && Object.hasOwn(P.files, item.filename)), 'Main contains unapproved changed paths');
  for (const item of changed) {
    const file = await api('/contents/' + item.filename + '?ref=' + main.sha);
    requireTrue(file.type === 'file' && file.encoding === 'base64' && sha(Buffer.from(file.content, 'base64')) === P.files[item.filename], 'Approved transport file bytes changed: ' + item.filename);
  }
  requireTrue(pages.build_type === 'workflow' && pages.https_enforced === true &&
    pages.html_url === P.target && pages.cname === null, 'Pages source/HTTPS/URL/domain differ from approval');
  return {mainSHA: main.sha, mergeCommitSHA: pr.merge_commit_sha, mergedAt: pr.merged_at, pages: {
    buildType: pages.build_type, httpsEnforced: pages.https_enforced, url: pages.html_url, cname: pages.cname
  }, approvedChangedFiles: P.files};
}
async function latestPublisher(mainSHA, since) {
  const history = await api('/actions/workflows/pheisiraetha-publish-approved.yml/runs?per_page=100');
  const runs = history.workflow_runs.filter(run => run.head_branch === 'main' && run.event === 'workflow_dispatch')
    .sort((a, b) => b.id - a.id);
  requireTrue(runs.length > 0, 'Approved manual ON publisher has not run');
  const run = runs[0]; checkedPublisherRun(run, mainSHA, since);
  const jobs = await jobsFor(run.id);
  requireTrue(['verify', 'publish'].every(name => jobs.some(job => job.name === name && job.status === 'completed' && job.conclusion === 'success')), 'Publisher verify/publish jobs did not both succeed');
  const receipt = lineJSON(await jobLogs(jobs.find(job => job.name === 'verify').id), 'transportGate', 'PASS');
  return {run, receipt, jobs: jobs.map(job => ({id: job.id, name: job.name, conclusion: job.conclusion}))};
}
async function sourceArchiveProof() {
  const [run, artifact] = await Promise.all([api('/actions/runs/' + P.sourceRun), api('/actions/artifacts/' + P.sourceArtifact)]);
  requireTrue(run.id === P.sourceRun && run.run_attempt === 1 && run.head_sha === P.sourceHead &&
    run.event === 'pull_request' && run.path === '.github/workflows/pheisiraetha-public-proposal.yml' &&
    run.status === 'completed' && run.conclusion === 'success' &&
    sameRepository(run.repository) && sameRepository(run.head_repository), 'Approved qualification provenance changed');
  requireTrue(artifact.id === P.sourceArtifact && artifact.name === 'pheisiraetha-public-proposal-' + P.sourceRun + '-1' &&
    artifact.digest === 'sha256:' + P.zipSHA256 && !artifact.expired && Date.parse(artifact.expires_at) > Date.now() &&
    artifact.workflow_run && artifact.workflow_run.id === P.sourceRun && artifact.workflow_run.head_sha === P.sourceHead, 'Approved archive unavailable, expired or substituted');
  return {runID: run.id, sourceHead: run.head_sha, artifactID: artifact.id, zipSHA256: P.zipSHA256, expiresAt: artifact.expires_at};
}
function publicRun(run) {
  return {id: run.id, attempt: run.run_attempt, url: run.html_url, headSHA: run.head_sha, event: run.event,
    status: run.status, conclusion: run.conclusion, createdAt: run.created_at, updatedAt: run.updated_at, workflow: run.path};
}
async function output(values) {
  requireTrue(process.env.GITHUB_OUTPUT, 'GITHUB_OUTPUT required');
  await fs.appendFile(process.env.GITHUB_OUTPUT, Object.entries(values).map(([key, value]) => key + '=' + value).join('\n') + '\n');
}
async function save(evidence, file, value) {
  await fs.writeFile(path.join(evidence, file), JSON.stringify(value, null, 2) + '\n', {flag: 'wx'});
}
async function eventAndContext() {
  requireTrue(process.platform === 'linux', 'Controller is authorized only inside the Linux Actions runner');
  const event = JSON.parse(await fs.readFile(process.env.GITHUB_EVENT_PATH, 'utf8'));
  const context = {eventName: process.env.GITHUB_EVENT_NAME, actor: process.env.GITHUB_ACTOR, head: process.env.VERIFICATION_HEAD, runID: Number(process.env.GITHUB_RUN_ID)};
  checkedEvent(event, context);
  const livePR = await api('/pulls/' + event.number);
  requireTrue(livePR.state === 'open' && livePR.head.sha === context.head && livePR.head.ref === P.branch &&
    sameRepository(livePR.head.repo) && livePR.base.ref === 'main', 'Verification PR changed after the label event');
  const current = await api('/actions/runs/' + context.runID);
  requireTrue(current.event === 'pull_request' && current.head_sha === context.head && current.head_branch === P.branch &&
    current.path === P.workflow && current.actor && current.actor.login === P.owner &&
    current.triggering_actor && current.triggering_actor.login === P.owner && sameRepository(current.repository) && sameRepository(current.head_repository), 'Controller workflow/owner identity mismatch');
  return {event, context};
}
async function preflight(evidence) {
  const {context} = await eventAndContext();
  const [state, source, mechanism] = await Promise.all([checkMainAndPages(), sourceArchiveProof(), fixtureProof(context.head, context.runID)]);
  const publisher = await latestPublisher(state.mainSHA, state.mergedAt);
  checkedTransportReceipt(publisher.receipt, 'ON');
  const record = {controlGate: 'PASS', operation: 'LIVE_ON_PREFLIGHT', target: P.target,
    verificationHead: context.head, controllerRunID: context.runID, state, source, mechanism,
    approvedONDeployment: publicRun(publisher.run), publisherReceipt: publisher.receipt,
    deploymentJobs: publisher.jobs, rollbackEligible: true, publicMutationPerformed: false};
  await save(evidence, 'control-preflight.json', record);
  await output({rollback_eligible: 'true', approved_main_sha: state.mainSHA, on_deployment_run_id: publisher.run.id});
  console.log(JSON.stringify(record));
  return record;
}
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
async function waitRollbackRun(mainSHA, dispatchAt, dispatchedID, priorID) {
  const deadline = Date.now() + 35 * 60 * 1000;
  let observedID = dispatchedID;
  while (Date.now() < deadline) {
    if (!observedID) {
      const history = await api('/actions/workflows/pheisiraetha-publish-approved.yml/runs?per_page=100');
      const matching = history.workflow_runs.filter(run => run.id > priorID && run.head_sha === mainSHA &&
        run.head_branch === 'main' && run.event === 'workflow_dispatch' && run.path === P.publisher &&
        Date.parse(run.created_at) >= Date.parse(dispatchAt) - 5000).sort((a, b) => a.id - b.id);
      requireTrue(matching.length <= 1, 'Ambiguous/new unexpected publisher dispatch');
      if (matching.length) observedID = matching[0].id;
    }
    if (observedID) {
      const run = await api('/actions/runs/' + observedID);
      requireTrue(run.head_sha === mainSHA && run.path === P.publisher && run.event === 'workflow_dispatch' &&
        run.head_branch === 'main' && sameRepository(run.repository) && sameRepository(run.head_repository), 'Rollback publisher identity changed');
      if (run.status === 'completed') {
        checkedPublisherRun(run, mainSHA, dispatchAt);
        const jobs = await jobsFor(run.id);
        requireTrue(['verify', 'publish'].every(name => jobs.some(job => job.name === name && job.status === 'completed' && job.conclusion === 'success')), 'Rollback verify/publish jobs did not both succeed');
        const receipt = lineJSON(await jobLogs(jobs.find(job => job.name === 'verify').id), 'transportGate', 'PASS');
        checkedTransportReceipt(receipt, 'ROLLBACK');
        return {run: publicRun(run), receipt, jobs: jobs.map(job => ({id: job.id, name: job.name, conclusion: job.conclusion}))};
      }
    }
    await sleep(30000);
  }
  throw new Error('Approved OFF rollback publisher timed out');
}
async function rollback(evidence) {
  await eventAndContext();
  const prior = JSON.parse(await fs.readFile(path.join(evidence, 'control-preflight.json'), 'utf8'));
  requireTrue(prior.controlGate === 'PASS' && prior.rollbackEligible === true &&
    prior.controllerRunID === Number(process.env.GITHUB_RUN_ID) &&
    prior.verificationHead === process.env.VERIFICATION_HEAD, 'Current successful live preflight receipt required');
  requireTrue(process.env.LIVE_ON_VERIFICATION_FAILED === 'true', 'Rollback requires the failed actual LIVE ON verification signal');
  const [state, source] = await Promise.all([checkMainAndPages(), sourceArchiveProof()]);
  requireTrue(state.mainSHA === prior.state.mainSHA && source.zipSHA256 === prior.source.zipSHA256, 'Approved main/archive changed before rollback');
  const latest = await latestPublisher(state.mainSHA, state.mergedAt);
  requireTrue(latest.run.id === prior.approvedONDeployment.id, 'Unexpected newer publisher exists; rollback stopped');
  checkedTransportReceipt(latest.receipt, 'ON');
  const dispatchAt = new Date().toISOString();
  const requestBody = rollbackRequest();
  await save(evidence, 'control-rollback-request.json', {operation: 'APPROVED_COMPLETE_OFF_ROLLBACK', dispatchAt,
    originalONRunID: latest.run.id, target: P.target, mainSHA: state.mainSHA, source, generation: 'rollback-11',
    workflow: P.publisher, requestBody});
  const response = await api('/actions/workflows/pheisiraetha-publish-approved.yml/dispatches', {method: 'POST', data: requestBody});
  const id = response && response.workflow_run_id;
  if (id !== undefined) requireTrue(Number.isSafeInteger(id) && id > latest.run.id, 'Unexpected rollback dispatch response');
  const published = await waitRollbackRun(state.mainSHA, dispatchAt, id || null, latest.run.id);
  const after = await checkMainAndPages();
  requireTrue(after.mainSHA === state.mainSHA, 'Main changed during rollback');
  const record = {controlGate: 'PASS', operation: 'APPROVED_COMPLETE_OFF_ROLLBACK_DEPLOYED',
    source, generation: 'rollback-11', published, mainSHA: state.mainSHA,
    liveOFFVerificationStillRequired: true, finalStatus: 'ROLLBACK_DEPLOYED_NOT_YET_VERIFIED'};
  await save(evidence, 'control-rollback.json', record);
  await output({rollback_deployment_run_id: published.run.id, rollback_published: 'true'});
  console.log(JSON.stringify(record));
  return record;
}
function selfTest() {
  const tests = [];
  const goodEvent = {action: 'labeled', sender: {login: P.owner}, label: {name: P.label}, repository: {id: P.repositoryID, full_name: P.repository},
    pull_request: {state: 'open', base: {ref: 'main'}, head: {ref: P.branch, sha: 'a'.repeat(40), repo: {id: P.repositoryID, full_name: P.repository}}}};
  const context = {eventName: 'pull_request', actor: P.owner, head: 'a'.repeat(40), runID: 1};
  checkedEvent(goodEvent, context); tests.push('exact-label-same-repository-head');
  for (const [name, mutate] of [
    ['wrong-branch', event => { event.pull_request.head.ref = 'main'; }],
    ['wrong-label', event => { event.label.name = 'deploy'; }],
    ['wrong-owner-sender', event => { event.sender.login = 'collaborator'; }],
    ['fork', event => { event.pull_request.head.repo.id = 1; }],
    ['closed-pr', event => { event.pull_request.state = 'closed'; }]
  ]) { const changed = structuredClone(goodEvent); mutate(changed); assert.throws(() => checkedEvent(changed, context)); tests.push('reject-' + name); }
  assert.throws(() => checkedEvent(goodEvent, {...context, head: 'b'.repeat(40)})); tests.push('reject-wrong-head');
  assert.throws(() => checkedEvent(goodEvent, {...context, actor: 'collaborator'})); tests.push('reject-wrong-owner-actor');
  const receipt = {transportGate: 'PASS', selectedMode: 'ON', run: P.sourceRun, head: P.sourceHead,
    artifact: P.sourceArtifact, zipSha256: P.zipSHA256, files: 21, deploymentPerformed: false, expiresAt: '2100-01-01T00:00:00Z'};
  checkedTransportReceipt(receipt, 'ON'); tests.push('exact-on-publisher-receipt');
  for (const [key, value] of [['artifact', 1], ['zipSha256', '0'.repeat(64)], ['files', 19], ['expiresAt', '2000-01-01T00:00:00Z']]) {
    assert.throws(() => checkedTransportReceipt({...receipt, [key]: value}, 'ON')); tests.push('reject-receipt-' + key);
  }
  assert.deepEqual(rollbackRequest(), {ref: 'main', inputs: {mode: 'ROLLBACK', confirmation: 'ROLLBACK:' + P.zipSHA256}});
  tests.push('exact-complete-off-dispatch-payload-only');
  assert.throws(() => checkedFixtureSummary({liveVerificationGate: 'PASS'}, 'ON')); tests.push('reject-missing-fixture-proof');
  const mandatory = ['ENVIRONMENT','PUBLIC_FILES','DEFAULT_OFF_BOOTSTRAP','EXACT_ARTIFACT','FRESH_CONTEXT','ONBOARDING','NATURAL_SERVICE_WORKER','CACHE_INTEGRITY','HOME_HISTORY','ANALYTICS','IMPORT_EXPORT','LOCALES_RTL','OFFLINE_COLD_WARM','NETWORK_STORAGE_ERRORS','FINAL_PUBLIC_BYTES'];
  const summary = {liveVerificationGate: 'PASS', targetKind: 'FIXTURE', mode: 'ON', sourceArtifact: P.sourceArtifact,
    sourceZipSha256: P.zipSHA256, browser: {version: P.browserVersion, sha256Before: P.browserSHA256, sha256After: P.browserSHA256},
    generation: 'offline-candidate-12', releaseDigest: P.onDigest, checks: Object.fromEntries(mandatory.map(name => [name, 'PASS'])), negativeControls: 'PASS'};
  checkedFixtureSummary(summary, 'ON'); tests.push('complete-fifteen-check-fixture-proof');
  for (const name of mandatory) { assert.throws(() => checkedFixtureSummary({...summary, checks: {...summary.checks, [name]: 'NOT_COMPLETED'}}, 'ON')); tests.push('reject-incomplete-fixture-' + name); }
  assert.throws(() => lineJSON('{"transportGate":"PASS"}\n{"transportGate":"PASS"}', 'transportGate', 'PASS')); tests.push('reject-ambiguous-receipts');
  const record = {controllerSelfTestGate: 'PASS', tests: tests.length, checks: tests, networkRequests: 0, dispatches: 0, publicMutationPerformed: false};
  console.log(JSON.stringify(record));
  return record;
}
async function main() {
  const args = process.argv.slice(2);
  if (args.length === 1 && args[0] === '--self-test') return selfTest();
  requireTrue(args.length === 3 && ['preflight', 'rollback'].includes(args[0]) && args[1] === '--evidence', 'Usage: live-release-control.cjs preflight|rollback --evidence fresh-runner-temp-evidence-directory');
  const evidence = path.resolve(args[2]);
  requireTrue(path.isAbsolute(args[2]) && process.env.RUNNER_TEMP &&
    evidence.startsWith(path.resolve(process.env.RUNNER_TEMP) + path.sep), 'Evidence must be within RUNNER_TEMP');
  await fs.mkdir(evidence, {recursive: true});
  try { return await (args[0] === 'preflight' ? preflight(evidence) : rollback(evidence)); }
  catch (error) {
    const record = {controlGate: 'FAIL', operation: args[0], exactBlocker: error.message,
      finalStatus: args[0] === 'rollback' ? 'CRITICAL_RELEASE_INCIDENT' : 'RELEASE_BLOCKED'};
    await save(evidence, 'control-' + args[0] + '-failure.json', record);
    console.error(JSON.stringify(record)); process.exitCode = 1;
  }
}
module.exports = {P, checkedEvent, checkedTransportReceipt, checkedFixtureSummary, rollbackRequest, lineJSON, checkedPublisherRun, selfTest};
if (require.main === module) main().catch(error => { console.error(JSON.stringify({controlGate: 'FAIL', exactBlocker: error.message})); process.exitCode = 1; });
