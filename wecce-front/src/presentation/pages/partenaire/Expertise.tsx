import { useState } from "react";
import { RuleViolation } from "@/application";
import type { Appointment, DeclaredDevice, DeviceCondition, ExchangeableItem, TakeBackMode } from "@/domain/entities";
import { DeclaredPanel } from "@/presentation/components/expertise/DeclaredPanel";
import { InspectionPanel, type Inspection } from "@/presentation/components/expertise/InspectionPanel";
import { PricesPanel } from "@/presentation/components/expertise/PricesPanel";
import { RefusalPanel } from "@/presentation/components/expertise/RefusalPanel";
import { TakeBackModePanel } from "@/presentation/components/expertise/TakeBackModePanel";
import { useToast } from "@/presentation/components/feedback/toastContext";
import { BackOfficeLayout } from "@/presentation/components/layout/BackOfficeLayout";
import { Crumbs } from "@/presentation/components/layout/Crumbs";
import { PageHead } from "@/presentation/components/layout/PageHead";
import { PageTitle } from "@/presentation/components/layout/PageTitle";
import { AppointmentsTable } from "@/presentation/components/partner/AppointmentsTable";
import { WalkInSearch } from "@/presentation/components/partner/WalkInSearch";
import { Icon } from "@/presentation/components/ui/Icon";
import { Notice } from "@/presentation/components/ui/Notice";
import { Panel, PanelBody } from "@/presentation/components/ui/Panel";
import { useUseCases } from "@/presentation/hooks/useUseCases";
import { fmt, parseAmount } from "@/presentation/lib/format";
import { useGo } from "@/presentation/lib/navigation";
import { paths } from "@/presentation/lib/paths";

export type ExpertiseMode = "defaut" | "pieces" | "refus";

export type ExpertiseProps = {
  /** Le dépôt à examiner (?depot=REF), ou null : on choisit d'abord un rendez-vous. */
  declared: DeclaredDevice | null;
  /** Bonus de lancement encore ouvert (rang du prochain dépôt bonifié), ou null. */
  bonus: { rate: number; rank: number; quota: number; cap?: number } | null;
  /** Objets du stock propre de LBC, contreparties possibles d'un échange direct. */
  shopItems?: ExchangeableItem[];
  controls: string[];
  /** Rendez-vous du jour qui attendent l'expertise. */
  queue: Appointment[];
  /** Rendez-vous non respectés (dépassés) pouvant quand même être traités si l'étudiant se présente. */
  missedQueue?: Appointment[];
  /** Référence cherchée mais introuvable, ou déjà traitée. */
  missingRef?: string;
};

/** Expertise au comptoir : l'agent constate l'état et fixe les deux prix, puis fait signer ou refuse. */
export default function Expertise(props: ExpertiseProps) {
  return (
    <BackOfficeLayout space="partenaire" current="expertise">
      <PageTitle>Expertise</PageTitle>
      {props.declared ? (
        <ExpertiseForm {...props} declared={props.declared} />
      ) : (
        <ChooseDeposit queue={props.queue} missedQueue={props.missedQueue} missingRef={props.missingRef} />
      )}
    </BackOfficeLayout>
  );
}

function ChooseDeposit({ queue, missedQueue = [], missingRef }: { queue: Appointment[]; missedQueue?: Appointment[]; missingRef?: string }) {
  return (
    <>
      <PageHead
        title="Expertise au comptoir"
        lead="Sélectionnez le rendez-vous à examiner ou cherchez un dépôt par sa référence."
        aside={queue.length > 0 ? <span className="small muted">{queue.length} dépôt(s) en attente</span> : undefined}
      />
      {missingRef && (
        <Notice tone="warn" title={`Aucun dépôt à examiner sous la référence ${missingRef}.`} style={{ marginBottom: 18 }}>
          Vérifiez la référence sur le téléphone de l&apos;étudiant : elle commence par WC-.
        </Notice>
      )}
      <div className="stack" style={{ gap: 18 }}>
        <Panel>
          <PanelBody className="row" style={{ gap: "10px 16px", justifyContent: "space-between", flexWrap: "wrap" }}>
            <div style={{ minWidth: 0 }}>
              <strong>Étudiant sans rendez-vous ?</strong>
              <p className="xs muted">Saisissez la référence affichée dans « Mes dépôts » (ex. WC-2026-0643).</p>
            </div>
            <WalkInSearch />
          </PanelBody>
        </Panel>

        {queue.length > 0 ? (
          <AppointmentsTable appointments={queue} today />
        ) : (
          <Panel style={{ padding: "32px 28px" }}>
            <div className="stack" style={{ maxWidth: "52ch", gap: 10 }}>
              <Icon name="calendar" size="lg" style={{ color: "var(--muted)" }} />
              <h2>Aucun rendez-vous prévu aujourd&apos;hui à examiner</h2>
            </div>
          </Panel>
        )}

        {missedQueue.length > 0 && (
          <section className="stack" style={{ gap: 10 }}>
            <h2 style={{ fontSize: "var(--t-md)", margin: 0 }}>Rendez-vous dépassés ({missedQueue.length})</h2>
            <AppointmentsTable appointments={missedQueue} today={false} showDate />
          </section>
        )}
      </div>
    </>
  );
}

