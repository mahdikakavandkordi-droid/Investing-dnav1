import Link from 'next/link';

/** Render the approved Investing DNA lockup as a protected background layer.
 *  This isolates the official asset from legacy img crop rules.
 */
export function BrandMark(){
 return <Link className="brand-lockup approved-brand-lockup" href="/" aria-label="Investing DNA home">
  <span className="approved-lockup-art" aria-hidden="true"/>
 </Link>;
}
