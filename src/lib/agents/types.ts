export type AgentStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'BLOCKED';
export type VehicleType = 'MOTO' | 'VOITURE' | 'TRICYCLE' | 'VELO';
export type Availability = 'FULL_TIME' | 'PART_TIME';

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
  noteMoyenne: number;
  tauxDeReussite: number;
  totalLivraisons: number;
  user: AgentUser;
}

export interface AgentPendingItem {
  id: string;
  vehicleType: VehicleType;
  ville: string;
  quartier: string;
  createdAt: string;
  user: Pick<AgentUser, 'id' | 'prenom' | 'name' | 'email' | 'phone'>;
}

export type AgentReviewAction = 'approve' | 'reject';

export interface BackendPaginated<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}
