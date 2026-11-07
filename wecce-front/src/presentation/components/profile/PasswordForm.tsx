import { useState } from "react";
import { RuleViolation } from "@/application";
import { isPasswordLongEnough } from "@/domain/rules/account";
import { useToast } from "@/presentation/components/feedback/toastContext";
import { Button } from "@/presentation/components/ui/Button";
import { Field } from "@/presentation/components/ui/Field";
import { Panel, PanelBody, PanelFoot, PanelHead } from "@/presentation/components/ui/Panel";
import { PasswordInput } from "@/presentation/components/ui/PasswordInput";
import { useUseCases } from "@/presentation/hooks/useUseCases";

/** Changer de mot de passe : l'actuel, puis le nouveau (8 caractères au moins). */
export function PasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [tried, setTried] = useState(false);
  const [refused, setRefused] = useState(false);
  const [busy, setBusy] = useState(false);
  const { changePassword } = useUseCases();
  const toast = useToast();

  const currentError = tried && !current ? "Indiquez votre mot de passe actuel." : refused ? "Mot de passe actuel incorrect." : null;
  const nextError = tried && !isPasswordLongEnough(next) ? "Choisissez un mot de passe de 8 caractères au moins." : null;

  return (
    <Panel as="div">
      <form
        noValidate
        onSubmit={async (e) => {
          e.preventDefault();
          setTried(true);
          setRefused(false);
          if (!current || !isPasswordLongEnough(next)) return;
          setBusy(true);
          try {
            const res = await changePassword(current, next);
            if (!res.ok) setRefused(true);
            else {
              toast("Mot de passe changé.");
              setCurrent("");
              setNext("");
              setTried(false);
            }
          } catch (err) {
            if (!(err instanceof RuleViolation)) toast("Le changement n'a pas abouti. Réessayez.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <PanelHead title="Mot de passe" />
        <PanelBody className="form-grid">
          <Field id="mdp-actuel" label="Mot de passe actuel" error={currentError}>
            <PasswordInput id="mdp-actuel" autoComplete="current-password" value={current} aria-invalid={!!currentError || undefined} onChange={(e) => setCurrent(e.target.value)} />
          </Field>
          <Field id="mdp-nouveau" label="Nouveau mot de passe" hint="8 caractères au moins." error={nextError}>
            <PasswordInput id="mdp-nouveau" autoComplete="new-password" value={next} aria-invalid={!!nextError || undefined} onChange={(e) => setNext(e.target.value)} />
          </Field>
        </PanelBody>
        <PanelFoot>
          <Button type="submit" variant="ghost" disabled={busy}>
            Changer le mot de passe
          </Button>
        </PanelFoot>
      </form>
    </Panel>
  );
}
