# Investing DNA — M4 Canadian Compliance Review Brief

**Purpose:** prepare a focused legal/compliance review before broader public launch. This document is an internal review brief, not legal advice or a conclusion about registration status.

## Why this is a launch gate

Canadian Securities Administrators state that persons or firms in the business of advising clients on securities generally must be registered unless an exemption applies. CSA's current finfluencer guidance also describes investment “advice” broadly enough to include opinions about the merits of investing in a security or recommendations about an investment.

Investing DNA therefore should not assume that adding a disclaimer such as “not investment advice” decides the regulatory analysis. The actual product behavior, personalization, business model and user expectations matter.

Official references reviewed at M4 start:

- CSA — Registration Information: https://www.securities-administrators.ca/industry-resources/registration-information/
- CSA — Finfluencers: https://www.securities-administrators.ca/investor-tools/finfluencers/
- CIRO — Online Advice Project: https://www.ciro.ca/rules-and-enforcement/dealer-member-rules/access-advice/online-advice-project
- CIRO — Order Execution Only Project: https://www.ciro.ca/rules-and-enforcement/dealer-member-rules/access-advice/order-execution-only-project

## Current product facts to give counsel

- The assessment produces an Investor DNA profile from risk tolerance, behavior, financial capacity and experience questions.
- Match uses the user's DNA plus investment context to calculate compatibility with specific ETFs/funds in the research universe.
- Match can return `review_required`, `context_required`, `no_suitable_options` or `available`.
- The product can show named ETFs with compatibility scores and explain fit/conflicts.
- Current copy says compatibility is not investment quality, an expected-return forecast or a recommendation to buy.
- The platform does not execute trades or hold client assets.
- Registration is optional for the user; an account preserves DNA, watchlists and continuity.
- The product is currently positioned as a research-stage educational compatibility tool.

## Questions for legal/compliance review

1. Does displaying personalized compatibility with named securities constitute advising activity under applicable Canadian securities laws in the intended business model?
2. Does the answer change if the platform shows only compatibility/explainability and never uses “buy”, “sell”, “recommended” or model-portfolio language?
3. Which product behaviors would materially increase registration risk: ranking, “closest match” labels, personalized notifications, portfolio construction, rebalancing, or transaction links?
4. Is there a defensible educational/research configuration that may operate without adviser registration, and what exact guardrails/copy are required?
5. Does the proposed revenue model affect the “business trigger” analysis?
6. Which province should be treated as principal regulator at launch and what passport/registration implications follow for Canada-wide users?
7. What privacy policy, consent and retention language is required for assessment answers, account-linked financial context, analytics and pilot feedback?
8. Are additional disclosures needed for historical performance, data freshness, third-party data and fund risk classifications?
9. What recordkeeping/auditability should be preserved for Match versions and user-facing explanations?
10. Before any future Portfolio Builder, what additional suitability/KYC/KYP or registration obligations would be triggered?

## Product guardrails pending review

Until reviewed, M4 keeps these guardrails:

- no trade execution,
- no guaranteed-return language,
- no expected-return prediction from Match,
- no “best investment” language,
- no forced recommendation when safety/context gates fail,
- explicit no-suitable-option state,
- facts shown separately from compatibility,
- partial/missing fund data disclosed,
- Portfolio Builder frozen,
- broader public advice positioning frozen.

## Decision requirement

M4 cannot close with an unrestricted-public-launch **GO** solely because engineering and user metrics are positive. A documented legal/compliance review of the actual product behavior is a separate launch gate.
