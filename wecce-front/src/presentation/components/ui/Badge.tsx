import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/presentation/lib/cn";

export type BadgeTone = "neutral" | "ok" | "warn" | "danger" | "info" | "ink" | "line";

type BadgeProps = {
  tone?: BadgeTone;
  /** Petit point de couleur avant le texte (statut en direct). */
  dot?: boolean;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
};

/** Pastille d'état : un statut, jamais une décoration. */
export function Badge({ tone = "neutral", dot, className, style, children }: BadgeProps) {
  return (
    <span className={cn("badge", tone !== "neutral" && `badge--${tone}`, className)} style={style}>
      {dot && <span className="dot" />}
      {children}
    </span>
  );
}
