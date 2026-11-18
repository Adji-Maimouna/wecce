import { useEffect, useRef, useState } from "react";
import { RuleViolation } from "@/application";
import type { Acquisition, ItemDetails, PaymentMethod } from "@/domain/entities";
import { coverage } from "@/domain/rules/points";
import { useToast } from "@/presentation/components/feedback/toastContext";
import { Crumbs } from "@/presentation/components/layout/Crumbs";
import { PageTitle } from "@/presentation/components/layout/PageTitle";
import { StudentLayout } from "@/presentation/components/layout/StudentLayout";
import { OrderSummary } from "@/presentation/components/payment/OrderSummary";
import { PaymentForm } from "@/presentation/components/payment/PaymentForm";
import { PaymentPending } from "@/presentation/components/payment/PaymentPending";
import { PickupVoucher } from "@/presentation/components/payment/PickupVoucher";
import { METHOD_NAMES } from "@/presentation/components/payment/methodNames";
import { Button, ButtonLink } from "@/presentation/components/ui/Button";
import { Notice } from "@/presentation/components/ui/Notice";
import { useUseCases } from "@/presentation/hooks/useUseCases";
import { francs, pts } from "@/presentation/lib/format";
import { burstFrom } from "@/presentation/lib/motion";
import { paths } from "@/presentation/lib/paths";

export type PrendreProps = Pick<ItemDetails, "item" | "title"> & {
  /** Solde disponible : points du compte moins ceux bloqués par d'autres achats en attente de validation. */
  balance: number;
  heldPoints?: number;
  /** Acquisition de l'étudiant sur cet objet (paiement en attente, à valider, réservé, remis), ou null. */
  acquisition: Acquisition | null;
  /** Dernier achat de cet objet refusé par LBC. */
  refusal?: { ref: string; reason: string; at: string } | null;
  /** L'objet a été réservé par quelqu'un d'autre. */
  unavailable?: boolean;
};

