import type { Appointment } from "@/domain/entities";
import { CoverageMeter, GroupedColumns, HBars, SegmentBar } from "@/presentation/components/charts/PartnerCharts";
import { BackOfficeLayout } from "@/presentation/components/layout/BackOfficeLayout";
import { PageTitle } from "@/presentation/components/layout/PageTitle";
import { AppointmentStatusBadge } from "@/presentation/components/partner/AppointmentStatusBadge";
import { AppLink } from "@/presentation/components/ui/AppLink";
import { Badge } from "@/presentation/components/ui/Badge";
import { ButtonLink } from "@/presentation/components/ui/Button";
import { CountUp } from "@/presentation/components/ui/CountUp";
import { Icon } from "@/presentation/components/ui/Icon";
import type { IconName } from "@/presentation/components/ui/icons";
import { Panel, PanelBody, PanelHead } from "@/presentation/components/ui/Panel";
import { useSession } from "@/presentation/hooks/session";
import { cn } from "@/presentation/lib/cn";
import { fmt, pts } from "@/presentation/lib/format";
import { paths } from "@/presentation/lib/paths";

type MonthFigures = { takeBacks: number; refused: number; pointsCredited: number; sales: number; salesPoints: number; complements: number; margin: number };

export type TableauProps = {
  todayLabel: string;
  todo: { requests: number; purchases: number; handovers: number; toPublish: number };
  today: Appointment[];
  requests: Appointment[];
  weeks: { key: string; label: string; takeBacks: number; sales: number; current: boolean }[];
  month: { label: string; prevLabel: string; current: MonthFigures; previous: MonthFigures };
  stock: { online: number; onlineValue: number; offline: number; reserved: number; byCategory: { code: string; label: string; count: number; value: number }[] };
  coverage: { ratio: number | null; debt: number; stockValue: number; watch: number; suspend: number };
  activity: { at: string; when: string; kind: "reprise" | "vente" | "remise"; text: string; ref?: string | null }[];
};

const ACTIVITY_ICON: Record<TableauProps["activity"][number]["kind"], IconName> = { reprise: "clipboard", vente: "cash", remise: "package" };

/** Écart au mois précédent, signé ; la couleur dit si c'est bon (plus de reprises, de ventes, de marge = mieux). */
function Delta({ now, before }: { now: number; before: number }) {
  if (before === 0 && now === 0) return <span className="xs muted">comme le mois dernier</span>;
  const diff = now - before;
  const up = diff >= 0;
  return (
    <span className="xs" style={{ color: diff === 0 ? "var(--muted)" : up ? "var(--ok)" : "var(--danger)", fontWeight: 600 }}>
      {diff === 0 ? "=" : up ? "▲" : "▼"} {up ? "+" : "−"}
      {fmt(Math.abs(diff))} vs mois dernier
    </span>
  );
}

