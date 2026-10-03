# PHEISIRAETHA — Production Integration Specification V1

PHASE 2B-3B-0 — PRODUCTION INTEGRATION SPECIFICATION FREEZE

- Status: **FROZEN_SPECIFICATION / CHECKPOINT_ONLY**
- Checkpoint date: 2026-10-03
- Repository: ugreat653-cyber/pheisiraetha-app
- Specification branch: phase2b-production-integration-spec

This document freezes the production integration boundary for a later isolated, default-OFF implementation of the frozen Analysis Engine and Safety v1. It is the implementation contract for that boundary. It does not implement, wire, merge, deploy, or activate analytics.

MUST, MUST NOT, and ONLY are normative requirements. The frozen engine, Safety implementation, Boundary Spec, and Template Registry retain their authority over their existing semantics. This specification constrains their integration; it does not amend their rules, catalog, thresholds, or canonical copy.

## Authoritative baselines and scope

| Item | Exact frozen value |
| --- | --- |
| Production main / this branch's required base | `255a5d9d27461dcacaebc1bc80ab322dd54b4de8` |
| Production CACHE | `pheisiraetha-v16` |
| APP_VERSION / stored source version | `0.1.0` |
| Frozen Phase 2A | `94b112488e576e08495443d93c048a528c39aac7` |
| Analysis engine version | `analysis-phase2a-beta-heuristics-v1` |
| Recorded Analysis acceptance | 101 PASS / 0 FAIL |
| Frozen Safety registry commit | `ba46070bbcd42af51fb534c3282dd8a350bcfb20` |
| Frozen Safety integration | `74b77f0b821a93e1910e40f5c29c459c126e6d42` |
| Frozen Safety branch | `phase2b-safety-v1-freeze` |
| Frozen Safety freeze commit | `0e97042aba92cafac3498e8a220cd4c81897ecb8` |
| Safety policy version | `safety-v1` |
| Registry version | `safety-registry-v1` |
| Recorded Safety acceptance | 729 PASS / 0 FAIL / 0 PENDING |
| Recorded Safety assertions | 470,120 |
| Registry | 30 entries: 25 INSIGHT, 4 WHY, 1 FALLBACK |
| Public INTERPRETATION / NEXT_FOCUS templates | 0 / 0 |
| Manifest / template versions in this integration | 1 / 1 |
| Sole addition in this checkpoint | `PHEISIRAETHA_PRODUCTION_INTEGRATION_SPEC_V1.md` |
| Required checkpoint commit message | `Freeze production integration boundary v1` |
| Required sole parent of the checkpoint commit | `255a5d9d27461dcacaebc1bc80ab322dd54b4de8` |

The Analysis and Safety acceptance counts are inherited verified baselines. No implementation or regression suite is rerun for this specification-only checkpoint.

The authoritative frozen documents are `PHEISIRAETHA_SAFETY_BOUNDARY_SPEC.md` and `PHEISIRAETHA_SAFETY_TEMPLATE_REGISTRY_V1.md` at the frozen Safety baseline. The executable baseline is the accepted integration, not an unintegrated earlier implementation. The freeze commit adds its administrative report without changing those executable bytes.

| Frozen file | SHA-256 of its bytes at the Safety freeze |
| --- | --- |
| analysis.js | `a712af8fa74a8992e49972f9b217f268da444bcb062fa91824aee7cd9bbdf5da` |
| safety.js | `ad6f6d57665c23fc87b49c1342e0a88ca32e4f77ceb2bb5377a21c043c177b70` |
| PHEISIRAETHA_SAFETY_BOUNDARY_SPEC.md | `76be33a075e06b2433b91d93e68815f6aaa65f222a44da1ce8d4b28f242ec021` |
| PHEISIRAETHA_SAFETY_TEMPLATE_REGISTRY_V1.md | `5a142d2b855c069678956e956d60eb635ea0fe947c69eaf6068088ec08458e5b` |

These sources are referenced by exact Git object identity. They MUST NOT be added to the production-based specification branch in this task. Future packaging may consume their exact blobs in an isolated build without rewriting them or merging the standalone branch's unrelated history into production.

## 1. Exact pipeline and ownership

The sole analytical path to production DOM is:

```text
committed production state
→ detached sourceSnapshot
→ frozen analyze(sourceSnapshot)
→ closed deterministic presentationPlan
→ frozen assessPresentation(...)
→ SafetyResult.presentation ONLY
→ trusted canonical formatter
→ render-only DTO
→ current-generation gate
→ atomic inert DOM rendering
```

| Boundary | Owner | Authority |
| --- | --- | --- |
| Committed state and its mutation/render generation | Existing app integration | Latest committed data and current mount only |
| Snapshot, Analysis, plan construction, Safety, formatting | Private analytical runtime | Frozen computation and closed registered presentation |
| Render-only DTO and generation check | App integration / private renderer | Current transaction's formatted approved text only |
| DOM construction and commit | Private renderer | Inert text and registered structural identity only |

No alternate analytical route may write to DOM. No preview, debug surface, heading, tooltip, hidden node, or accessibility explanation may render raw engine output before or outside Safety. Non-analytical existing UI remains separate and is subject to section 16's independent hardening requirement.

## 2. Transparent sourceSnapshot adapter

