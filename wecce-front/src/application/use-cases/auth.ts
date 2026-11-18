import type { Role, StudentRegistration } from "@/domain/entities";
import { isPasswordLongEnough } from "@/domain/rules/account";
import { RuleViolation } from "@/application/errors";
import type { AuthGateway } from "@/application/ports";

export type LoginResult = { ok: true; role: Role } | { ok: false };

/** Connexion commune : le rôle du compte décide de l'espace ouvert (la page fait la redirection). */
export const makeLogin =
  (auth: AuthGateway) =>
  async (identifier: string, password: string, remember: boolean): Promise<LoginResult> => {
    const res = await auth.login(identifier.trim(), password, remember);
    return res.ok ? { ok: true, role: res.role } : { ok: false };
  };

export const makeRequestPasswordReset = (auth: AuthGateway) => (email: string) => auth.requestPasswordReset(email.trim());

/** Inscription, réservée aux étudiants de l'UGB. */
export const makeRegisterStudent = (auth: AuthGateway) => async (data: StudentRegistration) => {
  if (!isPasswordLongEnough(data.motDePasse)) throw new RuleViolation("mot-de-passe-court", "Mot de passe trop court.");
  await auth.registerStudent({
    ...data,
    prenom: data.prenom.trim(),
    nom: data.nom.trim(),
    telephone: data.telephone.trim(),
    email: data.email.trim(),
    numeroCarte: data.numeroCarte.trim(),
  });
};

export const makeLogout = (auth: AuthGateway) => () => auth.logout();
