import { useState } from "react";
import type { Appointment } from "@/domain/entities";
import { BackOfficeLayout } from "@/presentation/components/layout/BackOfficeLayout";
import { PageHead } from "@/presentation/components/layout/PageHead";
import { PageTitle } from "@/presentation/components/layout/PageTitle";
import { AppointmentsTable } from "@/presentation/components/partner/AppointmentsTable";
import { WalkInSearch } from "@/presentation/components/partner/WalkInSearch";
import { Icon } from "@/presentation/components/ui/Icon";
import { Notice } from "@/presentation/components/ui/Notice";
import { Panel } from "@/presentation/components/ui/Panel";
import { Segmented } from "@/presentation/components/ui/Segmented";

type Day = "hier" | "aujourdhui" | "demain";

export type RendezVousProps = {
  /**
   * La veille d'ouverture, aujourd'hui, le prochain jour d'ouverture (LBC ferme le dimanche).
   * `short` : le texte du bouton (« Hier », « Demain », ou le jour, « Lundi »).
   */
  days: Record<Day, { label: string; short: string; appointments: Appointment[] }>;
  depositsSuspended?: boolean;
};

/** Rendez-vous du jour au comptoir LBC : qui vient, avec quoi, et ce qu'il espère. */
export default function RendezVous({ days, depositsSuspended }: RendezVousProps) {
  const [day, setDay] = useState<Day>("aujourdhui");
  const list = days[day].appointments;
  const toReceive = list.filter((a) => a.status === "a-venir" || a.status === "arrive" || a.status === "a-signer").length;
  const lead = list.length
    ? `${days[day].label} · ${list.length} rendez-vous${day === "aujourdhui" ? `, dont ${toReceive} encore à recevoir` : ""}.`
    : `${days[day].label} · aucun rendez-vous.`;

  return (
    <BackOfficeLayout space="partenaire" current="rendez-vous">
      <PageTitle>Rendez-vous du jour</PageTitle>
      <PageHead
        title="Rendez-vous du jour"
        lead={lead}
        aside={
          <Segmented<Day>
            label="Jour"
            value={day}
            onChange={setDay}
            options={(["hier", "aujourdhui", "demain"] as const).map((d) => ({ value: d, label: days[d].short }))}
          />
        }
      />

      {depositsSuspended && (
        <Notice tone="warn" icon="pause" title="Les nouveaux dépôts sont suspendus." style={{ marginBottom: 18 }}>
          Les rendez-vous déjà pris sont maintenus.
        </Notice>
      )}

      {list.length === 0 ? (
        <Panel style={{ padding: "36px 28px" }}>
          <div className="stack" style={{ maxWidth: "52ch", gap: 12 }}>
            <Icon name="calendar" size="lg" style={{ color: "var(--muted)" }} />
            <h2>Aucun rendez-vous {day === "aujourdhui" ? "aujourd'hui" : `le ${days[day].label.toLowerCase()}`}</h2>
            <p className="muted">Pour un étudiant venu sans rendez-vous, cherchez son dépôt par sa référence.</p>
            <WalkInSearch />
          </div>
        </Panel>
      ) : (
        <AppointmentsTable appointments={list} today={day === "aujourdhui"} />
      )}
    </BackOfficeLayout>
  );
}
