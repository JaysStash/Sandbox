import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Mother Nature's Sandbox",
  description: "Create and simulate severe weather in a realistic sandbox.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-storm-950 text-[#e8ecf5] antialiased">
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}
