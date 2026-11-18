import { Notice } from "@/presentation/components/ui/Notice";
import { Panel, PanelBody, PanelHead } from "@/presentation/components/ui/Panel";
import type { AvailabilityDay } from "@/domain/entities";
import { AvailabilityPicker } from "./AvailabilityPicker";
import type { DepositDraft } from "./useDepositDraft";
import { WizardFoot } from "./WizardFoot";

type StepProps = {
  draft: DepositDraft;
  update: (p: Partial<DepositDraft>) => void;
  onPrev: () => void;
  onNext: () => void;
  days: AvailabilityDay[];
};

/** Étape 3 : demande de rendez-vous. L'étudiant donne ses disponibilités, LBC fixe le jour et l'heure. */
export function StepAppointment({ draft, update, onPrev, onNext, days }: StepProps) {
  return (
    <Panel>
      <PanelHead title="Demande de rendez-vous" aside="LBC · campus de l'UGB, entre les villages E et F" />
      <PanelBody className="stack" style={{ gap: 20 }}>
        <Notice icon="calendar" title="C'est LBC qui fixe le jour et l'heure.">
          Indiquez quand vous pouvez passer. La boutique vous répond avec un rendez-vous, visible dans « Mes dépôts ».
        </Notice>
        <AvailabilityPicker days={days} value={draft.availability} onChange={(availability) => update({ availability })} />
        <Notice title="Avant de venir">
          Apportez votre carte d'étudiant et le chargeur. Déconnectez votre compte Google, Microsoft ou iCloud et réinitialisez l'appareil,
          sinon LBC ne peut pas le reprendre.
        </Notice>
      </PanelBody>
      <WizardFoot onPrev={onPrev} onNext={onNext} />
    </Panel>
  );
}
