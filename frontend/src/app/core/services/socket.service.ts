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

    this.socket.on('queue_updated', (data) => this.queueUpdated$.next(data));
    this.socket.on('token_created', (data) => this.tokenCreated$.next(data));
    this.socket.on('token_called', (data) => this.tokenCalled$.next(data));
    this.socket.on('service_started', (data) => this.serviceStarted$.next(data));
    this.socket.on('token_completed', (data) => this.tokenCompleted$.next(data));
    this.socket.on('token_cancelled', (data) => this.tokenCancelled$.next(data));
    this.socket.on('token_skipped', (data) => this.tokenSkipped$.next(data));
    this.socket.on('notification', (data) => this.notification$.next(data));
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
