import type { CSSProperties } from "react";
import { cn } from "@/presentation/lib/cn";
import { ICON_PATHS, type IconName } from "./icons";

type IconProps = {
  name: IconName;
  /** « sm » : 1em, « lg » : 1,5em ; par défaut 1,25em. */
  size?: "sm" | "lg";
  className?: string;
  style?: CSSProperties;
};

/** Icône décorative (aria-hidden) : le texte voisin porte le sens. */
export function Icon({ name, size, className, style }: IconProps) {
  return (
    <svg
      className={cn("i", size && `i--${size}`, className)}
      style={style}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      dangerouslySetInnerHTML={{ __html: ICON_PATHS[name] }}
    />
  );
}
