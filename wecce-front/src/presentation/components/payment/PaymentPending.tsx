import type { PaymentMethod } from "@/application/ports";
import { Button } from "@/presentation/components/ui/Button";
import { Notice } from "@/presentation/components/ui/Notice";
import { francs } from "@/presentation/lib/format";
import { METHOD_NAMES } from "./methodNames";

type PaymentPendingProps = {
  method: Exclude<PaymentMethod, "especes">;
  complement: number;
  sentAt: string;
  reference: string;
  onChangeMethod: () => void;
};

/** Paiement mobile en attente de validation sur le téléphone de l'étudiant. */
export function PaymentPending({ method, complement, sentAt, reference, onChangeMethod }: PaymentPendingProps) {
  return (
    <section className="stack" style={{ gap: 18 }}>
      <h1>Paiement en attente</h1>
      <Notice icon="spinner" title={`Validez la demande de ${francs(complement)} dans l'application ${METHOD_NAMES[method]}.`}>
        L'objet vous est réservé pendant ce temps.
      </Notice>
      <div className="panel">
        <div className="panel__body">
          <dl className="dl small">
            <dt>Demande envoyée</dt>
            <dd>{sentAt}</dd>
            <dt>Montant</dt>
            <dd className="fcfa">{francs(complement)}</dd>
            <dt>Référence {METHOD_NAMES[method]}</dt>
            <dd className="num">{reference}</dd>
          </dl>
        </div>
        <div className="panel__foot">
          <Button variant="ghost" onClick={onChangeMethod}>
            Changer de moyen de paiement
          </Button>
        </div>
      </div>
    </section>
  );
}
