import { useState } from "react";
import { router } from "@inertiajs/react";
import type { Appointment, CounterWeekDay } from "@/domain/entities";
import { BackOfficeLayout } from "@/presentation/components/layout/BackOfficeLayout";
import { PageHead } from "@/presentation/components/layout/PageHead";
import { PageTitle } from "@/presentation/components/layout/PageTitle";
import { AppointmentsTable } from "@/presentation/components/partner/AppointmentsTable";
import { ScheduleForm, type SlotTime } from "@/presentation/components/partner/ScheduleForm";
import { WalkInSearch } from "@/presentation/components/partner/WalkInSearch";
import { AppLink } from "@/presentation/components/ui/AppLink";
import { Badge } from "@/presentation/components/ui/Badge";
import { Button } from "@/presentation/components/ui/Button";
import { Icon } from "@/presentation/components/ui/Icon";
import { Notice } from "@/presentation/components/ui/Notice";
import { Panel } from "@/presentation/components/ui/Panel";
import { cn } from "@/presentation/lib/cn";
import { fmt } from "@/presentation/lib/format";
import { paths } from "@/presentation/lib/paths";

export type RendezVousProps = {
  /** Jour affiché (AAAA-MM-JJ) et jour courant. */
  date: string;
  today: string;
  /** « Mercredi 18 novembre 2026 ». */
  label: string;
  /** « Aujourd'hui », « Demain », « Hier » ou null. */
  relative?: string | null;
  isPast?: boolean;
  closed?: boolean;
  appointments: Appointment[];
  week: CounterWeekDay[];
  prevDate: string;
  nextDate: string;
  prevWeek: string;
  nextWeek: string;
  /** Jours de rendez-vous les plus proches, pour sauter directement quand le jour affiché est vide. */
  nearestBefore?: string | null;
  nearestAfter?: string | null;
  /** Demandes de rendez-vous : LBC fixe le jour et l'heure. */
  requests: Appointment[];
  missed?: Appointment[];
  times: SlotTime[];
  depositsSuspended?: boolean;
};

const dayHref = (d: string) => `${paths.rendezVous}?date=${d}`;

function shortDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
}

