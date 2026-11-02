export interface Counter {
  _id: string;
  id?: string;
  organisationId: string;
  branchId?: string;
  serviceId: string | any;
  counterNumber: number;
  counterName: string;
  name?: string;
  assignedStaffId?: string | any;
  assignedStaff?: string | any;
  status: 'OPEN' | 'BUSY' | 'PAUSED' | 'CLOSED';
  currentTicketId?: string | any;
  stats?: {
    servedCount: number;
    averageDuration: number;
  };
  createdAt?: string;
  updatedAt?: string;
}
