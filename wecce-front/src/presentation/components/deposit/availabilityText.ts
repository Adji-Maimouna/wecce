import type { AppointmentAvailability, AvailabilityDay, AvailabilityMoment } from "@/domain/entities";

export const MOMENTS: { value: AvailabilityMoment; label: string }[] = [
  { value: "matin", label: "Le matin" },
  { value: "apres-midi", label: "L'après-midi" },
  { value: "indifferent", label: "Peu importe" },
];

/** « Lun. 23, mar. 24 · le matin » : résumé lisible des disponibilités. */
export function availabilityText(value: AppointmentAvailability, days: AvailabilityDay[]): string {
  if (!value.days.length) return "aucun jour choisi";
  const names = value.days.map((d) => days.find((x) => x.date === d)?.label ?? d);
  const moment = MOMENTS.find((m) => m.value === value.moment)?.label.toLowerCase() ?? "";
  return `${names.join(", ")} · ${value.moment === "indifferent" ? "à n'importe quelle heure" : moment}${value.note.trim() ? ` · « ${value.note.trim()} »` : ""}`;
}
