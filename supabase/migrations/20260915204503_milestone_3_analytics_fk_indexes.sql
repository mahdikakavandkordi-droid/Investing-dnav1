create index pilot_product_events_profile_idx on public.pilot_product_events(profile_id) where profile_id is not null;
create index pilot_product_events_investment_idx on public.pilot_product_events(investment_id) where investment_id is not null;
create index pilot_feedback_user_idx on public.pilot_feedback(user_id) where user_id is not null;
create index pilot_feedback_assessment_idx on public.pilot_feedback(assessment_id) where assessment_id is not null;
