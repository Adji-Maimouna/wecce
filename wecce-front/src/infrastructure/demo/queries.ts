import type {
  AccountSummary,
  Acquisition,
  AdminLogEntry,
  Administrator,
  Agent,
  AgeBand,
  Appointment,
  AppointmentDay,
  AppointmentStatus,
  BalanceMismatch,
  BalancePoint,
  Category,
  Condition,
  CoveragePoint,
  CoverageSnapshot,
  DeclaredDevice,
  Deposit,
  DepositRequest,
  DepositsState,
  ItemDetails,
  LaunchBonus,
  MarginRow,
  MarketItem,
  Movement,
  ProcessedDeposit,
  RecentTakeBack,
  RefusalReason,
  Role,
  ScheduledTask,
  StockArticle,
  StockSummary,
  Student,
  Waiver,
} from "@/domain/entities";
import { afterFonte } from "@/domain/rules/points";
import {
  TODAY,
  addDays,
  capitalize,
  dateOf,
  dayMonth,
  dayMonthShort,
  dayMonthYear,
  dayMonthYearShort,
  daysBetween,
  fullStamp,
  longDate,
  minutesOf,
  monthKey,
  monthName,
  monthTitle,
  now,
  parseTime,
  pickerDay,
  stamp,
  stampAt,
  stampYear,
  time,
  weekday,
  weekdayDayMonth,
} from "./clock";
import { data, type ArticleRow, type Db, type DepositRow, type UserRow } from "./db";
import {
  PICKUP_DAYS,
  THRESHOLDS,
  controlsFor,
  coverageRatio,
  coveringArticles,
  debt,
  deviceName,
  depositsSuspended as suspendedNow,
  maskSerial,
  shortName,
  stockValue,
} from "./engine";
import { currentUserId } from "./session";

/*
 * Lectures du serveur simulé : ce que chaque contrôleur Laravel enverra en props à sa page.
 * Les dates et les petites phrases arrivent déjà rédigées, comme le fera le back.
 */

const CATEGORY_NAME: Record<Category, string> = { tel: "Téléphone", ordi: "Ordinateur", tab: "Tablette", audio: "Audio", piece: "Pièce" };
const AGE_NAME: Record<AgeBand, string> = { "moins-1": "moins d'un an", "1-2": "1 à 2 ans", "2-3": "2 à 3 ans", "plus-4": "plus de 4 ans", inconnu: "âge inconnu" };
const CONDITION_NAME: Record<Condition, string> = { "comme-neuf": "comme neuf", bon: "bon état", use: "usé", fonctionnel: "fonctionnel", defectueux: "défectueux" };
const REFUSAL_SHORT: Record<RefusalReason, string> = { ecran: "écran", compte: "compte lié", batterie: "batterie", modele: "modèle" };

/** Créneaux de rendez-vous proposés par LBC. */
export const APPOINTMENT_TIMES = ["9 h 30", "10 h 00", "10 h 30", "11 h 00", "14 h 00", "15 h 00", "15 h 30", "16 h 30"];

const user = (db: Db, id: string) => db.users.find((u) => u.id === id)!;
const study = (u: UserRow) => [u.niveau, u.ufr].filter(Boolean).join(" · ") || "Étudiant de l'UGB";

// ---------------------------------------------------------------- session

export type Viewer = { id: string; role: Role };

export function viewer(): Viewer | null {
  const id = currentUserId();
  const u = id ? data().users.find((x) => x.id === id) : undefined;
  return u ? { id: u.id, role: u.role } : null;
}

export function studentEntity(id: string): Student {
  const db = data();
  const u = user(db, id);
  return {
    prenom: u.prenom,
    nom: u.nom,
    role: "ETUDIANT",
    email: u.email,
    telephone: u.telephone,
    numeroCarte: u.numeroCarte ?? "",
    niveau: u.niveau,
    ufr: u.ufr,
    balance: u.balance ?? 0,
    memberSince: dayMonthYear(u.createdAt),
    depositCount: db.deposits.filter((d) => d.userId === id).length,
  };
}

export function agentEntity(id: string): Agent {
  const u = user(data(), id);
  return { prenom: u.prenom, nom: u.nom, role: "AGENT", email: u.email, telephone: u.telephone, fonction: u.fonction ?? "", peutExpertiser: !!u.peutExpertiser, poste: u.poste ?? "" };
}

