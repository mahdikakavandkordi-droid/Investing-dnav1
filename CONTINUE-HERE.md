# Continue here — 2026-09-16

This is the short-lived project handoff snapshot. Canonical architecture lives in `docs/ARCHITECTURE.md`; route/runtime navigation in `docs/CODE-MAP.md`; product-journey invariants in `docs/PRODUCT-UX.md`; intentional runtime removals in `docs/RUNTIME-RETIREMENTS.md`.

## Current branch / PR

- branch: `codex/platform-v4-account-continuity`
- PR: #2
- PR is open, draft and mergeable.
- Do not merge without an explicit merge decision.

## Milestone state

- M1 Engine Trust: complete.
- M2 Product Value / connected research loop: complete from engineering acceptance perspective.
- M3 Controlled Pilot Readiness: complete from engineering/operations perspective.
- M4 Pilot Evidence & Pre-Launch Hardening: active and not closable by engineering alone.

M4 still needs real cognitive participants, later product-pilot evidence, a real external magic-link/account canary and formal Canadian compliance/privacy review.

## Current product shape

- Platform brand: Investor DNA.
- Assessment: Investing DNA (`v1.10-cognitive-candidate`, `dna-v1.10-research`).
- Canonical Match: `investment-dna-match-v6`, currently ETF-only.
- Research universe: 55 active instruments — 40 ETF, 4 GIC, 3 T-Bill, 6 Bond, 1 Commercial Paper reference, 1 ABCP reference.
- Explore / Detail / Compare: cross-asset.
- Screener / Match: ETF-scoped.
- Watchlist / Profile: asset-neutral.
- Stocks remain intentionally out of M4 scope.
- Portfolio Builder remains frozen and is not a callable runtime subsystem.

## Accepted audience journey after UX polish

```text
Landing
 -> Investing DNA assessment
 -> Result
 -> Investment Context
 -> ETF DNA Match
 -> Explore / Detail / Compare
 -> optional Watchlist / Account persistence
```

Canonical UX rules are in `docs/PRODUCT-UX.md`. Important invariants include value-before-account, no assessment priming, explicit Context choices, no fake zero Match scores, `review_required` pausing ranking, and same-session guest continuity through Match/Detail/Compare.

## Account / Magic Link readiness

The browser Auth client now explicitly uses the client-only implicit Magic Link flow:

```text
flowType = implicit
detectSessionInUrl = true
persistSession = true
autoRefreshToken = true
```

After a real authenticated session exists, `/profile` removes access/refresh-token data from the visible URL fragment while preserving safe query intent such as `save=dna` and `investment=<uuid>`.

Canonical real-world acceptance procedure: `docs/AUTH-CANARY.md`.

Before the first external canary, live aggregate state is intentionally empty:

```text
auth users: 0
profiles: 0
linked profiles: 0
account-linked assessments: 0
watchlists: 0
watchlist items: 0
```

The first account should be created by real Supabase Auth, not by manually inserting into Auth system tables.

The two remaining authenticated `SECURITY DEFINER` helpers are intentionally deferred until that canary:

- `get_or_create_current_profile()`
- `is_current_profile(p_profile_id uuid)`

Both deny anon execution and scope ownership to `auth.uid()`.

Latest auth-hardening CI checkpoint before the cognitive research-code follow-up: run **248** passed on `2018cf2a2bc2e26a58235e308c06f6a500e89bd8`.

The exact auth-hardening/documentation head was still blocked by Vercel provider `build-rate-limit`; do not mark the external email canary PASS until the exact application head is deployed and a real inbox/link round trip succeeds.

## Cognitive pilot readiness

Live `COGNITIVE_V1_10` state before first participant:

```text
status: planned
questionnaire: v1.10-cognitive-candidate
model: dna-v1.10-research
invite gate: enabled
participants: 0
completed assessments: 0
feedback: 0
```

The raw moderator invite code is operational secret material. Only its SHA-256 hash is stored in the live cohort; the raw code is intentionally absent from source control, URLs and analytics.

After a protected session starts, the backend-generated pseudonymous participant code (`P-...`) is now surfaced on the cognitive assessment screen. Record that exact code in `docs/M4-COGNITIVE-SESSION-WORKSHEET.md`; it is the canonical join key between moderator notes and database evidence. `C01`–`C12` may still be used as moderator sequence labels but are not database identifiers.

Canonical cognitive docs:

- `docs/COGNITIVE-TEST-PROTOCOL.md`
- `docs/M4-COGNITIVE-SESSION-WORKSHEET.md`
- `docs/MILESTONE-4-PILOT-EVIDENCE-PLAN.md`

Do not change v1.10 item wording after collection begins without creating/documenting a revised candidate.

## Context backend correction

Match v6 requires `principal_required` for complete money context. The signed-in path is ownership-scoped rather than relying on the guest Edge session flow.

