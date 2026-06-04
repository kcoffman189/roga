// apps/web/src/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import { inter, poppins, merriweather, lora } from "@/lib/fonts";
import KeepAlive from '@/components/KeepAlive'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: "Cephos — Many books. One mind.",
  description: "Duolingo for Question Intelligence.",
  icons: { icon: [{ url: "/favicon.svg", type: "image/svg+xml" }] },
  openGraph: {
    title: "Cephos — Many books. One mind.",
    description: "Train your Question Intelligence.",
    images: ["/brand/og.png"],            // <-- optional, if present
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      </head>
      <body className={`${inter.variable} ${poppins.variable} ${merriweather.variable} ${lora.variable}`}>
        <KeepAlive />
        {children}
      </body>
    </html>
  );
}
