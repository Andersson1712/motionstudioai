import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { BrandKit, TimelineData, VideoProject } from "./types";
import { buildTimeline } from "./timeline";

const defaultKit: BrandKit = {
  id: "kit-default",
  name: "Mi Marca",
  primary_color: "#C6F432",
  accent_color: "#FF6B3D",
  background_color: "#111318",
  font_family: "Inter",
  caption_style: "word_highlight",
  logo_url: null,
  safe_zone: "bottom_clean",
};

const demoScript =
  "Deja de editar a mano. Esta IA crea tus Reels en segundos. El 80% de los videos virales usan subtítulos dinámicos. Configura tu marca una vez. Y publica todos los días.";

const demo: VideoProject = {
  id: "demo-1",
  brand_kit_id: defaultKit.id,
  title: "Lanzamiento MotionStudio",
  mode: "full_animated",
  status: "timeline_ready",
  raw_video_url: null,
  script_text: demoScript,
  audio_url: null,
  voice_id: "elevenlabs_default",
  visual_density: "moderate",
  sfx_enabled: true,
  timeline_data: buildTimeline(demoScript, defaultKit, "moderate", true),
  export_url: null,
  created_at: new Date().toISOString(),
};

interface State {
  brandKit: BrandKit;
  projects: VideoProject[];
  updateBrandKit: (p: Partial<BrandKit>) => void;
  addProject: (p: VideoProject) => void;
  updateProject: (id: string, p: Partial<VideoProject>) => void;
  updateTimeline: (id: string, t: TimelineData) => void;
  deleteProject: (id: string) => void;
}

export const useStudio = create<State>()(
  persist(
    (set) => ({
      brandKit: defaultKit,
      projects: [demo],
      updateBrandKit: (p) => set((s) => ({ brandKit: { ...s.brandKit, ...p } })),
      addProject: (p) => set((s) => ({ projects: [p, ...s.projects] })),
      updateProject: (id, p) =>
        set((s) => ({ projects: s.projects.map((x) => (x.id === id ? { ...x, ...p } : x)) })),
      updateTimeline: (id, t) =>
        set((s) => ({ projects: s.projects.map((x) => (x.id === id ? { ...x, timeline_data: t } : x)) })),
      deleteProject: (id) => set((s) => ({ projects: s.projects.filter((x) => x.id !== id) })),
    }),
    { name: "motionstudio-store" },
  ),
);
