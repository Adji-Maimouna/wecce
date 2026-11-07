import { lazy, type ReactNode } from "react";
import { Navigate, type Params } from "react-router";
import type { Role } from "@/domain/entities";
import credits from "@/infrastructure/demo/credits.json";
import type { Viewer } from "@/infrastructure/demo/queries";
import NotFound from "@/presentation/pages/NotFound";
import { paths } from "@/presentation/lib/paths";
import { server } from "./container";

/*
 * Table des écrans (couche app) : l'adresse, qui peut l'ouvrir, et les props de la page.
 * `render` joue le rôle du contrôleur Laravel : il lit le serveur et passe à la page
 * exactement les props que lui enverra, demain, Inertia::render().
 */

const Entree = lazy(() => import("@/presentation/pages/Entree"));
const Connexion = lazy(() => import("@/presentation/pages/Connexion"));
const Accueil = lazy(() => import("@/presentation/pages/Accueil"));
const Credits = lazy(() => import("@/presentation/pages/Credits"));
const Marche = lazy(() => import("@/presentation/pages/etudiant/Marche"));
const Fiche = lazy(() => import("@/presentation/pages/etudiant/Fiche"));
const Prendre = lazy(() => import("@/presentation/pages/etudiant/Prendre"));
const Deposer = lazy(() => import("@/presentation/pages/etudiant/Deposer"));
const Depots = lazy(() => import("@/presentation/pages/etudiant/Depots"));
const ChangerRendezVous = lazy(() => import("@/presentation/pages/etudiant/ChangerRendezVous"));
const Renoncement = lazy(() => import("@/presentation/pages/etudiant/Renoncement"));
const Solde = lazy(() => import("@/presentation/pages/etudiant/Solde"));
const Questions = lazy(() => import("@/presentation/pages/etudiant/Questions"));
const ProfilEtudiant = lazy(() => import("@/presentation/pages/etudiant/Profil"));
const RendezVous = lazy(() => import("@/presentation/pages/partenaire/RendezVous"));
const Expertise = lazy(() => import("@/presentation/pages/partenaire/Expertise"));
const Depot = lazy(() => import("@/presentation/pages/partenaire/Depot"));
const Stock = lazy(() => import("@/presentation/pages/partenaire/Stock"));
const Article = lazy(() => import("@/presentation/pages/partenaire/Article"));
const Couverture = lazy(() => import("@/presentation/pages/partenaire/Couverture"));
const ProfilPartenaire = lazy(() => import("@/presentation/pages/partenaire/Profil"));
const Pilotage = lazy(() => import("@/presentation/pages/admin/Pilotage"));
const Ajustement = lazy(() => import("@/presentation/pages/admin/Ajustement"));
const Journal = lazy(() => import("@/presentation/pages/admin/Journal"));
const ProfilAdmin = lazy(() => import("@/presentation/pages/admin/Profil"));

/** public : tout le monde ; guest : visiteur (un compte connecté est renvoyé vers son espace) ; un rôle : ce rôle seulement. */
export type Access = "public" | "guest" | Role;

export type Ctx = { params: Readonly<Params<string>>; query: URLSearchParams; user: Viewer | null };

export type Screen = { path: string; access: Access; render: (ctx: Ctx) => ReactNode };

/** L'identifiant du compte connecté (les écrans réservés ne sont rendus que pour un compte du bon rôle). */
const uid = (ctx: Ctx) => ctx.user!.id;
const param = (ctx: Ctx, name: string) => ctx.params[name] ?? "";

