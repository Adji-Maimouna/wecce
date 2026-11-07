import { afterFonte } from "@/domain/rules/points";
import { ButtonLink } from "@/presentation/components/ui/Button";
import { CountUp } from "@/presentation/components/ui/CountUp";
import { Panel, PanelBody } from "@/presentation/components/ui/Panel";
import { pts } from "@/presentation/lib/format";
import { paths } from "@/presentation/lib/paths";

type BalanceCardProps = { balance: number; nextFonte: string; itemsInBalance: number };

/** Le solde, la prochaine baisse et ce qu'il permet de prendre aujourd'hui. */
export function BalanceCard({ balance, nextFonte, itemsInBalance }: BalanceCardProps) {
  return (
    <Panel>
      <PanelBody className="stack" style={{ gap: 20 }}>
        <div>
          <h1 className="small muted" style={{ fontFamily: "var(--font)", fontSize: "var(--t-sm)", fontWeight: 600, letterSpacing: 0 }}>
            Mon solde
          </h1>
          <div className="big-price" style={{ fontSize: "var(--t-4xl)", marginTop: 8 }}>
            <CountUp value={balance} suffix=" pts" />
          </div>
          <p className="small muted" style={{ marginTop: 8 }}>
            1 point = 1 franc sur le marché Wecce. Vos points n'expirent pas.
          </p>
        </div>
        <hr className="divider" />
        <dl className="dl small">
          <dt>Prochaine baisse</dt>
          <dd>
            1<sup>er</sup> {nextFonte}
          </dd>
          <dt>Solde après la baisse</dt>
          <dd>{pts(afterFonte(balance, 1))}</dd>
          <dt>Objets dans votre solde aujourd'hui</dt>
          <dd>{itemsInBalance}</dd>
        </dl>
        <ButtonLink href={`${paths.marche}?solde=1`} size="lg" block>
          Voir les objets dans mon solde
        </ButtonLink>
      </PanelBody>
    </Panel>
  );
}
