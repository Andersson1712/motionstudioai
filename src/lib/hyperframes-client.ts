import { generateHyperframe } from "./hyperframes.functions";
import type { Scene, TimelineData } from "./types";

export function sceneText(s: Scene) {
  const p = s.layoutProps;
  if (s.layout === "StatCard") return `${p.value ?? ""} — ${p.label ?? ""}`;
  if (s.layout === "Mockup") return String(p.headline ?? "");
  if (s.layout === "BulletList") return ((p.items as string[]) ?? []).join(" · ");
  return String(p.title ?? "");
}

export async function hyperframeFor(s: Scene, t: TimelineData) {
  const { html } = await generateHyperframe({
    data: { text: sceneText(s), layout: s.layout, seconds: s.durationInFrames / t.fps, theme: t.theme },
  });
  return html;
}

/** Genera la animación HyperFrames de cada escena (4 en paralelo). Las que fallan conservan la animación Remotion. */
export async function addHyperframes(t: TimelineData, onProgress?: (done: number, total: number) => void) {
  const scenes = [...t.scenes];
  let next = 0;
  let done = 0;
  const worker = async () => {
    while (next < scenes.length) {
      const i = next++;
      const s = scenes[i]!;
      try {
        scenes[i] = { ...s, layoutProps: { ...s.layoutProps, hyperframe: await hyperframeFor(s, t) } };
      } catch (e) {
        console.error("HyperFrame escena", i + 1, e);
      }
      onProgress?.(++done, scenes.length);
    }
  };
  await Promise.all(Array.from({ length: 4 }, worker));
  return { ...t, scenes };
}
