# Investor DNA — product UX invariants

Status: canonical product-experience rules  
Last reviewed: 2026-09-16

This document records product-experience decisions that are easy to accidentally break while adding features. It is not a visual design system; it defines how the core journey should behave for a person using Investor DNA.

## 1. Value before account creation

An account is a persistence feature, not a gate to the core product value.

A guest must be able to:

1. start Investing DNA;
2. complete the assessment;
3. see the one-session Investor DNA report;
4. see the same-session ETF DNA Match;
5. add investment context;
6. browse Explore and investment research.

Ask for an account when the user wants continuity across visits/devices, a persistent watchlist or saved DNA. Do not place account creation as a competing primary CTA before the user has seen their result.

## 2. Do not prime the assessment

Before the assessment, explain the dimensions being measured rather than showing all possible archetype labels or implying that one outcome is desirable.

The assessment overview may explain:

- risk comfort/tolerance;
- financial capacity;
- decision patterns;
- investing experience.

It should not coach the user toward a score, archetype or Match outcome.

## 3. Investor DNA and money context stay separate

Investor DNA describes the person. Investment context describes one pool of money.

Core context fields are explicit user choices and must not be silently preselected:

- primary goal;
- time horizon;
- liquidity/access need;
- whether principal protection is required at the point the money is needed.

Optional personal details such as name, age or amount can stay blank.

Changing context may change Match constraints but must not silently change the underlying Investor DNA score.

## 4. Editing context must be safe

If saved context exists, the edit flow must preload it. Never open an edit form with unrelated defaults that can overwrite persisted context.

Guests save through their short-lived assessment capability. Signed-in returning users save through an account-owned server contract that resolves the current assessment from authenticated identity; browser IDs are not ownership proof.

## 5. Missing, gated and unavailable are not zero

Never render a missing Match score, yield, return or research field as `0` merely because a UI formatter needs a number.

Examples:

- review-gated Match score -> `Review` / unavailable, not `0/100`;
- missing yield -> `Not available`, not `0%`;
- missing source date -> unavailable/unknown, never manufactured freshness.

## 6. Match is compatibility, not a winner list

DNA Match currently applies only to ETFs.

The UI must explain that a higher Match score means closer compatibility with the current inputs. It does not mean:

- higher expected return;
- objectively better investment;
- a recommendation to buy;
- a prediction of future performance.

A valid no-match or review-required state is preferable to forcing a ranked option.

## 7. Cross-asset research is structure-first

Explore and Compare may include ETFs, GICs, T-Bills, bonds and money-market research examples. Compare them through common structural dimensions rather than pretending every asset has ETF metrics.

Do not display MER/holdings for a GIC merely for layout consistency. Do not enable personalized Match for a new asset type until an asset-specific compatibility model and evidence justify it.

## 8. Navigation reflects the core loop

Primary navigation should make the core journey discoverable:

- My DNA;
- Match;
- Explore;
- Watchlist;
- Profile/account continuity.

Specialized tools such as the ETF Screener can remain contextual tools rather than replacing a core product step in global navigation.

## 9. Compliance text supports the experience; it does not replace it

Research-stage limitations and non-advice language must remain accurate and visible, but do not lead every card with internal model/compliance language. First explain the user-facing purpose, then provide the relevant limitation/provenance where it matters.

## 10. What to test when changing the journey

A change to these invariants should update the relevant browser regression and, when it changes an ownership/data contract, a database regression.

High-value journey assertions include:

- assessment starts without account creation;
- same-session guest Result -> Match continuity works;
- context core fields begin unselected unless previously saved;
- `principal_required` reaches the server contract;
- returning-account context edits use authenticated ownership;
- review-gated Match score never appears as zero;
- mobile navigation still exposes the core loop.

See `docs/CODE-MAP.md`, `docs/TESTING.md` and `docs/DATABASE-AND-API.md` for implementation ownership.