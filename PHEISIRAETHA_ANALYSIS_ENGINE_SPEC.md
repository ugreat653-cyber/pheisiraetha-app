# PHEISIRAETHA ANALYSIS ENGINE SPECIFICATION

**Phase 1 — Model & Rule Specification. Статус: предложение для проверки, не реализация.**

Дата: 1 октября 2026. Язык документа: русский; имена полей, rule IDs и примеры интерфейсного текста — английские.

Исследованная production-точка:

| Параметр | Значение |
|---|---|
| Репозиторий | `ugreat653-cyber/pheisiraetha-app` |
| HEAD main | `255a5d9d27461dcacaebc1bc80ab322dd54b4de8` |
| Commit message | `Keep cancel buttons on one line across languages` |
| CACHE | `pheisiraetha-v16` |
| Live | https://ugreat653-cyber.github.io/pheisiraetha-app/ |
| Persisted version | `0.1.0` — не путать с CACHE или названием beta release |
| Изменения в этой Phase | Только этот отдельный документ. Application files, schema, CACHE и production не изменяются. |

## Решение, предлагаемое для Phase 2

Analysis — вычисляемый, локальный, воспроизводимый слой поверх **реально сохранённых observations**. Он показывает один основной insight и, при необходимости, одно дополнительное наблюдение. Каждый результат содержит источники, сработавшие условия, ограничения и один добровольный следующий фокус наблюдения.

Уже доступны сравнения зарегистрированных ratings, времени, категорий и explicit revision events. Сейчас **нельзя надёжно вычислить функциональное сохранение намерения, семантический ненамеренный дрейф, рост внешних препятствий, отсутствующие необходимые условия или объективное выполнение success criteria**. Для этих частей предусмотрены ограничения и gap analysis, а не вымышленные оценки.

Все численные пороги ниже — **предлагаемые продуктовые эвристики**, а не клинические, статистически валидированные или физические законы. Метки evidence описывают повторяемость записей, а не вероятность истинности гипотезы. Документ не утверждает, что 3 или 5 cycles доказывают закономерность.

## 1. Current Data Inventory

### 1.1. Источники и правила чтения

Inventory составлен по исходникам указанного HEAD, а не по старому product description. `PRODUCT_SPEC.md` содержит более раннее описание и не определяет текущую схему.

| Источник | Проверенный участок | Что устанавливает |
|---|---|---|
| `app.js` | `fresh`, `RIS_FIELDS`, `isValidCycle`, `isValidBackup` | Корневая структура, имена, допустимые типы и enum values |
| `app.js` | `load`, `setLanguage`, `persist` | Чтение и запись; язык UI хранится отдельно |
| `app.js` | `startWizard`, `renderIEP`, `renderOOP`, `saveStep` | Defaults, шкалы, шаги UI и сохранение значений |
| `app.js` | `bindRIS` | Создание RIS и его прямое перезаписывание без revision event |
| `app.js` | обработчик `wizComplete` в `bindWizard` | Состав completed cycle, partial revision patch, обновление текущего RIS |
| `app.js` | `renderHistory`, `bindData` | History как представление cycles; JSON содержит state |
| `locales.js` | английский semantic source и 31 dictionary | Точный смысл вопросов, семидневные периоды, emotion labels |
| `sw.js` | `CACHE` | `pheisiraetha-v16` |

В таблицах `C` означает **реальный путь** `intent.cycles[i]`; `i` — индекс в сохранённом массиве, начиная с 0. «Сравнение» означает допустимость сравнения записанного значения, а не объективного измерения мира. «Структурированное» включает metadata и enum; свободный текст нельзя классифицировать по смыслу.

Ranges/enum в inventory — ограничения UI controls и/или backup validator, **не гарантия**, что каждая уже существующая запись им соответствует. `load()` проверяет только наличие truthy version; Complete не вызывает `isValidCycle`. В частности, `hours` преобразуется через Number без отдельного range check при сохранении; revision value после trim может оказаться пустым. Engine проверяет actual used values read-only, не расширяя и не исправляя production validation в этой Phase.

### 1.2. Metadata: 7 leaf paths

| Persisted field name | Смысл | Тип / допустимые значения | Каждый cycle? | Сравнение cycles | Free text? | Structured? | Безопасное deterministic использование |
|---|---|---|---|---|---|---|---|
| `version` | Версия формата пользовательской записи | string; приложение создаёт `0.1.0` | Нет, корень | Нет | Нет | Да | Выбор read-only adapter; неизвестная версия → unsupported, без переписывания |
| `lang` | Legacy поле записи, не текущий язык интерфейса | string; fresh=`ru`; backup validator допускает `ru` / `en` | Нет | Нет | Нет | Да | Только metadata. Не определять по нему язык отдельного cycle или emotion |
| `intent.id` | Идентификатор единственного активного intention | string; обычно UUID, fallback string | Нет | Только внутри одного id | Нет | Да | Не смешивать разные intentions; проверить uniqueness references |
| `intent.createdAt` | Время создания intention | string; UI создаёт ISO UTC, import принимает Date.parse-compatible string | Нет | Только chronology | Нет | Да | Не считать временем начала действий или датой первоначального RIS после всех edits |
| `C.id` | Идентификатор completed check-in | string; обычно UUID | Да | Идентичность | Нет | Да | Traceability; duplicate IDs исключают ambiguous pattern references |
| `C.createdAt` | Время нажатия Complete / сохранения cycle | string; обычно ISO UTC | Да | Да, после проверки chronology | Нет | Да | Порядок и приблизительные reporting windows; не точное время всех событий |
| `C.intentional` | Записанный ответ о сознательном изменении | enum `yes` / `no` / `unsure`; default=`no` | Да | Да, категориально | Нет | Да | Revision boundary и статус ответа. `no` не доказывает ненамеренность изменения |

`version` и `lang` создаются в `fresh`; отсутствие/нестандартное значение в уже загруженном state возможно, поскольку `load()` не запускает полный backup validator. Adapter не исправляет такие записи.

### 1.3. RIS: 6 leaf paths

| Persisted field name | Смысл | Тип / шкала | Каждый cycle? | Сравнение cycles | Free text? | Structured? | Безопасное использование |
|---|---|---|---|---|---|---|---|
| `intent.ris.primary` | Что пользователь хочет создать, достичь, изменить или завершить | string; UI требует непустой trimmed text | Нет; mutable current RIS | Исторические значения отсутствуют | Да | Нет | Показать текущий reference; только буквальное сравнение текста |
| `intent.ris.success` | Что должно быть верно для признания успеха | string; required в UI | Нет | Нет historical baseline | Да | Нет | Показать критерии рядом с outcome; не вычислять их выполнение |
| `intent.ris.scope` | Что включено в intention/project | string; required | Нет | Нет historical baseline | Да | Нет | Показать текущий scope; не классифицировать scope creep |
| `intent.ris.nonGoals` | Что сознательно не включено | string; required | Нет | Нет historical baseline | Да | Нет | Показать reference; не выводить нарушение границ |
| `intent.ris.constraints` | Ограничения, правила, условия | string; required | Нет | Нет historical baseline | Да | Нет | Показать reference; не извлекать необходимые условия или obstacles |
| `intent.ris.rationale` | Почему intention важен пользователю | string; required | Нет | Нет historical baseline | Да | Нет | Показать reference; не оценивать личность, мотивацию или убеждения |

Прямое Edit current intention заменяет `intent.ris` целиком. Оно не создаёт cycle, revision event, RIS version, `updatedAt` или before snapshot. Explicit Revision тоже обновляет RIS, но сохраняет только новые значения выбранных dimensions в cycle. **Полной исходной версии RIS в history нет.**

### 1.4. CIE: 6 leaf paths

| Persisted field name | Смысл | Тип / шкала | Каждый cycle? | Сравнение cycles | Free text? | Structured? | Безопасное использование |
|---|---|---|---|---|---|---|---|
| `C.cie.primary` | Текущее описание objective | string; UI требует непустой текст | Да | Буквально, не семантически | Да | Нет | Side-by-side wording; recorded comparison basis |
| `C.cie.success` | Текущие success criteria | string; required | Да | Буквально | Да | Нет | Изменение wording блокирует объединение outcome ratings в один goal-specific trend |
| `C.cie.scope` | Текущее описание scope | string; required | Да | Буквально | Да | Нет | Изменение wording — граница сопоставимости, не доказательство drift |
| `C.cie.nonGoals` | Текущие non-goals | string; required | Да | Буквально | Да | Нет | Не превращать отсутствие точного совпадения в нарушение намерения |
| `C.cie.constraints` | Текущие constraints | string; required | Да | Буквально | Да | Нет | Не классифицировать ограничения по словам или длине |
| `C.cie.rationale` | Текущее rationale | string; required | Да | Буквально | Да | Нет | Не оценивать качество мотивации |

CIE начинается **пустым**, не копирует RIS. Инструкция специально просит описать текущий project и не воспроизводить прежнюю формулировку. Поэтому differing wording ожидаем и сам по себе не является DEITHIATHO.

### 1.5. IEP: 9 leaf paths

| Persisted field name | Смысл | Тип / шкала / значения | Каждый cycle? | Сравнение cycles | Free text? | Structured? | Безопасное использование |
|---|---|---|---|---|---|---|---|
| `C.iep.desire` | Насколько сильно сейчас хочется outcome | number 0–10; UI step 1; default 5 | Да | Зарегистрированные ratings | Нет | Да | Изменения desire; не качество intention и не causal force |
| `C.iep.belief` | Насколько outcome сейчас кажется возможным | number 0–10; UI step 1; default 5 | Да | Ratings | Нет | Да | Изменения perceived possibility; не достоверность убеждений и не прогноз |
| `C.iep.emotion` | Выбранная emotion category в локализованной форме | string; UI выбирает 1 из 10 labels; import принимает любую string | Да | Через однозначный dictionary mapping или exact label | Не в UI; произвольная string возможна после import | Частично: string без canonical ID | Повтор выбранной категории; неизвестный label не классифицировать |
| `C.iep.emotionIntensity` | Сила выбранной эмоции | number 0–10; UI step 1; default 5 | Да | Только при известной одинаковой emotion category | Нет | Да | Интенсивность этой эмоции; не настроение, wellbeing или «негативность» |
| `C.iep.mental` | Текущее mental attention and effort | number 0–10; UI step 1; default 5 | Да | Ratings | Нет | Да | Mental contribution отдельно от action hours, energy и persistence |
| `C.iep.practical` | Текущее practical effort | number 0–10; UI step 1; default 5 | Да | Ratings | Нет | Да | Self-reported practical contribution; не объективный объём или эффективность |
| `C.iep.frequency` | Частота thinking / rehearsal / visualisation / attention | enum `freq0`…`freq5`; default `freq2` | Да | Ordinal categories | Нет | Да | Выше/ниже по порядку; не число thoughts, не часы и не persistence |
| `C.iep.actions` | Описание действий, времени, денег, ресурсов, physical effort | string; default пустая; не обязательна | Да | Presence / exact text; не semantics | Да | Нет | Показать запись; не считать actions, затраты денег, качество или источник действия |
| `C.iep.hours` | Approximate concrete-action hours **за последние 7 дней** | number 0–168; UI step 0.25; default 0 | Да | Только с учётом overlapping windows | Нет | Да | Recorded hours; не фактический energy expenditure и не автоматически «без действий» при 0 |

