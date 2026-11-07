import { ChipGroup } from "@/presentation/components/ui/Chip";
import { Choice } from "@/presentation/components/ui/Choice";
import { Field } from "@/presentation/components/ui/Field";
import { Panel, PanelBody, PanelHead } from "@/presentation/components/ui/Panel";
import { Segmented } from "@/presentation/components/ui/Segmented";
import { Tbd } from "@/presentation/components/ui/Tbd";
import { useToast } from "@/presentation/components/feedback/toastContext";
import type { AgeBand, Category, DeviceCondition, PartCondition } from "@/domain/entities";
import { AGE_LABELS, DEVICE_CONDITIONS, PART_CONDITIONS } from "@/presentation/lib/labels";
import { PhotoSlots } from "./PhotoSlots";
import type { DepositDraft } from "./useDepositDraft";
import { WizardFoot } from "./WizardFoot";

type StepProps = { draft: DepositDraft; update: (p: Partial<DepositDraft>) => void; onNext: () => void; modeleError?: string | null };

/** Étape 1 : catégorie, modèle, âge, état déclaré, photos. */
export function StepDevice({ draft, update, onNext, modeleError }: StepProps) {
  const toast = useToast();
  const piece = draft.category === "piece";
  const ages = (Object.keys(AGE_LABELS) as AgeBand[]).map((v) => ({
    value: v,
    label:
      v === "plus-4" ? (
        <Tbd note="Le schéma n'a pas de tranche 3 à 4 ans : PLUS_4ANS suit directement 2_3ANS">{AGE_LABELS[v]}</Tbd>
      ) : (
        AGE_LABELS[v]
      ),
  }));

  return (
    <Panel>
      <PanelHead title="Votre appareil" />
      <PanelBody className="form-grid">
        <fieldset className="full" style={{ border: 0, margin: 0, padding: 0 }}>
          <legend className="label" style={{ marginBottom: 10 }}>
            Catégorie
          </legend>
          <ChipGroup<Category>
            label="Catégorie"
            value={draft.category}
            onChange={(category) => update({ category })}
            options={[
              { value: "tel", label: "Téléphone", icon: "phone" },
              { value: "ordi", label: "Ordinateur", icon: "laptop" },
              { value: "tab", label: "Tablette", icon: "tablet" },
              { value: "audio", label: "Audio", icon: "audio" },
              { value: "piece", label: "Pièce détachée", icon: "piece" },
            ]}
          />
          <p className="hint" style={{ marginTop: 8 }}>
            Une pièce seule (disque, barrette de mémoire, batterie) est acceptée.
          </p>
        </fieldset>
        <Field id="modele" label="Marque et modèle" error={modeleError}>
          <input
            className="input"
            id="modele"
            placeholder={piece ? "Par exemple : SSD Samsung 860" : "Par exemple : Redmi Note 8"}
            value={draft.modele}
            aria-invalid={!!modeleError || undefined}
            onChange={(e) => update({ modele: e.target.value })}
          />
        </Field>
        <Field id="stockage" label="Stockage" optional>
          <input className="input" id="stockage" placeholder="Par exemple : 64 Go" value={draft.stockage} onChange={(e) => update({ stockage: e.target.value })} />
        </Field>
        <fieldset className="full" style={{ border: 0, margin: 0, padding: 0 }}>
          <legend className="label" style={{ marginBottom: 10 }}>
            Âge de l'appareil
          </legend>
          <Segmented label="Âge de l'appareil" value={draft.age} onChange={(age) => update({ age })} options={ages} />
        </fieldset>
        <fieldset className="full" style={{ border: 0, margin: 0, padding: 0 }}>
          <legend className="label" style={{ marginBottom: 10 }}>
            État, selon vous
          </legend>
          {piece ? (
            <div className="choices choices--2">
              {(Object.keys(PART_CONDITIONS) as PartCondition[]).map((k) => (
                <Choice key={k} name="etat-piece" value={k} checked={draft.etatPiece === k} onChange={() => update({ etatPiece: k })} title={PART_CONDITIONS[k].label} description={PART_CONDITIONS[k].hint} />
              ))}
            </div>
          ) : (
            <div className="choices choices--3">
              {(Object.keys(DEVICE_CONDITIONS) as DeviceCondition[]).map((k) => (
                <Choice key={k} name="etat" value={k} checked={draft.etat === k} onChange={() => update({ etat: k })} title={DEVICE_CONDITIONS[k].label} description={DEVICE_CONDITIONS[k].hint} />
              ))}
            </div>
          )}
        </fieldset>
        <div className="full field">
          <span className="label">Photos</span>
          <PhotoSlots
            photos={draft.photos}
            onAdd={(i, url) => {
              const photos = [...draft.photos];
              photos[i] = url;
              update({ photos });
              toast("Photo ajoutée.");
            }}
          />
          <span className="hint">Le prix est fixé à l'examen, pas sur les photos.</span>
        </div>
      </PanelBody>
      <WizardFoot onNext={onNext} />
    </Panel>
  );
}
