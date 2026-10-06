import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";

export const metadata: Metadata = {
  title: "ReWriting Core — Personal Operating System",
  description: "A sophisticated personal operating system for productivity, habits, learning, reflection, and personal growth.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <body className="min-h-full flex flex-col bg-[#0B0D10] text-[#F1F3F5] selection:bg-[#22C7D9]/20 selection:text-[#22C7D9]">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