The adapter's only input is the latest committed production state supplied by the app. It MUST NOT read storage itself, collect DOM values, inspect drafts, or assemble a preferred analytical subset.

It MUST NOT consume wizard, risDraft, current UI language preference, onboarding state, previous analytical results, or incomplete form values. Saving a committed record through existing app behavior is the boundary after which that record becomes eligible for capture.

### Current production data shape

This table describes fields already present in production; it is not a new validator, schema, defaulting instruction, or field whitelist.

| Location | Existing contents to preserve |
| --- | --- |
| State root | version, legacy lang, intent, and every unknown stored own field |
| intent | id, createdAt, ris, cycles, and every unknown stored own field; intent may be null |
| intent.ris | primary, success, scope, nonGoals, constraints, rationale |
| cycles, in existing array order | Each stored cycle, including malformed entries |
| Cycle identity | id and createdAt, literally as stored |
| Cycle CIE | primary, success, scope, nonGoals, constraints, rationale |
| Cycle IEP | desire, belief, emotion, emotionIntensity, frequency, mental, practical, hours, actions |
| Cycle OOP | currentState, achievement, events, direction, evidence, external |
| Revision metadata | intentional and revision, including contradictions or invalid patches |

The legacy root lang field is preserved as opaque stored data. It is not the current language preference and MUST NOT influence selection, Safety, or formatting. The separate current UI language and onboarding keys are not read by the analytical runtime.

### Copying contract

sourceSnapshot MUST be deep detached, plain data, value-preserving, order-preserving, and provenance-preserving. No mutable object or array may be shared with committed state. Every stored own field is copied recursively, including unknown fields. Arrays retain their indices and order; IDs, timestamps, text, and explicit nulls retain their values. Missing properties remain missing.

Copying MUST preserve malformed-but-stored values literally. Numeric strings remain strings. Empty IDs remain empty. Duplicate IDs remain duplicated. Contradictory revisions remain contradictory. No snapshot operation may:

- repair or migrate data;
- sort, filter, truncate, deduplicate, or backfill cycles;
- generate IDs or rewrite timestamps;
- coerce strings/numbers, replace missing values with zero, trim, or normalize text;
- translate emotion labels;
- reconstruct historical RIS or reapply a revision;
- remove unknown stored fields.

The copy must use plain-data operations that preserve own keys safely, including a stored "__proto__" key as data rather than a prototype mutation. No user-provided path or callback is evaluated. Accessors, executable values, unsupported prototypes, or circular object graphs cannot be captured as plain stored data; inability to copy them causes a closed adapter failure, not repair or execution. This is a transport/representation check, not semantic validation of IDs, chronology, fields, or revisions.

A lossy JSON stringify/parse round trip is not an acceptable general copying strategy: it can drop properties or change unsupported/non-finite numeric values. The adapter must either preserve the supplied plain-data value exactly or fail closed; it must not silently turn a value into null or a default.

Existing load/import behavior remains authoritative for obtaining committed state. Syntactically invalid localStorage JSON is not a plain-data snapshot: preserve the existing loader's behavior and do not add an analytical salvage parser. If production accepts malformed parsed data, pass that committed data literally. Existing backup validation is not a substitute for the frozen Analysis/Safety checks, and MUST NOT be strengthened or replaced in this phase.

Exactly one sourceSnapshot is captured per transaction. The same object is passed to analyze and assessPresentation. No intervening recapture, reconstruction, normalization, or mutation is permitted. Detachment isolates it from subsequent state changes; optional freezing must not change its data.

Persistent keys remain exactly:

- pheisiraetha_v01
- pheisiraetha_language_v01
- pheisiraetha_onboarding_v01

APP_VERSION remains 0.1.0. No schema migration or new analytical key is permitted.

## 3. Analysis boundary

Frozen analysis.js MUST remain byte-unchanged. Invoke analyze(sourceSnapshot) inside the private analytical runtime. Do not supply caller-controlled options, locale, an external approval, or safetyDecision to manufacture a result.

The entire engineResult stays internal until Safety validates its intended presentation. Preserve internal interpretation, nextFocus, evidence, limitations, and selection metadata when the frozen boundary requires them; they remain validation data and do not become render authority.

The renderer MUST NOT receive engineResult, selected candidates, comparison data, or engine functions. No production global or supported browser API may expose window.analyze, window.Analysis, PHEISIRAETHA.analyze, or any equivalent raw Analysis export.

The internal version contract is pinned to the baseline table, including the engine's sourceCommit and sourceVersion. Mismatch causes a closed integration failure; it never selects a weaker presentation.

## 4. Closed deterministic presentationPlan

Every nonempty plan contains exactly these six fields:

```text
policyVersion
registryVersion
manifestId
manifestVersion
components
declaredAbsentSlots
```

policyVersion is safety-v1; registryVersion is safety-registry-v1; manifestVersion is 1. components is an ordered array matching the predetermined manifest exactly. declaredAbsentSlots is the exact ordered list for that manifest.

Each component contains exactly:

```text
componentId
surface
role
slot
templateId
templateVersion
ruleId
candidateId
engineSelector
bindings
```

componentId equals slot. surface fixes the selected candidate: PRIMARY means the existing engineResult.primary, SECONDARY means the existing engineResult.secondary. Candidate and rule IDs must be the selected IDs, not a caller-selected alternative.

For a candidate-based component, engineSelector is the complete registered tuple with exactly:

