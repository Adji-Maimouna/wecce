import { Badge } from "@/presentation/components/ui/Badge";
import { Icon } from "@/presentation/components/ui/Icon";
import type { Condition } from "@/domain/entities";

const BARS: Partial<Record<Condition, { on: number; label: string }>> = {
  "comme-neuf": { on: 3, label: "Comme neuf" },
  bon: { on: 2, label: "Bon état" },
  use: { on: 1, label: "Usé" },
};

/** État d'un objet : trois barres pour un appareil entier, une coche ou un badge pour une pièce. */
export function ConditionLabel({ condition }: { condition: Condition }) {
  const bars = BARS[condition];
  if (bars) {
    return (
      <span className="cond">
        <span className="cond__bars">
          {[0, 1, 2].map((i) => (
            <i key={i} className={i < bars.on ? "on" : undefined} />
          ))}
        </span>
        {bars.label}
      </span>
    );
  }
  if (condition === "fonctionnel") {
    return (
      <span className="state-tag">
        <Icon name="check" size="sm" />
        Fonctionnel
      </span>
    );
  }
  return <Badge tone="danger">Défectueux</Badge>;
}

/** Batterie restante (« 86 % »). */
export function BatteryLabel({ value }: { value: number }) {
  return (
    <span className="state-tag">
      <Icon name="battery" size="sm" />
      {value}&nbsp;%
    </span>
  );
}
