import Link from 'next/link';

/** Stable vector lockup for the navigation.
 *  It preserves the approved navy/teal DNA-market mark and wordmark without
 *  depending on the legacy corrupted horizontal PNG.
 */
export function BrandMark(){
 return <Link className="brand-lockup brand-lockup-live platform-brand-live" href="/" aria-label="Investing DNA home">
  <svg className="brand-dna-mark" viewBox="0 0 32 40" aria-hidden="true">
   <path d="M9 35.5C4.5 32.5 3 28.8 4.5 24.2C5.3 21.8 7 20 9.2 18.6"/>
   <path d="M23 4.5C27.4 7.4 29 11.3 27.5 15.8C26.7 18.3 25 20 22.8 21.4"/>
   <path d="M10 27.5V23.5M14.3 25.8V20.8M18.7 23.8V17.7M23 21.4V14.7"/>
  </svg>
  <span className="brand-wordmark" aria-hidden="true"><strong>Investing</strong><em>DNA</em></span>
 </Link>;
}
