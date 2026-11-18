import { useState } from "react";
import type { Category, PartnerPurchase, StockArticle, StockOrigin, StockStatus, StockTabSummary } from "@/domain/entities";
import { BackOfficeLayout } from "@/presentation/components/layout/BackOfficeLayout";
import { PageHead } from "@/presentation/components/layout/PageHead";
import { PageTitle } from "@/presentation/components/layout/PageTitle";
import { PurchaseCard } from "@/presentation/components/partner/PurchaseCard";
import { StockRow } from "@/presentation/components/partner/StockRow";
import { ButtonLink } from "@/presentation/components/ui/Button";
import { ChipGroup } from "@/presentation/components/ui/Chip";
import { CountUp } from "@/presentation/components/ui/CountUp";
import { Icon } from "@/presentation/components/ui/Icon";
import type { IconName } from "@/presentation/components/ui/icons";
import { Panel, PanelHead } from "@/presentation/components/ui/Panel";
import { cn } from "@/presentation/lib/cn";
import { fmt } from "@/presentation/lib/format";
import { CATEGORY_LABELS } from "@/presentation/lib/labels";
import { paths } from "@/presentation/lib/paths";

type Tab = "achats" | "depots" | "catalogue";
type OriginFilter = "tout" | StockOrigin;
type StatusFilter = "tout" | StockStatus;
type CategoryFilter = "tout" | Category;

const CATEGORIES: Category[] = ["tel", "ordi", "tab", "audio", "piece"];

export type StockProps = {
  tab?: Tab | null;
  /** Achats à valider par LBC (points bloqués, pas encore débités). */
  toValidate: PartnerPurchase[];
  /** Paiements mobiles pas encore confirmés par le prestataire. */
  awaitingPayment: PartnerPurchase[];
  /** Achats validés : objet à remettre contre la carte d'étudiant. */
  toHandOver: PartnerPurchase[];
  history: PartnerPurchase[];
  /** Dépôts repris pas encore en ligne : à photographier, ou gardés en boutique. */
  toPublish: StockArticle[];
  catalog: { articles: StockArticle[]; counts: Record<OriginFilter, number> };
  summary: StockTabSummary;
};

/**
 * Stock de la boutique LBC, en trois onglets : la remise des objets achetés (validation de l'achat, puis remise),
 * la mise en ligne (ou non) des dépôts repris, et le catalogue complet avec modification des articles.
 */
