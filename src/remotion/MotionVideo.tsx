import { AbsoluteFill, Audio, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { CaptionStyle, SafeZone, Scene, TimelineData } from "@/lib/types";

/** Composición Remotion: lee exactamente el contrato del timeline. La misma se usa para el render MP4. */
export type MotionVideoProps = {
  timeline: TimelineData;
  captionStyle: CaptionStyle;
  safeZone: SafeZone;
  logoUrl: string | null;
};

type Theme = TimelineData["theme"];

function useEnter(delay = 0) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping: 14, stiffness: 120 } });
}

function Background({ theme }: { theme: Theme }) {
  const f = useCurrentFrame();
  const a = (f * 0.6) % 360;
  return (
    <AbsoluteFill style={{ background: theme.backgroundColor, overflow: "hidden" }}>
      <div style={{ position: "absolute", width: 1400, height: 1400, left: -300 + Math.sin(f / 60) * 120, top: -500 + Math.cos(f / 80) * 100, borderRadius: "50%", background: `radial-gradient(circle, ${theme.primaryColor}55, transparent 65%)` }} />
      <div style={{ position: "absolute", width: 1200, height: 1200, right: -400 + Math.cos(f / 70) * 140, bottom: -400, borderRadius: "50%", background: `radial-gradient(circle, ${theme.accentColor}44, transparent 65%)` }} />
      <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(${a}deg, transparent 49.6%, ${theme.primaryColor}14 50%, transparent 50.4%)`, backgroundSize: "120px 120px" }} />
    </AbsoluteFill>
  );
}

function Words({ text, theme, size }: { text: string; theme: Theme; size: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0 22px", fontSize: size, fontWeight: 900, lineHeight: 1.05, color: "#fff", textAlign: "center" }}>
      {text.split(/\s+/).map((w, i) => {
        const s = spring({ frame: frame - i * 3, fps, config: { damping: 12 } });
        return (
          <span key={i} style={{ display: "inline-block", transform: `translateY(${(1 - s) * 80}px) rotate(${(1 - s) * -8}deg)`, opacity: s, color: i % 4 === 1 ? theme.primaryColor : "#fff" }}>{w}</span>
        );
      })}
    </div>
  );
}

function SceneLayout({ scene, theme }: { scene: Scene; theme: Theme }) {
  const p = scene.layoutProps;
  const e = useEnter();
  const frame = useCurrentFrame();
  const out = interpolate(frame, [scene.durationInFrames - 10, scene.durationInFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const wrap = { position: "absolute" as const, inset: 0, display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center", padding: 90, gap: 50, opacity: out, transform: `scale(${0.9 + e * 0.1})` };

  switch (scene.layout) {
    case "StatCard": {
      const num = parseFloat(String(p.value)) || 0;
      const suffix = String(p.value).replace(/[\d.,\s]/g, "");
      const shown = Math.round(interpolate(frame, [0, 35], [0, num], { extrapolateRight: "clamp" }));
      return (
        <div style={wrap}>
          <svg width="520" height="520" style={{ position: "absolute" }}>
            <circle cx="260" cy="260" r="230" stroke={`${theme.primaryColor}33`} strokeWidth="22" fill="none" />
            <circle cx="260" cy="260" r="230" stroke={theme.primaryColor} strokeWidth="22" fill="none" strokeLinecap="round" strokeDasharray={1445} strokeDashoffset={1445 * (1 - Math.min(1, frame / 40) * Math.min(1, num / 100 || 0.8))} transform="rotate(-90 260 260)" />
          </svg>
          <div style={{ fontSize: 210, fontWeight: 900, color: "#fff" }}>{num ? `${shown}${suffix}` : p.value}</div>
          <div style={{ marginTop: 300, fontSize: 58, fontWeight: 700, color: "#ffffffcc", textAlign: "center", transform: `translateY(${(1 - e) * 60}px)` }}>{p.label}</div>
        </div>
      );
    }
    case "BulletList":
      return (
        <div style={{ ...wrap, alignItems: "stretch" }}>
          {(p.items as string[]).map((it, i) => {
            const s = spring({ frame: frame - 8 - i * 12, fps: 30, config: { damping: 13 } });
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 36, padding: "40px 48px", borderRadius: 40, background: "#ffffff12", border: `3px solid ${theme.primaryColor}55`, transform: `translateX(${(1 - s) * -700}px)`, opacity: s }}>
                <div style={{ width: 90, height: 90, flexShrink: 0, borderRadius: 30, background: theme.primaryColor, display: "grid", placeItems: "center", fontSize: 54, fontWeight: 900, color: theme.backgroundColor }}>{i + 1}</div>
                <div style={{ fontSize: 60, fontWeight: 800, color: "#fff" }}>{it}</div>
              </div>
            );
          })}
        </div>
      );
    case "Mockup":
      return (
        <div style={wrap}>
          <Words text={String(p.headline)} theme={theme} size={84} />
          <div style={{ width: 560, height: 980, borderRadius: 70, border: "14px solid #ffffff22", background: `linear-gradient(160deg, ${theme.primaryColor}, ${theme.accentColor})`, transform: `translateY(${(1 - e) * 500}px) rotate(${Math.sin(frame / 25) * 3}deg)`, boxShadow: "0 60px 120px #0008", overflow: "hidden" }}>
            {p.imageUrl ? <img src={String(p.imageUrl)} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : [0, 1, 2, 3].map((i) => (
              <div key={i} style={{ margin: 40, height: 120, borderRadius: 30, background: "#ffffff33", width: `${interpolate(frame, [i * 6, i * 6 + 20], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) * 0.8}%` }} />
            ))}
          </div>
        </div>
      );
    case "QuoteCard":
      return (
        <div style={wrap}>
          <div style={{ fontSize: 300, lineHeight: 0.6, color: theme.accentColor, transform: `scale(${e})` }}>“</div>
          <Words text={String(p.title)} theme={theme} size={82} />
          <div style={{ height: 12, borderRadius: 6, background: theme.accentColor, width: interpolate(frame, [10, 40], [0, 420], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }} />
        </div>
      );
    default:
      return (
        <div style={wrap}>
          <div style={{ padding: "16px 40px", borderRadius: 999, background: theme.accentColor, color: "#fff", fontSize: 44, fontWeight: 800, transform: `scale(${e})` }}>⚡ MIRA ESTO</div>
          <Words text={String(p.title)} theme={theme} size={118} />
        </div>
      );
  }
}

function OverlayView({ component, props, theme, duration }: { component: string; props: Record<string, any>; theme: Theme; duration: number }) {
  const frame = useCurrentFrame();
  const e = useEnter();
  if (component === "EmojiBurst")
    return <div style={{ position: "absolute", right: 90, top: 260, fontSize: 200, transform: `scale(${e}) rotate(${(1 - e) * 90}deg)`, opacity: interpolate(frame, [duration - 6, duration], [1, 0], { extrapolateLeft: "clamp" }) }}>{props["emoji"]}</div>;
  return (
    <div style={{ position: "absolute", left: 80, right: 80, top: 90, height: 16, borderRadius: 8, background: "#ffffff22", overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${(frame / duration) * 100}%`, background: theme.accentColor }} />
    </div>
  );
}

