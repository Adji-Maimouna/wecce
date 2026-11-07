import type { AnchorHTMLAttributes, ReactNode } from "react";
import { Link } from "react-router";

type AppLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string;
  children?: ReactNode;
};

/**
 * Lien interne de l'application.
 * Aujourd'hui : React Router (avec transition de vue). Avec Inertia : `import { Link } from "@inertiajs/react"`.
 * Les liens externes (http…) et les ancres seules (#…) restent de simples <a>.
 */
export function AppLink({ href, children, ...rest }: AppLinkProps) {
  if (/^(https?:|mailto:|tel:)/.test(href) || href.startsWith("#")) {
    return (
      <a href={href} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <Link to={href} viewTransition {...rest}>
      {children}
    </Link>
  );
}
