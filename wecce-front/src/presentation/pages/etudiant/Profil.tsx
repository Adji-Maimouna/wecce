import { displayName, initials } from "@/domain/entities";
import { PageHead } from "@/presentation/components/layout/PageHead";
import { PageTitle } from "@/presentation/components/layout/PageTitle";
import { StudentLayout } from "@/presentation/components/layout/StudentLayout";
import { AccountSummary } from "@/presentation/components/profile/AccountSummary";
import { ContactForm } from "@/presentation/components/profile/ContactForm";
import { IdentityPanel } from "@/presentation/components/profile/IdentityPanel";
import { PasswordForm } from "@/presentation/components/profile/PasswordForm";
import { SignOutPanel } from "@/presentation/components/profile/SignOutPanel";
import { useStudent } from "@/presentation/hooks/session";

/** Profil de l'étudiant : identité (lecture seule), coordonnées et études, mot de passe, déconnexion. */
export default function ProfilEtudiant() {
  const s = useStudent();
  return (
    <StudentLayout section="profil">
      <PageTitle>Mon profil</PageTitle>
      <div className="wrap" style={{ maxWidth: 1100 }}>
        <PageHead
          title="Mon profil"
          lead={`${displayName(s)} · carte d'étudiant ${s.numeroCarte}`}
          aside={
            <span className="avatar" style={{ width: 56, height: 56, fontSize: "var(--t-md)" }} aria-hidden="true">
              {initials(s)}
            </span>
          }
        />
        <div className="cols">
          <div className="stack" style={{ gap: 20 }}>
            <IdentityPanel
              rows={[
                { label: "Prénom", value: s.prenom },
                { label: "Nom", value: s.nom },
                { label: "Carte d'étudiant", value: <span className="num">{s.numeroCarte}</span> },
              ]}
              correction="Pour corriger votre nom ou votre numéro de carte, présentez votre carte chez LBC."
            />
            <ContactForm email={s.email} telephone={s.telephone} study={{ niveau: s.niveau, ufr: s.ufr }} />
            <PasswordForm />
          </div>
          <aside className="stack sticky" style={{ gap: 16 }}>
            <AccountSummary balance={s.balance} depositCount={s.depositCount} memberSince={s.memberSince} />
            <SignOutPanel />
          </aside>
        </div>
      </div>
    </StudentLayout>
  );
}
