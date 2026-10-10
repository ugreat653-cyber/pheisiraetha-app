'use strict';

// Read-only Git/source gate for the new development PR. This does not execute a
// release builder, frozen verifier, deployment workflow, or production application.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const vm = require('node:vm');

const REPOSITORY = 'ugreat653-cyber/pheisiraetha-app';
const BASE = 'db6920193fb76028947ce148cd8ed61c847c5c3d';
const ACCEPTED_UX = '09898e8d72020559c9bb536d8c5e330ecb24fe99';
const UX_COMMITS = [
  'ccb564bbf27654137b7113360ece9ef46a495d0f',
  'af0e6f6220cbf0d34b50143ccdb7279848892f23',
  '188fbba2110fdba64c77b9499e603a365fdc7e0c',
  '11962206f36d45acf0bf38cf54af6b0018ee52ca',
  ACCEPTED_UX
];
const ALLOWED_PATHS = new Set([
  'app.js', 'locales.js',
  'docs/first-checkin-ux/verify-first-checkin.cjs',
  'docs/first-checkin-ux/verify-development-integration.cjs',
  '.github/workflows/pheisiraetha-first-checkin-ux.yml'
]);
const NEW_KEYS = [
  'risSaveFailed', 'analyticsEmpty', 'firstCheckinTitle', 'firstCheckinIntro',
  'continueFirstCheckin', 'finishLater', 'startFirstCheckin', 'noCheckinSummary',
  'checkinInvalid', 'firstCheckinSnapshotIntro', 'firstCheckinReviewIntro',
  'checkinSaveFailed'
];
const HELP_KEYS = ['primaryHelp', 'successHelp', 'scopeHelp', 'nonGoalsHelp', 'constraintsHelp', 'rationaleHelp'];
const LOCALE_KEYS = new Set([...NEW_KEYS, ...HELP_KEYS]);
const ROOT = process.cwd();
const OUT = path.resolve(process.env.UX_GATE_EVIDENCE || path.join(ROOT, 'development-integration-gate'));
const checks = [];

function git(...args) {
  return execFileSync('git', args, { cwd: ROOT, maxBuffer: 16 * 1024 * 1024 });
}
function textGit(...args) { return git(...args).toString('utf8').trim(); }
function check(name, body) {
  body();
  checks.push({ name, status: 'PASS' });
  console.log('PASS ' + name);
}
function tree(ref) {
  const result = new Map();
  for (const entry of git('ls-tree', '-r', '-z', ref).toString('utf8').split('\0').filter(Boolean)) {
    const match = /^([0-7]{6}) (blob|commit) ([0-9a-f]{40})\t(.+)$/.exec(entry);
    assert.ok(match, 'Unexpected Git tree entry: ' + entry);
    result.set(match[4], { mode: match[1], type: match[2], blob: match[3] });
  }
  return result;
}
function blob(ref, file) { return git('show', ref + ':' + file); }
function localeProgram(source) {
  const begin = '  const locales = ';
  const end = ';\n  for (const locale of Object.values(locales))';
  const start = source.indexOf(begin);
  const stop = source.lastIndexOf(end);
  assert.ok(start >= 0 && stop > start, 'Expected ordinary JSON locale registry');
  assert.equal(source.indexOf(begin, start + begin.length), -1);
  return {
    prefix: source.slice(0, start + begin.length),
    value: JSON.parse(source.slice(start + begin.length, stop)),
    suffix: source.slice(stop)
  };
}
function functionSource(source, name) {
  // Syntax from the accepted app is already frozen by the exact app blob gate.
  // Compare whole declarations bounded by the next declaration for loader/validators.
  const match = new RegExp('  function ' + name + '\\([^]*?(?=\\n  (?:function |let state))').exec(source);
  assert.ok(match, 'Expected storage function ' + name);
  return match[0];
}
function sha(bytes) { return crypto.createHash('sha256').update(bytes).digest('hex'); }

