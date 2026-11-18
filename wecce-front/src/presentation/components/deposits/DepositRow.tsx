import { useState } from "react";
import type { Category, Deposit } from "@/domain/entities";
import { useToast } from "@/presentation/components/feedback/toastContext";
import { Button, ButtonLink } from "@/presentation/components/ui/Button";
import { ConfirmInline } from "@/presentation/components/ui/ConfirmInline";
import { Icon } from "@/presentation/components/ui/Icon";
import type { IconName } from "@/presentation/components/ui/icons";
import { useUseCases } from "@/presentation/hooks/useUseCases";
import { stagger } from "@/presentation/lib/motion";
import { paths } from "@/presentation/lib/paths";
import { DepositFacts } from "./DepositFacts";
import { DepositStatusBadge } from "./DepositStatusBadge";
import { DepositTrack } from "./DepositTrack";

const CATEGORY_ICON: Record<Category, IconName> = { tel: "phone", ordi: "laptop", tab: "tablet", audio: "audio", piece: "piece" };

/** Une ligne de « Mes dépôts » : statut, faits, frise, actions (annulation confirmée sur place). */
export function DepositRow({ deposit: d, index }: { deposit: Deposit; index: number }) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const { cancelDeposit } = useUseCases();
  const toast = useToast();

  return (
    <article className="deposit" style={stagger(index)}>
      <div className="deposit__icon">{d.photo ? <img src={d.photo} alt="" width={72} height={72} /> : <Icon name={CATEGORY_ICON[d.category]} size="lg" />}</div>
      <div>
        <div className="deposit__title">
          <h3>{d.deviceName}</h3>
          <DepositStatusBadge status={d.status} missed={d.appointment?.missed} />
          <span className="deposit__ref">{d.ref}</span>
        </div>
        <DepositFacts d={d} />
        {d.status === "rendez-vous" && d.appointment?.missed && (
          <p className="small" style={{ marginTop: 8, color: "var(--warn)" }}>
            Ce rendez-vous est dépassé. Redonnez vos disponibilités : LBC vous proposera un autre créneau.
          </p>
        )}
        {d.status === "demande-rdv" && (
          <p className="small muted" style={{ marginTop: 8 }}>
            LBC choisit le jour et l'heure parmi vos disponibilités. Le rendez-vous s'affichera ici.
          </p>
        )}
        {d.refusal?.comment && (
          <p className="small muted" style={{ marginTop: 8 }}>
            {d.refusal.comment}
          </p>
        )}
        {d.stageIndex !== undefined && d.status !== "annule" && <DepositTrack stageIndex={d.stageIndex} />}
      </div>

      <div className="deposit__actions">
        {(d.status === "rendez-vous" || d.status === "demande-rdv") && (
          <>
            <ButtonLink href={paths.reschedule(d.ref)} variant={d.appointment?.missed ? undefined : "ghost"} size="sm">
              {d.status === "demande-rdv" ? "Modifier mes disponibilités" : d.appointment?.missed ? "Demander un nouveau rendez-vous" : "Demander un autre créneau"}
            </ButtonLink>
            <Button variant="danger" size="sm" onClick={() => setConfirming(true)}>
              Annuler le dépôt
            </Button>
          </>
        )}
        {d.status === "brouillon" && (
          <>
            <ButtonLink href={paths.resumeDraft(d.ref)} size="sm">
              Reprendre le dépôt
            </ButtonLink>
            <Button variant="ghost" size="sm" onClick={() => setConfirming(true)}>
              Supprimer
            </Button>
          </>
        )}
        {d.status === "repris" && (
          <>
            <ButtonLink href={paths.waiverCopy(d.ref)} variant="ghost" size="sm">
              Voir le renoncement
            </ButtonLink>
            {d.itemSlug && (
              <ButtonLink href={paths.item(d.itemSlug)} variant="ghost" size="sm">
                Voir l'annonce
              </ButtonLink>
            )}
          </>
        )}
        {d.status === "refuse" && (
          <ButtonLink href={paths.deposer} variant="ghost" size="sm">
            Déposer à nouveau
          </ButtonLink>
        )}
      </div>

      {confirming && (
        <ConfirmInline
          question={d.status === "brouillon" ? "Supprimer ce brouillon ?" : "Annuler ce dépôt ?"}
          consequence={
            d.status === "brouillon"
              ? "Il passera dans les dépôts annulés."
              : d.status === "demande-rdv"
                ? "Votre demande de rendez-vous sera retirée."
                : `Le créneau du ${d.appointment?.long ?? "rendez-vous"} sera libéré.`
          }
          confirmLabel={d.status === "brouillon" ? "Supprimer" : "Annuler le dépôt"}
          cancelLabel={d.status === "brouillon" ? "Garder le brouillon" : "Garder le rendez-vous"}
          onCancel={() => setConfirming(false)}
          onConfirm={async () => {
            if (busy) return;
            setBusy(true);
            await cancelDeposit(d.ref);
            setConfirming(false);
            setBusy(false);
            toast(d.status === "brouillon" ? `Brouillon ${d.ref} supprimé.` : `Dépôt ${d.ref} annulé. Le créneau est libéré.`);
          }}
        />
      )}
    </article>
  );
}
