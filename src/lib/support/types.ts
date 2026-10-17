/**
 * Types du module « Support » (tickets).
 * Contrat : routes /admin/support-tickets/* du backend (rôle ADMIN/SUPERADMIN).
 */

export type TicketStatus = 'ouvert' | 'en_cours' | 'resolu' | 'ferme';

export const TICKET_STATUSES: TicketStatus[] = ['ouvert', 'en_cours', 'resolu', 'ferme'];

/** Catégories proposées par l'application (texte exact stocké en base). */
export const TICKET_CATEGORIES = [
  'Commande',
  'Paiement',
  'Livraison',
  'Produit défectueux',
  'Remboursement',
  'Compte',
  'Vendeur',
  'Autre',
] as const;

/** Limites alignées sur le backend. */
export const TICKET_MAX_MESSAGE = 4000;
export const TICKET_MAX_ATTACHMENTS = 3;

export interface TicketStats {
  ouvert: number;
  en_cours: number;
  resolu: number;
  ferme: number;
  total: number;
  /** Tickets (non fermés) avec un message non lu côté admin. */
  adminUnread: number;
}

export interface TicketUserLite {
  id: string;
  prenom: string | null;
  name: string | null;
  email: string | null;
}

export interface TicketLastMessage {
  authorType: 'user' | 'admin' | string;
  preview: string;
  attachmentCount: number;
  createdAt: string;
}

export interface TicketListItem {
  id: string;
  number: number;
  /** « TCK-000042 » */
  reference: string;
  category: string;
  subject: string;
  status: TicketStatus;
  orderId: string | null;
  adminHasUnread: boolean;
  assignedAdmin: { id: string; name: string | null } | null;
  user: TicketUserLite;
  lastMessage: TicketLastMessage | null;
  createdAt: string;
  lastMessageAt: string;
  closedAt: string | null;
}

export interface TicketListResponse {
  data: TicketListItem[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface TicketUserDetail extends TicketUserLite {
  phone: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  roles: string[];
}

export interface TicketMessage {
  id: string;
  authorType: 'user' | 'admin' | string;
  authorName: string;
  body: string;
  attachments: string[];
  createdAt: string;
}

export interface TicketDetail {
  id: string;
  number: number;
  reference: string;
  category: string;
  subject: string;
  status: TicketStatus;
  orderId: string | null;
  order: { id: string; orderNumber: string; status: string } | null;
  adminHasUnread: boolean;
  userHasUnread: boolean;
  assignedAdmin: { id: string; name: string | null } | null;
  user: TicketUserDetail;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string;
  closedAt: string | null;
  messages: TicketMessage[];
}

export interface TicketListParams {
  status?: TicketStatus;
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}
