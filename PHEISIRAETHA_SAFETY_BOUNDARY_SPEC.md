# PHEISIRAETHA — Safety Boundary Specification

**PHASE 2B-1D — SAFETY SPEC INTEGRATION**

Date: 2026-10-03. Policy identifier: `safety-v1`. Specification status: **FROZEN_POLICY / SPECIFICATION_ONLY**. This document authorizes no implementation, UI release, commit, push, or deployment in Phase 2B-1D.

| Reference | Frozen value |
| --- | --- |
| Repository | `ugreat653-cyber/pheisiraetha-app` |
| Base remote branch | `phase2a-analysis-engine` |
| Base remote commit | `94b112488e576e08495443d93c048a528c39aac7` |
| Base commit message | Add tested deterministic analysis engine prototype |
| Production baseline | `255a5d9d27461dcacaebc1bc80ab322dd54b4de8` |
| Production CACHE | `pheisiraetha-v16`; unchanged |
| Persisted source version | `0.1.0`; unchanged |
| New deliverable | Only `PHEISIRAETHA_SAFETY_BOUNDARY_SPEC.md` |

### Integration basis and authority

This specification integrates the completed independent reviews: **A — PHASE 2B-1A SAFETY POLICY REPORT; B — PHASE 2B-1B RULE SAFETY AUDIT; C — PHASE 2B-1C SAFETY TEST PLAN**. Their findings and test families were recovered from the completed conversations. The owner's Phase 2B-1D decisions override conflicting earlier proposals. Phase 2A was consulted only to verify identifiers, source paths, output contract, and key construction; the audits were not restarted.

Report C originally qualified its remote-source identity as unconfirmed. This integration used a detached checkout fetched from the named remote branch at the exact base commit. The engine and specification identities match the existing local source copies; the historical qualification is not retroactively removed from report C.

| Difference or previous open item | Safety-v1 resolution |
| --- | --- |
| A permits independently allowed components after another component fails; C suppresses the bundle | C's atomic suppression is authoritative. Internal component verdicts never permit partial release. |
| Longer or contextual fallback proposals | Replaced with the one fixed sentence in section 27. |
| Raw text inside generated insight/explanation/focus | Prohibited. User-owned text belongs only in a separate attributed source-record view. |
| Existing engine key, kind, optional flag, or evidence status interpreted as approval | None authorizes release. Exact registered mappings are mandatory. |
| Earlier candidate denominators and treatment of COND-01 | Freeze rule-level review counts: 24 reviewed, 0 ALLOW AS-IS, 22 SAFE REWRITE REQUIRED, 2 HOLD own Next Focus. Key-construction counts are separately documented in section 29. |
| B's descriptive “conditional” observation assessment | A review qualification, never a fourth runtime verdict. Runtime verdicts are exactly ALLOW, HOLD, UNKNOWN. |
| Contextual Next Focus | Future release requires an exact rewritten and explicitly registered template passing this policy. A rewrite intent is not an ALLOW registration. |

MUST, MUST NOT, and MAY below are normative. Examples of forbidden wording describe violations for review and synthetic tests; they do not define a runtime text classifier.

## 1. Purpose

Create a deterministic, external boundary between frozen Phase 2A computation and future user-facing presentation. It decides whether a **specific presentation template, role, binding set, and provenance** may be presented without requiring interpretation of the objective's meaning.

The boundary limits what the system says and invites the user to do. It does not assess whether a person, intention, situation, action, or outcome is safe.

## 2. Scope

Safety v1 covers every intended system-generated component of one result bundle: primary Insight, any primary Interpretation, primary Why, any primary Next Focus, secondary factual presentation and its evidence explanation. Titles, captions, qualifiers, tooltips, hidden explanations, and accessibility text belong to the same evaluated plan.

It covers template registration, exact engine-to-template mapping, typed bindings, source validation, role restrictions, atomic aggregation, and a fixed fallback. It is local, pure, ephemeral, and independent of presentation locale.

A separate source-record view may display attributed user text. It is outside generated Insight/Why/Next Focus, cannot imply system endorsement, and cannot serve as a route around atomic suppression.

## 3. Threat model

| Threat | Required boundary |
| --- | --- |
| An unknown or harmful objective receives apparently neutral optimisation | No objective execution advice; descriptive or retrospective presentation only. |
| A falling rating produces “try harder,” persistence, emotion control, or obstacle removal | Known forbidden presentation functions are HOLD regardless of evidence level. |
| Labels or prose are treated as symptoms, risks, intentions, or causes | No semantic classification, diagnosis, crisis classification, or causal inference. |
| A valid promptKey or optional flag is treated as release authority | Closed, versioned registry and explicit role/rule/key/variant mapping. |
| Approved wording is replaced or bindings are enlarged | Exact body/variant identity and closed binding schemas; fail closed. |
| Raw text or imported content becomes system speech or executable markup | No raw text bindings in generated components; source view uses attributed inert text only. |
| Secondary, Why, hidden content, or accessibility text bypasses the gate | One complete manifest; atomic bundle suppression. |
| A failed high-ranked candidate is replaced with a lower candidate | No reranking, candidate shopping, or progressive dropping of failed components. |
| Missing data is repaired with guesses or stronger advice | Preserve missingness and MIXED/INSUFFICIENT; no backfill or confidence upgrade. |
| A stale allowed result remains visible after a new HOLD/UNKNOWN | Future renderer replaces the complete bundle with the fixed fallback. |
| Derived analysis leaks through logs, storage, network, or errors | No runtime network, storage, telemetry, raw error payloads, or persistence. |
| Caller-controlled metadata grants approval | Classification and approved bodies come from the trusted bundled registry, never caller assertions. |

The system cannot establish the real-world truth of self-reports, detect all harmful content, or identify a crisis. These are limitations, not capabilities hidden behind ALLOW.

## 4. Non-goals

No crisis detector, sentiment analyser, free-text classifier, semantic goal or obstacle classifier, AI/LLM, clinical assessment, treatment, risk score, moderation verdict about the person, high-stakes adviser, causal model, prediction, behavioural optimiser, automatic revision, or new measurements.

No modification of Phase 2A rules, thresholds, priority, chronology, segmentation, evidence levels, dictionary, stored data, JSON backup, production UI, locales, CACHE, or deployment configuration.

## 5. Frozen Phase 2A contract

The existing CommonJS engine exports `analyze(snapshot, options = {})`, `normalizeText`, `mapEmotion`, `parseTimestamp`, `ENGINE_VERSION`, `SOURCE_COMMIT`, `SOURCE_VERSION`, `RULE_IDS`, `DIMENSIONS`, `HEURISTICS`, and `EMOTION_LABELS`.

| Exact contract item | Value / requirement |
| --- | --- |
| ENGINE_VERSION | `analysis-phase2a-beta-heuristics-v1` |
| SOURCE_COMMIT in engine | `255a5d9d27461dcacaebc1bc80ab322dd54b4de8`; production input baseline, not the Phase 2A code commit |
| SOURCE_VERSION | `0.1.0` |
| result.specVersion | `analysis-phase1-proposal-1` |
| result.adapterVersion | `raw-0.1.0-conservative-v1` |
| result.dictionaryVersion | `production-v16-31-locales` |
| result.heuristicStatus | `PRODUCT_HEURISTICS_FOR_BETA` |
| Overall statuses | EMPTY, READY, LIMITED, INSUFFICIENT, MIXED, SAFETY_HOLD, UNSUPPORTED_SOURCE |
| Evidence levels | EARLY_OBSERVATION, COMPARISON, REPEATED_PATTERN, CONSISTENT_PATTERN; never safety or statistical confidence |
| result.safety | `externalDecision`, `releaseStatus: NOT_RELEASED_TO_USER`, `classifierImplemented: false` |
| result.causality / candidate.causality | `not_determined` |
| Dimensions | primary, success, scope, nonGoals, constraints, rationale |
| Current structured source | `snapshot.version`, `snapshot.intent.ris`, `snapshot.intent.cycles[index]` |
| Selected presentation sources | `result.primary` and `result.secondary`; no new ranking |

A selected candidate contains `ruleId`, `candidateId`, `domain`, `concept`, `status`, `titleKey`, `evidence`, `ruleEvaluation`, `interpretation: {key, data}`, `nextFocus`, `whyThisFocus`, `evidenceLevel`, `limitations`, `missingData`, `causality`, `safetyDisposition`, `eligible`, `secondaryOnly`, and `priority`. Its data may include arbitrary raw text; the entire object is not a presentation DTO.

Current non-null Next Focus structure is `{kind, variablePaths, promptKey, optional: true, releaseStatus: 'NOT_RELEASED_TO_USER'}`. Kinds are `observe` or `clarify`. These fields identify internal candidates only.

Title key construction is `analysis.[ruleId].title`; interpretation key construction is `analysis.[ruleId].[variant]`, ordinarily `recordedObservation`; Why key construction is `analysis.[ruleId].selectionBasis`. These constructions do not register user-facing text.

An engine option `safetyDecision` defaults to UNKNOWN. Existing ALLOW does not authorize rendering; existing HOLD can suppress engine primary/secondary. A later safety evaluation MUST NOT rewrite the engine's `safety`, status, selections, or releaseStatus, or feed its result back to rerun/rerank this analysis.

Engine source identity:

| Frozen file | SHA-256 |
| --- | --- |
| analysis.js | `a712af8fa74a8992e49972f9b217f268da444bcb062fa91824aee7cd9bbdf5da` |
| analysis.test.js | `f60075e1ab1c896b76025c9d6d3389e58de126f1b2769ce05c01a95367813b7d` |
| PHEISIRAETHA_ANALYSIS_ENGINE_SPEC.md | `d63d579cfbcdb26feeec74a608a3ef555c4d9acbb517322abdc44f73182a7fc4` |
| PHEISIRAETHA_PHASE2A_RECOVERY_REPORT.md | `bd3a909c210bc9cabaf9a55f5971a711b211694e0abd651be2ee30bd2eb89ed6` |

## 6. Exact ALLOW semantics

**ALLOW means this exact registered presentation component is safe by construction for its declared role and approved bindings. It does not mean its user or objective is safe.**

All of the following MUST hold:

