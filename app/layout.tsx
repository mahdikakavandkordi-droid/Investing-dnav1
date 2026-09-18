import type {ReactNode} from 'react';
import "./globals.css";
import "./assessment-onboarding.css";
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
import {Nav} from "@/components/Nav";
import {Footer} from "@/components/Footer";
import {ProductAnalytics} from "@/components/ProductAnalytics";

export const metadata={title:"Investor DNA",description:"Know yourself. Understand your investments."};

export default function RootLayout({children}:{children:ReactNode}){
 return <html lang="en"><body><Nav/><ProductAnalytics/><main>{children}</main><Footer/></body></html>;
}
