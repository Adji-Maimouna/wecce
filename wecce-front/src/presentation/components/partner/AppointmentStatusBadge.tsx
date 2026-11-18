import type { Appointment } from "@/domain/entities";
import { Badge } from "@/presentation/components/ui/Badge";
import { Icon } from "@/presentation/components/ui/Icon";
import { fmt } from "@/presentation/lib/format";
import { APPOINTMENT_STATUS_LABELS } from "@/presentation/lib/labels";

/** Statut d'un rendez-vous au comptoir. */
export function AppointmentStatusBadge({ a }: { a: Appointment }) {
  if (a.missed) {
    return (
      <Badge tone="warn">
        <Icon name="alert" size="sm" />
        Non respecté
      </Badge>
    );
  }
  switch (a.status) {
    case "repris":
      return (
        <Badge tone="ok">
          <Icon name="check" size="sm" />
          Repris à {fmt(a.takeBack ?? 0)}
        </Badge>
      );
    case "refuse":
      return <Badge tone="danger">Refusé · {a.refusalShort}</Badge>;
    case "arrive":
      return (
        <Badge tone="info" dot>
          Arrivé
        </Badge>
      );
    case "a-signer":
      return (
        <Badge tone="warn" dot>
          Prix annoncés, à signer
        </Badge>
      );
    case "annule":
      return <Badge tone="line">{APPOINTMENT_STATUS_LABELS.annule}</Badge>;
    default:
      return <Badge>{APPOINTMENT_STATUS_LABELS[a.status]}</Badge>;
  }
}
