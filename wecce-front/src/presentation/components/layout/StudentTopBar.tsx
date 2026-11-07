import { useEffect, useRef } from "react";
import { AppLink } from "@/presentation/components/ui/AppLink";
import { Icon } from "@/presentation/components/ui/Icon";
import { fmt, pts } from "@/presentation/lib/format";
import { useGo } from "@/presentation/lib/navigation";
import { displayName, initials, type Student } from "@/domain/entities";
import { paths } from "@/presentation/lib/paths";
import { Brand } from "./Brand";
import { useSearch } from "./searchContext";
import { STUDENT_NAV, type StudentSection } from "./studentNav";

type StudentTopBarProps = { student: Student; section: StudentSection };

/** Barre haute de l'espace étudiant : navigation, recherche (touche « / »), solde et profil. */
export function StudentTopBar({ student, section }: StudentTopBarProps) {
  const { query, setQuery } = useSearch();
  const input = useRef<HTMLInputElement>(null);
  const go = useGo();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName ?? "").toLowerCase();
      if (e.key === "/" && !["input", "textarea", "select"].includes(tag)) {
        e.preventDefault();
        input.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="top">
      <div className="wrap top__in">
        <Brand href={paths.marche} label="Wecce, marché" />
        <nav className="nav" aria-label="Navigation principale">
          {STUDENT_NAV.map((n) => (
            <AppLink key={n.section} href={n.href} aria-current={n.section === section ? "page" : undefined}>
              {n.label}
            </AppLink>
          ))}
        </nav>
        <form
          className="search"
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            if (section !== "marche") go(`/etudiant/marche?q=${encodeURIComponent(query)}`);
          }}
        >
          <Icon name="search" />
          <input
            ref={input}
            type="search"
            placeholder="Chercher un modèle"
            aria-label="Chercher un modèle"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </form>
        <div className="top__end">
          <AppLink className="balance" href="/etudiant/solde" aria-label={`Votre solde : ${fmt(student.balance)} points`}>
            <Icon name="points" />
            {pts(student.balance)}
          </AppLink>
          <AppLink
            className="avatar"
            href={paths.profilEtudiant}
            title={`${displayName(student)} · mon profil`}
            aria-label="Mon profil"
            aria-current={section === "profil" ? "page" : undefined}
            style={section === "profil" ? { boxShadow: "0 0 0 2px var(--accent)" } : undefined}
          >
            {initials(student)}
          </AppLink>
        </div>
      </div>
    </header>
  );
}
