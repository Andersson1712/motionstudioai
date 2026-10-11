// Worker de render MotionStudio (Railway). Pide renders en cola a la app, los renderiza con
// Remotion (composiciones HyperFrames incluidas) y sube el MP4 a la nube.
import http from "node:http";
import path from "node:path";
import { readFile, rm } from "node:fs/promises";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition, ensureBrowser } from "@remotion/renderer";

const APP_URL = (process.env.APP_URL ?? "").replace(/\/+$/, "");
const SECRET = process.env.RENDER_WORKER_SECRET ?? "";
const POLL_MS = Number(process.env.POLL_MS ?? 5000);
if (!APP_URL || !SECRET) {
  console.error("Faltan APP_URL o RENDER_WORKER_SECRET");
  process.exit(1);
}

let state = "starting";
http.createServer((_, res) => res.end(JSON.stringify({ ok: true, state }))).listen(Number(process.env.PORT ?? 3000));

async function api(body) {
  const r = await fetch(`${APP_URL}/api/public/render-worker`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${SECRET}` },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`API ${r.status}: ${await r.text()}`);
  return r.json();
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  await ensureBrowser();
  const root = path.dirname(new URL(import.meta.url).pathname);
  const serveUrl = await bundle({
    entryPoint: path.join(root, "entry.tsx"),
    webpackOverride: (c) => ({
      ...c,
      resolve: { ...c.resolve, alias: { ...(c.resolve?.alias ?? {}), "@": path.join(root, "app-src") } },
    }),
  });
  console.log("Bundle listo. Esperando renders…");

  for (;;) {
    state = "idle";
    let job;
    try {
      const next = await api({ action: "next" });
      if (!next.job) {
        await sleep(POLL_MS);
        continue;
      }
      job = next.job;
      state = `rendering ${job.id}`;
      console.log("Render", job.id);
      const out = `/tmp/${job.id}.mp4`;
      const composition = await selectComposition({ serveUrl, id: next.composition, inputProps: next.inputProps });
      let last = -1;
      await renderMedia({
        serveUrl,
        composition,
        inputProps: next.inputProps,
        codec: "h264",
        crf: 20,
        outputLocation: out,
        timeoutInMilliseconds: 120000,
        concurrency: Number(process.env.CONCURRENCY ?? 2),
        onProgress: ({ progress }) => {
          const p = Math.min(99, Math.floor(progress * 100));
          if (p >= last + 5) {
            last = p;
            api({ action: "update", jobId: job.id, status: "rendering", progress: p }).catch(() => {});
          }
        },
      });
      const file = await readFile(out);
      const up = await fetch(job.uploadUrl, { method: "PUT", headers: { "content-type": "video/mp4", "x-upsert": "true" }, body: file });
      if (!up.ok) throw new Error(`Subida ${up.status}: ${await up.text()}`);
      await rm(out, { force: true });
      await api({ action: "update", jobId: job.id, status: "completed", progress: 100 });
      console.log("Listo", job.id);
    } catch (e) {
      console.error("Error", e);
      if (job) await api({ action: "update", jobId: job.id, status: "failed", progress: 0, error: String(e?.message ?? e).slice(0, 480) }).catch(() => {});
      await sleep(POLL_MS);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
