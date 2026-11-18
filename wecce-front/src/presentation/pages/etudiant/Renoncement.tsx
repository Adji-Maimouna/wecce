import { useState, type ReactNode } from "react";
import { RuleViolation } from "@/application";
import { useToast } from "@/presentation/components/feedback/toastContext";
import { CounterLayout } from "@/presentation/components/layout/CounterLayout";
import { Crumbs } from "@/presentation/components/layout/Crumbs";
import { PageTitle } from "@/presentation/components/layout/PageTitle";
import { StudentLayout } from "@/presentation/components/layout/StudentLayout";
import { Badge } from "@/presentation/components/ui/Badge";
import { ButtonLink } from "@/presentation/components/ui/Button";
import { CountUp } from "@/presentation/components/ui/CountUp";
import { Icon } from "@/presentation/components/ui/Icon";
import { Notice } from "@/presentation/components/ui/Notice";
import { SignFooter } from "@/presentation/components/waiver/SignFooter";
import { WaiverTerms } from "@/presentation/components/waiver/WaiverTerms";
import type { Waiver } from "@/domain/entities";
import { creditAtSignature } from "@/domain/rules/expertise";
import { useUseCases } from "@/presentation/hooks/useUseCases";
import { fmt } from "@/presentation/lib/format";
import { CONDITION_LABELS } from "@/presentation/lib/labels";
import { prefersReducedMotion } from "@/presentation/lib/motion";
import { useGo } from "@/presentation/lib/navigation";
import { paths } from "@/presentation/lib/paths";

export type RenoncementProps = {
  waiver: Waiver;
  /**
   * « comptoir » : la tablette de LBC, où l'étudiant signe (session de l'agent).
   * « etudiant » : la copie signée, consultée depuis « Mes dépôts ».
   */
  context: "comptoir" | "etudiant";
};