export function adminEntity(id: string): Administrator {
  const u = user(data(), id);
  return { prenom: u.prenom, nom: u.nom, role: "ADMIN", email: u.email, telephone: u.telephone, portee: u.portee ?? "GLOBAL" };
}

/** Rendez-vous du jour encore à recevoir (pastille de la barre latérale LBC). */
export function appointmentsToReceive(): number {
  return data().deposits.filter((d) => d.slot && dateOf(d.slot) === TODAY && (d.status === "rendez-vous" || d.status === "a-signer")).length;
}

// ---------------------------------------------------------------- marché

const onMarket = (a: ArticleRow) => a.status === "en-ligne" || a.status === "reserve";

function depositorOf(db: Db, a: ArticleRow): string | undefined {
  return a.depositRef ? db.deposits.find((d) => d.ref === a.depositRef)?.userId : undefined;
}

function toMarketItem(db: Db, a: ArticleRow, order: number, viewerId?: string): MarketItem {
  return {
    slug: a.slug,
    name: a.name,
    keywords: a.keywords,
    category: a.category,
    price: a.todayPrice,
    photo: a.photo,
    condition: a.condition,
    battery: a.battery,
    detail: a.detail,
    order,
    mine: !!viewerId && depositorOf(db, a) === viewerId,
    reserved: a.status === "reserve",
  };
}

export function marketItems(viewerId?: string): MarketItem[] {
  const db = data();
  return db.articles
    .filter(onMarket)
    .sort((x, y) => ((y.onlineSince ?? "") > (x.onlineSince ?? "") ? 1 : -1))
    .map((a, i) => toMarketItem(db, a, i + 1, viewerId));
}

function genericChecks(a: ArticleRow) {
  const list = [] as ItemDetails["checks"];
  if (a.battery !== undefined) list.push({ label: "Batterie", value: `${a.battery} % de sa capacité d'origine` });
  list.push({ label: "Fonctionnement", value: a.category === "piece" ? a.detail ?? "Testé dans un appareil" : "Testé au comptoir, tout fonctionne" });
  if (a.category === "tel" || a.category === "tab" || a.category === "ordi") list.push({ label: "Comptes", value: "Déconnectés, appareil réinitialisé" });
  return list;
}

export function activeAcquisition(db: Db, articleId: string) {
  return db.acquisitions.find((q) => q.articleId === articleId && (q.status === "en-attente" || q.status === "reserve"));
}

/**
 * Fiche d'un objet en vente. Null : l'objet n'est pas (ou plus) sur le marché.
 * `includeSold` : l'étudiant qui l'a pris garde l'accès à son bon de retrait.
 */
export function itemPage(slug: string, viewerId: string, includeSold = false): { details: ItemDetails; reservedByOther: boolean; reservedByMe: boolean } | null {
  const db = data();
  const a = db.articles.find((x) => x.slug === slug);
  if (!a || (!onMarket(a) && !(includeSold && a.status === "remis"))) return null;
  const item = toMarketItem(db, a, 0, viewerId);
  const mine = item.mine;
  const holder = activeAcquisition(db, a.id)?.userId;
  return {
    details: {
      item,
      title: a.title ?? a.name,
      details: a.details ?? `${CATEGORY_NAME[a.category]} · ${mine ? "votre dépôt" : a.origin === "depot" ? "déposé par un étudiant" : "stock de la boutique LBC"}`,
      examinedOn: dayMonth(a.examinedAt ?? a.onlineSince ?? a.createdAt),
      checks: a.checks ?? genericChecks(a),
    },
    reservedByOther: a.status === "reserve" && holder !== viewerId,
    reservedByMe: a.status === "reserve" && holder === viewerId,
  };
}

/** Acquisition en cours (ou faite) de l'étudiant sur cet objet. */
export function acquisitionOf(viewerId: string, slug: string): Acquisition | null {
  const db = data();
  const a = db.articles.find((x) => x.slug === slug);
  if (!a) return null;
  const q = [...db.acquisitions].reverse().find((x) => x.articleId === a.id && x.userId === viewerId && x.status !== "annule");
  if (!q || q.status === "annule") return null;
  const from = q.confirmedAt ?? q.createdAt;
  return {
    ref: q.ref,
    method: q.method,
    points: q.points,
    complement: q.complement,
    status: q.status,
    paymentRef: q.paymentRef,
    sentAt: stamp(q.createdAt),
    confirmedAt: q.confirmedAt ? stampAt(q.confirmedAt) : undefined,
    pickupBefore: weekdayDayMonth(addDays(dateOf(from), PICKUP_DAYS)),
  };
}

