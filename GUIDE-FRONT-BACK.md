# Guide front ↔ back Wecce

Ce guide fixe les noms partagés entre le front React (`wecce-front/`) et le back Laravel (`wecce-schema.sql`, `ARCHITECTURE.md`). Il dit, pour chaque écran, qui peut l'ouvrir et quelles données le contrôleur doit envoyer. Pour chaque action, il donne la route Laravel et ce qu'elle reçoit et renvoie. Il explique enfin comment le front fonctionne aujourd'hui sans back, sur un **serveur simulé** dans le navigateur.

- Code du front : `wecce-front/src/` (architecture : `wecce-front/ARCHITECTURE.md`, démarrage et comptes : `wecce-front/README.md`).
- Maquette de référence, y compris les écrans ajoutés : `maquette/` et https://claude.ai/artifact/SMoDg3Qv66Ey4EaymGVjrS
- Vidéo de démonstration : `wecce-demo.mp4` (envoyée au partenaire).

---

## 1. Conventions communes

| Sujet | Convention |
|---|---|
| Clés des props et des JSON | **camelCase**, comme les types du front (`numeroCarte`, `balanceAfter`). Les API Resources Laravel convertissent depuis le snake_case de la base. |
| Codes énumérés | Le front utilise des codes en minuscules (`comme-neuf`, `rendez-vous`) ; la base des majuscules (`COMME_NEUF`, `RDV_PRIS`). La correspondance est en section 3. **Le back fait la conversion dans ses Resources.** |
| Points et francs | Entiers. 1 point = 1 franc CFA. Jamais de décimales. |
| Taux | En **pourcentage** côté front (`rate: 20`), en **fraction** dans la base (`bonus_taux = 0.200`). Couverture et marge restent en fraction des deux côtés (`ratio: 1.26`, `margin: 0.246`). |
| Dates | Le front affiche des **chaînes déjà rédigées en français** (`"14 septembre 2026"`, `"7 nov., 9 h 14"`, `"1er nov. 2026"`). Le back les formate (`Carbon::translatedFormat`, locale `fr`) aux formats de la section 4 ; le serveur simulé fait déjà la même chose (`infrastructure/demo/clock.ts`), à reprendre tel quel. Le front écrit lui-même « 1er » en exposant. |
| Références | Dépôt `WC-AAAA-NNNN` (`depot.reference`), acquisition `AQ-AAAA-NNNN` (**pas de colonne aujourd'hui**, voir section 9), carte étudiant `AAAA-NNNN` (`etudiant.numero_carte`). |
| Identifiants dans l'adresse | Objet du marché : `slug` (voir section 9). Dépôt : `reference`. Article du stock : `id` de l'annonce. |
| Textes | Français, vouvoiement. Les libellés d'interface sont côté front (`presentation/lib/labels.ts`). **Le back envoie des codes, pas des libellés**, sauf les quelques phrases déjà composées signalées en section 4 (`deviceInfo`, `details`, `info`). |

---

## 2. Glossaire

| Notion métier | Nom dans le front | Table(s) SQL |
|---|---|---|
| Compte (identité commune) | `User` | `utilisateur` |
| Étudiant | `Student` | `etudiant` + `compte_points` |
| Agent LBC | `Agent` | `agent` |
| Administrateur | `Administrator` | `administrateur` |
| Objet en vente | `MarketItem` | `annonce` + `appareil` + `photo` |
| Fiche détaillée d'un objet | `ItemDetails` | `annonce` + `appareil` + `expertise` |
| Point vérifié à l'examen | `InspectionCheck` | aucune (voir section 9) |
| Acquisition de l'étudiant connecté | `Acquisition` | `acquisition` + `paiement` |
| Reprise montrée sur l'accueil | `RecentTakeBack` | `renoncement` + `appareil` + `photo` |
| Dépôt | `Deposit` | `depot` + `appareil` + `expertise` + `annonce` |
| Demande de dépôt (formulaire) | `DepositRequest` | création `appareil` + `depot` + `photo` |
| Jour de rendez-vous | `AppointmentDay` | aucune (créneaux calculés) |
| Mouvement de points | `Movement` | `mouvement_points` |
| Point du graphique du solde | `BalancePoint` | calculé |
| Renoncement de propriété | `Waiver` | `renoncement` + `expertise` + `depot` |
| Rendez-vous du comptoir | `Appointment` | `depot` (statut `RDV_PRIS`, jour J) |
| Déclaration vue à l'expertise | `DeclaredDevice` | `depot` + `appareil` + `photo` |
| Saisie de l'expertise | `ExpertiseInput` | insertion `expertise` |
| Dépôt traité (vue LBC) | `ProcessedDeposit` | `depot` + `expertise` + `renoncement` |
| Article du stock | `StockArticle` | `annonce` + `appareil` |
| Saisie d'un article de la boutique | `ArticleInput` | `annonce` (`STOCK_PARTENAIRE`) + `appareil` |
| Couverture | `CoverageSnapshot`, `CoveragePoint` | `snapshot_couverture`, `v_couverture_actuelle` |
| Marge réelle | `MarginRow` | `v_marge_observee` |
| Bonus de lancement | `LaunchBonus` | `configuration_plateforme` (`bonus_*`) |
| État des dépôts | `DepositsState` | `configuration_plateforme` + `snapshot_couverture` |
| Tâche automatique | `ScheduledTask` | aucune (journal des tâches planifiées) |
| Écart de solde | `BalanceMismatch` | `v_controle_soldes` |
| Ligne du journal d'administration | `AdminLogEntry` | `journal_administration` |
| Compte vu par l'administration | `AccountSummary` | `etudiant` + `compte_points` |

Les types sont dans `wecce-front/src/domain/entities/`, un fichier par famille : `user`, `student`, `staff`, `market`, `deposit`, `movement`, `waiver`, `partner`, `admin`.

---

## 3. Énumérations : codes du front ↔ valeurs de la base

| Front (type) | Codes du front | Base (type SQL) | Valeurs SQL |
|---|---|---|---|
| `Role` | `ETUDIANT`, `AGENT`, `ADMIN` | `role_utilisateur` | identiques |
| `Category` | `tel`, `ordi`, `tab`, `audio`, `piece` | `categorie.code` | identiques |
| `Condition` | `comme-neuf`, `bon`, `use`, `fonctionnel`, `defectueux` | `etat_appareil` | `COMME_NEUF`, `BON`, `USE`, `FONCTIONNEL`, `DEFECTUEUX` |
| `DeviceCondition` / `PartCondition` | sous-ensembles de `Condition` (appareil entier / pièce) | `etat_appareil` | idem |
| `AgeBand` | `moins-1`, `1-2`, `2-3`, `plus-4`, `inconnu` | `tranche_age` | `MOINS_1AN`, `1_2ANS`, `2_3ANS`, `PLUS_4ANS`, `INCONNU` |
| `DepositStatus` | `brouillon`, `rendez-vous`, `a-signer`, `repris`, `refuse`, `annule` | `statut_depot` | `BROUILLON`, `RDV_PRIS`, `EXPERTISE` (= `a-signer` : prix fixés, signature attendue), `VALIDE`, `REFUSE`, `ANNULE` |
| `DepositStage` (dérivé) | `decrit`, `rendez-vous`, `examen`, `signature`, `en-vente` | aucun | le front reçoit `stageIndex` (0 à 5) |
| `MovementType` | `reprise`, `bonus`, `fonte`, `acquisition`, `ajustement` | `type_mouvement` | `CREDIT_DEPOT`, `BONUS`, `FONTE`, `DEBIT_RETRAIT`, `AJUSTEMENT` |
| `MovementKind` (dérivé) | `gain`, `baisse`, `depense` | aucun | calculé par le front (`domain/rules/movements.ts`) |
| `PaymentMethod` | `wave`, `om`, `especes` | `moyen_paiement` | `WAVE`, `ORANGE_MONEY`, `ESPECES` |
| `Acquisition.status` | `en-attente`, `reserve`, `remis` | `statut_paiement` + `acquisition.retire_le` | `EN_ATTENTE` → `en-attente` ; `CONFIRME` (ou espèces) → `reserve` ; retiré → `remis` |
| `StockOrigin` | `depot`, `boutique` | `origine_annonce` | `DEPOT_ETUDIANT`, `STOCK_PARTENAIRE` |
| `StockStatus` | `a-photographier`, `en-ligne`, `reserve`, `remis`, `retire` | `statut_annonce` | `EN_LIGNE`, `RESERVEE`, `VENDUE` (= `remis`), `RETIREE` ; `a-photographier` = `appareil.statut = EN_STOCK` sans annonce |
| `AppointmentStatus` | `a-venir`, `arrive`, `a-signer`, `repris`, `refuse`, `annule` | dérivé de `statut_depot` | `RDV_PRIS` → `a-venir`, `EXPERTISE` → `a-signer`, `VALIDE` → `repris`, `REFUSE` → `refuse`, `ANNULE` → `annule` (`arrive` reste disponible si le back note l'arrivée) |
| décision d'expertise | `ExpertiseInput.pieces` (booléen) + action de refus séparée | `decision_expertise` | `pieces=false` → `ACCEPTE`, `pieces=true` → `ACCEPTE_EN_PIECES`, refus → `REFUSE` |
| `RefusalReason` | `ecran`, `compte`, `batterie`, `modele` | `expertise.motif_refus` (texte libre) | voir section 9 |
| `CoverageLevel` | `ouvert`, `surveillance`, `suspendu` | `niveau_couverture` | `OUVERT`, `SURVEILLANCE`, `SUSPENDU` |
| `AdminActionType` | `ajustement`, `suspension`, `reprise`, `retrait`, `configuration` | `action_admin` | `AJUSTEMENT_POINTS`, `SUSPENSION`, `REPRISE`, `RETRAIT_ANNONCE`, `CONFIGURATION` (+ `CATEGORIE`, `COMPTE`, absents du front) |
| `AdjustmentDirection` | `credit`, `debit` | signe de `mouvement_points.montant` (type `AJUSTEMENT`) | `credit` → montant > 0, `debit` → montant < 0 |

---

## 4. Entités (champs attendus par le front)

Pour chaque champ : la source en base et le format attendu. « Front seul » signifie qu'aucune colonne ne porte cette donnée aujourd'hui. Le serveur simulé calcule chacun de ces champs dans `infrastructure/demo/queries.ts` : c'est la référence exacte à reproduire dans les Resources.

### Comptes (`domain/entities/user.ts`, `student.ts`, `staff.ts`)

| Entité.champ | Type | Source | Remarque |
|---|---|---|---|
| `User.prenom`, `nom`, `email`, `telephone`, `role` | texte | `utilisateur.*` | `displayName()` (« Moussa D. ») et `initials()` sont calculés par le front |
| `Student.numeroCarte` | texte | `etudiant.numero_carte` | |
| `Student.niveau`, `ufr` | texte facultatif | `etudiant.niveau`, `ufr` | listes dans `domain/referentials/ugb.ts`, à confirmer avec l'UGB |
| `Student.balance` | entier | `compte_points.solde` | |
| `Student.memberSince` | texte | `utilisateur.cree_le` | « 14 septembre 2026 » |
| `Student.depositCount` | entier | `COUNT(depot)` | |
| `Agent.fonction`, `peutExpertiser` | texte, booléen | `agent.fonction`, `peut_expertiser` | |
| `Agent.poste` | texte | **front seul** | « Comptoir 1 » ; colonne à créer ou valeur fixe |
| `Administrator.portee` | texte | `administrateur.portee` | `GLOBAL` |

### Marché (`market.ts`)

| Champ | Type | Source | Remarque |
|---|---|---|---|
| `MarketItem.slug` | texte | **front seul** | identifiant d'adresse ; utiliser `annonce.id` ou ajouter un slug |
| `name` | texte | `appareil.designation` (+ `stockage`) | « Galaxy A12 · 64 Go » ; reprise en pièces : « MacBook noir, pour pièces » |
| `keywords` | texte | **front seul** | sert à la recherche ; côté back, la recherche peut se faire en SQL |
| `category` | `Category` | `appareil.categorie_code` | |
| `price` | entier | `annonce.prix_courant` | prix du jour, après les baisses |
| `photo` | `{src, alt, width, height}` **facultatif** | première ligne de `photo` | absente tant que LBC n'a pas photographié l'article : le front affiche « Photo à venir » |
| `condition` | `Condition` | `appareil.etat_constate` | |
| `battery` | entier facultatif | `appareil.batterie_pourcent` | |
| `detail` | texte facultatif | **front seul** | « Âge inconnu », « Ne démarre pas » |
| `order` | entier | rang selon `annonce.mise_en_ligne_le` | tri « Plus récents » |
| `mine` | booléen | `depot_origine.etudiant_id = étudiant connecté` | |
| `reserved` | booléen | `annonce.statut = RESERVEE` | |
| `ItemDetails.title`, `details` | texte | `appareil` | `details` est une phrase composée (« Téléphone · déposé par un étudiant ») |
| `ItemDetails.examinedOn` | texte | `expertise.realisee_le` | « 28 octobre » |
| `ItemDetails.checks[]` | `{label, value, numeric?}` | **front seul** | voir section 9 |
| `Acquisition` | `ref`, `method`, `points`, `complement`, `status`, `paymentRef?`, `sentAt?`, `confirmedAt?`, `pickupBefore` | `acquisition` + `paiement` | `sentAt` « 7 nov., 14 h 32 », `confirmedAt` « 7 nov. à 14 h 33 », `pickupBefore` « mardi 10 novembre » (3 jours, à trancher) |
| `RecentTakeBack` | `{photo, points, label}` | `renoncement.valeur_cedee`, `appareil`, `signe_le` | `label` : « Redmi Note 8 · repris le 14 sept. » |

### Dépôts (`deposit.ts`)

| Champ | Type | Source | Remarque |
|---|---|---|---|
| `Deposit.ref` | texte | `depot.reference` | |
| `deviceName` | texte | `appareil.designation` + `stockage` | |
| `category` | `Category` | `appareil.categorie_code` | |
| `status` | `DepositStatus` | `depot.statut` | voir section 3 |
| `photo` | url facultative | `photo.url`, sinon photo de l'annonce | |
| `stageIndex` | 0 à 5 | dérivé | 0 décrit, 1 rendez-vous, 3 signature, 4 en vente (à photographier), 5 en ligne |
| `appointment` | `{label, long}` | `depot.date_rendez_vous` | « Samedi 7 novembre, 10 h 30 » / « samedi 7 novembre à 10 h 30 » |
| `wish` | entier facultatif | `depot.prix_souhaite` | privé : seuls l'étudiant et LBC le voient |
| `missing` | texte facultatif | dérivé | « Il manque les photos et le rendez-vous » |
| `signedOn` | texte | `renoncement.signe_le` | « 14 septembre » |
| `takeBack` | `{points, bonus}` | `expertise.valeur_reprise`, mouvement `BONUS` | |
| `prices` | `{initial, today}` | `annonce.prix_initial`, `prix_courant` | |
| `examinedOn` | texte | `expertise.realisee_le` | |
| `refusal` | `{reason, comment}` | `expertise.motif_refus`, `commentaire` | `reason` est un code `RefusalReason` |
| `cancelledOn` | texte | `depot.cloture_le` | avec `examinedOn` : prix refusés au comptoir (section 6, `decline`) |
| `itemSlug` | texte | annonce issue du dépôt, si elle est en ligne | lien « Voir l'annonce » |
| `DepositRequest.category`, `modele`, `stockage` | | `appareil.categorie_code`, `designation`, `stockage` | |
| `DepositRequest.age`, `etat` / `etatPiece` | codes | `appareil.age_declare`, `etat_declare` | `etatPiece` s'applique si `category = piece` |
| `DepositRequest.photos` | data URL ou null, ×4 | `photo.url` | à envoyer en multipart (voir section 6) |
| `DepositRequest.souhait` | entier ou null | `depot.prix_souhaite` | |
| `DepositRequest.day`, `slot` | rangs dans les listes | `depot.date_rendez_vous` | voir section 9 |
| `DepositRequest.draftRef` | texte facultatif | `depot.reference` d'un brouillon | la demande complète ce brouillon au lieu d'en créer un |
| `AppointmentDay` | `{label, month, freeCount, taken[]}` | calculé | « Samedi 7 » / « novembre » ; `taken` : rangs des créneaux pris **ou déjà passés** |

### Points (`movement.ts`)

| Champ | Type | Source | Remarque |
|---|---|---|---|
| `Movement.date` | texte | `mouvement_points.effectue_le` | « 1er nov. 2026 » |
| `type` | `MovementType` | `mouvement_points.type` | voir section 3 |
| `detail` | texte | `mouvement_points.libelle` | « 5 % de 34 200 », « Galaxy A12 · 64 Go, bon AQ-2026-1186 » |
| `amount` | entier signé | `montant` | négatif pour une baisse ou une dépense |
| `balanceAfter` | entier | `solde_apres` | |
| `BalancePoint` | `{label, day, balance, price, projected?}` | calculé | depuis la première reprise : signature, chaque baisse, puis la prochaine baisse (`projected`) |

### Renoncement (`waiver.ts`)

| Champ | Source |
|---|---|
| `ref` | `depot.reference` |
| `place` | `renoncement.lieu` |
| `openedAt` | `expertise.realisee_le` (« samedi 7 novembre 2026, 10 h 48 ») |
| `depositor {name, card, study}` | `utilisateur`, `etudiant` (« Licence 3 · SAT ») |
| `device {name, serial, condition, battery}` | `appareil`, `renoncement.numero_serie_constate` (masqué : « PF3K••••2B »), `expertise.etat_constate` (**code** `Condition`), `batterie_pourcent` (ou `null`) |
| `wish`, `takeBack`, `listPrice` | `depot.prix_souhaite` (ou `null`), `expertise.valeur_reprise`, `expertise.prix_affichage` |
| `bonusRate` | `configuration_plateforme.bonus_taux` × 100 si le quota n'est pas atteint, sinon 0 |
| `pieces` | `expertise.decision = ACCEPTE_EN_PIECES` |
| `balanceBefore` | `compte_points.solde` avant signature |
| `signedAt`, `agent`, `hash` | `renoncement.signe_le` (« 7 nov. 2026, 10 h 52 », **vide tant que non signé**), « Comptoir 1 · Awa N. », `renoncement.empreinte` |

Le crédit à la signature est calculé par le front avec la même règle que le back : `reprise + arrondi(reprise × taux / 100)`, voir `domain/rules/expertise.ts`.

### LBC (`partner.ts`)

| Entité | Champs | Source |
|---|---|---|
| `Appointment` | `time`, `student {name, initials, card}`, `depositRef`, `device`, `deviceInfo`, `wish`, `status`, `takeBack?`, `refusalShort?` | `depot` du jour + `utilisateur` + `appareil` + `expertise` ; `deviceInfo` : « Téléphone · 1 à 2 ans · bon état » |
| `DeclaredDevice` | `depositRef`, `student`, `appointmentTime`, `category`, `modele`, `stockage`, `age`, `etat` (entier **ou** pièce), `photoCount`, `wish` (ou `null`) | `depot` + `appareil` + `COUNT(photo)` |
| `ExpertiseInput` | `depositRef`, `pieces`, `condition`, `battery`, `serial`, `takeBack`, `listPrice` | insertion dans `expertise` ; `serial` va dans `appareil.numero_serie` |
| `ProcessedDeposit` | `ref`, `student`, `device`, `deviceInfo`, `examinedAt`, `agent`, `wish`, `outcome` (repris : `takeBack`, `listPrice`, `bonus`, `pieces`, `signedAt`, `articleId?` ; refusé : `reason`, `comment`) | `depot` + `expertise` + `renoncement` |
| `StockArticle` | `id`, `name`, `info`, `category`, `condition?`, `battery?`, `photo?`, `origin`, `originRef?`, `onlineSince`, `initialPrice`, `todayPrice`, `status`, `acquisitionRef?`, `statusNote?` | `annonce` + `appareil` + `acquisition` ; `acquisitionRef` seulement quand le paiement est confirmé (sinon `statusNote` : « paiement en attente ») ; `onlineSince` « pas encore » pour un article à photographier |
| `ArticleInput` | `id?`, `name`, `category`, `condition`, `battery?`, `info?`, `price`, `photo?` | `annonce` + `appareil` |
| `StockSummary` | `online`, `onlineFromShop`, `displayedValue`, `reserved`, `leftLastMonth`, `leftWithComplement`, `lastMonthLabel` | agrégats sur `annonce` et `acquisition` |
| `CoverageSnapshot` | `computedAt`, `ratio`, `pointsInCirculation`, `studentAccounts`, `stockValue`, `stockCount`, `thresholds {watch, suspend, reopen}` | `snapshot_couverture` ; seuils 1,2 / 1,1 / 1,2, **à trancher** ; le stock qui couvre la dette = articles à photographier, en ligne et réservés |
| `CoveragePoint` | `label`, `day`, `stock`, `debt`, `event?` | historique de `snapshot_couverture` (une mesure par semaine) + la mesure du jour |
| `MarginRow` | `month`, `expertises`, `margin` | `v_marge_observee` (reprises entières acceptées) |

Rendez-vous du comptoir : le contrôleur envoie trois journées, `hier`, `aujourdhui`, `demain`, chacune `{label, short, appointments}`. « Hier » et « Demain » sont les jours d'ouverture voisins : LBC ferme le dimanche, donc le samedi, `demain` est le lundi et `short` vaut « Lundi ».

### Administration (`admin.ts`)

| Entité | Champs | Source |
|---|---|---|
| `LaunchBonus` | `active`, `rate` (en %), `quota`, `used` | `configuration_plateforme.bonus_actif`, `bonus_taux` × 100, `bonus_quota`, `bonus_consomme` |
| `DepositsState` | `suspended` (suspension **manuelle**), `reason?`, `suspendedAt?`, `coverageRatio`, `autoSuspendBelow`, `upcomingAppointments` | `configuration_plateforme` (`depots_ouverts`, `suspension_manuelle`, `motif_suspension`, `mis_a_jour_le`), dernier `snapshot_couverture`, `COUNT(depot RDV_PRIS à venir)` |
| `ScheduledTask` | `name`, `description`, `frequency`, `lastRun`, `result`, `tone` | journal du planificateur Laravel (voir section 9) |
| `BalanceMismatch` | `card`, `recorded`, `computed` | `v_controle_soldes` |
| `AdminLogEntry` | `at`, `type`, `target`, `change`, `reason`, `by` | `journal_administration` ; `change` est construit depuis `avant` / `apres` (« 32 490 → 32 990 pts ») ; `by` masque l'IP (« I. Fall · 41.82.••.•• ») |
| `AccountSummary` | `name` (nom complet), `initials`, `card`, `study`, `active`, `balance` | `etudiant` + `compte_points` |

---

## 5. Écrans : adresse, accès, page et props attendues

Les adresses sont dans `presentation/lib/paths.ts`. Avec Inertia, chaque contrôleur rend la page et envoie **exactement ces props** ; aujourd'hui, `app/routes.tsx` joue ce rôle (`render`) et lit le serveur simulé.

**Accès.** `public` : tout le monde. `guest` : un compte déjà connecté est renvoyé vers son espace. Un rôle : un visiteur est renvoyé vers `/connexion?retour=<adresse>` ; un compte d'un autre rôle, vers son espace (`HOME_BY_ROLE` : étudiant → `/etudiant/solde`, agent → `/partenaire/rendez-vous`, admin → `/admin/pilotage`). Côté Laravel : middlewares `auth`, `guest` et un middleware de rôle ; une page introuvable → `NotFound`.

| Adresse | Accès | Page (`presentation/pages/…`) | Props |
|---|---|---|---|
| `/` | public | `Entree` | aucune (lit la session : connecté, la page propose « Mon espace ») |
| `/connexion` | guest | `Connexion` | aucune ; lit `#inscription` et `?retour=` |
| `/accueil` | public | `Accueil` | `recentTakeBacks`, `takenBackCount`, `previewItems`, `previewBalance`, `marketTotal` |
| `/credits` | public | `Credits` | `credits` (crédits photo) |
| `/etudiant/marche` | ETUDIANT | `etudiant/Marche` | `items: MarketItem[]`, `depositsSuspended?`, `nextFonte` (« décembre ») ; lit `?categorie=`, `?solde=1`, `?q=` |
| `/etudiant/objets/:slug` | ETUDIANT | `etudiant/Fiche` | `ItemDetails` + `balance`, `reservedByOther`, `reservedByMe`, `nextFonte` ; objet hors marché → introuvable |
| `/etudiant/prendre/:slug` | ETUDIANT | `etudiant/Prendre` | `item`, `title`, `balance`, `acquisition: Acquisition \| null`, `unavailable` (réservé par un autre) |
| `/etudiant/deposer` | ETUDIANT | `etudiant/Deposer` | `depositsSuspended?`, `suspensionReason?`, `bonus {rate, quota, left} \| null`, `days: AppointmentDay[]`, `times: string[]`, `start` (premier créneau libre `{day, slot}`, et le brouillon si `?brouillon=REF`) |
| `/etudiant/depots` | ETUDIANT | `etudiant/Depots` | `current: Deposit[]`, `done: Deposit[]` |
| `/etudiant/depots/:ref/rendez-vous` * | ETUDIANT | `etudiant/ChangerRendezVous` | `deposit`, `days`, `times` (le créneau du dépôt compté libre), `current {day, slot} \| null`, `initial {day, slot}` ; dépôt pas en `rendez-vous` → retour à Mes dépôts |
| `/etudiant/depots/:ref/renoncement` * | ETUDIANT | `etudiant/Renoncement` | `waiver: Waiver`, `context: "etudiant"` (copie signée, dépôt `repris` de l'étudiant) |
| `/etudiant/solde` | ETUDIANT | `etudiant/Solde` | `balance`, `nextFonte`, `itemsInBalance`, `reference {name, price}`, `history {itemName, points} \| null`, `movements` |
| `/etudiant/questions` * | ETUDIANT | `etudiant/Questions` | aucune (texte de `presentation/content/faq.ts`) |
| `/etudiant/profil` * | ETUDIANT | `etudiant/Profil` | aucune (lit la session) |
| `/partenaire/rendez-vous` | AGENT | `partenaire/RendezVous` | `days {hier, aujourdhui, demain : {label, short, appointments}}`, `depositsSuspended?` |
| `/partenaire/expertise` | AGENT | `partenaire/Expertise` | `declared: DeclaredDevice \| null`, `bonus {rate, rank, quota} \| null`, `controls: string[]`, `queue: Appointment[]` (rendez-vous du jour à examiner), `missingRef?` ; lit `?depot=REF` (dépôt `a-signer` → renoncement, dépôt traité → fiche du dépôt) |
| `/partenaire/depots/:ref` * | AGENT | `partenaire/Depot` | `deposit: ProcessedDeposit` (dépôt `a-signer` → renoncement) |
| `/partenaire/depots/:ref/renoncement` | AGENT | `etudiant/Renoncement` | `waiver: Waiver`, `context: "comptoir"` (la tablette : l'étudiant signe, ou refuse les prix) |
| `/partenaire/stock` | AGENT | `partenaire/Stock` | `summary \| null`, `articles: StockArticle[]`, `counts {tout, depot, boutique}` |
| `/partenaire/stock/nouveau` * | AGENT | `partenaire/Article` | aucune |
| `/partenaire/stock/:id` * | AGENT | `partenaire/Article` | `article: StockArticle` |
| `/partenaire/couverture` | AGENT | `partenaire/Couverture` | `coverage`, `history: CoveragePoint[]`, `margins: MarginRow[]` |
| `/partenaire/profil` * | AGENT | `partenaire/Profil` | aucune (lit la session) |
| `/admin/pilotage` | ADMIN | `admin/Pilotage` | `deposits: DepositsState`, `bonus: LaunchBonus`, `tasks: ScheduledTask[]`, `mismatch \| null` |
| `/admin/ajustement` | ADMIN | `admin/Ajustement` | `accounts: AccountSummary[]` ; lit `?carte=` |
| `/admin/journal` | ADMIN | `admin/Journal` | `entries: AdminLogEntry[]` |
| `/admin/profil` * | ADMIN | `admin/Profil` | aucune (lit la session) |

\* écran ajouté après la maquette v2, présent aussi dans `maquette/`.

**Props partagées (session).** `Session = { student? | agent? | admin?, appointmentsToReceive? }` (`presentation/hooks/session.ts`) : un seul compte à la fois, et pour un agent le nombre de rendez-vous du jour encore à recevoir (pastille de la barre latérale). Avec Inertia : `HandleInertiaRequests::share()` → `auth.user`. Le front les lit avec `useStudent()`, `useAgent()`, `useAdmin()`, `useSessionRole()`.

**Pied de page.** Étudiant : aide (vers `/etudiant/questions` et ses ancres `#deux-prix`, `#baisse`, `#deposer`, `#retrait`), la boutique LBC (lieu, jours de rendez-vous, carte), le compte (profil, `#historique` du solde, déconnexion). Public : les sections de l'accueil, la boutique, se connecter ou s'inscrire (« Aller à mon espace » si connecté).

---

## 6. Actions : ports, cas d'usage et routes Laravel proposées

La page appelle un cas d'usage (`useUseCases()`). Le cas d'usage vérifie les règles, puis appelle un **port**, c'est-à-dire une interface de `application/ports/`. Côté Laravel, chaque méthode de port devient une route. Les routes ci-dessous sont **proposées** ; leur nom et leur forme sont à valider par l'équipe back. Le comportement attendu est celui du serveur simulé (`infrastructure/demo/engine.ts`), opération par opération.

| Port.méthode | Cas d'usage | Route proposée | Envoi | Réponse et effet attendus |
|---|---|---|---|---|
| `AuthGateway.login` | `login` | `POST /login` | `identifiant` (e-mail ou téléphone), `motDePasse`, `rester` | `{ok: true, role}` ou `{ok: false, reason: "identifiants-invalides"}` ; le front ouvre `?retour=` s'il appartient à l'espace du rôle, sinon l'espace du rôle |
| `AuthGateway.logout` | `logout` | `POST /logout` | | le front quitte d'abord l'espace réservé (`useSignOut`) |
| `AuthGateway.requestPasswordReset` | `requestPasswordReset` | `POST /forgot-password` | `email` | réponse identique que l'adresse existe ou non |
| `AuthGateway.registerStudent` | `registerStudent` | `POST /register` | `StudentRegistration` | crée `utilisateur`, `etudiant`, `compte_points` **et connecte** l'étudiant ; refus `email-pris` ou `carte-prise` |
| `DepositGateway.submit` | `submitDeposit` | `POST /etudiant/depots` (multipart) | `DepositRequest` + fichiers photo | `{ref}` ; refus `depots-suspendus`, `creneau-pris` |
| `DepositGateway.cancel` | `cancelDeposit` | `DELETE /etudiant/depots/{ref}` | | `ANNULE`, créneau libéré (rendez-vous ou brouillon) |
| `DepositGateway.reschedule` | `rescheduleDeposit` | `PUT /etudiant/depots/{ref}/rendez-vous` | `day`, `slot` (voir section 9) | refus `creneau-pris` |
| `PaymentGateway.acquire` | `acquireItem` | `POST /etudiant/acquisitions` | `itemSlug`, `method`, `phone?` | espèces, ou points suffisants : `{status: "reserve", acquisitionRef}`, points débités tout de suite ; mobile : `{status: "en-attente", acquisitionRef, paymentRef, sentAt}`, annonce `RESERVEE` ; refus `objet-indisponible` |
| `PaymentGateway.awaitConfirmation` | `awaitPayment` | `GET /etudiant/paiements/{paymentRef}` (interrogation) ou diffusion temps réel | | `"confirme"` (points débités, mouvement `DEBIT_RETRAIT`) ou `"echoue"` ; la confirmation réelle vient des rappels Wave / Orange Money |
| `PaymentGateway.cancel` | `cancelPayment` | `DELETE /etudiant/acquisitions/{ref}` | | paiement en attente abandonné, annonce de nouveau `EN_LIGNE`, rien de débité |
| `WaiverGateway.sign` | `signWaiver` | `POST /partenaire/depots/{ref}/renoncement` | `signature` (PNG en data URL) | **session de l'agent** (tablette du comptoir) ; `{balanceAfter}` ; crée `renoncement` (empreinte SHA-256), mouvements `CREDIT_DEPOT` + `BONUS`, l'annonce (à photographier), dépôt `VALIDE`, `bonus_consomme + 1` |
| `WaiverGateway.decline` | `declineWaiver` | `POST /partenaire/depots/{ref}/renoncement/refus` | | l'étudiant refuse les deux prix : dépôt clos (`ANNULE`), rien de crédité |
| `ProfileGateway.updateContact` | `updateContact` | `PUT /profil` | `email`, `telephone`, `niveau?`, `ufr?` | refus si l'e-mail appartient à un autre compte |
| `ProfileGateway.changePassword` | `changePassword` | `PUT /profil/mot-de-passe` | `current`, `next` | `{ok}` (faux si le mot de passe actuel est faux) |
| `PartnerGateway.submitExpertise` | `submitExpertise` | `POST /partenaire/expertises` | `ExpertiseInput` | dépôt `EXPERTISE` ; le front ouvre la tablette de signature |
| `PartnerGateway.refuseDeposit` | `refuseDeposit` | `POST /partenaire/depots/{ref}/refus` | `reason` (code), `comment` | expertise `REFUSE`, dépôt `REFUSE` |
| `PartnerGateway.publishArticle` | `publishArticle` | `POST /partenaire/stock/{id}/mise-en-ligne` | | annonce `EN_LIGNE` |
| `PartnerGateway.handOver` | `handOver` | `POST /partenaire/acquisitions/{ref}/remise` | | `acquisition.retire_le`, `garantie_jusquau`, annonce `VENDUE` |
| `PartnerGateway.saveArticle` | `saveArticle` | `POST /partenaire/stock` (création) ou `PUT /partenaire/stock/{id}` | `ArticleInput` (+ photo) | `{id}` ; création : origine `STOCK_PARTENAIRE`, en ligne tout de suite |
| `PartnerGateway.withdrawArticle` | `withdrawArticle` | `POST /partenaire/stock/{id}/retrait` | `reason` | annonce `RETIREE` + ligne `RETRAIT_ANNONCE` au journal |
| `AdminGateway.setDepositsSuspended` | `setDepositsSuspended` | `PUT /admin/depots` | `suspended`, `reason` | ligne `SUSPENSION` ou `REPRISE` au journal |
| `AdminGateway.saveBonus` | `saveBonus` | `PUT /admin/bonus` | `rate` (en %), `quota`, `reason` | ligne `CONFIGURATION` au journal |
| `AdminGateway.adjustPoints` | `adjustPoints` | `POST /admin/ajustements` | `card`, `direction`, `amount`, `reason` | `{balanceAfter}` ; mouvement `AJUSTEMENT` signé + ligne `AJUSTEMENT_POINTS` au journal |

**Erreurs.** Avant tout envoi, le front lève une `RuleViolation` dont le `code` peut être :
- comptes et dépôts : `mot-de-passe-court`, `creneau-manquant`, `modele-manquant`, `signature-manquante`, `email-invalide`, `telephone-manquant` ;
- LBC et administration : `prix-incoherents`, `nom-manquant`, `prix-manquant`, `motif-manquant`, `bonus-invalide`, `ajustement-invalide`.

Le serveur simulé renvoie en plus des refus que seul le serveur peut constater : `email-pris`, `carte-prise`, `creneau-pris`, `depots-suspendus`, `objet-indisponible`, `depot-traite`, `solde-negatif`, `non-connecte`, `acces-refuse`. **Le back doit refaire tous les contrôles** et renvoyer des erreurs 422 par champ (format Laravel standard) ; avec Inertia, le front les lira dans `errors`.

---

## 7. Règles métier présentes des deux côtés

Le front les applique pour afficher et pour bloquer tôt ; **le back reste la source de vérité**. Fichiers : `wecce-front/src/domain/rules/`.

| Règle | Front | Valeur |
|---|---|---|
| Baisse mensuelle (fonte) | `points.ts` → `afterFonte(valeur, mois)` | 5 % le 1er de chaque mois, points **et** prix, arrondi à l'entier |
| Ce que le solde couvre | `points.ts` → `coverage(prix, solde)` | points d'abord, complément en francs |
| Crédit à la signature | `expertise.ts` → `creditAtSignature(reprise, taux)` | reprise + arrondi(reprise × taux / 100) |
| Prix cohérents | `expertise.ts` → `canSubmitPrices` | prix d'affichage ≥ reprise > 0 (comme la contrainte `prix_selon_decision`) |
| Marge pour la boutique | `expertise.ts` → `shopMargin`, `coverage.ts` → `realMargin` | (affichage − reprise) ÷ affichage |
| Niveau de couverture | `coverage.ts` → `coverageLevel` | < suspension : suspendu ; < surveillance : surveillance |
| Ajustement | `adjustment.ts` → `checkAdjustment` | montant > 0, motif ≥ 10 caractères, solde jamais négatif |
| Mot de passe | `account.ts` | 8 caractères au moins |
| Famille d'un mouvement | `movements.ts` | ajustement négatif = dépense |

---

## 8. Comment le front tourne aujourd'hui sans back : le serveur simulé

### 8.1 Le principe

Il n'y a plus de bandeau de démonstration ni d'« états » à choisir : l'application se comporte comme avec un vrai serveur. Les comptes se connectent, chaque rôle n'ouvre que son espace, et une action d'un compte se voit dans les autres. Tout le serveur simulé est dans `wecce-front/src/infrastructure/demo/` ; la couche `app/` le branche.

| Fichier | Rôle | Équivalent Laravel |
|---|---|---|
| `demo/db.ts` | Tables (`users`, `movements`, `deposits`, `articles`, `acquisitions`, `log`, `snapshots`, `config`), gardées dans `localStorage` (clé `wecce-demo-db`), synchronisées entre onglets | base de données |
| `demo/seed.ts` | Données de départ, produites en **rejouant le calendrier** du 1er septembre au 7 novembre 2026 avec les opérations de `engine.ts` (soldes = somme des mouvements, stock = dépôts repris, journal cohérent) | seeders |
| `demo/engine.ts` | Opérations métier : dépôt, annulation, expertise, refus, signature, mise en ligne, acquisition, paiement, remise, ajustement, suspension, bonus, baisse mensuelle, mesure de couverture | services / actions |
| `demo/queries.ts` | Lectures : ce que chaque contrôleur envoie en props (section 5), dates déjà rédigées | contrôleurs + API Resources |
| `demo/gateways.ts` | Adaptateurs des ports : vérifient le compte connecté et son rôle, appellent `engine.ts`, enregistrent, préviennent les écrans | routes + contrôleurs d'action |
| `demo/session.ts` | Compte connecté : `localStorage` si « Rester connecté », sinon `sessionStorage` (propre à l'onglet) | session / cookie |
| `demo/clock.ts` | Horloge et formats de date en français | Carbon, locale `fr` |
| `demo/credits.json` | Crédits des photos Wikimedia Commons (`public/img/`) | — |
| `app/routes.tsx` | Accès de chaque écran et props de sa page | routes `web.php` + middlewares |
| `app/App.tsx` | `ScreenHost` : contrôle d'accès, recalcul des props après chaque action | Inertia (rechargement des props) |
| `app/container.ts` | Choix des adaptateurs, session partagée | `HandleInertiaRequests` |

### 8.2 Les comptes

Mot de passe de tous les comptes : **`wecce2026`** (démonstration seulement : le serveur simulé garde le mot de passe en clair, Laravel stockera un hachage).

| Compte | Rôle | Ce qu'il contient au départ |
|---|---|---|
| `moussa.diallo@exemple.sn` · Moussa Diallo, carte 2024-1183 | étudiant | 32 490 pts ; Redmi Note 8 repris le 14 sept. ; Tecno Camon 12 refusé ; casque annulé ; **rendez-vous aujourd'hui à 10 h 30** (Lenovo IdeaPad 3, WC-2026-0634) ; un brouillon (disque dur, WC-2026-0655) |
| `aissatou.sarr@exemple.sn` · Aïssatou Sarr, 2023-0871 | étudiante | Galaxy A32 repris ce matin |
| `ismaila.ndiaye@exemple.sn` · Ismaïla Ndiaye, 2025-0213 | étudiant | un ajustement de + 2 000 pts au journal, écouteurs refusés ce matin |
| `fatou.diop@exemple.sn` · Fatou Diop, 2024-0456 | étudiante | iPhone 11 réservé (espèces, AQ-2026-1185), rendez-vous à 14 h |
| sept autres étudiants (`prenom.nom@exemple.sn`, sans accents) | étudiants | dépôts repris en septembre et octobre, rendez-vous à venir |
| `comptoir1@lbc.exemple.sn` · Awa Ndiaye, comptoir 1 | agente LBC | autorisée à expertiser |
| `admin@wecce.exemple.sn` · Ibrahima Fall | administrateur | portée globale |

### 8.3 Ce que le serveur simulé fait

- **Date fixe** : le serveur vit le **samedi 7 novembre 2026** ; l'heure suit l'heure réelle, sans descendre sous 11 h. Les rendez-vous du jour, la baisse du 1er novembre et la prochaine baisse (décembre) restent donc cohérents quel que soit le jour d'ouverture.
- **Créneaux** : 8 créneaux de 9 h 30 à 16 h 30, du lundi au samedi (LBC fermé le dimanche), sur les 4 prochains jours d'ouverture. Un créneau pris ou déjà passé est indisponible.
- **Délai réseau** : chaque action répond après environ 450 ms.
- **Paiement mobile** : toujours accepté, confirmé **au bout de 3,2 s**. Espèces, ou points suffisants : réservé tout de suite.
- **Bonus de lancement** : 20 % sur les 100 premiers dépôts ; 15 déjà bonifiés au départ.
- **Couverture** : calculée en direct (articles à photographier, en ligne et réservés face aux soldes des étudiants) ; les dépôts sont suspendus automatiquement sous 110 %, ou à la main par l'administration.
- **Contrôle des soldes** : calculé en direct (solde enregistré face à la somme des mouvements).
- **Repartir des données de départ** : `localStorage.removeItem("wecce-demo-db")` dans la console, puis recharger ; ou augmenter `DB_VERSION` dans `db.ts`.

### 8.4 Ce qui n'est pas simulé

| Sujet | Aujourd'hui | Au branchement |
|---|---|---|
| Photos | lues en data URL, gardées dans le navigateur (si le stockage est plein, en mémoire seulement) | envoi multipart, stockage Laravel, le front reçoit des URL |
| Mot de passe oublié | répond toujours « lien envoyé », n'envoie rien | e-mail de réinitialisation Laravel |
| Paiement Wave / Orange Money | confirmé tout seul ; jamais d'échec (la vue « Le paiement n'a pas abouti » existe mais n'est pas atteinte) | rappels des prestataires, rapprochement |
| Fin de réservation (3 jours) | rien ne se passe à l'échéance | tâche planifiée : remettre l'objet sur le marché |
| Baisse mensuelle | jouée dans les données de départ (1er octobre, 1er novembre) ; pas de nouvelle baisse | tâche planifiée du 1er du mois |
| Mesures de couverture | hebdomadaires dans les données de départ, puis la mesure du jour | tâche planifiée du matin, table `snapshot_couverture` |
| Adresse IP du journal | toujours « 41.82.••.•• » | IP réelle, masquée à l'affichage |

### 8.5 Brancher le back, étape par étape

1. Écrire `src/infrastructure/inertia/` : un adaptateur par port, avec `router.post()` / `router.put()` / `router.delete()` d'`@inertiajs/react` vers les routes de la section 6.
2. Dans `src/app/container.ts`, remplacer `demoPorts` par ces adaptateurs, et `currentSession()` par `usePage().props.auth`.
3. Faire envoyer par chaque contrôleur les props de la section 5, avec des API Resources en camelCase ; reprendre les formats de `queries.ts` et `clock.ts`.
4. Remplacer le contrôle d'accès de `App.tsx` par les middlewares Laravel ; remplacer React Router par Inertia : `AppLink`, `useGo`, `useCurrentPath`, `useSignOut` (`presentation/components/ui/AppLink.tsx`, `presentation/lib/navigation.ts`, `presentation/hooks/useSignOut.ts`) ; `PageTitle` devient `<Head>`.
5. Supprimer `src/infrastructure/demo/`, et les lectures `server.*` de `app/routes.tsx`.
6. Lancer `npm run lint` : la règle des dépendances signale tout import oublié vers la démo.

---

## 9. Écarts à trancher entre le front et le schéma

| # | Écart | Proposition |
|---|---|---|
| 1 | Pas de `slug` sur `annonce` ; le front en utilise un dans l'adresse des fiches. | Utiliser `annonce.id` (UUID) dans l'adresse, ou ajouter `annonce.slug`. |
| 2 | Pas de référence lisible sur `acquisition` (le front affiche `AQ-2026-1186`). | Ajouter `acquisition.reference VARCHAR(16) UNIQUE`. |
| 3 | `statut_depot.EXPERTISE` : le front l'utilise pour « prix fixés, signature attendue » (`a-signer`). Le refus des prix par l'étudiant au comptoir clôt le dépôt en `ANNULE`. | Confirmer ce sens d'`EXPERTISE`, ou ajouter un statut ; distinguer éventuellement « annulé par l'étudiant » et « prix refusés au comptoir ». |
| 4 | Les points vérifiés à l'examen (`InspectionCheck` : écran, batterie, comptes…) ne sont stockés nulle part. | Ajouter `expertise.controles JSONB` (libellé et résultat). |
| 5 | `motif_refus` est un texte libre ; le front envoie un code parmi 4. | Garder le code dans `motif_refus` (`ecran`, `compte`, `batterie`, `modele`) ou créer une table des motifs. Les 4 motifs sont **à trancher avec LBC**. |
| 6 | Les créneaux de rendez-vous n'ont pas de modèle : le front envoie des rangs (`day`, `slot`). | Le back envoie des créneaux avec un horodatage, et le front renvoie cet horodatage. Adapter `DepositRequest` et `reschedule` ensemble. |
| 7 | `Agent.poste` (« Comptoir 1 ») et `MarketItem.detail` n'ont pas de colonne. | Ajouter `agent.poste` et `appareil.precision`, ou les retirer de l'interface. |
| 8 | `statut_compte` contient `DORMANT` et `CLOTURE`, alors que la décision produit est qu'**aucun compte n'est clôturé d'office et que les points n'expirent pas** (PRODUCT.md). | Retirer `CLOTURE` du flux automatique (tâche `CloturerComptesDormants` d'ARCHITECTURE.md). |
| 9 | Les tâches automatiques (`ScheduledTask`) n'ont pas de table. | Table `execution_tache` (nom, début, fin, résultat), ou lecture des journaux du planificateur. |
| 10 | Le schéma n'a pas de tranche d'âge « 3 à 4 ans » : `PLUS_4ANS` suit `2_3ANS`. | Ajouter `3_4ANS` ou renommer l'option dans l'interface. |
| 11 | Photos : le front lit des data URL ; la base attend `photo.url`. | Envoi multipart, stockage Laravel (`storage/`), le front reçoit des URL. |
| 12 | Les listes de niveaux et d'UFR sont écrites en dur dans le front (`domain/referentials/ugb.ts`). | À confirmer avec l'UGB ; éventuellement servies par le back. |
| 13 | Seuils de couverture (120 % / 110 %), garantie (3 mois, tranchée par LBC), délai de retrait (3 jours) : valeurs provisoires. | **À trancher avec LBC** ; le front les marque d'un soulignement pointillé (composant `Tbd`). |
| 14 | Jours et heures d'ouverture de LBC : le front suppose lundi à samedi, 9 h 30 à 16 h 30 (créneaux de la maquette). | **À confirmer avec LBC** ; idéalement une table des créneaux. |
| 15 | La maquette écrit « Vendredi 7 novembre » ; le 7 novembre 2026 est un **samedi**. Le front affiche les vrais jours. | Rien à faire côté back ; la maquette garde ses textes d'exemple. |
