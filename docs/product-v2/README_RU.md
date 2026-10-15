# PHEISI — поэтапная архитектура продукта

Направление одобрено владельцем 15 октября 2026 года: несколько намерений,
отдельный восстанавливаемый draft, понятные действия, примеры RIS, единый язык,
проверенная локализованная аналитика и сохранность legacy при OFF rollback.
Короткое имя у иконки: **PHEISI**. Подписка — будущий отдельный этап.

## Что содержит этот PR

- [DATA_CONTRACT_RU.md](DATA_CONTRACT_RU.md): versioned ownership, атомарность,
  миграция, конфликты, backup и исторический OFF.
- [OBSERVATION_CONTRACT_RU.md](OBSERVATION_CONTRACT_RU.md): точный предлагаемый
  перечень обязательных ответов и lifecycle черновика.
- [ANALYTICS_PRESENTATION_CONTRACT_RU.md](ANALYTICS_PRESENTATION_CONTRACT_RU.md):
  новая закрытая граница представления при неизменных frozen Analysis/Safety.
- [BRAND_AND_SUBSCRIPTION_RU.md](BRAND_AND_SUBSCRIPTION_RU.md): PHEISI, иконки,
  локализуемая заставка и отделённая будущая подписка.
- Независимый IndexedDB foundation и его браузерные проверки.

Модуль не загружается работающим приложением. Ни runtime UI, ни существующее
хранилище, ни production main, ни anchor, ни PR #8, ни release artifacts не меняются.

## Границы следующих PR

| PR | Допустимый scope | Условие выхода |
|---|---|---|
| 1 — этот | Контракты + изолированный store | Настоящие transactional tests, scope guard, review |
| 2 | Lossless backup/restore, domain commands, RIS event history, completion | Утверждённый список ответов; atomic/idempotent completion; storage/receipt performance qualification |
| 3 | Private v2 пользовательский путь | Несколько намерений, Next/Resume/Save later, recovery, понятные состояния; без изменения public URL |
| 4 | UI content, RIS examples, PHEISI install label, launch | Проверенные 31 locale, RTL, keyboard/mobile QA; pixels и подпись проверяются отдельно |
| 5 | Private localized analytics composition | Утверждённые шаблоны/summary и semantic review; frozen checks unchanged |
| 6 | Release qualification | Точный новый кандидат, mixed-version/offline/rollback и отдельное разрешение публикации |
| Позже | Account/подписка | Отдельные решения по доступу, провайдеру, восстановлению покупок и оплате |

PR #8 остаётся историческим draft. Полезные UX конструкции переносятся по смыслу
и перепроверяются; его merge не является шагом этого плана.

## Требующие отдельной приёмки положения

1. Точные обязательные ответы: предложение в observation contract имеет статус
   `PENDING_OWNER_APPROVAL`. До решения runtime completion не изменяется.
2. Аналитические формулировки/переводы: `PENDING_SEMANTIC_REVIEW`; наличие строки
   не считается проверкой её смысла, и English fallback не скрывает пробел.
3. Публикация и платёжные операции требуют отдельного конкретного кандидата.

Разрешение на архитектуру и реализацию foundation уже дано владельцем; повторное
согласование обратимых технических деталей не требуется.

## Запуск проверок

Требуются Node 24.19.0, Playwright 1.62.1 и установленный совместимый browser.
Драйвер можно предоставить через `NODE_PATH`; browser executable — через
`PHEISI_BROWSER_EXECUTABLE`. Проверки не используют профиль пользователя.

```text
node product-v2/verify-scope.cjs
node --test product-v2/storage.test.cjs
```

CI запускает собственный workflow с правами только чтения. Его успех не
авторизует merge/deploy и не заменяет прежние release gates.
