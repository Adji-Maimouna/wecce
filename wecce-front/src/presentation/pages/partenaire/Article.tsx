import { useState } from "react";
import { RuleViolation } from "@/application";
import type { Category, Condition, StockArticle } from "@/domain/entities";
import { afterFonte } from "@/domain/rules/points";
import { PhotoSlots } from "@/presentation/components/deposit/PhotoSlots";
import { useToast } from "@/presentation/components/feedback/toastContext";
import { BackOfficeLayout } from "@/presentation/components/layout/BackOfficeLayout";
import { Crumbs } from "@/presentation/components/layout/Crumbs";
import { PageHead } from "@/presentation/components/layout/PageHead";
import { PageTitle } from "@/presentation/components/layout/PageTitle";
import { StockStatusBadge } from "@/presentation/components/partner/StockStatusBadge";
import { AmountInput } from "@/presentation/components/ui/AmountInput";
import { Button, ButtonLink } from "@/presentation/components/ui/Button";
import { ChipGroup } from "@/presentation/components/ui/Chip";
import { ConfirmInline } from "@/presentation/components/ui/ConfirmInline";
import { Field, FieldError } from "@/presentation/components/ui/Field";
import { Notice } from "@/presentation/components/ui/Notice";
import { Panel, PanelBody, PanelFoot, PanelHead } from "@/presentation/components/ui/Panel";
import { Segmented } from "@/presentation/components/ui/Segmented";
import { useUseCases } from "@/presentation/hooks/useUseCases";
import { fmt, parseAmount, pts } from "@/presentation/lib/format";
import { CONDITION_LABELS } from "@/presentation/lib/labels";
import { useGo } from "@/presentation/lib/navigation";
import { paths } from "@/presentation/lib/paths";

export type ArticleProps = {
  /** Absent : ajout d'un article de la boutique. */
  article?: StockArticle;
};

const DEVICE_STATES: Condition[] = ["comme-neuf", "bon", "use"];
const PART_STATES: Condition[] = ["fonctionnel", "defectueux"];

