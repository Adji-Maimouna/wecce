import { useEffect, useState } from "react";
import { router } from "@inertiajs/react";
import type { PlatformStatistics } from "@/domain/entities";
import { GroupedColumns, HBars, SegmentBar } from "@/presentation/components/charts/PartnerCharts";
import { BackOfficeLayout } from "@/presentation/components/layout/BackOfficeLayout";
import { PageHead } from "@/presentation/components/layout/PageHead";
import { PageTitle } from "@/presentation/components/layout/PageTitle";
import { Badge } from "@/presentation/components/ui/Badge";
import { Button, ButtonLink } from "@/presentation/components/ui/Button";
import { Notice } from "@/presentation/components/ui/Notice";
import { ChipGroup } from "@/presentation/components/ui/Chip";
import { CountUp } from "@/presentation/components/ui/CountUp";
import { Icon } from "@/presentation/components/ui/Icon";
import { Panel, PanelBody, PanelHead } from "@/presentation/components/ui/Panel";
import { fmt, pts } from "@/presentation/lib/format";
import { CONDITION_LABELS } from "@/presentation/lib/labels";
import { paths } from "@/presentation/lib/paths";

type StatistiquesViewProps = {
  space: "partenaire" | "admin";
  stats: PlatformStatistics;
};


function share(part: number, total: number): number {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

/** Vue analytique partagée (avec filtres temporels, réconciliation complète et gestion du stock côté partenaire). */
export function StatistiquesView({ space, stats }: StatistiquesViewProps) {
  const s = stats.summary;
  const maxCategoryVolume = Math.max(1, ...stats.byCategory.map((c) => c.availableValue + c.reservedValue + c.soldValue));

  const [fromDate, setFromDate] = useState(stats.fromDate ?? "");
  const [toDate, setToDate] = useState(stats.toDate ?? "");

  useEffect(() => {
    setFromDate(stats.fromDate ?? "");
    setToDate(stats.toDate ?? "");
  }, [stats.fromDate, stats.toDate]);

  const basePath = space === "partenaire" ? paths.statistiquesPartenaire : paths.statistiquesAdmin;

  const changePeriod = (next: string) => {
    router.get(basePath, next === "tout" ? {} : { periode: next }, { preserveScroll: true });
  };

  const applyCustomRange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromDate && !toDate) {
      changePeriod("tout");
      return;
    }
    const params: Record<string, string> = { periode: "personnalisee" };
    if (fromDate) params.du = fromDate;
    if (toDate) params.au = toDate;
    router.get(basePath, params, { preserveScroll: true });
  };

  const empty = stats.periode !== "tout" && s.totalDeposits === 0 && s.totalAcquisitions === 0 && s.totalEntered === 0;
  const daily = stats.daily ?? [];
  const activity = daily.length > 0
    ? daily.map((d) => ({ label: d.label, values: { deposits: d.deposits, acquisitions: d.acquisitions } }))
    : stats.monthly.map((m) => ({ label: m.month.replace(", en cours", ""), current: m.month.includes("en cours"), values: { deposits: m.deposits, acquisitions: m.acquisitions } }));
  // Le mois courant et le précédent ont leurs propres puces : on les réutilise pour que la puce s'allume.
  const monthShortcut = (key: string) => {
    const cur = stats.periodOptions.some((o) => o.value === key) ? key : null;
    if (cur) return cur;
    const now = new Date();
    const curKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevKey = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`;
    return key === curKey ? "mois" : key === prevKey ? "mois-prec" : key;
  };
  const PAYMENT_COLORS: Record<string, string> = { points: "var(--series-1)", wave: "var(--series-3)", om: "var(--series-2)", especes: "var(--series-4)" };

  const totalPaymentCount = stats.paymentMethods.reduce((acc, m) => acc + m.count, 0);
  const totalConditionCount = stats.byCondition.reduce((acc, c) => acc + c.total, 0);
  const totalUfrDeposits = stats.byUfr.reduce((acc, u) => acc + u.deposits, 0);
  const totalUfrAccepted = stats.byUfr.reduce((acc, u) => acc + u.accepted, 0);
  const totalUfrAcq = stats.byUfr.reduce((acc, u) => acc + u.acquisitions, 0);
  const totalUfrSpent = stats.byUfr.reduce((acc, u) => acc + u.spentPoints, 0);

  return (
    <BackOfficeLayout space={space} current="statistiques">
      <PageTitle>Statistiques</PageTitle>
      <PageHead
        title="Statistiques"
        lead={`Période : ${stats.periodLabel} · ${stats.computedAt}`}
        aside={
          space === "partenaire" ? (
            <ButtonLink href={paths.stockTab("catalogue")} variant="ghost">
              <Icon name="package" size="sm" />
              Gérer le stock
            </ButtonLink>
          ) : undefined
        }
      />

      <Panel sunken style={{ marginBottom: 20 }}>
        <PanelBody className="stack" style={{ gap: 14 }}>
          <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
            <div className="row" style={{ gap: 8 }}>
              <Icon name="calendar" size="sm" />
              <strong style={{ fontSize: "var(--t-sm)" }}>Filtres temporels</strong>
            </div>
            <Badge tone={stats.periode !== "tout" ? "info" : undefined}>{stats.periodLabel}</Badge>
          </div>

          <ChipGroup<string>
            label="Périodes prédéfinies"
            value={stats.periode}
            onChange={changePeriod}
            options={stats.periodOptions.map((o) => ({ value: o.value, label: o.label }))}
          />

          <form className="row" onSubmit={applyCustomRange} style={{ flexWrap: "wrap", gap: "10px 12px", alignItems: "center" }}>
            <label className="small muted" htmlFor="stats-du">
              Du
            </label>
            <input
              id="stats-du"
              type="date"
              className="input"
              style={{ width: "auto", minHeight: 38, padding: "0 12px" }}
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
            <label className="small muted" htmlFor="stats-au">
              au
            </label>
            <input
              id="stats-au"
              type="date"
              className="input"
              style={{ width: "auto", minHeight: 38, padding: "0 12px" }}
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
            <Button type="submit" size="sm" variant={stats.periode === "personnalisee" ? undefined : "ghost"}>
              Appliquer les dates
            </Button>
            {stats.periode !== "tout" && (
              <Button type="button" size="sm" variant="ghost" onClick={() => changePeriod("tout")}>
                Réinitialiser
              </Button>
            )}
          </form>
        </PanelBody>
      </Panel>

      {empty && (
        <Notice tone="warn" icon="calendar" title={`Aucune activité sur cette période (${stats.periodLabel}).`} style={{ marginBottom: 20 }}>
          <p className="small">
            {stats.lastActivity ? `Dernière activité enregistrée le ${stats.lastActivity.label}.` : "Aucune activité enregistrée pour l'instant."}
          </p>
          {stats.lastActivity && (
            <div className="row" style={{ gap: 8, marginTop: 8 }}>
              <Button size="sm" onClick={() => changePeriod(monthShortcut(stats.lastActivity!.month))}>
                Voir ce mois-là
              </Button>
              <Button size="sm" variant="ghost" onClick={() => changePeriod("tout")}>
                Tout l'historique
              </Button>
            </div>
          )}
        </Notice>
      )}

      <div className="tiles">
        <div className="tile tile--mustard">
          <div className="tile__top">
            <span className="tile__label">Dépôts sur la période</span>
            <span className="tile__icon">
              <Icon name="clipboard" />
            </span>
          </div>
          <span className="tile__value">
            <CountUp value={s.totalDeposits} />
          </span>
          <span className="tile__sub">
            {s.pendingDeposits} en attente · {s.refusedDeposits} refusés · {s.cancelledDeposits} annulés
          </span>
        </div>
        <div className="tile tile--cobalt">
          <div className="tile__top">
            <span className="tile__label">Repris en boutique</span>
            <span className="tile__icon">
              <Icon name="check-circle" />
            </span>
          </div>
          <span className="tile__value">
            <CountUp value={s.acceptedDeposits} />
            <small>{s.acceptanceRate} %</small>
          </span>
          <span className="tile__sub">
            taux d'acceptation · {s.fromShopCount} ajouts boutique
          </span>
        </div>
        <div className="tile tile--green">
          <div className="tile__top">
            <span className="tile__label">Ventes réalisées</span>
            <span className="tile__icon">
              <Icon name="cash" />
            </span>
          </div>
          <span className="tile__value">
            <CountUp value={s.totalAcquisitions} />
          </span>
          <span className="tile__sub">
            {pts(s.totalSalesPoints)} · dont {fmt(s.totalComplementsFcfa)} FCFA
          </span>
        </div>
        <div className="tile tile--ink">
          <div className="tile__top">
            <span className="tile__label">Étudiants actifs</span>
            <span className="tile__icon">
              <Icon name="user" />
            </span>
          </div>
          <span className="tile__value">
            <CountUp value={s.activeStudents ?? s.studentsWithBalance} />
          </span>
          <span className="tile__sub">
            ont déposé ou acheté · {s.studentsWithBalance} avec un solde sur {s.totalStudents}
          </span>
        </div>
      </div>

      <div className="dash-grid">
        <Panel>
          <PanelHead title={daily.length > 0 ? "Activité jour par jour" : "Activité mois par mois"} aside="Dépôts reçus et ventes" />
          <PanelBody>
            {activity.length === 0 ? (
              <p className="muted">Aucune activité sur cette période.</p>
            ) : (
              <GroupedColumns
                ariaLabel="Dépôts et ventes sur la période"
                series={[
                  { key: "deposits", label: "Dépôts", color: "var(--series-1)" },
                  { key: "acquisitions", label: "Ventes", color: "var(--series-2)" },
                ]}
                data={activity}
              />
            )}
          </PanelBody>
        </Panel>
        <Panel>
          <PanelHead title="Paiement des achats" aside={`${totalPaymentCount} achats`} />
          <PanelBody className="stack" style={{ gap: 18 }}>
            <SegmentBar
              ariaLabel="Moyens de paiement"
              parts={stats.paymentMethods.map((m) => ({ label: m.label, value: m.count, color: PAYMENT_COLORS[m.key], darkText: m.key === "especes" || m.key === "wave" }))}
            />
            <div>
              <span className="label">Valeur vendue par catégorie</span>
              <HBars rows={stats.byCategory.map((c) => ({ label: c.label, value: c.soldValue, sub: `${c.sold} vendus` }))} />
            </div>
          </PanelBody>
        </Panel>
      </div>

      <h2 style={{ margin: "8px 0 14px" }}>Tableaux détaillés</h2>
      <div className="stack" style={{ gap: 20 }}>
        <Panel>
          <PanelHead
            title="Mouvement du stock par catégorie"
            aside="Entrées (Repris + Boutique) = Dispo + Réservés + Vendus + Retirés"
          />
          <PanelBody>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Catégorie</th>
                    <th className="r">Repris</th>
                    <th className="r">Boutique</th>
                    <th className="r">Total entrés</th>
                    <th className="r">En stock (dispo)</th>
                    <th className="r">Réservés</th>
                    <th className="r">Vendus</th>
                    <th className="r">Retirés</th>
                    <th className="r">Valeur vendue</th>
                    <th style={{ minWidth: 110 }}>Volume</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.byCategory.map((c) => {
                    const vol = c.availableValue + c.reservedValue + c.soldValue;
                    const width = Math.round((vol / maxCategoryVolume) * 100);
                    return (
                      <tr key={c.code}>
                        <td>
                          <strong>{c.label}</strong>
                        </td>
                        <td className="r">{fmt(c.fromDeposits)}</td>
                        <td className="r">{fmt(c.fromShop)}</td>
                        <td className="r">
                          <strong>{fmt(c.totalEntered)}</strong>
                        </td>
                        <td className="r">
                          {fmt(c.available)}
                          {c.toPhoto > 0 ? <span className="xs muted"> ({c.toPhoto} photo)</span> : null}
                        </td>
                        <td className="r">{fmt(c.reserved)}</td>
                        <td className="r">{fmt(c.sold)}</td>
                        <td className="r">{fmt(c.withdrawn)}</td>
                        <td className="r">{pts(c.soldValue)}</td>
                        <td>
                          <div aria-label={pts(vol)} style={{ height: 8, borderRadius: 999, background: "var(--sunken)", overflow: "hidden" }}>
                            <div style={{ width: `${width}%`, height: "100%", borderRadius: 999, background: "var(--accent)" }} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  <tr>
                    <td>
                      <strong>Total</strong>
                    </td>
                    <td className="r">
                      <strong>{fmt(s.fromDepositsCount)}</strong>
                    </td>
                    <td className="r">
                      <strong>{fmt(s.fromShopCount)}</strong>
                    </td>
                    <td className="r">
                      <strong>{fmt(s.totalEntered)}</strong>
                    </td>
                    <td className="r">
                      <strong>{fmt(s.availableCount)}</strong>
                    </td>
                    <td className="r">
                      <strong>{fmt(s.reservedCount)}</strong>
                    </td>
                    <td className="r">
                      <strong>{fmt(s.soldCount)}</strong>
                    </td>
                    <td className="r">
                      <strong>{fmt(s.withdrawnCount)}</strong>
                    </td>
                    <td className="r">
                      <strong>{pts(s.soldValue)}</strong>
                    </td>
                    <td />
                  </tr>
                </tbody>
              </table>
            </div>
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHead title="Parcours des dépôts par catégorie" aside="Dépôts = Repris + En attente + Refusés + Annulés" />
          <PanelBody>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Catégorie</th>
                    <th className="r">Dépôts reçus</th>
                    <th className="r">Repris en stock</th>
                    <th className="r">En attente (RDV / signature)</th>
                    <th className="r">Refusés</th>
                    <th className="r">Annulés</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.byCategory.map((c) => (
                    <tr key={c.code}>
                      <td>
                        <strong>{c.label}</strong>
                      </td>
                      <td className="r">
                        <strong>{fmt(c.deposits)}</strong>
                      </td>
                      <td className="r">{fmt(c.depAccepted)}</td>
                      <td className="r">{fmt(c.depPending)}</td>
                      <td className="r">{fmt(c.depRefused)}</td>
                      <td className="r">{fmt(c.depCancelled)}</td>
                    </tr>
                  ))}
                  <tr>
                    <td>
                      <strong>Total</strong>
                    </td>
                    <td className="r">
                      <strong>{fmt(s.totalDeposits)}</strong>
                    </td>
                    <td className="r">
                      <strong>{fmt(s.acceptedDeposits)}</strong>
                    </td>
                    <td className="r">
                      <strong>{fmt(s.pendingDeposits)}</strong>
                    </td>
                    <td className="r">
                      <strong>{fmt(s.refusedDeposits)}</strong>
                    </td>
                    <td className="r">
                      <strong>{fmt(s.cancelledDeposits)}</strong>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHead title="Moyens de paiement des achats" aside={`${totalPaymentCount} achats`} />
          <PanelBody className="stack" style={{ gap: 12 }}>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Mode</th>
                    <th className="r">Achats</th>
                    <th className="r">Points</th>
                    <th className="r">Complément FCFA</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.paymentMethods.map((m) => (
                    <tr key={m.key}>
                      <td>
                        {m.label} <span className="small muted">({share(m.count, totalPaymentCount)} %)</span>
                      </td>
                      <td className="r">{fmt(m.count)}</td>
                      <td className="r">{pts(m.pointsAmount)}</td>
                      <td className="r">{m.fcfaAmount > 0 ? `${fmt(m.fcfaAmount)} FCFA` : "–"}</td>
                    </tr>
                  ))}
                  <tr>
                    <td>
                      <strong>Total actif</strong>
                    </td>
                    <td className="r">
                      <strong>{fmt(totalPaymentCount)}</strong>
                    </td>
                    <td className="r">
                      <strong>{pts(s.totalPointsDebited)}</strong>
                    </td>
                    <td className="r">
                      <strong>{s.totalComplementsFcfa > 0 ? `${fmt(s.totalComplementsFcfa)} FCFA` : "–"}</strong>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="row small muted" style={{ justifyContent: "space-between" }}>
              <span>Panier moyen : {pts(s.avgBasketPoints)}</span>
              {s.cancelledAcquisitions > 0 && <span>{fmt(s.cancelledAcquisitions)} réservation(s) annulée(s)</span>}
            </div>
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHead title="État constaté des appareils" aside={`${totalConditionCount} articles`} />
          <PanelBody className="stack" style={{ gap: 12 }}>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>État</th>
                    <th className="r">Dispo</th>
                    <th className="r">Réservés</th>
                    <th className="r">Vendus</th>
                    <th className="r">Retirés</th>
                    <th className="r">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.byCondition.map((c) => (
                    <tr key={c.code}>
                      <td>
                        {CONDITION_LABELS[c.code]} <span className="small muted">({share(c.total, totalConditionCount)} %)</span>
                      </td>
                      <td className="r">{fmt(c.available)}</td>
                      <td className="r">{fmt(c.reserved)}</td>
                      <td className="r">{fmt(c.sold)}</td>
                      <td className="r">{fmt(c.withdrawn)}</td>
                      <td className="r">
                        <strong>{fmt(c.total)}</strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="row small muted" style={{ justifyContent: "space-between" }}>
              <span>Bonus de lancement</span>
              <span>
                {s.bonusActive ? <Badge tone="ok">{`Actif +${s.bonusRate} %`}</Badge> : <Badge>Inactif</Badge>} · {s.bonusConsumed}/
                {s.bonusQuota} utilisés
              </span>
            </div>
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHead title="Activité mois par mois" aside="Dépôts, expertises et ventes" />
          <PanelBody>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Mois</th>
                    <th className="r">Dépôts</th>
                    <th className="r">Acceptés</th>
                    <th className="r">Refusés</th>
                    <th className="r">Achats</th>
                    <th className="r">Volume ventes</th>
                    <th className="r">Compléments</th>
                    <th className="r">Marge boutique</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.monthly.map((m) => (
                    <tr key={m.key}>
                      <td>{m.month}</td>
                      <td className="r">{fmt(m.deposits)}</td>
                      <td className="r">{fmt(m.accepted)}</td>
                      <td className="r">{fmt(m.refused)}</td>
                      <td className="r">{fmt(m.acquisitions)}</td>
                      <td className="r">{pts(m.salesPoints)}</td>
                      <td className="r">{m.complementsFcfa > 0 ? `${fmt(m.complementsFcfa)} FCFA` : "–"}</td>
                      <td className="r">{m.marginPoints > 0 ? `+${pts(m.marginPoints)}` : "–"}</td>
                    </tr>
                  ))}
                  {stats.monthly.length === 0 && (
                    <tr>
                      <td colSpan={8} className="muted" style={{ textAlign: "center", padding: "24px 14px" }}>
                        Aucune activité sur cette période.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHead title="Participation par UFR" aside={`${s.totalStudents} étudiants inscrits`} />
          <PanelBody>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>UFR</th>
                    <th className="r">Étudiants</th>
                    <th className="r">Dépôts (repris)</th>
                    <th className="r">Achats</th>
                    <th className="r">Volume acheté</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.byUfr.map((u) => (
                    <tr key={u.ufr}>
                      <td>
                        <strong>{u.ufr}</strong>
                      </td>
                      <td className="r">{fmt(u.students)}</td>
                      <td className="r">
                        {fmt(u.deposits)} <span className="small muted">({fmt(u.accepted)})</span>
                      </td>
                      <td className="r">{fmt(u.acquisitions)}</td>
                      <td className="r">{pts(u.spentPoints)}</td>
                    </tr>
                  ))}
                  <tr>
                    <td>
                      <strong>Total</strong>
                    </td>
                    <td className="r">
                      <strong>{fmt(s.totalStudents)}</strong>
                    </td>
                    <td className="r">
                      <strong>{fmt(totalUfrDeposits)}</strong> <span className="small muted">({fmt(totalUfrAccepted)})</span>
                    </td>
                    <td className="r">
                      <strong>{fmt(totalUfrAcq)}</strong>
                    </td>
                    <td className="r">
                      <strong>{pts(totalUfrSpent)}</strong>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </PanelBody>
        </Panel>

      </div>
    </BackOfficeLayout>
  );
}
