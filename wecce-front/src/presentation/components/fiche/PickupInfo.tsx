import { Icon } from "@/presentation/components/ui/Icon";
import { Panel, PanelBody } from "@/presentation/components/ui/Panel";
import { Tbd } from "@/presentation/components/ui/Tbd";

/** Retrait chez LBC et garantie boutique de 3 mois. */
export function PickupInfo() {
  return (
    <Panel sunken>
      <PanelBody className="stack" style={{ gap: 12 }}>
        <div className="row row--top" style={{ gap: 10 }}>
          <Icon name="store" />
          <p className="small">
            <strong>Retrait chez LBC</strong>, sur le campus entre les villages E et F, avec votre carte d'étudiant, dans les{" "}
            <Tbd note="Durée de réservation à trancher avec le partenaire">3 jours</Tbd> qui suivent.
          </p>
        </div>
        <div className="row row--top" style={{ gap: 10 }}>
          <Icon name="verified" />
          <p className="small">
            <strong>
              Garantie boutique de 3 mois.
            </strong>{" "}
            En cas de défaut, LBC répare ou reprend l'appareil.
          </p>
        </div>
      </PanelBody>
    </Panel>
  );
}
