import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { BrandKit, TimelineData, VideoProject } from "./types";
import type { Json } from "@/integrations/supabase/types";
import { buildTimeline } from "./timeline";

const asJson = (t: TimelineData | null): Json => t as unknown as Json;
import { supabase } from "@/integrations/supabase/client";

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
  /** UUID del usuario autenticado; null = modo local (localStorage). */
  userId: string | null;
  cloudReady: boolean;
  loadForUser: (userId: string | null) => Promise<void>;
  updateBrandKit: (p: Partial<BrandKit>) => void;
  addProject: (p: VideoProject) => void;
  updateProject: (id: string, p: Partial<VideoProject>) => void;
  updateTimeline: (id: string, t: TimelineData) => void;
  deleteProject: (id: string) => void;
}

async function fetchCloud(userId: string): Promise<{ kit: BrandKit; projects: VideoProject[] }> {
  let { data: kits } = await supabase
    .from("brand_kits")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1);

  if (!kits || kits.length === 0) {
    const { data: inserted } = await supabase
      .from("brand_kits")
      .insert({ user_id: userId, name: defaultKit.name })
      .select()
      .single();
    kits = inserted ? [inserted] : [];
  }

  const kit = (kits[0] as BrandKit | undefined) ?? defaultKit;

  const { data: rows } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return { kit, projects: (rows as unknown as VideoProject[] | null) ?? [] };
}

export const useStudio = create<State>()(
  persist(
    (set, get) => ({
      brandKit: defaultKit,
      projects: [demo],
      userId: null,
      cloudReady: false,

      loadForUser: async (userId) => {
        if (!userId) {
          set({ userId: null, cloudReady: false });
          return;
        }
        if (get().userId === userId && get().cloudReady) return;
        try {
          const { kit, projects } = await fetchCloud(userId);
          set({ userId, brandKit: kit, projects, cloudReady: true });
        } catch {
          set({ userId, cloudReady: false });
        }
      },

      updateBrandKit: (p) => {
        const kit = { ...get().brandKit, ...p };
        set({ brandKit: kit });
        const { userId } = get();
        if (userId && kit.id !== defaultKit.id) {
          void supabase.from("brand_kits").update(p).eq("id", kit.id).eq("user_id", userId);
        }
      },

      addProject: (p) => {
        set((s) => ({ projects: [p, ...s.projects] }));
        const { userId, brandKit } = get();
        if (userId) {
          void supabase.from("projects").insert({
            ...p,
            timeline_data: asJson(p.timeline_data),
            user_id: userId,
            brand_kit_id: brandKit.id !== defaultKit.id ? brandKit.id : null,
          });
        }
      },

      updateProject: (id, p) => {
        set((s) => ({ projects: s.projects.map((x) => (x.id === id ? { ...x, ...p } : x)) }));
        const { userId } = get();
        if (userId) {
          const { timeline_data, ...rest } = p;
          void supabase
            .from("projects")
            .update({ ...rest, ...(timeline_data !== undefined ? { timeline_data: asJson(timeline_data) } : {}) })
            .eq("id", id)
            .eq("user_id", userId);
        }
      },

      updateTimeline: (id, t) => {
        set((s) => ({ projects: s.projects.map((x) => (x.id === id ? { ...x, timeline_data: t } : x)) }));
        const { userId } = get();
        if (userId)
          void supabase.from("projects").update({ timeline_data: asJson(t) }).eq("id", id).eq("user_id", userId);
      },

      deleteProject: (id) => {
        set((s) => ({ projects: s.projects.filter((x) => x.id !== id) }));
        const { userId } = get();
        if (userId) void supabase.from("projects").delete().eq("id", id).eq("user_id", userId);
      },
    }),
    {
      name: "motionstudio-store",
      partialize: (s) => ({ brandKit: s.brandKit, projects: s.projects }),
    },
  ),
);