/** Mois de la prochaine baisse (« décembre »). */
export const nextFonte = () => monthName(TODAY, 1);

// ---------------------------------------------------------------- dépôts de l'étudiant

const appointmentLabel = (slot: string) => ({ label: `${capitalize(weekdayDayMonth(slot))}, ${time(slot)}`, long: `${weekdayDayMonth(slot)} à ${time(slot)}` });

function toDeposit(db: Db, d: DepositRow): Deposit {
  const a = d.articleId ? db.articles.find((x) => x.id === d.articleId) : undefined;
  const base: Deposit = {
    ref: d.ref,
    deviceName: deviceName(d),
    category: d.category,
    status: d.status,
    photo: d.photos[0] ?? a?.photo?.src,
    wish: d.wish ?? undefined,
  };
  const e = d.expertise;
  switch (d.status) {
    case "brouillon": {
      const missing = [d.photoCount === 0 && "les photos", !d.slot && "le rendez-vous"].filter(Boolean).join(" et ");
      return { ...base, stageIndex: 0, missing: missing ? `Il manque ${missing}` : undefined };
    }
    case "demande-rdv":
      return { ...base, stageIndex: 1 };
    case "rendez-vous":
      return { ...base, stageIndex: 1, appointment: d.slot ? appointmentLabel(d.slot) : undefined };
    case "a-signer":
      return { ...base, stageIndex: 3, examinedOn: e ? dayMonth(e.at) : undefined };
    case "repris":
      return {
        ...base,
        stageIndex: a && a.status !== "a-photographier" ? 5 : 4,
        signedOn: d.waiver ? dayMonth(d.waiver.signedAt) : undefined,
        takeBack: e && e.decision !== "refuse" ? { points: e.takeBack, bonus: d.waiver?.bonus ?? 0 } : undefined,
        prices: a ? { initial: a.initialPrice, today: a.todayPrice } : undefined,
        itemSlug: a && onMarket(a) ? a.slug : undefined,
        wish: undefined,
      };
    case "refuse":
      return {
        ...base,
        examinedOn: e ? dayMonth(e.at) : undefined,
        refusal: e && e.decision === "refuse" ? { reason: e.reason, comment: e.comment } : undefined,
        wish: undefined,
      };
    case "annule":
      return { ...base, cancelledOn: d.cancelledAt ? dayMonth(d.cancelledAt) : undefined, examinedOn: e ? dayMonth(e.at) : undefined, wish: undefined };
  }
}

export function studentDeposits(viewerId: string): { current: Deposit[]; done: Deposit[] } {
  const db = data();
  const mine = db.deposits.filter((d) => d.userId === viewerId);
  const open = (d: DepositRow) => d.status === "brouillon" || d.status === "rendez-vous" || d.status === "a-signer";
  const when = (d: DepositRow) => d.waiver?.signedAt ?? d.expertise?.at ?? d.cancelledAt ?? d.createdAt;
  return {
    current: mine
      .filter(open)
      .sort((x, y) => (x.slot ?? "9999") < (y.slot ?? "9999") ? -1 : 1)
      .map((d) => toDeposit(db, d)),
    done: mine
      .filter((d) => !open(d))
      .sort((x, y) => (when(y) > when(x) ? 1 : -1))
      .map((d) => toDeposit(db, d)),
  };
}

export function depositOf(viewerId: string, ref: string): Deposit | null {
  const db = data();
  const d = db.deposits.find((x) => x.ref === ref && x.userId === viewerId);
  return d ? toDeposit(db, d) : null;
}

export type Schedule = { days: AppointmentDay[]; times: string[]; dates: string[] };

/** Les quatre prochains jours d'ouverture de LBC (lundi au samedi), avec les créneaux pris ou passés. */
export function schedule(exceptRef?: string): Schedule {
  const db = data();
  const dates: string[] = [];
  for (let i = 0; dates.length < 4; i++) {
    const d = addDays(TODAY, i);
    if (weekday(d) !== 0) dates.push(d);
  }
  const nowMinutes = minutesOf(now());
  const days = dates.map((date) => {
    const taken = APPOINTMENT_TIMES.flatMap((t, i) => {
      const slot = `${date}T${parseTime(t)}`;
      const busy = db.deposits.some((d) => d.slot === slot && d.ref !== exceptRef && d.status !== "annule" && d.status !== "brouillon");
      const past = date === TODAY && minutesOf(slot) <= nowMinutes;
      return busy || past ? [i] : [];
    });
    return { ...pickerDay(date), freeCount: APPOINTMENT_TIMES.length - taken.length, taken };
  });
  return { days, times: APPOINTMENT_TIMES, dates };
}

