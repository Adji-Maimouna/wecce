import { router } from "@inertiajs/core";
import { RuleViolation } from "@/application/errors";
import type { Ports, AcquisitionResult } from "@/application/ports";

function csrfToken(): string {
  const meta = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]');
  if (meta?.content) return meta.content;
  const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

async function request<T>(method: "GET" | "POST" | "PUT" | "DELETE", url: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "X-Requested-With": "XMLHttpRequest",
  };
  const token = csrfToken();
  if (token) headers["X-CSRF-TOKEN"] = token;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const response = await fetch(url, {
    method,
    headers,
    credentials: "same-origin",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const code = typeof payload?.code === "string" ? payload.code : "erreur-serveur";
    const message = typeof payload?.message === "string" ? payload.message : "Une erreur inattendue est survenue.";
    const rawErrors = payload?.errors;
    let fields: Record<string, string> | undefined;
    if (rawErrors && typeof rawErrors === "object") {
      fields = {};
      for (const [k, v] of Object.entries(rawErrors as Record<string, unknown>)) {
        if (typeof v === "string") fields[k] = v;
        else if (Array.isArray(v) && typeof v[0] === "string") fields[k] = v[0];
      }
    }
    throw new RuleViolation(code, message, fields);
  }

  return payload as T;
}

function reloadProps(): void {
  try {
    router.reload();
  } catch {
    // Si exécuté hors contexte de page Inertia
  }
}

/**
 * Adaptateurs HTTP vers le backend Laravel Wecce (routes de routes/web.php).
 * Implémentent intégralement les 7 ports de l'application (Clean Architecture).
 */
export const httpPorts: Ports = {
  auth: {
    login: (identifiant, motDePasse, rester) =>
      request("POST", "/connexion", { identifiant, motDePasse, rester }),
    requestPasswordReset: (email) =>
      request("POST", "/mot-de-passe/oubli", { email }).then(() => undefined),
    registerStudent: (reg) =>
      request("POST", "/inscription", reg).then(() => undefined),
    logout: () =>
      request("POST", "/deconnexion").then(() => undefined),
  },

  deposits: {
    submit: (req) =>
      request<{ ref: string }>("POST", "/etudiant/depots", req).then((r) => {
        reloadProps();
        return r;
      }),
    cancel: (ref) =>
      request("DELETE", `/etudiant/depots/${encodeURIComponent(ref)}`).then(() => {
        reloadProps();
      }),
    reschedule: (ref, day, slot) =>
      request("PUT", `/etudiant/depots/${encodeURIComponent(ref)}/rendez-vous`, { day, slot }).then(() => {
        reloadProps();
      }),
    requestAppointment: (ref, availability) =>
      request("PUT", `/etudiant/depots/${encodeURIComponent(ref)}/rendez-vous`, { availability }).then(() => {
        reloadProps();
      }),
    saveDraft: (req) =>
      request<{ ok: boolean; redirect?: string | null; draftRef?: string | null }>("POST", "/etudiant/depots/brouillon", req),
  },

  payments: {
    acquire: (req) =>
      request<AcquisitionResult>("POST", "/etudiant/acquisitions", req).then((r) => {
        reloadProps();
        return r;
      }),
    awaitConfirmation: (paymentRef) =>
      request<{ status: "confirme" | "echoue" }>("GET", `/etudiant/paiements/${encodeURIComponent(paymentRef)}/statut`).then((r) => {
        reloadProps();
        return r.status;
      }),
    cancel: (acquisitionRef) =>
      request("DELETE", `/etudiant/acquisitions/${encodeURIComponent(acquisitionRef)}`).then(() => {
        reloadProps();
      }),
  },

  waivers: {
    sign: (depositRef, signature) =>
      request<{ balanceAfter: number }>("POST", `/partenaire/depots/${encodeURIComponent(depositRef)}/renoncement/signature`, { signature }).then((r) => {
        reloadProps();
        return r;
      }),
    decline: (depositRef) =>
      request("POST", `/partenaire/depots/${encodeURIComponent(depositRef)}/renoncement/refus`).then(() => {
        reloadProps();
      }),
  },

  profile: {
    updateContact: (update) =>
      request("PUT", "/profil/coordonnees", update).then(() => {
        reloadProps();
      }),
    changePassword: (current, next) =>
      request<{ ok: boolean }>("PUT", "/profil/mot-de-passe", { current, next }),
  },

  partner: {
    submitExpertise: (input) =>
      request("POST", "/partenaire/expertises", input).then(() => {
        reloadProps();
      }),
    refuseDeposit: (depositRef, reason, comment) =>
      request("POST", `/partenaire/depots/${encodeURIComponent(depositRef)}/refus`, { reason, comment }).then(() => {
        reloadProps();
      }),
    scheduleAppointment: (depositRef, date, time) =>
      request<{ label: string }>("POST", `/partenaire/depots/${encodeURIComponent(depositRef)}/rendez-vous`, { date, time }).then((r) => {
        reloadProps();
        return r;
      }),
    publishArticle: (articleId) =>
      request("POST", `/partenaire/stock/${encodeURIComponent(articleId)}/publication`).then(() => {
        reloadProps();
      }),
    unpublishArticle: (articleId) =>
      request("DELETE", `/partenaire/stock/${encodeURIComponent(articleId)}/publication`).then(() => {
        reloadProps();
      }),
    validateAcquisition: (acquisitionRef) =>
      request<{ points: number; complement: number }>("POST", `/partenaire/acquisitions/${encodeURIComponent(acquisitionRef)}/validation`).then((r) => {
        reloadProps();
        return r;
      }),
    refuseAcquisition: (acquisitionRef, reason) =>
      request<{ refundFcfa: number }>("POST", `/partenaire/acquisitions/${encodeURIComponent(acquisitionRef)}/refus`, { reason }).then((r) => {
        reloadProps();
        return r;
      }),
    handOver: (acquisitionRef) =>
      request("POST", `/partenaire/acquisitions/${encodeURIComponent(acquisitionRef)}/remise`).then(() => {
        reloadProps();
      }),
    saveArticle: (input) =>
      (input.id
        ? request<{ id: string }>("PUT", `/partenaire/stock/${encodeURIComponent(input.id)}`, input)
        : request<{ id: string }>("POST", "/partenaire/stock", input)
      ).then((r) => {
        reloadProps();
        return r;
      }),
    withdrawArticle: (articleId, reason) =>
      request("DELETE", `/partenaire/stock/${encodeURIComponent(articleId)}`, { reason }).then(() => {
        reloadProps();
      }),
  },

  admin: {
    setDepositsSuspended: (suspended, reason) =>
      request("PUT", "/admin/pilotage/depots", { suspended, reason }).then(() => {
        reloadProps();
      }),
    saveBonus: (rate, quota, reason, limits) =>
      request("PUT", "/admin/pilotage/bonus", { rate, quota, reason, ...limits }).then(() => {
        reloadProps();
      }),
    adjustPoints: (req) =>
      request<{ balanceAfter: number }>("POST", "/admin/ajustements", req).then((r) => {
        reloadProps();
        return r;
      }),
  },
};
