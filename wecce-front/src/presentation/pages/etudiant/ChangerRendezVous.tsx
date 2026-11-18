import { useState } from "react";
import { RuleViolation } from "@/application";
import type { AppointmentAvailability, AvailabilityDay, Deposit } from "@/domain/entities";
import { AvailabilityPicker } from "@/presentation/components/deposit/AvailabilityPicker";
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
  /** Jours d'ouverture proposés. */
  availabilityDays?: AvailabilityDay[];
  /** Disponibilités déjà envoyées, pour les modifier. */
  availability?: AppointmentAvailability | null;
};

/**
 * Demander un (autre) rendez-vous : l'étudiant redonne ses disponibilités, LBC fixe le jour et l'heure.
 * Un rendez-vous déjà fixé est libéré dès l'envoi de la demande.
 */
export default function ChangerRendezVous({ deposit: d, availabilityDays = [], availability }: ChangerRendezVousProps) {
  const known = new Set(availabilityDays.map((x) => x.date));
  const [value, setValue] = useState<AppointmentAvailability>({
    days: (availability?.days ?? []).filter((x) => known.has(x)),
    moment: availability?.moment ?? "indifferent",
    note: availability?.note ?? "",
  });
  const [busy, setBusy] = useState(false);
  const { requestAppointment } = useUseCases();
  const toast = useToast();
  const go = useGo();
  const waiting = d.status === "demande-rdv";

  return (
    <StudentLayout section="depots">
      <PageTitle>Demander un rendez-vous</PageTitle>
      <div className="wrap" style={{ maxWidth: 1040 }}>
        <Crumbs items={[{ label: "Mes dépôts", href: paths.depots }, { label: d.ref }]} />
        <PageHead
          title={waiting ? "Modifier mes disponibilités" : "Demander un autre rendez-vous"}
          lead={`${d.deviceName} · dépôt ${d.ref}`}
        />
        <Panel>
          <PanelHead title="Quand pouvez-vous passer chez LBC ?" aside="LBC · campus de l'UGB, entre les villages E et F" />
          <PanelBody className="stack" style={{ gap: 20 }}>
            {d.appointment && (
              <Notice
                tone={d.appointment.missed ? "warn" : undefined}
                icon={d.appointment.missed ? "alert" : "calendar"}
                title={d.appointment.missed ? `Rendez-vous manqué : ${d.appointment.label}.` : `Rendez-vous actuel : ${d.appointment.label}.`}
              >
                {d.appointment.missed
                  ? "Indiquez vos nouvelles disponibilités : LBC vous proposera un autre créneau."
                  : "Il sera libéré dès l'envoi de votre demande ; LBC vous proposera un autre créneau."}
              </Notice>
            )}
            {waiting && d.request && (
              <Notice icon="clock" title={`Demande envoyée le ${d.request.sentAt}.`}>
                {`Disponibilités actuelles : ${d.request.summary}. LBC n'a pas encore fixé le rendez-vous.`}
              </Notice>
            )}
            <AvailabilityPicker days={availabilityDays} value={value} onChange={setValue} />
          </PanelBody>
          <PanelFoot>
            <ButtonLink href={paths.depots} variant="ghost">
              {waiting ? "Ne rien changer" : "Garder le rendez-vous actuel"}
            </ButtonLink>
            <span className="spacer" />
            <Button
              size="lg"
              disabled={value.days.length === 0 || busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await requestAppointment(d.ref, value);
                  toast("Demande envoyée à LBC. Le rendez-vous s'affichera dans « Mes dépôts ».");
                  window.setTimeout(() => go(paths.depots), 1200);
                } catch (e) {
                  setBusy(false);
                  toast(e instanceof RuleViolation ? e.message : "La demande n'a pas pu être envoyée. Réessayez.");
                }
              }}
            >
              Envoyer la demande
            </Button>
          </PanelFoot>
        </Panel>
      </div>
    </StudentLayout>
  );
}
