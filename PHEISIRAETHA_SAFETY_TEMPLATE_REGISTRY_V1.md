# PHEISIRAETHA — Safety Template Registry V1

PHASE 2B-2A — TEMPLATE REGISTRY FREEZE

Status: FROZEN_CATALOG / SPECIFICATION_ONLY. Date: 2026-10-03.
Policy: safety-v1. Registry: safety-registry-v1.

| Reference | Exact value |
| --- | --- |
| Repository | ugreat653-cyber/pheisiraetha-app |
| Base branch | phase2b-safety-spec |
| Base commit | befe97f88ccad8fc55b454afb2dc4e531a36356e |
| Sole source document | PHEISIRAETHA_SAFETY_BOUNDARY_SPEC.md at the base commit |
| Frozen engine code commit | 94b112488e576e08495443d93c048a528c39aac7 |
| Production main baseline | 255a5d9d27461dcacaebc1bc80ab322dd54b4de8 |
| Production CACHE | pheisiraetha-v16 |
| Catalog count | 30 entries: 25 INSIGHT, 4 WHY, 1 FALLBACK |
| Manifest count | 5: four factual analytical manifests and one fallback contract |
| INTERPRETATION / NEXT_FOCUS entries | 0 / 0 |
| New locale variants | 0; canonical English only |

This freezes exact presentation copy, closed logical selectors, mapping tuples, and slot contracts for the first standalone Safety-v1 implementation. It does not implement the boundary, run tests, authorize a UI release, change stored schema, or approve any objective. The parent specification remains authoritative; this catalog narrows its permitted presentation scope.

## 1. Catalog authority and common fields

Every entry below has templateVersion = 1, safetyClassification = ALLOW, manifestVersion = 1, approvedVariants = {}, and localeVariantsExist = false. canonicalText is exactly the text in the canonical-body table, including punctuation and placeholders. English is the canonical body, not a separately selectable translation. The already approved Russian fallback reference in parent section 27 is unchanged; this standalone catalog does not add or compile a non-English body.

For each entry, allowedBindings is exactly its section 4 binding set, and allowedSourcePaths is exactly the corresponding section 4 selectors expanded by its closed M/B/U/D/I/X rows. Gate-only paths are enumerated in section 2 and grant no interpolation permission. requiredEvidence is the applicable section 3 tuple plus section 6 requirements and the common validation requirements in section 2. Manifest membership is exactly its section 4 slot and section 7 identity/version. E01 has no evidence prerequisites or engine mapping and remains independently available on malformed input or registry failure.

Entry identity is the complete (templateId, templateVersion, role) tuple. E01–E30 are document row labels, not alternative template IDs. Mapping, selector, binding, or body changes require a reviewed new version. All lists and expansion tables are closed. Unlisted variants, metrics, dimensions, branches, functions, roles, surfaces, selectors, and placeholders are UNKNOWN unless a known structural HOLD applies.

No current Phase 2A promptKey is registered as a NEXT_FOCUS mapping. All W01–W22 rewrite intents remain UNREGISTERED. Even retrospective review/record invitations are omitted from this compiled catalog. Boundary-kernel tests may use private, fixed, trusted synthetic fixtures under parent section 40; those fixtures are not product registry entries and cannot be injected through the public API.

## 2. Closed selector and binding notation

S means sourceSnapshot; E means engineResult; P is exactly E.primary; Q is exactly E.secondary. A mapping's selected surface fixes its candidate: PRIMARY -> P, SECONDARY -> Q. A caller cannot provide another candidate or another surface to change this association.

The following are registry-owned logical selector identities, not new engine properties. Source cycle indices are resolved solely from verified existing selected-candidate evidence and its inputPaths. No selector takes a caller-defined field name, search expression, callback, or arbitrary path. All concrete source references must resolve to existing own plain-data fields.

| Selector identity | Exact meaning and provenance restriction |
| --- | --- |
| CURRENT(f) | S.intent.cycles[i].f, where i is the selected REF-01 current-record reference; f must be one exact field listed for that entry below |
| PAIR(f) | The two S.intent.cycles[i].f leaves in the frozen selected comparison, in its existing before/after order; no new record search or chronological reordering |
| SERIES(f) | Ordered values of S.intent.cycles[i].f for the complete existing used-record set of the selected rule; no dropping, backfilling, or substitution |
| ENGINE_DELTA(f) | The unique existing frozen numeric before/after/delta measure for exactly PAIR(f), with the same metric and verified inputPaths; never calculate a replacement delta |
| ENGINE_ORDINAL | The existing CMP-02 ordinal-change metadata for PAIR(iep.frequency); transform only its already determined sign into the closed category increased, decreased, or unchanged |
| ENGINE_DIMENSIONS | Existing selected TXT-01 literal-difference dimension-key metadata, filtered to no additional keys and ordered by D below; never inspect text for meaning |
| ENGINE_DIMENSION | Existing INT-02 single dimension-key metadata; exactly the dimension in the matching D expansion row |
| ENGINE_EMOTION_CURRENT | Existing uniquely mapped category index for CURRENT(iep.emotion); raw label is not a returned binding |
| ENGINE_EMOTION_RECURRENT | Existing uniquely mapped EMO-01 category index for the rule's used records; all belong to that recorded category |
| ENGINE_EMOTION_OTHER | Existing EMO-01 category is the frozen dictionary's Other selection; no guess of its numeric index and no inference about the underlying emotion |
| ENGINE_EMOTION_SERIES_GATE | Existing same-known-non-Other gate over the intensity rule's used records; no new category mapping, sentiment, or cross-category intensity comparison |
| REVISION_KEYS | Existing REV-01 selectedDimensions metadata, backed by recorded intentional=yes and the valid nonempty revision patch; select only keys, never revision values |
| REVISION_EVENT_COUNT | Existing REV-02 count of valid explicit revision-selection events, verified against those event references; do not count unrelated cycles or create a replacement count |
| REVISION_KEY_COUNTS | Existing REV-02 six-dimension key-frequency counts for those same events; emit all six in D order, preserving zero |
| EXTERNAL_RECORD_PRESENT | Existing CTX-02 external-record presence fact and its validated S.intent.cycles[i].oop.external reference; return no text, quote, excerpt, length, or semantic label |
| MIX_BRANCH | Existing MIX-01 branch chosen with the parent section 29 priority: decision_patch_conflict, else practical_hours_opposed, else recorded-direction branch |
| SELECTED_RULE | Selected candidate's exact ruleId, checked against the matching M row; no caller assertion |
| FIXED_FIELDS | The exact static field-name string for the matching M row in section 3; this is trusted catalog text, never source prose |
| CAPABILITY_GAP | Exact E.capabilities.VAQUQA.ruleId = COND-01, status = capability_gap, conditionSufficiency = unavailable; no whole-object binding |

