"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  MessageSquare,
  BarChart3,
  ClipboardList,
  Search,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Chat", icon: MessageSquare },
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/policies", label: "Policies", icon: ClipboardList },
  { href: "/audit", label: "Audit", icon: Search },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({
  collapsed,
  onToggle,
  mobileOpen,
  onMobileClose,
}: SidebarProps) {
  const pathname = usePathname();

  const handleNavClick = useCallback(() => {
    onMobileClose();
  }, [onMobileClose]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onMobileClose();
    };
    if (mobileOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [mobileOpen, onMobileClose]);

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-200 lg:hidden",
          mobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onMobileClose}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-screen border-r bg-[var(--card)] flex flex-col sidebar-transition",
          "lg:sticky lg:z-auto",
          collapsed ? "lg:w-[var(--sidebar-collapsed)]" : "lg:w-[var(--sidebar-width)]",
          mobileOpen
            ? "w-[var(--sidebar-width)] translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Branding + Mobile close */}
        <div
          className={cn(
            "border-b flex items-center",
            collapsed ? "px-2 py-4 justify-center" : "px-6 py-6 justify-between"
          )}
        >
          {collapsed ? (
            <span className="text-lg font-bold">CO</span>
          ) : (
            <>
              <div>
                <h1 className="text-lg font-bold tracking-tight">AI Startup COO</h1>
                <p className="text-xs text-[var(--muted-foreground)] mt-1">
                  Decision-governed operations
                </p>
              </div>
              <button
                onClick={onMobileClose}
                className="lg:hidden p-1.5 -mr-1.5 rounded-md text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] transition-colors"
                aria-label="Close menu"
              >
                <X size={18} strokeWidth={2} />
              </button>
            </>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 sidebar-scroll overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleNavClick}
                className={cn(
                  "flex items-center gap-3 rounded-lg text-sm transition-colors",
                  collapsed ? "justify-center px-2 py-3" : "px-3 py-2",
                  active
                    ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                    : "text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]"
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon size={18} strokeWidth={2} className="shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Status + Toggle */}
        <div className={cn("border-t", collapsed ? "p-2" : "p-4")}>
          {!collapsed && (
            <div className="text-xs text-[var(--muted-foreground)] space-y-1 mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[var(--success)]"></span>
                Decision Ledger connected
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[var(--success)]"></span>
                Policies loaded
              </div>
            </div>
          )}

          {/* Toggle button - desktop only */}
          <button
            onClick={onToggle}
            className={cn(
              "hidden lg:flex items-center justify-center w-full rounded-lg py-2 text-sm",
              "text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]",
              "transition-colors"
            )}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <PanelLeftOpen size={16} strokeWidth={2} />
            ) : (
              <PanelLeftClose size={16} strokeWidth={2} />
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
