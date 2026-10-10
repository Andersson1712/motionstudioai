import { createFileRoute, Link } from "@tanstack/react-router";
import { Film, Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/ui-kit";
import { useStudio } from "@/lib/store";

export const Route = createFileRoute("/dashboard")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Proyectos — MotionStudio AI" },
      { name: "description", content: "Todos tus videos verticales y su estado de renderizado." },
      { property: "og:title", content: "Proyectos — MotionStudio AI" },
      { property: "og:description", content: "Todos tus videos verticales y su estado de renderizado." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { projects, deleteProject } = useStudio();
  return (
    <AppShell>
      <div className="mx-auto max-w-6xl p-6 md:p-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Tus proyectos</h1>
            <p className="mt-1 text-sm text-muted-foreground">{projects.length} videos en el estudio</p>
          </div>
          <Link to="/projects/new" className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:-translate-y-0.5 hover:shadow-glow">
            <Plus className="size-4" /> Crear Nuevo Video
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {projects.map((p) => {
            const t = p.timeline_data?.theme;
            return (
              <div key={p.id} className="group relative animate-slide-up">
                <Link to="/projects/$id/editor" params={{ id: p.id }} className="block">
                  <div
                    className="relative aspect-[9/16] overflow-hidden rounded-2xl border border-border transition duration-300 group-hover:-translate-y-1 group-hover:shadow-glow"
                    style={{ background: t ? `linear-gradient(160deg, ${t.backgroundColor} 40%, ${t.primaryColor}55)` : undefined }}
                  >
                    <div className="absolute inset-x-3 top-1/3 text-center text-lg font-black leading-tight" style={{ color: t?.primaryColor, fontFamily: t?.fontFamily }}>
                      {p.timeline_data?.scenes[0]?.layoutProps.title ?? <Film className="mx-auto size-8 text-muted-foreground" />}
                    </div>
                    <div className="absolute left-3 top-3"><StatusBadge status={p.status} /></div>
                  </div>
                  <div className="mt-3 truncate text-sm font-semibold">{p.title}</div>
                  <div className="text-xs text-muted-foreground">{p.mode === "talking_head" ? "Video crudo" : "Animación"} · {new Date(p.created_at).toLocaleDateString()}</div>
                </Link>
                <button onClick={() => deleteProject(p.id)} className="absolute right-2 top-2 rounded-lg bg-background/80 p-1.5 text-muted-foreground opacity-0 transition hover:text-destructive group-hover:opacity-100" aria-label="Eliminar">
                  <Trash2 className="size-4" />
                </button>
              </div>
            );
          })}
          <Link to="/projects/new" className="grid aspect-[9/16] place-items-center rounded-2xl border-2 border-dashed border-border text-muted-foreground transition hover:border-primary hover:text-primary">
            <div className="text-center"><Plus className="mx-auto size-8" /><span className="mt-2 block text-sm font-semibold">Nuevo</span></div>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
