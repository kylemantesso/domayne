import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { WalletProvider } from "@/components/providers/wallet-provider";
import "@rainbow-me/rainbowkit/styles.css";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Domayne - Create A Landing Page For Your Domain",
  description: "Create beautiful, instant landing pages for your domains. Deploy in seconds with Domayne.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://domaybe.xyz'),
  keywords: ["domain", "landing page", "web3", "blockchain", "domain management"],
  authors: [{ name: "Domayne" }],
  creator: "Domayne",
  publisher: "Domayne",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "Domayne - Create A Landing Page For Your Domain",
    description: "Create beautiful, instant landing pages for your domains. Deploy in seconds with Domayne.",
    url: "/",
    siteName: "Domayne",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Domayne - Create A Landing Page For Your Domain",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Domayne - Create A Landing Page For Your Domain",
    description: "Create beautiful, instant landing pages for your domains. Deploy in seconds with Domayne.",
    images: ["/og.png"],
    creator: "@domayne_xyz",
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-96x96.png", type: "image/png", sizes: "96x96" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <WalletProvider>
          {children}
          <Toaster />
        </WalletProvider>
      </body>
    </html>
  );
}
