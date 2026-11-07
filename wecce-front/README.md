# Wecce — front React

L'échange d'électronique par points entre étudiants de l'UGB, avec la boutique LBC (Leye Business Company), sur le campus entre les villages E et F.

Front **React 19 + TypeScript + Vite**, organisé en **Clean Architecture**, prêt à être branché sur le back **Laravel** (via Inertia, voir `../ARCHITECTURE.md` et `../GUIDE-FRONT-BACK.md`). Il reproduit la maquette `../maquette/` et ajoute les écrans qui manquaient pour que chaque lien mène à une vraie page.

En attendant Laravel, l'application tourne sur un **serveur simulé** dans le navigateur : de vrais comptes, des accès réservés par rôle, et des données partagées entre les espaces (un dépôt pris par un étudiant apparaît au comptoir LBC, une reprise signée crédite son solde, etc.).

## Démarrer

Prérequis : Node 20 ou plus.

```bash
npm install
npm run dev        # http://localhost:5173
```

| Script | Rôle |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` | Vérification des types puis build de production (`dist/`) |
| `npm run lint` | ESLint, dont la **règle des dépendances** entre couches |
| `npm run typecheck` | Types seulement |
| `npm run preview` | Sert le build de production |

## Comptes de démonstration

Mot de passe de tous les comptes : **`wecce2026`**.

| Rôle | Identifiant | Ce qu'on y trouve |
|---|---|---|
| Étudiant | `moussa.diallo@exemple.sn` | 32 490 pts, un Redmi repris, un rendez-vous aujourd'hui à 10 h 30, un brouillon |
| Étudiante | `aissatou.sarr@exemple.sn` | un Galaxy A32 repris ce matin |
| Agente LBC | `comptoir1@lbc.exemple.sn` | Awa Ndiaye, comptoir 1 |
| Administrateur | `admin@wecce.exemple.sn` | Ibrahima Fall |

Les autres étudiants (`prenom.nom@exemple.sn`, sans accents) ont le même mot de passe. On peut aussi créer un compte étudiant depuis `/connexion#inscription`.

## Le parcours à suivre

1. **Étudiant** (Moussa) : Marché → un objet → « Prendre cet objet » (points, puis complément Wave, Orange Money ou espèces) ; « Déposer » un appareil et prendre rendez-vous ; « Mes dépôts ».
2. **LBC** (comptoir 1) : « Rendez-vous du jour » → « Commencer l'expertise » sur le Lenovo de Moussa → fixer les deux prix → l'étudiant signe sur la tablette → « Stock » : mettre l'article en ligne, remettre un objet réservé.
3. **Étudiant** : le solde a reçu la reprise et le bonus, le dépôt est « Repris », l'objet est en vente.
4. **Administration** : suspendre les dépôts (le motif s'affiche aux étudiants), ajuster un solde, lire le journal.

Astuce : sans cocher « Rester connecté », la session reste propre à l'onglet. On peut ouvrir un onglet étudiant et un onglet LBC côte à côte ; les actions de l'un apparaissent dans l'autre.

## Le serveur simulé

- Il vit le **samedi 7 novembre 2026** (le jour des données de départ) ; l'heure suit l'heure réelle, sans descendre sous 11 h.
- Les données sont gardées dans le navigateur (`localStorage`, clé `wecce-demo-db`). Elles survivent au rechargement.
- **Repartir des données de départ** : dans la console du navigateur, `localStorage.removeItem("wecce-demo-db")`, puis recharger ; ou augmenter `DB_VERSION` dans `src/infrastructure/demo/db.ts`.
- Le paiement Wave / Orange Money se confirme seul au bout de 3 secondes.

Le détail (données, opérations, ce qui reste à remplacer) est dans `../GUIDE-FRONT-BACK.md`.

## Écrans

| Espace | Écrans |
|---|---|
| Public | Entrée `/`, Connexion et inscription `/connexion`, Accueil `/accueil`, Crédits `/credits` |
| Étudiant | Marché, Fiche objet, Prendre et payer le complément, Déposer (4 étapes, reprise d'un brouillon), Mes dépôts, Changer le rendez-vous*, Copie du renoncement*, Mon solde, Questions fréquentes*, Mon profil* |
| LBC | Rendez-vous du jour, Expertise (choix du dépôt, deux prix, pièces, refus), Renoncement sur la tablette du comptoir, Dépôt traité*, Stock, Article du stock (ajouter / modifier / retirer)*, Dette et couverture, Mon profil* |
| Administration | Pilotage, Ajustement de points, Journal, Mon profil* |

\* écrans ajoutés après la maquette v2 ; ils figurent aussi dans `../maquette/` pour l'équipe back.

## Structure

```
src/
  domain/           Entités et règles métier pures (aucune dépendance)
  application/      Ports (interfaces vers le back) et cas d'usage
  infrastructure/   Adaptateurs : demo/ (serveur simulé) aujourd'hui, inertia/ demain
  presentation/     React : composants, pages, hooks, styles
  app/              Composition : main.tsx, App.tsx (accès par rôle), routes, conteneur
```

Le détail, la règle des dépendances et la marche à suivre pour ajouter un écran : [ARCHITECTURE.md](ARCHITECTURE.md).

## Styles

Le CSS de la maquette est découpé **un fichier par composant**, à côté du composant (`Button.tsx` + `Button.css`). `src/presentation/styles/index.css` les importe tous **dans l'ordre de la maquette** : c'est cet ordre qui règle les priorités entre règles. Pour un nouveau fichier CSS, l'ajouter dans `index.css` après les fichiers qu'il surcharge.

Jetons de design (couleurs moutarde et cobalt, typographie, rayons, mouvement Material 3) : `src/presentation/styles/tokens.css`, décrits dans `../DESIGN.md`.

## Brancher Laravel (Inertia)

1. Installer Inertia côté Laravel et `@inertiajs/react` ici ; copier `src/` dans `resources/js/` (l'alias `@/` reste le même).
2. Écrire les adaptateurs dans `src/infrastructure/inertia/` : chaque port de `src/application/ports/` devient des appels `router.post()` / `router.put()` vers les routes Laravel.
3. Dans `src/app/container.ts`, remplacer `demoPorts` par ces adaptateurs, et `currentSession()` par `usePage().props.auth`.
4. Les contrôleurs Laravel envoient aux pages **les mêmes props** que `src/app/routes.tsx` leur passe aujourd'hui (les types sont dans `src/domain/entities/`). Les accès par rôle de `App.tsx` deviennent les middlewares `auth` et de rôle.
5. Remplacer React Router par la navigation Inertia : `AppLink` (`presentation/components/ui/AppLink.tsx`), `useGo` et `useCurrentPath` (`presentation/lib/navigation.ts`), `useSignOut` (`presentation/hooks/useSignOut.ts`) sont les seuls points à changer. `PageTitle` devient `<Head title>`.
6. Supprimer `src/infrastructure/demo/`.

## Crédits

Photos d'appareils : Wikimedia Commons (licences dans `/credits`), en attendant les photos prises au comptoir. Icônes au style Lucide (ISC). Polices Figtree et Bricolage Grotesque (SIL OFL), via Fontsource.
