import type { PlatformStatistics } from "@/domain/entities";
import { StatistiquesView } from "@/presentation/components/stats/StatistiquesView";

/** Statistiques complètes de l'espace administration. */
export default function Statistiques(props: PlatformStatistics) {
  return <StatistiquesView space="admin" stats={props} />;
}