```text
ruleId, candidateId, key, metric, dimension, branch, variant
```

The tuple must match the frozen registry's registered selector, allowed surface, template identity/version/role, and actual selected engine metadata. The title key is only one internal identity field; titleKey-only matching is forbidden. It is never display copy.

### Closed mapping construction

The runtime uses only fixed registry-owned M/B/U/D/I/X mappings and the accepted frozen implementation's physical selector locations. It does not search arbitrary nested objects, execute path strings, guess missing metadata, or create a selector from arbitrary caller text.

| Selected rule | Registered factual row |
| --- | --- |
| REF-01 | E03 for CURRENT_KNOWN_CATEGORY; E02 for CURRENT_CATEGORY_UNAVAILABLE |
| QUAL-01 | E04 |
| CMP-01 / CMP-02 | E05 / E06 |
| TXT-01 / INT-01 / INT-02 | E07 / E08 / E09 |
| PRA-01 / PRA-02 | E10 / E11 |
| MEN-01 / MEN-02 | E12 / E13 |
| EMO-01 | E14 for known_non_other; E15 for other |
| EMO-02 | E16 |
| OUT-01 / OUT-02 | E17 / E18 |
| CTX-01 / CTX-02 | E19 / E20; CTX-02 remains SECONDARY only |
| REV-01 / REV-02 | E21 / E22 |
| REL-01 / REL-02 / REL-03 | E23 / E24 / E25 |
| MIX-01 | E26 |
| Each selected factual surface's values / selection / limitations Why | E27 / E28 / E29 |
| Primary capability Why, not a selected candidate | E30 |

E-row labels are documentation references, not template IDs. Use the exact templateId/templateVersion/role identities from the frozen 30-entry registry. This table neither adds templates nor replaces the catalog.

| Tuple discriminator | Frozen internal metadata used by the closed mapping |
| --- | --- |
| REF-01 branch and variant | Exact B1–B5 prompt-key identity and existing emotion mapping status; only their registered branch/category variants |
| QUAL-01 branch | Existing defaultProfile metadata; insufficient_basis or possible_default_profile |
| CMP-01 / CMP-02 metric | Selected ruleEvaluation.metric; only the frozen seven U metrics or frequency |
| INT-02 dimension | Existing interpretation.data.dimension; only the six D dimensions |
| MEN-01 branch | Existing low_or_down(iep.mental) condition metadata; decreasing or low_range |
| MEN-02 branch | Existing interpretation.data.observation; same_category_repeated or category_decreased |
| EMO-01 branch | Existing otherCategory metadata; other or known_non_other |
| EMO-02 / OUT-01 branch | Existing direction metadata; increased or decreased |
| REL-03 metric | Existing internalSource; mental or emotionIntensity |
| MIX-01 branch | Existing triggers in frozen priority: decision_patch_conflict, then practical_hours_opposed, then recorded_direction |
| Other registered candidate mappings | Their exact fixed registered tuple; no new metric/dimension/branch inference |

An internal read of a prompt key or interpretation.data for a registered discriminator does not authorize rendering that key, interpretation, or focus.

### Binding references and provenance

Every request binding contains exactly:

```json
{
  "name": "<exact registered binding name>",
  "selector": "<exact closed registered selector>",
  "sourceRefs": []
}
```

There is no supplied value, text, label, HTML, translation, or callback. Safety resolves values itself.

An existing cycle reference contains exactly arrayIndex, cycleId, path. The fixed source path is the existing intent.cycles[index] leaf covered by the registered selector. A current RIS reference contains exactly path. Its path is one registered intent.ris dimension. These reference strings are inert identities consumed by fixed readers, not executable general paths.

Indices are taken from the selected candidate's existing ruleEvaluation.usedArrayIndices in their existing order, with the corresponding usedCycleIds/evidence provenance. Do not independently find records by ID, sort them, or choose a subset. Identical engine evidence duplicates may be treated only as the frozen implementation already permits; conflicting/nonunique provenance cannot be repaired.

| Binding selector class | Exact requested sourceRefs |
| --- | --- |
| CURRENT(f), PAIR(f), SERIES(f), ENGINE_DELTA(f) | Existing selected record indices, each with the exact registered f leaf |
| ENGINE_ORDINAL | Selected pair's iep.frequency references |
| ENGINE_EMOTION_CURRENT / ENGINE_EMOTION_RECURRENT | Selected record set's iep.emotion references; never a raw label display value |
| ENGINE_DIMENSIONS | Last selected record's six CIE dimension references in D order, then six current RIS references in D order |
| ENGINE_DIMENSION | Selected records' one registered CIE dimension, then the matching current RIS reference |
| REVISION_KEYS / REVISION_EVENT_COUNT / REVISION_KEY_COUNTS | Existing selected event indices, each with intentional then revision references |
| U.metricLabel / U.units / U.scope / I.metricLabel / FIXED_FIELDS / SELECTED_RULE | Empty sourceRefs; values are frozen trusted constants or selected identity, resolved by Safety |
| No-binding entries | bindings is exactly an empty array |

D order is primary, success, scope, nonGoals, constraints, rationale. Only the frozen registry's actual required binding set is requested; gate-only metadata does not become an extra interpolated binding. Missing, extra, or unverifiable provenance cannot be silently omitted.