Validator допускает finite дробные значения внутри диапазонов ratings и hours; он не проверяет UI step. Adapter не округляет такие imported values. Нулевое значение может быть действительной записью, а не missing.

Frequency order: `freq0` Not at all; `freq1` Less than once per day; `freq2` About once per day; `freq3` Several times per day; `freq4` Many times per day; `freq5` Almost continuously. Шаги не равноудалены: запрещены среднее frequency, «на 40% больше attention» и превращение category в часы.

Emotion categories в semantic source, по индексам 0–9: Love / affection; Joy / excitement; Hope / positive anticipation; Calm / contentment; Fear / anxiety; Anger / frustration; Sadness / disappointment; Shame / guilt; Neutral / little emotion; Other. Они не образуют шкалу от плохого к хорошему. Default — индекс 2. Сам `emotionIndex` не сохраняется.

В проверенном registry 31 языка, по 10 emotion labels; 306 различных normalized labels, без labels, сопоставленных разным индексам. Это позволяет **консервативный derived mapping** существующих известных labels. Неизвестные labels, будущие неоднозначности и свободное описание `Other` не угадываются. `lang` в state не задаёт язык emotion string.

### 1.6. OOP: 6 leaf paths

| Persisted field name | Смысл | Тип / шкала / значения | Каждый cycle? | Сравнение cycles | Free text? | Structured? | Безопасное использование |
|---|---|---|---|---|---|---|---|
| `C.oop.currentState` | Описанный observable current situation/result | string; default пустая; optional | Да | Presence / exact text | Да | Нет | Отобразить как запись пользователя; не извлекать verified facts |
| `C.oop.achievement` | Self-rated extent of achieved desired outcome сейчас | number 0–10; UI step 1; default 0 | Да | Ratings, если recorded goal basis сопоставим | Нет | Да | Raw delta и повторяемость ratings; 10 не означает verified completion |
| `C.oop.events` | Observable events/changes **за последние 7 дней** | string; default пустая; optional | Да | Presence / exact text | Да | Нет | Показать; не классифицировать событие как success/failure/obstacle |
| `C.oop.direction` | Recorded direction **за последние 7 дней** | enum `toward` / `none` / `away` / `mixed` / `unknown`; default `none` | Да | Categories при учёте reporting windows | Нет | Да | Записанное направление; `mixed` и `unknown` сохраняют неопределённость |
| `C.oop.evidence` | Какие bases пользователь выбрал для OOP assessment | array of enum; может быть пустым | Да | Set membership, не strength score | Нет | Да | Объяснить заявленный basis; не считать независимые подтверждения |
| `C.oop.external` | Recorded relevant circumstances outside direct control | string; default пустая; optional | Да | Presence / exact text | Да | Нет | Контекст для просмотра; не выявлять рост external obstacles |

Evidence values: `direct`, `documented`, `otherPerson`, `subjective`, `insufficient`, `other`. Это **самоописание источника**, не приложенные документы или независимая проверка. Import не требует уникальности элементов array; adapter использует derived set, сохраняя raw array неизменным. Несколько checkboxes не увеличивают confidence арифметически.

### 1.7. Intentional Revision: 6 optional leaf paths

| Persisted field name | Смысл | Тип / значения | Каждый cycle? | Сравнение cycles | Free text? | Structured? | Безопасное использование |
|---|---|---|---|---|---|---|---|
| `C.revision.primary` | Новый objective для выбранной dimension | string | Только если выбрано при `yes` | Selection occurrence; raw new text | Да | Key — да; value — нет | Считать зарегистрированный выбор dimension; не величину изменения |
| `C.revision.success` | Новые success criteria | string | Условно | То же | Да | Частично | Boundary outcome comparability |
| `C.revision.scope` | Новый scope | string | Условно | То же | Да | Частично | Boundary comparability |
| `C.revision.nonGoals` | Новые non-goals | string | Условно | То же | Да | Частично | Не failure и не drift |
| `C.revision.constraints` | Новые constraints | string | Условно | То же | Да | Частично | Не извлекать условие автоматически |
| `C.revision.rationale` | Новый rationale | string | Условно | То же | Да | Частично | Не диагностика и не оценка мотивации |

`revision` создаётся как `{}` для каждого completed cycle. При `yes` UI требует хотя бы одну selected dimension. Persisted keys показывают **выбранные для замены dimensions**, но не доказывают, что текст реально изменился: before value отсутствует. Empty revision input может fallback на CIE value. `selected` и draft revision values для невыбранных dimensions не сохраняются.

Import validator допускает некоторые комбинации, которые UI обычно не создаёт: `yes` + `{}`, `no` / `unsure` + непустой patch, empty revision value. Engine обязан распознать их как ограничение / conflicting metadata, не исправляя запись.

### 1.8. Containers, History и отдельные keys

Инвентаризировано **40 leaf-path templates**: metadata 7 + RIS 6 + CIE 6 + IEP 9 + OOP 6 + optional revision values 6. Это число путей, не 40 измеряемых переменных и не 40 обязательных полей в каждом cycle.

| Persisted container | Фактическое содержимое |
|---|---|
| `intent` | `null` либо один current intention object; нет сохранённого списка разных intentions |
| `intent.ris` | Текущий mutable reference с шестью strings |
| `intent.cycles` | Array completed cycles в порядке добавления; импорт может содержать некорректную chronology |
| `C.cie` | Шесть strings |
| `C.iep` | Девять fields |
| `C.oop` | Шесть fields |
| `C.revision` | Partial object: 0–6 новых text values |

History **не отдельная persisted entity**. UI показывает reversed copy `cycles`, текущий RIS primary, дату cycle, achievement/desire/mental/practical, `events || currentState`, intentional response и direction. Остальные raw cycle fields сохраняются, даже если краткий History их не показывает. Cycle number и число cycles вычисляются; persisted `cycleNumber`, history title, insight и nextFocus отсутствуют.

| Storage key | Что реально хранится | Участие в analysis |
|---|---|---|
| `pheisiraetha_v01` | JSON state описанной формы | Read-only source of truth |
| `pheisiraetha_language_v01` | Отдельная UI preference: один из 31 codes | Только presentation; не добавить в пользовательский JSON |
| `pheisiraetha_onboarding_v01` | string `1` означает completed onboarding | Не использовать для оценки поведения или evidence |

Drafts `wizard`, `risDraft`, `step`, `emotionIndex`, `selected` — runtime state, не completed observations. Cancelled и незавершённые check-ins не являются cycles и не участвуют в engine. JSON backup сериализует state; preference и onboarding keys не входят в этот JSON.

### 1.9. Чего нет в production schema

Нет отдельного energy/mood/persistence score; baseline RIS snapshot; RIS version ID; revision before values; журнал direct RIS edits; cycle language; rating-confirmation flags; typed obstacles; obstacle severity; necessary-condition list/status; criterion-level outcome status; evidence attachments/references; actor of physical contribution; actual start/end reporting dates; stage-level timestamps; generated insights; причинных labels.

## 2. Mapping current data → PHEISIRAETHA concepts

Каноническая последовательность сохраняется:

`DEINEIZA → FINAEFIA → VIASIATAE ⇄ KAEKITO → VAQUQA → LIPHOZEI → следующий цикл`.

Центральная ось: `FINAEFIA ⇄ DEITHIATHO`. Engine исследует записи о процессе между intention и outcome; он не сокращает весь процесс до achievement score.

| Concept | Существующие источники | Что допустимо | Чего нельзя утверждать |
|---|---|---|---|
| DEINEIZA | RIS, CIE, desire | Зарегистрированное содержание intention и сила желания | Полное измерение возникновения intention или мыслительной энергии |
| FINAEFIA | CIE wording, текущий RIS, explicit revisions | Limited proxy: повторяемость описания и agreement с текущим reference | Функциональная структура доказанно сохранялась; LEITEITHA обеспечивает FINAEFIA |
| DEITHIATHO | CIE wording differences, `intentional`, revision metadata | Neutral discrepancy / уточнение смысла; `no` recorded | Доказанный ненамеренный семантический drift или его размер |
| VIASIATAE | practical, hours, actions | Recorded practical contribution человека, как сформулирован вопрос | Полная physical energy; contribution любого actor; productivity или причинный эффект |
| KAEKITO | external, events, currentState, direction, evidence | Recorded context и direction; выбор external observation как следующего фокуса | Severity/рост obstacles; causal response of environment |
| VAQUQA | constraints/success text, external/currentState | Показать названные пользователем условия без автоматического извлечения | Какие условия необходимы и какие отсутствуют |
| LIPHOZEI | achievement, direction, currentState, events, evidence | Self-reported observed outcome и его recorded changes | Объективная материализация; критерии выполнены; событие вызвано намерением |
| LEITEITHA | Persisted cycles / History | Сохранение записей и доступ к ним | Сохранение функциональной структуры намерения |
| RULAFOSHAE | Derived evidence links и совместные изменения | Прослеживаемые recorded relationships | Причинная связь или внешняя синхронизация |
| THEFEIXI | Derived graph: cycle ↔ field ↔ rule ↔ insight | Объяснение происхождения вывода | Новый persisted graph или источник дополнительных фактов |

## 3. Observable vs currently unobservable variables

