import type {ReactNode} from 'react';
import "./globals.css";
import "./assessment-onboarding.css";
import "./result-report.css";
import "./investment-dna.css";
import "./match-dna.css";
import "./product-value.css";
import "./redesign-brand.css";
import "./redesign-research.css";
import "./redesign-utility.css";
import "./report-redesign.css";
import {Nav} from "@/components/Nav";
import {Footer} from "@/components/Footer";
import {ProductAnalytics} from "@/components/ProductAnalytics";

export const metadata={
 title:"Investor DNA",
 description:"Know yourself. Understand your investments."
};

/** Global application shell and privacy-minimized route analytics mount point. */
export default function RootLayout({children}:{children:ReactNode}){
 return <html lang="en">
  <body>
   <Nav/>
   <ProductAnalytics/>
   <main>{children}</main>
   <Footer/>
  </body>
 </html>;
}
