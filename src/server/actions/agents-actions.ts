'use server';

import { revalidatePath } from 'next/cache';
import { unstable_rethrow } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import type { ActionResult } from '@/types/api';
import type { AgentReviewAction } from '@/lib/agents/types';

export async function reviewAgentAction(
  agentId: string,
  action: AgentReviewAction,
  rejectionReason?: string,
): Promise<ActionResult> {
  if (action !== 'approve' && action !== 'reject') {
    return { success: false, error: 'Action invalide.' };
  }
  const reason = rejectionReason?.trim();
  if (action === 'reject' && !reason) {
    return { success: false, error: 'Le motif de refus est obligatoire.' };
  }
  try {
    await api.patch(`/delivery-agents/${encodeURIComponent(agentId)}/review`, {
      action,
      ...(action === 'reject' ? { rejectionReason: reason } : {}),
    });
    revalidatePath('/dashboard/agents');
    return { success: true, data: undefined };
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof ApiError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Erreur lors de la validation.' };
  }
}

export async function blockAgentAction(agentId: string): Promise<ActionResult> {
  try {
    await api.patch(`/delivery-agents/${encodeURIComponent(agentId)}/block`);
    revalidatePath('/dashboard/agents');
    return { success: true, data: undefined };
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof ApiError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Erreur lors du blocage.' };
  }
}

export async function unblockAgentAction(agentId: string): Promise<ActionResult> {
  try {
    await api.patch(`/delivery-agents/${encodeURIComponent(agentId)}/unblock`);
    revalidatePath('/dashboard/agents');
    return { success: true, data: undefined };
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof ApiError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Erreur lors du déblocage.' };
  }
}
