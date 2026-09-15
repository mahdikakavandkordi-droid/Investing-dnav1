# Investing DNA — M4 Pre-Launch Gate Checklist

This checklist separates engineering readiness from evidence and legal/compliance readiness. A public-launch decision requires all applicable gates to be explicitly closed or accepted.

## A. Cognitive evidence

- [ ] Round 1: 6 moderated `COGNITIVE_V1_10` sessions complete
- [ ] Round 1 item-level findings aggregated
- [ ] Any material wording changes versioned rather than silently edited
- [ ] Round 2: 6 sessions complete on the intended candidate
- [ ] Risk Tolerance vs Capacity confusion below stop threshold / no repeated major unresolved issue
- [ ] Behavioral questions are not repeatedly interpreted as knowledge questions
- [ ] Questionnaire candidate frozen for quantitative pilot

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

Engineering note: the service-side completed-guest claim/promotion path now has a real-database rollback regression and passes. That is not a substitute for the still-open external magic-link canary above.

## D. Database / security

- [x] M4 legacy Watchlist RLS policy cleanup applied and verified
- [ ] Profile RLS init-plan optimization applied and verified
- [ ] Launch-critical FK indexes applied and verified
- [ ] Public SECURITY DEFINER views classified
- [ ] Public privileged RPCs classified and hardened/accepted
- [ ] Raw personal/account tables remain inaccessible cross-account
- [ ] M1 regression PASS after hardening
- [ ] M2 regression PASS after hardening
- [ ] M3 regression PASS after hardening
- [ ] Security Advisor re-run and launch-relevant findings classified
- [ ] Performance Advisor re-run and launch-relevant findings classified

### Verified hardening progress in the current M4 batch

- [x] Missing live-applied migration source history reconciled back into the active branch without re-running those migrations
- [x] Questionnaire browser DTO narrowed so scoring weight/internal localized fields stay server-side
- [x] Public anonymous `SECURITY DEFINER` RPC findings reduced from 4 to 0 without breaking anonymous search/compare/DNA/fund-facts reads
- [x] Authenticated browser-callable `SECURITY DEFINER` function findings reduced from 11 to 2
- [x] Legacy `app_save_investment_context` and `get_investor_home` browser execution revoked
- [x] Legacy direct `get_investment_recommendations` and `promote_assessment_to_current_dna` browser execution revoked
- [x] Current account-state RPC moved behind private privileged implementation + public invoker wrapper
- [x] Completed guest claim/promotion service path regression PASS with transaction rollback
- [x] Portfolio Builder removed from current completion/context/account-state contracts while historical engine/migrations are preserved
- [x] `m4_security_hardening.sql` PASS against the live project
- [ ] Remaining `get_or_create_current_profile` / `is_current_profile` definer helpers reviewed with a real authenticated canary before changing their ownership semantics
- [ ] 28 Security Advisor `SECURITY DEFINER` views classified individually; do not batch-convert without tracing underlying grants/RLS

## E. Product truthfulness / data

- [ ] Unknown fund data remains unavailable, not zero/inferred
- [ ] Partial holdings/exposure coverage is visibly labelled
- [ ] Official risk provenance remains available
- [ ] Data freshness/as-of dates remain visible where relevant
- [ ] `review_required` still suppresses rankable score semantics
- [ ] `no_suitable_options` still does not force a recommendation
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
- [x] Vercel deployment success on initial M4 implementation batch
- [ ] Final M4 head CI PASS
- [ ] Final M4 head Vercel deployment PASS
- [ ] Final branch ancestry/mergeability check

Current hosting note: the latest observed Vercel attempt was blocked by the provider build-rate limit. That is not an application compile failure, but it is also not a deployment pass.

## Public-launch decision

At M4 closeout select exactly one:

- [ ] **GO**
- [ ] **CONDITIONAL GO** — list every remaining named blocker below
- [ ] **NO-GO** — identify the material evidence/security/compliance issue

### Named blockers / accepted risks

1. Real cognitive evidence and subsequent product-pilot evidence are not complete.
2. Real external magic-link/account canary is not complete.
3. Remaining security-view classification, final performance hardening and formal compliance/privacy review are not complete.
