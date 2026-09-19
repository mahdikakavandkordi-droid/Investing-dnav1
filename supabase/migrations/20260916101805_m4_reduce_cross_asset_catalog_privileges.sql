-- M4: the generic cross-asset research catalog is a read-only browser surface.
-- Public browser access is through app_* RPCs; keep only SELECT on the view.

revoke all on public.v_instrument_research_catalog from anon, authenticated;
grant select on public.v_instrument_research_catalog to anon, authenticated;
