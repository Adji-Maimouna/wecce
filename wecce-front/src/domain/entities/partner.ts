import type { AgeBand, DeviceCondition, PartCondition } from "./deposit";
import type { Category, Condition } from "./market";

/** « a-signer » : les deux prix sont fixés, la signature au comptoir reste à faire. */
export type AppointmentStatus = "a-venir" | "arrive" | "a-signer" | "repris" | "refuse" | "annule";

/** Rendez-vous du jour au comptoir LBC (table rendez_vous). */
export type Appointment = {
  time: string;
  student: { name: string; initials: string; card: string };
  depositRef: string;
  device: string;
  deviceInfo: string;
  wish: number | null;
  status: AppointmentStatus;
  /** Reprise effectuée (statut « repris »). */
  takeBack?: number;
  refusalShort?: string;
};

/** Ce que l'étudiant a déclaré en ligne, montré à l'agent pendant l'expertise. */
export type DeclaredDevice = {
  depositRef: string;
  student: { name: string; card: string };
  appointmentTime: string;
  category: Category;
  modele: string;
  stockage: string;
  age: AgeBand;
  /** État déclaré : appareil entier, ou pièce détachée. */
  etat: DeviceCondition | PartCondition;
  photoCount: number;
  wish: number | null;
};

/** Ce que l'agent saisit à l'expertise : l'état constaté et les deux prix. */
export type ExpertiseInput = {
  depositRef: string;
  pieces: boolean;
  condition: DeviceCondition | PartCondition;
  battery: number;
  serial: string;
  /** Valeur de reprise : les points crédités à l'étudiant. */
  takeBack: number;
  /** Prix d'affichage : ce que paiera l'étudiant suivant. */
  listPrice: number;
};

export type RefusalReason = "ecran" | "compte" | "batterie" | "modele";

/** Dépôt vu par LBC une fois traité (repris ou refusé). */
export type ProcessedDeposit = {
  ref: string;
  student: { name: string; card: string };
  device: string;
  deviceInfo: string;
  examinedAt: string;
  agent: string;
  wish: number | null;
  outcome:
    | { status: "repris"; takeBack: number; listPrice: number; bonus: number; pieces: boolean; signedAt: string; articleId?: string }
    | { status: "refuse"; reason: RefusalReason; comment: string };
};

/** Origine d'un article du stock : un dépôt étudiant, ou le stock propre de la boutique. */
export type StockOrigin = "depot" | "boutique";

export type StockStatus = "a-photographier" | "en-ligne" | "reserve" | "remis" | "retire";

/** Article en stock chez LBC (table annonce). */
export type StockArticle = {
  id: string;
  name: string;
  info: string;
  category: Category;
  condition?: Condition;
  battery?: number;
  photo?: string;
  origin: StockOrigin;
  originRef?: string;
  onlineSince: string;
  initialPrice: number;
  todayPrice: number;
  status: StockStatus;
  acquisitionRef?: string;
  statusNote?: string;
};

/** Saisie d'un article de la boutique (ajout ou modification). Un article de la boutique ne crée aucune dette. */
export type ArticleInput = {
  id?: string;
  name: string;
  category: Category;
  condition: Condition;
  battery?: number;
  info?: string;
  price: number;
  photo?: string | null;
};

export type StockSummary = {
  online: number;
  onlineFromShop: number;
  displayedValue: number;
  reserved: number;
  leftLastMonth: number;
  leftWithComplement: number;
  lastMonthLabel: string;
};

/** Couverture : la valeur du stock face aux points en circulation (la dette en marchandise). */
export type CoverageSnapshot = {
  computedAt: string;
  ratio: number;
  pointsInCirculation: number;
  studentAccounts: number;
  stockValue: number;
  stockCount: number;
  thresholds: { watch: number; suspend: number; reopen: number };
};

export type CoveragePoint = {
  label: string;
  day: number;
  stock: number;
  debt: number;
  /** Évènement à signaler sur le graphique (« après la baisse du 1er octobre »). */
  event?: string;
};

export type MarginRow = { month: string; expertises: number; margin: number };
