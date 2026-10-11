import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

/** Endpoint para el worker externo de render (Remotion + HyperFrames en Node/Lambda).
 *  Auth: Authorization: Bearer RENDER_WORKER_SECRET.
 *  - {action:"next"} → reclama el siguiente render en cola y devuelve inputProps + URL de subida firmada.
 *  - {action:"update", jobId, status, progress, error?} → reporta progreso / fin. */
const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("next") }),
  z.object({
    action: z.literal("update"),
    jobId: z.string().uuid(),
    status: z.enum(["rendering", "completed", "failed"]),
    progress: z.number().int().min(0).max(100),
    error: z.string().max(500).optional(),
  }),
]);

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

export const Route = createFileRoute("/api/public/render-worker")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["RENDER_WORKER_SECRET"];
        const got = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
        if (!secret || !safeEqual(got, secret)) return new Response("Unauthorized", { status: 401 });
        const parsed = Body.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return Response.json({ error: "invalid body" }, { status: 400 });
        const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
        const body = parsed.data;

        if (body.action === "next") {
          const { data: job } = await db.from("render_jobs").select("*").eq("status", "queued").order("created_at").limit(1).maybeSingle();
          if (!job) return Response.json({ job: null });
          await db.from("render_jobs").update({ status: "rendering", updated_at: new Date().toISOString() }).eq("id", job.id).eq("status", "queued");
          const { data: project } = await db.from("projects").select("timeline_data, brand_kit_id").eq("id", job.project_id).single();
          const { data: kit } = project?.brand_kit_id
            ? await db.from("brand_kits").select("caption_style, safe_zone, logo_url").eq("id", project.brand_kit_id).maybeSingle()
            : { data: null };
          const path = `${job.user_id}/${job.id}.mp4`;
          const { data: up } = await db.storage.from("renders").createSignedUploadUrl(path, { upsert: true });
          return Response.json({
            job: { id: job.id, path, uploadUrl: up?.signedUrl ?? null },
            composition: "MotionVideo",
            inputProps: {
              timeline: project?.timeline_data,
              captionStyle: kit?.caption_style ?? "word_highlight",
              safeZone: kit?.safe_zone ?? "bottom_clean",
              logoUrl: kit?.logo_url ?? null,
            },
          });
        }

        const { data: job } = await db.from("render_jobs").select("id, user_id, project_id").eq("id", body.jobId).maybeSingle();
        if (!job) return Response.json({ error: "not found" }, { status: 404 });
        const done = body.status === "completed";
        await db.from("render_jobs").update({
          status: body.status,
          progress: done ? 100 : body.progress,
          error: body.error ?? null,
          ...(done ? { mp4_path: `${job.user_id}/${job.id}.mp4` } : {}),
          updated_at: new Date().toISOString(),
        }).eq("id", job.id);
        if (body.status !== "rendering")
          await db.from("projects").update({ status: done ? "completed" : "failed" }).eq("id", job.project_id);
        return Response.json({ ok: true });
      },
    },
  },
});
