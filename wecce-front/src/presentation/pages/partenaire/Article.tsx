import { useState } from "react";
import { RuleViolation } from "@/application";
import type { Category, Condition, StockArticle } from "@/domain/entities";
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
  const [info, setInfo] = useState(article?.info ?? "");
  const [price, setPrice] = useState(article ? fmt(article.todayPrice) : "");
  const [photo, setPhoto] = useState<string | null>(article?.photo ?? null);
  const [error, setError] = useState<string | null>(null);
  const [withdrawing, setWithdrawing] = useState(false);
  const [busy, setBusy] = useState(false);
  const { saveArticle, withdrawArticle, publishArticle } = useUseCases();
  const toast = useToast();
  const go = useGo();
  const states = category === "piece" ? PART_STATES : DEVICE_STATES;
  const title = editing ? article.name : "Ajouter un article de la boutique";

  return (
    <BackOfficeLayout space="partenaire" current="stock">
      <PageTitle>{editing ? "Article du stock" : "Ajouter un article"}</PageTitle>
      <Crumbs items={[{ label: "Stock en boutique", href: paths.stock }, { label: editing ? article.name : "Nouvel article" }]} />
      <PageHead
        title={title}
        lead={
          editing
            ? `${article.origin === "depot" ? `Dépôt ${article.originRef}` : "Stock de la boutique"} · ${toPublish ? "pas encore en ligne : ajoutez une photo prise au comptoir" : `en ligne depuis le ${article.onlineSince}`}`
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
              setBusy(true);
              try {
                const { id } = await saveArticle({
                  id: article?.id,
                  name,
                  category,
                  condition,
                  battery: battery ? Number(battery) : undefined,
                  info,
                  price: parseAmount(price),
                  photo,
                });
                if (toPublish) await publishArticle(id);
                toast(toPublish ? `${name.split(" · ")[0]} mis en ligne à ${price} pts.` : editing ? "Article enregistré." : `Article ajouté et mis en ligne à ${price} pts.`);
                go(paths.stock);
              } catch (err) {
                setBusy(false);
                setError(err instanceof RuleViolation ? err.message : "L'enregistrement n'a pas abouti. Réessayez.");
              }
            }}
          >
            <PanelHead title="L'article" />
            <PanelBody className="form-grid">
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
              <fieldset className="full" style={{ border: 0, margin: 0, padding: 0 }}>
                <legend className="label" style={{ marginBottom: 10 }}>
                  État constaté
                </legend>
                <Segmented<Condition> label="État constaté" value={condition} onChange={setCondition} options={states.map((s) => ({ value: s, label: CONDITION_LABELS[s] }))} />
              </fieldset>
              <Field id="art-batt" label="Batterie" optional>
                <div className="affix">
                  <input className="input" id="art-batt" inputMode="numeric" value={battery} disabled={readOnly} onChange={(e) => setBattery(e.target.value.replace(/\D/g, "").slice(0, 3))} />
                  <span className="affix__unit">%</span>
                </div>
              </Field>
              <div className="field">
                <label htmlFor="art-prix">Prix d'affichage</label>
                <AmountInput id="art-prix" value={price} onChange={setPrice} disabled={readOnly} invalid={!!error?.includes("prix")} />
                {error?.includes("prix") && <FieldError>{error}</FieldError>}
              </div>
              <Field id="art-info" label="Précisions" optional full hint="Visible sur la fiche : accessoires, défauts, détails.">
                <input className="input" id="art-info" value={info} disabled={readOnly} onChange={(e) => setInfo(e.target.value)} />
              </Field>
              <div className="full field">
                <span className="label">Photo prise au comptoir</span>
                <PhotoSlots photos={[photo]} count={1} onAdd={(_, url) => setPhoto(url)} />
              </div>
            </PanelBody>
            {!readOnly && (
              <PanelFoot>
                <Button type="submit" disabled={busy}>
                  {toPublish ? "Enregistrer et mettre en ligne" : editing ? "Enregistrer l'article" : "Mettre en ligne"}
                </Button>
                <ButtonLink href={paths.stock} variant="ghost">
                  Annuler
                </ButtonLink>
                {editing && (
                  <>
                    <span className="spacer" />
                    <Button variant="danger" onClick={() => setWithdrawing(true)}>
                      Retirer du marché
                    </Button>
                  </>
                )}
              </PanelFoot>
            )}
          </form>
          {withdrawing && article && (
            <div style={{ padding: "0 28px 24px" }}>
              <ConfirmInline
                question="Retirer cet article du marché ?"
                consequence="Il n'apparaîtra plus aux étudiants. Le retrait est inscrit au journal."
                confirmLabel="Retirer l'article"
                cancelLabel="Garder en ligne"
                onCancel={() => setWithdrawing(false)}
                onConfirm={async () => {
                  await withdrawArticle(article.id, "Retiré depuis la fiche de l'article.");
                  toast(`${article.name.split(" · ")[0]} retiré du marché.`);
                  go(paths.stock);
                }}
              />
            </div>
          )}
        </Panel>

        <aside className="stack sticky" style={{ gap: 16 }}>
          {editing ? (
            <Panel>
              <PanelBody className="stack" style={{ gap: 12 }}>
                <span className="label">Prix</span>
                <dl className="dl small">
                  <dt>Prix initial</dt>
                  <dd>{pts(article.initialPrice)}</dd>
                  <dt>Prix du jour</dt>
                  <dd className="pts">{pts(article.todayPrice)}</dd>
                </dl>
                <p className="xs muted">
                  Le prix baisse de 5&nbsp;% le 1<sup>er</sup> de chaque mois, comme les points des étudiants.
                </p>
              </PanelBody>
            </Panel>
          ) : (
            <Notice title="Avant de mettre en ligne">
              Une photo nette de l'appareil allumé, l'état constaté au comptoir et un prix en points. L'article apparaît aussitôt sur le marché.
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
