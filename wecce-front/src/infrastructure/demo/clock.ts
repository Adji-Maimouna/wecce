/**
 * Horloge et dates du serveur simulé.
 *
 * Le serveur de démonstration vit le samedi 7 novembre 2026, le jour des données de départ :
 * les rendez-vous « du jour », la baisse du 1er novembre et la prochaine baisse restent cohérents,
 * quel que soit le jour où l'on ouvre l'application. L'heure suit l'heure réelle, sans descendre sous 11 h.
 *
 * Les dates circulent au format local « AAAA-MM-JJTHH:MM ». Le serveur les envoie déjà rédigées en français,
 * comme le fera Laravel (Carbon, locale fr).
 */

export const TODAY = "2026-11-07";
const EARLIEST_MINUTE = 11 * 60;

const MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const MONTHS_SHORT = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
const WEEKDAYS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

const pad = (n: number) => String(n).padStart(2, "0");

/** Maintenant, sur l'horloge de la démonstration. */
export function now(): string {
  const d = new Date();
  const minutes = Math.max(d.getHours() * 60 + d.getMinutes(), EARLIEST_MINUTE);
  return `${TODAY}T${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
}

type Parts = { y: number; m: number; d: number; hh: number; mm: number };

function parts(iso: string): Parts {
  const [date, time = "00:00"] = iso.split("T");
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  return { y, m, d, hh, mm };
}

const dayNumber = (d: number) => (d === 1 ? "1er" : String(d));

/** Jour de la semaine (0 = dimanche). */
export function weekday(iso: string): number {
  const p = parts(iso);
  return new Date(p.y, p.m - 1, p.d).getDay();
}

/** Date seule (« 2026-11-07 »). */
export const dateOf = (iso: string) => iso.slice(0, 10);

/** Ajoute des jours à une date (« 2026-11-07 » + 3). */
export function addDays(date: string, days: number): string {
  const p = parts(date);
  const d = new Date(p.y, p.m - 1, p.d + days);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Minutes depuis minuit. */
export const minutesOf = (iso: string) => parts(iso).hh * 60 + parts(iso).mm;

/** « 10 h 30 » */
export function time(iso: string): string {
  const p = parts(iso);
  return `${p.hh} h ${pad(p.mm)}`;
}

/** Lit « 10 h 30 » et renvoie « 10:30 ». */
export function parseTime(label: string): string {
  const [h, m] = label.split(" h ").map((s) => Number(s.trim()));
  return `${pad(h)}:${pad(m)}`;
}

/** « 7 novembre », « 1er octobre » */
export function dayMonth(iso: string): string {
  const p = parts(iso);
  return `${dayNumber(p.d)} ${MONTHS[p.m - 1]}`;
}

/** « 7 nov. » */
export function dayMonthShort(iso: string): string {
  const p = parts(iso);
  return `${dayNumber(p.d)} ${MONTHS_SHORT[p.m - 1]}`;
}

/** « 7 nov. 2026 » */
export function dayMonthYearShort(iso: string): string {
  return `${dayMonthShort(iso)} ${parts(iso).y}`;
}

/** « 14 septembre 2026 » */
export function dayMonthYear(iso: string): string {
  return `${dayMonth(iso)} ${parts(iso).y}`;
}

/** « vendredi 7 novembre » */
export function weekdayDayMonth(iso: string): string {
  return `${WEEKDAYS[weekday(iso)]} ${dayMonth(iso)}`;
}

/** « Vendredi 7 novembre 2026 » */
export function longDate(iso: string): string {
  return capitalize(`${weekdayDayMonth(iso)} ${parts(iso).y}`);
}

/** « 7 nov., 10 h 52 » */
export function stamp(iso: string): string {
  return `${dayMonthShort(iso)}, ${time(iso)}`;
}

/** « 7 nov. 2026, 10 h 52 » */
export function stampYear(iso: string): string {
  return `${dayMonthYearShort(iso)}, ${time(iso)}`;
}

/** « 7 nov. à 14 h 33 » */
export function stampAt(iso: string): string {
  return `${dayMonthShort(iso)} à ${time(iso)}`;
}

/** « samedi 7 novembre 2026, 10 h 48 » */
export function fullStamp(iso: string): string {
  return `${weekdayDayMonth(iso)} ${parts(iso).y}, ${time(iso)}`;
}

/** Nom du mois (« novembre ») d'une date, ou du mois suivant. */
export function monthName(iso: string, offset = 0): string {
  const p = parts(iso);
  return MONTHS[(p.m - 1 + offset + 12) % 12];
}

/** « 2026-11 » */
export const monthKey = (iso: string) => iso.slice(0, 7);

/** Libellé de jour pour le choix d'un rendez-vous : « Vendredi 7 » et « novembre ». */
export function pickerDay(date: string): { label: string; month: string } {
  const p = parts(date);
  return { label: capitalize(`${WEEKDAYS[weekday(date)]} ${p.d}`), month: MONTHS[p.m - 1] };
}

/** Jours écoulés entre deux dates. */
export function daysBetween(from: string, to: string): number {
  const a = parts(from);
  const b = parts(to);
  return Math.round((Date.UTC(b.y, b.m - 1, b.d) - Date.UTC(a.y, a.m - 1, a.d)) / 86_400_000);
}

export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Les deux premières lettres du mois en majuscule (« Novembre »), pour un titre de ligne. */
export function monthTitle(iso: string): string {
  return capitalize(monthName(iso));
}
