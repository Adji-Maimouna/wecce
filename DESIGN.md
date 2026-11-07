---
name: Wecce
description: Échange d'électronique par points pour les étudiants de l'UGB, avec la boutique LBC du campus.
colors:
  moutarde: "#e1ac10"
  moutarde-profonde: "#a87c06"
  moutarde-survol: "#f0c235"
  cobalt: "#24338f"
  cobalt-survol: "#1b276f"
  cobalt-teinte: "#e9ebf6"
  cobalt-teinte-2: "#f3f4fa"
  cobalt-texte-doux: "#cfd3ec"
  encre: "#1c1a14"
  encre-2: "#3a3730"
  encre-douce: "#6a6863"
  noir-chaud: "#111111"
  fond: "#ffffff"
  fond-secondaire: "#f5f3ee"
  creux: "#ebe8e0"
  fond-sombre: "#1c1a14"
  surface-sombre: "#292721"
  texte-sombre-doux: "#a09f9c"
  filet: "#e2e0da"
  filet-fort: "#c9c6be"
  reussite: "#1d7a3e"
  reussite-teinte: "#e2f2e6"
  attente: "#8a6100"
  attente-teinte: "#f6ecc9"
  refus: "#b42318"
  refus-teinte: "#fde7e4"
  info: "#24338f"
  info-teinte: "#e9ebf6"
typography:
  hero:
    fontFamily: "Bricolage Grotesque, Figtree, system-ui, sans-serif"
    fontSize: "4.75rem"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.045em"
  display:
    fontFamily: "Bricolage Grotesque, Figtree, system-ui, sans-serif"
    fontSize: "2.125rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Bricolage Grotesque, Figtree, system-ui, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.015em"
  price:
    fontFamily: "Bricolage Grotesque, Figtree, system-ui, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
    fontFeature: "tnum"
  title:
    fontFamily: "Figtree, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: "Figtree, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Figtree, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.4
rounded:
  xs: "2px"
  sm: "8px"
  tag: "10px"
  md: "12px"
  lg: "18px"
  facade: "24px"
  xl: "30px"
  pill: "999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "20px"
  lg: "28px"
  xl: "40px"
  xxl: "52px"
  section: "112px"
components:
  button-primary:
    backgroundColor: "{colors.cobalt}"
    textColor: "{colors.fond}"
    rounded: "{rounded.pill}"
    padding: "0 20px"
    height: "44px"
  button-primary-on-dark:
    backgroundColor: "{colors.moutarde}"
    textColor: "{colors.noir-chaud}"
    rounded: "{rounded.pill}"
    padding: "0 20px"
    height: "44px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.encre}"
    rounded: "{rounded.pill}"
    padding: "0 20px"
    height: "44px"
  nav:
    backgroundColor: "{colors.fond}"
    textColor: "{colors.encre}"
    height: "68px"
  footer:
    backgroundColor: "{colors.fond-sombre}"
    textColor: "{colors.fond}"
  chip:
    backgroundColor: "{colors.fond}"
    textColor: "{colors.encre-2}"
    rounded: "{rounded.pill}"
    padding: "0 14px"
    height: "38px"
  chip-selected:
    backgroundColor: "{colors.cobalt-teinte}"
    textColor: "{colors.cobalt}"
  input:
    backgroundColor: "{colors.fond}"
    textColor: "{colors.encre}"
    rounded: "{rounded.md}"
    padding: "10px 12px"
    height: "44px"
  card-produit:
    backgroundColor: "{colors.fond}"
    rounded: "{rounded.lg}"
    padding: "18px 18px 20px"
  badge-solde:
    backgroundColor: "{colors.moutarde}"
    textColor: "{colors.noir-chaud}"
    rounded: "{rounded.pill}"
    height: "36px"
---

# Design System: Wecce

## Overview

**Creative North Star: « Le comptoir qui montre ses comptes »**

Wecce se lit comme un bon marché en ligne d'occasion vérifiée : des fiches nettes, de vraies photos d'appareils, un état lisible d'un coup d'œil. Ce qui le distingue tient dans ses comptes : chaque prix montré à un étudiant dit aussi ce qu'il lui coûte avec son solde, et chaque solde se justifie ligne à ligne.