function ExpertiseForm({ declared, bonus, controls, shopItems = [] }: ExpertiseProps & { declared: DeclaredDevice }) {
  const isPiece = declared.category === "piece";
  const [mode, setMode] = useState<ExpertiseMode>("defaut");
  const [inspection, setInspection] = useState<Inspection>({ condition: declared.etat, battery: "", serial: "" });
  const [takeBackMode, setTakeBackMode] = useState<TakeBackMode>("vente");
  const [counterpartId, setCounterpartId] = useState("");
  const [counterpartLabel, setCounterpartLabel] = useState("");
  const [takeBack, setTakeBack] = useState("");
  const [listPrice, setListPrice] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { submitExpertise, refuseDeposit } = useUseCases();
  const toast = useToast();
  const go = useGo();
  const pieces = mode === "pieces" || isPiece;

  const switchPieces = () => {
    const next = mode === "pieces" ? "defaut" : "pieces";
    setMode(next);
    setInspection((v) => ({ ...v, condition: next === "pieces" ? "fonctionnel" : (declared.etat as DeviceCondition) }));
  };

  return (
    <>
      <Crumbs items={[{ label: "Rendez-vous du jour", href: paths.rendezVous }, { label: declared.depositRef }]} />
      <PageHead
        title={`Expertise · ${declared.modele}`}
        lead={`${declared.student.name} · carte ${declared.student.card} · rendez-vous de ${declared.appointmentTime}`}
      />
      {error && (
        <Notice tone="danger" title={error} style={{ marginBottom: 18 }}>
          Revenez aux rendez-vous pour voir où en est ce dépôt.
        </Notice>
      )}

      <form className="expertise-grid" onSubmit={(e) => e.preventDefault()}>
        <DeclaredPanel d={declared} />

        <div className="stack" style={{ gap: 20 }}>
          <InspectionPanel pieces={pieces} value={inspection} onChange={setInspection} controls={controls} />

          {mode !== "refus" && (
            <TakeBackModePanel
              mode={takeBackMode}
              onMode={setTakeBackMode}
              shopItems={shopItems}
              counterpartId={counterpartId}
              onCounterpartId={(id) => {
                setCounterpartId(id);
                const item = shopItems.find((x) => x.id === id);
                if (item && !takeBack) setTakeBack(fmt(item.price));
              }}
              counterpartLabel={counterpartLabel}
              onCounterpartLabel={setCounterpartLabel}
            />
          )}

          {mode !== "refus" && (
            <PricesPanel
              pieces={pieces}
              mode={takeBackMode}
              counterpartReady={takeBackMode !== "echange-objet" || !!counterpartId || counterpartLabel.trim().length > 2}
              wholeDevice={!isPiece}
              wish={declared.wish}
              bonus={bonus}
              takeBack={takeBack}
              listPrice={listPrice}
              onTakeBack={setTakeBack}
              onListPrice={setListPrice}
              busy={busy}
              onTogglePieces={switchPieces}
              onRefuse={() => setMode("refus")}
              onAccept={async () => {
                setBusy(true);
                setError(null);
                try {
                  await submitExpertise({
                    depositRef: declared.depositRef,
                    pieces: mode === "pieces",
                    condition: inspection.condition,
                    battery: Number(inspection.battery) || 0,
                    serial: inspection.serial,
                    takeBack: parseAmount(takeBack),
                    listPrice: parseAmount(listPrice),
                    mode: takeBackMode,
                    counterpartArticleId: takeBackMode === "echange-objet" ? counterpartId || null : null,
                    counterpartLabel: takeBackMode === "echange-objet" ? counterpartLabel.trim() : "",
                  });
                  go(paths.waiverCounter(declared.depositRef));
                } catch (err) {
                  setBusy(false);
                  setError(err instanceof RuleViolation ? err.message : "L'expertise n'a pas pu être enregistrée.");
                }
              }}
            />
          )}

          {mode === "pieces" && (
            <Notice icon="piece" title="L'appareil passera dans la catégorie « Pièces ».">
              Saisissez la reprise et le prix de l'ensemble des pièces.
            </Notice>
          )}

          {mode === "refus" && (
            <RefusalPanel
              busy={busy}
              onBack={() => setMode("defaut")}
              onConfirm={async (reason, comment) => {
                setBusy(true);
                try {
                  await refuseDeposit(declared.depositRef, reason, comment);
                  toast("Refus enregistré. L'étudiant repart avec son appareil et lit le motif dans « Mes dépôts ».");
                  go(paths.rendezVous);
                } catch (err) {
                  setBusy(false);
                  setError(err instanceof RuleViolation ? err.message : "Le refus n'a pas pu être enregistré.");
                }
              }}
            />
          )}
        </div>
      </form>
    </>
  );
}
