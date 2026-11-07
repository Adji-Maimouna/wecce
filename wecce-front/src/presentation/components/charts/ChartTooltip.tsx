import { useCallback, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

type Tip = { text: string; x: number; y: number } | null;

/**
 * Infobulles des graphiques : tout élément `.hit[data-tip]` du bloc affiche sa valeur
 * au survol et au focus clavier (les points sont focusables, avec un aria-label).
 */
export function ChartTooltip({ children }: { children: ReactNode }) {
  const [tip, setTip] = useState<Tip>(null);
  const [tipEl, setTipEl] = useState<HTMLDivElement | null>(null);

  const show = useCallback((target: EventTarget | null) => {
    const el = (target as Element | null)?.closest?.(".hit[data-tip]");
    if (!el) return;
    document.querySelectorAll(".hit.is-on").forEach((n) => n.classList.remove("is-on"));
    el.classList.add("is-on");
    const r = el.getBoundingClientRect();
    setTip({ text: el.getAttribute("data-tip") ?? "", x: r.left + r.width / 2 + window.scrollX, y: r.top + window.scrollY });
  }, []);

  const hide = useCallback((target: EventTarget | null) => {
    (target as Element | null)?.closest?.(".hit")?.classList.remove("is-on");
    setTip(null);
  }, []);

  // Position après mesure de la largeur de l'infobulle, sans sortir de l'écran.
  const width = tipEl?.offsetWidth ?? 0;
  const height = tipEl?.offsetHeight ?? 0;
  const left = tip ? Math.min(window.innerWidth + window.scrollX - width - 8, Math.max(8, tip.x - width / 2)) : 0;

  return (
    <div
      onMouseOver={(e) => show(e.target)}
      onMouseOut={(e) => hide(e.target)}
      onFocus={(e) => show(e.target)}
      onBlur={(e) => hide(e.target)}
    >
      {children}
      {tip &&
        createPortal(
          <div ref={setTipEl} className="tip" style={{ left, top: tip.y - height - 10, visibility: width ? "visible" : "hidden" }}>
            {tip.text}
          </div>,
          document.body,
        )}
    </div>
  );
}
