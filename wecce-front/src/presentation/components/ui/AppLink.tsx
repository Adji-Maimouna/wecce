import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from "react";
import { Link as InertiaLink, type InertiaLinkProps } from "@inertiajs/react";

type AppLinkProps = Omit<InertiaLinkProps, "href" | "onClick"> & {
  href: string;
  children?: ReactNode;
  className?: string;
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void;
};

/**
 * Lien interne de l'application Wecce connecté à Inertia.
 * Les liens externes (http…) et les ancres seules (#…) restent de simples <a>.
 */
export function AppLink({ href, children, onClick, ...rest }: AppLinkProps) {
  if (/^(https?:|mailto:|tel:)/.test(href) || href.startsWith("#")) {
    const anchorProps = rest as AnchorHTMLAttributes<HTMLAnchorElement>;
    return (
      <a href={href} onClick={onClick} {...anchorProps}>
        {children}
      </a>
    );
  }

  const inertiaClick = onClick as unknown as InertiaLinkProps["onClick"];

  return (
    <InertiaLink href={href} onClick={inertiaClick} {...rest}>
      {children}
    </InertiaLink>
  );
}
