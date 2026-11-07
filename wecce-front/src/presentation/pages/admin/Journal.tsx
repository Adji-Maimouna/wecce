import { useState } from "react";
import type { AdminActionType, AdminLogEntry } from "@/domain/entities";
import { BackOfficeLayout } from "@/presentation/components/layout/BackOfficeLayout";
import { PageHead } from "@/presentation/components/layout/PageHead";
import { PageTitle } from "@/presentation/components/layout/PageTitle";
import { Badge, type BadgeTone } from "@/presentation/components/ui/Badge";
import { ChipGroup } from "@/presentation/components/ui/Chip";
import { Icon } from "@/presentation/components/ui/Icon";
import { Ordinals } from "@/presentation/components/ui/Ordinals";
import { Panel } from "@/presentation/components/ui/Panel";
import { ADMIN_ACTION_LABELS } from "@/presentation/lib/labels";

type Filter = "tout" | "ajust" | "susp" | "retrait" | "config";

const GROUP: Record<AdminActionType, Exclude<Filter, "tout">> = {
  ajustement: "ajust",
  suspension: "susp",
  reprise: "susp",
  retrait: "retrait",
  configuration: "config",
};

const TONE: Record<AdminActionType, BadgeTone> = { ajustement: "info", suspension: "danger", reprise: "ok", retrait: "neutral", configuration: "neutral" };

/** Journal d'administration : chaque action, avant et après, en ajout seul. */
export default function Journal({ entries }: { entries: AdminLogEntry[] }) {
  const [filter, setFilter] = useState<Filter>("tout");
  const count = (f: Filter) => (f === "tout" ? entries.length : entries.filter((e) => GROUP[e.type] === f).length);
  const shown = entries.filter((e) => filter === "tout" || GROUP[e.type] === filter);

  return (
    <BackOfficeLayout space="admin" current="journal">
      <PageTitle>Journal d'administration</PageTitle>
      <PageHead title="Journal d'administration" />

      <div className="row" style={{ marginBottom: 16 }}>
        <ChipGroup<Filter>
          label="Type d'action"
          value={filter}
          onChange={setFilter}
          options={[
            { value: "tout", label: "Toutes", count: count("tout") },
            { value: "ajust", label: "Ajustements", count: count("ajust") },
            { value: "susp", label: "Suspensions et reprises", count: count("susp") },
            { value: "retrait", label: "Annonces retirées", count: count("retrait") },
            { value: "config", label: "Configuration", count: count("config") },
          ]}
        />
      </div>

      <Panel>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Action</th>
                <th>Cible</th>
                <th>Avant → après</th>
                <th>Motif</th>
                <th>Par</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((e) => (
                <tr key={`${e.at}-${e.target}`}>
                  <td className="num">
                    <Ordinals text={e.at} />
                  </td>
                  <td>
                    <Badge tone={TONE[e.type]}>{ADMIN_ACTION_LABELS[e.type]}</Badge>
                  </td>
                  <td>{e.target}</td>
                  <td className={e.type === "ajustement" ? "num" : undefined}>{e.change}</td>
                  <td className="small" style={{ maxWidth: "34ch" }}>
                    {e.reason}
                  </td>
                  <td className="small">{e.by}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="panel__foot small muted foot-note">
          <Icon name="lock" size="sm" />
          <span>Les lignes du journal ne peuvent être ni modifiées ni supprimées.</span>
        </div>
      </Panel>
    </BackOfficeLayout>
  );
}
