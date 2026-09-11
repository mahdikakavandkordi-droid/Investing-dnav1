import "./globals.css";
export const metadata = { title: "Investing DNA", description: "Discover how you invest." };
export default function RootLayout({children}) {
  return <html lang="en"><body>{children}</body></html>;
}