The parent document does not enumerate the physical child-property names inside evidence, interpretation.data, or ruleEvaluation.derivedMeasures. The logical selectors above deliberately do not invent those names. Before coding, their physical read locations must be checked against the frozen engine and recorded in a closed adapter table (gap G1 in section 10). Missing, nonunique, or unverifiable locations yield UNKNOWN; they cannot be implemented by unrestricted recursive object search. No physical path is claimed verified by this specification-only task.

### Types and exact formatting

| Binding type | Validation | Only allowed transform |
| --- | --- | --- |
| rating / ratingList | Finite numbers in [0,10]; no string coercion; list matches the complete registered used-record set | Exact numeric value as inert decimal text; lists in engine order, joined by ", "; no rounding |
| hours / hoursList | Finite numbers in [0,168]; same provenance rules | Same numeric formatting; the canonical body retains "past seven days" |
| delta | Finite existing frozen engine difference in [-10,10] for ratings or [-168,168] for hours; exact matching before/after inputs | Exact numeric formatting; no recomputation, percentage, conversion, or threshold change |
| frequency / frequencyList | Exactly freq0, freq1, freq2, freq3, freq4, freq5 | Display the exact enum token; list join ", "; no numeric score |
| direction / directionList | Exactly toward, none, away, mixed, unknown | Exact enum token; list join ", "; no verified progress claim |
| basisList | Source oop.evidence selections restricted to direct, documented, otherPerson, subjective, insufficient, other, using existing engine validation/deduplication only | Per-record enum tokens joined by ", "; record groups joined by "; "; never confidence arithmetic |
| emotionIndex | Integer 0–9, uniquely mapped by the existing engine; recurrent known entry excludes Other | Exact index as inert integer text; no raw emotion label |
| dimension / dimensions | Only D below; nonempty unique list where required | Exact fixed names; list join ", " in D order; no dimension values |
| count / keyCounts | Nonnegative safe integers; event count bounded by referenced events; each key count <= event count | Exact integer text; key counts ordered by D; no quality or confidence interpretation |
| ordinalChange | increased, decreased, unchanged, resolved only by ENGINE_ORDINAL | Exact token |
| ruleId | Exact selected M-row rule; COND-01 not included in generic candidate Why | Exact registered token |
| fieldNames / metricLabel / units / scope | Exact constants of the selected M/U tuple | Exact catalog string; no caller-supplied replacement |

D, in exact order: primary, success, scope, nonGoals, constraints, rationale.

Every listed binding is required. There are no optional bindings and no extra bindings. Each binding reference must contain exactly its registered selector and the validated existing cycle/field references needed by that selector. Source IDs are internal provenance, never interpolated prose. No date binding is registered. Missing values are not zero; zero remains valid.

Plain-data validation, engine/source identity validation, selected-candidate identity, eligibility, segmentation, comparability, existing category mapping, source range checks, and every existing limitation remain prerequisites. The boundary cannot rerun the engine, reinterpret its thresholds, or strengthen its evidence level.

## 3. Exact engine mapping tuples

For every M row below, INSIGHT anchors to the row's exact selected titleKey. WHY entries E27–E29 anchor to the same selected rule, candidate identity, titleKey, variant/branch/metric/dimension tuple and provenance. They explain the existing selection and records; they do not render whyThisFocus or approve an engine focus. No INTERPRETATION engine key is mapped here. Ordinary recordedObservation keys are not wildcard registrations.

M-row branch names below are catalog-owned discriminators of the already frozen evidence, not assumed names of engine properties. CandidateId must be exactly the actual selected candidate's ID and match its registered tuple. The only candidate IDs enumerated by the sole permitted source are the seven CMP-01 IDs in U; no missing candidate-ID construction is guessed.

