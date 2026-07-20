'use server';

import { revalidatePath } from 'next/cache';
import { api, ApiError } from '@/lib/api';
import type { ActionResult } from '@/types/api';
import type { AgentReviewAction } from '@/lib/agents/types';

export async function reviewAgentAction(
  agentId: string,
  action: AgentReviewAction,
  rejectionReason?: string,
): Promise<ActionResult> {
  try {
    await api.patch(`/delivery-agents/${agentId}/review`, { action, rejectionReason });
    revalidatePath('/dashboard/agents');
    return { success: true, data: undefined };
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Erreur lors de la validation.' };
  }
}

export async function blockAgentAction(agentId: string): Promise<ActionResult> {
  try {
    await api.patch(`/delivery-agents/${agentId}/block`);
    revalidatePath('/dashboard/agents');
    return { success: true, data: undefined };
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Erreur lors du blocage.' };
  }
}
