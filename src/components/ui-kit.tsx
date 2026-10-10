import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { ProjectStatus } from "@/lib/types";

type Variant = "primary" | "ghost" | "outline" | "danger";
export function Btn({
  variant = "primary",
  className,
  ...p
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  const v: Record<Variant, string> = {
    primary: "bg-primary text-primary-foreground hover:shadow-glow hover:-translate-y-0.5",
    ghost: "text-muted-foreground hover:text-foreground hover:bg-secondary",
    outline: "border border-border bg-surface hover:bg-secondary text-foreground",
    danger: "text-destructive hover:bg-destructive/10",
  };
  return (
    <button
      {...p}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50",
        v[variant],
        className,
      )}
    />
  );
}

const statusMap: Record<ProjectStatus, { label: string; cls: string }> = {
  draft: { label: "Borrador", cls: "bg-secondary text-muted-foreground" },
  generating_script: { label: "Generando guion", cls: "bg-warning/15 text-warning" },
  audio_ready: { label: "Audio listo", cls: "bg-warning/15 text-warning" },
  timeline_ready: { label: "Timeline listo", cls: "bg-primary/15 text-primary" },
  rendering: { label: "Renderizando", cls: "bg-accent/15 text-accent" },
  completed: { label: "Completado", cls: "bg-success/15 text-success" },
  failed: { label: "Error", cls: "bg-destructive/15 text-destructive" },
};
export function StatusBadge({ status }: { status: ProjectStatus }) {
  const s = statusMap[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold", s.cls)}>
      <span className={cn("size-1.5 rounded-full bg-current", status === "rendering" && "animate-pulse")} />
      {s.label}
    </span>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block space-y-2">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
      {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}

export const inputCls =
  "w-full rounded-xl border border-input bg-surface px-3.5 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring";

export function Choice({
  active,
  onClick,
  children,
  className,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl border p-4 text-left transition-all duration-200 hover:-translate-y-0.5",
        active ? "border-primary bg-primary/10 shadow-glow" : "border-border bg-surface hover:border-muted-foreground/40",
        className,
      )}
    >
      {children}
    </button>
  );
}
