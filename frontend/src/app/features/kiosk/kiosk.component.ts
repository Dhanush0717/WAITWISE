import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { QueueService } from '../../core/services/queue.service';
import { OrganisationService } from '../../core/services/organisation.service';
import { SocketService } from '../../core/services/socket.service';
import { AudioService } from '../../shared/components/audio-chime/audio.service';
import { Service } from '../../core/models/service.model';
import { Ticket } from '../../core/models/ticket.model';
import { QrDisplayModalComponent } from '../../shared/components/qr-display-modal/qr-display-modal.component';

@Component({
  selector: 'app-kiosk',
  standalone: true,
  imports: [CommonModule, FormsModule, QrDisplayModalComponent],
  template: `
    <div class="min-h-screen bg-slate-900 text-white flex flex-col justify-between p-6 sm:p-10 select-none">
      <!-- Top Kiosk Bar -->
      <div class="flex items-center justify-between border-b border-slate-800 pb-6">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-2xl bg-brand-600 flex items-center justify-center font-black text-2xl shadow-lg shadow-brand-500/30">
            W
          </div>
          <div>
            <h1 class="text-2xl font-black tracking-tight">
              {{ orgService.currentOrganisation()?.name || 'WAITWISE ENTRANCE KIOSK' }}
            </h1>
            <p class="text-xs text-slate-400">
              Self-Service Queue Ticket Dispenser &bull; Touch any service below to take a token
            </p>
          </div>
        </div>

        <div class="text-right">
          <div class="text-xs font-mono text-emerald-400 font-bold flex items-center gap-1.5 justify-end">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            KIOSK ONLINE
          </div>
          <div class="text-sm font-mono text-slate-300 font-bold mt-0.5">
            {{ currentTime }}
          </div>
        </div>
      </div>

      <!-- Main Department Buttons Grid -->
      <div class="my-auto py-8">
        <div class="text-center mb-8">
          <h2 class="text-3xl sm:text-4xl font-black">Please Touch Your Desired Service</h2>
          <p class="text-sm text-slate-400 mt-2">Your numbered token will be printed or shown immediately</p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <button
            *ngFor="let svc of services()"
            (click)="!isClosed(svc) && selectService(svc)"
            [disabled]="isClosed(svc)"
            [ngClass]="{
              'opacity-50 cursor-not-allowed': isClosed(svc),
              'hover:bg-brand-600 hover:border-brand-400 active:scale-95': !isClosed(svc)
            }"
            class="p-8 rounded-3xl bg-slate-800/80 border-2 border-slate-700/80 text-left transition-all shadow-xl group">
            <div class="flex items-start justify-between">
              <div class="text-4xl mb-4 group-hover:scale-110 transition-transform">
                {{ svc.icon || '📌' }}
              </div>
              <span *ngIf="isClosed(svc)" class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800">
                CLOSED
              </span>
            </div>
            <div class="text-xs font-bold font-mono text-brand-400 uppercase mb-1">
              {{ svc.code }} &bull; {{ svc.category }}
            </div>
            <h3 class="text-2xl font-black text-white mb-2">
              {{ svc.name }}
            </h3>
            <p class="text-xs text-slate-400 mb-4">
              {{ svc.description || 'Quick counter assistance.' }}
            </p>

            <div class="flex items-center justify-between pt-4 border-t border-slate-700/60 text-xs font-bold"
                 [ngClass]="isClosed(svc) ? 'text-slate-500' : 'text-brand-400 group-hover:text-white'">
              <span>{{ isClosed(svc) ? 'Counter Closed' : 'Touch to Dispense Ticket' }}</span>
              <span *ngIf="!isClosed(svc)">&rarr;</span>
            </div>
          </button>
        </div>
      </div>

      <!-- Bottom Info Bar -->
      <div class="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400">
        <div>
          <span>Need assistance? Approach any staffed desk for immediate support.</span>
        </div>
        <div class="flex items-center gap-4 mt-2 sm:mt-0 font-mono text-[11px]">
          <span>Accessible Touch Interface</span>
          <span>&bull;</span>
          <span>Zero Paper Waste</span>
        </div>
      </div>

      <!-- Quick Visitor Info Modal -->
      <div *ngIf="selectedServiceForTicket()" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
        <div class="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-white">
          <div class="text-center mb-6">
            <div class="w-12 h-12 rounded-2xl bg-brand-600 text-2xl flex items-center justify-center mx-auto mb-2">
              {{ selectedServiceForTicket()?.icon || '🎫' }}
            </div>
            <h3 class="text-xl font-black">{{ selectedServiceForTicket()?.name }}</h3>
            <p class="text-xs text-slate-400 mt-1">Dispensing Queue Token</p>
          </div>

          <form (ngSubmit)="confirmKioskTicket()" class="space-y-4">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Your Full Name</label>
              <input
                type="text"
                [(ngModel)]="visitorName"
                name="visitorName"
                placeholder="Enter your name"
                class="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-800 text-white text-sm focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Mobile Number (For SMS Alert)</label>
              <input
                type="tel"
                [(ngModel)]="visitorPhone"
                name="visitorPhone"
                placeholder="Mobile number (optional)"
                class="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-800 text-white text-sm focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <!-- Priority choice -->
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Assistance Requirement</label>
              <div class="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  (click)="isSenior = false"
                  [class.bg-brand-600]="!isSenior"
                  [class.border-brand-500]="!isSenior"
                  [class.bg-slate-800]="isSenior"
                  class="py-2.5 px-3 rounded-xl border border-slate-700 font-bold transition-all">
                  Standard Visitor
                </button>
                <button
                  type="button"
                  (click)="isSenior = true"
                  [class.bg-amber-600]="isSenior"
                  [class.border-amber-500]="isSenior"
                  [class.bg-slate-800]="!isSenior"
                  class="py-2.5 px-3 rounded-xl border border-slate-700 font-bold transition-all">
                  Senior / Special
                </button>
              </div>
            </div>

            <div class="flex gap-3 pt-4">
              <button
                type="button"
                (click)="selectedServiceForTicket.set(null)"
                class="flex-1 py-3.5 rounded-xl border border-slate-700 hover:bg-slate-800 font-bold text-xs text-slate-300 transition-colors">
                Cancel
              </button>
              <button
                type="submit"
                [disabled]="isDispensing()"
                class="flex-1 py-3.5 rounded-xl bg-brand-600 hover:bg-brand-700 font-bold text-xs text-white shadow-lg shadow-brand-500/25 transition-all flex items-center justify-center gap-2">
                <span *ngIf="isDispensing()" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Print My Token</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Generated Token Receipt Modal -->
      <app-qr-display-modal
        *ngIf="dispensedTicket()"
        title="Your Queue Pass is Ready"
        subtitle="Please keep this token or scan QR on your phone"
        [qrData]="ticketQrData()"
        [highlightValue]="dispensedTicket()!.ticketNumber"
        [metaInfo]="[
          { label: 'Department', value: selectedServiceForTicket()?.name || 'Desk' },
          { label: 'Queue Position', value: '#' + dispensedTicket()!.position },
          { label: 'People Ahead', value: '' + Math.max(0, dispensedTicket()!.position - 1) },
          { label: 'Time Issued', value: (dispensedTicket()!.joinedAt | date:'shortTime') || '' }
        ]"
        (close)="dismissDispensedTicket()">
      </app-qr-display-modal>
    </div>
  `
})
export class KioskComponent implements OnInit, OnDestroy {
  queueService = inject(QueueService);
  orgService = inject(OrganisationService);
  socketService = inject(SocketService);
  audioService = inject(AudioService);

