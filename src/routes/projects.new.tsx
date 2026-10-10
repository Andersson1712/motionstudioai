import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check, Film, Loader2, Sparkles, Upload, Wand2 } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Btn, Choice, Field, inputCls } from "@/components/ui-kit";
import { useStudio } from "@/lib/store";
import { generateScript } from "@/lib/scripts.functions";
import { buildTimeline, draftScriptFromIdea } from "@/lib/timeline";
import type { ProjectMode, VisualDensity } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/projects/new")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Nuevo video — MotionStudio AI" },
      { name: "description", content: "Crea un video vertical en tres pasos: modo, contenido y parámetros." },
      { property: "og:title", content: "Nuevo video — MotionStudio AI" },
      { property: "og:description", content: "Crea un video vertical en tres pasos: modo, contenido y parámetros." },
    ],
  }),
  component: NewProject,
});

const voices = [
  { id: "elevenlabs_default", l: "Narrador neutro" },
  { id: "elevenlabs_energetic", l: "Energético" },
  { id: "elevenlabs_calm", l: "Calmado" },
  { id: "elevenlabs_female_es", l: "Voz femenina ES" },
];
const steps = ["Modo", "Contenido", "Parámetros"];

function NewProject() {
  const nav = useNavigate();
  const { brandKit, addProject } = useStudio();
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<ProjectMode>("full_animated");
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [idea, setIdea] = useState("");
  const [script, setScript] = useState("");
  const [voice, setVoice] = useState(voices[0]!.id);
  const [density, setDensity] = useState<VisualDensity>("moderate");
  const [sfx, setSfx] = useState(true);
  const [busy, setBusy] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);
  const userId = useStudio((s) => s.userId);

  const redactar = async () => {
    setDrafting(true);
    setDraftError(null);
    try {
      const { script: aiScript } = await generateScript({ data: { idea: idea.trim(), mode } });
      setScript(aiScript);
    } catch {
      setDraftError(
        userId
          ? "No se pudo generar el guion con IA. Inténtalo de nuevo."
          : "Inicia sesión para generar el guion con IA.",
      );
    } finally {
      setDrafting(false);
    }
  };

  const canNext = step === 0 || (step === 1 && (mode === "talking_head" ? !!file || script.trim() : script.trim() || idea.trim()));

  const generate = async () => {
    setBusy(true);
    await new Promise((r) => setTimeout(r, 1200));
    const finalScript = script.trim() || draftScriptFromIdea(idea);
    const id = crypto.randomUUID();
    addProject({
      id,
      brand_kit_id: brandKit.id,
      title: title.trim() || idea.slice(0, 40) || "Video sin título",
      mode,
      status: "timeline_ready",
      raw_video_url: file ? URL.createObjectURL(file) : null,
      script_text: finalScript,
      audio_url: null,
      voice_id: voice,
      visual_density: density,
      sfx_enabled: sfx,
      timeline_data: buildTimeline(finalScript, brandKit, density, sfx),
      export_url: null,
      created_at: new Date().toISOString(),
    });
    nav({ to: "/projects/$id/editor", params: { id } });
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl p-6 md:p-10">
        <h1 className="text-3xl font-bold">Nuevo video</h1>
        <div className="mt-6 flex items-center gap-2">
          {steps.map((s, i) => (
            <div key={s} className="flex flex-1 items-center gap-2">
              <div className={cn("grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold transition", i < step ? "bg-primary text-primary-foreground" : i === step ? "bg-primary/20 text-primary ring-2 ring-primary" : "bg-secondary text-muted-foreground")}>
                {i < step ? <Check className="size-3.5" /> : i + 1}
              </div>
              <span className={cn("text-sm font-medium", i === step ? "text-foreground" : "text-muted-foreground")}>{s}</span>
              {i < steps.length - 1 && <div className={cn("h-px flex-1", i < step ? "bg-primary" : "bg-border")} />}
            </div>
          ))}
        </div>

        <div key={step} className="card-surface animate-slide-up mt-8 space-y-6 p-6">
          {step === 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Choice active={mode === "talking_head"} onClick={() => setMode("talking_head")} className="p-6">
                <Film className="size-6 text-primary" />
                <div className="mt-4 font-bold">Edición de Video Crudo</div>
                <p className="mt-1 text-sm text-muted-foreground">Sube tu clip hablando a cámara. Añadimos subtítulos, zooms y overlays.</p>
              </Choice>
              <Choice active={mode === "full_animated"} onClick={() => setMode("full_animated")} className="p-6">
                <Wand2 className="size-6 text-accent" />
                <div className="mt-4 font-bold">Animación Explicativa desde Cero</div>
                <p className="mt-1 text-sm text-muted-foreground">Escribe una idea; la IA arma guion, escenas y voz en off.</p>
              </Choice>
            </div>
          )}

          {step === 1 && (
            <>
              <Field label="Título del proyecto">
                <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej. 3 trucos de productividad" />
              </Field>
              {mode === "talking_head" && (
                <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-surface p-10 text-center transition hover:border-primary">
                  <Upload className="size-6 text-primary" />
                  <span className="text-sm font-semibold">{file ? file.name : "Arrastra o selecciona un MP4"}</span>
                  <span className="text-xs text-muted-foreground">Vertical recomendado · máx. 500MB</span>
                  <input type="file" accept="video/mp4" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                </label>
              )}
              {mode === "full_animated" && (
                <Field label="Idea" hint="La IA la convertirá en un guion de 20-40 segundos.">
                  <div className="flex gap-2">
                    <input className={inputCls} value={idea} onChange={(e) => setIdea(e.target.value)} placeholder="Ej. Por qué el café frío es tendencia" />
                    <Btn variant="outline" type="button" disabled={!idea.trim() || drafting} onClick={redactar}>
                      {drafting ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                      {drafting ? "Redactando…" : "Redactar"}
                    </Btn>
                  </div>
                  {draftError && <p className="mt-2 text-sm text-destructive">{draftError}</p>}
                </Field>
              )}
              <Field label="Guion (opcional)">
                <textarea className={cn(inputCls, "min-h-36 resize-y")} value={script} onChange={(e) => setScript(e.target.value)} placeholder="Escribe o pega tu guion aquí…" />
              </Field>
            </>
          )}

          {step === 2 && (
            <>
              <Field label="Preset de marca">
                <div className="flex items-center gap-3 rounded-xl border border-input bg-surface p-3">
                  {[brandKit.primary_color, brandKit.accent_color, brandKit.background_color].map((c) => (
                    <span key={c} className="size-6 rounded-full border border-border" style={{ background: c }} />
                  ))}
                  <span className="text-sm font-semibold">{brandKit.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{brandKit.font_family}</span>
                </div>
              </Field>
              <Field label="Voz del locutor">
                <select className={inputCls} value={voice} onChange={(e) => setVoice(e.target.value)}>
                  {voices.map((v) => <option key={v.id} value={v.id}>{v.l}</option>)}
                </select>
              </Field>
              <Field label="Ritmo / densidad visual">
                <div className="grid grid-cols-3 gap-2">
                  {(["minimal", "moderate", "intense"] as VisualDensity[]).map((d) => (
                    <Choice key={d} active={density === d} onClick={() => setDensity(d)} className="p-3 text-center">
                      <span className="text-sm font-semibold">{{ minimal: "Mínimo", moderate: "Moderado", intense: "Intenso" }[d]}</span>
                    </Choice>
                  ))}
                </div>
              </Field>
              <button type="button" onClick={() => setSfx(!sfx)} className="flex w-full items-center justify-between rounded-xl border border-input bg-surface p-4">
                <div className="text-left">
                  <div className="text-sm font-semibold">Efectos de sonido (SFX)</div>
                  <div className="text-xs text-muted-foreground">Whoosh y pops en transiciones</div>
                </div>
                <span className={cn("relative h-6 w-11 rounded-full transition", sfx ? "bg-primary" : "bg-secondary")}>
                  <span className={cn("absolute top-0.5 size-5 rounded-full bg-foreground transition-all", sfx ? "left-5.5" : "left-0.5")} />
                </span>
              </button>
            </>
          )}
        </div>

        <div className="mt-6 flex justify-between">
          <Btn variant="ghost" onClick={() => setStep((s) => s - 1)} disabled={step === 0 || busy}>
            <ArrowLeft className="size-4" /> Atrás
          </Btn>
          {step < 2 ? (
            <Btn onClick={() => setStep((s) => s + 1)} disabled={!canNext}>
              Siguiente <ArrowRight className="size-4" />
            </Btn>
          ) : (
            <Btn onClick={generate} disabled={busy}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              {busy ? "Generando timeline…" : "Generar video"}
            </Btn>
          )}
        </div>
      </div>
    </AppShell>
  );
}
