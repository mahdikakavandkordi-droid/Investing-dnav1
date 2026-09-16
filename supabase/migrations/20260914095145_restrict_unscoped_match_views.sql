-- These internal views contain results for all assessments, including guests.
-- Expose account-specific results through the auth.uid()-scoped RPCs instead.
revoke all on public.v_investment_match_ranked,
 public.v_investment_match,
 public.v_investment_match_intelligence,
 public.v_investment_match_explainable,
 public.v_investment_match_narrative,
 public.v_portfolio_intelligence,
 public.v_portfolio_risk_analysis
from public, anon, authenticated;
