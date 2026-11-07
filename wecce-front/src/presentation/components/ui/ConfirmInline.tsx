import { useEffect, useRef, type ReactNode } from "react";
import { Button } from "./Button";

type ConfirmInlineProps = {
  question: ReactNode;
  consequence?: ReactNode;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
};

/** Confirmation sur place, sans fenêtre surgissante. Le bouton de confirmation reçoit le focus. */
export function ConfirmInline({ question, consequence, confirmLabel, cancelLabel, onConfirm, onCancel }: ConfirmInlineProps) {
  const yes = useRef<HTMLButtonElement>(null);
  useEffect(() => yes.current?.focus(), []);
  return (
    <div className="confirm" role="group">
      <p>
        <strong>{question}</strong> {consequence}
      </p>
      <Button ref={yes} variant="danger" size="sm" onClick={onConfirm}>
        {confirmLabel}
      </Button>
      <Button variant="ghost" size="sm" onClick={onCancel}>
        {cancelLabel}
      </Button>
    </div>
  );
}