/** Tableau de bord de LBC : les actions du jour en tuiles colorées, le comptoir, l'activité, le stock et la couverture. */
export default function Tableau(p: TableauProps) {
  const { agent } = useSession();
  const m = p.month.current;
  const prev = p.month.previous;
  const toReceive = p.today.filter((a) => a.status === "a-venir" || a.status === "arrive" || a.status === "a-signer");

  const actionTiles: { href: string; label: string; value: number; sub: string; icon: IconName; tone: string }[] = [
    { href: paths.rendezVous, label: "Demandes de rendez-vous", value: p.todo.requests, sub: "à planifier : vous fixez jour et heure", icon: "calendar", tone: "tile--mustard" },
    { href: paths.stockTab("achats"), label: "Achats à valider", value: p.todo.purchases, sub: "les points sont débités à la validation", icon: "check-circle", tone: "tile--cobalt" },
    { href: paths.stockTab("achats"), label: "Objets à remettre", value: p.todo.handovers, sub: "achats validés, en attente de retrait", icon: "package", tone: "tile--green" },
    { href: paths.stockTab("depots"), label: "Dépôts hors ligne", value: p.todo.toPublish, sub: "à photographier ou gardés en boutique", icon: "upload", tone: "tile--ink" },
  ];

  return (
    <BackOfficeLayout space="partenaire" current="tableau">
      <PageTitle>Tableau de bord</PageTitle>

      <div className="dash-hello">
        <div>
          <h1>Bonjour{agent ? ` ${agent.prenom}` : ""}</h1>
          <p>
            {p.todayLabel} · {toReceive.length > 0 ? `${toReceive.length} rendez-vous encore à recevoir aujourd'hui` : "aucun rendez-vous à recevoir aujourd'hui"}
          </p>
        </div>
        <div className="row" style={{ gap: 10 }}>
          <ButtonLink href={paths.expertise} variant="ghost">
            <Icon name="clipboard" size="sm" />
            Expertise sans rendez-vous
          </ButtonLink>
          <ButtonLink href={paths.articleNew}>
            <Icon name="plus" size="sm" />
            Ajouter un article
          </ButtonLink>
        </div>
      </div>

      <div className="tiles">
        {actionTiles.map((t) => (
          <AppLink key={t.label} href={t.href} className={cn("tile", t.tone, t.value === 0 && "is-zero")}>
            <span className="tile__top">
              <span className="tile__label">{t.label}</span>
              <span className="tile__icon">
                <Icon name={t.icon} />
              </span>
            </span>
            <span className="tile__value">
              <CountUp value={t.value} />
            </span>
            <span className="tile__sub">{t.sub}</span>
          </AppLink>
        ))}
      </div>

      <div className="dash-grid">
        <Panel>
          <PanelHead
            title="Au comptoir aujourd'hui"
            aside={
              <AppLink className="link small" href={paths.rendezVous}>
                Tous les rendez-vous
              </AppLink>
            }
          />
          <PanelBody>
            {p.today.length === 0 && p.requests.length === 0 ? (
              <p className="muted">Aucun rendez-vous aujourd'hui. Les étudiants venus sans rendez-vous se reçoivent depuis l'Expertise.</p>
            ) : (
              <div className="mini-list">
                {p.today.map((a) => (
                  <div key={a.depositRef}>
                    <span className="mini-list__time">{a.time}</span>
                    <span style={{ minWidth: 0, flex: 1 }}>
                      <strong>{a.student.name}</strong> · {a.device}
                      <br />
                      <span className="xs muted">
                        {a.depositRef}
                        {a.wish !== null ? ` · souhaite ${fmt(a.wish)} pts` : ""}
                      </span>
                    </span>
                    <AppointmentStatusBadge a={a} />
                    {(a.status === "a-venir" || a.status === "arrive") && (
                      <ButtonLink href={paths.expertiseOf(a.depositRef)} size="sm" variant="ghost">
                        Examiner
                      </ButtonLink>
                    )}
                  </div>
                ))}
                {p.requests.map((a) => (
                  <div key={a.depositRef}>
                    <span className="mini-list__time">
                      <Badge tone="warn">à fixer</Badge>
                    </span>
                    <span style={{ minWidth: 0, flex: 1 }}>
                      <strong>{a.student.name}</strong> · {a.device}
                      <br />
                      <span className="xs muted">{a.request?.summary}</span>
                    </span>
                    <ButtonLink href={paths.rendezVous} size="sm">
                      Planifier
                    </ButtonLink>
                  </div>
                ))}
              </div>
            )}
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHead title={p.month.label} aside={`face à ${p.month.prevLabel}`} />
          <PanelBody className="stack" style={{ gap: 16 }}>
            <div className="month-figs">
              <div>
                <span className="xs muted">Appareils repris</span>
                <strong className="month-figs__val">{m.takeBacks}</strong>
                <Delta now={m.takeBacks} before={prev.takeBacks} />
              </div>
              <div>
                <span className="xs muted">Ventes</span>
                <strong className="month-figs__val">{m.sales}</strong>
                <Delta now={m.sales} before={prev.sales} />
              </div>
              <div>
                <span className="xs muted">Points crédités</span>
                <strong className="month-figs__val">{fmt(m.pointsCredited)}</strong>
                <span className="xs muted">{m.refused} refus ce mois</span>
              </div>
              <div>
                <span className="xs muted">Marge boutique</span>
                <strong className="month-figs__val">{fmt(m.margin)}</strong>
                <Delta now={m.margin} before={prev.margin} />
              </div>
            </div>
            <div className="small muted">
              Ventes : {pts(m.salesPoints)}, dont {fmt(m.complements)} FCFA de compléments.
            </div>
          </PanelBody>
        </Panel>
      </div>

      <div className="dash-grid">
        <Panel>
          <PanelHead title="Activité des 8 dernières semaines" aside="Reprises signées et ventes validées" />
          <PanelBody>
            <GroupedColumns
              ariaLabel="Reprises et ventes par semaine"
              series={[
                { key: "takeBacks", label: "Reprises", color: "var(--series-1)" },
                { key: "sales", label: "Ventes", color: "var(--series-2)" },
              ]}
              data={p.weeks.map((w) => ({ label: w.label, current: w.current, values: { takeBacks: w.takeBacks, sales: w.sales } }))}
            />
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHead
            title="Couverture de la dette"
            aside={
              <AppLink className="link small" href={paths.couverture}>
                Détail
              </AppLink>
            }
          />
          <PanelBody className="stack" style={{ gap: 16 }}>
            <div>
              <span className="hero-fig">{p.coverage.ratio === null ? "—" : `${Math.round(p.coverage.ratio * 100)} %`}</span>
              <p className="small muted" style={{ margin: "4px 0 0" }}>
                {pts(p.coverage.stockValue)} de stock en ligne face à {pts(p.coverage.debt)} de points en circulation.
              </p>
            </div>
            <CoverageMeter ratio={p.coverage.ratio} watch={p.coverage.watch} suspend={p.coverage.suspend} />
          </PanelBody>
        </Panel>
      </div>

      <div className="dash-grid dash-grid--even">
        <Panel>
          <PanelHead
            title="Stock"
            aside={
              <AppLink className="link small" href={paths.stockTab("catalogue")}>
                Gérer le stock
              </AppLink>
            }
          />
          <PanelBody className="stack" style={{ gap: 18 }}>
            <SegmentBar
              ariaLabel="Répartition du stock"
              parts={[
                { label: "En ligne", value: p.stock.online, color: "var(--series-1)" },
                { label: "Réservés", value: p.stock.reserved, color: "var(--series-2)" },
                { label: "En boutique, hors ligne", value: p.stock.offline, color: "#6a6863" },
              ]}
            />
            <div>
              <span className="label">Valeur en ligne par catégorie</span>
              <HBars rows={p.stock.byCategory.map((c) => ({ label: c.label, value: c.value, sub: `${c.count} obj.` }))} />
            </div>
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHead title="Dernières opérations" />
          <PanelBody>
            {p.activity.length === 0 ? (
              <p className="muted">Pas encore d'activité.</p>
            ) : (
              <div className="mini-list">
                {p.activity.map((a, i) => (
                  <div key={`${a.at}-${i}`}>
                    <span className={cn("activity-ico", `activity-ico--${a.kind}`)}>
                      <Icon name={ACTIVITY_ICON[a.kind]} size="sm" />
                    </span>
                    <span style={{ minWidth: 0, flex: 1 }}>
                      {a.text}
                      <br />
                      <span className="xs muted">
                        {a.when}
                        {a.ref ? ` · ${a.ref}` : ""}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </PanelBody>
        </Panel>
      </div>
    </BackOfficeLayout>
  );
}
