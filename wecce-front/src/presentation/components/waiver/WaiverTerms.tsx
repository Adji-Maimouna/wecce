import type { Waiver } from "@/domain/entities";
import { launchBonus } from "@/domain/rules/expertise";
import { fmt, pts } from "@/presentation/lib/format";

/** Les deux prix, leur détail et les clauses acceptées en signant. */
export function WaiverTerms({ w }: { w: Waiver }) {
  const mode = w.mode ?? "vente";
  const noPoints = mode === "echange-objet";
  const bonus = noPoints ? 0 : (w.bonus ?? launchBonus(w.takeBack, w.bonusRate));
  const credit = noPoints ? 0 : w.takeBack + bonus;
  return (
    <>
      {mode === "echange-objet" ? (
        <p className="doc__quote">
          « Nous reprenons votre appareil en échange direct contre <strong>{w.counterpart ?? "un objet de la boutique LBC"}</strong>. Aucun point n'est
          crédité sur votre compte. »
        </p>
      ) : mode === "echange-points" ? (
        <p className="doc__quote">
          « Nous reprenons votre appareil à <strong>{fmt(w.takeBack)} points</strong>. Il reste à la boutique LBC et n'est pas mis en vente sur Wecce. »
        </p>
      ) : w.pieces ? (
        <p className="doc__quote">
          « L'appareil ne peut pas repartir entier, mais ses pièces ont de la valeur. Nous le reprenons à <strong>{fmt(w.takeBack)} points</strong>.
          Ses pièces seront proposées pour <strong>{fmt(w.listPrice)} points</strong> au total. »
        </p>
      ) : (
        <p className="doc__quote">
          « Nous reprenons votre appareil à <strong>{fmt(w.takeBack)} points</strong>. Il sera proposé à <strong>{fmt(w.listPrice)} points</strong>.
          La différence couvre l'expertise, le stockage et la garantie. »
        </p>
      )}

      <dl className="dl">
        <dt>Votre prix souhaité, indiqué en ligne</dt>
        <dd className="muted">{w.wish === null ? "non indiqué" : pts(w.wish)}</dd>
        <dt>{w.pieces ? "Valeur de reprise en pièces" : "Valeur de reprise fixée par la boutique"}</dt>
        <dd>{pts(w.takeBack)}</dd>
        {noPoints && (
          <>
            <dt>Remis en échange par LBC</dt>
            <dd>{w.counterpart ?? "objet de la boutique"}</dd>
          </>
        )}
        {!noPoints && w.bonusRate > 0 && bonus > 0 && (
          <>
            <dt>Bonus de lancement (+ {w.bonusRate} %)</dt>
            <dd>+ {pts(bonus)}</dd>
          </>
        )}
        <span className="sep" />
        <dt className="total">Crédité sur votre compte à la signature</dt>
        <dd className="total pts">{pts(credit)}</dd>
        {!w.pieces && mode === "vente" && (
          <>
            <dt>Prix de mise en vente sur le marché</dt>
            <dd>{pts(w.listPrice)}</dd>
          </>
        )}
      </dl>

      <section className="stack" style={{ gap: 10 }}>
        <h2 style={{ fontSize: "var(--t-md)" }}>Ce que vous acceptez en signant</h2>
        <ol className="doc__clauses small">
          <li>L'appareil ne vous appartient plus à partir de la signature.</li>
          {noPoints ? (
            <li>L'objet de la boutique vous est remis au comptoir, avec la garantie boutique de 3 mois.</li>
          ) : (
            <li>Les points sont crédités immédiatement. 1 point vaut 1 franc sur le marché Wecce ; il ne s'échange pas contre de l'argent.</li>
          )}
          <li>
            Le 1<sup>er</sup> de chaque mois, vos points et les prix affichés baissent ensemble de 5&nbsp;%. Votre pouvoir d'achat reste le même.
            Vos points n'expirent pas.
          </li>
          <li>Il n'y a pas de délai de rétractation.</li>
        </ol>
      </section>
    </>
  );
}
