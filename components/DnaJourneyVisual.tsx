/**
 * Assessment progress visual.
 *
 * The visual intentionally advances once for every pair of questions:
 * Q1–2 share a position, Q3–4 share the next position, ... Q27–28 share
 * the final position. Scoring remains fully outside this component.
 */
export function DnaJourneyVisual({current,total}:{current:number;total:number}){
 const rungCount=Math.max(1,Math.ceil(total/2));
 const clamped=Math.max(1,Math.min(total,current));
 const active=Math.min(rungCount-1,Math.floor((clamped-1)/2));
 const stage=active+1;
 const rungs=Array.from({length:rungCount},(_,index)=>{
  const y=46+index*35;
  const phase=index*.91;
  const left=78+Math.sin(phase)*27;
  const right=162-Math.sin(phase)*27;
  return {index,y,left,right};
 });
 const marker=rungs[active];

 return <aside className="dna-journey" aria-label={`Investor DNA progress step ${stage} of ${rungCount}`}>
  <div className="dna-journey-heading">
   <span>Your DNA is taking shape</span>
   <strong>{String(stage).padStart(2,'0')} / {String(rungCount).padStart(2,'0')}</strong>
  </div>
  <div className="dna-journey-inner">
   <svg viewBox="0 0 240 570" role="presentation">
    <defs>
     <linearGradient id="dnaFadeA" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#0b8b83" stopOpacity=".12"/>
      <stop offset=".5" stopColor="#0b8b83" stopOpacity=".42"/>
      <stop offset="1" stopColor="#0b8b83" stopOpacity=".12"/>
     </linearGradient>
     <filter id="dnaGlow" x="-100%" y="-100%" width="300%" height="300%">
      <feGaussianBlur stdDeviation="7" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
     </filter>
    </defs>
    <path className="dna-strand" d="M78 12 C178 70 178 145 78 205 C-2 257 2 332 94 383 C184 433 180 506 82 560"/>
    <path className="dna-strand" d="M162 12 C62 70 62 145 162 205 C242 257 238 332 146 383 C56 433 60 506 158 560"/>
    {rungs.map(rung=><line
      key={rung.index}
      className={rung.index<active?'dna-rung dna-rung-complete':rung.index===active?'dna-rung dna-rung-active':'dna-rung'}
      x1={rung.left} y1={rung.y} x2={rung.right} y2={rung.y}
     />)}
    <circle className="dna-marker-halo" cx={marker.left} cy={marker.y} r="17" filter="url(#dnaGlow)"/>
    <circle className="dna-marker" cx={marker.left} cy={marker.y} r="6"/>
   </svg>
   <div className="dna-journey-caption">
    <b>Questions {active*2+1}–{Math.min(total,active*2+2)}</b>
    <span>One step on your DNA for every two answers.</span>
   </div>
  </div>
 </aside>;
}
