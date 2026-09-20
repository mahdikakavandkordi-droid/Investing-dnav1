create index if not exists report_delivery_events_user_id_idx
  on public.report_delivery_events(user_id)
  where user_id is not null;
