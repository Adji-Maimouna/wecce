import { useState } from "react";
import { RuleViolation } from "@/application";
import type { LaunchBonus } from "@/domain/entities";
import { useToast } from "@/presentation/components/feedback/toastContext";
import { Badge } from "@/presentation/components/ui/Badge";
import { Button } from "@/presentation/components/ui/Button";
import { Field } from "@/presentation/components/ui/Field";
import { Panel, PanelBody, PanelFoot, PanelHead } from "@/presentation/components/ui/Panel";
import { useUseCases } from "@/presentation/hooks/useUseCases";
import { BONUS_MAX_QUOTA, BONUS_MAX_RATE } from "@/domain/rules/expertise";

/** Bonus de lancement : avancement, taux, quota, motif obligatoire pour enregistrer. */
export function BonusControl({ bonus }: { bonus: LaunchBonus }) {
  const [rate, setRate] = useState(String(bonus.rate));
  const [quota, setQuota] = useState(String(bonus.quota));
  const [ceiling, setCeiling] = useState(String(bonus.ceiling ?? 5000));
  const [onePerStudent, setOnePerStudent] = useState(bonus.onePerStudent ?? true);
  const maxRate = bonus.limits?.maxRate ?? BONUS_MAX_RATE;
  const maxQuota = bonus.limits?.maxQuota ?? BONUS_MAX_QUOTA;
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { saveBonus } = useUseCases();
  const toast = useToast();
  const ready = reason.trim().length >= 5;
  const used = Math.min(100, Math.round((bonus.used / bonus.quota) * 100));

  return (
    <Panel>
      <PanelHead
        title="Bonus de lancement"
        aside={
          <Badge tone={bonus.active ? "ok" : "line"} dot>
            {bonus.active ? "Actif" : "Inactif"}
          </Badge>
        }
      />
      <PanelBody className="stack" style={{ gap: 16 }}>
        <div>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <span className="small">
              {bonus.used} dépôts bonifiés sur {bonus.quota}
            </span>
            <span className="small muted">il en reste {Math.max(0, bonus.quota - bonus.used)}</span>
          </div>
          <div className="bar" style={{ marginTop: 8 }} role="progressbar" aria-valuenow={bonus.used} aria-valuemin={0} aria-valuemax={bonus.quota}>
            <span style={{ width: `${used}%` }} />
          </div>
        </div>
        <div className="form-grid">
          <Field id="taux" label={`Taux du bonus (max. ${maxRate} %)`}>
            <div className="affix">
              <input className="input" id="taux" inputMode="numeric" value={rate} onChange={(e) => setRate(e.target.value.replace(/\D/g, "").slice(0, 3))} />
              <span className="affix__unit">%</span>
            </div>
          </Field>
          <Field id="quota" label={`Nombre de dépôts bonifiés (max. ${maxQuota})`}>
            <input className="input" id="quota" inputMode="numeric" value={quota} onChange={(e) => setQuota(e.target.value.replace(/\D/g, "").slice(0, 5))} />
          </Field>
          <Field id="plafond" label="Plafond par dépôt">
            <div className="affix">
              <input className="input" id="plafond" inputMode="numeric" value={ceiling} onChange={(e) => setCeiling(e.target.value.replace(/\D/g, "").slice(0, 5))} />
              <span className="affix__unit">pts</span>
            </div>
          </Field>
          <label className="check" style={{ alignSelf: "end", paddingBottom: 10 }}>
            <input type="checkbox" checked={onePerStudent} onChange={(e) => setOnePerStudent(e.target.checked)} />
            <span>Un seul bonus par étudiant</span>
          </label>
        </div>
        <p className="hint">Le bonus est versé en points, jamais en argent. Il ne dépasse jamais le plafond par dépôt.</p>
        <Field id="motif-bonus" label="Motif du changement" error={error}>
          <input className="input" id="motif-bonus" placeholder="Obligatoire pour enregistrer" value={reason} onChange={(e) => setReason(e.target.value)} />
        </Field>
      </PanelBody>
      <PanelFoot>
        <Button
          disabled={!ready}
          onClick={async () => {
            setError(null);
            try {
              await saveBonus(Number(rate), Number(quota), reason, { ceiling: Number(ceiling || 0), onePerStudent });
              toast("Bonus enregistré et inscrit au journal.");
              setReason("");
            } catch (e) {
              setError(e instanceof RuleViolation ? e.message : "L'enregistrement n'a pas abouti.");
            }
          }}
        >
          Enregistrer le bonus
        </Button>
        {!ready && <span className="xs muted">Saisissez un motif pour enregistrer.</span>}
      </PanelFoot>
    </Panel>
  );
}
