import { describe, expect, it } from "vitest";
import { timelineFromPlan, validateTimeline, wordsFor } from "@/lib/registry";
import type { BrandKit } from "@/lib/types";

const kit: BrandKit = { id: "k", name: "k", primary_color: "#0066FF", accent_color: "#f00", background_color: "#000", font_family: "Inter", caption_style: "word_highlight", logo_url: null, safe_zone: "center" };
const scene = (startWord: number, layout: string) => ({ startWord, layout, title: "Hola", value: null, label: null, headline: null, items: null, overlay: null, emoji: null });

describe("Scene Director validation", () => {
  const words = wordsFor("uno dos tres cuatro cinco seis", "moderate");

  it("rejects components not in the registry", () => {
    const t = timelineFromPlan({ scenes: [scene(0, "HookTitle")] }, words, kit, false);
    t.scenes[0]!.layout = "Inventado";
    expect(validateTimeline(t).ok).toBe(false);
  });

  it("rejects overlapping scenes", () => {
    const t = timelineFromPlan({ scenes: [scene(0, "HookTitle"), scene(3, "QuoteCard")] }, words, kit, false);
    t.scenes[1]!.fromFrame = t.scenes[0]!.fromFrame + 1;
    expect(validateTimeline(t).ok).toBe(false);
  });

  it("builds back-to-back scenes from word indices", () => {
    const t = timelineFromPlan({ scenes: [scene(3, "QuoteCard"), scene(0, "HookTitle")] }, words, kit, false);
    expect(t.scenes).toHaveLength(2);
    expect(t.scenes[1]!.fromFrame).toBe(t.scenes[0]!.fromFrame + t.scenes[0]!.durationInFrames);
  });
});
