import { PageHead } from "@/presentation/components/layout/PageHead";
import { PageTitle } from "@/presentation/components/layout/PageTitle";
import { StudentLayout } from "@/presentation/components/layout/StudentLayout";
import { AppLink } from "@/presentation/components/ui/AppLink";
import { ButtonLink } from "@/presentation/components/ui/Button";
import { Icon } from "@/presentation/components/ui/Icon";
import { Ordinals } from "@/presentation/components/ui/Ordinals";
import { Panel, PanelBody } from "@/presentation/components/ui/Panel";
import { Tbd } from "@/presentation/components/ui/Tbd";
import { helpSections, type FaqItem } from "@/presentation/content/faq";
import { paths } from "@/presentation/lib/paths";

/** Questions fréquentes de l'espace étudiant, rangées par sujet. Ancres : #deux-prix, #baisse, #deposer, #retrait. */
export default function Questions() {
  return (
    <StudentLayout section="aide">
      <PageTitle>Questions fréquentes</PageTitle>
      <div className="wrap" style={{ maxWidth: 1040 }}>
        <PageHead title="Questions fréquentes" lead="Les règles de Wecce, en quelques réponses." />

        <nav className="help-toc" aria-label="Sujets">
          {helpSections.map((s) => (
            <AppLink key={s.id} className="chip" href={`#${s.id}`}>
              {s.title}
            </AppLink>
          ))}
        </nav>

        <div className="stack" style={{ gap: 36 }}>
          {helpSections.map((s) => (
            <section key={s.id} id={s.id} className="help-section" aria-labelledby={`t-${s.id}`}>
              <h2 id={`t-${s.id}`}>{s.title}</h2>
              <div className="faq">
                {s.items.map((item) => (
                  <div key={item.q} className="faq__item">
                    <h3>{item.q}</h3>
                    <p>
                      <Answer item={item} />
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ))}

          <Panel sunken>
            <PanelBody className="row" style={{ justifyContent: "space-between", gap: 16 }}>
              <div className="row" style={{ gap: 14, flexWrap: "nowrap", alignItems: "flex-start" }}>
                <Icon name="store" />
                <div>
                  <strong>Une autre question ?</strong>
                  <p className="small muted" style={{ marginTop: 4 }}>
                    LBC vous répond au comptoir, entre les villages E et F, du lundi au samedi.
                  </p>
                </div>
              </div>
              <ButtonLink href={paths.depots} variant="ghost">
                Voir mes dépôts
              </ButtonLink>
            </PanelBody>
          </Panel>
        </div>
      </div>
    </StudentLayout>
  );
}

function Answer({ item }: { item: FaqItem }) {
  if (!item.tbd) return <Ordinals text={item.a} />;
  const [before, after] = item.a.split(item.tbd.text);
  return (
    <>
      <Ordinals text={before} />
      <Tbd note={item.tbd.note}>{item.tbd.text}</Tbd>
      <Ordinals text={after ?? ""} />
    </>
  );
}
