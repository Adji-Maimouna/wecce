/** Ports : ce dont l'application a besoin du monde extérieur. Les adaptateurs (démo, Inertia) les implémentent. */
export type { AuthGateway, LoginOutcome } from "./AuthGateway";
export type { DepositGateway, DepositCreated } from "./DepositGateway";
export type { PaymentGateway, PaymentMethod, AcquisitionRequest, AcquisitionResult } from "./PaymentGateway";
export type { WaiverGateway } from "./WaiverGateway";
export type { ProfileGateway, ContactUpdate } from "./ProfileGateway";
export type { PartnerGateway } from "./PartnerGateway";
export type { AdminGateway, AdjustmentRequest } from "./AdminGateway";

import type { AuthGateway } from "./AuthGateway";
import type { DepositGateway } from "./DepositGateway";
import type { PaymentGateway } from "./PaymentGateway";
import type { WaiverGateway } from "./WaiverGateway";
import type { ProfileGateway } from "./ProfileGateway";
import type { PartnerGateway } from "./PartnerGateway";
import type { AdminGateway } from "./AdminGateway";

/** L'ensemble des adaptateurs à fournir pour faire tourner l'application. */
export type Ports = {
  auth: AuthGateway;
  deposits: DepositGateway;
  payments: PaymentGateway;
  waivers: WaiverGateway;
  profile: ProfileGateway;
  partner: PartnerGateway;
  admin: AdminGateway;
};
