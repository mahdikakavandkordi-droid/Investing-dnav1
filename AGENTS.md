<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Investor DNA repository rules

Before non-trivial work, read:

1. `README.md`
2. `docs/ARCHITECTURE.md`
3. `docs/ENGINEERING-GUIDE.md`
4. the README inside the folder being changed
5. `CONTINUE-HERE.md` for current blockers only

Repository-specific invariants:

- Platform = **Investor DNA**; assessment = **Investing DNA**; investment structural profile = **Investment DNA**; compatibility = **DNA Match**.
- Do not duplicate asset taxonomy outside `lib/instrument-model.ts`.
- Generic cross-asset research belongs in `lib/instruments.ts`; ETF/fund-specific research belongs in `lib/investments.ts`.
- Pages orchestrate; domain rules belong in `lib/` or the backend.
- Browser code must not calculate canonical DNA/Match scores or decide account ownership.
- Missing financial data remains `null`/unavailable, never fake zero.
- Never manufacture a current as-of date.
- Supabase migrations are append-only after application.
- Do not claim a migration/deployment/test/pilot/compliance result unless it was actually verified.
- Architecture/API/schema/test-gate changes require documentation updates in the same change.
- PR #2 is intentionally draft; do not merge it without explicit instruction.

For backend and verification details see `docs/DATABASE-AND-API.md` and `docs/TESTING.md`.