1. Exact templateId/templateVersion, canonical body, approved locale variant, role, surface, ruleId, engine key mapping, and any variant selector exist in the trusted registry.
2. The registered presentation function is allowed in that role and does not require understanding arbitrary prose or the objective.
3. Every binding is explicitly declared, typed, range-checked, provenance-checked, and resolved from an approved source path without caller-supplied replacement values.
4. Applicable engine eligibility, comparability, limitations, and source requirements are satisfied; safety does not repair a failed engine gate.
5. The component makes no prohibited inference or behavioural invitation and preserves causality and uncertainty.
6. Its exact intended surrounding presentation is included in the plan. A safe sentence does not authorize an unreviewed title, Why, or Next Focus.

Unknown objective semantics alone do not block an objective-independent template meeting these conditions. A bundle is ALLOW only under section 10.

## 7. Exact HOLD semantics

**HOLD means a known, structurally established presentation-policy violation exists.** It is a restriction on presentation, not a claim about user danger or objective risk.

HOLD applies to a trusted registered template classified HOLD, a trusted presentation function prohibited by section 16, a known role violation, an explicitly forbidden binding operation, an attempted own Next Focus for CTX-02 or COND-01, a secondary recommendation/Next Focus, or trusted upstream engine HOLD.

Examples include advice to increase/decrease effort, perform an action, persist, change beliefs/emotions, remove obstacles, revise goals, pursue a high-stakes action, or accept a diagnosis, causal claim, or prediction.

Detection uses closed trusted metadata and structural rules. It MUST NOT analyse arbitrary natural-language template bodies or source records for crisis, intent, sentiment, or safety. Unregistered wording remains UNKNOWN unless an independently established structural violation already requires HOLD.

## 8. Exact UNKNOWN semantics

**UNKNOWN means the exact presentation lacks sufficient verified structural, registry, binding, or provenance support for ALLOW, and no known HOLD condition overrides it.**

This includes unknown ID/version/role/function/rule/key/variant, unmapped current engine prompts, unverified or modified template bodies, extra or invalid bindings, unsupported/malformed source, untraceable evidence, absent/damaged registry, policy-version mismatch, unavailable semantic understanding, and unresolved comparison basis.

Objective semantic meaning is always UNKNOWN by default. This is a separate invariant, not automatically the bundle verdict. A registered objective-independent observation can be ALLOW while `objectiveMeaning` stays UNKNOWN.

UNKNOWN MUST NOT be replaced with “probably safe,” a confidence value, an invented interpretation, a weaker recommendation, or a lower-ranked candidate.

## 9. HOLD > UNKNOWN > ALLOW precedence

The precedence is exact: **HOLD > UNKNOWN > ALLOW**.

| Component verdicts in intended bundle | Bundle verdict |
| --- | --- |
| At least one HOLD, with any ALLOW/UNKNOWN | HOLD |
| No HOLD and at least one UNKNOWN | UNKNOWN |
| Nonempty valid plan; every intended component ALLOW | ALLOW |
| Missing, malformed, or empty analysis presentation plan | UNKNOWN; approved fallback can still be shown |

Input failure cannot erase a known trusted HOLD already established. No arithmetic average, majority vote, risk score, confidence level, or order-dependent short circuit may weaken this precedence.

## 10. Atomic bundle gating

Evaluate every component intended for the result bundle before releasing any part. Component verdicts may be retained internally for deterministic testing; they never authorize partial release in v1.

For HOLD or UNKNOWN, suppress **Insight, Interpretation, Why, Next Focus, and all Secondary presentation**, including their titles, qualifiers, tooltips, hidden explanations, and accessibility content. The public presentation DTO contains none of these components. Show only the approved universal fallback.

No reranking to a lower candidate. No using `suppressedCandidates` as alternatives. No retry with an omitted failed role, smaller binding set, different template, or a generic focus to turn a failed bundle into ALLOW.

An intentionally absent slot is permitted only when a trusted, versioned presentation manifest declared it absent **before evaluation**, for example secondary.nextFocus by policy. `optional: true` is not permission to drop a failed intended component. Removing a HOLD component after evaluating it is a bypass.

The manifest must account for every intended surface. A missing required slot or unaccounted presentation content is UNKNOWN. A known forbidden slot is HOLD. The universal fallback is outside the suppressed bundle and does not change its original verdict.

Manifest selection itself is fixed by a versioned deterministic mapping from the selected engine state/roles to one expected manifest. The caller cannot choose an alternative manifest to omit an unapproved component. This makes omission/retry protection enforceable without retaining previous safety results.

## 11. Versioned template registry contract

The registry is trusted, immutable, bundled local data, not user input, a remote service, or a persisted preference. Entry identity is `(templateId, templateVersion, role)`; a body or binding change requires a new templateVersion. The registry has an independent registryVersion and pins policy `safety-v1`.

Every entry MUST contain:

| Field | Contract |
| --- | --- |
| templateId | Stable nonempty exact identifier; no fuzzy resolution |
| templateVersion | Positive integer, exact match; no “latest” substitution |
| role | INSIGHT, INTERPRETATION, WHY, NEXT_FOCUS, or FALLBACK |
| allowedRuleIds | Closed list of the 24 engine rule IDs; empty only for rule-independent fallback or capability notices explicitly scoped in the manifest |
| allowedBindings | Closed per-binding name/type/range/transform schema; optional bindings explicitly declared |
| allowedSourcePaths | Exact selectors for the bindings; no unrestricted object/path traversal |
| allowedPresentationFunction | One reviewed function for this entry; section 15/16 |
| safetyClassification | ALLOW, HOLD, or UNKNOWN; trusted registry classification only |
| canonicalText | Exact canonical English body, static surrounding wording, and declared placeholders |
| approvedVariants | Exact reviewed locale bodies; no machine generation or runtime paraphrase |
| allowedSurfaces | PRIMARY, SECONDARY, or FALLBACK, constrained by role |
| engineMappings | Exact ruleId/key/candidate variant/metric/dimension/branch tuples; never key-only mapping. Capability notices use an explicit capability path/value tuple instead of inventing a candidate key. |
| requiredEvidence | Existing engine eligibility, source, transformation, and limitation requirements |
| manifestVersion | Exact approved slot contract, including deliberate absences |

Additional registry metadata may describe review provenance, but cannot expand permissions. The presence of a rule in a list is not blanket approval for all of its variants or roles.

The registry also owns the closed engine-state-to-manifest mapping. For each supported engine presentation state there is one expected manifest identity/version, including deliberate absent slots. Unsupported or conflicting choices are UNKNOWN; the evaluator does not accept caller-selected alternative layouts as an approval bypass.

Allowed observational functions may include DESCRIBE_RECORDED_VALUES, DESCRIBE_RECORDED_CATEGORIES, DESCRIBE_WORDING_METADATA, DESCRIBE_REVISION_SELECTIONS, DESCRIBE_RECORDED_COCHANGE, EXPLAIN_SELECTION_BASIS, STATE_DATA_LIMITATION, STATE_CAPABILITY_LIMITATION, and FIXED_FALLBACK. Next Focus functions are restricted to OBSERVE, REVIEW, COMPARE, CLARIFY, RECORD under section 15.

A closed mapping must identify both the engine selector and replacement template identity. Do not evaluate caller-declared `safetyClassification`, treat a key suffix as approval, dynamically derive a template body from engine data, or accept an arbitrary registry in the public API.

## 12. Allowed binding contract

Bindings are resolved by the boundary from approved selectors. A request contains binding references, not already interpolated user data. Unknown or extra binding names, missing required bindings, invalid values/ranges, mismatched provenance, or unavailable required sources are UNKNOWN. An explicitly established prohibited binding function is HOLD.

| Binding type | Permitted source/use | Limit |
| --- | --- | --- |
| Recorded rating | Valid source/engine evidence for desire, belief, mental, practical, emotionIntensity, achievement | Finite number 0–10; preserve decimals and zero; label as recorded self-report |
| Recorded hours | Valid `iep.hours` with verified references | Finite number 0–168; retain past-seven-days scope; no effort/energy conversion |
| Exact numeric before/after/delta | Frozen engine comparison or derived measure with verified inputPaths | No recomputation of thresholds, rounding, causality, or implied true progress |
| Frequency category | `freq0` through `freq5`, exact validated enum | Fixed category label; no arithmetic frequency score or equal-interval assumption |
| Outcome direction | toward, none, away, mixed, unknown | User-selected category; no verified achievement or prediction |
| Evidence basis | direct, documented, otherPerson, subjective, insufficient, other | Recorded selections, not verified documents or confidence |
| Emotion category | Existing engine uniquely mapped category index 0–9 and mapping status | Known dictionary label only; Other does not identify one specific emotion |
| Dimension name/list | Fixed six DIMENSIONS and validated recorded revision keys | Static dimension labels; never the free-text dimension value |
| Counts | Existing validated engine record/revision counts with provenance | Nonnegative integers; no causal/safety confidence |
| Structural text metadata | Existing literal-equality/difference dimension flags, record-presence fact, capability/limitation enums | No raw text, normalized strings, lengths-as-risk, or inferred meaning |
| Source references | Exact cycle indices/IDs and paths validated against the snapshot | IDs are internal references, not automatically displayed user-data strings |
| Dates | Existing valid source timestamps, only if declared by an exact template | Deterministic date-only/numeric formatting; no current clock or invented dates |

Approved selectors may target `engine.primary` or `engine.secondary` approved scalar fields, exact `interpretation.data` subfields, verified `ruleEvaluation.derivedMeasures` values, and validated source leaves `intent.cycles[index].iep.[numericOrEnumField]`, `intent.cycles[index].oop.[numericOrEnumField]`, `intentional`, or revision **key metadata**. Each entry must enumerate its actual selectors; these families are not a wildcard grant.

The COND-01 fixed capability notice may depend only on the exact existing `engine.capabilities.VAQUQA.ruleId = COND-01`, `status = capability_gap`, and `conditionSufficiency = unavailable` tuple. It needs no user-data binding. The notice is a registered WHY disclosure in an existing selected bundle's explicitly declared capability-explanation slot; it is not a new primary or secondary candidate. Arbitrary capability objects are not allowed bindings.

