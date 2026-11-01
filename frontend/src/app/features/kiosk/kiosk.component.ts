import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QueueService } from '../../core/services/queue.service';
import { OrganisationService } from '../../core/services/organisation.service';
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
            (click)="selectService(svc)"
            class="p-8 rounded-3xl bg-slate-800/80 hover:bg-brand-600 border-2 border-slate-700/80 hover:border-brand-400 text-left transition-all active:scale-95 shadow-xl group">
            <div class="text-4xl mb-4 group-hover:scale-110 transition-transform">
              {{ svc.icon || '📌' }}
            </div>
            <div class="text-xs font-bold font-mono text-brand-400 group-hover:text-white uppercase mb-1">
              {{ svc.code }} &bull; {{ svc.category }}
            </div>
            <h3 class="text-2xl font-black text-white group-hover:text-white mb-2">
              {{ svc.name }}
            </h3>
            <p class="text-xs text-slate-400 group-hover:text-brand-100 line-clamp-2 mb-4">
              {{ svc.description || 'Quick counter assistance.' }}
            </p>

            <div class="flex items-center justify-between pt-4 border-t border-slate-700/60 group-hover:border-white/20 text-xs">
              <span class="text-slate-400 group-hover:text-white">Waiting in line:</span>
              <strong class="text-lg font-mono font-black text-emerald-400 group-hover:text-white">{{ svc.waitingCount || 0 }}</strong>
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
              <label class="block text-xs font-semibold text-slate-300 mb-1">Your Name (Optional)</label>
              <input
                type="text"
                [(ngModel)]="visitorName"
                name="visitorName"
                placeholder="Visitor / Walk-In"
                class="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-800 text-white text-sm focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Mobile Number (For SMS Alert)</label>
              <input
                type="tel"
                [(ngModel)]="visitorPhone"
                name="visitorPhone"
                placeholder="+1 (555) 000-0000"
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
export class KioskComponent implements OnInit {
  queueService = inject(QueueService);
  orgService = inject(OrganisationService);
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

  ngOnInit() {
    this.updateClock();
    setInterval(() => this.updateClock(), 1000);
    this.loadServices();
  }

  updateClock() {
    const now = new Date();
    this.currentTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  loadServices() {
    const orgId = this.orgService.currentOrganisation()?._id;
    this.queueService.getServices(orgId ? { organisationId: orgId } : undefined).subscribe({
      next: (svcs) => this.services.set(svcs || [])
    });
  }

  selectService(svc: Service) {
    this.selectedServiceForTicket.set(svc);
    this.visitorName = 'Visitor ' + Math.floor(100 + Math.random() * 900);
    this.visitorPhone = '';
    this.isSenior = false;
  }

  confirmKioskTicket() {
    const svc = this.selectedServiceForTicket();
    if (!svc) return;

    this.isDispensing.set(true);
    const serviceId = svc._id || (svc as any).id;

    this.queueService.kioskJoin({
      serviceId,
      guestInfo: {
        name: this.visitorName.trim() || 'Visitor',
        phone: this.visitorPhone.trim() || undefined
      },
      priority: this.isSenior ? 'SENIOR' : 'REGULAR'
    }).subscribe({
      next: (res) => {
        this.isDispensing.set(false);
        this.dispensedTicket.set(res.ticket);
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
    return typeof window !== 'undefined' ? `${window.location.origin}/ticket/${id}` : `https://waitwise.io/ticket/${id}`;
  }
}
