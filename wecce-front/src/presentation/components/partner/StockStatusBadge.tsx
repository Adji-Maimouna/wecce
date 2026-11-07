import type { StockArticle, StockStatus } from "@/domain/entities";
import { Badge } from "@/presentation/components/ui/Badge";

/** Statut d'un article du stock. */
export function StockStatusBadge({ a, status }: { a: StockArticle; status: StockStatus }) {
  switch (status) {
    case "a-photographier":
      return <Badge tone="info">À photographier</Badge>;
    case "en-ligne":
      return <Badge tone="ok">En ligne</Badge>;
    case "reserve":
      return <Badge tone="warn">Réservé{a.acquisitionRef ? ` · ${a.acquisitionRef}` : a.statusNote ? ` · ${a.statusNote}` : ""}</Badge>;
    case "remis":
      return <Badge tone="line">Remis à l'étudiant</Badge>;
    case "retire":
      return <Badge tone="line">Retiré{a.statusNote ? ` · ${a.statusNote}` : ""}</Badge>;
  }
}
