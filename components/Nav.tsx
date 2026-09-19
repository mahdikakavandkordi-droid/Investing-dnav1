"use client";

import Link from 'next/link';
import {useAccount} from '@/lib/use-account';
import {BrandMark} from '@/components/BrandMark';

export function Nav(){
 const {user,loading}=useAccount();
 return <header className="nav platform-nav">
  <div className="navin">
   <BrandMark/>
   <nav className="links platform-nav-links" aria-label="Main navigation">
    <Link href="/#how-it-works">How it works</Link>
    <Link href="/explore">Explore</Link>
    <Link href="/compare">Compare</Link>
    <Link href="/research">Research</Link>
   </nav>
   <div className="account-links platform-account-links">
    <Link className="profile-link" href="/profile">{user?'Dashboard':loading?'Account':'Sign in'}</Link>
    <Link className="btn primary platform-nav-cta" href="/dna/assessment">Start your DNA</Link>
   </div>
  </div>
 </header>;
}
