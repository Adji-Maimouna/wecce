import type { BalanceMismatch, DepositsState, LaunchBonus, ScheduledTask } from "@/domain/entities";
import { BonusControl } from "@/presentation/components/admin/BonusControl";
import { DepositsControl } from "@/presentation/components/admin/DepositsControl";
import { TasksPanel } from "@/presentation/components/admin/TasksPanel";
import { BackOfficeLayout } from "@/presentation/components/layout/BackOfficeLayout";
import { PageHead } from "@/presentation/components/layout/PageHead";
import { PageTitle } from "@/presentation/components/layout/PageTitle";
import { AppLink } from "@/presentation/components/ui/AppLink";
import { Notice } from "@/presentation/components/ui/Notice";
import { pts } from "@/presentation/lib/format";
import { paths } from "@/presentation/lib/paths";

export type PilotageProps = {
  deposits: DepositsState;
  bonus: LaunchBonus;
  tasks: ScheduledTask[];
  /** Écart trouvé par le contrôle nocturne des soldes, s'il y en a un. */
  mismatch: BalanceMismatch | null;
};

/** Pilotage : les leviers de la plateforme. Chaque changement demande un motif et s'inscrit au journal. */
export default function Pilotage({ deposits, bonus, tasks, mismatch }: PilotageProps) {
  return (
    <BackOfficeLayout space="admin" current="pilotage">
      <PageTitle>Pilotage</PageTitle>
      <PageHead title="Pilotage" lead="Chaque changement demande un motif et s'inscrit au journal." />

      {mismatch && (
        <Notice tone="danger" title="Le contrôle de cette nuit a trouvé 1 compte dont le solde ne correspond pas à ses mouvements." style={{ marginBottom: 18 }}>
          <p className="small">
            Compte de l'étudiant {mismatch.card} : solde enregistré {pts(mismatch.recorded)}, somme des mouvements {pts(mismatch.computed)}. Rien n'a été
            corrigé automatiquement. Vérifiez l'historique, puis corrigez par un ajustement motivé.
          </p>
          <p className="small" style={{ marginTop: 8 }}>
            <AppLink className="link" href={`${paths.ajustement}?carte=${mismatch.card}`}>
              Ouvrir le compte {mismatch.card}
            </AppLink>
          </p>
        </Notice>
      )}

      <div className="cols cols--even" style={{ gap: 20 }}>
        <DepositsControl state={deposits} />
        <BonusControl bonus={bonus} />
      </div>

      <TasksPanel tasks={tasks} />
    </BackOfficeLayout>
  );
}
