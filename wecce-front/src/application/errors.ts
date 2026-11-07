/** Erreur métier refusée avant tout envoi (règle du domaine non respectée). */
export class RuleViolation extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = "RuleViolation";
  }
}
