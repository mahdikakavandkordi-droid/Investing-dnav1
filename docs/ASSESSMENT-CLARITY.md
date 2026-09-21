# Assessment clarity revision

Questionnaire `v1.10-clarity-1` uses engineering cohort `DEV_V1_10_CLARITY` and the existing `dna-v1.10-research` scoring model. New ordinary browser assessments explicitly request this cohort. Existing drafts retain their original questionnaire; the moderated `COGNITIVE_V1_10` cohort is unchanged. The Edge Function's legacy default remains for older clients.

Seven prompts have revised English, French and Persian text:

- BD01 distinguishes willingness to commit money from curiosity.
- BD05 excludes tax and transaction-cost considerations, matching the gain scenario.
- BD10 makes regret conditional and explains the no-regret response.
- RC01 defines an average month over the next 12 months, includes pensions, benefits and planned withdrawals, and uses a cautious average for irregular income. Its first option now refers to available funds rather than income alone.
- RC02 uses the same funding basis, without equating absence of salary with unpredictability.
- RC03 defines an accessible emergency reserve; no separate account is required. Money exposed to investment loss or already committed to planned spending cannot be double-counted.
- RC05 identifies the money being assessed and excludes the reserve counted earlier.

All 28 question IDs, ordering, score mappings, weights, dimensions, capacity guards and quality checks are retained. Text changes can affect how people answer; unchanged scoring does not establish psychometric equivalence. Do not pool responses from the two questionnaires for validation. Cognitive interviews with retired, irregular-income and reserve-in-the-same-account participants are still needed.

Name and age are independently optional before the result. An entered age must be an integer from 18 to 100; an omitted age is absent, never a synthetic zero. Name-only profiles can continue through the optional report-save flow. Personalization does not enter the scoring request. Progress counts answered questions rather than the current question index; the decorative helix continues to indicate question position.

## Verification

- `npm test`: normalization and guest continuity contracts.
- `npm run test:assessment`: mocked mobile integration for both details, name only, age only and neither; progress, invalid-age recovery, exclusive multi-choice and successful submission.
- `tests/assessment-clarity.sql`: live database rollback regression with 12 paired response sets. Confirms old/new scoring, quality and capacity guards agree, including high willingness with constrained capacity and low surplus without an automatic hard cap. These are software regressions, not tests with human participants.
- Apply the additive migration before releasing the new frontend. Rollback frontend routing to `DEV_V1_10` if needed; preserve versioned questions and any collected records.

## Recorded verification (2026-09-21)

Passed: production build, client contracts, TypeScript/no-unused checks, repository hygiene, the live 12-pair rollback regression, and a full `complete_dna_assessment` rollback smoke check on the new version. Migration `20260921113624_assessment_v110_clarity` is applied to the connected Supabase project; its new cohort does not reroute existing frontend sessions.

The four-case browser integration test is prepared but not verified: Chromium was unavailable and its official download timed out. No new hosted frontend has been verified. The user explicitly approved publishing this revision to GitHub. Hosted browser verification remains pending.
