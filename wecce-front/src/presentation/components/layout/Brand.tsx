import { AppLink } from "@/presentation/components/ui/AppLink";

/** Logo « wecce » et son point moutarde. */
export function Brand({ href = "/", label = "Wecce, accueil" }: { href?: string; label?: string }) {
  return (
    <AppLink className="brand" href={href} aria-label={label}>
      wecce<span className="brand__dot" />
    </AppLink>
  );
}
