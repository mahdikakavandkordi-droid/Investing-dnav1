"use client";

import Link from 'next/link';
import {useAccount} from '@/lib/use-account';

/** Global product navigation; account labels reflect browser auth state only. */
export function Nav(){
 const {user,loading}=useAccount();

 return <header className="nav">
  <div className="navin">
   <Link className="brand" href="/">Investor <span>DNA</span></Link>

   <nav className="links" aria-label="Main navigation">
    <Link href="/dna">My DNA</Link>
    <Link href="/match">Match</Link>
    <Link href="/explore">Explore</Link>
    <Link href="/watchlist">Watchlist</Link>
   </nav>

   <div className="account-links">
    {!loading&&!user&&<Link className="profile-link" href="/profile?mode=signup">Create account</Link>}
    <Link className="profile-link" href="/profile">{user||loading?'My profile':'Sign in'}</Link>
   </div>
  </div>
 </header>;
}
