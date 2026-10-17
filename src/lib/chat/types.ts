/**
 * Formes réelles renvoyées par le serveur pour la modération des messages signalés
 * (GET /chat/reported et GET /chat/reported/:id/messages).
 * Les utilisateurs sont réduits à { id, prenom, name, email } côté serveur.
 */

export interface ChatUserRef {
  id: string;
  prenom: string | null;
  name: string | null;
  email: string | null;
}

export interface ChatVendorRef {
  id: string;
  shopName: string;
  user: ChatUserRef | null;
}

export interface ReportedConversation {
  id: string;
  clientId: string;
  client: ChatUserRef | null;
  vendorId: string;
  vendor: ChatVendorRef | null;
  productId: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReportedMessage {
  id: string;
  senderId: string;
  sender: ChatUserRef | null;
  content: string | null;
  imageUrl: string | null;
  isBlocked: boolean;
  blockReason: string | null;
  isReported: boolean;
  isRead: boolean;
  createdAt: string;
}

export interface ReportedConversationsPage {
  data: ReportedConversation[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

/** Nom lisible d'un utilisateur ("Prénom Nom"), repli sur l'e-mail puis sur un tiret. */
export function chatUserName(u: ChatUserRef | null | undefined): string {
  if (!u) return '—';
  const full = `${u.prenom ?? ''} ${u.name ?? ''}`.trim();
  return full || u.email || '—';
}

const BLOCK_REASON_LABELS: Record<string, string> = {
  phone_number_detected: 'numéro de téléphone détecté',
  external_link_detected: 'lien externe détecté',
  suspicious_keyword: 'mot-clé de contournement détecté',
  account_number_detected: 'numéro de compte détecté',
};

export function blockReasonLabel(reason: string | null | undefined): string {
  if (!reason) return 'raison non précisée';
  return BLOCK_REASON_LABELS[reason] ?? reason;
}
