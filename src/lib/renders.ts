import { supabase } from "@/integrations/supabase/client";

export type RenderStatus = "queued" | "rendering" | "completed" | "failed";
export type RenderJob = {
  id: string;
  project_id: string;
  status: RenderStatus;
  progress: number;
  mp4_path: string | null;
  error: string | null;
  created_at: string;
};

export const RENDER_LABEL: Record<RenderStatus, string> = {
  queued: "En cola",
  rendering: "Renderizando",
  completed: "Listo",
  failed: "Error",
};

/** Hay que seguir consultando mientras algún render no haya terminado. */
export function hasActiveRenders(jobs: Pick<RenderJob, "status">[]) {
  return jobs.some((j) => j.status === "queued" || j.status === "rendering");
}

/** Último render de cada proyecto. */
export function latestByProject(jobs: RenderJob[]) {
  const m = new Map<string, RenderJob>();
  for (const j of jobs) {
    const cur = m.get(j.project_id);
    if (!cur || j.created_at > cur.created_at) m.set(j.project_id, j);
  }
  return m;
}

export async function queueRender(projectId: string, userId: string) {
  const { error } = await supabase.from("render_jobs").insert({ project_id: projectId, user_id: userId });
  if (error) throw error;
}

export async function listRenders(): Promise<RenderJob[]> {
  const { data, error } = await supabase.from("render_jobs").select("id, project_id, status, progress, mp4_path, error, created_at").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as RenderJob[];
}

export async function downloadUrl(path: string) {
  const { data, error } = await supabase.storage.from("renders").createSignedUrl(path, 3600, { download: true });
  if (error) throw error;
  return data.signedUrl;
}
