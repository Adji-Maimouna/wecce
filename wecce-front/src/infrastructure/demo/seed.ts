import type { Category, Condition, InspectionCheck, PaymentMethod, Photo, RefusalReason } from "@/domain/entities";
import type { Db, DepositRow, UserRow } from "./db";
import {
  acquire,
  addArticle,
  adjust,
  articleById,
  confirmPayment,
  createDeposit,
  depositByRef,
  handOver,
  monthlyFonte,
  publish,
  recordExpertise,
  refuse,
  saveBonus,
  setSuspended,
  sign,
  signature,
  snapshot,
  withdraw,
} from "./engine";

/*
 * Données de départ du serveur simulé : deux mois et demi de vie de Wecce, du 1er septembre
 * au samedi 7 novembre 2026. Rien n'est écrit à la main dans les soldes ou les prix :
 * chaque évènement passe par les opérations du serveur (engine.ts), dans l'ordre du calendrier.
 * Soldes, mouvements, stock, couverture et journal sont donc cohérents entre eux.
 */

/** Mot de passe de tous les comptes de démonstration. */
export const DEMO_PASSWORD = "wecce2026";

const PHOTOS = {
  redmi: { src: "/img/redmi.jpg", alt: "Redmi Note 8, face avant, écran allumé", width: 480, height: 640 },
  a12: { src: "/img/galaxya12.jpg", alt: "Galaxy A12 noir, vue de dos sur le bloc photo", width: 720, height: 960 },
  ssd: { src: "/img/ssd.jpg", alt: "SSD 2,5 pouces de 1 To", width: 500, height: 281 },
  t480: { src: "/img/thinkpad.jpg", alt: "ThinkPad T480 ouvert sur une table", width: 500, height: 477 },
  airpods: { src: "/img/airpods.jpg", alt: "AirPods et leur boîtier de charge ouvert", width: 500, height: 318 },
  ip11: { src: "/img/iphone11.jpg", alt: "iPhone 11 rouge posé sur sa boîte", width: 500, height: 615 },
  sony: { src: "/img/casque.jpg", alt: "Casque Sony WH-CH510 bleu", width: 500, height: 374 },
  probook: { src: "/img/probook.jpg", alt: "Ordinateur portable HP ProBook ouvert", width: 500, height: 518 },
  ipad: { src: "/img/ipad.jpg", alt: "iPad 2017 vu de face", width: 453, height: 640 },
  tecno: { src: "/img/tecno.jpg", alt: "Tecno Spark 4 bleu, vue de dos", width: 309, height: 640 },
  ram: { src: "/img/ram.jpg", alt: "Barrette de mémoire DDR4 SO-DIMM", width: 500, height: 248 },
  jbl: { src: "/img/jbl.jpg", alt: "Enceinte JBL Go rouge", width: 500, height: 375 },
  latitude: { src: "/img/latitude.jpg", alt: "Dell Latitude E6540 ouvert sur un bureau", width: 500, height: 375 },
  tab: { src: "/img/galaxytab.jpg", alt: "Galaxy Tab A avec son stylet S Pen", width: 417, height: 640 },
  mac: { src: "/img/macbook.jpg", alt: "MacBook noir ouvert", width: 500, height: 372 },
  batt: { src: "/img/batterie.jpg", alt: "Batterie lithium-ion d'ordinateur portable Fujitsu", width: 500, height: 310 },
  s9: { src: "/img/galaxys9.jpg", alt: "Galaxy S9+ vu de côté", width: 500, height: 281 },
  ibm: { src: "/img/hdd.jpg", alt: "Disque dur IBM Travelstar 2,5 pouces", width: 360, height: 640 },
} satisfies Record<string, Photo>;

type Student = [id: string, prenom: string, nom: string, card: string, niveau: string, ufr: string, createdAt: string];