| Уровень | Сейчас наблюдаемо | Ограничение |
|---|---|---|
| Exact record facts | Значение field, наличие текста, выбранный enum, revision keys, дата сохранения | «Recorded», а не объективно проверенное |
| Derived record comparisons | Delta ratings, диапазон, одинаковые labels/text, ordinal frequency changes | В рамках одного пользователя и сопоставимых записей |
| Repeated record patterns | Повтор значения/направления и совместных изменений при заданных gates | Эвристические patterns; нет causal / statistical confidence |
| Functional intention retention | Не наблюдаемо напрямую | Нужен historical reference и explicit semantic assessment |
| Unintentional semantic drift | Не наблюдаемо надёжно | Natural rewording, manual RIS edits и default `no` неотличимы от drift |
| External obstacle trajectory | Не наблюдаемо | Только free text, без категории/severity/status |
| Missing necessary conditions | Не наблюдаемо | Нет linked typed conditions |
| Success criterion completion | Не наблюдаемо автоматически | Text criteria + global achievement rating не задают проверяемую формулу |
| Energy, persistence, psychological state | Не наблюдаемо | Не переименовывать mental/desire в отсутствующую переменную |

## 4. Analysis domains

| Domain | Phase 2 без новых persisted fields | Concept / ограничения |
|---|---|---|
| A. Intent stability | Wording reflection и повтор записанного CIE | FINAEFIA proxy, без functional score |
| B. Unintentional drift | Neutral wording discrepancy + review question | DEITHIATHO не подтверждается автоматически |
| C. Practical contribution | Practical rating, separate hours, actions shown literally | VIASIATAE partial observation |
| D. Mental contribution | Mental rating, attention frequency, desire/belief separately | Не action; не energy; не persistence |
| E. Environment response | External-context reflection; direction and evidence coverage | KAEKITO partial; никаких inferred obstacles |
| F. Condition gap | Explicit unavailable result + возможность записать наблюдение | VAQUQA gap; condition finding отключён |
| G. Observed outcome | Achievement/direction record comparisons | LIPHOZEI self-report, не proof of success |
| H. Revision pattern | Counts of explicit revision selections | Intentional restructuring, не failure / DEITHIATHO |
| Дополнительно: emotions | Known category recurrence; same-category intensity; concurrent recordings | Не valence ranking и не diagnostic assessment |
| Дополнительно: evidence quality | Missing / conflicting metadata, reporting windows, weak comparability | Основание для ограниченного результата вместо рекомендации |

## 5. Exact proposed deterministic rules

### 5.1. Общие определения и gates

1. Анализировать immutable read-only snapshot одного `intent.id`. Порядок `cycles` не изменять. Array index и cycle ID входят в provenance.
2. Для каждого used value проверить фактический тип и допустимый range/enum. `Number("5")`, clipping, filling defaults и rounding запрещены. Неизвестные поля игнорируются и не становятся evidence.
3. Text normalization `N(s)` = Unicode NFC, CRLF/CR → LF, outer trim. Никакого case folding, перевода, stemming, sentiment, keywords, edit-distance drift score или удаления пунктуации. Missing/blank не равно «нет события».
4. `sameText(a,b)` определено только для двух непустых валидных strings с `N(a)=N(b)`. Иначе `different_wording`, `missing` либо `invalid`, не semantic change.
5. `signature(C)` = tuple из шести normalized CIE values в фиксированном порядке RIS_FIELDS. Нет hashing с потерей возможности объяснить values.
6. `currentSegment` — suffix после последнего boundary: explicit `intentional=yes`, `unsure`, invalid revision metadata, invalid ordering, missing required CIE либо change `signature` относительно соседнего cycle. Последний boundary-cycle с `yes` не включать в post-revision segment: OOP в нём собран до применения нового RIS. Cycle с новым CIE signature при `no` начинает новый segment; его текст показан нейтрально. Boundary нельзя «перепрыгнуть», выбрав только одинаковые записи.
7. `recordedBasisSame` = все шесть CIE strings одинаковы во **всех** cycles сегмента между первым и последним used cycle; каждый ответ `intentional=no`, patch пустой. Это условие означает только одинаковый **зарегистрированный** basis, не сохранность исторического RIS по смыслу.
8. `referenceProvenance` всегда отмечает `historical_RIS_unavailable` для старой schema. Matching текущему RIS не устраняет этот gap. Нельзя reverse-reconstruct старые RIS из patches: before values и direct edits потеряны.
9. Для patterns выбрать последние не более пяти time-spaced cycles `W` в currentSegment по алгоритму раздела 6. Для ordinary comparison используются две соседние сохранённые записи; overlapping reporting windows раскрываются отдельно.
   Patterns используют только timestamps в однозначном ISO 8601 формате с timezone и валидной calendar date; ambiguous Date.parse-compatible imported date остаётся raw metadata и блокирует chronology-dependent pattern. Для данного rule required structured fields должны быть valid во всех промежуточных cycles между earliest/latest used references; исключение близкой записи из W не скрывает missing/invalid input. Это domain-level gate, не запрет unrelated observation.
10. Вектор ratings валиден, если каждое значение finite number 0–10. `flat_N(x)` = `max(x)-min(x)≤1`. Это «ratings stayed within 1 point», не доказательство неизменности реального процесса.
11. `D3(x)` = `x1-x3≥2` AND обе соседние deltas `≤-1`. `U3` — mirror (`x3-x1≥2`, обе deltas `≥1`). Для 4 cycles проверить **последние 3**, показав исключённую четвёртую; не искать лучший subwindow.
12. `D5(x)` = `median(x1,x2)-median(x4,x5)≥2` AND минимум 3 из 4 adjacent deltas `≤-1` AND нет opposite delta `≥2`. `U5` — mirror. Median двух значений здесь = их arithmetic midpoint; это эвристика записанных points, не inferential statistics.
   Dispatcher: при 3 spaced observations применяется D3/U3; при 4 — последние 3; при 5 или больше — D5/U5 на последних пяти выбранных. Если D5 не проходит, fallback на более удачный D3 subwindow запрещён. Flat/low/category-recurrence predicates при 4 используют все 4 (более строгий scope), при 5 — все 5; exception про последние 3 относится только к trend predicate.
13. Если N=3 или 5 и любая adjacent rating delta по используемой переменной имеет `abs(delta)≥4`, pattern для этой переменной подавить с `LARGE_STEP_REQUIRES_REPEAT`. Разрешён raw comparison. Для N=4 проверка large step охватывает все 4 выбранные записи, даже если trend проверяется на последних 3. Нельзя выдавать pattern, основанный на резком одиночном скачке.
14. `low_N(x)` = каждое rating `≤3`, N≥3. Слово «low» относится только к указанной шкале. Для N=4 использовать все 4; для 5 — все 5. Large-step guard также действует.
15. Hours не складываются по cycles. `Hdown` / `Hup` для corroboration = все consecutive hours deltas соответственно `≤0` / `≥0` и абсолютный endpoint change ≥1 h; сравнение только в `W`. `Hflat` = range ≤0.25 h. Другие hours sequences = varied. Нет productivity score и hours-per-achievement ratio.
16. Outcome `basisStatus(C)`:
    - `insufficient`, если evidence содержит `insufficient`, независимо от других checkboxes;
    - `not_recorded`, если empty set;
    - `unspecified`, если только `other`;
    - `reported`, если есть хотя бы один из `direct`, `documented`, `otherPerson`, `subjective` и нет `insufficient`.
    Эти labels не ранжируют людей или sources. `subjective` допустим для **recorded rating pattern**, с явной подписью self-report. Никакая category не делает outcome verified.
17. `outcomeEligible(W)` = recordedBasisSame AND каждый achievement valid AND direction ∈ {toward,none,away} AND каждый basisStatus=`reported`. `mixed` / `unknown`, missing basis и `insufficient` блокируют composite outcome pattern. CurrentState/events texts не превращаются в typed evidence.
18. Exact default-risk profile = IEP ratings все 5, известная emotion category=2, frequency=`freq2`, actions blank, hours=0; OOP achievement=0, direction=`none`, evidence empty, currentState/events/external blank. При полном совпадении → `POSSIBLE_UNREVIEWED_DEFAULTS`. Не утверждать, что пользователь не отвечал; подтверждение выбора не сохраняется. Только reflection с просьбой проверить recorded assessment, не pattern.
19. Непустые texts не доказывают проверку sliders; отдельное rating 5 или 0 не исключать как missing. Во всех outputs отметить `rating_confirmation_unrecorded` как ограничение имеющейся schema.
20. Если prerequisites не выполнены, rule возвращает конкретный reason и использованные/excluded paths, а не подставляет значения. Eligible rules не зависят от UI language. Presentation locale не меняет candidate selection.

### 5.2. Каталог правил: INPUTS → RULE → OUTPUT → WHY

Все user-facing interpretations и next focuses ниже — templates, не диагностические или causal conclusions. Любой nextFocus пропускается через future safety boundary раздела 18. Rule IDs стабильны для traceability; не сохраняются в raw state.

