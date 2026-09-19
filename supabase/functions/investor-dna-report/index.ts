import {createClient} from '@supabase/supabase-js';
import {PDFDocument,StandardFonts,rgb} from 'pdf-lib';
import {buildPortfolioBlueprint} from './portfolio-blueprint.ts';

const headers={
  'Content-Type':'application/json',
  'Access-Control-Allow-Origin':'*',
  'Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type',
};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers});
const UUID_RE=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL_RE=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function sha256(value:string){
  const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));
  return Array.from(new Uint8Array(hash)).map(b=>b.toString(16).padStart(2,'0')).join('');
}
function bytesToBase64(bytes:Uint8Array){
  let out='';
  const size=0x8000;
  for(let i=0;i<bytes.length;i+=size)out+=String.fromCharCode(...bytes.subarray(i,i+size));
  return btoa(out);
}
function cleanEmail(value:unknown){
  if(typeof value!=='string')return null;
  const email=value.trim().toLowerCase();
  return email.length<=254&&EMAIL_RE.test(email)?email:null;
}
function labelGoal(value:unknown){
  const map:Record<string,string>={
    growth:'General long-term growth',retirement:'Retirement',house_purchase:'Home purchase',
    major_purchase:'Major purchase',education:'Education',income:'Regular investment income',
    wealth_preservation:'Wealth preservation',preservation:'Wealth preservation',
    emergency_reserve:'Emergency reserve / near-term protection'
  };
  return typeof value==='string'?(map[value]||value.replaceAll('_',' ')):'Not provided';
}
function labelHorizon(value:unknown){
  const map:Record<string,string>={lt_1y:'Less than 1 year','1_3y':'1–3 years','3_5y':'3–5 years','5_10y':'5–10 years',gt_10y:'More than 10 years'};
  return typeof value==='string'?(map[value]||value.replaceAll('_',' ')):'Not provided';
}
function labelLiquidity(value:unknown){
  if(value==='high')return 'High — access may be needed on short notice';
  if(value==='medium')return 'Medium — some access matters';
  if(value==='low')return 'Low — money can remain invested';
  return 'Not provided';
}
function labelPrincipal(value:unknown){
  if(value==='yes')return 'Full amount must be protected when needed';
  if(value==='no')return 'Full principal protection is not required';
  if(value==='unsure')return 'Not sure';
  return 'Not provided';
}
function safeText(value:unknown,fallback='Not available'){
  if(typeof value==='string'&&value.trim())return value.trim().replace(/[\u0000-\u001f]+/g,' ').slice(0,1200);
  return fallback;
}
function safeScore(value:unknown){
  const n=Number(value);
  return Number.isFinite(n)?Math.max(0,Math.min(100,Math.round(n))):null;
}

async function authorizeAssessment(admin:any,authUser:any,assessmentId:string,sessionToken:unknown){
  const {data:assessment,error}=await admin.from('assessments')
    .select('id,profile_id,pilot_participant_id,status')
    .eq('id',assessmentId).single();
  if(error||!assessment)return {error:'Assessment not found',status:404} as const;
  if(assessment.status!=='completed')return {error:'Complete the assessment before exporting the report.',status:409} as const;

  if(assessment.profile_id){
    if(!authUser?.id)return {error:'Sign in to export this saved report.',status:401} as const;
    const {data:owner}=await admin.from('profiles').select('user_id').eq('id',assessment.profile_id).single();
    if(owner?.user_id!==authUser.id)return {error:'This report is not owned by the signed-in account.',status:403} as const;
    return {assessment} as const;
  }

  if(typeof sessionToken!=='string'||sessionToken.length<20||sessionToken.length>200){
    return {error:'Guest report capability is required.',status:401} as const;
  }
  const tokenHash=await sha256(sessionToken);
  const {data:participant}=await admin.from('pilot_participants')
    .select('id').eq('id',assessment.pilot_participant_id)
    .eq('session_token_hash',tokenHash).is('withdrawn_at',null).maybeSingle();
  if(!participant)return {error:'Guest report capability is invalid or expired.',status:401} as const;
  return {assessment} as const;
}

async function loadReport(admin:any,assessmentId:string){
  const {data:snapshot}=await admin.from('report_snapshots')
    .select('report,generated_at').eq('assessment_id',assessmentId)
    .order('generated_at',{ascending:false}).limit(1).maybeSingle();
  if(snapshot?.report)return snapshot.report as Record<string,any>;

  const {data:result}=await admin.from('results')
    .select('risk_tolerance,risk_capacity,archetype,behavioral_profile,narrative,experience_profile,quality_profile,model_version,created_at')
    .eq('assessment_id',assessmentId).order('created_at',{ascending:false}).limit(1).maybeSingle();
  if(!result)throw new Error('Completed report data is unavailable.');
  return result as Record<string,any>;
}