The plan builder grants no verdict. It must not rerank candidates, promote secondary, remove a failing component, retry a smaller manifest, exchange a failed template for another variant, or weaken evidence. If a complete registered request cannot be constructed, fail closed rather than fabricate or salvage it.

## 5. Manifest rules and exact E30

For current reachable selected output of the frozen engine:

| Existing selection | Mandatory manifest |
| --- | --- |
| primary non-null; secondary exactly null | MF3 / safety.manifest.primaryFactualWithCapability |
| primary non-null; secondary non-null | MF4 / safety.manifest.primaryAndSecondaryFactualWithCapability |

Both require the exact existing capability-gap tuple. Missing, partial, conflicting, or corrupted capability information is a failure, not legitimate absence. MF1/MF2 remain frozen catalog contracts but are unreachable for the current selected frozen-engine output and MUST NOT be manufactured by deleting capability information.

The four primary factual slots, in order, are:

1. primary.insight — PRIMARY / INSIGHT / exact selected registered factual template.
2. primary.why.values — PRIMARY / WHY / E27.
3. primary.why.selection — PRIMARY / WHY / E28.
4. primary.why.limitations — PRIMARY / WHY / E29.

The four secondary factual slots use the same suffix order with SECONDARY and the secondary prefix. Every secondary Why refers to the actual secondary's tuple.

MF3 order is the four primary slots, then primary.why.capability. Its declaredAbsentSlots is exactly:

```json
["primary.interpretation", "primary.nextFocus", "secondary"]
```

MF4 order is the four primary slots, then primary.why.capability, then the four secondary slots. Its declaredAbsentSlots is exactly:

```json
[
  "primary.interpretation",
  "primary.nextFocus",
  "secondary.interpretation",
  "secondary.nextFocus",
  "secondary.whyThisFocus"
]
```

MF3 contains five components; MF4 contains nine. A non-null secondary is part of the intended bundle even when its mapping fails; it cannot be discarded to obtain MF3.

E30 is exactly:

```json
{
  "componentId": "primary.why.capability",
  "surface": "PRIMARY",
  "role": "WHY",
  "slot": "primary.why.capability",
  "templateId": "safety.why.conditionAssessmentUnavailable",
  "templateVersion": 1,
  "ruleId": null,
  "candidateId": null,
  "engineSelector": {
    "capabilityPath": "capabilities.VAQUQA",
    "ruleId": "COND-01",
    "status": "capability_gap",
    "conditionSufficiency": "unavailable"
  },
  "bindings": []
}
```

COND-01 does not become a selected candidate, primary, secondary, instrument, warning card, or focus. Its only production presentation is the registered E30 Why slot within the complete primary bundle.

## 6. Empty analytical result

If engineResult.primary is exactly null, there is no analytical ALLOW presentation. Do not promote secondary or directly render fallback.

For this no-analysis case, the integration freezes one closed empty request, retaining the six-field plan envelope:

```json
{
  "policyVersion": "safety-v1",
  "registryVersion": "safety-registry-v1",
  "manifestId": null,
  "manifestVersion": 1,
  "components": [],
  "declaredAbsentSlots": ["primary", "secondary"]
}
```

The null manifestId is an internal no-analysis request marker, not a new registered analytical manifest or a claim of fallback approval. The empty request deliberately grants no analytical authority; frozen Safety records the empty/unapproved manifest and determines the verdict. With no independently applicable HOLD, its output is UNKNOWN / FALLBACK_ONLY. A trusted upstream HOLD remains HOLD under frozen precedence.

MF0 / safety.manifest.fallbackOnly is the registered OUTPUT fallback contract, not a caller-approved analytical downgrade. Never switch a failing MF3/MF4 to MF0 to obtain an analytical ALLOW. The fallback itself remains approved by frozen Safety without changing the original bundle verdict.

## 7. Safety boundary

Invoke exactly once for an evaluable transaction:

```javascript
assessPresentation({
  sourceSnapshot,
  engineResult,
  presentationPlan
})
```

No fourth authority channel exists. Do not pass locale, rendered text, a registry override, safe=true, a template or candidate override, LLM output, or fallback approval.

Precedence remains HOLD > UNKNOWN > ALLOW.

| Safety outcome | Permitted continuation |
| --- | --- |
| ALLOW with complete APPROVED_BUNDLE | Extract only SafetyResult.presentation for canonical formatting |
| HOLD with FALLBACK_ONLY | Suppress the entire analytical bundle; format only the Safety-produced registered fallback |
| UNKNOWN with FALLBACK_ONLY | Suppress the entire analytical bundle; format only the Safety-produced registered fallback |
| Exception, incompatible versions, malformed/incoherent result or mode | Closed integration failure; no analytical or manufactured fallback body |

The runtime checks the frozen version/mode contract before extracting presentation. componentResults and reason codes cannot independently authorize rendering. The renderer never receives them.

For APPROVED_BUNDLE, primary is non-null, fallback is null, every required factual/Why component is present, primary.interpretation and primary.nextFocus are null, and any secondary has interpretation null with no nextFocus property. For FALLBACK_ONLY, primary and secondary are null; only the registered fallback with empty resolved bindings is present.

An incomplete or incoherent approved shape cannot be repaired by removing fields/components. No primary-only salvage after secondary failure, averaging verdicts, retry, or retained earlier ALLOW is permitted.

