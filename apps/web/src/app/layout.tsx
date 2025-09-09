// apps/web/src/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";

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
      {/* bg + text colors come from globals.css */}
      <body>{children}</body>
    </html>
  );
}
