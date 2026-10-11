import { checkMusic, getSfxLibrary, startMusic } from "./audio.functions";
import type { TimelineData } from "./types";

/** Pone el enlace del efecto en cada overlay que tenga sfx (whoosh/pop). */
export function applySfx(t: TimelineData, lib: Record<string, string>): TimelineData {
  return {
    ...t,
    scenes: t.scenes.map((s) => ({
      ...s,
      overlays: s.overlays.map((o) => (o.sfx && lib[o.sfx] ? { ...o, props: { ...o.props, sfxUrl: lib[o.sfx] } } : o)),
    })),
  };
}

export async function withSfx(t: TimelineData) {
  return applySfx(t, await getSfxLibrary());
}

/** Genera la música con Suno y espera a que esté lista (hasta ~6 min). */
export async function generateMusic(prompt: string, onTick?: (secs: number) => void) {
  const { taskId } = await startMusic({ data: { prompt } });
  const started = Date.now();
  while (Date.now() - started < 6 * 60_000) {
    await new Promise((r) => setTimeout(r, 8000));
    onTick?.(Math.round((Date.now() - started) / 1000));
    const r = await checkMusic({ data: { taskId } });
    if (r.status === "ready") return r.url;
    if (r.status === "failed") throw new Error(r.error);
  }
  throw new Error("Suno tardó demasiado");
}
