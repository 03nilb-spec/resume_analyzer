import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Resume Analyzer",
  description: "ATS-friendly resume scoring with AI career coaching."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
