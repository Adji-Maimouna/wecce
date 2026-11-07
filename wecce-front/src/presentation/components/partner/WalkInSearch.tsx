import { useState } from "react";
import { Icon } from "@/presentation/components/ui/Icon";
import { useGo } from "@/presentation/lib/navigation";
import { paths } from "@/presentation/lib/paths";

/** Recherche d'un dépôt par sa référence, pour un étudiant venu sans rendez-vous. */
export function WalkInSearch() {
  const [ref, setRef] = useState("");
  const go = useGo();
  return (
    <form
      className="search"
      role="search"
      style={{ maxWidth: 360, background: "var(--surface)" }}
      onSubmit={(e) => {
        e.preventDefault();
        const r = ref.trim().toUpperCase();
        if (r) go(`${paths.expertise}?depot=${encodeURIComponent(r)}`);
      }}
    >
      <Icon name="search" />
      <input type="search" placeholder="Référence du dépôt, par exemple WC-2026-0634" aria-label="Référence du dépôt" value={ref} onChange={(e) => setRef(e.target.value)} />
    </form>
  );
}
