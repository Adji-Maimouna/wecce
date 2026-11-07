import { RuleViolation } from "@/application/errors";
import type {
  AdjustmentDirection,
  ArticleInput,
  Category,
  Condition,
  InspectionCheck,
  MovementType,
  PaymentMethod,
  Photo,
  RefusalReason,
} from "@/domain/entities";
import { launchBonus } from "@/domain/rules/expertise";
import { afterFonte, coverage } from "@/domain/rules/points";
import { dayMonthShort } from "./clock";
import type { AcquisitionRow, ArticleRow, Db, DepositRow, UserRow } from "./db";

/*
 * Opérations du serveur simulé (l'équivalent des services Laravel).
 * Chacune reçoit la base et l'heure de l'action : les données de départ sont produites
 * en rejouant ces mêmes opérations, puis l'application les appelle à l'heure courante.
 */

const nf = new Intl.NumberFormat("fr-FR");
export const num = (n: number) => nf.format(Math.round(n));

/** Seuils de couverture (à trancher avec LBC). */
export const THRESHOLDS = { watch: 1.2, suspend: 1.1, reopen: 1.2 };

/** Délai de retrait d'un objet réservé, en jours (à trancher avec LBC). */
export const PICKUP_DAYS = 3;

export function fail(code: string, message: string): never {
  throw new RuleViolation(code, message);
}

// ---------------------------------------------------------------- comptes

export function userById(db: Db, id: string): UserRow {
  const u = db.users.find((x) => x.id === id);
  if (!u) fail("compte-inconnu", "Compte introuvable.");
  return u;
}

export const shortName = (u: Pick<UserRow, "prenom" | "nom">) => `${u.prenom} ${u.nom.charAt(0)}.`;

/** Mouvement de points (en ajout seul) : le solde est la somme des mouvements. */
export function move(db: Db, userId: string, at: string, type: MovementType, detail: string, amount: number) {
  const u = userById(db, userId);
  const balanceAfter = (u.balance ?? 0) + amount;
  if (balanceAfter < 0) fail("solde-negatif", "Le solde ne peut pas devenir négatif.");
  u.balance = balanceAfter;
  db.movements.push({ userId, at, type, detail, amount, balanceAfter });
}

// ---------------------------------------------------------------- dépôts

export type NewDeposit = {
  category: Category;
  modele: string;
  stockage: string;
  age: DepositRow["age"];
  etat: DepositRow["etat"];
  photos: string[];
  photoCount?: number;
  wish: number | null;
  slot: string | null;
  draftRef?: string;
  /** Données de départ seulement : référence imposée. */
  ref?: string;
};

export const deviceName = (d: Pick<DepositRow, "modele" | "stockage">) => [d.modele.trim(), d.stockage.trim()].filter(Boolean).join(" · ");

function nextDepositRef(db: Db): string {
  db.seq.deposit += 1;
  return `WC-2026-${String(db.seq.deposit).padStart(4, "0")}`;
}

export function depositByRef(db: Db, ref: string): DepositRow {
  const d = db.deposits.find((x) => x.ref === ref.toUpperCase());
  if (!d) fail("depot-inconnu", `Aucun dépôt ${ref}.`);
  return d;
}

/** Créneau déjà occupé par un autre dépôt ? */
export function slotTaken(db: Db, slot: string, exceptRef?: string): boolean {
  return db.deposits.some((d) => d.slot === slot && d.ref !== exceptRef && d.status !== "annule" && d.status !== "brouillon");
}

/** Prendre rendez-vous (ou compléter un brouillon). */
export function createDeposit(db: Db, userId: string, req: NewDeposit, at: string): string {
  if (req.slot && slotTaken(db, req.slot, req.draftRef)) fail("creneau-pris", "Ce créneau vient d'être pris. Choisissez-en un autre.");
  const fields = {
    category: req.category,
    modele: req.modele.trim(),
    stockage: req.stockage.trim(),
    age: req.age,
    etat: req.etat,
    photos: req.photos,
    photoCount: req.photoCount ?? req.photos.length,
    wish: req.wish,
    slot: req.slot,
    status: req.slot ? ("rendez-vous" as const) : ("brouillon" as const),
  };
  if (req.draftRef) {
    const draft = depositByRef(db, req.draftRef);
    if (draft.userId !== userId || draft.status !== "brouillon") fail("depot-inconnu", "Ce brouillon n'existe plus.");
    Object.assign(draft, fields);
    return draft.ref;
  }
  const ref = req.ref ?? nextDepositRef(db);
  db.deposits.push({ ref, userId, createdAt: at, ...fields });
  return ref;
}

