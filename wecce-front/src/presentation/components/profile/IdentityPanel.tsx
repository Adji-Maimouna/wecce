import type { ReactNode } from "react";
import { Icon } from "@/presentation/components/ui/Icon";
import { Panel, PanelBody, PanelHead } from "@/presentation/components/ui/Panel";

type IdentityPanelProps = {
  rows: { label: string; value: ReactNode }[];
  /** Qui peut corriger ces informations (elles ne se modifient pas en ligne). */
  correction: string;
};

/** Identité du compte, en lecture seule. */
export function IdentityPanel({ rows, correction }: IdentityPanelProps) {
  return (
    <Panel>
      <PanelHead title="Identité" />
      <PanelBody className="stack" style={{ gap: 16 }}>
        <dl className="dl small">
          {rows.map((r) => (
            <div key={r.label} style={{ display: "contents" }}>
              <dt>{r.label}</dt>
              <dd>{r.value}</dd>
            </div>
          ))}
        </dl>
        <p className="xs muted" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Icon name="lock" size="sm" />
          {correction}
        </p>
      </PanelBody>
    </Panel>
  );
}
