/** Mobile-first shell: sticky header + big bottom navigation. */
import { Link } from "@tanstack/react-router";
import { Home, ScrollText, Users, Package, BarChart3, Settings as Cog } from "lucide-react";
import type { ReactNode } from "react";
import { useKhata } from "@/lib/khata";
import { OfflineBadge } from "./OfflineBadge";

const NAV = [
  { to: "/", label: "Home", icon: Home },
  { to: "/ledger", label: "Khata", icon: ScrollText },
  { to: "/customers", label: "Grahak", icon: Users },
  { to: "/stock", label: "Stock", icon: Package },
  { to: "/summary", label: "Hisaab", icon: BarChart3 },
] as const;

export function AppShell({ title, children }: { title?: string; children: ReactNode }) {
  const { settings } = useKhata();

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-primary text-primary-foreground">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-lg font-bold leading-tight">
              {title ?? settings.shopName}
            </p>
            <p className="text-xs opacity-80">VoiceKhata • bolo aur likho</p>
          </div>
          <div className="flex items-center gap-2">
            <OfflineBadge />
            <Link to="/settings" aria-label="Settings" className="rounded-full p-2 hover:bg-white/10">
              <Cog className="size-6" />
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 pb-28 pt-4">{children}</main>

      <nav className="fixed bottom-0 left-1/2 z-20 w-full max-w-md -translate-x-1/2 border-t border-border bg-card">
        <ul className="grid grid-cols-5">
          {NAV.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <Link
                to={to}
                className="flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold text-muted-foreground"
                activeOptions={{ exact: to === "/" }}
                activeProps={{ className: "text-primary" }}
              >
                <Icon className="size-6" />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
