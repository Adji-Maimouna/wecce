/** Questions fréquentes (texte éditorial de l'interface). */

export type FaqItem = {
  q: string;
  a: string;
  /** Passage dont la valeur reste à trancher avec LBC (souligné en pointillé). */
  tbd?: { text: string; note: string };
};

export type FaqSection = { id: string; title: string; items: FaqItem[] };

const VALUE: FaqItem = { q: "Combien vaut mon appareil ?", a: "LBC fixe le prix au rendez-vous, après examen. Wecce ne donne pas d'estimation en ligne, et vous pouvez refuser." };
const EXPIRE: FaqItem = { q: "Mes points expirent-ils ?", a: "Non. Ils baissent de 5 % le 1er de chaque mois, comme les prix du marché." };
const REFUSE: FaqItem = { q: "Et si le prix de LBC ne me convient pas ?", a: "Vous repartez avec votre appareil, sans rien payer." };
const COMPLEMENT: FaqItem = { q: "Que faire si mes points ne suffisent pas ?", a: "Vous payez la différence en francs, par Wave, Orange Money ou en espèces au retrait, sans frais." };
const ACCEPTED: FaqItem = { q: "Quels appareils sont acceptés ?", a: "Téléphones, ordinateurs, tablettes, audio et pièces détachées. L'appareil doit être déconnecté de vos comptes." };
const SEE: FaqItem = { q: "Puis-je voir l'objet avant de le prendre ?", a: "Oui. Tout se retire chez LBC, où l'appareil est allumé devant vous." };

/** Les six questions de l'accueil public. */
export const faq: FaqItem[] = [VALUE, EXPIRE, REFUSE, COMPLEMENT, ACCEPTED, SEE];

/** La page « Questions fréquentes » de l'espace étudiant, rangée par sujet. */
export const helpSections: FaqSection[] = [
  {
    id: "deux-prix",
    title: "Les deux prix",
    items: [
      VALUE,
      {
        q: "Que sont les deux prix ?",
        a: "À l'examen, LBC vous annonce la valeur de reprise, c'est-à-dire les points que vous recevez, et le prix auquel l'appareil sera proposé à l'étudiant suivant. La différence couvre l'expertise, le stockage et la garantie.",
      },
      REFUSE,
      { q: "Qui voit mon prix souhaité ?", a: "Vous et LBC seulement. Il n'apparaît jamais sur le marché." },
    ],
  },
  {
    id: "baisse",
    title: "La baisse mensuelle",
    items: [
      EXPIRE,
      {
        q: "Pourquoi mes points baissent-ils ?",
        a: "Le 1er de chaque mois, votre solde et tous les prix du marché baissent de 5 %, au même arrondi. Ce que vos points permettent de prendre reste le même.",
      },
      {
        q: "Ai-je intérêt à attendre la baisse pour prendre un objet ?",
        a: "Non. Le prix baisse, mais votre solde aussi, au même taux. Et un autre étudiant peut prendre l'objet entre-temps.",
      },
    ],
  },
  {
    id: "deposer",
    title: "Déposer un appareil",
    items: [
      ACCEPTED,
      {
        q: "Que dois-je apporter au rendez-vous ?",
        a: "Votre carte d'étudiant, l'appareil et son chargeur. Déconnectez vos comptes Google, Microsoft ou iCloud et réinitialisez l'appareil avant de venir.",
      },
      { q: "Quand mes points sont-ils crédités ?", a: "À la signature du renoncement, sur la tablette du comptoir, bonus de lancement compris." },
      { q: "Puis-je changer ou annuler mon rendez-vous ?", a: "Oui, depuis « Mes dépôts », tant que l'appareil n'a pas été examiné." },
    ],
  },
  {
    id: "retrait",
    title: "Prendre un objet, retrait et garantie",
    items: [
      COMPLEMENT,
      SEE,
      {
        q: "Combien de temps l'objet m'est-il réservé ?",
        a: "3 jours après la réservation. Passé ce délai, il revient sur le marché.",
        tbd: { text: "3 jours", note: "Délai de retrait à trancher avec LBC" },
      },
      {
        q: "Y a-t-il une garantie ?",
        a: "Oui, 7 jours après le retrait. En cas de défaut, LBC répare ou reprend l'appareil.",
        tbd: { text: "7 jours", note: "Durée de garantie à trancher avec LBC" },
      },
    ],
  },
];
