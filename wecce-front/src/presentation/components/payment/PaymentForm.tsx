import { useState } from "react";
import type { PaymentMethod } from "@/application/ports";
import { Button } from "@/presentation/components/ui/Button";
import { Choice } from "@/presentation/components/ui/Choice";
import { Field } from "@/presentation/components/ui/Field";
import { francs } from "@/presentation/lib/format";
import { METHOD_NAMES } from "./methodNames";

type PaymentFormProps = {
  complement: number;
  busy: boolean;
  onPay: (method: PaymentMethod, phone: string) => void;
};

/** Moyen de paiement du complément : Wave, Orange Money, ou espèces au retrait. */
export function PaymentForm({ complement, busy, onPay }: PaymentFormProps) {
  const [method, setMethod] = useState<PaymentMethod>("wave");
  const [phone, setPhone] = useState("");
  const label = method === "especes" ? "Réserver et payer en boutique" : `Payer ${francs(complement)} avec ${METHOD_NAMES[method]}`;

  return (
    <form
      className="panel"
      style={{ marginTop: 22 }}
      onSubmit={(e) => {
        e.preventDefault();
        onPay(method, phone);
      }}
    >
      <div className="panel__body stack" style={{ gap: 18 }}>
        <fieldset className="choices" style={{ border: 0, padding: 0, margin: 0 }}>
          <legend className="label" style={{ marginBottom: 10 }}>
            Moyen de paiement
          </legend>
          <Choice name="moyen" value="wave" checked={method === "wave"} onChange={() => setMethod("wave")} title="Wave" description="Validez la demande dans l'application Wave" />
          <Choice name="moyen" value="om" checked={method === "om"} onChange={() => setMethod("om")} title="Orange Money" description="Validez avec votre code secret Orange Money" />
          <Choice
            name="moyen"
            value="especes"
            checked={method === "especes"}
            onChange={() => setMethod("especes")}
            title="Espèces en boutique"
            description="L'objet est réservé, vous payez au moment du retrait"
          />
        </fieldset>
        {method !== "especes" && (
          <Field id="tel" label="Numéro du compte à débiter" hint={`Vous recevrez une demande de paiement de ${francs(complement)} à valider.`}>
            <input
              className="input"
              id="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="Votre numéro Wave ou Orange Money"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </Field>
        )}
        <Button type="submit" size="lg" block disabled={busy}>
          {label}
        </Button>
        <p className="xs muted">En payant, vous réservez l'objet. Vos points sont débités une fois le paiement confirmé.</p>
      </div>
    </form>
  );
}
