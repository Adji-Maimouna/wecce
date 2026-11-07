import type { AppointmentDay } from "@/domain/entities";

type AppointmentPickerProps = {
  days: AppointmentDay[];
  times: string[];
  day: number;
  slot: number | null;
  onChange: (day: number, slot: number | null) => void;
};

/** Choix du jour puis du créneau. Changer de jour sélectionne le premier créneau libre. */
export function AppointmentPicker({ days, times, day, slot, onChange }: AppointmentPickerProps) {
  const taken = days[day]?.taken ?? [];
  return (
    <>
      <div className="days" role="group" aria-label="Jour du rendez-vous">
        {days.map((d, i) => (
          <button
            key={d.label}
            className="day"
            type="button"
            aria-pressed={i === day}
            onClick={() => {
              const firstFree = times.findIndex((_, t) => !d.taken.includes(t));
              onChange(i, firstFree === -1 ? null : firstFree);
            }}
          >
            <strong>{d.label}</strong>
            <small>
              {d.month} · {d.freeCount} créneaux
            </small>
          </button>
        ))}
      </div>
      <div className="slots" role="group" aria-label="Créneau">
        {times.map((t, i) => {
          const isTaken = taken.includes(i);
          return (
            <button
              key={t}
              className="slot"
              type="button"
              disabled={isTaken}
              aria-pressed={isTaken ? undefined : i === slot}
              onClick={() => onChange(day, i)}
            >
              {t}
            </button>
          );
        })}
      </div>
    </>
  );
}
