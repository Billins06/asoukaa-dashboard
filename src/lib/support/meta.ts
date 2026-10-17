import type { TicketStatus } from './types';

export const TICKET_STATUS_META: Record<
  TicketStatus,
  { label: string; badge: string; dot: string }
> = {
  ouvert: {
    label: 'Ouvert',
    badge: 'border-sky-500/40 text-sky-600 bg-sky-500/5',
    dot: 'bg-sky-500',
  },
  en_cours: {
    label: 'En cours',
    badge: 'border-amber-500/40 text-amber-600 bg-amber-500/5',
    dot: 'bg-amber-500',
  },
  resolu: {
    label: 'Résolu',
    badge: 'border-emerald-500/40 text-emerald-600 bg-emerald-500/5',
    dot: 'bg-emerald-500',
  },
  ferme: {
    label: 'Fermé',
    badge: 'border-slate-400/40 text-slate-500 bg-slate-500/5',
    dot: 'bg-slate-400',
  },
};

export function ticketStatusMeta(status: string) {
  return (
    TICKET_STATUS_META[status as TicketStatus] ?? {
      label: status,
      badge: 'border-slate-400/40 text-slate-500 bg-slate-500/5',
      dot: 'bg-slate-400',
    }
  );
}

const ROLE_LABELS: Record<string, string> = {
  client: 'Client',
  vendor: 'Vendeur',
  delivery_agent: 'Livreur',
  admin: 'Admin',
  superadmin: 'Super admin',
};

export function roleLabel(role: string): string {
  return ROLE_LABELS[role] ?? role;
}

/** « Prénom Nom » (repli : e-mail, puis « Utilisateur »). */
export function personName(u: { prenom?: string | null; name?: string | null; email?: string | null }): string {
  const full = `${u.prenom ?? ''} ${u.name ?? ''}`.trim();
  return full || u.email || 'Utilisateur';
}