Les couleurs suivent la palette « mustard-field » du skill taste, choisie par l'utilisateur (moutarde et cobalt) : une interface surtout neutre, une encre presque noire et chaude, la moutarde comme champ de marque, et le cobalt comme couleur d'action. La couleur vient aussi des photos. La moutarde porte les bandeaux (ouverture de l'accueil, page d'entrée, tête du marché) et marque les points : pastille de solde, jauge, étape en cours, onglet actif, point du logo. Le cobalt porte ce qu'on peut faire : le bouton plein, les liens, le focus, les sélections, et la ligne des prix dans les graphiques. Le mouvement suit Material 3.

Historique : le 2026-11-06, la moutarde seule avec des boutons en encre a été jugée « mieux mais moins colorée » ; le 2026-11-07, l'utilisateur a demandé de remettre des touches de moutarde et de cobalt.

**Key Characteristics:**
- Blanc, encre chaude, gris chaud ; la moutarde pour la marque et les points, le cobalt pour l'action.
- Bouton plein en cobalt sur fond clair et sur la moutarde, en moutarde sur fond sombre.
- Bricolage Grotesque pour les titres et les prix, Figtree pour le texte.
- La jauge points et francs sous chaque prix, qui se remplit à l'arrivée.
- Le tiroir de l'accueil : de vraies photos d'appareils avec leur étiquette de reprise.
- Le mouvement répond et célèbre : onde au clic, notifications à ressort, éclats quand des points sont crédités.

## Colors

Trois tons neutres, la moutarde pour la marque et les points, le cobalt pour l'action.

