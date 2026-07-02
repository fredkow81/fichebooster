"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Store, Package, History, Settings, LogOut } from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/stores", label: "Boutiques", icon: Store },
  { href: "/products", label: "Produits", icon: Package },
  { href: "/history", label: "Historique", icon: History },
  { href: "/settings", label: "Paramètres", icon: Settings },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen">
      <aside className="w-60 shrink-0 border-r border-border bg-secondary/30 flex flex-col">
        <div className="p-4 border-b border-border">
          <span className="font-semibold text-lg">SEO Optimizer</span>
        </div>
        <nav className="flex-1 p-2 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active ? "bg-primary text-primary-foreground" : "hover:bg-secondary text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-2 border-t border-border">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary w-full"
          >
            <LogOut className="h-4 w-4" />
            Déconnexion
          </button>
        </div>
      </aside>
      <main className="flex-1 p-6 overflow-y-auto">{children}</main>
    </div>
  );
}