export function cancelDeposit(db: Db, userId: string, ref: string, at: string) {
  const d = depositByRef(db, ref);
  if (d.userId !== userId) fail("depot-inconnu", `Aucun dépôt ${ref}.`);
  if (d.status !== "rendez-vous" && d.status !== "brouillon") fail("depot-traite", "Ce dépôt a déjà été examiné.");
  d.status = "annule";
  d.cancelledAt = at;
}

export function reschedule(db: Db, userId: string, ref: string, slot: string) {
  const d = depositByRef(db, ref);
  if (d.userId !== userId || d.status !== "rendez-vous") fail("depot-traite", "Ce rendez-vous ne peut plus être déplacé.");
  if (slotTaken(db, slot, ref)) fail("creneau-pris", "Ce créneau vient d'être pris. Choisissez-en un autre.");
  d.slot = slot;
}

const CONTROLS: Record<Category, string[]> = {
  tel: ["Écran et tactile sans défaut", "Appareils photo, micro et haut-parleur testés", "Compte Google ou iCloud déconnecté, téléphone réinitialisé"],
  tab: ["Écran et tactile sans défaut", "Charge et boutons testés", "Compte Google ou iCloud déconnecté, tablette réinitialisée"],
  ordi: ["Écran sans pixel mort ni fissure", "Clavier, pavé tactile et ports testés", "Compte Microsoft déconnecté, appareil réinitialisé"],
  audio: ["Son des deux côtés, sans grésillement", "Charge et connexion testées"],
  piece: ["Testée dans un appareil du comptoir", "Connecteurs intacts"],
};

/** Contrôles proposés à l'agent selon la catégorie. */
export const controlsFor = (category: Category) => CONTROLS[category];

export type ExpertiseValues = { pieces: boolean; condition: Condition; battery: number | null; serial: string; takeBack: number; listPrice: number };

/** Les deux prix fixés par l'agent. L'étudiant signe ensuite sur la tablette du comptoir. */
export function recordExpertise(db: Db, agentId: string, ref: string, v: ExpertiseValues, at: string) {
  const d = depositByRef(db, ref);
  if (d.status !== "rendez-vous" && d.status !== "a-signer") fail("depot-traite", "Ce dépôt a déjà été traité.");
  const checks: InspectionCheck[] = [
    ...(v.battery !== null ? [{ label: "Batterie", value: `${v.battery} % de sa capacité d'origine` }] : []),
    ...CONTROLS[v.pieces ? "piece" : d.category].map((c) => ({ label: c.split(",")[0].split(" sans")[0], value: "Vérifié au comptoir" })),
    ...(v.serial.trim() ? [{ label: "Numéro de série", value: maskSerial(v.serial), numeric: true }] : []),
  ];
  d.expertise = { at, agentId, decision: v.pieces ? "pieces" : "accepte", condition: v.condition, battery: v.battery, serial: v.serial.trim(), takeBack: v.takeBack, listPrice: v.listPrice, checks };
  d.status = "a-signer";
}

export function refuse(db: Db, agentId: string, ref: string, reason: RefusalReason, comment: string, at: string) {
  const d = depositByRef(db, ref);
  if (d.status !== "rendez-vous" && d.status !== "a-signer") fail("depot-traite", "Ce dépôt a déjà été traité.");
  d.expertise = { at, agentId, decision: "refuse", reason, comment };
  d.status = "refuse";
}

/** L'étudiant refuse les deux prix au comptoir : le dépôt est clos, rien n'est crédité. */
export function declineAtCounter(db: Db, ref: string, at: string) {
  const d = depositByRef(db, ref);
  if (d.status !== "a-signer") fail("depot-traite", "Ce dépôt n'attend pas de signature.");
  d.status = "annule";
  d.cancelledAt = at;
}

export const maskSerial =(s: string) => (s.length > 6 ? `${s.slice(0, 4)}••••${s.slice(-2)}` : s);

