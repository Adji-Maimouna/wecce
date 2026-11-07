/**
 * Titre de l'onglet du navigateur (« Wecce · Marché »).
 * React 19 place <title> dans <head>. Avec Inertia : `<Head title="…" />`.
 */
export function PageTitle({ children }: { children: string }) {
  return <title>{`Wecce · ${children}`}</title>;
}