| Rule ID / minimum | INPUTS → RULE | OUTPUT / interpretation | NEXT FOCUS / WHY |
|---|---|---|---|
| `REF-01` / 1 completed cycle | Latest CIE, current RIS, OOP, IEP; без trend operation | **First recorded reflection** при N_completed=1, иначе **Latest recorded reflection**. Показать current intention wording, outcome rating/direction/basis и один selected observation. Historical RIS не выдумывать | Один focus по алгоритму раздела 8; WHY показывает выбранный missing / recorded field |
| `QUAL-01` / 1 | Outcome basis absent/insufficient/unspecified, unknown direction, invalid required used field, default-risk profile | **More information is needed for this assessment**; status INSUFFICIENT для зависимого домена | “Consider recording one observable event and what your assessment is based on.” Не считать empty events доказательством отсутствия событий |
| `CMP-01` / 2 consecutive cycles | Valid numeric field from practical, mental, desire, belief, hours, achievement; intensity only same known non-Other category | Показать exact `before → after`, signed delta и dates. Abs rating delta≥2 = notable recorded change; ≤1 = nearby ratings. Hours показать без causal interpretation | “Consider observing whether this recorded change continues at the next check-in.” При changed CIE / revision — только raw comparison с несопоставимостью, не progress |
| `CMP-02` / 2 | Valid frequency enum pair | Выше / ниже / та же ordinal category; назвать обе категории | Наблюдать выбранную attention frequency отдельно от practical action. WHY — enums, не арифметика category codes |
| `INT-01` / 3 spaced cycles | Same six CIE strings, all no, empty patches, no default-risk | **The same intention wording was recorded repeatedly**; FINAEFIA wording proxy. При 5 — consistent recorded wording, не functional retention | “Consider checking whether this wording still describes the intention you mean.” Не просить копировать текст и не выдавать stability reward |
| `INT-02` / 3 spaced cycles | Для одной dimension один и тот же непустой CIE text во всех used cycles, он отличается от текущего RIS text; all intentional=no | **Repeated wording differs from the current reference**; LIMITED, не DEITHIATHO diagnosis. Не называть historical baseline original | “Consider checking whether this is a wording difference or a change in meaning.” WHY — side-by-side values + historical RIS gap. Может быть secondary observation без рекомендации |
| `TXT-01` / 1–2 | Непустые CIE/RIS либо adjacent CIE strings не совпадают | Neutral side-by-side reflection; на первом cycle без pattern; при wording change объяснить comparability boundary | Только вопрос о смысле, без drift score; показывать в reflection / requested explanation, не automatic high-priority alarm |
| `PRA-01` / 3 spaced cycles | D3(practical), либо D5 на пяти; same recorded basis; large-step guard | **Recorded practical effort decreased across these observations**; VIASIATAE rating proxy. Hours показать отдельно | “Consider observing one concrete action alongside your practical-effort rating next cycle.” WHY — exact ratings/deltas/threshold; не «работайте больше» |
| `PRA-02` / 3 | low_N(practical); same basis; no default-risk/large step | **Practical-effort ratings stayed in the 0–3 range**; не отсутствие действий | Наблюдать различие между rating и записанными actions/hours. Если hours высокие — показать их, не обесценить вклад |
| `MEN-01` / 3 | low_N(mental) или D3/D5(mental), stable recorded basis | **Recorded mental effort was low / decreased**; не low energy, attention disorder или loss of will | “Consider observing how your mental-effort rating changes while keeping practical effort separately recorded.” WHY — только mental values |
| `MEN-02` / 3 | Frequency category одинакова на всех W либо обе successive categories снижаются (3); на 5 минимум 3 strict decreases и ни одного increase | **Repeated / changing attention-frequency category**; без переводов в numeric frequency | Следующий focus — frequency, отдельно от mental intensity и actions. Нулевой code — «not at all» только в этом вопросе |
| `EMO-01` / 3 | Same uniquely mapped category across W | **The same emotion category was selected in these observations**; repeated label, не chronic mood | “Consider observing whether this category and its intensity remain the same next cycle.” WHY — exact labels и mapping index, без valence |
| `EMO-02` / 3 | Same known non-Other category AND D3/U3 или D5/U5 intensity; large-step guard | **Recorded intensity of [category] changed**. Joy intensity down и fear intensity up не переименовываются в ухудшение mental health | Наблюдать intensity этой категории; если category меняется — только separate descriptions, intensity trend недоступен |
| `OUT-01` / 3 | outcomeEligible AND D3/U3 либо D5/U5 achievement; no opposing recorded directions | **Self-rated achievement decreased / increased**; LIPHOZEI rating pattern | “Consider recording one observable event that helps you assess the same success criteria next cycle.” WHY — achievement values, direction values, declared bases |
| `OUT-02` / 3 | outcomeEligible AND flat_N(achievement) AND all directions=none | **Ratings stayed within 1 point and no meaningful change was selected**; не доказанная stagnation | Наблюдать один observable change относительно собственных criteria; WHY — range≤1 и enum records |
| `REL-01` / 3 | D3/D5 practical AND OUT-02 prerequisites; no Hup; no mixed signal guards | **Practical-effort ratings decreased while outcome ratings stayed nearby**; possible focus VIASIATAE, без causal link | Наблюдать **связь recorded action / recorded outcome** в следующем check-in. WHY — две отдельные серии и пороги; hours/external coverage disclosed |
| `REL-02` / 3 | U3/U5 practical AND U3/U5 achievement AND outcomeEligible AND direction not away; no Hdown/mixed guards | **These ratings increased together in your recorded observations** | “Consider observing whether the same co-change appears again, including any external circumstances.” Не «усилие привело к результату». WHY — совместные deltas, не correlation coefficient |
| `REL-03` / 3 | U/D mental ИЛИ U/D intensity при same known non-Other emotion category; practical flat_N; achievement flat_N; outcomeEligible; no mixed guards | **An internal rating changed while practical and achievement ratings stayed nearby**; case E. Mental branch не требует известной emotion category | Наблюдать internal change отдельно от внешнего процесса. Не связывать эмоцию с торможением outcome. Если обе internal series подходят, mental имеет фиксированный приоритет |
| `CTX-01` / 3 | practical flat_N; achievement D3/D5; outcomeEligible; directions not toward; no Hup/Hdown | **Outcome ratings decreased while practical-effort ratings stayed nearby**; KAEKITO — возможный следующий observation domain | “Consider recording one relevant external circumstance next cycle.” WHY — recorded decoupling + external variable currently unstructured. Не «obstacles выросли», даже если external text длиннее |
| `CTX-02` / 1 | external nonblank | **You recorded external context**; показать text только по желанию пользователя | Reflection focus может быть “Which part of this context would be useful to observe next?” Engine не выбирает из текста «главное препятствие» |
| `COND-01` / 1 | Existing constraints/success/external strings без typed linked conditions | **Condition-level assessment is not available from the current fields**; unavailable capability, не recurring warning card | “If useful, describe one condition whose status you want to observe.” Не объявлять это необходимым условием и не сохранять новый structured field |
| `REV-01` / latest cycle yes + valid nonempty patch | List patch keys; значения новые, not before/after diff | **You explicitly selected these dimensions for revision**; intentional restructuring; current post-revision baseline begins after this cycle | Наблюдать следующий outcome относительно revised intention. WHY — `intentional=yes` и keys; не failure, не drift |
| `REV-02` / 3 valid explicit revision events | Count key occurrences over all valid yes+patch events; фиксированный порядок dimensions | **[dimension] was selected in k of m recorded revision events**. Если ties — назвать все, максимум 6; не искусственный winner | Наблюдать ясность выбранной dimension; не советовать её заморозить. WHY — event IDs и keys, не оценка качества revisions |
| `MIX-01` / 1–3 depending on trigger | Invalid decision/patch pairing; declared direction=mixed; opposing rating/direction signals; practical trend opposed by hours trend | **Mixed / differently scoped evidence**; exact conflict described | Один focus: уточнить одну conflicting assessment / scope. Никакой усреднённой рекомендации «что делать» |

### 5.3. Exact mixed-signal predicates

- `decision_patch_conflict`: `intentional∈{no,unsure}` и patch nonempty; либо `yes` с empty/invalid patch. Rule REV-01 не срабатывает.
- `direction_mixed`: latest used direction=`mixed`. `unknown` — insufficient, не mixed. Эти статусы не превращаются в numeric 0.
- `achievement_direction_opposed`: в W с eligible bases D3/D5 achievement и хотя бы один `toward`, либо U3/U5 и хотя бы один `away`. Периоды current rating и past-7-days direction различаются, поэтому output говорит о разнонаправленных assessment signals, **не обвиняет пользователя в логическом противоречии**.
- `flat_achievement_direction_varied`: flat_N achievement, но хотя бы один toward/away. Записанные меры описывают разные аспекты; нельзя сформулировать OUT-02 «не было изменений».
- `practical_hours_opposed`: practical D3/D5 при Hup или U3/U5 при Hdown. Hours — past 7 days, rating — current effort. Показывать оба ряда; не отменять ни один и не вычислять общий practical score.
- `opposing_context_claim`: free text не классифицируется; engine не может вычислить этот predicate. Отсутствует основание утверждать consistency / stability external conditions.

Mixed gates подавляют только **зависимую** interpretation. Например неизвестная emotion string не блокирует валидное hours comparison. Но primary outcome/process recommendation не может игнорировать конфликт того же domain.

## 6. Minimum data thresholds

### 6.1. Два разных счётчика

`N_completed` — число валидных saved cycles. `N_spaced` — число выбранных сопоставимых observations с неперекрывающимися предполагаемыми семидневными окнами. Их нельзя подменять.

Для W: начать с последнего valid cycle в currentSegment; двигаться назад по сохранённому порядку; следующий выбрать, только если его timestamp минимум на **604800000 ms (7×24h)** раньше последнего выбранного. Если ближайший допустимый по minimum spacing предыдущий cycle дальше **28×24h**, остановить pattern window с `long_observation_gap`; не искать ещё более старую запись. Остановиться на 5 либо начале segment; вернуть chronological view выбранных references без изменения array. Excluded close cycles показать с причиной `overlapping_7_day_reporting_window`. Проверки signature/revision boundaries учитывают **все промежуточные cycles**, включая excluded. 28-day upper gap — тоже proposed heuristic, не валидированный порог; его задача — не называть пять разрозненных записей за несколько лет одним текущим consistent pattern.

Это approximation по времени Complete, потому что actual reporting periods не сохраняются. Точное семидневное расстояние не гарантирует независимость observations; оно только предотвращает очевидное повторное использование одних reporting windows. Не extrapolate на пропущенные дни, не считать weekly rate и не суммировать hours.

| Доступные данные | Разрешённый уровень | Что ограничено |
|---|---|---|
| 0 completed | `EMPTY` | Нет insight о пользователе; можно объяснить, что нужен completed observation |
| 1 | `EARLY_OBSERVATION` / Reflection | Без trends, relationships и prior-cycle claims |
| 2 | `COMPARISON` | Raw before/after. Close cycles допускаются с overlap notice; это не две независимые недели |
| 3 spaced, same segment | `REPEATED_PATTERN` | Только заранее определённые rules; не general law |
| 4 spaced | `REPEATED_PATTERN` | Trend = последние 3, без cherry-picking; flat/low/category recurrence используют все 4; четвёртая остаётся в overall scope и guards |
| 5 spaced, criteria satisfied | `CONSISTENT_PATTERN` | Только последние 5 выбранных; минимум 28 суток между earliest/latest при 7-дневной spacing. Не statistical confidence |
| Более длинная history | Те же gates; optional historical event summary | Нет stronger claim только от общего count; нет автоматического correlation или causal model |

Revision event counts — отдельный descriptive domain: 3 explicit events могут показать повтор выбора dimension даже за короткое время. Их label: **repeated recorded revision selections**, а не repeated independent process pattern.

### 6.2. Evidence strength — не confidence percentage

Evidence level определяется rule prerequisites, recurrence и comparability. Дополнительные qualifiers: `self_reported`, `historical_RIS_unavailable`, `rating_confirmation_unrecorded`, `unstructured_external_context`, `overlapping_reporting_windows`, `partial_data`. Нельзя убрать qualifier за счёт большего cycle count.

Default-risk, invalid chronology, missing required rule inputs, mixed measures и changed comparison basis **ограничивают** output независимо от N. «Пять cycles» не преодолевают missing conditions или semantic ambiguity.

## 7. Insight object/schema proposal

