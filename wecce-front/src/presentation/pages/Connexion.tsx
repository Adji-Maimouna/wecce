import { useState } from "react";
import { useSearchParams } from "@/presentation/hooks/useSearchParams";
import { RuleViolation } from "@/application";
import { LoginForm } from "@/presentation/components/auth/LoginForm";
import { ResetForm } from "@/presentation/components/auth/ResetForm";
import { SignupForm } from "@/presentation/components/auth/SignupForm";
import { Welcome } from "@/presentation/components/auth/Welcome";
import { GateLayout } from "@/presentation/components/gate/GateLayout";
import type { PilePhoto } from "@/presentation/components/gate/PhotoPile";
import { Brand } from "@/presentation/components/layout/Brand";
import { PageTitle } from "@/presentation/components/layout/PageTitle";
import { Button, ButtonLink } from "@/presentation/components/ui/Button";
import { useUseCases } from "@/presentation/hooks/useUseCases";
import { useGo } from "@/presentation/lib/navigation";
import { HOME_BY_ROLE, SPACE_BY_ROLE, paths } from "@/presentation/lib/paths";

export type ConnexionView = "connexion" | "erreur" | "oubli" | "envoye" | "inscription" | "cree";

const PHOTOS: PilePhoto[] = [
  { src: "/img/ipad.jpg", width: 453, height: 640, rotate: -5 },
  { src: "/img/jbl.jpg", width: 500, height: 375, rotate: 6 },
  { src: "/img/tecno.jpg", width: 309, height: 640, rotate: -2 },
];

/** Vue ouverte par l'adresse : /connexion#inscription ouvre la création de compte. */
const viewFromHash = (): ConnexionView => (window.location.hash === "#inscription" ? "inscription" : "connexion");

/**
 * Connexion unique (étudiants, LBC, administration) et inscription des étudiants. Le rôle du compte décide de l'espace ouvert.
 * `?retour=/etudiant/deposer` : l'écran demandé avant la connexion, rouvert ensuite s'il appartient à l'espace du compte.
 */
export default function Connexion() {
  const [view, setView] = useState<ConnexionView>(viewFromHash);
  const [signupError, setSignupError] = useState<string | null>(null);
  const [signupFieldErrors, setSignupFieldErrors] = useState<Partial<Record<string, string>>>({});
  const [params] = useSearchParams();
  const { login, requestPasswordReset, registerStudent } = useUseCases();
  const go = useGo();
  const back = params.get("retour");
  const show = (v: ConnexionView) => {
    setSignupError(null);
    setSignupFieldErrors({});
    setView(v);
    window.scrollTo({ top: 0 });
  };

  return (
    <GateLayout variant="auth" photos={PHOTOS}>
      <PageTitle>{view === "inscription" || view === "cree" ? "Créer un compte" : "Connexion"}</PageTitle>
      <div className="auth__head">
        <Brand href={paths.accueil} label="Wecce, accueil" />
      </div>

      {(view === "connexion" || view === "erreur") && (
        <LoginForm
          refused={view === "erreur"}
          onForgot={() => show("oubli")}
          onSignup={() => show("inscription")}
          onSubmit={async (identifiant, mdp, rester) => {
            const res = await login(identifiant, mdp, rester);
            if (res.ok) go(back && back.startsWith(SPACE_BY_ROLE[res.role]) ? back : HOME_BY_ROLE[res.role]);
            else show("erreur");
            return res.ok;
          }}
        />
      )}

      {view === "oubli" && (
        <ResetForm
          onSent={async (email) => {
            await requestPasswordReset(email);
            show("envoye");
          }}
          onBack={() => show("connexion")}
        />
      )}

      {view === "envoye" && (
        <Welcome
          id="t-envoye"
          title="Lien envoyé"
          actions={
            <Button variant="ghost" size="lg" onClick={() => show("connexion")}>
              Revenir à la connexion
            </Button>
          }
        >
          Si cette adresse correspond à un compte Wecce, vous recevrez le lien par e-mail.
        </Welcome>
      )}

      {view === "inscription" && (
        <SignupForm
          serverError={signupError}
          serverFieldErrors={signupFieldErrors}
          onClearServerError={(field) =>
            setSignupFieldErrors((prev) => {
              if (!prev[field]) return prev;
              const next = { ...prev };
              delete next[field];
              return next;
            })
          }
          onCreated={async (data) => {
            setSignupError(null);
            setSignupFieldErrors({});
            try {
              await registerStudent(data);
              const destination = back && back.startsWith(SPACE_BY_ROLE.ETUDIANT) ? back : HOME_BY_ROLE.ETUDIANT;
              go(destination);
            } catch (e) {
              if (e instanceof RuleViolation) {
                setSignupError(e.message);
                setSignupFieldErrors(e.fields ?? {});
              } else {
                setSignupError("Le compte n'a pas pu être créé. Réessayez.");
              }
              window.scrollTo({ top: 0 });
            }
          }}
          onLogin={() => show("connexion")}
        />
      )}

      {view === "cree" && (
        <Welcome
          id="t-cree"
          title="Compte créé"
          celebrate
          actions={
            <>
              <ButtonLink href={back && back.startsWith("/etudiant/") ? back : paths.deposer} size="lg">
                {back && back.startsWith("/etudiant/") ? "Continuer" : "Déposer un objet"}
              </ButtonLink>
              <ButtonLink href={paths.marche} variant="ghost" size="lg">
                Voir le marché
              </ButtonLink>
            </>
          }
        >
          Vous êtes connecté. Déposez un appareil chez LBC pour recevoir vos premiers points.
        </Welcome>
      )}
    </GateLayout>
  );
}
