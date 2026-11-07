import { cn } from "@/presentation/lib/cn";
import { coverage } from "@/domain/rules/points";

type JaugeProps = {
  price: number;
  balance: number;
  large?: boolean;
  className?: string;
};

/**
 * La jauge points et francs : la part couverte par le solde en moutarde,
 * le reste (les francs à compléter) en hachures cobalt. Elle se remplit à l'arrivée.
 */
export function Jauge({ price, balance, large, className }: JaugeProps) {
  const { ratio, inBalance } = coverage(price, balance);
  const ptsWidth = Math.round(ratio * 100);
  return (
    <div className={cn("jauge", large && "jauge--lg", className)} aria-hidden="true">
      <span className="jauge__pts" style={{ width: `${ptsWidth}%` }} />
      {!inBalance && <span className="jauge__cfa" style={{ width: `${100 - ptsWidth}%` }} />}
    </div>
  );
}
