import { useState } from "react";
import { RuleViolation } from "@/application";
import type { AvailabilityDay } from "@/domain/entities";
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
import { useSession } from "@/presentation/hooks/session";
import { useUseCases } from "@/presentation/hooks/useUseCases";
import { useGo } from "@/presentation/lib/navigation";
import { fmt } from "@/presentation/lib/format";
import { paths } from "@/presentation/lib/paths";

export type DeposerProps = {
  depositsSuspended?: boolean;
  /** Motif affiché pendant une suspension. */
  suspensionReason?: string;
  /** Bonus de lancement en cours, ou null. */
  bonus: { rate: number; quota: number; left: number; cap?: number; onePerStudent?: boolean } | null;
  /** Jours d'ouverture proposés pour les disponibilités (LBC fixe ensuite le rendez-vous). */
  availabilityDays: AvailabilityDay[];
  /** Point de départ du formulaire : brouillon repris (?brouillon=REF). */
  start: DraftStart;
  /** Brouillon en cours récupéré depuis la session serveur. */
  hasPending?: boolean;
};

const STEP_LABELS = ["Votre appareil", "Prix souhaité", "Disponibilités", "Vérification"];

/** Déposer un objet : quatre étapes, rien n'est engagé avant l'examen chez LBC. */
export default function Deposer({ depositsSuspended, suspensionReason, bonus, availabilityDays = [], start, hasPending }: DeposerProps) {
  const [step, setStep] = useState(hasPending ? 4 : 1);

  const [busy, setBusy] = useState(false);
  const [modeleError, setModeleError] = useState<string | null>(null);
  const { draft, update } = useDepositDraft(start);
  const { student } = useSession();
  const { submitDeposit, saveDepositDraft } = useUseCases();
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
              lead={start.draftRef ? `Brouillon ${start.draftRef} : complétez-le et envoyez votre demande de rendez-vous.` : "Vous ne vous engagez à rien avant l'examen chez LBC."}
            />
            {bonus && (
              <Notice tone="ok" icon="gift" title={`Bonus de lancement : + ${bonus.rate} % de points sur les ${bonus.quota} premiers dépôts.`} style={{ marginBottom: 22 }}>
                {`Il en reste ${bonus.left}. Le bonus est crédité à la signature${bonus.cap ? `, dans la limite de ${fmt(bonus.cap)} points` : ""}${bonus.onePerStudent ? ", une seule fois par étudiant" : ""}.`}
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
              {step === 3 && <StepAppointment draft={draft} update={update} days={availabilityDays} onPrev={() => goTo(2)} onNext={() => goTo(4)} />}
              {step === 4 && (
                <StepReview
                  draft={draft}
                  days={availabilityDays}
                  busy={busy}
                  onPrev={() => goTo(3)}
                  onConfirm={async () => {
                    if (!student) {
                      setBusy(true);
                      try {
                        const res = await saveDepositDraft(toDepositRequest(draft));
                        go(res.redirect || `${paths.connexion}?retour=${encodeURIComponent(paths.deposer)}`);
                      } catch {
                        go(`${paths.connexion}?retour=${encodeURIComponent(paths.deposer)}`);
                      } finally {
                        setBusy(false);
                      }
                      return;
                    }
                    setBusy(true);
                    try {
                      const { ref } = await submitDeposit(toDepositRequest(draft));
                      toast(`Demande envoyée à LBC (dépôt ${ref}). Vous verrez le rendez-vous dans « Mes dépôts ».`);
                      window.setTimeout(() => go(paths.depots), 1200);
                    } catch (e) {
                      setBusy(false);
                      toast(e instanceof RuleViolation ? e.message : "La demande n'a pas pu être envoyée. Réessayez.");
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
