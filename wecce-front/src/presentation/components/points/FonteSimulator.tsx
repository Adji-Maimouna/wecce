import { useId, useState, type CSSProperties } from "react";
import { pts } from "@/presentation/lib/format";
import { afterFonte } from "@/domain/rules/points";

type FonteSimulatorProps = {
  balance: number;
  /** L'objet de référence et son prix d'aujourd'hui. */
  itemName: string;
  itemPrice: number;
  /** Libellés des trois colonnes. */
  labels?: { balance: string; item: string; rest: string };
  /** Accueil : « 0 mois » ; espace étudiant : « 0 mois, aujourd'hui ». */
  todayLabel?: string;
  /** Phrase de conclusion sous la jauge. */
  conclusion: string;
  className?: string;
  style?: CSSProperties;
};

const MAX_MONTHS = 6;

/**
 * Curseur du pouvoir d'achat : mois après mois, le solde et le prix baissent de 5 %,
 * et la part du prix couverte par le solde ne bouge pas.
 */
export function FonteSimulator({
  balance,
  itemName,
  itemPrice,
  labels = { balance: "Vos points", item: itemName, rest: "Il vous reste" },
  todayLabel = "0 mois, aujourd'hui",
  conclusion,
  className,
  style,
}: FonteSimulatorProps) {
  const id = useId();
  const [months, setMonths] = useState(0);
  const solde = afterFonte(balance, months);
  const prix = afterFonte(itemPrice, months);
  const share = Math.round((itemPrice / balance) * 100);

  return (
    <div className={["sim", className].filter(Boolean).join(" ")} style={style}>
      <label className="sim__label" htmlFor={id}>
        Dans <strong>{months === 0 ? todayLabel : months === 1 ? "1 mois" : `${months} mois`}</strong>
      </label>
      <input
        className="range"
        type="range"
        id={id}
        min={0}
        max={MAX_MONTHS}
        step={1}
        value={months}
        onChange={(e) => setMonths(Number(e.target.value))}
        style={{ ["--fill" as string]: `${(months / MAX_MONTHS) * 100}%` } as CSSProperties}
      />
      <div className="sim__cols">
        <div className="sim__cell">
          <span className="xs muted">{labels.balance}</span>
          <strong className="sim__num pts">{pts(solde)}</strong>
        </div>
        <div className="sim__cell">
          <span className="xs muted">{labels.item}</span>
          <strong className="sim__num">{pts(prix)}</strong>
        </div>
        <div className="sim__cell">
          <span className="xs muted">{labels.rest}</span>
          <strong className="sim__num">{pts(solde - prix)}</strong>
        </div>
      </div>
      <div className="jauge jauge--lg" aria-hidden="true">
        <span className="jauge__pts" style={{ width: `${share}%` }} />
      </div>
      <p className="small" style={{ color: "var(--ok)", fontWeight: 700 }}>
        {conclusion}
      </p>
    </div>
  );
}
