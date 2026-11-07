import { useState } from "react";
import type { Movement, MovementKind, MovementType } from "@/domain/entities";
import { movementKind } from "@/domain/rules/movements";
import { Badge, type BadgeTone } from "@/presentation/components/ui/Badge";
import { ChipGroup } from "@/presentation/components/ui/Chip";
import { Icon } from "@/presentation/components/ui/Icon";
import type { IconName } from "@/presentation/components/ui/icons";
import { Ordinals } from "@/presentation/components/ui/Ordinals";
import { Panel, PanelBody } from "@/presentation/components/ui/Panel";
import { fmt } from "@/presentation/lib/format";
import { MOVEMENT_LABELS } from "@/presentation/lib/labels";

type Filter = "tout" | MovementKind;

const LOOK: Record<MovementType, { icon: IconName; tone: BadgeTone }> = {
  fonte: { icon: "down", tone: "neutral" },
  bonus: { icon: "gift", tone: "ok" },
  reprise: { icon: "store", tone: "ok" },
  acquisition: { icon: "wallet", tone: "info" },
  ajustement: { icon: "sliders", tone: "info" },
};

const EMPTY: Record<Filter, string> = {
  tout: "Aucun mouvement pour l'instant.",
  gain: "Aucun gain pour l'instant.",
  baisse: "Aucune baisse mensuelle pour l'instant.",
  depense: "Aucune dépense pour l'instant.",
};

/** Tous les mouvements de points, filtrables : gains, baisses mensuelles, dépenses. */
export function MovementsPanel({ movements }: { movements: Movement[] }) {
  const [filter, setFilter] = useState<Filter>("tout");
  const shown = movements.filter((m) => filter === "tout" || movementKind(m) === filter);

  return (
    <Panel id="historique">
      <div className="panel__head">
        <h2>Tous les mouvements</h2>
        <ChipGroup<Filter>
          label="Type de mouvement"
          value={filter}
          onChange={setFilter}
          options={[
            { value: "tout", label: "Tout" },
            { value: "gain", label: "Gains" },
            { value: "baisse", label: "Baisses mensuelles" },
            { value: "depense", label: "Dépenses" },
          ]}
        />
      </div>
      <PanelBody style={{ paddingTop: 12 }}>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Opération</th>
                <th>Détail</th>
                <th className="r">Points</th>
                <th className="r">Solde après</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((m, i) => (
                <tr key={`${m.date}-${i}`}>
                  <td>
                    <Ordinals text={m.date} />
                  </td>
                  <td>
                    <Badge tone={LOOK[m.type].tone}>
                      <Icon name={LOOK[m.type].icon} size="sm" />
                      {MOVEMENT_LABELS[m.type]}
                    </Badge>
                  </td>
                  <td className="muted">{m.detail}</td>
                  <td className={m.amount > 0 ? "r pts" : "r"}>{`${m.amount > 0 ? "+" : "−"} ${fmt(Math.abs(m.amount))}`}</td>
                  <td className="r">{fmt(m.balanceAfter)}</td>
                </tr>
              ))}
              {shown.length === 0 && (
                <tr>
                  <td colSpan={5} className="muted" style={{ padding: "28px 14px", textAlign: "center" }}>
                    {EMPTY[filter]}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </PanelBody>
    </Panel>
  );
}
