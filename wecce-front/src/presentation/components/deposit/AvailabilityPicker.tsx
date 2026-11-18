import type { AppointmentAvailability, AvailabilityDay, AvailabilityMoment } from "@/domain/entities";
import { Segmented } from "@/presentation/components/ui/Segmented";

type AvailabilityPickerProps = {
  days: AvailabilityDay[];
  value: AppointmentAvailability;
  onChange: (value: AppointmentAvailability) => void;
};

const MOMENTS: { value: AvailabilityMoment; label: string }[] = [
  { value: "matin", label: "Le matin" },
  { value: "apres-midi", label: "L'après-midi" },
  { value: "indifferent", label: "Peu importe" },
];

/** Disponibilités de l'étudiant : plusieurs jours, un moment de la journée, un mot pour LBC. */
export function AvailabilityPicker({ days, value, onChange }: AvailabilityPickerProps) {
  const toggle = (date: string) => {
    const set = new Set(value.days);
    if (set.has(date)) set.delete(date);
    else set.add(date);
    onChange({ ...value, days: days.map((d) => d.date).filter((d) => set.has(d)) });
  };

  return (
    <div className="stack" style={{ gap: 18 }}>
      <div className="stack" style={{ gap: 8 }}>
        <span className="label" id="dispo-jours">
          Les jours où vous pouvez passer <span className="muted">(plusieurs choix possibles)</span>
        </span>
        <div className="days" role="group" aria-labelledby="dispo-jours">
          {days.map((d) => (
            <button key={d.date} className="day" type="button" aria-pressed={value.days.includes(d.date)} onClick={() => toggle(d.date)}>
              <strong>{d.label}</strong>
              <small>{d.month}</small>
            </button>
          ))}
        </div>
      </div>
      <div className="stack" style={{ gap: 8 }}>
        <span className="label">À quel moment</span>
        <div>
          <Segmented<AvailabilityMoment> label="Moment de la journée" value={value.moment} onChange={(moment) => onChange({ ...value, moment })} options={MOMENTS} />
        </div>
      </div>
      <div className="field">
        <label htmlFor="dispo-note">
          Un mot pour LBC <span className="muted">(facultatif)</span>
        </label>
        <input
          id="dispo-note"
          className="input"
          maxLength={200}
          placeholder="Ex. : après mon cours de 10 h, pas le samedi"
          value={value.note}
          onChange={(e) => onChange({ ...value, note: e.target.value })}
        />
      </div>
    </div>
  );
}

/** « Lun. 23, mar. 24 · le matin » : résumé lisible des disponibilités. */
export function availabilityText(value: AppointmentAvailability, days: AvailabilityDay[]): string {
  if (!value.days.length) return "aucun jour choisi";
  const names = value.days.map((d) => days.find((x) => x.date === d)?.label ?? d);
  const moment = MOMENTS.find((m) => m.value === value.moment)?.label.toLowerCase() ?? "";
  return `${names.join(", ")} · ${value.moment === "indifferent" ? "à n'importe quelle heure" : moment}${value.note.trim() ? ` · « ${value.note.trim()} »` : ""}`;
}
