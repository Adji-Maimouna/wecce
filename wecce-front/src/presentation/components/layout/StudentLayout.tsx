import { useState, type ReactNode } from "react";
import { useSearchParams } from "react-router";
import { useStudent } from "@/presentation/hooks/session";
import { cn } from "@/presentation/lib/cn";
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
  const student = useStudent();
  const [params] = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");

  return (
    <SearchContext value={{ query, setQuery }}>
      <StudentTopBar student={student} section={section} />
      <main className={cn("page", flush && "page--flush")}>{children}</main>
      <SiteFooter space="etudiant" />
      <TabBar items={STUDENT_NAV.map((n) => ({ href: n.href, label: n.tab, icon: n.icon, current: n.section === section }))} />
    </SearchContext>
  );
}
