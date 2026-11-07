type StepsProps = {
  labels: string[];
  /** Étape courante, à partir de 1. */
  current: number;
  onSelect?: (step: number) => void;
};

/** Fil d'étapes numérotées : faites (coche verte), en cours (moutarde), à venir. */
export function Steps({ labels, current, onSelect }: StepsProps) {
  return (
    <ol className="steps" aria-label="Étapes">
      {labels.map((label, i) => {
        const n = i + 1;
        return (
          <li
            key={label}
            className={n < current ? "done" : undefined}
            aria-current={n === current ? "step" : undefined}
            style={onSelect ? { cursor: "pointer" } : undefined}
            onClick={onSelect ? () => onSelect(n) : undefined}
          >
            <span>{label}</span>
          </li>
        );
      })}
    </ol>
  );
}
