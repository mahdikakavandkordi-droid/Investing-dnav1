import "./globals.css";
import "./assessment-onboarding.css";
import "./result-report.css";
import "./investment-dna.css";
import "./match-dna.css";
import "./product-value.css";
import {Nav} from "@/components/Nav";
import {ProductAnalytics} from "@/components/ProductAnalytics";
export const metadata={title:"Investing DNA",description:"Know yourself. Invest better."};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><Nav/><ProductAnalytics/><main>{children}</main></body></html>}