export const screens: Screen[] = [
  // Entrée et pages publiques
  { path: "/", access: "public", render: () => <Entree /> },
  { path: "/connexion", access: "guest", render: () => <Connexion /> },
  { path: "/accueil", access: "public", render: () => <Accueil {...server.homePage()} /> },
  { path: "/credits", access: "public", render: () => <Credits credits={Object.values(credits)} /> },

  // Étudiant
  {
    path: "/etudiant/marche",
    access: "ETUDIANT",
    render: (ctx) => <Marche items={server.marketItems(uid(ctx))} depositsSuspended={server.depositsSuspension().suspended} nextFonte={server.nextFonte()} />,
  },
  {
    path: "/etudiant/objets/:slug",
    access: "ETUDIANT",
    render: (ctx) => {
      const page = server.itemPage(param(ctx, "slug"), uid(ctx));
      if (!page) return <NotFound />;
      return (
        <Fiche
          {...page.details}
          balance={server.studentEntity(uid(ctx)).balance}
          reservedByOther={page.reservedByOther}
          reservedByMe={page.reservedByMe}
          nextFonte={server.nextFonte()}
        />
      );
    },
  },
  {
    path: "/etudiant/prendre/:slug",
    access: "ETUDIANT",
    render: (ctx) => {
      const slug = param(ctx, "slug");
      const acquisition = server.acquisitionOf(uid(ctx), slug);
      const page = server.itemPage(slug, uid(ctx), !!acquisition);
      if (!page) return <NotFound />;
      return (
        <Prendre
          item={page.details.item}
          title={page.details.title}
          balance={server.studentEntity(uid(ctx)).balance}
          acquisition={acquisition}
          unavailable={page.reservedByOther}
        />
      );
    },
  },
  {
    path: "/etudiant/deposer",
    access: "ETUDIANT",
    render: (ctx) => {
      const suspension = server.depositsSuspension();
      const s = server.schedule();
      const draftRef = ctx.query.get("brouillon");
      const draft = draftRef ? server.draftOf(uid(ctx), draftRef) : null;
      return (
        <Deposer
          depositsSuspended={suspension.suspended}
          suspensionReason={suspension.reason}
          bonus={server.bonusOffer()}
          days={s.days}
          times={s.times}
          start={{ ...draft, ...server.firstFree(s) }}
        />
      );
    },
  },
  { path: "/etudiant/depots", access: "ETUDIANT", render: (ctx) => <Depots {...server.studentDeposits(uid(ctx))} /> },
  {
    path: "/etudiant/depots/:ref/rendez-vous",
    access: "ETUDIANT",
    render: (ctx) => {
      const page = server.reschedulePage(uid(ctx), param(ctx, "ref"));
      return page ? <ChangerRendezVous {...page} /> : <Navigate to={paths.depots} replace />;
    },
  },
  {
    path: "/etudiant/depots/:ref/renoncement",
    access: "ETUDIANT",
    render: (ctx) => {
      const ref = param(ctx, "ref");
      const state = server.depositState(ref);
      const waiver = server.waiverOf(ref);
      if (!state || state.userId !== uid(ctx) || state.status !== "repris" || !waiver) return <NotFound />;
      return <Renoncement waiver={waiver} context="etudiant" />;
    },
  },
  {
    path: "/etudiant/solde",
    access: "ETUDIANT",
    render: (ctx) => <Solde {...server.balancePage(uid(ctx))} nextFonte={server.nextFonte()} />,
  },
  { path: "/etudiant/questions", access: "ETUDIANT", render: () => <Questions /> },
  { path: "/etudiant/profil", access: "ETUDIANT", render: () => <ProfilEtudiant /> },

  // Boutique LBC
  {
    path: "/partenaire/rendez-vous",
    access: "AGENT",
    render: () => <RendezVous days={server.counterDays()} depositsSuspended={server.depositsSuspension().suspended} />,
  },
  {
    path: "/partenaire/expertise",
    access: "AGENT",
    render: (ctx) => {
      const ref = ctx.query.get("depot")?.trim().toUpperCase() ?? "";
      const state = ref ? server.depositState(ref) : null;
      if (state?.status === "a-signer") return <Navigate to={paths.waiverCounter(ref)} replace />;
      if (state?.status === "repris" || state?.status === "refuse") return <Navigate to={paths.depotPartenaire(ref)} replace />;
      const declared = state?.status === "rendez-vous" ? server.declaredDevice(ref) : null;
      return (
        <Expertise
          declared={declared}
          bonus={server.expertiseBonus()}
          controls={declared ? server.expertiseControls(declared.category) : []}
          queue={server.expertiseQueue()}
          missingRef={ref && !declared ? ref : undefined}
        />
      );
    },
  },
  {
    path: "/partenaire/depots/:ref",
    access: "AGENT",
    render: (ctx) => {
      const ref = param(ctx, "ref");
      const deposit = server.processedDeposit(ref);
      if (deposit) return <Depot deposit={deposit} />;
      if (server.depositState(ref)?.status === "a-signer") return <Navigate to={paths.waiverCounter(ref)} replace />;
      return <NotFound />;
    },
  },
  {
    path: "/partenaire/depots/:ref/renoncement",
    access: "AGENT",
    render: (ctx) => {
      const waiver = server.waiverOf(param(ctx, "ref"));
      return waiver ? <Renoncement waiver={waiver} context="comptoir" /> : <NotFound />;
    },
  },
  { path: "/partenaire/stock", access: "AGENT", render: () => <Stock {...server.stockPage()} /> },
  { path: "/partenaire/stock/nouveau", access: "AGENT", render: () => <Article /> },
  {
    path: "/partenaire/stock/:id",
    access: "AGENT",
    render: (ctx) => {
      const article = server.stockArticle(param(ctx, "id"));
      return article ? <Article article={article} /> : <NotFound />;
    },
  },
  { path: "/partenaire/couverture", access: "AGENT", render: () => <Couverture {...server.coveragePage()} /> },
  { path: "/partenaire/profil", access: "AGENT", render: () => <ProfilPartenaire /> },

  // Administration
  {
    path: "/admin/pilotage",
    access: "ADMIN",
    render: () => (
      <Pilotage deposits={server.depositsState()} bonus={server.launchBonus()} tasks={server.scheduledTasks()} mismatch={server.balanceMismatches()[0] ?? null} />
    ),
  },
  { path: "/admin/ajustement", access: "ADMIN", render: () => <Ajustement accounts={server.accountSummaries()} /> },
  { path: "/admin/journal", access: "ADMIN", render: () => <Journal entries={server.adminLog()} /> },
  { path: "/admin/profil", access: "ADMIN", render: () => <ProfilAdmin /> },
];
