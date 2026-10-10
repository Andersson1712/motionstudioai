import type { AlignedWord, BrandKit, Scene, TimelineData, VisualDensity } from "./types";

const uid = () => Math.random().toString(36).slice(2, 10);

const FPS = 30;

export type Voiceover = { audioUrl: string; words: AlignedWord[] };

/** Splits a script into sentences and builds a timeline matching the JSON contract.
 *  With a voiceover, captions and scene timing follow the real word-by-word alignment. */
export function buildTimeline(
  script: string,
  kit: BrandKit,
  density: VisualDensity,
  sfx: boolean,
  voiceover?: Voiceover,
): TimelineData {
  const allSentences = script
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const sentences = voiceover ? allSentences : allSentences.slice(0, 8);
  const layouts = ["HookTitle", "StatCard", "Mockup", "BulletList", "QuoteCard"];
  const overlayCount = density === "minimal" ? 0 : density === "moderate" ? 1 : 2;
  const aw = voiceover?.words ?? [];
  const toF = (s: number) => Math.round(s * FPS);
  let wIdx = 0;

  let cursor = 0;
  const captions: TimelineData["captions"] = [];
  const scenes: Scene[] = sentences.map((text, i) => {
    const words = text.split(/\s+/);
    const framesPerWord = density === "intense" ? 9 : 11;
    let duration = Math.max(60, words.length * framesPerWord + 15);
    if (aw.length) {
      const chunk = aw.slice(wIdx, wIdx + words.length);
      wIdx += words.length;
      chunk.forEach((w) => captions.push({ word: w.word, startFrame: toF(w.start), endFrame: Math.max(toF(w.end), toF(w.start) + 1) }));
      const next = aw[wIdx];
      const end = next ? toF(next.start) : toF(chunk.at(-1)?.end ?? 0) + 15;
      duration = Math.max(1, end - cursor);
    } else {
      words.forEach((w, wi) => {
        captions.push({
          word: w,
          startFrame: cursor + wi * framesPerWord,
          endFrame: cursor + (wi + 1) * framesPerWord,
        });
      });
    }
    const layout: string = i === 0 ? "HookTitle" : layouts[i % layouts.length]!;
    const layoutProps: Record<string, any> =
      layout === "StatCard"
        ? { value: `${(i * 17 + 23) % 97}%`, label: words.slice(0, 5).join(" ") }
        : layout === "Mockup"
          ? { headline: words.slice(0, 4).join(" "), imageUrl: "" }
          : layout === "BulletList"
            ? { items: [words.slice(0, 3).join(" "), words.slice(3, 6).join(" ") || "Paso clave"] }
            : { title: text };
    const scene: Scene = {
      id: uid(),
      fromFrame: cursor,
      durationInFrames: duration,
      layout,
      layoutProps,
      overlays: Array.from({ length: overlayCount }, (_, oi) => ({
        component: oi === 0 ? "EmojiBurst" : "ProgressBar",
        fromFrame: cursor + 10 + oi * 20,
        durationInFrames: 30,
        props: { emoji: ["🔥", "⚡", "🚀", "💡"][(i + oi) % 4] },
        sfx: sfx ? (oi === 0 ? "whoosh" : "pop") : "",
      })),
    };
    cursor += duration;
    return scene;
  });

  return {
    fps: FPS,
    width: 1080,
    height: 1920,
    theme: {
      primaryColor: kit.primary_color,
      accentColor: kit.accent_color,
      backgroundColor: kit.background_color,
      fontFamily: kit.font_family,
    },
    audioTrack: { voiceoverUrl: "", bgmUrl: "", bgmVolume: 0.2 },
    scenes,
    captions,
  };
}

export function totalFrames(t: TimelineData) {
  return t.scenes.reduce((m, s) => Math.max(m, s.fromFrame + s.durationInFrames), 0);
}

/** Expands an idea into a short demo script (placeholder until AI is connected). */
export function draftScriptFromIdea(idea: string) {
  const topic = idea.trim() || "tu producto";
  return `¿Sabías esto sobre ${topic}? La mayoría lo ignora. El 73% de los creadores pierde audiencia en 3 segundos. Aquí tienes la solución en tres pasos. Primero, engancha con una pregunta. Segundo, muestra un dato real. Sígueme para más.`;
}