/** Rang (jour, créneau) d'un rendez-vous dans le planning, s'il y figure. */
export function slotPosition(slot: string | null, s: Schedule): { day: number; slot: number } | null {
  if (!slot) return null;
  const day = s.dates.indexOf(dateOf(slot));
  const t = s.times.findIndex((x) => parseTime(x) === slot.slice(11));
  return day >= 0 && t >= 0 ? { day, slot: t } : null;
}

/** Premier créneau libre du planning. */
export function firstFree(s: Schedule): { day: number; slot: number | null } {
  for (let day = 0; day < s.days.length; day++) {
    const slot = s.times.findIndex((_, i) => !s.days[day].taken.includes(i));
    if (slot !== -1) return { day, slot };
  }
  return { day: 0, slot: null };
}

/** Changer le rendez-vous : le dépôt, le planning (son créneau compté libre) et sa position actuelle. */
export function reschedulePage(viewerId: string, ref: string) {
  const d = data().deposits.find((x) => x.ref === ref && x.userId === viewerId && x.status === "rendez-vous");
  if (!d) return null;
  const s = schedule(d.ref);
  const current = slotPosition(d.slot, s);
  return { deposit: toDeposit(data(), d), days: s.days, times: s.times, current, initial: current ?? firstFree(s) };
}

/** Brouillon de l'étudiant, à reprendre dans le formulaire de dépôt. */
export function draftOf(viewerId: string, ref: string): (Partial<DepositRequest> & { draftRef: string }) | null {
  const d = data().deposits.find((x) => x.ref === ref && x.userId === viewerId && x.status === "brouillon");
  if (!d) return null;
  const piece = d.category === "piece";
  return {
    draftRef: d.ref,
    category: d.category,
    modele: d.modele,
    stockage: d.stockage,
    age: d.age,
    ...(piece ? { etatPiece: d.etat as DepositRequest["etatPiece"] } : { etat: d.etat as DepositRequest["etat"] }),
    souhait: d.wish,
  };
}

export function depositsSuspension(): { suspended: boolean; reason?: string } {
  const db = data();
  const suspended = suspendedNow(db);
  return { suspended, reason: suspended ? db.config.suspensionReason ?? "La couverture du stock est passée sous le seuil." : undefined };
}

export function bonusOffer(): { rate: number; quota: number; left: number } | null {
  const b = data().config.bonus;
  return b.active && b.used < b.quota ? { rate: b.rate, quota: b.quota, left: b.quota - b.used } : null;
}

// ---------------------------------------------------------------- solde

export function balancePage(viewerId: string) {
  const db = data();
  const balance = user(db, viewerId).balance ?? 0;
  const items = marketItems(viewerId);
  const online = items.filter((i) => !i.reserved);
  const phones = online.filter((i) => i.category === "tel" && i.photo);
  const ref = [...(phones.length ? phones : online)].sort((a, b) => a.price - b.price)[0];
  const moves = db.movements.filter((m) => m.userId === viewerId);
  const movements: Movement[] = [...moves].reverse().map((m) => ({ date: dayMonthYearShort(m.at), type: m.type, detail: m.detail, amount: m.amount, balanceAfter: m.balanceAfter }));
  return {
    balance,
    itemsInBalance: online.filter((i) => i.price <= balance).length,
    reference: ref ? { name: ref.name.split(" · ")[0], price: ref.price } : { name: "Tecno Spark 4", price: 24500 },
    history: balanceHistory(db, viewerId),
    movements,
  };
}

