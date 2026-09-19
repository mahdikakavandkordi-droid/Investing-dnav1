export function PersonalizationVisual(){
 return <svg className="approved-onboarding-svg" viewBox="0 0 460 610" role="img" aria-label="Personalized Investor DNA report illustration">
  <defs>
   <linearGradient id="pv-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#dff6f6"/><stop offset=".62" stopColor="#eff9f7"/><stop offset="1" stopColor="#d7efea"/></linearGradient>
   <linearGradient id="pv-teal" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#15b7ad"/><stop offset="1" stopColor="#087f76"/></linearGradient>
   <linearGradient id="pv-mountain1" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#9bd6de"/><stop offset="1" stopColor="#67b8c0"/></linearGradient>
   <linearGradient id="pv-mountain2" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#66b9be"/><stop offset="1" stopColor="#176c77"/></linearGradient>
   <filter id="pv-shadow" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="#123e50" floodOpacity=".12"/></filter>
  </defs>
  <rect width="460" height="610" fill="url(#pv-bg)"/>
  <g opacity=".9"><circle cx="58" cy="84" r="32" fill="#fff"/><circle cx="95" cy="92" r="24" fill="#fff"/><circle cx="401" cy="87" r="34" fill="#fff"/><circle cx="430" cy="99" r="20" fill="#fff"/></g>
  <circle cx="230" cy="236" r="158" fill="none" stroke="#2fb8c6" strokeWidth="2.5"/>
  <circle cx="230" cy="78" r="11" fill="#ff5a4f"/><circle cx="72" cy="236" r="10" fill="#087f76"/><circle cx="388" cy="236" r="10" fill="#087f76"/><circle cx="230" cy="394" r="10" fill="#087f76"/>
  <g filter="url(#pv-shadow)">
   <rect x="72" y="98" width="82" height="82" rx="18" fill="#e8fff9" stroke="#fff" strokeWidth="3"/>
   <g transform="translate(95 118)" fill="url(#pv-teal)"><rect x="0" y="27" width="11" height="20" rx="2"/><rect x="17" y="15" width="11" height="32" rx="2"/><rect x="34" y="2" width="11" height="45" rx="2"/></g>
   <rect x="306" y="98" width="82" height="82" rx="18" fill="#fff7df" stroke="#fff" strokeWidth="3"/>
   <path d="M347 118l24 10v18c0 16-10 27-24 34-14-7-24-18-24-34v-18l24-10z" fill="#f5a623"/><path d="M335 145l8 8 17-18" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
   <rect x="54" y="292" width="86" height="82" rx="18" fill="#eee5ff" stroke="#fff" strokeWidth="3"/>
   <g transform="translate(76 311)" fill="#785fd2"><ellipse cx="16" cy="11" rx="16" ry="6"/><rect x="0" y="11" width="32" height="10" rx="5"/><ellipse cx="16" cy="21" rx="16" ry="6"/><rect x="0" y="21" width="32" height="10" rx="5"/><ellipse cx="16" cy="31" rx="16" ry="6"/><circle cx="40" cy="31" r="15"/><path d="M40 20v22M35 24h7a5 5 0 010 10h-4a5 5 0 000 10h7" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"/></g>
   <rect x="321" y="292" width="86" height="82" rx="18" fill="#ddfff3" stroke="#fff" strokeWidth="3"/>
   <g transform="translate(342 313)"><path d="M21 38v20" stroke="#087f76" strokeWidth="5" strokeLinecap="round"/><path d="M21 38C9 37 3 30 2 19c11-1 19 5 21 17" fill="#29b66d"/><path d="M22 37c2-13 10-20 22-18-1 12-7 19-22 18" fill="#15a85a"/><path d="M8 58h28" stroke="#087f76" strokeWidth="6" strokeLinecap="round"/></g>
   <rect x="139" y="119" width="182" height="252" rx="24" fill="#fff"/>
  </g>
  <circle cx="230" cy="176" r="42" fill="#ccf6ef"/>
  <circle cx="230" cy="160" r="18" fill="url(#pv-teal)"/><path d="M198 205c2-23 14-35 32-35s30 12 32 35z" fill="url(#pv-teal)"/>
  <text x="230" y="237" textAnchor="middle" fontSize="22" fontWeight="800" fill="#102A43">Your name</text>
  <rect x="185" y="250" width="90" height="34" rx="17" fill="#cdf7ee"/><text x="230" y="273" textAnchor="middle" fontSize="18" fontWeight="800" fill="#087f76">Your age</text>
  <line x1="173" y1="299" x2="287" y2="299" stroke="#d9e9e6" strokeWidth="2"/>
  <circle cx="189" cy="327" r="20" fill="#d9f8f1"/><path d="M180 336c12-19 6-32 18-38-3 9 5 18-2 30-5 8-10 9-16 8z" fill="none" stroke="#087f76" strokeWidth="3" strokeLinecap="round"/>
  <text x="217" y="324" fontSize="11" fill="#637A86">Your personalized</text><text x="217" y="342" fontSize="13" fontWeight="800" fill="#102A43">Investor DNA report</text>
  <g>
   <path d="M0 506L58 455 112 489 180 428 235 476 305 445 363 493 460 430V610H0z" fill="url(#pv-mountain1)"/>
   <path d="M0 551L72 495 139 541 205 487 267 546 345 486 408 536 460 500V610H0z" fill="url(#pv-mountain2)"/>
   <path d="M254 610c-6-38 3-67 31-86 24-16 20-35 1-48" fill="none" stroke="#f7fffd" strokeWidth="12" strokeLinecap="round"/>
   <circle cx="356" cy="484" r="24" fill="#f7d77c" opacity=".82"/>
  </g>
 </svg>;
}

