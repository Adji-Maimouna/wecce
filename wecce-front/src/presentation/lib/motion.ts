import type { CSSProperties } from "react";

/** Vrai quand la personne a demandé moins d'animations au système. */
export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

/** Rang d'un enfant dans une cascade (`data-stagger`) : décale son apparition. */
export function stagger(index: number, extra?: CSSProperties): CSSProperties {
  return { ...extra, ["--i" as string]: Math.min(index, 14) } as CSSProperties;
}

const BURST_COLORS = ["#e1ac10", "#24338f", "#f0c235", "#1c1a14"];

/** Éclats de célébration (points crédités, paiement confirmé, compte créé). */
export function burst(x: number, y: number): void {
  if (prefersReducedMotion()) return;
  for (let i = 0; i < 22; i++) {
    const d = document.createElement("span");
    d.className = "burst";
    d.style.left = `${x}px`;
    d.style.top = `${y}px`;
    d.style.background = BURST_COLORS[i % BURST_COLORS.length];
    document.body.appendChild(d);
    const a = Math.random() * Math.PI * 2;
    const dist = 70 + Math.random() * 110;
    const anim = d.animate(
      [
        { transform: "translate(-50%, -50%) scale(1)", opacity: 1 },
        {
          transform: `translate(calc(-50% + ${Math.cos(a) * dist}px), calc(-50% + ${Math.sin(a) * dist - 30}px)) scale(.3)`,
          opacity: 0,
        },
      ],
      { duration: 750 + Math.random() * 350, easing: "cubic-bezier(.05, .7, .1, 1)", fill: "forwards" },
    );
    anim.onfinish = () => d.remove();
  }
}

/** Éclats partis du centre d'un élément. */
export function burstFrom(el: Element | null | undefined): void {
  if (!el) return;
  const r = el.getBoundingClientRect();
  burst(r.left + r.width / 2, r.top + r.height / 2);
}