Ниже **derived response contract**, не persisted schema, не новый JSON backup и не production code. Raw record остаётся неизменным. JSON иллюстрирует traceability, не требует именно такой сериализации в памяти.

```json
{
  "specVersion": "analysis-phase1-proposal-1",
  "status": "READY",
  "engineVersion": "proposed-rules-1",
  "inputReference": {
    "intentId": "synthetic-intent",
    "sourceCommit": "255a5d9d27461dcacaebc1bc80ab322dd54b4de8",
    "currentRISFingerprint": "computed-in-memory",
    "sourceStateFingerprint": "computed-in-memory"
  },
  "primary": {
    "ruleId": "REL-01",
    "domain": "practical_contribution",
    "concept": "VIASIATAE",
    "titleKey": "analysis.practicalDeclineStableOutcome.title",
    "observation": "Practical-effort ratings were 8, 7 and 6; achievement was 2, 2 and 2.",
    "evidence": [
      {
        "cycleId": "synthetic-c1",
        "arrayIndex": 0,
        "createdAt": "2026-09-01T12:00:00.000Z",
        "path": "intent.cycles[0].iep.practical",
        "rawValue": 8
      }
    ],
    "ruleEvaluation": {
      "usedCycleIds": ["synthetic-c1", "synthetic-c2", "synthetic-c3"],
      "excludedCycles": [],
      "conditions": [
        {"name": "D3(practical)", "observed": "deltas -1,-1; endpoint -2", "required": "both <= -1; endpoint <= -2", "passed": true},
        {"name": "flat_3(achievement)", "observed": 0, "required": "range <= 1", "passed": true},
        {"name": "direction", "observed": ["none", "none", "none"], "required": "all none", "passed": true}
      ]
    },
    "interpretation": "This recorded combination may be worth observing; it does not identify a cause.",
    "nextFocus": {
      "kind": "observe",
      "variablePaths": ["C.iep.practical", "C.iep.actions", "C.oop.events"],
      "promptKey": "analysis.observeActionAndOutcome",
      "optional": true
    },
    "whyThisFocus": "The practical-rating change repeated while recorded outcome ratings stayed nearby.",
    "evidenceLevel": "REPEATED_PATTERN",
    "limitations": ["self_reported", "historical_RIS_unavailable", "rating_confirmation_unrecorded", "unstructured_external_context"],
    "missingData": ["typed_external_conditions", "historical_RIS_versions"],
    "causality": "not_determined",
    "safetyDisposition": "requires_separate_presentation_gate"
  },
  "secondary": null,
  "suppressedCandidates": [],
  "selectionExplanation": "REL-01 outranked PRA-01 and OUT-02 under the fixed priority tuple."
}
```

Полный evidence array содержит **все** values всех сработавших prerequisites, включая CIE signature, intentional answers, patch emptiness, hours guard и basisStatus, а не только illustrative первый practical value выше. Нормализованный text или canonical emotion сопровождаются rawValue и transformation identifier. Каждый computed scalar содержит input references и формулу.

Допустимые overall statuses: `EMPTY`, `READY`, `LIMITED`, `INSUFFICIENT`, `MIXED`, `SAFETY_HOLD`, `UNSUPPORTED_SOURCE`. Никакого `confidence: 87%`. Status домена может отличаться от overall; отсутствие capability не блокирует unrelated valid observation.

Точный одинаковый input snapshot + adapter/dictionary/rules version + presentation locale → одинаковый результат. `now()` не участвует в rules; fresh timestamps не создаются в raw data. Для «давно не было check-in» потребовалась бы отдельная разрешённая функция, её здесь нет.

## 8. First-cycle reflection logic

Первый completed cycle всегда может дать полезный descriptive result даже без pattern prerequisites:

1. Показать current CIE objective и success wording рядом с **текущим** RIS, явно обозначив current reference. Не объявлять original baseline, не давать similarity score.
2. Показать recorded achievement, direction и selected evidence categories; если они default-like/missing/unknown — обозначить предел interpretation.
3. Показать practical rating и 7-day hours отдельно, mental rating отдельно. Не выбирать «strongest variable» максимумом разных 0–10 шкал: desire, effort и achievement не одна и та же quantity.
4. Выбрать **один** next observation по фиксированному порядку:
   - invalid/insufficient/missing outcome assessment → уточнить один observable event и basis;
   - valid latest explicit revision → следующий check-in относительно revised intention;
   - outcome assessed, но actions blank → записать одно concrete action вместе с observed event;
   - actions присутствуют, external blank → записать один relevant external circumstance, если известен;
   - иначе → наблюдать ещё раз outcome относительно **своих** success criteria.
5. “Unresolved condition” нельзя автоматически выбрать из constraints. Возможна только generic reflection question без утверждения о necessary condition.

Пример result: “In your first recorded check-in, achievement was rated 2/10 and direction was ‘No meaningful change’. You selected ‘Directly observed events or conditions’. One possible next focus is to record a concrete action and an observable change at your next check-in.” WHY: exact field paths и причины выбора. Нет заявления о trend, stagnation или причине результата.

Ни один missing field не заставляет пользователя переоформлять сохранённый cycle. Reflection не подменяет уже существующее сохранение и не делает completion зависимым от analysis.

## 9. Multi-cycle comparison logic

Сначала проверить две соседние saved records и все context boundaries. Показать signed differences валидных comparable values; frequency — categories; emotions — category pairs. Не называть imported decimal ошибкой, если range валиден.

После изменения CIE wording, intentional revision или `unsure` численные values всё ещё можно **показать** before/after как raw records, но interpretation о progression одной и той же цели подавить. “Your recorded achievement rating changed from 8 to 3; the recorded success-criteria wording also changed, so these ratings cannot establish declining progress against one unchanged criterion.”

Для CMP-01 abs rating delta между 1 и 2 (возможен imported decimal) обозначить “small recorded change”; не округлять до nearby/notable. Для hours abs delta<1h — ordinary change, ≥1h — notable recorded change только для priority; все raw numbers показать. Ноль delta — exact same recorded value. При Other/unmapped emotions intensity values можно показать раздельно в reflection, но не истолковывать их delta как изменение силы одной известной emotion.

При интервале меньше 7 дней: “These check-ins may cover overlapping seven-day periods.” Это не error и не запрет обычного сравнения current ratings. Не делить recorded hours на расстояние между check-ins; не считать events независимыми только из-за разных IDs.

Без notable delta результат остаётся descriptive comparison, например “Both recorded practical-effort ratings were 5.” Не выдумывать focus на weak signal: допускается generic next observation.

## 10. Pattern-detection logic

Порядок: validation → chronology → revision / CIE boundaries → W selection → domain gates → atomic rules → composite rules → mixed checks → priority → safety/presentation.

Используется один predetermined latest window, не поиск максимальной корреляции среди всех прошлых windows. Нет arbitrary lag search, Pearson/Spearman confidence, regression predictor, causal graph или global wellbeing score. Для 3/5-point co-change описывается совместное изменение recorded series, не statistical association estimate.

Longer history не разрешает склеить разные intentions или revisions. Можно показать descriptive revision-event distribution отдельно. Смена current RIS после direct edit может изменить сегодняшнее сравнение с reference; WHY обязано это раскрывать. Saved observations не переписываются.

## 11. FINAEFIA logic

FINAEFIA — **фактическое сохранение функциональной структуры намерения**, а не сохранение строк в памяти.

Phase 2 доступна только ограниченная наблюдаемость:

- INT-01: одинаковая recorded wording CIE;
- side-by-side CIE / current RIS;
- recorded intention-change response и explicit revision selections.

Output не называется “FINAEFIA score”, “intention maintained 100%” или “your intention is stable”. Одинаковый текст может быть скопирован, формально неизменен при изменившемся смысле или повторён при отсутствии сохранения функционального intention. Разный текст может сохранять тот же смысл. Не вознаграждать буквальное воспроизведение, противоречащее CIE instruction.

**Feasibility: partial proxy, full functional assessment unavailable.** LEITEITHA предоставляет record memory и traceability; это не доказательство FINAEFIA.

## 12. DEITHIATHO logic

DEITHIATHO — ненамеренный drift/weakening/disintegration исходной структуры. В текущей schema нет достаточного historical reference и semantic self-assessment.

INT-02 допускает только “Repeated wording differs from the current reference; consider checking whether the meaning changed.” Он **не** выставляет drift=true. Если `intentional=unsure`, смысл изменения unresolved; не заменять unsure на no. Если `yes` + valid patch, REV-01 описывает intentional restructuring; такой cycle не является positive DEITHIATHO case.

Запрещены edit-distance scores, text length decline, keyword loss, sentiment и скрытая AI classification. Declining mental/desire не равны распаду intention. Прямой RIS edit без event делает historical drift interpretation особенно ненадёжной.

**Feasibility: discrepancy reflection available; confirmed/progressive unintentional drift unavailable.** Для будущего ограниченного self-reported drift signal нужны versioned reference и explicit user assessment of meaning/intention change; даже они не докажут причинный механизм.

## 13. VIASIATAE logic

Три разных источника не сливаются:

- practical — current perceived effort rating;
- hours — approximate time concrete actions in past 7 days;
- actions — свободное описание действий/денег/ресурсов/physical effort.

PRA-01/02 и REL-01/02 дают observable partial contribution patterns. High practical + poor outcome не означает “wrong effort” и не приводит к автоматическому “do more”. Low practical + good outcome не означает, что действий не нужно, или что мысли создали outcome. Hours=0 не означает отсутствие чужого вклада или иных actions.

В каноне физическое действие не обязано исходить от человека; текущая формулировка IEP преимущественно спрашивает **его** вклад. Engine не измеряет вклад других actors или физическую энергию всей системы. Это explicit coverage gap, а не изменение канона.

## 14. KAEKITO logic

Сейчас доступны только reported external context, events, evidence bases и direction. Классифицировать «external obstacles растут» нельзя: ни obstacle category, ни severity, ни obstacle count не сохраняются.

CTX-01 может выбрать environment как **следующее направление наблюдения**, когда практические ratings стоят рядом, а outcome ratings снижаются. Он не утверждает, что environment объясняет снижение. Даже identical external text не доказывает одинаковые обстоятельства.

CTX-02 только показывает recorded context. Engine не читает “rejected”, “rain”, “depression” и другие слова как typed classifications. Наличие documented checkbox не подтверждает external obstruction.

**Feasibility: context reflection and observational focus available; obstacle trend / causal response unavailable.**

## 15. VAQUQA logic

Понятия necessary condition и missing condition требуют явной связи condition ↔ intention/criterion и её recorded status. Сейчас имеется только prose в constraints/success/external.

