/** Assemble des classes CSS en ignorant les valeurs vides : cn("btn", lg && "btn--lg"). */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
