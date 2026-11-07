import { CountUp } from "@/presentation/components/ui/CountUp";
import { Reveal } from "@/presentation/components/ui/Reveal";
import { HomeSection } from "./HomeSection";

/** Les deux prix annoncés avant de signer, sur fond sombre. */
export function TwoPrices() {
  return (
    <HomeSection
      id="deux-prix"
      tone="dark"
      title="Deux prix, annoncés avant de signer"
      lead="Les points que vous recevez, et le prix auquel votre appareil sera revendu."
    >
      <Reveal className="prices">
        <div className="prices__num">
          <CountUp value={30000} />
          <small>points pour vous, à la signature</small>
        </div>
        <div className="prices__photo">
          <img src="/img/redmi.jpg" alt="Le Redmi Note 8 de Moussa" width={480} height={640} />
        </div>
        <div className="prices__num prices__num--alt">
          <CountUp value={40000} />
          <small>prix proposé à l'étudiant suivant</small>
        </div>
      </Reveal>
      <Reveal as="p" className="prices__quote">
        « Nous reprenons votre appareil à 30 000 points. Il sera proposé à 40 000 points. La différence couvre l'expertise, le stockage
        et la garantie. »
      </Reveal>
    </HomeSection>
  );
}