COND-01 — capability gap, а не утверждение “your conditions are missing”. Нельзя считать constraint missing, если в external его не повторили; нельзя выдавать список requirements, придуманный из objective. Даже mathematical-looking free text не парсится как formal condition.

Следующий фокус может предложить пользователю самому назвать наблюдаемое условие в существующем поле, без нового persisted field. Engine будет показывать этот текст, но не рассчитывать condition gap до отдельно разрешённой typed model.

**Feasibility: explicit gap / user-led reflection only; automatic condition analysis unavailable.**

## 16. LIPHOZEI logic

LIPHOZEI рассматривается как recorded observed outcome, включая промежуточные события, а не только final goal checkbox.

OUT-01/02 используют self-rated achievement, reported direction и declared evidence basis. CurrentState/events можно показать пользователю рядом с success criteria; нельзя автоматически объявить criterion fulfilled. 10/10 — rating пользователя, не verified goal completion; direction toward не финальный успех; none не отсутствие всех промежуточных событий.

После revision success/scope/objective старые outcome ratings остаются records прежнего reporting context. Post-revision pattern начинает новый segment. Если direct edit reference не отражён в history, historical alignment остаётся unknown.

**Feasibility: self-reported outcome comparison/patterns available; automatic criterion-level fulfilment unavailable.**

## 17. Emotion-analysis boundaries

Emotion category, intensity, mental attention/effort, desire и belief — различные переменные. Ни одна не заменяет отдельный mood/energy score, которого сейчас нет.

Однозначный known-label mapping выполняется из frozen dictionaries: exact normalized label → category index. Raw labels остаются evidence. Unknown string / future ambiguous mapping → unmapped; можно показать literal label, но нельзя выдать category/valence. `Other` не имеет известного эмоционального содержания; EMO-01 может отметить повтор категории Other, но не интерпретировать её как одну и ту же конкретную эмоцию; EMO-02 для Other отключён.

Intensity trend допускается только в одной известной категории. Если страх 8 сменился радостью 4, это две descriptions, а не “emotion intensity improved by 4”. Нет automatic good/bad emotion axis.

REL-03 специально защищает case E: internal change при nearby practical/outcome ratings не превращается в вывод о препятствии результату. Возможен descriptive simultaneous change, но не causal effect и не рекомендация думать позитивнее.

## 18. Mental-health boundaries and safety boundary

Engine не medical/psychological diagnostic tool, therapy или treatment. Не диагностирует depression, anxiety disorder, burnout, ADHD и другие состояния. Не оценивает личность, «правильность мышления», здоровье, риск по emotion category или willingness.

Если пользователь написал название состояния в free text, это остаётся его текстом. В typed variables нет diagnostic field. Не переформулировать imported “depression” в системное “You are depressed”, а mental rating — в low mood. При необходимости сказать только “You recorded [the actual named variable/value]”.

**Отдельный future safety layer требуется до user-facing recommendation. В Phase 1 и этой документации он не реализован.** Его контракт не является новым storage field:

- Inputs: contextual recommendation candidate и raw text, обрабатываемые local-first по отдельно утверждённой политике.
- Output: `ALLOW`, `HOLD` либо `UNKNOWN`; возможен scoped allow для generic numerical reflection без goal optimisation.
- Engine не выставляет этот verdict сам, не использует слово “depression” как диагноз и не делает keyword-based crisis inference частью process rules.
- `HOLD` → `SAFETY_HOLD`: убрать optimisation/motivational nextFocus и speculative interpretation; не ранжировать crisis text ради достижения цели; передать presentation отдельному safety flow.
- `UNKNOWN` при потенциально чувствительном contextual recommendation → не выпускать его; допустим ограниченный generic reflection без интерпретации private text.
- Crisis flow, clinical assessment, контакты помощи и medical advice не проектируются здесь. Их отдельная разработка и review — prerequisite перед выпуском contextual nextFocus.

Нельзя предлагать изменение мышления вместо professional help. Sensitive text не попадает в telemetry/public Issues, в linguistic/causal classifier или в hidden ranking. Safety hold не удаляет, не редактирует и не блокирует сохранение raw observation.

## 19. Causality safeguards

| Допустимо | Запрещено |
|---|---|
| “In your recorded cycles…” | “Your negative thoughts caused the result.” |
| “These ratings increased together.” | “Increased effort caused the outcome.” |
| “The current data cannot determine causality.” | “Think positively / change vibrations to get the result.” |
| “Consider observing this variable next time.” | “Your intention will materialise.” |
| “Outcome ratings changed while practical ratings stayed nearby.” | “The environment blocked you” без соответствующего typed/verified evidence |

Гейт касается rules, templates, WHY, priority и future AI rewrite. Не только footer disclaimer. Не использовать causal verbs “caused”, “because of your thoughts”, “led to” для explaining outcomes. “WHY this focus” объясняет **selection algorithm**, не причину события в мире.

Существующие temporal data не задают порядок возникновения всех факторов: mental/practical/achievement — current assessments, hours/events/direction — past 7 days. Поэтому engine не утверждает даже causal temporal precedence. Нет counterfactual comparison, randomisation или verified control variables.

Небольшой будущий self-observation experiment формулируется как voluntary observation of one variable; не causal proof, не совет менять лечение, деньги, отношения или иной жизненный выбор. Unknown external confounding всегда указано.

## 20. Examples using synthetic data

### 20.1. Общая синтетическая запись и условия

Все examples ниже — вымышленные, не пользовательские RIS/CIE. Harmless intention: подготовить три коротких учебных заметки и обсудить их с партнёром по обучению. Никакие examples не записываются в localStorage.

Shape одного реального current-schema state:

```json
{
  "version": "0.1.0",
  "lang": "ru",
  "intent": {
    "id": "synthetic-intent",
    "createdAt": "2026-08-31T12:00:00.000Z",
    "ris": {
      "primary": "Prepare three short study notes",
      "success": "Three notes drafted and discussed",
      "scope": "One chosen topic",
      "nonGoals": "No public publication",
      "constraints": "Use freely available materials",
      "rationale": "Understand the topic more clearly"
    },
    "cycles": [
      {
        "id": "synthetic-c1",
        "createdAt": "2026-09-01T12:00:00.000Z",
        "cie": {
          "primary": "Prepare three short study notes",
          "success": "Three notes drafted and discussed",
          "scope": "One chosen topic",
          "nonGoals": "No public publication",
          "constraints": "Use freely available materials",
          "rationale": "Understand the topic more clearly"
        },
        "iep": {
          "desire": 7,
          "belief": 6,
          "emotion": "Calm / contentment",
          "emotionIntensity": 4,
          "mental": 6,
          "practical": 8,
          "frequency": "freq2",
          "actions": "Outlined one note",
          "hours": 3
        },
        "oop": {
          "currentState": "One note outlined",
          "achievement": 2,
          "events": "An outline was created",
          "direction": "none",
          "evidence": ["direct"],
          "external": "Study partner unavailable this week"
        },
        "intentional": "no",
        "revision": {}
      }
    ]
  }
}
```

Для таблиц C1/C2/C3 dates — 1/8/15 сентября 2026 в 12:00Z, IDs distinct; для C4/C5 — 22/29 сентября. Остальные поля соответствуют shape. Все CIE strings одинаковы, all no+empty patch, valid bases, nondefault profile, если явно не указано иначе. Для illustrative recommendations предположен **отдельный** safety verdict ALLOW по harmless example; это не поле state.

### 20.2. Обязательные cases A–F

| Case | Synthetic registered data | Expected rule / result | WHY / next focus / запрет |
|---|---|---|---|
| A | practical `[8,7,6]`; hours `[3,2,1]`; achievement `[2,2,2]`; direction all none | REL-01 primary, REPEATED_PATTERN; OUT-02 может быть secondary | D3 практического rating: −1,−1; net −2. Outcome range 0 и direction none. Наблюдать action/outcome; **не** заявлять, что declining effort вызвал outcome. “RIS stable” не подтверждается history — только same recorded CIE basis |
| B | practical `[6,6,6]`; hours `[3,3,3]`; achievement `[6,5,4]`; direction all away; external strings описывают разные препятствия | CTX-01 primary; KAEKITO как next observation | Outcome D3 при flat practical/hours. Нельзя детерминированно подтвердить “obstacles растут”: external free text. Наблюдать одно внешнее обстоятельство, не causal explanation |
| C | CIE primary на C1/C2/C3 последовательно переформулирован; intentional all no; current RIS primary иной | TXT-01 / LIMITED; current segment начинается на C3, historical semantic drift unavailable | Changed wording, default/no ambiguity, отсутствующий baseline. Нельзя progressive DEITHIATHO. Если одна и та же отличающаяся wording повторяется ещё в 3 spaced cycles → INT-02, всё ещё neutral review |
| D | C3 intentional yes, patch `{ "success": "Two notes drafted and discussed" }`; current RIS success уже новое | REV-01 primary; intentional restructuring; post-revision segment пуст до C4 | Selected success key и yes. C3 OOP относится к pre-apply recording; **не DEITHIATHO**, не failure. Наблюдать next cycle с revised criteria |
| E | Same “Sadness / disappointment”; intensity `[4,5,6]`; mental `[7,6,5]`; practical `[6,6,6]`; hours `[3,3,3]`; achievement `[4,4,4]`; direction all none | REL-03 primary по mental; EMO-02 допустим secondary observation | Mental D3, practical/achievement ranges 0. Internal change отдельно от outcome. Не «negative emotions мешают результату», не depression/burnout. Intensity не является mental-health score |
| F | practical `[3,4,5]`; hours `[1,2,3]`; achievement `[2,3,4]`; direction all toward | REL-02 primary, REPEATED_PATTERN | Два U3, no opposite directions/hours. “These ratings increased together in your recorded observations.” Наблюдать повторение и context; **не** causal effect |

### 20.3. Дополнительные проверочные cases

