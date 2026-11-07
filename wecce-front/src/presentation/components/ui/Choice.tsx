import type { ReactNode } from "react";
import { Icon } from "./Icon";
import type { IconName } from "./icons";

type ChoiceProps = {
  name: string;
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
  title: ReactNode;
  description?: ReactNode;
  icon?: IconName;
};

/** Carte radio : un choix lisible (moyen de paiement, état, motif). */
export function Choice({ name, value, checked, onChange, title, description, icon }: ChoiceProps) {
  return (
    <label className="choice">
      <input type="radio" name={name} value={value} checked={checked} onChange={() => onChange(value)} />
      {icon && <Icon name={icon} />}
      <span className="choice__main">
        <strong>{title}</strong>
        {description && <small>{description}</small>}
      </span>
    </label>
  );
}

type CheckboxProps = {
  id?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: ReactNode;
  invalid?: boolean;
};

/** Case à cocher avec son texte. */
export function Checkbox({ id, checked, onChange, children, invalid }: CheckboxProps) {
  return (
    <label className="check">
      <input id={id} type="checkbox" checked={checked} aria-invalid={invalid || undefined} onChange={(e) => onChange(e.target.checked)} />
      <span>{children}</span>
    </label>
  );
}
