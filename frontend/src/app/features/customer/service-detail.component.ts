import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { QueueService } from '../../core/services/queue.service';
import { AuthService } from '../../core/services/auth.service';
import { OrganisationService } from '../../core/services/organisation.service';
import { SocketService } from '../../core/services/socket.service';
import { Service } from '../../core/models/service.model';
import { Counter } from '../../core/models/counter.model';
import { QrDisplayModalComponent } from '../../shared/components/qr-display-modal/qr-display-modal.component';

@Component({
  selector: 'app-service-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, QrDisplayModalComponent],
  template: `
    <div class="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      <div class="max-w-5xl mx-auto">
        <!-- Back Navigation -->
        <a routerLink="/services" class="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-brand-600 mb-6 transition-colors">
          &larr; Back to {{ orgService.serviceLabel() }} Directory
        </a>

        <div *ngIf="service()" class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Left Column (2 cols): Details & Counters -->
          <div class="lg:col-span-2 space-y-6">
            <!-- Service Header Card -->
            <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
              <div class="flex items-start justify-between gap-4 mb-4">
                <div class="flex items-center gap-3">
                  <div class="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-950 text-brand-600 flex items-center justify-center font-bold text-2xl">
                    {{ service()?.icon || '📌' }}
                  </div>
                  <div>
                    <div class="flex items-center gap-2">
                      <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">{{ service()?.code }}</span>
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 capitalize">
                        {{ service()?.category }}
                      </span>
                    </div>
                    <h1 class="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                      {{ service()?.name }}
                    </h1>
                  </div>
                </div>

                <span
                  [ngClass]="{
                    'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300': service()?.status === 'ACTIVE',
                    'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300': service()?.status === 'PAUSED',
                    'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400': service()?.status === 'CLOSED'
                  }"
                  class="px-3 py-1 rounded-full text-xs font-bold">
                  {{ service()?.status }}
                </span>
              </div>

              <p class="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                {{ service()?.description }}
              </p>

              <!-- Location & Operating Details -->
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs">
                <div>
                  <span class="text-slate-400 block text-[10px] font-semibold">Location</span>
                  <strong class="text-slate-800 dark:text-white">{{ service()?.location?.building || 'Main Facility' }}</strong>
                </div>
                <div>
                  <span class="text-slate-400 block text-[10px] font-semibold">Floor / Room</span>
                  <strong class="text-slate-800 dark:text-white">{{ service()?.location?.floor || 'G' }} / {{ service()?.location?.room || '-' }}</strong>
                </div>
                <div>
                  <span class="text-slate-400 block text-[10px] font-semibold">Pacing Duration</span>
                  <strong class="text-slate-800 dark:text-white">~{{ service()?.avgServiceDuration || 8 }} mins</strong>
                </div>
                <div>
                  <span class="text-slate-400 block text-[10px] font-semibold">Operating Hours</span>
                  <strong class="text-slate-800 dark:text-white">{{ service()?.operatingHours?.open || '09:00' }} - {{ service()?.operatingHours?.close || '17:00' }}</strong>
                </div>
              </div>
            </div>

            <!-- Transparent Wait Prediction Breakdown -->
            <div class="bg-gradient-to-r from-brand-900/90 via-indigo-900/90 to-slate-900 text-white rounded-3xl p-6 shadow-sm border border-brand-800">
              <div class="flex items-center justify-between mb-4">
                <span class="text-[11px] font-bold uppercase tracking-wider text-brand-300">Intelligent Wait Prediction Engine</span>
                <span class="px-2.5 py-0.5 rounded-full bg-white/10 text-white font-mono text-xs">Transparent Formula</span>
              </div>

              <div class="grid grid-cols-3 gap-4 text-center my-4">
                <div class="p-3 rounded-xl bg-white/10">
                  <span class="text-[10px] text-brand-200 uppercase block">People Ahead</span>
                  <span class="text-2xl font-black font-mono">{{ liveQueue()?.waitingCount || service()?.waitingCount || 0 }}</span>
                </div>
                <div class="p-3 rounded-xl bg-white/10">
                  <span class="text-[10px] text-brand-200 uppercase block">Avg Duration</span>
                  <span class="text-2xl font-black font-mono">{{ service()?.avgServiceDuration || 8 }}m</span>
                </div>
                <div class="p-3 rounded-xl bg-white/10">
                  <span class="text-[10px] text-brand-200 uppercase block">Active Desks</span>
                  <span class="text-2xl font-black font-mono">{{ activeCountersCount() }}</span>
                </div>
              </div>

              <div class="text-[11px] text-brand-200 bg-white/5 p-3 rounded-xl flex items-center justify-between">
                <span>Calculated Estimated Wait Time:</span>
                <span class="font-bold text-white text-sm font-mono">
                  ~{{ computedWaitMinutes() }} minutes
                </span>
              </div>
            </div>

            <!-- Active Counters / Desks -->
            <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <h3 class="font-bold text-base text-slate-900 dark:text-white mb-4 flex items-center justify-between">
                <span>{{ orgService.counterLabel() }} Status</span>
                <span class="text-xs text-slate-400 font-normal">{{ counters().length }} configured</span>
              </h3>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  *ngFor="let c of counters()"
                  class="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between">
                  <div>
                    <div class="flex items-center gap-2">
                      <span class="font-bold text-xs text-slate-900 dark:text-white">{{ c.counterName || ('Desk ' + c.counterNumber) }}</span>
                      <span
                        [ngClass]="{
                          'bg-emerald-100 text-emerald-700': c.status === 'BUSY' || c.status === 'OPEN',
                          'bg-slate-200 text-slate-600': c.status === 'CLOSED',
                          'bg-amber-100 text-amber-700': c.status === 'PAUSED'
                        }"
                        class="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase">
                        {{ c.status }}
                      </span>
                    </div>
                    <span class="text-[10px] text-slate-400">Total Served: {{ c.stats?.servedCount || 0 }}</span>
                  </div>

                  <div *ngIf="c.currentTicketId" class="text-right">
                    <span class="text-[9px] text-slate-400 block uppercase">Serving</span>
                    <span class="font-mono font-bold text-xs text-brand-600">{{ c.currentTicketId?.ticketNumber || c.currentTicketId }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Column: Join Queue Form -->
          <div class="space-y-6">
            <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm sticky top-24">
              <h3 class="font-bold text-lg text-slate-900 dark:text-white mb-1">
                Join Virtual Queue
              </h3>
              <p class="text-xs text-slate-500 mb-6">
                Receive your digital token instantly with real-time turn alerts.
              </p>

              <!-- Join Form -->
              <div *ngIf="isServiceClosed()" class="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold mb-4 flex items-center gap-2">
                <svg class="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>This service desk is currently closed. Token issuance is suspended.</span>
              </div>

              <form (ngSubmit)="handleJoinQueue()" class="space-y-4">
                <div>
                  <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Visitor / Customer Name *
                  </label>
                  <input
                    type="text"
                    [(ngModel)]="guestName"
                    name="guestName"
                    required
                    placeholder="Enter your name"
                    class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Phone Number (for SMS &amp; Alerts)
                  </label>
                  <input
                    type="tel"
                    [(ngModel)]="guestPhone"
                    name="guestPhone"
                    pattern="[0-9]{10}"
                    maxlength="10"
                    placeholder="Enter phone number (optional)"
                    class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Priority Tier
                  </label>
                  <select
                    [(ngModel)]="priority"
                    name="priority"
                    class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500">
                    <option value="REGULAR">Regular (Standard FIFO)</option>
                    <option value="SENIOR">Senior Citizen / Special Needs</option>
                    <option value="EMERGENCY">Emergency / Urgent Care</option>
                    <option value="VIP">Executive / VIP</option>
                  </select>
                </div>

                <div>
                  <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Notes / Reason for Visit
                  </label>
                  <input
                    type="text"
                    [(ngModel)]="notes"
                    name="notes"
                    placeholder="Specify purpose of visit (optional)"
                    class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div *ngIf="errorMessage()" class="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold">
                  {{ errorMessage() }}
                </div>

                <button
                  type="submit"
                  [disabled]="isJoining() || !guestName || isServiceClosed()"
                  class="w-full py-3.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                  <span *ngIf="isJoining()" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>{{ isServiceClosed() ? 'Service Desk Closed' : 'Get My Digital Token &rarr;' }}</span>
                </button>
              </form>

              <!-- QR Poster View Link -->
              <div class="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
                <button
                  (click)="showEntranceQr.set(true)"
                  class="text-xs text-brand-600 hover:underline font-semibold inline-flex items-center gap-1">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                  View Entrance QR Poster
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Entrance QR Poster Modal -->
      <app-qr-display-modal
        *ngIf="showEntranceQr() && service()"
        [title]="service()!.name + ' Entrance QR'"
        subtitle="Visitors can scan this poster to join this queue instantly"
        [qrData]="serviceQrUrl()"
        [highlightValue]="service()!.code"
        [metaInfo]="[
          { label: 'Facility', value: service()!.location.building || 'Main Campus' },
          { label: 'Avg Wait', value: '~' + computedWaitMinutes() + ' mins' }
        ]"
        (close)="showEntranceQr.set(false)">
      </app-qr-display-modal>
    </div>
  `
})
export class ServiceDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  queueService = inject(QueueService);
  authService = inject(AuthService);
  orgService = inject(OrganisationService);
  socketService = inject(SocketService);

  service = signal<Service | null>(null);
  counters = signal<Counter[]>([]);
  liveQueue = signal<any>(null);
  isJoining = signal(false);
  errorMessage = signal<string | null>(null);
  showEntranceQr = signal(false);

  guestName = '';
  guestPhone = '';
  priority = 'REGULAR';
  notes = '';
  private sub = new Subscription();

  activeCountersCount = signal(1);

  ngOnInit() {
    // If authenticated, prefill name and phone
    const user = this.authService.currentUser();
    if (user) {
      this.guestName = user.name;
      this.guestPhone = user.phone || '';
    }

    const serviceId = this.route.snapshot.paramMap.get('id');
    if (serviceId) {
      this.loadService(serviceId);
      this.socketService.joinService(serviceId);

      this.sub.add(
        this.socketService.queueUpdated$.subscribe((data) => {
          if (data && data.serviceId === serviceId) {
            this.liveQueue.set(data);
          }
        })
      );
    }
  }

  loadService(id: string) {
    this.queueService.getServiceById(id).subscribe({
      next: (svc: any) => {
        const parsed = svc?.service ? { ...svc.service, counters: svc.counters, queue: svc.queue, _id: svc.service._id, id: svc.service._id } : svc;
        this.service.set(parsed);
        if (parsed?.counters) {
          this.counters.set(parsed.counters);
          const active = parsed.counters.filter((c: any) => c.status === 'BUSY' || c.status === 'OPEN').length;
          this.activeCountersCount.set(Math.max(1, active));
        }
      }
    });

    this.queueService.getLiveQueue(id).subscribe({
      next: (lq) => this.liveQueue.set(lq)
    });
  }

  isServiceClosed(): boolean {
    const s = this.service()?.status?.toUpperCase();
    return s === 'CLOSED';
  }

  computedWaitMinutes() {
    const waiting = this.liveQueue()?.waitingCount ?? this.service()?.waitingCount ?? 0;
    const avg = this.service()?.avgServiceDuration || 8;
    const counters = Math.max(1, this.activeCountersCount());
    return Math.max(2, Math.round((waiting * avg) / counters));
  }

  serviceQrUrl(): string {
    const id = this.service()?._id || (this.service() as any)?.id || this.route.snapshot.paramMap.get('id');
    return typeof window !== 'undefined' ? `${window.location.origin}/services/${id}` : `https://waitwise.io/services/${id}`;
  }

  handleJoinQueue() {
    const routeId = this.route.snapshot.paramMap.get('id');
    const svc = this.service();
    const serviceId = svc?._id || (svc as any)?.id || routeId;
    if (!serviceId) {
      this.errorMessage.set('Service ID is required.');
      return;
    }

    if (this.isServiceClosed()) {
      this.errorMessage.set('This service desk is currently closed.');
      return;
    }

    this.isJoining.set(true);
    this.errorMessage.set(null);

    if (this.authService.isAuthenticated()) {
      const user = this.authService.currentUser();
      this.queueService.joinQueue(
        serviceId,
        this.priority,
        this.notes,
        this.guestName || user?.name,
        this.guestPhone || user?.phone
      ).subscribe({
        next: (res: any) => {
          this.isJoining.set(false);
          const ticketObj = res.ticket || res.data?.ticket || res;
          const tid = ticketObj._id || ticketObj.id || ticketObj;
          this.router.navigate(['/ticket', tid]);
        },
        error: (err) => {
          this.isJoining.set(false);
          this.errorMessage.set(err.error?.message || 'Could not join queue. Please try again.');
        }
      });
    } else {
      // Guest self-join
      this.queueService.kioskJoin({
        serviceId,
        customerName: this.guestName,
        guestInfo: { name: this.guestName, phone: this.guestPhone },
        priority: this.priority
      }).subscribe({
        next: (res: any) => {
          this.isJoining.set(false);
          const ticketObj = res.ticket || res.data?.ticket || res;
          const tid = ticketObj._id || ticketObj.id || ticketObj;
          this.router.navigate(['/ticket', tid]);
        },
        error: (err) => {
          this.isJoining.set(false);
          this.errorMessage.set(err.error?.message || 'Could not join queue.');
        }
      });
    }
  }

  ngOnDestroy() {
    const serviceId = this.service()?._id || (this.service() as any)?.id;
    if (serviceId) {
      this.socketService.leaveService(serviceId);
    }
    this.sub.unsubscribe();
  }
}
