import { ButtonLink } from "@/presentation/components/ui/Button";
import { Panel, PanelBody } from "@/presentation/components/ui/Panel";
import { pts } from "@/presentation/lib/format";
import { paths } from "@/presentation/lib/paths";

type AccountSummaryProps = { balance: number; depositCount: number; memberSince: string };

/** Résumé du compte étudiant : solde, dépôts, ancienneté. */
export function AccountSummary({ balance, depositCount, memberSince }: AccountSummaryProps) {
  return (
    <Panel>
      <PanelBody className="stack" style={{ gap: 16 }}>
        <div>
          <span className="small muted">Mon solde</span>
          <div className="big-price">{pts(balance)}</div>
        </div>
        <dl className="dl small">
          <dt>Dépôts</dt>
          <dd>{depositCount}</dd>
          <dt>Membre depuis le</dt>
          <dd>{memberSince}</dd>
        </dl>
        <div className="row">
          <ButtonLink href={paths.solde} size="sm" variant="ghost">
            Voir mon solde
          </ButtonLink>
          <ButtonLink href={paths.depots} size="sm" variant="ghost">
            Mes dépôts
          </ButtonLink>
        </div>
      </PanelBody>
    </Panel>
  );
}
