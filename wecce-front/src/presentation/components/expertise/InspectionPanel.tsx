import { useState } from "react";
import type { DeviceCondition, PartCondition } from "@/domain/entities";
import { Badge } from "@/presentation/components/ui/Badge";
import { Checkbox } from "@/presentation/components/ui/Choice";
import { Field } from "@/presentation/components/ui/Field";
import { Panel, PanelBody } from "@/presentation/components/ui/Panel";
import { Segmented } from "@/presentation/components/ui/Segmented";
import { DEVICE_CONDITIONS, PART_CONDITIONS } from "@/presentation/lib/labels";

export type Inspection = { condition: DeviceCondition | PartCondition; battery: string; serial: string };

type InspectionPanelProps = {
  pieces: boolean;
  value: Inspection;
  onChange: (v: Inspection) => void;
  /** Contrôles propres à la catégorie de l'appareil. */
  controls: string[];
};

/** Étape 1 : constat physique au comptoir (état réel, batterie, numéro de série, contrôles). */
export function InspectionPanel({ pieces, value, onChange, controls }: InspectionPanelProps) {
  const [checked, setChecked] = useState<boolean[]>(() => controls.map(() => true));
  const deviceOptions = (Object.keys(DEVICE_CONDITIONS) as DeviceCondition[]).map((k) => ({ value: k, label: DEVICE_CONDITIONS[k].label }));
  const partOptions = (Object.keys(PART_CONDITIONS) as PartCondition[]).map((k) => ({ value: k, label: PART_CONDITIONS[k].label }));
  const okCount = checked.filter(Boolean).length;

  return (
    <Panel>
      <div className="panel__head">
        <div className="row" style={{ gap: 10 }}>
          <span className="step-badge">1</span>
          <h2>Vérifier l&apos;appareil</h2>
        </div>
        <Badge tone={okCount === controls.length ? "ok" : "warn"}>
          {okCount}/{controls.length} contrôles validés
        </Badge>
      </div>
      <PanelBody className="form-grid">
        <fieldset className="full" style={{ border: 0, margin: 0, padding: 0 }}>
          <legend className="label" style={{ marginBottom: 10 }}>
            État réel constaté
          </legend>
          {pieces ? (
            <Segmented<PartCondition>
              label="État réel constaté"
              value={(value.condition in PART_CONDITIONS ? value.condition : "fonctionnel") as PartCondition}
              onChange={(c) => onChange({ ...value, condition: c })}
              options={partOptions}
            />
          ) : (
            <Segmented<DeviceCondition>
              label="État réel constaté"
              value={(value.condition in DEVICE_CONDITIONS ? value.condition : "bon") as DeviceCondition}
              onChange={(c) => onChange({ ...value, condition: c })}
              options={deviceOptions}
            />
          )}
        </fieldset>
        <Field id="batt" label="Batterie constatée" optional>
          <div className="affix">
            <input
              className="input"
              id="batt"
              inputMode="numeric"
              placeholder="ex. 86"
              value={value.battery}
              onChange={(e) => onChange({ ...value, battery: e.target.value.replace(/\D/g, "").slice(0, 3) })}
            />
            <span className="affix__unit">%</span>
          </div>
        </Field>
        <Field id="serie" label="Numéro de série / IMEI" optional>
          <input
            className="input"
            id="serie"
            placeholder="Relevé sur l'appareil"
            value={value.serial}
            onChange={(e) => onChange({ ...value, serial: e.target.value })}
          />
        </Field>
        <div className="full stack" style={{ gap: 8 }}>
          <span className="label">Points de contrôle</span>
          {controls.map((c, i) => (
            <Checkbox key={c} checked={checked[i]} onChange={(v) => setChecked((list) => list.map((x, j) => (j === i ? v : x)))}>
              {c}
            </Checkbox>
          ))}
          {okCount < controls.length && (
            <p className="xs muted">Décochez un point si un défaut justifie une baisse de prix ou un refus.</p>
          )}
        </div>
      </PanelBody>
    </Panel>
  );
}
