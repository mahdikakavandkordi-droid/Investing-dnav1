# Investing DNA — M4 Pre-Launch Gate Checklist

This checklist separates engineering readiness from evidence and legal/compliance readiness. A public-launch decision requires all applicable gates to be explicitly closed or accepted.

Last evidence refresh: 2026-09-16.

## A. Cognitive evidence

- [ ] Round 1: 6 moderated `COGNITIVE_V1_10` sessions complete
- [ ] Round 1 item-level findings aggregated
- [ ] Any material wording changes versioned rather than silently edited
- [ ] Round 2: 6 sessions complete on the intended candidate
- [ ] Risk Tolerance vs Capacity confusion below stop threshold / no repeated major unresolved issue
- [ ] Behavioral questions are not repeatedly interpreted as knowledge questions
- [ ] Questionnaire candidate frozen for quantitative pilot

Current live baseline: `COGNITIVE_V1_10` is `planned`, target `12`, invite gate configured, with `0` participants, `0` completed assessments and `0` feedback rows.

## B. Product pilot evidence

- [ ] Initial 20–50 user product pilot recruited
- [ ] Assessment funnel reviewed in 5–10 user batches
- [ ] Match comprehension measured
- [ ] Trust/usefulness measured
- [ ] Return intent measured
- [ ] Actual return behavior observed
- [ ] Save/claim/watchlist behavior observed
- [ ] Repeated product friction documented and targeted fixes verified
- [ ] No repeated interpretation of Match as guaranteed return or directive to buy remains unresolved

## C. Authentication / email

- [ ] Intended production Site URL verified
- [ ] Intended production redirect URLs allow-listed
- [ ] One real external magic-link email received
- [ ] Real link returns to deployed domain
- [ ] Auth session hydrates after callback/reload
- [ ] Guest DNA claim succeeds after real callback
- [ ] Sign-out works
- [ ] Return sign-in works
- [ ] SMTP provider/configuration documented
- [ ] Auth email/OTP rate limits reviewed
- [ ] CAPTCHA/abuse-protection decision documented

Engineering evidence already in place:

- browser auth explicitly uses the client-only implicit Magic Link flow;
- callback token fragments are removed only after a real authenticated session exists while safe query intent remains;
- mocked browser flow covers send failure/success, callback, auto-claim failure, manual retry, claim-ticket clearing and sign-out;
- the service-side completed-guest claim/promotion path has a real-database rollback regression and passes;
- `docs/AUTH-CANARY.md` defines the real external Canary A/B acceptance procedure.

These are not substitutes for the still-open external email round trip above.

Pre-canary live aggregate state remains intentionally empty:

```text
auth users: 0
profiles: 0
linked profiles: 0
account-linked assessments: 0
watchlists: 0
watchlist items: 0
```

## D. Database / security

- [x] M4 legacy Watchlist RLS policy cleanup applied and verified
- [x] Profile/auth RLS init-plan optimization applied and verified — latest Performance Advisor has no `auth_rls_initplan` finding
- [x] Launch-critical FK indexes applied and verified
- [x] Public `SECURITY DEFINER` views classified individually
- [ ] Public privileged RPCs fully hardened/accepted — 2 authenticated ownership helpers intentionally remain pending real account canary
- [ ] Raw personal/account tables verified inaccessible cross-account with a real authenticated canary
- [x] M1 regression PASS after hardening — re-run live 2026-09-16 with transaction rollback
- [x] M2 regression PASS after hardening — re-run live 2026-09-16 with transaction rollback
- [x] M3 regression PASS after hardening — re-run live 2026-09-16 with transaction rollback
- [x] Security Advisor re-run and launch-relevant findings classified
- [x] Performance Advisor re-run and launch-relevant findings classified

### Verified hardening progress in the current M4 batch

