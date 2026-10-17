import type { UserListItem, UserRoleField } from './types';

/** Libellés français des rôles connus du serveur. */
export const ROLE_LABELS: Record<string, string> = {
  client: 'Client',
  vendor: 'Vendeur',
  delivery_agent: 'Livreur',
  admin: 'Admin',
  superadmin: 'Super admin',
};

export function roleLabel(role: string): string {
  return ROLE_LABELS[role] ?? role;
}

/**
 * Noms des rôles ACTIFS d'un utilisateur, sans doublon.
 * Accepte les deux formes du serveur : objets { role, isActive } ou textes.
 */
export function getRoleNames(roles: readonly UserRoleField[] | null | undefined): string[] {
  if (!Array.isArray(roles)) return [];
  const names: string[] = [];
  for (const r of roles) {
    if (typeof r === 'string') {
      if (r) names.push(r);
    } else if (r && typeof r === 'object' && typeof r.role === 'string' && r.role && r.isActive !== false) {
      names.push(r.role);
    }
  }
  return Array.from(new Set(names));
}

function toTime(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? null : t;
}

/**
 * Alerte de sécurité NON traitée :
 * securityAlertAt renseigné ET (acquittement absent OU antérieur à l'alerte).
 * Une nouvelle alerte survenue après un acquittement redevient donc active.
 * Si la date d'alerte est illisible mais présente, on la considère active (côté prudent).
 */
export function hasActiveSecurityAlert(
  user: Pick<UserListItem, 'securityAlertAt' | 'securityAlertAckedAt'>,
): boolean {
  if (!user.securityAlertAt) return false;
  const alertTime = toTime(user.securityAlertAt);
  if (alertTime === null) return true;
  const ackTime = toTime(user.securityAlertAckedAt);
  return ackTime === null || ackTime < alertTime;
}

/** Une alerte a existé (traitée ou non). */
export function hasSecurityAlertHistory(user: Pick<UserListItem, 'securityAlertAt'>): boolean {
  return Boolean(user.securityAlertAt);
}
