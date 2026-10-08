# PHEISIRAETHA continuation plan — audited 2026-10-08

Status: draft preparation only. No public analytics activation or release is authorized.

## Verified remote checkpoints
- production main: 255a5d9d27461dcacaebc1bc80ab322dd54b4de8
- accepted 3B-5: 0593d4b62f30c978260c6a15ff54323bc1351cbd
- S1 harness: 9f327acae82054d2b9a28ea6f05ac48c53c65d71
- accepted S2: 9ab969284ff9fbc09af4ee1cc277eb8d7a0766b9
- S3 source-QA checkpoint: 7e583ac695be2b213d25591deab430664e682988
- S3 source branch: phase2b-3b6-s3-verifier-sourceqa
- S3 verifier blob: b86df83a9f928a6c679804fa4557e71b0ee70639
- exact S3 parent is accepted S2; S2→S3 changes only browser-packaging/verify.cjs.
- target accepted S3 branch phase2b-3b6-s3-verifier was absent during this audit.

Historical results (not rerun here): 3B-5 517 PASS / 15 suites; S2 19 PASS. S3 full route remains untested.

## First implementation package
Isolated CI-control branch based on frozen production main; frozen application source is checked out separately at exact S3 SHA.
Added paths only:
- .github/workflows/pheisiraetha-3b6.yml
- ci/3b6/run.cjs
- docs/PHEISIRAETHA_CONTINUATION_PLAN.md

The workflow runs on draft pull-request events targeting main. It has contents:read permissions, no deployment or push steps, pinned action commit IDs and no merge step.
Linux runner uses existing Chrome/Chromium. Node 24.19.0 and esbuild 0.25.5 are required; external Playwright 1.62.1 is selected and pinned in the orchestration. Preparatory tool installation occurs outside frozen source. Browser downloading is disabled.

Qualification records actual browser canonical path/version/SHA-256 and probes a blank headless page. The unchanged S3 route then executes exactly --3b6-tests-only.
Acceptance: 16 suites, >0 tests, all tests pass, zero fail/cancelled/skipped/todo/protected changes, identical Chromium hash checkpoints, unchanged source/dependencies, clean S2 clone unchanged and removed.
Logs and evidence stay outside frozen checkout. Preparation never edits frozen verifier, S1/S2 tests, artifact or production main.

## 3B freeze after full PASS
Independent review of exact S3 SHA, parent, verifier blob and complete run evidence. Mark only the exact tested commit accepted; preserve source-QA provenance.
Record default-OFF implementation, frozen artifact identity, suite counts and remaining public/offline boundary. Do not infer acceptance from source-QA or Pages deployment.

## Parallel 2B-4 preparation
Write detailed release contract and tests in a separate preparation branch. Keep ANALYTICS_ENABLED=false. Do not release or deploy this preparation.
Frozen artifact: browser-packaging/artifacts/analytics-v1.f1f975900faaa64649bcef42412c1856543c8716711d4119df9b964f4bf8c824.js
Artifact SHA-256: f1f975900faaa64649bcef42412c1856543c8716711d4119df9b964f4bf8c824
Frozen facade remains evaluate-only; release provenance/digests prove engine/Safety/registry/DTO coherence without changing the facade API.

Required release cases:
- new unused cache generation and exact mandatory asset set;
- critical asset fetch/integrity/quota failure rejects installation without disrupting prior active release;
- real cold online install→offline restart and warm offline workflows;
- v16→candidate service-worker transition with old and new clients;
- mixed-version/stale-generation/host replacement all fail closed;
- OFF gives zero evaluation and zero analytical DOM even with artifact cached;
- ON missing/corrupt/incompatible artifact, namespace collision, errors and malformed DTO remove analytical output while normal PWA remains usable;
- no analytics in state/localStorage/IndexedDB/export/import/Cache Storage;
- rollback installs a complete accepted release under another fresh cache generation.

Current source risks to exercise, not asserted runtime failures: sw.js does per-asset puts into candidate cache, global caches.match, skipWaiting/clients.claim and deletes other generations. Test partial cache exposure and already-open documents explicitly.

## Coherent 2B-4 candidate after 3B acceptance
Choose next unused production cache generation after checking current production; do not assume v17 is available.
Update only authorized release files for exact artifact loading and service-worker coherence; run dedicated browser/offline/upgrade/failure/persistence/rollback gates on the exact candidate.
Independent QA must assess both frozen safety contracts and release behavior.

## Final release approval and verification
Public OFF→ON transition, production merge and deployment require explicit approval of the tested exact release candidate.
After release, verify deployed source/artifact digests, active cache generation, cold/warm offline and rollback readiness.

## End-state scope
Current completion target: accepted frozen 3B, accepted coherent 2B-4 candidate, then approved public PWA activation and evidence.
Accounts/cloud sync, notifications and native app packaging are optional future iterations per PRODUCT_SPEC.md.

## Operational limitation
The local shell currently fails before process creation due to Windows restricted-token sandbox split writable-root handling. This is separate from WSL or Administrator state. GitHub read access works. No local installations or system changes are included in this plan.
