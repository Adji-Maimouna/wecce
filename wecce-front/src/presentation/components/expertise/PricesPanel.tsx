import { canSubmitPrices, creditAtSignature, gapToWish, isListPriceValid, launchBonus, shopMargin } from "@/domain/rules/expertise";
import { AmountInput } from "@/presentation/components/ui/AmountInput";
import { Button } from "@/presentation/components/ui/Button";
import { FieldError } from "@/presentation/components/ui/Field";
import { Notice } from "@/presentation/components/ui/Notice";
import { Panel, PanelBody, PanelFoot, PanelHead } from "@/presentation/components/ui/Panel";
import { fmt, parseAmount } from "@/presentation/lib/format";

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

/** Les deux prix fixés par l'agent, l'écart pour la boutique, ce que l'étudiant recevra, et le message qu'il lira. */
export function PricesPanel(p: PricesPanelProps) {
  const r = parseAmount(p.takeBack);
  const a = parseAmount(p.listPrice);
  const invalid = !isListPriceValid(r, a);
  const margin = shopMargin(r, a);
  const rate = p.bonus?.rate ?? 0;
  const gap = p.wish === null ? 0 : gapToWish(p.wish, r);

  return (
    <Panel>
      <PanelHead title="Vos deux prix" aside="Wecce ne propose aucun prix." />
      <PanelBody className="stack" style={{ gap: 18 }}>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="reprise">Valeur de reprise</label>
            <AmountInput id="reprise" value={p.takeBack} onChange={p.onTakeBack} />
            <span className="hint">Les points crédités à l'étudiant.</span>
          </div>
          <div className="field">
            <label htmlFor="affichage">Prix d'affichage</label>
            <AmountInput id="affichage" value={p.listPrice} onChange={p.onListPrice} invalid={invalid} />
            <span className="hint">Ce que paiera l'étudiant suivant.</span>
            {invalid && <FieldError>Le prix d'affichage ne peut pas être inférieur à la valeur de reprise.</FieldError>}
          </div>
        </div>

        <dl className="dl small">
          <dt>Écart pour la boutique</dt>
          <dd>
            <strong>{fmt(margin.points)} pts</strong>{" "}
            <span className="muted">({margin.ratio === null ? "–" : `${fmt(margin.ratio * 100)} %`} du prix affiché)</span>
          </dd>
          {p.bonus && (
            <>
              <dt>
                Bonus de lancement, {p.bonus.rank}
                <sup>e</sup> dépôt sur {p.bonus.quota}
              </dt>
              <dd>+ {fmt(launchBonus(r, rate))} pts</dd>
            </>
          )}
          <span className="sep" />
          <dt className="total">L'étudiant recevra</dt>
          <dd className="total pts">{fmt(creditAtSignature(r, rate))} pts</dd>
        </dl>

        {r > 0 && p.wish !== null && gap > 0 && (
          <Notice tone="warn" icon="info" title={`L'étudiant espère ${fmt(p.wish)} pts. Vous proposez ${fmt(gap)} de moins.`}>
            Expliquez-lui votre prix avant de lui faire signer le document.
          </Notice>
        )}
        {r > 0 && p.wish !== null && gap <= 0 && <Notice tone="ok" title="Votre reprise atteint ou dépasse le souhait de l'étudiant." />}

        {r > 0 && a > 0 && (
          <div>
            <span className="label">Message que l'étudiant lira avant de signer</span>
            <p className="doc__quote" style={{ marginTop: 8, fontSize: "var(--t-md)" }}>
              {p.pieces ? (
                <>
                  « L'appareil ne peut pas repartir entier, mais ses pièces ont de la valeur. Nous le reprenons à <strong>{fmt(r)} points</strong>. Ses pièces
                  seront proposées pour <strong>{fmt(a)} points</strong> au total. »
                </>
              ) : (
                <>
                  « Nous reprenons votre appareil à <strong>{fmt(r)} points</strong>. Il sera proposé à <strong>{fmt(a)} points</strong>. La différence
                  couvre l'expertise, le stockage et la garantie. »
                </>
              )}
            </p>
          </div>
        )}
      </PanelBody>
      <PanelFoot>
        <Button onClick={p.onAccept} disabled={!canSubmitPrices(r, a) || p.busy}>
          {p.pieces && p.wholeDevice ? "Reprendre en pièces et faire signer" : "Accepter et faire signer"}
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
