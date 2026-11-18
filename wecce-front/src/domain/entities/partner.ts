import type { AgeBand, DeviceCondition, PartCondition } from "./deposit";
import type { Category, Condition } from "./market";

/** « a-signer » : les deux prix sont fixés, la signature au comptoir reste à faire. */
export type AppointmentStatus = "a-planifier" | "a-venir" | "arrive" | "a-signer" | "repris" | "refuse" | "annule";

/** Rendez-vous du jour au comptoir LBC (table rendez_vous). */
export type Appointment = {
  time: string;
  dateLabel?: string;
  missed?: boolean;
  student: { name: string; initials: string; card: string; phone?: string };
  depositRef: string;
  device: string;
  deviceInfo: string;
  wish: number | null;
  status: AppointmentStatus;
  /** Reprise effectuée (statut « repris »). */
  takeBack?: number;
  refusalShort?: string;
  /** Disponibilités envoyées par l'étudiant (demande de rendez-vous). */
  request?: { sentAt: string; summary: string; days: string[]; moment: "matin" | "apres-midi" | "indifferent"; note: string };
};

/** Un jour de la semaine affichée sur la page Rendez-vous. */
export type CounterWeekDay = { date: string; weekday: string; day: number; count: number; open: number; isToday: boolean };

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
  photos?: { src: string; alt: string }[];
  wish: number | null;
};

/**
 * Mode de reprise choisi par LBC à l'expertise :
 * vente : points crédités et objet mis en vente sur Wecce ;
 * echange-points : points crédités, l'objet reste en boutique, hors marché ;
 * echange-objet : l'étudiant repart avec un objet de la boutique LBC, sans point.
 */
export type TakeBackMode = "vente" | "echange-points" | "echange-objet";

/** Objet du stock propre de LBC pouvant servir de contrepartie à un échange direct. */
export type ExchangeableItem = { id: string; name: string; price: number; online: boolean };

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
  mode?: TakeBackMode;
  /** Échange contre un objet : un article du catalogue LBC, ou un libellé libre. */
  counterpartArticleId?: string | null;
  counterpartLabel?: string;
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
    | {
        status: "repris";
        takeBack: number;
        listPrice: number;
        bonus: number;
        pieces: boolean;
        signedAt: string;
        articleId?: string;
        mode?: TakeBackMode;
        counterpart?: string | null;
      }
    | { status: "refuse"; reason: RefusalReason; comment: string };
};

/** Origine d'un article du stock : un dépôt étudiant, ou le stock propre de la boutique. */
export type StockOrigin = "depot" | "boutique";

/** « en-boutique » : en stock chez LBC mais hors marché (échange direct, ou retiré du marché par LBC). */
export type StockStatus = "a-photographier" | "en-ligne" | "en-boutique" | "reserve" | "remis" | "retire";

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
  /** Nouvel article : le mettre tout de suite en ligne, ou le garder au catalogue de la boutique. */
  online?: boolean;
};

/** Achat d'un étudiant vu par LBC : à valider, à remettre, ou dans l'historique. */
export type PartnerPurchase = {
  ref: string;
  status: "en-attente" | "a-valider" | "reserve" | "remis" | "annule";
  student: { name: string; initials: string; card: string; phone?: string; balance: number };
  item: { id: string; name: string; category: Category; photo?: string | null; origin: StockOrigin };
  price: number;
  points: number;
  complement: number;
  method: "wave" | "om" | "especes";
  /** Complément déjà payé par Wave ou Orange Money (à rembourser en cas de refus). */
  paidMobile: boolean;
  createdAt: string;
  pickupBefore: string;
  validatedAt?: string;
  handedAt?: string;
  warrantyUntil?: string;
  refusal?: string;
};

export type StockTabSummary = {
  inShopCount: number;
  inShopValue: number;
  onlineCount: number;
  onlineValue: number;
  offlineCount: number;
  reservedCount: number;
  shopOwnCount: number;
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
  fundedAccounts?: number;
  stockValue: number;
  stockCount: number;
  thresholds: { watch: number; suspend: number; reopen: number };
};