/** « Depuis votre premier dépôt » : le solde et le prix de l'objet déposé, aux mêmes dates. */
function balanceHistory(db: Db, viewerId: string): { itemName: string; points: BalancePoint[] } | null {
  const moves = db.movements.filter((m) => m.userId === viewerId);
  const first = moves.find((m) => m.type === "reprise");
  if (!first) return null;
  const deposit = db.deposits.find((d) => d.userId === viewerId && d.waiver?.signedAt === first.at);
  if (!deposit || !deposit.expertise || deposit.expertise.decision === "refuse") return null;
  let price = deposit.expertise.listPrice;
  const balanceAt = (date: string) => [...moves].reverse().find((m) => dateOf(m.at) <= date)?.balanceAfter ?? 0;
  const start = dateOf(first.at);
  const points: BalancePoint[] = [{ label: dayMonthShort(start), day: 0, balance: balanceAt(start), price }];
  const fonteDates = [...new Set(moves.filter((m) => m.type === "fonte" && dateOf(m.at) > start).map((m) => dateOf(m.at)))];
  for (const d of fonteDates) {
    price = afterFonte(price, 1);
    points.push({ label: dayMonthShort(d), day: daysBetween(start, d), balance: balanceAt(d), price });
  }
  const next = `${TODAY.slice(0, 5)}${String(Number(TODAY.slice(5, 7)) + 1).padStart(2, "0")}-01`;
  const current = balanceAt(TODAY);
  points.push({ label: dayMonthShort(next), day: daysBetween(start, next), balance: afterFonte(current, 1), price: afterFonte(price, 1), projected: true });
  return { itemName: deposit.modele, points };
}

// ---------------------------------------------------------------- renoncement

export function waiverOf(ref: string): Waiver | null {
  const db = data();
  const d = db.deposits.find((x) => x.ref === ref);
  const e = d?.expertise;
  if (!d || !e || e.decision === "refuse" || (d.status !== "a-signer" && d.status !== "repris")) return null;
  const u = user(db, d.userId);
  const agent = user(db, d.waiver?.agentId ?? e.agentId);
  const b = db.config.bonus;
  const signed = d.waiver;
  return {
    ref: d.ref,
    place: "LBC, campus de l'UGB, entre les villages E et F",
    openedAt: fullStamp(e.at),
    depositor: { name: shortName(u), card: u.numeroCarte ?? "", study: study(u) },
    device: { name: deviceName(d), serial: e.serial ? maskSerial(e.serial) : "non relevé", condition: e.condition, battery: e.battery },
    wish: d.wish,
    takeBack: e.takeBack,
    listPrice: e.listPrice,
    bonusRate: signed ? signed.bonusRate : b.active && b.used < b.quota ? b.rate : 0,
    pieces: e.decision === "pieces",
    balanceBefore: signed ? signed.balanceBefore : u.balance ?? 0,
    signedAt: signed ? stampYear(signed.signedAt) : "",
    agent: `${agent.poste ?? "Comptoir"} · ${shortName(agent)}`,
    hash: signed?.hash ?? "",
  };
}

/** Le dépôt appartient-il à cet étudiant, et dans quel état est-il ? */
export function depositState(ref: string): { userId: string; status: DepositRow["status"] } | null {
  const d = data().deposits.find((x) => x.ref === ref.toUpperCase());
  return d ? { userId: d.userId, status: d.status } : null;
}

// ---------------------------------------------------------------- accueil

export function homePage() {
  const db = data();
  const repris = db.deposits.filter((d) => d.status === "repris" && d.waiver);
  const recentTakeBacks: RecentTakeBack[] = repris
    .map((d) => ({ d, a: db.articles.find((x) => x.id === d.articleId) }))
    .filter((x) => x.a?.photo && x.d.expertise && x.d.expertise.decision !== "refuse")
    .sort((x, y) => (y.d.waiver!.signedAt > x.d.waiver!.signedAt ? 1 : -1))
    .slice(0, 5)
    .map(({ d, a }) => ({
      photo: a!.photo!,
      points: d.expertise!.decision !== "refuse" ? d.expertise!.takeBack : 0,
      label: `${d.modele} · repris le ${dayMonthShort(d.waiver!.signedAt)}`,
    }));
  const items = marketItems();
  const wanted = ["airpods", "casque-sony", "galaxy-a12", "ipad-2017"];
  const available = items.filter((i) => !i.reserved && i.photo);
  const preview = [...wanted.map((s) => available.find((i) => i.slug === s)).filter((i): i is MarketItem => !!i), ...available].filter(
    (i, idx, arr) => arr.indexOf(i) === idx,
  );
  return { recentTakeBacks, takenBackCount: repris.length, previewItems: preview.slice(0, 4), previewBalance: 30000, marketTotal: items.length };
}

// ---------------------------------------------------------------- comptoir LBC

