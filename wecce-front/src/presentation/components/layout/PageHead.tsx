import type { ReactNode } from "react";

type PageHeadProps = {
  title: ReactNode;
  lead?: ReactNode;
  /** Bloc à droite (bouton, contrôle segmenté). */
  aside?: ReactNode;
  /** Contenu sous l'introduction (note de baisse…). */
  children?: ReactNode;
};

/** Titre d'écran, introduction courte et action à droite. */
export function PageHead({ title, lead, aside, children }: PageHeadProps) {
  return (
    <div className="page-head">
      <div>
        <h1>{title}</h1>
        {lead && <p>{lead}</p>}
        {children}
      </div>
      {aside}
    </div>
  );
}
