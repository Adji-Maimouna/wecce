import { useState } from "react";
import { RuleViolation } from "@/application";
import type { DepositsState } from "@/domain/entities";
import { useToast } from "@/presentation/components/feedback/toastContext";
import { Badge } from "@/presentation/components/ui/Badge";
import { Button } from "@/presentation/components/ui/Button";
import { Field } from "@/presentation/components/ui/Field";
import { Notice } from "@/presentation/components/ui/Notice";
import { Panel, PanelBody, PanelFoot, PanelHead } from "@/presentation/components/ui/Panel";
import { Switch } from "@/presentation/components/ui/Switch";
import { Tbd } from "@/presentation/components/ui/Tbd";
import { useUseCases } from "@/presentation/hooks/useUseCases";

/** Dépôts : couverture du jour, suspension automatique, suspension à la main avec motif. */
export function DepositsControl({ state }: { state: DepositsState }) {
  const [suspended, setSuspended] = useState(state.suspended);
  const [reason, setReason] = useState(state.reason ?? "");
  const [error, setError] = useState<string | null>(null);
  const { setDepositsSuspended } = useUseCases();
  const toast = useToast();

  async function apply(next: boolean) {
    setError(null);
    try {
      await setDepositsSuspended(next, reason);
      setSuspended(next);
      if (!next) setReason("");
      toast(next ? "Dépôts suspendus. Le motif s'affiche aux étudiants." : "Dépôts rouverts.");
    } catch (e) {
      setError(e instanceof RuleViolation ? e.message : "L'action n'a pas abouti.");
    }
  }
  const level = state.coverageRatio < state.autoSuspendBelow ? "sous le seuil" : "ouvert";

  return (
    <Panel>
      <PanelHead
        title="Dépôts"
        aside={
          suspended ? (
            <Badge tone="danger" dot>
              Suspendus
            </Badge>
          ) : (
            <Badge tone="ok" dot>
              Ouverts
            </Badge>
          )
        }
      />
      <PanelBody className="stack" style={{ gap: 16 }}>
        <dl className="dl small">
          <dt>Couverture du jour</dt>
          <dd>
            {Math.round(state.coverageRatio * 100)} % · {level}
          </dd>
          <dt>Suspension automatique</dt>
          <dd>
            sous <Tbd note="Seuil à trancher (§11.5)">{Math.round(state.autoSuspendBelow * 100)} %</Tbd>
          </dd>
          <dt>Rendez-vous à venir</dt>
          <dd>{state.upcomingAppointments}, maintenus en cas de suspension</dd>
        </dl>
        <hr className="divider" />
        <div className="row" style={{ justifyContent: "space-between", flexWrap: "nowrap", alignItems: "flex-start" }}>
          <div>
            <div className="label">Suspendre les dépôts à la main</div>
            <p className="hint">Par exemple pendant les examens ou une fermeture de la boutique.</p>
          </div>
          <Switch label="Suspension manuelle" checked={suspended} onChange={apply} />
        </div>
        <Field id="motif-susp" label="Motif" error={error}>
          <input className="input" id="motif-susp" placeholder="Visible des étudiants sur la page de dépôt" value={reason} onChange={(e) => setReason(e.target.value)} />
        </Field>
        {suspended && state.suspendedAt && (
          <Notice tone="warn" icon="pause">
            <p className="small">
              <strong>Suspendus le {state.suspendedAt}.</strong> Motif affiché aux étudiants : « {state.reason} »
            </p>
          </Notice>
        )}
      </PanelBody>
      <PanelFoot>
        {suspended ? <Button onClick={() => apply(false)}>Rouvrir les dépôts</Button> : <Button onClick={() => apply(true)}>Suspendre les dépôts</Button>}
      </PanelFoot>
    </Panel>
  );
}