const APPOINTMENT_STATUS: Record<DepositRow["status"], AppointmentStatus> = {
  brouillon: "a-venir",
  "demande-rdv": "a-planifier",
  "rendez-vous": "a-venir",
  "a-signer": "a-signer",
  repris: "repris",
  refuse: "refuse",
  annule: "annule",
};

function deviceInfo(d: DepositRow): string {
  const e = d.expertise;
  const condition = e && e.decision !== "refuse" ? e.condition : d.etat;
  return [CATEGORY_NAME[d.category], AGE_NAME[d.age], CONDITION_NAME[condition]].join(" · ");
}

function toAppointment(db: Db, d: DepositRow): Appointment {
  const u = user(db, d.userId);
  const e = d.expertise;
  return {
    time: d.slot ? time(d.slot) : "",
    student: { name: shortName(u), initials: `${u.prenom.charAt(0)}${u.nom.charAt(0)}`.toUpperCase(), card: u.numeroCarte ?? "" },
    depositRef: d.ref,
    device: deviceName(d),
    deviceInfo: deviceInfo(d),
    wish: d.wish,
    status: APPOINTMENT_STATUS[d.status],
    takeBack: e && e.decision !== "refuse" && d.status === "repris" ? e.takeBack : undefined,
    refusalShort: e && e.decision === "refuse" ? REFUSAL_SHORT[e.reason] : undefined,
  };
}

function appointmentsOn(db: Db, date: string): Appointment[] {
  return db.deposits
    .filter((d) => d.slot && dateOf(d.slot) === date && d.status !== "brouillon")
    .sort((x, y) => (x.slot! < y.slot! ? -1 : 1))
    .map((d) => toAppointment(db, d));
}

/** Jour d'ouverture de LBC le plus proche, avant ou après (la boutique ferme le dimanche). */
function openingDay(from: string, step: 1 | -1): string {
  let d = addDays(from, step);
  while (weekday(d) === 0) d = addDays(d, step);
  return d;
}

/** La veille d'ouverture, aujourd'hui, et le prochain jour d'ouverture, avec le libellé court de chaque bouton. */
export function counterDays() {
  const db = data();
  const day = (date: string, short: string) => ({ label: longDate(date), short, appointments: appointmentsOn(db, date) });
  const before = openingDay(TODAY, -1);
  const after = openingDay(TODAY, 1);
  const name = (date: string) => capitalize(longDate(date).split(" ")[0].toLowerCase());
  return {
    hier: day(before, before === addDays(TODAY, -1) ? "Hier" : name(before)),
    aujourdhui: day(TODAY, "Aujourd'hui"),
    demain: day(after, after === addDays(TODAY, 1) ? "Demain" : name(after)),
  };
}

/** Rendez-vous du jour qui attendent l'expertise. */
export function expertiseQueue(): Appointment[] {
  return appointmentsOn(data(), TODAY).filter((a) => a.status === "a-venir");
}

export function declaredDevice(ref: string): DeclaredDevice | null {
  const db = data();
  const d = db.deposits.find((x) => x.ref === ref.toUpperCase());
  if (!d) return null;
  const u = user(db, d.userId);
  return {
    depositRef: d.ref,
    student: { name: shortName(u), card: u.numeroCarte ?? "" },
    appointmentTime: d.slot ? (dateOf(d.slot) === TODAY ? time(d.slot) : `${weekdayDayMonth(d.slot)}, ${time(d.slot)}`) : "sans rendez-vous",
    category: d.category,
    modele: d.modele,
    stockage: d.stockage || "non indiqué",
    age: d.age,
    etat: d.etat,
    photoCount: d.photoCount,
    wish: d.wish,
  };
}

export const expertiseControls = (category: Category) => controlsFor(category);

export function expertiseBonus(): { rate: number; rank: number; quota: number } | null {
  const b = data().config.bonus;
  return b.active && b.used < b.quota ? { rate: b.rate, rank: b.used + 1, quota: b.quota } : null;
}

