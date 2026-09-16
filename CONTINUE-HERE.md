# Continue here — 2026-09-16

This is the short-lived project handoff snapshot. Canonical architecture lives in `docs/ARCHITECTURE.md`; product-journey invariants in `docs/PRODUCT-UX.md`; runtime navigation in `docs/CODE-MAP.md`; intentional retirements in `docs/RUNTIME-RETIREMENTS.md`.

## Current branch / PR

- branch: `codex/platform-v4-account-continuity`
- PR: #2
- PR remains open, draft and mergeable.
- Do not merge without an explicit merge decision.

## Milestone state

- M1 Engine Trust: complete.
- M2 Product Value / connected research loop: complete from engineering acceptance perspective.
- M3 Controlled Pilot Readiness: complete from engineering/operations perspective.
- M4 Pilot Evidence & Pre-Launch Hardening: active and not closable by engineering alone.

M4 still needs real cognitive participants, later product-pilot evidence, a real external Magic Link/account canary and formal Canadian compliance/privacy review.

## Current product shape

- Platform brand: Investor DNA.
- Assessment: Investing DNA (`v1.10-cognitive-candidate`, `dna-v1.10-research`).
- Canonical Match: `investment-dna-match-v6`.
- Research catalog: 55 active instruments — 40 ETF, 4 GIC, 3 T-Bill, 6 Bond, 1 Commercial Paper reference, 1 ABCP reference.
- Explore / Detail / Compare: cross-asset.
- Screener / Match: explicitly ETF-scoped.
- `v_investment_dna_v2`, Match payload `universe_count`, Match result rows and Match data-version fingerprint are now ETF-only.
- Watchlist / Profile: asset-neutral.
- Stocks remain intentionally out of M4 scope.
- Portfolio Builder remains frozen and is not a callable runtime subsystem.

## Accepted audience journey

```text
Landing
 -> Investing DNA assessment
 -> Result
 -> Investment Context
 -> ETF DNA Match
 -> Explore / Detail / Compare
 -> optional Watchlist / Account persistence
```

Canonical UX rules remain value-before-account, no assessment priming, explicit Context choices, no fake zero Match scores, `review_required` pausing ranking, and same-session guest continuity through Match/Detail/Compare.

## Account / Magic Link readiness

Browser Auth uses the client-only implicit Magic Link flow with URL session detection, session persistence and refresh enabled. After a real authenticated session exists, `/profile` strips access/refresh-token data from the visible URL fragment while preserving safe query intent.

Canonical real-world acceptance procedure: `docs/AUTH-CANARY.md`.

Live baseline before the first external canary remains intentionally empty:

```text
auth users: 0
profiles: 0
linked profiles: 0
account-linked assessments: 0
watchlists: 0
watchlist items: 0
```

The first account must be created by real Supabase Auth, not by manually inserting Auth system rows.

Two authenticated `SECURITY DEFINER` helpers remain intentionally deferred until the real canary verifies ownership semantics:

- `get_or_create_current_profile()`
- `is_current_profile(p_profile_id uuid)`

Both deny anon execution and scope ownership to `auth.uid()`.

The external inbox/link round trip is still **not verified**. Do not mark the Magic Link canary PASS until a real email is requested, opened and returns to the deployed app with the intended session/account continuity.

## Cognitive pilot readiness

Live `COGNITIVE_V1_10` state before first participant remains:

```text
status: planned
questionnaire: v1.10-cognitive-candidate
model: dna-v1.10-research
invite gate: enabled
participants: 0
completed assessments: 0
feedback: 0
```

The raw moderator invite code is operational secret material. Only its SHA-256 hash belongs in the live cohort. After a protected session starts, use the backend-generated `P-...` code as the join key between moderator notes and database evidence.

Canonical cognitive docs:

- `docs/COGNITIVE-TEST-PROTOCOL.md`
- `docs/M4-COGNITIVE-SESSION-WORKSHEET.md`
- `docs/MILESTONE-4-PILOT-EVIDENCE-PLAN.md`

Do not change v1.10 item wording after collection begins without creating/documenting a revised candidate.

## Runtime / security boundaries

The live Match chain remains singular:

```text
current app contracts
 -> investor_private.current_match(assessment_id)
 -> calculate_investment_match_v6(assessment_id)
 -> v_investment_dna_v2 (ETF-only)
 -> match runs/results
```

Retired v3/v4/v5/v5.1 and unused parallel Match/portfolio/app-shell paths remain retired.

### Security state after M4 hardening

Live Supabase Security Advisor state on 2026-09-16:

- anonymous browser-callable `SECURITY DEFINER` functions: 0;
- authenticated browser-callable `SECURITY DEFINER` functions: 2 (the account helpers above);
- `SECURITY DEFINER` views: 0;
- RLS-enabled/no-policy INFO findings: 32.

