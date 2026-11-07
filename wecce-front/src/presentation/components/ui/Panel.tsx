import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/presentation/lib/cn";

type PanelProps = {
  as?: "section" | "div" | "article";
  sunken?: boolean;
  /** Ancre (« #historique »). */
  id?: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
} & Record<`data-${string}`, unknown>;

/** Panneau blanc à filet (ou « creux » sur fond secondaire). */
export function Panel({ as: Tag = "section", sunken, id, className, style, children, ...rest }: PanelProps) {
  return (
    <Tag id={id} className={cn("panel", sunken && "panel--sunken", className)} style={id ? { scrollMarginTop: 96, ...style } : style} {...rest}>
      {children}
    </Tag>
  );
}

type PanelHeadProps = { title: ReactNode; aside?: ReactNode; level?: 2 | 3 };

/** En-tête de panneau : un titre et, à droite, un complément (date, aide, lien). */
export function PanelHead({ title, aside, level = 2 }: PanelHeadProps) {
  const H = level === 2 ? "h2" : "h3";
  return (
    <div className="panel__head">
      <H>{title}</H>
      {typeof aside === "string" ? <span className="small muted">{aside}</span> : aside}
    </div>
  );
}

export function PanelBody({ className, style, children }: { className?: string; style?: CSSProperties; children: ReactNode }) {
  return (
    <div className={cn("panel__body", className)} style={style}>
      {children}
    </div>
  );
}

export function PanelFoot({ className, style, children }: { className?: string; style?: CSSProperties; children: ReactNode }) {
  return (
    <div className={cn("panel__foot", className)} style={style}>
      {children}
    </div>
  );
}
