import { Fragment, type ReactNode } from "react";
import type { Appointment } from "@/domain/entities";
import { AppLink } from "@/presentation/components/ui/AppLink";
import { ButtonLink } from "@/presentation/components/ui/Button";
import { Panel } from "@/presentation/components/ui/Panel";
import { fmt } from "@/presentation/lib/format";
import { paths } from "@/presentation/lib/paths";
import { AppointmentStatusBadge } from "./AppointmentStatusBadge";

type AppointmentsTableProps = {
  appointments: Appointment[];
  /** Journée en cours : on peut commencer une expertise. */
  today?: boolean;
  /** Affiche la date et l'heure prévues (pour les rendez-vous non respectés). */
  showDate?: boolean;
  /** Action supplémentaire en bout de ligne (« Replanifier »). */
  actions?: (a: Appointment) => ReactNode;
  /** Ligne dépliée sous le rendez-vous (formulaire de replanification). */
  renderExtra?: (a: Appointment) => ReactNode;
};

/** Les rendez-vous d'une journée au comptoir ; l'action du moment au bout de chaque ligne. */
export function AppointmentsTable({ appointments, today = true, showDate = false, actions, renderExtra }: AppointmentsTableProps) {
  return (
    <Panel>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>{showDate ? "Créneau prévu" : "Heure"}</th>
              <th>Étudiant</th>
              <th>Appareil déclaré</th>
              <th className="r">Prix souhaité</th>
              <th>Statut</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {appointments.map((a) => {
              const open = a.status === "arrive" || a.status === "a-signer";
              const cancelled = a.status === "annule";
              const extra = renderExtra?.(a);
              return (
                <Fragment key={a.depositRef}>
                <tr style={open ? { background: "var(--accent-tint-2)" } : undefined}>
                  <td className={cancelled ? "num muted" : "num"}>
                    {open ? <strong>{showDate && a.dateLabel ? a.dateLabel : a.time}</strong> : showDate && a.dateLabel ? a.dateLabel : a.time}
                  </td>
                  <td>
                    <div className="who__name">{a.student.name}</div>
                    <div className="who__sub">
                      {a.student.card} · {a.depositRef}
                      {a.student.phone ? ` · ${a.student.phone}` : ""}
                    </div>
                  </td>
                  <td>
                    <div className={cancelled ? "who__name muted" : "who__name"}>{a.device}</div>
                    <div className="who__sub">{a.deviceInfo}</div>
                  </td>
                  <td className={a.wish === null || cancelled ? "r muted" : "r"}>{a.wish === null ? "non indiqué" : fmt(a.wish)}</td>
                  <td>
                    <AppointmentStatusBadge a={a} />
                  </td>
                  <td className="r">
                    <div className="row" style={{ justifyContent: "flex-end", gap: 8, flexWrap: "wrap" }}>
                    {actions?.(a)}
                    {(today || a.missed) && (a.status === "a-venir" || a.status === "arrive") && (
                      <ButtonLink href={paths.expertiseOf(a.depositRef)} size="sm" variant={a.status === "arrive" ? undefined : "ghost"}>
                        {a.missed ? "Examiner si présent" : "Commencer l'expertise"}
                      </ButtonLink>
                    )}
                    {a.status === "a-signer" && (
                      <ButtonLink href={paths.waiverCounter(a.depositRef)} size="sm">
                        Faire signer
                      </ButtonLink>
                    )}
                    {(a.status === "repris" || a.status === "refuse") && (
                      <AppLink className="link small" href={paths.depotPartenaire(a.depositRef)}>
                        Voir
                      </AppLink>
                    )}
                    </div>
                  </td>
                </tr>
                {extra && (
                  <tr className="row-extra">
                    <td colSpan={6}>{extra}</td>
                  </tr>
                )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
