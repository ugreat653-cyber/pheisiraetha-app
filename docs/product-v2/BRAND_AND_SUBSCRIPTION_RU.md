# Бренд PHEISI и границы будущей подписки

Статус: **DESIGN_ONLY / NO_BRAND_ASSET_CHANGE / NO_BILLING_IMPLEMENTATION**.

Документ отделяет короткое имя продукта, графические материалы и будущую коммерческую модель от пользовательских данных и аналитических полномочий. Он не выбирает поставщика оплаты, цены, валюты, тарифы, юридические условия или архитектуру billing и не меняет production assets.

## 1. Проверенный брендовый источник

Основание — source anchor `db6920193fb76028947ce148cd8ed61c847c5c3d`. Локально визуально просмотрены `icon-192.png`, `icon-512.png` и `launch-screen.jpg`; для maskable variants проверено равенство SHA-256 с normal PNG той же размерности.

| Поверхность | Подтверждённое текущее содержимое |
| --- | --- |
| [manifest.webmanifest](https://github.com/ugreat653-cyber/pheisiraetha-app/blob/db6920193fb76028947ce148cd8ed61c847c5c3d/manifest.webmanifest) | `name = PHEISIRAETHA`, `short_name = PHEISIRAETHA`; английское description; icon references 192/512 и maskable с `?v=07`. |
| [app.js](https://github.com/ugreat653-cyber/pheisiraetha-app/blob/db6920193fb76028947ce148cd8ed61c847c5c3d/app.js#L540) | Header и onboarding brand содержат literal `PHEISIRAETHA`. |
| [index.html](https://github.com/ugreat653-cyber/pheisiraetha-app/blob/db6920193fb76028947ce148cd8ed61c847c5c3d/index.html) | Title/metadata используют полное имя; launch image загружается как `launch-screen.jpg?v=15`, `aria-hidden`/пустой alt не делают видимый raster текст локализованным. |
| [locales.js](https://github.com/ugreat653-cyber/pheisiraetha-app/blob/db6920193fb76028947ce148cd8ed61c847c5c3d/locales.js) | Brand/productVersion, onboarding и множество about/privacy/error texts используют полное имя. |
| `icon-192.png`, `icon-512.png` | Абстрактный золотой/голубой знак на тёмном фоне; **букв и слова PHEISIRAETHA внутри этих PNG нет**. |
| Maskable PNG | Точные bytes normal PNG соответствующей размерности. Это проверка равенства файлов, а не доказательство достаточной maskable safe area. |
| `launch-screen.jpg` | Full wordmark `PHEISIRAETHA`, английский tagline `FROM INTENTION TO OUTCOME`, подписи `INTENTION`, `ANALYSIS`, `REFLECTION`, `ACTION`, `FEEDBACK` и английские глаголы внутри bitmap. |

Проверенные SHA-256:

| Файлы | SHA-256 |
| --- | --- |
| `icon-192.png`, `icon-maskable-192.png` | `f46acccdbfbd3a2cfe856465d56867dd6c94288e059fdfd3cb1897e7067356bf` |
| `icon-512.png`, `icon-maskable-512.png` | `b93cd8d5f742f07b22de6ed6ee503edd6fcfbf2c8897b7402d72f82062990788` |

Это source inspection, не проверка текущих OS shortcuts, установленных PWA или live Pages bytes.

## 2. Что означает PHEISI

Короткое имя `PHEISI` и полное имя `PHEISIRAETHA` — разные display surfaces. Смена только `manifest.short_name` на `PHEISI` задаёт предпочтительное короткое имя установленной PWA для поддерживающих браузеров. Она не меняет `manifest.name`, app header, onboarding, document title, backup filename или пиксели PNG/JPG.

Предлагаемый объём следующей брендовой итерации:

1. Использовать `PHEISI` как короткий display label. Решение, заменяет ли оно полное имя в header/title/onboarding/about, фиксируется отдельно по surface inventory.
2. Сохранить существующий graphic symbol как исходный вариант. Если нужен именно **новый icon с видимым PHEISI**, создать и визуально утвердить отдельные варианты; существующие PNG текста, который можно «сократить», не содержат.
3. Подготовить 192/512 и отдельное maskable framing, проверить читаемость при реальном малом размере, light/dark launcher, круглом и скруглённом crop. Не считать копию normal PNG автоматически корректным maskable вариантом.
4. Отдельно решить судьбу launch artwork. Для согласованного языка предпочтителен artwork без запечённой системной прозы и обычный локализованный UI overlay; допустимы exact reviewed locale assets, если доказано полное покрытие. Нынешний English raster не решается заменой manifest label.

На этой стадии изображения не генерируются и не редактируются. Новые assets, manifest URLs/hashes и cache generation относятся к будущему отдельному qualified release; approved ON/OFF archives не переписываются. Поведение обновления имени/иконки уже установленных PWA проверяется на целевых платформах отдельно; мгновенное обновление всех shortcuts не обещается.

## 3. Бренд и язык

`PHEISI`, `PHEISIRAETHA`, version identifiers и технические имена могут быть утверждены как сохраняемые literal identifiers. Это исключение не распространяется на tagline, descriptions, кнопки, статусы и accessibility labels. Имя бренда в RTL изолируется; окружающая системная проза следует выбранной locale.

Будущий inventory включает DOM, onboarding, dialogs/errors, manifest/install metadata, `noscript`, app title, backup naming и видимый текст внутри изображений. Системный OS file picker и подписи платформенных install surfaces необходимо отличать от текста, которым управляет приложение. Native dialogs/validation bubbles могут зависеть от языка браузера; app-owned сообщения и controls должны иметь reviewed localized copy.

## 4. Граница данных и entitlement

Будущая подписка — отдельная возможность, а не часть intention history. Проектное требование: пользователь сохраняет практический доступ к своим существующим локальным данным и их экспорту независимо от оплаты, отмены подписки, недоступности сети и проверки account.

| Область | Граница |
| --- | --- |
| Intention data | RIS, observations/cycles, revisions, IDs, timestamps и user-authored content принадлежат пользовательскому пространству данных; не становятся billing payload. |
| UI preferences/drafts | Locale, selected intention и draft state обслуживают journey; не используются как доказательство entitlement или оплаты. |
| Analytical runtime | Frozen facts, Safety verdict, component identities и provenance независимы от тарифа. Subscription flag не может получить более сильную interpretation или обойти Safety. |
| Entitlement/account | Будущий отдельный модуль с собственным versioning и явно ограниченной persistence; не поле в RIS, cycle или approved analytics snapshot. |
| Billing provider | Не выбран. Токены/платёжные сведения не включаются в user backup или analytical DTO. |

Это техническая граница владения/доступа, а не утверждение юридических условий. Она не добавляет аккаунты, cloud sync, provider SDK, cookies, telemetry, платёжные credentials или сетевые запросы.

## 5. Offline, отмена и сохранность

Минимальный будущий контракт доступа:

- Потеря сети, неизвестный entitlement, истёкшая подписка и её отмена не удаляют/не перезаписывают intentions, завершённые observations или drafts.
- Чтение существующих локальных данных и экспорт полного backup доступны без успешной billing/network проверки. Нельзя требовать оплату для восстановления контроля над своими записями.
- Отмена подписки не является удалением данных; удаление остаётся отдельным явным пользовательским действием с собственным scope.
- Неопределённый entitlement не выдаётся за подтверждённый активный статус. Если когда-либо ограничиваются дополнительные платные возможности, UI сообщает их состояние без блокировки данных/export и без изменения аналитической истины.
- Import/restore проходит отдельные data-compatibility и collision проверки. Он не активирует подписку и не принимает entitlement из backup как доверенный.
- Ошибка SDK, provider timeout или account logout не влияет на локальную запись observation и не превращается в storage migration.
- Никакой аналитический результат или approval не кешируется как часть entitlement; доступ к платной возможности не является разрешением Safety.

Какие новые действия или дополнительные сервисы могут относиться к платному набору, остаётся отдельным product decision. Этот документ не вводит paywall и не решает цены, grace period, правила продления, server verification или refund/cancellation flow.

## 6. Будущая проверка

| ID | Acceptance |
| --- | --- |
| BR-01 | Surface inventory явно различает PHEISI label, full brand, graphic symbol и запечённую prose; owner принимает конкретные варианты. |
| BR-02 | Новые icon variants просмотрены в целевых размерах/crops; maskable framing и реальный installed label проверены отдельно от manifest source. |
| BR-03 | Выбранная locale управляет app-owned видимыми строками, включая launch и accessibility; approved identifiers перечислены явно. |
| BR-04 | Asset/update/release qualification не меняет сохранённые данные или исторические архивы и не смешивает releases. |
| SUB-01 | Offline/expired/cancelled/unknown entitlement не блокирует чтение существующих данных и полный экспорт. |
| SUB-02 | Отмена/выход/ошибка provider не удаляют данные, не меняют IDs/history и не влияют на durable save. |
| SUB-03 | Backup не содержит платёжных secrets/токенов; imported entitlement не считается доверенным; restore не активирует оплату. |
| SUB-04 | Одинаковые data дают одинаковые Analysis/Safety facts и verdict независимо от entitlement. |
| SUB-05 | Provider, pricing, account architecture и exact reviewed subscription copy приняты отдельно до billing implementation. |

Следующее разрешённое действие в рамках data-foundation — сохранить эти границы как design inputs. Реализация PHEISI assets, локализованного launch или подписки требует отдельного конкретного этапа; текущий документ ничего из этого не активирует.
