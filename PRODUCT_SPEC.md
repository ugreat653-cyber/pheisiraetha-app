# PHEISIRAETHA MVP v0.1 — product specification

## Objective
Turn the completed Gorilla Alpha08 research prototype into a public-facing, local-first mobile web app that can be self-tested immediately and launched as a PWA before paying for native app-store distribution.

## What moves from Alpha08
- RIS: Primary objective, Success criteria, Scope, Non-goals, Constraints, Rationale.
- Repeated current-intention snapshot (CIE-equivalent).
- Intent & Energy Profile: desire, belief, emotion, emotion intensity, mental effort, practical effort, attention frequency, concrete actions, action hours.
- Observed Outcome Profile: current observable state, achievement, events/changes, direction, evidence basis, external context.
- Intentional-change decision and selective RIS revision.
- Longitudinal history.

## What is removed from the consumer MVP
- Gorilla Recruitment and participant tokens.
- Research compensation.
- Age/ConsentScore experimental gate.
- Randomiser and Arms A/B/C.
- Three-session hard stop.
- 168-hour hard lock.
- Research debrief and research-specific controller text.

## v0.1 architecture
- Single active intention.
- Unlimited check-ins.
- Recommended weekly rhythm, no forced wait during self-test.
- Local browser storage only.
- No account, backend, analytics, ad SDK, or cloud database.
- JSON export/import backup.
- Full local-data deletion.
- Russian/English interface.
- Installable PWA when served over HTTPS.

## Screens
1. Home / current RIS.
2. Create/Edit RIS.
3. Check-in: CIE.
4. Check-in: IEP.
5. Check-in: OOP.
6. Intentional revision.
7. History.
8. Data / export / import / delete.

## Next iteration after self-test
- UX corrections.
- Public landing/onboarding.
- Proper Privacy Policy and Terms for the consumer product.
- Optional anonymous/local-only mode retained.
- Optional Supabase account/sync layer only if real users need cross-device persistence.
- Notifications/reminders only after the core cycle proves useful.
- Native Android/iOS packaging only after public PWA traction.
