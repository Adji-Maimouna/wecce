import type { Role } from "@/domain/entities";

/** Adresses des écrans (avec Laravel : les noms de routes, via Ziggy `route()` par exemple). */
export const paths = {
  entree: "/entree",
  connexion: "/connexion",
  inscription: "/connexion#inscription",
  accueil: "/",
  credits: "/credits",
  marche: "/etudiant/marche",
  item: (slug: string) => `/etudiant/objets/${slug}`,
  take: (slug: string) => `/etudiant/prendre/${slug}`,
  deposer: "/etudiant/deposer",
  resumeDraft: (ref: string) => `/etudiant/deposer?brouillon=${ref}`,
  depots: "/etudiant/depots",
  reschedule: (ref: string) => `/etudiant/depots/${ref}/rendez-vous`,
  /** Copie du renoncement signé, côté étudiant. */
  waiverCopy: (ref: string) => `/etudiant/depots/${ref}/renoncement`,
  solde: "/etudiant/solde",
  faq: "/etudiant/questions",
  profilEtudiant: "/etudiant/profil",
  rendezVous: "/partenaire/rendez-vous",
  expertise: "/partenaire/expertise",
  expertiseOf: (ref: string) => `/partenaire/expertise?depot=${encodeURIComponent(ref)}`,
  stock: "/partenaire/stock",
  stockTab: (tab: "achats" | "depots" | "catalogue") => `/partenaire/stock?onglet=${tab}`,
  tableauPartenaire: "/partenaire/tableau-de-bord",
  articleNew: "/partenaire/stock/nouveau",
  article: (id: string) => `/partenaire/stock/${id}`,
  depotPartenaire: (ref: string) => `/partenaire/depots/${ref}`,
  /** Renoncement à signer sur la tablette du comptoir. */
  waiverCounter: (ref: string) => `/partenaire/depots/${ref}/renoncement`,
  couverture: "/partenaire/couverture",
  statistiquesPartenaire: "/partenaire/statistiques",
  profilPartenaire: "/partenaire/profil",
  pilotage: "/admin/pilotage",
  ajustement: "/admin/ajustement",
  journal: "/admin/journal",
  statistiquesAdmin: "/admin/statistiques",
  profilAdmin: "/admin/profil",
} as const;

/** Espace ouvert après la connexion, selon le rôle du compte. */
export const HOME_BY_ROLE: Record<Role, string> = {
  ETUDIANT: paths.solde,
  AGENT: paths.tableauPartenaire,
  ADMIN: paths.pilotage,
};

/** Préfixe des adresses réservées à chaque rôle. */
export const SPACE_BY_ROLE: Record<Role, string> = {
  ETUDIANT: "/etudiant/",
  AGENT: "/partenaire/",
  ADMIN: "/admin/",
};

export const itemHref = paths.item;