`C.*` in existing Next Focus is a symbolic observation target, not a bound value and not permission to fill a future check-in. Resolve provenance to specific existing indices before binding.

Free-text values in `intent.ris.*`, `cie.*`, `revision.*`, `iep.actions`, `oop.currentState`, `oop.events`, `oop.external`, unmapped `iep.emotion`, and any engine copies of them cannot be bindings in generated system components.

No whole source/engine objects, arbitrary IDs as prose, unknown fields, caller-substituted values, fallback user-data bindings, executable callbacks, eval, prototype traversal, or dynamic property paths. Validate own plain-data fields without invoking getters. Reject unsupported executable/cyclic objects as UNKNOWN.

## 13. Free-text policy

Free text is user-owned source data. It cannot become a diagnosis, causal explanation, goal/obstacle/risk classification, evidence of crisis, or verified real-world fact.

Existing Phase 2A literal normalization/equality metadata may be described as such. Equal text is not functional retention; differing text is not drift, failure, a meaning change, or historical deviation. Safety adds no new semantic analysis.

Do not insert arbitrary raw or normalized user text into system-generated Insight, Interpretation, Why, Next Focus, their titles, or hidden content. Quotation marks, attribution, or HTML escaping do not make such interpolation approved for these roles.

A separate source-record view may show the user's text unchanged with clear record attribution, cycle/path context, and inert text rendering. Do not execute HTML, Markdown commands, instructions, scripts, or active links from that source, and do not let source content select template IDs, classifications, or presentation functions.

## 14. Unknown-objective policy

`objectiveMeaning: UNKNOWN` is invariant. The boundary does not infer whether an intention is ordinary, beneficial, harmful, medical, financial, legal, criminal, relational, or safe.

Safety-v1 generated wording must remain valid without resolving that meaning. Ratings and category descriptions may be allowed; “take the next step toward your objective,” “remove the obstacle,” or “keep pursuing it” are not made safe by an optional tone.

If a template's safety depends on understanding the objective, it cannot be ALLOW. An unverified semantic dependency is UNKNOWN; a trusted known action/optimisation function is HOLD.

## 15. Safe-by-construction wording rules

Describe **what was recorded**, which exact structural rule selected it, and what remains unavailable. Keep the object, timeframe, and self-report status explicit. Avoid value judgments such as better, worse, healthy, successful, failing, resilient, lazy, or safe.

Why explains **selection basis**, not why events occurred. “This rule compared the recorded values” is distinct from “effort caused the outcome.” Repetition is repetition in saved observations, not a discovered law, diagnosis, or stable trait.

Safe Next Focus is optional and limited to an exact registered OBSERVE, REVIEW, COMPARE, CLARIFY, or RECORD template. A verb whitelist alone is insufficient:

| Function | Permitted object | Forbidden extension |
| --- | --- | --- |
| OBSERVE | Already observed information in saved records | Create a future event, change behaviour, monitor symptoms as treatment |
| REVIEW | Existing recorded values, categories, or selected dimensions | Evaluate worth of the objective, prescribe action, judge “correct” beliefs |
| COMPARE | Existing eligible recorded values or structural metadata | Optimise effort, choose a better strategy, compare incompatible goals as progress |
| CLARIFY | A past recorded value, its known source, or declared timeframe | Discover hidden motives/obstacles, diagnose, change intention or criteria |
| RECORD | Information already occurred, already known, or already observed | Perform an action first, create an event, intensify effort, alter emotion, remove an obstacle |

Examples of permitted wording intent: “If you wish, review the recorded values shown here”; “If you wish, clarify which timeframe the recorded assessment refers to”; “If you wish, record an event that has already occurred and is already known to you.”

Examples of forbidden wording intent: “Record a useful action next week” when this invites doing it first; “Observe how much better you feel after changing your mindset”; “Review what obstacle you should remove”; “Compare which strategy achieves your goal faster.”

“Optional,” “consider,” “if useful,” and “if you want” do not sanitize a forbidden object or function. Wording must not nudge goal pursuit, new effort, persistence, belief/emotion changes, success-criteria changes, or data creation.

## 16. Forbidden presentation functions

All known trusted uses of the following are HOLD:

- Behavioural optimisation; effort increase **or decrease** advice; action prescription; persistence advice.
- Mindset modification; belief modification; emotion modification/control.
- Obstacle removal or execution planning.
- Diagnostic framing; therapeutic framing; treatment advice.
- Causal claims; predictions.
- Automatic revision advice; objective/criteria/scope optimisation.
- High-stakes directive advice.
- Claims that the user, objective, situation, or absence of crisis is safe.

Secondary Next Focus/recommendation/advice is separately forbidden by role. No term such as “neutral review,” “observation,” or “reflection” overrides an actual forbidden function.

## 17. Practical-effort boundary

Practical rating, recorded hours, and action-text presence are separate variables with different meanings and timeframes. Decrease, increase, low values, or zero hours do not establish insufficient work, inefficiency, avoidance, or need to change effort.

No advice to do more/less, schedule actions, spend resources, practise, persist, rest, or improve performance. The system cannot infer whose physical action contributed or convert ratings/hours into energy, productivity, or causal contribution.

PRA/REL rewrites may review existing values or invite retrospective recording of an action **already completed and known**. They may not request a new action so it can later be recorded.

## 18. Mental/emotion boundary

Mental effort, thinking frequency, belief, desire, emotion category, and emotion intensity stay separate self-report dimensions. No mind/energy score, positive/negative emotion ranking, mood trajectory, attention disorder, loss of will, or emotional cause of outcome.

Known categories use the frozen dictionary. Repeated Other does not identify the same specific emotion. Unknown/ambiguous labels remain unclassified. Intensity trend requires the existing same-known-non-Other category gate; changed categories can be described separately only by an explicitly registered factual template.

No advice to think more/less, believe harder, visualise, stay positive, regulate emotions, reduce fear, practise calming techniques, or control mental states.

## 19. Medical/psychological boundary

No diagnosis, symptoms-to-condition interpretation, disorder confirmation, clinical risk inference, screening outcome, mental-health assessment, therapy, treatment recommendation, medication advice, or advice replacing a professional.

A recorded mental/emotion change is not deterioration or recovery of health. Arbitrary medical or psychological words in user records do not trigger a classifier and do not justify generated diagnostic wording. The separate source view may display the user's attributed statement without adopting it as system truth.

## 20. High-stakes boundary

No directive advice on medical/psychological care, medication, finance, investment, law, employment, relationships, physical safety, or other consequential action. This restriction is applied by construction to presentation functions; the boundary does not classify source prose into those domains.

Recorded numbers/categories do not authorize an instruction to buy, sell, take, stop, leave, sign, confront, contact, or otherwise act. Universal descriptive wording must remain non-directive even when the hidden objective is consequential.

## 21. Harmful-objective limitation

Safety v1 does not detect or certify harmful objectives. A harmful objective may receive only an objective-independent registered factual description of records; it receives no support for execution, optimisation, persistence, obstacles, or revision.

Absence of HOLD never means absence of harm. ALLOW never means the system has endorsed the objective. Do not add a harmful/benign label, inferred domain, risk score, or “safe objective” field.

## 22. Crisis-detection limitation

No keyword crisis classifier, crisis dictionary, sentiment analysis, regex-based risk interpretation, semantic classifier, or AI/LLM. The boundary does not reliably detect crisis, suicidality, violence, abuse, emergencies, or hidden intent.

No crisis/no-crisis badge, diagnosis, reassurance that the user is safe, or automatic context-based emergency instruction. General help access, if later separately designed, is a product feature outside this boundary and cannot alter its verdict from source-text guesses.

## 23. Causality inheritance

`causality` remains exactly `not_determined` at engine, safety, and presentation-contract levels. Safety MUST NOT increase causal confidence, invent a cause, remove a causal limitation, or rename co-change as an effect.

REL-01/02/03 and CTX-01 describe separate recorded series or unavailable context. They do not establish that thought, emotion, action, AI, intention, external conditions, or any actor caused the outcome.

No causal probability, predictive score, significance value, confidence percentage, or claim of a validated PHEISIRAETHA mechanism.

## 24. Revision policy

Explicit `intentional: yes` plus a valid nonempty patch can be described as **recorded selection of dimensions for revision**. Keys do not prove a textual change because historical before-values are unavailable.

REV-02 counts existing valid selection events without quality/motivation judgments. Never advise revision, goal replacement, criterion relaxation, freezing a dimension, or undoing a decision.

Preserve Phase 2A segmentation, changed-CIE boundaries, `unsure`, conflicts, and `historical_RIS_unavailable`. Do not reconstruct historical RIS, apply patches, mutate current RIS, or infer improvement across incompatible bases. An unknown semantic progression through a revision boundary is UNKNOWN; known automatic revision advice is HOLD.

## 25. MIXED / INSUFFICIENT behavior

MIXED and INSUFFICIENT are legitimate engine states. A registered exact factual limitation or mixed-signal description may be ALLOW, while those engine states remain unchanged.

Do not reconcile contradictions by guessing, average unlike measures, infer dishonesty, manufacture evidence, hide an inconvenient value, improve the evidence level, or compensate with stronger advice.

Clarification can address only one already recorded measure, its timeframe, or structural decision/patch metadata. It cannot recommend which account to adopt or what objective/action to change. If any intended component fails, atomic fallback applies even when another limitation sentence would independently be ALLOW.

## 26. Secondary policy

Secondary NEVER has Next Focus, a recommendation, or behavioural advice. Existing Phase 2A sets `result.secondary.nextFocus = null` and `whyThisFocus = null`; preserve this.

Only a separately registered factual observation, permitted limitation/interpretation, and optionally an evidence-selection Why may appear in secondary. A secondary evidence explanation is not `whyThisFocus` and cannot imply a focus.

Secondary is part of the same atomic bundle. An unregistered secondary title, raw external-context interpolation, or any intended forbidden advice prevents the whole bundle's release. Its factual eligibility does not override a primary HOLD/UNKNOWN.

## 27. Universal fallback

Canonical exact semantic source:

> No interpretation or next focus is shown here.

Approved Russian reference meaning:

> Здесь не отображаются интерпретация и следующий фокус.

