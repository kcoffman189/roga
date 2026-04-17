// apps/web/src/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import { inter, poppins, merriweather, lora } from "@/lib/fonts";
import KeepAlive from '@/components/KeepAlive'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: "Roga — The art of asking",
  description: "Duolingo for Question Intelligence.",
  icons: { icon: "/favicon.ico" },        // <-- favicon in /public
  openGraph: {
    title: "Roga — The art of asking",
    description: "Train your Question Intelligence.",
    images: ["/brand/og.png"],            // <-- optional, if present
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${poppins.variable} ${merriweather.variable} ${lora.variable}`}>
        <KeepAlive />
        {children}
      </body>
    </html>
  );
}
