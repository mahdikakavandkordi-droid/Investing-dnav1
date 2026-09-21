# Investment card clarity

Catalog cards prioritize discovery facts: ETF risk, annual MER and past one-year return; mutual-fund risk, annual MER and minimum investment, with series beside the name. Price/NAV remain on the detail page. Fund metric dates no longer use the separate price-refresh date.

GIC cards show one term's annual rate, access conditions and minimum together. Prefer an explicitly featured option; otherwise choose the shortest term, with option key as a stable tie-breaker. Do not select by highest rate. Missing rates stay unavailable, and other terms are announced when present. The separate range formatter now says other rates are unavailable instead of claiming they are live.

The GIC protection summary is in the non-fund detail branch. Fund structure interpretations and the eight non-fund structure traits are collapsed behind an explanatory disclosure; official fund risk remains visible within the profile section. Existing visual classes and scoring logic are unchanged.

Verification: production build, client contracts (including term/rate pairing and missing-rate handling), type/no-unused checks and repository hygiene. Browser selectors were updated for the new Details links; browser execution and visual verification remain pending.
