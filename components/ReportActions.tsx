"use client";

import {useEffect,useState} from 'react';
import type {FormEvent} from 'react';
import {reportService} from '@/lib/supabase';
import {useLocale} from '@/lib/locale';

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
  const {pick}=useLocale();

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
    }catch(e){setError(e instanceof Error?e.message:pick('Unable to create the PDF.','Impossible de créer le PDF.'))}
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
      setMessage(pick('Your PDF report was accepted for email delivery.','Votre rapport PDF a été accepté pour l’envoi par courriel.'));
    }catch(e){setError(e instanceof Error?e.message:pick('Unable to email the PDF report.','Impossible d’envoyer le rapport PDF par courriel.'))}
    finally{setSending(false)}
  }

  if(!assessmentId)return null;
  return <section className="report-actions no-print">
    <div>
      <div className="eyebrow">{pick("Keep a copy","Garder une copie")}</div>
      <strong>{pick("Your report can leave the app without creating an account.","Vous pouvez conserver votre rapport sans créer de compte.")}</strong>
      <p>{pick("Download the current report as a PDF, print it, or email the PDF when report delivery is connected.","Téléchargez le rapport actuel en PDF, imprimez-le ou envoyez-le par courriel lorsque la livraison de rapports est activée.")}</p>
    </div>
    <div className="report-actions-buttons">
      <button className="btn primary" disabled={downloading} onClick={()=>void downloadPdf()}>{downloading?pick('Building PDF…','Création du PDF…'):pick('Download PDF','Télécharger le PDF')}</button>
      <button className="btn" onClick={()=>window.print()}>{pick("Print","Imprimer")}</button>
      <button className="btn" onClick={()=>{setEmailOpen(true);setError('');setMessage('')}}>{pick("Email PDF","Envoyer le PDF")}</button>
    </div>
    {error&&<p className="notice report-action-notice" role="alert">{error}</p>}
    {emailOpen&&<div className="save-modal-backdrop" role="presentation" onMouseDown={event=>{if(event.target===event.currentTarget)setEmailOpen(false)}}>
      <section className="save-modal report-email-modal" role="dialog" aria-modal="true" aria-labelledby="email-report-title">
        <div className="save-modal-head"><div><div className="eyebrow">{pick("No account required","Aucun compte requis")}</div><h2 id="email-report-title">{pick("Email this PDF report","Envoyer ce rapport PDF par courriel")}</h2><p>{pick("This sends a copy of the report only. It does not create or save an Investor DNA account.","Cette action envoie seulement une copie du rapport. Elle ne crée ni n’enregistre de compte Investor DNA.")}</p></div><button className="save-modal-close" aria-label={pick("Close","Fermer")} onClick={()=>setEmailOpen(false)}>×</button></div>
        {emailEnabled===true?<form onSubmit={emailPdf}>
          <label className="context-field"><span>{pick("Email address","Adresse courriel")}</span><input type="email" autoComplete="email" required value={email} onChange={event=>setEmail(event.target.value)} placeholder="you@example.com"/></label>
          <button className="btn primary" disabled={sending||!email.trim()}>{sending?pick('Sending PDF…','Envoi du PDF…'):pick('Email my PDF','Envoyer mon PDF')}</button>
          <p className="save-modal-fine">{pick("The address is used for this delivery. The report-delivery audit stores only a one-way hash of the address.","L’adresse est utilisée uniquement pour cet envoi. Le journal de livraison conserve seulement une empreinte irréversible de l’adresse.")}</p>
          {message&&<p className="notice" role="status">{message}</p>}
          {error&&<p className="notice" role="alert">{error}</p>}
        </form>:<div className="report-email-unavailable">
          <p><strong>{pick("Email PDF delivery is not connected in this pilot yet.","L’envoi du PDF par courriel n’est pas encore activé dans ce pilote.")}</strong></p>
          <p>{pick("You can download the same PDF now without creating an account. The email action is already separated from account creation and will activate when the transactional email provider is configured.","Vous pouvez télécharger le même PDF maintenant sans créer de compte. L’envoi par courriel est séparé de la création de compte et sera activé lorsque le service de courriel transactionnel sera configuré.")}</p>
          <button className="btn primary" disabled={downloading} onClick={()=>void downloadPdf()}>{downloading?pick('Building PDF…','Création du PDF…'):pick('Download PDF instead','Télécharger le PDF plutôt')}</button>
        </div>}
      </section>
    </div>}
  </section>;
}
