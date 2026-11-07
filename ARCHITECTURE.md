# Wecce — architecture technique

Décision arrêtée. Ce document remplace les discussions précédentes sur le choix de pile.

**Monolithe Laravel + Inertia + React, rendu côté serveur, PostgreSQL,
un déploiement par campus.**

Compétences de l'équipe : React et Laravel. Aucune contrainte imposée.
Équipe : deux développeurs, avec contrat de maintenance.

---

## 1. La pile

| Couche | Choix | Pourquoi |
|---|---|---|
| Langage / cadre | **Laravel 11+, PHP 8.3+** | Compétence de l'équipe. Planificateur, files d'attente et migrations intégrés — les trois dont ce projet a besoin. |
| Interface | **Inertia.js + React 18 + TypeScript** | Les contrôleurs renvoient des composants React sans API REST intermédiaire. Compétence de l'équipe, moitié moins de code qu'un front séparé. |
| Premier affichage | **Rendu côté serveur Inertia** (processus Node) | La page arrive en HTML. Sur un réseau lent, l'étudiant voit un prix avant que le JavaScript soit chargé. |
| Assemblage | **Vite**, découpage par page | Chaque écran ne télécharge que son code. |
| Styles | **Tailwind**, jetons issus de la maquette | Pas de bibliothèque de composants lourde. Les primitives sont déjà définies par la maquette. |
| Base | **PostgreSQL** | Transactions, contraintes `CHECK`, déclencheurs en ajout seul, types énumérés. Les points sont une dette : il faut une base qui sait dire non. |

**Pas d'API REST séparée** tant qu'un second consommateur n'existe pas.
**Pas d'application mobile** : une bonne page web mobile gagne sur un campus.
**Pas de microservices, pas de Redis, pas de Kubernetes** à cette échelle.

---

## 2. La règle non négociable : la couche métier des points

Les points sont une dette envers les étudiants. Toute écriture passe par un service dédié,
et **rien d'autre** n'écrit dans `mouvement_points` :

| Service | Déclenché par |
|---|---|
| `CrediterDepot` | Signature du renoncement, après expertise |
| `DebiterAcquisition` | L'étudiant prend un objet |
| `AppliquerFonte` | Tâche mensuelle |
| `AjusterManuellement` | Administrateur, avec motif journalisé |

Chaque service :

1. s'exécute dans une `DB::transaction()` ;
2. écrit **exactement une** ligne de `mouvement_points` (journal en ajout seul) ;
3. ne modifie jamais un solde sans écrire le mouvement correspondant.

`compte_points.solde` est un cache. La vérité est la somme des mouvements, et
`v_controle_soldes` vérifie chaque nuit qu'ils n'ont pas divergé. Si cette règle fuit dans
un contrôleur, on perd la capacité de justifier un solde à un étudiant — et avec elle, la
confiance du campus.

---

## 3. Le travail planifié

Files d'attente sur pilote base de données (pas de Redis nécessaire), workers sous supervisor,
`schedule:run` en cron.

### La fonte — le code le plus dangereux du système

Mensuelle, elle touche tous les comptes **et** tous les prix affichés.

- **Idempotence par la base, pas par le code** : index unique sur `(compte_id, periode)`
  pour les mouvements de type `FONTE`. Un second passage échoue au lieu de s'appliquer deux fois.
- Middleware `WithoutOverlapping` sur la tâche.
- Traitement par lots, une transaction par lot : une panne au milieu se reprend sans risque.
- **Même règle d'arrondi sur les points et sur les prix, dans le même passage.**
  `30 781 × 0,95 = 29 241,95` — arrondir toujours vers le bas rabote les étudiants, vers le
  haut gonfle la dette du partenaire. Si les deux courbes n'utilisent pas la même règle,
  l'écart du §8 se recreuse d'un franc par mois et par objet, en silence.

### Les autres tâches

| Tâche | Fréquence | Rôle |
|---|---|---|
| `ReconcilierPaiements` | 10 min | Rattrape les paiements restés `EN_ATTENTE` : les webhooks se perdent. |
| `CalculerSnapshotCouverture` | quotidienne | Alimente le tableau de bord dette/stock et le feu de suspension. |
| `ControlerSoldes` | quotidienne | Compare soldes et somme des mouvements ; alerte si divergence. |
| `CloturerComptesDormants` | mensuelle | Échéance 12 mois du §8. |

Table `failed_jobs` surveillée : une tâche de fonte en échec silencieux est une dette qui dérive.

---

## 4. Les paiements

Interface `PasserellePaiement`, trois implémentations : `Wave`, `OrangeMoney`, `Especes`
(règlement en boutique). Ajouter un opérateur = une classe.

Ceinture **et** bretelles : point d'entrée webhook pour la réactivité, plus le balayage
périodique ci-dessus. Sans le second, un étudiant paie, n'obtient rien, et vous l'apprenez
par WhatsApp.

**La commission est prélevée sur le transfert de l'étudiant**, avant reversement au
partenaire. Elle n'apparaît jamais dans l'interface étudiante. Voir `GUIDE-FRONT-BACK.md`, section 6.

