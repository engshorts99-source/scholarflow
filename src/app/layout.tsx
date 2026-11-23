import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk" });

export const metadata: Metadata = {
  title: "Schox | Academic Search, Concept Evolution & Researcher Networks",
  description:
    "Trace when scientific concepts were first defined, see live research states, and explore interactive researcher collaboration networks across 250M+ OpenAlex works.",
  keywords: [
    "academic search engine",
    "concept evolution",
    "researcher collaboration network",
    "citation lineage",
    "OpenAlex search",
    "schox",
    "scholar search",
  ],
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans antialiased`}>
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
