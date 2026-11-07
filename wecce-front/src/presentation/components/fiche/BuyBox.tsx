import { Button, ButtonLink } from "@/presentation/components/ui/Button";
import { Notice } from "@/presentation/components/ui/Notice";
import { Panel, PanelBody } from "@/presentation/components/ui/Panel";
import { Jauge } from "@/presentation/components/points/Jauge";
import { fmt, francs, pts } from "@/presentation/lib/format";
import { afterFonte, coverage } from "@/domain/rules/points";

type BuyBoxProps = {
  price: number;
  balance: number;
  /** Réservé par un autre étudiant. */
  reservedByOther: boolean;
  /** Réservé par vous : le bon de retrait est sur la page « Prendre ». */
  reservedByMe?: boolean;
  takeHref: string;
  /** Mois de la prochaine baisse (« décembre »). */
  nextFonte: string;
};

/** Prix, ce que le solde couvre, et l'action « Prendre cet objet ». */
export function BuyBox({ price, balance, reservedByOther, reservedByMe, takeHref, nextFonte }: BuyBoxProps) {
  const { complement, inBalance } = coverage(price, balance);
  const nextPrice = afterFonte(price, 1);
  const nextBalance = afterFonte(balance, 1);
  const nextComplement = Math.max(0, nextPrice - nextBalance);

  if (reservedByMe)
    return (
      <Panel>
        <PanelBody className="stack" style={{ gap: 14 }}>
          <div className="big-price">{pts(price)}</div>
          <Notice tone="ok" icon="check" title="Vous avez réservé cet objet.">
            Présentez votre bon de retrait et votre carte d'étudiant chez LBC.
          </Notice>
          <ButtonLink href={takeHref} size="lg" block>
            Voir mon bon de retrait
          </ButtonLink>
        </PanelBody>
      </Panel>
    );

  return (
    <Panel>
      <PanelBody className="stack" style={{ gap: 14 }}>
        <div>
          <div className="big-price">{pts(price)}</div>
          <p className="small muted" style={{ marginTop: 4 }}>
            Le 1<sup>er</sup> {nextFonte} : {pts(nextPrice)}
          </p>
        </div>

        {reservedByOther ? (
          <Notice icon="lock" title="Réservé par un autre étudiant.">
            S'il ne le retire pas à temps, l'objet revient sur le marché.
          </Notice>
        ) : inBalance ? (
          <div>
            <Jauge price={price} balance={balance} large />
            <p className="small" style={{ marginTop: 12 }}>
              Il vous restera <span className="pts">{pts(balance - price)}</span> après l'échange.
            </p>
          </div>
        ) : (
          <div>
            <Jauge price={price} balance={balance} large />
            <dl className="dl small" style={{ marginTop: 14 }}>
              <dt>Vos points</dt>
              <dd className="pts">{pts(balance)}</dd>
              <dt>À compléter en francs</dt>
              <dd className="fcfa">{francs(complement)}</dd>
              <span className="sep" />
              <dt className="total">Prix de l'objet</dt>
              <dd className="total">{fmt(price)}</dd>
            </dl>
          </div>
        )}

        {reservedByOther ? (
          <Button size="lg" block disabled>
            Réservé
          </Button>
        ) : (
          <ButtonLink href={takeHref} size="lg" block>
            Prendre cet objet
          </ButtonLink>
        )}

        {!reservedByOther && !inBalance && (
          <details className="small">
            <summary style={{ cursor: "pointer", color: "var(--ink-2)" }}>
              Et si j'attends la baisse du 1<sup>er</sup> {nextFonte} ?
            </summary>
            <p className="muted" style={{ marginTop: 8 }}>
              L'objet passera à {pts(nextPrice)} et votre solde à {pts(nextBalance)}. Il vous manquera {francs(nextComplement)} au lieu de{" "}
              {francs(complement)}, et un autre étudiant peut le prendre entre-temps.
            </p>
          </details>
        )}
      </PanelBody>
    </Panel>
  );
}
