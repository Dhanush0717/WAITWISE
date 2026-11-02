import { Injectable, signal, inject } from '@angular/core';
import { Observable, tap, map, of } from 'rxjs';
import { ApiService } from './api.service';
import { Service } from '../models/service.model';
import { Ticket } from '../models/ticket.model';

@Injectable({
  providedIn: 'root'
})
export class QueueService {
  private api = inject(ApiService);

  activeTicket = signal<Ticket | null>(null);
  currentService = signal<Service | null>(null);

  constructor() {
    this.restoreActiveTicket();
  }

  private restoreActiveTicket() {
    const saved = localStorage.getItem('waitwise_active_ticket');
    if (saved) {
      try {
        const ticket: Ticket = JSON.parse(saved);
        this.activeTicket.set(ticket);
        // Refresh ticket status
        if (ticket._id || (ticket as any).id) {
          const tid = ticket._id || (ticket as any).id;
          this.getTicketStatus(tid).subscribe({
            next: (refreshed) => {
              if (refreshed && ['WAITING', 'CALLED', 'SERVING'].includes(refreshed.status)) {
                this.setActiveTicket(refreshed);
              } else {
                this.clearActiveTicket();
              }
            },
            error: () => this.clearActiveTicket()
          });
        }
      } catch (e) {
        this.clearActiveTicket();
      }
    }
  }

  getServices(queryOrOrgId?: any): Observable<Service[]> {
    let params: any = undefined;
    if (typeof queryOrOrgId === 'string' && queryOrOrgId.trim()) {
      params = { organisationId: queryOrOrgId.trim() };
    } else if (queryOrOrgId && typeof queryOrOrgId === 'object') {
      params = queryOrOrgId;
    }
    return this.api.get<any>('/services', params).pipe(
      map(res => (res && res.data) ? res.data : (Array.isArray(res) ? res : []))
    );
  }

  getServiceById(id: string): Observable<Service> {
    return this.api.get<any>(`/services/${id}`).pipe(
      map(res => (res && res.data) ? res.data : res),
      tap(svc => this.currentService.set(svc))
    );
  }

  joinQueue(serviceId: string, priority: string = 'REGULAR', notes: string = ''): Observable<{ success: boolean; ticket: Ticket }> {
    return this.api.post<{ success: boolean; ticket: Ticket }>('/queue/join', {
      serviceId,
      priority,
      notes
    }).pipe(
      tap(res => {
        if (res && res.ticket) {
          this.setActiveTicket(res.ticket);
        }
      })
    );
  }

  kioskJoin(payload: { serviceId: string; customerName?: string; guestInfo?: { name: string; phone?: string; identifier?: string }; priority?: string }): Observable<any> {
    return this.api.post<any>('/queues/kiosk-join', payload).pipe(
      map(res => (res && res.data) ? res.data : res),
      tap(res => {
        const ticket = res?.ticket || res;
        if (ticket && ticket.ticketNumber) {
          this.setActiveTicket(ticket);
        }
      })
    );
  }

  staffIssueToken(payload: { serviceId: string; guestInfo: { name: string; phone?: string }; priority?: string; notes?: string }): Observable<any> {
    return this.api.post<any>('/queues/staff-issue', payload).pipe(
      map(res => (res && res.data) ? res.data : res)
    );
  }

  getTicketStatus(ticketId: string): Observable<Ticket> {
    return this.api.get<any>(`/queue/ticket/${ticketId}`).pipe(
      map(res => (res && res.data) ? res.data : res),
      tap(ticket => {
        if (this.activeTicket() && (this.activeTicket()?._id === ticket._id || (this.activeTicket() as any)?.id === ticket._id)) {
          this.setActiveTicket(ticket);
        }
      })
    );
  }

  getMyActiveTicket(): Observable<Ticket | null> {
    return this.api.get<{ success: boolean; ticket: Ticket }>('/queue/my-active').pipe(
      tap(res => {
        if (res && res.ticket) {
          this.setActiveTicket(res.ticket);
        } else {
          this.clearActiveTicket();
        }
      }),
      map(res => res?.ticket || null)
    );
  }

  cancelTicket(ticketId: string, reason?: string): Observable<any> {
    return this.api.post(`/queue/cancel/${ticketId}`, { reason }).pipe(
      tap(() => {
        if (this.activeTicket()?._id === ticketId || (this.activeTicket() as any)?.id === ticketId) {
          this.clearActiveTicket();
        }
      })
    );
  }

  getLiveQueue(serviceId: string): Observable<any> {
    return this.api.get<any>(`/queue/live/${serviceId}`).pipe(
      map(res => (res && res.data) ? res.data : res)
    );
  }

  setActiveTicket(ticket: Ticket | null) {
    this.activeTicket.set(ticket);
    if (ticket) {
      localStorage.setItem('waitwise_active_ticket', JSON.stringify(ticket));
    } else {
      localStorage.removeItem('waitwise_active_ticket');
    }
  }

  clearActiveTicket() {
    this.activeTicket.set(null);
    localStorage.removeItem('waitwise_active_ticket');
  }
}
