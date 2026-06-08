// apps/web/src/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import { inter, poppins, merriweather, lora } from "@/lib/fonts";
import KeepAlive from '@/components/KeepAlive'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: "Cephos — Many books. One mind.",
  description: "Cephos finds unexpected connections between the books you've read. Add your library and discover what your books have been saying to each other.",
  icons: { icon: [{ url: "/favicon.svg", type: "image/svg+xml" }] },
  openGraph: {
    title: "Cephos — Many books. One mind.",
    description: "You've read a lot. Cephos finds what your books have been saying to each other. Add your personal book library and let Cephos surface the connections you didn't know were there.",
    images: ["/brand/og.png"],            // <-- optional, if present
  },
  twitter: {
    card: "summary_large_image",
    description: "You've read a lot. Cephos finds what your books have been saying to each other. Add your library and discover the unexpected connections between everything you've read.",
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
