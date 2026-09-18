import Image from 'next/image';
import Link from 'next/link';

/**
 * The approved user-provided logo artwork is preserved exactly.
 * The square master image is cropped into a compact horizontal nav lockup
 * through CSS only; no logo geometry is redrawn.
 */
export function BrandMark(){
 return <Link className="brand-lockup approved-master-logo" href="/" aria-label="Investing DNA home">
  <span className="approved-logo-symbol" aria-hidden="true">
   <Image src="/logo.png" alt="" width={1254} height={1254} priority/>
  </span>
  <span className="approved-logo-wordmark" aria-hidden="true">
   <Image src="/logo.png" alt="" width={1254} height={1254} priority/>
  </span>
 </Link>;
}
