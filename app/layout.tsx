import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title:"VentureOS — Founder Command Center",
  description:"Personal Venture Intelligence & Creation OS"
};
export default function RootLayout({children}:{children:React.ReactNode}){
  return <html lang="en"><body>{children}</body></html>;
}