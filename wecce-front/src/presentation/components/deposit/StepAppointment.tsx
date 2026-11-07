import { Notice } from "@/presentation/components/ui/Notice";
import { Panel, PanelBody, PanelHead } from "@/presentation/components/ui/Panel";
import type { AppointmentDay } from "@/domain/entities";
import { AppointmentPicker } from "./AppointmentPicker";
import type { DepositDraft } from "./useDepositDraft";
import { WizardFoot } from "./WizardFoot";

type StepProps = {
  draft: DepositDraft;
  update: (p: Partial<DepositDraft>) => void;
  onPrev: () => void;
  onNext: () => void;
  days: AppointmentDay[];
  times: string[];
};

/** Étape 3 : rendez-vous chez LBC. */
export function StepAppointment({ draft, update, onPrev, onNext, days, times }: StepProps) {
  return (
    <Panel>
      <PanelHead title="Rendez-vous en boutique" aside="LBC · campus de l'UGB, entre les villages E et F" />
      <PanelBody className="stack" style={{ gap: 20 }}>
        <AppointmentPicker days={days} times={times} day={draft.day} slot={draft.slot} onChange={(day, slot) => update({ day, slot })} />
        <Notice title="Avant de venir">
          Apportez votre carte d'étudiant et le chargeur. Déconnectez votre compte Google, Microsoft ou iCloud et réinitialisez l'appareil,
          sinon LBC ne peut pas le reprendre.
        </Notice>
      </PanelBody>
      <WizardFoot onPrev={onPrev} onNext={onNext} />
    </Panel>
  );
}
