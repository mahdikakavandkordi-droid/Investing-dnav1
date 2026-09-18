alter table public.pilot_product_events add column visitor_id uuid null;
create index pilot_product_events_visitor_created_idx on public.pilot_product_events(visitor_id,created_at desc) where visitor_id is not null;
alter table public.pilot_feedback add column visitor_id uuid null;
create index pilot_feedback_visitor_idx on public.pilot_feedback(visitor_id) where visitor_id is not null;