The older handoff state that described five remaining definer views is obsolete. Later M4 read-model privilege reductions completed that redesign without reopening browser access to internal source metadata.

## Match hard-test correction and evidence

A serious Match v6 stress test found a real scope defect: the product and UI were ETF-only, but `v_investment_dna_v2` still contained all 55 research instruments. Non-ETF instruments could therefore enter Match payloads as `review_required` rows and could invalidate the ETF Match data-version fingerprint.

Applied/source-controlled correction:

- `20260916113000_m4_scope_match_to_etf_universe.sql`

The view now contains every active ETF and no non-ETF instrument. Cross-asset Explore / Detail / Compare continue to use the separate research catalog.

Regression coverage:

- `supabase/tests/milestone_1_engine_trust.sql` now asserts the Match view/payload is ETF-only.
- `supabase/tests/m4_match_hard_stress.sql` exercises 15 edge/contradictory scenarios and asserts gate, ranking, horizon, risk and universe invariants.

Live verification after the correction:

- M1 engine-trust regression: PASS.
- M4 Match v6 hard-stress matrix: PASS.
- Match universe: 40 ETFs, not 55 cross-asset instruments.
- ETF data quality in the Match universe: 16 verified, 20 verified-partial, 4 stale.
- Normal scenarios therefore expose 24 ETF rows as data-review-required rather than pretending incomplete data is rankable.
- Safety-gated scenarios produce zero eligible/top rows and null Match scores.
- Synthetic database records are transactionally rolled back or deleted by the test harness.

### Hard-test behavior worth preserving

For a high-tolerance/high-capacity growth profile, horizon tightening behaves monotonically:

```text
12y -> equity ceiling 100 -> all-equity portfolios can rank first
7y  -> equity ceiling 70  -> balanced portfolios rank first
4y  -> equity ceiling 40  -> conservative 40/60 structure is the only current eligible verified ETF
2y  -> equity ceiling 0   -> ranking pauses with short_horizon review gate
```

A zero-risk-tolerance growth profile produces `no_suitable_options` rather than a forced recommendation. The same DNA with an income goal can still find a verified zero-equity bond ETF when it passes all limits. Loss-impact, emergency-buffer, short-horizon and principal-protection gates all pause ranking as intended.

### Research/model questions found by the hard test — not silently changed

These are not implementation regressions, so they remain explicit research decisions for a future model revision:

1. With no investment context, several verified diversified ETFs can tie near 98.95 in the DNA-only comparison. Status is correctly `context_required`, but the numeric score may visually look too confident. Consider capping/hiding the score in a future UX/model revision rather than mutating v6 silently.
2. Current goal-role logic intentionally maps `income`, `preservation`, `wealth_preservation`, `house_purchase`, `education` and `major_purchase` primarily to fixed-income share. In the current test data, long-horizon income/preservation and a 7-year education case can therefore produce the same top ranking. Decide whether those goals need separate role functions in a versioned future Match model.

## Verification status

### Database

- live Match ETF-scope migration: applied successfully;
- live ETF-only boundary checks: PASS;
- M1 engine regression after migration: PASS;
- M4 hard stress suite: PASS;
- Security Advisor rechecked after migration: no new high-risk finding; state remains 0 definer views / 2 authenticated helper warnings / 32 INFO no-policy findings;
- live account baseline remains all-zero before external canary;
- cognitive cohort remains planned/gated with zero participants before recruitment.

### GitHub / Vercel

The exact application/test head immediately after the hard-test correction (`b883a6e962daeccaba2cd0e8f83c5794d1ffd540`) had:

- GitHub Actions `verify`: SUCCESS;
- Vercel deployment status: SUCCESS;
- Vercel Preview Comments check: SUCCESS.

This handoff-document update itself creates a newer documentation-only head; check the latest branch SHA if an exact-head release claim is needed.

A green deployment is still not a substitute for the real external Magic Link inbox/link canary.

## High-priority follow-ups

1. Run the real external Magic Link Canary A and B from `docs/AUTH-CANARY.md` with an explicitly supplied test inbox.
2. Run the first 6 cognitive sessions using the protected route and backend `P-...` research code on each worksheet.
3. Analyze Round 1; revise only when evidence meets the documented trigger, then create a revised candidate if needed.
4. Run 6 more cognitive sessions and freeze the quantitative-pilot candidate.
5. After cognitive freeze, run the planned 20–50 user product pilot.
6. Formal Canadian compliance/privacy review remains a launch gate.
7. Treat the contextless-score confidence and goal-role collapse found by the hard test as versioned research questions, not opportunistic edits to Match v6.
8. Keep non-ETF assets research-only for personalized Match and keep Stocks out of M4 scope.

If this snapshot conflicts with current code or canonical engineering docs, update this snapshot rather than preserving stale handoff text.
