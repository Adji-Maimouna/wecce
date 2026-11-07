import { DepositRow } from "@/presentation/components/deposits/DepositRow";
import { PageHead } from "@/presentation/components/layout/PageHead";
import { PageTitle } from "@/presentation/components/layout/PageTitle";
import { StudentLayout } from "@/presentation/components/layout/StudentLayout";
import { ButtonLink } from "@/presentation/components/ui/Button";
import { Icon } from "@/presentation/components/ui/Icon";
import { Panel } from "@/presentation/components/ui/Panel";
import type { Deposit } from "@/domain/entities";

export type DepotsProps = { current: Deposit[]; done: Deposit[] };

/** Mes dépôts : en cours, puis terminés. */
export default function Depots({ current, done }: DepotsProps) {
  const empty = current.length === 0 && done.length === 0;
  return (
    <StudentLayout section="depots">
      <PageTitle>Mes dépôts</PageTitle>
      <div className="wrap" style={{ maxWidth: 1040 }}>
        <PageHead
          title="Mes dépôts"
          aside={
            <ButtonLink href="/etudiant/deposer">
              <Icon name="plus" size="sm" />
              Déposer un objet
            </ButtonLink>
          }
        />

        {empty ? (
          <Panel style={{ padding: "40px 28px" }}>
            <div className="stack" style={{ maxWidth: "54ch", gap: 14 }}>
              <Icon name="upload" size="lg" style={{ color: "var(--muted)" }} />
              <h2>Vous n'avez encore rien déposé</h2>
              <p className="muted">Décrivez un appareil et prenez rendez-vous chez LBC.</p>
              <div>
                <ButtonLink href="/etudiant/deposer">Déposer un premier objet</ButtonLink>
              </div>
            </div>
          </Panel>
        ) : (
          <div className="stack" style={{ gap: 28 }}>
            {[
              { title: "En cours", list: current },
              { title: "Terminés", list: done },
            ]
              .filter((g) => g.list.length > 0)
              .map((g) => (
                <section key={g.title}>
                  <h2 style={{ fontSize: "var(--t-lg)", marginBottom: 12 }}>{g.title}</h2>
                  <div className="panel" data-stagger>
                    {g.list.map((d, i) => (
                      <DepositRow key={d.ref} deposit={d} index={i} />
                    ))}
                  </div>
                </section>
              ))}
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
