export type ExpressStatus =
  | 'en attente'
  | 'contre-proposition'
  | 'paiement en attente'
  | 'accepté'
  | 'en cours de livraison'
  | 'livré'
  | 'annulée';

export interface ExpressPerson {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
}

export interface ExpressListItem {
  id: string;
  status: ExpressStatus;
  paymentStatus: string | null;
  refundStatus: string | null;
  delai: string;
  price: number | null;
  proposedPrice: number | null;
  pickupAddress: string;
  adresseLivraison: string;
  createdAt: string;
  paidAt: string | null;
  requester: ExpressPerson | null;
  agent: ExpressPerson | null;
}

export interface ExpressPage {
  data: ExpressListItem[];
  total: number;
  page: number;
  pages: number;
  /** Paiements « à vérifier » (toutes pages). */
  toReview: number;
  /** Remboursements « à rembourser » (toutes pages). */
  toRefund: number;
}

export interface ExpressDetail {
  id: string;
  status: ExpressStatus;
  delai: string;
  pickupAddress: string;
  adresseLivraison: string;
  packageDescription: string | null;
  notes: string | null;
  proposedPrice: number | null;
  counterPrice: number | null;
  price: number | null;
  reservedUntil: string | null;
  paymentStatus: string | null;
  paymentRef: string | null;
  paymentOperator: string | null;
  paymentRequestedAt: string | null;
  paidAt: string | null;
  cancelReason: string | null;
  refundStatus: string | null;
  refundedAt: string | null;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
  requester: ExpressPerson | null;
  agent: (ExpressPerson & { agentId: string }) | null;
  earning: {
    id: string;
    base: number;
    taux: number;
    montantLivreur: number;
    montantPlateforme: number;
    status: string;
    paidAt: string | null;
  } | null;
}
