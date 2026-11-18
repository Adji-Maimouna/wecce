import { Badge } from "@/presentation/components/ui/Badge";
import { Icon } from "@/presentation/components/ui/Icon";
import type { DepositStatus } from "@/domain/entities";

/** Statut d'un dépôt, avec sa couleur d'état. */
export function DepositStatusBadge({ status, missed }: { status: DepositStatus; missed?: boolean }) {
  switch (status) {
    case "rendez-vous":
      if (missed) {
        return (
          <Badge tone="warn">
            <Icon name="alert" size="sm" />
            Rendez-vous manqué
          </Badge>
        );
      }
      return (
        <Badge tone="info">
          <Icon name="calendar" size="sm" />
          Rendez-vous pris
        </Badge>
      );
    case "demande-rdv":
      return (
        <Badge tone="warn">
          <Icon name="clock" size="sm" />
          En attente du rendez-vous LBC
        </Badge>
      );
    case "brouillon":
      return <Badge>Brouillon</Badge>;
    case "a-signer":
      return (
        <Badge tone="warn">
          <Icon name="pen" size="sm" />À signer au comptoir
        </Badge>
      );
    case "repris":
      return (
        <Badge tone="ok">
          <Icon name="check" size="sm" />
          Repris
        </Badge>
      );
    case "refuse":
      return (
        <Badge tone="danger">
          <Icon name="x-circle" size="sm" />
          Refusé
        </Badge>
      );
    case "annule":
      return <Badge tone="line">Annulé</Badge>;
  }
}
