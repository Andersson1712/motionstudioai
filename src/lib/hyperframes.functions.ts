import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { validateHyperframe } from "./hyperframes";

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["html"],
  properties: { html: { type: "string" } },
};

/** Genera la composición HyperFrames (HTML + CSS @keyframes) de una escena. */
export const generateHyperframe = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { text: string; layout: string; seconds: number; theme: Record<string, string> }) => ({
    text: String(input?.text ?? "").slice(0, 400),
    layout: String(input?.layout ?? "HookTitle").slice(0, 40),
    seconds: Math.min(60, Math.max(1, Number(input?.seconds) || 4)),
    theme: {
      primary: String(input?.theme?.["primaryColor"] ?? "#C6F432").slice(0, 20),
      accent: String(input?.theme?.["accentColor"] ?? "#FF6B3D").slice(0, 20),
      bg: String(input?.theme?.["backgroundColor"] ?? "#111318").slice(0, 20),
    },
  }))
  .handler(async ({ data }) => {
    const { generateObjectWithLovableAi } = await import("./ai/responses.server.ts");
    const instructions = [
      "Eres un diseñador de motion graphics. Escribes composiciones HyperFrames: HTML + <style> con CSS @keyframes.",
      "Lienzo fijo 1080x1920 px (vertical). Usa position:absolute y px. Fondo transparente o degradados con los colores de marca.",
      `Colores: primario ${data.theme.primary}, acento ${data.theme.accent}, fondo ${data.theme.bg}. Texto principal blanco, grande (80-140px), peso 900.`,
      `La escena dura ${data.seconds.toFixed(1)} s. Todas las animaciones deben ocurrir dentro de ese tiempo (usa animation-delay escalonado, animation-fill-mode: both, sin infinite salvo movimientos sutiles de fondo).`,
      "Incluye: entrada del texto palabra a palabra o por líneas, al menos 3 formas gráficas animadas (círculos, barras, líneas, partículas, iconos con CSS), y una salida suave en los últimos 0.4 s.",
      "Deja libre la franja inferior 1450-1800 px (ahí van los subtítulos).",
      "PROHIBIDO: <script>, eventos on*, imágenes o fuentes externas, @import, url() remotas. Máximo 9000 caracteres.",
      "Devuelve solo el HTML del cuerpo (con su <style>), sin <html> ni <body>.",
    ].join("\n");
    let lastErr = "";
    for (let attempt = 0; attempt < 2; attempt++) {
      const out = await generateObjectWithLovableAi<{ html: string }>(
        getRequest(),
        [{ role: "user", content: `Tipo de escena: ${data.layout}\nTexto: ${data.text}${lastErr ? `\nEl intento anterior falló: ${lastErr}` : ""}` }],
        instructions,
        SCHEMA,
      );
      const v = validateHyperframe(out.html);
      if (v.ok) return { html: out.html };
      lastErr = v.error;
    }
    throw new Error(`Animación inválida: ${lastErr}`);
  });
