import type { DeclaredDevice } from "@/domain/entities";
import { Icon } from "@/presentation/components/ui/Icon";
import { pts } from "@/presentation/lib/format";
import { AGE_LABELS, CATEGORY_LABELS, CONDITION_LABELS } from "@/presentation/lib/labels";

/** Ce que l'étudiant a déclaré en ligne, dont son prix souhaité (privé). */
export function DeclaredPanel({ d }: { d: DeclaredDevice }) {
  return (
    <aside className="panel panel--sunken">
      <div className="panel__head">
        <h2 style={{ fontSize: "var(--t-md)" }}>Déclaré par l'étudiant</h2>
      </div>
      <div className="panel__body">
        <dl className="dl small">
          <dt>Catégorie</dt>
          <dd>{CATEGORY_LABELS[d.category].label}</dd>
          <dt>Modèle</dt>
          <dd>{d.modele}</dd>
          <dt>Stockage</dt>
          <dd>{d.stockage}</dd>
          <dt>Âge</dt>
          <dd>{AGE_LABELS[d.age]}</dd>
          <dt>État</dt>
          <dd>{CONDITION_LABELS[d.etat]}</dd>
          <dt>Photos</dt>
          <dd>{d.photoCount === 0 ? "aucune" : d.photoCount}</dd>
          <span className="sep" />
          <dt>Prix souhaité</dt>
          <dd>
            <strong>{d.wish === null ? "non indiqué" : pts(d.wish)}</strong>
          </dd>
        </dl>
        <p className="xs muted" style={{ marginTop: 12, display: "flex", gap: 6 }}>
          <Icon name="private" size="sm" />
          Le prix souhaité n'est vu que par l'étudiant et par vous.
        </p>
      </div>
    </aside>
  );
}
