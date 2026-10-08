# PHEISIRAETHA — Phase 2B-4 Release Contract

Status: PREPARATION_ONLY / RUNTIME_VERIFICATION_PENDING. This contract prepares the offline release boundary. It does not authorize deployment, public analytics activation, or modification of frozen executable sources or verifier.

## Baseline and prerequisites

Repository: ugreat653-cyber/pheisiraetha-app. Inspected source: 7e583ac695be2b213d25591deab430664e682988. Authority: PHEISIRAETHA_PRODUCTION_INTEGRATION_SPEC_V1.md, sections 17–21.

Existing worker generation: pheisiraetha-v16. Production ANALYTICS_ENABLED remains false. Exact frozen 3B-6 runtime acceptance and independent 3B freeze are prerequisites for release qualification. They are pending at preparation time; no report identity or runtime PASS is implied.

Selected artifact: browser-packaging/artifacts/analytics-v1.f1f975900faaa64649bcef42412c1856543c8716711d4119df9b964f4bf8c824.js

SHA-256: f1f975900faaa64649bcef42412c1856543c8716711d4119df9b964f4bf8c824. Size: 243504 bytes. DTO: pheisiraetha-render-v1. Safety policy: safety-v1. Registry: safety-registry-v1. The historical analytics-v1.45deb294 artifact is never an automatic substitute.

## Scope

This preparation checkpoint adds only docs/phase2b-4/RELEASE_CONTRACT.md. A later isolated implementation may add a deterministic release inventory, immutable release assets and private qualification tests, and change sw.js, index.html and app.js only for required release loading, coherence and worker registration.

Frozen Analysis, Safety, registry, facade, verifier/specification, analytical semantics, storage schema and APP_VERSION remain unchanged. Production remains OFF. Deployment and public ON activation require approval of an exact tested release candidate.

## Release identity and installation

One deterministic inventory pins every required asset by exact URL, byte count and SHA-256, plus accepted integration, entry, build-manifest, artifact, frozen source, Safety, registry and DTO identities. releaseDigest is SHA-256 of a documented canonical serialization excluding its own digest field. Timestamps, random identifiers, mutable latest URLs and self-referential hashing are prohibited.

The worker independently pins the inventory; a mutable network manifest cannot redefine trusted bytes. Select a new unused release-specific cache generation after checking current production. Application storage keys are not release markers. Cache Storage may contain static assets and release metadata only.

A release becomes usable only after every mandatory asset is fetched, validated and stored successfully. A completion marker is written last. Partial candidates cannot serve traffic. This promises atomic release availability, not a multi-entry Cache Storage transaction. Failure cleanup first settles outstanding writes and never deletes the active or retained prior complete release.

Critical assets resolve from the serving worker's own inventory and cache. Global cross-cache lookup, arbitrary network replacement and individual fallback to another release are prohibited. Any repair must meet that same release's URL and hash. Initial uncontrolled loads must pin executable bytes and script order; the exact facade must exist before enabled evaluation. No facade operations or runtime activation switches are added.

## Upgrade and rollback

Updates preserve the normal waiting phase. No unconditional skipWaiting or clients.claim may force a new worker onto already-loaded old clients.

v16 uses global caches.match and unverified network fallback. Candidate entries therefore must be invisible to canonical v16 requests, for example through release-specific internal cache keys. Legacy executable cache misses require retained legacy executable URLs/bytes or a separately qualified bridge strategy. Omitting skipWaiting alone does not prove coherent migration.

Rollback selects an entire prior verified release under a fresh worker/cache generation; it never mixes individual old assets into a new shell. A retained cache alone does not prove that a redundant worker can reactivate.

## Qualification matrix

Every row requires actual browser observations. All listed oracles must hold for PASS; otherwise record FAIL or ENVIRONMENT_BLOCKED.

| ID | Scenario | PASS oracle |
| --- | --- | --- |
| OFF-01 | Online/offline OFF loads | Zero evaluate/analyze/assessPresentation calls and zero visible, hidden or accessibility analytical DOM; ordinary app behavior preserved. |
| INSTALL-01 | Complete first install | All mandatory responses match inventory; all writes finish before completion marker; selected worker serves only this complete release. |
| FETCH-01 | 404, non-OK, opaque, unexpected redirect or interrupted mandatory fetch | Candidate unsealed and unusable; no activation; established active release remains intact. |
| HASH-01 | Incorrect response bytes or size | Reject candidate and never serve wrong response as qualified; established release remains intact. |
| QUOTA-01 | Injected cache.put/quota failure | No seal or usable partial release; outstanding writes settle before cleanup; prior complete release survives. |
| COLD-00 | Never-installed profile starts offline | No coherent release or invented fallback is claimed; zero analytics. |
| COLD-01 | New browser process starts offline after install | Complete pinned shell and selected artifact load from qualified cache without network dependency or other-generation substitution. |
| WARM-01 | Controlled offline reload/navigation | Same complete release remains usable; normal state operations retain existing behavior. |
| CACHE-01 | Missing/corrupted required cached asset | Reject unverified bytes and cross-release substitutes; next affected load/evaluation fails closed with no partial analytics. |
| MIX-01 | Two v16 clients stay open during candidate install | Candidate waits; old clients keep their coherent executable generation; no forced controller transition. |
| MIX-02 | Old v16 executable request misses its cache while candidate waits | v16 cannot read candidate bytes from staging caches; qualified legacy network/bridge strategy preserves coherence. |
| UPGRADE-01 | Last old client closes, app reopens | New controller serves one complete verified release with exact app/artifact identities and no obsolete asset. |
| DIGEST-01 | Altered app/entry/artifact/provenance/DTO identity | Reject incoherent inventory or bytes; enabled affected transaction mounts no analytics; no historical artifact substitution. |
| ON-01 | Private static-ON fixture with missing/incompatible artifact/facade/DTO | Remove old/partial analytical DOM for affected transaction; no raw result/manual fallback; production stays OFF. |
| STORE-01 | Evaluation/rendering/failure/upgrade/import/export/rollback | No analytical result, snapshot, approval or generation in user state/storage/backup/network/telemetry; no new analytical schema/key. Only static assets/release metadata enter cache. |
| ROLLBACK-01 | Whole-release rollback after upgrade | Fresh generation selects complete prior verified release without asset mixing and preserves user data. |

ON-01 is a private fixture with a coherent inventory. It introduces no production query parameter, storage toggle, facade option, injected registry or alternate evaluator. Cache loss cannot revoke already-loaded verified code; CACHE-01 observes the next affected load/evaluation.

## Evidence and exit gate

Record candidate commit, releaseDigest, worker/cache generation, browser/Node versions, controller transitions, response URL/hash provenance, injected failure, DOM/call counts, storage comparison and result for every row.

Frozen browser/state/RTL evidence is prerequisite; these lifecycle checks supplement it and never replace or edit frozen tests. Preparation may finish after contract review with runtime still pending.

A release candidate is qualified only after accepted 3B freeze, every matrix row PASS, exact source/artifact integrity evidence, production OFF and whole-release rollback evidence. Qualification does not authorize deployment or public activation.