Reserved template identity: `safety.fallback.noInterpretationOrNextFocus`, templateVersion `1`, role FALLBACK, function FIXED_FALLBACK, classification ALLOW, allowed bindings `[]`, allowed source paths `[]`, allowed rule IDs `[]`.

No extra explanation, diagnosis, risk statement, apology, objective-safety claim, recommendation, or user-data binding. HOLD and UNKNOWN use the same sentence and do not expose their internal reasons.

The fallback is intrinsically independent of source and registry-binding failures. Its approved English constant remains available if other registry content is missing or damaged. Locale selection can use the approved Russian text or English; unreviewed translations fall back to English without generation.

Showing this fallback does not convert the analysis bundle's HOLD/UNKNOWN into ALLOW. Valid no-result states may show it too; no vacuous approval of an empty analytical bundle.

## 28. Rule-by-rule table for all 24 rules

Observation eligibility below is **presentation scope after exact registration**, not a current runtime ALLOW. Every original Next Focus has 0 ALLOW AS-IS. “Rewrite required” is a design disposition, not a safety verdict; an unmapped existing prompt stays UNKNOWN.

| Rule ID | Permissible factual scope | Interpretation boundary | Own Next Focus disposition |
| --- | --- | --- | --- |
| REF-01 | Latest recorded assessments; first-record status where true; existing source/limitation metadata | No trend on the first cycle, objective evaluation, or historical RIS reconstruction | SAFE REWRITE REQUIRED |
| QUAL-01 | Exact missing/unsupported assessment basis or possible default-profile limitation | No accusation of carelessness, no proof that events did not happen | SAFE REWRITE REQUIRED |
| CMP-01 | Exact eligible numeric before/after/delta, units and dates | No improvement/decline of health or objective success; no causal link | SAFE REWRITE REQUIRED |
| CMP-02 | Exact frequency category pair and ordinal change | No numerical attention amount, mental quality, or action equivalence | SAFE REWRITE REQUIRED |
| REV-01 | Recorded explicit revision selection and fixed dimension names | No proof that text changed; no failure/drift or automatic patch application | SAFE REWRITE REQUIRED |
| REV-02 | Valid revision-event counts and selected dimension-key frequencies | No unstable personality, excessive revision, or advice to freeze/change a dimension | SAFE REWRITE REQUIRED |
| TXT-01 | Literal wording-difference metadata and current-reference limitation | No semantic meaning, unintended drift, or original historical baseline | SAFE REWRITE REQUIRED |
| INT-01 | Repeated normalized CIE wording metadata | No functional retention, willpower, goal validity, or reward for copying | SAFE REWRITE REQUIRED |
| INT-02 | One recorded dimension's recurring wording differs from current RIS | No semantic drift, weakening, historical displacement, or meaning diagnosis | SAFE REWRITE REQUIRED |
| PRA-01 | Recorded practical-rating decrease; existing hours separately where valid | No actual work deficit, efficiency judgment, or “do more/less” | SAFE REWRITE REQUIRED |
| PRA-02 | Practical ratings in the frozen low range; hours separately | No absence of action, laziness, wasted effort, or obligation to act | SAFE REWRITE REQUIRED |
| MEN-01 | Low/decreasing self-reported mental-effort ratings | No energy/mood disorder, loss of will, clinical decline, or mindset correction | SAFE REWRITE REQUIRED |
| MEN-02 | Repeated/decreasing recorded attention-frequency categories | No rumination diagnosis, attention prescription, or cognitive performance score | SAFE REWRITE REQUIRED |
| EMO-01 | Recurrence of a known category; Other remains only Other | No chronic mood, positive/negative ranking, or emotional cause | SAFE REWRITE REQUIRED |
| EMO-02 | Recorded intensity change within the same known non-Other category | No wellbeing assessment, emotion control, or beneficial/harmful intensity | SAFE REWRITE REQUIRED |
| OUT-01 | Eligible self-rated achievement change and recorded direction/basis | No verified success/failure, completion, prediction, or action effectiveness | SAFE REWRITE REQUIRED |
| OUT-02 | Nearby achievement ratings and recorded none direction under existing gates | No stagnation diagnosis, failure, or demand for progress | SAFE REWRITE REQUIRED |
| CTX-01 | Achievement ratings decrease while practical ratings stay nearby | No obstacle growth, environmental cause, or context inferred from prose | SAFE REWRITE REQUIRED |
| CTX-02 | Presence of an external-context record; attributed source view separately | No obstacle/risk classification, causal interpretation, or raw text in generated prose | HOLD own Next Focus; factual observation not globally forbidden |
| COND-01 | Fixed capability notice: typed linked condition assessment unavailable | No missing/necessary-condition inference, sufficiency claim, or new measurement | HOLD/absent own Next Focus; factual capability notice not globally forbidden |
| REL-01 | Separate recorded practical decrease and nearby achievement, with limits | No action/outcome causal relation, proof effort unnecessary, or effort advice | SAFE REWRITE REQUIRED |
| REL-02 | Practical and achievement ratings increased in the same observations | No effect, efficacy, causal confidence, or persistence recommendation | SAFE REWRITE REQUIRED |
| REL-03 | One internal rating changes while practical/achievement stay nearby | No emotion blocking outcomes, failure of thought, diagnosis, or control advice | SAFE REWRITE REQUIRED |
| MIX-01 | Exact mixed/different-scope ratings, directions, or decision/patch metadata | No forced coherence, average advice, dishonesty accusation, or stronger prescription | SAFE REWRITE REQUIRED |

Frozen totals: **24 rules reviewed; 0 ALLOW AS-IS; 22 SAFE REWRITE REQUIRED; 2 HOLD own Next Focus (CTX-02, COND-01)**.

## 29. Exact mapping of all current Phase 2A Next Focus promptKeys

This is an engine identity inventory, **not a release registry**. Every row requires an explicit new registered mapping. It also includes the constructor-only key that is nulled for COND-01 so coverage does not silently omit it.

### Exact effective path sets

`L23`, the REF-01 effective path list in engine order:

```text
C.cie.primary
C.cie.success
C.cie.scope
C.cie.nonGoals
C.cie.constraints
C.cie.rationale
C.iep.desire
C.iep.belief
C.iep.emotionIntensity
C.iep.mental
C.iep.practical
C.iep.hours
C.iep.actions
C.iep.frequency
C.iep.emotion
C.oop.achievement
C.oop.direction
C.oop.evidence
C.oop.currentState
C.oop.events
C.oop.external
C.intentional
C.revision
```

`CMP_NUMERIC` is exactly one of these candidate-specific lists:

| candidateId | Effective variablePaths |
| --- | --- |
| CMP-01:practical | C.iep.practical |
| CMP-01:achievement | C.oop.achievement |
| CMP-01:mental | C.iep.mental |
| CMP-01:hours | C.iep.hours |
| CMP-01:desire | C.iep.desire |
| CMP-01:belief | C.iep.belief |
| CMP-01:emotionIntensity | C.iep.emotionIntensity, C.iep.emotion |

`REV_SELECTED` is the existing `selectedDimensions` list mapped to `C.cie.[dimension]`, followed by `C.oop.events`. Only the six fixed dimension names are possible. `REL_INTERNAL` is `C.iep.mental` for the mental branch or `C.iep.emotionIntensity` for the intensity branch. `MIX_TARGET` is `C.intentional, C.revision` when decision_patch_conflict is present; otherwise `C.iep.practical` when practical_hours_opposed is present; otherwise `C.oop.direction`. This is the exact existing branch priority, not a new safety rule.

### Complete unique-key inventory

| ID | Exact promptKey | Rule / kind | Effective variablePaths | Engine availability and Safety-v1 status without registration |
| --- | --- | --- | --- | --- |
| K01 | analysis.observeEventAndBasis | REF-01 / observe; QUAL-01 / clarify | REF: L23; QUAL: C.oop.events, C.oop.evidence | Possible primary; UNKNOWN |
| K02 | analysis.observeRevisedCriteria | REF-01 / observe; REV-01 / observe | REF: L23; REV: REV_SELECTED | Possible primary; UNKNOWN |
| K03 | analysis.observeActionAndEvent | REF-01 / observe | L23 | Possible primary; UNKNOWN |
| K04 | analysis.observeExternalCircumstance | REF-01 / observe | L23 | Possible primary; UNKNOWN |
| K05 | analysis.observeOwnCriteriaAgain | REF-01 / observe | L23 | Possible primary; UNKNOWN |
| K06 | analysis.checkWordingOrMeaning | TXT-01 / observe; INT-02 / observe | C.cie, intent.ris | Possible primary; UNKNOWN; does not authorize meaning analysis |
| K07 | analysis.clarifyOneRecordedAssessment | MIX-01 / clarify | MIX_TARGET | Possible primary; UNKNOWN |
| K08 | analysis.CMP-01.observe | CMP-01 / observe | CMP_NUMERIC | Possible primary; UNKNOWN |
| K09 | analysis.CMP-02.observe | CMP-02 / observe | C.iep.frequency | Possible primary; UNKNOWN |
| K10 | analysis.REV-02.observe | REV-02 / observe | C.revision | Possible primary; UNKNOWN |
| K11 | analysis.INT-01.observe | INT-01 / observe | C.cie | Possible primary; UNKNOWN |
| K12 | analysis.PRA-01.observe | PRA-01 / observe | C.iep.practical, C.iep.actions | Possible primary; UNKNOWN |
| K13 | analysis.PRA-02.observe | PRA-02 / observe | C.iep.practical, C.iep.hours, C.iep.actions | Possible primary; UNKNOWN |
| K14 | analysis.MEN-01.observe | MEN-01 / observe | C.iep.mental | Possible primary; UNKNOWN |
| K15 | analysis.MEN-02.observe | MEN-02 / observe | C.iep.frequency | Possible primary; UNKNOWN |
| K16 | analysis.EMO-01.observe | EMO-01 / observe | C.iep.emotion, C.iep.emotionIntensity | Possible primary; UNKNOWN |
| K17 | analysis.EMO-02.observe | EMO-02 / observe | C.iep.emotionIntensity | Possible primary; UNKNOWN |
| K18 | analysis.OUT-01.observe | OUT-01 / observe | C.oop.events, C.cie.success | Possible primary; UNKNOWN |
| K19 | analysis.OUT-02.observe | OUT-02 / observe | C.oop.events, C.cie.success | Possible primary; UNKNOWN |
| K20 | analysis.CTX-01.observe | CTX-01 / observe | C.oop.external | Possible primary; UNKNOWN |
| K21 | analysis.CTX-02.observe | CTX-02 / observe | C.oop.external | Constructed on secondaryOnly candidate; selected secondary strips it; attempted own Next Focus HOLD |
| K22 | analysis.COND-01.observe | COND-01 / observe at construction only | Constructor C.oop.external; effective nextFocus is null | Nulled before selection; candidate ineligible; attempted own Next Focus HOLD |
| K23 | analysis.REL-01.observe | REL-01 / observe | C.iep.practical, C.iep.actions, C.oop.events | Possible primary; UNKNOWN |
| K24 | analysis.REL-02.observe | REL-02 / observe | C.iep.practical, C.oop.events, C.oop.external | Possible primary; UNKNOWN |
| K25 | analysis.REL-03.observe | REL-03 / observe | REL_INTERNAL | Possible primary; UNKNOWN |

