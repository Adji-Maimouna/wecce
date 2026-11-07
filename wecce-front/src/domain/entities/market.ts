export type Category = "tel" | "ordi" | "tab" | "audio" | "piece";

/** État d'un appareil entier, ou d'une pièce détachée. */
export type Condition = "comme-neuf" | "bon" | "use" | "fonctionnel" | "defectueux";

export type Photo = { src: string; alt: string; width: number; height: number };

/** Objet en vente sur le marché (table annonce). */
export type MarketItem = {
  slug: string;
  name: string;
  /** Mots-clés pour la recherche (marque, type). */
  keywords: string;
  category: Category;
  /** Prix du jour, en points. */
  price: number;
  /** Photo prise au comptoir ; absente tant que LBC ne l'a pas ajoutée. */
  photo?: Photo;
  condition: Condition;
  /** Capacité de batterie restante, en %. */
  battery?: number;
  /** Détail affiché à côté de l'état (« Âge inconnu », « Ne démarre pas »). */
  detail?: string;
  /** Rang d'arrivée sur le marché (tri « Plus récents »). */
  order: number;
  /** Déposé par l'étudiant connecté. */
  mine?: boolean;
  reserved?: boolean;
};

/** Un point vérifié par la boutique à l'examen. */
export type InspectionCheck = { label: string; value: string; numeric?: boolean };

/** Fiche détaillée d'un objet. */
export type ItemDetails = {
  item: MarketItem;
  /** Nom complet (« Samsung Galaxy A12 · 64 Go »). */
  title: string;
  details: string;
  examinedOn: string;
  checks: InspectionCheck[];
};

/** Reprise constatée chez LBC, montrée sur l'accueil (jamais une estimation). */
export type RecentTakeBack = { photo: Photo; points: number; label: string };

/** Moyen de paiement du complément en francs. */
export type PaymentMethod = "wave" | "om" | "especes";

/** Acquisition d'un objet par l'étudiant connecté (table acquisition). */
export type Acquisition = {
  ref: string;
  method: PaymentMethod;
  /** Points débités (ou à débiter à la confirmation du paiement). */
  points: number;
  /** Complément en francs. */
  complement: number;
  /** en-attente : paiement mobile à valider ; reserve : objet réservé ; remis : retiré en boutique. */
  status: "en-attente" | "reserve" | "remis";
  paymentRef?: string;
  sentAt?: string;
  confirmedAt?: string;
  pickupBefore: string;
};
