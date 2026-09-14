"use client";
import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import Link from "next/link";
import {supabase,pilot} from "@/lib/supabase";
import {readDraft,writeDraft,Draft} from "@/lib/dna";

type ContextForm={
  first_name:string;
  age:string;
  amount_to_invest:string;
  goal:string;
  time_horizon:string;
  liquidity_need:string;
};

const initial:ContextForm={
  first_name:'',age:'',amount_to_invest:'',goal:'growth',time_horizon:'5_10y',liquidity_need:'low'
};

export default function InvestmentContext(){
  const router=useRouter();
  const [draft,setDraft]=useState<Draft|null>(null),[form,setForm]=useState<ContextForm>(initial);
  const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState('');

  useEffect(()=>{let active=true;(async()=>{
    const session=supabase?(await supabase.auth.getSession()).data.session:null;
    const local=readDraft(session?.user.id||null);
    if(active)setDraft(local);
  })().catch(e=>{if(active)setError(e.message)}).finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[]);

  function update<K extends keyof ContextForm>(key:K,value:ContextForm[K]){setForm(v=>({...v,[key]:value}));}

  async function save(){
    if(!draft?.session?.assessment_id)return;
    setBusy(true);setError('');
    try{
      const context={
        first_name:form.first_name.trim()||null,
        age:form.age?Number(form.age):null,
        amount_to_invest:form.amount_to_invest?Number(form.amount_to_invest):null,
        goal:form.goal,
        time_horizon:form.time_horizon,
        liquidity_need:form.liquidity_need,
      };
      const data=await pilot<any>('save_context',{...draft.session,context});
      const next:Draft={...draft,result:draft.result?{...draft.result,report:data.report||draft.result.report}:draft.result};
      setDraft(next);writeDraft(next);router.push('/dna/result');
    }catch(e){setError(e instanceof Error?e.message:'Unable to save investment context.');}
    finally{setBusy(false);}
  }

  if(loading)return <section className="section"><div className="container narrow"><div className="card"><h1>Loading…</h1></div></div></section>;
  if(!draft?.result)return <section className="section"><div className="container narrow"><div className="card"><h1>Complete your Investor DNA first.</h1><Link className="btn primary" href="/dna/assessment">Start assessment</Link></div></div></section>;

  return <section className="section"><div className="container narrow"><div className="card">
    <div className="eyebrow">Investment context</div>
    <h1>Tell us what this money is for.</h1>
    <p>Your DNA describes you. These details describe this investment decision, so they stay separate from your risk-tolerance score.</p>

    <label>Primary goal<select value={form.goal} onChange={e=>update('goal',e.target.value)}>
      <option value="growth">General long-term growth</option>
      <option value="retirement">Retirement</option>
      <option value="house_purchase">Home purchase</option>
      <option value="education">Education</option>
      <option value="income">Regular investment income</option>
      <option value="preservation">Emergency reserve / preserve capital</option>
    </select></label>

    <label>When might you need this money?<select value={form.time_horizon} onChange={e=>update('time_horizon',e.target.value)}>
      <option value="under_2">Under 2 years</option>
      <option value="1_3y">1–3 years</option>
      <option value="3_5y">3–5 years</option>
      <option value="5_10y">5–10 years</option>
      <option value="gt_10y">More than 10 years</option>
    </select></label>

    <label>How important is it that this money stays easy to access?<select value={form.liquidity_need} onChange={e=>update('liquidity_need',e.target.value)}>
      <option value="high">High — I may need access on short notice</option>
      <option value="medium">Medium — some access matters</option>
      <option value="low">Low — I can leave it invested</option>
    </select></label>

    <h2>Optional personalization</h2>
    <p className="muted">These fields do not change your Investor DNA score.</p>
    <label>First name<input value={form.first_name} onChange={e=>update('first_name',e.target.value)} placeholder="Optional"/></label>
    <label>Age<input type="number" min="18" max="100" value={form.age} onChange={e=>update('age',e.target.value)} placeholder="Optional"/></label>
    <label>Amount you are considering investing (CAD)<input type="number" min="0" value={form.amount_to_invest} onChange={e=>update('amount_to_invest',e.target.value)} placeholder="Optional"/></label>

    {error&&<p role="alert" className="notice">{error}</p>}
    <div className="actions"><button className="btn primary" disabled={busy} onClick={save}>{busy?'Saving…':'Save context'}</button><Link className="btn" href="/dna/result">Skip for now</Link></div>
    <p className="muted fine">Context improves compatibility signals; it does not turn them into investment advice.</p>
  </div></div></section>;
}
