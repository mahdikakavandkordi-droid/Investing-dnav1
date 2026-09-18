-- M4: keep the five remaining core read-model views browser-readable only.
--
-- These views are still SECURITY DEFINER pending deliberate boundary redesign,
-- but the browser does not need INSERT/UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER
-- privileges on them. Preserve service-role privileges and narrow anon/auth to
-- SELECT only.

revoke all on
  public.v_investment_catalog,
  public.v_investment_detail,
  public.v_investment_screener,
  public.v_investment_dna_v2,
  public.v_investment_latest_income
from anon, authenticated;

grant select on
  public.v_investment_catalog,
  public.v_investment_detail,
  public.v_investment_screener,
  public.v_investment_dna_v2,
  public.v_investment_latest_income
to anon, authenticated;
