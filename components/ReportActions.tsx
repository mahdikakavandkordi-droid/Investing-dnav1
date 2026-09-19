"use client";

import {useEffect,useState} from 'react';
import type {FormEvent} from 'react';
import {reportService} from '@/lib/supabase';

type PdfResponse={filename:string;mime_type:string;base64:string};
type StatusResponse={email_pdf_enabled:boolean};

export function ReportActions({assessmentId,guestSessionToken}:{assessmentId:string|null;guestSessionToken:string|null}){
  const [downloading,setDownloading]=useState(false);
  const [emailOpen,setEmailOpen]=useState(false);
  const [emailEnabled,setEmailEnabled]=useState<boolean|null>(null);
  const [email,setEmail]=useState('');
  const [sending,setSending]=useState(false);
  const [message,setMessage]=useState('');
  const [error,setError]=useState('');

  useEffect(()=>{
    let active=true;
    reportService<StatusResponse>('status')
      .then(value=>{if(active)setEmailEnabled(!!value.email_pdf_enabled)})
      .catch(()=>{if(active)setEmailEnabled(false)});
    return()=>{active=false};
  },[]);

  async function downloadPdf(){
    if(!assessmentId||downloading)return;
    setDownloading(true);setError('');setMessage('');
    try{
      const result=await reportService<PdfResponse>('pdf',{
        assessment_id:assessmentId,
        ...(guestSessionToken?{session_token:guestSessionToken}:{})
      });
      const binary=atob(result.base64);
      const bytes=new Uint8Array(binary.length);
      for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
      const blob=new Blob([bytes],{type:result.mime_type||'application/pdf'});
      const href=URL.createObjectURL(blob);
      const link=document.createElement('a');
      link.href=href;link.download=result.filename||'investor-dna-report.pdf';
      document.body.appendChild(link);link.click();link.remove();
      setTimeout(()=>URL.revokeObjectURL(href),1000);
    }catch(e){setError(e instanceof Error?e.message:'Unable to create the PDF.')}
    finally{setDownloading(false)}
  }

  async function emailPdf(event:FormEvent){
    event.preventDefault();
    if(!assessmentId||!email.trim()||sending||emailEnabled!==true)return;
    setSending(true);setError('');setMessage('');
    try{
      await reportService<{sent:boolean}>('email_pdf',{
        assessment_id:assessmentId,
        email:email.trim(),
        ...(guestSessionToken?{session_token:guestSessionToken}:{})
      });
      setMessage('Your PDF report was accepted for email delivery.');
    }catch(e){setError(e instanceof Error?e.message:'Unable to email the PDF report.')}
    finally{setSending(false)}
  }

  if(!assessmentId)return null;
  return <section className="report-actions no-print">
    <div>
      <div className="eyebrow">Keep a copy</div>
      <strong>Your report can leave the app without creating an account.</strong>
      <p>Download the current report as a PDF, print it, or email the PDF when report delivery is connected.</p>
    </div>
    <div className="report-actions-buttons">
      <button className="btn primary" disabled={downloading} onClick={()=>void downloadPdf()}>{downloading?'Building PDF…':'Download PDF'}</button>
      <button className="btn" onClick={()=>window.print()}>Print</button>
      <button className="btn" onClick={()=>{setEmailOpen(true);setError('');setMessage('')}}>Email PDF</button>
    </div>
    {error&&<p className="notice report-action-notice" role="alert">{error}</p>}
    {emailOpen&&<div className="save-modal-backdrop" role="presentation" onMouseDown={event=>{if(event.target===event.currentTarget)setEmailOpen(false)}}>
      <section className="save-modal report-email-modal" role="dialog" aria-modal="true" aria-labelledby="email-report-title">
        <div className="save-modal-head"><div><div className="eyebrow">No account required</div><h2 id="email-report-title">Email this PDF report</h2><p>This sends a copy of the report only. It does not create or save an Investor DNA account.</p></div><button className="save-modal-close" aria-label="Close" onClick={()=>setEmailOpen(false)}>×</button></div>
        {emailEnabled===true?<form onSubmit={emailPdf}>
          <label className="context-field"><span>Email address</span><input type="email" autoComplete="email" required value={email} onChange={event=>setEmail(event.target.value)} placeholder="you@example.com"/></label>
          <button className="btn primary" disabled={sending||!email.trim()}>{sending?'Sending PDF…':'Email my PDF'}</button>
          <p className="save-modal-fine">The address is used for this delivery. The report-delivery audit stores only a one-way hash of the address.</p>
          {message&&<p className="notice" role="status">{message}</p>}
          {error&&<p className="notice" role="alert">{error}</p>}
        </form>:<div className="report-email-unavailable">
          <p><strong>Email PDF delivery is not connected in this pilot yet.</strong></p>
          <p>You can download the same PDF now without creating an account. The email action is already separated from account creation and will activate when the transactional email provider is configured.</p>
          <button className="btn primary" disabled={downloading} onClick={()=>void downloadPdf()}>{downloading?'Building PDF…':'Download PDF instead'}</button>
        </div>}
      </section>
    </div>}
  </section>;
}