/** Rendez-vous au comptoir : n'importe quel jour, la semaine, les demandes à planifier et les rendez-vous manqués. */
export default function RendezVous(p: RendezVousProps) {
  const { appointments: list, requests, missed = [], week } = p;
  const [replanning, setReplanning] = useState<string | null>(null);
  const isToday = p.date === p.today;
  const toReceive = list.filter((a) => a.status === "a-venir" || a.status === "arrive" || a.status === "a-signer").length;
  const done = list.filter((a) => a.status === "repris").length;
  const heading = p.relative ? `${p.relative} · ${p.label}` : p.label;
  const lead = p.closed
    ? "LBC est fermé le dimanche."
    : list.length
      ? `${list.length} rendez-vous${isToday ? `, dont ${toReceive} encore à recevoir` : ""}${done ? ` · ${done} repris` : ""}.`
      : "Aucun rendez-vous ce jour-là.";

  return (
    <BackOfficeLayout space="partenaire" current="rendez-vous">
      <PageTitle>Rendez-vous</PageTitle>
      <PageHead
        title="Rendez-vous"
        lead={
          <>
            <strong className="rdv-day-title">{heading}</strong> · {lead}
          </>
        }
        aside={
          <div className="day-nav" role="group" aria-label="Choisir le jour">
            <AppLink className="day-nav__btn" href={dayHref(p.prevDate)} aria-label="Jour précédent" preserveScroll>
              <Icon name="arrow-left" size="sm" />
            </AppLink>
            <input
              type="date"
              className="day-nav__date"
              aria-label="Aller à la date"
              value={p.date}
              onChange={(e) => e.target.value && router.get(paths.rendezVous, { date: e.target.value }, { preserveScroll: true })}
            />
            <AppLink className="day-nav__btn" href={dayHref(p.nextDate)} aria-label="Jour suivant" preserveScroll>
              <Icon name="arrow-right" size="sm" />
            </AppLink>
            {!isToday && (
              <AppLink className="day-nav__today" href={paths.rendezVous}>
                Aujourd'hui
              </AppLink>
            )}
          </div>
        }
      />

      {p.depositsSuspended && (
        <Notice tone="warn" icon="pause" title="Les nouveaux dépôts sont suspendus." style={{ marginBottom: 18 }}>
          Les rendez-vous déjà pris sont maintenus.
        </Notice>
      )}

      {requests.length > 0 && (
        <section className="rdv-requests" aria-labelledby="t-demandes">
          <div className="section-head">
            <h2 id="t-demandes">Demandes à planifier</h2>
            <Badge tone="warn">{requests.length}</Badge>
            <span className="spacer" />
            <span className="small muted">Les étudiants attendent votre créneau : choisissez le jour et l'heure.</span>
          </div>
          <div className="request-grid">
            {requests.map((a) => (
              <article key={a.depositRef} className="request-card">
                <div className="request-card__top">
                  <span className="avatar" aria-hidden="true">
                    {a.student.initials}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div className="who__name">{a.student.name}</div>
                    <div className="who__sub">
                      {a.student.card} · {a.depositRef}
                      {a.student.phone ? ` · ${a.student.phone}` : ""}
                    </div>
                  </div>
                  {a.request && <span className="xs muted request-card__sent">{a.request.sentAt}</span>}
                </div>
                <div className="request-card__device">
                  <strong>{a.device}</strong>
                  <span className="small muted">
                    {a.deviceInfo}
                    {a.wish !== null ? ` · souhaite ${fmt(a.wish)} pts` : ""}
                  </span>
                </div>
                {a.request && (
                  <p className="request-card__avail">
                    <Icon name="clock" size="sm" />
                    <span>{a.request.summary}</span>
                  </p>
                )}
                <ScheduleForm
                  depositRef={a.depositRef}
                  studentName={a.student.name}
                  suggestedDays={a.request?.days ?? []}
                  times={p.times}
                  today={p.today}
                />
              </article>
            ))}
          </div>
        </section>
      )}

      <section aria-labelledby="t-semaine" className="stack" style={{ gap: 14 }}>
        <div className="section-head">
          <h2 id="t-semaine">Semaine</h2>
          <span className="spacer" />
          <AppLink className="link small" href={dayHref(p.prevWeek)} preserveScroll>
            ‹ Semaine précédente
          </AppLink>
          <AppLink className="link small" href={dayHref(p.nextWeek)} preserveScroll>
            Semaine suivante ›
          </AppLink>
        </div>
        <nav className="week-strip" aria-label="Jours de la semaine">
          {week.map((d) => (
            <AppLink
              key={d.date}
              href={dayHref(d.date)}
              preserveScroll
              className={cn("week-day", d.date === p.date && "is-selected", d.isToday && "is-today")}
              aria-current={d.date === p.date ? "date" : undefined}
            >
              <span className="week-day__name">{d.weekday}</span>
              <span className="week-day__num">{d.day}</span>
              <span className={cn("week-day__count", d.count === 0 && "is-empty")}>
                {d.count === 0 ? "—" : `${d.count} rdv`}
              </span>
              {d.open > 0 && <span className="week-day__open" aria-label={`${d.open} à recevoir`} />}
            </AppLink>
          ))}
        </nav>

        {list.length === 0 ? (
          <Panel style={{ padding: "32px 28px" }}>
            <div className="stack" style={{ maxWidth: "60ch", gap: 12 }}>
              <Icon name="calendar" size="lg" style={{ color: "var(--muted)" }} />
              <h2>{p.closed ? "Boutique fermée" : `Aucun rendez-vous ${isToday ? "aujourd'hui" : `le ${shortDate(p.date)}`}`}</h2>
              {(p.nearestBefore || p.nearestAfter) && (
                <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
                  {p.nearestBefore && (
                    <Button variant="ghost" size="sm" onClick={() => router.get(paths.rendezVous, { date: p.nearestBefore! }, { preserveScroll: true })}>
                      ‹ Dernier jour avec rendez-vous : {shortDate(p.nearestBefore)}
                    </Button>
                  )}
                  {p.nearestAfter && (
                    <Button variant="ghost" size="sm" onClick={() => router.get(paths.rendezVous, { date: p.nearestAfter! }, { preserveScroll: true })}>
                      Prochain : {shortDate(p.nearestAfter)} ›
                    </Button>
                  )}
                </div>
              )}
              <p className="muted">Pour un étudiant venu sans rendez-vous, cherchez son dépôt par sa référence.</p>
              <WalkInSearch />
            </div>
          </Panel>
        ) : (
          <AppointmentsTable appointments={list} today={isToday} />
        )}
      </section>

      {missed.length > 0 && (
        <section className="stack" style={{ gap: 12, marginTop: 32 }} aria-labelledby="t-manques">
          <div className="section-head">
            <h2 id="t-manques">Rendez-vous non respectés</h2>
            <Badge tone="warn">{missed.length}</Badge>
            <span className="spacer" />
            <span className="small muted">Replanifiez-les, ou attendez la nouvelle demande de l'étudiant.</span>
          </div>
          <AppointmentsTable
            appointments={missed}
            today={false}
            showDate
            renderExtra={(a) =>
              replanning === a.depositRef ? (
                <ScheduleForm
                  depositRef={a.depositRef}
                  studentName={a.student.name}
                  suggestedDays={a.request?.days ?? []}
                  times={p.times}
                  today={p.today}
                  submitLabel="Replanifier"
                  onDone={() => setReplanning(null)}
                />
              ) : null
            }
            actions={(a) => (
              <Button size="sm" variant="ghost" onClick={() => setReplanning(replanning === a.depositRef ? null : a.depositRef)}>
                {replanning === a.depositRef ? "Fermer" : "Replanifier"}
              </Button>
            )}
          />
        </section>
      )}
    </BackOfficeLayout>
  );
}
