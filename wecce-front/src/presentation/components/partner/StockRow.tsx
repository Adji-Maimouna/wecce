import { useState } from "react";
import { RuleViolation } from "@/application";
import type { Category, StockArticle } from "@/domain/entities";
import { useToast } from "@/presentation/components/feedback/toastContext";
import { AppLink } from "@/presentation/components/ui/AppLink";
import { Button } from "@/presentation/components/ui/Button";
import { Icon } from "@/presentation/components/ui/Icon";
import type { IconName } from "@/presentation/components/ui/icons";
import { useUseCases } from "@/presentation/hooks/useUseCases";
import { cn } from "@/presentation/lib/cn";
import { fmt } from "@/presentation/lib/format";
import { paths } from "@/presentation/lib/paths";
import { StockStatusBadge } from "./StockStatusBadge";

const CATEGORY_ICON: Record<Category, IconName> = { tel: "phone", ordi: "laptop", tab: "tablet", audio: "audio", piece: "piece" };

/** Une ligne du stock : l'objet, son origine, ses deux prix, son statut et l'action du moment. */
export function StockRow({ a }: { a: StockArticle }) {
  const [updated, setUpdated] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { publishArticle, unpublishArticle } = useUseCases();
  const toast = useToast();
  const short = a.name.split(" · ")[0];

  async function run(action: () => Promise<void>, message: string) {
    setBusy(true);
    setError(null);
    try {
      await action();
      setUpdated(true);
      toast(message);
    } catch (e) {
      setError(e instanceof RuleViolation ? e.message : "L'action n'a pas abouti.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <tr className={cn(updated && "is-updated")}>
      <td>
        <div className="who">
          {a.photo ? (
            <img className="thumb" src={a.photo} alt="" />
          ) : (
            <span className="thumb" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--muted)" }}>
              <Icon name={CATEGORY_ICON[a.category]} />
            </span>
          )}
          <div>
            <AppLink className="who__name" href={paths.article(a.id)}>
              {a.name}
            </AppLink>
            <div className="who__sub">{a.info}</div>
          </div>
        </div>
      </td>
      <td>{a.origin === "depot" ? `Dépôt ${a.originRef}` : "Stock de la boutique"}</td>
      <td>{a.onlineSince}</td>
      <td className="r">{fmt(a.initialPrice)}</td>
      <td className={a.status === "retire" ? "r muted" : "r"}>{fmt(a.todayPrice)}</td>
      <td>
        <StockStatusBadge a={a} status={a.status} />
      </td>
      <td className="r">
        <div className="row" style={{ justifyContent: "flex-end", gap: 10 }}>
          {(a.status === "a-photographier" || a.status === "en-boutique") && (
            <>
              <Button size="sm" disabled={busy} onClick={() => run(() => publishArticle(a.id), `${short} mis en ligne à ${fmt(a.todayPrice)} pts.`)}>
                Mettre en ligne
              </Button>
              <AppLink className="link small" href={paths.article(a.id)}>
                Modifier
              </AppLink>
            </>
          )}
          {a.status === "reserve" && (
            <>
              <AppLink className="link small" href={paths.stockTab("achats")}>
                Voir l'achat
              </AppLink>
              <AppLink className="link small" href={paths.article(a.id)}>
                Voir
              </AppLink>
            </>
          )}
          {a.status === "en-ligne" && (
            <>
              <Button size="sm" variant="ghost" disabled={busy} onClick={() => run(() => unpublishArticle(a.id), `${short} retiré du marché, gardé en boutique.`)}>
                Mettre hors ligne
              </Button>
              <AppLink className="link small" href={paths.article(a.id)}>
                Modifier
              </AppLink>
            </>
          )}
          {(a.status === "retire" || a.status === "remis") && (
            <AppLink className="link small" href={paths.article(a.id)}>
              Voir
            </AppLink>
          )}
        </div>
        {error && (
          <p className="err" role="alert" style={{ justifyContent: "flex-end", marginTop: 6 }}>
            {error}
          </p>
        )}
      </td>
    </tr>
  );
}
