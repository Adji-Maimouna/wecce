import type {
  AdminActionType,
  AgeBand,
  Category,
  Condition,
  DepositStatus,
  DeviceCondition,
  InspectionCheck,
  MovementType,
  PartCondition,
  PaymentMethod,
  Photo,
  RefusalReason,
  Role,
  StockOrigin,
  StockStatus,
} from "@/domain/entities";
import { seed } from "./seed";

/*
 * Base de données du serveur simulé, rangée comme les tables de wecce-schema.sql.
 * Elle est gardée dans le navigateur (localStorage) : les actions d'un compte se retrouvent
 * dans les autres espaces, et survivent au rechargement de la page.
 */

export type UserRow = {
  id: string;
  role: Role;
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  /** Démonstration seulement : Laravel stocke un hachage, jamais le mot de passe. */
  password: string;
  createdAt: string;
  // étudiant (tables etudiant + compte_points)
  numeroCarte?: string;
  niveau?: string;
  ufr?: string;
  active?: boolean;
  balance?: number;
  // agent LBC (table agent)
  fonction?: string;
  peutExpertiser?: boolean;
  poste?: string;
  // administrateur (table administrateur)
  portee?: string;
};

export type MovementRow = { userId: string; at: string; type: MovementType; detail: string; amount: number; balanceAfter: number };

export type ExpertiseRow =
  | {
      at: string;
      agentId: string;
      decision: "accepte" | "pieces";
      condition: Condition;
      battery: number | null;
      serial: string;
      takeBack: number;
      listPrice: number;
      checks: InspectionCheck[];
    }
  | { at: string; agentId: string; decision: "refuse"; reason: RefusalReason; comment: string };

export type DepositRow = {
  ref: string;
  userId: string;
  createdAt: string;
  category: Category;
  modele: string;
  stockage: string;
  age: AgeBand;
  etat: DeviceCondition | PartCondition;
  /** Photos envoyées (adresses). */
  photos: string[];
  /** Nombre de photos déclarées (les données de départ n'ont pas les fichiers). */
  photoCount: number;
  wish: number | null;
  /** Rendez-vous « AAAA-MM-JJTHH:MM », ou null pour un brouillon. */
  slot: string | null;
  status: DepositStatus;
  cancelledAt?: string;
  expertise?: ExpertiseRow;
  waiver?: { signedAt: string; bonus: number; bonusRate: number; balanceBefore: number; hash: string; agentId: string };
  articleId?: string;
};

export type ArticleRow = {
  id: string;
  slug: string;
  name: string;
  /** Nom complet sur la fiche (« Samsung Galaxy A12 · 64 Go »). */
  title?: string;
  /** Ligne sous le titre de la fiche. */
  details?: string;
  keywords: string;
  category: Category;
  condition: Condition;
  battery?: number;
  detail?: string;
  info: string;
  photo?: Photo;
  origin: StockOrigin;
  depositRef?: string;
  createdAt: string;
  onlineSince?: string;
  initialPrice: number;
  todayPrice: number;
  status: StockStatus;
  statusNote?: string;
  checks?: InspectionCheck[];
  examinedAt?: string;
};

export type AcquisitionRow = {
  ref: string;
  userId: string;
  articleId: string;
  method: PaymentMethod;
  points: number;
  complement: number;
  status: "en-attente" | "reserve" | "remis" | "annule";
  paymentRef?: string;
  createdAt: string;
  confirmedAt?: string;
  handedAt?: string;
};

export type LogRow = { at: string; type: AdminActionType; target: string; change: string; reason: string; by: string };

/** Mesure hebdomadaire de la couverture (table snapshot_couverture). */
export type SnapshotRow = { at: string; stock: number; debt: number; event?: string };

export type ConfigRow = {
  depositsSuspended: boolean;
  suspensionReason?: string;
  suspendedAt?: string;
  bonus: { active: boolean; rate: number; quota: number; used: number };
  lastFonte?: { at: string; accounts: number; articles: number };
};

export type Db = {
  version: number;
  seq: { deposit: number; acquisition: number; article: number };
  users: UserRow[];
  movements: MovementRow[];
  deposits: DepositRow[];
  articles: ArticleRow[];
  acquisitions: AcquisitionRow[];
  log: LogRow[];
  snapshots: SnapshotRow[];
  config: ConfigRow;
};

/** Changer ce numéro remet tout le monde sur les données de départ. */
export const DB_VERSION = 4;
const KEY = "wecce-demo-db";

let db: Db | null = null;
let version = 0;
const listeners = new Set<() => void>();

function load(): Db | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Db;
    return parsed.version === DB_VERSION ? parsed : null;
  } catch {
    return null;
  }
}

function persist(current: Db) {
  try {
    localStorage.setItem(KEY, JSON.stringify(current));
  } catch {
    // Quota dépassé (photos lourdes) : on garde les photos en mémoire seulement.
    try {
      const light = JSON.stringify(current, (_key, v) => (typeof v === "string" && v.startsWith("data:") ? undefined : v));
      localStorage.setItem(KEY, light);
    } catch {
      /* stockage indisponible : la démonstration tourne en mémoire */
    }
  }
}

/** La base courante (chargée, ou créée à partir des données de départ). */
export function data(): Db {
  if (!db) {
    db = load() ?? fresh();
    persist(db);
  }
  return db;
}

const fresh = (): Db => ({ ...seed(), version: DB_VERSION });

/** Prévient les écrans qu'une donnée a changé (comme un rechargement des props Inertia). */
export function notify() {
  version++;
  listeners.forEach((l) => l());
}

/** Enregistre la base après une action, puis prévient les écrans. */
export function commit() {
  persist(data());
  notify();
}

/** Repart des données de départ. */
export function reset() {
  db = fresh();
  persist(db);
  notify();
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const getVersion = () => version;

// Plusieurs onglets ouverts (un étudiant, un agent) : chacun voit les actions des autres.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key !== KEY) return;
    db = load() ?? db;
    notify();
  });
}
