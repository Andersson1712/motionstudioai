import { describe, expect, it } from "vitest";
import { validateHyperframe } from "@/lib/hyperframes";
import { hasActiveRenders, latestByProject, type RenderJob } from "@/lib/renders";

const ok = `<style>@keyframes a{from{opacity:0}to{opacity:1}} .t{animation:a 1s both}</style><div class="t">Hola</div>`;

describe("HyperFrames validation", () => {
  it("accepts animated HTML", () => expect(validateHyperframe(ok).ok).toBe(true));
  it("rejects scripts", () => expect(validateHyperframe(ok + "<script>alert(1)</script>").ok).toBe(false));
  it("rejects external resources", () => expect(validateHyperframe(ok + '<img src="https://x.com/a.png">').ok).toBe(false));
  it("rejects inline events", () => expect(validateHyperframe(ok + '<div onclick="x()">').ok).toBe(false));
  it("rejects HTML without animation", () => expect(validateHyperframe("<div>hola</div>").ok).toBe(false));
});

describe("render status", () => {
  const j = (id: string, project_id: string, status: RenderJob["status"], created_at: string): RenderJob =>
    ({ id, project_id, status, progress: 0, mp4_path: null, error: null, created_at });
  it("polls while queued or rendering", () => {
    expect(hasActiveRenders([j("1", "p", "queued", "a")])).toBe(true);
    expect(hasActiveRenders([j("1", "p", "completed", "a"), j("2", "p", "failed", "b")])).toBe(false);
  });
  it("picks the newest render per project", () => {
    const m = latestByProject([j("old", "p", "failed", "2026-01-01"), j("new", "p", "queued", "2026-02-01")]);
    expect(m.get("p")?.id).toBe("new");
  });
});