| Mapping | ruleId / exact titleKey | Allowed surface | Exact variant, metric, dimension, branch and evidence gates | FIXED_FIELDS |
| --- | --- | --- | --- | --- |
| M01 | REF-01 / analysis.REF-01.title | PRIMARY | Current-record factual variant; exactly one verified current reference; B expansion plus category-known/unavailable split below | desire, belief, mental-effort, practical, emotion-intensity and achievement ratings; hours; frequency and outcome direction |
| M02 | QUAL-01 / analysis.QUAL-01.title | PRIMARY | Existing insufficient-basis or possible-default-profile limitation; analysis.observeEventAndBasis, kind clarify identifies the existing branch only | assessment-basis limitation metadata |
| M03 | CMP-01 / analysis.CMP-01.title | PRIMARY, SECONDARY | Exact seven U metric/candidate tuples; frozen eligible numeric pair and existing delta; emotionIntensity additionally uses the existing same-known-non-Other gate | selected recorded metric, units and before/after/delta |
| M04 | CMP-02 / analysis.CMP-02.title | PRIMARY, SECONDARY | Frequency comparison; PAIR(iep.frequency), existing ordinal metadata; no equal-interval arithmetic | frequency category pair and ordinal-change metadata |
| M05 | TXT-01 / analysis.TXT-01.title | PRIMARY, SECONDARY | Existing literal nonblank wording-difference metadata; ENGINE_DIMENSIONS; current RIS reference only | fixed dimension names with literal wording-difference metadata |
| M06 | INT-01 / analysis.INT-01.title | PRIMARY, SECONDARY | Existing normalized wording recurrence across all six D dimensions; eligible used-record set | six-dimension normalized wording-recurrence metadata |
| M07 | INT-02 / analysis.INT-02.title | PRIMARY, SECONDARY | Six explicit D tuples: one recurring dimension differs from current RIS; analysis.checkWordingOrMeaning identifies the existing branch only | one fixed dimension name with recurring wording-mismatch metadata |
| M08 | PRA-01 / analysis.PRA-01.title | PRIMARY, SECONDARY | Existing decreasing practical-rating pattern, complete used-record set; SERIES(iep.practical) | practical-rating series |
| M09 | PRA-02 / analysis.PRA-02.title | PRIMARY, SECONDARY | Existing frozen low-range practical pattern; SERIES(iep.practical); hours are a separate source series and must be valid | practical-rating series and separate past-seven-days hours |
| M10 | MEN-01 / analysis.MEN-01.title | PRIMARY, SECONDARY | Existing mental low-range or decreasing branch; SERIES(iep.mental); no branch inferred from health semantics | mental-effort rating series |
| M11 | MEN-02 / analysis.MEN-02.title | PRIMARY, SECONDARY | Existing repeated or decreasing frequency branch; SERIES(iep.frequency) | recorded frequency-category series |
| M12 | EMO-01 / analysis.EMO-01.title | PRIMARY, SECONDARY | Existing recurrent mapped-category branch, split into known non-Other and Other by frozen mapping; ambiguous/unmapped is not a supported dependent variant | recorded mapped-category recurrence metadata |
| M13 | EMO-02 / analysis.EMO-02.title | PRIMARY, SECONDARY | Existing increasing or decreasing emotion-intensity branch; ENGINE_EMOTION_SERIES_GATE and SERIES(iep.emotionIntensity) | emotion-intensity ratings within one mapped non-Other category |
| M14 | OUT-01 / analysis.OUT-01.title | PRIMARY, SECONDARY | Existing increasing or decreasing achievement branch, existing direction/basis gates; complete selected records | achievement-rating, outcome-direction and evidence-basis selections |
| M15 | OUT-02 / analysis.OUT-02.title | PRIMARY, SECONDARY | Existing nearby-achievement branch; all selected directions none; existing outcome basis gates | nearby achievement ratings and recorded none direction |
| M16 | CTX-01 / analysis.CTX-01.title | PRIMARY, SECONDARY | Existing nearby practical / decreasing achievement branch; no external prose interpretation | separate practical and achievement rating series |
| M17 | CTX-02 / analysis.CTX-02.title | SECONDARY only | Actual selected secondary, eligible external-record presence fact, nextFocus=null and whyThisFocus=null | external-context record-presence metadata |
| M18 | REV-01 / analysis.REV-01.title | PRIMARY, SECONDARY | Existing explicit intentional=yes plus valid nonempty patch; REVISION_KEYS only | recorded revision-selection dimension keys |
| M19 | REV-02 / analysis.REV-02.title | PRIMARY, SECONDARY | Existing repeated explicit revision-event branch and validated event/key counts | revision-selection event count and six dimension-key counts |
| M20 | REL-01 / analysis.REL-01.title | PRIMARY, SECONDARY | Existing decreasing practical / nearby achievement branch and complete same selected record set | separate practical and achievement rating series |
| M21 | REL-02 / analysis.REL-02.title | PRIMARY, SECONDARY | Existing increasing practical / increasing achievement branch; co-change only | practical and achievement rating series in the same observations |
| M22 | REL-03 / analysis.REL-03.title | PRIMARY, SECONDARY | Exactly two I tuples below; existing internal-change / nearby practical and achievement branch | selected internal rating and separate practical and achievement rating series |
| M23 | MIX-01 / analysis.MIX-01.title | PRIMARY, SECONDARY | Exactly three X branch tuples below; preserve existing MIXED and all scope/conflict limitations | mixed or different-scope rating, hours, direction or decision/patch metadata |
| MC | COND-01 capability tuple; no candidate key | PRIMARY WHY capability slot only | CAPABILITY_GAP; existing selected primary bundle; COND-01 candidate is not promoted | No binding |

The catalog covers all 24 rule IDs: M01–M23 cover selected candidate facts; MC covers COND-01 only as a capability disclosure. Generic Why excludes COND-01. REF-01/QUAL-01 are primary-only in this deliberately small catalog; any attempted secondary mapping for them is unregistered.

### B — exact REF-01 branch expansion

All five branches map to M01 factual bodies, never to a focus. Validate the existing first-applicable branch; do not choose a different branch.

| Branch | Exact engine identity and existing condition |
| --- | --- |
| B1 | analysis.observeEventAndBasis / observe; outcome basis not good or record default-like |
| B2 | analysis.observeRevisedCriteria / observe; B1 false, explicit revision |
| B3 | analysis.observeActionAndEvent / observe; B1–B2 false, actions invalid/blank |
| B4 | analysis.observeExternalCircumstance / observe; B1–B3 false, external record invalid/blank |
| B5 | analysis.observeOwnCriteriaAgain / observe; preceding conditions false |

Each B row has two exact factual variants: CURRENT_KNOWN_CATEGORY -> E03 when the existing current emotion mapping is unique; CURRENT_CATEGORY_UNAVAILABLE -> E02 when the existing mapping is absent/ambiguous/unmapped. Other, if uniquely mapped, is a category index in E03, not a specific emotion. This split is determined before plan evaluation. A caller cannot switch to E02 after E03 fails. Required numeric/category source leaves remain required in both variants.

### U — exact CMP-01 expansion

| candidateId | Metric / exact source leaf f | metricLabel | units | scope |
| --- | --- | --- | --- | --- |
| CMP-01:practical | practical / iep.practical | practical rating | 0–10 self-report rating | source-record scope |
| CMP-01:achievement | achievement / oop.achievement | achievement rating | 0–10 self-report rating | source-record scope |
| CMP-01:mental | mental / iep.mental | mental-effort rating | 0–10 self-report rating | source-record scope |
| CMP-01:hours | hours / iep.hours | recorded hours | hours | past seven days per record |
| CMP-01:desire | desire / iep.desire | desire rating | 0–10 self-report rating | source-record scope |
| CMP-01:belief | belief / iep.belief | belief rating | 0–10 self-report rating | source-record scope |
| CMP-01:emotionIntensity | emotionIntensity / iep.emotionIntensity | emotion-intensity rating | 0–10 self-report rating | source-record scope |

I is exactly: (mental, iep.mental, mental-effort); (emotionIntensity, iep.emotionIntensity, emotion-intensity). Both map to M22. The intensity tuple requires ENGINE_EMOTION_SERIES_GATE; mental does not borrow that category gate.

