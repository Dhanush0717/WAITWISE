import { Injectable, signal } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket;
  isConnected = signal<boolean>(false);

  // Subject streams for reactive consumption
  public queueUpdated$ = new Subject<any>();
  public tokenCreated$ = new Subject<any>();
  public tokenCalled$ = new Subject<any>();
  public serviceStarted$ = new Subject<any>();
  public tokenCompleted$ = new Subject<any>();
  public tokenCancelled$ = new Subject<any>();
  public tokenSkipped$ = new Subject<any>();
  public notification$ = new Subject<any>();

  constructor() {
    this.socket = io({
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000
    });

    this.registerSocketEvents();
  }

  private registerSocketEvents() {
    this.socket.on('connect', () => {
      this.isConnected.set(true);
      console.log('Socket.IO connected:', this.socket.id);
    });

    this.socket.on('disconnect', () => {
      this.isConnected.set(false);
      console.log('Socket.IO disconnected');
    });

    const forward = (subject: Subject<any>) => (data: any) => subject.next(data);

    this.socket.on('queueUpdated', forward(this.queueUpdated$));
    this.socket.on('queue_updated', forward(this.queueUpdated$));

    this.socket.on('tokenCreated', forward(this.tokenCreated$));
    this.socket.on('token_created', forward(this.tokenCreated$));

    this.socket.on('tokenCalled', forward(this.tokenCalled$));
    this.socket.on('token_called', forward(this.tokenCalled$));

    this.socket.on('serviceStarted', forward(this.serviceStarted$));
    this.socket.on('service_started', forward(this.serviceStarted$));

    this.socket.on('tokenCompleted', forward(this.tokenCompleted$));
    this.socket.on('token_completed', forward(this.tokenCompleted$));

    this.socket.on('tokenCancelled', forward(this.tokenCancelled$));
    this.socket.on('token_cancelled', forward(this.tokenCancelled$));

    this.socket.on('tokenSkipped', forward(this.tokenSkipped$));
    this.socket.on('token_skipped', forward(this.tokenSkipped$));

    this.socket.on('counterStatusChanged', forward(this.queueUpdated$));
    this.socket.on('notification', forward(this.notification$));
  }

  joinService(serviceId: string) {
    if (serviceId) {
      this.socket.emit('join_service', serviceId);
    }
  }

  leaveService(serviceId: string) {
    if (serviceId) {
      this.socket.emit('leave_service', serviceId);
    }
  }

  joinTicket(ticketId: string) {
    if (ticketId) {
      this.socket.emit('join_ticket', ticketId);
    }
  }

  leaveTicket(ticketId: string) {
    if (ticketId) {
      this.socket.emit('leave_ticket', ticketId);
    }
  }

  joinOrg(orgId: string) {
    if (orgId) {
      this.socket.emit('join_org', orgId);
    }
  }

  leaveOrg(orgId: string) {
    if (orgId) {
      this.socket.emit('leave_org', orgId);
    }
  }
}
