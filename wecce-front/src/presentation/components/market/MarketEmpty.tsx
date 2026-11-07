import { Button, ButtonLink } from "@/presentation/components/ui/Button";
import { Icon } from "@/presentation/components/ui/Icon";
import { Panel } from "@/presentation/components/ui/Panel";

/** Aucun objet ne correspond : retirer les filtres, ou déposer soi-même. */
export function MarketEmpty({ onReset }: { onReset: () => void }) {
  return (
    <Panel as="div" style={{ padding: "40px 24px", textAlign: "center" }}>
      <div style={{ maxWidth: "46ch", margin: "0 auto" }} className="stack">
        <Icon name="search" size="lg" style={{ margin: "0 auto", color: "var(--muted)" }} />
        <h2>Aucun objet ne correspond à votre recherche</h2>
        <div className="row" style={{ justifyContent: "center" }}>
          <Button onClick={onReset}>Retirer les filtres</Button>
          <ButtonLink href="/etudiant/deposer" variant="ghost">
            Déposer un objet
          </ButtonLink>
        </div>
      </div>
    </Panel>
  );
}