X is exactly: (decision_patch_conflict, symbolic C.intentional and C.revision); (practical_hours_opposed, symbolic C.iep.practical); (recorded_direction, symbolic C.oop.direction). These symbolic paths identify frozen branch priority only, not value bindings. E26 binds no source values. No extra MIX branch, resolution, or inferred cause is registered.

## 4. Registered entry metadata

Slot codes: O = selected surface's insight; WV = selected surface's why.values; WB = selected surface's why.selection; WL = selected surface's why.limitations; WC = primary.why.capability; F = fallback. Surfaces restrict these slot expansions. Every O/WV/WB/WL entry may occur only in the factual manifests MF1–MF4 in section 7; E30 only in MF3/MF4.WC; E01 only in MF0.F.

| Row | templateId | role | allowedRuleIds | allowedSurfaces | allowedPresentationFunction | engineMappings | Exact binding set / selectors | Manifest identity / slot |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| E01 | safety.fallback.noInterpretationOrNextFocus | FALLBACK | [] | FALLBACK | FIXED_FALLBACK | [] (independent fallback constant) | {} / [] | MF0.F |
| E02 | safety.insight.currentRecordedAssessments | INSIGHT | REF-01 | PRIMARY | DESCRIBE_RECORDED_VALUES | M01 x B1–B5 x CURRENT_CATEGORY_UNAVAILABLE | desire, belief, mental, practical, intensity, achievement: rating / CURRENT respective iep.desire, iep.belief, iep.mental, iep.practical, iep.emotionIntensity, oop.achievement; hours: hours / CURRENT(iep.hours); frequency: frequency / CURRENT(iep.frequency); direction: direction / CURRENT(oop.direction) | MF1–MF4.O |
| E03 | safety.insight.currentRecordedAssessmentsAndCategory | INSIGHT | REF-01 | PRIMARY | DESCRIBE_RECORDED_VALUES | M01 x B1–B5 x CURRENT_KNOWN_CATEGORY | Exactly E02 set plus categoryIndex: emotionIndex / ENGINE_EMOTION_CURRENT | MF1–MF4.O |
| E04 | safety.insight.assessmentBasisLimitation | INSIGHT | QUAL-01 | PRIMARY | STATE_DATA_LIMITATION | M02, both registered limitation branches | {} / [] | MF1–MF4.O |
| E05 | safety.insight.numericComparison | INSIGHT | CMP-01 | PRIMARY, SECONDARY | DESCRIBE_RECORDED_VALUES | M03 x exact seven U rows | metricLabel, units, scope: exact U constants; before, after: rating or hours per U / PAIR(f); delta: delta / ENGINE_DELTA(f) | MF1–MF4.O |
| E06 | safety.insight.frequencyComparison | INSIGHT | CMP-02 | PRIMARY, SECONDARY | DESCRIBE_RECORDED_CATEGORIES | M04 | before, after: frequency / PAIR(iep.frequency); ordinalChange / ENGINE_ORDINAL | MF1–MF4.O |
| E07 | safety.insight.literalWordingDifferences | INSIGHT | TXT-01 | PRIMARY, SECONDARY | DESCRIBE_WORDING_METADATA | M05, all existing literal-difference D-key subsets | dimensions: dimensions / ENGINE_DIMENSIONS | MF1–MF4.O |
| E08 | safety.insight.normalizedWordingRecurrence | INSIGHT | INT-01 | PRIMARY, SECONDARY | DESCRIBE_WORDING_METADATA | M06, exactly all six D dimensions | {} / [] | MF1–MF4.O |
| E09 | safety.insight.recurringWordingMismatch | INSIGHT | INT-02 | PRIMARY, SECONDARY | DESCRIBE_WORDING_METADATA | M07 x six exact D rows | dimension: dimension / ENGINE_DIMENSION | MF1–MF4.O |
| E10 | safety.insight.practicalRatingDecrease | INSIGHT | PRA-01 | PRIMARY, SECONDARY | DESCRIBE_RECORDED_VALUES | M08 | ratings: ratingList / SERIES(iep.practical) | MF1–MF4.O |
| E11 | safety.insight.practicalLowRangeAndHours | INSIGHT | PRA-02 | PRIMARY, SECONDARY | DESCRIBE_RECORDED_VALUES | M09 | ratings: ratingList / SERIES(iep.practical); hours: hoursList / SERIES(iep.hours) | MF1–MF4.O |
| E12 | safety.insight.mentalEffortRatings | INSIGHT | MEN-01 | PRIMARY, SECONDARY | DESCRIBE_RECORDED_VALUES | M10, existing low-range or decreasing branch | ratings: ratingList / SERIES(iep.mental) | MF1–MF4.O |
| E13 | safety.insight.frequencyCategories | INSIGHT | MEN-02 | PRIMARY, SECONDARY | DESCRIBE_RECORDED_CATEGORIES | M11, existing repeated or decreasing branch | categories: frequencyList / SERIES(iep.frequency) | MF1–MF4.O |
| E14 | safety.insight.knownCategoryRecurrence | INSIGHT | EMO-01 | PRIMARY, SECONDARY | DESCRIBE_RECORDED_CATEGORIES | M12, mapped non-Other branch only | categoryIndex: emotionIndex / ENGINE_EMOTION_RECURRENT, non-Other | MF1–MF4.O |
| E15 | safety.insight.otherCategorySelected | INSIGHT | EMO-01 | PRIMARY, SECONDARY | DESCRIBE_RECORDED_CATEGORIES | M12, Other branch only | {} / []; ENGINE_EMOTION_OTHER is a required gate, not text binding | MF1–MF4.O |
| E16 | safety.insight.sameCategoryIntensityChange | INSIGHT | EMO-02 | PRIMARY, SECONDARY | DESCRIBE_RECORDED_VALUES | M13, increase or decrease within same known non-Other category | intensities: ratingList / SERIES(iep.emotionIntensity); ENGINE_EMOTION_SERIES_GATE required, not interpolated | MF1–MF4.O |
| E17 | safety.insight.achievementRatingChange | INSIGHT | OUT-01 | PRIMARY, SECONDARY | DESCRIBE_RECORDED_VALUES | M14, increase or decrease | ratings: ratingList / SERIES(oop.achievement); directions: directionList / SERIES(oop.direction); bases: basisList / SERIES(oop.evidence) | MF1–MF4.O |
| E18 | safety.insight.nearbyAchievementRatings | INSIGHT | OUT-02 | PRIMARY, SECONDARY | DESCRIBE_RECORDED_VALUES | M15 | ratings: ratingList / SERIES(oop.achievement); recorded directions all none as required gate, not extra binding | MF1–MF4.O |
| E19 | safety.insight.contextSeriesFacts | INSIGHT | CTX-01 | PRIMARY, SECONDARY | DESCRIBE_RECORDED_COCHANGE | M16 | practical: ratingList / SERIES(iep.practical); achievement: ratingList / SERIES(oop.achievement) | MF1–MF4.O |
| E20 | safety.insight.externalRecordPresent | INSIGHT | CTX-02 | SECONDARY | DESCRIBE_WORDING_METADATA | M17 only | {} / []; EXTERNAL_RECORD_PRESENT required, no text binding | MF2/MF4.secondary.insight |
| E21 | safety.insight.recordedRevisionSelections | INSIGHT | REV-01 | PRIMARY, SECONDARY | DESCRIBE_REVISION_SELECTIONS | M18, any valid nonempty subset of D | dimensions: dimensions / REVISION_KEYS | MF1–MF4.O |
| E22 | safety.insight.recordedRevisionCounts | INSIGHT | REV-02 | PRIMARY, SECONDARY | DESCRIBE_REVISION_SELECTIONS | M19 | eventCount: count / REVISION_EVENT_COUNT; primaryCount, successCount, scopeCount, nonGoalsCount, constraintsCount, rationaleCount: count / corresponding exact D members of REVISION_KEY_COUNTS | MF1–MF4.O |
| E23 | safety.insight.practicalDecreaseNearbyAchievement | INSIGHT | REL-01 | PRIMARY, SECONDARY | DESCRIBE_RECORDED_COCHANGE | M20 | practical: ratingList / SERIES(iep.practical); achievement: ratingList / SERIES(oop.achievement) | MF1–MF4.O |
| E24 | safety.insight.recordedRatingCoIncrease | INSIGHT | REL-02 | PRIMARY, SECONDARY | DESCRIBE_RECORDED_COCHANGE | M21 | practical: ratingList / SERIES(iep.practical); achievement: ratingList / SERIES(oop.achievement) | MF1–MF4.O |
| E25 | safety.insight.internalRatingSeriesFacts | INSIGHT | REL-03 | PRIMARY, SECONDARY | DESCRIBE_RECORDED_COCHANGE | M22 x exactly two I tuples | metricLabel: exact I constant; internal: ratingList / SERIES(exact I field); practical: ratingList / SERIES(iep.practical); achievement: ratingList / SERIES(oop.achievement) | MF1–MF4.O |
| E26 | safety.insight.mixedRecordMetadata | INSIGHT | MIX-01 | PRIMARY, SECONDARY | STATE_DATA_LIMITATION | M23 x exactly three X tuples | {} / []; MIX_BRANCH verified, not interpolated | MF1–MF4.O |
| E27 | safety.why.recordedInformationUsed | WHY | Exact M01–M23 rule list | PRIMARY, SECONDARY | EXPLAIN_SELECTION_BASIS | Same exact M tuple as its surface's selected insight | fieldNames: exact FIXED_FIELDS string of that tuple | MF1–MF4.WV |
| E28 | safety.why.ruleSelectionBasis | WHY | Exact M01–M23 rule list | PRIMARY, SECONDARY | EXPLAIN_SELECTION_BASIS | Same exact M tuple as its surface's selected insight | ruleId: ruleId / SELECTED_RULE | MF1–MF4.WB |
| E29 | safety.why.recordedDataLimitations | WHY | Exact M01–M23 rule list | PRIMARY, SECONDARY | STATE_DATA_LIMITATION | Same exact M tuple as its surface's selected insight | {} / [] | MF1–MF4.WL |
| E30 | safety.why.conditionAssessmentUnavailable | WHY | [] (explicit capability notice) | PRIMARY | STATE_CAPABILITY_LIMITATION | MC; exact CAPABILITY_GAP tuple only | {} / []; three capability leaves are gates, not values | MF3/MF4.WC |

