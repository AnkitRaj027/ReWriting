import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NEXUS // Personal Growth HUD",
  description: "Futuristic dark-theme cyberpunk personal growth dashboard. Track daily habits, manage focus sessions, log biometric energy grids, and level up your RPG skill trees.",
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
