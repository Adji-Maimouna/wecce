import type { RecentTakeBack } from "@/domain/entities";
import { AppLink } from "@/presentation/components/ui/AppLink";
import { CountUp } from "@/presentation/components/ui/CountUp";
import { pts } from "@/presentation/lib/format";
import { stagger } from "@/presentation/lib/motion";
import { paths } from "@/presentation/lib/paths";

type DrawerProps = { items: RecentTakeBack[]; count: number };

/** Légère inclinaison de chaque appareil dans le tiroir, comme posés en désordre. */
const TILT = [-5, 3, -2, 4, -3];

/**
 * Le tiroir ouvert : de vraies photos d'appareils repris, chacune avec son étiquette
 * (montant et date). Les appareils tombent dedans au chargement ; l'étiquette bascule au survol.
 */
export function Drawer({ items, count }: DrawerProps) {
  return (
    <div className="drawer">
      <div className="drawer__box">
        {items.map((it, i) => (
          <AppLink
            key={it.photo.src}
            className="drawer__item"
            href={paths.marche}
            style={stagger(i, { ["--r" as string]: `${TILT[i % TILT.length]}deg` })}
          >
            <img src={it.photo.src} alt={it.photo.alt} width={it.photo.width} height={it.photo.height} />
            <span className="tag">
              <strong>{pts(it.points)}</strong>
              {it.label}
            </span>
          </AppLink>
        ))}
      </div>
      <div className="drawer__front">
        <span className="drawer__handle" aria-hidden="true" />
        <span className="drawer__count">
          <strong>
            <CountUp value={count} />
          </strong>
          objets repris depuis le 1<sup>er</sup> septembre
        </span>
      </div>
    </div>
  );
}