function pseudoHash(seedText: string): string {
  let h1 = 0x811c9dc5;
  let out = "";
  for (let round = 0; round < 8; round++) {
    for (const ch of `${seedText}#${round}`) h1 = Math.imul(h1 ^ ch.charCodeAt(0), 16777619) >>> 0;
    out += h1.toString(16).padStart(8, "0");
  }
  return out;
}

/** Signature du renoncement : l'appareil appartient à la boutique, les points sont crédités, l'article entre au stock. */
export function sign(db: Db, ref: string, at: string, photo?: Photo): { balanceAfter: number } {
  const d = depositByRef(db, ref);
  const e = d.expertise;
  if (d.status !== "a-signer" || !e || e.decision === "refuse") fail("depot-traite", "Ce dépôt n'attend pas de signature.");
  const student = userById(db, d.userId);
  const bonusOn = db.config.bonus.active && db.config.bonus.used < db.config.bonus.quota;
  const bonusRate = bonusOn ? db.config.bonus.rate : 0;
  const bonus = launchBonus(e.takeBack, bonusRate);
  const balanceBefore = student.balance ?? 0;
  const name = deviceName(d);
  const short = d.modele.trim();

  move(db, d.userId, at, "reprise", `${short}, renoncement signé en boutique`, e.takeBack);
  if (bonus > 0) {
    move(db, d.userId, at, "bonus", `+ ${bonusRate} % sur la reprise du dépôt ${d.ref}`, bonus);
    db.config.bonus.used += 1;
  }

  const pieces = e.decision === "pieces";
  const article = addArticle(db, {
    name: pieces ? `${short}, pour pièces` : name,
    category: pieces ? "piece" : d.category,
    condition: e.condition,
    battery: e.battery ?? undefined,
    detail: pieces ? "Repris en pièces" : undefined,
    info: pieces ? "Repris en pièces" : `Examiné le ${dayMonthShort(at)}`,
    origin: "depot",
    depositRef: d.ref,
    price: e.listPrice,
    photo,
    checks: e.checks,
    examinedAt: e.at,
    status: photo ? "en-ligne" : "a-photographier",
    at,
  });
  d.articleId = article.id;
  d.status = "repris";
  d.waiver = { signedAt: at, bonus, bonusRate, balanceBefore, hash: pseudoHash(`${d.ref}|${at}|${e.takeBack}`), agentId: e.agentId };
  return { balanceAfter: student.balance ?? 0 };
}

// ---------------------------------------------------------------- stock et marché

function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

type NewArticle = {
  name: string;
  slug?: string;
  title?: string;
  details?: string;
  keywords?: string;
  category: Category;
  condition: Condition;
  battery?: number;
  detail?: string;
  info?: string;
  origin: ArticleRow["origin"];
  depositRef?: string;
  price: number;
  photo?: Photo;
  checks?: InspectionCheck[];
  examinedAt?: string;
  status: "a-photographier" | "en-ligne";
  at: string;
};

export function addArticle(db: Db, a: NewArticle): ArticleRow {
  db.seq.article += 1;
  let slug = a.slug ?? slugify(a.name);
  if (db.articles.some((x) => x.slug === slug)) slug = `${slug}-${db.seq.article}`;
  const row: ArticleRow = {
    id: `art-${db.seq.article}`,
    slug,
    name: a.name,
    title: a.title,
    details: a.details,
    keywords: a.keywords ?? a.name,
    category: a.category,
    condition: a.condition,
    battery: a.battery,
    detail: a.detail,
    info: a.info ?? "",
    photo: a.photo,
    origin: a.origin,
    depositRef: a.depositRef,
    createdAt: a.at,
    onlineSince: a.status === "en-ligne" ? a.at : undefined,
    initialPrice: a.price,
    todayPrice: a.price,
    status: a.status,
    checks: a.checks,
    examinedAt: a.examinedAt,
  };
  db.articles.push(row);
  return row;
}

export function articleById(db: Db, id: string): ArticleRow {
  const a = db.articles.find((x) => x.id === id);
  if (!a) fail("article-inconnu", "Article introuvable.");
  return a;
}

export function publish(db: Db, id: string, at: string) {
  const a = articleById(db, id);
  if (a.status !== "a-photographier") fail("article-en-ligne", "Cet article est déjà en ligne.");
  a.status = "en-ligne";
  a.onlineSince = at;
}

const photoFrom = (src: string | null | undefined, name: string): Photo | undefined =>
  src ? { src, alt: `${name}, photo prise au comptoir`, width: 800, height: 800 } : undefined;

