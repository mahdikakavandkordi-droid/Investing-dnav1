"use client";
import {useEffect} from 'react';
import {clearDraft} from '@/lib/dna';
export default function CognitivePilotEntry(){useEffect(()=>{clearDraft();location.replace('/dna/assessment?cohort=COGNITIVE_V1_10')},[]);return <section className="section"><div className="container narrow"><div className="card"><div className="eyebrow">Cognitive research session</div><h1>Preparing a fresh v1.10 assessment…</h1><p className="muted">This research entry point starts a clean session so previous development drafts do not contaminate the cognitive-study cohort.</p></div></div></section>}
