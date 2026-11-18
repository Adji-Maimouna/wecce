# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

- **Maquette** : pages HTML/CSS statiques, une par écran, sans outil de build. Couleurs, tailles
  et espacements en variables CSS, pour être repris tels quels en jetons Tailwind. (Choix de
  l'utilisateur, 2026-11-05.)
- **Produit** : monolithe Laravel 11 + Inertia + React 18 + TypeScript + Tailwind, rendu côté
  serveur, PostgreSQL, un déploiement par campus. Voir `ARCHITECTURE.md`.

## Users

- **Étudiants de l'UGB** (Saint-Louis, Sénégal). Ils ouvrent le site sur leur téléphone, souvent
  sur un réseau lent. Ils veulent se défaire d'un appareil électronique qui ne leur sert plus et
  repartir avec autre chose, sans passer trois semaines à le vendre eux-mêmes sur WhatsApp.
  Ils déposent, prennent, et complètent parfois en argent.
- **Le partenaire : LBC (Leye Business Company)**, boutique située sur le campus de l'UGB,
  entre les villages E et F. (Confirmé par l'utilisateur le 2026-11-06.)
- **L'agent du partenaire**, au comptoir de LBC. Il reçoit l'étudiant au rendez-vous,
  examine l'appareil devant lui, saisit l'état constaté et les deux prix, accepte, reprend en
  pièces ou refuse, puis fait signer le renoncement.
- **Le partenaire** (gérant de la boutique). Il porte le stock, le local et la dette en points ;
  il surveille la couverture de la dette par le stock.
- **L'administrateur** de la plateforme. Il suspend ou rouvre les dépôts, ajuste un solde avec
  un motif, règle le bonus de lancement ; chaque action est journalisée.

## Product Purpose

Wecce permet aux étudiants de déposer un objet électronique, de recevoir des points, et de
prendre un autre objet avec ces points — la boutique partenaire étant le point de passage
physique et le garant de la valeur.

Le mot « échange » sert à parler aux étudiants ; le mécanisme réel est un **dépôt-vente qui
paie en bons d'achat**. Le troc direct a été écarté : sur un campus, il n'arrive presque jamais
que deux étudiants veuillent chacun l'objet de l'autre au même moment.

Réussite : les objets tournent, la dette en points reste couverte par la valeur du stock, et le
campus fait confiance aux prix.

## Positioning

- **Tout ce qui est visible sur le marché est réel** : vérifié en boutique et physiquement
  disponible. Aucun objet n'est publié avant l'expertise.
- **Les deux prix sont annoncés avant la signature** : la valeur de reprise (les points
  crédités) et le prix d'affichage (ce que paiera le suivant). L'écart est la rémunération du
  partenaire et couvre l'expertise, le stockage et la garantie.
- **La fonte parallèle** : les points et les prix affichés baissent au même rythme chaque mois,
  si bien que le pouvoir d'achat de l'étudiant ne change pas.
- Face à la vente entre particuliers : moins d'argent, mais tout de suite, garanti, et on
  repart avec un appareil le jour même.

## Operating Context

Parcours d'un dépôt :

1. **En ligne** — l'étudiant décrit l'appareil (catégorie, modèle, âge, état, photos) et indique
   librement son **prix souhaité**. Ce souhait n'est visible que de lui et du partenaire ; il
   n'apparaît jamais sur le marché. Il prend rendez-vous.
2. **Expertise en boutique** — obligatoire. L'agent examine l'appareil devant l'étudiant et
   saisit **les deux prix**. Trois décisions : accepté, accepté en pièces (appareil trop vieux
   pour repartir entier), refusé avec motif.
3. **Renoncement** — signé sur place. L'appareil n'appartient plus à l'étudiant ; ses points
   sont crédités immédiatement. Pas de délai de rétractation : la vente n'est pas à distance.
4. **Mise en ligne** — l'objet apparaît sur le marché avec son prix d'affichage.
5. **Utilisation des points** — tout de suite ou plus tard. Si les points ne suffisent pas,
   l'étudiant paie le complément par Wave, Orange Money ou en espèces en boutique, puis retire
   l'objet en boutique.

Rituels : le 1er de chaque mois, les points et les prix affichés baissent ensemble de 5 % ; le
partenaire ouvre la plateforme avec 30 à 50 articles de sa propre boutique ; un bonus de
lancement crédite + 20 % de points aux 100 premiers dépôts (jamais de prime en argent).

**Aucun compte n'est clôturé d'office, et les points n'expirent pas.** (Décision de
l'utilisateur, 2026-11-05 : elle remplace l'échéance de 12 mois du document de besoins et la
tâche `CloturerComptesDormants` d'ARCHITECTURE.md.)

## Capabilities and Constraints

- **Électronique uniquement** : téléphones, ordinateurs, tablettes, audio, pièces et composants.
- **La plateforme n'estime rien.** Pas de barème, pas de décote, pas de fourchette. Le dernier
  mot revient au partenaire. Plus tard, et seulement avec assez d'historique, le site pourra
  afficher un fait constaté (« les 8 derniers téléphones de 2 ans en bon état ont été repris
  entre 26 000 et 34 000 points »).
- **L'agent saisit les deux prix** à l'expertise ; le prix d'affichage ne peut pas être
  inférieur à la valeur de reprise. (Confirmé le 2026-11-05.)
- **1 point = 1 franc CFA.** Les points sont une dette du partenaire envers les étudiants ;
  chaque mouvement est journalisé et le solde se justifie ligne à ligne.
- **Baisse mensuelle de 5 %**, appliquée le même jour aux points et aux prix affichés.
  (Confirmé le 2026-11-05.)
- **Couverture** : points en circulation face à la valeur du stock, en trois niveaux (ouvert,
  surveillance, suspendu). Sous le seuil, les dépôts sont suspendus.
- **Commission des développeurs** sur les compléments en argent (taux fixé par contrat, hors de
  ce dépôt ; paramètre de configuration), prélevée sur le transfert avant reversement au
  partenaire. L'étudiant paie exactement le complément manquant, sans frais ajoutés.
- **Multi-campus** : un déploiement par campus ; rien de propre à l'UGB ou au partenaire n'est
  codé en dur.
- Pas d'application mobile : un site web, pensé d'abord pour le téléphone.

Décisions encore ouvertes (§11 du document de besoins) :

- les critères de refus précis ;
- le stock d'amorçage (nombre, gammes, prix) ;
- le seuil de couverture qui suspend les dépôts ;
- ~~la durée de la garantie boutique~~ : tranchée, 3 mois (retour LBC de novembre 2026) ;
- le calendrier, le budget et le cadre contractuel.

## Brand Commitments

- **Nom : Wecce** (wolof, « échanger »).
- **Langue : français.** Le site **vouvoie** l'étudiant sur tous les écrans. (Confirmé le
  2026-11-05.)
- **Écriture sobre** (demandé le 2026-11-07, « les textes font IA ») : des phrases courtes qu'on
  dirait au comptoir. Chaque phrase apporte une information absente du titre ou du bouton voisin ;
  un fait n'est dit qu'une fois par écran. Refusés : les phrases bâties sur deux-points
  explicatifs, les formules rassurantes (« Rien n'est caché », « Pas de mauvaise surprise »), les
  énumérations en trois temps, les questions rhétoriques, les « Ce n'est pas X : c'est Y », les
  sous-titres qui répètent le titre, les métaphores.
- **Transparence avant tout** : l'écart entre les deux prix est annoncé avant la signature, en
  ces termes : « Nous reprenons votre appareil à 30 000 points. Il sera proposé à 40 000 points.
  La différence couvre l'expertise, le stockage et la garantie. »

## Evidence on Hand

- Le document de besoins (mécanisme, deux prix, fonte, démarrage, points ouverts), tenu hors de
  ce dépôt.
- `GUIDE-FRONT-BACK.md` — les noms partagés entre le front et le back, les écrans, les actions.
- `ARCHITECTURE.md` — pile et décisions techniques arrêtées.
- `wecce-schema.sql`, `wecce-classes-simplifie.puml`, `wecce-diagramme-simplifie.svg` — modèle
  de données.

Absents, à ne pas inventer comme s'ils étaient réels : logo de LBC, horaires et téléphone de la
boutique, photos de la boutique ou des appareils, logo Wecce, prix réels, statistiques d'usage,
témoignages. Les
montants du document (30 000 / 40 000) sont des exemples, et toute donnée de démonstration doit
rester reconnaissable comme telle.

## Product Principles

1. **Ce qui est affiché est vrai.** Un objet en ligne est vérifié et en boutique ; un solde se
   justifie ligne à ligne.
2. **Annoncer avant, jamais faire découvrir après.** Les deux prix, la fonte et l'absence de
   rétractation sont dits avant que l'étudiant s'engage.
3. **La plateforme ne promet aucun prix.** Elle transmet le souhait de l'étudiant ; le
   partenaire tranche devant lui.
4. **Parler en pouvoir d'achat, pas en pourcentage.** La fonte s'explique par ce que l'étudiant
   peut encore prendre, pas par un chiffre qui baisse.

## Accessibility & Inclusion

Réseau lent et téléphones : la page doit afficher un prix utile avant que le JavaScript soit
chargé (rendu côté serveur). Aucune norme d'accessibilité particulière n'a été fixée.
