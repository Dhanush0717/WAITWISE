import { Service } from './service.model';
import { Counter } from './counter.model';

export type TicketStatus =
  | 'WAITING'
  | 'CALLED'
  | 'SERVING'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'SKIPPED'
  | 'NO_SHOW'
  | 'EXPIRED';

export type TicketChannel = 'APP' | 'KIOSK' | 'STAFF';
export type TicketPriority = 'REGULAR' | 'SENIOR' | 'EMERGENCY' | 'VIP';

export interface GuestInfo {
  name: string;
  phone?: string;
  email?: string;
  identifier?: string;
}

export interface Ticket {
  _id: string;
  id?: string;
  ticketNumber: string;
  organisationId: string;
  branchId?: string;
  serviceId: string | Service;
  counterId?: string | Counter;
  userId?: string | any;
  guestInfo?: GuestInfo;
  channel: TicketChannel;
  status: TicketStatus;
  position: number;
  priority: TicketPriority;
  joinedAt: string;
  calledAt?: string;
  servingStartedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  estimatedWaitTime?: number; // in minutes
  peopleAhead?: number;
  currentServingToken?: string;
  cancellationReason?: string;
  skipReason?: string;
  notes?: string;
  qrCodeData?: string;
  createdAt?: string;
  updatedAt?: string;
}
