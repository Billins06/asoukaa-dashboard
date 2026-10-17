'use server';

import { revalidatePath } from 'next/cache';
import { unstable_rethrow } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { isTrustedTicketImage } from '@/lib/support/safe-image';
import {
  TICKET_MAX_ATTACHMENTS,
  TICKET_MAX_MESSAGE,
  TICKET_STATUSES,
  type TicketStatus,
} from '@/lib/support/types';
import type { ActionResult } from '@/types/api';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function extractMsg(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 0) {
      return 'Serveur injoignable. Vérifiez que le backend est démarré.';
    }
    const msg = (error.body as { message?: unknown } | null)?.message;
    // 404 « route inconnue » de NestJS ≠ 404 métier (« Ticket introuvable »).
    if (error.status === 404 && (typeof msg !== 'string' || /^Cannot [A-Z]+ \//.test(msg))) {
      return "Fonction indisponible : la route n'existe pas (encore) côté serveur.";
    }
    if (Array.isArray(msg)) return msg.join(', ');
    if (typeof msg === 'string' && msg) return msg;
    return error.message;
  }
  return 'Erreur inattendue';
}

function refresh(id: string) {
  revalidatePath(`/dashboard/support/${id}`);
  revalidatePath('/dashboard/support');
}

/** Répond au ticket (au nom de « l'Équipe Asoukaa »). Les images viennent de POST /upload/tickets. */
export async function replyTicketAction(
  id: string,
  message: string,
  attachments: string[] = [],
): Promise<ActionResult> {
  if (!UUID_RE.test(id)) return { success: false, error: 'Identifiant de ticket invalide.' };
  const body = typeof message === 'string' ? message.trim() : '';
  if (!body) return { success: false, error: 'Le message ne peut pas être vide.' };
  if (body.length > TICKET_MAX_MESSAGE) {
    return { success: false, error: `Le message ne peut pas dépasser ${TICKET_MAX_MESSAGE} caractères.` };
  }
  if (!Array.isArray(attachments) || attachments.length > TICKET_MAX_ATTACHMENTS) {
    return { success: false, error: `Maximum ${TICKET_MAX_ATTACHMENTS} images par message.` };
  }
  if (!attachments.every((u) => isTrustedTicketImage(u))) {
    return { success: false, error: "Une des images n'est pas valide. Renvoyez-la." };
  }
  try {
    await api.post(`/admin/support-tickets/${id}/messages`, {
      message: body,
      ...(attachments.length > 0 ? { attachments } : {}),
    });
    refresh(id);
    return { success: true, data: undefined };
  } catch (error) {
    unstable_rethrow(error);
    refresh(id);
    return { success: false, error: extractMsg(error) };
  }
}

export async function setTicketStatusAction(id: string, status: TicketStatus): Promise<ActionResult> {
  if (!UUID_RE.test(id)) return { success: false, error: 'Identifiant de ticket invalide.' };
  if (!TICKET_STATUSES.includes(status)) return { success: false, error: 'Statut invalide.' };
  try {
    await api.patch(`/admin/support-tickets/${id}/status`, { status });
    refresh(id);
    return { success: true, data: undefined };
  } catch (error) {
    unstable_rethrow(error);
    return { success: false, error: extractMsg(error) };
  }
}

export async function assignTicketToMeAction(id: string): Promise<ActionResult> {
  if (!UUID_RE.test(id)) return { success: false, error: 'Identifiant de ticket invalide.' };
  try {
    await api.patch(`/admin/support-tickets/${id}/assign`);
    refresh(id);
    return { success: true, data: undefined };
  } catch (error) {
    unstable_rethrow(error);
    return { success: false, error: extractMsg(error) };
  }
}
