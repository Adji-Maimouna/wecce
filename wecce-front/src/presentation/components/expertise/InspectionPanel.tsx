import { useState } from "react";
import type { DeviceCondition, PartCondition } from "@/domain/entities";
import { Checkbox } from "@/presentation/components/ui/Choice";
import { Field } from "@/presentation/components/ui/Field";
import { Panel, PanelBody, PanelHead } from "@/presentation/components/ui/Panel";
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

/** Ce que l'agent constate : état, batterie, numéro de série, contrôles. */
export function InspectionPanel({ pieces, value, onChange, controls }: InspectionPanelProps) {
  const [checked, setChecked] = useState<boolean[]>(() => controls.map(() => true));
  const deviceOptions = (Object.keys(DEVICE_CONDITIONS) as DeviceCondition[]).map((k) => ({ value: k, label: DEVICE_CONDITIONS[k].label }));
  const partOptions = (Object.keys(PART_CONDITIONS) as PartCondition[]).map((k) => ({ value: k, label: PART_CONDITIONS[k].label }));

  return (
    <Panel>
      <PanelHead title="Ce que vous constatez" />
      <PanelBody className="form-grid">
        <fieldset className="full" style={{ border: 0, margin: 0, padding: 0 }}>
          <legend className="label" style={{ marginBottom: 10 }}>
            État constaté
          </legend>
          {pieces ? (
            <Segmented<PartCondition>
              label="État constaté"
              value={(value.condition in PART_CONDITIONS ? value.condition : "fonctionnel") as PartCondition}
              onChange={(c) => onChange({ ...value, condition: c })}
              options={partOptions}
            />
          ) : (
            <Segmented<DeviceCondition>
              label="État constaté"
              value={(value.condition in DEVICE_CONDITIONS ? value.condition : "bon") as DeviceCondition}
              onChange={(c) => onChange({ ...value, condition: c })}
              options={deviceOptions}
            />
          )}
        </fieldset>
        <Field id="batt" label="Batterie">
          <div className="affix">
            <input className="input" id="batt" inputMode="numeric" value={value.battery} onChange={(e) => onChange({ ...value, battery: e.target.value.replace(/\D/g, "").slice(0, 3) })} />
            <span className="affix__unit">%</span>
          </div>
        </Field>
        <Field id="serie" label="Numéro de série relevé">
          <input className="input" id="serie" value={value.serial} onChange={(e) => onChange({ ...value, serial: e.target.value })} />
        </Field>
        <div className="full stack" style={{ gap: 8 }}>
          <span className="label">Contrôles</span>
          {controls.map((c, i) => (
            <Checkbox key={c} checked={checked[i]} onChange={(v) => setChecked((list) => list.map((x, j) => (j === i ? v : x)))}>
              {c}
            </Checkbox>
          ))}
        </div>
      </PanelBody>
    </Panel>
  );
}
