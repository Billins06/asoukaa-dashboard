/**
 * Valeurs de statut du SERVEUR (NestJS) + libellé français + couleur de badge.
 *
 * POURQUOI ce fichier : le serveur stocke ses statuts en français, avec
 * accents ET quelques fautes d'orthographe (« expedié », « rejetté »).
 * Ces chaînes sont comparées telles quelles en base : on les recopie à
 * l'identique, on ne les « corrige » JAMAIS ici (sinon le filtre ne trouve rien).
 *
 * Sources (backend/src/modules/...) :
 *  - orders/entities/order.entity.ts ........ OrderStatus
 *  - orders/orders.service.ts ............... validateStatusTransition
 *  - reviews/entities/review.entity.ts ...... ReviewStatus
 *  - payments/entities/refund.entity.ts ..... RefundStatus
 *  - payments/entities/commission.entity.ts . CommissionStatus
 *  - payments/entities/payment.entity.ts .... PaymentStatus / PaymentMethod
 *  - users/entities/delivery-agent-profile.entity.ts . AgentStatus / VehicleType / Availability
 *  - auth/entities/admin-account.entity.ts .. AdminRole
 *  - common/entities/activity-log.entity.ts . ActorType / LogResult / LogAction
 */

export interface StatusMeta {
  /** Libellé affiché (singulier). */
  label: string;
  /** Libellé du bouton de filtre (pluriel). */
  filterLabel: string;
  /** Classes du <Badge variant="outline"> (valables en mode clair et sombre). */
  badge: string;
}

/** Palette de badges du projet (mêmes classes que celles déjà utilisées dans les pages). */
export const BADGE_TONE = {
  amber: 'border-amber-500/40 text-amber-600 bg-amber-500/5',
  blue: 'border-blue-500/40 text-blue-600 bg-blue-500/5',
  violet: 'border-violet-500/40 text-violet-600 bg-violet-500/5',
  indigo: 'border-indigo-500/40 text-indigo-600 bg-indigo-500/5',
  sky: 'border-sky-500/40 text-sky-600 bg-sky-500/5',
  emerald: 'border-emerald-500/40 text-emerald-600 bg-emerald-500/5',
  red: 'border-destructive/40 text-destructive bg-destructive/5',
  slate: 'border-slate-500/40 text-slate-500 bg-slate-500/5',
} as const;

type Tone = keyof typeof BADGE_TONE;

function meta(label: string, tone: Tone, filterLabel = label): StatusMeta {
  return { label, filterLabel, badge: BADGE_TONE[tone] };
}

/**
 * Cherche la fiche d'une valeur ; une valeur INCONNUE (nouveau statut ajouté
 * côté serveur, null…) s'affiche telle quelle en gris au lieu de faire planter la page.
 */
function lookup<K extends string>(
  table: Record<K, StatusMeta>,
  value: string | null | undefined,
): StatusMeta {
  if (value != null && Object.prototype.hasOwnProperty.call(table, value)) {
    return table[value as K];
  }
  const texte = value == null || value === '' ? '—' : String(value);
  return { label: texte, filterLabel: texte, badge: BADGE_TONE.slate };
}

function isOneOf<T extends string>(list: readonly T[], value: unknown): value is T {
  return typeof value === 'string' && (list as readonly string[]).includes(value);
}

// ─── Commandes ───────────────────────────────────────────

export const ORDER_STATUS = {
  PENDING: 'en attente',
  PREPARING: 'en cours',
  AGENT_ASSIGNED: 'livreur affecté',
  SHIPPED: 'expedié', // ⚠️ sans accent côté serveur
  IN_TRANSIT: 'en transit',
  DELIVERED: 'livré',
  CANCELLED: 'annulé',
} as const;
export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

/** Ordre d'affichage des onglets / filtres (du début à la fin du parcours). */
export const ORDER_STATUS_LIST: readonly OrderStatus[] = [
  ORDER_STATUS.PENDING,
  ORDER_STATUS.PREPARING,
  ORDER_STATUS.AGENT_ASSIGNED,
  ORDER_STATUS.SHIPPED,
  ORDER_STATUS.IN_TRANSIT,
  ORDER_STATUS.DELIVERED,
  ORDER_STATUS.CANCELLED,
];

