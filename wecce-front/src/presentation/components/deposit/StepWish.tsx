import { AmountInput } from "@/presentation/components/ui/AmountInput";
import { Notice } from "@/presentation/components/ui/Notice";
import { Panel, PanelBody, PanelHead } from "@/presentation/components/ui/Panel";
import type { DepositDraft } from "./useDepositDraft";
import { WizardFoot } from "./WizardFoot";

type StepProps = {
  draft: DepositDraft;
  update: (p: Partial<DepositDraft>) => void;
  onPrev: () => void;
  onNext: () => void;
  /** Repère tiré des reprises passées comparables, s'il y en a assez (sinon null). */
  pastTakeBacks: string | null;
};

/** Étape 2 : le prix espéré, privé. Wecce n'estime jamais l'appareil. */
export function StepWish({ draft, update, onPrev, onNext, pastTakeBacks }: StepProps) {
  return (
    <Panel>
      <PanelHead title="Ce que vous espérez en recevoir" />
      <PanelBody className="stack" style={{ gap: 18 }}>
        <div className="field" style={{ maxWidth: 320 }}>
          <label htmlFor="souhait">
            Prix souhaité{" "}
            <span className="muted" style={{ fontWeight: 400 }}>
              (facultatif)
            </span>
          </label>
          <AmountInput id="souhait" value={draft.souhait} onChange={(souhait) => update({ souhait })} />
        </div>
        <Notice icon="private" title="Seuls vous et LBC voyez ce prix.">
          Il n'apparaît jamais sur le marché.
        </Notice>
        <div className="cols--even cols" style={{ gap: 18 }}>
          <div className="stack" style={{ gap: 6 }}>
            <h3 style={{ fontSize: "var(--t-md)" }}>Wecce n'estime pas votre appareil</h3>
            <p className="small muted">
              À l'examen, LBC vous annonce deux prix : les points que vous recevez et le prix de revente. Vous acceptez, ou vous gardez votre
              appareil.
            </p>
          </div>
          <div className="stack" style={{ gap: 6 }}>
            <h3 style={{ fontSize: "var(--t-md)" }}>Les reprises passées</h3>
            <p className="small muted">{pastTakeBacks ?? "Pas encore assez de reprises d'appareils comparables pour donner un repère."}</p>
          </div>
        </div>
      </PanelBody>
      <WizardFoot onPrev={onPrev} onNext={onNext} />
    </Panel>
  );
}
