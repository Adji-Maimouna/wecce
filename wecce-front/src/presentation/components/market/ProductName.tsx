import { Ordinals } from "@/presentation/components/ui/Ordinals";

/** Nom d'objet : « 1re génération » s'écrit avec l'exposant. */
export function ProductName({ name }: { name: string }) {
  return <Ordinals text={name} />;
}
