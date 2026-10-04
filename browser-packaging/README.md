# PHASE 2B-3B-2B ANALYTICS RUNTIME COMPOSITION REPORT

This phase composes the accepted runtime core, exact frozen Analysis/Safety,
private canonical formatter and immutable browser facade. It does not load the
artifact from the PWA or add rendering, storage, host transactions, feature flags,
network calls, deployment, a merge or a PR.

Branch: `phase2b-analytics-runtime-facade`.
Required sole parent / accepted 3B-2A core:
`eb24cac88bf82fc9ebc38914a90bc47829a6adcb`.
Commit message: `Compose analytics Safety formatter facade`.
The implementation commit is the Git commit containing this report; its SHA is
not embedded in its own contents. Authoritative integration specification:
`87c4e91c23d1c59bd4735d7fd75c41f35c533797`.
Safety v1 freeze: `0e97042aba92cafac3498e8a220cd4c81897ecb8`.

## Runtime contract

The sole operation is `PHEISIRAETHA_ANALYTICS_V1.evaluate(committedState)`.
The object and operation are frozen. Its global property is non-writable and
non-configurable, with no getter/setter. Any pre-existing own or inherited
namespace binding rejects loading without reading a getter or overwriting it.
Loading initializes private modules but never evaluates committed state.

Each explicit one-argument evaluation executes snapshot capture, frozen
`analysis.analyze`, the accepted closed plan builder bound to the exact frozen
`safety.TEMPLATE_REGISTRY`, one frozen `safety.assessPresentation` call, the
Safety-version/verdict/mode coherence gate, presentation-only formatting, and
DTO construction. No retry, reranking, weakening, salvage or cached result exists.
Integration failures produce a new body-free `UNAVAILABLE` DTO. Empty analysis
uses the accepted null-manifest request and passes through actual frozen Safety;
only its coherent registered fallback is formatted.

The private formatter receives only `SafetyResult.presentation`. All 30 bodies
and binding definitions come from the frozen registry. The only local scalar
tables are the registry's private U/I metric labels, units and time-scope tokens;
there is no second text catalog. Exact identity, version, role, bindings,
placeholders, transforms, ranges, completeness and order are checked before any
output crosses the boundary. Any mismatch rejects the entire format.

Approved numeric values use deterministic ECMAScript numeric strings; accepted
negative zero is explicitly `-0`. No rounding, percentage conversion, derived
arithmetic or locale formatting is performed. Ordinary lists use `", "`; basis
groups use inner `", "` and outer `"; "`. Dimension keys retain frozen D order
and all six revision counts, including zero. Strings are substituted once as
inert text, without Markdown, HTML, translated prose or a second template pass.

Every return is newly constructed detached plain data, deeply frozen, with
exactly `dtoVersion`, `mode`, `lang`, `dir`, `components`. Constants are
`pheisiraetha-render-v1`, `en`, `ltr`. MF3 has five components and MF4 nine in
the frozen order; fallback has one registered component; `UNAVAILABLE` has none.
Each component contains only `componentId`, `surface`, `role`, `slot`,
`templateId`, `templateVersion`, `text`. Raw state, bindings, plans, results,
selectors, reasons, registry, Interpretation and Next Focus never leave runtime.

## Build and provenance

Use Node `24.19.0`, npm `11.9.0` and exactly esbuild `0.25.5`.
`package.json` and the complete integrity-bearing lock remain byte-identical.
No version ranges or unpinned npx resolution are introduced.

```sh
git fetch origin 94b112488e576e08495443d93c048a528c39aac7 74b77f0b821a93e1910e40f5c29c459c126e6d42 eb24cac88bf82fc9ebc38914a90bc47829a6adcb
npm ci --prefix browser-packaging --ignore-scripts --no-audit --no-fund
npm run build --prefix browser-packaging
npm run verify --prefix browser-packaging -- --clean-install
```

`build.cjs` materializes the exact Git blobs without conversion and the four
unchanged accepted core production files plus three composition modules.
The ten-file input graph contains no tests or evidence. Safety's exact
`require('./analysis.js')` still resolves to the one exact frozen Analysis module.
The 3B-1 output-affecting profile remains unchanged: `bundle=true`,
`platform=browser`, `format=iife`, `minify=false`, `treeShaking=false`, `plugins=[]`,
target `es2022`, UTF-8, inline legal comments, no sourcemap/splitting, externals,
defines, injects, globalName, banner or footer. There is no external runtime
CommonJS loader, CDN, network code fetch or registry fetch.

