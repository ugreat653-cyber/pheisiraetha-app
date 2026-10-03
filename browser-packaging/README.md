# PHASE 2B-3B-1 BROWSER PACKAGING REPORT

This directory implements only section 11 of the frozen production integration
specification. It consumes exact Git blobs in temporary staging directories and
produces one private, content-addressed IIFE. Loading it initializes the two
frozen modules inside the IIFE. It does not run Analysis/Safety evaluation,
publish a facade, access state, render, persist, or wire anything into the PWA.

Branch: `phase2b-browser-packaging`.
Required sole parent: `87c4e91c23d1c59bd4735d7fd75c41f35c533797`.
Commit message: `Implement frozen browser packaging boundary`.
The implementation commit's identity is the Git commit containing this report;
it is intentionally not embedded in its own contents.

## Rebuild

Use Node `24.19.0`, npm `11.9.0`, and exactly esbuild `0.25.5`.
The committed package-lock pins the tool and every optional platform package,
including their registry tarball integrity values. Lifecycle scripts are not
needed and are disabled during installation. No unpinned npx is used.

From the repository root, ensure the exact source commits are present (fetch
them if the checkout does not already contain them):

```sh
git fetch origin 94b112488e576e08495443d93c048a528c39aac7 74b77f0b821a93e1910e40f5c29c459c126e6d42
npm ci --prefix browser-packaging --ignore-scripts --no-audit --no-fund
npm run build --prefix browser-packaging
npm run verify --prefix browser-packaging -- --clean-install
```

`build.cjs` is the canonical config/command implementation. It verifies each
commit's blob identity and SHA-256 before materialization, copies bytes without
conversion, and verifies those bytes again after bundling. The build graph
must contain only the entry and the two frozen modules. Safety's literal
`require('./analysis.js')` must resolve to the one shared Analysis module.

The recorded profile is `bundle=true`, `platform=browser`, `format=iife`,
`minify=false`, `treeShaking=false`, `plugins=[]`, target `es2022`, UTF-8,
inline legal comments, no sourcemaps, no splitting, no name-preservation
instrumentation, no externals, no defines, no injects, no globalName, and no
banner/footer. Exact configuration is recorded in `build-manifest.json`.
Temporary absolute paths never enter emitted bytes or provenance records.

The builder refuses an unexpected existing artifact set. A future intentional
entry/config change requires an explicit review of that set; this checkpoint
does not select an arbitrary latest artifact or remove stale files silently.

## Frozen provenance

| Input | Exact Git commit | SHA-256 |
| --- | --- | --- |
| analysis.js | `94b112488e576e08495443d93c048a528c39aac7` | `a712af8fa74a8992e49972f9b217f268da444bcb062fa91824aee7cd9bbdf5da` |
| safety.js | `74b77f0b821a93e1910e40f5c29c459c126e6d42` | `ad6f6d57665c23fc87b49c1342e0a88ca32e4f77ceb2bb5377a21c043c177b70` |
| entry.cjs | This packaging commit | `40cab1b1f9913f25a9ae34bf35b47763dc7a232189e77fbe5f10f32f3b52a8a3` |
| package-lock.json | This packaging commit | `522a4f85fc330f7b9123de38c59aa7b77d7d0176ca19300f4805910afb210ec8` |

esbuild tarball integrity:
`sha512-P8OtKZRv/5J5hhz0cUAdu/cLuPIKXpQl1R9pZtvmHWQvrAUVd0UNIPT4IB4W3rNOqVO0rlqHmCIbSwxh/c9yUQ==`.

Installed Linux x64 binary-package integrity:
`sha512-uhj8N2obKTE6pSZ+aMUbqq+1nXxNjZIIjCjGLfsWvVpy7gKCOL6rsY1MhRh9zLtUtAI7vpgLMK6DxjO8Qm9lJw==`.

Generated artifact:
`artifacts/analytics-v1.45deb294b2ecc2a8a1f3bf7067d5822d0676841ab82c36d4c95db08b9bfa821a.js`.
SHA-256: `45deb294b2ecc2a8a1f3bf7067d5822d0676841ab82c36d4c95db08b9bfa821a`.
Size: 188,626 bytes.

## Verification evidence

Command executed: `npm run verify --prefix browser-packaging -- --clean-install`.
Full machine-readable results and fixture identities: `verification-results.json`.

| Required check | Observed result |
| --- | --- |
| Exact frozen input identities/hashes | PASS; both exact blobs and SHA-256 values verified |
| Frozen source bytes unchanged | PASS; temporary files and original Git blobs checked before/after |
| Exact Safety-to-Analysis resolution | PASS; esbuild graph and Node module cache both confirm one shared exact Analysis module |
| Load without external CommonJS/Node globals | PASS; twice loaded in an isolated browser-like VM without require/module/exports/process/Buffer |
| No global raw Analysis/Safety API | PASS; zero added/changed global properties, including no helpers, registry, results, plans or facade |
| No runtime network/CDN dependency | PASS; empty external/output imports; trapped network, DOM and storage APIs received zero accesses |
| Clean-input reproducibility | PASS; fresh detached spec-base checkout, copied build inputs only, empty npm cache, locked fresh install; artifact and manifest identical |
| Repeated canonical build | PASS; two independent temporary stages produce identical recorded artifact bytes/hash |
| Node-vs-bundled Analysis | 22 PASS / 0 FAIL; complete result equality, including empty/current/pair/window/revision/malformed/multilingual cases |
| Node-vs-bundled Safety | 15 PASS / 0 FAIL; 5 ALLOW, 2 HOLD, 8 UNKNOWN; MF3/MF4/E30, exact fallback identity and atomic suppression included |
| No source/input mutation | PASS; Node and bundled input values plus all frozen source bytes unchanged |
| No production changes | PASS; every one of the 17 spec-base tracked files remains byte-identical; all additions are under browser-packaging/ |
| main unchanged | PASS; remote main read at `255a5d9d27461dcacaebc1bc80ab322dd54b4de8`; no main commit/merge/push |
| CACHE / APP_VERSION | `pheisiraetha-v16` / `0.1.0`, unchanged |
| Deployment | None; no deployment command, PWA script wiring, cache update or activation |

The equivalence harness appends a test-only export to a separate temporary
entry and builds it in memory with the same pinned profile. Each VM input is
recreated in that VM's realm before invocation. Full results are compared
after transferring plain results to the Node realm. The test entry/artifact
is never written into the artifact directory or committed. Its marker is
explicitly verified absent from the production artifact.

Execution evidence is from an isolated JavaScript VM with browser-like globals,
not a graphical-browser/PWA/offline/deployment run. Those later integration
checks are outside this build-only phase. There was no packaging mismatch and
the full 470,120-assertion frozen Safety suite was not rerun.

Files added: `.gitignore`, `package.json`, `package-lock.json`, `entry.cjs`,
`build.cjs`, `verify.cjs`, `build-manifest.json`, `verification-results.json`,
this `README.md`, and the content-addressed artifact. No existing file changed.

Packaging blockers: none. Production analytics runtime, immutable evaluate
facade, adapter, plan builder, formatter, renderer, default-OFF PWA wiring,
legacy DOM hardening and offline activation remain separate future work.

Remote-publication blocker: automatic approval review rejected the attempted
push of the new branch. Its stated reason was that remote sharing was not
explicitly authorized and the GitHub destination was not established as trusted.
The complete implementation/evidence is committed locally; the branch has not
been published remotely. No workaround or alternate publication was attempted.
Explicit user approval of this branch push is needed to proceed with publication.
