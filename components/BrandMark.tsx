import Image from 'next/image';
import Link from 'next/link';

/** Preserve the approved Investing DNA logo artwork exactly; only display size is normalized. */
export function BrandMark(){
 return <Link className="brand-lockup approved-brand-lockup" href="/" aria-label="Investing DNA home">
  <Image src="/investing-dna-lockup.png" alt="Investing DNA" width={220} height={64} priority/>
 </Link>;
}
