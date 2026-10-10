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
- The video preview is a CSS simulation (src/components/VerticalPlayer.tsx) that reads the timeline JSON contract in src/lib/types.ts; keep any future Remotion player on that same contract.
- Narrator audio is generated server-side (src/lib/voice.functions.ts) with ElevenLabs `with-timestamps`, stored in the private `voiceovers` bucket under `<userId>/`, and its word alignment drives timeline captions/scene frames — keeps the timeline ready for Remotion rendering.
- Final MP4 rendering must use Remotion (@remotion/renderer) in an external Node worker/Lambda, never in the web app server — the app runtime is a Cloudflare Worker.
