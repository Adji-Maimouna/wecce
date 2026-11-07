type SwitchProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  id?: string;
};

/** Interrupteur (état binaire qui prend effet tout de suite). */
export function Switch({ checked, onChange, label, id }: SwitchProps) {
  return (
    <label className="switch">
      <input id={id} type="checkbox" role="switch" aria-label={label} checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span />
    </label>
  );
}
