import { Link, useNavigate } from "@tanstack/react-router";
import { Clapperboard, Film, LayoutGrid, LogOut, Palette, Plus } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useStudio } from "@/lib/store";

const nav = [
  { to: "/dashboard", label: "Proyectos", icon: LayoutGrid },
  { to: "/videos", label: "Mis videos", icon: Film },
  { to: "/projects/new", label: "Nuevo video", icon: Plus },
  { to: "/settings/brand-kit", label: "Brand Kit", icon: Palette },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const loadForUser = useStudio((s) => s.loadForUser);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) void loadForUser(user?.id ?? null);
  }, [loading, user?.id, loadForUser]);

  async function handleSignOut() {
    await signOut();
    await loadForUser(null);
    navigate({ to: "/" });
  }

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
        <div className="mt-auto space-y-3">
          {user && (
            <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                {(user.email ?? "?").slice(0, 2).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{user.email}</span>
              <button
                onClick={handleSignOut}
                className="rounded-lg p-1.5 text-muted-foreground transition hover:text-destructive"
                aria-label="Cerrar sesión"
                title="Cerrar sesión"
              >
                <LogOut className="size-4" />
              </button>
            </div>
          )}
          <div className="rounded-xl border border-border bg-card p-3 text-xs text-muted-foreground">
            Formato 9:16 · 1080×1920 · 30fps
          </div>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-2 border-b border-border px-4 py-3 md:hidden">
          {nav.map(({ to, icon: Icon }) => (
            <Link key={to} to={to} className="rounded-lg p-2 text-muted-foreground" activeProps={{ className: "bg-secondary !text-foreground" }}>
              <Icon className="size-5" />
            </Link>
          ))}
          {user && (
            <button onClick={handleSignOut} className="ml-auto rounded-lg p-2 text-muted-foreground" aria-label="Cerrar sesión">
              <LogOut className="size-5" />
            </button>
          )}
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
