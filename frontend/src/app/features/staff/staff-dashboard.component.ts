import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription, map } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { OrganisationService } from '../../core/services/organisation.service';
import { SocketService } from '../../core/services/socket.service';
import { AudioService } from '../../shared/components/audio-chime/audio.service';
import { Counter } from '../../core/models/counter.model';
import { Ticket } from '../../core/models/ticket.model';
import { Service } from '../../core/models/service.model';

@Component({
  selector: 'app-staff-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      <div class="max-w-7xl mx-auto space-y-6">
        <!-- Top Station Control Bar -->
        <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-2xl bg-brand-600 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-brand-500/20">
              👨‍💼
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {{ orgService.staffLabel() }} Station
                </span>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {{ activeCounter()?.counterName || 'Select Counter' }}
                </span>
              </div>
              <h1 class="text-2xl font-black text-slate-900 dark:text-white">
                Operator Console
              </h1>
            </div>
          </div>

          <!-- Counter Switcher & Status Controls -->
          <div class="flex flex-wrap items-center gap-3">
            <!-- Counter Selector Dropdown -->
            <select
              [(ngModel)]="selectedCounterId"
              (ngModelChange)="onCounterSelected()"
              class="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-brand-500">
              <option value="" disabled>Choose {{ orgService.counterLabel() }}</option>
              <option *ngFor="let c of counters()" [value]="c._id || c.id">
                {{ c.counterName || ('Desk ' + c.counterNumber) }} ({{ c.status }})
              </option>
            </select>

            <!-- Counter Status Toggle -->
            <div class="flex rounded-xl p-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold">
              <button
                (click)="setCounterStatus('OPEN')"
                [class.bg-emerald-500]="activeCounter()?.status === 'OPEN'"
                [class.text-white]="activeCounter()?.status === 'OPEN'"
                class="px-3 py-1 rounded-lg transition-colors">
                Open
              </button>
              <button
                (click)="setCounterStatus('PAUSED')"
                [class.bg-amber-500]="activeCounter()?.status === 'PAUSED'"
                [class.text-white]="activeCounter()?.status === 'PAUSED'"
                class="px-3 py-1 rounded-lg transition-colors">
                Pause
              </button>
              <button
                (click)="setCounterStatus('CLOSED')"
                [class.bg-slate-600]="activeCounter()?.status === 'CLOSED'"
                [class.text-white]="activeCounter()?.status === 'CLOSED'"
                class="px-3 py-1 rounded-lg transition-colors">
                Close
              </button>
            </div>

            <!-- Walk-in Desk Button -->
            <button
              (click)="showWalkInModal.set(true)"
              class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5">
              <span>+ Assisted Walk-In</span>
            </button>
          </div>
        </div>

        <!-- Main Operator Workbench -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Active Token Station (Left Column 2 cols) -->
          <div class="lg:col-span-2 space-y-6">
            <!-- Currently Engaged Token Card -->
            <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm relative overflow-hidden">
              <div class="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Current Token at Counter</span>
                <span
                  *ngIf="currentServingTicket()"
                  [ngClass]="{
                    'bg-emerald-100 text-emerald-700': currentServingTicket()?.status === 'CALLED',
                    'bg-purple-100 text-purple-700': currentServingTicket()?.status === 'SERVING'
                  }"
                  class="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wide">
                  {{ currentServingTicket()?.status }}
                </span>
              </div>

              <!-- When Ticket is Active -->
              <div *ngIf="currentServingTicket(); else noActiveTicket" class="py-6 text-center">
                <span class="text-xs text-slate-400 font-semibold uppercase tracking-widest block mb-2">Token Number</span>
                <div class="text-6xl sm:text-7xl font-mono font-black text-slate-900 dark:text-white mb-3">
                  {{ currentServingTicket()?.ticketNumber }}
                </div>
                
                <div class="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
                  <span class="font-bold text-slate-700 dark:text-slate-300">
                    👤 {{ currentServingTicket()?.customerName || currentServingTicket()?.guestInfo?.name || currentServingTicket()?.userId?.name || 'Citizen' }}
                  </span>
                  <span>&bull;</span>
                  <span class="font-mono text-brand-600 font-bold uppercase">
                    {{ currentServingTicket()?.priority }}
                  </span>
                  <span>&bull;</span>
                  <span class="text-slate-400">Via {{ currentServingTicket()?.channel }}</span>
                </div>

                <!-- Primary Action Buttons -->
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-8">
                  <button
                    *ngIf="currentServingTicket()?.status === 'CALLED'"
                    (click)="startServingTicket()"
                    class="py-4 px-4 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-md shadow-brand-500/20 transition-all flex items-center justify-center gap-2">
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    </svg>
                    Start Serving
                  </button>

                  <button
                    *ngIf="currentServingTicket()?.status === 'SERVING'"
                    (click)="completeServiceTicket()"
                    class="py-4 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 sm:col-span-2">
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Mark Service Completed
                  </button>

                  <button
                    (click)="showSkipModal.set(true)"
                    class="py-4 px-4 rounded-2xl border border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 font-bold text-sm transition-colors">
                    Skip Token
                  </button>

                  <button
                    (click)="markNoShow()"
                    class="py-4 px-4 rounded-2xl border border-rose-200 dark:border-rose-900 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-bold text-sm transition-colors">
                    Mark No-Show
                  </button>
                </div>
              </div>

              <!-- When Counter is Idle -->
              <ng-template #noActiveTicket>
                <div class="py-12 text-center">
                  <div class="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-4 text-2xl">
                    ⏳
                  </div>
                  <h3 class="text-lg font-bold text-slate-800 dark:text-white">Counter is Ready</h3>
                  <p class="text-xs text-slate-400 mt-1 max-w-sm mx-auto mb-6">
                    Click Call Next Token to summon the next queued customer in line according to FIFO and priority rules.
                  </p>
                  <button
                    (click)="callNextToken()"
                    [disabled]="waitingQueue().length === 0"
                    class="py-4 px-8 rounded-2xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-black text-sm shadow-lg shadow-brand-500/25 transition-all hover:scale-105 active:scale-95 inline-flex items-center gap-2">
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                    </svg>
                    Call Next Token ({{ waitingQueue().length }} Waiting)
                  </button>
                </div>
              </ng-template>
            </div>

            <!-- Queue Lists Tabbed Container -->
            <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
                <div class="flex items-center gap-2">
                  <button
                    (click)="activeListTab.set('WAITING')"
                    [class.text-brand-600]="activeListTab() === 'WAITING'"
                    [class.border-brand-600]="activeListTab() === 'WAITING'"
                    class="text-xs font-bold pb-1 border-b-2 transition-colors">
                    Waiting ({{ waitingQueue().length }})
                  </button>
                  <button
                    (click)="activeListTab.set('COMPLETED')"
                    [class.text-brand-600]="activeListTab() === 'COMPLETED'"
                    [class.border-brand-600]="activeListTab() === 'COMPLETED'"
                    class="text-xs font-bold pb-1 border-b-2 text-slate-400 hover:text-slate-600 transition-colors">
                    Completed Today ({{ completedQueue().length }})
                  </button>
                </div>
              </div>

              <!-- List Content -->
              <div *ngIf="activeListTab() === 'WAITING'" class="divide-y divide-slate-100 dark:divide-slate-800">
                <div
                  *ngFor="let item of waitingQueue()"
                  class="py-3 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-xl px-2 transition-colors">
                  <div class="flex items-center gap-3">
                    <span class="font-mono font-black text-sm text-slate-900 dark:text-white">{{ item.ticketNumber }}</span>
                    <span
                      *ngIf="item.priority !== 'REGULAR'"
                      class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700">
                      {{ item.priority }}
                    </span>
                    <span class="text-slate-500">{{ item.guestInfo?.name || item.userId?.name || 'Visitor' }}</span>
                  </div>
                  <div class="flex items-center gap-3">
                    <span class="text-slate-400 font-mono">Pos #{{ item.position }}</span>
                    <span class="text-slate-400">{{ item.joinedAt | date:'shortTime' }}</span>
                  </div>
                </div>

                <div *ngIf="waitingQueue().length === 0" class="py-8 text-center text-xs text-slate-400">
                  No customers waiting in this queue.
                </div>
              </div>

              <div *ngIf="activeListTab() === 'COMPLETED'" class="divide-y divide-slate-100 dark:divide-slate-800">
                <div
                  *ngFor="let item of completedQueue()"
                  class="py-3 flex items-center justify-between text-xs text-slate-500">
                  <span class="font-mono font-bold text-slate-700 dark:text-slate-300">{{ item.ticketNumber }}</span>
                  <span>{{ item.guestInfo?.name || 'Customer' }}</span>
                  <span class="text-emerald-600 font-bold">Served</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Counter Stats & Pacing (Right Column) -->
          <div class="space-y-6">
            <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
              <h3 class="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                Counter Shift Metrics
              </h3>

              <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-center">
                <span class="text-[10px] text-slate-400 uppercase font-bold block">Total Visitors Served</span>
                <span class="text-3xl font-mono font-black text-slate-900 dark:text-white">
                  {{ activeCounter()?.stats?.servedCount || completedQueue().length }}
                </span>
              </div>

              <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-center">
                <span class="text-[10px] text-slate-400 uppercase font-bold block">Counter Velocity</span>
                <span class="text-3xl font-mono font-black text-brand-600">
                  ~{{ activeCounter()?.stats?.averageDuration || 7 }}m
                </span>
                <span class="text-[10px] text-slate-400 block mt-0.5">Average time per visitor</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Skip Token Modal with MANDATORY Reason -->
      <div *ngIf="showSkipModal()" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
        <div class="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
          <h3 class="font-bold text-base text-slate-900 dark:text-white mb-2">Skip Ticket</h3>
          <p class="text-xs text-slate-500 mb-4">Please record the official reason for skipping this ticket.</p>

          <div class="space-y-3 mb-6">
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300">Reason *</label>
            <select [(ngModel)]="skipReason" class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-800">
              <option value="Customer stepped away / not at desk">Customer stepped away / not at desk</option>
              <option value="Incomplete required documentation">Incomplete required documentation</option>
              <option value="Requested reschedule / return later">Requested reschedule / return later</option>
              <option value="Other administrative exception">Other administrative exception</option>
            </select>
          </div>

          <div class="flex gap-2">
            <button (click)="showSkipModal.set(false)" class="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-xs">
              Cancel
            </button>
            <button (click)="confirmSkipTicket()" class="flex-1 py-2.5 rounded-xl bg-amber-600 text-white font-bold text-xs shadow-sm">
              Confirm Skip
            </button>
          </div>
        </div>
      </div>

      <!-- Assisted Walk-In Ticket Modal -->
      <div *ngIf="showWalkInModal()" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
        <div class="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
          <h3 class="font-bold text-base text-slate-900 dark:text-white mb-1">Issue Walk-In Ticket</h3>
          <p class="text-xs text-slate-500 mb-4">For visitors without smartphones or requiring assistance.</p>

          <form (ngSubmit)="submitAssistedWalkIn()" class="space-y-3">
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Customer Name *</label>
              <input type="text" [(ngModel)]="walkInName" name="walkInName" required class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-800" />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Phone Number (Optional)</label>
              <input type="tel" [(ngModel)]="walkInPhone" name="walkInPhone" class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-800" />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Priority</label>
              <select [(ngModel)]="walkInPriority" name="walkInPriority" class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-800">
                <option value="REGULAR">Regular Walk-In</option>
                <option value="SENIOR">Senior Citizen / Special Needs</option>
                <option value="EMERGENCY">Emergency / Immediate</option>
                <option value="VIP">Executive VIP</option>
              </select>
            </div>

            <div class="flex gap-2 pt-3">
              <button type="button" (click)="showWalkInModal.set(false)" class="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-xs">
                Cancel
              </button>
              <button type="submit" [disabled]="!walkInName" class="flex-1 py-2.5 rounded-xl bg-brand-600 text-white font-bold text-xs shadow-sm">
                Issue &amp; Enqueue
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `
})
export class StaffDashboardComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);
  authService = inject(AuthService);
  orgService = inject(OrganisationService);
  socketService = inject(SocketService);
  audioService = inject(AudioService);

  counters = signal<Counter[]>([]);
  activeCounter = signal<Counter | null>(null);
  selectedCounterId = '';

  currentServingTicket = signal<Ticket | null>(null);
  waitingQueue = signal<Ticket[]>([]);
  completedQueue = signal<Ticket[]>([]);

  activeListTab = signal<'WAITING' | 'COMPLETED'>('WAITING');
  showSkipModal = signal(false);
  skipReason = 'Customer stepped away / not at desk';

  showWalkInModal = signal(false);
  walkInName = '';
  walkInPhone = '';
  walkInPriority = 'REGULAR';

  private sub = new Subscription();

  ngOnInit() {
    this.loadStaffCounters();

    // Live Socket.IO Events
    this.sub.add(
      this.socketService.tokenCreated$.subscribe((event) => {
        const counter = this.activeCounter();
        const rawSvc = counter?.serviceId;
        const currentSvcId = typeof rawSvc === 'object' ? (rawSvc._id || rawSvc.id) : rawSvc;
        if (!event || !currentSvcId || event.serviceId === currentSvcId) {
          this.audioService.playChime();
          this.loadQueueData();
        }
      })
    );

    this.sub.add(
      this.socketService.queueUpdated$.subscribe((event) => {
        const counter = this.activeCounter();
        const rawSvc = counter?.serviceId;
        const currentSvcId = typeof rawSvc === 'object' ? (rawSvc._id || rawSvc.id) : rawSvc;
        if (!event || !currentSvcId || event.serviceId === currentSvcId) {
          this.loadQueueData();
        }
      })
    );

    this.sub.add(this.socketService.tokenCalled$.subscribe(() => this.loadQueueData()));
    this.sub.add(this.socketService.serviceStarted$.subscribe(() => this.loadQueueData()));
    this.sub.add(this.socketService.tokenCompleted$.subscribe(() => this.loadQueueData()));
    this.sub.add(this.socketService.tokenSkipped$.subscribe(() => this.loadQueueData()));
    this.sub.add(this.socketService.tokenCancelled$.subscribe(() => this.loadQueueData()));
  }

  loadStaffCounters() {
    this.api.get<any>('/counters').pipe(
      map(res => (res && Array.isArray(res.data)) ? res.data : (Array.isArray(res) ? res : []))
    ).subscribe({
      next: (list: Counter[]) => {
        this.counters.set(list || []);
        if (list && list.length > 0) {
          const user = this.authService.currentUser();
          const userId = user?._id || (user as any)?.id;
          const assignedCounterId = user?.assignedCounter ? (typeof user.assignedCounter === 'object' ? (user.assignedCounter._id || user.assignedCounter.id) : user.assignedCounter) : null;

          // Priority 1: User's explicitly assigned counter
          let matched = assignedCounterId ? list.find(c => (c._id || (c as any).id) === assignedCounterId) : null;

          // Priority 2: Counter where assignedStaff matches current user
          if (!matched && userId) {
            matched = list.find(c => {
              const staff = c.assignedStaff;
              const sid = typeof staff === 'object' ? (staff?._id || staff?.id) : staff;
              return sid === userId;
            });
          }

          // Priority 3: Government Citizen Services Window 1 (flagship default)
          if (!matched) {
            matched = list.find(c => {
              const cName = (c.name || c.counterName || '').toLowerCase();
              return cName.includes('window 1') || cName.includes('biometrics');
            }) || list[0];
          }

          const target = matched || list[0];
          this.selectedCounterId = target._id || (target as any).id;
          this.activeCounter.set(target);
          this.loadQueueData();
        }
      }
    });
  }

  onCounterSelected() {
    const found = this.counters().find(c => (c._id || c.id) === this.selectedCounterId);
    if (found) {
      this.activeCounter.set(found);
      this.loadQueueData();
    }
  }

  loadQueueData() {
    const counter = this.activeCounter();
    if (!counter) return;

    const rawSvc = counter.serviceId;
    const serviceId = typeof rawSvc === 'object' ? (rawSvc._id || rawSvc.id) : rawSvc;
    if (serviceId) {
      this.socketService.joinService(serviceId);
      this.api.get<any>(`/queues/services/${serviceId}/live`).pipe(
        map(res => (res && res.data) ? res.data : res)
      ).subscribe({
        next: (data) => {
          this.waitingQueue.set(data.waitingTickets || []);
          this.completedQueue.set(data.completedTickets || []);
          const currentTid = counter.currentTicketId || (this.currentServingTicket() ? (this.currentServingTicket()?._id || (this.currentServingTicket() as any)?.id) : null);
          if (currentTid) {
            const tid = typeof currentTid === 'object' ? (currentTid._id || currentTid.id) : currentTid;
            this.api.get<any>(`/queues/tickets/${tid}`).pipe(
              map(res => (res && res.data) ? res.data : res)
            ).subscribe({
              next: (t) => {
                const refreshed = t?.ticket || t;
                if (refreshed && ['CALLED', 'SERVING'].includes(refreshed.status)) {
                  this.currentServingTicket.set(refreshed);
                } else {
                  this.currentServingTicket.set(null);
                }
              }
            });
          }
        }
      });
    }
  }

  setCounterStatus(status: 'OPEN' | 'BUSY' | 'PAUSED' | 'CLOSED') {
    const counter = this.activeCounter();
    if (!counter) return;
    const cid = counter._id || counter.id;
    this.api.put(`/counters/${cid}/status`, { status }).subscribe({
      next: (updated: any) => {
        this.activeCounter.update(c => c ? { ...c, status } : null);
      }
    });
  }

  callNextToken() {
    const counter = this.activeCounter();
    if (!counter) return;
    const cid = counter._id || counter.id;

    this.api.post<any>('/staff/call-next', { counterId: cid }).pipe(
      map(res => (res && res.data) ? res.data : res)
    ).subscribe({
      next: (res) => {
        const ticket = res?.ticket || res;
        const updatedCounter = res?.counter;
        if (updatedCounter) {
          this.activeCounter.set(updatedCounter);
        } else if (ticket) {
          this.activeCounter.update(c => c ? { ...c, currentTicketId: ticket._id } : null);
        }
        if (ticket && ticket.ticketNumber) {
          this.currentServingTicket.set(ticket);
          this.audioService.playChime();
          this.loadQueueData();
        }
      }
    });
  }

  startServingTicket() {
    const ticket = this.currentServingTicket();
    if (!ticket) return;
    const tid = ticket._id || (ticket as any).id;

    this.api.post<any>('/staff/start-service', { ticketId: tid }).pipe(
      map(res => (res && res.data) ? res.data : res)
    ).subscribe({
      next: (res) => {
        const updated = res?.ticket || res;
        this.currentServingTicket.update(t => t ? { ...t, status: 'SERVING' } : updated);
      }
    });
  }

  completeServiceTicket() {
    const ticket = this.currentServingTicket();
    if (!ticket) return;
    const tid = ticket._id || (ticket as any).id;
    const counter = this.activeCounter();
    const cid = counter ? (counter._id || counter.id) : undefined;

    this.api.post<any>('/staff/complete-service', { ticketId: tid, counterId: cid }).subscribe({
      next: () => {
        this.currentServingTicket.set(null);
        this.loadQueueData();
      }
    });
  }

  confirmSkipTicket() {
    const ticket = this.currentServingTicket();
    if (!ticket) return;
    const tid = ticket._id || (ticket as any).id;

    this.api.post<any>('/staff/skip', { ticketId: tid, reason: this.skipReason }).subscribe({
      next: () => {
        this.showSkipModal.set(false);
        this.currentServingTicket.set(null);
        this.loadQueueData();
      }
    });
  }

  markNoShow() {
    const ticket = this.currentServingTicket();
    if (!ticket) return;
    const tid = ticket._id || (ticket as any).id;

    if (confirm('Mark this customer as a no-show?')) {
      this.api.post<any>('/staff/no-show', { ticketId: tid }).subscribe({
        next: () => {
          this.currentServingTicket.set(null);
          this.loadQueueData();
        }
      });
    }
  }

  submitAssistedWalkIn() {
    const counter = this.activeCounter();
    if (!counter) return;
    const rawSvc = counter.serviceId;
    const serviceId = typeof rawSvc === 'object' ? (rawSvc._id || rawSvc.id) : rawSvc;

    this.api.post<any>('/queues/staff-issue', {
      serviceId,
      customerName: this.walkInName.trim() || 'Assisted Citizen',
      customerIdentifier: this.walkInPhone.trim(),
      priority: this.walkInPriority
    }).subscribe({
      next: () => {
        this.showWalkInModal.set(false);
        this.walkInName = '';
        this.walkInPhone = '';
        this.loadQueueData();
      }
    });
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }
}
