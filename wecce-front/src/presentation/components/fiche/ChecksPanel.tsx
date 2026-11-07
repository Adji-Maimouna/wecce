import { Badge } from "@/presentation/components/ui/Badge";
import { Icon } from "@/presentation/components/ui/Icon";
import { Panel, PanelBody, PanelHead } from "@/presentation/components/ui/Panel";
import type { InspectionCheck } from "@/domain/entities";

/** Ce que la boutique a vérifié, point par point. */
export function ChecksPanel({ checks, examinedOn, className }: { checks: InspectionCheck[]; examinedOn: string; className?: string }) {
  return (
    <Panel className={className}>
      <PanelHead
        title="Ce que la boutique a vérifié"
        aside={
          <Badge tone="ok">
            <Icon name="verified" size="sm" />
            Examiné le {examinedOn}
          </Badge>
        }
      />
      <PanelBody>
        <ul className="checks">
          {checks.map((c) => (
            <li key={c.label}>
              <Icon name="check" />
              <span>{c.label}</span>
              <span className={c.numeric ? "v num" : "v"}>{c.value}</span>
            </li>
          ))}
        </ul>
      </PanelBody>
    </Panel>
  );
}