The literal allowedRuleIds expansion for E27–E29 is REF-01, QUAL-01, CMP-01, CMP-02, TXT-01, INT-01, INT-02, PRA-01, PRA-02, MEN-01, MEN-02, EMO-01, EMO-02, OUT-01, OUT-02, CTX-01, CTX-02, REV-01, REV-02, REL-01, REL-02, REL-03, MIX-01. Their surfaces remain restricted by the corresponding M row: e.g. the inclusion of CTX-02 does not authorize a primary CTX-02 Why.

## 5. Exact canonical English bodies

Each quoted table cell below is the complete canonicalText body. The quotation marks around the cell text are delimiters, not displayed characters. A placeholder may be populated only by its section 4 binding. The bodies have no added title, caption, recommendation, tooltip, hidden explanation, or generated accessibility prose.

| Row | Exact canonicalText |
| --- | --- |
| E01 | "No interpretation or next focus is shown here." |
| E02 | "Current recorded self-report ratings (0–10): desire {desire}; belief {belief}; mental effort {mental}; practical {practical}; emotion intensity {intensity}; achievement {achievement}. Recorded hours for the past seven days: {hours}. Recorded frequency category: {frequency}. Recorded outcome direction: {direction}." |
| E03 | "Current recorded self-report ratings (0–10): desire {desire}; belief {belief}; mental effort {mental}; practical {practical}; emotion intensity {intensity}; achievement {achievement}. Recorded hours for the past seven days: {hours}. Recorded frequency category: {frequency}. Recorded outcome direction: {direction}. Recorded mapped emotion-category index: {categoryIndex}. The category does not establish a mood or a specific emotion within Other." |
| E04 | "The selected saved assessment has an assessment-basis limitation under the frozen rule. Missing information does not establish that no event occurred." |
| E05 | "Recorded {metricLabel}: before {before}; after {after}; engine-reported difference {delta}. Units: {units}. Time scope: {scope}. These are recorded self-reports." |
| E06 | "Recorded frequency categories: before {before}; after {after}. The engine's ordinal comparison is {ordinalChange}. The categories are not thought counts or equal-interval measurements." |
| E07 | "Literal wording differences were recorded for: {dimensions}. This compares recorded wording with the current saved RIS; it does not determine meaning or reconstruct an earlier RIS." |
| E08 | "Normalized CIE wording recurred across primary, success, scope, nonGoals, constraints and rationale in the selected saved observations. Wording recurrence does not establish functional retention." |
| E09 | "Recurring recorded wording for {dimension} differs from the current saved RIS wording. Earlier RIS versions are unavailable; no semantic drift is determined." |
| E10 | "Recorded practical ratings in the selected observations: {ratings} (0–10 self-reports). The frozen rule identified a decrease in these ratings." |
| E11 | "Recorded practical ratings in the selected observations: {ratings} (0–10 self-reports), within the frozen rule's low range. Separately recorded hours for the past seven days per record: {hours}. The ratings do not establish absence of action." |
| E12 | "Recorded mental-effort ratings in the selected observations: {ratings} (0–10 self-reports). These ratings are not a measure of health or available energy." |
| E13 | "Recorded frequency categories in the selected observations: {categories}. These selections are not a cognitive-performance score." |
| E14 | "Recorded mapped emotion-category index {categoryIndex} recurred in the selected saved observations. Category recurrence does not establish a chronic mood." |
| E15 | "Other was selected in the saved observations used by the rule. This does not identify one specific emotion." |
| E16 | "Recorded emotion-intensity ratings in the selected observations: {intensities} (0–10 self-reports). The existing comparison uses one uniquely mapped non-Other category. Intensity change is not a wellbeing assessment." |
| E17 | "Recorded achievement ratings in the selected observations: {ratings} (0–10 self-reports). Recorded outcome directions: {directions}. Recorded evidence-basis selections, grouped by record: {bases}. These selections do not verify success, failure or completion." |
| E18 | "Recorded achievement ratings in the selected observations: {ratings} (0–10 self-reports). These ratings are nearby under the frozen rule. The recorded outcome direction is none in each selected observation. This does not establish stagnation." |
| E19 | "Recorded practical ratings: {practical}; recorded achievement ratings: {achievement} (separate 0–10 self-reports). The practical ratings are nearby and the achievement ratings decrease under the frozen rule. An external cause is not determined." |
| E20 | "An external-context record is present in the selected saved observation. Its meaning and any causal role are not determined." |
| E21 | "The saved explicit revision selection includes: {dimensions}. Selected dimension keys do not establish that wording changed, and no revision is applied here." |
| E22 | "Recorded explicit revision-selection events: {eventCount}. Selected dimension-key counts: primary {primaryCount}; success {successCount}; scope {scopeCount}; nonGoals {nonGoalsCount}; constraints {constraintsCount}; rationale {rationaleCount}. These counts do not assess revision quality or apply a revision." |
| E23 | "Recorded practical ratings: {practical}; recorded achievement ratings: {achievement} (separate 0–10 self-reports). The practical ratings decrease while the achievement ratings remain nearby under the frozen rule. No action–outcome cause is determined." |
| E24 | "Recorded practical ratings: {practical}; recorded achievement ratings: {achievement} (separate 0–10 self-reports). Both rating series increase in the selected observations under the frozen rule. Co-change does not establish an effect or efficacy." |
| E25 | "Recorded {metricLabel} ratings: {internal}; recorded practical ratings: {practical}; recorded achievement ratings: {achievement} (separate 0–10 self-reports). The selected internal-rating series changes while practical and achievement ratings remain nearby under the frozen rule. Causality is not determined." |
| E26 | "The selected saved records contain mixed or different-scope assessment metadata under the frozen rule. Ratings, hours, outcome directions and revision-decision metadata are not combined into one measure or automatically reconciled." |
| E27 | "The selected saved record references supply the recorded information shown here: {fieldNames}. Each value, category or structural fact retains its own source scope." |
| E28 | "Rule {ruleId} supplied the existing eligibility and selection basis for this factual presentation. This explains the selection of recorded information, not why an event occurred." |
| E29 | "Recorded self-reports and category selections are not independently verified outcomes. Actual reporting periods and earlier RIS versions are not reconstructed. Objective meaning and causality remain undetermined; no recommendation follows from this presentation." |
| E30 | "Typed linked condition assessment is unavailable in the current data. This does not establish that any condition is missing, necessary or sufficient." |