const STUDENTS: Student[] = [
  ["u-moussa", "Moussa", "Diallo", "2024-1183", "Licence 3", "SAT", "2026-09-10T18:20"],
  ["u-aissatou", "Aïssatou", "Sarr", "2023-0871", "Master 1", "SJP", "2026-11-03T12:10"],
  ["u-ismaila", "Ismaïla", "Ndiaye", "2025-0213", "Licence 1", "SEG", "2026-09-16T09:00"],
  ["u-fatou", "Fatou", "Diop", "2024-0456", "Licence 2", "LSH", "2026-10-30T19:45"],
  ["u-omar", "Omar", "Ba", "2022-1120", "Master 2", "SAT", "2026-09-04T11:30"],
  ["u-khady", "Khady", "Sy", "2025-0098", "Licence 1", "2S", "2026-09-25T17:05"],
  ["u-babacar", "Babacar", "Thiam", "2023-0412", "Licence 3", "SEG", "2026-09-02T08:40"],
  ["u-ndeye", "Ndèye", "Sow", "2024-0877", "Licence 2", "SJP", "2026-09-06T10:15"],
  ["u-aliou", "Aliou", "Diouf", "2025-0150", "Licence 1", "SAT", "2026-09-12T15:00"],
  ["u-mariama", "Mariama", "Faye", "2024-0091", "Master 1", "LSH", "2026-09-29T20:30"],
  ["u-cheikh", "Cheikh", "Bâ", "2025-0333", "Licence 1", "S2ATA", "2026-10-02T13:25"],
];

const ascii = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

function users(): UserRow[] {
  const students: UserRow[] = STUDENTS.map(([id, prenom, nom, card, niveau, ufr, createdAt], i) => ({
    id,
    role: "ETUDIANT",
    prenom,
    nom,
    email: `${ascii(prenom)}.${ascii(nom)}@exemple.sn`,
    telephone: `77 000 00 ${String(i === 0 ? 0 : 10 + i).padStart(2, "0")}`,
    password: DEMO_PASSWORD,
    createdAt,
    numeroCarte: card,
    niveau,
    ufr,
    active: true,
    balance: 0,
  }));
  return [
    ...students,
    {
      id: "u-awa",
      role: "AGENT",
      prenom: "Awa",
      nom: "Ndiaye",
      email: "comptoir1@lbc.exemple.sn",
      telephone: "77 000 00 01",
      password: DEMO_PASSWORD,
      createdAt: "2026-08-28T10:00",
      fonction: "Agente de comptoir",
      peutExpertiser: true,
      poste: "Comptoir 1",
    },
    {
      id: "u-admin",
      role: "ADMIN",
      prenom: "Ibrahima",
      nom: "Fall",
      email: "admin@wecce.exemple.sn",
      telephone: "77 000 00 02",
      password: DEMO_PASSWORD,
      createdAt: "2026-08-20T09:00",
      portee: "GLOBAL",
    },
  ];
}

const AGENT = "u-awa";

type Step = { at: string; run: (db: Db) => void };

/** Un dépôt avec son rendez-vous. */
type Declared = {
  ref: string;
  user: string;
  created: string;
  slot: string | null;
  category: Category;
  modele: string;
  stockage?: string;
  age?: DepositRow["age"];
  etat?: DepositRow["etat"];
  photos?: number;
  wish?: number | null;
};

function declare(d: Declared): Step {
  return {
    at: d.created,
    run: (db) =>
      createDeposit(
        db,
        d.user,
        {
          ref: d.ref,
          category: d.category,
          modele: d.modele,
          stockage: d.stockage ?? "",
          age: d.age ?? "1-2",
          etat: d.etat ?? (d.category === "piece" ? "fonctionnel" : "bon"),
          photos: [],
          photoCount: d.photos ?? 3,
          wish: d.wish ?? null,
          slot: d.slot,
        },
        d.created,
      ),
  };
}

/** Examen accepté puis signature, quelques minutes plus tard. La fiche peut être enrichie (slug, photo, vérifications). */
function takenBack(
  ref: string,
  at: string,
  v: { condition: Condition; battery?: number; takeBack: number; listPrice: number; pieces?: boolean; serial?: string },
  article?: {
    slug?: string;
    photo?: Photo;
    /** Mis en ligne sans photo. */
    online?: boolean;
    keywords?: string;
    title?: string;
    details?: string;
    detail?: string;
    checks?: InspectionCheck[];
  },
): Step[] {
  const signedAt = `${at.slice(0, 11)}${String(Number(at.slice(11, 13))).padStart(2, "0")}:${String(Math.min(59, Number(at.slice(14)) + 9)).padStart(2, "0")}`;
  return [
    {
      at,
      run: (db) =>
        recordExpertise(
          db,
          AGENT,
          ref,
          {
            pieces: v.pieces ?? false,
            condition: v.condition,
            battery: v.battery ?? null,
            serial: v.serial ?? "",
            takeBack: v.takeBack,
            listPrice: v.listPrice,
          },
          at,
        ),
    },
    {
      at: signedAt,
      run: (db) => {
        sign(db, ref, signedAt, article?.photo);
        const d = depositByRef(db, ref);
        if (!article || !d.articleId) return;
        const a = articleById(db, d.articleId);
        if (article.slug) a.slug = article.slug;
        if (article.keywords) a.keywords = article.keywords;
        if (article.title) a.title = article.title;
        if (article.details) a.details = article.details;
        if (article.detail) a.detail = article.detail;
        if (article.checks) a.checks = article.checks;
        if (article.online && a.status === "a-photographier") publish(db, a.id, signedAt);
      },
    },
  ];
}

