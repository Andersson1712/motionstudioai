import { Player, type PlayerRef } from "@remotion/player";
import { useEffect, useRef } from "react";
import { totalFrames } from "@/lib/timeline";
import type { CaptionStyle, SafeZone, TimelineData } from "@/lib/types";
import { MotionVideo } from "@/remotion/MotionVideo";

/** Reproductor Remotion real con la misma composición que usa el render MP4. Si hay MP4 exportado, lo muestra. */
export function RemotionPlayer({ timeline, captionStyle, safeZone, logoUrl, exportUrl, onFrame, seekTo }: {
  timeline: TimelineData;
  captionStyle: CaptionStyle;
  safeZone: SafeZone;
  logoUrl: string | null;
  exportUrl?: string | null;
  onFrame?: (f: number) => void;
  seekTo?: number | null;
}) {
  const ref = useRef<PlayerRef>(null);
  useEffect(() => {
    const p = ref.current;
    if (!p || !onFrame) return;
    const h = (e: { detail: { frame: number } }) => onFrame(e.detail.frame);
    p.addEventListener("frameupdate", h);
    return () => p.removeEventListener("frameupdate", h);
  }, [onFrame, exportUrl]);
  useEffect(() => {
    if (seekTo != null) ref.current?.seekTo(seekTo);
  }, [seekTo]);

  if (exportUrl)
    return <video src={exportUrl} controls className="aspect-[9/16] w-[340px] max-w-full rounded-[28px] border-4 border-secondary bg-background shadow-2xl" />;

  return (
    <div className="w-[340px] max-w-full overflow-hidden rounded-[28px] border-4 border-secondary shadow-2xl">
      <Player
        ref={ref}
        component={MotionVideo}
        inputProps={{ timeline, captionStyle, safeZone, logoUrl }}
        durationInFrames={Math.max(1, totalFrames(timeline))}
        fps={timeline.fps}
        compositionWidth={timeline.width}
        compositionHeight={timeline.height}
        style={{ width: "100%", aspectRatio: "9 / 16" }}
        controls
        acknowledgeRemotionLicense
      />
    </div>
  );
}