| Case | Inputs | Expected outcome |
|---|---|---|
| First cycle | Только shape выше | REF-01 EARLY_OBSERVATION; никаких trends; один voluntary focus |
| Two cycles | practical 8→6; 1→8 сентября | CMP-01 COMPARISON, raw −2; не decline pattern |
| Five-cycle consistent change | practical `[9,9,8,7,6]`; achievement all 2; direction all none | D5: ранний median 9, поздний 6.5, difference 2.5; 3 negative steps; REL-01 CONSISTENT_PATTERN |
| Close repetitions | Три cycles за один день, practical `[8,7,6]` | N_completed=3, N_spaced=1: comparison/reflection только; не 3-week pattern |
| Endpoint outlier | practical `[8,8,1]`, achievement all 2 | D3 не проходит: только одна negative step; large-step guard. Raw comparison, не pattern |
| Large final step after small decline | practical `[8,7,1]` | D3 арифметически проходит, но abs last delta=6 → LARGE_STEP_REQUIRES_REPEAT; pattern подавлен |
| Constant values | practical all 5, achievement all 2, nonempty basis/context | OUT-02 возможно, PRA-01/REL-01 нет; не выдумывать trend |
| All default profile | IEP defaults; OOP defaults/blank; completed CIE | QUAL-01; possible unreviewed defaults, не “пользователь не отвечал”; INSUFFICIENT for outcome pattern |
| Missing / invalid | practical missing либо string `"8"` после permissive load | PRA/REL недоступны; не coercion. Other valid domain reflection допустима |
| Insufficient selected with direct | evidence `["direct","insufficient"]` | basisStatus insufficient; не boost confidence direct checkbox |
| Unknown direction | direction unknown при achievement 8 | QUAL-01 для outcome; raw rating показать, не считать progress |
| Opposing assessments | achievement `[2,3,4]`, direction all away | MIX-01; разные recorded assessments/scopes; не OUT-01/REL-02 coherent improvement |
| Opposed practical/hours | practical `[8,7,6]`, hours `[1,2,3]` | MIX-01 для practical composite; оба ряда показать; не общий contribution score |
| High effort / poor outcome | practical `[9,9,9]`, hours `[8,8,8]`, achievement `[2,1,0]`, directions away | CTX-01 может выбрать external observation, без приказа increase effort и без вывода о failure/obstacle cause |
| Low effort / improving outcome | practical `[1,1,1]`, hours `[0,0,0]`, achievement `[2,3,4]`, directions toward | OUT-01 primary; PRA-02 optional secondary. Не “effort unnecessary”, не manifestation |
| Success criteria wording changed | C2 CIE.success другое, даже при no | Boundary; нельзя склеить OUT trend across C1–C3. W текущего segment меньше threshold |
| Scope changed | C2 CIE.scope другое | То же, не scope creep diagnosis |
| Unknown emotion label | imported emotion=`"depression"` | Unmapped literal user string; EMO category rule недоступен; никакого diagnosis. Separate future safety evaluation до contextual recommendation |
| Language switching | “Calm / contentment” → “Ruhe / Zufriedenheit” | Exact dictionary maps обоих к category 3; category comparison допустимо; source strings сохранены |
| Revision selected same new text | yes + valid key, но текст совпадает с current RIS | REV-01 selected dimension, не доказанное изменение; before value unknown |
| Imported decision conflict | no + nonempty revision patch | MIX-01; no drift claim, no patch application |
| Duplicates / chronology | Duplicate cycle ID либо timestamps decreasing | Pattern scope blocked with reason; no repair/sort/writeback |
| External text grows | external text длина 20→100→200 chars | Никакого obstacle trend, burden score или sentiment; только literal context |
| Crisis boundary | Separate safety verdict HOLD | SAFETY_HOLD: no goal optimisation / motivational recommendation; no diagnosis; raw observations unchanged |

## 21. False-positive risks

| Риск | Обязательная защита | Остаточное ограничение |
|---|---|---|
| Мало observations | 1 reflection / 2 comparison / 3 spaced repeated | Даже 5 не доказательство закономерности |
| Пропущенные fields | Field-level eligibility; no imputation | Optional text blank не сообщает, произошло ли событие |
| Default sliders / default no | Exact profile guard + confirmation-unrecorded limitation | Изменение одного field не подтверждает осознанный выбор всех остальных |
| Идентичные values | Не создавать trend; flat wording только about recorded scale | Скопированные/default values могут выглядеть стабильными |
| Single outlier | Two-step D3, 3-of-4 D5, large-step suppression | Настоящий резкий сдвиг сначала останется comparison; это сознательный компромисс |
| Natural CIE rewording / новый язык текста | Нет semantic drift inference, conservative boundary | Более низкая sensitivity numeric goal-specific patterns |
| Explicit Revision | Segment reset; cycle pre/post distinction | Before RIS потерян в текущей schema |
| Manual RIS edit | historical_RIS_unavailable, no reconstructed baseline | Engine не может обнаружить все такие edits из history |
| Новые success criteria / scope | Signature boundary, не сравнивать progress blindly | Смысл может измениться при exact same text, что engine не видит |
| High effort / poor outcome | No causal judgement, no automatic “more effort” | Outcomes lag, чужой вклад и context не полностью измерены |
| Low effort / good outcome | No “effort unnecessary” / manifestation | External contributions не наблюдаемы отдельно |
| External circumstances changed | Unstructured-context limitation, no claim “controlled context” | Missing/confounding external factors неизвестны |
| Ретроспективные семидневные окна | W spacing; no sums/rates | Approximate completion dates не точные periods |
| Contradictory/different-scope measures | MIXED output, no averaged score | Ratings и direction могут описывать разные временные аспекты |
| Imported / malformed state | Read-only strict adapter; unsupported reason | Current load permissive; не менять app validation в этой Phase |
| Выбор лучшего прошлого window | Только predetermined latest segment/window | Можно пропустить интересный old pattern; пользователь может видеть raw History |
| Изменение словарей/rules | Versioned mapping и rules metadata | Dynamic results могут отличаться между будущими engine versions |

## 22. Missing-data behavior

Различать `missing field`, `invalid type/value`, `blank string`, `valid zero`, `default-like`, `unknown enum`, `not enough information selected`, `capability not instrumented` и `excluded reporting overlap`. Они не взаимозаменяемы.

Без evidence array contents не говорить “no evidence exists”; говорить “No evidence basis was selected in this recorded check-in.” Empty external не значит “no obstacles”; empty actions не значит “no actions”; `None` в free text не переводится в structured zero. Не анализировать значение текста “None known” как отсутствие обстоятельств во всех языках.

Rule outputs содержат missingData, failedConditions, exclusions и permitted fallback. Latest incomplete outcome → reflection/QUAL-01, а не backfill из предыдущего cycle. Pattern input missing в current scope → dependent pattern unavailable; не выбирать удобные старые valid values через gap. Invalid cycle в chronology разрывает pattern segment.

Когда condition data вообще не instrumented, отмечать gap в WHY/capability details. Не показывать COND-01 как одинаковую тревожную карточку после каждого check-in.

## 23. Mixed-evidence behavior

`MIXED` — полноценный результат, не error. Он показывает конкретные разные signals, которые не позволяют выбрать одну process interpretation.

Пример: “Your practical-effort ratings decreased from 8 to 6, while recorded seven-day action hours increased from 1 to 3. These measures describe different aspects of contribution. One possible next focus is to clarify what the practical rating represents for you.” WHY: обе series, timescopes и predicate practical_hours_opposed.

В MIXED nextFocus — уточнение **одной** неоднозначной measure или reporting basis, не lifestyle recommendation. Не выбирать «более убедительный» source скрытым ranking, не говорить, что пользователя данные неправильные. Other unrelated valid observation может быть secondary, без второго nextFocus.

Нет pattern → не выдавать generic motivational advice под видом insight. Допускается честное “The current records are not sufficient for this comparison.”

## 24. Priority logic

Максимум **1 primary insight + optional 1 secondary observation**. Secondary не содержит отдельного recommendation. Не показывать все сработавшие rules как десять карточек.

### 24.1. Приоритет групп

| Порядок | Primary candidate group | Почему |
|---|---|---|
| 0 | Safety HOLD / unsupported source | Recommendations не выпускаются без надлежащей границы |
| 1 | Global traceability defect, exact default-risk, current decision/patch conflict; domain QUAL-01 лишь при отсутствии независимого eligible focused candidate групп 4–6 | Сначала объяснить невозможность interpretation. Unrelated missing emotion не перехватывает valid practical rule |
| 2 | REV-01 в latest completed cycle | После intentional restructuring прежние patterns не описывают новый reference |
| 3 | MIX-01 для valid differently scoped/opposed signals в eligible current window | Нельзя выбрать coherent outcome/process advice, игнорируя встречный сигнал |
| 4 | Eligible composite rules REL-01/02/03, CTX-01 | Связывают зарегистрированный вклад и outcome без causal inference |
| 5 | Eligible single-domain patterns PRA/MEN/OUT/EMO/INT | Повторяющиеся concrete recorded variables |
| 6 | Latest comparable CMP-01/02 | Два observations без pattern claims |
| 7 | Limited text clarification INT-02/TXT-01, REF-01, requested revision summary REV-02 | Полезный fallback, не false alarm о semantic drift |

Сначала вычислить eligibility всех candidates. Global traceability defect, current decision/patch conflict и exact default-risk имеют group 1 независимо от других candidates. Для domain-only QUAL-01 назначить group 1 только если нет независимого eligible focused candidate групп 4–6; иначе оставить limitation/secondary explanation. Current outcome declared `insufficient` всегда блокирует dependent OUT/REL/CTX, но не валидный отдельный practical comparison. Не скрывать valid practical analysis из-за неструктурированных conditions, которых schema не содержит. Default profile для исторического cycle подавляет dependent pattern; group 1 whole-result hold относится к latest cycle.

### 24.2. Tie-breakers внутри группы

Lexicographic tuple внутри уже выбранной группы, показываемый в WHY:

1. evidence level (`CONSISTENT_PATTERN` > `REPEATED_PATTERN` > `COMPARISON` > `EARLY_OBSERVATION`), только если все gates пройдены;
2. число used supporting observations этого **фиксированного** window; не поиск альтернативного window;
3. для comparisons: `notable_recorded_change` прежде same/nearby pair (abs rating delta≥2; hours absolute delta≥1h; strict frequency category change). Это threshold class внутри своей variable, не общий magnitude score. Для других groups этот tie-breaker равен neutral;
4. fixed rule order: REL-01, REL-02, REL-03, CTX-01; OUT-01, OUT-02, PRA-01, PRA-02, MEN-01, MEN-02, EMO-02, EMO-01, INT-01; CMP practical, achievement, mental, hours, desire, belief, emotionIntensity, frequency; затем INT-02, TXT-01, REF-01, REV-02. Этот фиксированный порядок, вместе с group precedence, **и есть** заявленная process relevance; второго несовместимого domain ranking нет;
5. Rule ID + dimension order `primary,success,scope,nonGoals,constraints,rationale` для окончательных ties. Word-based urgency не вычисляется.