/** Prendre un objet et payer le complément (points d'abord, francs ensuite). La page suit l'acquisition enregistrée. */
export default function Prendre({ item, title, balance, heldPoints = 0, acquisition: q, refusal, unavailable }: PrendreProps) {
  const [failed, setFailed] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { acquireItem, awaitPayment, cancelPayment } = useUseCases();
  const toast = useToast();
  const voucher = useRef<HTMLDivElement>(null);
  const shortName = item.name.split(" · ")[0];
  const view = q ? (q.status === "en-attente" ? "attente" : q.status === "a-valider" ? "validation" : "confirme") : "choix";
  const order = q ? { covered: q.points, complement: q.complement } : coverage(item.price, balance);
  const balanceAfter = q && (q.status === "reserve" || q.status === "remis") ? balance : balance - order.covered;

  // En attente : on écoute la confirmation du prestataire de paiement.
  const pendingRef = q?.status === "en-attente" ? q.paymentRef : undefined;
  useEffect(() => {
    if (!pendingRef) return;
    let alive = true;
    awaitPayment(pendingRef).then((res) => {
      if (!alive) return;
      if (res === "confirme") {
        toast("Paiement confirmé. LBC valide maintenant votre achat.");
      } else setFailed("La demande a expiré sans validation sur votre téléphone. Aucun point n'a été débité et l'objet n'est pas réservé.");
    });
    return () => {
      alive = false;
    };
  }, [pendingRef, awaitPayment, toast]);

  async function pay(m: PaymentMethod, phone: string) {
    setBusy(true);
    setFailed(null);
    try {
      const res = await acquireItem({ itemSlug: item.slug, method: m, phone });
      window.scrollTo({ top: 0 });
      if (res.status === "a-valider") {
        toast("Demande envoyée à LBC. Vos points sont bloqués jusqu'à sa validation.");
      } else if (res.status === "reserve") {
        toast(m === "especes" ? "C'est réservé. Vous paierez en espèces au retrait." : "C'est réservé, vos points couvrent tout le prix.");
        window.setTimeout(() => burstFrom(voucher.current), 80);
      }
    } catch (e) {
      setFailed(e instanceof RuleViolation ? e.message : "Le paiement n'a pas pu démarrer. Réessayez.");
    } finally {
      setBusy(false);
    }
  }

  const pointsText = pts(order.covered).replace(/ pts?$/, order.covered > 1 ? " points" : " point");
  const debited = order.covered > 0 ? ` ${pointsText} ${order.covered > 1 ? "ont été débités" : "a été débité"} de votre solde${q?.validatedAt ? ` à la validation par LBC, le ${q.validatedAt}` : ""}.` : "";
  const confirmation = !q
    ? ""
    : q.complement === 0
      ? `Vos points couvrent tout le prix.${debited}`
      : q.method === "especes"
        ? `Vous paierez ${francs(q.complement)} en espèces au retrait.${debited}`
        : `Paiement ${METHOD_NAMES[q.method]} confirmé le ${q.confirmedAt}.${debited}`;
  const handedText = q?.status === "remis" ? ` Remis le ${q.handedAt ?? ""}${q.warrantyUntil ? `, garanti jusqu'au ${q.warrantyUntil}` : ""}.` : "";

  return (
    <StudentLayout section="marche">
      <PageTitle>Prendre un objet</PageTitle>
      <div className="wrap">
        <Crumbs items={[{ label: "Marché", href: paths.marche }, { label: shortName, href: paths.item(item.slug) }, { label: "Prendre" }]} />
        <div className="cols">
          <div className="stack" style={{ gap: 20 }}>
            {view === "choix" && unavailable && (
              <section className="stack" style={{ gap: 16 }}>
                <Notice icon="lock" title="Cet objet vient d'être réservé par un autre étudiant.">
                  S'il ne le retire pas à temps, il reviendra sur le marché.
                </Notice>
                <div>
                  <ButtonLink href={paths.marche}>Retour au marché</ButtonLink>
                </div>
              </section>
            )}

            {view === "choix" && !unavailable && (
              <section>
                {refusal && !failed && (
                  <Notice tone="danger" icon="x-circle" title="LBC n'a pas validé votre dernier achat de cet objet." style={{ marginBottom: 20 }}>
                    {`Motif : ${refusal.reason}${refusal.at ? ` (${refusal.at})` : ""}. Aucun point n'a été débité.`}
                  </Notice>
                )}
                {heldPoints > 0 && (
                  <Notice icon="lock" title={`${pts(heldPoints)} sont bloqués par un autre achat en attente de validation.`} style={{ marginBottom: 20 }}>
                    Ils ne comptent pas dans le solde utilisable ici tant que LBC n'a pas répondu.
                  </Notice>
                )}
                {failed && (
                  <Notice tone="danger" icon="x-circle" title="Le paiement n'a pas abouti." style={{ marginBottom: 20 }}>
                    {failed} Réessayez, ou choisissez un autre moyen.
                  </Notice>
                )}
                <h1>{order.complement > 0 ? "Payer le complément" : "Prendre avec vos points"}</h1>
                <p className="muted" style={{ marginTop: 8, maxWidth: "58ch" }}>
                  {order.complement > 0
                    ? `Vos ${pointsText} sont utilisés en premier. Il reste ${francs(order.complement)} à payer, sans frais.`
                    : `Vos points couvrent tout le prix. Il vous restera ${pts(balance - order.covered)}.`}
                </p>
                {order.complement > 0 ? (
                  <PaymentForm complement={order.complement} busy={busy} onPay={pay} />
                ) : (
                  <div style={{ marginTop: 22 }}>
                    <Button size="lg" disabled={busy} onClick={() => pay("especes", "")}>
                      Réserver avec mes points
                    </Button>
                  </div>
                )}
              </section>
            )}

            {view === "attente" && q && q.method !== "especes" && (
              <PaymentPending
                method={q.method}
                complement={q.complement}
                sentAt={q.sentAt ?? ""}
                reference={q.paymentRef ?? ""}
                onChangeMethod={async () => {
                  await cancelPayment(q.ref);
                  toast("Demande de paiement annulée. Choisissez un autre moyen.");
                }}
              />
            )}

            {view === "validation" && q && (
              <section className="stack" style={{ gap: 18 }}>
                <Notice icon="clock" title="LBC vérifie votre achat.">
                  <p className="small">
                    {q.points > 0
                      ? `Vos ${pts(q.points)} sont bloqués : ils seront débités seulement quand la boutique aura validé l'achat.`
                      : "Rien n'est débité tant que la boutique n'a pas validé l'achat."}
                    {q.complement > 0 && q.method === "especes" ? ` Vous paierez ${francs(q.complement)} en espèces au retrait.` : ""}
                  </p>
                  <p className="small">La réponse s'affiche ici et dans votre solde. Référence {q.ref}.</p>
                </Notice>
                {(q.method === "especes" || q.complement === 0) && (
                  <div>
                    <Button
                      variant="ghost"
                      disabled={busy}
                      onClick={async () => {
                        setBusy(true);
                        try {
                          await cancelPayment(q.ref);
                          toast("Demande annulée. L'objet revient sur le marché.");
                        } catch (e) {
                          setFailed(e instanceof RuleViolation ? e.message : "L'annulation n'a pas abouti.");
                        } finally {
                          setBusy(false);
                        }
                      }}
                    >
                      Annuler ma demande
                    </Button>
                  </div>
                )}
                {failed && (
                  <Notice tone="danger" icon="x-circle" title="Impossible d'annuler.">
                    {failed}
                  </Notice>
                )}
              </section>
            )}

            {view === "confirme" && q && (
              <PickupVoucher
                ref={voucher}
                itemShortName={shortName}
                confirmation={`${confirmation}${handedText}`}
                reference={q.ref}
                pickupBefore={q.pickupBefore}
                handedOver={q.status === "remis"}
              />
            )}
          </div>

          <OrderSummary item={item} title={title} covered={order.covered} complement={order.complement} balanceAfter={balanceAfter} />
        </div>
      </div>
    </StudentLayout>
  );
}
