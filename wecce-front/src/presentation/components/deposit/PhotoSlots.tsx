import { Icon } from "@/presentation/components/ui/Icon";
import { cn } from "@/presentation/lib/cn";

const SLOTS = [
  { label: "Face, écran allumé", icon: "camera" },
  { label: "Dos ou dessous", icon: "camera" },
  { label: "Clavier ou détail", icon: "camera" },
  { label: "Autre photo", icon: "plus" },
] as const;

type PhotoSlotsProps = {
  photos: (string | null)[];
  onAdd: (index: number, dataUrl: string) => void;
  /** Nombre d'emplacements (4 par défaut). */
  count?: number;
  disabled?: boolean;
};

/** Emplacements de photo ; l'aperçu remplace l'emplacement une fois la photo choisie. */
export function PhotoSlots({ photos, onAdd, count = SLOTS.length, disabled = false }: PhotoSlotsProps) {
  return (
    <div className="photos-drop">
      {SLOTS.slice(0, count).map((s, i) => {
        const src = photos[i];
        return (
          <label key={s.label} className={cn("photo-slot", src && "photo-slot--filled")}>
            {src && <img src={src} alt="Photo ajoutée" />}
            <Icon name={s.icon} size="lg" />
            <span>{s.label}</span>
            <input
              type="file"
              accept="image/*"
              hidden
              disabled={disabled}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                const r = new FileReader();
                r.onload = () => onAdd(i, String(r.result));
                r.readAsDataURL(f);
              }}
            />
          </label>
        );
      })}
    </div>
  );
}
