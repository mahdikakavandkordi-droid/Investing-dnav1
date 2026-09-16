# Match v7 UX review — 2026-09-16

Status: implemented UX hardening for the pre-pilot Match surface.

This review looks at DNA Match from the user's point of view rather than changing the canonical scoring model. Match v7 / Goal Fit v1 remain unchanged.

## Main usability findings

### 1. The driver of the score was not visible enough

The page said a Match was context-aware, but a user could not immediately see the exact money context that was driving the comparison.

The Match surface now restates, before the ETF cards:

- primary goal;
- time horizon;
- access/liquidity need;
- principal-protection need.

The summary also links directly back to Context editing and explicitly says that changing these money-context answers does not change the underlying Investor DNA.

### 2. DNA-only needed stronger separation from a personalized Match

Before complete money context, the overall `/100` score is already redacted by the canonical backend contract. The browser now reinforces that boundary:

- `context_required` is shown as `DNA-only`;
- context-only ETF cards do not show the context-aware component-score block;
- `review_required` remains a distinct `Review` state;
- presentation state takes precedence over a numeric value if an inconsistent payload ever reaches the browser.

This is defense in depth: backend serialization is the primary control, browser presentation is the secondary guard.

### 3. Some card language sounded more like advice than research

The following wording was simplified:

- `Start with these` -> `Compare these more closely`;
- `Closest match` -> `Closest current fit`;
- `What conflicts` -> `What to watch`;
- `What would change this comparison?` -> `What could change the fit?`;
- `View Investment DNA` -> `Open ETF research`.

The goal is to keep the surface useful without implying a recommendation or requiring the user to understand internal product taxonomy.

### 4. Internal score labels were too technical

The four component labels are now presented as:

| Model field | Browser label |
| --- | --- |
| `official_risk_fit` | Risk level |
| `market_exposure_fit` | Equity exposure |
| `goal_role_fit` | Goal fit |
| `exposure_breadth` | Diversification |

The underlying values and Match formula are unchanged.

### 5. Repeated generic summaries added noise

Available ETF cards previously repeated a generic Match summary that did not explain why one ETF differed from another. Available cards now lead with the ETF-specific strengths, watchouts and component breakdown instead. Generic summary copy remains useful in context-limited or mismatch states where it explains why the ranking is incomplete or outside limits.

## Regression boundary

`tests/funds-flow.cjs` protects the connected browser flow and now checks that:

1. DNA-only Match has no numeric overall score and no context-aware component block;
2. valid Context transitions the same session to numeric Match v7;
3. the Match page visibly restates Major Purchase / >10 years / Low access need / no principal-protection requirement from the test fixture;
4. the four plain-language component labels are present;
5. `What to watch` and `What could change the fit?` are present;
6. the generic repeated summary is absent from available cards;
7. `Open ETF research` continues into the ETF Detail page;
8. the mobile flow remains free of horizontal overflow and runtime errors.

## Out of scope

This review does not validate whether the v7 weights are scientifically or regulatorily suitable. That remains separate from UX correctness and still requires pilot evidence plus formal Canadian compliance/privacy review.
