export type NotificationType =
  | 'INFO'
  | 'WARNING'
  | 'ALERT'
  | 'TURN_APPROACHING'
  | 'YOUR_TURN';

export interface NotificationItem {
  _id: string;
  id?: string;
  userId: string;
  organisationId?: string;
  branchId?: string;
  ticketId?: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
  updatedAt?: string;
}
