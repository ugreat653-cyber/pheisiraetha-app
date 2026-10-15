# Контракт локализованного представления аналитики v2

Статус: **DRAFT_CONTRACT / PENDING_SEMANTIC_REVIEW / NOT_FOR_ACTIVATION**.

Этот документ определяет будущую отдельную границу представления. Он не добавляет переводы, аналитические формулировки, runtime, новый approved artifact или разрешение на публичное включение. Все будущие summary и locale bodies остаются `PENDING_SEMANTIC_REVIEW` до проверки точного текста. Существующие executable sources, спецификации, проверки, архивы ON/OFF и production UI сохраняются побайтно.

## 1. Проверенные основания

Проверены production main `d57f7c4f3d7cb3285f7fecc2342842c8518198e1`, protected source anchor `db6920193fb76028947ce148cd8ed61c847c5c3d` и draft PR #8 HEAD `2edd56fb7761b50f52c2e074284830e46b9080eb`. Выводы о source не являются воспроизведением текущего установленного клиента или доказательством содержимого live Pages.

| Основание | Следствие для v2 |
| --- | --- |
| [Integration specification, §§9–10](https://github.com/ugreat653-cyber/pheisiraetha-app/blob/2edd56fb7761b50f52c2e074284830e46b9080eb/PHEISIRAETHA_PRODUCTION_INTEGRATION_SPEC_V1.md#L379) | Formatter использует точные canonical bodies; runtime translation, Intl, дополнительные аналитические предложения и произвольные заголовки запрещены. DTO v1 фиксирует `en/ltr`. |
| [Integration specification, §15](https://github.com/ugreat653-cyber/pheisiraetha-app/blob/2edd56fb7761b50f52c2e074284830e46b9080eb/PHEISIRAETHA_PRODUCTION_INTEGRATION_SPEC_V1.md#L544) | Даже fallback в этой integration версии canonical English. Locale не влияет на Analysis/Safety. |
| [Frozen registry, §1](https://github.com/ugreat653-cyber/pheisiraetha-app/blob/74b77f0b821a93e1910e40f5c29c459c126e6d42/PHEISIRAETHA_SAFETY_TEMPLATE_REGISTRY_V1.md#L20) | 30 entries; `approvedVariants = {}`; executable locale variants отсутствуют. Russian fallback reference в parent boundary spec не компилирует новые locale bodies автоматически. |
| [Runtime composition](https://github.com/ugreat653-cyber/pheisiraetha-app/blob/2edd56fb7761b50f52c2e074284830e46b9080eb/browser-packaging/runtime-facade/runtime.cjs#L11) | Существующая facade возвращает готовый immutable текст `en/ltr`, а не bindings. |
| [Canonical formatter](https://github.com/ugreat653-cyber/pheisiraetha-app/blob/2edd56fb7761b50f52c2e074284830e46b9080eb/browser-packaging/runtime-facade/canonical-formatter.cjs#L27) | Каталог — закрытая trusted dependency; строгие identities, bindings и transforms; `-0` сохраняется; arithmetic и округления отсутствуют. |
| [Frozen Safety, resolution](https://github.com/ugreat653-cyber/pheisiraetha-app/blob/74b77f0b821a93e1910e40f5c29c459c126e6d42/safety.js#L1182) | Safety самостоятельно разрешает значения, сверяет selector и полный набор `sourceRefs`, затем выдаёт approved presentation с bindings. |
| [PR #8 renderer](https://github.com/ugreat653-cyber/pheisiraetha-app/blob/2edd56fb7761b50f52c2e074284830e46b9080eb/app.js#L325) | Только точный единственный `FALLBACK_ONLY` заменяется `analyticsEmpty`; полноценный approved bundle остаётся английским. Это не общий localization protocol. |

Новый owner mandate требует отдельного reviewed контракта и каталога. Нельзя незаметно изменить значения старых gates или считать этот документ поправкой к frozen спецификациям. Возможное соответствие PR #8 fallback exception разным историческим authorities требует самостоятельной проверки; оно не предоставляет полномочия для переводов остальных компонентов.

## 2. Неизменяемые аналитические инварианты

Для одинакового committed source должны сохраняться выбранные primary/secondary, chronology, segmentation, thresholds, rule priority, template identity/version, provenance и verdict. `objectiveMeaning = UNKNOWN`, `causality = not_determined`, отсутствие interpretation/recommendation/nextFocus и ограничения frozen Safety сохраняются.

Locale влияет только на утверждённое представление после Safety. Запрещены изменение engine dictionary, перевод или нормализация сохранённых user answers, повторная классификация эмоций, самостоятельный пересчёт фактов, выбор более удобного template, повышение secondary и повторная попытка с меньшим manifest. Подписка, доступность сети и состояние account не являются аналитическими входами.

## 3. Отдельная закрытая composition

Будущий private v2 entry связывает точные pinned frozen Analysis/Safety bytes с новой presentation dependency:

```text
committed selected-intention source snapshot
  -> frozen Analysis
  -> existing closed presentation plan
  -> frozen Safety
  -> validate actual SafetyResult contract
  -> private trusted v2 localizer(actual SafetyResult.presentation, selected locale)
  -> immutable render-only v2 DTO
  -> current transaction check
  -> textContent renderer
```

Старую facade и approved bundle не расширять и не перезаписывать. Из готового английского `text` нельзя восстанавливать typed bindings посредством regex, NLP или чтения source state. Новая composition получает фактическое `SafetyResult.presentation` внутри closure, после проверки результата текущего вызова Safety.

Localizer не получает `engineResult`, `sourceSnapshot`, `componentResults`, caller plan, caller approval, произвольный registry или произвольные display values. Каталог является immutable build-internal dependency; browser API регистрации, injection, удалённой загрузки каталога и пользовательского approval flag нет. Selected locale не передаётся в Analysis/Safety.

Новый bundle получает отдельную identity и результаты private qualification. Наличие того же frozen кода внутри нового bundle не превращает его в прежний approved artifact.

## 4. Typed bindings и факты

Разрешены только bindings конкретного frozen `templateId + templateVersion + role`, уже разрешённые Safety. Localizer повторно проверяет точный набор имён, типы, диапазоны, cardinality и допустимые enum; лишнее поле или неподдерживаемый вариант — ошибка всего представления.

| Вид | Разрешённое представление |
| --- | --- |
| Число, rating, hours, delta, count, category index | То же значение и знак без нового arithmetic, rounding, unit conversion, aggregation или изменения временного scope. Сохраняется signed zero. |
| Frequency, direction, evidence basis, dimension, ordinal change | Только закрытое reviewed display mapping исходного токена; исходный токен остаётся идентичным. Категории не превращаются в количественную шкалу. |
| Trusted metric/unit/scope labels | Только reviewed соответствие конкретному canonical discriminator. |
| Rule/template/field identities | Literal technical identifier; localized label допускается отдельно. Нельзя заменить identity произвольным человеческим объяснением правила. |
| User-authored strings | Не переводить, не классифицировать и не включать в новые analytical bindings. История и формы сохраняют их как user content. |

Для первой версии v2 numeric lexical representation сохраняется по старому formatter, включая `-0`; локализованные подписи передают смысл единиц. Изменение decimal separator или numeral system потребует отдельного точного lossless formatting contract и проверок round-trip. Оно не включается неявно в перевод.

## 5. Закрытый locale catalog и review

Target locales: `en, de, ru, fr, es, it, pt, nl, pl, uk, cs, sk, hu, ro, bg, el, tr, sv, no, da, fi, ar, he, hi, zh, ja, ko, id, ms, th, vi`. Для `zh` применяется существующая UI metadata `zh-Hans`; alias resolution остаётся presentation concern.

Каждый catalog entry фиксирует:

- `catalogVersion`, `presentationTemplateId`, `presentationTemplateVersion`, `canonicalTemplateId`, `canonicalTemplateVersion`, `role`, допустимые surfaces и locale;
- exact reviewed full body либо exact reviewed summary body, без runtime выбора синонимов;
- точные required placeholders и их binding types; закрытые enum/label mappings;
- связь summary с исходными компонентами и матрицу сохранения существенных qualifications;
- review status, hash reviewed bytes и ссылку на semantic/native-language review evidence.

Release manifest фиксирует hash полного каталога и supported locale set. Точность review обеспечивается versioned evidence, а не переданным renderer значением `approved: true`.

Покрытие full bodies — 30 entries на каждую из 31 locales, в том числе недостижимые сейчас registered entries. Summary — отдельный закрытый инвентарь по поддерживаемым INSIGHT identities и manifest shape; неизвестный summary запрещён. Structural UI labels, availability/error text и accessibility labels также проходят review. **Точных новых body/summary переводов этот документ не содержит. Их начальный статус — `PENDING_SEMANTIC_REVIEW`.**

Необходимы проверка semantic equivalence относительно canonical body и проверка носителем языка. Совпадение строк с English само по себе не ошибка: identifiers и некоторые слова совпадают законно. Непустое значение ключа, машинный перевод и historical browser PASS не подтверждают semantic review.

## 6. Summary и expandable details

Summary является аналитическим текстом и требует собственного approved identity/version. Он может сокращать только формулировку утверждённых фактов, не создавать новый assessment. Запрещены LLM paraphrase, causal/advice claims и усиление «изменились записанные оценки» до «достигнут прогресс/успех» без соответствующего разрешённого факта.

`APPROVED_BUNDLE` сохраняет полный MF3 (5 компонентов) или MF4 (9 компонентов) и прежний порядок component identities. Предлагаемая новая группировка:

1. Видимые approved summary blocks для присутствующих primary/secondary.
2. Видимые qualifications, необходимые для правильного понимания summary, включая относящиеся к его фактам ограничения и capability gap.
3. Опциональное disclosure с полным localized approved bundle: все INSIGHT/WHY/capability components, в исходном порядке.

Нельзя спрятать в collapsed details оговорку, без которой видимый summary становится сильнее canonical presentation. Полный набор компонентов обязан присутствовать в DTO и быть доступен независимо от состояния disclosure. Не допускаются фильтрация secondary, omission WHY, частичный mount и новый technical смысл в aria/title/tooltip.

Это **предложение новой версии layout contract**, требующее review. Оно не утверждает, что текущая specification разрешает дополнительные summary blocks или collapsed bundle. Пока эта группировка и exact copy не приняты, v2 не активируется.

`FALLBACK_ONLY` выводит только утверждённый localized fallback и не создаёт summary. `UNAVAILABLE` не является verdict или Safety fallback.

## 7. Private render DTO

Предлагаемая структурная форма `pheisiraetha-render-v2` содержит только:

| Поле | Значение |
| --- | --- |
| `dtoVersion` | Точная новая render version. |
| `mode` | `APPROVED_BUNDLE`, `FALLBACK_ONLY` или `UNAVAILABLE`; это render contract, без нового Safety verdict. |
| `locale`, `htmlLang`, `dir` | Разрешённая selected locale и trusted metadata; `ar/he` имеют `rtl`. |
| `catalogVersion`, `catalogDigest` | Identity qualified trusted catalog. |
| `bundleIdentity` | Exact approved component identities/manifest shape текущего вызова. |
| `summaryBlocks` | Approved presentation identity/version, связь с canonical components и завершённый plain text. |
| `components` | Полный ordered render-only набор: identity, surface, role, slot, version, завершённый localized plain text. |

Все nested objects/arrays immutable. В DTO нет raw bindings, snapshots, source references, diagnostics, engine interpretation или text-producing callbacks. Для unavailable списки пусты; для fallback — один exact fallback component и пустой summary; для approved — exact 5/9 components и соответствующий закрытый summary inventory.

Transaction authority передаётся отдельно как private opaque object identity, а не как сериализованный caller token или поле DOM. Renderer использует `textContent`; все допустимые structural elements/disclosure semantics закрыты контрактом. Technical identities попадают в видимые details только если конкретный reviewed display contract это разрешает.

## 8. Intention ownership, provenance и freshness

Один analytical transaction принадлежит одному выбранному существующему intention. Нельзя смешивать его cycles с другими intentions, сортировать их иначе или заново выбирать history по ID. Будущий v2 source adapter обязан сохранять single-intent frozen source contract, literal значения и порядок; соответствие projection исходному intention проверяется отдельно от localized renderer.

Private transaction authority связывает одновременно committed state object identity, выбранный `intentionId`, generation, selected locale, mounted host и qualified bundle/catalog identities. Изменение intention, locale, committed state, import/delete/reset, navigation или host replacement инвалидирует authority до нового evaluation. Проверка повторяется перед mount; stale subtree удаляется целиком. Старый summary не остаётся видимым при переключении intention.

Safety уже проверяет sourceRefs при resolution. Его текущий approved presentation содержит разрешённые значения, а не публичный provenance ledger. V2 не реконструирует и не отображает raw references из plan/engine. Если пользователю понадобятся cycle IDs или source paths, для них потребуется отдельный закрытый provenance display contract с точной связью с текущим approved component. Название «technical details» не предоставляет дополнительных полномочий.

## 9. Fail closed, persistence и доступность

Missing/unreviewed locale body, несовпадение catalog hash/version, неизвестный placeholder/enum, несовместимый binding, неполный bundle или stale authority означают удаление всего v2 analytics subtree. Не подставлять English body в другую selected locale и не показывать остальные прошедшие компоненты. Локализатор не производит fallback сам: он показывает fallback только из фактического `SafetyResult.presentation` с соответствующим mode.

Нейтральный ordinary availability status допускается только после review его точного текста/роли. Он не интерпретирует данные и не сохраняет старую аналитику. До наличия approved status copy допускается отсутствие analytics subtree.

Все аналитические значения, presentation DTO, summary, source snapshots, approvals, generation и bindings остаются ephemeral. Не добавлять их в localStorage, backup, сеть, telemetry или subscription/account state. Статические versioned code/catalog assets могут входить только в отдельно квалифицированную release inventory.

Для disclosure требуются keyboard operation, видимые focus states, localized accessible name, корректное expanded state и сохранение logical reading order. User-authored mixed-script content использует isolation/auto direction; technical IDs и точные числа изолируются как LTR, где это необходимо. Проверяются 320px, увеличение шрифта/zoom, Arabic/Hebrew и screen readers. Новая layout qualification не заменяет старую frozen RTL matrix.

## 10. Acceptance и границы активации

| ID | Обязательный результат |
| --- | --- |
| V2-L01 | 30 full templates × 31 locales и весь summary/label inventory имеют exact identity/type/placeholder coverage и semantic/native review evidence. |
| V2-L02 | Неполный, unreviewed, повреждённый и чужой catalog не даёт аналитического DOM и English fallback. |
| V2-A01 | Один source даёт неизменные Analysis selection, Safety verdict, identities, значения и provenance при всех locale. |
| V2-A02 | MF3/MF4, fallback, unknown identity, missing/extra binding, конфликтующий provenance, signed zero и list cardinality проверены целиком. |
| V2-A03 | Summary проходит review nonamplification; необходимые qualifications видимы до раскрытия; details содержат полный 5/9 bundle в правильном порядке. |
| V2-T01 | Смена intention/locale, import/delete/reset/save failure и obsolete host не оставляют stale/partial DOM. |
| V2-P01 | Storage/backup/network не получают analytical objects; user content/IDs/cycle order не изменены. |
| V2-U01 | Все locale surfaces, accessibility labels, mobile/zoom/RTL/disclosure проверены; physical-device evidence отличается от emulation evidence. |
| V2-H01 | Старые frozen sources/specifications/verifiers/artifacts/archives и production behavior остаются byte-identical; старые исторические проверки сохранены. |

Синтетические harness strings допустимы только в изолированных тестах и не считаются approved переводами или выполнением V2-L01. Historical PR #8 156/156 проверяет его старую scope, а не этот контракт: [locale flows](https://github.com/ugreat653-cyber/pheisiraetha-app/blob/2edd56fb7761b50f52c2e074284830e46b9080eb/docs/first-checkin-ux/verify-first-checkin.cjs#L667) охватывают guidance/fallback; [frozen browser matrix](https://github.com/ugreat653-cyber/pheisiraetha-app/blob/2edd56fb7761b50f52c2e074284830e46b9080eb/browser-packaging/integration/real-browser.test.cjs#L604) намеренно сохраняет canonical English analytics.

Включение требует отдельно принятых exact summary/layout contract, reviewed catalog всех 31 locales, private qualification и разрешённого release candidate. Документ и data-foundation работа сами по себе не разрешают изменение public app, merge, deployment или ослабление исторических gates.
