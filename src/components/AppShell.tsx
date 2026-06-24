import { Link, useRouterState } from "@tanstack/react-router";
import { Home, MessageCircle, Users, User } from "lucide-react";
import type { ReactNode } from "react";
import { Logo } from "./Logo";

const tabs = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/coach", label: "Coach", icon: MessageCircle },
  { to: "/club", label: "Club", icon: Users },
  { to: "/profilo", label: "Profilo", icon: User },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0 md:pl-56">
      {/* Desktop sidebar */}
      <aside
        className="fixed inset-y-0 left-0 z-20 hidden w-56 flex-col md:flex"
        style={{
          background: "oklch(0.09 0.02 295)",
          borderRight: "1px solid oklch(1 0 0 / 6%)",
        }}
      >
        {/* Logo */}
        <div className="flex h-14 items-center px-5" style={{ borderBottom: "1px solid oklch(1 0 0 / 5%)" }}>
          <Link to="/home"><Logo /></Link>
        </div>

        {/* Nav */}
        <nav className="flex flex-1 flex-col gap-0.5 px-3 py-5">
          {tabs.map((t) => {
            const active = path === t.to || path.startsWith(t.to + "/");
            const Icon = t.icon;
            return (
              <Link
                key={t.to}
                to={t.to}
                className="group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150"
                style={
                  active
                    ? { background: "oklch(0.66 0.28 295 / 12%)", color: "var(--color-foreground)" }
                    : { color: "oklch(0.55 0.02 295)" }
                }
              >
                {active && (
                  <span
                    className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r-full"
                    style={{ background: "var(--color-accent)" }}
                  />
                )}
                <Icon
                  size={16}
                  strokeWidth={active ? 2.5 : 1.8}
                  style={{ color: active ? "var(--color-accent)" : "inherit", flexShrink: 0 }}
                />
                <span className="tracking-wide" style={{ fontSize: 13 }}>{t.label}</span>
                {!active && (
                  <span
                    className="absolute inset-0 rounded-lg opacity-0 transition-opacity duration-100 group-hover:opacity-100"
                    style={{ background: "oklch(1 0 0 / 3.5%)" }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div
          className="mx-4 mb-5 h-px"
          style={{ background: "linear-gradient(90deg, transparent, oklch(0.66 0.28 295 / 30%), transparent)" }}
        />
      </aside>

      <main className="mx-auto w-full max-w-2xl md:max-w-none md:px-6 lg:px-10">{children}</main>

      {/* Mobile bottom nav */}
      <nav
        className="fixed inset-x-0 bottom-0 z-20 md:hidden"
        style={{
          background: "oklch(0.09 0.02 295 / 96%)",
          backdropFilter: "blur(24px)",
          borderTop: "1px solid oklch(1 0 0 / 7%)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        <div className="mx-auto flex max-w-md items-stretch justify-around px-2 pt-1.5 pb-2">
          {tabs.map((t) => {
            const active = path === t.to || path.startsWith(t.to + "/");
            const Icon = t.icon;
            return (
              <Link
                key={t.to}
                to={t.to}
                className="flex flex-1 flex-col items-center gap-1 py-1"
                style={{ color: active ? "var(--color-foreground)" : "oklch(0.45 0.02 295)" }}
              >
                <span
                  className="relative flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-150"
                  style={
                    active
                      ? { background: "oklch(0.66 0.28 295 / 16%)" }
                      : {}
                  }
                >
                  <Icon
                    size={18}
                    strokeWidth={active ? 2.5 : 1.8}
                    style={{ color: active ? "var(--color-accent)" : "inherit" }}
                  />
                </span>
                <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  {t.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
