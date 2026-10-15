Hosted-offline repair — separate candidate

Review baseline: GitHub PR #9, commit 968ebc2d3e9bb463009dd78721caac97e92cf1d4, tree 10c08961756959147d4cd0ba66a1628547c6ff79. The local equivalent tree is at 2c20093. Frozen Sites source eb719248 and its 19-file fixture are unchanged.

Root cause: Sites returns 307 from /index.html to /, then injects dynamic Cloudflare script into root HTML. The frozen worker rejects redirects and exact-byte mismatches.

Repair: build.cjs derives the candidate generator from exact frozen source using single-occurrence patch anchors. It embeds original index.html bytes as base64 in sw.js and passes decoded bytes through the same SHA/length verifier. All eight other cached assets keep strict fetch/status/redirect/opaque/hash checks. All nine original assets and their digest remain unchanged. Cache and seal use policy embedded-shell-v1. Only exact root and index navigation without query receives the verified shell. Platform, foreign, query and unknown routes remain network-owned. No forced activation, cache deletion or IndexedDB changes.

Build output must be outside the review checkout and cannot target the frozen Site. The new Sites identity is preserved. The generated prepare-preview.cjs is deliberately excluded because its frozen identity must not be reused.

Checks:
- 29 in-memory VM tests execute actual generated install/activate/fetch handlers, including embedded/static corruption, redirects, HTTP/auth HTML, partial install, cache quota/put, old seals and route restrictions.
- 27 local Chromium desktop/Samsung and WebKit iPhone emulation scenarios passed against the new worker.
- The new CI step independently repeats both suites; its localhost results do not qualify hosted offline.
- hosted.test.cjs qualifies the real separate Sites origin with synthetic new contexts. Its credential is supplied only on hidden stdin, scoped to the Site and never stored. All foreign requests are blocked. Physical devices and user sign-in sessions remain separate acceptance evidence.
- Hosted evidence is recorded only after execution; no placeholder PASS.

The original preview, production main, protected source and frozen Analysis/Safety remain unchanged. No merge or production deployment is authorized.

Run build:
node product-v2/hosted-offline/build.cjs <separate-output-directory>

Run VM tests:
PHEISI_OFFLINE_ROOT=<output> node --test product-v2/hosted-offline/worker.test.cjs

Hosted browser qualification also requires PREVIEW_PLAYWRIGHT and PLAYWRIGHT_BROWSERS_PATH; launch in a TTY and supply the supported Sites service-access credential through hidden stdin. Do not put credentials in arguments, source, files or CI.

Observed hosted outcome

The actual hosted attempt failed: 1 static-byte/routing PASS, 8 failures before worker qualification (three activation checks and five fault cases). No hosted offline PASS. Follow-up on a fresh Chromium context found document.readyState complete and ServiceWorker supported, but native register() failed because fetching /sw.js returned HTTP401. An explicit service-header HTTP fetch of the exact same worker returned200 with the expected SHA. The service-access header is not authenticating the native browser worker-script fetch in this profile. No active registrations or cache existed.

This is an authorization blocker for this automated qualification, not proof of failure in a normal signed-in owner session. hosted-attempt.json preserves the failed result without rewriting it. qualification-status.json records the diagnosis, exact Site source/deployment and limited test scope. CONNECT transport and fault cases remain unqualified on hosting because registration was blocked.

Owner physical test: open the separate private URL online, sign in normally, allow initial loading and reload online once; create two synthetic intentions, save a draft for one, then enable airplane mode and reload root and /index.html. Resume the same answers, explicitly complete once and verify the other intention has its own history. First-ever visit while offline is not supported. Keep data on the old preview: the new origin has isolated storage and no automatic migration.
