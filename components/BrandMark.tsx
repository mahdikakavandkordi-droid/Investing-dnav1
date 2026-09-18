import Link from 'next/link';

/** Crisp Investing DNA lockup used across the application shell. */
export function BrandMark(){
 return <Link className="brand-lockup brand-lockup-live" href="/" aria-label="Investing DNA home">
  <svg className="brand-dna-mark" viewBox="0 0 38 44" aria-hidden="true">
   <path d="M9 3c15 7 15 15 0 22s-15 13 0 16" />
   <path d="M29 3c-15 7-15 15 0 22s15 13 0 16" />
   <path d="M12 9h14M8 16h22M8 28h22M12 35h14" />
  </svg>
  <span className="brand-wordmark"><strong>Investing</strong><em>DNA</em></span>
 </Link>;
}
