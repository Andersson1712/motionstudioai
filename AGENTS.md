<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- App data (brand kit, projects, timeline JSON) lives in a persisted Zustand store (src/lib/store.ts) until Lovable Cloud is enabled; app routes use `ssr: false` because the store reads localStorage.
- The editor preview uses @remotion/player with src/remotion/MotionVideo.tsx, the same composition the external Remotion render must use, so preview and MP4 match; it reads the timeline JSON contract in src/lib/types.ts.
- Narrator audio is generated server-side (src/lib/voice.functions.ts) with ElevenLabs `with-timestamps`, stored in the private `voiceovers` bucket under `<userId>/`, and its word alignment drives timeline captions/scene frames — keeps the timeline ready for Remotion rendering.
- Final MP4 rendering must use Remotion (@remotion/renderer) in an external Node worker/Lambda, never in the web app server — the app runtime is a Cloudflare Worker.
- Scene planning: the AI Scene Director (src/lib/director.functions.ts) returns scenes as word indices only; code in src/lib/registry.ts converts them to frames from the word alignment and validates against the ComponentRegistry (no unknown components, no overlaps) — keeps frames exact and the LLM unable to break timing.
- HyperFrames: each scene may carry `layoutProps.hyperframe` (AI-generated HTML + CSS @keyframes, validated in src/lib/hyperframes.ts) rendered in a sandboxed iframe whose CSS animations are paused and seeked to the Remotion frame — deterministic, so live preview and MP4 render match; invalid/missing falls back to the Remotion layout.
- MP4 renders are queued in `render_jobs`; the external Remotion worker pulls/updates jobs via /api/public/render-worker (Bearer RENDER_WORKER_SECRET) and uploads to the private `renders` bucket via a signed upload URL — the app server never renders.
- Supabase query builders are lazy: client write-through in the store must go through `sync()` (awaits the query) or nothing is sent.
