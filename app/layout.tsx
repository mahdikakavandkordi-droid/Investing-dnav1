// Final onboarding visuals deployed: 2026-09-18
// Vercel preview sync: 2026-09-18
import type {ReactNode} from 'react';
import "./globals.css";
import "./assessment-onboarding.css";
import "./assessment-methodology.css";
import "./result-report.css";
import "./investment-dna.css";
import "./match-dna.css";
import "./product-value.css";
import "./product-risk.css";
import "./redesign-brand.css";
import "./redesign-research.css";
import "./redesign-utility.css";
import "./report-redesign.css";
import "./personalized-flow.css";
import "./reference-experience.css";
import "./home-approved.css";
import "./archetype-characters.css";
import "./report-assessment-breakdown.css";
import "./mobile-app.css";
import {Nav} from "@/components/Nav";
import {Footer} from "@/components/Footer";
import {ProductAnalytics} from "@/components/ProductAnalytics";
import {MobileAppNav} from "@/components/MobileAppNav";
import {MobileAppHeader} from "@/components/MobileAppHeader";

export const metadata={title:"Investor DNA",description:"Know yourself. Understand your investments."};

export default function RootLayout({children}:{children:ReactNode}){
 return <html lang="en"><body><Nav/><MobileAppHeader/><ProductAnalytics/><main>{children}</main><Footer/><MobileAppNav/></body></html>;
}
