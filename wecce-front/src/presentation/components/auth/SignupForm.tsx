import { useState } from "react";
import { Button } from "@/presentation/components/ui/Button";
import { Checkbox } from "@/presentation/components/ui/Choice";
import { Field, FieldError } from "@/presentation/components/ui/Field";
import { Notice } from "@/presentation/components/ui/Notice";
import { PasswordInput } from "@/presentation/components/ui/PasswordInput";
import type { StudentRegistration } from "@/domain/entities";
import { isPasswordLongEnough } from "@/domain/rules/account";
import { NIVEAUX, UFRS } from "@/domain/referentials/ugb";
import { useRequired } from "./useRequired";

type SignupData = {
  prenom: string;
  nom: string;
  carte: string;
  tel: string;
  email: string;
  niveau: string;
  ufr: string;
  motDePasse: string;
};

type SignupFormProps = {
  onCreated: (data: StudentRegistration) => void | Promise<void>;
  onLogin: () => void;
  /** Refus du serveur (e-mail ou carte déjà utilisés). */
  serverError?: string | null;
};

/** Création de compte, réservée aux étudiants de l'UGB (table etudiant : numero_carte, niveau, ufr). */
export function SignupForm({ onCreated, onLogin, serverError }: SignupFormProps) {
  const [d, setD] = useState<SignupData>({ prenom: "", nom: "", carte: "", tel: "", email: "", niveau: "", ufr: "", motDePasse: "" });
  const [fonte, setFonte] = useState(false);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof SignupData) => (e: { target: { value: string } }) => setD((v) => ({ ...v, [k]: e.target.value }));

  const { errors, check } = useRequired({
    prenom: { ok: d.prenom.trim() !== "", message: "Indiquez votre prénom." },
    nom: { ok: d.nom.trim() !== "", message: "Indiquez votre nom." },
    carte: { ok: d.carte.trim() !== "", message: "Indiquez le numéro de votre carte." },
    tel: { ok: d.tel.trim() !== "", message: "Indiquez votre numéro." },
    email: { ok: d.email.trim() !== "", message: "Indiquez votre e-mail." },
    "mdp-new": { ok: isPasswordLongEnough(d.motDePasse), message: "Choisissez un mot de passe de 8 caractères au moins." },
    fonte: { ok: fonte, message: "Cochez la case pour continuer." },
  });

  const text = (id: keyof typeof errors, key: keyof SignupData, label: string, extra: Record<string, string> = {}) => (
    <Field id={id} label={label} error={errors[id]}>
      <input className="input" id={id} value={d[key]} onChange={set(key)} aria-invalid={!!errors[id] || undefined} {...extra} />
    </Field>
  );

  return (
    <form
      noValidate
      aria-labelledby="t-inscription"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!check()) return;
        setBusy(true);
        await onCreated({
          prenom: d.prenom,
          nom: d.nom,
          numeroCarte: d.carte,
          telephone: d.tel,
          email: d.email,
          niveau: d.niveau || undefined,
          ufr: d.ufr || undefined,
          motDePasse: d.motDePasse,
        });
        setBusy(false);
      }}
    >
      <h1 id="t-inscription">Créer un compte</h1>
      <p className="muted">Réservé aux étudiants de l'UGB.</p>
      {serverError && <Notice tone="danger" role="alert" title={serverError} />}

      <div className="form-grid">
        {text("prenom", "prenom", "Prénom", { autoComplete: "given-name" })}
        {text("nom", "nom", "Nom", { autoComplete: "family-name" })}
        <div className="full">{text("carte", "carte", "Numéro de carte d'étudiant", { autoComplete: "off", maxLength: "16" })}</div>
        {text("tel", "tel", "Téléphone", { type: "tel", autoComplete: "tel", inputMode: "tel" })}
        {text("email", "email", "E-mail", { type: "email", autoComplete: "email" })}
        <Field id="niveau" label="Niveau" optional>
          <select className="select" id="niveau" value={d.niveau} onChange={set("niveau")}>
            <option value="">Choisir</option>
            {NIVEAUX.map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </Field>
        <Field id="ufr" label="UFR" optional>
          <select className="select" id="ufr" value={d.ufr} onChange={set("ufr")}>
            <option value="">Choisir</option>
            {UFRS.map((u) => (
              <option key={u}>{u}</option>
            ))}
          </select>
        </Field>
        <Field id="mdp-new" label="Mot de passe" hint="8 caractères au moins." error={errors["mdp-new"]} full>
          <PasswordInput
            id="mdp-new"
            autoComplete="new-password"
            minLength={8}
            aria-describedby="mdp-new-aide"
            aria-invalid={!!errors["mdp-new"] || undefined}
            value={d.motDePasse}
            onChange={set("motDePasse")}
          />
        </Field>
      </div>

      <div className="field">
        <Checkbox id="fonte" checked={fonte} onChange={setFonte} invalid={!!errors.fonte}>
          J'ai compris que mes points et les prix baissent de 5&nbsp;% chaque mois.
        </Checkbox>
        {errors.fonte && <FieldError>{errors.fonte}</FieldError>}
      </div>
      <Button type="submit" size="lg" block disabled={busy}>
        {busy ? "Création du compte…" : "Créer mon compte"}
      </Button>
      <p className="auth__alt">
        Déjà inscrit ?{" "}
        <a
          href="#connexion"
          onClick={(e) => {
            e.preventDefault();
            onLogin();
          }}
        >
          Se connecter
        </a>
      </p>
    </form>
  );
}
