export interface Counter {
  _id: string;
  id?: string;
  organisationId?: string;
  branchId?: string;
  serviceId: string | any;
  counterNumber: number;
  // Backend stores 'name'; some older seeds may use 'counterName'
  name?: string;
  counterName?: string;
  assignedStaffId?: string | any;
  assignedStaff?: string | any;
  // Backend enum: 'open' | 'busy' | 'on_break' | 'closed'
  status: string;
  // Backend stores currentTicket (ObjectId ref), not currentTicketId
  currentTicket?: string | any;
  currentTicketId?: string | any;
  todayServedCount?: number;
  stats?: {
    servedCount: number;
    averageDuration: number;
  };
  createdAt?: string;
  updatedAt?: string;
}