export const ORDER_STATUS_META: Record<OrderStatus, StatusMeta> = {
  [ORDER_STATUS.PENDING]: meta('En attente', 'amber'),
  [ORDER_STATUS.PREPARING]: meta('En préparation', 'blue'),
  [ORDER_STATUS.AGENT_ASSIGNED]: meta('Livreur affecté', 'violet'),
  [ORDER_STATUS.SHIPPED]: meta('Expédié', 'indigo', 'Expédiées'),
  [ORDER_STATUS.IN_TRANSIT]: meta('En transit', 'sky'),
  [ORDER_STATUS.DELIVERED]: meta('Livré', 'emerald', 'Livrées'),
  [ORDER_STATUS.CANCELLED]: meta('Annulé', 'slate', 'Annulées'),
};

export const orderStatusMeta = (v: string | null | undefined) => lookup(ORDER_STATUS_META, v);
export const isOrderStatus = (v: unknown): v is OrderStatus => isOneOf(ORDER_STATUS_LIST, v);

/**
 * Commandes « en cours » = déjà passées mais ni livrées ni annulées.
 * Sert au KPI de l'accueil.
 */
export const ORDER_IN_PROGRESS_STATUSES: readonly OrderStatus[] = [
  ORDER_STATUS.PENDING,
  ORDER_STATUS.PREPARING,
  ORDER_STATUS.AGENT_ASSIGNED,
  ORDER_STATUS.SHIPPED,
  ORDER_STATUS.IN_TRANSIT,
];

/**
 * Transitions que le serveur ACCEPTE pour l'ADMIN (PATCH /orders/:id/admin-status).
 *  - Hors annulation : copie de validateStatusTransition (orders.service.ts).
 *  - Annulation : chemin dédié (cancelOrderAsAdmin / ADMIN_CANCELLABLE_STATUSES),
 *    possible depuis « en attente », « en cours », « livreur affecté »,
 *    « expedié » et « en transit » (motif obligatoire, 3 caractères minimum).
 * Proposer autre chose dans la boîte de dialogue ne produirait qu'une erreur 400.
 */
export const ORDER_ADMIN_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  [ORDER_STATUS.PENDING]: [ORDER_STATUS.PREPARING, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.PREPARING]: [
    ORDER_STATUS.AGENT_ASSIGNED,
    ORDER_STATUS.SHIPPED,
    ORDER_STATUS.DELIVERED,
    ORDER_STATUS.CANCELLED,
  ],
  [ORDER_STATUS.AGENT_ASSIGNED]: [ORDER_STATUS.SHIPPED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.SHIPPED]: [
    ORDER_STATUS.IN_TRANSIT,
    ORDER_STATUS.DELIVERED,
    ORDER_STATUS.CANCELLED,
  ],
  [ORDER_STATUS.IN_TRANSIT]: [ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.DELIVERED]: [],
  [ORDER_STATUS.CANCELLED]: [],
};

/** Statuts vers lesquels l'admin peut faire passer une commande depuis `current`. */
export function nextOrderStatuses(current: string): readonly OrderStatus[] {
  return isOrderStatus(current) ? ORDER_ADMIN_TRANSITIONS[current] : [];
}

// ─── Avis (modération) ───────────────────────────────────

export const REVIEW_STATUS = {
  PENDING: 'en attente',
  APPROVED: 'approuvé',
  REJECTED: 'rejeté',
} as const;
export type ReviewStatus = (typeof REVIEW_STATUS)[keyof typeof REVIEW_STATUS];
export const REVIEW_STATUS_LIST: readonly ReviewStatus[] = [
  REVIEW_STATUS.PENDING,
  REVIEW_STATUS.APPROVED,
  REVIEW_STATUS.REJECTED,
];
export const REVIEW_STATUS_META: Record<ReviewStatus, StatusMeta> = {
  [REVIEW_STATUS.PENDING]: meta('En attente', 'amber'),
  [REVIEW_STATUS.APPROVED]: meta('Approuvé', 'emerald', 'Approuvés'),
  [REVIEW_STATUS.REJECTED]: meta('Rejeté', 'red', 'Rejetés'),
};
export const reviewStatusMeta = (v: string | null | undefined) => lookup(REVIEW_STATUS_META, v);
export const isReviewStatus = (v: unknown): v is ReviewStatus => isOneOf(REVIEW_STATUS_LIST, v);

// ─── Remboursements ──────────────────────────────────────

