import { Button } from "@/presentation/components/ui/Button";
import { Panel, PanelBody, PanelHead } from "@/presentation/components/ui/Panel";
import { Tbd } from "@/presentation/components/ui/Tbd";
import type { AppointmentDay } from "@/domain/entities";
import { AGE_LABELS, DEVICE_CONDITIONS, PART_CONDITIONS } from "@/presentation/lib/labels";
import { appointmentLabel } from "./appointmentLabel";
import type { DepositDraft } from "./useDepositDraft";
import { WizardFoot } from "./WizardFoot";

type StepProps = {
  draft: DepositDraft;
  days: AppointmentDay[];
  times: string[];
  busy?: boolean;
  onPrev: () => void;
  onConfirm: (appointment: string) => void;
};

/** Étape 4 : récapitulatif et déroulé du rendez-vous. */
export function StepReview({ draft, days, times, busy, onPrev, onConfirm }: StepProps) {
  const piece = draft.category === "piece";
  const etat = piece ? PART_CONDITIONS[draft.etatPiece].label : DEVICE_CONDITIONS[draft.etat].label;
  const photos = draft.photos.filter(Boolean).length;
  const rdv = appointmentLabel(draft, days, times);

  return (
    <Panel>
      <PanelHead title="Vérifiez avant de confirmer" />
      <PanelBody className="cols cols--even" style={{ gap: 24 }}>
        <dl className="dl small" style={{ alignContent: "start" }}>
          <dt>Appareil</dt>
          <dd>{[draft.modele.trim() || "Appareil", draft.stockage.trim()].filter(Boolean).join(" · ")}</dd>
          <dt>Âge et état</dt>
          <dd>{`${AGE_LABELS[draft.age]} · ${etat.toLowerCase()}`}</dd>
          <dt>Photos</dt>
          <dd>{photos === 0 ? "aucune pour l'instant" : photos}</dd>
          <dt>Prix souhaité</dt>
          <dd>{draft.souhait ? `${draft.souhait} pts` : "non indiqué"}</dd>
          <dt>Rendez-vous</dt>
          <dd>{rdv}</dd>
        </dl>
        <div className="stack" style={{ gap: 10 }}>
          <h3 style={{ fontSize: "var(--t-md)" }}>Au rendez-vous</h3>
          <ol className="small muted" style={{ margin: 0, paddingLeft: "1.2em", display: "flex", flexDirection: "column", gap: 6 }}>
            <li>L'agent vérifie l'écran, la batterie, les comptes et le fonctionnement.</li>
            <li>Il vous annonce les deux prix.</li>
            <li>Vous signez le renoncement, ou vous gardez votre appareil.</li>
            <li>Les points sont crédités à la signature, bonus compris.</li>
          </ol>
          <p className="xs muted">
            La boutique peut refuser un appareil :{" "}
            <Tbd note="Critères de refus à trancher (§11.3)">écran cassé, compte encore lié, batterie sous 70 %, modèle introuvable</Tbd>.
          </p>
        </div>
      </PanelBody>
      <WizardFoot
        onPrev={onPrev}
        next={
          <Button size="lg" onClick={() => onConfirm(rdv)} disabled={draft.slot === null || busy}>
            Prendre rendez-vous
          </Button>
        }
      />
    </Panel>
  );
}
