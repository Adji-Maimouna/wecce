import { RuleViolation } from "@/application/errors";
import type { Ports } from "@/application/ports";
import type { Role } from "@/domain/entities";
import { now, parseTime, stamp } from "./clock";
import { commit, data } from "./db";
import * as engine from "./engine";
import { schedule } from "./queries";
import { currentUserId, signIn, signOut } from "./session";

/*
 * Adaptateurs du serveur simulé : ils implémentent les ports de l'application.
 * Chaque action vérifie le compte connecté, modifie la base, l'enregistre et prévient les écrans.
 * Pour Laravel : écrire les mêmes adaptateurs dans src/infrastructure/inertia/ (router.post, router.put…).
 */

/** Petit délai, pour que la démonstration se comporte comme un vrai serveur. */
const wait = <T>(value: T, ms = 450) => new Promise<T>((resolve) => setTimeout(() => resolve(value), ms));

/** Exécute une action côté « serveur » après le délai réseau, puis enregistre. */
function act<T>(fn: () => T, ms = 450): Promise<T> {
  return new Promise<T>((resolve, reject) =>
    setTimeout(() => {
      try {
        const result = fn();
        commit();
        resolve(result);
      } catch (e) {
        reject(e);
      }
    }, ms),
  );
}

/** Le compte connecté, avec le rôle attendu (sinon : 403, comme le middleware Laravel). */
function me(role?: Role) {
  const id = currentUserId();
  const u = id ? data().users.find((x) => x.id === id) : undefined;
  if (!u) throw new RuleViolation("non-connecte", "Votre session a expiré. Reconnectez-vous.");
  if (role && u.role !== role) throw new RuleViolation("acces-refuse", "Cette action n'est pas permise pour votre compte.");
  return u;
}

const digits = (s: string) => s.replace(/\D/g, "");

/** Créneau choisi (rang du jour, rang de l'heure) → « AAAA-MM-JJTHH:MM ». */
function slotFrom(day: number, slot: number, exceptRef?: string): string {
  const s = schedule(exceptRef);
  const date = s.dates[day];
  const t = s.times[slot];
  if (!date || !t || s.days[day].taken.includes(slot)) throw new RuleViolation("creneau-pris", "Ce créneau n'est plus libre. Choisissez-en un autre.");
  return `${date}T${parseTime(t)}`;
}

