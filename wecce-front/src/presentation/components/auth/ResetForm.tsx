import { useState } from "react";
import { Button } from "@/presentation/components/ui/Button";
import { Field } from "@/presentation/components/ui/Field";
import { useRequired } from "./useRequired";

type ResetFormProps = { onSent: (email: string) => void | Promise<void>; onBack: () => void };

/** Mot de passe oublié : on envoie un lien par e-mail. */
export function ResetForm({ onSent, onBack }: ResetFormProps) {
  const [email, setEmail] = useState("");
  const { errors, check } = useRequired({
    "email-oubli": { ok: email.trim() !== "", message: "Indiquez l'e-mail de votre compte." },
  });

  return (
    <form
      noValidate
      aria-labelledby="t-oubli"
      onSubmit={(e) => {
        e.preventDefault();
        if (check()) onSent(email);
      }}
    >
      <h1 id="t-oubli">Mot de passe oublié</h1>
      <p className="muted">Nous vous envoyons par e-mail un lien pour en choisir un nouveau.</p>
      <Field id="email-oubli" label="E-mail" error={errors["email-oubli"]}>
        <input
          className="input"
          id="email-oubli"
          type="email"
          autoComplete="email"
          value={email}
          aria-invalid={!!errors["email-oubli"] || undefined}
          onChange={(e) => setEmail(e.target.value)}
        />
      </Field>
      <Button type="submit" size="lg" block>
        Envoyer le lien
      </Button>
      <p className="auth__alt">
        <a
          href="#connexion"
          onClick={(e) => {
            e.preventDefault();
            onBack();
          }}
        >
          Revenir à la connexion
        </a>
      </p>
    </form>
  );
}
