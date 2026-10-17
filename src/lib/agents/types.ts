import type { AgentStatus, Availability, VehicleType } from '@/lib/status-meta';
import type { Paginated } from '@/lib/pagination';

/**
 * Valeurs EXACTES du serveur (voir lib/status-meta.ts) :
 *  - statut : « en attente » · « approuvé » · « rejeté » · « bloqué »
 *  - véhicule : « moto » · « voiture » · « tricycle » · « velo » (minuscules)
 *  - disponibilité : « Temps_plein » · « Temps_partiel »
 */
export type { AgentStatus, VehicleType, Availability };

export interface AgentUser {
  id: string;
  prenom: string;
  name: string;
  email: string;
  phone: string;
}

export interface AgentListItem {
  id: string;
  vehicleType: VehicleType;
  availability: Availability;
  ville: string;
  status: AgentStatus;
  /** Décimaux Postgres : arrivent en TEXTE ("4.50") → toujours passer par Number()/toNumber(). */
  noteMoyenne: string | number;
  tauxDeReussite: string | number;
  totalLivraisons: number;
  createdAt?: string;
  user: AgentUser;
  // Pièces du dossier (fiche /delivery-agents/:id ; contrôlées avant affichage)
  idDocumentUrl?: string | null;
  selfieUrl?: string | null;
  vehiclePhotoUrl?: string | null;
}

export interface AgentPendingItem {
  id: string;
  vehicleType: VehicleType;
  ville: string;
  quartier: string;
  createdAt: string;
  user: Pick<AgentUser, 'id' | 'prenom' | 'name' | 'email' | 'phone'>;
  idDocumentUrl?: string | null;
  selfieUrl?: string | null;
  vehiclePhotoUrl?: string | null;
}

export type AgentReviewAction = 'approve' | 'reject';

export type BackendPaginated<T> = Paginated<T>;
