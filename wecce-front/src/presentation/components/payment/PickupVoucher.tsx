import { forwardRef } from "react";
import { ButtonLink } from "@/presentation/components/ui/Button";
import { Notice } from "@/presentation/components/ui/Notice";
import { Tbd } from "@/presentation/components/ui/Tbd";
import { paths } from "@/presentation/lib/paths";

type PickupVoucherProps = {
  itemShortName: string;
  confirmation: string;
  reference: string;
  pickupBefore: string;
  /** L'objet a déjà été remis en boutique. */
  handedOver?: boolean;
};

/** Objet réservé : confirmation et bon de retrait à présenter chez LBC. */
export const PickupVoucher = forwardRef<HTMLDivElement, PickupVoucherProps>(function PickupVoucher(
  { itemShortName, confirmation, reference, pickupBefore, handedOver },
  ref,
) {
  return (
    <section className="stack" style={{ gap: 18 }}>
      <div ref={ref}>
        <Notice tone="ok" title={handedOver ? `Votre ${itemShortName} vous a été remis.` : `Votre ${itemShortName} est réservé.`}>
          {confirmation}
        </Notice>
      </div>
      <h1>Bon de retrait</h1>
      <div className="panel">
        <div className="panel__body stack" style={{ gap: 16 }}>
          <dl className="dl">
            <dt>Référence</dt>
            <dd className="num" style={{ fontWeight: 600 }}>
              {reference}
            </dd>
            <dt>À retirer avant le</dt>
            <dd>
              <Tbd note="Durée de réservation à trancher">{pickupBefore}</Tbd>
            </dd>
            <dt>Où</dt>
            <dd>LBC, campus de l'UGB, entre les villages E et F</dd>
            <dt>Garantie</dt>
            <dd>
              <Tbd note="Durée de garantie à trancher">7 jours après le retrait</Tbd>
            </dd>
          </dl>
          <hr className="divider" />
          <p className="small">Apportez votre carte d'étudiant.</p>
        </div>
      </div>
      <div className="row">
        <ButtonLink href={paths.marche}>Retour au marché</ButtonLink>
        <ButtonLink href={paths.solde} variant="ghost">
          Voir mon solde
        </ButtonLink>
      </div>
    </section>
  );
});
