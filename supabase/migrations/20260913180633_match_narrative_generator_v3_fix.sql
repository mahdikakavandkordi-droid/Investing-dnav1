create or replace function public.generate_match_narratives(p_assessment_id uuid,p_language_code text default 'en',p_limit integer default 10)
returns integer language plpgsql security definer set search_path=public as $$
declare r record; n integer:=0; v_headline text; v_summary text; v_why text; v_watch text; v_equity numeric; v_rt numeric; v_rc numeric;
begin
 if p_limit<1 or p_limit>50 then raise exception 'limit must be 1..50'; end if;
 for r in select * from public.v_investment_match_explainable where assessment_id=p_assessment_id order by match_score desc,symbol limit p_limit loop
   v_rt:=coalesce((r.dna->>'risk_tolerance')::numeric,0); v_rc:=coalesce((r.dna->>'risk_capacity')::numeric,0); v_equity:=coalesce((r.investment->>'equity_pct')::numeric,0);
   if p_language_code='fa' then
     v_headline:=case when r.match_score>=85 then 'انتخاب بسیار هماهنگ با DNA سرمایه‌گذاری شما' when r.match_score>=70 then 'گزینه‌ای با تناسب بالا با DNA شما' else 'گزینه‌ای که نیاز به بررسی بیشتری دارد' end;
     v_summary:='این سرمایه‌گذاری با امتیاز '||round(r.match_score,1)||' از 100، از نظر ویژگی‌های ریسک و ترکیب دارایی با پروفایل شما '||case when r.match_score>=85 then 'هماهنگی بسیار بالایی' when r.match_score>=70 then 'هماهنگی خوبی' else 'هماهنگی محدودی' end||' دارد.';
     v_why:='تحمل ریسک شما '||round(v_rt,1)||' و ظرفیت ریسک شما '||round(v_rc,1)||' است و این گزینه حدود '||round(v_equity,0)||'% در معرض سهام قرار دارد؛ بنابراین ترکیب آن با سطح ریسک شما مقایسه شده است.';
     v_watch:=case when v_equity>=80 then 'به نوسان بازار و نیاز به افق زمانی بلندمدت توجه کنید.' when v_equity<=40 then 'بازده بالقوه پایین‌تر و حساسیت به نرخ بهره را در نظر بگیرید.' else 'تعادل میان رشد و ثبات را در کنار افق زمانی خود بررسی کنید.' end;
   else
     v_headline:=case when r.match_score>=85 then 'A strong fit for your Investor DNA' when r.match_score>=70 then 'A high-alignment option for your Investor DNA' else 'Worth a closer look before considering' end;
     v_summary:='With a '||round(r.match_score,1)||'/100 compatibility score, this investment '||case when r.match_score>=85 then 'shows strong alignment' when r.match_score>=70 then 'shows good alignment' else 'shows limited alignment' end||' with your risk profile and investment context.';
     v_why:='Your risk tolerance is '||round(v_rt,1)||' and risk capacity is '||round(v_rc,1)||'. This investment has approximately '||round(v_equity,0)||'% equity exposure, so its risk and allocation characteristics were compared with your DNA.';
     v_watch:=case when v_equity>=80 then 'Pay close attention to market volatility and the longer time horizon this level of equity exposure can require.' when v_equity<=40 then 'Consider the lower growth potential and interest-rate sensitivity alongside your objective.' else 'Consider whether this balance between growth and stability matches your time horizon and goals.' end;
   end if;
   insert into public.investment_match_narratives(assessment_id,investment_id,model_version,language_code,fit_headline,fit_summary,why_it_fits,what_to_watch,dna_snapshot,investment_snapshot) values(p_assessment_id,r.investment_id,'match-narrative-v3.0',p_language_code,v_headline,v_summary,v_why,v_watch,r.dna,r.investment)
   on conflict(assessment_id,investment_id,model_version,language_code) do update set fit_headline=excluded.fit_headline,fit_summary=excluded.fit_summary,why_it_fits=excluded.why_it_fits,what_to_watch=excluded.what_to_watch,dna_snapshot=excluded.dna_snapshot,investment_snapshot=excluded.investment_snapshot,updated_at=now();
   n:=n+1;
 end loop; return n;
end;$$;