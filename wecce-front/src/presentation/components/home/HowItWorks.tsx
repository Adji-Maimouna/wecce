import { Badge } from "@/presentation/components/ui/Badge";
import { Icon } from "@/presentation/components/ui/Icon";
import { Reveal } from "@/presentation/components/ui/Reveal";
import { Jauge } from "@/presentation/components/points/Jauge";
import { PriceSplit } from "@/presentation/components/points/PriceSplit";
import { HomeSection } from "./HomeSection";

/** Les trois étapes, chacune avec un petit aperçu de l'écran concerné. */
export function HowItWorks() {
  return (
    <HomeSection id="comment" title="Comment ça marche">
      <ol className="steps3">
        <Reveal as="li">
          <span className="steps3__n">1</span>
          <h3>Décrivez votre appareil</h3>
          <p>En ligne, avec le prix que vous espérez. Seul LBC voit ce prix.</p>
          <div className="mini">
            <div className="mini__row">
              <span>Modèle</span>
              <strong>Redmi Note 8 · 64 Go</strong>
            </div>
            <div className="mini__row">
              <span>État</span>
              <strong>Bon état</strong>
            </div>
            <div className="mini__row">
              <span>
                <Icon name="private" size="sm" /> Prix souhaité
              </span>
              <strong>35 000 pts</strong>
            </div>
          </div>
        </Reveal>
        <Reveal as="li">
          <span className="steps3__n">2</span>
          <h3>LBC l'examine au rendez-vous</h3>
          <p>LBC vous annonce deux prix. Vous acceptez, ou vous gardez votre appareil.</p>
          <div className="mini">
            <div className="mini__row">
              <span>Vous recevez</span>
              <span className="mini__big">30 000 pts</span>
            </div>
            <div className="mini__row">
              <span>Il sera proposé à</span>
              <strong>40 000 pts</strong>
            </div>
            <Badge tone="ok" style={{ alignSelf: "flex-start" }}>
              <Icon name="verified" size="sm" />
              Vérifié par LBC
            </Badge>
          </div>
        </Reveal>
        <Reveal as="li">
          <span className="steps3__n">3</span>
          <h3>Prenez un objet sur le marché</h3>
          <p>Vous payez en points. S'il en manque, vous complétez en francs par Wave, Orange Money ou en espèces.</p>
          <div className="mini">
            <div className="row" style={{ flexWrap: "nowrap", gap: 12 }}>
              <img className="thumb" src="/img/airpods.jpg" alt="" width={44} height={44} />
              <div>
                <strong>AirPods</strong>
                <div className="pts">21 500 pts</div>
              </div>
            </div>
            <Jauge price={21500} balance={30000} />
            <PriceSplit price={21500} balance={30000} />
          </div>
        </Reveal>
      </ol>
    </HomeSection>
  );
}