async function buildPdf(report:Record<string,any>,assessmentId:string){
  const pdf=await PDFDocument.create();
  const regular=await pdf.embedFont(StandardFonts.Helvetica);
  const bold=await pdf.embedFont(StandardFonts.HelveticaBold);
  const ink=rgb(23/255,54/255,75/255);
  const teal=rgb(11/255,143/255,132/255);
  const muted=rgb(104/255,122/255,134/255);
  const line=rgb(224/255,232/255,233/255);
  const pale=rgb(248/255,252/255,251/255);
  const pageWidth=612,pageHeight=792,margin=54,maxWidth=pageWidth-margin*2;
  let page=pdf.addPage([pageWidth,pageHeight]);
  let y=pageHeight-58;

  const addPage=()=>{
    page=pdf.addPage([pageWidth,pageHeight]);
    y=pageHeight-52;
    page.drawText('Investor DNA',{x:margin,y,font:bold,size:11,color:teal});
    page.drawLine({start:{x:margin,y:y-10},end:{x:pageWidth-margin,y:y-10},thickness:1,color:line});
    y-=30;
  };
  const ensure=(height:number)=>{if(y-height<58)addPage();};
  const wrap=(text:string,fontRef:any,size:number,width:number)=>{
    const words=text.split(/\s+/).filter(Boolean);
    const rows:string[]=[];let row='';
    for(const word of words){
      const candidate=row?row+' '+word:word;
      if(fontRef.widthOfTextAtSize(candidate,size)<=width){row=candidate;continue;}
      if(row)rows.push(row);
      row=word;
    }
    if(row)rows.push(row);
    return rows.length?rows:[''];
  };
  const paragraph=(text:string,size=10,color=muted,width=maxWidth,gap=5)=>{
    const rows=wrap(safeText(text,''),regular,size,width);
    ensure(rows.length*(size+4)+gap);
    for(const row of rows){page.drawText(row,{x:margin,y,font:regular,size,color});y-=size+4;}
    y-=gap;
  };
  const heading=(text:string)=>{
    ensure(34);page.drawText(text,{x:margin,y,font:bold,size:16,color:ink});y-=25;
  };
  const pair=(label:string,value:string)=>{
    ensure(22);page.drawText(label,{x:margin,y,font:regular,size:9,color:muted});
    page.drawText(value,{x:margin+180,y,font:bold,size:10,color:ink});y-=18;
  };
  const rule=()=>{ensure(16);page.drawLine({start:{x:margin,y},end:{x:pageWidth-margin,y},thickness:1,color:line});y-=18;};

  page.drawRectangle({x:0,y:pageHeight-160,width:pageWidth,height:160,color:pale});
  page.drawText('INVESTOR DNA',{x:margin,y,font:bold,size:11,color:teal});y-=28;
  page.drawText('Your Investor DNA Report',{x:margin,y,font:bold,size:27,color:ink});y-=27;
  const archetype=safeText(report.archetype,'Investor DNA');
  page.drawText(archetype,{x:margin,y,font:bold,size:18,color:teal});y-=24;
  const summary=safeText(report.narrative?.summary,'Your report combines risk tolerance, financial capacity and decision patterns.');
  paragraph(summary,10,muted,maxWidth,13);

  heading('Personal profile');
  const tolerance=safeScore(report.risk_tolerance),capacity=safeScore(report.risk_capacity);
  pair('Risk tolerance',tolerance==null?'Not scored':tolerance+'/100');
  pair('Financial capacity',capacity==null?'Not scored':capacity+'/100');
  pair('Decision style',safeText(report.decision_style||report.narrative?.how_you_think));
  pair('Pressure style',safeText(report.pressure_style||report.narrative?.pressure_style));
  rule();

  heading('Decision profile');
  paragraph('Strength: '+safeText(report.narrative?.strength||report.strengths));
  paragraph('Worth watching: '+safeText(report.narrative?.blind_spot||report.watchouts));
  rule();

  const context=(report.investment_context&&typeof report.investment_context==='object')?report.investment_context:null;
  heading('Goal profile');
  if(context){
    pair('Goal',labelGoal(context.goal));
    pair('Time horizon',labelHorizon(context.time_horizon));
    pair('Liquidity need',labelLiquidity(context.liquidity_need));
    pair('Principal protection',labelPrincipal(context.principal_required));
    if(context.amount_to_invest!=null&&Number.isFinite(Number(context.amount_to_invest))){
      pair('Amount considered','CAD '+Math.round(Number(context.amount_to_invest)).toLocaleString('en-CA'));
    }
  }else{
    paragraph('No complete investment-goal context is attached to this report yet.');
  }
  rule();

  heading('Portfolio Blueprint');
  const blueprint=buildPortfolioBlueprint(
    {risk_tolerance:tolerance??undefined,risk_capacity:capacity??undefined},
    context||undefined
  );
  if(blueprint){
    for(const scenario of blueprint.scenarios){
      ensure(44);
      page.drawText(scenario.title,{x:margin,y,font:bold,size:11,color:scenario.key==='core'?teal:ink});
      const a=scenario.allocation;
      page.drawText(`${a.equity}% Equity   ·   ${a.fixedIncome}% Fixed income   ·   ${a.cash}% Cash`,{x:margin+145,y,font:regular,size:9,color:ink});
      y-=17;
      paragraph(scenario.subtitle,8,muted,maxWidth,5);
      if(scenario.constraintNote)paragraph(scenario.constraintNote,8,muted,maxWidth,5);
    }
    ensure(20);
    page.drawText('Why the Core Blueprint lands here',{x:margin,y,font:bold,size:10,color:ink});y-=16;
    for(const reason of blueprint.reasons)paragraph('• '+reason,8,muted,maxWidth,3);
  }else{
    paragraph('Add a complete goal, time horizon, liquidity need and principal-protection choice to generate the educational asset-class blueprint.');
  }

  ensure(80);
  rule();
  page.drawText('Important',{x:margin,y,font:bold,size:9,color:teal});y-=15;
  paragraph('Educational research report only. Investor DNA and the Portfolio Blueprint do not constitute investment advice, do not select securities, and do not guarantee future outcomes. Fixed income can lose value and cash can lose purchasing power.',8,muted,maxWidth,3);
  page.drawText('Report reference: '+assessmentId.slice(0,8).toUpperCase(),{x:margin,y:32,font:regular,size:7,color:muted});

  const bytes=await pdf.save();
  return new Uint8Array(bytes);
}

