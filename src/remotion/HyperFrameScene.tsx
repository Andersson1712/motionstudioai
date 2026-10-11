import { useEffect, useMemo, useRef, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, useCurrentFrame, useVideoConfig } from "remotion";
import { hyperframeDoc } from "@/lib/hyperframes";

/** Muestra una composición HyperFrames en un iframe aislado y la sincroniza con el frame de Remotion. */
export function HyperFrameScene({ html, fontFamily }: { html: string; fontFamily: string }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ref = useRef<HTMLIFrameElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [handle] = useState(() => delayRender("hyperframe"));
  const doc = useMemo(() => hyperframeDoc(html, fontFamily), [html, fontFamily]);

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.source !== ref.current?.contentWindow) return;
      if (e.data?.hf === "loaded") setLoaded(true);
    };
    window.addEventListener("message", onMsg);
    const fallback = setTimeout(() => setLoaded(true), 3000);
    return () => {
      window.removeEventListener("message", onMsg);
      clearTimeout(fallback);
    };
  }, []);

  useEffect(() => {
    if (loaded) continueRender(handle);
  }, [loaded, handle]);

  useEffect(() => {
    if (loaded) ref.current?.contentWindow?.postMessage({ hf: "seek", t: frame / fps, id: frame }, "*");
  }, [frame, fps, loaded]);

  return (
    <AbsoluteFill>
      <iframe
        ref={ref}
        title="HyperFrame"
        sandbox="allow-scripts"
        srcDoc={doc}
        style={{ width: 1080, height: 1920, border: 0, background: "transparent", pointerEvents: "none" }}
      />
    </AbsoluteFill>
  );
}