/** Ajouter un article de la boutique (en ligne tout de suite), ou modifier un article. */
export function saveArticle(db: Db, input: ArticleInput, at: string): string {
  if (input.id) {
    const a = articleById(db, input.id);
    if (a.status === "remis" || a.status === "retire") fail("article-ferme", "Cet article n'est plus en vente.");
    a.name = input.name;
    a.keywords = input.name;
    a.category = input.category;
    a.condition = input.condition;
    a.battery = input.battery;
    a.info = input.info ?? "";
    if (input.photo !== undefined) a.photo = photoFrom(input.photo, input.name) ?? (input.photo === null ? undefined : a.photo);
    if (input.price !== a.todayPrice) {
      a.todayPrice = input.price;
      if (a.status === "a-photographier") a.initialPrice = input.price;
    }
    return a.id;
  }
  return addArticle(db, {
    name: input.name,
    category: input.category,
    condition: input.condition,
    battery: input.battery,
    info: input.info,
    origin: "boutique",
    price: input.price,
    photo: photoFrom(input.photo, input.name),
    status: "en-ligne",
    at,
  }).id;
}

export function withdraw(db: Db, id: string, reason: string, at: string, by: string) {
  const a = articleById(db, id);
  if (a.status !== "en-ligne" && a.status !== "a-photographier") fail("article-ferme", "Seul un article en vente peut être retiré.");
  a.status = "retire";
  db.log.push({ at, type: "retrait", target: a.name, change: "En ligne → retirée", reason, by });
}

// ---------------------------------------------------------------- acquisitions

export function articleBySlug(db: Db, slug: string): ArticleRow {
  const a = db.articles.find((x) => x.slug === slug);
  if (!a) fail("article-inconnu", "Objet introuvable.");
  return a;
}

function nextAcquisitionRef(db: Db): string {
  db.seq.acquisition += 1;
  return `AQ-2026-${String(db.seq.acquisition).padStart(4, "0")}`;
}

/** Prendre un objet : points d'abord, complément en francs ensuite. */
export function acquire(db: Db, userId: string, articleId: string, method: PaymentMethod, at: string, paymentRef?: string): AcquisitionRow {
  const a = articleById(db, articleId);
  if (a.status !== "en-ligne") fail("objet-indisponible", "Cet objet vient d'être réservé par un autre étudiant.");
  const u = userById(db, userId);
  const { covered, complement } = coverage(a.todayPrice, u.balance ?? 0);
  const immediate = method === "especes" || complement === 0;
  const row: AcquisitionRow = {
    ref: nextAcquisitionRef(db),
    userId,
    articleId,
    method,
    points: covered,
    complement,
    status: immediate ? "reserve" : "en-attente",
    paymentRef: immediate ? undefined : paymentRef ?? `T_${Math.random().toString(36).slice(2, 6).toUpperCase()}••••`,
    createdAt: at,
    confirmedAt: immediate ? at : undefined,
  };
  db.acquisitions.push(row);
  a.status = "reserve";
  if (immediate && covered > 0) move(db, userId, at, "acquisition", `${a.name}, bon ${row.ref}`, -covered);
  return row;
}

export function acquisitionByRef(db: Db, ref: string): AcquisitionRow {
  const q = db.acquisitions.find((x) => x.ref === ref || x.paymentRef === ref);
  if (!q) fail("acquisition-inconnue", "Acquisition introuvable.");
  return q;
}

/** Le prestataire confirme le paiement : les points sont débités, l'objet est réservé. */
export function confirmPayment(db: Db, ref: string, at: string) {
  const q = acquisitionByRef(db, ref);
  if (q.status !== "en-attente") return;
  const a = articleById(db, q.articleId);
  const u = userById(db, q.userId);
  const points = Math.min(q.points, u.balance ?? 0);
  q.points = points;
  q.complement = a.todayPrice - points;
  q.status = "reserve";
  q.confirmedAt = at;
  if (points > 0) move(db, q.userId, at, "acquisition", `${a.name}, bon ${q.ref}`, -points);
}

export function cancelPayment(db: Db, ref: string) {
  const q = acquisitionByRef(db, ref);
  if (q.status !== "en-attente") fail("paiement-confirme", "Le paiement est déjà confirmé.");
  q.status = "annule";
  const a = articleById(db, q.articleId);
  if (a.status === "reserve") a.status = "en-ligne";
}

