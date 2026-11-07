# Wecce

L'échange d'électronique par points entre étudiants de l'Université Gaston Berger (Saint-Louis), avec la boutique partenaire LBC (Leye Business Company), sur le campus entre les villages E et F.

Un étudiant dépose un appareil chez LBC, qui l'examine et annonce deux prix : la valeur de reprise (les points crédités) et le prix d'affichage (le prix pour l'étudiant suivant). Les points se dépensent sur le marché Wecce ; le complément se paie en francs (Wave, Orange Money, espèces). Points et prix baissent ensemble de 5 % le 1er de chaque mois.

## Contenu du dépôt

| Chemin | Contenu |
|---|---|
| [`GUIDE-FRONT-BACK.md`](GUIDE-FRONT-BACK.md) | **Point de départ de l'équipe back** : noms partagés, écrans et props, actions et routes Laravel proposées, serveur simulé, écarts à trancher |
| [`wecce-front/`](wecce-front/) | Front React 19 + TypeScript (Clean Architecture), prêt pour Laravel + Inertia ; tourne aujourd'hui sur un serveur simulé dans le navigateur |
| [`maquette/`](maquette/) | Maquette HTML cliquable (ouvrir `maquette/entree.html` ou `maquette/sommaire.html`) |
| [`wecce-schema.sql`](wecce-schema.sql) | Schéma PostgreSQL |
| [`wecce-classes-simplifie.puml`](wecce-classes-simplifie.puml), [`wecce-diagramme-simplifie.svg`](wecce-diagramme-simplifie.svg) | Modèle de classes |
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | Pile technique et décisions (Laravel, Inertia, PostgreSQL, paiements, multi-campus) |
| [`PRODUCT.md`](PRODUCT.md) | Vérité produit : règles, utilisateurs, ton |
| [`DESIGN.md`](DESIGN.md) | Système visuel (moutarde et cobalt, typographie, composants) |

## Lancer le front

Prérequis : Node 20 ou plus.

```bash
cd wecce-front
npm install
npm run dev        # http://localhost:5173
```

Comptes de démonstration, mot de passe `wecce2026` pour tous : `moussa.diallo@exemple.sn` (étudiant), `comptoir1@lbc.exemple.sn` (agente LBC), `admin@wecce.exemple.sn` (administration). Détails et parcours conseillé : [`wecce-front/README.md`](wecce-front/README.md).

## Pour l'équipe back

1. Lire [`GUIDE-FRONT-BACK.md`](GUIDE-FRONT-BACK.md) : chaque écran y est décrit avec ses props, chaque action avec sa route proposée.
2. Le comportement attendu de chaque action est celui du serveur simulé : `wecce-front/src/infrastructure/demo/engine.ts` (opérations) et `queries.ts` (ce que chaque contrôleur renvoie).
3. Les points encore ouverts (créneaux, motifs de refus, seuils, références d'acquisition…) sont listés en section 9 du guide.

## Crédits

Photos d'appareils : Wikimedia Commons, licences listées dans le front (`/credits`). Polices Figtree et Bricolage Grotesque (SIL OFL).
