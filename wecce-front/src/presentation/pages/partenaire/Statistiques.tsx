import type { PlatformStatistics } from "@/domain/entities";
import { StatistiquesView } from "@/presentation/components/stats/StatistiquesView";

/** Statistiques complètes de l'espace partenaire LBC. */
export default function Statistiques(props: PlatformStatistics) {
  return <StatistiquesView space="partenaire" stats={props} />;
}
