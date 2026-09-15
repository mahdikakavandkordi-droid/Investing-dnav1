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

## D. Database / security

- [ ] M4 legacy Watchlist RLS policy cleanup applied and verified
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

## Public-launch decision

At M4 closeout select exactly one:

- [ ] **GO**
- [ ] **CONDITIONAL GO** — list every remaining named blocker below
- [ ] **NO-GO** — identify the material evidence/security/compliance issue

### Named blockers / accepted risks

1.
2.
3.
