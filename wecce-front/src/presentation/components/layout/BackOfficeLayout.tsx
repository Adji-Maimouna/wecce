import type { ReactNode } from "react";
import { displayName } from "@/domain/entities";
import { AppLink } from "@/presentation/components/ui/AppLink";
import { Icon } from "@/presentation/components/ui/Icon";
import type { IconName } from "@/presentation/components/ui/icons";
import { useSession } from "@/presentation/hooks/session";
import { useSignOut } from "@/presentation/hooks/useSignOut";
import { paths } from "@/presentation/lib/paths";
import { Brand } from "./Brand";

type Space = "partenaire" | "admin";

type NavItem = { key: string; href: string; label: string; icon: IconName; count?: number };

const SPACES: Record<Space, { home: string; label: string; ctxTitle: string; ctxSub: string; nav: NavItem[] }> = {
  partenaire: {
    home: paths.rendezVous,
    label: "Wecce, espace partenaire",
    ctxTitle: "LBC · Leye Business Company",
    ctxSub: "Campus UGB · Villages E et F",
    nav: [
      { key: "rendez-vous", href: paths.rendezVous, label: "Rendez-vous du jour", icon: "calendar" },
      { key: "expertise", href: paths.expertise, label: "Expertise", icon: "clipboard" },
      { key: "statistiques", href: paths.statistiquesPartenaire, label: "Statistiques", icon: "chart" },
      { key: "couverture", href: paths.couverture, label: "Dette et couverture", icon: "scale" },
      { key: "profil", href: paths.profilPartenaire, label: "Mon profil", icon: "user" },
    ],
  },
  admin: {
    home: paths.pilotage,
    label: "Wecce, administration",
    ctxTitle: "Administration",
    ctxSub: "Campus UGB, Saint-Louis",
    nav: [
      { key: "pilotage", href: paths.pilotage, label: "Pilotage", icon: "sliders" },
      { key: "ajustement", href: paths.ajustement, label: "Ajustement de points", icon: "points" },
      { key: "journal", href: paths.journal, label: "Journal", icon: "history" },
      { key: "statistiques", href: paths.statistiquesAdmin, label: "Statistiques", icon: "chart" },
      { key: "profil", href: paths.profilAdmin, label: "Mon profil", icon: "user" },
    ],
  },
};

type BackOfficeLayoutProps = { space: Space; current: string; children: ReactNode };

/** Coque des espaces LBC et administration : barre latérale et zone de travail. */
export function BackOfficeLayout({ space, current, children }: BackOfficeLayoutProps) {
  const s = SPACES[space];
  const session = useSession();
  const signOut = useSignOut();
  const who = space === "partenaire" ? session.agent : session.admin;
  const whoLabel = who ? `${displayName(who)}${session.agent && space === "partenaire" ? ` · ${session.agent.poste.toLowerCase()}` : ""}` : "";
  const counts: Record<string, number | undefined> = { "rendez-vous": session.appointmentsToReceive || undefined };

  return (
    <div className="app">
      <aside className="side">
        <Brand href={s.home} label={s.label} />
        <div className="side__ctx">
          <strong>{s.ctxTitle}</strong>
          {s.ctxSub}
        </div>
        <nav aria-label={space === "partenaire" ? "Espace partenaire" : "Administration"}>
          {s.nav.map((n) => (
            <AppLink key={n.key} href={n.href} aria-current={n.key === current ? "page" : undefined}>
              <Icon name={n.icon} />
              {n.label}
              {counts[n.key] !== undefined && (
                <span className="badge" aria-label={`${counts[n.key]} à recevoir`}>
                  {counts[n.key]}
                </span>
              )}
            </AppLink>
          ))}
        </nav>
        <div className="side__foot">
          <span>Connecté : {whoLabel}</span>
          <button type="button" className="side__out" onClick={signOut}>
            Se déconnecter
          </button>
        </div>
      </aside>
      <main className="main">
        <div className="main__in">{children}</div>
      </main>
    </div>
  );
}