export const REFUND_STATUS = {
  PENDING: 'en attente',
  APPROVED: 'approuvé',
  REJECTED: 'rejetté', // ⚠️ deux « t » côté serveur
  PROCESSED: 'traité',
} as const;
export type RefundStatus = (typeof REFUND_STATUS)[keyof typeof REFUND_STATUS];
export const REFUND_STATUS_LIST: readonly RefundStatus[] = [
  REFUND_STATUS.PENDING,
  REFUND_STATUS.APPROVED,
  REFUND_STATUS.REJECTED,
  REFUND_STATUS.PROCESSED,
];
export const REFUND_STATUS_META: Record<RefundStatus, StatusMeta> = {
  [REFUND_STATUS.PENDING]: meta('En attente', 'amber'),
  [REFUND_STATUS.APPROVED]: meta('Approuvé', 'emerald', 'Approuvés'),
  [REFUND_STATUS.REJECTED]: meta('Refusé', 'red', 'Refusés'),
  [REFUND_STATUS.PROCESSED]: meta('Traité', 'blue', 'Traités'),
};
export const refundStatusMeta = (v: string | null | undefined) => lookup(REFUND_STATUS_META, v);
export const isRefundStatus = (v: unknown): v is RefundStatus => isOneOf(REFUND_STATUS_LIST, v);

// ─── Commissions ─────────────────────────────────────────

export const COMMISSION_STATUS = {
  PENDING: 'en attente',
  PAID: 'payé',
} as const;
export type CommissionStatus = (typeof COMMISSION_STATUS)[keyof typeof COMMISSION_STATUS];
export const COMMISSION_STATUS_LIST: readonly CommissionStatus[] = [
  COMMISSION_STATUS.PENDING,
  COMMISSION_STATUS.PAID,
];
export const COMMISSION_STATUS_META: Record<CommissionStatus, StatusMeta> = {
  [COMMISSION_STATUS.PENDING]: meta('En attente', 'amber'),
  [COMMISSION_STATUS.PAID]: meta('Payée', 'emerald', 'Payées'),
};
export const commissionStatusMeta = (v: string | null | undefined) =>
  lookup(COMMISSION_STATUS_META, v);
export const isCommissionStatus = (v: unknown): v is CommissionStatus =>
  isOneOf(COMMISSION_STATUS_LIST, v);

// ─── Livreurs (agents de livraison) ──────────────────────

export const AGENT_STATUS = {
  PENDING: 'en attente',
  APPROVED: 'approuvé',
  REJECTED: 'rejeté',
  BLOCKED: 'bloqué',
} as const;
export type AgentStatus = (typeof AGENT_STATUS)[keyof typeof AGENT_STATUS];
export const AGENT_STATUS_LIST: readonly AgentStatus[] = [
  AGENT_STATUS.PENDING,
  AGENT_STATUS.APPROVED,
  AGENT_STATUS.REJECTED,
  AGENT_STATUS.BLOCKED,
];
export const AGENT_STATUS_META: Record<AgentStatus, StatusMeta> = {
  [AGENT_STATUS.PENDING]: meta('En attente', 'amber'),
  [AGENT_STATUS.APPROVED]: meta('Approuvé', 'emerald', 'Approuvés'),
  [AGENT_STATUS.REJECTED]: meta('Refusé', 'red', 'Refusés'),
  [AGENT_STATUS.BLOCKED]: meta('Bloqué', 'slate', 'Bloqués'),
};
export const agentStatusMeta = (v: string | null | undefined) => lookup(AGENT_STATUS_META, v);
export const isAgentStatus = (v: unknown): v is AgentStatus => isOneOf(AGENT_STATUS_LIST, v);

/** Véhicule : l'enum serveur est en MINUSCULES (moto, voiture, tricycle, velo). */
export const VEHICLE_TYPE = {
  MOTO: 'moto',
  VOITURE: 'voiture',
  TRICYCLE: 'tricycle',
  VELO: 'velo',
} as const;
export type VehicleType = (typeof VEHICLE_TYPE)[keyof typeof VEHICLE_TYPE];
export const VEHICLE_LABELS: Record<VehicleType, string> = {
  [VEHICLE_TYPE.MOTO]: 'Moto',
  [VEHICLE_TYPE.VOITURE]: 'Voiture',
  [VEHICLE_TYPE.TRICYCLE]: 'Tricycle',
  [VEHICLE_TYPE.VELO]: 'Vélo',
};
export function vehicleLabel(v: string | null | undefined): string {
  if (v != null && Object.prototype.hasOwnProperty.call(VEHICLE_LABELS, v)) {
    return VEHICLE_LABELS[v as VehicleType];
  }
  return v ? String(v) : '—';
}

