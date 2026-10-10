import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import { VerticalPlayer } from "@/components/VerticalPlayer";
import { Choice, Field, inputCls } from "@/components/ui-kit";
import { useStudio } from "@/lib/store";
import { buildTimeline } from "@/lib/timeline";
import type { CaptionStyle, SafeZone } from "@/lib/types";

export const Route = createFileRoute("/settings/brand-kit")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Brand Kit — MotionStudio AI" },
      { name: "description", content: "Define colores, tipografía y estilo de subtítulos de tu marca." },
      { property: "og:title", content: "Brand Kit — MotionStudio AI" },
      { property: "og:description", content: "Define colores, tipografía y estilo de subtítulos de tu marca." },
    ],
  }),
  component: BrandKitPage,
});

const fonts = ["Inter", "Sora", "Manrope", "Bebas Neue", "Montserrat", "Space Grotesk"];
const captionStyles: { v: CaptionStyle; l: string; d: string }[] = [
  { v: "word_highlight", l: "Word Highlight", d: "Palabra activa en color" },
  { v: "box_minimal", l: "Box Minimal", d: "Caja sólida por palabra" },
  { v: "kinetic_pop", l: "Kinetic Pop", d: "Rebote y rotación" },
];

function BrandKitPage() {
  const { brandKit: k, updateBrandKit } = useStudio();
  const preview = useMemo(
    () => buildTimeline("Tu marca en cada video. El 92% recuerda colores consistentes. Así se ve tu estilo.", k, "moderate", false),
    [k],
  );
  const color = (key: "primary_color" | "accent_color" | "background_color", label: string) => (
    <Field label={label}>
      <div className="flex items-center gap-2 rounded-xl border border-input bg-surface p-1.5">
        <input type="color" value={k[key]} onChange={(e) => updateBrandKit({ [key]: e.target.value })} className="size-9 cursor-pointer rounded-lg border-0 bg-transparent" />
        <input value={k[key]} onChange={(e) => updateBrandKit({ [key]: e.target.value })} className="w-full bg-transparent font-mono text-sm uppercase outline-none" />
      </div>
    </Field>
  );
  return (
    <AppShell>
      <div className="mx-auto grid max-w-6xl gap-10 p-6 md:p-10 lg:grid-cols-[1fr_380px]">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold">Brand Kit</h1>
            <p className="mt-1 text-sm text-muted-foreground">Los cambios se guardan automáticamente y se aplican a nuevos videos.</p>
          </div>
          <Field label="Nombre del kit">
            <input className={inputCls} value={k.name} onChange={(e) => updateBrandKit({ name: e.target.value })} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            {color("primary_color", "Primario")}
            {color("accent_color", "Acento")}
            {color("background_color", "Fondo")}
          </div>
          <Field label="Tipografía">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {fonts.map((f) => (
                <Choice key={f} active={k.font_family === f} onClick={() => updateBrandKit({ font_family: f })} className="p-3">
                  <span className="text-lg font-bold" style={{ fontFamily: f }}>{f}</span>
                </Choice>
              ))}
            </div>
          </Field>
          <Field label="Estilo de subtítulos">
            <div className="grid gap-2 sm:grid-cols-3">
              {captionStyles.map((c) => (
                <Choice key={c.v} active={k.caption_style === c.v} onClick={() => updateBrandKit({ caption_style: c.v })}>
                  <div className="font-semibold">{c.l}</div>
                  <div className="text-xs text-muted-foreground">{c.d}</div>
                </Choice>
              ))}
            </div>
          </Field>
          <Field label="Zona segura de subtítulos">
            <div className="grid grid-cols-2 gap-2">
              {(["center", "bottom_clean"] as SafeZone[]).map((z) => (
                <Choice key={z} active={k.safe_zone === z} onClick={() => updateBrandKit({ safe_zone: z })}>
                  <div className="font-semibold">{z === "center" ? "Centro" : "Inferior limpio"}</div>
                  <div className="text-xs text-muted-foreground">{z === "center" ? "Máxima visibilidad" : "Evita la UI de la app"}</div>
                </Choice>
              ))}
            </div>
          </Field>
          <Field label="Logo (URL)" hint="Se muestra en la esquina superior del video.">
            <input className={inputCls} placeholder="https://…/logo.png" value={k.logo_url ?? ""} onChange={(e) => updateBrandKit({ logo_url: e.target.value || null })} />
          </Field>
        </div>
        <div className="lg:sticky lg:top-10 lg:self-start">
          <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Vista previa en vivo</div>
          <VerticalPlayer timeline={preview} captionStyle={k.caption_style} safeZone={k.safe_zone} logoUrl={k.logo_url} />
        </div>
      </div>
    </AppShell>
  );
}
