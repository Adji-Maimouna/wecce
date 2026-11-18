import type { ReactNode } from "react";
import { displayName } from "@/domain/entities";
import { AppLink } from "@/presentation/components/ui/AppLink";
import { Icon } from "@/presentation/components/ui/Icon";
import type { IconName } from "@/presentation/components/ui/icons";
import { useSession } from "@/presentation/hooks/session";
import { useSignOut } from "@/presentation/hooks/useSignOut";
import { cn } from "@/presentation/lib/cn";
import { paths } from "@/presentation/lib/paths";
import { Brand } from "./Brand";

type Space = "partenaire" | "admin";

type NavItem = { key: string; href: string; label: string; icon: IconName; group?: string };

const SPACES: Record<Space, { home: string; label: string; ctxTitle: string; ctxSub: string; nav: NavItem[] }> = {
  partenaire: {
    home: paths.tableauPartenaire,
    label: "Wecce, espace partenaire",
    ctxTitle: "LBC · Leye Business Company",
    ctxSub: "Campus UGB · Villages E et F",
    nav: [
      { key: "tableau", href: paths.tableauPartenaire, label: "Tableau de bord", icon: "grid", group: "Comptoir" },
      { key: "rendez-vous", href: paths.rendezVous, label: "Rendez-vous", icon: "calendar" },
      { key: "expertise", href: paths.expertise, label: "Expertise", icon: "clipboard" },
      { key: "stock", href: paths.stock, label: "Stock", icon: "package" },
      { key: "statistiques", href: paths.statistiquesPartenaire, label: "Statistiques", icon: "chart", group: "Suivi" },
      { key: "couverture", href: paths.couverture, label: "Dette et couverture", icon: "scale" },
      { key: "profil", href: paths.profilPartenaire, label: "Mon profil", icon: "user", group: "Compte" },
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

/** Coque des espaces LBC et administration : barre latérale sombre, pastilles d'actions en attente, zone de travail. */
export function BackOfficeLayout({ space, current, children }: BackOfficeLayoutProps) {
  const s = SPACES[space];
  const session = useSession();
  const signOut = useSignOut();
  const who = space === "partenaire" ? session.agent : session.admin;
  const todo = session.partnerTodo;
  const counts: Record<string, { n: number; label: string } | undefined> = {
    "rendez-vous":
      (todo?.requests ?? 0) + (session.appointmentsToReceive ?? 0) > 0
        ? { n: (todo?.requests ?? 0) + (session.appointmentsToReceive ?? 0), label: "rendez-vous à recevoir ou à planifier" }
        : undefined,
    stock:
      (todo?.purchases ?? 0) + (todo?.handovers ?? 0) > 0
        ? { n: (todo?.purchases ?? 0) + (todo?.handovers ?? 0), label: "achats à valider ou objets à remettre" }
        : undefined,
  };
  const initials = who ? `${who.prenom.charAt(0)}${who.nom.charAt(0)}`.toUpperCase() : "";

  return (
    <div className={cn("app", `app--${space}`)}>
      <aside className="side">
        <Brand href={s.home} label={s.label} />
        <div className="side__ctx">
          <strong>{s.ctxTitle}</strong>
          {s.ctxSub}
        </div>
        <nav aria-label={space === "partenaire" ? "Espace partenaire" : "Administration"}>
          {s.nav.map((n) => (
            <div key={n.key} className="side__item">
              {n.group && <span className="side__group">{n.group}</span>}
              <AppLink href={n.href} aria-current={n.key === current ? "page" : undefined}>
                <Icon name={n.icon} />
                {n.label}
                {counts[n.key] && (
                  <span className="badge" aria-label={`${counts[n.key]!.n} ${counts[n.key]!.label}`}>
                    {counts[n.key]!.n}
                  </span>
                )}
              </AppLink>
            </div>
          ))}
        </nav>
        <div className="side__foot">
          {who && (
            <div className="side__who">
              <span className="side__avatar" aria-hidden="true">
                {initials}
              </span>
              <span>
                <strong>{displayName(who)}</strong>
                {session.agent && space === "partenaire" ? session.agent.poste : "Administration"}
              </span>
            </div>
          )}
          <button type="button" className="side__out" onClick={signOut}>
            <Icon name="log-in" size="sm" />
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
