import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Auction Catalog Enricher",
  description: "Enrich auction lot titles and descriptions with Claude Vision",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-[#0F0F0F]">
      <body className="antialiased text-[#F5F0E8]">
        {children}
      </body>
    </html>
  );
}
