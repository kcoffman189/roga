import { Inter, Poppins, Merriweather, Lora } from "next/font/google";

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
export const lora = Lora({
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  variable: "--font-lora",
});