import { useState } from "react";
import { RuleViolation } from "@/application";
import type { Category, PartnerPurchase } from "@/domain/entities";
import { useToast } from "@/presentation/components/feedback/toastContext";
import { METHOD_NAMES } from "@/presentation/components/payment/methodNames";
import { AppLink } from "@/presentation/components/ui/AppLink";
import { Badge } from "@/presentation/components/ui/Badge";
import { Button } from "@/presentation/components/ui/Button";
import { Icon } from "@/presentation/components/ui/Icon";
import type { IconName } from "@/presentation/components/ui/icons";
import { useUseCases } from "@/presentation/hooks/useUseCases";
import { fmt, francs, pts } from "@/presentation/lib/format";
import { paths } from "@/presentation/lib/paths";

const CATEGORY_ICON: Record<Category, IconName> = { tel: "phone", ordi: "laptop", tab: "tablet", audio: "audio", piece: "piece" };

/** Un achat d'étudiant côté LBC : valider (débite les points), refuser avec motif, puis confirmer la remise. */
export function PurchaseCard({ p }: { p: PartnerPurchase }) {
  const [busy, setBusy] = useState(false);
  const [refusing, setRefusing] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { validateAcquisition, refuseAcquisition, handOver } = useUseCases();
  const toast = useToast();
  const short = p.item.name.split(" · ")[0];

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (e) {
      setError(e instanceof RuleViolation ? e.message : "L'action n'a pas abouti. Réessayez.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="purchase-card" data-status={p.status}>
      <div className="row" style={{ justifyContent: "space-between", gap: 10 }}>
        <span className="small muted">
          {p.ref} · demandé le {p.createdAt}
        </span>
        {p.status === "a-valider" && <Badge tone="info" dot>À valider</Badge>}
        {p.status === "en-attente" && <Badge>Paiement en cours</Badge>}
        {p.status === "reserve" && <Badge tone="ok" dot>Validé · à remettre</Badge>}
        {p.status === "remis" && <Badge tone="line">Remis</Badge>}
        {p.status === "annule" && <Badge tone="danger">Refusé</Badge>}
      </div>

      <div className="purchase-card__item">
        {p.item.photo ? (
          <img className="purchase-card__thumb" src={p.item.photo} alt="" width={56} height={56} />
        ) : (
          <span className="purchase-card__thumb">
            <Icon name={CATEGORY_ICON[p.item.category]} />
          </span>
        )}
        <div style={{ minWidth: 0 }}>
          <AppLink className="who__name" href={paths.article(p.item.id)}>
            {p.item.name}
          </AppLink>
          <div className="who__sub">{p.item.origin === "depot" ? "Dépôt d'un étudiant" : "Stock de la boutique"}</div>
        </div>
      </div>

      <div className="purchase-card__money">
        <div>
          <span>Prix</span>
          <strong>{pts(p.price)}</strong>
        </div>
        <div>
          <span>{p.status === "a-valider" || p.status === "en-attente" ? "Points à débiter" : "Points débités"}</span>
          <strong>{fmt(p.points)}</strong>
        </div>
        <div>
          <span>Complément</span>
          <strong>{p.complement > 0 ? francs(p.complement) : "aucun"}</strong>
        </div>
      </div>

      <div className="purchase-card__who">
        <span className="avatar" aria-hidden="true">
          {p.student.initials}
        </span>
        <span>
          <strong>{p.student.name}</strong> · {p.student.card}
          {p.student.phone ? ` · ${p.student.phone}` : ""}
          <br />
          <span className="xs muted">
            {p.complement > 0 ? `${METHOD_NAMES[p.method]}${p.paidMobile ? " (payé)" : p.method === "especes" ? " au retrait" : ""} · ` : ""}
            solde actuel {pts(p.student.balance)}
          </span>
        </span>
      </div>

      {p.status === "reserve" && (
        <p className="small" style={{ margin: 0 }}>
          <Icon name="clock" size="sm" /> À retirer avant le {p.pickupBefore}
          {p.complement > 0 && p.method === "especes" ? ` · encaisser ${francs(p.complement)} en espèces` : ""}.
        </p>
      )}
      {p.status === "remis" && (
        <p className="small muted" style={{ margin: 0 }}>
          Remis le {p.handedAt}
          {p.warrantyUntil ? ` · garanti jusqu'au ${p.warrantyUntil}` : ""}.
        </p>
      )}
      {p.status === "annule" && p.refusal && (
        <p className="small muted" style={{ margin: 0 }}>
          Motif : {p.refusal}
        </p>
      )}

      {error && (
        <p className="err" role="alert">
          {error}
        </p>
      )}

      {p.status === "a-valider" && !refusing && (
        <div className="purchase-card__actions">
          <Button
            size="sm"
            disabled={busy}
            onClick={() =>
              run(async () => {
                const r = await validateAcquisition(p.ref);
                toast(`Achat ${p.ref} validé : ${fmt(r.points)} points débités. ${short} est réservé à ${p.student.name}.`);
              })
            }
          >
            <Icon name="check" size="sm" />
            Valider l'achat
          </Button>
          <Button size="sm" variant="ghost" disabled={busy} onClick={() => setRefusing(true)}>
            Refuser
          </Button>
        </div>
      )}

      {(p.status === "a-valider" || p.status === "en-attente") && refusing && (
        <form
          className="stack"
          style={{ gap: 8 }}
          onSubmit={(e) => {
            e.preventDefault();
            run(async () => {
              const r = await refuseAcquisition(p.ref, reason);
              toast(r.refundFcfa > 0 ? `Achat refusé. Remboursez ${francs(r.refundFcfa)} à l'étudiant.` : "Achat refusé. L'objet revient sur le marché.");
            });
          }}
        >
          <label className="label" htmlFor={`motif-${p.ref}`}>
            Motif montré à l'étudiant
          </label>
          <input
            id={`motif-${p.ref}`}
            className="input"
            placeholder="Ex. : objet abîmé en rayon, introuvable"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          {p.paidMobile && (
            <p className="xs" style={{ color: "var(--warn)", margin: 0 }}>
              Le complément de {francs(p.complement)} a déjà été payé par {METHOD_NAMES[p.method]} : il faudra le rembourser.
            </p>
          )}
          <div className="purchase-card__actions">
            <Button type="submit" size="sm" variant="danger" disabled={busy || reason.trim().length < 3}>
              Confirmer le refus
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setRefusing(false)}>
              Annuler
            </Button>
          </div>
        </form>
      )}

      {p.status === "reserve" && (
        <div className="purchase-card__actions">
          <Button
            size="sm"
            disabled={busy}
            onClick={() =>
              run(async () => {
                await handOver(p.ref);
                toast(`${short} remis à ${p.student.name}. La garantie de 3 mois démarre.`);
              })
            }
          >
            <Icon name="package" size="sm" />
            Confirmer la remise
          </Button>
          <span className="xs muted">Après vérification de la carte d'étudiant.</span>
        </div>
      )}
    </article>
  );
}
