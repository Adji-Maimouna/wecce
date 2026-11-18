import type { ReactNode } from "react";
import type { Deposit } from "@/domain/entities";
import { fmt, pts } from "@/presentation/lib/format";
import { REFUSAL_LABELS } from "@/presentation/lib/labels";

/** Les faits d'un dépôt, selon son statut (rendez-vous, reprise, refus, annulation). */
export function DepositFacts({ d }: { d: Deposit }) {
  const facts: ReactNode[] = [];
  if (d.status === "rendez-vous" && d.appointment) facts.push(d.appointment.label);
  if (d.status === "demande-rdv" && d.request) facts.push(`Demande envoyée le ${d.request.sentAt}`, `Vos disponibilités : ${d.request.summary}`);
  if (d.wish) facts.push(`Prix souhaité : ${pts(d.wish)}`);
  if (d.missing) facts.push(d.missing);
  if (d.status === "a-signer" && d.examinedOn) facts.push(`Examiné le ${d.examinedOn}, signature en attente`);
  if (d.signedOn) facts.push(`Signé le ${d.signedOn}`);
  if (d.takeBack)
    facts.push(
      <>
        Repris <span className="pts">{pts(d.takeBack.points)}</span>
        {d.takeBack.bonus > 0 && ` + bonus ${fmt(d.takeBack.bonus)}`}
      </>,
    );
  if (d.prices) facts.push(`Proposé ${fmt(d.prices.initial)}, aujourd'hui ${fmt(d.prices.today)}`);
  if (d.status === "refuse" && d.examinedOn) facts.push(`Examiné le ${d.examinedOn}`);
  if (d.refusal) facts.push(`Motif : ${REFUSAL_LABELS[d.refusal.reason].toLowerCase()}`);
  if (d.cancelledOn)
    facts.push(d.examinedOn ? `Prix refusés au comptoir le ${d.cancelledOn}, appareil rendu` : `Annulé par vous le ${d.cancelledOn}`);
  return (
    <div className="deposit__facts">
      {facts.map((f, i) => (
        <span key={i}>{f}</span>
      ))}
    </div>
  );
}
