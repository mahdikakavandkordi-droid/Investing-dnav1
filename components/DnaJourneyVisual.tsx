/**
 * Quiet assessment progress visual. The highlighted rung advances with each
 * question; canonical assessment state still lives outside this component.
 */
export function DnaJourneyVisual({current,total}:{current:number;total:number}){
 const rungCount=13;
 const clamped=Math.max(1,Math.min(total,current));
 const progress=total>1?(clamped-1)/(total-1):0;
 const active=Math.round(progress*(rungCount-1));
 const rungs=Array.from({length:rungCount},(_,index)=>{
  const y=42+index*40;
  const phase=index*.88;
  const left=77+Math.sin(phase)*27;
  const right=163-Math.sin(phase)*27;
  return {index,y,left,right};
 });
 const marker=rungs[active];

 return <aside className="dna-journey" aria-hidden="true">
  <div className="dna-journey-inner">
   <svg viewBox="0 0 240 570" role="presentation">
    <defs>
     <linearGradient id="dnaFadeA" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#0b8b83" stopOpacity=".08"/>
      <stop offset=".5" stopColor="#0b8b83" stopOpacity=".23"/>
      <stop offset="1" stopColor="#0b8b83" stopOpacity=".06"/>
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
      className={rung.index===active?'dna-rung dna-rung-active':'dna-rung'}
      x1={rung.left} y1={rung.y} x2={rung.right} y2={rung.y}
     />)}
    <circle className="dna-marker-halo" cx={marker.left} cy={marker.y} r="16" filter="url(#dnaGlow)"/>
    <circle className="dna-marker" cx={marker.left} cy={marker.y} r="6"/>
   </svg>
   <p>Your DNA is taking shape.</p>
  </div>
 </aside>;
}
