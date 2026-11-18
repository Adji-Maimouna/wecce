import { useState } from "react";
import { RuleViolation } from "@/application";
import { useToast } from "@/presentation/components/feedback/toastContext";
import { Button } from "@/presentation/components/ui/Button";
import { useUseCases } from "@/presentation/hooks/useUseCases";

export type SlotTime = { label: string; value: string };

type ScheduleFormProps = {
  depositRef: string;
  studentName: string;
  /** Jours proposés par l'étudiant (AAAA-MM-JJ), mis en avant. */
  suggestedDays: string[];
  times: SlotTime[];
  today: string;
  submitLabel?: string;
  onDone?: () => void;
};

const WEEKDAYS = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];
const MONTHS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];

function dayLabel(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return `${WEEKDAYS[date.getUTCDay()]} ${d} ${MONTHS[m - 1]}`;
}

/** LBC fixe le jour et l'heure : un des jours proposés par l'étudiant, ou n'importe quel autre jour d'ouverture. */
export function ScheduleForm({ depositRef, studentName, suggestedDays, times, today, submitLabel = "Fixer le rendez-vous", onDone }: ScheduleFormProps) {
  const upcoming = suggestedDays.filter((d) => d >= today);
  const [date, setDate] = useState(upcoming[0] ?? today);
  const [time, setTime] = useState(times[0]?.value ?? "10:00");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { scheduleAppointment } = useUseCases();
  const toast = useToast();

  return (
    <form
      className="schedule-form"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        try {
          const { label } = await scheduleAppointment(depositRef, date, time);
          toast(`Rendez-vous fixé pour ${studentName} : ${label}.`);
          onDone?.();
        } catch (err) {
          setError(err instanceof RuleViolation ? err.message : "Le rendez-vous n'a pas pu être fixé.");
        } finally {
          setBusy(false);
        }
      }}
    >
      {upcoming.length > 0 && (
        <div className="schedule-form__days" role="group" aria-label="Jours proposés par l'étudiant">
          {upcoming.map((d) => (
            <button key={d} type="button" className="chip" aria-pressed={d === date} onClick={() => setDate(d)}>
              {dayLabel(d)}
            </button>
          ))}
        </div>
      )}
      <div className="schedule-form__row">
        <label className="schedule-form__field">
          <span className="xs muted">Jour</span>
          <input type="date" className="input" min={today} value={date} onChange={(e) => setDate(e.target.value)} required />
        </label>
        <label className="schedule-form__field">
          <span className="xs muted">Heure</span>
          <input type="time" className="input" list={`heures-${depositRef}`} step={900} value={time} onChange={(e) => setTime(e.target.value)} required />
          <datalist id={`heures-${depositRef}`}>
            {times.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </datalist>
        </label>
        <Button type="submit" size="sm" disabled={busy}>
          {submitLabel}
        </Button>
      </div>
      {error && (
        <p className="err" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
