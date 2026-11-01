import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { QueueService } from '../../core/services/queue.service';
import { SocketService } from '../../core/services/socket.service';
import { AudioService } from '../../shared/components/audio-chime/audio.service';
import { GeolocationService, ShouldIGoResult } from '../../core/services/geolocation.service';
import { OrganisationService } from '../../core/services/organisation.service';
import { Ticket } from '../../core/models/ticket.model';
import { QrDisplayModalComponent } from '../../shared/components/qr-display-modal/qr-display-modal.component';

@Component({
  selector: 'app-ticket-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, QrDisplayModalComponent],
  template: `
    <div class="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      <div class="max-w-4xl mx-auto space-y-6">
        <!-- Back Link -->
        <div class="flex items-center justify-between">
          <a routerLink="/services" class="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-brand-600 transition-colors">
            &larr; Return to Services
          </a>
          <span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            Real-Time Ticket Tracker
          </span>
        </div>

        <div *ngIf="ticket(); else loadingOrNotFound" class="space-y-6">
          <!-- Urgent "YOUR TURN" Alert Banner when CALLED -->
          <div
            *ngIf="ticket()?.status === 'CALLED'"
            class="p-6 rounded-3xl bg-emerald-500 text-white shadow-xl shadow-emerald-500/25 flex flex-col sm:flex-row items-center justify-between gap-4 animate-bounce">
            <div class="flex items-center gap-4 text-center sm:text-left">
              <div class="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-3xl">
                🔔
              </div>
              <div>
                <h2 class="text-2xl font-black">YOUR TURN HAS ARRIVED!</h2>
                <p class="text-xs text-emerald-100 mt-0.5">
                  Please proceed to
                  <strong>Counter {{ getCounterName() }}</strong>
                  immediately.
                </p>
              </div>
            </div>
            <button
              (click)="audioService.playChime()"
              class="px-5 py-2.5 rounded-xl bg-white text-emerald-700 font-bold text-xs shadow-md">
              Acknowledge Alert
            </button>
          </div>

          <!-- Main Ticket Header Card -->
          <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-10 shadow-sm relative overflow-hidden">
            <!-- Background Watermark -->
            <div class="absolute -right-8 -bottom-8 text-9xl font-black text-slate-100 dark:text-slate-800/40 select-none pointer-events-none font-mono">
              {{ ticket()?.ticketNumber }}
            </div>

            <!-- Top Row: Service info and status pill -->
            <div class="flex items-start justify-between relative z-10 mb-6">
              <div>
                <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {{ getServiceCode() }} &bull; {{ ticket()?.channel }} Pass
                </span>
                <h1 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                  {{ getServiceName() }}
                </h1>
                <p class="text-xs text-slate-500 mt-1">
                  Issued to: <strong>{{ ticket()?.guestInfo?.name || ticket()?.userId?.name || 'Visitor' }}</strong>
                </p>
              </div>

              <span
                [ngClass]="{
                  'bg-blue-100 text-blue-700 border-blue-200': ticket()?.status === 'WAITING',
                  'bg-emerald-100 text-emerald-700 border-emerald-200 animate-pulse': ticket()?.status === 'CALLED',
                  'bg-purple-100 text-purple-700 border-purple-200': ticket()?.status === 'SERVING',
                  'bg-slate-100 text-slate-700 border-slate-200': ticket()?.status === 'COMPLETED',
                  'bg-rose-100 text-rose-700 border-rose-200': ticket()?.status === 'CANCELLED' || ticket()?.status === 'SKIPPED'
                }"
                class="px-4 py-1.5 rounded-full text-xs font-bold border tracking-wide uppercase">
                {{ ticket()?.status }}
              </span>
            </div>

            <!-- Giant Token Number Box -->
            <div class="relative z-10 my-8 text-center p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span class="text-xs font-semibold text-slate-400 uppercase tracking-widest block mb-1">
                Your Assigned Token Number
              </span>
              <div class="text-5xl sm:text-7xl font-mono font-black text-slate-900 dark:text-white tracking-wider">
                {{ ticket()?.ticketNumber }}
              </div>
              <div class="flex items-center justify-center gap-2 mt-3 text-xs font-medium text-slate-500">
                <span>Priority: <strong class="text-brand-600 uppercase">{{ ticket()?.priority }}</strong></span>
                <span>&bull;</span>
                <span>Joined at: {{ ticket()?.joinedAt | date:'shortTime' }}</span>
              </div>
            </div>

            <!-- Status Stepper Flow -->
            <div class="relative z-10 py-4 border-y border-slate-100 dark:border-slate-800">
              <div class="grid grid-cols-4 gap-2 text-center text-xs">
                <div [class.text-brand-600]="isStepReached('WAITING')" class="font-bold text-slate-400">
                  <div class="w-7 h-7 rounded-full mx-auto mb-1 flex items-center justify-center border-2"
                    [ngClass]="isStepReached('WAITING') ? 'border-brand-600 bg-brand-50 dark:bg-brand-950 text-brand-600' : 'border-slate-300'">
                    1
                  </div>
                  Waiting
                </div>

                <div [class.text-brand-600]="isStepReached('CALLED')" class="font-bold text-slate-400">
                  <div class="w-7 h-7 rounded-full mx-auto mb-1 flex items-center justify-center border-2"
                    [ngClass]="isStepReached('CALLED') ? 'border-brand-600 bg-brand-50 dark:bg-brand-950 text-brand-600' : 'border-slate-300'">
                    2
                  </div>
                  Called
                </div>

                <div [class.text-brand-600]="isStepReached('SERVING')" class="font-bold text-slate-400">
                  <div class="w-7 h-7 rounded-full mx-auto mb-1 flex items-center justify-center border-2"
                    [ngClass]="isStepReached('SERVING') ? 'border-brand-600 bg-brand-50 dark:bg-brand-950 text-brand-600' : 'border-slate-300'">
                    3
                  </div>
                  Serving
                </div>

                <div [class.text-brand-600]="isStepReached('COMPLETED')" class="font-bold text-slate-400">
                  <div class="w-7 h-7 rounded-full mx-auto mb-1 flex items-center justify-center border-2"
                    [ngClass]="isStepReached('COMPLETED') ? 'border-brand-600 bg-brand-50 dark:bg-brand-950 text-brand-600' : 'border-slate-300'">
                    4
                  </div>
                  Completed
                </div>
              </div>
            </div>

            <!-- Queue Turn Position & Metrics Grid -->
            <div class="relative z-10 grid grid-cols-3 gap-3 mt-6 text-center">
              <div class="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span class="text-[10px] uppercase font-bold text-slate-400 block">Queue Position</span>
                <span class="font-mono text-2xl font-black text-slate-900 dark:text-white">
                  #{{ ticket()?.position || 1 }}
                </span>
              </div>

              <div class="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span class="text-[10px] uppercase font-bold text-slate-400 block">People Ahead</span>
                <span class="font-mono text-2xl font-black text-brand-600 dark:text-brand-400">
                  {{ ticket()?.peopleAhead ?? Math.max(0, (ticket()?.position || 1) - 1) }}
                </span>
              </div>

              <div class="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span class="text-[10px] uppercase font-bold text-slate-400 block">Est. Wait Time</span>
                <span class="font-mono text-2xl font-black text-slate-900 dark:text-white">
                  ~{{ ticket()?.estimatedWaitTime || 8 }}m
                </span>
              </div>
            </div>

            <!-- Actions Bar -->
            <div class="relative z-10 flex flex-wrap gap-3 mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
              <button
                (click)="showQrSlip.set(true)"
                class="flex-1 py-3 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-xs flex items-center justify-center gap-2 transition-all">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
                Digital Pass QR Slip
              </button>

              <button
                *ngIf="['WAITING', 'CALLED'].includes(ticket()?.status || '')"
                (click)="handleCancelTicket()"
                class="py-3 px-4 rounded-xl border border-rose-200 dark:border-rose-900 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-bold text-xs transition-colors">
                Cancel Token
              </button>
            </div>
          </div>

          <!-- Integrated "Should I Go Now?" Advisor Widget -->
          <div
            *ngIf="['WAITING'].includes(ticket()?.status || '')"
            class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-2">
                <span class="text-xl">🧭</span>
                <div>
                  <h3 class="font-black text-slate-900 dark:text-white text-base">"Should I Go Now?" Advisor</h3>
                  <p class="text-xs text-slate-500">Live walk calculation based on real distance to counter</p>
                </div>
              </div>
              <span
                [ngClass]="{
                  'bg-emerald-100 text-emerald-700': shouldIGo().colorScheme === 'emerald',
                  'bg-amber-100 text-amber-700': shouldIGo().colorScheme === 'amber',
                  'bg-blue-100 text-blue-700': shouldIGo().colorScheme === 'blue'
                }"
                class="px-3 py-1 rounded-full text-xs font-bold">
                {{ shouldIGo().badge }}
              </span>
            </div>

            <!-- Decision Box -->
            <div
              [ngClass]="{
                'border-emerald-200 bg-emerald-50/60 dark:bg-emerald-950/20': shouldIGo().colorScheme === 'emerald',
                'border-amber-200 bg-amber-50/60 dark:bg-amber-950/20': shouldIGo().colorScheme === 'amber',
                'border-blue-200 bg-blue-50/60 dark:bg-blue-950/20': shouldIGo().colorScheme === 'blue'
              }"
              class="p-5 rounded-2xl border mb-6">
              <h4 class="font-bold text-slate-900 dark:text-white text-base mb-1">{{ shouldIGo().headline }}</h4>
              <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{{ shouldIGo().subtext }}</p>

              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800 text-xs">
                <div>
                  <span class="text-slate-400 block text-[10px]">Walk Distance</span>
                  <strong>{{ shouldIGo().distanceMeters }} meters</strong>
                </div>
                <div>
                  <span class="text-slate-400 block text-[10px]">Estimated Walk</span>
                  <strong>~{{ shouldIGo().walkMinutes }} minutes</strong>
                </div>
                <div>
                  <span class="text-slate-400 block text-[10px]">Estimated Wait</span>
                  <strong>~{{ shouldIGo().estimatedWaitMinutes }} minutes</strong>
                </div>
                <div>
                  <span class="text-slate-400 block text-[10px]">Safety Cushion</span>
                  <strong>+{{ shouldIGo().safetyBufferMinutes }} minutes</strong>
                </div>
              </div>
            </div>

            <!-- Walking Time Customizer Slider -->
            <div class="space-y-2">
              <div class="flex justify-between text-xs text-slate-600 dark:text-slate-400 font-medium">
                <span>Adjust Walk Distance:</span>
                <span class="font-bold font-mono">{{ customWalkMins() }} min walk</span>
              </div>
              <input
                type="range"
                min="1"
                max="20"
                [value]="customWalkMins()"
                (input)="onWalkSliderChange($event)"
                class="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-600"
              />
            </div>
          </div>
        </div>

        <!-- Loading / Not Found Fallback -->
        <ng-template #loadingOrNotFound>
          <div class="py-20 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8">
            <div class="w-12 h-12 border-3 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h3 class="font-bold text-slate-800 dark:text-white text-base">Connecting to Live Queue...</h3>
            <p class="text-xs text-slate-400 mt-1">Retrieving ticket status and real-time counter assignment</p>
          </div>
        </ng-template>
      </div>

      <!-- QR Slip Modal -->
      <app-qr-display-modal
        *ngIf="showQrSlip() && ticket()"
        title="Visitor Queue Pass"
        subtitle="Universal Ticket Voucher"
        [qrData]="ticketQrData()"
        [highlightValue]="ticket()!.ticketNumber"
        [metaInfo]="[
          { label: 'Department', value: getServiceName() },
          { label: 'Priority', value: ticket()!.priority },
          { label: 'Position', value: '#' + ticket()!.position },
          { label: 'Joined', value: (ticket()!.joinedAt | date:'shortTime') || '' }
        ]"
        (close)="showQrSlip.set(false)">
      </app-qr-display-modal>
    </div>
  `
})
export class TicketDashboardComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  queueService = inject(QueueService);
  socketService = inject(SocketService);
  audioService = inject(AudioService);
  geoService = inject(GeolocationService);
  orgService = inject(OrganisationService);

  ticket = signal<Ticket | null>(null);
  showQrSlip = signal<boolean>(false);
  customWalkMins = signal<number>(5);
  private sub = new Subscription();

  Math = Math;

  getCounterName(): string {
    const c = this.ticket()?.counterId;
    if (!c) return '1';
    if (typeof c === 'object') return (c as any).counterName || ((c as any).counterNumber ? `Desk ${(c as any).counterNumber}` : '1');
    return String(c);
  }

  getServiceName(): string {
    const s = this.ticket()?.serviceId;
    if (!s) return 'Department Service';
    if (typeof s === 'object') return (s as any).name || 'Department Service';
    return String(s);
  }

  getServiceCode(): string {
    const s = this.ticket()?.serviceId;
    if (s && typeof s === 'object' && (s as any).code) return (s as any).code;
    return 'WAITWISE';
  }

  ngOnInit() {
    const idOrCode = this.route.snapshot.paramMap.get('id');
    if (idOrCode) {
      this.loadTicket(idOrCode);
    }
  }

  loadTicket(idOrCode: string) {
    this.queueService.getTicketStatus(idOrCode).subscribe({
      next: (t) => {
        this.ticket.set(t);
        const tid = t._id || (t as any).id;
        this.socketService.joinTicket(tid);
        this.listenToSocket(tid);
      },
      error: () => {
        // Fallback: check active ticket
        if (this.queueService.activeTicket()) {
          this.ticket.set(this.queueService.activeTicket());
        }
      }
    });
  }

  listenToSocket(ticketId: string) {
    this.sub.add(
      this.socketService.tokenCalled$.subscribe((data) => {
        if (data && (data._id === ticketId || data.ticketId === ticketId)) {
          this.ticket.update(prev => prev ? { ...prev, status: 'CALLED', counterId: data.counter } : null);
          this.audioService.playTurnAlert();
        }
      })
    );

    this.sub.add(
      this.socketService.serviceStarted$.subscribe((data) => {
        if (data && (data._id === ticketId || data.ticketId === ticketId)) {
          this.ticket.update(prev => prev ? { ...prev, status: 'SERVING' } : null);
        }
      })
    );

    this.sub.add(
      this.socketService.tokenCompleted$.subscribe((data) => {
        if (data && (data._id === ticketId || data.ticketId === ticketId)) {
          this.ticket.update(prev => prev ? { ...prev, status: 'COMPLETED' } : null);
          this.queueService.clearActiveTicket();
        }
      })
    );

    this.sub.add(
      this.socketService.tokenCancelled$.subscribe((data) => {
        if (data && (data._id === ticketId || data.ticketId === ticketId)) {
          this.ticket.update(prev => prev ? { ...prev, status: 'CANCELLED' } : null);
          this.queueService.clearActiveTicket();
        }
      })
    );

    this.sub.add(
      this.socketService.tokenSkipped$.subscribe((data) => {
        if (data && (data._id === ticketId || data.ticketId === ticketId)) {
          this.ticket.update(prev => prev ? { ...prev, status: 'SKIPPED' } : null);
        }
      })
    );
  }

  isStepReached(step: string): boolean {
    const s = this.ticket()?.status;
    const order = ['WAITING', 'CALLED', 'SERVING', 'COMPLETED'];
    return order.indexOf(s || '') >= order.indexOf(step);
  }

  shouldIGo(): ShouldIGoResult {
    const t = this.ticket();
    const peopleAhead = t?.peopleAhead ?? Math.max(0, (t?.position || 1) - 1);
    const avgDuration = (t?.serviceId as any)?.avgServiceDuration || 8;
    const coords = (t?.serviceId as any)?.location?.coordinates;
    return this.geoService.calculateShouldIGo(coords, peopleAhead, avgDuration, this.customWalkMins(), 4);
  }

  onWalkSliderChange(event: Event) {
    const val = Number((event.target as HTMLInputElement).value);
    this.customWalkMins.set(val);
  }

  ticketQrData(): string {
    const t = this.ticket();
    const id = t?._id || (t as any)?.id;
    return typeof window !== 'undefined' ? `${window.location.origin}/ticket/${id}` : `https://waitwise.io/ticket/${id}`;
  }

  handleCancelTicket() {
    const t = this.ticket();
    if (!t) return;
    const id = t._id || (t as any).id;
    if (confirm('Are you sure you want to cancel your queue ticket?')) {
      this.queueService.cancelTicket(id, 'User cancelled from tracker').subscribe({
        next: () => {
          this.ticket.update(prev => prev ? { ...prev, status: 'CANCELLED' } : null);
          this.queueService.clearActiveTicket();
        }
      });
    }
  }

  ngOnDestroy() {
    const t = this.ticket();
    const tid = t?._id || (t as any)?.id;
    if (tid) {
      this.socketService.leaveTicket(tid);
    }
    this.sub.unsubscribe();
  }
}
