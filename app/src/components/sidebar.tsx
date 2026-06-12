"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Chat", icon: "💬" },
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/policies", label: "Policies", icon: "📋" },
  { href: "/audit", label: "Audit", icon: "🔍" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r bg-[var(--card)] flex flex-col h-screen sticky top-0">
      <div className="p-6 border-b">
        <h1 className="text-lg font-bold tracking-tight">AI Startup COO</h1>
        <p className="text-xs text-[var(--muted-foreground)] mt-1">
          Decision-governed operations
        </p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                active
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                  : "text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]"
              )}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t">
        <div className="text-xs text-[var(--muted-foreground)] space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--success)]"></span>
            Decision Ledger connected
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--success)]"></span>
            Policies loaded
          </div>
        </div>
      </div>
    </aside>
  );
}
