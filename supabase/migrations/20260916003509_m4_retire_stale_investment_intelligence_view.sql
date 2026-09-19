-- Retire the legacy aggregate intelligence view after dependency audit.
--
-- v_investment_intelligence had no live function/view consumers and remained
-- pinned to intelligence-v1.0 after the product moved to the v1.1 / Investment
-- DNA v2 research path. Historical migrations retain its original definition.
-- Current ETF Investment DNA is exposed through v_investment_dna_v2 and the
-- narrow app_get_investment_dna RPC.

drop view if exists public.v_investment_intelligence;
