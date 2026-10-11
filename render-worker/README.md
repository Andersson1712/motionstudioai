# Worker de render MotionStudio (Railway)

1. Railway → New Project → Deploy from GitHub repo (este repositorio). Railway usa `railway.json` de la raíz.
2. Variables del servicio:
   - `APP_URL` — URL de la app (p. ej. la publicada).
   - `RENDER_WORKER_SECRET` — la misma contraseña guardada en la app.
   - Opcional: `CONCURRENCY` (2 por defecto; súbelo con más CPU), `POLL_MS`.
3. Recomendado: 4 GB RAM / 2+ vCPU.

El worker pide renders a `/api/public/render-worker`, renderiza con Remotion y sube el MP4.
