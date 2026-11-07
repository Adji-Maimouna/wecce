import type { IconName } from "@/presentation/components/ui/icons";

/** Rubrique de l'espace étudiant (« aide » et « profil » n'ont pas d'onglet). */
export type StudentSection = "marche" | "deposer" | "depots" | "solde" | "profil" | "aide";

/** Navigation de l'espace étudiant (barre haute et barre d'onglets du téléphone). */
export const STUDENT_NAV: { section: StudentSection; href: string; label: string; tab: string; icon: IconName }[] = [
  { section: "marche", href: "/etudiant/marche", label: "Marché", tab: "Marché", icon: "grid" },
  { section: "deposer", href: "/etudiant/deposer", label: "Déposer", tab: "Déposer", icon: "upload" },
  { section: "depots", href: "/etudiant/depots", label: "Mes dépôts", tab: "Mes dépôts", icon: "list" },
  { section: "solde", href: "/etudiant/solde", label: "Mon solde", tab: "Solde", icon: "points" },
];