ALLOW approves this registered factual presentation only. It does not establish objective safety, verified outcomes, causality, or advice. objectiveMeaning remains UNKNOWN and causality remains not_determined inside the frozen Safety result; the integration does not strengthen them.

## 8. No public Interpretation or Next Focus

There are zero public INTERPRETATION templates and zero public NEXT_FOCUS templates.

Production MUST NOT render engine interpretation, nextFocus, whyThisFocus, prompt keys, titleKey as display copy, rewritten advice, or generated recommendations. No focus slot may be added under a neutral heading or hidden in accessibility text.

Original internal fields remain intact only for required frozen validation and closed mapping. Their presence does not imply a public surface. No semantic generation, AI/NLP classification, or advice rewriting is introduced.

## 9. Trusted canonical formatter

Only SafetyResult.presentation may cross the Safety boundary into the formatter. It receives no sourceSnapshot, engineResult, caller plan, componentResults, or supplied display value.

The formatter owns immutable internal access to the exact frozen template catalog. That is a trusted implementation dependency, never an argument supplied by the caller or renderer. It converts approved templateId + templateVersion + Safety-resolved bindings into the exact registered canonicalText with the registered placeholder transforms.

The formatter must verify the supported presentation DTO version (safety-presentation-v1), mode, exact registered component identity and required binding names/types. Unknown templates, extra/missing bindings, unsupported transforms, or version/shape mismatches cause an all-or-nothing formatter failure. It does not rerun Analysis or independently resolve source values.

Only frozen transforms are permitted:

- Exact approved numeric/integer values as deterministic non-locale numeric text, without rounding, percentage conversion, or recomputation.
- Approved enum tokens and fixed trusted strings exactly as registered.
- Registered lists joined with ", "; basis record groups joined with "; ".
- Registered dimension/key ordering in D order, preserving zero key counts.
- The existing frozen ordinal categories increased, decreased, unchanged.

No Intl formatting, runtime translation, Markdown interpretation, caller HTML template, free-text synthesis, changed qualification, or additional sentence is allowed. Placeholder substitution is limited to registered names and already resolved values; it must not interpret resulting text as markup or a second template.

Every body retains all frozen punctuation and qualifications. The exact fallback is:

> No interpretation or next focus is shown here.

It may be formatted only from the actual Safety-produced fallback presentation. A hard-coded direct DOM fallback shortcut is prohibited.

## 10. Render-only DTO and inert rendering

The future runtime returns one immutable plain render-only DTO with exactly:

```text
dtoVersion
mode
lang
dir
components
```

dtoVersion is pheisiraetha-render-v1; lang is en; dir is ltr. mode is APPROVED_BUNDLE, FALLBACK_ONLY, or UNAVAILABLE. UNAVAILABLE is an integration-failure/no-render marker, not a Safety verdict or approved fallback. Its components array is empty and produces no analytical subtree.

Each formatted component contains exactly:

```text
componentId
surface
role
slot
templateId
templateVersion
text
```

text is the completed frozen canonical body. The other fields are approved structural identity. Components are in exact MF3/MF4 order, or one registered fallback. For the fallback, the trusted formatter supplies the catalog's fixed componentId/slot fallback, surface FALLBACK, role FALLBACK, its approved templateId and version 1.

No sourceSnapshot, engineResult, presentationPlan, Safety componentResults, raw bindings, candidates, interpretations, nextFocus, reason prose, or TEMPLATE_REGISTRY is present. Generations and state tokens belong to the app's private transaction, not this public DTO.

The renderer accepts only a DTO obtained through the current trusted transaction; it is not a public arbitrary-DOM/DTO API. It uses fixed element construction and textContent (or equivalent inert text-node operations). It does not select a template or interpret a caller selector.

No analytical body is inserted through innerHTML, insertAdjacentHTML, Markdown, or equivalent parsing. No independent analytical headings, captions, titles, tooltips, hidden explanations, data attributes containing engine data, or accessibility prose may be authored. Normal accessible text may mirror the approved body exactly; structural language/direction attributes add no prose.

The entire subtree is built while detached. Every required component must be constructed successfully before one atomic host replacement. Failure in any component discards the entire detached subtree, leaving no partial analytics. A FALLBACK_ONLY DTO replaces, rather than appends to, the previous bundle.

## 11. Browser packaging

Frozen analysis.js and safety.js are CommonJS; safety.js requires ./analysis.js. Both remain byte-unchanged.

The preferred frozen architecture is:

```text
exact frozen Git blobs
→ small non-frozen entry
→ pinned build-time bundler
→ generated IIFE browser artifact
```

Use an exact pinned esbuild version. Phase 3B-1 records its numeric version, lock/integrity data, build command, and input/output identities before accepting an artifact. A version range, unpinned npx download, latest tag, or browser CDN dependency is not sufficient. Numerical tool-version selection/build execution is a downstream packaging checkpoint; no bundler is installed or executed by this specification task.

Required build profile:

```text
bundle=true
platform=browser
format=iife
minify=false
treeShaking=false
plugins=none
no runtime network dependency
```

The build must be reproducible from the exact engine/Safety blobs and versioned non-frozen entry under the pinned toolchain. Record all other output-affecting options and avoid timestamps, randomness, machine-specific paths, dynamic requires, and environment substitutions that change semantics. Keep module exports private; do not configure a raw-export globalName.

