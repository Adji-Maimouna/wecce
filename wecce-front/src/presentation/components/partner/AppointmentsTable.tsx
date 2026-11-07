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
};

/** Les rendez-vous d'une journée au comptoir ; l'action du moment au bout de chaque ligne. */
export function AppointmentsTable({ appointments, today = true }: AppointmentsTableProps) {
  return (
    <Panel>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Heure</th>
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
              return (
                <tr key={a.depositRef} style={open ? { background: "var(--accent-tint-2)" } : undefined}>
                  <td className={cancelled ? "num muted" : "num"}>{open ? <strong>{a.time}</strong> : a.time}</td>
                  <td>
                    <div className="who">
                      <span className="avatar">{a.student.initials}</span>
                      <div>
                        <div className="who__name">{a.student.name}</div>
                        <div className="who__sub">
                          {a.student.card} · {a.depositRef}
                        </div>
                      </div>
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
                    {today && (a.status === "a-venir" || a.status === "arrive") && (
                      <ButtonLink href={paths.expertiseOf(a.depositRef)} size="sm" variant={a.status === "arrive" ? undefined : "ghost"}>
                        Commencer l'expertise
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
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