/** Renoncement de propriété, signé sur la tablette du comptoir. Les deux prix sont annoncés avant de signer. */
export default function Renoncement({ waiver: w, context }: RenoncementProps) {
  const signed = w.signedAt !== "";
  const [justSigned, setJustSigned] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signWaiver, declineWaiver } = useUseCases();
  const toast = useToast();
  const go = useGo();
  const credit = w.mode === "echange-objet" ? 0 : w.bonus !== undefined ? w.takeBack + w.bonus : creditAtSignature(w.takeBack, w.bonusRate);
  const initials = w.depositor.name
    .split(" ")
    .map((p) => p.charAt(0))
    .join("")
    .toUpperCase();
  const signedTime = w.signedAt.split(", ").pop();

  const doc = (
    <div className="wrap" style={{ maxWidth: 820 }}>
      {context === "etudiant" && <Crumbs items={[{ label: "Mes dépôts", href: paths.depots }, { label: `Renoncement ${w.ref}` }]} />}
      {signed && context === "comptoir" && (
        <Notice
          tone="ok"
          title={w.mode === "echange-objet" ? `Signé. Échange conclu contre : ${w.counterpart ?? "un objet LBC"}.` : `Signé. ${fmt(credit)} points ont été crédités sur votre compte.`}
          style={{ marginBottom: 20 }}
        >
          <p className="small">
            Votre solde passe à {justSigned ? <CountUp className="pts" value={w.balanceBefore + credit} suffix=" pts" /> : <span className="pts">{fmt(w.balanceBefore + credit)} pts</span>}.
            Une copie de ce document reste dans « Mes dépôts ».
          </p>
        </Notice>
      )}
      {error && (
        <Notice tone="danger" title={error} style={{ marginBottom: 20 }}>
          Vérifiez la signature et la case, puis réessayez.
        </Notice>
      )}

      <article className="doc">
        <header className="doc__head">
          <div>
            <h1 style={{ fontSize: "var(--t-2xl)" }}>Renoncement de propriété</h1>
            <p className="small muted" style={{ marginTop: 6 }}>
              Dépôt {w.ref} · {w.place} · {w.openedAt}
            </p>
          </div>
          {signed ? (
            <Badge tone="ok">
              <Icon name="check" size="sm" />
              Signé à {signedTime}
            </Badge>
          ) : (
            <Badge tone="info">
              <Icon name="pen" size="sm" />À signer
            </Badge>
          )}
        </header>

        <div className="doc__body">
          <section className="cols cols--even" style={{ gap: "18px 28px" }}>
            <div className="stack" style={{ gap: 6 }}>
              <span className="xs muted">Déposant</span>
              <strong>{w.depositor.name}</strong>
              <span className="small muted">
                Carte d'étudiant {w.depositor.card} · {w.depositor.study}
              </span>
            </div>
            <div className="stack" style={{ gap: 6 }}>
              <span className="xs muted">Appareil examiné</span>
              <strong>{w.pieces ? `${w.device.name.split(" · ")[0]}, repris en pièces` : w.device.name}</strong>
              <span className="small muted">
                N° de série {w.device.serial} · état constaté : {CONDITION_LABELS[w.device.condition].toLowerCase()}
                {w.device.battery !== null && ` · batterie ${w.device.battery} %`}
              </span>
            </div>
          </section>
          <WaiverTerms w={w} />
        </div>

        {signed ? (
          <footer className="doc__foot">
            <div className="cols cols--even" style={{ gap: "12px 28px" }}>
              <dl className="dl small">
                <dt>Signé le</dt>
                <dd>{w.signedAt}</dd>
                <dt>Lieu</dt>
                <dd>LBC, campus de l'UGB</dd>
                <dt>Agent</dt>
                <dd>{w.agent}</dd>
              </dl>
              <div className="stack" style={{ gap: 6 }}>
                <span className="xs muted">Empreinte du document (preuve qu'il n'a pas été modifié)</span>
                <span className="hash">{w.hash}</span>
              </div>
            </div>
            <div className="row">
              {context === "comptoir" ? (
                <>
                  <ButtonLink href={paths.rendezVous}>Retour aux rendez-vous</ButtonLink>
                  <ButtonLink href={paths.depotPartenaire(w.ref)} variant="ghost">
                    Voir le dépôt
                  </ButtonLink>
                </>
              ) : (
                <>
                  <ButtonLink href={paths.depots}>Mes dépôts</ButtonLink>
                  <ButtonLink href={paths.solde} variant="ghost">
                    Voir mon solde
                  </ButtonLink>
                </>
              )}
            </div>
          </footer>
        ) : (
          <SignFooter
            credit={credit}
            counterpart={w.mode === "echange-objet" ? (w.counterpart ?? "un objet de la boutique LBC") : null}
            onSign={async (signature) => {
              setError(null);
              try {
                await signWaiver(w.ref, signature);
                setJustSigned(true);
                window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
                toast(w.mode === "echange-objet" ? "Signé. Remettez l'objet de la boutique à l'étudiant." : "Signé. Les points sont crédités.");
              } catch (e) {
                setError(e instanceof RuleViolation ? e.message : "La signature n'a pas été enregistrée.");
              }
            }}
            onDecline={async () => {
              await declineWaiver(w.ref);
              toast("L'étudiant repart avec son appareil. Aucun point n'a été crédité.");
              go(paths.rendezVous);
            }}
          />
        )}
      </article>
    </div>
  );

  return context === "comptoir" ? (
    <CounterLayout initials={initials}>
      <PageTitle>Renoncement de propriété</PageTitle>
      {doc}
    </CounterLayout>
  ) : (
    <StudentShell>{doc}</StudentShell>
  );
}

function StudentShell({ children }: { children: ReactNode }) {
  return (
    <StudentLayout section="depots">
      <PageTitle>Renoncement de propriété</PageTitle>
      {children}
    </StudentLayout>
  );
}
