import type { BalancePoint, Movement } from "@/domain/entities";
import { BalanceCard } from "@/presentation/components/balance/BalanceCard";
import { MovementsPanel } from "@/presentation/components/balance/MovementsPanel";
import { PurchasingPower } from "@/presentation/components/balance/PurchasingPower";
import { BalanceChart } from "@/presentation/components/charts/BalanceChart";
import { PageTitle } from "@/presentation/components/layout/PageTitle";
import { StudentLayout } from "@/presentation/components/layout/StudentLayout";
import { ButtonLink } from "@/presentation/components/ui/Button";
import { Panel, PanelBody, PanelHead } from "@/presentation/components/ui/Panel";
import { paths } from "@/presentation/lib/paths";

export type SoldeProps = {
  balance: number;
  nextFonte: string;
  itemsInBalance: number;
  /** Objet de référence du curseur (le moins cher des objets courants). */
  reference: { name: string; price: number };
  history: { itemName: string; points: BalancePoint[] } | null;
  movements: Movement[];
};

/** Mon solde : le montant, le pouvoir d'achat qui ne baisse pas, l'historique ligne à ligne. */
export default function Solde({ balance, nextFonte, itemsInBalance, reference, history, movements }: SoldeProps) {
  const empty = balance === 0 && movements.length === 0;
  return (
    <StudentLayout section="solde">
      <PageTitle>Mon solde</PageTitle>
      <div className="wrap" style={{ maxWidth: 1100 }}>
        {empty ? (
          <Panel style={{ padding: "40px 32px", marginBottom: 28 }}>
            <div className="stack" style={{ maxWidth: "56ch", gap: 16 }}>
              <h1>Votre solde est de 0 point</h1>
              <p className="muted">Vous recevez des points quand LBC reprend un appareil que vous avez déposé.</p>
              <div className="row">
                <ButtonLink href={paths.deposer}>Déposer un objet</ButtonLink>
                <ButtonLink href={paths.marche} variant="ghost">
                  Voir le marché
                </ButtonLink>
              </div>
            </div>
          </Panel>
        ) : (
          <div className="stack" style={{ gap: 32 }}>
            <div className="cols" style={{ gridTemplateColumns: "minmax(0,1fr) minmax(0,1.45fr)" }}>
              <BalanceCard balance={balance} nextFonte={nextFonte} itemsInBalance={itemsInBalance} />
              <PurchasingPower balance={balance} itemName={reference.name} itemPrice={reference.price} />
            </div>
            {history && (
              <Panel>
                <PanelHead title="Depuis votre premier dépôt" aside="Survolez un point pour lire sa valeur" />
                <PanelBody className="stack" style={{ gap: 14 }}>
                  <BalanceChart points={history.points} itemName={history.itemName} />
                </PanelBody>
              </Panel>
            )}
            <MovementsPanel movements={movements} />
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
