import Link from 'next/link';

/** Approved Investing DNA lockup. Keep the supplied mark intact across the app shell. */
export function BrandMark(){
 return <Link className="brand-lockup" href="/" aria-label="Investor DNA home">
  <img src="/investing-dna-lockup.png" alt="Investing DNA"/>
 </Link>;
}
