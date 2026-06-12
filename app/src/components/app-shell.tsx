"use client";

import { useState, useCallback } from "react";
import { Sidebar } from "@/components/sidebar";
import { Menu } from "lucide-react";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleToggle = useCallback(() => setCollapsed((c) => !c), []);
  const handleMobileOpen = useCallback(() => setMobileOpen(true), []);
  const handleMobileClose = useCallback(() => setMobileOpen(false), []);

  return (
    <div className="flex min-h-screen">
      <Sidebar
        collapsed={collapsed}
        onToggle={handleToggle}
        mobileOpen={mobileOpen}
        onMobileClose={handleMobileClose}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="h-[var(--header-height)] border-b bg-[var(--card)] flex items-center px-4 lg:hidden shrink-0">
          <button
            onClick={handleMobileOpen}
            className="p-2 -ml-2 rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] transition-colors"
            aria-label="Open menu"
          >
            <Menu size={20} strokeWidth={2} />
          </button>
          <span className="ml-3 text-sm font-semibold">AI Startup COO</span>
        </header>

        {/* Main content */}
        <main className="flex-1 h-[calc(100vh-var(--header-height))] lg:h-screen overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
