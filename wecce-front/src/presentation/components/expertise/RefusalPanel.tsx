import { useState } from "react";
import type { RefusalReason } from "@/domain/entities";
import { Button } from "@/presentation/components/ui/Button";
import { Choice } from "@/presentation/components/ui/Choice";
import { Panel, PanelBody, PanelFoot, PanelHead } from "@/presentation/components/ui/Panel";
import { REFUSAL_LABELS } from "@/presentation/lib/labels";

type RefusalPanelProps = {
  busy: boolean;
  onConfirm: (reason: RefusalReason, comment: string) => void;
  onBack: () => void;
};

/** Refuser le dépôt : un motif lu par l'étudiant, un commentaire facultatif. */
export function RefusalPanel({ busy, onConfirm, onBack }: RefusalPanelProps) {
  const [reason, setReason] = useState<RefusalReason>("ecran");
  const [comment, setComment] = useState("");

  return (
    <Panel>
      <PanelHead title="Refuser le dépôt" />
      <PanelBody className="stack" style={{ gap: 16 }}>
        <fieldset className="choices" style={{ border: 0, margin: 0, padding: 0, gridTemplateColumns: "repeat(2,minmax(0,1fr))" }}>
          <legend className="label" style={{ marginBottom: 10 }}>
            Motif, lu par l'étudiant
          </legend>
          {(Object.keys(REFUSAL_LABELS) as RefusalReason[]).map((k) => (
            <Choice key={k} name="motif" value={k} checked={reason === k} onChange={() => setReason(k)} title={REFUSAL_LABELS[k]} />
          ))}
        </fieldset>
        <div className="field">
          <label htmlFor="comm">
            Commentaire pour l'étudiant{" "}
            <span className="muted" style={{ fontWeight: 400 }}>
              (facultatif)
            </span>
          </label>
          <textarea
            className="textarea"
            id="comm"
            placeholder="Ce que vous avez mesuré, et ce qu'il faudrait réparer pour revenir"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>
        <p className="xs muted">L'étudiant repart avec son appareil. Aucun point n'est crédité.</p>
      </PanelBody>
      <PanelFoot>
        <Button variant="danger" disabled={busy} onClick={() => onConfirm(reason, comment)}>
          Confirmer le refus
        </Button>
        <Button variant="ghost" onClick={onBack}>
          Revenir aux prix
        </Button>
      </PanelFoot>
    </Panel>
  );
}
