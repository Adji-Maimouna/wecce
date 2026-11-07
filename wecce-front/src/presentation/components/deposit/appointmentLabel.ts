import type { AppointmentDay } from "@/domain/entities";

/** Le rendez-vous lisible (« Vendredi 7 novembre, 10 h 30 »). */
export function appointmentLabel(choice: { day: number; slot: number | null }, days: AppointmentDay[], times: string[]): string {
  const d = days[choice.day];
  return `${d.label} ${d.month}${choice.slot !== null ? `, ${times[choice.slot]}` : ""}`;
}