REF-01 chooses K01 if outcome basis is not good or the record is default-like; otherwise K02 for an explicit revision; otherwise K03 if actions are invalid/blank; otherwise K04 if external context is invalid/blank; otherwise K05. QUAL-01 always uses K01 with clarify. Rewrites may not alter this engine selection.

All selected secondary candidates have `nextFocus = null` and `whyThisFocus = null`, whatever their constructed key. COND-01 has no effective Next Focus at all.

Coverage denominators are distinct:

- **25 unique constructible keys**, including COND-01's discarded constructor default.
- **24 unique non-null keys on internal candidates after COND-01 nulling**, including CTX-02.
- **23 unique possible non-null primary keys**, excluding the two secondaryOnly rules.
- **24 rule dispositions**; 22 require rewrite and 2 retain absent/HOLD own Next Focus.

Literal `C.cie`, `intent.ris`, action/event/external/revision paths in this inventory are not permissions to bind their raw text. Title, interpretation, Why, selectionExplanation, capability, and limitation keys also require explicit registration; this Next Focus inventory is not blanket approval for those roles.

## 30. Safe rewrite intent for the 22 rewrite-required rules

These intents freeze the permitted **object and scope** of later rewritten Next Focus. They do not register exact bodies, authorize current keys, or create runtime templates in this phase. Each future entry must supply its exact text, identity/version, mapping, bindings, source paths, and tests. The general RECORD restriction applies to every row.

| ID | Rule | Safe rewrite intent | Required narrowing |
| --- | --- | --- | --- |
| W01 | REF-01 | Review the latest already recorded assessment, known basis, or fixed dimension metadata chosen by the existing reflection branch | No future event/action, semantic objective judgment, criterion revision, or historical trend |
| W02 | QUAL-01 | Clarify the already recorded assessment basis; optionally record an event already occurred/known | Missing event text does not mean no event; no demand to create evidence |
| W03 | CMP-01 | Review/compare the two already recorded values of the selected metric, separately with units | No instruction to continue/reverse the change, no new target value |
| W04 | CMP-02 | Review/compare the two already selected frequency categories | No request to think more/less or perform an action |
| W05 | REV-01 | Review which fixed dimensions were explicitly selected in the saved revision event | No criteria optimisation or advice to change/reapply revision |
| W06 | REV-02 | Review existing revision counts and dimension-key occurrences | No advice to stabilise, freeze, simplify, or revise less/more |
| W07 | TXT-01 | Review which recorded dimensions have a literal wording difference | No raw quote inside the generated template, meaning classifier, or drift diagnosis |
| W08 | INT-01 | Review the recorded fact that normalized wording recurred | No demand to repeat/copy wording, reinforce intent, or evaluate willpower |
| W09 | INT-02 | Review the fixed dimension showing a recorded wording mismatch with current RIS | Current RIS is not historical baseline; no meaning question converted into system inference |
| W10 | PRA-01 | Review the recorded practical rating; optionally record an action already completed/known | No action creation, work increase/decrease, performance advice |
| W11 | PRA-02 | Review practical ratings and already recorded hours separately; source text stays separate | Low rating does not imply no contribution; no pressure to add actions |
| W12 | MEN-01 | Review the already recorded mental-effort ratings as self-reports | No energy diagnosis, attention training, belief/mindset change |
| W13 | MEN-02 | Review the already recorded frequency categories separately from other measures | No cognitive/behavioural prescription |
| W14 | EMO-01 | Review known category selections and applicable recorded intensity separately | Other stays nonspecific; no good/bad ranking or emotion control |
| W15 | EMO-02 | Compare eligible recorded intensities within the same known non-Other category | No cross-category intensity trend or health interpretation |
| W16 | OUT-01 | Review recorded achievement/direction/basis; optionally record an already occurred/known event | No success verification, new event, prediction, or success-criteria adjustment |
| W17 | OUT-02 | Review existing outcome assessment; optionally record an already observed/known event | No stagnation label, pressure for progress, or strategy change |
| W18 | CTX-01 | Review the presence of a known recorded circumstance; optionally record a circumstance already observed/known | No inferred external cause, principal obstacle, obstacle removal, or future circumstance creation |
| W19 | REL-01 | Review the already recorded practical and outcome series separately | No causal “link,” advice to restore effort, or recommendation based on action text |
| W20 | REL-02 | Compare the two recorded series within the existing observations | No causal effect, strategy efficacy, or invitation to persist/intensify |
| W21 | REL-03 | Review the selected internal-rating series separately from practical/outcome ratings | No diagnosis, emotional causation, or mindset/emotion modification |
| W22 | MIX-01 | Clarify one already recorded assessment, its known timeframe, or decision/patch metadata | No forced reconciliation, correction of objective, patch application, or stronger advice |

A safe rewrite can use no user-data bindings at all. If a binding is used, it must be one of the approved typed structural values in section 12. The presence of the original target paths does not justify a broader contextual question.

## 31. CTX-02 / COND-01 treatment

**CTX-02:** Existing external-context record presence can support a separately registered factual secondary observation. The actual free text remains in a separate attributed source-record view. Its own Next Focus is absent in selected engine output and is HOLD if a presenter attempts to introduce it. This does not ban the factual observation.

**COND-01:** Typed linked necessary-condition assessment is not instrumented. Its candidate is ineligible and its Next Focus is explicitly null. A separately registered fixed capability notice may be shown in a declared WHY capability-explanation slot of an existing selected bundle, using the exact tuple in section 12; do not promote COND-01 to primary/secondary, make a recurring warning card, infer a missing condition, request new schema, or invent a focus. Its own Next Focus remains absent/HOLD.

If either factual component is included in an otherwise valid approved manifest **without an intended forbidden Next Focus**, it can be evaluated for ALLOW independently. If that bundle also intends a CTX-02/COND-01 focus, the focus is HOLD and the entire bundle is suppressed. The absent-focus manifest must exist before evaluation; it cannot be created in response to a failure.

## 32. Presentation DTO proposal

This is an ephemeral in-memory contract, not stored JSON or a production schema. A later implementation may express it as JavaScript objects; the type notation here is specification only.

```text
PresentationPlanV1:
  policyVersion: "safety-v1"
  registryVersion: exact compiled version
  manifestId / manifestVersion: exact trusted slot manifest
  components: ordered ComponentRequestV1[]
  declaredAbsentSlots: exact slots permitted absent by that manifest

ComponentRequestV1:
  componentId: unique stable slot identity
  surface: PRIMARY | SECONDARY
  role: INSIGHT | INTERPRETATION | WHY | NEXT_FOCUS
  slot: exact slot from the manifest
  templateId / templateVersion: exact registered identity
  ruleId / candidateId: selected engine identity, if applicable
  engineSelector: exact registered engine key/variant or capability path/value tuple
  bindings: closed BindingReferenceV1[] (references, never supplied values)

BindingReferenceV1:
  name: exact registered binding name
  selector: exact registered source selector
  sourceRefs: validated existing cycle index / ID / field references

ApprovedComponentV1:
  componentId / surface / role / slot
  templateId / templateVersion
  bindings: only approved typed scalar/list values

PresentationDtoV1:
  dtoVersion: "safety-presentation-v1"
  mode: APPROVED_BUNDLE | FALLBACK_ONLY
  primary: null | {
    insight: ApprovedComponentV1
    interpretation: null | ApprovedComponentV1
    why: ApprovedComponentV1[]
    nextFocus: null | ApprovedComponentV1
  }
  secondary: null | {
    insight: ApprovedComponentV1
    interpretation: null | ApprovedComponentV1
    why: ApprovedComponentV1[]
  }
  fallback: null | {
    templateId: "safety.fallback.noInterpretationOrNextFocus"
    templateVersion: 1
    role: FALLBACK
    bindings: {}
  }
```

The versioned manifest decides which existing observation/explanation slots are intended and which are legitimately absent. It must enumerate all captions/qualifiers/accessibility content, either as separate components or immutable parts of the registered body. Primary Insight requires its declared Why slots; no unexplained invented interpretation is injected. At most one primary Next Focus and one secondary observation bundle are possible.

For a nonempty all-ALLOW bundle: mode APPROVED_BUNDLE; approved slots only; fallback null. For HOLD, UNKNOWN, malformed plan, or no analytical result: mode FALLBACK_ONLY; primary null; secondary null; only fixed fallback. There is no secondary.nextFocus property, recommendation field, or free-form rendered-body field.

Plan caller assertions never grant approval. The boundary verifies plan completeness against the trusted manifest and frozen selected engine candidates. A component body/string supplied by a caller is unsupported and UNKNOWN; it cannot replace registry text.

DTO objects contain detached values, no aliases to source, engine, plan, or registry. The renderer only resolves approved IDs to approved static text/variants and formats typed bindings as inert text. It does not interpret prose, choose another template, traverse raw source objects, or add advice.

## 33. Safety result DTO proposal

Separate the internal verdict envelope from the public presentation payload:

