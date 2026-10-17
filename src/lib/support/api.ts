import 'server-only';
import { api } from '@/lib/api';
import type { TicketDetail, TicketListParams, TicketListResponse, TicketStats } from './types';

export async function getTicketStats(): Promise<TicketStats> {
  return api.get<TicketStats>('/admin/support-tickets/stats');
}

export async function getTickets(params: TicketListParams = {}): Promise<TicketListResponse> {
  const query = new URLSearchParams();
  if (params.status) query.set('status', params.status);
  if (params.category) query.set('category', params.category);
  if (params.search) query.set('search', params.search);
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  const qs = query.toString();
  return api.get<TicketListResponse>(`/admin/support-tickets${qs ? `?${qs}` : ''}`);
}

/** L'identifiant doit avoir été validé (UUID) par l'appelant. */
export async function getTicket(id: string): Promise<TicketDetail> {
  const t = await api.get<TicketDetail>(`/admin/support-tickets/${id}`);
  return {
    ...t,
    messages: Array.isArray(t?.messages) ? t.messages : [],
    user: { ...t.user, roles: Array.isArray(t?.user?.roles) ? t.user.roles : [] },
  };
}

/**
 * Hôtes autorisés pour l'affichage des images de tickets (hôte[:port],
 * minuscules), lus dans la variable d'environnement SERVEUR
 * UPLOAD_IMAGE_HOSTS (liste séparée par des virgules). Vide = aucune
 * restriction d'hôte (le contrôle de forme du chemin reste appliqué).
 */
export function getUploadImageHosts(): string[] {
  return (process.env.UPLOAD_IMAGE_HOSTS ?? '')
    .split(',')
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
}
