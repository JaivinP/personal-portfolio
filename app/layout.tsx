import type { Metadata } from "next";
import { Geist, Inter } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next"

const geist = Geist({
  variable: "--font-geist-var",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter-var",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Jaivin Phabiani — Software Engineer",
  description:
    "Full-Stack Engineer specializing in ML & Data Systems. ACM Hack UCLA. NAVFAC NREIP 2025.",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geist.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#050505] overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