export function processedDeposit(ref: string): ProcessedDeposit | null {
  const db = data();
  const d = db.deposits.find((x) => x.ref === ref.toUpperCase());
  const e = d?.expertise;
  if (!d || !e || (d.status !== "repris" && d.status !== "refuse")) return null;
  const u = user(db, d.userId);
  const agent = user(db, e.agentId);
  const battery = e.decision !== "refuse" && e.battery !== null ? ` · batterie ${e.battery} %` : "";
  return {
    ref: d.ref,
    student: { name: shortName(u), card: u.numeroCarte ?? "" },
    device: deviceName(d),
    deviceInfo: `${deviceInfo(d)}${battery}`,
    examinedAt: `${weekdayDayMonth(e.at)}, ${time(e.at)}`,
    agent: `${agent.poste ?? "Comptoir"} · ${shortName(agent)}`,
    wish: d.wish,
    outcome:
      e.decision === "refuse"
        ? { status: "refuse", reason: e.reason, comment: e.comment }
        : {
            status: "repris",
            takeBack: e.takeBack,
            listPrice: e.listPrice,
            bonus: d.waiver?.bonus ?? 0,
            pieces: e.decision === "pieces",
            signedAt: d.waiver ? stampYear(d.waiver.signedAt) : "",
            articleId: d.articleId,
          },
  };
}

// ---------------------------------------------------------------- stock

function toStockArticle(db: Db, a: ArticleRow): StockArticle {
  const q = a.status === "reserve" ? activeAcquisition(db, a.id) : undefined;
  return {
    id: a.id,
    name: a.name,
    info: a.info,
    category: a.category,
    condition: a.condition,
    battery: a.battery,
    photo: a.photo?.src,
    origin: a.origin,
    originRef: a.depositRef,
    onlineSince: a.onlineSince ? dayMonthShort(a.onlineSince) : "pas encore",
    initialPrice: a.initialPrice,
    todayPrice: a.todayPrice,
    status: a.status,
    // Remise possible seulement une fois le paiement confirmé.
    acquisitionRef: q?.status === "reserve" ? q.ref : undefined,
    statusNote: q?.status === "en-attente" ? "paiement en attente" : a.statusNote,
  };
}

const STOCK_ORDER: Record<ArticleRow["status"], number> = { "a-photographier": 0, reserve: 1, "en-boutique": 2, "en-ligne": 3, remis: 4, retire: 5 };

export function stockPage(): { summary: StockSummary | null; articles: StockArticle[]; counts: { tout: number; depot: number; boutique: number } } {
  const db = data();
  const articles = [...db.articles]
    .sort((x, y) => STOCK_ORDER[x.status] - STOCK_ORDER[y.status] || ((y.onlineSince ?? y.createdAt) > (x.onlineSince ?? x.createdAt) ? 1 : -1))
    .map((a) => toStockArticle(db, a));
  const online = db.articles.filter((a) => a.status === "en-ligne");
  const lastMonth = monthKey(`${TODAY.slice(0, 5)}${String(Number(TODAY.slice(5, 7)) - 1).padStart(2, "0")}-01`);
  const left = db.acquisitions.filter((q) => q.status === "remis" && q.handedAt && monthKey(q.handedAt) === lastMonth);
  return {
    summary: db.articles.length
      ? {
          online: online.length,
          onlineFromShop: online.filter((a) => a.origin === "boutique").length,
          displayedValue: online.reduce((s, a) => s + a.todayPrice, 0),
          reserved: db.articles.filter((a) => a.status === "reserve").length,
          leftLastMonth: left.length,
          leftWithComplement: left.filter((q) => q.complement > 0).length,
          lastMonthLabel: monthName(TODAY, -1),
        }
      : null,
    articles,
    counts: {
      tout: db.articles.length,
      depot: db.articles.filter((a) => a.origin === "depot").length,
      boutique: db.articles.filter((a) => a.origin === "boutique").length,
    },
  };
}

export function stockArticle(id: string): StockArticle | null {
  const db = data();
  const a = db.articles.find((x) => x.id === id);
  return a ? toStockArticle(db, a) : null;
}

export function coveragePage(): { coverage: CoverageSnapshot; history: CoveragePoint[]; margins: MarginRow[] } {
  const db = data();
  const at = now();
  const snaps = [...db.snapshots, { at, stock: stockValue(db), debt: debt(db) }];
  const start = dateOf(snaps[0].at);
  const history = snaps.map((s) => ({ label: dayMonthShort(s.at), day: daysBetween(start, dateOf(s.at)), stock: s.stock, debt: s.debt, event: "event" in s ? s.event : undefined }));

  const byMonth = new Map<string, number[]>();
  for (const d of db.deposits) {
    const e = d.expertise;
    if (!e || e.decision !== "accepte" || e.listPrice <= 0) continue;
    const key = monthKey(e.at);
    byMonth.set(key, [...(byMonth.get(key) ?? []), (e.listPrice - e.takeBack) / e.listPrice]);
  }
  const margins = [...byMonth.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([key, list]) => ({
      month: `${monthTitle(`${key}-01`)}${key === monthKey(TODAY) ? ", en cours" : ""}`,
      expertises: list.length,
      margin: list.reduce((s, x) => s + x, 0) / list.length,
    }));

  return {
    coverage: {
      computedAt: `Calculé le ${stampYear(at)}`,
      ratio: coverageRatio(db),
      pointsInCirculation: debt(db),
      studentAccounts: db.users.filter((u) => u.role === "ETUDIANT").length,
      stockValue: stockValue(db),
      stockCount: coveringArticles(db).length,
      thresholds: THRESHOLDS,
    },
    history,
    margins,
  };
}

