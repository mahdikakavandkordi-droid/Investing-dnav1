"use client";
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {pilot,rpc} from '@/lib/supabase';
import {readClaimTicket,type AppState} from '@/lib/dna';
import {useAccount} from '@/lib/use-account';

type Score=1|2|3|4|5;
function Scale({legend,value,onChange}:{legend:string;value:Score|null;onChange:(x:Score)=>void}){return <fieldset className="card"><legend><strong>{legend}</strong></legend><div className="mode-tabs" role="radiogroup" aria-label={legend}>{([1,2,3,4,5] as Score[]).map(x=><button key={x} type="button" className="btn" aria-pressed={value===x} onClick={()=>onChange(x)}>{x}</button>)}</div><p className="fine muted">1 = low · 5 = high</p></fieldset>}
export default function Feedback(){
 const {user}=useAccount();const [assessmentId,setAssessmentId]=useState<string|null>(null);const [ease,setEase]=useState<Score|null>(null),[trust,setTrust]=useState<Score|null>(null),[useful,setUseful]=useState<Score|null>(null),[understood,setUnderstood]=useState<boolean|null>(null),[returnAgain,setReturnAgain]=useState<boolean|null>(null),[text,setText]=useState(''),[busy,setBusy]=useState(false),[saved,setSaved]=useState(false),[error,setError]=useState('');
 useEffect(()=>{const claim=readClaimTicket();if(claim?.session.assessment_id)setAssessmentId(claim.session.assessment_id);if(user)rpc<AppState>('get_current_investor_app_state').then(x=>{if(x?.assessment_id)setAssessmentId(x.assessment_id)}).catch(()=>{})},[user?.id]);
 async function submit(e:React.FormEvent){e.preventDefault();if(!ease||!trust||!useful||understood===null||returnAgain===null)return;setBusy(true);setError('');try{await pilot('submit_feedback',{assessment_id:assessmentId,ease_score:ease,trust_score:trust,usefulness_score:useful,understood_match:understood,would_return:returnAgain,open_feedback:text});setSaved(true)}catch(e){setError(e instanceof Error?e.message:'Could not save feedback.')}finally{setBusy(false)}}
 if(saved)return <section className="section"><div className="container narrow"><div className="card"><div className="eyebrow">Pilot feedback saved</div><h1>Thank you — this is exactly what we need for the pilot.</h1><p>Your response will be analyzed in aggregate with product funnel data. It does not change your DNA or Match result.</p><div className="actions"><Link className="btn primary" href="/profile">Back to my profile</Link><Link className="btn" href="/match">Open my matches</Link></div></div></div></section>;
 return <section className="section"><div className="container narrow"><div className="eyebrow">Investing DNA pilot</div><h1>Tell us what felt clear — and what did not</h1><p className="muted">This takes about a minute. We use it to improve comprehension and product value, not to change your score.</p><form onSubmit={submit} className="auth-form">
  <Scale legend="How easy was the experience to use?" value={ease} onChange={setEase}/>
  <Scale legend="How much did you trust the way the result was explained?" value={trust} onChange={setTrust}/>
  <Scale legend="How useful was the result for understanding investments?" value={useful} onChange={setUseful}/>
  <fieldset className="card"><legend><strong>Did you understand why a fund did or did not fit your DNA?</strong></legend><div className="mode-tabs"><button type="button" className="btn" aria-pressed={understood===true} onClick={()=>setUnderstood(true)}>Yes</button><button type="button" className="btn" aria-pressed={understood===false} onClick={()=>setUnderstood(false)}>Not really</button></div></fieldset>
  <fieldset className="card"><legend><strong>Would you come back to Investing DNA to research or compare another investment?</strong></legend><div className="mode-tabs"><button type="button" className="btn" aria-pressed={returnAgain===true} onClick={()=>setReturnAgain(true)}>Yes</button><button type="button" className="btn" aria-pressed={returnAgain===false} onClick={()=>setReturnAgain(false)}>Probably not</button></div></fieldset>
  <label>What was confusing or missing? <span className="fine muted">Optional</span><textarea className="field" rows={5} maxLength={1500} value={text} onChange={e=>setText(e.target.value)} placeholder="Tell us the one thing you would change…"/></label>
  <button className="btn primary" disabled={busy||!ease||!trust||!useful||understood===null||returnAgain===null}>{busy?'Saving…':'Send pilot feedback'}</button>
  {error&&<p className="notice" role="alert">{error}</p>}
 </form></div></section>;
}
