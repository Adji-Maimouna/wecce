import type {
  AdminActionType,
  AgeBand,
  AppointmentStatus,
  Category,
  Condition,
  DepositStage,
  DeviceCondition,
  MovementType,
  PartCondition,
  RefusalReason,
} from "@/domain/entities";

/** Libellés de l'interface (français). Le domaine ne connaît que des codes. */

export const CATEGORY_LABELS: Record<Category, { label: string; plural: string }> = {
  tel: { label: "Téléphone", plural: "Téléphones" },
  ordi: { label: "Ordinateur", plural: "Ordinateurs" },
  tab: { label: "Tablette", plural: "Tablettes" },
  audio: { label: "Audio", plural: "Audio" },
  piece: { label: "Pièce détachée", plural: "Pièces" },
};

export const CONDITION_LABELS: Record<Condition, string> = {
  "comme-neuf": "Comme neuf",
  bon: "Bon état",
  use: "Usé",
  fonctionnel: "Fonctionnel",
  defectueux: "Défectueux",
};

export const AGE_LABELS: Record<AgeBand, string> = {
  "moins-1": "Moins d'un an",
  "1-2": "1 à 2 ans",
  "2-3": "2 à 3 ans",
  "plus-4": "Plus de 4 ans",
  inconnu: "Je ne sais pas",
};

export const DEVICE_CONDITIONS: Record<DeviceCondition, { label: string; hint: string }> = {
  "comme-neuf": { label: "Comme neuf", hint: "Aucune trace d'usage" },
  bon: { label: "Bon état", hint: "Rayures légères, tout fonctionne" },
  use: { label: "Usé", hint: "Traces visibles, tout fonctionne" },
};

export const PART_CONDITIONS: Record<PartCondition, { label: string; hint: string }> = {
  fonctionnel: { label: "Fonctionnel", hint: "Testé dans un appareil, il marche" },
  defectueux: { label: "Défectueux", hint: "Pour récupérer des composants" },
};

export const DEPOSIT_STAGE_LABELS: Record<DepositStage, string> = {
  decrit: "Décrit",
  "rendez-vous": "Rendez-vous",
  examen: "Examen",
  signature: "Signature",
  "en-vente": "En vente",
};

export const MOVEMENT_LABELS: Record<MovementType, string> = {
  reprise: "Dépôt repris",
  bonus: "Bonus de lancement",
  fonte: "Baisse mensuelle",
  acquisition: "Objet pris",
  ajustement: "Ajustement",
};

export const REFUSAL_LABELS: Record<RefusalReason, string> = {
  ecran: "Écran cassé ou tactile défaillant",
  compte: "Compte encore lié à l'appareil",
  batterie: "Batterie sous 70 % de capacité",
  modele: "Modèle introuvable ou invendable",
};

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  "a-planifier": "À planifier",
  "a-venir": "À venir",
  arrive: "Arrivé",
  "a-signer": "À signer",
  repris: "Repris",
  refuse: "Refusé",
  annule: "Annulé par l'étudiant",
};

export const ADMIN_ACTION_LABELS: Record<AdminActionType, string> = {
  ajustement: "Ajustement",
  suspension: "Suspension",
  reprise: "Reprise",
  retrait: "Annonce retirée",
  configuration: "Configuration",
};