- [x] Missing live-applied migration source history reconciled back into the active branch without re-running those migrations
- [x] Questionnaire browser DTO narrowed so scoring weight/internal localized fields stay server-side
- [x] Public anonymous `SECURITY DEFINER` RPC findings reduced from 4 to 0 without breaking anonymous search/compare/DNA/fund-facts reads
- [x] Authenticated browser-callable `SECURITY DEFINER` function findings reduced from 11 to 2
- [x] Legacy `app_save_investment_context` and `get_investor_home` browser execution revoked/retired
- [x] Legacy direct `get_investment_recommendations` and `promote_assessment_to_current_dna` browser execution revoked/retired
- [x] Current account-state RPC moved behind private privileged implementation + public invoker wrapper
- [x] Completed guest claim/promotion service path regression PASS with transaction rollback
- [x] Portfolio Builder removed from current completion/context/account-state contracts while historical engine/migrations are preserved
- [x] Legacy Match v3/v4/v5/v5.1, unused readers/helpers and stale app/read views retired from current runtime while migration/audit history is preserved
- [x] `m4_security_hardening.sql` PASS against the live project
- [x] Performance Advisor `unindexed_foreign_keys` reduced from 18 to 0
- [x] Performance Advisor `duplicate_index` reduced from 9 to 0 while preserving constraint-backed indexes
- [x] `SECURITY DEFINER` views reduced from 19 to 5 through three dependency-tested hardening batches
- [x] Remaining 5 definer views classified as active core read-model boundaries: `v_investment_catalog`, `v_investment_detail`, `v_investment_screener`, `v_investment_dna_v2`, `v_investment_latest_income`
- [x] Transactional dry-run proved simple invoker conversion of `v_investment_latest_income` breaks anonymous Explore, so the remaining five require deliberate boundary redesign rather than lint-driven ALTERs
- [x] Latest Security Advisor confirms exactly 5 definer views, 2 authenticated definer helpers and 32 RLS-enabled/no-policy INFO findings
- [x] Latest Performance Advisor contains only 47 `unused_index` INFO findings; no duplicate-index, unindexed-FK or auth-init-plan finding remains
- [x] `unused_index` findings intentionally deferred until real pilot traffic exists; newly-created required indexes must not be removed simply because no traffic has exercised them yet
- [ ] Remaining `get_or_create_current_profile` / `is_current_profile` definer helpers reviewed with a real authenticated canary before changing their ownership semantics
- [ ] Remaining five core read-model views redesigned or explicitly accepted after real account/preview canary evidence

## E. Product truthfulness / data

- [ ] Unknown fund data remains unavailable, not zero/inferred
- [ ] Partial holdings/exposure coverage is visibly labelled
- [ ] Official risk provenance remains available
- [ ] Data freshness/as-of dates remain visible where relevant
- [x] `review_required` still suppresses rankable score semantics — M1 live regression PASS
- [x] `no_suitable_options` still does not force a recommendation — M1 live regression PASS
- [ ] Compatibility remains separate from fund facts

## F. Privacy / compliance / positioning

- [x] Research & limitations product surface exists
- [x] Pilot privacy summary exists
- [x] Global research-stage disclosure exists
- [x] Canadian compliance review brief prepared
- [ ] Formal privacy policy reviewed for launch
- [ ] Terms/disclaimer wording reviewed
- [ ] Canadian securities-law/registration analysis documented by appropriate counsel/compliance professional
- [ ] Intended revenue model included in compliance analysis
- [ ] Product claims/marketing copy reviewed against actual evidence

## G. Engineering / deployment

- [x] M1–M3 core CI established
- [x] M4 launch-surface browser regression added
- [x] M4 disclosure/privacy regression PASS on initial implementation batch
- [x] Vercel deployment success on an earlier application-equivalent M4 implementation head
- [x] Final current head CI PASS — run 257 on `d509e7a081bf70c5a79da5e8651465208e24def1`
- [ ] Final current head Vercel deployment PASS
- [x] Current PR ancestry/mergeability check — PR #2 remains open, draft and mergeable

Current hosting note: Vercel status for exact head `d509e7a081bf70c5a79da5e8651465208e24def1` is provider `build-rate-limit`. This is not an application compile failure, but it is also not an exact-head deployment pass. The connected Vercel account currently exposes no team/project metadata, so exact-head hosting acceptance remains blocked until Vercel can build the SHA.

## Public-launch decision

At M4 closeout select exactly one:

- [ ] **GO**
- [ ] **CONDITIONAL GO** — list every remaining named blocker below
- [ ] **NO-GO** — identify the material evidence/security/compliance issue

### Named blockers / accepted risks

1. Real cognitive evidence and subsequent product-pilot evidence are not complete.
2. Exact-head Vercel deployment and real external magic-link/account Canary A/B are not complete.
3. Two authenticated ownership helpers and five core read-model definer views remain deliberate hardening follow-ups, not unclassified findings.
4. Real-traffic index observation and formal compliance/privacy review are not complete.
