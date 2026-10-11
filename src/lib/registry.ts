import { z } from "zod";
import type { AlignedWord, BrandKit, Scene, TimelineData, VisualDensity } from "./types";

/** ComponentRegistry: componentes que existen en el reproductor y en la composición Remotion. */
export const LAYOUTS = {
  HookTitle: { description: "Título grande de gancho. Ideal para la primera escena.", props: z.object({ title: z.string().min(1) }) },
  StatCard: { description: "Dato o cifra destacada con etiqueta.", props: z.object({ value: z.string().min(1), label: z.string() }) },
  Mockup: { description: "Pantalla/producto con titular corto.", props: z.object({ headline: z.string().min(1), imageUrl: z.string() }) },
  BulletList: { description: "Lista de 2-4 puntos cortos.", props: z.object({ items: z.array(z.string().min(1)).min(2).max(4) }) },
  QuoteCard: { description: "Frase o cita destacada.", props: z.object({ title: z.string().min(1) }) },
} as const;
export const OVERLAYS = {
  EmojiBurst: { description: "Emoji que aparece con rebote.", props: z.object({ emoji: z.string().min(1) }) },
  ProgressBar: { description: "Barra de progreso superior.", props: z.object({}).passthrough() },
} as const;
export type LayoutName = keyof typeof LAYOUTS;
export type OverlayName = keyof typeof OVERLAYS;
export const LAYOUT_NAMES = Object.keys(LAYOUTS) as LayoutName[];
export const OVERLAY_NAMES = Object.keys(OVERLAYS) as OverlayName[];

export function catalogForPrompt() {
  const l = LAYOUT_NAMES.map((n) => `- ${n}: ${LAYOUTS[n].description}`).join("\n");
  const o = OVERLAY_NAMES.map((n) => `- ${n}: ${OVERLAYS[n].description}`).join("\n");
  return `Layouts:\n${l}\n\nOverlays:\n${o}`;
}

/** Plan devuelto por el Scene Director (en índices de palabra, no frames). */
export type ScenePlan = {
  scenes: {
    startWord: number;
    layout: string;
    title: string | null;
    value: string | null;
    label: string | null;
    headline: string | null;
    items: string[] | null;
    overlay: string | null;
    emoji: string | null;
  }[];
};

const FPS = 30;
const uid = () => Math.random().toString(36).slice(2, 10);

/** Palabras con tiempos: reales (voz) o estimadas por ritmo. */
export function wordsFor(script: string, density: VisualDensity, aligned?: AlignedWord[]): AlignedWord[] {
  if (aligned?.length) return aligned;
  const step = (density === "intense" ? 9 : 11) / FPS;
  return script.split(/\s+/).filter(Boolean).map((w, i) => ({ word: w, start: i * step, end: (i + 1) * step }));
}

function propsFor(layout: LayoutName, s: ScenePlan["scenes"][number], text: string) {
  switch (layout) {
    case "StatCard": return { value: s.value || "100%", label: s.label ?? text };
    case "Mockup": return { headline: s.headline || text, imageUrl: "" };
    case "BulletList": {
      const items = (s.items ?? []).filter(Boolean).slice(0, 4);
      return { items: items.length >= 2 ? items : [text, "Paso clave"] };
    }
    default: return { title: s.title || text };
  }
}

/** Convierte el plan en timeline (frames desde la alineación) y lo valida contra el registro. */
export function timelineFromPlan(
  plan: ScenePlan,
  words: AlignedWord[],
  kit: BrandKit,
  sfx: boolean,
  voiceoverUrl = "",
): TimelineData {
  const toF = (s: number) => Math.round(s * FPS);
  const starts = [...new Set(plan.scenes.map((s) => Math.max(0, Math.min(words.length - 1, Math.floor(s.startWord)))))];
  const byStart = new Map(plan.scenes.map((s) => [Math.max(0, Math.min(words.length - 1, Math.floor(s.startWord))), s]));
  starts.sort((a, b) => a - b);
  if (starts[0] !== 0) starts.unshift(0);
  const endFrame = toF(words.at(-1)?.end ?? 0) + 15;

  const scenes: Scene[] = starts.map((w0, i) => {
    const w1 = starts[i + 1] ?? words.length;
    const from = i === 0 ? 0 : toF(words[w0]!.start);
    const to = w1 < words.length ? toF(words[w1]!.start) : endFrame;
    const text = words.slice(w0, w1).map((w) => w.word).join(" ");
    const p = byStart.get(w0) ?? byStart.get(starts[0]!) ?? plan.scenes[0]!;
    const layout: LayoutName = (LAYOUT_NAMES as string[]).includes(p.layout) ? (p.layout as LayoutName) : i === 0 ? "HookTitle" : "QuoteCard";
    const dur = Math.max(1, to - from);
    const ov = p.overlay && (OVERLAY_NAMES as string[]).includes(p.overlay) ? (p.overlay as OverlayName) : null;
    return {
      id: uid(),
      fromFrame: from,
      durationInFrames: dur,
      layout,
      layoutProps: propsFor(layout, p, text),
      overlays: ov
        ? [{ component: ov, fromFrame: from + Math.min(10, dur - 1), durationInFrames: Math.max(1, Math.min(30, dur - 10)), props: ov === "EmojiBurst" ? { emoji: p.emoji || "🔥" } : {}, sfx: sfx ? (ov === "EmojiBurst" ? "whoosh" : "pop") : "" }]
        : [],
    };
  });

  const timeline: TimelineData = {
    fps: FPS,
    width: 1080,
    height: 1920,
    theme: { primaryColor: kit.primary_color, accentColor: kit.accent_color, backgroundColor: kit.background_color, fontFamily: kit.font_family },
    audioTrack: { voiceoverUrl, bgmUrl: "", bgmVolume: 0.2 },
    scenes,
    captions: words.map((w) => ({ word: w.word, startFrame: toF(w.start), endFrame: Math.max(toF(w.end), toF(w.start) + 1) })),
  };
  const check = validateTimeline(timeline);
  if (!check.ok) throw new Error(`Timeline inválido: ${check.errors.join("; ")}`);
  return timeline;
}

/** Validación del paso 4: componentes del registro y escenas sin solaparse. */
export function validateTimeline(t: TimelineData): { ok: true } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  t.scenes.forEach((s, i) => {
    const def = LAYOUTS[s.layout as LayoutName];
    if (!def) errors.push(`Escena ${i + 1}: layout desconocido "${s.layout}"`);
    else if (!def.props.safeParse(s.layoutProps).success) errors.push(`Escena ${i + 1}: props inválidas para ${s.layout}`);
    if (s.durationInFrames <= 0) errors.push(`Escena ${i + 1}: duración inválida`);
    const prev = t.scenes[i - 1];
    if (prev && s.fromFrame < prev.fromFrame + prev.durationInFrames) errors.push(`Escena ${i + 1} se solapa con la anterior`);
    s.overlays.forEach((o) => {
      const od = OVERLAYS[o.component as OverlayName];
      if (!od || !od.props.safeParse(o.props).success) errors.push(`Escena ${i + 1}: overlay inválido "${o.component}"`);
      if (o.fromFrame < s.fromFrame || o.fromFrame + o.durationInFrames > s.fromFrame + s.durationInFrames)
        errors.push(`Escena ${i + 1}: overlay fuera de la escena`);
    });
  });
  return errors.length ? { ok: false, errors } : { ok: true };
}
