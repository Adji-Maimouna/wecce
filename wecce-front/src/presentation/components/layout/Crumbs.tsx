import { Fragment } from "react";
import { AppLink } from "@/presentation/components/ui/AppLink";

export type Crumb = { label: string; href?: string };

/** Fil d'Ariane : Marché › Téléphones › Galaxy A12. */
export function Crumbs({ items }: { items: Crumb[] }) {
  return (
    <nav className="crumbs" aria-label="Fil d'Ariane">
      {items.map((c, i) => (
        <Fragment key={c.label}>
          {i > 0 && <span aria-hidden="true">›</span>}
          {c.href ? <AppLink href={c.href}>{c.label}</AppLink> : <span aria-current="page">{c.label}</span>}
        </Fragment>
      ))}
    </nav>
  );
}
