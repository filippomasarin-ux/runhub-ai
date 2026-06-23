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
    <div className="min-h-screen bg-background pb-20 md:pb-0 md:pl-60">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-60 md:flex md:flex-col" style={{
        background: "linear-gradient(180deg, oklch(0.12 0.028 295) 0%, oklch(0.09 0.022 295) 100%)",
        borderRight: "1px solid oklch(1 0 0 / 7%)",
      }}>
        {/* Logo area */}
        <div className="flex h-16 items-center px-6" style={{
          borderBottom: "1px solid oklch(1 0 0 / 6%)",
        }}>
          <Link to="/home"><Logo /></Link>
        </div>

        {/* Nav items */}
        <nav className="flex flex-1 flex-col gap-0.5 px-3 py-4">
          {tabs.map((t) => {
            const active = path === t.to || path.startsWith(t.to + "/");
            const Icon = t.icon;
            return (
              <Link
                key={t.to}
                to={t.to}
                className="group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200"
                style={
                  active
                    ? {
                        background: "linear-gradient(135deg, oklch(0.66 0.28 295 / 18%) 0%, oklch(0.66 0.28 295 / 8%) 100%)",
                        color: "var(--color-foreground)",
                        boxShadow: "inset 1px 0 0 oklch(0.66 0.28 295 / 60%)",
                      }
                    : { color: "var(--color-muted-foreground)" }
                }
              >
                {active && (
                  <span
                    className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r"
                    style={{ background: "var(--color-accent)", boxShadow: "0 0 8px var(--color-accent)" }}
                  />
                )}
                <Icon
                  className="h-4.5 w-4.5 transition-transform duration-200 group-hover:scale-110"
                  strokeWidth={active ? 2.5 : 1.8}
                  style={{ color: active ? "var(--color-accent)" : "inherit" }}
                />
                <span style={{ color: active ? "var(--color-foreground)" : "inherit" }}>{t.label}</span>

                {!active && (
                  <span className="absolute inset-0 rounded-xl opacity-0 transition-opacity duration-150 group-hover:opacity-100"
                    style={{ background: "oklch(1 0 0 / 4%)" }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom accent line */}
        <div className="mx-4 mb-6 h-px" style={{
          background: "linear-gradient(90deg, transparent, oklch(0.66 0.28 295 / 40%), transparent)",
        }} />
      </aside>

      <main className="mx-auto max-w-2xl">{children}</main>

      {/* Mobile bottom nav */}
      <nav
        className="fixed inset-x-0 bottom-0 z-20 md:hidden"
        style={{
          background: "linear-gradient(180deg, oklch(0.10 0.025 295 / 0%) 0%, oklch(0.10 0.025 295 / 97%) 20%, oklch(0.10 0.025 295) 100%)",
          backdropFilter: "blur(20px)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
          borderTop: "1px solid oklch(1 0 0 / 8%)",
        }}
      >
        <div className="mx-auto flex max-w-md items-stretch justify-around px-2 pt-2 pb-2">
          {tabs.map((t) => {
            const active = path === t.to || path.startsWith(t.to + "/");
            const Icon = t.icon;
            return (
              <Link
                key={t.to}
                to={t.to}
                className="group flex flex-1 flex-col items-center gap-1 py-1.5 text-[10px] font-semibold tracking-wide uppercase transition-all duration-200"
                style={{ color: active ? "var(--color-foreground)" : "var(--color-muted-foreground)" }}
              >
                <span
                  className="relative flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200"
                  style={active ? {
                    background: "linear-gradient(135deg, oklch(0.66 0.28 295 / 25%) 0%, oklch(0.66 0.28 295 / 12%) 100%)",
                    boxShadow: "0 0 12px oklch(0.66 0.28 295 / 30%), inset 0 1px 0 oklch(1 0 0 / 10%)",
                  } : {}}
                >
                  <Icon
                    className="h-5 w-5 transition-transform duration-200 group-active:scale-90"
                    strokeWidth={active ? 2.5 : 1.8}
                    style={{ color: active ? "var(--color-accent)" : "inherit" }}
                  />
                  {active && (
                    <span
                      className="absolute -bottom-0.5 left-1/2 h-0.5 w-4 -translate-x-1/2 rounded-full"
                      style={{ background: "var(--color-accent)", boxShadow: "0 0 6px var(--color-accent)" }}
                    />
                  )}
                </span>
                <span>{t.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