/** Remise de l'objet en boutique : l'acquisition est soldée, la garantie démarre. */
export function handOver(db: Db, ref: string, at: string) {
  const q = acquisitionByRef(db, ref);
  if (q.status !== "reserve") fail("acquisition-ouverte", "Cet objet n'est pas prêt à être remis.");
  q.status = "remis";
  q.handedAt = at;
  articleById(db, q.articleId).status = "remis";
}

// ---------------------------------------------------------------- administration

export function adjust(db: Db, userId: string, direction: AdjustmentDirection, amount: number, reason: string, at: string, by: string): number {
  const u = userById(db, userId);
  const before = u.balance ?? 0;
  move(db, userId, at, "ajustement", reason, direction === "debit" ? -amount : amount);
  db.log.push({ at, type: "ajustement", target: `Compte ${u.numeroCarte}`, change: `${num(before)} → ${num(u.balance ?? 0)} pts`, reason, by });
  return u.balance ?? 0;
}

export function setSuspended(db: Db, suspended: boolean, reason: string, at: string, by: string) {
  const c = db.config;
  if (c.depositsSuspended === suspended) return;
  c.depositsSuspended = suspended;
  c.suspensionReason = suspended ? reason : undefined;
  c.suspendedAt = suspended ? at : undefined;
  db.log.push({
    at,
    type: suspended ? "suspension" : "reprise",
    target: "Dépôts",
    change: suspended ? "Ouverts → suspendus" : "Suspendus → ouverts",
    reason: reason || "Réouverture des dépôts.",
    by,
  });
}

export function saveBonus(db: Db, rate: number, quota: number, reason: string, at: string, by: string) {
  const b = db.config.bonus;
  const change = `${b.rate} % · ${b.quota} dépôts → ${rate} % · ${quota} dépôts`;
  b.rate = rate;
  b.quota = quota;
  b.active = rate > 0 && b.used < quota;
  db.log.push({ at, type: "configuration", target: "Bonus de lancement", change, reason, by });
}

// ---------------------------------------------------------------- tâches planifiées

/** Baisse mensuelle : le 1er du mois, points et prix baissent de 5 %, au même arrondi. */
export function monthlyFonte(db: Db, at: string) {
  let accounts = 0;
  for (const u of db.users) {
    if (u.role !== "ETUDIANT" || !u.balance) continue;
    const drop = u.balance - afterFonte(u.balance, 1);
    if (drop > 0) {
      move(db, u.id, at, "fonte", `5 % de ${num(u.balance)}`, -drop);
      accounts++;
    }
  }
  let articles = 0;
  for (const a of db.articles) {
    if (a.status === "en-ligne" || a.status === "reserve" || a.status === "a-photographier") {
      a.todayPrice = afterFonte(a.todayPrice, 1);
      articles++;
    }
  }
  db.config.lastFonte = { at, accounts, articles };
}

/** Points en circulation (la dette de LBC, en marchandise). */
export function debt(db: Db): number {
  return db.users.reduce((s, u) => s + (u.role === "ETUDIANT" ? u.balance ?? 0 : 0), 0);
}

/** Articles qui couvrent la dette : tout ce qui n'est ni remis ni retiré. */
export function coveringArticles(db: Db): ArticleRow[] {
  return db.articles.filter((a) => a.status === "en-ligne" || a.status === "reserve" || a.status === "a-photographier");
}

export function stockValue(db: Db): number {
  return coveringArticles(db).reduce((s, a) => s + a.todayPrice, 0);
}

export function coverageRatio(db: Db): number {
  const d = debt(db);
  return d > 0 ? stockValue(db) / d : 9.99;
}

/** Les nouveaux dépôts sont-ils suspendus (à la main, ou par la couverture) ? */
export function depositsSuspended(db: Db): boolean {
  return db.config.depositsSuspended || coverageRatio(db) < THRESHOLDS.suspend;
}

export function snapshot(db: Db, at: string, event?: string) {
  db.snapshots.push({ at, stock: stockValue(db), debt: debt(db), event });
}

/** Sur le journal : « I. Fall · 41.82.••.•• » (l'adresse IP est masquée). */
export const signature = (u: UserRow) => `${u.prenom.charAt(0)}. ${u.nom} · 41.82.••.••`;
