import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { FooterAdPlaceholder } from "@/components/AdPlaceholders";
import { AnimatedGradientBackground } from "@/components/AnimatedGradientBackground";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { absoluteUrl } from "@/lib/utils";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(absoluteUrl()),
  title: {
    default: "ToolVerse AI - 200+ Free AI Tools, Converters, Calculators & Creator Utilities",
    template: "%s | ToolVerse AI",
  },
  description:
    "Use 200+ free AI tools, PDF tools, image converters, document converters, business calculators, and YouTube optimization tools.",
  keywords: [
    "free AI tools",
    "YouTube title generator",
    "PDF tools",
    "image converter",
    "creator tools",
    "ToolVerse AI",
  ],
  openGraph: {
    title: "ToolVerse AI - 200+ Free AI Tools, Converters, Calculators & Creator Utilities",
    description:
      "Use 200+ free AI tools, PDF tools, image converters, document converters, business calculators, and YouTube optimization tools.",
    url: absoluteUrl(),
    siteName: "ToolVerse AI",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ToolVerse AI - 200+ Free AI Tools, Converters, Calculators & Creator Utilities",
    description:
      "Use 200+ free AI tools, PDF tools, image converters, document converters, business calculators, and YouTube optimization tools.",
  },
  alternates: {
    canonical: absoluteUrl(),
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="flex min-h-full flex-col antialiased">
        <AnimatedGradientBackground />
        <Navbar />
        <main className="flex-1">{children}</main>
        <div className="px-4 py-6 sm:px-6 lg:px-8">
          <FooterAdPlaceholder />
        </div>
        <Footer />
      </body>
    </html>
  );
}