function refused(ref: string, at: string, reason: RefusalReason, comment: string): Step {
  return { at, run: (db) => refuse(db, AGENT, ref, reason, comment, at) };
}

/** Article du stock propre de LBC, mis en ligne directement. */
function shopItem(
  at: string,
  a: { slug: string; name: string; keywords?: string; category: Category; condition: Condition; battery?: number; detail?: string; info: string; price: number; photo?: Photo },
): Step {
  return {
    at,
    run: (db) => addArticle(db, { ...a, origin: "boutique", status: "en-ligne", at }),
  };
}

/** Un étudiant prend un objet ; un paiement mobile est confirmé une minute plus tard, la remise suit. */
function bought(user: string, slug: string, method: PaymentMethod, at: string, handedAt?: string): Step[] {
  const confirmAt = `${at.slice(0, 14)}${String(Math.min(59, Number(at.slice(14)) + 1)).padStart(2, "0")}`;
  return [
    {
      at,
      run: (db) => {
        const article = db.articles.find((x) => x.slug === slug)!;
        const q = acquire(db, user, article.id, method, at);
        if (q.status === "en-attente") confirmPayment(db, q.ref, confirmAt);
        if (handedAt) handOver(db, q.ref, handedAt);
      },
    },
  ];
}

const mondays = ["2026-09-01", "2026-09-08", "2026-09-15", "2026-09-22", "2026-09-29", "2026-10-06", "2026-10-13", "2026-10-20", "2026-10-27", "2026-11-03"];
const EVENTS: Record<string, string> = {
  "2026-10-06": "après la baisse du 1er octobre",
  "2026-11-03": "après la baisse du 1er novembre",
};

