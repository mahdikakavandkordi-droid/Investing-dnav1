# Investing DNA Cognitive Test Protocol — v1.10

## Purpose

Test whether real users understand **v1.10-cognitive-candidate / dna-v1.10-research** as intended before using responses for reliability, calibration or validation claims.

This is not a score-validation study. The output is wording, response-design and comprehension evidence.

## Controlled research entry

Use the dedicated route:

`/pilot/cognitive`

The route requires a **moderator-only research invite code** before it will enter cohort `COGNITIVE_V1_10`. The raw code is operational research access, not participant data: do not commit it to source control, put it in a public URL, post it publicly, or place it in analytics/notes. The application keeps it only in session storage long enough to start the protected cohort, and the backend stores only its SHA-256 hash.

After a valid code is entered, the route clears any existing local development draft and starts a fresh cognitive assessment. Do not recruit cognitive participants through the normal `/dna/assessment` development path because `DEV_V1_10` and cognitive-study observations must remain analytically separate.

Once the protected session starts, the assessment displays the backend-generated pseudonymous **Research code** (`P-...`). Copy that code exactly into `docs/M4-COGNITIVE-SESSION-WORKSHEET.md`. The backend research code is the canonical join key between moderator notes and the database participant/assessment record; do not replace it with a participant name, email or other PII. A moderator sequence such as `C01`–`C12` may still be used for scheduling, but it is not the database join key.

The database cohort target is **12 participants**.

## Sample

Recommended structure:

- Round 1: 6 participants
- Review and revise only when a clear comprehension/response problem appears
- Round 2: 6 participants using the revised candidate

Recruit for variation rather than representativeness:

- beginner investor
- some investing experience
- experienced/self-directed investor
- different ages and household financial situations

Do not select people based on the risk/archetype result you want to obtain.

## Session structure

### Part A — Unaided completion

Ask the participant to complete the assessment as naturally as possible using the controlled cognitive route.

Do not explain a question unless they cannot continue. Record:

- items they reread
- requests for clarification
- unusually long pauses
- answer changes
- statements such as “these two are the same” or “none of these fits me”

Do not coach them toward a response.

### Part B — Cognitive debrief

Use neutral probes on selected/all items.

For each important item ask:

1. **Interpretation** — “In your own words, what was this question asking you?”
2. **Retrieval** — “What did you think about when choosing your answer?”
3. **Choice** — “Why did that option fit better than the option next to it?”
4. **Clarity** — “Was any word or part of the question unclear?”
5. **Response fit** — “Was the answer you wanted available, or did you have to choose the closest one?”

Optional neutral probe:

- “Was there anything in the wording that made one answer feel like the answer you were supposed to choose?”

Do not ask “Did you understand it?” as the main comprehension test; people often say yes even when their interpretation differs from the intended construct.

### Part C — Product-value debrief

After the cognitive debrief, keep product feedback separate from question-comprehension feedback. Ask the participant to use the in-product `/feedback` form after seeing their result/Match experience, then probe verbally:

- What did you think Investing DNA was trying to tell you?
- Which part of the result felt most useful?
- Which part felt least credible or most confusing?
- Could you explain why an ETF matched or conflicted with your DNA in your own words?
- Did the Match feel like it was telling you which investment to buy? Why or why not?
- What did you think a score such as 82/100 represented? Did it feel like a compatibility score, a return estimate, or something else?
- What would make you return to the product?

Do not use positive product feedback as evidence that the questionnaire itself is valid.

## Special probes by layer

### Risk Tolerance

Check that participants distinguish:

- willingness to accept risk vs financial ability to absorb it
- discomfort with loss vs intended behavior after a crash
- price fluctuation vs uncertainty about future outcomes

For RT03/RT04 specifically ask whether they answered based on emotional discomfort, need for the money, or what they think is financially rational.

For RT09/RT10 ask whether the answer reflected what they would actually want to do, not what they have heard investors “should” do.

### Behavioral DNA

Check that participants answer about their **decision process**, not investment knowledge.

For social/recency items ask what made the hypothetical investment more or less attractive.

For reference flexibility ask whether the original purchase price influenced the answer and why.

For evidence discipline ask whether “credible new evidence” was understandable without requiring specialist knowledge.

### Financial Capacity

Check whether participants can answer from their real household situation without doing difficult calculations.

Probe ambiguous household arrangements, variable income and shared expenses.

### Experience

Check that participants distinguish personal investing experience from reading, studying or watching markets.

## Item review coding

Code each participant-item interaction where relevant:

- `OK` — intended interpretation, response fits
- `W` — wording/comprehension issue
- `R` — response options overlap or do not fit
- `C` — construct contamination; participant answers a different concept
- `J` — perceived judgment / obvious socially desirable answer
- `K` — requires knowledge that should not be required
- `O` — other issue

Also record a short note in the participant’s own words where useful.

## Revision triggers

An item should be reviewed when any of the following occurs:

- 2+ participants in a 6-person round interpret it in a materially different way from intended
- adjacent answer choices repeatedly feel equivalent
- participants repeatedly choose based on financial capacity when the item is meant to measure tolerance, or vice versa
- a response is repeatedly selected because it sounds like the “smart investor” answer
- a term consistently requires interviewer explanation
- multiple participants say their real response is missing

One unusual participant response is not enough by itself to rewrite an item.

## Consistency pairs

Do not tell participants that paired items are consistency checks.

After the session, inspect whether participants interpreted both items in each pair as the same underlying concept from different angles:

- RT01 / RT02
- RT03 / RT04
- RT07 / RT08
- RT09 / RT10
- BD01 / BD02
- BD03 / BD04
- BD05 / BD06
- BD07 / BD08

A difference in answers is not automatically an error. The cognitive interview should determine whether the difference reflects:

- a genuine nuance in the participant
- wording ambiguity
- a different construct being activated

## Moderator rules

- Keep the raw research invite code moderator-only; do not embed it in participant URLs or public messages.
- Record the displayed backend `P-...` research code on the worksheet before the participant proceeds too far.
- Stay neutral.
- Never praise a response as safer, smarter or more sophisticated.
- Do not explain Investing DNA’s expected scoring before the session.
- Do not tell a participant their archetype before the debrief if that could influence their explanations.
- Record exact wording of confusion when possible.
- Separate product/UI feedback from question-comprehension feedback.
- Do not modify v1.10 wording silently after data collection begins. If a material item changes after Round 1, create a documented revised candidate for Round 2.

## Round summary

After each round, create an item table with:

| Item | Intended construct | Issues observed | Count | Decision | Revised wording |
|---|---|---|---:|---|---|

Decision values:

- KEEP
- REWORD
- CHANGE OPTIONS
- MOVE CONSTRUCT
- DELETE
- RETEST

## Exit criteria for cognitive phase

Move to a real quantitative pilot when:

- 12 planned cognitive sessions are completed or there is a documented reason to stop/revise early
- no item has a repeated major interpretation problem
- answer choices are understood as distinct
- Risk Tolerance and Financial Capacity are not routinely confused
- Behavioral items are not routinely answered as knowledge tests
- the experience section is understood as experience, not risk appetite
- remaining issues are minor enough to test statistically rather than rewrite immediately

At that point, freeze a numbered quantitative-pilot version and do not silently change wording inside the same version.

## Evidence status

Until these sessions are completed, v1.10 remains a **research candidate**. Engineering tests, funnel analytics and product feedback are not substitutes for psychometric or cognitive validation.
