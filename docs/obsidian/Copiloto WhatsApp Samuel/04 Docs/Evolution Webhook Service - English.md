---
type: technical-doc
project: Copiloto WhatsApp Samuel
classification: human
status: active
updated: 2026-10-07
---

**Language / Idioma:** [English](Evolution Webhook Service - English.md) · [Español](Flujo Interno - Evolution Webhook Service.md)

# Evolution Webhook Service — Internal Flow

## Current responsibility

The `POST /webhooks/evolution` endpoint delegates the payload to `EvolutionWebhookService`. The service has an early exit for shadow instances. For other instances, it processes authorized incoming messages, updates the lead, records the message, calculates its score, and generates a `PROPOSED` draft.

## Receive-only shadow branch

Before analyzing the normal pipeline, `ShadowReceiveOnlyGuard` checks whether instance starts with `evolution-shadow-`. For a shadow instance, it validates the pilot, the `messages.upsert` event, that the message is not sent by the instance or from a group, that it has an individual identity and text, and that the identity is allowed for that pilot. The decision ends here: the webhook returns an accepted or rejected result with `persisted: false`. It does not persist data, generate a draft, or continue through the normal route. An unknown shadow identity or instance is rejected.

## Sequence for non-shadow instances

1. Receive the payload and evaluate the shadow guard first.
2. Normalize the event name and accept only `messages.upsert`.
3. Ignore messages sent by the instance (`fromMe`), group messages, messages without a valid individual identity, or messages without text.
4. Extract the instance, `phone`, name, external ID, and text.
5. Find the active business associated with the instance and check whether the lead is authorized.
6. Upsert the lead by `business_id`, `phone`; this updates `last_message` and its timestamps before checking whether the message already exists.
7. Calculate the score using the lead's current score.
8. Insert the incoming message into `messages`, including `raw_payload` and scoring data. The unique constraint detects a duplicate at this insert.
9. If the insert detects a duplicate (`23505`), return without updating the lead's score/classification or generating a draft. The lead upsert from step 6 has already occurred.
10. If the insert is new, update the lead's score, classification, and reason.
11. Build context from the current message and up to ten prior messages with allowed roles; generate a draft through `ResponseDraftService`.
12. Save the draft in `response_drafts` with status `PROPOSED` and return the technical result to the webhook.

## AI abstraction

`ResponseDraftService` depends on the provider-neutral `AiProvider` contract and calls `generateText`; it does not depend directly on a provider SDK. The response-draft module currently binds `AI_PROVIDER` to `GeminiProvider`. The AI proposes text, and the service persists it as a draft.

## Sending and notifications

This flow does not send WhatsApp messages or notify the operator. Generating and saving a `PROPOSED` draft does not approve or send it.

## Logging and privacy

The previous note said logs were minimal and phone numbers were masked; that does not match the current code. The service logger records the `phone` number, customer name, and full message text in the success log; it also records phone numbers in other log entries. No masking is visible in those logs. This note describes the fields but includes no real values.

The raw payload is stored in `messages.raw_payload`. Generation context is built from selected fields of prior `messages` and the current message, not from the complete raw payload.
