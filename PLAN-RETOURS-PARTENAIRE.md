# Retours du partenaire LBC : évaluation et plan

Retours remontés par LBC (Yakhya, comptoir 1) après essai de l'application.
Ce document dit, pour chaque demande, ce que fait le code aujourd'hui, ce qui change,
et les choix faits par défaut quand la demande laissait une marge.

Runtime de référence : **Laravel + Inertia** (`app/`, `routes/web.php`, `wecce-front/src/presentation`).
Le serveur simulé du navigateur (`wecce-front/src/infrastructure/demo`) n'est que maintenu compilable.

---

## 1. Évaluation

| # | Demande | Constat dans le code | Gravité |
|---|---|---|---|
| 1 | Garantie de 3 mois | `duree_garantie_jours = 7` (schéma et seeder) ; « 7 jours » écrit en dur dans la FAQ, la fiche objet, le bon de retrait, l'accueil | Simple |
| 2 | LBC valide les achats par points | Un achat en points ou en espèces passe directement à `RESERVE` et débite les points sans que LBC ne voie rien | Métier |
| 3 | LBC valide la remise de l'objet | L'action `handOver` existe mais n'est accessible que dans une ligne du catalogue, noyée dans la page Statistiques | Métier + UI |
| 4 | Limiter les bonus | Seuls un taux et un quota global existent, sans borne : l'admin peut saisir 100 %, un même étudiant peut cumuler le bonus sur tous ses dépôts, sans plafond en points | Métier |
| 5 | Interface partenaire moche | Coque beige pâle, pages faites de tableaux, aucun graphique, aucun tableau de bord ; l'espace étudiant a de gros chiffres, la pastille moutarde, des graphiques | Design |
| 6 | Filtres temporels qui ne marchent pas | (a) Rendez-vous : seulement « Hier / Aujourd'hui / Demain », impossible de choisir une date ou de voir la semaine. (b) Statistiques : les données de démonstration s'arrêtent au 11 novembre, donc « Aujourd'hui » et « 7 jours » affichent 0 sans explication ; « Étudiants actifs » et le catalogue ne suivent pas la période | Bug + UX |
| 7 | LBC fixe le jour et l'heure | L'étudiant choisit lui-même un créneau dans une grille ; LBC subit | Métier |
| 8 | Échange direct, sans mise en vente | Une reprise crée toujours des points **et** une annonce destinée au marché | Métier |
| 9 | Onglet Stock | `/partenaire/stock` redirige vers `Statistiques#catalogue` ; pas de vue des remises, pas de « mettre hors ligne » | UI + métier |
| 10 | Tableaux de bord colorés | Aucun écran d'accueil partenaire : on arrive sur une table de rendez-vous | Design |

## 2. Choix faits par défaut (à confirmer avec LBC)

- **Garantie** : 90 jours, réglable (`duree_garantie_jours`), affichée partout depuis la configuration.
- **Bonus** : taux plafonné à 20 %, **un seul bonus par étudiant**, **plafond de 5 000 points par dépôt**, quota global plafonné à 500 dépôts. Plafond et règle « un par étudiant » réglables par l'administration.
- **Validation des achats** : tout achat passe par « À valider par LBC ». Les points ne sont débités qu'à la validation ; en attendant ils sont bloqués (le solde disponible pour un autre achat les exclut). L'étudiant peut annuler tant que LBC n'a pas validé. Un refus remet l'objet en ligne ; si un complément Wave/Orange Money était déjà payé, LBC est prévenu qu'il faut le rembourser.
- **Rendez-vous** : l'étudiant envoie une **demande** avec ses disponibilités (jours, matin/après-midi, mot libre). LBC fixe le jour et l'heure ; l'étudiant voit le rendez-vous dans « Mes dépôts » et peut demander un autre créneau, ce qui renvoie la demande à LBC. Un rendez-vous manqué redevient une demande.
- **Échange direct** : à l'expertise, LBC choisit le **mode de reprise** :
  1. *Points et mise en vente sur Wecce* (actuel) ;
  2. *Échange contre des points* : l'étudiant reçoit ses points, l'objet reste en boutique, **hors marché** ;
  3. *Échange contre un objet de la boutique LBC* : aucun point crédité ; l'étudiant repart avec un objet du catalogue LBC (choisi dans la liste) ou décrit librement. L'objet déposé reste en boutique, hors marché.
  Dans les trois cas l'étudiant signe le renoncement. LBC peut ensuite mettre en ligne (ou retirer du marché) un objet depuis l'onglet Stock.
- **Couverture** : un objet gardé en boutique hors marché ne couvre pas la dette (les étudiants ne peuvent pas le prendre) ; il est montré à part.

## 3. Plan d'exécution

Toutes les étapes sont faites (novembre 2026) ; 9 tests de bout en bout couvrent les nouveaux parcours.

| Étape | Contenu | Fichiers principaux |
|---|---|---|
| 0 | Migration additive : `depot.disponibilites`, `depot.rdv_fixe_le`, `expertise.mode_reprise`, `expertise.contrepartie_*`, `configuration_plateforme.bonus_plafond_points`, `bonus_un_par_etudiant` ; valeurs d'énumération `RDV_DEMANDE` et `EN_BOUTIQUE` ; garantie par défaut à 90 jours | `database/migrations/*` |
| 1 | Garantie 3 mois partout | moteur, seeder, FAQ, fiche, bon de retrait |
| 2 | Bonus limités | `CrediterDepot`, `WecceEngine::saveBonus`, `BonusControl` |
| 3 | Achat : à valider → réservé → remis ; actions LBC « Valider », « Refuser », « Confirmer la remise » | `WecceEngine`, `PartenaireController`, `EtudiantController`, `Prendre` |
| 4 | Demande de rendez-vous côté étudiant ; planification côté LBC | `Deposer`, `ChangerRendezVous`, `Depots`, `RendezVous` |
| 5 | Mode de reprise à l'expertise et renoncement adapté | `PricesPanel`, `Expertise`, `Renoncement`, `WecceEngine::sign` |
| 6 | Onglet **Stock** : *Achats à traiter*, *Dépôts à mettre en ligne*, *Catalogue boutique*, modification des objets | `partenaire/Stock`, `StockRow`, `Article` |
| 7 | Filtres temporels : rendez-vous par date (jour précédent/suivant, calendrier, vue semaine) ; statistiques entièrement filtrées, « dernière activité » quand la période est vide | `RendezVous`, `WecceQueries::statisticsPage` |
| 8 | Refonte visuelle : **tableau de bord** d'accueil coloré (tuiles moutarde/cobalt/vert, graphiques, tâches du jour), barre latérale sombre, statistiques en graphiques | `BackOfficeLayout`, `partenaire/Tableau`, `StatistiquesView` |
| 9 | Tests PHP de bout en bout, vérification de types, contrôle dans le navigateur | `tests/Feature/*` |

## 4. Ce qu'il reste à décider avec LBC

- Valeurs par défaut : garantie 90 jours, bonus plafonné à 5 000 points et un par étudiant (réglables dans le pilotage admin).
- Remboursement d'un complément Wave / Orange Money quand LBC refuse un achat déjà payé : l'application l'annonce à l'agent mais ne déclenche pas le remboursement (à faire par l'opérateur).
- Délai de réponse attendu de LBC sur une demande de rendez-vous (aucune relance automatique n'est envoyée à l'étudiant pour l'instant).
- Données de démonstration : elles s'arrêtent au 11 novembre 2026. Sans `WECCE_REFERENCE_DATE`, les périodes récentes (« 7 derniers jours ») sont vides ; les écrans l'expliquent et proposent d'aller à la dernière activité.
