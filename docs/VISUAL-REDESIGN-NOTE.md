# Visual redesign implementation note

This branch applies the approved presentation redesign to the existing V1 product surfaces without changing canonical Investor DNA scoring, Match logic, account ownership, or research APIs.

Included in this pass:

- brand lockup and global navigation presentation;
- DNA-first landing page with Explore retained as a primary research path;
- questionnaire presentation with a quiet progress-linked DNA journey visual;
- Explore catalog, Compare, Watchlist, and investment-detail presentation;
- asset-aware detail facts and reduced repeated missing-data placeholders;
- ETF allocation hierarchy that separates overall allocation from child breakdowns;
- `/dna/result` report redesign with an editorial archetype hero, compact personal/context summary, Investor DNA matrix, plain-language interpretation, and the existing deeper decision fingerprint retained below the summary fold;
- display-only aliases for the three high-risk archetypes: HOTSHOT → CHARGER, HIGHROLLER → PATHFINDER, and JACKPOT → VANGUARD. Canonical backend keys remain unchanged.

Intentionally unchanged:

- canonical questionnaire/scoring logic, Match logic, ownership, migrations, and Supabase contracts;
- the report's deeper content model. The new shell uses existing server-supported narrative, risk, behavioral, and investment-context fields so copy can be expanded later without changing the visual structure;
- the persistent research-stage Footer/disclosure.
