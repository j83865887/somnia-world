import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Somnia — Your sleep, your world",
  description: "A quiet space to shape a sleep intention, explore community prompts, and settle into the night.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
