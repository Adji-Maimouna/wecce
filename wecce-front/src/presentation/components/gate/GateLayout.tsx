import type { ReactNode } from "react";
import { cn } from "@/presentation/lib/cn";
import { PhotoPile, type PilePhoto } from "./PhotoPile";

type GateLayoutProps = {
  /** « auth » : sur téléphone, le panneau photo disparaît pour laisser place au formulaire. */
  variant?: "auth";
  photos: PilePhoto[];
  children: ReactNode;
};

/** Page d'entrée en deux moitiés : le contenu à gauche, un panneau moutarde de photos à droite. */
export function GateLayout({ variant, photos, children }: GateLayoutProps) {
  return (
    <main className={cn("gate", variant && `gate--${variant}`)}>
      <div className="gate__main">
        <div className={cn("gate__inner", variant === "auth" && "auth")}>{children}</div>
      </div>
      <div className="gate__art" aria-hidden="true">
        <PhotoPile photos={photos} />
      </div>
    </main>
  );
}
