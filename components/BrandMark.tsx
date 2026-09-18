import Link from 'next/link';

/** Preserve the approved Investing DNA artwork from /public/logo.png.
 *  The two spans are crop windows only; the logo geometry itself is not redrawn.
 */
export function BrandMark(){
 return <Link className="brand-lockup approved-brand-lockup" href="/" aria-label="Investing DNA home">
  <span className="approved-logo-symbol" aria-hidden="true"/>
  <span className="approved-logo-wordmark" aria-hidden="true"/>
 </Link>;
}
