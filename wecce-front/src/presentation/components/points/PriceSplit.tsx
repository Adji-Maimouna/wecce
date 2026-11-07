import { francs, pts } from "@/presentation/lib/format";
import { coverage } from "@/domain/rules/points";

type PriceSplitProps = {
  price: number;
  balance: number;
  /** « Dans votre solde » (connecté) ou « Dans ce solde » (accueil, solde d'exemple). */
  okLabel?: string;
};

/** Sous la jauge : « Dans votre solde » ou « 32 490 pts + 9 510 F ». */
export function PriceSplit({ price, balance, okLabel = "Dans votre solde" }: PriceSplitProps) {
  const { complement, inBalance } = coverage(price, balance);
  return (
    <div className="split">
      {inBalance ? <span className="ok">{okLabel}</span> : <span>{`${pts(balance)} + ${francs(complement)}`}</span>}
    </div>
  );
}
