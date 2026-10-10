import { Link } from "@tanstack/react-router";
import { Clapperboard, LayoutGrid, Palette, Plus } from "lucide-react";
import type { ReactNode } from "react";

const nav = [
  { to: "/dashboard", label: "Proyectos", icon: LayoutGrid },
  { to: "/projects/new", label: "Nuevo video", icon: Plus },
  { to: "/settings/brand-kit", label: "Brand Kit", icon: Palette },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-surface/60 p-4 backdrop-blur md:flex">
        <Link to="/" className="mb-8 flex items-center gap-2 px-2">
          <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Clapperboard className="size-4" />
          </span>
          <span className="font-display text-lg font-bold">MotionStudio</span>
        </Link>
        <nav className="space-y-1">
          {nav.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground"
              activeProps={{ className: "bg-secondary !text-foreground" }}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto rounded-xl border border-border bg-card p-3 text-xs text-muted-foreground">
          Formato 9:16 · 1080×1920 · 30fps
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-2 border-b border-border px-4 py-3 md:hidden">
          {nav.map(({ to, icon: Icon }) => (
            <Link key={to} to={to} className="rounded-lg p-2 text-muted-foreground" activeProps={{ className: "bg-secondary !text-foreground" }}>
              <Icon className="size-5" />
            </Link>
          ))}
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
