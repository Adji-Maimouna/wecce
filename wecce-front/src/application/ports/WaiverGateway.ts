/** Port du renoncement de propriété (Laravel : POST /depots/{ref}/renoncement). */
export interface WaiverGateway {
  /** Signature (image PNG en data URL). Renvoie le nouveau solde de l'étudiant. */
  sign(depositRef: string, signature: string): Promise<{ balanceAfter: number }>;
  /** L'étudiant refuse les deux prix au comptoir : il repart avec son appareil, le dépôt est clos. */
  decline(depositRef: string): Promise<void>;
}