export function MoneyContextVisual(){
 return <svg className="approved-onboarding-svg" viewBox="0 0 460 610" role="img" aria-label="Goal, time horizon, liquidity and protection context illustration">
  <defs>
   <linearGradient id="mc-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#e7f8f8"/><stop offset=".68" stopColor="#f4fbfa"/><stop offset="1" stopColor="#d7efea"/></linearGradient>
   <linearGradient id="mc-m1" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#9ed4da"/><stop offset="1" stopColor="#6ab8c1"/></linearGradient>
   <linearGradient id="mc-m2" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#61b6bd"/><stop offset="1" stopColor="#176c77"/></linearGradient>
   <filter id="mc-shadow" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="#123e50" floodOpacity=".10"/></filter>
  </defs>
  <rect width="460" height="610" fill="url(#mc-bg)"/>
  <circle cx="230" cy="266" r="138" fill="none" stroke="#9fe1db" strokeWidth="1.5" opacity=".6"/>
  <circle cx="230" cy="266" r="107" fill="none" stroke="#bceae5" strokeWidth="1.5" opacity=".8"/>
  <g strokeLinecap="round" strokeWidth="4" fill="none">
   <path d="M150 156C176 178 188 204 196 229" stroke="#ff7067"/>
   <path d="M310 156C284 178 272 204 264 229" stroke="#f3b321"/>
   <path d="M150 369C176 347 188 324 196 302" stroke="#22b9ad"/>
   <path d="M310 369C284 347 272 324 264 302" stroke="#8c6de2"/>
  </g>
  <g filter="url(#mc-shadow)">
   <rect x="36" y="94" width="142" height="120" rx="22" fill="#fff"/>
   <circle cx="107" cy="129" r="27" fill="#ffe0db"/><circle cx="107" cy="129" r="15" fill="none" stroke="#e95549" strokeWidth="4"/><circle cx="107" cy="129" r="6" fill="#e95549"/><path d="M120 116l12-12M125 104h8v8" stroke="#e95549" strokeWidth="4" strokeLinecap="round"/>
   <text x="107" y="181" textAnchor="middle" fontSize="18" fontWeight="800" fill="#102A43">Goal</text>
   <rect x="282" y="94" width="142" height="120" rx="22" fill="#fff"/>
   <circle cx="353" cy="129" r="27" fill="#fff0c9"/><circle cx="353" cy="129" r="16" fill="none" stroke="#d28b00" strokeWidth="4"/><path d="M353 118v13l9 6" stroke="#d28b00" strokeWidth="4" fill="none" strokeLinecap="round"/>
   <text x="353" y="181" textAnchor="middle" fontSize="18" fontWeight="800" fill="#102A43">Time Horizon</text>
   <rect x="36" y="323" width="142" height="120" rx="22" fill="#fff"/>
   <circle cx="107" cy="358" r="27" fill="#daf8f4"/><path d="M107 340c10 15 17 23 17 34a17 17 0 01-34 0c0-11 7-19 17-34z" fill="none" stroke="#078a80" strokeWidth="4"/>
   <text x="107" y="410" textAnchor="middle" fontSize="18" fontWeight="800" fill="#102A43">Liquidity</text>
   <rect x="282" y="323" width="142" height="120" rx="22" fill="#fff"/>
   <circle cx="353" cy="358" r="27" fill="#eee5ff"/><path d="M353 340l18 8v14c0 13-7 21-18 27-11-6-18-14-18-27v-14l18-8z" fill="none" stroke="#744fd1" strokeWidth="4"/><path d="M344 363l6 6 13-14" fill="none" stroke="#744fd1" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
   <text x="353" y="410" textAnchor="middle" fontSize="18" fontWeight="800" fill="#102A43">Protection</text>
  </g>
  <g filter="url(#mc-shadow)">
   <circle cx="230" cy="266" r="75" fill="#d8fff2" stroke="#fff" strokeWidth="6"/>
   <g transform="translate(230 220)" fill="none" stroke="#087f76" strokeWidth="3.6" strokeLinecap="round">
    <path d="M-10 0c20 8 20 20 0 28s-20 20 0 28"/>
    <path d="M10 0c-20 8-20 20 0 28s20 20 0 28"/>
    <path d="M-7 8h14M-8 20h16M-8 36h16M-7 48h14"/>
   </g>
   <text x="230" y="290" textAnchor="middle" fontSize="18" fontWeight="800" fill="#102A43">Your Money</text>
   <text x="230" y="314" textAnchor="middle" fontSize="18" fontWeight="800" fill="#102A43">Context</text>
  </g>
  <circle cx="196" cy="228" r="6" fill="#ff7067" stroke="#fff" strokeWidth="3"/><circle cx="264" cy="228" r="6" fill="#f3b321" stroke="#fff" strokeWidth="3"/><circle cx="196" cy="304" r="6" fill="#22b9ad" stroke="#fff" strokeWidth="3"/><circle cx="264" cy="304" r="6" fill="#8c6de2" stroke="#fff" strokeWidth="3"/>
  <g>
   <circle cx="328" cy="469" r="28" fill="#f6d77c" opacity=".75"/>
   <path d="M0 510L58 469 115 500 181 453 238 498 297 465 362 498 460 445V610H0z" fill="url(#mc-m1)"/>
   <path d="M0 556L80 504 143 548 214 494 278 551 351 494 410 540 460 503V610H0z" fill="url(#mc-m2)"/>
   <path d="M257 610c-8-37 1-68 30-87 23-15 21-34 4-48" fill="none" stroke="#f8fffd" strokeWidth="12" strokeLinecap="round"/>
  </g>
 </svg>;
}
