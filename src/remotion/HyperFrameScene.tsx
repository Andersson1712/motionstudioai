import { useEffect, useMemo, useRef, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, getRemotionEnvironment, useCurrentFrame, useVideoConfig } from "remotion";
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

  // En el render MP4 cada frame espera a que el iframe confirme el seek (captura determinista).
  useEffect(() => {
    if (!loaded) return;
    const rendering = getRemotionEnvironment().isRendering;
    const h = rendering ? delayRender(`hyperframe-seek-${frame}`) : null;
    let done = false;
    const finish = () => {
      if (h != null && !done) {
        done = true;
        continueRender(h);
      }
    };
    const onAck = (e: MessageEvent) => {
      if (e.source === ref.current?.contentWindow && e.data?.hf === "ready" && e.data.id === frame && h != null) {
        window.removeEventListener("message", onAck);
        finish();
      }
    };
    if (h != null) window.addEventListener("message", onAck);
    ref.current?.contentWindow?.postMessage({ hf: "seek", t: frame / fps, id: frame }, "*");
    return () => {
      window.removeEventListener("message", onAck);
      finish();
    };
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