export type CoverageStockBreakdown = {
  studentDepositsCount: number;
  studentDepositsValue: number;
  shopStockCount: number;
  shopStockValue: number;
  enLigneCount: number;
  enLigneValue: number;
  aPhotographierCount: number;
  aPhotographierValue: number;
  reserveeCount: number;
  reserveeValue: number;
};

export type CoverageActivityStats = {
  pointsIssued: number;
  bonusIssued: number;
  pointsSpent: number;
  pointsMelted: number;
  acquisitionsCount: number;
  handedOverCount: number;
  complementsTotal: number;
  acquisitionsWithComplement: number;
  avgBalance: number;
  maxBalance: number;
  acceptedExpertises: number;
  piecesExpertises: number;
  refusedExpertises: number;
};

export type CoveragePoint = {
  label: string;
  day: number;
  stock: number;
  debt: number;
  /** Évènement à signaler sur le graphique (« après la baisse du 1er octobre »). */
  event?: string;
};

export type MarginRow = {
  month: string;
  expertises: number;
  margin: number;
  avgTakeBack?: number;
  avgListPrice?: number;
  totalMarginPoints?: number;
};

export type CategoryStat = {
  code: string;
  label: string;
  deposits: number;
  depAccepted: number;
  depPending: number;
  depRefused: number;
  depCancelled: number;
  fromDeposits: number;
  fromShop: number;
  totalEntered: number;
  available: number;
  toPhoto: number;
  availableValue: number;
  reserved: number;
  reservedValue: number;
  sold: number;
  soldValue: number;
  withdrawn: number;
};

export type ConditionStat = {
  code: Condition;
  available: number;
  reserved: number;
  sold: number;
  withdrawn: number;
  total: number;
};

export type PaymentMethodStat = {
  key: "points" | "wave" | "om" | "especes";
  label: string;
  count: number;
  pointsAmount: number;
  fcfaAmount: number;
};

export type MonthlyActivityStat = {
  key: string;
  month: string;
  deposits: number;
  accepted: number;
  refused: number;
  acquisitions: number;
  salesPoints: number;
  complementsFcfa: number;
  marginPoints: number;
};

export type UfrStat = {
  ufr: string;
  students: number;
  deposits: number;
  accepted: number;
  acquisitions: number;
  spentPoints: number;
};

export type PeriodOption = { value: string; label: string };

export type PlatformStatistics = {
  computedAt: string;
  periode: string;
  periodLabel: string;
  periodOptions: PeriodOption[];
  fromDate?: string;
  toDate?: string;
  /** Dernière activité enregistrée (pour guider quand la période choisie est vide). */
  lastActivity?: { date: string; label: string; month: string } | null;
  /** Activité jour par jour quand la période fait au plus 62 jours. */
  daily?: { key: string; label: string; deposits: number; accepted: number; acquisitions: number }[];
  summary: {
    totalDeposits: number;
    acceptedDeposits: number;
    refusedDeposits: number;
    pendingDeposits: number;
    cancelledDeposits: number;
    acceptanceRate: number;
    fromDepositsCount: number;
    fromShopCount: number;
    totalEntered: number;
    availableCount: number;
    toPhotoCount: number;
    reservedCount: number;
    withdrawnCount: number;
    totalAcquisitions: number;
    handedOverAcquisitions: number;
    reservedAcquisitions: number;
    cancelledAcquisitions: number;
    totalSalesPoints: number;
    totalPointsDebited: number;
    totalComplementsFcfa: number;
    avgBasketPoints: number;
    onlineCount: number;
    onlineValue: number;
    soldCount: number;
    soldValue: number;
    totalStudents: number;
    /** Étudiants ayant déposé ou acheté sur la période. */
    activeStudents?: number;
    studentsWithBalance: number;
    totalPointsInCirculation: number;
    avgBalance: number;
    bonusActive: boolean;
    bonusRate: number;
    bonusConsumed: number;
    bonusQuota: number;
  };
  byCategory: CategoryStat[];
  byCondition: ConditionStat[];
  paymentMethods: PaymentMethodStat[];
  monthly: MonthlyActivityStat[];
  byUfr: UfrStat[];
  catalog?: {
    articles: StockArticle[];
    counts: Record<"tout" | StockOrigin, number>;
  };
};