## 6. Required evidence and deliberate limits

E02/E03 require the current record and every bound scalar; they do not fabricate absent fields. Their text contains no trend, even if older records exist. A first-record status is not inferred unless the existing selected evidence establishes it; neither body needs that inference.

E05 requires the exact frozen eligible pair, metric-specific units and engine-produced delta. A decimal, zero, or maximum rating remains its exact recorded value. A category gate failure never becomes a cross-category emotion-intensity comparison. A03's 6 -> 8 example yields before=6, after=8, delta=2 only when those are the actual frozen outputs.

E07–E09 describe existing literal/normalized/key metadata only. They cannot bind current/historical RIS text, CIE prose, normalized strings, revision values, or a hypothesized original intention.

E10–E19 and E23–E25 use only the complete existing used-record set and frozen branch. Pair/series provenance cannot be changed to reach a preferred pattern. Mental, practical, achievement, intensity, hours and frequency remain separate measurements.

E14/E15 preserve the known-category/Other distinction. E03 may describe one known current category independently of an earlier different category. A17 can compare the separately approved current-record facts from dedicated existing selected outputs; it cannot demand an intensity trend across changed categories or bind an earlier category absent from the selected evidence.

E20 requires a genuine selected CTX-02 secondary. It has no source-text binding and cannot move to primary. E30 uses the capability tuple only inside an existing primary bundle's capability Why slot; it cannot create a COND-01 candidate, warning card, focus, or instrument.

E21/E22 describe keys/counts, not applied changes. E26 preserves MIXED, decision uncertainty, distinct scopes, and existing segmentation. E04 preserves INSUFFICIENT. None strengthens engine status or evidence.

