import type { Category, Photo } from "@/domain/entities";
import { Icon } from "@/presentation/components/ui/Icon";
import type { IconName } from "@/presentation/components/ui/icons";
import { cn } from "@/presentation/lib/cn";

const CATEGORY_ICON: Record<Category, IconName> = { tel: "phone", ordi: "laptop", tab: "tablet", audio: "audio", piece: "piece" };

type ItemPhotoProps = {
  photo?: Photo;
  category: Category;
  className?: string;
  /** Vignette : pas de texte, seulement l'icône. */
  small?: boolean;
  lazy?: boolean;
};

/** Photo d'un objet, ou un emplacement neutre tant que LBC ne l'a pas photographié. */
export function ItemPhoto({ photo, category, className, small, lazy }: ItemPhotoProps) {
  if (photo) return <img className={className} src={photo.src} alt={photo.alt} width={photo.width} height={photo.height} loading={lazy ? "lazy" : undefined} />;
  return (
    <span className={cn("item-photo--none", className)} role="img" aria-label="Photo à venir">
      <Icon name={CATEGORY_ICON[category]} size={small ? undefined : "lg"} />
      {!small && <small>Photo à venir</small>}
    </span>
  );
}