/** Article du stock : ajouter un article de la boutique, modifier un article en ligne, ou le retirer du marché. */
export default function Article({ article }: ArticleProps) {
  const editing = !!article;
  const readOnly = article?.status === "retire" || article?.status === "remis";
  const [name, setName] = useState(article?.name ?? "");
  const [category, setCategory] = useState<Category>(article?.category ?? "tel");
  const [condition, setCondition] = useState<Condition>(article?.condition ?? (article?.category === "piece" ? "fonctionnel" : "bon"));
  const [battery, setBattery] = useState(article?.battery !== undefined ? String(article.battery) : "");
  const toPublish = article?.status === "a-photographier";
  const offline = article?.status === "en-boutique";
  const [online, setOnline] = useState(true);
  const [info, setInfo] = useState(article?.info ?? "");
  const [price, setPrice] = useState(article ? fmt(article.todayPrice) : "");
  const [photo, setPhoto] = useState<string | null>(article?.photo ?? null);
  const [error, setError] = useState<string | null>(null);
  const [withdrawing, setWithdrawing] = useState(false);
  const [busy, setBusy] = useState(false);
  const { saveArticle, withdrawArticle, publishArticle, unpublishArticle } = useUseCases();
  const toast = useToast();
  const go = useGo();
  const states = category === "piece" ? PART_STATES : DEVICE_STATES;
  const title = editing ? article.name : "Ajouter un article de la boutique";
  const priceNum = parseAmount(price);
  const catalogueHref = paths.stockTab("catalogue");

  return (
    <BackOfficeLayout space="partenaire" current="stock">
      <PageTitle>{editing ? "Article du stock" : "Ajouter un article"}</PageTitle>
      <Crumbs items={[{ label: "Stock", href: catalogueHref }, { label: editing ? article.name : "Nouvel article" }]} />
      <PageHead
        title={title}
        lead={
          editing
            ? `${article.origin === "depot" ? `Dépôt ${article.originRef}` : "Stock de la boutique"} · ${toPublish ? "pas encore en ligne : ajoutez une photo prise au comptoir" : offline ? "en boutique, hors ligne" : `en ligne depuis le ${article.onlineSince}`}`
            : "Un article de votre boutique ne crée aucune dette : il n'a pas de dépôt derrière lui."
        }
        aside={editing ? <StockStatusBadge a={article} status={article.status} /> : undefined}
      />

      <div className="cols">
        <Panel as="div">
          <form
            noValidate
            onSubmit={async (e) => {
              e.preventDefault();
              setError(null);
              const batteryNum = battery ? Number(battery) : undefined;
              if (batteryNum !== undefined && (batteryNum < 0 || batteryNum > 100)) {
                setError("La batterie doit être comprise entre 0 et 100 %.");
                return;
              }
              setBusy(true);
              try {
                const { id } = await saveArticle({
                  id: article?.id,
                  name,
                  category,
                  condition,
                  battery: batteryNum,
                  info,
                  price: parseAmount(price),
                  photo,
                  online: editing ? undefined : online,
                });
                if (toPublish) await publishArticle(id);
                toast(
                  toPublish
                    ? `${name.split(" · ")[0]} mis en ligne à ${price} pts.`
                    : editing
                      ? "Article enregistré."
                      : online
                        ? `Article ajouté et mis en ligne à ${price} pts.`
                        : "Article ajouté au catalogue de la boutique, hors ligne.",
                );
                go(catalogueHref);
              } catch (err) {
                setBusy(false);
                setError(err instanceof RuleViolation ? err.message : "L'enregistrement n'a pas abouti. Réessayez.");
              }
            }}
          >
            <PanelHead title="L'article" />
            <PanelBody className="form-grid">
              {error && (
                <div className="full">
                  <Notice tone="danger" role="alert" title={error} />
                </div>
              )}
              <fieldset className="full" style={{ border: 0, margin: 0, padding: 0 }} disabled={readOnly}>
                <legend className="label" style={{ marginBottom: 10 }}>
                  Catégorie
                </legend>
                <ChipGroup<Category>
                  label="Catégorie"
                  value={category}
                  onChange={(c) => {
                    setCategory(c);
                    setCondition(c === "piece" ? "fonctionnel" : "bon");
                  }}
                  options={[
                    { value: "tel", label: "Téléphone", icon: "phone" },
                    { value: "ordi", label: "Ordinateur", icon: "laptop" },
                    { value: "tab", label: "Tablette", icon: "tablet" },
                    { value: "audio", label: "Audio", icon: "audio" },
                    { value: "piece", label: "Pièce détachée", icon: "piece" },
                  ]}
                />
              </fieldset>
              <Field id="art-nom" label="Nom affiché sur le marché" full error={error?.includes("nom") ? error : null}>
                <input className="input" id="art-nom" value={name} disabled={readOnly} placeholder="Marque, modèle et capacité" onChange={(e) => setName(e.target.value)} />
              </Field>
              <fieldset className="full" style={{ border: 0, margin: 0, padding: 0 }} disabled={readOnly}>
                <legend className="label" style={{ marginBottom: 10 }}>
                  État constaté
                </legend>
                <Segmented<Condition> label="État constaté" value={condition} onChange={setCondition} options={states.map((s) => ({ value: s, label: CONDITION_LABELS[s] }))} />
              </fieldset>
              <Field id="art-batt" label="Batterie" optional error={error?.includes("batterie") ? error : null}>
                <div className="affix">
                  <input className="input" id="art-batt" inputMode="numeric" value={battery} disabled={readOnly} onChange={(e) => setBattery(e.target.value.replace(/\D/g, "").slice(0, 3))} />
                  <span className="affix__unit">%</span>
                </div>
              </Field>
              <div className="field">
                <label htmlFor="art-prix">Prix d'affichage</label>
                <AmountInput id="art-prix" value={price} onChange={setPrice} disabled={readOnly} invalid={!!error?.includes("prix")} />
                <span className="hint">
                  Baisse automatique de 5&nbsp;% le 1<sup>er</sup> de chaque mois
                  {priceNum > 0 ? ` (${pts(afterFonte(priceNum, 1))} le mois prochain)` : ""}.
                </span>
                {error?.includes("prix") && <FieldError>{error}</FieldError>}
              </div>
              <Field id="art-info" label="Précisions" optional full hint="Visible sur la fiche : accessoires, défauts, détails.">
                <input className="input" id="art-info" value={info} disabled={readOnly} onChange={(e) => setInfo(e.target.value)} />
              </Field>
              {!editing && (
                <label className="check full">
                  <input type="checkbox" checked={online} onChange={(e) => setOnline(e.target.checked)} />
                  <span>
                    <strong>Mettre en ligne sur Wecce tout de suite</strong>
                    <br />
                    <span className="xs muted">Décochez pour l'ajouter au catalogue de la boutique sans le proposer aux étudiants.</span>
                  </span>
                </label>
              )}
              <div className="full field">
                <span className="label">Photo prise au comptoir</span>
                <PhotoSlots photos={[photo]} count={1} disabled={readOnly} onAdd={(_, url) => setPhoto(url)} />
                {photo && !readOnly && (
                  <div style={{ marginTop: 8 }}>
                    <Button variant="ghost" size="sm" onClick={() => setPhoto(null)}>
                      Retirer la photo
                    </Button>
                  </div>
                )}
              </div>
            </PanelBody>
            {!readOnly && (
              <PanelFoot>
                <Button type="submit" disabled={busy}>
                  {toPublish ? "Enregistrer et mettre en ligne" : editing ? "Enregistrer l'article" : online ? "Ajouter et mettre en ligne" : "Ajouter au catalogue"}
                </Button>
                {editing && offline && (
                  <Button
                    variant="ghost"
                    disabled={busy}
                    onClick={async () => {
                      setBusy(true);
                      try {
                        await publishArticle(article.id);
                        toast(`${article.name.split(" · ")[0]} mis en ligne.`);
                        go(catalogueHref);
                      } catch (err) {
                        setBusy(false);
                        setError(err instanceof RuleViolation ? err.message : "La mise en ligne n'a pas abouti.");
                      }
                    }}
                  >
                    Mettre en ligne
                  </Button>
                )}
                {editing && article.status === "en-ligne" && (
                  <Button
                    variant="ghost"
                    disabled={busy}
                    onClick={async () => {
                      setBusy(true);
                      try {
                        await unpublishArticle(article.id);
                        toast(`${article.name.split(" · ")[0]} retiré du marché, gardé en boutique.`);
                        go(catalogueHref);
                      } catch (err) {
                        setBusy(false);
                        setError(err instanceof RuleViolation ? err.message : "L'action n'a pas abouti.");
                      }
                    }}
                  >
                    Mettre hors ligne
                  </Button>
                )}
                <ButtonLink href={catalogueHref} variant="ghost">
                  Annuler
                </ButtonLink>
                {editing && (
                  <>
                    <span className="spacer" />
                    <Button variant="danger" onClick={() => setWithdrawing(true)}>
                      Sortir du stock
                    </Button>
                  </>
                )}
              </PanelFoot>
            )}
          </form>
          {withdrawing && article && (
            <div style={{ padding: "0 28px 24px" }}>
              <ConfirmInline
                question="Sortir cet article du stock ?"
                consequence="Il n'apparaîtra plus aux étudiants ni dans le stock actif. Le retrait est inscrit au journal. Pour le cacher sans le sortir du stock, utilisez « Mettre hors ligne »."
                confirmLabel="Sortir du stock"
                cancelLabel="Garder l'article"
                onCancel={() => setWithdrawing(false)}
                onConfirm={async () => {
                  try {
                    await withdrawArticle(article.id, "Retiré depuis la fiche de l'article.");
                    toast(`${article.name.split(" · ")[0]} retiré du marché.`);
                    go(catalogueHref);
                  } catch (err) {
                    setWithdrawing(false);
                    setError(err instanceof RuleViolation ? err.message : "Le retrait n'a pas abouti. Réessayez.");
                  }
                }}
              />
            </div>
          )}
        </Panel>

        <aside className="stack sticky" style={{ gap: 16 }}>
          {editing || priceNum > 0 ? (
            <Panel>
              <PanelBody className="stack" style={{ gap: 12 }}>
                <span className="label">Évolution avec la baisse mensuelle (−5 %)</span>
                <dl className="dl small">
                  {editing && (
                    <>
                      <dt>Prix initial</dt>
                      <dd>{pts(article.initialPrice)}</dd>
                    </>
                  )}
                  <dt>{editing ? "Prix proposé / du jour" : "Prix de départ"}</dt>
                  <dd className="pts">{pts(priceNum > 0 ? priceNum : article?.todayPrice ?? 0)}</dd>
                  {(priceNum > 0 || article) && (
                    <>
                      <dt>Mois prochain (−5 %)</dt>
                      <dd>{pts(afterFonte(priceNum > 0 ? priceNum : article!.todayPrice, 1))}</dd>
                      <dt>Dans 2 mois (−5 %)</dt>
                      <dd>{pts(afterFonte(priceNum > 0 ? priceNum : article!.todayPrice, 2))}</dd>
                    </>
                  )}
                </dl>
                <p className="xs muted">
                  Tous les prix et soldes baissent automatiquement de 5&nbsp;% le 1<sup>er</sup> de chaque mois.
                </p>
              </PanelBody>
            </Panel>
          ) : (
            <Notice title="Avant de mettre en ligne">
              Une photo nette de l'appareil allumé, l'état constaté au comptoir et un prix en points. Tous les prix baissent de 5&nbsp;% chaque 1<sup>er</sup> du mois.
            </Notice>
          )}
          {readOnly && (
            <Notice icon="lock" title="Cet article n'est plus en vente.">
              Il reste consultable pour l'historique du stock.
            </Notice>
          )}
        </aside>
      </div>
    </BackOfficeLayout>
  );
}
