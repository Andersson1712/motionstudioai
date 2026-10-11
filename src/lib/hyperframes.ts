/** HyperFrames: cada escena puede llevar una composición HTML propia (CSS @keyframes) que se
 *  anima de forma determinista según el tiempo de la escena. La misma HTML sirve para el
 *  reproductor en vivo y para el render MP4 (se fija el tiempo, no el reloj real). */

export const HYPERFRAME_MAX_CHARS = 14000;

const FORBIDDEN: [RegExp, string][] = [
  [/<\s*script/i, "no se permiten scripts"],
  [/<\s*(iframe|object|embed|link|meta|base|form)/i, "etiqueta no permitida"],
  [/\son[a-z]+\s*=/i, "no se permiten eventos inline"],
  [/javascript:/i, "no se permite javascript:"],
  [/@import/i, "no se permite @import"],
  [/(src|href)\s*=\s*["']?\s*(https?:)?\/\//i, "no se permiten recursos externos"],
  [/url\(\s*["']?\s*(https?:)?\/\//i, "no se permiten recursos externos"],
];

export function validateHyperframe(html: unknown): { ok: true } | { ok: false; error: string } {
  if (typeof html !== "string" || !html.trim()) return { ok: false, error: "vacío" };
  if (html.length > HYPERFRAME_MAX_CHARS) return { ok: false, error: "demasiado largo" };
  for (const [re, error] of FORBIDDEN) if (re.test(html)) return { ok: false, error };
  if (!/@keyframes/i.test(html)) return { ok: false, error: "sin animación" };
  return { ok: true };
}

/** Documento aislado: todas las animaciones CSS se pausan y se colocan en el tiempo recibido. */
export function hyperframeDoc(html: string, fontFamily: string) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
html,body{margin:0;width:1080px;height:1920px;overflow:hidden;background:transparent;font-family:${JSON.stringify(fontFamily)},sans-serif}
*{box-sizing:border-box}
</style></head><body>${html}<script>
var t=0;function seek(){document.getAnimations().forEach(function(a){a.pause();a.currentTime=t*1000});}
window.addEventListener("message",function(e){if(e.data&&e.data.hf==="seek"){t=e.data.t;seek();parent.postMessage({hf:"ready",id:e.data.id},"*");}});
seek();parent.postMessage({hf:"loaded"},"*");
</script></body></html>`;
}