E27–E29 are all required for each selected factual surface. Static disclosures complement, and never erase, the engine's original limitations. Engine limitation strings are not interpolated. An unaccounted intended limitation, title, caption, tooltip or hidden component prevents release; this catalog does not claim to register arbitrary engine explanation keys.

## 7. Exact manifests and deterministic selection

All five identities below have manifestVersion=1, policyVersion=safety-v1, registryVersion=safety-registry-v1. The plan's ordered components must exactly match the expected manifest; componentId equals its slot. No additional rendered-body, advice, title, or recommendation field is allowed.

Let PS be these four components, in order:

1. primary.insight: PRIMARY / INSIGHT / exact E02–E19 or E21–E26 identity selected by M; E20 is excluded.
2. primary.why.values: PRIMARY / WHY / E27.
3. primary.why.selection: PRIMARY / WHY / E28.
4. primary.why.limitations: PRIMARY / WHY / E29.

Let SS be these four components, in order:

1. secondary.insight: SECONDARY / INSIGHT / exact registered factual identity allowed by its M row (including E20).
2. secondary.why.values: SECONDARY / WHY / E27.
3. secondary.why.selection: SECONDARY / WHY / E28.
4. secondary.why.limitations: SECONDARY / WHY / E29.

WC is primary.why.capability: PRIMARY / WHY / E30.

| Code / exact manifestId | Required components in exact order | Engine-state selector fixed before evaluation | Exact declaredAbsentSlots |
| --- | --- | --- | --- |
| MF0 / safety.manifest.fallbackOnly | fallback: FALLBACK / FALLBACK / E01; outside analytical components | No selected analytical primary, or bundle HOLD/UNKNOWN/malformed/empty; this is the fallback output contract, not an alternative caller-approved analytical plan | primary, secondary |
| MF1 / safety.manifest.primaryFactual | PS | Valid selected primary; secondary=null; independently verified legitimate capability absence | primary.interpretation, primary.nextFocus, primary.why.capability, secondary |
| MF2 / safety.manifest.primaryAndSecondaryFactual | PS then SS | Valid selected primary and non-null selected secondary; independently verified legitimate capability absence | primary.interpretation, primary.nextFocus, primary.why.capability, secondary.interpretation, secondary.nextFocus, secondary.whyThisFocus |
| MF3 / safety.manifest.primaryFactualWithCapability | PS then WC | Valid selected primary; secondary=null; exact CAPABILITY_GAP tuple | primary.interpretation, primary.nextFocus, secondary |
| MF4 / safety.manifest.primaryAndSecondaryFactualWithCapability | PS then WC then SS | Valid selected primary and non-null selected secondary; exact CAPABILITY_GAP tuple | primary.interpretation, primary.nextFocus, secondary.interpretation, secondary.nextFocus, secondary.whyThisFocus |

Legitimate capability absence means absence in an independently verified frozen-engine output shape, not omission from the caller's plan or deletion from engineResult. A partially present, conflicting, damaged, or otherwise unverified capability tuple is UNKNOWN, never an MF1/MF2 route. The existing COND-01 gap tuple selects MF3/MF4 whenever a primary exists. G1 includes verifying whether legitimate MF1/MF2 engine states actually exist; unreachable manifests confer no permission to manufacture them.

Non-null secondary is always intended, even if its mapping is unavailable. Its failure suppresses the primary; do not switch MF2/MF4 to MF1/MF3. A selected primary missing or ineligible is not replaced by secondary or another candidate. COND-01 never selects PS or SS.

All four factual manifests deliberately omit primary Next Focus before evaluation. This is a fixed standalone product decision, not deletion of a failed request. Existing engine nextFocus objects remain unchanged internal data; they are not silently rendered. If the caller actually intends a focus or any extra slot, evaluate its structural violation/unknown mapping and fail the complete bundle. Repeated calls cannot weaken the predetermined slot contract.

Each insight's selected M/expansion tuple fixes its template identity before evaluation. E14 cannot be exchanged for E15, E03 for E02, or a failed rule for another rule. Why uses the same selected tuple and surface.

Every body is its complete surface text, including qualifications. No independent headings, captions, tooltips, offscreen explanations, or additional a11y prose are intended by MF1–MF4. Accessible text can mirror the exact approved body only; any independently authored surface must be accounted for and separately registered before a later version. MF0 has only E01's exact sentence.

For all-ALLOW complete analytical plans: APPROVED_BUNDLE, exact required slots, primary.nextFocus=null, primary.interpretation=null, secondary.interpretation=null, no secondary.nextFocus property, fallback=null. For HOLD/UNKNOWN/no analytical result: FALLBACK_ONLY, primary=null, secondary=null, E01 only with empty bindings. The fallback does not replace the original bundle verdict with ALLOW.

## 8. A01–A31 specification coverage

This is coverage of exact registered specifications, not implemented or passed tests. Each positive case needs actual selected frozen engine output, matching manifest, valid bindings, E27–E29 for each surface, and E30 when CAPABILITY_GAP is present. No positive case uses an original focus prompt.

