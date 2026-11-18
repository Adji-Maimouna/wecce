import { createContext, useContext } from "react";
import type { Administrator, Agent, Role, Student } from "@/domain/entities";

/**
 * Le compte connecté (un seul à la fois), et quelques compteurs partagés par toutes les pages.
 * Fourni par la couche app. Avec Inertia : les props partagées `auth.user` (HandleInertiaRequests::share).
 */
export type MissedDepositReminder = {
  ref: string;
  deviceName: string;
  scheduledAt: string;
};

export type Session = {
  student?: Student;
  missedDeposits?: MissedDepositReminder[];
  agent?: Agent;
  admin?: Administrator;
  /** Rendez-vous du jour encore à recevoir (pastille de la navigation LBC). */
  appointmentsToReceive?: number;
  /** Ce qui attend une action de LBC (pastilles de la navigation et tableau de bord). */
  partnerTodo?: { requests: number; purchases: number; handovers: number; toPublish: number };
};

export const SessionContext = createContext<Session>({});

function required<T>(value: T | undefined, what: string): T {
  if (!value) throw new Error(`Aucun ${what} dans la session.`);
  return value;
}

export function useSession(): Session {
  return useContext(SessionContext);
}

/** Rôle du compte connecté, ou null pour un visiteur. */
export function useSessionRole(): Role | null {
  const s = useSession();
  return s.student ? "ETUDIANT" : s.agent ? "AGENT" : s.admin ? "ADMIN" : null;
}

export function useStudent(): Student {
  return required(useSession().student, "étudiant");
}

export function useAgent(): Agent {
  return required(useSession().agent, "agent LBC");
}

export function useAdmin(): Administrator {
  return required(useSession().admin, "administrateur");
}
