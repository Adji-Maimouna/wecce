import type { ReactNode } from "react";

type SegmentedProps<V extends string> = {
  value: V;
  onChange: (value: V) => void;
  options: { value: V; label: ReactNode }[];
  label: string;
};

/** Contrôle segmenté (choix exclusif court : Hier / Aujourd'hui / Demain, Créditer / Débiter). */
export function Segmented<V extends string>({ value, onChange, options, label }: SegmentedProps<V>) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={o.value === value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
