import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/presentation/lib/cn";
import { Icon } from "./Icon";
import type { IconName } from "./icons";

export type NoticeTone = "info" | "ok" | "warn" | "danger";

const DEFAULT_ICON: Record<NoticeTone, IconName> = { info: "info", ok: "check-circle", warn: "alert", danger: "alert" };

type NoticeProps = {
  tone?: NoticeTone;
  /** Icône à gauche ; `false` pour aucune ; « spinner » pour une attente. */
  icon?: IconName | false | "spinner";
  title?: ReactNode;
  className?: string;
  style?: CSSProperties;
  role?: "alert" | "status";
  children?: ReactNode;
};

/** Message en ligne : ce qui s'est passé, puis quoi faire. */
export function Notice({ tone = "info", icon, title, className, style, role, children }: NoticeProps) {
  const ico = icon === undefined ? DEFAULT_ICON[tone] : icon;
  return (
    <div className={cn("notice", tone !== "info" && `notice--${tone}`, className)} style={style} role={role}>
      {ico === "spinner" ? <span className="spinner" aria-hidden="true" /> : ico ? <Icon name={ico} /> : null}
      <div>
        {title && (
          <p>
            <strong>{title}</strong>
          </p>
        )}
        {typeof children === "string" ? <p className="small">{children}</p> : children}
      </div>
    </div>
  );
}
