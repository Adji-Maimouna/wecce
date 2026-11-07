import { useEffect, useRef, type ReactNode } from "react";
import { Icon } from "@/presentation/components/ui/Icon";
import { burstFrom } from "@/presentation/lib/motion";

type WelcomeProps = {
  id: string;
  title: string;
  children: ReactNode;
  actions: ReactNode;
  /** Éclats de célébration à l'arrivée (compte créé). */
  celebrate?: boolean;
};

/** Écran de réussite : une coche moutarde, un titre, la suite. */
export function Welcome({ id, title, children, actions, celebrate }: WelcomeProps) {
  const mark = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!celebrate) return;
    const t = window.setTimeout(() => burstFrom(mark.current), 250);
    return () => clearTimeout(t);
  }, [celebrate]);

  return (
    <section className="welcome" aria-labelledby={id}>
      <span className="welcome__mark" ref={mark}>
        <Icon name="check" />
      </span>
      <h1 id={id}>{title}</h1>
      <p className="muted">{children}</p>
      <div className="welcome__actions">{actions}</div>
    </section>
  );
}