| Case | Exact entry / mapping | Exact factual assertion and limit |
| --- | --- | --- |
| A01 | E02/E03, M01 x B | Current recorded assessments only; one valid observation has no trend |
| A02 | E04, M02 | Registered assessment-basis limitation; no invented event or clarification invitation |
| A03 | E05, M03 x U practical | Exact eligible before/after/delta, e.g. 6,8,2 |
| A04 | E02/E03 or E11 | Practical rating and hours have separate units and time scope |
| A05 | E02/E03/E05/E11 with valid selected tuple | Exact finite decimal ratings/hours, no rounding or new thresholds |
| A06 | E06, M04 | Frequency enums and existing ordinal change, no thought counts |
| A07 | E08, M06 | Six-dimension normalized wording recurrence only |
| A08 | E09, M07 x D | One fixed dimension mismatch; current-reference limitation |
| A09 | E07, M05 | Literal wording-difference dimension metadata, no raw text |
| A10 | E10, M08 | Recorded practical decrease under existing gates |
| A11 | E11, M09 | Low recorded practical range and separately valid hours |
| A12 | E12, M10 | Mental-effort self-reports, no health/energy diagnosis |
| A13 | E13, M11 | Recorded frequency categories, no attention prescription |
| A14 | E14, M12 non-Other | Existing known category-index recurrence, no mood inference |
| A15 | E15, M12 Other | Exact Other selection fact, no specific emotion |
| A16 | E16, M13 | Intensity series within one mapped non-Other category; both direction branches |
| A17 | E03, M01 CURRENT_KNOWN_CATEGORY | Separate current-category facts for dedicated selected outputs where categories changed; no unsupported prior-value binding or cross-category intensity trend |
| A18 | E17, M14 | Self-rated achievement series plus direction/basis selections; both direction branches |
| A19 | E18, M15 | Nearby achievement and recorded none, no stagnation |
| A20 | E19, M16 | Separate practical/achievement series, no external cause |
| A21 | E20, M17, MF2/MF4 | Selected CTX-02 secondary presence fact with own focus absent |
| A22 | E30, MC, MF3/MF4 | Fixed COND-01 capability Why within an existing primary bundle, not a candidate |
| A23 | E21, M18 | Saved explicit dimension selection, no change proof or patch application |
| A24 | E22, M19 | Existing event count and all six key counts, no quality judgment |
| A25 | E23, M20 | Separate practical-decrease / nearby-achievement series |
| A26 | E24, M21 | Recorded co-increase, no efficacy or persistence advice |
| A27 | E25, M22 x I | Selected mental or eligible intensity series separately from practical/achievement |
| A28 | E26, M23 x X | Mixed/different-scope structural facts; existing MIXED preserved |
| A29 | Any eligible matching factual entry, e.g. E02/E03 | Objective-independent copy; objectiveMeaning remains UNKNOWN |
| A30 | E07/E08/E09/E20 or other unaffected factual tuple | Arbitrary prose preserving structural/equality pattern is never interpolated |
| A31 | E02/E03 or E17 where selected | Recorded achievement=10 and direction=toward; no verified completion |

A32 is additionally specified by E01/MF0: the fallback component is ALLOW by construction; an empty analytical bundle remains UNKNOWN/EMPTY_ANALYTICAL_PLAN.

Dedicated fixtures must respect existing engine selection and source scopes. Coverage does not authorize promotion of unselected candidates, changing Phase 2A thresholds, or weakening the provenance gates to force an ALLOW.

## 9. HOLD / UNKNOWN and unregistered coverage

| Condition | Required verdict / coverage |
| --- | --- |
| Actual compiled entry counts by classification | 30 ALLOW; 0 HOLD; 0 UNKNOWN. Absence of negative entries is not absence of negative policy coverage |
| Trusted prohibited function in parent section 16 | HOLD; private fixed kernel fixtures cover H01–H12/E13–E15/E19 without registering product advice |
| Attempted own CTX-02 or COND-01 Next Focus | HOLD / FORBIDDEN_RULE_NEXT_FOCUS, regardless of key, optional tone or manifest |
| Any secondary Next Focus/recommendation | HOLD / FORBIDDEN_ROLE |
| Trusted forbidden raw-user-text interpolation | HOLD / FORBIDDEN_BINDING; no raw generated output |
| Trusted upstream engine HOLD | HOLD / UPSTREAM_HOLD; cannot be weakened by catalog facts |
| Current Phase 2A focus key alone | UNKNOWN / UNMAPPED_ENGINE_KEY; K21/K22 own-focus attempts instead HOLD |
| All W01–W22 rewrite intents | UNREGISTERED; no exact runtime Next Focus approval |
| Unsupported key, ID/version, interpretation, surface, metric, dimension, branch, selector, caller body, extra binding or forged metadata | UNKNOWN unless independently known HOLD |
| Missing/unverified engine gates, data, provenance, registry/policy, capability tuple or complete required slot set | UNKNOWN; no partial release or manufactured facts |
| Unknown objective meaning with a complete valid objective-independent factual plan | Bundle can ALLOW; objectiveMeaning still UNKNOWN |
| Mixed/insufficient selected engine output | Existing state unchanged; matching facts can ALLOW; no stronger evidence/advice |

All 25 constructible focus keys remain without compiled NEXT_FOCUS entries. The 23 possible primary keys remain UNKNOWN as focus authority; the two forbidden-own-focus identities have HOLD restrictions. Selected secondary retains null nextFocus and null whyThisFocus.

HOLD > UNKNOWN > ALLOW is unchanged. Any HOLD/UNKNOWN suppresses every intended analytical surface. E01 is shown with empty bindings and no internal reason text. No retry with fewer Why slots, no template shopping, no candidate reranking, no averaged confidence, no prose classifier.

## 10. Remaining gaps before coding and stop

| Gap | Required resolution in the separately authorized implementation phase |
| --- | --- |
| G1 — physical adapter verification | Inspect the frozen engine read-only to pin exact evidence/used-record, comparison-derived-measure, category, dimension, revision-count and selection-basis property locations and candidate identities. Translate only the closed logical selectors above into an explicit physical selector table. Confirm valid capability-absence states before enabling MF1/MF2. The sole permitted source for this task does not provide these property layouts. Unknown/unverifiable selectors remain UNKNOWN; no guessed paths or unrestricted search |
| G2 — fixture reachability and execution | Build dedicated synthetic fixtures over actual selected outputs for all 31 positive families and the parent 120-family matrix. Verify the A17 separate-current-fact construction and A28 branch selection against actual evidence. Coverage here is specification coverage, not test PASS evidence |
| G3 — private negative kernel fixtures | Define immutable private prohibited-function and retrospective-focus fixtures for matrix cases that require them. Keep them out of the 30-entry actual registry and public API |

No wording, product-scope, translation, contextual-focus or policy decision is needed to start that verification. If frozen engine data cannot support a registered logical selector, report the precise gap and retain UNKNOWN; do not invent data, change engine/schema, or silently broaden this catalog.

Future coding remains separately authorized: standalone safety.js and safety.test.js only, parent section 40, unchanged analysis.test.js acceptance 101 PASS / 0 FAIL. No tests were authored or run here.

Only PHEISIRAETHA_SAFETY_TEMPLATE_REGISTRY_V1.md is the authored deliverable.

NO code changes. NO analysis.js changes. NO analysis.test.js changes. NO production/main/CACHE/schema/storage changes. NO safety.js. NO safety tests. NO commit. NO push. NO deployment. NO web search.

STOP after the PHASE 2B-2A REGISTRY FREEZE REPORT.
