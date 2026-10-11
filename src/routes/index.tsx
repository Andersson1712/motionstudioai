import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { ArrowRight, Captions, Clapperboard, Palette, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MotionStudio AI — Videos verticales automáticos" },
      { name: "description", content: "Genera Reels, TikToks y Shorts 9:16 con tu marca, subtítulos dinámicos e IA." },
      { property: "og:title", content: "MotionStudio AI — Videos verticales automáticos" },
      { property: "og:description", content: "Genera Reels, TikToks y Shorts 9:16 con tu marca, subtítulos dinámicos e IA." },
    ],
  }),
  component: Landing,
});

function Landing() {
  // Al volver de Google (o con sesión abierta) se entra directo al estudio.
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard" });
  }, [loading, user, navigate]);
  const feats = [
    { icon: Palette, t: "Brand Kit", d: "Colores, tipografía y estilo de subtítulos en un solo lugar." },
    { icon: Sparkles, t: "Guion con IA", d: "De una idea a un timeline estructurado en segundos." },
    { icon: Captions, t: "Subtítulos kinéticos", d: "Resaltado palabra a palabra, listo para retener." },
  ];
  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6">
      <nav className="flex items-center justify-between py-6">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground"><Clapperboard className="size-4" /></span>
          <span className="font-display text-lg font-bold">MotionStudio AI</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-sm font-semibold text-muted-foreground hover:text-foreground">Acceder</Link>
          <Link to="/dashboard" className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:-translate-y-0.5 hover:shadow-glow">Abrir estudio →</Link>
        </div>
      </nav>
      <section className="flex flex-1 flex-col items-center justify-center py-20 text-center">
        <span className="animate-slide-up mb-6 rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-primary">9:16 · TikTok · Reels · Shorts</span>
        <h1 className="animate-slide-up max-w-3xl text-5xl font-extrabold leading-[1.05] md:text-7xl">
          Videos verticales que se <span className="text-primary">editan solos</span>.
        </h1>
        <p className="animate-slide-up mt-6 max-w-xl text-lg text-muted-foreground">Configura tu marca una vez. Sube un clip o escribe una idea. Obtén un timeline listo para renderizar.</p>
        <Link to="/projects/new" className="animate-slide-up mt-10 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 font-semibold text-primary-foreground transition hover:-translate-y-0.5 hover:shadow-glow">
          Crear mi primer video <ArrowRight className="size-4" />
        </Link>
        <div className="mt-20 grid w-full gap-4 md:grid-cols-3">
          {feats.map(({ icon: I, t, d }) => (
            <div key={t} className="card-surface p-6 text-left transition hover:-translate-y-1">
              <I className="size-5 text-primary" />
              <h3 className="mt-4 font-bold">{t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
