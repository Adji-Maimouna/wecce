import { DEPOSIT_STAGES } from "@/domain/entities";
import { DEPOSIT_STAGE_LABELS } from "@/presentation/lib/labels";

/** Frise d'avancement : étapes faites (cobalt), étape en cours (hachures), à venir (gris). */
export function DepositTrack({ stageIndex }: { stageIndex: number }) {
  const current = stageIndex >= DEPOSIT_STAGES.length ? "en vente" : stageIndex === 0 ? "brouillon" : stageIndex === 1 ? "rendez-vous pris" : DEPOSIT_STAGE_LABELS[DEPOSIT_STAGES[stageIndex]].toLowerCase();
  return (
    <div className="track" aria-label={`Avancement : ${current}`}>
      {DEPOSIT_STAGES.map((s, i) => (
        <span key={s} className={i < stageIndex ? "done" : i === stageIndex ? "now" : undefined}>
          {DEPOSIT_STAGE_LABELS[s]}
        </span>
      ))}
    </div>
  );
}
