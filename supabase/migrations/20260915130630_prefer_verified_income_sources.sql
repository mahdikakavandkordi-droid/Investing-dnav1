create or replace view public.v_investment_latest_income as
select distinct on (h.investment_id) h.investment_id,i.symbol,h.as_of_date,h.trailing_yield_pct,h.distribution_yield_pct,h.distribution_frequency,h.last_distribution_per_unit,h.source_id,s.source_name,s.source_url,h.source_note
from public.investment_income_history h join public.investments i on i.id=h.investment_id left join public.investment_data_sources s on s.id=h.source_id
order by h.investment_id,(h.source_id is not null) desc,h.as_of_date desc,h.created_at desc;
grant select on public.v_investment_latest_income to anon,authenticated;