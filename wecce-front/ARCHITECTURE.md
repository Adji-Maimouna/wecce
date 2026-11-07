# Architecture du front Wecce

Clean Architecture stricte, adaptée à un front React qui sera servi par Laravel + Inertia.

## Les couches

```
            ┌──────────────────────────── app ────────────────────────────┐
            │      main.tsx · App.tsx · routes.tsx · container.ts          │
            └──────┬──────────────────────────────────────────┬────────────┘
                   │                                          │
        ┌──────────▼──────────┐                    ┌──────────▼──────────┐
        │   presentation      │                    │   infrastructure    │
        │  React : pages,     │                    │  adaptateurs :      │
        │  composants, hooks  │                    │  demo/ (inertia/)   │
        └──────────┬──────────┘                    └──────────┬──────────┘
                   │                                          │
                   └──────────────┐            ┌──────────────┘
                           ┌──────▼────────────▼──────┐
                           │       application        │
                           │  ports + cas d'usage     │
                           └────────────┬─────────────┘
                           ┌────────────▼─────────────┐
                           │          domain          │
                           │  entités + règles pures  │
                           └──────────────────────────┘
```

| Couche | Contient | Peut importer |
|---|---|---|
| `domain/` | `entities/` (un fichier par entité, alignées sur `wecce-schema.sql`), `rules/` (baisse de 5 %, couverture, expertise, ajustement, comptes), `referentials/` (listes UGB) | rien |
| `application/` | `ports/` (interfaces : `AuthGateway`, `DepositGateway`, `PaymentGateway`, `WaiverGateway`, `ProfileGateway`, `PartnerGateway`, `AdminGateway`), `use-cases/`, `errors.ts`, `index.ts` (`makeUseCases`) | `domain` |
| `infrastructure/` | `demo/` : le serveur simulé. `db.ts` (tables, sauvegarde dans le navigateur), `seed.ts` (données de départ, rejouées), `engine.ts` (opérations métier), `queries.ts` (lectures : les props des pages), `gateways.ts` (adaptateurs des ports), `session.ts` (compte connecté), `clock.ts` (date et formats français) | `domain`, `application` |
| `presentation/` | `components/` (un composant par fichier, son CSS à côté), `pages/` (un écran par fichier), `hooks/`, `lib/` (format, libellés, chemins, mouvement), `content/`, `styles/` | `domain`, `application` |
| `app/` | composition : routes et accès par rôle, conteneur de dépendances, fournisseurs de contexte | tout |

**La règle des dépendances est vérifiée par ESLint** (`eslint.config.js`, règle `no-restricted-imports` par couche) : `npm run lint` échoue si une couche importe une couche plus externe, ou si le domaine ou l'application importent React.

## Lecture et écriture

- **Lire** : une page reçoit ses données en **props**, comme Inertia les enverra depuis le contrôleur Laravel. Aujourd'hui, `app/routes.tsx` joue le contrôleur : il lit `infrastructure/demo/queries.ts`. Une page ne va jamais chercher ses données elle-même.
- **Écrire** : une page appelle un **cas d'usage** via `useUseCases()` (`presentation/hooks/useUseCases.ts`). Le cas d'usage applique les règles du domaine, puis appelle un **port**. Le port est implémenté par un adaptateur (serveur simulé aujourd'hui, Inertia demain), choisi dans `app/container.ts`.
- **Recharger** : après une action, le serveur simulé prévient les écrans (`db.ts`, `subscribe`) ; `App.tsx` recalcule les props de la page affichée, comme Inertia recharge les props après un `router.post()`.
- **Accès** : chaque route déclare qui peut l'ouvrir (`public`, `guest`, ou un rôle). `ScreenHost` (`App.tsx`) renvoie un visiteur vers la connexion (avec `?retour=`) et un compte d'un autre rôle vers son espace, comme les middlewares Laravel.

```
Page ──useUseCases()──▶ cas d'usage ──▶ port (interface) ◀── adaptateur demo | inertia
  ▲                                                               │
  └──── props ◀── contrôleur (aujourd'hui : app/routes.tsx + infrastructure/demo/queries.ts)
```

Une règle violée côté client lève une `RuleViolation` (message prêt à afficher) avant tout envoi.

## Ajouter un écran

1. Entités et règles manquantes dans `domain/`.
2. Si l'écran agit : une méthode dans le port concerné (`application/ports/`), un cas d'usage (`application/use-cases/`), l'ajouter à `makeUseCases`, puis l'implémenter dans `infrastructure/demo/gateways.ts` (l'opération elle-même dans `engine.ts`).
3. Les composants dans `presentation/components/<fonctionnalité>/`, la page dans `presentation/pages/<espace>/` : elle reçoit ses données en props et ses actions via `useUseCases()`.
4. Le chemin dans `presentation/lib/paths.ts` ; la route, son accès et ses props dans `app/routes.tsx` (la lecture correspondante dans `infrastructure/demo/queries.ts`).
5. Le CSS à côté du composant, importé dans `presentation/styles/index.css`.
6. `npm run lint && npm run build`.

## Conventions

- Un composant par fichier, nommé comme le fichier. Les constantes partagées vont dans un `.ts` à part (rechargement à chaud).
- Textes en français, vouvoiement, écriture sobre (voir `../PRODUCT.md`).
- Montants : `fmt`, `pts`, `francs` (`presentation/lib/format.ts`), jamais de formatage à la main.
- Couleurs : moutarde pour la marque et les points, cobalt pour l'action (`../DESIGN.md`). Un seul bouton plein par vue.
- Valeurs encore à trancher avec LBC : composant `Tbd` (soulignement pointillé).
