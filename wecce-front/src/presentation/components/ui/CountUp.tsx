import { useEffect, useRef, useState } from "react";
import { fmt } from "@/presentation/lib/format";
import { prefersReducedMotion } from "@/presentation/lib/motion";

type CountUpProps = {
  value: number;
  prefix?: string;
  suffix?: string;
  /** Durée en millisecondes. */
  duration?: number;
  className?: string;
};

/** Le nombre défile jusqu'à sa valeur quand il entre à l'écran (une seule fois). */
export function CountUp({ value, prefix = "", suffix = "", duration = 1200, className }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    let raf = 0;
    const run = () => {
      let t0 = 0;
      const step = (ts: number) => {
        if (!t0) t0 = ts;
        const p = Math.min(1, (ts - t0) / duration);
        const ease = 1 - Math.pow(1 - p, 4);
        setShown(p < 1 ? value * ease : null);
        if (p < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          run();
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {fmt(shown ?? value)}
      {suffix}
    </span>
  );
}