### Primary
- **Moutarde** (#e1ac10) : le champ de marque. Un bandeau par page au plus (ouverture de l'accueil, panneau de la page d'entrée et de la connexion, tête du marché) ; ailleurs, les repères des points : pastille de solde de la barre haute, jauge, numéros d'étapes et étape en cours, trait sous l'onglet actif, point du logo, pastille « Dans mon solde », compteurs de la barre latérale, et boutons sur fond sombre (texte noir chaud #111111). Survol en #f0c235.
- **Moutarde profonde** (#a87c06) : les petites icônes moutarde sur fond clair.

### Secondary
- **Cobalt** (#24338f, survol #1b276f) : la couleur d'action. Le bouton plein (un seul par vue), la porte « Se connecter », les liens, l'anneau de focus, les champs actifs, les puces, segments, créneaux et choix sélectionnés (teinte #e9ebf6, texte cobalt), l'entrée active de la barre latérale, la ligne des prix et du stock dans les graphiques, les hachures des francs dans la jauge, le repère LBC du plan, les badges et messages d'information. Contraste : blanc sur cobalt 10:1, cobalt sur moutarde 5,8:1.

### Neutral
- **Encre** (#1c1a14) : tout le texte, les titres, les montants.
- **Encre 2** (#3a3730) et **encre douce** (#6a6863) : texte secondaire, libellés.
- **Fond** (#ffffff), **fond secondaire** (#f5f3ee : barre latérale, sections alternées), **creux** (#ebe8e0 : pistes de jauge).
- **Fond sombre** (#1c1a14) et **surface sombre** (#292721) : section des deux prix, tiroir, pied de page. Jamais deux blocs sombres l'un contre l'autre. Texte blanc, texte doux #a09f9c.
- **Filet** (#e2e0da) et **filet fort** (#c9c6be).

### États
- **Réussite** (#1d7a3e sur #e2f2e6), **Attente** (#8a6100 sur #f6ecc9), **Refus** (#b42318 sur #fde7e4), seulement là où ils portent un état. **Info** en cobalt (#24338f sur #e9ebf6).

### Named Rules
**The Two Roles Rule.** La moutarde dit « marque et points », le cobalt dit « action ». On ne les échange jamais : pas de bouton moutarde sur fond clair, pas d'aplat cobalt en bandeau.

**The One Band Rule.** Un seul grand aplat moutarde par page au plus ; ailleurs, de petits repères. Le cobalt ne remplit qu'un bouton par vue ; les sélections sont en teinte.

## Typography

**Display Font:** Bricolage Grotesque (avec Figtree, system-ui)
**Body Font:** Figtree (avec system-ui)

**Character:** une grotesque ronde et joueuse, très grasse sur l'accueil, pour les titres et les prix ; une sans-serif amicale pour tout le reste. Paire tirée par le skill taste.

### Hierarchy
- **Hero** (800, jusqu'à 4,75 rem, 1) : titre de l'accueil seulement.
- **Display** (600, 2,125 rem) : titre de chaque écran ; titres de section de l'accueil en 800 jusqu'à 3 rem.
- **Headline** (600, 1,375 rem), **Price** (700, 1,375 rem, chiffres tabulaires), **Title** (600, 1,125 rem), **Body** (400, 1 rem, 1,55), **Label** (600, 0,875 rem).

### Named Rules
**The Tabular Money Rule.** Tout montant est en chiffres tabulaires, avec une espace fine comme séparateur de milliers. Les montants s'écrivent en encre : la couleur est dans la jauge, pas dans le chiffre.

**The No Caps Rule.** Aucun libellé en capitales, aucun surtitre au-dessus d'un titre.

## Layout

Conteneur de 1248 px au plus, gouttière de 16 px sur téléphone et 24 px à partir de 768 px. Barre haute blanche de 68 px avec un filet, la même partout. Écrans étudiants : grille de fiches à 4 colonnes, barre d'onglets en bas sous 900 px. Boutique et administration : barre latérale sur fond secondaire. Accueil : une idée par section, 112 px de marge verticale, alternance blanc, fond secondaire et fond sombre ; la dernière section est claire, pour que le pied de page sombre se détache.

## Elevation & Depth

Plat, à couches tonales. Les panneaux se détachent par un filet d'un pixel. Les ombres signalent ce qui flotte ou répond : fiche survolée, notifications, infobulles, et la profondeur du tiroir de l'accueil.

### Shadow Vocabulary
- **Survol de fiche** (`box-shadow: 0 12px 30px rgb(18 20 32 / 0.13)`).
- **Flottant** (`box-shadow: 0 12px 32px rgb(0 0 0 / 0.18)`).
- **Photo posée** (`box-shadow: 0 18px 32px rgb(0 0 0 / 0.42)`).

## Shapes

Pilule pour les boutons, puces, recherche, pastille de solde et navigation latérale ; 12 px pour les champs ; 18 px pour les panneaux et fiches ; 30 px pour le tiroir et le plan du campus.

## Components

### Buttons
- **Primary:** pilule cobalt, texte blanc (aussi sur le bandeau moutarde) ; en moutarde sur fond sombre. Un seul bouton plein par vue.
- **Ghost:** transparent, filet, texte encre (blanc sur fond sombre).
- **Interaction:** monte de 1 px au survol ; au clic, une onde part du point touché, puis un léger rebond.

### Navigation
- **Barre haute :** blanche, filet dessous, trait moutarde sous la page courante qui s'étire au survol, recherche en pilule grise (bordure cobalt au focus), pastille de solde en moutarde.
- **Barre latérale :** fond secondaire, entrée active en pastille blanche, texte et icône cobalt ; compteur en moutarde.
- **Pied de page :** fond sombre, titres de colonnes en moutarde, adresse de LBC.

### Jauge points et francs
Piste de 8 px : la part couverte par le solde en moutarde, le reste en hachures cobalt (les francs à compléter). Dessous, en clair : « Dans votre solde » ou « 32 490 pts + 9 510 F ».

### Tiroir de l'accueil
Sur le bandeau moutarde, un tiroir sombre ouvert, de vraies photos d'appareils posées en léger désordre, chacune avec une étiquette blanche : le montant repris et la date. Des reprises constatées, jamais des estimations.

### Mouvement (Material 3)
Courbes standard `cubic-bezier(.2, 0, 0, 1)` et entrée accentuée `cubic-bezier(.05, .7, .1, 1)`, ressort `linear(...)` pour les notifications et le relâchement des boutons ; transitions entre pages ; éclats moutarde, cobalt et encre pour célébrer ; tout s'arrête en mouvement réduit.

## Do's and Don'ts

### Do:
- **Do** garder l'interface neutre et laisser les photos apporter la couleur.
- **Do** réserver la moutarde aux bandeaux, aux repères des points et aux boutons sur fond sombre ; le cobalt à l'action.
- **Do** afficher la jauge points et francs partout où un prix côtoie le solde.
- **Do** nommer LBC et son adresse sur le campus partout où l'étudiant doit se déplacer.

### Don't:
- **Don't** ajouter une troisième couleur, ni des nuances de moutarde ou de cobalt différentes.
- **Don't** mettre plus d'un aplat moutarde par page, ni un aplat cobalt ailleurs que dans le bouton plein et la porte « Se connecter ».
- **Don't** afficher une estimation, une fourchette ou une décote, ni la commission à l'étudiant.
- **Don't** cacher un contenu en attendant le défilement : il reste lisible, il se pose seulement.
