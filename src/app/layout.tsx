import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ReWriting MYself",
  description: "Your futuristic personal growth dashboard. Track daily habits, manage focus sessions, write reflective notes, and learn English with your automated coach.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <body className="min-h-full flex flex-col bg-obsidian-deep text-gray-200">
        {children}
      </body>
    </html>
  );
}
