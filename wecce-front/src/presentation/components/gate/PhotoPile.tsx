import { stagger } from "@/presentation/lib/motion";

export type PilePhoto = { src: string; width: number; height: number; rotate: number };

/** Trois photos d'appareils qui tombent en place au chargement (ressort Material 3). */
export function PhotoPile({ photos }: { photos: PilePhoto[] }) {
  return (
    <div className="pile">
      {photos.map((p, i) => (
        <span key={p.src} className="pile__item" style={stagger(i, { ["--r" as string]: `${p.rotate}deg` })}>
          <img src={p.src} alt="" width={p.width} height={p.height} />
        </span>
      ))}
    </div>
  );
}
