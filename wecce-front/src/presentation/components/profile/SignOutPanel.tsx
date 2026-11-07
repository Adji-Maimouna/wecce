import { useState } from "react";
import { Button } from "@/presentation/components/ui/Button";
import { Panel, PanelBody } from "@/presentation/components/ui/Panel";
import { useSignOut } from "@/presentation/hooks/useSignOut";

/** Se déconnecter de cet appareil. */
export function SignOutPanel({ device = "cet appareil" }: { device?: string }) {
  const [busy, setBusy] = useState(false);
  const signOut = useSignOut();
  return (
    <Panel sunken>
      <PanelBody className="stack" style={{ gap: 12 }}>
        <p className="small muted">Vous êtes connecté sur {device}.</p>
        <Button
          variant="ghost"
          block
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            await signOut();
          }}
        >
          Se déconnecter
        </Button>
      </PanelBody>
    </Panel>
  );
}
