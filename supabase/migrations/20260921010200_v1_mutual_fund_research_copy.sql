update public.investments
set description=strategy,updated_at=now()
where asset_type='MUTUAL_FUND'
  and strategy is not null
  and description=display_name;