/** Disponibilité : valeurs serveur « Temps_plein » / « Temps_partiel ». */
export const AVAILABILITY = {
  FULL_TIME: 'Temps_plein',
  PART_TIME: 'Temps_partiel',
} as const;
export type Availability = (typeof AVAILABILITY)[keyof typeof AVAILABILITY];
export const AVAILABILITY_LABELS: Record<Availability, string> = {
  [AVAILABILITY.FULL_TIME]: 'Temps plein',
  [AVAILABILITY.PART_TIME]: 'Temps partiel',
};
export function availabilityLabel(v: string | null | undefined): string {
  if (v != null && Object.prototype.hasOwnProperty.call(AVAILABILITY_LABELS, v)) {
    return AVAILABILITY_LABELS[v as Availability];
  }
  return v ? String(v) : '—';
}

// ─── Paiement ────────────────────────────────────────────

export const PAYMENT_STATUS = {
  PENDING: 'en attente',
  SUCCESS: 'success', // ⚠️ en anglais côté serveur
  FAILED: 'échoué',
  REFUNDED: 'remboursé',
} as const;
export type PaymentStatus = (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];
export const PAYMENT_STATUS_META: Record<PaymentStatus, StatusMeta> = {
  [PAYMENT_STATUS.PENDING]: meta('En attente', 'amber'),
  [PAYMENT_STATUS.SUCCESS]: meta('Payé', 'emerald'),
  [PAYMENT_STATUS.FAILED]: meta('Échoué', 'red'),
  [PAYMENT_STATUS.REFUNDED]: meta('Remboursé', 'blue'),
};
export const paymentStatusMeta = (v: string | null | undefined) => lookup(PAYMENT_STATUS_META, v);

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  mobile_money: 'Mobile Money',
  card: 'Carte bancaire',
  cash_on_delivery: 'Paiement à la livraison',
};
export function paymentMethodLabel(v: string | null | undefined): string {
  if (v != null && Object.prototype.hasOwnProperty.call(PAYMENT_METHOD_LABELS, v)) {
    return PAYMENT_METHOD_LABELS[v];
  }
  return v ? String(v) : '—';
}

// ─── Administrateurs ─────────────────────────────────────

/** Rôle envoyé / reçu : MINUSCULES (enum AdminRole du serveur). */
export const ADMIN_ROLE = {
  ADMIN: 'admin',
  SUPERADMIN: 'superadmin',
} as const;
export type AdminRole = (typeof ADMIN_ROLE)[keyof typeof ADMIN_ROLE];
export const ADMIN_ROLE_LIST: readonly AdminRole[] = [ADMIN_ROLE.ADMIN, ADMIN_ROLE.SUPERADMIN];
export const ADMIN_ROLE_META: Record<AdminRole, StatusMeta> = {
  [ADMIN_ROLE.ADMIN]: meta('Admin', 'blue'),
  [ADMIN_ROLE.SUPERADMIN]: meta('Super Admin', 'violet'),
};
export const adminRoleMeta = (v: string | null | undefined) => lookup(ADMIN_ROLE_META, v);
export const isAdminRole = (v: unknown): v is AdminRole => isOneOf(ADMIN_ROLE_LIST, v);

// ─── Journal d'activité ──────────────────────────────────

