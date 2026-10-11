import { createFileRoute } from "@tanstack/react-router";

/** Suno exige una URL de aviso; la app consulta el estado por su cuenta, así que solo confirmamos. */
export const Route = createFileRoute("/api/public/suno-callback")({
  server: { handlers: { POST: async () => Response.json({ ok: true }) } },
});
