export type OrganisationType =
  | 'healthcare'
  | 'banking'
  | 'government'
  | 'retail'
  | 'education'
  | 'hospitality'
  | 'corporate'
  | 'other';

export interface OrganisationTerminology {
  serviceLabel: string;
  branchLabel: string;
  tokenLabel: string;
  customerLabel: string;
  staffLabel: string;
  counterLabel: string;
}

export interface OrganisationSettings {
  allowGuestTokens: boolean;
  enableSmsNotifications: boolean;
  enableQrSelfJoin: boolean;
  maxActiveTokensPerCustomer: number;
  workingHours: {
    open: string;
    close: string;
  };
}

export interface Organisation {
  _id: string;
  id?: string;
  name: string;
  slug: string;
  type: OrganisationType;
  description?: string;
  logo?: string;
  primaryColor?: string;
  contact?: {
    email?: string;
    phone?: string;
    website?: string;
    address?: string;
  };
  terminology: OrganisationTerminology;
  settings: OrganisationSettings;
  status: 'active' | 'suspended' | 'trial' | 'pending_verification';
  createdAt?: string;
  updatedAt?: string;
}
