import type { ExchangeableItem, TakeBackMode } from "@/domain/entities";
import { Icon } from "@/presentation/components/ui/Icon";
import type { IconName } from "@/presentation/components/ui/icons";
import { Panel, PanelBody } from "@/presentation/components/ui/Panel";
import { fmt } from "@/presentation/lib/format";

type TakeBackModePanelProps = {
  mode: TakeBackMode;
  onMode: (m: TakeBackMode) => void;
  shopItems: ExchangeableItem[];
  counterpartId: string;
  onCounterpartId: (id: string) => void;
  counterpartLabel: string;
  onCounterpartLabel: (v: string) => void;
};

const MODES: { value: TakeBackMode; icon: IconName; title: string; text: string }[] = [
  { value: "vente", icon: "store", title: "Points + vente sur Wecce", text: "L'étudiant reçoit ses points, l'objet est mis en vente sur le marché." },
  { value: "echange-points", icon: "points", title: "Échange contre des points", text: "L'étudiant reçoit ses points ; l'objet reste en boutique, hors marché." },
  { value: "echange-objet", icon: "package", title: "Échange contre un objet LBC", text: "L'étudiant repart avec un objet de la boutique, sans point." },
];

/** Étape 2 bis : comment LBC reprend l'appareil. Un échange direct ne met pas l'objet en vente sur Wecce. */
export function TakeBackModePanel(p: TakeBackModePanelProps) {
  return (
    <Panel>
      <div className="panel__head">
        <div className="row" style={{ gap: 10 }}>
          <span className="step-badge">2</span>
          <h2>Mode de reprise</h2>
        </div>
        <span className="xs muted">Vous pourrez mettre l'objet en ligne plus tard depuis le Stock.</span>
      </div>
      <PanelBody className="stack" style={{ gap: 14 }}>
        <div className="mode-cards" role="radiogroup" aria-label="Mode de reprise">
          {MODES.map((m) => (
            <label key={m.value} className="mode-card" data-mode={m.value}>
              <input type="radio" name="mode-reprise" value={m.value} checked={p.mode === m.value} onChange={() => p.onMode(m.value)} />
              <span className="mode-card__icon">
                <Icon name={m.icon} />
              </span>
              <span className="mode-card__title">{m.title}</span>
              <span className="mode-card__text">{m.text}</span>
            </label>
          ))}
        </div>

        {p.mode === "echange-objet" && (
          <div className="form-grid">
            <div className="field">
              <label htmlFor="contrepartie">Objet du catalogue LBC</label>
              <select id="contrepartie" className="select" value={p.counterpartId} onChange={(e) => p.onCounterpartId(e.target.value)}>
                <option value="">Autre objet (décrire à droite)</option>
                {p.shopItems.map((it) => (
                  <option key={it.id} value={it.id}>
                    {it.name} · {fmt(it.price)} pts{it.online ? "" : " · hors ligne"}
                  </option>
                ))}
              </select>
              <span className="hint">L'objet choisi sort du stock de la boutique à la signature.</span>
            </div>
            <div className="field">
              <label htmlFor="contrepartie-libre">{p.counterpartId ? "Précision (facultatif)" : "Objet remis à l'étudiant"}</label>
              <input
                id="contrepartie-libre"
                className="input"
                maxLength={160}
                placeholder="Ex. : écouteurs Oraimo neufs, coque et verre trempé"
                value={p.counterpartLabel}
                onChange={(e) => p.onCounterpartLabel(e.target.value)}
              />
            </div>
          </div>
        )}
      </PanelBody>
    </Panel>
  );
}
