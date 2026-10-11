import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { catalogForPrompt, LAYOUT_NAMES, OVERLAY_NAMES, type ScenePlan } from "./registry";

const nStr = { type: ["string", "null"] };
const PLAN_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["scenes"],
  properties: {
    scenes: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["startWord", "layout", "title", "value", "label", "headline", "items", "overlay", "emoji"],
        properties: {
          startWord: { type: "integer" },
          layout: { type: "string", enum: LAYOUT_NAMES },
          title: nStr,
          value: nStr,
          label: nStr,
          headline: nStr,
          items: { type: ["array", "null"], items: { type: "string" } },
          overlay: { type: ["string", "null"], enum: [...OVERLAY_NAMES, null] },
          emoji: nStr,
        },
      },
    },
  },
};

/** Paso 3 — Scene Director: recibe catálogo + transcripción numerada + preferencias, devuelve el plan de escenas. */
export const planScenes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { words: string[]; density: string; mode: string }) => ({
    words: (Array.isArray(input?.words) ? input.words : []).slice(0, 600).map((w) => String(w).slice(0, 40)),
    density: String(input?.density ?? "moderate"),
    mode: String(input?.mode ?? "full_animated"),
  }))
  .handler(async ({ data }) => {
    if (data.words.length === 0) throw new Error("Transcripción vacía");
    const { generateObjectWithLovableAi } = await import("./ai/responses.server.ts");
    const transcript = data.words.map((w, i) => `${i}:${w}`).join(" ");
    const pace =
      data.density === "intense" ? "ritmo alto: una escena cada 1-2 frases cortas, overlay en casi todas"
      : data.density === "minimal" ? "ritmo tranquilo: pocas escenas largas, sin overlays"
      : "ritmo medio: una escena por frase, overlays ocasionales";

    const plan = await generateObjectWithLovableAi<ScenePlan>(
      getRequest(),
      [{ role: "user", content: `Transcripción (índice:palabra):\n${transcript}\n\nPreferencias: ${pace}. Modo: ${data.mode}.` }],
      [
        "Eres el Scene Director de un editor de videos verticales 9:16.",
        "Divide la transcripción en escenas usando SOLO estos componentes del catálogo:",
        catalogForPrompt(),
        "Cada escena empieza en el índice de palabra startWord (la primera debe ser 0, índices crecientes, sin repetir).",
        "Rellena solo las props del layout elegido (HookTitle/QuoteCard: title; StatCard: value y label; Mockup: headline; BulletList: items) y pon null en las demás.",
        "Textos cortos en español, máximo 8 palabras. emoji solo si overlay es EmojiBurst.",
      ].join("\n"),
      PLAN_SCHEMA,
    );
    return plan;
  });
