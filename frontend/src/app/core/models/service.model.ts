export interface ServiceLocation {
  building?: string;
  floor?: string;
  room?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface ServiceCapacity {
  maxPerDay: number;
  currentCount: number;
  isAcceptingTokens: boolean;
}

export interface Service {
  _id: string;
  id?: string;
  organisationId: string;
  branchId?: string;
  name: string;
  code: string;
  description?: string;
  category: string;
  icon?: string;
  avgServiceDuration: number; // in minutes
  prefix: string;
  operatingHours: {
    open: string;
    close: string;
  };
  operatingDays?: number[];
  location: ServiceLocation;
  capacity: ServiceCapacity;
  status: 'ACTIVE' | 'PAUSED' | 'CLOSED' | 'active' | 'paused' | 'closed';
  priorityRules?: {
    allowPriority: boolean;
    priorityMultiplier: number;
  };
  rules?: {
    allowGuestTokens: boolean;
    requiresAppointment: boolean;
    maxAdvanceDays: number;
  };
  // Dynamic queue state
  waitingCount?: number;
  servingCount?: number;
  activeCountersCount?: number;
  estimatedWaitTime?: number;
  currentServingToken?: string;
  counters?: any[];
  createdAt?: string;
  updatedAt?: string;
}
