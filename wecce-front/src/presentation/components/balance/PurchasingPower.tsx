import { FonteSimulator } from "@/presentation/components/points/FonteSimulator";
import { Panel, PanelBody, PanelHead } from "@/presentation/components/ui/Panel";

type PurchasingPowerProps = { balance: number; itemName: string; itemPrice: number };

/** « Votre pouvoir d'achat ne baisse pas » : le curseur des mois à venir. */
export function PurchasingPower({ balance, itemName, itemPrice }: PurchasingPowerProps) {
  const share = Math.round((itemPrice / balance) * 100);
  return (
    <Panel>
      <PanelHead title="Votre pouvoir d'achat ne baisse pas" />
      <PanelBody className="stack" style={{ gap: 20 }}>
        <p className="muted" style={{ maxWidth: "60ch" }}>
          Le 1<sup>er</sup> de chaque mois, vos points et les prix du marché baissent de 5&nbsp;%.
        </p>
        <FonteSimulator
          balance={balance}
          itemName={itemName}
          itemPrice={itemPrice}
          labels={{ balance: "Votre solde", item: `${itemName} sur le marché`, rest: "Il vous reste après l'avoir pris" }}
          conclusion={`Le ${itemName.split(" ")[0]} coûte ${share} % de vos points, aujourd'hui comme dans 6 mois.`}
        />
      </PanelBody>
    </Panel>
  );
}
