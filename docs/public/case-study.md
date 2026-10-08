**[Español](caso-de-estudio.md) | English**

# Case study: safe assistance for sales conversations

> **Status as of October 6, 2026:** development was active from May through September 2026 and is currently inactive. Milestone 4.6 remains active and incomplete.

## The challenge

Explore how to help a team review incoming WhatsApp conversations and prepare responses while keeping decisions under human control and preventing AI generation from sending messages on its own.

## The implemented solution

A NestJS backend was built to receive WhatsApp events through Evolution API, apply business rules, and retain authorized information in Supabase. The flow includes lead classification, secure context construction, and draft generation through an AI provider interface. Gemini is the initial provider.

An authenticated admin panel was also developed to review drafts, approve them, edit them before approval, or reject them. AI generation proposes content; business decisions and effects remain under the control of the backend and a human reviewer.

## Historical activity shown in screenshots from June 24, 2026

Private screenshots from that date show receiving activity involving real messages and lead and message records in Supabase, in an environment identified as `PRODUCTION`. They also show scores and classifications, as well as schema errors.

This documents historical receiving and persistence activity in the environment identified that way. It does not demonstrate that every event was processed correctly, continuous availability, that the admin panel was deployed to production, or commercial results. The screenshots and their data are not published.

## Later testing for milestone 4.6

Later milestone 4.6 testing was conducted locally, in isolation, and with synthetic data. Local evidence records the panel review and administrative actions; runtime evidence documents technical checks of receiving and draft persistence without sending responses to leads.

The technical status versioned in the repository records the backend unit tests, end-to-end tests, and build as approved. These local validations do not turn the historical activity into verification of production operation. Milestone 4.6 remains active and incomplete.

## Deployment

The historical activity described above is limited to what the private screenshots from June 24 show. It does not establish continuous availability, production deployment of the admin panel, or complete commercial operations. Later milestone 4.6 testing was local and isolated; production was not accessed during that review.

## Status and limitations

Development was active from May through September 2026 and is currently inactive. Milestone 4.6 remains active because its pending operational validation, feedback review, and explicit agreement on the subsequent scope have not been completed. The milestone and a commercial pilot are not claimed as complete.

No business metrics, conversations, screenshots, names, phone numbers, or other identifying data are included. The system should not be presented as automatically sending responses, and no commercial results should be attributed to it without evidence.

## Project sources

- Implementation: backend under `agent-core/src/` and migrations under `supabase/migrations/`.
- Automated validations and local evidence: `docs/_generated/project-state.json` and `docs/control/hito-4.6-runtime-evidence.json`.
- Milestone 4.6 status, scope, and outstanding work: the corresponding milestone documentation in the repository.
- Historical activity: private screenshots from June 24, 2026, summarized here without publishing images or identifying data.
