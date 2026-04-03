import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "LiquidShopper | Find Your Perfect Vehicle",
  description:
    "Discover new, used, and certified pre-owned vehicles. Transparent pricing, real-time inventory, and a seamless car-buying experience.",
  keywords: [
    "cars",
    "vehicles",
    "automotive",
    "buy car",
    "used cars",
    "new cars",
    "CPO",
    "dealership",
  ],
  openGraph: {
    title: "LiquidShopper | Find Your Perfect Vehicle",
    description:
      "Discover new, used, and certified pre-owned vehicles with transparent pricing.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full bg-[#0a0a0a] text-white font-sans" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
