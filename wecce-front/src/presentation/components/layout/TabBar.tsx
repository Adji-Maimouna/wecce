import { AppLink } from "@/presentation/components/ui/AppLink";
import { Icon } from "@/presentation/components/ui/Icon";
import type { IconName } from "@/presentation/components/ui/icons";

export type TabItem = { href: string; label: string; icon: IconName; current?: boolean };

/** Barre d'onglets en bas d'écran, sous 900 px. */
export function TabBar({ items }: { items: TabItem[] }) {
  return (
    <nav className="tabbar" aria-label="Navigation">
      {items.map((t) => (
        <AppLink key={t.href} href={t.href} aria-current={t.current ? "page" : undefined}>
          <Icon name={t.icon} />
          {t.label}
        </AppLink>
      ))}
    </nav>
  );
}
