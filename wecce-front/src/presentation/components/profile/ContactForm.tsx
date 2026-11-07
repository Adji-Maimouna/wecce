import { useState } from "react";
import { RuleViolation } from "@/application";
import { NIVEAUX, UFRS } from "@/domain/referentials/ugb";
import { useToast } from "@/presentation/components/feedback/toastContext";
import { Button } from "@/presentation/components/ui/Button";
import { Field } from "@/presentation/components/ui/Field";
import { Panel, PanelBody, PanelFoot, PanelHead } from "@/presentation/components/ui/Panel";
import { useUseCases } from "@/presentation/hooks/useUseCases";

type ContactFormProps = {
  email: string;
  telephone: string;
  /** Étudiant : niveau et UFR, facultatifs. */
  study?: { niveau?: string; ufr?: string };
};

/** Coordonnées modifiables : e-mail, téléphone (et études pour un étudiant). */
export function ContactForm({ email: e0, telephone: t0, study }: ContactFormProps) {
  const [email, setEmail] = useState(e0);
  const [telephone, setTelephone] = useState(t0);
  const [niveau, setNiveau] = useState(study?.niveau ?? "");
  const [ufr, setUfr] = useState(study?.ufr ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { updateContact } = useUseCases();
  const toast = useToast();
  const changed = email !== e0 || telephone !== t0 || niveau !== (study?.niveau ?? "") || ufr !== (study?.ufr ?? "");

  return (
    <Panel as="div">
      <form
        noValidate
        onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          setBusy(true);
          try {
            await updateContact({ email, telephone, niveau: niveau || undefined, ufr: ufr || undefined });
            toast("Coordonnées enregistrées.");
          } catch (err) {
            setError(err instanceof RuleViolation ? err.message : "L'enregistrement n'a pas abouti. Réessayez.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <PanelHead title={study ? "Coordonnées et études" : "Coordonnées"} />
        <PanelBody className="form-grid">
          <Field id="profil-email" label="E-mail" error={error?.includes("e-mail") ? error : null}>
            <input className="input" id="profil-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field id="profil-tel" label="Téléphone" error={error?.includes("numéro") ? error : null}>
            <input className="input" id="profil-tel" type="tel" inputMode="tel" autoComplete="tel" value={telephone} onChange={(e) => setTelephone(e.target.value)} />
          </Field>
          {study && (
            <>
              <Field id="profil-niveau" label="Niveau" optional>
                <select className="select" id="profil-niveau" value={niveau} onChange={(e) => setNiveau(e.target.value)}>
                  <option value="">Choisir</option>
                  {NIVEAUX.map((n) => (
                    <option key={n}>{n}</option>
                  ))}
                </select>
              </Field>
              <Field id="profil-ufr" label="UFR" optional>
                <select className="select" id="profil-ufr" value={ufr} onChange={(e) => setUfr(e.target.value)}>
                  <option value="">Choisir</option>
                  {UFRS.map((u) => (
                    <option key={u}>{u}</option>
                  ))}
                </select>
              </Field>
            </>
          )}
        </PanelBody>
        <PanelFoot>
          <Button type="submit" disabled={!changed || busy}>
            Enregistrer les coordonnées
          </Button>
          {!changed && <span className="xs muted">Modifiez un champ pour enregistrer.</span>}
        </PanelFoot>
      </form>
    </Panel>
  );
}
