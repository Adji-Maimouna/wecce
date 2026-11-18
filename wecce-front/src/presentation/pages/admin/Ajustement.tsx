import { useState } from "react";
import { useSearchParams } from "@/presentation/hooks/useSearchParams";
import type { AccountSummary, AdjustmentDirection } from "@/domain/entities";
import { ADJUSTMENT_REASON_MIN, balanceAfterAdjustment, checkAdjustment } from "@/domain/rules/adjustment";
import { AccountPicker } from "@/presentation/components/admin/AccountPicker";
import { useToast } from "@/presentation/components/feedback/toastContext";
import { BackOfficeLayout } from "@/presentation/components/layout/BackOfficeLayout";
import { PageHead } from "@/presentation/components/layout/PageHead";
import { PageTitle } from "@/presentation/components/layout/PageTitle";
import { AppLink } from "@/presentation/components/ui/AppLink";
import { Button } from "@/presentation/components/ui/Button";
import { FieldError } from "@/presentation/components/ui/Field";
import { Icon } from "@/presentation/components/ui/Icon";
import { Notice } from "@/presentation/components/ui/Notice";
import { Panel, PanelBody, PanelFoot, PanelHead } from "@/presentation/components/ui/Panel";
import { Segmented } from "@/presentation/components/ui/Segmented";
import { useUseCases } from "@/presentation/hooks/useUseCases";
import { fmt, pts } from "@/presentation/lib/format";
import { paths } from "@/presentation/lib/paths";

export type AjustementProps = { accounts: AccountSummary[] };

/** Ajustement de points : une correction ajoute un mouvement motivé ; aucun mouvement n'est modifié ni effacé. ?carte= préremplit la recherche. */
export default function Ajustement({ accounts }: AjustementProps) {
  const [params] = useSearchParams();
  const [query, setQuery] = useState(params.get("carte") ?? "");
  const [direction, setDirection] = useState<AdjustmentDirection>("credit");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [done, setDone] = useState<{ delta: number; after: number; name: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const { adjustPoints } = useUseCases();
  const toast = useToast();

  const q = query.trim().toLowerCase();
  const account = q ? (accounts.find((a) => a.card.includes(q) || a.name.toLowerCase().includes(q)) ?? null) : null;
  const m = Number(amount) || 0;
  const balance = account?.balance ?? 0;
  const check = checkAdjustment(balance, direction, m, reason);
  const next = balanceAfterAdjustment(balance, direction, m);

  return (
    <BackOfficeLayout space="admin" current="ajustement">
      <PageTitle>Ajustement de points</PageTitle>
      <PageHead title="Ajustement de points" lead="Une correction ajoute un mouvement motivé. Aucun mouvement n'est modifié ni effacé." />

      {done && (
        <Notice tone="ok" title={`Ajustement enregistré : ${done.delta > 0 ? "+" : "−"} ${pts(Math.abs(done.delta))} sur le compte de ${done.name}.`} style={{ marginBottom: 18 }}>
          <p className="small">
            Nouveau solde : {pts(done.after)}. L'opération figure dans son historique et au{" "}
            <AppLink className="link" href={paths.journal}>
              journal d'administration
            </AppLink>
            .
          </p>
        </Notice>
      )}

      <div className="cols" style={{ gridTemplateColumns: "minmax(0,1fr) 360px" }}>
        <form
          className="panel"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!account || !check.ok) return;
            setBusy(true);
            try {
              const res = await adjustPoints(balance, { card: account.card, direction, amount: m, reason });
              setDone({ delta: direction === "debit" ? -m : m, after: res.balanceAfter, name: account.name });
              setAmount("");
              setReason("");
              toast("Ajustement enregistré et inscrit au journal.");
              window.scrollTo({ top: 0 });
            } catch (err) {
              toast(err instanceof Error ? err.message : "L'ajustement n'a pas abouti.");
            } finally {
              setBusy(false);
            }
          }}
        >
          <PanelHead title="Compte" />
          <PanelBody className="stack" style={{ gap: 18 }}>
            <AccountPicker query={query} onQuery={setQuery} account={account} />
            <fieldset style={{ border: 0, margin: 0, padding: 0 }}>
              <legend className="label" style={{ marginBottom: 10 }}>
                Sens
              </legend>
              <Segmented<AdjustmentDirection>
                label="Sens"
                value={direction}
                onChange={setDirection}
                options={[
                  {
                    value: "credit",
                    label: (
                      <>
                        <Icon name="plus" size="sm" /> Créditer
                      </>
                    ),
                  },
                  {
                    value: "debit",
                    label: (
                      <>
                        <Icon name="minus" size="sm" /> Débiter
                      </>
                    ),
                  },
                ]}
              />
            </fieldset>
            <div className="field" style={{ maxWidth: 260 }}>
              <label htmlFor="montant">Montant</label>
              <div className="affix">
                <input className="input" id="montant" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, "").slice(0, 7))} />
                <span className="affix__unit">pts</span>
              </div>
              {check.negative && <FieldError>Le solde ne peut pas devenir négatif.</FieldError>}
            </div>
            <div className="field">
              <label htmlFor="motif">Motif</label>
              <textarea
                className="textarea"
                id="motif"
                placeholder={`Au moins ${ADJUSTMENT_REASON_MIN} caractères, par exemple la référence du dépôt ou du paiement concerné`}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
              <span className="hint">Lu par l'étudiant dans son historique et conservé au journal.</span>
            </div>
          </PanelBody>
          <PanelFoot>
            <Button type="submit" size="lg" disabled={!account || !check.ok || busy}>
              Enregistrer l'ajustement
            </Button>
          </PanelFoot>
        </form>

        <aside className="stack sticky" style={{ gap: 16 }}>
          <Panel>
            <PanelBody className="stack" style={{ gap: 12 }}>
              <span className="label">Aperçu</span>
              <dl className="dl small">
                <dt>Solde actuel</dt>
                <dd>{pts(balance)}</dd>
                <dt>Ajustement</dt>
                <dd>{`${direction === "debit" ? "−" : "+"} ${fmt(m)}`}</dd>
                <span className="sep" />
                <dt className="total">Nouveau solde</dt>
                <dd className="total pts">{fmt(Math.max(0, next))} pts</dd>
              </dl>
            </PanelBody>
          </Panel>
          <Notice icon="lock">
            <p className="small">
              <strong>Signé à votre nom.</strong> L'ajustement est inscrit au journal avec le solde avant et après, votre adresse IP et le motif. Il ne
              pourra être ni modifié ni supprimé.
            </p>
          </Notice>
        </aside>
      </div>
    </BackOfficeLayout>
  );
}
