import type { ScheduledTask } from "@/domain/entities";
import { Badge } from "@/presentation/components/ui/Badge";
import { Ordinals } from "@/presentation/components/ui/Ordinals";
import { Panel, PanelBody, PanelHead } from "@/presentation/components/ui/Panel";

/** Tâches automatiques : baisse mensuelle, contrôle des soldes, couverture, rapprochement des paiements. */
export function TasksPanel({ tasks }: { tasks: ScheduledTask[] }) {
  return (
    <Panel style={{ marginTop: 20 }}>
      <PanelHead title="Tâches automatiques" aside="Dernier passage de chaque tâche" />
      <PanelBody style={{ paddingTop: 8 }}>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Tâche</th>
                <th>Fréquence</th>
                <th>Dernier passage</th>
                <th>Résultat</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((t) => (
                <tr key={t.name}>
                  <td>
                    <strong>{t.name}</strong>
                    <div className="who__sub">{t.description}</div>
                  </td>
                  <td>
                    <Ordinals text={t.frequency} />
                  </td>
                  <td>
                    <Ordinals text={t.lastRun} />
                  </td>
                  <td>
                    <Badge tone={t.tone === "neutral" ? "neutral" : t.tone}>{t.result}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PanelBody>
    </Panel>
  );
}
