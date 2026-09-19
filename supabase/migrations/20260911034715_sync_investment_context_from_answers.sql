create or replace function public.sync_investment_context_answer() returns trigger language plpgsql security definer set search_path = public as $$
declare v text;
begin
  if NEW.question_id not like 'CTX_%' then return NEW; end if;
  v := coalesce(NEW.answer_value->>'value', NEW.answer_value #>> '{}');
  insert into public.investment_context(assessment_id,goal,time_horizon,liquidity_need,required_return,loss_consequence,experience)
  values (
    NEW.assessment_id,
    case when NEW.question_id='CTX_GOAL' then v else 'other' end,
    case when NEW.question_id='CTX_HORIZON' then v else 'under_2' end,
    case when NEW.question_id='CTX_LIQUIDITY' then v else 'low' end,
    case when NEW.question_id='CTX_RETURN' then v else 'preserve' end,
    case when NEW.question_id='CTX_LOSS' then v else 'low_impact' end,
    case when NEW.question_id='CTX_EXPERIENCE' then v else 'beginner' end
  )
  on conflict (assessment_id) do update set
    goal = case when NEW.question_id='CTX_GOAL' then excluded.goal else investment_context.goal end,
    time_horizon = case when NEW.question_id='CTX_HORIZON' then excluded.time_horizon else investment_context.time_horizon end,
    liquidity_need = case when NEW.question_id='CTX_LIQUIDITY' then excluded.liquidity_need else investment_context.liquidity_need end,
    required_return = case when NEW.question_id='CTX_RETURN' then excluded.required_return else investment_context.required_return end,
    loss_consequence = case when NEW.question_id='CTX_LOSS' then excluded.loss_consequence else investment_context.loss_consequence end,
    experience = case when NEW.question_id='CTX_EXPERIENCE' then excluded.experience else investment_context.experience end,
    updated_at = now();
  return NEW;
end; $$;
drop trigger if exists trg_sync_investment_context_answer on public.answers;
create trigger trg_sync_investment_context_answer after insert or update of answer_value, question_id on public.answers for each row execute function public.sync_investment_context_answer();