The artifact is content-addressed by SHA-256 of its emitted bytes, for example analytics-v1.<full-sha256>.js. The artifact digest and its source/toolchain provenance are recorded with the future packaging freeze. The application/release refers to the exact generated name, not a mutable latest URL.

There is no runtime CommonJS loader, arbitrary-module resolution, or runtime fetch of code/registry/templates. Bundler-generated internal module machinery is confined to the artifact. Do not convert the whole PWA into a bundled application.

Existing launch.js → locales.js → app.js behavior remains unchanged in this checkpoint. Future default-OFF wiring must establish the immutable facade before any enabled call, with no ordering race. A missing/incompatible artifact when OFF must not affect existing PWA behavior; when enabled it fails closed.

## 12. Narrow immutable browser facade

The only permitted analytical browser facade is conceptually:

```javascript
PHEISIRAETHA_ANALYTICS_V1.evaluate(committedState)
```

The facade owns snapshot capture, frozen Analysis, deterministic plan construction, frozen Safety, and canonical formatting. Its only public operation is evaluate with the committed-state input; it returns only the immutable render-only DTO.

The facade object and its binding must be immutable. No analyze, assessPresentation, TEMPLATE_REGISTRY, engineResult, presentationPlan, raw interpretation, or raw nextFocus export is allowed. No debug/raw mode, alternate authority argument, diagnostics getter, exposed cache, or callback that receives internal objects is allowed.

evaluate is deterministic and read-only. It does not access DOM, storage, network, current UI locale, clock, or randomness. It does not render, persist, or self-start. On an integration failure it returns UNAVAILABLE with no bodies, or is caught by the host with the same no-render behavior. There is no stale-result cache.

The facade does not itself confer DOM authority on an arbitrary call. The production host's current-generation transaction and private renderer are required for mounting its DTO.

## 13. Generation and stale-result rule

Only a result belonging to the current committed state and current render generation can obtain DOM authority. Generation is private, ephemeral app state, never persisted or caller-provided.

Every relevant mutation invalidates analytical output before changing committed state:

- RIS creation/save/edit;
- completed check-in, including any existing intentional revision and cycle append;
- successful import;
- delete/reset.

Use this lifecycle:

```text
increment generation
→ remove old analytical DOM
→ commit/update normal state
→ capture new snapshot
→ evaluate
→ verify generation
→ construct detached analytical DOM
→ verify generation again
→ atomic commit
```

The transaction records the generation and intended host. Both gates require that this generation still owns the current committed state/render, the static feature flag remains enabled, and the intended host is the current live mount. No asynchronous gap may occur between the last check and atomic commit.

State mutation hooks must invalidate before in-place mutation, not only after persistence or rendering. Failed commit/persistence must not restore old analytical DOM. Normal application error behavior may continue, but analytics remains absent until a fresh transaction against a verified current committed state succeeds.

Every new render that replaces the analytical host also invalidates older render authority. Navigation and language switching must prevent a detached result from mounting in an obsolete host. Unsaved form changes are not committed analytical input; normal draft preservation remains unchanged.

Successful import replaces the analytical source only after existing import acceptance; capture the post-import committed state. Rejected import adds no synthetic cycle or analytical data. Async import completion cannot reuse an earlier ALLOW.

Delete/reset removes old analytical content before reset. Any later result must be evaluated against the reset state. No text from the deleted state may remain in visible, hidden, tooltip, or accessibility DOM.

Previous ALLOW MUST NOT survive a later HOLD, UNKNOWN, exception, import, delete, RIS mutation, completed check-in, or obsolete generation. Do not retain previous bodies while awaiting a new result. A stale result is discarded regardless of its verdict.

## 14. Failure behavior

Failure at adapter, Analysis, plan builder, Safety, formatter, renderer, version/coherence gate, or bundle loading fails closed. This includes inability to represent a snapshot, exceptions, unknown mappings, missing required components, incompatible versions, or unavailable browser facade.

| Failure point | Required effect |
| --- | --- |
| Before a coherent Safety presentation exists | Old analytics already removed; no analytical body and no direct fallback |
| Safety returns coherent HOLD/UNKNOWN | Entire original bundle suppressed; only Safety-produced exact fallback may proceed |
| Formatter fails | No body from any component, including fallback; no partial formatted DTO |
| Renderer fails while detached or committing | Clear/discard the complete analytical subtree; no partial or previous ALLOW |
| Generation/host check fails | Discard the result and detached subtree without mounting |
| Feature flag OFF | No pipeline call or analytical DOM |

Do not catch an exception and show engine title, interpretation, nextFocus, internal error/reason text, or a previously approved bundle. Failure may leave analytics absent; this is not permission to invent a new message/template.

No smaller-plan retry, secondary deletion, registry override, safe flag, or manually approved fallback is a recovery strategy. Recovery requires a new complete transaction under the same frozen contract.

## 15. Localization and RTL

Existing production retains all 31 UI languages unchanged:

en, de, ru, fr, es, it, pt, nl, pl, uk, cs, sk, hu, ro, bg, el, tr, sv, no, da, fi, ar, he, hi, zh, ja, ko, id, ms, th, vi.

Analysis and Safety remain locale-independent. Initial analytical bodies, including fallback, remain canonical English. Do not add translations, translation lookup keys, translated enum labels, locale-based number formatting, or an analytics locale parameter.

