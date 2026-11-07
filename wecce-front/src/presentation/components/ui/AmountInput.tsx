import type { InputHTMLAttributes } from "react";
import { formatDigits } from "@/presentation/lib/format";

type AmountInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> & {
  value: string;
  onChange: (formatted: string) => void;
  unit?: string;
  invalid?: boolean;
};

/** Montant en points : chiffres seulement, milliers séparés pendant la frappe, unité à droite. */
export function AmountInput({ value, onChange, unit = "pts", invalid, ...rest }: AmountInputProps) {
  return (
    <div className="affix">
      <input
        className="input"
        inputMode="numeric"
        autoComplete="off"
        value={value}
        aria-invalid={invalid || undefined}
        onChange={(e) => onChange(formatDigits(e.target.value))}
        {...rest}
      />
      <span className="affix__unit">{unit}</span>
    </div>
  );
}
