create or replace function public.get_watchlist(p_profile_id uuid)
returns jsonb
language sql
security definer
set search_path to 'public','extensions'
as $$
  select jsonb_build_object(
    'watchlist',coalesce((select to_jsonb(w) from public.watchlists w where w.profile_id=p_profile_id order by w.created_at asc limit 1),'{}'::jsonb),
    'items',coalesce((select jsonb_agg(to_jsonb(x) order by x.created_at desc) from (
      select wi.id,wi.watchlist_id,wi.investment_id,wi.note,wi.created_at,
             i.symbol,i.name,i.display_name,i.asset_type,i.category,
             d.price,d.return_1y_pct,d.mer_pct,d.yield_pct,
             r.risk_level,r.volatility_1y_pct,r.max_drawdown_1y_pct,
             q.quality_score,q.overall_status
      from public.watchlist_items wi
      join public.watchlists w on w.id=wi.watchlist_id
      join public.investments i on i.id=wi.investment_id
      left join lateral(select * from public.investment_metrics m where m.investment_id=i.id order by m.as_of_date desc limit 1)d on true
      left join lateral(select * from public.investment_risk_metrics rr where rr.investment_id=i.id order by rr.as_of_date desc limit 1)r on true
      left join lateral(select * from public.investment_data_quality qq where qq.investment_id=i.id order by qq.checked_at desc limit 1)q on true
      where w.profile_id=p_profile_id
    )x),'[]'::jsonb)
  );
$$;