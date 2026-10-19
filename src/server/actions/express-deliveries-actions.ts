'use server';

import { revalidatePath } from 'next/cache';
import { unstable_rethrow } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import type { ExpressDetail } from '@/lib/express-deliveries/types';
import type { ActionResult } from '@/types/api';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PATH = '/dashboard/express-deliveries';

export async function getExpressDetailAction(id: string): Promise<ActionResult<ExpressDetail>> {
  if (!UUID_RE.test(id)) return { success: false, error: 'Course invalide' };
  try {
    const data = await api.get<ExpressDetail>(`/admin/independent-deliveries/${id}`);
    return { success: true, data };
  } catch (error) {
    unstable_rethrow(error);
    return { success: false, error: extractMsg(error) };
  }
}

/** Trancher un paiement « à vérifier » : paid = argent reçu, failed = non reçu. */
export async function resolveExpressPaymentAction(
  id: string,
  outcome: 'paid' | 'failed',
  note?: string,
): Promise<ActionResult> {
  if (!UUID_RE.test(id)) return { success: false, error: 'Course invalide' };
  return post(`/admin/independent-deliveries/${id}/resolve-payment`, { outcome, note: note || undefined });
}

export async function cancelExpressAction(id: string, reason: string): Promise<ActionResult> {
  if (!UUID_RE.test(id)) return { success: false, error: 'Course invalide' };
  if (reason.trim().length < 3) return { success: false, error: 'Indiquez le motif (3 caractères minimum).' };
  return post(`/admin/independent-deliveries/${id}/cancel`, { reason: reason.trim() });
}

export async function markExpressRefundedAction(id: string, note?: string): Promise<ActionResult> {
  if (!UUID_RE.test(id)) return { success: false, error: 'Course invalide' };
  return post(`/admin/independent-deliveries/${id}/mark-refunded`, { note: note || undefined });
}

async function post(path: string, body: unknown): Promise<ActionResult> {
  try {
    await api.post(path, body);
    revalidatePath(PATH);
    return { success: true, data: undefined };
  } catch (error) {
    unstable_rethrow(error);
    return { success: false, error: extractMsg(error) };
  }
}

function extractMsg(error: unknown): string {
  if (error instanceof ApiError) {
    if (typeof error.body === 'object' && error.body !== null && 'message' in error.body) {
      const msg = (error.body as { message: unknown }).message;
      if (Array.isArray(msg)) return msg.join(', ');
      if (typeof msg === 'string') return msg;
    }
    return error.message;
  }
  return 'Erreur inattendue';
}
