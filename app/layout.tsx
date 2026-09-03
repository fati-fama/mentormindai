import type { Metadata } from "next";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { CosmicBackground } from "@/components/visual/CosmicBackground";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "MentorMind AI",
    template: "%s | MentorMind AI",
  },
  description:
    "Don't just ask AI. Let AI understand how you learn. MentorMind AI turns a generic assistant into a personalized study mentor.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-space-950 text-ink antialiased">
        <CosmicBackground />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
