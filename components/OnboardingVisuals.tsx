export function PersonalizationVisual(){
 return <svg className="approved-onboarding-svg" viewBox="0 0 600 768" role="img" aria-label="Personalized Investor DNA report illustration">
  <defs>
   <linearGradient id="pv-bg2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#dff7f7"/><stop offset=".63" stopColor="#f3fbf8"/><stop offset="1" stopColor="#d9efea"/></linearGradient>
   <linearGradient id="pv-teal2" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#19b7ad"/><stop offset="1" stopColor="#087f76"/></linearGradient>
   <linearGradient id="pv-m1b" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#a8dce2"/><stop offset="1" stopColor="#72bec6"/></linearGradient>
   <linearGradient id="pv-m2b" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#64b6bd"/><stop offset="1" stopColor="#176b76"/></linearGradient>
   <filter id="pv-shadow2" x="-30%" y="-30%" width="160%" height="180%"><feDropShadow dx="0" dy="12" stdDeviation="13" floodColor="#123e50" floodOpacity=".11"/></filter>
  </defs>

  <rect width="600" height="768" fill="url(#pv-bg2)"/>

  <g opacity=".88" fill="#fff">
   <circle cx="52" cy="92" r="36"/><circle cx="93" cy="102" r="28"/>
   <circle cx="521" cy="90" r="38"/><circle cx="558" cy="105" r="24"/>
   <circle cx="42" cy="500" r="38"/><circle cx="82" cy="513" r="27"/>
  </g>

  <circle cx="300" cy="265" r="214" fill="none" stroke="#2ebac6" strokeWidth="3"/>
  <circle cx="300" cy="51" r="13" fill="#ff5b50"/>
  <circle cx="86" cy="265" r="12" fill="#087f76"/>
  <circle cx="514" cy="265" r="12" fill="#087f76"/>
  <circle cx="300" cy="479" r="12" fill="#087f76"/>

  <g filter="url(#pv-shadow2)">
   <rect x="74" y="94" width="112" height="112" rx="23" fill="#e7fff9" stroke="#fff" strokeWidth="4"/>
   <g transform="translate(108 121)" fill="url(#pv-teal2)">
    <rect x="0" y="36" width="14" height="29" rx="3"/>
    <rect x="23" y="18" width="14" height="47" rx="3"/>
    <rect x="46" y="0" width="14" height="65" rx="3"/>
   </g>

   <rect x="414" y="94" width="112" height="112" rx="23" fill="#fff7df" stroke="#fff" strokeWidth="4"/>
   <path d="M470 119l31 13v23c0 21-13 36-31 45-18-9-31-24-31-45v-23l31-13z" fill="#f5a623"/>
   <path d="M454 153l10 10 23-25" fill="none" stroke="#fff" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"/>

   <rect x="54" y="332" width="116" height="112" rx="23" fill="#eee5ff" stroke="#fff" strokeWidth="4"/>
   <g transform="translate(83 355)" fill="#785fd2">
    <ellipse cx="21" cy="13" rx="21" ry="8"/><rect x="0" y="13" width="42" height="12" rx="6"/><ellipse cx="21" cy="25" rx="21" ry="8"/>
    <rect x="0" y="25" width="42" height="12" rx="6"/><ellipse cx="21" cy="37" rx="21" ry="8"/>
    <circle cx="53" cy="39" r="19"/>
    <path d="M53 25v28M47 31h9a6 6 0 010 12h-5a6 6 0 000 12h9" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round"/>
   </g>

   <rect x="430" y="332" width="116" height="112" rx="23" fill="#dcfff3" stroke="#fff" strokeWidth="4"/>
   <g transform="translate(459 355)">
    <path d="M28 45v29" stroke="#087f76" strokeWidth="6" strokeLinecap="round"/>
    <path d="M28 45C12 44 4 35 3 20c15-1 26 7 28 23" fill="#2fba71"/>
    <path d="M29 44c3-17 14-26 30-24-2 16-10 25-30 24" fill="#12a65b"/>
    <path d="M10 75h37" stroke="#087f76" strokeWidth="7" strokeLinecap="round"/>
   </g>

  </g>

  <circle cx="300" cy="176" r="63" fill="#d8f8f2" opacity=".96"/>
  <circle cx="300" cy="154" r="24" fill="url(#pv-teal2)"/>
  <path d="M252 225c3-33 21-51 48-51s45 18 48 51z" fill="url(#pv-teal2)"/>

  <text x="300" y="277" textAnchor="middle" fontSize="32" fontWeight="800" fill="#102A43">Your name</text>
  <rect x="238" y="293" width="124" height="44" rx="22" fill="#c8f5eb"/>
  <text x="300" y="322" textAnchor="middle" fontSize="23" fontWeight="800" fill="#087f76">Your age</text>

  <g transform="translate(220 363)">
   <circle cx="24" cy="24" r="24" fill="#d8f8f1"/>
   <path d="M14 35c14-24 8-39 21-47-3 11 7 21-2 36-5 9-11 11-19 11z" fill="none" stroke="#087f76" strokeWidth="3.5" strokeLinecap="round"/>
   <text x="59" y="19" fontSize="14" fill="#637A86">Your personalized</text>
   <text x="59" y="41" fontSize="16" fontWeight="800" fill="#102A43">Investor DNA report</text>
  </g>

  <g>
   <circle cx="462" cy="575" r="31" fill="#f7d87b" opacity=".78"/>
   <path d="M0 611L78 551 145 592 226 525 298 584 377 548 454 596 600 520V768H0z" fill="url(#pv-m1b)"/>
   <path d="M0 680L93 612 174 669 260 605 337 674 429 607 510 660 600 615V768H0z" fill="url(#pv-m2b)"/>
   <path d="M328 768c-9-51 1-89 38-115 30-21 27-47 5-65" fill="none" stroke="#f7fffd" strokeWidth="16" strokeLinecap="round"/>
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
