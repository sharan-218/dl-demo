import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";

export const metadata: Metadata = {
  title: "AI Startup COO",
  description: "AI-powered operating system for startup decisions",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 h-screen overflow-hidden">{children}</main>
        </div>
      </body>
    </html>
  );
}