Для multiple metric comparisons rule evaluation сохраняет field suffix, например `CMP-01:practical`. Не сравнивать силу 3-point desire change с 3 hours как одинаковую величину. “Actionability” задаётся наличием safe single-observation template; не AI judgement. “Missing-condition importance” сейчас не вычисляется.

Secondary = highest remaining eligible **не дублирующее primary** factual observation; first prefer different domain, then tuple. PRA-01 не повторять как secondary к REL-01, использующему тот же practical decline. Допустима OUT-02 summary или contextual limitation. Если unique useful observation нет — secondary=null.

Suppressed candidates доступны в WHY details с `subsumed_by_primary`, `lower_fixed_priority`, `insufficient_inputs`, `mixed_evidence`, `boundary`, `large_step`, `safety_hold`. Не генерировать скрытый subjective score.

## 25. Proposed UI flow

**Только концептуальный flow; UI в Phase 1 не создаётся.**

`Check-in → Analysis → Insight → Next Focus → History`.

Сначала существующий Complete сохраняет raw cycle тем же способом. Затем future derived computation читает snapshot; ошибка/недостаточность analysis не откатывает запись. First-cycle reflection работает без накопленной history.

Result card: title, короткое recorded observation, evidence level и один optional nextFocus. “Why this was shown” раскрывает cycles/dates, raw values, thresholds, missing/conflicting inputs и why chosen focus. Подробнее — существующая History с raw observations. Не требуется принять insight или менять RIS, чтобы продолжить использование.

Intentional Revision остаётся отдельным сознательным действием: engine не делает её автоматически и не предлагает исправление intention как условие успеха. Не менять текущую семантику onboarding, language selector, navigation, focus или completion в этой Phase. Future UI отдельно проверяется на 31 язык/RTL и accessibility; не менять engine decision при смене presentation language.

## 26. Storage strategy recommendation

**Выбрать A: dynamically computed insights. Analysis = derived layer.**

| Вариант | Польза | Риски | Решение |
|---|---|---|---|
| A. Compute from current raw snapshot | Нет migration, offline, всегда traceable к текущим records, легко исправить rules | После direct RIS edit / rule update result для старого cycle может отличаться | Recommended; current reference/version явно показать |
| B. Persist generated insight snapshot | Можно сохранить “что показали тогда” | New schema, stale output, extra private text, reconciliation/import/versioning | Не требуется для Phase 2 core; отложить до подтверждённой потребности |

Допускается ephemeral in-memory memoization по fingerprint raw state + current RIS + adapter/rules/dictionary versions. Fingerprints и insight object не писать в existing storage. Rendering language меняет copy, не numeric result. Memoization не является дополнительным source of truth.

Если позже понадобится permanent historical analysis, отдельный approved design должен включать rule version, immutable input references и disclosure о последующих changes. Это не восстановит отсутствующие before-RIS values задним числом. В этой Phase не создавать storage namespace, snapshot field, migration или backfill.

## 27. Offline/local-first feasibility

Read-only validation, text equality, enum mapping, arithmetic comparisons, fixed rules и priority могут работать локально и offline. Нужны только имеющиеся records и versioned dictionaries/templates. Cloud AI, server, accounts, sync, telemetry, third-party services и network calls для engine не нужны.

Linear pass по history для validation/boundaries/revision counts; pattern vectors ограничены пятью выбранными observations. Memory может быть ограничена текущим suffix и derived evidence references. Не читать пользовательские данные за пределами существующего state / locale presentation preference. Не отправлять текст/JSON в публичные Issues или внешние сервисы.

Новые engine files и templates потребуют отдельного будущего release/cache review. **Здесь sw.js и CACHE v16 неизменны.** Offline architecture существующей PWA не перерабатывается.

## 28. Future AI layer, clearly separated from rule engine

Phase 1/initial Phase 2 core не зависят от LLM. Deterministic templates достаточно для полного output.

Если позже разрешён AI formulation layer, он получает утверждённый bounded derived result, а не право менять evidence или rule evaluation. Он может переформулировать explanation / уточняющий вопрос, но не менять:

- cycle/path references и raw/computed values;
- thresholds, rule IDs, candidate selection и evidence level;
- missing/mixed qualifiers, causality status или safety decision;
- RIS, cycles, revision choices, schema или storage;
- interpretation limits, confidence и nextFocus variable scope.

AI result с invented fact, diagnosis, causal claim или отсутствующим qualifier отклоняется; fallback — deterministic template. Cloud disclosure/consent/privacy и local model feasibility требуют отдельной future specification; никакого cloud-by-default promise сейчас.

## 29. Which additional fields, if any, would genuinely be needed later

**Для reflection, raw comparisons и ограниченных recorded patterns: новых persisted fields не требуется. Ни один field ниже не добавляется в этой Phase или автоматически в Phase 2.** Это future instrumentation proposals, не утверждённые paths и не новая schema.

| Gap | Минимально полезные будущие observations | Зачем / приоритет / ограничение |
|---|---|---|
| Historical reference | Immutable initial RIS; versioned RIS changes для explicit Revision **и direct Edit**, before/after, effective time; cycle reference version до outcome assessment | Высокий приоритет, если нужно обсуждать functional retention/drift или сопоставлять outcomes историческому RIS. Потерянное прошлое не восстановить |
| Meaning vs rewording | Explicit user comparison: same meaning / intentionally changed / changed without intending / unsure, dimension-specific, against named RIS version | Для self-reported FINAEFIA/DEITHIATHO signal; не NLP truth и не causal diagnosis. Не заменять existing intentional flag молча |
| Confirmation/default ambiguity | Confirmation per relevant structured assessment либо явное unanswered состояние; choice acknowledgement для intentional | Отличить recorded default от reviewed answer. Серьёзное изменение UX/schema, отдельное разрешение |
| Reporting period | Explicit period start/end для seven-day-type observations | Снять approximate windows / overlap ambiguity; не автоматически retime старые observations |
| Outcome criterion status | User-defined criterion IDs + explicit status/evidence references по каждому | Для criterion-level LIPHOZEI; пользователь определяет criteria, engine не придумывает fulfilment |
| Condition gap | User-named condition ID, link к intention/criterion, status present/absent/unknown, наблюдение basis/time; necessity explicitly user-declared | Для ограниченного VAQUQA analysis; absent condition не автоматически cause |
| External obstacles/context | User-selected circumstance category/status/change/severity, source/basis и observed period | Для KAEKITO obstacle trajectory; не classifier free text |
| Emotion identity | Canonical category ID или explicit Other text плюс raw label, selection locale/version | Более устойчивые emotion comparisons, без sentiment/diagnosis. Старые labels консервативно map in memory |
| Energy / persistence | Только отдельно утверждённый clearly worded self-report, если продукт действительно требует эти variables | Сейчас отсутствуют; не нужны для первого engine, не выводятся из mental/desire |
| Broader contribution actors | Optional user-declared own/other/system contribution и reporting basis | Сохранить канон VIASIATAE за пределами собственного action; не претендовать на измерение полной physical energy |

Нельзя рекомендовать сразу весь список как обязательное расширение форм. Сначала проверить полезность existing-data reflection; вводить только нужное для конкретной доступной capability, с explicit product approval. Proposed new fields не включать в backup sample current schema и не просить миграцию сейчас.

## 30. Phase 2 implementation plan

**План будущих работ; не разрешение начать их после этого документа.**

1. Утвердить смысл outputs, продуктовые thresholds, conservative comparability tradeoff и unavailable capabilities. Проверить, что copy не вознаграждает CIE copying и не выдаёт literal differences за drift.
2. Реализовать отдельный pure read-only adapter/engine на existing schema: source validation, provenance, chronology/windows, signature/revision boundaries, conservative dictionary mapping, proposed object contract. Без storage writes, migration и new fields.
3. Первыми реализовать REF-01, QUAL-01, CMP, REV и limited wording reflection. Затем single-domain rules; composite rules подключать только после domain/mixed gates. Не включать automatic condition-gap, semantic drift или obstacle classifier.
4. Подготовить отдельную safety boundary specification/review **до user-facing contextual nextFocus**. Без этого разрешён только bounded descriptive prototype, не motivational goal optimisation.
5. Написать meaningful tests на synthetic fixtures и rules: exact outputs/WHY; missing/zero/defaults; mixed signals; 7-day spacing; single outlier; revisions/scope/criteria boundaries; duplicate/import anomalies; known/unmapped multilingual emotions; priority/ties; snapshot immutability. Проверить все examples A–F и дополнительные cases раздела 20. Не запускать полный app regression в этой Phase.
6. Проверить deterministic invariants: same input → same rule result; presentation language → unchanged candidate; no mutation; no network dependency; no invented missing values; no causal/diagnostic copy; recommendation не выходит за approved safety gate.
7. Только после отдельного разрешения создать минимальный result/WHY UI после existing save. Один primary + optional secondary, без mandatory response или automatic revision. Проверить доступность/RTL/31-language copy в объёме изменённого UI.
8. Отдельно разрешить release: appropriate cache bump и integration/offline/data checks; один контролируемый production change. В этой Phase этого шага нет.
9. Собирать добровольную beta feedback о ясности reflection/WHY; не добавлять telemetry и не просить private intention в public Issues. Решать об instrumentation gaps отдельно, не вводить весь future field list.

### Acceptance criteria будущего engine

- Первый completed cycle даёт useful recorded reflection без pattern claim.
- Два cycles не дают repeated-pattern label; close test cycles не имитируют недели.
- Каждый insight позволяет ответить: какие cycles/fields, какой threshold, какие gaps, почему этот focus.
- Cases A/F говорят о recorded combinations/co-change; B не утверждает obstacle growth; C не подтверждает drift из prose; D всегда intentional restructuring; E не связывает emotion с помехой outcome.
- High effort/poor outcome и low effort/good outcome не дают moral/causal advice.
- Mixed/insufficient — полноценные результаты, не повод выдумывать recommendation.
- FINAEFIA не равно LEITEITHA; DEITHIATHO не равно intentional Revision.
- Raw data, existing timestamps, keys, JSON и user choices не изменяются.

## Phase 1 freeze confirmation

Этот документ подготовлен отдельно от git working tree. Не создан production engine, UI, AI layer или новый persisted field. Не выполнены commit/deployment, CACHE bump, migration, localStorage read/write/cleanup или app testing loop. Production baseline для документа — `255a5d9d27461dcacaebc1bc80ab322dd54b4de8`, `pheisiraetha-v16`. Все выводы inventory относятся к исходникам этой версии; numerical rules — предложения, требующие отдельного утверждения и реализации.
