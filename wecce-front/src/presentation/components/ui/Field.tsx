import type { ReactNode } from "react";
import { cn } from "@/presentation/lib/cn";
import { Icon } from "./Icon";

type FieldProps = {
  /** Identifiant du champ : relie le libellé, l'aide et l'erreur. */
  id: string;
  label: ReactNode;
  /** Mention à côté du libellé, ex. « (facultatif) ». */
  optional?: boolean;
  hint?: ReactNode;
  /** Message d'erreur affiché sous le champ (null : aucune erreur). */
  error?: ReactNode | null;
  full?: boolean;
  className?: string;
  children: ReactNode;
};

/** Champ de formulaire : libellé persistant, aide, erreur qui dit quoi corriger. */
export function Field({ id, label, optional, hint, error, full, className, children }: FieldProps) {
  return (
    <div className={cn("field", full && "full", className)}>
      <label htmlFor={id}>
        {label}
        {optional && <span className="muted"> (facultatif)</span>}
      </label>
      {children}
      {hint && (
        <p className="hint" id={`${id}-aide`}>
          {hint}
        </p>
      )}
      {error && <FieldError>{error}</FieldError>}
    </div>
  );
}

export function FieldError({ children }: { children: ReactNode }) {
  return (
    <p className="err">
      <Icon name="alert" size="sm" />
      {children}
    </p>
  );
}
