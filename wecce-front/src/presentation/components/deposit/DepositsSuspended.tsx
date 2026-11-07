import { ButtonLink } from "@/presentation/components/ui/Button";
import { Icon } from "@/presentation/components/ui/Icon";
import { Panel } from "@/presentation/components/ui/Panel";
import { paths } from "@/presentation/lib/paths";

/** Dépôts suspendus : on le dit, avec le motif, et on propose le marché. */
export function DepositsSuspended({ reason }: { reason?: string }) {
  return (
    <Panel style={{ padding: "36px 28px" }}>
      <div className="stack" style={{ maxWidth: "56ch", gap: 14 }}>
        <Icon name="pause" size="lg" style={{ color: "var(--warn)" }} />
        <h1 style={{ fontSize: "var(--t-2xl)" }}>Les dépôts sont suspendus</h1>
        {reason && <p>{reason}</p>}
        <p className="muted">Vos rendez-vous déjà pris sont maintenus.</p>
        <p className="muted">Vous pouvez toujours prendre des objets avec vos points.</p>
        <div className="row">
          <ButtonLink href={paths.marche}>Voir le marché</ButtonLink>
          <ButtonLink href={paths.depots} variant="ghost">
            Mes dépôts
          </ButtonLink>
        </div>
      </div>
    </Panel>
  );
}
