import { Composition, registerRoot } from "remotion";
import { MotionVideo, type MotionVideoProps } from "@/remotion/MotionVideo";

/** Misma composición que el reproductor del editor: preview y MP4 coinciden. */
function Root() {
  return (
    <Composition
      id="MotionVideo"
      component={MotionVideo as React.FC<MotionVideoProps>}
      durationInFrames={30}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={{} as MotionVideoProps}
      calculateMetadata={({ props }) => {
        const t = props.timeline;
        const total = t.scenes.reduce((m, s) => Math.max(m, s.fromFrame + s.durationInFrames), 0);
        return { durationInFrames: Math.max(1, total), fps: t.fps, width: t.width, height: t.height };
      }}
    />
  );
}

registerRoot(Root);