function scenario(): Step[] {
  const admin = (db: Db) => signature(db.users.find((u) => u.id === "u-admin")!);
  return [
    // Ouverture
    { at: "2026-09-01T07:50", run: (db) => saveBonus(db, 20, 100, "Ouverture de la plateforme.", "2026-09-01T07:50", admin(db)) },
    shopItem("2026-09-01T09:00", { slug: "jbl-go", name: "Enceinte JBL Go", keywords: "JBL Go enceinte", category: "audio", condition: "bon", info: "Bon état", price: 12200, photo: PHOTOS.jbl }),
    shopItem("2026-09-01T09:05", { slug: "ssd-1-to", name: "SSD 2,5″ · 1 To SATA", keywords: "SSD 2,5 1 To SATA disque", category: "piece", condition: "fonctionnel", detail: "Âge inconnu", info: "Fonctionnel · testé", price: 34400, photo: PHOTOS.ssd }),
    shopItem("2026-09-01T09:10", { slug: "galaxy-j5", name: "Galaxy J5 · 16 Go", keywords: "Galaxy J5 16 Go Samsung", category: "tel", condition: "use", battery: 74, info: "Usé · batterie 74 %", price: 26000 }),
    shopItem("2026-09-01T09:15", { slug: "chargeur-magsafe", name: "Chargeur MagSafe 2 · 60 W", keywords: "Chargeur MagSafe Apple MacBook", category: "piece", condition: "fonctionnel", info: "Fonctionnel", price: 9000 }),
    shopItem("2026-09-01T09:20", { slug: "cle-usb-sandisk", name: "Clé USB SanDisk · 64 Go", keywords: "Clé USB SanDisk 64 Go", category: "piece", condition: "fonctionnel", info: "Fonctionnel", price: 5000 }),
    shopItem("2026-09-02T10:00", { slug: "hp-probook", name: "HP ProBook · 8 Go", keywords: "HP ProBook 8 Go ordinateur", category: "ordi", condition: "bon", battery: 77, info: "Bon état · batterie 77 %", price: 108600, photo: PHOTOS.probook }),
    shopItem("2026-09-02T10:05", { slug: "ram-ddr4-16", name: "RAM DDR4 SO-DIMM · 16 Go", keywords: "RAM DDR4 SO-DIMM 16 Go barrette mémoire", category: "piece", condition: "fonctionnel", detail: "Âge inconnu", info: "Fonctionnel · testée", price: 21000, photo: PHOTOS.ram }),
    shopItem("2026-09-03T11:00", { slug: "dell-latitude", name: "Dell Latitude E6540", keywords: "Dell Latitude E6540 ordinateur", category: "ordi", condition: "use", battery: 71, info: "Usé · batterie 71 %", price: 94700, photo: PHOTOS.latitude }),
    shopItem("2026-09-03T11:05", { slug: "batterie-fujitsu", name: "Batterie Fujitsu Amilo", keywords: "Batterie Fujitsu Amilo portable", category: "piece", condition: "fonctionnel", detail: "Tient 2 h", info: "Fonctionnelle · tient 2 h", price: 7200, photo: PHOTOS.batt }),
    { at: "2026-09-01T07:55", run: (db) => db.log.push({ at: "2026-09-01T07:55", type: "configuration", target: "Dépôts", change: "Fermés → ouverts", reason: "Ouverture de la plateforme avec les articles de la boutique.", by: admin(db) }) },

    // Septembre
    declare({ ref: "WC-2026-0412", user: "u-moussa", created: "2026-09-10T18:30", slot: "2026-09-14T10:00", category: "tel", modele: "Redmi Note 8", stockage: "64 Go", wish: 35000 }),
    ...takenBack("WC-2026-0412", "2026-09-14T10:06", { condition: "bon", battery: 86, takeBack: 30000, listPrice: 40000, serial: "R58K44Q2" }, { slug: "redmi-note-8", photo: PHOTOS.redmi, keywords: "Redmi Note 8 64 Go Xiaomi" }),
    declare({ ref: "WC-2026-0433", user: "u-aliou", created: "2026-09-13T09:00", slot: "2026-09-18T11:00", category: "piece", modele: "Disque dur IBM Travelstar 2,5″", stockage: "4 Go", age: "inconnu" }),
    ...takenBack("WC-2026-0433", "2026-09-18T11:04", { condition: "fonctionnel", takeBack: 4500, listPrice: 6000 }, { slug: "ibm-travelstar", photo: PHOTOS.ibm }),
    declare({ ref: "WC-2026-0455", user: "u-ismaila", created: "2026-09-16T09:30", slot: "2026-09-19T10:00", category: "tel", modele: "Redmi 9A", stockage: "32 Go", wish: 18000 }),
    ...takenBack("WC-2026-0455", "2026-09-19T10:05", { condition: "bon", battery: 90, takeBack: 14000, listPrice: 18700 }, { slug: "redmi-9a", online: true }),
    declare({ ref: "WC-2026-0466", user: "u-babacar", created: "2026-09-18T20:00", slot: "2026-09-22T10:00", category: "tel", modele: "Tecno Spark 4", stockage: "32 Go", age: "2-3", etat: "use", wish: 22000 }),
    ...takenBack("WC-2026-0466", "2026-09-22T10:04", { condition: "use", battery: 79, takeBack: 20000, listPrice: 27100 }, { slug: "tecno-spark-4", photo: PHOTOS.tecno, keywords: "Tecno Spark 4 32 Go" }),
    declare({ ref: "WC-2026-0488", user: "u-moussa", created: "2026-09-18T21:10", slot: "2026-09-24T15:00", category: "audio", modele: "Casque JBL Tune 500", age: "2-3" }),
    { at: "2026-09-22T19:30", run: (db) => Object.assign(depositByRef(db, "WC-2026-0488"), { status: "annule", cancelledAt: "2026-09-22T19:30" }) },
    declare({ ref: "WC-2026-0505", user: "u-aliou", created: "2026-09-24T12:00", slot: "2026-09-28T15:00", category: "tab", modele: "iPad (2017)", stockage: "32 Go", age: "plus-4", wish: 70000 }),
    ...takenBack("WC-2026-0505", "2026-09-28T15:06", { condition: "bon", battery: 83, takeBack: 63000, listPrice: 84000 }, { slug: "ipad-2017", photo: PHOTOS.ipad, keywords: "iPad 2017 32 Go Apple tablette" }),

    // Octobre
    { at: "2026-10-01T02:00", run: (db) => monthlyFonte(db, "2026-10-01T02:00") },
    ...bought("u-khady", "redmi-9a", "wave", "2026-10-02T13:40", "2026-10-03T10:20"),
    declare({ ref: "WC-2026-0520", user: "u-mariama", created: "2026-09-30T08:00", slot: "2026-10-03T09:30", category: "tab", modele: "Galaxy Tab A (2016)", stockage: "S Pen", age: "plus-4", etat: "use", wish: 45000 }),
    ...takenBack("WC-2026-0520", "2026-10-03T09:34", { condition: "use", battery: 76, takeBack: 31000, listPrice: 41000 }, { slug: "galaxy-tab-a", photo: PHOTOS.tab, keywords: "Galaxy Tab A 2016 S Pen Samsung tablette" }),
    declare({ ref: "WC-2026-0521", user: "u-moussa", created: "2026-09-29T22:15", slot: "2026-10-03T10:30", category: "tel", modele: "Tecno Camon 12", stockage: "64 Go", age: "2-3", wish: 30000 }),
    refused("WC-2026-0521", "2026-10-03T10:34", "ecran", "Écran fissuré sur toute la largeur. Une fois l'écran remplacé, vous pouvez le déposer à nouveau."),
    ...bought("u-babacar", "galaxy-j5", "especes", "2026-10-06T17:10", "2026-10-08T12:00"),
    declare({ ref: "WC-2026-0540", user: "u-khady", created: "2026-10-07T21:00", slot: "2026-10-10T14:00", category: "audio", modele: "AirPods", stockage: "1re génération", age: "plus-4", etat: "use" }),
    ...takenBack("WC-2026-0540", "2026-10-10T14:05", { condition: "use", battery: 74, takeBack: 17000, listPrice: 22600 }, { slug: "airpods", photo: PHOTOS.airpods, keywords: "AirPods Apple écouteurs" }),
    {
      at: "2026-10-12T16:21",
      run: (db) => adjust(db, "u-ismaila", "credit", 2000, "Reprise WC-2026-0455 saisie à 14 000 pts au lieu des 16 000 annoncés au comptoir.", "2026-10-12T16:21", admin(db)),
    },
    ...bought("u-ndeye", "chargeur-magsafe", "om", "2026-10-14T11:00", "2026-10-15T09:45"),
    shopItem("2026-10-15T10:00", { slug: "thinkpad-t480", name: "ThinkPad T480 · 8 Go", keywords: "ThinkPad T480 Lenovo 8 Go ordinateur", category: "ordi", condition: "comme-neuf", battery: 92, info: "Comme neuf · batterie 92 %", price: 149500, photo: PHOTOS.t480 }),
    declare({ ref: "WC-2026-0571", user: "u-ndeye", created: "2026-10-16T19:00", slot: "2026-10-20T10:00", category: "tel", modele: "iPhone 11", stockage: "64 Go", wish: 100000 }),
    ...takenBack("WC-2026-0571", "2026-10-20T10:07", { condition: "bon", battery: 84, takeBack: 93000, listPrice: 124200 }, { slug: "iphone-11", photo: PHOTOS.ip11, keywords: "iPhone 11 64 Go Apple rouge" }),
    ...bought("u-omar", "cle-usb-sandisk", "especes", "2026-10-20T16:30", "2026-10-21T10:10"),
    { at: "2026-10-24T08:05", run: (db) => setSuspended(db, true, "Fermeture de la boutique pour inventaire jusqu'au 28 octobre.", "2026-10-24T08:05", admin(db)) },
    declare({ ref: "WC-2026-0587", user: "u-cheikh", created: "2026-10-21T18:00", slot: "2026-10-26T10:30", category: "ordi", modele: "MacBook noir", stockage: "", age: "plus-4", etat: "use", wish: 20000 }),
    ...takenBack("WC-2026-0587", "2026-10-26T10:36", { condition: "defectueux", takeBack: 9500, listPrice: 12600, pieces: true }, { slug: "macbook-pieces", photo: PHOTOS.mac, keywords: "MacBook noir pour pièces", detail: "Ne démarre pas" }),
    { at: "2026-10-28T11:40", run: (db) => setSuspended(db, false, "Fin de l'inventaire de la boutique.", "2026-10-28T11:40", admin(db)) },
    declare({ ref: "WC-2026-0598", user: "u-mariama", created: "2026-10-24T09:20", slot: "2026-10-28T14:00", category: "tel", modele: "Galaxy A12", stockage: "64 Go", wish: 38000 }),
    ...takenBack(
      "WC-2026-0598",
      "2026-10-28T14:06",
      { condition: "bon", battery: 81, takeBack: 33000, listPrice: 44200, serial: "R58R1Q7KD" },
      {
        slug: "galaxy-a12",
        photo: PHOTOS.a12,
        keywords: "Galaxy A12 64 Go Samsung",
        title: "Samsung Galaxy A12 · 64 Go",
        details: "Noir · 4 Go de mémoire vive · déposé par un étudiant",
        checks: [
          { label: "Écran", value: "Une rayure fine en bas, invisible écran allumé" },
          { label: "Batterie", value: "81 % de sa capacité d'origine" },
          { label: "Compte Google", value: "Déconnecté, téléphone réinitialisé" },
          { label: "Appareils photo et micro", value: "Testés, fonctionnent" },
          { label: "Réseau", value: "Double SIM, tous opérateurs" },
          { label: "Numéro de série", value: "R58R••••7KD", numeric: true },
        ],
      },
    ),
    declare({ ref: "WC-2026-0602", user: "u-omar", created: "2026-10-27T10:00", slot: "2026-10-30T11:00", category: "audio", modele: "Casque Sony WH-CH510", age: "moins-1", etat: "comme-neuf", wish: 15000 }),
    ...takenBack("WC-2026-0602", "2026-10-30T11:03", { condition: "comme-neuf", takeBack: 13800, listPrice: 18400 }, { slug: "casque-sony", photo: PHOTOS.sony, keywords: "Sony WH-CH510 casque" }),

    // Novembre
    { at: "2026-11-01T02:00", run: (db) => monthlyFonte(db, "2026-11-01T02:00") },
    {
      at: "2026-11-04T18:02",
      run: (db) => withdraw(db, db.articles.find((a) => a.slug === "ibm-travelstar")!.id, "Interface IDE, 4 Go : aucune demande depuis 7 semaines.", "2026-11-04T18:02", admin(db)),
    },
    declare({ ref: "WC-2026-0611", user: "u-babacar", created: "2026-11-02T21:00", slot: "2026-11-06T09:30", category: "tel", modele: "Galaxy A20", stockage: "32 Go", age: "2-3", etat: "use", wish: 25000 }),
    ...takenBack("WC-2026-0611", "2026-11-06T09:36", { condition: "use", battery: 78, takeBack: 21000, listPrice: 28000 }),
    declare({ ref: "WC-2026-0612", user: "u-cheikh", created: "2026-11-03T08:30", slot: "2026-11-06T14:00", category: "tel", modele: "Galaxy S9+", stockage: "64 Go", age: "plus-4", etat: "use", wish: 40000 }),
    ...takenBack("WC-2026-0612", "2026-11-06T14:05", { condition: "use", battery: 72, takeBack: 36000, listPrice: 47500 }, { slug: "galaxy-s9", photo: PHOTOS.s9, keywords: "Galaxy S9+ 64 Go Samsung" }),
    declare({ ref: "WC-2026-0615", user: "u-ndeye", created: "2026-11-03T18:00", slot: "2026-11-06T11:00", category: "ordi", modele: "HP 250 G7", stockage: "8 Go", age: "2-3", wish: 110000 }),
    ...takenBack("WC-2026-0615", "2026-11-06T11:08", { condition: "bon", battery: 85, takeBack: 88000, listPrice: 115000 }),
    declare({ ref: "WC-2026-0619", user: "u-aliou", created: "2026-11-04T07:45", slot: "2026-11-06T15:00", category: "piece", modele: "Clé USB", stockage: "64 Go", age: "inconnu" }),
    refused("WC-2026-0619", "2026-11-06T15:03", "modele", "Une clé USB de 64 Go se trouve neuve pour moins cher : elle ne se revendrait pas sur Wecce."),
    ...bought("u-fatou", "iphone-11", "especes", "2026-11-06T16:20"),
    declare({ ref: "WC-2026-0629", user: "u-aissatou", created: "2026-11-03T12:30", slot: "2026-11-07T09:30", category: "tel", modele: "Galaxy A32", stockage: "128 Go", wish: 45000 }),
    ...takenBack("WC-2026-0629", "2026-11-07T09:42", { condition: "bon", battery: 87, takeBack: 38000, listPrice: 51000 }),
    declare({ ref: "WC-2026-0631", user: "u-ismaila", created: "2026-11-04T10:00", slot: "2026-11-07T10:00", category: "audio", modele: "Écouteurs Oraimo FreePods", age: "2-3", etat: "use" }),
    refused("WC-2026-0631", "2026-11-07T10:08", "batterie", "Autonomie mesurée à 40 minutes. Après remplacement de la batterie, vous pouvez les déposer à nouveau."),
    declare({ ref: "WC-2026-0634", user: "u-moussa", created: "2026-11-04T20:15", slot: "2026-11-07T10:30", category: "ordi", modele: "Lenovo IdeaPad 3", stockage: "256 Go SSD", wish: 90000 }),
    declare({ ref: "WC-2026-0643", user: "u-fatou", created: "2026-11-05T09:00", slot: "2026-11-07T14:00", category: "tel", modele: "iPhone XR", stockage: "64 Go", age: "plus-4", etat: "use", wish: 70000 }),
    declare({ ref: "WC-2026-0647", user: "u-omar", created: "2026-11-05T14:20", slot: "2026-11-07T15:30", category: "piece", modele: "Disque dur 2,5″", stockage: "500 Go", age: "inconnu", wish: 8000 }),
    declare({ ref: "WC-2026-0650", user: "u-khady", created: "2026-11-05T18:00", slot: "2026-11-07T16:30", category: "audio", modele: "Enceinte JBL Flip 4", age: "2-3", wish: 25000 }),
    { at: "2026-11-06T20:10", run: (db) => Object.assign(depositByRef(db, "WC-2026-0650"), { status: "annule", cancelledAt: "2026-11-06T20:10" }) },
    declare({ ref: "WC-2026-0652", user: "u-mariama", created: "2026-11-06T08:00", slot: "2026-11-09T09:30", category: "tab", modele: "iPad Air 2", stockage: "64 Go", age: "plus-4", etat: "use", wish: 60000 }),
    declare({ ref: "WC-2026-0653", user: "u-cheikh", created: "2026-11-06T09:15", slot: "2026-11-09T10:30", category: "piece", modele: "Barrette DDR4", stockage: "8 Go", wish: 9000 }),
    declare({ ref: "WC-2026-0654", user: "u-babacar", created: "2026-11-06T22:00", slot: "2026-11-11T09:30", category: "tab", modele: "Galaxy Tab A7", stockage: "32 Go", wish: 50000 }),
    declare({ ref: "WC-2026-0655", user: "u-moussa", created: "2026-11-06T21:40", slot: null, category: "piece", modele: "Disque dur externe", stockage: "1 To", age: "1-2", photos: 0 }),

    // Mesures hebdomadaires de la couverture
    // (le 1er septembre, après la mise en ligne des premiers articles de la boutique)
    ...mondays.map((d) => {
      const at = d === "2026-09-01" ? `${d}T12:00` : `${d}T06:00`;
      return { at, run: (db: Db) => snapshot(db, at, EVENTS[d]) };
    }),
  ];
}

/** Construit la base de départ en rejouant le calendrier. */
export function seed(): Db {
  const db: Db = {
    version: 3,
    seq: { deposit: 655, acquisition: 1180, article: 0 },
    users: users(),
    movements: [],
    deposits: [],
    articles: [],
    acquisitions: [],
    log: [],
    snapshots: [],
    config: { depositsSuspended: false, bonus: { active: false, rate: 0, quota: 100, used: 0 } },
  };
  const steps = scenario().sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : 0));
  for (const s of steps) s.run(db);
  db.seq.deposit = 655;
  return db;
}
