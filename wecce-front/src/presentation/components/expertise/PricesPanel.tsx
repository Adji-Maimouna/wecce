import { canSubmitPrices, creditAtSignature, gapToWish, isListPriceValid, launchBonus, shopMargin } from "@/domain/rules/expertise";
import { afterFonte } from "@/domain/rules/points";
import { AmountInput } from "@/presentation/components/ui/AmountInput";
import { Button } from "@/presentation/components/ui/Button";
import { FieldError } from "@/presentation/components/ui/Field";
import { Notice } from "@/presentation/components/ui/Notice";
import { Panel, PanelBody, PanelFoot } from "@/presentation/components/ui/Panel";
import { fmt, parseAmount, pts } from "@/presentation/lib/format";

type PricesPanelProps = {
  pieces: boolean;
  /** Appareil entier déclaré : on peut basculer vers une reprise en pièces. */
  wholeDevice: boolean;
  wish: number | null;
  bonus: { rate: number; rank: number; quota: number } | null;
  takeBack: string;
  listPrice: string;
  onTakeBack: (v: string) => void;
  onListPrice: (v: string) => void;
  busy: boolean;
  onAccept: () => void;
  onTogglePieces: () => void;
  onRefuse: () => void;
};

/** Étape 2 : proposer la reprise (crédit étudiant) et le prix boutique, avec impact de la baisse mensuelle (-5 %). */
export function PricesPanel(p: PricesPanelProps) {
  const r = parseAmount(p.takeBack);
  const a = parseAmount(p.listPrice);
  const invalid = !isListPriceValid(r, a);
  const ready = canSubmitPrices(r, a);
  const margin = shopMargin(r, a);
  const rate = p.bonus?.rate ?? 0;
  const studentReceives = creditAtSignature(r, rate);
  const gap = p.wish === null ? 0 : gapToWish(p.wish, r);
  const drop1 = a > 0 ? afterFonte(a, 1) : 0;
  const drop2 = a > 0 ? afterFonte(a, 2) : 0;

  return (
    <Panel>
      <div className="panel__head">
        <div className="row" style={{ gap: 10 }}>
          <span className="step-badge">2</span>
          <h2>Proposer les prix</h2>
        </div>
        <span className="xs muted">Baisse automatique de −5 % / mois</span>
      </div>
      <PanelBody className="stack" style={{ gap: 18 }}>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="reprise">Reprise (versée à l&apos;étudiant)</label>
            <AmountInput id="reprise" value={p.takeBack} onChange={p.onTakeBack} />
            <span className="hint">Points crédités dès la signature.</span>
          </div>
          <div className="field">
            <label htmlFor="affichage">Prix affiché en boutique</label>
            <AmountInput id="affichage" value={p.listPrice} onChange={p.onListPrice} invalid={invalid} />
            <span className="hint">Prix de revente (−5 % chaque 1<sup>er</sup> du mois).</span>
            {invalid && <FieldError>Le prix affiché doit être supérieur ou égal à la reprise.</FieldError>}
          </div>
        </div>

        <div className="price-kpis">
          <div className="price-kpi">
            <span className="price-kpi__label">L&apos;étudiant reçoit</span>
            <span className="price-kpi__val">{r > 0 ? pts(studentReceives) : "–"}</span>
            <span className="price-kpi__sub">
              {p.bonus && r > 0 ? `dont +${fmt(launchBonus(r, rate))} pts bonus (${p.bonus.rank}e/${p.bonus.quota})` : "à la signature"}
            </span>
          </div>
          <div className="price-kpi">
            <span className="price-kpi__label">Marge boutique</span>
            <span className="price-kpi__val">{ready ? pts(margin.points) : "–"}</span>
            <span className="price-kpi__sub">
              {ready && margin.ratio !== null ? `${fmt(margin.ratio * 100)} % du prix affiché` : "affichage − reprise"}
            </span>
          </div>
          <div className="price-kpi">
            <span className="price-kpi__label">Après baisse de −5 % / mois</span>
            <span className="price-kpi__val">{a > 0 ? pts(drop1) : "–"}</span>
            <span className="price-kpi__sub">{a > 0 ? `puis ${pts(drop2)} dans 2 mois` : "appliquée le 1er du mois"}</span>
          </div>
        </div>

        {r > 0 && p.wish !== null && gap > 0 && (
          <Notice tone="warn" icon="info" title={`${pts(gap)} en dessous du souhait de l'étudiant (${pts(p.wish)}).`}>
            Expliquez votre estimation avant la signature.
          </Notice>
        )}
        {r > 0 && p.wish !== null && gap <= 0 && (
          <Notice tone="ok" title="Votre proposition atteint ou dépasse le souhait de l'étudiant." />
        )}

        {ready && (
          <div>
            <span className="label">Résumé affiché sur la tablette de signature</span>
            <p className="doc__quote" style={{ marginTop: 8, fontSize: "var(--t-sm)" }}>
              {p.pieces ? (
                <>
                  « L&apos;appareil ne peut pas repartir entier, mais ses pièces sont reprises à <strong>{pts(r)}</strong>. Elles seront proposées à{" "}
                  <strong>{pts(a)}</strong> (avec −5&nbsp;% le 1<sup>er</sup> de chaque mois, comme vos points). »
                </>
              ) : (
                <>
                  « Nous reprenons votre appareil à <strong>{pts(r)}</strong>. Il sera proposé en boutique à <strong>{pts(a)}</strong> (prix soumis à la baisse
                  mensuelle de 5&nbsp;%, comme vos points). »
                </>
              )}
            </p>
          </div>
        )}
      </PanelBody>
      <PanelFoot>
        <Button onClick={p.onAccept} disabled={!ready || p.busy}>
          {p.pieces && p.wholeDevice ? "Reprendre en pièces et faire signer" : "Valider et faire signer"}
        </Button>
        {p.wholeDevice && (
          <Button variant="ghost" onClick={p.onTogglePieces}>
            {p.pieces ? "Reprendre entier" : "Reprendre en pièces"}
          </Button>
        )}
        <span className="spacer" />
        <Button variant="danger" onClick={p.onRefuse}>
          Refuser le dépôt
        </Button>
      </PanelFoot>
    </Panel>
  );
}
