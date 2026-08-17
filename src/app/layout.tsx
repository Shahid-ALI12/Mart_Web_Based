import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Mega Mart — Your One-Stop Shopping Destination",
    template: "%s | Mega Mart",
  },
  description: "Shop fresh groceries, daily essentials, and 5000+ products with fast delivery. Mega Mart — everything you need, delivered fresh.",
  keywords: ["Mega Mart", "grocery", "supermarket", "online shopping", "fresh produce", "delivery", "Pakistan", "Lahore"],
  authors: [{ name: "Mega Mart" }],
  creator: "Mega Mart",
  publisher: "Mega Mart",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/logo.svg",
    apple: "/logo.svg",
  },
  manifest: "/manifest.json",
  openGraph: {
    title: "Mega Mart",
    description: "Everything you need, delivered fresh",
    type: "website",
    locale: "en_PK",
    siteName: "Mega Mart",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mega Mart",
    description: "Everything you need, delivered fresh",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="scroll-smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
