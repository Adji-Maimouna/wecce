import type { ReactNode } from "react";
import { Button } from "@/presentation/components/ui/Button";
import { Icon } from "@/presentation/components/ui/Icon";
import { PanelFoot } from "@/presentation/components/ui/Panel";

type WizardFootProps = { onPrev?: () => void; onNext?: () => void; next?: ReactNode };

/** Pied d'étape : Retour à gauche, Continuer (ou l'action finale) à droite. */
export function WizardFoot({ onPrev, onNext, next }: WizardFootProps) {
  return (
    <PanelFoot>
      {onPrev && (
        <Button variant="ghost" onClick={onPrev}>
          <Icon name="arrow-left" size="sm" />
          Retour
        </Button>
      )}
      <span className="spacer" />
      {next ?? <Button onClick={onNext}>Continuer</Button>}
    </PanelFoot>
  );
}
