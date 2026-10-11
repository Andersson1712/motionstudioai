import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const SUNO = "https://api.sunoapi.org/api/v1";
const SFX_PROMPTS: Record<string, string> = {
  whoosh: "fast cinematic whoosh transition, clean, short",
  pop: "soft bubbly UI pop, playful, short",
};
const MONTH = 60 * 60 * 24 * 30;

/** Efectos de sonido (ElevenLabs Sound Effects). Se generan una vez por usuario y se reutilizan. */
export const getSfxLibrary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const key = process.env["ELEVENLABS_API_KEY"];
    if (!key) throw new Error("ElevenLabs no está conectado");
    const store = context.supabase.storage.from("voiceovers");
    const { data: existing } = await store.list(`${context.userId}/sfx`);
    const have = new Set((existing ?? []).map((f) => f.name));
    const out: Record<string, string> = {};
    for (const [name, text] of Object.entries(SFX_PROMPTS)) {
      const path = `${context.userId}/sfx/${name}.mp3`;
      if (!have.has(`${name}.mp3`)) {
        const res = await fetch("https://api.elevenlabs.io/v1/sound-generation", {
          method: "POST",
          headers: { "xi-api-key": key, "content-type": "application/json" },
          body: JSON.stringify({ text, duration_seconds: 1, prompt_influence: 0.6 }),
        });
        if (!res.ok) {
          console.error(`SFX [${res.status}]: ${await res.text()}`);
          throw new Error(`No se pudo generar el efecto (${res.status})`);
        }
        const up = await store.upload(path, new Uint8Array(await res.arrayBuffer()), { contentType: "audio/mpeg", upsert: true });
        if (up.error) throw new Error("No se pudo guardar el efecto");
      }
      const s = await store.createSignedUrl(path, MONTH);
      if (s.data) out[name] = s.data.signedUrl;
    }
    return out;
  });

function sunoKey() {
  const k = process.env["SUNO_API_KEY"];
  if (!k) throw new Error("Suno no está configurado");
  return k;
}

/** Inicia una pista instrumental de fondo en Suno. */
export const startMusic = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { prompt: string }) => ({ prompt: String(input?.prompt ?? "").slice(0, 400) }))
  .handler(async ({ data }) => {
    const origin = new URL(getRequest().url).origin;
    const res = await fetch(`${SUNO}/generate`, {
      method: "POST",
      headers: { Authorization: `Bearer ${sunoKey()}`, "content-type": "application/json" },
      body: JSON.stringify({
        prompt: data.prompt || "upbeat modern background music for a short social video, instrumental",
        customMode: false,
        instrumental: true,
        model: "V4_5",
        callBackUrl: `${origin}/api/public/suno-callback`,
      }),
    });
    const json = (await res.json().catch(() => null)) as { code?: number; msg?: string; data?: { taskId?: string } } | null;
    if (!res.ok || json?.code !== 200 || !json.data?.taskId) {
      console.error("Suno generate", res.status, json);
      throw new Error(json?.msg ? `Suno: ${json.msg}` : `Suno respondió ${res.status}`);
    }
    return { taskId: json.data.taskId };
  });

/** Consulta la pista; cuando está lista la guarda en tu almacenamiento y devuelve un enlace. */
export const checkMusic = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { taskId: string }) => ({ taskId: String(input?.taskId ?? "").slice(0, 100) }))
  .handler(async ({ data, context }) => {
    const res = await fetch(`${SUNO}/generate/record-info?taskId=${encodeURIComponent(data.taskId)}`, {
      headers: { Authorization: `Bearer ${sunoKey()}` },
    });
    const json = (await res.json().catch(() => null)) as {
      code?: number;
      msg?: string;
      data?: { status?: string; errorMessage?: string; response?: { sunoData?: { audioUrl?: string; sourceAudioUrl?: string }[] } };
    } | null;
    if (!res.ok || json?.code !== 200) throw new Error(json?.msg ? `Suno: ${json.msg}` : `Suno respondió ${res.status}`);
    const status = json.data?.status ?? "PENDING";
    if (/FAILED|ERROR|SENSITIVE/i.test(status)) return { status: "failed" as const, error: json.data?.errorMessage ?? status };
    const track = json.data?.response?.sunoData?.[0];
    const src = track?.audioUrl || track?.sourceAudioUrl;
    if (status !== "SUCCESS" || !src) return { status: "pending" as const };
    const audio = await fetch(src);
    if (!audio.ok) throw new Error("No se pudo descargar la música");
    const path = `${context.userId}/bgm-${crypto.randomUUID()}.mp3`;
    const store = context.supabase.storage.from("voiceovers");
    const up = await store.upload(path, new Uint8Array(await audio.arrayBuffer()), { contentType: "audio/mpeg" });
    if (up.error) throw new Error("No se pudo guardar la música");
    const s = await store.createSignedUrl(path, MONTH);
    if (s.error) throw new Error("No se pudo obtener la música");
    return { status: "ready" as const, url: s.data.signedUrl };
  });