```text
SafetyResultV1:
  safetyVersion: "safety-v1"
  registryVersion: compiled registry version | null on registry failure
  verdict: ALLOW | HOLD | UNKNOWN
  objectiveMeaning: UNKNOWN
  causality: "not_determined"
  engineReference: {
    codeCommit: "94b112488e576e08495443d93c048a528c39aac7"
    engineVersion: "analysis-phase2a-beta-heuristics-v1"
    sourceCommit: "255a5d9d27461dcacaebc1bc80ab322dd54b4de8"
    sourceVersion: "0.1.0"
  }
  engineStatus: exact original status | null if unavailable
  engineReleaseStatus: "NOT_RELEASED_TO_USER" | null if unavailable
  componentResults: ordered {
    componentId / surface / role / templateId / templateVersion
    verdict: ALLOW | HOLD | UNKNOWN
    reasonCodes: fixed enums only
  }[]
  bundleReasonCodes: fixed enums only
  presentation: PresentationDtoV1
  fallbackVerdict: null | ALLOW
  persisted: false
```

Internal reason-code vocabulary for v1: REGISTERED_PRESENTATION, FORBIDDEN_FUNCTION, FORBIDDEN_ROLE, FORBIDDEN_BINDING, FORBIDDEN_RULE_NEXT_FOCUS, UPSTREAM_HOLD, UNKNOWN_TEMPLATE, UNKNOWN_VERSION, UNMAPPED_ENGINE_KEY, UNKNOWN_VARIANT, INVALID_BINDING, INVALID_SOURCE, INVALID_PROVENANCE, INVALID_MANIFEST, EMPTY_ANALYTICAL_PLAN, REGISTRY_UNAVAILABLE, POLICY_VERSION_MISMATCH, SEMANTIC_DEPENDENCY, ENGINE_GATE_UNMET, BOUNDARY_ERROR.

Codes and component ordering are deterministic. Reasons do not contain source values, arbitrary text, stack traces, template-body guesses, diagnoses, or inferred risk categories. They are internal developer/test evidence and not user-facing explanations.

`engineReference` identifies the expected frozen contract, not a claim that an invalid input passed validation. Invalid/unavailable actual engine status and release status remain null; no fabricated successful validation is returned.

`fallbackVerdict: ALLOW` applies to the fixed fallback component only. It never overwrites `verdict`. No `userSafe`, `objectiveSafe`, `crisisDetected`, `riskLevel`, domain classification, diagnosis, confidence, prediction, or new timestamp field is allowed.

## 34. Phase 2B-2 deterministic test matrix

**120 numbered test cases/families are specified: A01–A32 (32), H01–H12 (12), U01–U16 (16), I01–I28 (28), E01–E32 (32).** A/H/U/I integrate C's coverage; E makes the owner's frozen reconciliations and exact engine/key contract explicit. Rows are implementation specifications, not claims that tests have been written or passed. Parameterized families contain more assertions than this numbered count.

### Fixture and oracle requirements

Use synthetic records only, current source version 0.1.0, valid distinct cycle IDs, valid timezone-qualified timestamps, and deliberately non-default valid profiles. Use existing Phase 2A gates; do not change a threshold to make a safety case reachable. Pattern cases use saved observations spaced according to the frozen engine and retain its segmentation/used-record scope.

Create presentation plans over **actual selected engine outputs**. Do not promote an eligible but unselected candidate to primary. Use direct boundary-level synthetic descriptors only for negative structural/template tests and label them as such. A01–A31 require exact registered objective-independent factual templates and valid bindings; an old key alone must instead yield UNKNOWN. Where a particular rule cannot be selected in a combined fixture, use a dedicated fixture or test the existing capability/structural output in its proper slot.

For CTX-02/COND-01 A21/A22, test registered factual/capability presentation with their own Next Focus absent. Those cases never make their own Next Focus ALLOW. A32 evaluates the approved fallback component, not an empty bundle as ALLOW.

Every HOLD/UNKNOWN assertion includes primary null, secondary null, no Interpretation/Why/Next Focus anywhere in the public DTO, fixed fallback with empty bindings, and unchanged engine/source. Every ALLOW assertion checks exact approved identity, allowed bindings, no extra slots, objectiveMeaning UNKNOWN, causality not_determined, and unchanged engine state.

Forbidden-template tests use trusted static test-registry functions/classifications or established role/binding violations. They MUST NOT implement keyword scans, sentiment analysis, natural-language diagnosis, or goal/risk classification, even in a test helper. The public API cannot accept a test registry from a source record.

### A — Registered factual presentation

| ID | Synthetic condition / covered rule | Expected result and exact limit |
| --- | --- | --- |
| A01 | One completed valid observation; REF-01 | ALLOW registered current-record reflection; no trend or first-cycle advice |
| A02 | Existing QUAL-01/INSUFFICIENT assessment basis | ALLOW exact registered limitation and, only if intended and registered, retrospective clarification; no event invented |
| A03 | Eligible numeric pair, e.g. practical 6 then 8; CMP-01 | ALLOW recorded before/after/delta 2; no automatic practical action |
| A04 | Distinct practical rating and hours values | ALLOW separate units and scope; no combined energy/effort score |
| A05 | Imported valid decimal ratings/hours | ALLOW exact finite decimals; no rounding or new threshold |
| A06 | Eligible frequency pair; CMP-02 | ALLOW selected categories and ordinal change; no thought count or percentage |
| A07 | Repeated identical normalized six-dimension CIE wording; INT-01 | ALLOW wording recurrence metadata; no functional retention |
| A08 | Repeated one-dimension wording differs from current RIS; INT-02 | ALLOW dimension mismatch metadata and historical-reference limitation; no drift |
| A09 | Nonblank differing strings; TXT-01 | ALLOW structural difference metadata; no raw text or semantic conclusion |
| A10 | Practical ratings [8,7,6] under frozen pattern gates; PRA-01 | ALLOW recorded decrease only; no “restore/increase effort” |
| A11 | Practical ratings [1,1,1], valid non-default remainder; PRA-02 | ALLOW low recorded range; hours separately; no absence-of-action inference |
| A12 | Low/declining mental ratings; MEN-01 | ALLOW self-report values/limitation only; no health or energy diagnosis |
| A13 | Repeated/decreasing valid frequency categories; MEN-02 | ALLOW category description; no attention modification |
| A14 | Repeated uniquely mapped category; EMO-01 | ALLOW recorded category recurrence; no chronic mood |
| A15 | Repeated Other category | ALLOW “Other was selected” only in registered categorical wording; no single specific emotion |
| A16 | Intensity increase and decrease within one known non-Other category; EMO-02 | ALLOW recorded intensity change; no good/bad ranking |
| A17 | Changed known emotion categories | ALLOW registered separate category facts when present in valid selected evidence; no cross-category intensity trend |
| A18 | Achievement increases and decreases with eligible direction/basis; OUT-01 | ALLOW self-rated series, not objective success/failure |
| A19 | Nearby achievement and all direction none; OUT-02 | ALLOW recorded proximity; no stagnation or progress advice |
| A20 | Practical nearby, achievement declining; CTX-01 | ALLOW separate series with unavailable context; no external cause |
| A21 | Nonempty external-context text; CTX-02 selected secondary | ALLOW only registered presence fact with own focus absent; raw text remains outside generated presentation |
| A22 | No typed linked conditions; COND-01 capability unavailable | ALLOW registered fixed capability notice only in its manifest slot; no promoted primary or recurring warning |
| A23 | intentional=yes plus valid nonempty patch; REV-01 | ALLOW selected dimension metadata, no before/after claim or patch application |
| A24 | Three valid explicit revision events; REV-02 | ALLOW event/key counts, no quality judgment or automatic revision |
| A25 | Practical decreasing, achievement nearby; REL-01 | ALLOW two separate recorded series and limits; no action/outcome cause |
| A26 | Practical and achievement increasing; REL-02 | ALLOW recorded co-change only; no efficacy/persistence advice |
| A27 | Mental or eligible emotion intensity changes while practical/outcome nearby; REL-03 | ALLOW the selected internal metric separately; no emotional causation |
| A28 | Mixed rating/hours/direction/decision-patch metadata; MIX-01 | ALLOW exact mixed/different-scope description; preserve MIXED |
| A29 | Opaque or unknown objective text, otherwise valid records | ALLOW an objective-independent registered structural template; objectiveMeaning stays UNKNOWN |
| A30 | Arbitrary source prose, otherwise same structure/equality pattern | ALLOW only approved typed/structural facts; no raw prose interpolation |
| A31 | achievement=10 and recorded toward | ALLOW recorded value/category only; no verified completion |
| A32 | Valid no-intent or zero-cycle result, no analytical candidate | Fixed fallback component ALLOW; analytical bundle UNKNOWN/EMPTY_ANALYTICAL_PLAN; no invented Insight |

### H — Known forbidden presentation

| ID | Trusted violation | Expected result |
| --- | --- | --- |
| H01 | Diagnostic framing from mental/emotion ratings | HOLD, atomic fallback |
| H02 | Therapy/treatment function or recommendation | HOLD, atomic fallback |
| H03 | Increase effort/action amount | HOLD; test decrease-effort counterpart in E13 |
| H04 | Change belief, mindset, or “positive thinking” | HOLD |
| H05 | Control/change emotion | HOLD |
| H06 | Remove obstacles/constraints | HOLD |
| H07 | Attribute outcome to thought/effort/emotion/context | HOLD; causality remains not_determined |
| H08 | Prescribe next action toward an unknown objective | HOLD |
| H09 | Continue, persist, or intensify behaviour | HOLD |
| H10 | Secondary Next Focus/recommendation | HOLD for whole bundle |
| H11 | Change objective, criteria, or scope automatically | HOLD |
| H12 | Claim user/objective is globally safe | HOLD; no safety badge |

### U — Insufficient presentation authority