function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const head = textGit('rev-parse', 'HEAD');
  const baseTree = tree(BASE);
  const headTree = tree('HEAD');
  const changed = [...new Set([...baseTree.keys(), ...headTree.keys()])]
    .filter(file => JSON.stringify(baseTree.get(file)) !== JSON.stringify(headTree.get(file))).sort();
  const frozenFiles = [];
  const localeWitness = [];

  check('exact repository, event, head, development target and approved source', () => {
    assert.equal(process.env.GITHUB_REPOSITORY, REPOSITORY);
    assert.equal(process.env.GITHUB_EVENT_NAME, 'pull_request');
    assert.equal(process.env.GITHUB_BASE_REF, 'development/public-on');
    assert.equal(process.env.GITHUB_HEAD_REF, 'integration/first-checkin-31-locales');
    assert.match(process.env.TESTED_HEAD || '', /^[0-9a-f]{40}$/);
    assert.equal(head, process.env.TESTED_HEAD);
    assert.equal(process.env.TESTED_BASE, BASE);
    assert.equal(textGit('rev-parse', 'refs/remotes/origin/development/public-on'), BASE);
    assert.equal(textGit('rev-parse', 'refs/remotes/origin/baseline/public-on-offline-candidate-12'), BASE);
    git('merge-base', '--is-ancestor', BASE, head);
  });
  check('all five approved UX commits preserved as ancestors', () => {
    for (const commit of UX_COMMITS) git('merge-base', '--is-ancestor', commit, head);
  });
  check('only five exact UX/localization/verification paths may change', () => {
    assert.ok(changed.length >= 4 && changed.length <= ALLOWED_PATHS.size);
    for (const file of changed) assert.ok(ALLOWED_PATHS.has(file), 'Unapproved path: ' + file);
    for (const file of ALLOWED_PATHS) {
      assert.deepEqual(
        { mode: headTree.get(file)?.mode, type: headTree.get(file)?.type },
        { mode: '100644', type: 'blob' },
        'Expected ordinary source file: ' + file
      );
    }
  });
  check('every other baseline file including all frozen contracts matches exact blob, mode and bytes', () => {
    for (const [file, entry] of baseTree) {
      if (ALLOWED_PATHS.has(file)) continue;
      assert.deepEqual(headTree.get(file), entry, 'Changed baseline file: ' + file);
      const expected = blob(BASE, file);
      const actual = blob('HEAD', file);
      assert.equal(Buffer.compare(actual, expected), 0, 'Changed bytes: ' + file);
      frozenFiles.push({ path: file, ...entry, bytes: actual.length, sha256: sha(actual) });
    }
  });
  check('application differs from accepted PR7 only by all-locale neutral fallback presentation and stays OFF', () => {
    const app = blob('HEAD', 'app.js');
    const acceptedApp = blob(ACCEPTED_UX, 'app.js').toString('utf8');
    const oldPresentation = [
      '    const russianEmpty=',
      "      currentLang==='ru' && dto.mode==='FALLBACK_ONLY' && dto.texts.length===1 &&",
      "      dto.texts[0]==='No interpretation or next focus is shown here.';",
      "    root.lang=russianEmpty ? 'ru' : 'en';",
      "    root.dir='ltr';",
      '    for(const text of dto.texts){',
      "      const paragraph=document.createElement('p');",
      "      paragraph.textContent=russianEmpty ? t('analyticsEmpty') : text;"
    ].join('\n');
    const newPresentation = [
      '    const localizedEmpty=',
      "      dto.mode==='FALLBACK_ONLY' && dto.texts.length===1 &&",
      "      dto.texts[0]==='No interpretation or next focus is shown here.';",
      "    root.lang=localizedEmpty ? LOCALES[currentLang].htmlLang : 'en';",
      "    root.dir=localizedEmpty ? LOCALES[currentLang].dir : 'ltr';",
      '    for(const text of dto.texts){',
      "      const paragraph=document.createElement('p');",
      "      paragraph.textContent=localizedEmpty ? t('analyticsEmpty') : text;"
    ].join('\n');
    assert.equal(acceptedApp.split(oldPresentation).length - 1, 1, 'Exact accepted presentation block');
    const expected = acceptedApp.replace(oldPresentation, newPresentation);
    assert.equal(app.toString('utf8'), expected, 'No other app, analytics adapter or Safety changes');
    const source = app.toString('utf8');
    assert.equal(source.split('const ANALYTICS_ENABLED = false;').length - 1, 1);
    assert.equal(source.includes('const ANALYTICS_ENABLED = true;'), false);
    new vm.Script(source, { filename: 'app.js' });
  });
  check('stored version, keys, validators and loader remain the approved source contract', () => {
    const source = blob('HEAD', 'app.js').toString('utf8');
    const baseline = blob(BASE, 'app.js').toString('utf8');
    for (const name of ['STORAGE_KEY', 'ONBOARDING_KEY', 'LANGUAGE_KEY', 'APP_VERSION']) {
      const expression = new RegExp('const ' + name + ' = [^;]+;');
      assert.equal(expression.exec(source)?.[0], expression.exec(baseline)?.[0], name);
    }
    for (const name of ['isValidCycle', 'isValidBackup', 'load']) {
      assert.equal(functionSource(source, name), functionSource(baseline, name), name);
    }
    assert.equal(
      /const fresh = \(\) => \([^;]+;/.exec(source)?.[0],
      /const fresh = \(\) => \([^;]+;/.exec(baseline)?.[0]
    );
  });
  check('31 locale integration changes only 18 keys and preserves four accepted Russian labels', () => {
    const baseline = localeProgram(blob(BASE, 'locales.js').toString('utf8'));
    const accepted = localeProgram(blob(ACCEPTED_UX, 'locales.js').toString('utf8'));
    const currentBytes = blob('HEAD', 'locales.js');
    const current = localeProgram(currentBytes.toString('utf8'));
    assert.equal(current.prefix, baseline.prefix, 'Do not change locale registry program');
    assert.equal(current.suffix, baseline.suffix, 'Do not change locale registry freeze/metadata behavior');
    const languages = Object.keys(baseline.value);
    assert.equal(languages.length, 31);
    assert.deepEqual(Object.keys(current.value), languages);
    for (const lang of languages) {
      const before = baseline.value[lang], after = current.value[lang];
      assert.deepEqual(
        Object.fromEntries(Object.entries(after).filter(([key]) => key !== 'translations')),
        Object.fromEntries(Object.entries(before).filter(([key]) => key !== 'translations')),
        'Locale metadata/onboarding changed: ' + lang
      );
      for (const key of new Set([...Object.keys(before.translations), ...Object.keys(after.translations)])) {
        if (LOCALE_KEYS.has(key)) continue;
        const acceptedLabel=lang==='ru' && ['scope','nonGoals','constraints','rationale'].includes(key);
        assert.deepEqual(after.translations[key], acceptedLabel ? accepted.value[lang].translations[key] : before.translations[key], lang + '.' + key);
      }
      for (const key of LOCALE_KEYS) {
        const value = after.translations[key];
        assert.equal(typeof value, 'string', lang + '.' + key);
        assert.ok(value.trim() && value === value.trim(), 'Empty/padded translation: ' + lang + '.' + key);
        assert.equal(/[<>]/u.test(value), false, 'Help/messages must remain plain text');
        if (lang !== 'en') assert.notEqual(value, current.value.en.translations[key], 'English fallback: ' + lang + '.' + key);
      }
      if (lang === 'en' || lang === 'ru')
        for (const key of LOCALE_KEYS) assert.equal(after.translations[key], accepted.value[lang].translations[key],
          'Preserve accepted semantic source: ' + lang + '.' + key);
      localeWitness.push({
        lang, htmlLang: after.htmlLang, dir: after.dir,
        newKeys: NEW_KEYS.length, RISHelpKeys: HELP_KEYS.length,
        dictionarySHA256: sha(Buffer.from(JSON.stringify(after.translations)))
      });
    }
    assert.equal(current.value.ar.dir, 'rtl');
    assert.equal(current.value.he.dir, 'rtl');
    new vm.Script(currentBytes.toString('utf8'), { filename: 'locales.js' });
  });
  check('CI has read-only exact head checks, guard dependency, all profiles and no skipped path filter', () => {
    const workflow = blob('HEAD', '.github/workflows/pheisiraetha-first-checkin-ux.yml').toString('utf8');
    assert.ok(workflow.includes('branches: [development/public-on]'));
    assert.ok(workflow.includes("head.ref == 'integration/first-checkin-31-locales'"));
    assert.ok(workflow.includes('head.repo.full_name == github.repository'));
    assert.ok(workflow.includes('permissions:\n  contents: read\n'));
    assert.ok(workflow.includes('needs: development-gate'));
    assert.ok(workflow.includes('fetch-depth: 0'));
    assert.equal(/^\s+paths(?:-ignore)?:/m.test(workflow), false);
    assert.ok(workflow.includes('profile: [desktop-chrome, samsung-chrome, iphone-webkit]'));
    assert.ok(workflow.includes('playwright@1.62.1'));
    assert.ok(workflow.includes("node-version: '24.19.0'"));
    const actions = [...workflow.matchAll(/uses:\s+([^\s]+)/g)].map(match => match[1]);
    assert.ok(actions.length > 0);
    for (const action of actions) assert.match(action, /@[a-f0-9]{40}$/);
    assert.equal(/(?:write|id-token|pages):|workflow_dispatch|pull_request_target|\bdeploy(?:ment)?\b|gh\s+api|curl\s+/i.test(workflow), false);
    assert.equal((workflow.match(/persist-credentials: false/g) || []).length, 2);
    assert.equal((workflow.match(/ref: \$\{\{ github.event.pull_request.head.sha \}\}/g) || []).length, 2);
  });
  check('checkout is clean and gate has not rewritten any repository source', () => {
    assert.equal(textGit('status', '--porcelain=v1', '--untracked-files=all'), '');
  });

  const report = {
    status: 'PASS', repository: REPOSITORY, headSHA: head, baseSHA: BASE,
    acceptedUXSHA: ACCEPTED_UX, approvedUXCommits: UX_COMMITS,
    sourceDefaultAnalyticsFlag: 'OFF',
    scope: 'Development integration only. No release build, historical qualification rerun, deployment, protected-anchor or production mutation.',
    changedPaths: changed, checks, frozenFiles, locales: localeWitness,
    runID: process.env.GITHUB_RUN_ID || null
  };
  fs.writeFileSync(path.join(OUT, 'DEVELOPMENT_INTEGRATION_GATE.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ status: 'PASS', headSHA: head, checks: checks.length, frozenFiles: frozenFiles.length, locales: localeWitness.length }));
}
try { main(); }
catch (error) {
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, 'DEVELOPMENT_INTEGRATION_GATE.json'), JSON.stringify({
    status: 'FAIL', checks, error: String(error.stack || error),
    repository: process.env.GITHUB_REPOSITORY || null,
    headSHA: process.env.TESTED_HEAD || null, baseSHA: process.env.TESTED_BASE || null,
    runID: process.env.GITHUB_RUN_ID || null
  }, null, 2) + '\n');
  console.error(error);
  process.exitCode = 1;
}
