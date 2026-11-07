import type { Role, StudentRegistration } from "@/domain/entities";

export type LoginOutcome = { ok: true; role: Role } | { ok: false; reason: "identifiants-invalides" };

/** Port d'authentification (Laravel : routes /login, /logout, /register, /forgot-password). */
export interface AuthGateway {
  login(identifier: string, password: string, remember: boolean): Promise<LoginOutcome>;
  requestPasswordReset(email: string): Promise<void>;
  registerStudent(data: StudentRegistration): Promise<void>;
  logout(): Promise<void>;
}