| ID | Unverified condition with no known HOLD | Expected result |
| --- | --- | --- |
| U01 | Unknown templateId | UNKNOWN |
| U02 | Unknown templateVersion | UNKNOWN; no latest-version substitution |
| U03 | Current engine prompt with no exact registered mapping | UNKNOWN |
| U04 | Only observe/clarify kind and optional=true offered as authority | UNKNOWN |
| U05 | Unregistered semantic understanding of arbitrary objective required | UNKNOWN; never classify the objective |
| U06 | Unverified interpretation of external prose as an obstacle | UNKNOWN; known obstacle-removal function is H06 |
| U07 | Unverified semantic retention/drift from CIE/RIS prose | UNKNOWN; no diagnosis |
| U08 | Unmapped emotion label used for psychological interpretation | UNKNOWN |
| U09 | Unregistered template proposal includes arbitrary free text | UNKNOWN; if a verified forbidden binding operation is established, E05 requires HOLD precedence |
| U10 | Modified or caller-supplied body for a purported approved template | UNKNOWN; no body parsing to rescue approval |
| U11 | Extra/invalid binding name, value, type, range, selector, or unavailable source | UNKNOWN |
| U12 | Malformed/unsupported source or engine contract | UNKNOWN |
| U13 | Unverifiable source provenance, candidate identity, or evidence reference | UNKNOWN |
| U14 | Trend requested without existing engine eligibility/comparability | UNKNOWN; no repair or historical cherry-picking |
| U15 | Unverified progression interpretation across revision/CIE boundary | UNKNOWN |
| U16 | Missing/damaged registry or policy-version mismatch | UNKNOWN; independently compiled fixed fallback remains available |

U09's distinction is structural: unregistered text is unverified; a known forbidden interpolation function is a HOLD violation. No raw prose is displayed in either case. No UNKNOWN case overrides any simultaneously established HOLD.

### I — Required invariants

| ID | Verification | Required assertion |
| --- | --- | --- |
| I01 | All-ALLOW complete manifest | Exact declared slots only; at most one primary Next Focus; no extra prose |
| I02 | Any intended component HOLD | Entire analytical bundle suppressed |
| I03 | Any UNKNOWN and no HOLD | Entire analytical bundle suppressed |
| I04 | HOLD plus UNKNOWN/ALLOW in every permutation | HOLD dominates; no evaluation-order effect |
| I05 | Allowed secondary observation | No secondary nextFocus, recommendation, behavioural advice, or whyThisFocus |
| I06 | HOLD/UNKNOWN primary surfaces | Insight and Interpretation absent in the public DTO |
| I07 | HOLD/UNKNOWN explanatory surfaces | Why, qualifier, tooltip, and hidden explanatory component refs absent |
| I08 | HOLD/UNKNOWN focus surfaces | Next Focus and recommendation refs absent, including accessibility equivalents |
| I09 | HOLD/UNKNOWN secondary surfaces | Entire secondary presentation and its explanatory refs absent |
| I10 | Failed selected candidate, eligible lower candidate exists | No reranking or suppressed-candidate release |
| I11 | ALLOW call followed by HOLD/UNKNOWN call | Latest DTO contains only fallback; no prior component retained/aliased |
| I12 | Normal inputs/plan/engine result | Deep equality before/after; no writes |
| I13 | Deep-frozen inputs and bundled registry | No mutation; same results without unfreezing |
| I14 | Mutate returned DTO in a test-owned copy | No source/engine/registry/plan changes; no shared object aliases |
| I15 | Run frozen engine before and after boundary | Structurally identical engine output for the same input/options |
| I16 | Network APIs instrumented to throw/count attempts | Zero attempts, not merely swallowed failures |
| I17 | Storage APIs instrumented to throw/count reads and writes | Zero reads and zero writes; no persisted result |
| I18 | Clock/random/environment variations | Same verdict, reasons, identities, bindings, and causality |
| I19 | 1,000 evaluations of the same fixed input | Deep-identical results |
| I20 | Object-property insertion order changed, arrays preserved | Same semantic result and declared output ordering |
| I21 | All 31 existing presentation locales | Same verdict/reasons/template identity; no policy dependency on locale |
| I22 | Equivalent uniquely mapped emotion labels from frozen dictionaries | Same verdict for equivalent engine category data; no extra semantics |
| I23 | Missing/unknown locale or missing approved translation | Approved English wording; no new verdict or generated translation |
| I24 | Existing engine externalDecision=ALLOW/UNKNOWN/HOLD | ALLOW/UNKNOWN cannot bypass registry; trusted HOLD cannot be weakened |
| I25 | Boundary validation/resolution exception | UNKNOWN unless known HOLD dominates; fixed fallback; no raw error data |
| I26 | Sensitive synthetic source text in an error fixture | No text copied to logs, errors, reasons, telemetry, or generated presentation |
| I27 | Fallback after each bundle verdict/no-result state | Fallback ALLOW by its own exact entry; original verdict preserved |
| I28 | All verdicts and states | objectiveMeaning UNKNOWN, causality not_determined; no global safety/risk/diagnosis fields |

I06–I11 are DTO/state-contract assertions in standalone Phase 2B-2. They specify requirements for later UI integration; they do not authorize changing or testing production UI now.

### E — Frozen-decision and exact-contract extensions

| ID | Parameterized condition | Required assertion |
| --- | --- | --- |
| E01 | All 25 constructible key identities K01–K25 | Exact inventory matched; no key automatically ALLOW; K21/K22 attempted own Next Focus HOLD |
| E02 | All 24 rule IDs W-dispositions | 22 rewrite-required, 2 absent/HOLD own focus; 0 ALLOW AS-IS; no global rule ban |
| E03 | Every REF branch, 7 CMP metrics, 6 INT-02 dimensions, 2 REL-03 branches, 3 MIX target branches | Correct rule/key/variant/provenance mapping; mismatched selector UNKNOWN |
| E04 | All 27 ordered triples of ALLOW/HOLD/UNKNOWN plus one-component cases | Exact precedence; all-ALLOW only for complete nonempty valid manifest |
| E05 | Trusted forbidden raw-user-text binding operation plus allowed/missing components | HOLD dominates; no raw text in any generated role |
| E06 | Arbitrary multilingual/crisis-like/medical/legal/financial/harmful-looking prose substitutions preserving blankness and literal-equality patterns | Same objective-independent verdict; no keywords, sentiment, semantic domain, or crisis classifier |
| E07 | Arbitrary source text purporting to be templateId, policy approval, or system instructions | Source cannot alter registry/function/classification; no instruction execution |
| E08 | Mis-typed direct source leaf, NaN/Infinity, invalid enum, out-of-range or missing value | UNKNOWN for dependent binding; zero is not missing; no coercion |
| E09 | Known category, Other, ambiguous and unmapped emotion variants | No invented mapping; dependent template UNKNOWN when its category gate fails; unrelated valid plan can stay factual |
| E10 | Approved template with wrong role/surface/rule/key/version/metric/dimension | UNKNOWN for unverified mapping; known forbidden secondary focus remains HOLD |
| E11 | CTX-02 factual secondary alone versus same bundle with own focus attempted | Facts can be ALLOW after registration; own focus HOLD; whole failing bundle fallback |
| E12 | COND-01 fixed capability notice versus own focus attempted/promoted primary | Registered notice only; own focus HOLD; promotion/unavailable engine gate never ALLOW |
| E13 | Each forbidden function in section 16, including effort decrease and predictions | Trusted known function HOLD independent of objective, evidence, or optional tone |
| E14 | Every allowed Next Focus verb with forbidden object/function metadata | HOLD; OBSERVE/REVIEW/COMPARE/CLARIFY/RECORD do not sanitize the object |
| E15 | RECORD already completed/known/observed information versus “perform first” function | Retrospective registered template can ALLOW; action-creation template HOLD |
| E16 | Intended optional focus or Why fails; caller retries after dropping that slot | No release via post-failure omission; invalid manifest UNKNOWN or retained known HOLD |
| E17 | Trusted manifest declares legitimate absent slots before evaluation | Allowed absence accepted; secondary/CTX-02/COND-01 own focus never inserted |
| E18 | Registered approved primary plus unknown secondary title/Why/qualifier | Whole bundle UNKNOWN; no partial primary |
| E19 | Registered approved focus plus forbidden Interpretation/Why/caption | Whole bundle HOLD; focus cannot leak |
| E20 | Hidden/a11y/tooltip component omitted from plan but intended by manifest | UNKNOWN incomplete plan; known forbidden hidden function HOLD |
| E21 | MIXED and INSUFFICIENT with exact registered observational templates | Engine states preserved; no stronger advice or evidence upgrade |
| E22 | Valid empty plan, null intent, zero cycles, unsupported source, damaged registry | No empty-bundle ALLOW; approved fallback only; unsupported/malformed cases UNKNOWN unless HOLD dominates |
| E23 | Explicit revision, unsure, changed scope/criteria, decision-patch conflict | Preserve segmentation and limitations; no patch application or historical RIS synthesis |
| E24 | Ranges/units/scopes: rating versus hours versus frequency/direction | No combined score, percentage, energy conversion, or equal-interval category arithmetic |
| E25 | Different self-reported evidence bases, duplicated selections, achievement=10 | No verified success or confidence arithmetic; use existing validated engine transformations only |
| E26 | Approved fallback for all engine statuses and verdicts | Exact EN/RU source meaning; no user bindings or added explanation; original bundle verdict unchanged |
| E27 | Unsupported properties, prototype paths, getters, callbacks, circular/executable input | UNKNOWN without invoking executable fields; no unsafe traversal or raw errors |
| E28 | Duplicate component IDs, wrong ordering, extra fields/slots, conflicting absent/present declarations | Invalid manifest UNKNOWN; known forbidden role/function still HOLD |
| E29 | Approved-body/variant identity, registry entry immutability and version bump | Body/binding changes cannot reuse approval; unknown versions/variants fail closed |
| E30 | All 31 locales, missing variants, RTL variants, and runtime locale changes | Decision core identical; only approved text changes; missing variant uses English |
| E31 | No reads/writes through localStorage, sessionStorage, IndexedDB, Cache API, fetch, XHR, WebSocket, telemetry, filesystem/result persistence | Zero boundary attempts; no namespace/schema/backup/CACHE change |
| E32 | Frozen files, snapshots, returned-object aliasing and externalDecision injection | Byte identity and deep immutability; no mutation, rerun-to-rerank, or caller approval bypass |

Acceptance is not simply a test count. Each row requires meaningful input variation and both the expected verdict and suppression/no-mutation assertions. Do not use a copy of the implementation as the oracle. Keep fixed explicit expected identities and outputs; report parameterized assertion counts separately from the 120 numbered families.

## 35. No-mutation requirements

