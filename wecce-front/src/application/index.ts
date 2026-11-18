import type { Ports } from "./ports";
import { makeLogin, makeLogout, makeRegisterStudent, makeRequestPasswordReset } from "./use-cases/auth";
import { makeAdjustPoints, makeSaveBonus, makeSetDepositsSuspended } from "./use-cases/admin";
import { makeHandOver, makePublishArticle, makeRefuseDeposit, makeSaveArticle, makeSubmitExpertise, makeWithdrawArticle } from "./use-cases/partner";
import { makeChangePassword, makeUpdateContact } from "./use-cases/profile";
import {
  makeAcquireItem,
  makeAwaitPayment,
  makeCancelDeposit,
  makeCancelPayment,
  makeDeclineWaiver,
  makeRescheduleDeposit,
  makeSaveDepositDraft,
  makeSignWaiver,
  makeSubmitDeposit,
} from "./use-cases/student";

/**
 * Assemble les cas d'usage à partir des adaptateurs fournis (démo aujourd'hui, Inertia demain).
 * La présentation n'appelle que ces fonctions, jamais un adaptateur directement.
 */
export function makeUseCases(ports: Ports) {
  return {
    login: makeLogin(ports.auth),
    logout: makeLogout(ports.auth),
    requestPasswordReset: makeRequestPasswordReset(ports.auth),
    registerStudent: makeRegisterStudent(ports.auth),
    submitDeposit: makeSubmitDeposit(ports.deposits),
    saveDepositDraft: makeSaveDepositDraft(ports.deposits),
    cancelDeposit: makeCancelDeposit(ports.deposits),
    rescheduleDeposit: makeRescheduleDeposit(ports.deposits),
    acquireItem: makeAcquireItem(ports.payments),
    awaitPayment: makeAwaitPayment(ports.payments),
    cancelPayment: makeCancelPayment(ports.payments),
    signWaiver: makeSignWaiver(ports.waivers),
    declineWaiver: makeDeclineWaiver(ports.waivers),
    updateContact: makeUpdateContact(ports.profile),
    changePassword: makeChangePassword(ports.profile),
    submitExpertise: makeSubmitExpertise(ports.partner),
    refuseDeposit: makeRefuseDeposit(ports.partner),
    publishArticle: makePublishArticle(ports.partner),
    handOver: makeHandOver(ports.partner),
    saveArticle: makeSaveArticle(ports.partner),
    withdrawArticle: makeWithdrawArticle(ports.partner),
    setDepositsSuspended: makeSetDepositsSuspended(ports.admin),
    saveBonus: makeSaveBonus(ports.admin),
    adjustPoints: makeAdjustPoints(ports.admin),
  };
}

export type UseCases = ReturnType<typeof makeUseCases>;
export type { Ports } from "./ports";
export { RuleViolation } from "./errors";
