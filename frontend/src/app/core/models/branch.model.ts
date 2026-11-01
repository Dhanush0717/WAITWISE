export interface Branch {
  _id: string;
  id?: string;
  organisationId: string;
  name: string;
  code: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  location?: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
  phone?: string;
  email?: string;
  status: 'active' | 'inactive' | 'closed';
  workingHours?: {
    open: string;
    close: string;
  };
  createdAt?: string;
  updatedAt?: string;
}
