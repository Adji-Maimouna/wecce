import { useEffect } from "react";
import { prefersReducedMotion } from "@/presentation/lib/motion";

const RIPPLE_HOSTS = ".btn, .chip, .seg button, .slot, .day";

/** Onde Material au clic, partie du point touché, sur tous les boutons, puces et créneaux. */
export function useGlobalRipple(): void {
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      const el = (e.target as Element | null)?.closest<HTMLElement>(RIPPLE_HOSTS);
      if (!el || (el as HTMLButtonElement).disabled || prefersReducedMotion()) return;
      const r = el.getBoundingClientRect();
      const size = Math.max(r.width, r.height) * 2.4;
      const s = document.createElement("span");
      s.className = "ripple";
      s.style.width = s.style.height = `${size}px`;
      s.style.left = `${e.clientX - r.left - size / 2}px`;
      s.style.top = `${e.clientY - r.top - size / 2}px`;
      el.appendChild(s);
      window.setTimeout(() => s.remove(), 700);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, []);
}
