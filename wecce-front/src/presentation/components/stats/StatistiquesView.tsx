import { useEffect, useState } from "react";
import { router } from "@inertiajs/react";
import type { PlatformStatistics, StockOrigin, StockStatus } from "@/domain/entities";
import { Kpis } from "@/presentation/components/admin/Kpis";
import { BackOfficeLayout } from "@/presentation/components/layout/BackOfficeLayout";
import { PageHead } from "@/presentation/components/layout/PageHead";
import { PageTitle } from "@/presentation/components/layout/PageTitle";
import { StockRow } from "@/presentation/components/partner/StockRow";
import { Badge } from "@/presentation/components/ui/Badge";
import { Button, ButtonLink } from "@/presentation/components/ui/Button";
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

type OriginFilter = "tout" | StockOrigin;
type StatusFilter = "tout" | StockStatus;

function share(part: number, total: number): number {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

/** Vue analytique partagée (avec filtres temporels, réconciliation complète et gestion du stock côté partenaire). */
export function StatistiquesView({ space, stats }: StatistiquesViewProps) {
  const s = stats.summary;
  const maxCategoryVolume = Math.max(1, ...stats.byCategory.map((c) => c.availableValue + c.reservedValue + c.soldValue));

  const [originFilter, setOriginFilter] = useState<OriginFilter>("tout");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("tout");
  const [query, setQuery] = useState("");
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

  const catalogArticles = stats.catalog?.articles ?? [];
  const catalogCounts = stats.catalog?.counts ?? { tout: 0, depot: 0, boutique: 0 };
  const shownArticles = catalogArticles.filter((a) => {
    if (originFilter !== "tout" && a.origin !== originFilter) return false;
    if (statusFilter !== "tout" && a.status !== statusFilter) return false;
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      return `${a.name} ${a.originRef ?? ""} ${a.info}`.toLowerCase().includes(q);
    }
    return true;
  });

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
            <div className="row" style={{ gap: 10 }}>
              <ButtonLink href="#catalogue" variant="ghost">
                Gérer les articles ({catalogCounts.tout})
              </ButtonLink>
              <ButtonLink href={paths.articleNew}>
                <Icon name="plus" size="sm" />
                Ajouter un article
              </ButtonLink>
            </div>
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

      <Kpis
        style={{ marginBottom: 20 }}
        items={[
          {
            label: "Dépôts sur la période",
            value: <CountUp value={s.totalDeposits} />,
            sub: `${s.acceptedDeposits} repris (${s.acceptanceRate} %) · ${s.pendingDeposits} en attente · ${s.refusedDeposits} refusés · ${s.cancelledDeposits} annulés`,
          },
          {
            label: "Entrées en boutique",
            value: <CountUp value={s.totalEntered} />,
            sub: `${s.fromDepositsCount} dépôts repris + ${s.fromShopCount} ajouts boutique`,
          },
          {
            label: "Ventes réalisées",
            value: <CountUp value={s.totalAcquisitions} />,
            sub: `${pts(s.totalSalesPoints)} (${pts(s.totalPointsDebited)} + ${fmt(s.totalComplementsFcfa)} FCFA)`,
          },
          {
            label: "Étudiants actifs",
            value: <CountUp value={s.studentsWithBalance} />,
            sub: `avec solde sur ${s.totalStudents} inscrits · moy. ${pts(s.avgBalance)}`,
          },
        ]}
      />

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

        {space === "partenaire" && stats.catalog && (
          <section id="catalogue" className="stack" style={{ gap: 14 }}>
            <div className="row" style={{ gap: "10px 14px", alignItems: "center" }}>
              <div>
                <h2 style={{ margin: 0 }}>Articles en boutique</h2>
                <p className="small muted">Les prix baissent automatiquement de 5 % le 1er de chaque mois.</p>
              </div>
              <span className="spacer" />
              <ButtonLink href={paths.articleNew} size="sm">
                <Icon name="plus" size="sm" />
                Ajouter un article de la boutique
              </ButtonLink>
            </div>

            <div className="row" style={{ gap: "10px 14px" }}>
              <ChipGroup<OriginFilter>
                label="Origine"
                value={originFilter}
                onChange={setOriginFilter}
                options={[
                  { value: "tout", label: "Tous", count: catalogCounts.tout },
                  { value: "depot", label: "Dépôts étudiants", count: catalogCounts.depot },
                  { value: "boutique", label: "Stock boutique", count: catalogCounts.boutique },
                ]}
              />
              <select
                className="select"
                aria-label="Filtrer par statut"
                style={{ width: "auto" }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              >
                <option value="tout">Tous les statuts</option>
                <option value="en-ligne">En ligne</option>
                <option value="a-photographier">À photographier</option>
                <option value="reserve">Réservés</option>
                <option value="remis">Remis</option>
                <option value="retire">Retirés</option>
              </select>
              <span className="spacer" />
              <label className="search" style={{ background: "var(--surface)", maxWidth: 260 }}>
                <Icon name="search" />
                <input
                  type="search"
                  placeholder="Modèle ou référence"
                  aria-label="Chercher dans le catalogue"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </label>
            </div>

            <Panel>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Objet</th>
                      <th>Origine</th>
                      <th>En ligne depuis</th>
                      <th className="r">Prix initial</th>
                      <th className="r">Prix du jour</th>
                      <th>Statut</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {shownArticles.map((a) => (
                      <StockRow key={a.id} a={a} />
                    ))}
                    {shownArticles.length === 0 && (
                      <tr>
                        <td colSpan={7} className="muted" style={{ padding: "28px 14px", textAlign: "center" }}>
                          Aucun article ne correspond.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="panel__foot small muted">
                {shownArticles.length} objet(s) affiché(s) sur {catalogCounts.tout} au total
              </div>
            </Panel>
          </section>
        )}
      </div>
    </BackOfficeLayout>
  );
}
