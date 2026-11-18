import { useState } from "react";
import { RuleViolation } from "@/application";
import type { AppointmentDay, Deposit } from "@/domain/entities";
import { AppointmentPicker } from "@/presentation/components/deposit/AppointmentPicker";
import { appointmentLabel } from "@/presentation/components/deposit/appointmentLabel";
import { useToast } from "@/presentation/components/feedback/toastContext";
import { Crumbs } from "@/presentation/components/layout/Crumbs";
import { PageHead } from "@/presentation/components/layout/PageHead";
import { PageTitle } from "@/presentation/components/layout/PageTitle";
import { StudentLayout } from "@/presentation/components/layout/StudentLayout";
import { Button, ButtonLink } from "@/presentation/components/ui/Button";
import { Notice } from "@/presentation/components/ui/Notice";
import { Panel, PanelBody, PanelFoot, PanelHead } from "@/presentation/components/ui/Panel";
import { useUseCases } from "@/presentation/hooks/useUseCases";
import { useGo } from "@/presentation/lib/navigation";
import { paths } from "@/presentation/lib/paths";

export type ChangerRendezVousProps = {
  deposit: Deposit;
  days: AppointmentDay[];
  times: string[];
  /** Le rendez-vous actuel dans le planning (s'il y figure), sinon le premier créneau libre. */
  initial: { day: number; slot: number | null };
  /** Rang du rendez-vous actuel, pour ne pas le « confirmer » à nouveau. */
  current: { day: number; slot: number } | null;
};

/** Changer le rendez-vous d'un dépôt : un autre jour, un autre créneau. L'ancien créneau est libéré. */
export default function ChangerRendezVous({ deposit: d, days, times, initial, current }: ChangerRendezVousProps) {
  const [choice, setChoice] = useState<{ day: number; slot: number | null }>(initial);
  const [busy, setBusy] = useState(false);
  const unchanged = !!current && current.day === choice.day && current.slot === choice.slot;
  const { rescheduleDeposit } = useUseCases();
  const toast = useToast();
  const go = useGo();

  return (
    <StudentLayout section="depots">
      <PageTitle>Changer le rendez-vous</PageTitle>
      <div className="wrap" style={{ maxWidth: 1040 }}>
        <Crumbs items={[{ label: "Mes dépôts", href: paths.depots }, { label: d.ref }]} />
        <PageHead title="Changer le rendez-vous" lead={`${d.deviceName} · dépôt ${d.ref}`} />
        <Panel>
          <PanelHead title="Nouveau créneau chez LBC" aside="LBC · campus de l'UGB, entre les villages E et F" />
          <PanelBody className="stack" style={{ gap: 20 }}>
            {d.appointment && (
              <Notice
                tone={d.appointment.missed ? "warn" : undefined}
                icon={d.appointment.missed ? "alert" : "calendar"}
                title={d.appointment.missed ? `Rendez-vous manqué : ${d.appointment.label}.` : `Rendez-vous actuel : ${d.appointment.label}.`}
              >
                {d.appointment.missed
                  ? "Votre créneau précédent est dépassé. Sélectionnez un nouveau jour et une nouvelle heure ci-dessous."
                  : "Il est libéré dès que vous confirmez le nouveau créneau."}
              </Notice>
            )}
            <AppointmentPicker days={days} times={times} day={choice.day} slot={choice.slot} onChange={(day, slot) => setChoice({ day, slot })} />
          </PanelBody>
          <PanelFoot>
            <ButtonLink href={paths.depots} variant="ghost">
              Garder le rendez-vous actuel
            </ButtonLink>
            <span className="spacer" />
            <Button
              size="lg"
              disabled={choice.slot === null || unchanged || busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await rescheduleDeposit(d.ref, choice.day, choice.slot);
                  toast(`Rendez-vous déplacé : ${appointmentLabel(choice, days, times)}.`);
                  window.setTimeout(() => go(paths.depots), 1200);
                } catch (e) {
                  setBusy(false);
                  toast(e instanceof RuleViolation ? e.message : "Le rendez-vous n'a pas pu être déplacé. Réessayez.");
                }
              }}
            >
              Confirmer le nouveau créneau
            </Button>
          </PanelFoot>
        </Panel>
      </div>
    </StudentLayout>
  );
}
