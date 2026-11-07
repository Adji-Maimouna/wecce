import type { ReactNode } from "react";
import { cn } from "@/presentation/lib/cn";
import { Icon } from "./Icon";
import type { IconName } from "./icons";

type ChipProps = {
  pressed: boolean;
  onClick: () => void;
  icon?: IconName;
  count?: number;
  /** « points » : la puce « Dans mon solde », en moutarde quand elle est active. */
  tone?: "points";
  children: ReactNode;
};

/** Puce de filtre (bouton à bascule). */
export function Chip({ pressed, onClick, icon, count, tone, children }: ChipProps) {
  return (
    <button className={cn("chip", tone && `chip--${tone}`)} type="button" aria-pressed={pressed} onClick={onClick}>
      {icon && <Icon name={icon} size="sm" />}
      {children}
      {count !== undefined && <span className="count">{count}</span>}
    </button>
  );
}

export type ChipOption<V extends string> = { value: V; label: ReactNode; icon?: IconName; count?: number };

type ChipGroupProps<V extends string> = {
  value: V;
  onChange: (value: V) => void;
  options: ChipOption<V>[];
  label: string;
  /** Défile horizontalement sur téléphone. */
  scroll?: boolean;
};

/** Groupe de puces à sélection unique. */
export function ChipGroup<V extends string>({ value, onChange, options, label, scroll }: ChipGroupProps<V>) {
  return (
    <div className={cn("chips", scroll && "chips--scroll")} role="group" aria-label={label}>
      {options.map((o) => (
        <Chip key={o.value} pressed={o.value === value} onClick={() => onChange(o.value)} icon={o.icon} count={o.count}>
          {o.label}
        </Chip>
      ))}
    </div>
  );
}
