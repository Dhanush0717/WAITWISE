export type UserRole = 'super_admin' | 'org_admin' | 'branch_manager' | 'staff' | 'customer';

export interface User {
  _id: string;
  id?: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  organisationId?: string;
  branchId?: string;
  assignedServiceId?: string;
  assignedCounterId?: string;
  status: 'active' | 'suspended' | 'invited';
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  organisation?: any;
}