  services = signal<Service[]>([]);
  selectedServiceForTicket = signal<Service | null>(null);
  dispensedTicket = signal<Ticket | null>(null);
  isDispensing = signal<boolean>(false);

  visitorName = '';
  visitorPhone = '';
  isSenior = false;
  currentTime = '';
  Math = Math;
  private sub = new Subscription();

  ngOnInit() {
    this.updateClock();
    const timer = setInterval(() => this.updateClock(), 1000);
    this.sub.add({ unsubscribe: () => clearInterval(timer) });

    this.loadServices();

    this.sub.add(
      this.socketService.queueUpdated$.subscribe(() => this.loadServices())
    );
    this.sub.add(
      this.socketService.tokenCreated$.subscribe(() => this.loadServices())
    );
  }

  updateClock() {
    const now = new Date();
    this.currentTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  loadServices() {
    const org = this.orgService.currentOrganisation() ||
      this.orgService.organisations().find(o => o.slug === 'citizen-services' || o.type === 'government');
    const orgId = org ? (org._id || (org as any).id) : null;

    this.queueService.getServices(orgId ? { organisationId: orgId } : undefined).subscribe({
      next: (svcs) => {
        const list = Array.isArray(svcs) ? svcs : (svcs as any)?.data || [];
        if (list.length > 0) {
          this.services.set(list);
          list.forEach((s: any) => {
            const sid = s._id || (s as any).id;
            if (sid) this.socketService.joinService(sid);
          });
        } else {
          this.queueService.getServices().subscribe({
            next: (allSvcs) => {
              const allList = Array.isArray(allSvcs) ? allSvcs : (allSvcs as any)?.data || [];
              this.services.set(allList);
              allList.forEach((s: any) => {
                const sid = s._id || (s as any).id;
                if (sid) this.socketService.joinService(sid);
              });
            }
          });
        }
      }
    });
  }

  isClosed(svc: any): boolean {
    const s = (svc?.status || '').toUpperCase();
    return s === 'CLOSED';
  }

  selectService(svc: Service) {
    this.selectedServiceForTicket.set(svc);
    this.visitorName = '';
    this.visitorPhone = '';
    this.isSenior = false;
  }

  confirmKioskTicket() {
    const svc = this.selectedServiceForTicket();
    if (!svc) return;

    this.isDispensing.set(true);
    const serviceId = svc._id || (svc as any).id;
    const finalName = this.visitorName.trim() || 'Walk-in Citizen';

    this.queueService.kioskJoin({
      serviceId,
      customerName: finalName,
      guestInfo: {
        name: finalName,
        phone: this.visitorPhone.trim() || undefined
      },
      priority: this.isSenior ? 'SENIOR' : 'REGULAR'
    }).subscribe({
      next: (res: any) => {
        this.isDispensing.set(false);
        const ticket = res?.ticket || res;
        if (ticket) {
          if (res?.position) ticket.position = res.position;
          this.dispensedTicket.set(ticket);
        }
        this.audioService.playChime();

        // Refresh service counts
        this.loadServices();

        // Auto-dismiss after 15 seconds
        setTimeout(() => {
          this.dismissDispensedTicket();
        }, 15000);
      },
      error: () => {
        this.isDispensing.set(false);
      }
    });
  }

  dismissDispensedTicket() {
    this.dispensedTicket.set(null);
    this.selectedServiceForTicket.set(null);
  }

  ticketQrData(): string {
    const t = this.dispensedTicket();
    const id = t?._id || (t as any)?.id;
    if (typeof window !== 'undefined') {
      const host = window.location.hostname;
      const port = window.location.port ? `:${window.location.port}` : '';
      return `${window.location.protocol}//${host}${port}/ticket/${id}`;
    }
    return `/ticket/${id}`;
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }
}
