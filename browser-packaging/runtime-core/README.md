# Analytics runtime core — Phase 2B-3B-2A

Base and required sole parent: `05ff32a421b7e013a91932516b97d577eb780405`.
Integration contract: `PHEISIRAETHA_PRODUCTION_INTEGRATION_SPEC_V1.md` at
`87c4e91c23d1c59bd4735d7fd75c41f35c533797`, sections 2–6.

The code in this directory supplies two pure build-internal operations. Existing
`entry.cjs`, IIFE bytes, build infrastructure and production files retain their
packaging-base bytes. These modules have no production loading path or browser
global. No facade, Safety orchestration, formatter, renderer, DOM, storage, feature
flag or production wiring is added.

## Snapshot contract

`source-snapshot.cjs` exports `buildAnalysisSourceSnapshot(committedState)` for
private composition. Its only data input is the supplied committed state.
Descriptor-only traversal preserves every enumerable own string key, plain-data
value, array index/order, explicit null, unknown property and malformed stored
value. It preserves finite numbers including signed zero, current RIS, CIE, IEP,
OOP, revisions, IDs and timestamps literally. It performs no normalization or
semantic validation. Own `__proto__` keys are defined as inert data.

All nested containers are new. Repeated aliases are copied as independent JSON
values. Records with Object.prototype or null prototypes and dense ordinary arrays
are supported. Accessors, executable values, unsupported prototypes, circular
ancestors, symbols, undefined, BigInt, nonfinite numbers, sparse arrays, extra
array properties and nonenumerable record properties cannot be faithfully
represented with JSON membership and produce `SOURCE_NOT_JSON_PLAIN_DATA`.
Getters and `toJSON` are never invoked. Proxies are outside the frozen plain-data
contract; reflection is not claimed to certify hostile Proxy behavior.

## Plan contract

`presentation-plan.cjs` exports the narrow BUILD-INTERNAL operation
`buildPresentationPlan({ sourceSnapshot, engineResult, trustedRegistry })`.
The dependency must be the immutable `TEMPLATE_REGISTRY` from exact frozen
`safety.js`. Its presentation identities, binding selectors, versions, surfaces
and complete tuple inventory are checked against the private closed catalog.
The later facade must bind this dependency permanently inside composition; there
is no browser API, registry registration or runtime registry-injection surface.

Selected candidates are read only from engineResult.primary/secondary. Exact
seven-field tuples include all nulls and are matched with registered surfaces and
template identity/version/role. Discriminators use only the fixed physical fields
named in section 4. Evidence identities and raw-source provenance are checked
with explicitly enumerated leaf readers, including required own membership.
Identical frozen evidence duplicates are inert; conflicting duplicates fail.
Every binding request has only name, selector and sourceRefs. Logical selectors
remain inert identities, with no arbitrary object-path evaluator or display-value
construction. Range/threshold, category normalization and full analytical Safety
gates remain owned by the unchanged frozen modules.

MF3 always has five components; MF4 always has nine. Their component order,
absent slots, E27/E28/E29 identities and E30 capability request are exact.
Missing/mismatched primary, secondary, registry, capability or required provenance
throws a fixed-code `RuntimeCoreFailure`; a partial/weaker plan is never returned.
No source/engine/registry values or exception causes are included in failures.
For engineResult.primary exactly null, section 6's six-field empty request has
manifestId null, no components and absent slots primary/secondary. MF0 fallback
approval belongs to frozen Safety.

## Focused verification

From the repository root, with the unchanged pinned packaging dependencies:

```sh
node browser-packaging/runtime-core/verify.cjs
```

This command runs only the three focused test files and records deterministic
evidence in `verification-results.json`. It materializes exact frozen Git blobs
only in temporary test directories. Analysis/Safety sources and their full test
suites are never added, rewritten or run. Existing esbuild is exactly 0.25.5;
the original lockfile remains unchanged.

The 160 passing checks include the adapter preservation/detachment/failure cases,
exact empty/MF3/MF4/E30 requests, negative mapping/provenance/registry cases,
no promotion/downgrade, no arbitrary text/values, no mutation and deterministic
repetition. Actual frozen selections across 48 synthetic scenarios cover all 25
INSIGHT identities and all 48 currently reachable registered candidate tuples,
with 48 ALLOW results from the unchanged Safety test oracle. Two additional
MIX cases check branch priority. The other four registered tuples are REF B1/B2
variants; actual selections stay QUAL-01/REV-01.

An in-memory TEST-ONLY IIFE checks Node/browser core parity for all 48 scenarios
with blocked IO/DOM/storage/Node globals and failing clock/random stubs. Its
temporary export is never written to the production entry or artifact. The
committed 3B-1 artifact still adds or changes zero globals. All packaging-base
files are compared byte-for-byte, including production files, CACHE and entry.

Preserved artifact SHA-256:
`45deb294b2ecc2a8a1f3bf7067d5822d0676841ab82c36d4c95db08b9bfa821a`.

Publication is a single commit on `phase2b-analytics-runtime-core`, followed by a
scoped branch push and separate remote SHA/sole-parent/main checks. No merge, PR,
tag or deployment is part of this checkpoint.
