import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Braces, Download, Layers, Loader2 } from "lucide-react";
import { useCallback, useState } from "react";
import { RemotionPlayer } from "@/components/RemotionPlayer";
import { Btn, StatusBadge, inputCls } from "@/components/ui-kit";
import { useStudio } from "@/lib/store";
import type { Scene } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/projects/$id/editor")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Editor — MotionStudio AI" },
      { name: "description", content: "Edita escenas, textos e imágenes y previsualiza tu video 9:16." },
      { property: "og:title", content: "Editor — MotionStudio AI" },
      { property: "og:description", content: "Edita escenas, textos e imágenes y previsualiza tu video 9:16." },
    ],
  }),
  component: Editor,
});

function Editor() {
  const { id } = Route.useParams();
  const project = useStudio((s) => s.projects.find((p) => p.id === id));
  const { brandKit, updateTimeline, updateProject } = useStudio();
  const [frame, setFrame] = useState(0);
  const [seek, setSeek] = useState<number | null>(null);
  const [showJson, setShowJson] = useState(false);
  const onFrame = useCallback((f: number) => setFrame(f), []);

  if (!project?.timeline_data)
    return (
      <div className="grid min-h-screen place-items-center text-center">
        <div>
          <p className="text-muted-foreground">Proyecto no encontrado.</p>
          <Link to="/dashboard" className="mt-4 inline-block text-primary">Volver a proyectos</Link>
        </div>
      </div>
    );

  const t = project.timeline_data;
  const patchScene = (sid: string, props: Record<string, any>) =>
    updateTimeline(project.id, {
      ...t,
      scenes: t.scenes.map((s) => (s.id === sid ? { ...s, layoutProps: { ...s.layoutProps, ...props } } : s)),
    });

  const exportRender = () => {
    updateProject(project.id, { status: "rendering" });
    setTimeout(() => updateProject(project.id, { status: "completed" }), 4000);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center gap-3 border-b border-border bg-surface/60 px-4 py-3 backdrop-blur">
        <Link to="/dashboard" className="rounded-lg p-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground" aria-label="Volver"><ArrowLeft className="size-4" /></Link>
        <input value={project.title} onChange={(e) => updateProject(project.id, { title: e.target.value })} className="min-w-0 flex-1 bg-transparent font-display text-lg font-bold outline-none" />
        <StatusBadge status={project.status} />
        <Btn variant="outline" onClick={() => setShowJson((v) => !v)} className="hidden sm:inline-flex"><Braces className="size-4" /> JSON</Btn>
        <Btn onClick={exportRender} disabled={project.status === "rendering"}>
          {project.status === "rendering" ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
          {project.status === "completed" ? "Re-exportar" : "Exportar MP4"}
        </Btn>
      </header>

      <div className="grid flex-1 lg:grid-cols-[380px_1fr]">
        <aside className="max-h-[calc(100vh-61px)] space-y-3 overflow-y-auto border-r border-border p-4">
          <div className="flex items-center gap-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground"><Layers className="size-3.5" /> Inspector de escenas</div>
          {t.scenes.map((s, i) => {
            const active = frame >= s.fromFrame && frame < s.fromFrame + s.durationInFrames;
            return (
              <div key={s.id} className={cn("card-surface p-4 transition", active && "border-primary shadow-glow")}>
                <button onClick={() => setSeek(s.fromFrame + Math.random() * 0.001)} className="mb-3 flex w-full items-center justify-between text-left">
                  <span className="text-sm font-bold">{i + 1}. {s.layout}</span>
                  <span className="text-xs tabular-nums text-muted-foreground">{(s.fromFrame / t.fps).toFixed(1)}s · {(s.durationInFrames / t.fps).toFixed(1)}s</span>
                </button>
                <SceneFields scene={s} onChange={(p) => patchScene(s.id, p)} />
                {s.overlays.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {s.overlays.map((o, oi) => (
                      <span key={oi} className="rounded-md bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground">{o.component}{o.sfx && ` · ${o.sfx}`}</span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </aside>

        <section className="flex flex-col items-center justify-center gap-6 p-6">
          <RemotionPlayer timeline={t} captionStyle={brandKit.caption_style} safeZone={brandKit.safe_zone} logoUrl={brandKit.logo_url} exportUrl={project.export_url} onFrame={onFrame} seekTo={seek == null ? null : Math.floor(seek)} />
          <div className="flex w-full max-w-2xl gap-1">
            {t.scenes.map((s) => (
              <button
                key={s.id}
                onClick={() => setSeek(s.fromFrame + Math.random() * 0.001)}
                style={{ flex: s.durationInFrames }}
                className={cn("h-8 truncate rounded-md px-2 text-[11px] font-semibold transition", frame >= s.fromFrame && frame < s.fromFrame + s.durationInFrames ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground")}
              >
                {s.layout}
              </button>
            ))}
          </div>
          {showJson && (
            <pre className="card-surface max-h-80 w-full max-w-2xl overflow-auto p-4 text-xs text-muted-foreground">{JSON.stringify(t, null, 2)}</pre>
          )}
        </section>
      </div>
    </div>
  );
}

function SceneFields({ scene, onChange }: { scene: Scene; onChange: (p: Record<string, any>) => void }) {
  const p = scene.layoutProps;
  const small = cn(inputCls, "py-2 text-xs");
  if (scene.layout === "StatCard")
    return (
      <div className="grid grid-cols-[90px_1fr] gap-2">
        <input className={small} value={p.value} onChange={(e) => onChange({ value: e.target.value })} />
        <input className={small} value={p.label} onChange={(e) => onChange({ label: e.target.value })} />
      </div>
    );
  if (scene.layout === "Mockup")
    return (
      <div className="space-y-2">
        <input className={small} value={p.headline} onChange={(e) => onChange({ headline: e.target.value })} />
        <input className={small} placeholder="URL de imagen para reemplazar" value={p.imageUrl} onChange={(e) => onChange({ imageUrl: e.target.value })} />
      </div>
    );
  if (scene.layout === "BulletList")
    return (
      <div className="space-y-2">
        {(p.items as string[]).map((it, i) => (
          <input key={i} className={small} value={it} onChange={(e) => onChange({ items: (p.items as string[]).map((x, j) => (j === i ? e.target.value : x)) })} />
        ))}
      </div>
    );
  return <textarea className={cn(small, "min-h-16 resize-y")} value={p.title} onChange={(e) => onChange({ title: e.target.value })} />;
}
