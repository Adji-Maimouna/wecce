import { displayName } from "@/domain/entities";
import { BackOfficeLayout } from "@/presentation/components/layout/BackOfficeLayout";
import { PageHead } from "@/presentation/components/layout/PageHead";
import { PageTitle } from "@/presentation/components/layout/PageTitle";
import { ContactForm } from "@/presentation/components/profile/ContactForm";
import { IdentityPanel } from "@/presentation/components/profile/IdentityPanel";
import { PasswordForm } from "@/presentation/components/profile/PasswordForm";
import { SignOutPanel } from "@/presentation/components/profile/SignOutPanel";
import { Badge } from "@/presentation/components/ui/Badge";
import { Icon } from "@/presentation/components/ui/Icon";
import { useAgent } from "@/presentation/hooks/session";

/** Profil d'un agent LBC : identité et droits (lecture seule), coordonnées, mot de passe, déconnexion. */
export default function ProfilPartenaire() {
  const a = useAgent();
  return (
    <BackOfficeLayout space="partenaire" current="profil">
      <PageTitle>Mon profil</PageTitle>
      <PageHead title="Mon profil" lead={`${displayName(a)} · ${a.fonction} · ${a.poste}`} />
      <div className="cols">
        <div className="stack" style={{ gap: 20 }}>
          <IdentityPanel
            rows={[
              { label: "Prénom", value: a.prenom },
              { label: "Nom", value: a.nom },
              { label: "Boutique", value: "LBC · Leye Business Company" },
              { label: "Fonction", value: a.fonction },
              {
                label: "Expertise",
                value: a.peutExpertiser ? (
                  <Badge tone="ok">
                    <Icon name="check" size="sm" />
                    Autorisé à fixer les deux prix
                  </Badge>
                ) : (
                  <Badge>Non autorisé</Badge>
                ),
              },
            ]}
            correction="Votre fonction et vos droits sont gérés par l'administration de Wecce."
          />
          <ContactForm email={a.email} telephone={a.telephone} />
          <PasswordForm />
        </div>
        <aside className="stack sticky" style={{ gap: 16 }}>
          <SignOutPanel device={`le ${a.poste.toLowerCase()}`} />
        </aside>
      </div>
    </BackOfficeLayout>
  );
}
