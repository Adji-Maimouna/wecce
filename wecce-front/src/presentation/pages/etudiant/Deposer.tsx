import { useState } from "react";
import { RuleViolation } from "@/application";
import type { AppointmentDay } from "@/domain/entities";
import { useToast } from "@/presentation/components/feedback/toastContext";
import { DepositsSuspended } from "@/presentation/components/deposit/DepositsSuspended";
import { StepAppointment } from "@/presentation/components/deposit/StepAppointment";
import { StepDevice } from "@/presentation/components/deposit/StepDevice";
import { StepReview } from "@/presentation/components/deposit/StepReview";
import { StepWish } from "@/presentation/components/deposit/StepWish";
import { toDepositRequest, useDepositDraft, type DraftStart } from "@/presentation/components/deposit/useDepositDraft";
import { PageHead } from "@/presentation/components/layout/PageHead";
import { PageTitle } from "@/presentation/components/layout/PageTitle";
import { StudentLayout } from "@/presentation/components/layout/StudentLayout";
import { Notice } from "@/presentation/components/ui/Notice";
import { Steps } from "@/presentation/components/ui/Steps";
import { useUseCases } from "@/presentation/hooks/useUseCases";
import { useGo } from "@/presentation/lib/navigation";
import { paths } from "@/presentation/lib/paths";

export type DeposerProps = {
  depositsSuspended?: boolean;
  /** Motif affiché pendant une suspension. */
  suspensionReason?: string;
  /** Bonus de lancement en cours, ou null. */
  bonus: { rate: number; quota: number; left: number } | null;
  days: AppointmentDay[];
  times: string[];
  /** Point de départ du formulaire : brouillon repris (?brouillon=REF) et premier créneau libre. */
  start: DraftStart;
};

const STEP_LABELS = ["Votre appareil", "Prix souhaité", "Rendez-vous", "Vérification"];

/** Déposer un objet : quatre étapes, rien n'est engagé avant l'examen chez LBC. */
export default function Deposer({ depositsSuspended, suspensionReason, bonus, days, times, start }: DeposerProps) {
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [modeleError, setModeleError] = useState<string | null>(null);
  const { draft, update } = useDepositDraft(start);
  const { submitDeposit } = useUseCases();
  const toast = useToast();
  const go = useGo();

  const goTo = (n: number) => {
    const target = Math.max(1, Math.min(4, n));
    if (target > 1 && !draft.modele.trim()) {
      setModeleError("Indiquez la marque et le modèle.");
      setStep(1);
      return;
    }
    setModeleError(null);
    setStep(target);
    window.scrollTo({ top: 0 });
  };

  return (
    <StudentLayout section="deposer">
      <PageTitle>Déposer un objet</PageTitle>
      <div className="wrap" style={{ maxWidth: 1040 }}>
        {depositsSuspended ? (
          <DepositsSuspended reason={suspensionReason} />
        ) : (
          <div>
            <PageHead
              title="Déposer un objet"
              lead={start.draftRef ? `Brouillon ${start.draftRef} : complétez-le et prenez rendez-vous.` : "Vous ne vous engagez à rien avant l'examen chez LBC."}
            />
            {bonus && (
              <Notice tone="ok" icon="gift" title={`Bonus de lancement : + ${bonus.rate} % de points sur les ${bonus.quota} premiers dépôts.`} style={{ marginBottom: 22 }}>
                {`Il en reste ${bonus.left}. Le bonus est crédité à la signature.`}
              </Notice>
            )}
            <Steps labels={STEP_LABELS} current={step} onSelect={goTo} />
            <form onSubmit={(e) => e.preventDefault()}>
              {step === 1 && (
                <StepDevice
                  draft={draft}
                  update={(p) => {
                    update(p);
                    if (p.modele?.trim()) setModeleError(null);
                  }}
                  modeleError={modeleError}
                  onNext={() => goTo(2)}
                />
              )}
              {step === 2 && <StepWish draft={draft} update={update} onPrev={() => goTo(1)} onNext={() => goTo(3)} pastTakeBacks={null} />}
              {step === 3 && <StepAppointment draft={draft} update={update} days={days} times={times} onPrev={() => goTo(2)} onNext={() => goTo(4)} />}
              {step === 4 && (
                <StepReview
                  draft={draft}
                  days={days}
                  times={times}
                  busy={busy}
                  onPrev={() => goTo(3)}
                  onConfirm={async (rdv) => {
                    setBusy(true);
                    try {
                      const { ref } = await submitDeposit(toDepositRequest(draft));
                      toast(`Rendez-vous confirmé : ${rdv}. Dépôt ${ref}.`);
                      window.setTimeout(() => go(paths.depots), 1200);
                    } catch (e) {
                      setBusy(false);
                      toast(e instanceof RuleViolation ? e.message : "Le rendez-vous n'a pas pu être pris. Réessayez.");
                    }
                  }}
                />
              )}
            </form>
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