export default function Stock(p: StockProps) {
  const pending = p.toValidate.length + p.toHandOver.length;
  const [tab, setTab] = useState<Tab>(p.tab ?? (pending > 0 ? "achats" : p.toPublish.length > 0 ? "depots" : "catalogue"));
  const [origin, setOrigin] = useState<OriginFilter>("tout");
  const [status, setStatus] = useState<StatusFilter>("tout");
  const [category, setCategory] = useState<CategoryFilter>("tout");
  const [q, setQ] = useState("");

  const select = (t: Tab) => {
    setTab(t);
    try {
      window.history.replaceState(window.history.state, "", paths.stockTab(t));
    } catch {
      // Navigation sans historique (aperçu) : l'onglet reste choisi localement.
    }
  };

  const articles = p.catalog.articles.filter((a) => {
    if (origin !== "tout" && a.origin !== origin) return false;
    if (status !== "tout" && a.status !== status) return false;
    if (category !== "tout" && a.category !== category) return false;
    const needle = q.trim().toLowerCase();
    return !needle || `${a.name} ${a.originRef ?? ""} ${a.info}`.toLowerCase().includes(needle);
  });

  const tabs: { key: Tab; label: string; icon: IconName; count: number }[] = [
    { key: "achats", label: "Remise des achats", icon: "cash", count: pending },
    { key: "depots", label: "Dépôts à mettre en ligne", icon: "upload", count: p.toPublish.length },
    { key: "catalogue", label: "Catalogue de la boutique", icon: "store", count: p.catalog.counts.tout },
  ];

  return (
    <BackOfficeLayout space="partenaire" current="stock">
      <PageTitle>Stock</PageTitle>
      <PageHead
        title="Stock"
        lead="Ce qui est en boutique, ce qui est en ligne, et les objets achetés à remettre."
        aside={
          <ButtonLink href={paths.articleNew}>
            <Icon name="plus" size="sm" />
            Ajouter un article
          </ButtonLink>
        }
      />

      <div className="tiles">
        <div className={cn("tile tile--cobalt", p.toValidate.length === 0 && "is-zero")}>
          <div className="tile__top">
            <span className="tile__label">Achats à valider</span>
            <span className="tile__icon">
              <Icon name="check-circle" />
            </span>
          </div>
          <span className="tile__value">
            <CountUp value={p.toValidate.length} />
          </span>
          <span className="tile__sub">Les points sont débités à la validation</span>
        </div>
        <div className={cn("tile tile--green", p.toHandOver.length === 0 && "is-zero")}>
          <div className="tile__top">
            <span className="tile__label">Objets à remettre</span>
            <span className="tile__icon">
              <Icon name="package" />
            </span>
          </div>
          <span className="tile__value">
            <CountUp value={p.toHandOver.length} />
          </span>
          <span className="tile__sub">Contre la carte d'étudiant</span>
        </div>
        <div className="tile tile--mustard">
          <div className="tile__top">
            <span className="tile__label">En ligne sur Wecce</span>
            <span className="tile__icon">
              <Icon name="store" />
            </span>
          </div>
          <span className="tile__value">
            <CountUp value={p.summary.onlineCount} />
          </span>
          <span className="tile__sub">{fmt(p.summary.onlineValue)} pts au prix du jour</span>
        </div>
        <div className="tile tile--ink">
          <div className="tile__top">
            <span className="tile__label">En boutique, hors ligne</span>
            <span className="tile__icon">
              <Icon name="lock" />
            </span>
          </div>
          <span className="tile__value">
            <CountUp value={p.summary.offlineCount} />
          </span>
          <span className="tile__sub">
            {p.summary.inShopCount} objets en stock · {p.summary.reservedCount} réservés
          </span>
        </div>
      </div>

      <div className="tabs" role="tablist" aria-label="Sections du stock">
        {tabs.map((t) => (
          <button key={t.key} type="button" role="tab" aria-selected={tab === t.key} aria-controls={`panneau-${t.key}`} onClick={() => select(t.key)}>
            <Icon name={t.icon} size="sm" />
            {t.label}
            <span className={cn("count", (t.count === 0 || t.key === "catalogue") && "is-zero")}>{t.count}</span>
          </button>
        ))}
      </div>

      {tab === "achats" && (
        <div id="panneau-achats" role="tabpanel" className="stack" style={{ gap: 26 }}>
          <section className="stack" style={{ gap: 12 }}>
            <div className="section-head">
              <h2>À valider</h2>
              <span className="spacer" />
              <span className="small muted">Vérifiez que l'objet est là et en état, puis validez : les points de l'étudiant sont débités.</span>
            </div>
            {p.toValidate.length === 0 ? (
              <EmptyNote icon="check-circle" text="Aucun achat en attente de validation." />
            ) : (
              <div className="purchase-grid">
                {p.toValidate.map((x) => (
                  <PurchaseCard key={x.ref} p={x} />
                ))}
              </div>
            )}
          </section>

          <section className="stack" style={{ gap: 12 }}>
            <div className="section-head">
              <h2>À remettre</h2>
              <span className="spacer" />
              <span className="small muted">Quand l'étudiant passe, confirmez la remise : la garantie de 3 mois démarre.</span>
            </div>
            {p.toHandOver.length === 0 ? (
              <EmptyNote icon="package" text="Aucun objet réservé en attente de retrait." />
            ) : (
              <div className="purchase-grid">
                {p.toHandOver.map((x) => (
                  <PurchaseCard key={x.ref} p={x} />
                ))}
              </div>
            )}
          </section>

          {p.awaitingPayment.length > 0 && (
            <section className="stack" style={{ gap: 12 }}>
              <div className="section-head">
                <h2>Paiement mobile en cours</h2>
                <span className="spacer" />
                <span className="small muted">L'étudiant doit encore valider le paiement sur son téléphone.</span>
              </div>
              <div className="purchase-grid">
                {p.awaitingPayment.map((x) => (
                  <PurchaseCard key={x.ref} p={x} />
                ))}
              </div>
            </section>
          )}

          {p.history.length > 0 && (
            <Panel>
              <PanelHead title="Dernières remises et refus" aside={`${p.history.length} derniers`} />
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Achat</th>
                      <th>Objet</th>
                      <th>Catégorie</th>
                      <th>Étudiant</th>
                      <th className="r">Prix</th>
                      <th>Issue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {p.history.map((x) => (
                      <tr key={x.ref}>
                        <td className="num">{x.ref}</td>
                        <td>{x.item.name}</td>
                        <td>{CATEGORY_LABELS[x.item.category].label}</td>
                        <td>
                          {x.student.name} <span className="xs muted">· {x.student.card}</span>
                        </td>
                        <td className="r">{fmt(x.price)}</td>
                        <td className="small">
                          {x.status === "remis" ? `Remis le ${x.handedAt}${x.warrantyUntil ? ` · garantie jusqu'au ${x.warrantyUntil}` : ""}` : `Refusé : ${x.refusal ?? ""}`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          )}
        </div>
      )}

      {tab === "depots" && (
        <div id="panneau-depots" role="tabpanel" className="stack" style={{ gap: 12 }}>
          <div className="section-head">
            <h2>Dépôts repris, pas encore en ligne</h2>
            <span className="spacer" />
            <span className="small muted">Mettez en ligne, ou gardez l'objet en boutique (échange direct, réparation…).</span>
          </div>
          {p.toPublish.length === 0 ? (
            <EmptyNote icon="upload" text="Tous les dépôts repris sont en ligne." />
          ) : (
            <StockTable articles={p.toPublish} />
          )}
        </div>
      )}

      {tab === "catalogue" && (
        <div id="panneau-catalogue" role="tabpanel" className="stack" style={{ gap: 14 }}>
          <div className="row" style={{ gap: "10px 14px", flexWrap: "wrap" }}>
            <ChipGroup<OriginFilter>
              label="Origine"
              value={origin}
              onChange={setOrigin}
              options={[
                { value: "tout", label: "Tous", count: p.catalog.counts.tout },
                { value: "depot", label: "Dépôts étudiants", count: p.catalog.counts.depot },
                { value: "boutique", label: "Stock de la boutique", count: p.catalog.counts.boutique },
              ]}
            />
            <select className="select" aria-label="Filtrer par catégorie" style={{ width: "auto" }} value={category} onChange={(e) => setCategory(e.target.value as CategoryFilter)}>
              <option value="tout">Toutes les catégories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABELS[c].plural} ({p.catalog.articles.filter((a) => a.category === c).length})
                </option>
              ))}
            </select>
            <select className="select" aria-label="Filtrer par statut" style={{ width: "auto" }} value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)}>
              <option value="tout">Tous les statuts</option>
              <option value="en-ligne">En ligne</option>
              <option value="en-boutique">En boutique, hors ligne</option>
              <option value="a-photographier">À photographier</option>
              <option value="reserve">Réservés</option>
              <option value="remis">Remis</option>
              <option value="retire">Retirés</option>
            </select>
            <label className="search" style={{ background: "var(--surface)", flex: "1 1 200px", maxWidth: 280, minWidth: 180 }}>
              <Icon name="search" />
              <input type="search" placeholder="Modèle ou référence" aria-label="Chercher dans le catalogue" value={q} onChange={(e) => setQ(e.target.value)} />
            </label>
          </div>
          <StockTable articles={articles} total={p.catalog.counts.tout} />
          <p className="xs muted">Les prix baissent automatiquement de 5 % le 1er de chaque mois.</p>
        </div>
      )}
    </BackOfficeLayout>
  );
}

function EmptyNote({ icon, text }: { icon: IconName; text: string }) {
  return (
    <Panel style={{ padding: "22px 24px" }}>
      <div className="row" style={{ gap: 12 }}>
        <Icon name={icon} style={{ color: "var(--ok)" }} />
        <span className="muted">{text}</span>
      </div>
    </Panel>
  );
}

function StockTable({ articles, total }: { articles: StockArticle[]; total?: number }) {
  return (
    <Panel>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Objet</th>
              <th>Catégorie</th>
              <th>En ligne depuis</th>
              <th className="r">Prix du jour</th>
              <th>Statut</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {articles.map((a) => (
              <StockRow key={a.id} a={a} />
            ))}
            {articles.length === 0 && (
              <tr>
                <td colSpan={6} className="muted" style={{ padding: "28px 14px", textAlign: "center" }}>
                  Aucun article ne correspond.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {total !== undefined && (
        <div className="panel__foot small muted">
          {articles.length} objet(s) affiché(s) sur {total}
        </div>
      )}
    </Panel>
  );
}
