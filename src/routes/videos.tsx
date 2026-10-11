import { createFileRoute, Link } from "@tanstack/react-router";
import { Download, Film, Loader2, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Btn } from "@/components/ui-kit";
import { downloadUrl, hasActiveRenders, latestByProject, listRenders, queueRender, RENDER_LABEL, type RenderJob } from "@/lib/renders";
import { useStudio } from "@/lib/store";
import { totalFrames } from "@/lib/timeline";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/videos")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Mis videos — MotionStudio AI" },
      { name: "description", content: "Estado de cada render y descarga de tus MP4 terminados." },
      { property: "og:title", content: "Mis videos — MotionStudio AI" },
      { property: "og:description", content: "Estado de cada render y descarga de tus MP4 terminados." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Videos,
});

const tone: Record<string, string> = {
  queued: "bg-secondary text-muted-foreground",
  rendering: "bg-primary/15 text-primary",
  completed: "bg-primary text-primary-foreground",
  failed: "bg-destructive/15 text-destructive",
};

function Videos() {
  const { projects, userId } = useStudio();
  const [jobs, setJobs] = useState<RenderJob[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) return;
    try {
      setJobs(await listRenders());
      setErr(null);
    } catch {
      setErr("No se pudieron cargar los renders.");
    }
  }, [userId]);

  useEffect(() => { void refresh(); }, [refresh]);
  useEffect(() => {
    if (!hasActiveRenders(jobs)) return;
    const t = setInterval(refresh, 5000);
    return () => clearInterval(t);
  }, [jobs, refresh]);

  const latest = latestByProject(jobs);
  const download = async (path: string) => {
    try { window.location.href = await downloadUrl(path); } catch { setErr("No se pudo preparar la descarga."); }
  };
  const retry = async (pid: string) => {
    if (!userId) return;
    await queueRender(pid, userId);
    await refresh();
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl p-6 md:p-10">
        <h1 className="text-3xl font-bold">Mis videos</h1>
        <p className="mt-1 text-sm text-muted-foreground">Estado de cada render. Descarga el MP4 cuando esté listo.</p>
        {!userId && <p className="mt-6 text-sm text-muted-foreground"><Link to="/login" className="text-primary">Inicia sesión</Link> para ver tus renders.</p>}
        {err && <p className="mt-4 text-sm text-destructive">{err}</p>}
        <div className="mt-8 space-y-3">
          {projects.map((p) => {
            const j = latest.get(p.id);
            const secs = p.timeline_data ? totalFrames(p.timeline_data) / p.timeline_data.fps : 0;
            const status = j?.status;
            return (
              <div key={p.id} className="card-surface flex items-center gap-4 p-4">
                <div className="grid h-20 w-12 shrink-0 place-items-center rounded-lg" style={{ background: p.timeline_data ? `linear-gradient(160deg, ${p.timeline_data.theme.backgroundColor}, ${p.timeline_data.theme.primaryColor}66)` : undefined }}>
                  <Film className="size-4 text-foreground/70" />
                </div>
                <div className="min-w-0 flex-1">
                  <Link to="/projects/$id/editor" params={{ id: p.id }} className="block truncate font-semibold hover:text-primary">{p.title}</Link>
                  <div className="text-xs text-muted-foreground">{Math.floor(secs / 60)}:{String(Math.round(secs % 60)).padStart(2, "0")} · {new Date(p.created_at).toLocaleDateString()}</div>
                  {status === "rendering" && (
                    <div className="mt-2 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-secondary"><div className="h-full bg-primary transition-all" style={{ width: `${j!.progress}%` }} /></div>
                  )}
                  {status === "failed" && j?.error && <div className="mt-1 text-xs text-destructive">{j.error}</div>}
                </div>
                <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold", tone[status ?? "queued"], !status && "opacity-60")}>
                  {status === "rendering" && <Loader2 className="size-3 animate-spin" />}
                  {status ? `${RENDER_LABEL[status]}${status === "rendering" ? ` ${j!.progress}%` : ""}` : "Borrador"}
                </span>
                {status === "completed" && j?.mp4_path && <Btn onClick={() => download(j.mp4_path!)}><Download className="size-4" /> MP4</Btn>}
                {status === "failed" && <Btn variant="outline" onClick={() => retry(p.id)}><RotateCcw className="size-4" /> Reintentar</Btn>}
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
