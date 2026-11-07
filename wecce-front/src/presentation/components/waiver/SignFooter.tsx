import { useRef, useState } from "react";
import { Button } from "@/presentation/components/ui/Button";
import { Checkbox } from "@/presentation/components/ui/Choice";
import { ConfirmInline } from "@/presentation/components/ui/ConfirmInline";
import { fmt } from "@/presentation/lib/format";
import { burstFrom } from "@/presentation/lib/motion";
import { SignaturePad, type SignaturePadHandle } from "./SignaturePad";

type SignFooterProps = {
  credit: number;
  /** Reçoit la signature (image PNG en data URL) ; renvoie quand c'est enregistré. */
  onSign: (signature: string) => Promise<void>;
  /** L'étudiant refuse les prix et repart avec son appareil. */
  onDecline: () => Promise<void>;
};

/** Signature : dessiner, cocher, signer ; ou refuser et reprendre l'appareil. */
export function SignFooter({ credit, onSign, onDecline }: SignFooterProps) {
  const pad = useRef<SignaturePadHandle>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const [drawn, setDrawn] = useState(false);
  const [read, setRead] = useState(false);
  const [busy, setBusy] = useState(false);
  const [declining, setDeclining] = useState(false);

  return (
    <footer className="doc__foot">
      <div className="field">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <span className="label">Votre signature</span>
          <Button variant="ghost" size="sm" onClick={() => pad.current?.clear()}>
            Effacer
          </Button>
        </div>
        <SignaturePad ref={pad} onDrawnChange={setDrawn} />
      </div>
      <Checkbox id="lu" checked={read} onChange={setRead}>
        J'ai lu les deux prix et j'accepte de céder l'appareil contre <strong>{fmt(credit)} points</strong>.
      </Checkbox>
      <div className="row">
        <Button
          ref={btn}
          size="lg"
          disabled={!(drawn && read) || busy}
          onClick={async () => {
            setBusy(true);
            burstFrom(btn.current);
            await onSign(pad.current?.toDataURL() ?? "");
            setBusy(false);
          }}
        >
          Signer et recevoir {fmt(credit)} points
        </Button>
        <Button size="lg" variant="ghost" disabled={busy} onClick={() => setDeclining(true)}>
          Refuser et reprendre mon appareil
        </Button>
      </div>
      {declining && (
        <ConfirmInline
          question="Refuser les deux prix ?"
          consequence="Vous repartez avec votre appareil. Aucun point n'est crédité et le dépôt est clos."
          confirmLabel="Refuser et reprendre l'appareil"
          cancelLabel="Revenir à la signature"
          onCancel={() => setDeclining(false)}
          onConfirm={async () => {
            setBusy(true);
            await onDecline();
          }}
        />
      )}
    </footer>
  );
}
