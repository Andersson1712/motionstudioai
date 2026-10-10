import { Pause, Play, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { CaptionStyle, Scene, SafeZone, TimelineData } from "@/lib/types";
import { totalFrames } from "@/lib/timeline";

/** CSS-based simulation of a Remotion composition reading the timeline JSON contract. */
export function VerticalPlayer({
  timeline,
  captionStyle,
  safeZone,
  logoUrl,
  onFrame,
  seekTo,
}: {
  timeline: TimelineData;
  captionStyle: CaptionStyle;
  safeZone: SafeZone;
  logoUrl?: string | null;
  onFrame?: (f: number) => void;
  seekTo?: number | null;
}) {
  const total = Math.max(1, totalFrames(timeline));
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(false);
  const raf = useRef<number>(0);
  const last = useRef<number>(0);

  useEffect(() => {
    if (seekTo != null) setFrame(seekTo);
  }, [seekTo]);

  useEffect(() => {
    if (!playing) return;
    const tick = (t: number) => {
      if (!last.current) last.current = t;
      const dt = t - last.current;
      if (dt >= 1000 / timeline.fps) {
        last.current = t;
        setFrame((f) => (f + 1 >= total ? 0 : f + 1));
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf.current);
      last.current = 0;
    };
  }, [playing, total, timeline.fps]);

  useEffect(() => onFrame?.(frame), [frame, onFrame]);

  const scene = timeline.scenes.find((s) => frame >= s.fromFrame && frame < s.fromFrame + s.durationInFrames);
  const { theme } = timeline;
  const caps = timeline.captions;
  const activeIdx = caps.findIndex((c) => frame >= c.startFrame && frame < c.endFrame);
  const windowStart = activeIdx >= 0 ? Math.floor(activeIdx / 4) * 4 : -1;
  const words = windowStart >= 0 ? caps.slice(windowStart, windowStart + 4) : [];
  const fmt = (f: number) => (f / timeline.fps).toFixed(1) + "s";

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div
        className="relative aspect-[9/16] w-[340px] max-w-full overflow-hidden rounded-[28px] border-4 border-secondary shadow-2xl"
        style={{ background: theme.backgroundColor, fontFamily: theme.fontFamily }}
      >
        {scene && <SceneView key={scene.id} scene={scene} frame={frame} theme={theme} />}
        {scene?.overlays
          .filter((o) => frame >= o.fromFrame && frame < o.fromFrame + o.durationInFrames)
          .map((o, i) =>
            o.component === "EmojiBurst" ? (
              <div key={i} className="animate-pop absolute right-6 top-24 text-5xl">{o.props.emoji}</div>
            ) : (
              <div key={i} className="absolute inset-x-6 top-6 h-1 overflow-hidden rounded-full bg-black/20">
                <div className="h-full" style={{ width: `${((frame - o.fromFrame) / o.durationInFrames) * 100}%`, background: theme.accentColor }} />
              </div>
            ),
          )}
        {logoUrl && <img src={logoUrl} alt="logo" className="absolute left-4 top-4 h-8 w-auto object-contain" />}
        {words.length > 0 && (
          <div className={`absolute inset-x-4 flex flex-wrap justify-center gap-1.5 ${safeZone === "center" ? "top-1/2 -translate-y-1/2" : "bottom-[22%]"}`}>
            {words.map((w, i) => (
              <CaptionWord key={windowStart + i} word={w.word} active={windowStart + i === activeIdx} style={captionStyle} theme={theme} />
            ))}
          </div>
        )}
      </div>

      <div className="w-[340px] max-w-full space-y-2">
        <input
          type="range"
          min={0}
          max={total - 1}
          value={frame}
          onChange={(e) => setFrame(Number(e.target.value))}
          className="w-full accent-[var(--color-primary)]"
          aria-label="Línea de tiempo"
        />
        <div className="flex items-center justify-between text-xs text-muted-foreground tabular-nums">
          <span>{fmt(frame)}</span>
          <div className="flex gap-2">
            <button onClick={() => setFrame(0)} className="grid size-9 place-items-center rounded-full bg-secondary transition hover:text-foreground" aria-label="Reiniciar">
              <RotateCcw className="size-4" />
            </button>
            <button onClick={() => setPlaying((p) => !p)} className="grid size-9 place-items-center rounded-full bg-primary text-primary-foreground transition hover:scale-105" aria-label={playing ? "Pausa" : "Play"}>
              {playing ? <Pause className="size-4" /> : <Play className="size-4 translate-x-px" />}
            </button>
          </div>
          <span>{fmt(total)}</span>
        </div>
      </div>
    </div>
  );
}

export function CaptionWord({ word, active, style, theme }: { word: string; active: boolean; style: CaptionStyle; theme: TimelineData["theme"] }) {
  const base = "text-2xl font-extrabold uppercase leading-tight transition-all duration-150";
  if (style === "box_minimal")
    return (
      <span className={base + " rounded-md px-2 py-0.5"} style={{ background: active ? theme.primaryColor : "rgba(0,0,0,.55)", color: active ? theme.backgroundColor : "#fff" }}>
        {word}
      </span>
    );
  if (style === "kinetic_pop")
    return (
      <span className={base + (active ? " animate-pop" : "")} style={{ color: active ? theme.accentColor : "#fff", transform: active ? "scale(1.25) rotate(-3deg)" : "none", textShadow: "0 3px 0 rgba(0,0,0,.6)" }}>
        {word}
      </span>
    );
  return (
    <span className={base} style={{ color: active ? theme.primaryColor : "#fff", textShadow: "0 2px 8px rgba(0,0,0,.7)" }}>
      {word}
    </span>
  );
}

function SceneView({ scene, frame, theme }: { scene: Scene; frame: number; theme: TimelineData["theme"] }) {
  const p = scene.layoutProps;
  const local = frame - scene.fromFrame;
  const enter = Math.min(1, local / 10);
  const style = { opacity: enter, transform: `translateY(${(1 - enter) * 24}px)` };
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-start px-6 pt-[22%] text-center text-white" style={style}>
      {scene.layout === "HookTitle" && (
        <h2 className="text-3xl font-black leading-tight" style={{ color: theme.primaryColor }}>{p.title}</h2>
      )}
      {scene.layout === "QuoteCard" && (
        <div className="rounded-2xl border-l-4 bg-white/5 p-5 text-left text-lg font-bold" style={{ borderColor: theme.accentColor }}>“{p.title}”</div>
      )}
      {scene.layout === "StatCard" && (
        <div className="w-full rounded-3xl p-6" style={{ background: theme.primaryColor, color: theme.backgroundColor }}>
          <div className="text-6xl font-black">{p.value}</div>
          <div className="mt-2 text-sm font-bold uppercase">{p.label}</div>
        </div>
      )}
      {scene.layout === "Mockup" && (
        <div className="w-full overflow-hidden rounded-3xl border border-white/10 bg-white/5">
          {p.imageUrl ? (
            <img src={p.imageUrl} alt="" className="aspect-video w-full object-cover" />
          ) : (
            <div className="aspect-video w-full" style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.accentColor})` }} />
          )}
          <div className="p-3 text-base font-bold">{p.headline}</div>
        </div>
      )}
      {scene.layout === "BulletList" && (
        <ul className="w-full space-y-3 text-left">
          {(p.items as string[] | undefined)?.map((it, i) => (
            <li key={i} className="flex items-center gap-3 rounded-xl bg-white/5 p-3 text-base font-bold">
              <span className="grid size-7 place-items-center rounded-full text-sm" style={{ background: theme.accentColor }}>{i + 1}</span>
              {it}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