`build-manifest.json` records the full config, command, frozen Git commit/blob
identities, accepted core commit, all seven runtime source Git blobs/SHA-256s,
entry hash, pinned tool/lock integrity, exact input graph and artifact hash.

| Input | Exact source commit | SHA-256 |
| --- | --- | --- |
| analysis.js | `94b112488e576e08495443d93c048a528c39aac7` | `a712af8fa74a8992e49972f9b217f268da444bcb062fa91824aee7cd9bbdf5da` |
| safety.js | `74b77f0b821a93e1910e40f5c29c459c126e6d42` | `ad6f6d57665c23fc87b49c1342e0a88ca32e4f77ceb2bb5377a21c043c177b70` |

Current artifact (explicitly selected by manifest):
`artifacts/analytics-v1.f1f975900faaa64649bcef42412c1856543c8716711d4119df9b964f4bf8c824.js`.
SHA-256: `f1f975900faaa64649bcef42412c1856543c8716711d4119df9b964f4bf8c824`.

The historical 3B-1 artifact is intentionally retained byte-identical alongside
the current artifact; no in-place edit, silent deletion or "latest" selection:
`artifacts/analytics-v1.45deb294b2ecc2a8a1f3bf7067d5822d0676841ab82c36d4c95db08b9bfa821a.js`.
Historical SHA-256: `45deb294b2ecc2a8a1f3bf7067d5822d0676841ab82c36d4c95db08b9bfa821a`.
Neither artifact is loaded by production in this phase.

## Focused verification evidence

Command executed:
`npm run verify --prefix browser-packaging -- --clean-install --write-evidence`.
`verification-results.json` records all case names and reproducibility evidence.

| Boundary | Result |
| --- | --- |
| Composition/failure/DTO tests | 47 passed, zero failures |
| Formatter tests | 101 passed, zero failures; all 25 INSIGHT + four Why + registered fallback |
| Actual browser artifact tests | 65 passed, zero failures; 54 complete Node-vs-bundled evaluate parity cases |
| Pipeline/Safety | Exactly one call for transactions reaching Safety; actual UNKNOWN/HOLD fallbacks; incoherence/errors give UNAVAILABLE |
| Text authority | 48 actual frozen Safety-approved scenarios; canonical bodies checked against exact frozen registry document |
| Facade | Exactly one intended global/operation; frozen object/function and immutable binding; collision refusal; no raw/test exports |
| I/O | Zero trapped DOM/storage/network/current-clock/random/locale accesses; no load-time evaluation |
| DTO | Exact keys, components/order, en/ltr; detached/deeply frozen; no internal references or diagnostic fields |
| Reproducibility | Two fresh stages plus clean exact-base checkout, absent node_modules, empty npm cache, locked install; artifact and manifest byte-identical |
| Source/scope | Exact frozen hashes and bytes; all accepted core and production/spec files unchanged |
| Production constants | `CACHE=pheisiraetha-v16`, `APP_VERSION=0.1.0`, unchanged |

The artifact is executed in an isolated JavaScript VM with trapped browser APIs,
without external Node/CommonJS globals. This is focused composition verification;
graphical-browser/PWA host integration and arbitration remain later phases.
Private test instrumentation changes only in-memory module exports or a separate
in-memory test entry. Its counter/export marker is absent from the production
artifact, and all staged production bytes are checked unchanged afterward.
Neither the full 470,120 Safety assertions nor all 101 frozen Analysis tests
were rerun. No Phase 3B-3/3B-4 suite or legacy-hardening merge was performed.

Changed existing packaging files: `build.cjs`, `entry.cjs`, `verify.cjs`,
`build-manifest.json`, `verification-results.json`, this `README.md`.
Added production files: `runtime-facade/safety-contract.cjs`,
`runtime-facade/canonical-formatter.cjs`, `runtime-facade/runtime.cjs` and the new
artifact. Added focused test files: `runtime-facade/test-support.cjs`,
`runtime-facade/runtime.test.cjs`, `runtime-facade/formatter.test.cjs`,
`runtime-facade/browser.test.cjs`.

Only the facade branch is authorized for publication. Remote branch SHA, sole
parent, main and other remote refs must be checked after push. No implementation
or packaging blocker was found; authentication/publication status is reported
separately when the exact implementation commit is published.