export const LOG_ACTOR_TYPE = {
  CLIENT: 'client',
  VENDOR: 'vendor',
  DELIVERY_AGENT: 'delivery_agent',
  ADMIN: 'admin',
  SUPERADMIN: 'superadmin',
  SYSTEM: 'system',
} as const;
export type LogActorType = (typeof LOG_ACTOR_TYPE)[keyof typeof LOG_ACTOR_TYPE];
export const LOG_ACTOR_TYPE_LIST: readonly LogActorType[] = [
  LOG_ACTOR_TYPE.CLIENT,
  LOG_ACTOR_TYPE.VENDOR,
  LOG_ACTOR_TYPE.DELIVERY_AGENT,
  LOG_ACTOR_TYPE.ADMIN,
  LOG_ACTOR_TYPE.SUPERADMIN,
  LOG_ACTOR_TYPE.SYSTEM,
];
export const LOG_ACTOR_TYPE_META: Record<LogActorType, StatusMeta> = {
  [LOG_ACTOR_TYPE.CLIENT]: meta('Client', 'slate'),
  [LOG_ACTOR_TYPE.VENDOR]: meta('Vendeur', 'amber'),
  [LOG_ACTOR_TYPE.DELIVERY_AGENT]: meta('Livreur', 'sky'),
  [LOG_ACTOR_TYPE.ADMIN]: meta('Admin', 'blue'),
  [LOG_ACTOR_TYPE.SUPERADMIN]: meta('Super Admin', 'violet'),
  [LOG_ACTOR_TYPE.SYSTEM]: meta('Système', 'indigo'),
};
export const logActorTypeMeta = (v: string | null | undefined) => lookup(LOG_ACTOR_TYPE_META, v);
export const isLogActorType = (v: unknown): v is LogActorType => isOneOf(LOG_ACTOR_TYPE_LIST, v);

export const LOG_RESULT = {
  SUCCESS: 'success',
  FAILURE: 'failure',
} as const;
export type LogResult = (typeof LOG_RESULT)[keyof typeof LOG_RESULT];
export const LOG_RESULT_LIST: readonly LogResult[] = [LOG_RESULT.SUCCESS, LOG_RESULT.FAILURE];
export const LOG_RESULT_META: Record<LogResult, StatusMeta> = {
  [LOG_RESULT.SUCCESS]: meta('Succès', 'emerald'),
  [LOG_RESULT.FAILURE]: meta('Échec', 'red'),
};
export const logResultMeta = (v: string | null | undefined) => lookup(LOG_RESULT_META, v);
export const isLogResult = (v: unknown): v is LogResult => isOneOf(LOG_RESULT_LIST, v);

/**
 * Actions du journal. Le serveur stocke DÉJÀ le libellé français comme valeur
 * de l'enum LogAction (« Commande annulée »…) : il n'y a donc pas de table de
 * traduction à maintenir, la valeur sert à la fois de filtre et de libellé.
 * Liste recopiée automatiquement depuis activity-log.entity.ts ; le filtre
 * serveur n'accepte QUE ces valeurs exactes (sinon erreur 400).
 */
export const LOG_ACTIONS: readonly string[] = [
  "Connexion utilisateur",
  "Échec de connexion utilisateur",
  "Inscription utilisateur",
  "Réinitialisation du mot de passe utilisateur",
  "Connexion administrateur",
  "Échec de connexion administrateur",
  "Demande de changement d'e-mail",
  "Adresse e-mail modifiée",
  "E-mail annulé — compte potentiellement compromis",
  "Alerte de sécurité acquittée",
  "Utilisateur bloqué",
  "Utilisateur débloqué",
  "Utilisateur créé par admin",
  "Utilisateur modifié par admin",
  "Administrateur créé",
  "Administrateur désactivé",
  "Demande vendeur soumise",
  "Vendeur approuvé",
  "Vendeur rejeté",
  "Vendeur bloqué",
  "Vendeur débloqué",
  "Demande livreur soumise",
  "Livreur approuvé",
  "Livreur rejeté",
  "Livreur bloqué",
  "Livreur débloqué",
  "Produit créé",
  "Produit mis à jour",
  "Produit supprimé",
  "Statut du produit modifié",
  "Boutique vendeur mise à jour",
  "Commande créée",
  "Statut de la commande modifié",
  "Commande annulée",
  "Litige ouvert sur une commande",
  "Commande non confirmée par le vendeur (alerte)",
  "Preuve de livraison soumise",
  "Paiement réussi",
  "Échec du paiement",
  "Demande de remboursement",
  "Remboursement effectué",
  "Livraison assignée",
  "Statut de livraison modifié",
  "Catégorie créée",
  "Catégorie mise à jour",
  "Catégorie supprimée",
  "Coupon créé",
  "Coupon désactivé",
  "Partenaire ajouté",
  "Partenaire modifié",
  "Partenaire supprimé",
  "Fournisseur créé",
  "Fournisseur modifié",
  "Fournisseur supprimé",
  "Avis approuvé",
  "Avis rejeté",
  "Taux de commission modifié",
  "Réponse à un ticket support",
  "Statut d'un ticket support modifié",
  "Ticket support assigné",
];
export const isLogAction = (v: unknown): v is string => isOneOf(LOG_ACTIONS, v);