The boundary MUST NOT mutate source snapshot, cycles, RIS, CIE, IEP, OOP, revision patches, timestamps, array order, engine result, priority, evidence, limitations, caller plan, or registry. Returned values must be detached.

No source writeback, patch application, normalization stored into raw records, rating confirmation invention, historical baseline reconstruction, segmentation repair, or new fields. Computation errors cannot undo or modify an already saved source record.

The frozen Phase 2A files and all production files remain byte-identical. In Phase 2B-1D the only authored repository file is this specification; safety.js/tests/UI/locales do not exist as new work.

## 36. Determinism requirements

Same validated source snapshot, frozen engine result, approved manifest, policy version, registry version, and binding references produce the same safety result and presentation DTO.

No clock, random number, network, storage state, device state, timezone guess, user account, platform, or presentation locale affects the verdict. Preserve engine cycle order and use fixed role/component/reason ordering. Do not depend on object property insertion order.

No stochastic text generation or runtime paraphrase. Transformations are a closed deterministic set explicitly registered for each binding. Newly generated timestamps, safety scores, or inferred categories are prohibited.

## 37. Locale-independence requirements

The decision core receives no presentation locale. It evaluates canonical registry identities/functions/bindings and existing engine category metadata. It must not translate or reinterpret the source text.

All 31 existing locales receive identical verdict, reason codes, template identity/version, source references, and causal/objective invariants for the same canonical plan. Existing engine emotion dictionaries are inherited; safety introduces no dictionary changes.

Rendering uses approved exact locale variants of an approved canonical template. An unreviewed/missing variant falls back to its approved English body without weakening policy. Translation must preserve recorded/self-reported attribution, retrospective RECORD scope, limits, and optional wording; it cannot add advice.

Fallback has the exact English source and Russian reference in section 27. No locales.js change or translation rollout is authorized in this phase or by a standalone Phase 2B-2 module.

## 38. Privacy / no-network / no-storage requirements

Safety and presentation results are ephemeral only. No localStorage, sessionStorage, IndexedDB, Cache API, cookies, filesystem persistence of results, network, telemetry, analytics, server request, new storage namespace, persisted schema, JSON backup change, or history write.

The boundary does not itself read the user's application storage. A future authorized caller supplies an immutable snapshot already available in memory. Module/code loading and developer-run synthetic test files are not permission to persist runtime results.

No raw records, objective text, diagnosis guesses, binding values, source snippets, or stack traces in logs/errors. Internal reason enums remain local and are not a telemetry channel. Do not retain last results in module-global mutable state.

## 39. Error/fail-closed behavior

1. Validate source/engine/plan identity and the trusted registry contract without interpreting prose or executing arbitrary fields.
2. Record a known trusted structural HOLD wherever it can be established; it dominates accompanying invalid/unknown components.
3. Unsupported source, invalid binding/provenance, malformed descriptor, missing required component, body mismatch, absent registry, or evaluation exception produces UNKNOWN when no HOLD is established.
4. Return only the fixed fallback presentation for any HOLD/UNKNOWN; never partial output or a lower candidate.
5. Strip raw values and exception text from errors/reasons. Use fixed reason enums.
6. Preserve original engine/source and causality even when they cannot be fully validated.

A fallback template cannot fail because user data is malformed: it has no bindings. Maintain the independent compiled fallback constant so a damaged non-fallback registry still yields the exact sentence.

No permissive coercion, unknown-to-ALLOW substitution, “best effort” semantic repair, default-template guessing, or silent omission. Unverifiable/malicious source objects do not get evaluated as executable JavaScript. Arbitrary Proxy objects are outside the plain-data contract; no capability to certify execution of hostile objects is claimed.

## 40. Exact Phase 2B-2 implementation contract

This section defines the **next separately authorized implementation phase**. It does not start that phase.

### Files and public entry point

Implement a standalone CommonJS `safety.js` and `safety.test.js` only when Phase 2B-2 is requested. Keep the versioned trusted registry and exact mapping tables in the standalone safety module initially, so no production/locale files or runtime dependencies need change.

Proposed exported contract is frozen for that implementation:

```text
SAFETY_VERSION = "safety-v1"
REGISTRY_VERSION = "safety-registry-v1"
TEMPLATE_REGISTRY = deeply immutable trusted compiled entries

assessPresentation({
  sourceSnapshot,
  engineResult,
  presentationPlan
}) -> SafetyResultV1
```

The public function takes no runtime locale, network/storage adapter, LLM, arbitrary text classifier, arbitrary registry, rendered body, clock, random seed, or externally asserted presentation approval. The plan references exact trusted manifest/template identities. Unknown IDs/versions cannot be upgraded by caller metadata.

The boundary consumes the already computed frozen engine result. It does not import production UI, rerun the engine to repair selection, or modify `analyze`. Tests may invoke the unchanged engine to create synthetic fixture results.

### Required evaluation order and completeness

1. Validate plain-data input shapes, expected engine/source versions, selected candidate identities, provenance, and immutable trusted registry/manifest identity.
2. Determine the complete intended component set from the exact approved manifest over the existing primary/secondary/capability output. Validate legitimate predeclared absences and every intended auxiliary surface.
3. Match each component's role, rule, engine key/variant, template identity/version, source paths, and function to the explicit registry entry.
4. Apply known forbidden-function/role/binding/rule-focus restrictions. Resolve and validate only declared typed bindings against the source and frozen evidence. No arbitrary free-text interpretation.
5. Compute internal component verdicts with fixed reason enums. Retain known HOLD even if another component is unknown/malformed.
6. Aggregate atomically with HOLD > UNKNOWN > ALLOW. An empty or incomplete analytical plan is UNKNOWN.
7. Build a detached PresentationDtoV1: exact approved components only for a complete all-ALLOW bundle; otherwise primary/secondary null and the fixed fallback only.
8. Preserve objectiveMeaning UNKNOWN, causality not_determined, engine status/release status, and all source/engine data. No persistence or output aliases.

### Registry implementation and tests

Register the exact universal fallback. Every other entry must carry all fields in section 11 and an explicit engine tuple mapping; a generic key resolver is insufficient. Observational entries must use exact static copy and the closed binding contract. Unknown or not-yet-registered contextual rewrites remain UNKNOWN; known forbidden CTX-02/COND-01 own Next Focus is HOLD.

The 22 rewrite intents are not approved runtime bodies. Implementations must not convert them or the existing engine prompts into automatic ALLOW. Exact new entries may be constructed and tested as part of Phase 2B-2 specification-conforming work; contextual user-facing release remains a future phase. No original Next Focus is ALLOW AS-IS.

For boundary-kernel tests, a private synthetic harness may use fixed frozen trusted fixture registries, including prohibited-function entries. Do not expose arbitrary registry injection through the public API or interpret user text to create a classification. Tests distinguish kernel fixtures from the actual compiled registry and verify every actual registered entry/mapping.

Implement all 120 numbered test families, including their parameterizations and meaningful invariant assertions. In Phase 2B-2, run `node safety.test.js` and the unchanged `node analysis.test.js`; the Phase 2A suite must remain **101 PASS / 0 FAIL**. Test failures cannot be repaired by changing Phase 2A, production, schema, or frozen thresholds.

After the first successful standalone implementation, produce a separate implementation report stating registry entries, exact mappings, unknown/unregistered coverage, actual test/assertion counts, and invariant results. No UI integration, locales edits, storage, CACHE bump, commit/push/deployment, or change of engine NOT_RELEASED_TO_USER is implicitly authorized by this specification.

## 41. Known limitations

- ALLOW approves constructed presentation, not a person, objective, truth, action, or outcome. It does not establish absence of crisis or harm.
- The objective's semantics remain unknown; hidden dangerous goals are not detected. Safe construction limits assistance without resolving them.
- Free-text meaning, clinical conditions, obstacles, necessary conditions, actual energy/actor contribution, and verified success remain unavailable.
- Self-reported values and selected bases can be inaccurate; dictionary mapping is label identity, not sentiment or diagnosis.
- Historical RIS versions, before-revision values, direct-edit history, confirmation flags, and actual reporting periods remain unavailable in the existing schema.
- Atomic gating can suppress independently valid facts because another intended component lacks approval. This conservatism is deliberate for v1.
- No automatic fallback to another candidate or narrower partial bundle is available.
- Registry approval depends on exact reviewed wording, bindings, and locale variants. Safety v1 cannot dynamically prove arbitrary natural language safe.
- Tests cover synthetic structural/presentation conditions; they do not validate clinical outcomes, detect crisis, establish real-world causality, or prove every objective harmless.
- A separate source view still requires later UI attribution/inert rendering; this phase creates no source-view UI.

## 42. Remaining genuinely unresolved questions

**No unresolved core Safety-v1 semantics block the deterministic standalone boundary.** Verdicts, precedence, atomicity, fallback, raw-text/objective policies, current key coverage, rule counts, secondary/CTX-02/COND-01 treatment, privacy, and implementation constraints are frozen.

Four future product/release choices remain:

| ID | Genuine later question | Current fail-closed/default treatment |
| --- | --- | --- |
| Q1 | Which exact contextual rewritten Next Focus bodies, if any, will be included in the first future UI release rather than remaining absent? | Intents in section 30 only; no automatic registration or release. Every introduced body requires its own explicit identity/mapping and safety tests. |
| Q2 | Which additional locale variants will have reviewed exact copy for each registered template? | Only approved variants; otherwise canonical English. No present locale changes. |
| Q3 | What layout/attribution will the separate user-owned source-record view use? | No raw user prose in system components; no source-view implementation in these phases. |
| Q4 | Will a later product provide general help access, and how will it avoid text-based crisis classification or implied diagnosis? | No crisis classifier or automatic crisis/help inference in Safety v1. Such a feature is outside this specification. |

These choices do not reopen ALLOW semantics, permit partial release, enlarge source bindings, authorize a classifier, or relax the stop condition.

### Phase 2B-1D stop confirmation

Only this specification was created. **NO safety.js; NO safety tests; NO UI; NO locales changes; NO Phase 2A changes; NO production changes; NO schema/JSON/storage changes; NO CACHE bump; NO commit; NO push; NO deployment.**

Stop after the integration report. Implementation awaits a separate Phase 2B-2 request.
