import { useEffect, useRef, useState, type CSSProperties, type ElementType, type ReactNode } from "react";
import { cn } from "@/presentation/lib/cn";
import { prefersReducedMotion } from "@/presentation/lib/motion";

type RevealProps = {
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  id?: string;
  children: ReactNode;
};

/**
 * Le bloc « se pose » en entrant à l'écran. Il reste lisible avant (opacité 0,55),
 * jamais caché : voir .reveal dans styles/motion.css.
 */
export function Reveal({ as: Tag = "div", className, style, id, children }: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion() || !("IntersectionObserver" in window) || el.getBoundingClientRect().top < window.innerHeight) {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag ref={ref} id={id} className={cn("reveal", inView && "in", className)} style={style}>
      {children}
    </Tag>
  );
}
