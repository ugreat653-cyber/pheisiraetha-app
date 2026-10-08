# PHEISIRAETHA 3B freeze — 2026-10-08

Status: ACCEPTED_EXACT_RUNTIME_GATE / REPRODUCIBILITY_RISK_OPEN. Public activation and deployment remain unqualified and unauthorized.

## Accepted implementation

Accepted S3 branch: phase2b-3b6-s3-verifier.
Exact tested commit: 7e583ac695be2b213d25591deab430664e682988.
Source-QA provenance branch: phase2b-3b6-s3-verifier-sourceqa (same exact commit).
Sole parent: accepted S2 9ab969284ff9fbc09af4ee1cc277eb8d7a0766b9.
Verifier blob: b86df83a9f928a6c679804fa4557e71b0ee70639.
S2→S3 changes only browser-packaging/verify.cjs. This report is a separate documentation child; it is not the tested executable commit.

Production main remains 255a5d9d27461dcacaebc1bc80ab322dd54b4de8.
Accepted 3B-5 remains 0593d4b62f30c978260c6a15ff54323bc1351cbd.
S1 harness commit/blob: 9f327acae82054d2b9a28ea6f05ac48c53c65d71 / d13700b967f82e1b4796655e4701315e338f676d.
S2 test blob: ad41025cdee7f4222e8fd85205c669c146e7207a.
Static ANALYTICS_ENABLED=false; APP_VERSION=0.1.0; existing worker/cache remains pheisiraetha-v16.
No app, worker, HTML, state schema, frozen Analysis/Safety/registry/facade, artifact, verifier or tests were modified to obtain this PASS.

## Exact runtime evidence

