import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "I have a very important question 💌",
  description: "One tiny question...",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
