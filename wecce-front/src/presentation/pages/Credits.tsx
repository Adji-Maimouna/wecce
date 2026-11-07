import { PageHead } from "@/presentation/components/layout/PageHead";
import { PageTitle } from "@/presentation/components/layout/PageTitle";
import { Panel } from "@/presentation/components/ui/Panel";

export type PhotoCredit = { file: string; title: string; page: string; license: string; artist: string };

/** Crédits des photos d'appareils (Wikimedia Commons), en attendant celles prises au comptoir. */
export default function Credits({ credits }: { credits: PhotoCredit[] }) {
  return (
    <main className="page">
      <PageTitle>Crédits photo</PageTitle>
      <div className="wrap" style={{ maxWidth: 1040 }}>
        <PageHead
          title="Crédits photo"
          lead="Photos d'appareils réels issues de Wikimedia Commons, réduites et recadrées. Elles tiennent lieu des photos prises au comptoir par la boutique."
        />
        <Panel>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th />
                  <th>Fichier d'origine</th>
                  <th>Auteur</th>
                  <th>Licence</th>
                </tr>
              </thead>
              <tbody>
                {credits.map((c) => (
                  <tr key={c.file}>
                    <td>
                      <img className="thumb" src={`/img/${c.file}`} alt="" />
                    </td>
                    <td>
                      <a className="link" href={c.page} target="_blank" rel="noreferrer">
                        {c.title.replace(/^File:/, "")}
                      </a>
                    </td>
                    <td>{c.artist}</td>
                    <td>{c.license}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </main>
  );
}