[Full run 37779253100](https://github.com/ugreat653-cyber/pheisiraetha-app/actions/runs/37779253100), job 113317873188, conclusion SUCCESS.
CI controller commit: 7442bb4df9568618ff6f2e8971eb1de3559140f1.
Controller blob: 89390bfe2ad4f9cefaab533b46716bd7f136e772.
Execution location: temporary GitHub Actions Ubuntu 24.04 Linux runner, not local Windows/WSL.
Node v24.19.0; esbuild 0.25.5; external Playwright 1.62.1.
Browser: already present /opt/google/chrome/chrome, Google Chrome 154.0.8037.57.
Browser SHA-256: 4d2512ae84986bf987e6ea8ef14ca1af555ae574fbaff5b5a8c78a8dd73fa36f.
Official Chrome packaged-channel environment stable was preserved; no browser download or executable modification occurred.
Pinned esbuild packages were staged before the verifier in its permitted ordinary ignored browser-packaging/node_modules directory; external Playwright and evidence remained outside source. Dependency fingerprints were unchanged during the verifier.

The unchanged command was:
`LEGACY_DOM_CHROMIUM_EXECUTABLE_PATH=/opt/google/chrome/chrome node browser-packaging/verify.cjs --3b6-tests-only`.

Original verifier process exited 0 without signal/error. No filtered diagnostic ran. Its complete report values are copied below, independent of the expiring Actions artifact; JSON whitespace is normalized.

Evidence archive: [artifact 11551009038](https://github.com/ugreat653-cyber/pheisiraetha-app/actions/runs/37779253100/artifacts/11551009038).
Archive SHA-256: 91b04b26446973d55bbe692191ba9a2db28e6a477534c4bc56cf70a9a1a85c3f.
Artifact created 2026-10-08T12:50:01Z; retention expires 2026-10-22T12:50:00Z.

Two independent read-only reviews checked source parent/blob/sole changed path, all suite counts, original process status, browser equality, protected-path count and immutability. Both found the exact full PASS valid and explicitly retained the reproducibility limitation. Archive bytes were not separately downloaded; full job logs and artifact metadata were read directly.

## Reproducibility limitation

[Earlier run 37777981053](https://github.com/ugreat653-cyber/pheisiraetha-app/actions/runs/37777981053) failed S2 with 17/19 PASS: 07 UNAVAILABLE Home and 18 Fresh-context isolation raised generic AggregateErrors. It used the same browser version/hash. The exact nested cause remains unproven. The successful run demonstrates a valid complete execution, not stable repeated execution. No automatic retry hides the earlier failure, and a filtered diagnostic can never override a failed full route.

Phase 2B-4 qualification must retain this risk, diagnose any recurrence and require an independently reviewed exact candidate. This report does not authorize relaxing frozen timeouts/assertions or editing frozen tests.

## Frozen analytical identity and remaining boundary

Selected artifact: browser-packaging/artifacts/analytics-v1.f1f975900faaa64649bcef42412c1856543c8716711d4119df9b964f4bf8c824.js.
SHA-256 f1f975900faaa64649bcef42412c1856543c8716711d4119df9b964f4bf8c824; 243504 bytes.
Accepted runtime core: eb24cac88bf82fc9ebc38914a90bc47829a6adcb.
Frozen Safety V1: 0e97042aba92cafac3498e8a220cd4c81897ecb8.
Frozen registry: ba46070bbcd42af51fb534c3282dd8a350bcfb20.
DTO pheisiraetha-render-v1; Safety safety-v1; registry safety-registry-v1.
Existing browser build manifest pins entry, Analysis/Safety bytes, runtime graph, build profile and selected output. This freeze does not change or rebuild them.

The accepted implementation remains default OFF. Separate Phase 2B-4 work must qualify release inventory, exact script loading, cache integrity, cold/warm offline, waiting-client transition, v16 cache misses, failure/quota/storage, private enabled behavior and whole-release rollback. Production merge, public ON and deployment require approval of the exact tested release candidate.

## Complete full-verifier report

```json
{"route":"3b6-tests-only","base":"0593d4b62f30c978260c6a15ff54323bc1351cbd","s1Commit":"9f327acae82054d2b9a28ea6f05ac48c53c65d71","s1HarnessBlob":"d13700b967f82e1b4796655e4701315e338f676d","s2Commit":"9ab969284ff9fbc09af4ee1cc277eb8d7a0766b9","s2TestBlob":"ad41025cdee7f4222e8fd85205c669c146e7207a","suiteCount":16,"tests":536,"pass":536,"fail":0,"cancelled":0,"skipped":0,"todo":0,"playwrightVersion":"1.62.1","playwrightPackageRoot":"/home/runner/work/_temp/pheisiraetha-3b6-tools/node_modules/playwright","playwrightEntry":"/home/runner/work/_temp/pheisiraetha-3b6-tools/node_modules/playwright/index.js","chromiumPath":"/opt/google/chrome/chrome","chromiumVersion":"Google Chrome 154.0.8037.57","chromiumSha256":"4d2512ae84986bf987e6ea8ef14ca1af555ae574fbaff5b5a8c78a8dd73fa36f","changedPathCount":3,"protectedChangedPathCount":0,"repositoryUnchanged":true,"dependencyFingerprint":"9a4dbed5af91544c90e99f5917b70859a22094e416bbe8baa800a88b17be916d","cleanCloneUnchanged":true,"cleanCloneRemoved":true,"chromiumHashCheckpointsIdentical":true,"suites":[{"file":"browser-packaging/runtime-core/source-snapshot.test.cjs","tests":39,"pass":39,"fail":0,"cancelled":0,"skipped":0,"todo":0},{"file":"browser-packaging/runtime-core/presentation-plan.test.cjs","tests":119,"pass":119,"fail":0,"cancelled":0,"skipped":0,"todo":0},{"file":"browser-packaging/runtime-core/browser-isolation.test.cjs","tests":2,"pass":2,"fail":0,"cancelled":0,"skipped":0,"todo":0},{"file":"browser-packaging/runtime-facade/runtime.test.cjs","tests":47,"pass":47,"fail":0,"cancelled":0,"skipped":0,"todo":0},{"file":"browser-packaging/runtime-facade/formatter.test.cjs","tests":101,"pass":101,"fail":0,"cancelled":0,"skipped":0,"todo":0},{"file":"browser-packaging/runtime-facade/browser.test.cjs","tests":65,"pass":65,"fail":0,"cancelled":0,"skipped":0,"todo":0},{"file":"browser-packaging/runtime-facade/safety-plan-boundary.integration.test.cjs","tests":2,"pass":2,"fail":0,"cancelled":0,"skipped":0,"todo":0},{"file":"browser-packaging/runtime-facade/state-data.test.cjs","tests":31,"pass":31,"fail":0,"cancelled":0,"skipped":0,"todo":0},{"file":"browser-packaging/runtime-facade/browser-package-gap.test.cjs","tests":5,"pass":5,"fail":0,"cancelled":0,"skipped":0,"todo":0},{"file":"browser-packaging/integration/app-state-baseline.test.cjs","tests":20,"pass":20,"fail":0,"cancelled":0,"skipped":0,"todo":0},{"file":"legacy-dom.test.js","tests":6,"pass":6,"fail":0,"cancelled":0,"skipped":0,"todo":0},{"file":"browser-packaging/integration/app-analytics-basic.test.cjs","tests":28,"pass":28,"fail":0,"cancelled":0,"skipped":0,"todo":0},{"file":"browser-packaging/integration/app-analytics-generation.test.cjs","tests":14,"pass":14,"fail":0,"cancelled":0,"skipped":0,"todo":0},{"file":"browser-packaging/integration/app-analytics-persistence.test.cjs","tests":15,"pass":15,"fail":0,"cancelled":0,"skipped":0,"todo":0},{"file":"browser-packaging/integration/app-analytics-dom-isolation.test.cjs","tests":23,"pass":23,"fail":0,"cancelled":0,"skipped":0,"todo":0},{"file":"browser-packaging/integration/real-browser.test.cjs","tests":19,"pass":19,"fail":0,"cancelled":0,"skipped":0,"todo":0}]}
```
