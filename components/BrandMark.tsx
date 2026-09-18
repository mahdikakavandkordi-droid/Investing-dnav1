import Link from 'next/link';

/**
 * Approved logo artwork, composed from the exact uploaded logo asset.
 * The symbol and wordmark are cropped from /logo.png with CSS so the mark
 * itself is never redrawn or restyled.
 */
export function BrandMark(){
 return <Link className="brand-lockup approved-brand-lockup approved-master-logo" href="/" aria-label="Investing DNA home">
  <span className="approved-logo-symbol" aria-hidden="true"/>
  <span className="approved-logo-wordmark" aria-hidden="true"/>
 </Link>;
}
