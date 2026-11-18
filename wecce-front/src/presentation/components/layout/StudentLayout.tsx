import { useState, type ReactNode } from "react";
import { useSearchParams } from "@/presentation/hooks/useSearchParams";
import { useSession } from "@/presentation/hooks/session";
import { cn } from "@/presentation/lib/cn";
import { useCurrentPath } from "@/presentation/lib/navigation";
import { paths } from "@/presentation/lib/paths";
import { ButtonLink } from "../ui/Button";
import { Notice } from "../ui/Notice";
import { SearchContext } from "./searchContext";
import { SiteFooter } from "./SiteFooter";
import { StudentTopBar } from "./StudentTopBar";
import { STUDENT_NAV, type StudentSection } from "./studentNav";
import { TabBar } from "./TabBar";

type StudentLayoutProps = {
  section: StudentSection;
  /** Pas de marge haute : la page commence par un bandeau moutarde. */
  flush?: boolean;
  children: ReactNode;
};

/** Coque de l'espace étudiant : barre haute, contenu, pied de page, onglets du téléphone. */
export function StudentLayout({ section, flush, children }: StudentLayoutProps) {
  const { student, missedDeposits } = useSession();
  const [params] = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const pathname = useCurrentPath();
  const showMissedBanner =
    !!student &&
    section !== "depots" &&
    Array.isArray(missedDeposits) &&
    missedDeposits.length > 0 &&
    !pathname.endsWith("/rendez-vous");

  return (
    <SearchContext value={{ query, setQuery }}>
      <StudentTopBar student={student} section={section} />
      <main className={cn("page", flush && "page--flush")}>
        {showMissedBanner && (
          <div className="wrap" style={{ maxWidth: 1100, marginBottom: 22, paddingTop: flush ? 20 : 0 }}>
            <Notice
              tone="warn"
              icon="calendar"
              title={
                missedDeposits.length === 1
                  ? "Vous avez manqué un rendez-vous chez LBC"
                  : `${missedDeposits.length} rendez-vous manqués chez LBC`
              }
            >
              <div className="stack" style={{ gap: 8 }}>
                {missedDeposits.map((m) => (
                  <div key={m.ref} className="row" style={{ gap: 12, justifyContent: "space-between", flexWrap: "wrap" }}>
                    <span className="small">
                      <strong>{m.deviceName}</strong> ({m.ref}) · créneau prévu le {m.scheduledAt}. Indiquez vos disponibilités : LBC vous proposera un nouveau créneau.
                    </span>
                    <ButtonLink href={paths.reschedule(m.ref)} size="sm">
                      Demander un nouveau rendez-vous
                    </ButtonLink>
                  </div>
                ))}
              </div>
            </Notice>
          </div>
        )}
        {children}
      </main>
      <SiteFooter space="etudiant" />
      <TabBar items={STUDENT_NAV.map((n) => ({ href: n.href, label: n.tab, icon: n.icon, current: n.section === section }))} />
    </SearchContext>
  );
}
