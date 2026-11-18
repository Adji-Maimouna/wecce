import { displayName } from "@/domain/entities";
import { BackOfficeLayout } from "@/presentation/components/layout/BackOfficeLayout";
import { PageHead } from "@/presentation/components/layout/PageHead";
import { PageTitle } from "@/presentation/components/layout/PageTitle";
import { ContactForm } from "@/presentation/components/profile/ContactForm";
import { IdentityPanel } from "@/presentation/components/profile/IdentityPanel";
import { PasswordForm } from "@/presentation/components/profile/PasswordForm";
import { SignOutPanel } from "@/presentation/components/profile/SignOutPanel";
import { Notice } from "@/presentation/components/ui/Notice";
import { useAdmin } from "@/presentation/hooks/session";

/** Profil d'un administrateur : identité et portée (lecture seule), coordonnées, mot de passe, déconnexion. */
export default function ProfilAdmin() {
  const a = useAdmin();
  return (
    <BackOfficeLayout space="admin" current="profil">
      <PageTitle>Mon profil</PageTitle>
      <PageHead title="Mon profil" lead={`${displayName(a)} · administrateur`} />
      <div className="profile-grid">
        <div className="stack" style={{ gap: 20 }}>
          <IdentityPanel
            rows={[
              { label: "Prénom", value: a.prenom },
              { label: "Nom", value: a.nom },
              { label: "Portée", value: a.portee === "GLOBAL" ? "Toute la plateforme" : a.portee },
            ]}
            correction="La portée d'un compte administrateur se change en base, par un autre administrateur."
          />
          <Notice icon="lock" title="Vos actions sont signées à votre nom.">
            Chaque changement fait depuis ce compte est inscrit au journal, avec votre adresse IP.
          </Notice>
          <SignOutPanel />
        </div>
        <div className="stack" style={{ gap: 20 }}>
          <ContactForm email={a.email} telephone={a.telephone} />
          <PasswordForm />
        </div>
      </div>
    </BackOfficeLayout>
  );
}
