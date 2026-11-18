import { Icon } from "@/presentation/components/ui/Icon";
import type { IconName } from "@/presentation/components/ui/icons";
import { Reveal } from "@/presentation/components/ui/Reveal";
import type { ReactNode } from "react";
import { HomeSection } from "./HomeSection";

const FACTS: { id?: string; icon: IconName; title: ReactNode; text: string }[] = [
  { icon: "calendar", title: "Examen sur rendez-vous", text: "Vous choisissez le créneau en ligne. L'examen prend quelques minutes." },
  { id: "retrait", icon: "store", title: "Retrait avec votre carte d'étudiant", text: "L'appareil est allumé et testé devant vous avant de partir." },
  {
    icon: "verified",
    title: (
      <>
        Garantie boutique de 3 mois
      </>
    ),
    text: "En cas de défaut, LBC répare ou reprend l'appareil.",
  },
];

/** LBC, la boutique du campus : le plan simplifié et les règles du comptoir. */
export function ShopSection() {
  return (
    <HomeSection
      id="lbc"
      title="LBC, la boutique du campus"
      lead="Leye Business Company examine les appareils et garde le stock, sur le campus de l'UGB, entre les villages E et F."
    >
      <div className="campus">
        <Reveal className="campus__map">
          <div role="img" aria-label="LBC se trouve entre le village E et le village F" className="campus__line">
            <span className="campus__village">Village E</span>
            <span className="campus__lbc">
              <span className="campus__pin">
                <span>LBC</span>
              </span>
              <span className="campus__name">Leye Business Company</span>
            </span>
            <span className="campus__village">Village F</span>
          </div>
        </Reveal>
        <Reveal as="ul" className="facts">
          {FACTS.map((f) => (
            <li key={f.icon} id={f.id}>
              <span className="facts__ico">
                <Icon name={f.icon} />
              </span>
              <div>
                <strong>{f.title}</strong>
                <p>{f.text}</p>
              </div>
            </li>
          ))}
        </Reveal>
      </div>
    </HomeSection>
  );
}
