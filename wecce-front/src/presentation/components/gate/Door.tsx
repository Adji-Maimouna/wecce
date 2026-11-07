import { AppLink } from "@/presentation/components/ui/AppLink";
import { Icon } from "@/presentation/components/ui/Icon";
import type { IconName } from "@/presentation/components/ui/icons";
import { cn } from "@/presentation/lib/cn";

export type DoorProps = {
  href: string;
  icon: IconName;
  title: string;
  description: string;
  /** « primary » : porte principale en cobalt ; « quiet » : bordure pointillée. */
  tone?: "primary" | "quiet";
};

/** Une porte d'entrée : icône, titre, précision, flèche qui avance au survol. */
export function Door({ href, icon, title, description, tone }: DoorProps) {
  return (
    <AppLink className={cn("door", tone && `door--${tone}`)} href={href}>
      <span className="door__ico">
        <Icon name={icon} />
      </span>
      <span>
        <strong>{title}</strong>
        <small>{description}</small>
      </span>
      <Icon name="arrow-right" className="door__go" />
    </AppLink>
  );
}
