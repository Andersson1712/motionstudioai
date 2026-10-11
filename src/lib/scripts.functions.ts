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

    // Información reciente: búsqueda web (último mes) para que el guion use datos actuales.
    const today = new Date().toISOString().slice(0, 10);
    let research = "";
    const fc = process.env["FIRECRAWL_API_KEY"];
    if (fc && data.idea.trim()) {
      try {
        const r = await fetch("https://api.firecrawl.dev/v2/search", {
          method: "POST",
          headers: { Authorization: `Bearer ${fc}`, "Content-Type": "application/json" },
          body: JSON.stringify({ query: data.idea.slice(0, 200), limit: 6, lang: "es", tbs: "qdr:m" }),
        });
        const j = (await r.json().catch(() => null)) as { data?: unknown } | null;
        const raw = j?.data;
        const items = (Array.isArray(raw) ? raw : ((raw as { web?: unknown[] } | undefined)?.web ?? [])) as { title?: string; description?: string; url?: string }[];
        if (!r.ok) console.error("Firecrawl", r.status, JSON.stringify(j).slice(0, 300));
        research = items.slice(0, 6).map((it, i) => `${i + 1}. ${it.title ?? ""} — ${it.description ?? ""} (${it.url ?? ""})`).join("\n");
      } catch (e) {
        console.error("Firecrawl", e);
      }
    }

    const script = await generateTextWithLovableAi(
      request,
      [
        {
          role: "user",
          content: `Fecha de hoy: ${today}.\nIdea del video: ${data.idea}\n\n${modeHint}\n\n${research ? `Resultados recientes de la web (úsalos para datos y novedades actuales; no inventes cifras que no aparezcan aquí, y no leas las URLs):\n${research}\n\n` : ""}Escribe el guion completo en español.`,
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
