import type { AccountSummary } from "@/domain/entities";
import { Icon } from "@/presentation/components/ui/Icon";
import { pts } from "@/presentation/lib/format";

type AccountPickerProps = {
  query: string;
  onQuery: (q: string) => void;
  account: AccountSummary | null;
};

/** Recherche d'un compte étudiant par carte ou par nom, et carte du compte trouvé. */
export function AccountPicker({ query, onQuery, account }: AccountPickerProps) {
  return (
    <>
      <label className="search" style={{ maxWidth: "none", background: "var(--surface)" }}>
        <Icon name="search" />
        <input type="search" value={query} aria-label="Numéro de carte ou nom de l'étudiant" placeholder="Numéro de carte ou nom de l'étudiant" onChange={(e) => onQuery(e.target.value)} />
      </label>
      {account ? (
        <div className="who" style={{ padding: 12, border: "1px solid var(--line)", borderRadius: "var(--r)", background: "var(--surface-2)" }}>
          <span className="avatar">{account.initials}</span>
          <div>
            <div className="who__name">
              {account.name} · {account.card}
            </div>
            <div className="who__sub">
              {account.study} · compte {account.active ? "actif" : "fermé"} · solde {pts(account.balance)}
            </div>
          </div>
        </div>
      ) : (
        <p className="small muted">{query.trim() ? "Aucun compte ne correspond à cette recherche." : "Saisissez un numéro de carte (par exemple 2024-1183) ou un nom."}</p>
      )}
    </>
  );
}