Deno.serve(async(req)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers});
  if(req.method!=='POST')return json({error:'POST required'},405);

  const url=Deno.env.get('SUPABASE_URL');
  const serviceKey=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const anonKey=Deno.env.get('SUPABASE_ANON_KEY')??Deno.env.get('SUPABASE_PUBLISHABLE_KEY');
  if(!url||!serviceKey||!anonKey)return json({error:'Server configuration unavailable'},500);

  const admin=createClient(url,serviceKey,{auth:{persistSession:false}});
  const authHeader=req.headers.get('Authorization');
  let authUser:any=null;
  if(authHeader){
    try{
      const userClient=createClient(url,anonKey,{auth:{persistSession:false},global:{headers:{Authorization:authHeader}}});
      const token=authHeader.replace(/^Bearer\s+/i,'');
      const {data:{user}}=await userClient.auth.getUser(token);
      authUser=user??null;
    }catch{authUser=null;}
  }

  try{
    const body=await req.json();
    const action=body?.action;

    if(action==='status'){
      return json({email_pdf_enabled:!!Deno.env.get('RESEND_API_KEY')&&!!Deno.env.get('REPORT_FROM_EMAIL')});
    }
    if(action!=='pdf'&&action!=='email_pdf')return json({error:'Unsupported action'},400);

    const assessmentId=typeof body?.assessment_id==='string'&&UUID_RE.test(body.assessment_id)?body.assessment_id:null;
    if(!assessmentId)return json({error:'Valid assessment_id required'},400);

    const access=await authorizeAssessment(admin,authUser,assessmentId,body?.session_token);
    if('error' in access)return json({error:access.error},access.status);

    const report=await loadReport(admin,assessmentId);
    const pdfBytes=await buildPdf(report,assessmentId);
    const base64=bytesToBase64(pdfBytes);
    const filename='investor-dna-report-'+assessmentId.slice(0,8)+'.pdf';

    if(action==='pdf')return json({filename,mime_type:'application/pdf',base64});

    const email=cleanEmail(body?.email);
    if(!email)return json({error:'Enter a valid email address.'},400);
    const apiKey=Deno.env.get('RESEND_API_KEY');
    const from=Deno.env.get('REPORT_FROM_EMAIL');
    if(!apiKey||!from)return json({error:'Email PDF delivery is not configured yet. Use Download PDF for now.'},503);

    const since=new Date(Date.now()-60*60*1000).toISOString();
    const emailHash=await sha256(email);
    const {count}=await admin.from('report_delivery_events').select('id',{count:'exact',head:true})
      .eq('assessment_id',assessmentId).gte('created_at',since);
    if((count??0)>=3)return json({error:'Too many report email requests. Try again later.'},429);

    const send=await fetch('https://api.resend.com/emails',{
      method:'POST',
      headers:{'Authorization':`Bearer ${apiKey}`,'Content-Type':'application/json'},
      body:JSON.stringify({
        from,
        to:[email],
        subject:'Your Investor DNA report',
        html:'<p>Your Investor DNA report is attached as a PDF.</p><p>This is an educational research report and not investment advice.</p>',
        attachments:[{filename,content:base64,content_type:'application/pdf'}]
      })
    });
    const response=await send.json().catch(()=>null);
    const delivered=send.ok&&!!response?.id;
    await admin.from('report_delivery_events').insert({
      assessment_id:assessmentId,
      user_id:authUser?.id??null,
      email_hash:emailHash,
      provider:'resend',
      status:delivered?'accepted':'failed'
    });
    if(!delivered)return json({error:'The email provider did not accept this report. Download the PDF and try again later.'},502);

    return json({sent:true});
  }catch(error){
    return json({error:error instanceof Error?error.message:'Report request failed'},500);
  }
});