export const demoPorts: Ports = {
  auth: {
    login: (identifier, password, remember) =>
      new Promise((resolve) =>
        setTimeout(() => {
          const id = identifier.trim().toLowerCase();
          const u = data().users.find(
            (x) => x.email.toLowerCase() === id || (digits(id).length >= 8 && digits(x.telephone) === digits(id)),
          );
          if (!u || u.password !== password || u.active === false) return resolve({ ok: false, reason: "identifiants-invalides" });
          signIn(u.id, remember);
          resolve({ ok: true, role: u.role });
        }, 650),
      ),
    requestPasswordReset: () => wait(undefined),
    registerStudent: (reg) =>
      act(() => {
        const db = data();
        const email = reg.email.trim().toLowerCase();
        if (db.users.some((u) => u.email.toLowerCase() === email))
          throw new RuleViolation("email-pris", "Un compte existe déjà avec cet e-mail. Connectez-vous, ou utilisez une autre adresse.");
        if (db.users.some((u) => u.numeroCarte === reg.numeroCarte.trim()))
          throw new RuleViolation("carte-prise", "Un compte existe déjà pour cette carte d'étudiant. Présentez-vous chez LBC si ce n'est pas vous.");
        const id = `u-${Date.now().toString(36)}`;
        db.users.push({
          id,
          role: "ETUDIANT",
          prenom: reg.prenom.trim(),
          nom: reg.nom.trim(),
          email,
          telephone: reg.telephone.trim(),
          password: reg.motDePasse,
          createdAt: now(),
          numeroCarte: reg.numeroCarte.trim(),
          niveau: reg.niveau,
          ufr: reg.ufr,
          active: true,
          balance: 0,
        });
        signIn(id, true);
      }, 600),
    logout: () =>
      wait(undefined, 200).then(() => {
        signOut();
      }),
  },

  deposits: {
    submit: (req) =>
      act(() => {
        const db = data();
        const u = me("ETUDIANT");
        if (engine.depositsSuspended(db)) throw new RuleViolation("depots-suspendus", "Les dépôts sont suspendus pour le moment.");
        const slot = req.slot === null ? null : slotFrom(req.day, req.slot, req.draftRef);
        const ref = engine.createDeposit(
          db,
          u.id,
          {
            category: req.category,
            modele: req.modele,
            stockage: req.stockage,
            age: req.age,
            etat: req.category === "piece" ? req.etatPiece : req.etat,
            photos: req.photos.filter((p): p is string => !!p),
            wish: req.souhait,
            slot,
            draftRef: req.draftRef,
          },
          now(),
        );
        return { ref };
      }),
    cancel: (ref) => act(() => engine.cancelDeposit(data(), me("ETUDIANT").id, ref, now())),
    reschedule: (ref, day, slot) => act(() => engine.reschedule(data(), me("ETUDIANT").id, ref, slotFrom(day, slot, ref))),
    requestAppointment: () =>
      act(() => {
        throw new RuleViolation("demo", "Disponible avec le serveur Laravel uniquement.");
      }),
  },

  payments: {
    acquire: (req) =>
      act(() => {
        const db = data();
        const u = me("ETUDIANT");
        const article = engine.articleBySlug(db, req.itemSlug);
        const q = engine.acquire(db, u.id, article.id, req.method, now());
        return q.status === "en-attente"
          ? { status: "en-attente" as const, acquisitionRef: q.ref, paymentRef: q.paymentRef!, sentAt: stamp(q.createdAt) }
          : { status: "reserve" as const, acquisitionRef: q.ref };
      }),
    // Démonstration : le prestataire confirme le paiement au bout de 3 secondes.
    awaitConfirmation: (paymentRef) =>
      act(() => {
        const db = data();
        engine.confirmPayment(db, paymentRef, now());
        return engine.acquisitionByRef(db, paymentRef).status === "annule" ? ("echoue" as const) : ("confirme" as const);
      }, 3200),
    cancel: (acquisitionRef) => act(() => engine.cancelPayment(data(), acquisitionRef)),
  },

  waivers: {
    // Signé sur la tablette du comptoir : la session est celle de l'agent.
    sign: (ref) =>
      act(() => {
        me("AGENT");
        return engine.sign(data(), ref, now());
      }, 380),
    decline: (ref) =>
      act(() => {
        me("AGENT");
        engine.declineAtCounter(data(), ref, now());
      }, 300),
  },

  profile: {
    updateContact: (update) =>
      act(() => {
        const u = me();
        const email = update.email.toLowerCase();
        if (data().users.some((x) => x.id !== u.id && x.email.toLowerCase() === email))
          throw new RuleViolation("email-invalide", "Cette adresse e-mail est déjà utilisée par un autre compte.");
        u.email = email;
        u.telephone = update.telephone;
        if (u.role === "ETUDIANT") {
          u.niveau = update.niveau;
          u.ufr = update.ufr;
        }
      }),
    changePassword: (current, next) =>
      act(() => {
        const u = me();
        if (u.password !== current) return { ok: false };
        u.password = next;
        return { ok: true };
      }),
  },

  partner: {
    submitExpertise: (input) =>
      act(() => {
        const agent = me("AGENT");
        engine.recordExpertise(
          data(),
          agent.id,
          input.depositRef,
          { pieces: input.pieces, condition: input.condition, battery: input.battery || null, serial: input.serial, takeBack: input.takeBack, listPrice: input.listPrice },
          now(),
        );
      }),
    scheduleAppointment: () =>
      act(() => {
        throw new RuleViolation("demo", "Disponible avec le serveur Laravel uniquement.");
      }),
    refuseDeposit: (ref, reason, comment) => act(() => engine.refuse(data(), me("AGENT").id, ref, reason, comment, now())),
    publishArticle: (id) =>
      act(() => {
        me("AGENT");
        engine.publish(data(), id, now());
      }, 300),
    // Le serveur simulé n'a pas d'étape de validation : l'achat y est réservé directement.
    validateAcquisition: () => act(() => ({ points: 0, complement: 0 })),
    refuseAcquisition: () =>
      act(() => {
        throw new RuleViolation("demo", "Disponible avec le serveur Laravel uniquement.");
      }),
    handOver: (ref) =>
      act(() => {
        me("AGENT");
        engine.handOver(data(), ref, now());
      }, 300),
    saveArticle: (input) =>
      act(() => {
        me("AGENT");
        return { id: engine.saveArticle(data(), input, now()) };
      }),
    withdrawArticle: (id, reason) =>
      act(() => {
        const u = me("AGENT");
        engine.withdraw(data(), id, reason, now(), engine.signature(u));
      }, 300),
  },

  admin: {
    setDepositsSuspended: (suspended, reason) =>
      act(() => {
        const u = me("ADMIN");
        engine.setSuspended(data(), suspended, reason, now(), engine.signature(u));
      }, 300),
    saveBonus: (rate, quota, reason) =>
      act(() => {
        const u = me("ADMIN");
        engine.saveBonus(data(), rate, quota, reason, now(), engine.signature(u));
      }, 300),
    adjustPoints: (req) =>
      act(() => {
        const u = me("ADMIN");
        const db = data();
        const student = db.users.find((x) => x.numeroCarte === req.card);
        if (!student) throw new RuleViolation("compte-inconnu", "Aucun compte pour cette carte.");
        return { balanceAfter: engine.adjust(db, student.id, req.direction, req.amount, req.reason, now(), engine.signature(u)) };
      }),
  },
};
