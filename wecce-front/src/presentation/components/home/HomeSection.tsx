import type { ReactNode } from "react";
import { Reveal } from "@/presentation/components/ui/Reveal";
import { cn } from "@/presentation/lib/cn";

type HomeSectionProps = {
  id?: string;
  /** « tint » : fond gris chaud ; « dark » : fond sombre. Jamais deux sections sombres d'affilée. */
  tone?: "tint" | "dark";
  title?: ReactNode;
  lead?: ReactNode;
  children: ReactNode;
};

/** Section de l'accueil : une idée par écran, un titre qui nomme la chose. */
export function HomeSection({ id, tone, title, lead, children }: HomeSectionProps) {
  return (
    <section className={cn("lsec", tone && `lsec--${tone}`)} id={id}>
      <div className="wrap">
        {title && (
          <Reveal className="lsec__head">
            <h2>{title}</h2>
            {lead && <p>{lead}</p>}
          </Reveal>
        )}
        {children}
      </div>
    </section>
  );
}
