import type { ProcessedDeposit } from "@/domain/entities";
import { BackOfficeLayout } from "@/presentation/components/layout/BackOfficeLayout";
import { Crumbs } from "@/presentation/components/layout/Crumbs";
import { PageHead } from "@/presentation/components/layout/PageHead";
import { PageTitle } from "@/presentation/components/layout/PageTitle";
import { Badge } from "@/presentation/components/ui/Badge";
import { ButtonLink } from "@/presentation/components/ui/Button";
import { Icon } from "@/presentation/components/ui/Icon";
import { Notice } from "@/presentation/components/ui/Notice";
import { Panel, PanelBody, PanelFoot, PanelHead } from "@/presentation/components/ui/Panel";
import { pts } from "@/presentation/lib/format";
import { REFUSAL_LABELS } from "@/presentation/lib/labels";
import { paths } from "@/presentation/lib/paths";

/** Un dépôt déjà traité au comptoir : les deux prix et la signature, ou le motif du refus. */
export default function Depot({ deposit: d }: { deposit: ProcessedDeposit }) {
  const o = d.outcome;
  return (
    <BackOfficeLayout space="partenaire" current="rendez-vous">
      <PageTitle>{`Dépôt ${d.ref}`}</PageTitle>
      <Crumbs items={[{ label: "Rendez-vous du jour", href: paths.rendezVous }, { label: d.ref }]} />
      <PageHead
        title={d.device}
        lead={`${d.student.name} · carte ${d.student.card} · dépôt ${d.ref}`}
        aside={
          o.status === "repris" ? (
            <Badge tone="ok">
              <Icon name="check" size="sm" />
              Repris
            </Badge>
          ) : (
            <Badge tone="danger">Refusé</Badge>
          )
        }
      />

      <div className="cols">
        <Panel>
          <PanelHead title={o.status === "repris" ? "Les deux prix" : "Motif du refus"} aside={`Examiné le ${d.examinedAt}`} />
          <PanelBody className="stack" style={{ gap: 16 }}>
            <p className="small muted">{d.deviceInfo}</p>
            {o.status === "repris" ? (
              <dl className="dl">
                <dt>Prix souhaité par l'étudiant</dt>
                <dd className="muted">{d.wish === null ? "non indiqué" : pts(d.wish)}</dd>
                <dt>{o.pieces ? "Valeur de reprise en pièces" : "Valeur de reprise"}</dt>
                <dd>{pts(o.takeBack)}</dd>
                {o.bonus > 0 && (
                  <>
                    <dt>Bonus de lancement</dt>
                    <dd>+ {pts(o.bonus)}</dd>
                  </>
                )}
                <span className="sep" />
                <dt className="total">Crédité à l'étudiant</dt>
                <dd className="total pts">{pts(o.takeBack + o.bonus)}</dd>
                <dt>Prix d&apos;affichage (−5 % / mois)</dt>
                <dd>{pts(o.listPrice)}</dd>
              </dl>
            ) : (
              <>
                <Notice tone="danger" icon="x-circle" title={REFUSAL_LABELS[o.reason]}>
                  {o.comment}
                </Notice>
                <p className="xs muted">L'étudiant est reparti avec son appareil. Il lit ce motif dans « Mes dépôts ».</p>
              </>
            )}
          </PanelBody>
          <PanelFoot>
            {o.status === "repris" && o.articleId && (
              <ButtonLink href={paths.article(o.articleId)} variant="ghost">
                Voir l'article du stock
              </ButtonLink>
            )}
            <ButtonLink href={paths.rendezVous} variant="ghost">
              Retour aux rendez-vous
            </ButtonLink>
          </PanelFoot>
        </Panel>

        <aside className="stack sticky" style={{ gap: 16 }}>
          {o.status === "repris" ? (
            <Panel>
              <PanelBody className="stack" style={{ gap: 12 }}>
                <span className="label">Renoncement signé</span>
                <dl className="dl small">
                  <dt>Signé le</dt>
                  <dd>{o.signedAt}</dd>
                  <dt>Agent</dt>
                  <dd>{d.agent}</dd>
                </dl>
                <ButtonLink href={paths.waiverCounter(d.ref)} variant="ghost" size="sm">
                  Voir le document signé
                </ButtonLink>
              </PanelBody>
            </Panel>
          ) : (
            <Panel sunken>
              <PanelBody>
                <p className="small muted">Aucun point n'a été crédité. L'étudiant peut déposer à nouveau après réparation.</p>
              </PanelBody>
            </Panel>
          )}
        </aside>
      </div>
    </BackOfficeLayout>
  );
}
