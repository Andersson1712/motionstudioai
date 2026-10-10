import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { AlignedWord } from "./types";

// Mapea los ids de voz de la app a voces reales de ElevenLabs.
const VOICE_MAP: Record<string, string> = {
  elevenlabs_default: "onwK4e9ZLuTAKqWW03F9", // Daniel
  elevenlabs_energetic: "TX3LPaxmHKxFdv7VOQHJ", // Liam
  elevenlabs_calm: "JBFqnCBsd6RMkjVDRZzb", // George
  elevenlabs_female_es: "EXAVITQu4vr4xnSDxMaL", // Sarah
};

/** Agrupa la alineación por carácter de ElevenLabs en palabras con tiempos (segundos). */
function toWords(chars: string[], starts: number[], ends: number[]): AlignedWord[] {
  const words: AlignedWord[] = [];
  let cur = "";
  let s = 0;
  let e = 0;
  chars.forEach((c, i) => {
    if (/\s/.test(c)) {
      if (cur) words.push({ word: cur, start: s, end: e });
      cur = "";
      return;
    }
    if (!cur) s = starts[i] ?? 0;
    cur += c;
    e = ends[i] ?? s;
  });
  if (cur) words.push({ word: cur, start: s, end: e });
  return words;
}

export const generateVoiceover = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { script: string; voiceId: string }) => ({
    script: String(input?.script ?? "").trim().slice(0, 4500),
    voiceId: String(input?.voiceId ?? "elevenlabs_default"),
  }))
  .handler(async ({ data, context }) => {
    if (!data.script) throw new Error("Guion vacío");
    const key = process.env.ELEVENLABS_API_KEY;
    if (!key) throw new Error("ElevenLabs no está conectado");
    const voice = VOICE_MAP[data.voiceId] ?? VOICE_MAP.elevenlabs_default!;

    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voice}/with-timestamps?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: { "xi-api-key": key, "Content-Type": "application/json" },
        body: JSON.stringify({
          text: data.script,
          model_id: "eleven_multilingual_v2",
          voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0.4, use_speaker_boost: true },
        }),
      },
    );
    if (!res.ok) {
      const body = await res.text();
      console.error(`ElevenLabs [${res.status}]: ${body}`);
      throw new Error(`No se pudo generar la voz (${res.status})`);
    }
    const json = (await res.json()) as {
      audio_base64: string;
      alignment: { characters: string[]; character_start_times_seconds: number[]; character_end_times_seconds: number[] };
    };

    const bytes = Uint8Array.from(atob(json.audio_base64), (c) => c.charCodeAt(0));
    const path = `${context.userId}/${crypto.randomUUID()}.mp3`;
    const up = await context.supabase.storage.from("voiceovers").upload(path, bytes, { contentType: "audio/mpeg" });
    if (up.error) throw new Error("No se pudo guardar el audio");
    const signed = await context.supabase.storage.from("voiceovers").createSignedUrl(path, 60 * 60 * 24 * 30);
    if (signed.error) throw new Error("No se pudo obtener el audio");

    const a = json.alignment;
    const words = toWords(a.characters, a.character_start_times_seconds, a.character_end_times_seconds);
    return { audioUrl: signed.data.signedUrl, words, duration: words.at(-1)?.end ?? 0 };
  });
