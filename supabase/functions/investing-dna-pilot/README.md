# `investing-dna-pilot` Edge Function

This is a privileged server boundary for Investing DNA assessment sessions and controlled-pilot operations.

It may use the Supabase service role, so browser input is always untrusted.

## Current actions

- `start` — create/attach a pilot participant + assessment session.
- `questionnaire` — return the public questionnaire payload for the assessment version/language.
- `save_answers` — validate and persist assessment answers.
- `submit` — complete the assessment and return canonical result/Match data.
- `save_context` — persist investment context for the assessment.
- `claim_assessment` — attach a completed guest assessment to the authenticated profile.
- `track_event` — privacy-minimized product analytics write.
- `submit_feedback` — structured pilot feedback write.

## Request trust model

After `start`, assessment operations are authorized with:

1. `assessment_id`;
2. the server-issued session token;
3. hashed-token validation against the pilot participant;
4. authenticated account ownership as an additional requirement when the assessment has been claimed/linked.

Never treat a browser-provided `profile_id` as proof of ownership.

## Public DTO rule

Return only fields the browser actually needs. Database/internal scoring configuration must not leak simply because a table row is convenient to spread into JSON.

The `questionnaire` action deliberately returns a narrow question DTO:

- `question_id`
- `section`
- `question_type`
- localized `prompt`
- localized `options`

The outer response still includes `assessment_id`, `questionnaire_version`, and `language_code` so the session remains reproducible. Internal question-bank fields such as scoring `weight`, construct metadata, row version, sort metadata, and non-selected locale copy are not part of the browser question DTO.

`tests/contracts.mjs` guards this boundary so a future refactor cannot silently reintroduce row spreading/internal scoring fields.

## Analytics/privacy rule

The event-name and metadata allowlists are deliberate privacy boundaries. Keep them synchronized with `lib/analytics.ts`.

Do not add email, name, IP or questionnaire answer text to generic event metadata.

## Change checklist

When adding/changing an action:

- validate the action/payload explicitly;
- verify assessment session/account ownership where applicable;
- minimize the response DTO;
- avoid revealing service/database implementation details;
- update `docs/DATABASE-AND-API.md`;
- update relevant Playwright and SQL regressions;
- deploy the matching Edge Function before calling a frontend deployment compatible.

See `docs/ARCHITECTURE.md` and `docs/ENGINEERING-GUIDE.md`.