import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/presentation/lib/cn";
import { AppLink } from "./AppLink";

export type ButtonVariant = "primary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

type Common = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Pleine largeur ; « sm » : pleine largeur seulement sur téléphone. */
  block?: boolean | "sm";
  className?: string;
  children?: ReactNode;
};

function classes({ variant = "primary", size = "md", block, className }: Common) {
  return cn(
    "btn",
    variant !== "primary" && `btn--${variant}`,
    size !== "md" && `btn--${size}`,
    block === true && "btn--block",
    block === "sm" && "btn--block-sm",
    className,
  );
}

type ButtonProps = Common & Omit<ComponentProps<"button">, "className">;

/** Bouton d'action. Un seul bouton plein (cobalt) par vue ; les autres en « ghost ». */
export function Button({ variant, size, block, className, type = "button", ...rest }: ButtonProps) {
  return <button type={type} className={classes({ variant, size, block, className })} {...rest} />;
}

type ButtonLinkProps = Common & {
  href: string;
  disabled?: boolean;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  "aria-label"?: string;
};

/** Lien qui a l'allure d'un bouton (navigation). */
export function ButtonLink({ href, disabled, onClick, variant, size, block, className, children, ...rest }: ButtonLinkProps) {
  return (
    <AppLink
      href={href}
      className={classes({ variant, size, block, className })}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : undefined}
      onClick={(e) => {
        if (disabled) e.preventDefault();
        else onClick?.(e);
      }}
      {...rest}
    >
      {children}
    </AppLink>
  );
}
