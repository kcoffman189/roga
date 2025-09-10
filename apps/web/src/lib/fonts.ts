import { Inter, Poppins, Merriweather } from "next/font/google";

export const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
export const poppins = Poppins({
  subsets: ["latin"],
  weight: ["500","700"],
  variable: "--font-poppins",
});
export const merriweather = Merriweather({
  subsets: ["latin"],
  weight: ["400","700"],
  variable: "--font-merriweather",
});