---

## 5. Multi-campus

Un déploiement sur d'autres campus, avec d'autres partenaires locaux, est envisagé.

**Décision : un déploiement par campus** — base séparée, domaine séparé, `.env` par instance,
même code. Les données ne peuvent pas se mélanger, et un partenaire ne verra jamais le stock
d'un concurrent.

**Mais le campus est un concept de première classe dès la première ligne** : une table
`campus`, même avec une seule ligne, et les clés étrangères correspondantes. Aucune requête
ne suppose implicitement un campus unique.

Conséquence : le jour où cinq instances deviennent pénibles à maintenir, la consolidation en
multi-locataire est un changement de déploiement — pas une réécriture du modèle. Ce choix ne
coûte presque rien aujourd'hui.

Tous les réglages métier vivent dans `configuration_plateforme` : barème, taux de fonte,
seuil de suspension, identité du partenaire. Rien de « UGB » codé en dur.

---

## 6. Aucune estimation côté plateforme — décision arrêtée

**Le site ne calcule aucune valeur. Il n'y a pas de barème, et il n'y en aura pas.**

En entrée, l'étudiant saisit les caractéristiques du produit **et son prix souhaité**, libre
(`depot.prix_souhaite`). Ce montant n'est **pas** un engagement de la plateforme : le dernier
mot revient entièrement au partenaire, lors de l'expertise physique.

### Pourquoi c'est le bon choix

Le §6 du document avertit que si la plateforme estime un appareil à 45 000 alors que le
partenaire ne le rachèterait qu'à 30 000, il perd 15 000 F par échange et le modèle s'effondre.
**Ne pas estimer supprime ce risque par construction.** Cela évite aussi de maintenir
indéfiniment un barème en phase avec le comportement d'achat réel du partenaire — une charge
permanente pour l'équipe de maintenance.

### Ce que ça coûte

L'étudiant se déplace sans savoir ce qu'il touchera. La fourchette ± 20 % du §4 disparaît.
Conséquence à assumer : des écarts réguliers entre attente et offre, et des refus au comptoir.

### Le rattrapage, sans barème

Afficher non pas une estimation, mais un **fait historique** agrégé sur les expertises déjà
enregistrées :

> « Les 8 derniers téléphones de 2 ans en bon état ont été repris entre 26 000 et 34 000 points. »

Une vue en lecture seule sur `expertise`, groupée par catégorie, tranche d'âge et état, avec
un seuil minimal d'observations avant affichage. Rien à maintenir, la qualité s'améliore à
chaque dépôt, et c'est une donnée constatée plutôt qu'un engagement. **Pas pour le premier
jour** : sans historique, on n'affiche rien et on l'explique.

### Conséquences sur le modèle et les écrans

- Pas de table `bareme`, pas de versionnement de règles.
- `configuration_plateforme` conserve : taux de fonte, seuil de suspension, critères de refus,
  et la marge reprise/affichage si le prix d'affichage est dérivé de la valeur de reprise.
- **Reste à trancher** : à l'expertise, le partenaire saisit-il les deux prix, ou seulement la
  valeur de reprise, le prix d'affichage étant dérivé de la marge configurée ?
- L'alerte d'écart de la file d'expertise compare la valeur du partenaire au **souhait** de
  l'étudiant. Ce n'est donc pas un garde-fou de promesse mais un **indicateur d'attente** :
  « cet étudiant espère 45 000, vous proposez 30 000 — prévoyez la discussion ». Son libellé
  doit le dire ainsi.
- Quatre artboards de la maquette montrent encore un calcul plateforme et doivent être
  corrigés : `Depot`, `MobileDepot`, `Reglages` (section décotes), `Simulateur`.

---

## 7. Exploitation

Une seule machine, **à Marseille** : les routes réseau vers Dakar y sont sensiblement
meilleures qu'à Paris.

```
nginx  →  PHP-FPM  →  PostgreSQL
                   →  processus Node (rendu serveur Inertia)
supervisor         →  workers de files d'attente
cron               →  schedule:run
```

**Sauvegardes déposées hors de la machine, quotidiennement.** Ce sont des données d'argent :
une sauvegarde perdue est une entreprise perdue. Archivage des journaux WAL dès que le budget
le permet, pour une restauration à un instant donné.

---

## 8. Piège concret au démarrage

Les migrations Laravel ne savent pas créer les `CREATE TYPE … AS ENUM`. Le schéma en contient
**quatorze**. Il faut les poser en SQL brut via `DB::statement(...)` dans une première
migration, sans compter sur le générateur. Ça fonctionne très bien, mais il faut le savoir
avant d'écrire la première migration.

---

## Ce qui reste à trancher avant de coder

Sept points restent ouverts dans le document de besoins (tenu hors de ce dépôt) ; les écarts
entre le front et le schéma sont dans `GUIDE-FRONT-BACK.md`, section 9. Les deux qui bloquent le
développement :

1. **Le taux de fonte réel** à Saint-Louis — il conditionne tout le §8.
2. **La marge de reprise** — fixe ou variable par catégorie : la structure du barème en dépend.