// ---------------------------------------------------------------- administration

export function depositsState(): DepositsState {
  const db = data();
  const c = db.config;
  const at = now();
  return {
    suspended: c.depositsSuspended,
    reason: c.suspensionReason,
    suspendedAt: c.suspendedAt ? stampAt(c.suspendedAt) : undefined,
    coverageRatio: coverageRatio(db),
    autoSuspendBelow: THRESHOLDS.suspend,
    upcomingAppointments: db.deposits.filter((d) => d.status === "rendez-vous" && d.slot && d.slot >= at).length,
  };
}

export function launchBonus(): LaunchBonus {
  const b = data().config.bonus;
  return { active: b.active && b.used < b.quota, rate: b.rate, quota: b.quota, used: b.used };
}

/** Contrôle des soldes : solde enregistré face à la somme des mouvements. */
export function balanceMismatches(): BalanceMismatch[] {
  const db = data();
  return db.users
    .filter((u) => u.role === "ETUDIANT")
    .map((u) => ({ card: u.numeroCarte ?? "", recorded: u.balance ?? 0, computed: db.movements.filter((m) => m.userId === u.id).reduce((s, m) => s + m.amount, 0) }))
    .filter((x) => x.recorded !== x.computed);
}

export function scheduledTasks(): ScheduledTask[] {
  const db = data();
  const f = db.config.lastFonte;
  const mismatches = balanceMismatches().length;
  const pending = db.acquisitions.filter((q) => q.status === "en-attente").length;
  const at = now();
  const tenMinutes = `${at.slice(0, 15)}0`;
  return [
    {
      name: "Baisse mensuelle",
      description: "Points et prix, même taux, même arrondi",
      frequency: "Le 1er du mois",
      lastRun: f ? stamp(f.at) : "pas encore",
      result: f ? `${f.accounts} comptes et ${f.articles} annonces` : "—",
      tone: "ok",
    },
    {
      name: "Contrôle des soldes",
      description: "Solde enregistré face à la somme des mouvements",
      frequency: "Chaque nuit",
      lastRun: stamp(`${TODAY}T03:00`),
      result: mismatches ? `${mismatches} écart${mismatches > 1 ? "s" : ""}` : "Aucun écart",
      tone: mismatches ? "danger" : "ok",
    },
    {
      name: "Couverture",
      description: "Dette en points face à la valeur du stock",
      frequency: "Chaque matin",
      lastRun: stamp(`${TODAY}T06:00`),
      result: `${Math.round(coverageRatio(db) * 100)} %`,
      tone: coverageRatio(db) < THRESHOLDS.watch ? "danger" : "ok",
    },
    {
      name: "Rapprochement des paiements",
      description: "Paiements Wave et Orange Money restés en attente",
      frequency: "Toutes les 10 min",
      lastRun: stamp(tenMinutes),
      result: pending ? `${pending} en attente` : "Aucun paiement en attente",
      tone: "neutral",
    },
  ];
}

export function accountSummaries(): AccountSummary[] {
  return data()
    .users.filter((u) => u.role === "ETUDIANT")
    .sort((a, b) => a.nom.localeCompare(b.nom, "fr"))
    .map((u) => ({
      name: `${u.prenom} ${u.nom}`,
      initials: `${u.prenom.charAt(0)}${u.nom.charAt(0)}`.toUpperCase(),
      card: u.numeroCarte ?? "",
      study: study(u),
      active: u.active !== false,
      balance: u.balance ?? 0,
    }));
}

export function adminLog(): AdminLogEntry[] {
  return [...data().log]
    .sort((a, b) => (b.at > a.at ? 1 : -1))
    .map((l) => ({ at: stamp(l.at), type: l.type, target: l.target, change: l.change, reason: l.reason, by: l.by }));
}
