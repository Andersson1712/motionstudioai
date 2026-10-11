import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const generateScript = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { idea: string; mode: string }) => ({
    idea: String(input?.idea ?? "").slice(0, 2000),
    mode: String(input?.mode ?? "full_animated"),
  }))
  .handler(async ({ data }) => {
    const { generateTextWithLovableAi } = await import("./ai/responses.server.ts");
    const request = getRequest();

    const modeHint =
      data.mode === "talking_head"
        ? "El video es una persona hablando a cámara (talking head): el guion debe sonar natural al decirse en voz alta, en primera persona."
        : "El video es completamente animado con voz en off: el guion se narrará sobre visuales generados.";

    const script = await generateTextWithLovableAi(
      request,
      [
        {
          role: "user",
          content: `Idea del video: ${data.idea}\n\n${modeHint}\n\nEscribe el guion completo en español.`,
        },
      ],
      [
        "Eres un guionista experto en videos verticales cortos (TikTok, Reels, Shorts) de 90 a 120 segundos (mínimo 1 minuto 30 segundos de locución).",
        "Escribe guiones en español, con un gancho potente en la primera frase, ritmo ágil y un cierre con llamada a la acción.",
        "Frases cortas y directas, pensadas para locución. Sin indicaciones técnicas, sin acotaciones de cámara, sin encabezados: solo el texto que se va a narrar.",
        "Extensión obligatoria: entre 250 y 320 palabras (al menos 1 minuto 30 segundos narrado). Desarrolla 5 o 6 bloques: gancho, problema, datos, pasos concretos, ejemplo y cierre.",
      ].join(" "),
    );

    return { script: script.trim() };
  });