function Captions({ timeline, style, safeZone }: { timeline: TimelineData; style: CaptionStyle; safeZone: SafeZone }) {
  const frame = useCurrentFrame();
  const caps = timeline.captions;
  const idx = caps.findIndex((c) => frame >= c.startFrame && frame < c.endFrame);
  if (idx < 0) return null;
  const start = Math.floor(idx / 3) * 3;
  const { theme } = timeline;
  return (
    <div style={{ position: "absolute", left: 60, right: 60, ...(safeZone === "center" ? { top: "62%" } : { bottom: 330 }), display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 18 }}>
      {caps.slice(start, start + 3).map((c, i) => {
        const active = start + i === idx;
        const pop = active ? spring({ frame: frame - c.startFrame, fps: timeline.fps, config: { damping: 10 } }) : 1;
        const base = { fontSize: 76, fontWeight: 900, textTransform: "uppercase" as const, padding: "6px 20px", borderRadius: 18, textShadow: "0 6px 24px #000a" };
        if (style === "box_minimal")
          return <span key={c.startFrame} style={{ ...base, background: active ? theme.primaryColor : "#000a", color: active ? theme.backgroundColor : "#fff" }}>{c.word}</span>;
        if (style === "kinetic_pop")
          return <span key={c.startFrame} style={{ ...base, color: active ? theme.accentColor : "#fff", transform: `scale(${active ? 0.8 + pop * 0.35 : 1}) rotate(${active ? -4 : 0}deg)`, display: "inline-block" }}>{c.word}</span>;
        return <span key={c.startFrame} style={{ ...base, color: active ? theme.primaryColor : "#fff" }}>{c.word}</span>;
      })}
    </div>
  );
}

export function MotionVideo({ timeline, captionStyle, safeZone, logoUrl }: MotionVideoProps) {
  const { theme } = timeline;
  return (
    <AbsoluteFill style={{ fontFamily: `${theme.fontFamily}, sans-serif` }}>
      <Background theme={theme} />
      {timeline.scenes.map((s) => (
        <Sequence key={s.id} from={s.fromFrame} durationInFrames={s.durationInFrames}>
          <SceneLayout scene={s} theme={theme} />
          {s.overlays.map((o, i) => (
            <Sequence key={i} from={o.fromFrame - s.fromFrame} durationInFrames={o.durationInFrames}>
              <OverlayView component={o.component} props={o.props} theme={theme} duration={o.durationInFrames} />
            </Sequence>
          ))}
        </Sequence>
      ))}
      <Captions timeline={timeline} style={captionStyle} safeZone={safeZone} />
      {logoUrl && <img src={logoUrl} style={{ position: "absolute", left: 60, top: 130, height: 90 }} />}
      {timeline.audioTrack.voiceoverUrl && <Audio src={timeline.audioTrack.voiceoverUrl} />}
      {timeline.audioTrack.bgmUrl && <Audio src={timeline.audioTrack.bgmUrl} volume={timeline.audioTrack.bgmVolume} loop />}
    </AbsoluteFill>
  );
}
