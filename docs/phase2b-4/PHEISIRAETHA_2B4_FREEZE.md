# PHEISIRAETHA — фиксация 2B-4

Статус: **PRIVATE_2B4_EXACT_RUNTIME_PASS**. Дата: 2026-10-08. Публичная активация — отдельная граница разрешения.

## Принятый прогон

[Run 37839465182](https://github.com/ugreat653-cyber/pheisiraetha-app/actions/runs/37839465182), job 113524860302, HEAD 334eaabe90e238803ef1f0bd1cda119ecca53a81.

26/26 PASS: 25 дочерних сценариев и родительский тест. Fail/cancelled/skipped/todo: 0. Machine gate PASS: 16 основных строк и 5 дополнительных проверок.

Основные строки: OFF-01, INSTALL-01, FETCH-01, HASH-01, QUOTA-01, COLD-00, COLD-01, WARM-01, CACHE-01, MIX-01, MIX-02, UPGRADE-01, DIGEST-01, ON-01, STORE-01, ROLLBACK-01.

Дополнительные: INSTALL-SEAL-LAST-PROBE, BOOTSTRAP-SRI-DENIAL, ON-VALID-5, ON-VALID-9, ON-VALID-FALLBACK.

Проверены отказ установки, SHA/размер, квота (включая запись seal), строгий последний маркер, SRI, два клиента v16, cache miss, естественная активация, новый процесс браузера офлайн, reload, данные/export и полный rollback. В OFF реальные вызовы evaluate/analyze/assessPresentation равны 0; частные ON-fixtures проверяют 5/9 компонентов, fallback и импорт 5→9.

Artifact ID 11577586511, ZIP SHA256 882ec58d67e01660cd39a7a47f25d775adec9d132619b3f2e2bed53b56610d4c. Release digest 13ab5047855cc11f5da4d8dd961a555245675dbcd75006cc0213882f5dc909bb; worker SHA256 ee068d6782b790e02fcaf9e75cb46ae7390f9df4b17a1a9ac5dd3ca2484a3ca7.

## Сохранённая идентичность

Frozen S3: 7e583ac695be2b213d25591deab430664e682988. app.js blob 23a293db0bad74bbf565ae7780ba6ab249ca0a95; SHA256 4715f2e6866f384641fe3bb605697ab39feb012669b40103b66ab81502b3a21f.

Analytics artifact SHA256 f1f975900faaa64649bcef42412c1856543c8716711d4119df9b964f4bf8c824, 243504 bytes. Qualified builder blob 7982555aba12baf5323672da2371ed4a4829b893; worker template blob 45438c5b650ea252ab861a7a11a4a149e470c2b4. Исходный main: 255a5d9d27461dcacaebc1bc80ab322dd54b4de8. Frozen source, verifier, app, worker template не изменялись.

## Сохранённые неуспешные прогоны

- 37799338080: в MIX отсутствовал маркер готовности; причина тогда ещё не была установлена.
- 37836938750: правильный CONFIG ожидающего worker, но только первые две записи кеша. Async/then-предикат page.waitForFunction принимался как truthy Promise до завершения проверки. Три ожидания заменены явным awaited page.evaluate polling фактических installed/activated состояний с тем же пределом 30 секунд. Полные seal/SHA проверки сохранены.
- 37838258441: MIX, активация и cold прошли; WARM не нашёл evaluate в покрытии, включённом после загрузки невызванной lazy-функции. Обычный offline reload перенесён внутрь существующего callback покрытия перед History→Home. Все три имени и строгие нулевые счётчики сохранены.

Это исправления стенда измерений. Гипотеза о гонке реальной активации не подтверждена. [Первичный исходник Playwright 1.62.1](https://github.com/microsoft/playwright/blob/v1.62.1/packages/playwright-core/src/server/frames.ts#L1523-L1530).

## Frozen 3B на той же среде

[Run 37779253100 attempt 3](https://github.com/ugreat653-cyber/pheisiraetha-app/actions/runs/37779253100/attempts/3), job 113529816456, head 7442bb4df9568618ff6f2e8971eb1de3559140f1: 536/536 PASS, 16 suites, S2 real-browser 19/19 PASS. Fail/cancelled/skipped/todo/protectedChangedPathCount: 0; repositoryUnchanged и cleanCloneUnchanged: true.

Оба gate: Node 24.19.0, Playwright 1.62.1, /opt/google/chrome/chrome, Chrome 154.0.8037.97, SHA256 6c792041b07547a662e1b17974d1dc34a3db630379b45d9d89ddd7e3e68cc587 до/после.

3B artifact 11578460228, ZIP SHA256 9e90ec02849106820227315ba88cd633d7e7289ab4b3f448347d1adad0ee42f0. Исторический S2 failure остаётся зарегистрированным риском воспроизводимости.

## Граница принятия

main, merge, deploy и публичное ON не изменены. На Windows ничего не устанавливалось; системные настройки не менялись. [Draft public proposal #3](https://github.com/ugreat653-cyber/pheisiraetha-app/pull/3) отдельно квалифицирует hardened OFF bootstrap, проектный путь и точные ON/OFF/rollback комплекты. Его результаты не расширяют frozen 3B acceptance.

Artifact digest совпал между GitHub API и upload log; ZIP bytes этих двух исходных gate не скачивались. Artifact retention до 2026-10-22.
