-- Retire the frozen Portfolio Builder runtime from the live M4 engine.
--
-- Historical migrations and existing blueprint rows remain for reproducibility,
-- but no current browser/account/assessment flow should execute this engine.

-- Service-only views/functions had no remaining live callers after the M4
-- portfolio freeze. Remove them rather than leaving a parallel runtime path.
drop view if exists public.v_portfolio_intelligence;
drop view if exists public.v_portfolio_risk_analysis;

drop function if exists public.refresh_blueprint_risk_and_match(uuid);
drop function if exists public.calculate_portfolio_risk_overlap(uuid);
drop function if exists public.generate_portfolio_blueprints(uuid);

-- This table was empty and existed only for the retired overlap engine.
drop table if exists public.portfolio_risk_analysis;

-- Keep historical blueprint rows, but make the table service-only so it cannot
-- accidentally become a browser-facing product surface again.
revoke all privileges on table public.investment_portfolio_blueprints from public, anon, authenticated;
grant select, insert, update, delete on table public.investment_portfolio_blueprints to service_role;

comment on table public.investment_portfolio_blueprints is
'Historical pre-M4 portfolio-builder output retained for reproducibility only. No current product/runtime path should read or write this table.';
