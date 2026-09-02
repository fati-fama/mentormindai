import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "MentorMind AI",
    template: "%s | MentorMind AI",
  },
  description:
    "Don't just ask AI. Let AI understand how you learn. MentorMind AI turns a generic assistant into a personalized study mentor.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">{children}</body>
    </html>
  );
}