The analytical subtree is explicitly lang="en" and dir="ltr", including within Arabic/Hebrew or another RTL shell. Existing shell direction, navigation, draft preservation, and all normal UI dictionaries remain unchanged.

Changing current UI language must not change Analysis selection, Safety verdict, component identity, or canonical analytical text. A shell rerender obtains current-generation authority but cannot reinterpret data or choose another plan. Preserve raw stored emotion labels and rely only on the frozen engine's existing 31-language mapping.

## 16. Independent legacy DOM hardening

A known independent production issue exists: some state-derived Home/History rating values reach innerHTML without escaping when persisted state is malformed. For example, production Home interpolates last.oop.achievement and last.iep.desire as HTML; History has related state-derived rating surfaces.

This is not a frozen Safety defect. A safe analytical renderer cannot compensate for active content inserted by the legacy renderer before or outside the Safety boundary.

Fix it in a separate narrowly scoped DOM-hardening implementation/branch, 3B-H, before public analytical activation and preferably before default-OFF production wiring. Cover every affected state-derived interpolation with inert text or correct escaping, without coercing, repairing, migrating, or deleting stored data and without changing business logic.

Do not fix it, modify app.js, or add hardening tests in this specification task. This section records the prerequisite only.

## 17. One static default-OFF feature flag

The first future production wiring uses one static source-code feature flag, default OFF. The enabled path is entered only after that guard.

When OFF:

- the Analysis pipeline does not execute;
- the Safety pipeline does not execute;
- evaluate is not called;
- no analytical subtree, hidden preview, tooltip, or accessibility analytics exists;
- existing PWA behavior remains unchanged.

No query parameter, extra storage key, remote configuration, user-facing toggle, telemetry, or alternate flag can enable it. Merely loading an artifact must not evaluate state or start analytics. Missing artifacts while OFF must not disturb the current app.

This checkpoint does not create the flag or wire scripts. Default-OFF wiring is a later implementation phase and does not authorize switching it ON publicly.

## 18. Ephemeral storage contract

Analytics remains ephemeral. Do not persist engineResult, presentationPlan, SafetyResult, approved DTO, formatted analytical text, render generation, or sourceSnapshot.

No analytical storage key, schema migration, cached approval, localStorage/IndexedDB result, backup field, network record, or telemetry record is introduced. Existing JSON export/import contains only the unchanged production state. Service-worker caching of a static future executable artifact is release asset management, not permission to cache user results.

The facade and formatter have no storage access. App integration does not copy analytical objects into state. Returning to a screen recomputes only when enabled and under current-generation ownership; it does not recover a persisted ALLOW.

## 19. Offline and public activation remain separate

This specification does not authorize public activation. Current CACHE remains pheisiraetha-v16.

Phase 2B-4 is separately required for public/offline activation, with:

- the exact content-addressed analytical artifact in the release asset set;
- a new CACHE generation;
- coherence of app integration, entry/artifact, frozen engine, Safety, registry, and DTO versions;
- service-worker install/upgrade and controlled-client transition tests;
- cold/warm offline and cache-failure tests;
- mixed-version fail-closed behavior.

Do not change sw.js, ASSETS, production CACHE, HTML script loading, hosting configuration, deployment state, or feature activation in this checkpoint.

Those release/activation tasks are not part of 2B-3B implementation. Packaging an artifact or completing default-OFF wiring does not itself meet offline/public release requirements.

## 20. Integration test strategy

New integration tests verify the boundaries and lifecycle. They do not duplicate all 101 Analysis tests, 729 Safety tests, or 470,120 Safety assertions.

Use representative actual frozen outputs and synthetic committed-state fixtures. Boundary fault injection belongs only to a private test harness; it must never add production facade options, raw exports, registry injection, or an alternate evaluator. Where default production invocation cannot naturally generate a HOLD, exercise the host's HOLD contract with the real frozen Safety boundary in a private harness and record that reachability limit.

