import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Dev Agent",
  description: "AI Development Agent for Web & Software Development",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">{children}</body>
    </html>
  );
}

