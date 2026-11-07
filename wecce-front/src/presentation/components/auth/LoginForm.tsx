import { useState } from "react";
import { Button } from "@/presentation/components/ui/Button";
import { Checkbox } from "@/presentation/components/ui/Choice";
import { Field } from "@/presentation/components/ui/Field";
import { Notice } from "@/presentation/components/ui/Notice";
import { PasswordInput } from "@/presentation/components/ui/PasswordInput";
import { Spinner } from "@/presentation/components/ui/Spinner";
import { useRequired } from "./useRequired";

type LoginFormProps = {
  /** Mot de passe refusé : affiche le message en tête du formulaire. */
  refused: boolean;
  /** Envoi (cas d'usage login). Renvoie vrai si la connexion a réussi. */
  onSubmit: (identifiant: string, motDePasse: string, rester: boolean) => Promise<boolean>;
  onForgot: () => void;
  onSignup: () => void;
};

/** Connexion commune aux étudiants, à l'équipe LBC et à l'administration. */
export function LoginForm({ refused, onSubmit, onForgot, onSignup }: LoginFormProps) {
  const [identifiant, setIdentifiant] = useState("");
  const [mdp, setMdp] = useState("");
  const [rester, setRester] = useState(true);
  const [busy, setBusy] = useState(false);
  const { errors, check } = useRequired({
    identifiant: { ok: identifiant.trim() !== "", message: "Indiquez votre e-mail ou votre numéro." },
    mdp: { ok: mdp !== "", message: "Indiquez votre mot de passe." },
  });

  return (
    <form
      noValidate
      aria-labelledby="t-connexion"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!check()) return;
        setBusy(true);
        const ok = await onSubmit(identifiant, mdp, rester);
        if (!ok) setBusy(false);
      }}
    >
      <h1 id="t-connexion">Se connecter</h1>

      {refused && <Notice tone="danger" role="alert" title="Identifiant ou mot de passe incorrect." />}

      <Field id="identifiant" label="E-mail ou numéro de téléphone" error={errors.identifiant}>
        <input
          className="input"
          id="identifiant"
          autoComplete="username"
          value={identifiant}
          aria-invalid={!!errors.identifiant || undefined}
          onChange={(e) => setIdentifiant(e.target.value)}
        />
      </Field>
      <Field id="mdp" label="Mot de passe" error={errors.mdp}>
        <PasswordInput
          id="mdp"
          autoComplete="current-password"
          value={mdp}
          aria-invalid={!!errors.mdp || undefined}
          onChange={(e) => setMdp(e.target.value)}
        />
      </Field>
      <div className="auth__row">
        <Checkbox checked={rester} onChange={setRester}>
          Rester connecté
        </Checkbox>
        <a
          className="link"
          href="#oubli"
          onClick={(e) => {
            e.preventDefault();
            onForgot();
          }}
        >
          Mot de passe oublié ?
        </a>
      </div>
      <Button type="submit" size="lg" block disabled={busy}>
        {busy ? (
          <>
            <Spinner />
            Connexion…
          </>
        ) : (
          "Se connecter"
        )}
      </Button>
      <p className="auth__alt">
        Pas encore de compte ?{" "}
        <a
          href="#inscription"
          onClick={(e) => {
            e.preventDefault();
            onSignup();
          }}
        >
          Créer un compte
        </a>
      </p>
    </form>
  );
}