| Coverage | Required observation |
| --- | --- |
| Feature OFF | Zero evaluate/analyze/assessPresentation calls; zero analytical/hidden/a11y DOM; unchanged app behavior |
| Valid primary-only ALLOW | Exact five MF3 components; complete canonical bodies, including E30 |
| Valid primary + secondary ALLOW | Exact nine MF4 components; secondary uses its own approved identity and bindings |
| HOLD | Entire analytical bundle suppressed; no component salvage |
| UNKNOWN | Entire analytical bundle suppressed; no component salvage |
| Exact fallback | Actual Safety FALLBACK_ONLY; exact English sentence, empty resolved bindings; no alternate copy |
| Empty engine primary | Closed empty request invokes frozen Safety; no analytical ALLOW or secondary promotion |
| E30 | Exact selector/null candidate identity/empty bindings; COND-01 never becomes a candidate |
| Failed secondary or required Why | Primary also suppressed; no smaller manifest or retry |
| No Interpretation / Next Focus | No display in visible, hidden, title, tooltip, aria, or other DOM surfaces |
| No raw engine leakage | Renderer/facade output lacks raw keys, source, plan, candidates, bindings, registry, and engine APIs |
| ALLOW → HOLD | Previous bodies removed before replacement; exact fallback only |
| ALLOW → UNKNOWN | Previous bodies removed before replacement; exact fallback only |
| Stage exceptions | Adapter/Analysis/plan/Safety/formatter/renderer failures preserve no old ALLOW or raw text |
| Malformed parsed stored data | Values/unknown fields/order remain literal; Analysis/Safety decide; no adapter repair |
| Invalid localStorage JSON | Existing loader behavior unchanged; no analytical salvage or persistence |
| Accepted malformed import | Existing import acceptance preserved; exact snapshot then frozen gates; no stale approval |
| Rejected import | No analytical mutation or new result based on rejected data |
| Duplicate/blank IDs, invalid chronology | Remain literal in snapshot; cannot obtain authority through repaired provenance |
| Conflicting revisions | Preserved; no reapplication, inferred historical RIS, or hidden reconciliation |
| Import / delete/reset | Old DOM invalidated; only latest accepted/reset committed state can render |
| RIS edit / completed check-in | Invalidate before mutation; capture after existing save; unsaved drafts excluded |
| Stale generation / replaced host | Older detached results never mount, even if ALLOW |
| DOM atomicity | No preview-before-Safety; no partial bundle during construction or failure |
| Inert text | HTML-like approved text remains text; no script/attribute/markup interpretation |
| No mutation / no alias leakage | Committed state unchanged by analytics; captured snapshot stable; DTO deeply detached |
| No analytics persistence | Existing keys/exports unchanged; no results, source, approvals, or generations saved |
| 31-locale smoke | Selection/verdict/identity/canonical text unchanged; existing shell and draft behavior retained |
| Arabic/Hebrew RTL | English analytics subtree explicitly en/ltr; correct placement and unchanged body |
| Browser facade | One immutable evaluate operation; no raw Analysis/Safety/registry/debug API |
| Browser bundle parity | Same snapshot → same frozen Analysis/Safety result internally and same render DTO across Node/browser |
| Version mismatch / bundle unavailable | Fail closed when enabled; no stale output; OFF behavior unaffected |

Tests that observe internal engine/Safety values use private build/test instrumentation only. Production DOM tests assert actual mounted text/structure and absence of forbidden surfaces, rather than only checking a returned verdict.

A stronger one-time browser-packaging equivalence run may be used at the generated-bundle freeze because bundling transforms executable code. If the unchanged frozen suites are used there, record that as packaging equivalence evidence rather than adding duplicate integration test definitions. Do not execute that run during this specification checkpoint.

Legacy hardening tests belong to 3B-H. Service-worker/offline/public activation tests belong to Phase 2B-4. No new tests are implemented or run here.

## 21. Future implementation sequence and checkpoints

| Order | Phase | Scope |
| --- | --- | --- |
| 1 | 3B-1 Browser packaging | Exact blobs, small private entry, pinned toolchain/profile, reproducibility, content-addressed artifact and equivalence checkpoint |
| 2 | 3B-2 Analytics runtime | Transparent adapter, closed plan, frozen Safety invocation, canonical formatter, immutable render-only facade |
| 3 | 3B-3 Integration tests | Representative boundary/lifecycle/DOM coverage from section 20 |
| Parallel where safe | 3B-H Legacy DOM hardening | Separate narrow branch for existing Home/History interpolation bypass |
| 4 | 3B-4 Arbitration/integration | Reconcile isolated work against this spec and frozen baselines; no catalog/schema expansion |
| 5 | 3B-5 Default-OFF production wiring | Static OFF guard, mutation/render generations, private inert atomic renderer; no public activation |
| 6 | 3B-6 Real-browser/state/RTL verification | Actual browser state operations, 31-language shell smoke, Arabic/Hebrew isolation, stale-result and failure behavior |
| 7 | 3B freeze | Record accepted implementation, parity, source integrity, default-OFF status, and remaining release boundary |
| Only afterward | Phase 2B-4 offline/public activation | Separate release assets/CACHE/version/upgrade/offline/mixed-version checkpoint and activation authorization |

This is a future sequence, not authorization to perform those tasks now. The static feature remains OFF at the 3B freeze. Public activation remains outside this specification task and outside the 2B-3B implementation phase.

## Checkpoint verification and stop condition

This branch must start exactly from production main at 255a5d9d27461dcacaebc1bc80ab322dd54b4de8. Its specification commit must have that exact single parent and add only this Markdown file.

Repository/history checks for this checkpoint:

1. Confirm remote phase2b-production-integration-spec exists and points to the specification commit.
2. Confirm the branch's direct base and commit's sole parent are exactly the production baseline.
3. Confirm the only diff is an addition of PHEISIRAETHA_PRODUCTION_INTEGRATION_SPEC_V1.md.
4. Compare every pre-existing file's Git mode/blob identity and bytes against the baseline; all must be unchanged.
5. Confirm no Analysis/Safety source, test, registry, or boundary document was added or modified.
6. Confirm remote main remains at the exact production SHA.
7. Confirm sw.js and CACHE remain byte-unchanged at pheisiraetha-v16.
8. Confirm no implementation, production wiring, deployment, activation, or unnecessary test rerun occurred.

Freeze is complete after the requested remote branch/commit and verification report. Architectural implementation may proceed only in separately requested phases under this document. Legacy DOM hardening and the offline/public release checkpoint remain explicit later prerequisites.

STOP after the PHASE 2B-3B-0 PRODUCTION INTEGRATION SPEC FREEZE REPORT.