```text
guest same-session DNA
 -> investing-dna-pilot / save_context
 -> assessment_id + server-issued session token validation

signed-in saved DNA
 -> public.app_save_current_investment_context(...)
 -> investor_private.save_current_investment_context(...)
 -> ownership derived from auth.uid()
```

Applied/source-controlled migration:

- `20260916004811_m4_current_account_context_rpc.sql`

## Runtime / security boundaries

Assessment browser actions use `investing-dna-pilot` for `start`, `questionnaire`, `save_answers`, `submit`, guest `save_context`, `claim_assessment`, `track_event` and `submit_feedback`.

The public questionnaire DTO stays narrow; scoring weights, construct metadata and non-selected/internal model fields remain server-side.

The live Match chain remains singular:

```text
current app contracts
 -> investor_private.current_match(assessment_id)
 -> calculate_investment_match_v6(assessment_id)
 -> match runs/results
```

Retired v3/v4/v5/v5.1 and unused parallel Match/portfolio/app-shell paths remain retired.

### M4 view-hardening pass

Applied/source-controlled migrations:

- `20260916013121_m4_harden_internal_diagnostic_views.sql`
- `20260916021927_m4_harden_unused_reference_views.sql`
- `20260916022221_m4_harden_internal_research_helper_views.sql`

These removed direct browser grants and switched 14 low-risk/internal views to `security_invoker` without changing public product behavior. Supabase `security_definer_view` Advisor findings moved **19 -> 5**.

The five remaining views are active core-path boundaries and must not be bulk-converted:

- `v_investment_catalog`
- `v_investment_detail`
- `v_investment_screener`
- `v_investment_dna_v2`
- `v_investment_latest_income`

A transactional dry-run proved that simple conversion of `v_investment_latest_income` breaks anonymous Explore because it reaches source metadata intentionally hidden from the browser. Reducing 5 -> 0 requires deliberate boundary redesign.

Latest security state:

- anonymous browser-callable `SECURITY DEFINER` functions: 0;
- authenticated browser-callable `SECURITY DEFINER` functions: 2;
- `SECURITY DEFINER` views: 5;
- RLS-enabled/no-policy INFO findings: 32.

## Verification status

### Database

- live Context migration/permission smoke: PASS;
- live view-hardening role/grant checks: PASS;
- anon product RPC smoke after all hardening batches: PASS;
- active universe counts remain ETF 40, GIC 4, T-Bill 3, Bond 6, Commercial Paper 1, ABCP 1;
- live account baseline remains all-zero before external canary;
- cognitive cohort remains planned/gated with zero participants before recruitment;
- synthetic DB regression data is transactionally rolled back.

### GitHub CI

Auth-hardening full CI run **248** passed on `2018cf2a2bc2e26a58235e308c06f6a500e89bd8`.

Cognitive research-code UI/type/test/docs changes were added after that checkpoint; run full CI on the exact final head before treating this handoff as engineering-green.

### Vercel

A prior hardening head received Vercel SUCCESS. The newer auth/cognitive head may independently be blocked by provider build-rate-limit. Always check the exact SHA. A green GitHub CI is not a substitute for a deployed external Magic Link canary.

## Documentation order when returning

1. `README.md`
2. `docs/README.md`
3. `docs/PRODUCT-UX.md`
4. `docs/CODE-MAP.md`
5. `docs/ARCHITECTURE.md`
6. `docs/ENGINEERING-GUIDE.md`
7. `docs/DATABASE-AND-API.md`
8. `docs/AUTH-CANARY.md`
9. `docs/RUNTIME-RETIREMENTS.md`
10. `docs/TESTING.md`
11. `docs/INVESTOR-DNA-ASSET-ARCHITECTURE.md`
12. `docs/ASSESSMENT-METHODOLOGY.md`
13. `docs/INVESTMENT-DNA-METHODOLOGY.md`

## High-priority follow-ups

1. Run full CI on the exact final cognitive/auth head.
2. Once that exact head is successfully deployed, run the real external Magic Link Canary A and B from `docs/AUTH-CANARY.md`.
3. Run the first 6 cognitive sessions using the protected route and backend `P-...` research code on each worksheet.
4. Analyze Round 1; revise only when evidence meets the documented trigger, then create a revised candidate if needed.
5. Run 6 more cognitive sessions and freeze the quantitative-pilot candidate.
6. After cognitive freeze, run the planned 20–50 user product pilot.
7. Formal Canadian compliance/privacy review remains a launch gate.
8. Design the private read-model/public RPC boundary for the final five active definer views only if justified; do not bulk-convert them.
9. Keep non-ETF assets research-only for personalized Match and keep Stocks out of M4 scope.

If this snapshot conflicts with current code or canonical engineering docs, update this snapshot rather than preserving stale handoff text.
