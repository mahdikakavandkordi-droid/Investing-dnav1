"use client";
import {useEffect,useState} from 'react';
import {useRouter} from 'next/navigation';
import Link from 'next/link';
import {supabase,pilot,rpc} from '@/lib/supabase';
import {readDraft,writeEphemeralResult,Draft,MatchPayload,AppState,InvestmentContextProfile,DNA} from '@/lib/dna';

type ContextForm={first_name:string;age:string;amount_to_invest:string;goal:string;horizon_months:string;liquidity_need:string;principal_required:string;investment_share:string};
const blank:ContextForm={first_name:'',age:'',amount_to_invest:'',goal:'',horizon_months:'',liquidity_need:'',principal_required:'',investment_share:''};
function fromContext(c?:InvestmentContextProfile|null):ContextForm{return {...blank,...Object.fromEntries(Object.keys(blank).map(k=>[k,String(c?.[k as keyof InvestmentContextProfile]??'')]))};}
type ContextResponse={report?:{report:DNA};match?:MatchPayload};

export default function InvestmentContext(){
 const router=useRouter();
 const [draft,setDraft]=useState<Draft|null>(null),[assessmentId,setAssessmentId]=useState<string|null>(null),[account,setAccount]=useState(false),[form,setForm]=useState<ContextForm>(blank);
 const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>{let active=true;(async()=>{
   const {data:{session}}=await supabase.auth.getSession();
   const local=readDraft(session?.user.id||null);
   if(local?.result){if(active){setDraft(local);setAssessmentId(local.session.assessment_id);setAccount(!!session&&!!local.result.account_linked);setForm(fromContext(local.result.report?.report?.investment_context));}return;}
   if(session){const state=await rpc<AppState>('get_current_investor_app_state');if(active&&state.dna&&state.assessment_id){setAccount(true);setAssessmentId(state.assessment_id);setForm(fromContext(state.report?.investment_context));}}
 })().catch(e=>{if(active)setError(e.message)}).finally(()=>{if(active)setLoading(false)});return()=>{active=false};},[]);
 function update(key:keyof ContextForm,value:string){setForm(f=>({...f,[key]:value}));}
 async function save(e:React.FormEvent){
   e.preventDefault();if(!assessmentId||busy)return;setBusy(true);setError('');
   try{
     const context={...form,first_name:form.first_name.trim()||null,age:form.age?Number(form.age):null,amount_to_invest:form.amount_to_invest?Number(form.amount_to_invest):null,horizon_months:Number(form.horizon_months),investment_share:form.investment_share||null};
     const data=account?await rpc<ContextResponse>('app_save_investment_context',{p_assessment_id:assessmentId,p_context:context}):await pilot<ContextResponse>('save_context',{...draft!.session,context});
     if(draft?.result){const next={...draft,result:{...draft.result,report:data.report||draft.result.report,match:data.match||draft.result.match}};setDraft(next);writeEphemeralResult(next);}
     router.push('/dna/result');
   }catch(e){setError(e instanceof Error?e.message:'Unable to save context.');}finally{setBusy(false);}
 }
 if(loading)return <main className="context-page"><div className="container context-container"><h1>Loading your investment context…</h1></div></main>;
 if(!assessmentId)return <main className="context-page"><div className="container context-container"><div className="context-card"><h1>{error?'Unable to load your context':'Start with your Investor DNA'}</h1><p>{error||'Sign in to use your saved profile, or complete an assessment.'}</p><Link className="btn" href="/profile">Sign in</Link><Link className="btn primary" href="/dna/assessment">Take the assessment</Link></div></div></main>;
 return <main className="context-page"><div className="container context-container"><form className="context-card" onSubmit={save}>
   <div className="eyebrow">Investment context</div><h1>Tell us what this money is for.</h1><p className="context-lede">These answers apply to this pool of money. They do not change your psychological risk tolerance.</p>
   <div className="context-fields">
     <label className="context-field"><span>Primary goal</span><select required value={form.goal} onChange={e=>update('goal',e.target.value)}><option value="">Choose a goal</option><option value="growth">Long-term growth</option><option value="retirement">Retirement</option><option value="house_purchase">Home purchase</option><option value="education">Education</option><option value="income">Regular investment income</option><option value="preservation">Long-term capital preservation</option><option value="emergency_reserve">Emergency reserve</option></select></label>
     <label className="context-field"><span>How many months until you might first need this money?</span><input required type="number" min="0" max="1200" step="1" value={form.horizon_months} onChange={e=>update('horizon_months',e.target.value)} placeholder="For example, 60 for five years"/><small>Use the earliest realistic withdrawal. Enter 0 if you may need it now.</small></label>
     <label className="context-field"><span>How important is being able to sell quickly?</span><select required value={form.liquidity_need} onChange={e=>update('liquidity_need',e.target.value)}><option value="">Choose an access need</option><option value="high">High — access on short notice</option><option value="medium">Medium — some access matters</option><option value="low">Low — I can leave it invested</option></select></label>
     <label className="context-field"><span>Would a loss in value prevent you from meeting that need?</span><select required value={form.principal_required} onChange={e=>update('principal_required',e.target.value)}><option value="">Choose an answer</option><option value="yes">Yes — I need the money without a loss</option><option value="unsure">Possibly / I am not sure</option><option value="no">No — I can absorb a loss on this money</option></select><small>Being able to sell quickly does not guarantee the amount you receive.</small></label>
     <label className="context-field"><span>Share of your household’s investable financial assets (optional)</span><select value={form.investment_share} onChange={e=>update('investment_share',e.target.value)}><option value="">Not provided</option><option value="under_10">Less than 10%</option><option value="10_25">10% to less than 25%</option><option value="25_50">25% to 50%</option><option value="over_50">More than 50%</option><option value="unsure">Not sure</option></select></label>
   </div>
   <div className="context-optional"><h2>Optional personalization</h2><p>These details do not change your risk-tolerance score.</p><div className="context-fields optional-fields">
     <label className="context-field"><span>First name</span><input minLength={2} maxLength={40} value={form.first_name} onChange={e=>update('first_name',e.target.value)} placeholder="Optional"/></label>
     <label className="context-field"><span>Age</span><input type="number" min="18" max="100" value={form.age} onChange={e=>update('age',e.target.value)} placeholder="Optional"/></label>
     <label className="context-field"><span>Amount considered (CAD)</span><input type="number" min="0" step="0.01" value={form.amount_to_invest} onChange={e=>update('amount_to_invest',e.target.value)} placeholder="Optional"/></label>
   </div></div>
   {error&&<p role="alert" className="notice">{error}</p>}
   <div className="context-actions"><button className="btn primary" disabled={busy}>{busy?'Saving…':'Use this context'}</button><Link className="btn" href="/dna/result">Back to my DNA</Link></div>
 </form></div></main>;
}
