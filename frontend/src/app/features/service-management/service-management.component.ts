import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { OrganisationService } from '../../core/services/organisation.service';
import { QueueService } from '../../core/services/queue.service';
import { Service } from '../../core/models/service.model';
import { QrDisplayModalComponent } from '../../shared/components/qr-display-modal/qr-display-modal.component';

@Component({
  selector: 'app-service-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, QrDisplayModalComponent],
  template: `
    <div class="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      <div class="max-w-6xl mx-auto space-y-8">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-800 gap-4">
          <div>
            <a routerLink="/dashboard" class="text-xs font-bold text-slate-400 hover:text-brand-600 mb-1 inline-block">
              &larr; Return to Dashboard
            </a>
            <h1 class="text-3xl font-black text-slate-900 dark:text-white">
              {{ orgService.serviceLabel() }} &amp; Counter Configuration
            </h1>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Add services, open extra counters, and generate high-resolution entrance QR posters.
            </p>
          </div>

          <button
            (click)="showCreateModal.set(true)"
            class="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-sm flex items-center gap-2">
            <span>+ Add New {{ orgService.serviceLabel() }}</span>
          </button>
        </div>

        <!-- Services List -->
        <div class="space-y-4">
          <div
            *ngFor="let svc of services()"
            class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950 text-brand-600 flex items-center justify-center font-bold text-2xl">
                {{ svc.icon || '📌' }}
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <span class="text-xs font-mono font-bold text-slate-400 uppercase">{{ svc.code }}</span>
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 capitalize">
                    {{ svc.category }}
                  </span>
                </div>
                <h3 class="text-lg font-black text-slate-900 dark:text-white">{{ svc.name }}</h3>
                <div class="flex items-center gap-3 text-xs text-slate-500 mt-1">
                  <span>Prefix: <strong class="font-mono">{{ svc.prefix }}</strong></span>
                  <span>&bull;</span>
                  <span>Duration: ~{{ svc.avgServiceDuration }}m</span>
                  <span>&bull;</span>
                  <span>Location: {{ svc.location.building || 'Main' }}</span>
                </div>
              </div>
            </div>

            <!-- Actions Bar -->
            <div class="flex flex-wrap items-center gap-2">
              <button
                (click)="openQrModal(svc)"
                class="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-white font-bold text-xs flex items-center gap-1.5 transition-colors">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
                Entrance QR Poster
              </button>

              <button
                (click)="addCounterToService(svc)"
                class="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-300 font-bold text-xs">
                + Add Counter
              </button>

              <button
                (click)="toggleServiceStatus(svc)"
                [ngClass]="svc.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600'"
                class="px-3.5 py-2 rounded-xl border font-bold text-xs">
                {{ svc.status === 'ACTIVE' ? 'Active' : 'Paused' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Create Service Modal -->
      <div *ngIf="showCreateModal()" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
        <div class="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800">
          <h3 class="text-xl font-black text-slate-900 dark:text-white mb-1">
            Create New {{ orgService.serviceLabel() }}
          </h3>
          <p class="text-xs text-slate-500 mb-6">
            Configure desk rules, average service duration, and token prefixes.
          </p>

          <form (ngSubmit)="handleCreateService()" class="space-y-4">
            <div class="grid grid-cols-2 gap-3">
              <div class="col-span-2">
                <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Service Name *</label>
                <input type="text" [(ngModel)]="newServiceName" name="name" required placeholder="e.g. Ophthalmology Clinic" class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-800" />
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Service Code *</label>
                <input type="text" [(ngModel)]="newServiceCode" name="code" required placeholder="e.g. OPHTH" class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-800" />
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Token Prefix *</label>
                <input type="text" [(ngModel)]="newServicePrefix" name="prefix" required placeholder="e.g. EYE" class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-800" />
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Category</label>
                <input type="text" [(ngModel)]="newServiceCategory" name="category" placeholder="e.g. clinical" class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-800" />
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Avg Duration (mins)</label>
                <input type="number" [(ngModel)]="newServiceDuration" name="duration" min="1" max="60" class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-800" />
              </div>
            </div>

            <div class="flex gap-2 pt-4">
              <button type="button" (click)="showCreateModal.set(false)" class="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-xs">
                Cancel
              </button>
              <button type="submit" [disabled]="!newServiceName || !newServiceCode || !newServicePrefix" class="flex-1 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-sm">
                Create &amp; Launch
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- QR Poster Modal -->
      <app-qr-display-modal
        *ngIf="selectedServiceForQr()"
        [title]="selectedServiceForQr()!.name + ' Entrance QR'"
        subtitle="Universal Queue Poster"
        [qrData]="getServiceQrUrl(selectedServiceForQr()!)"
        [highlightValue]="selectedServiceForQr()!.code"
        [metaInfo]="[
          { label: 'Token Prefix', value: selectedServiceForQr()!.prefix },
          { label: 'Avg Duration', value: '~' + selectedServiceForQr()!.avgServiceDuration + 'm' }
        ]"
        (close)="selectedServiceForQr.set(null)">
      </app-qr-display-modal>
    </div>
  `
})
export class ServiceManagementComponent implements OnInit {
  private api = inject(ApiService);
  orgService = inject(OrganisationService);
  queueService = inject(QueueService);

  services = signal<Service[]>([]);
  showCreateModal = signal(false);
  selectedServiceForQr = signal<Service | null>(null);

  newServiceName = '';
  newServiceCode = '';
  newServicePrefix = '';
  newServiceCategory = 'general';
  newServiceDuration = 8;

  ngOnInit() {
    this.loadServices();
  }

  loadServices() {
    const orgId = this.orgService.currentOrganisation()?._id;
    this.queueService.getServices(orgId ? { organisationId: orgId } : undefined).subscribe({
      next: (svcs) => this.services.set(svcs || [])
    });
  }

  openQrModal(svc: Service) {
    this.selectedServiceForQr.set(svc);
  }

  getServiceQrUrl(svc: Service): string {
    const id = svc._id || (svc as any).id;
    return typeof window !== 'undefined' ? `${window.location.origin}/services/${id}` : `https://waitwise.io/services/${id}`;
  }

  toggleServiceStatus(svc: Service) {
    const newStatus = svc.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    const id = svc._id || (svc as any).id;
    this.api.put(`/services/${id}`, { status: newStatus }).subscribe({
      next: () => {
        this.services.update(list => list.map(s => s._id === id ? { ...s, status: newStatus } : s));
      }
    });
  }

  addCounterToService(svc: Service) {
    const id = svc._id || (svc as any).id;
    const count = (svc.counters?.length || 1) + 1;
    this.api.post(`/counters`, {
      serviceId: id,
      counterNumber: count,
      counterName: `Counter ${count}`,
      status: 'OPEN'
    }).subscribe({
      next: () => {
        alert(`Counter ${count} added and opened for ${svc.name}!`);
        this.loadServices();
      }
    });
  }

  handleCreateService() {
    const org = this.orgService.currentOrganisation();
    if (!org) return;

    this.api.post<Service>('/services', {
      organisationId: org._id,
      name: this.newServiceName,
      code: this.newServiceCode.toUpperCase(),
      prefix: this.newServicePrefix.toUpperCase(),
      category: this.newServiceCategory.toLowerCase(),
      avgServiceDuration: this.newServiceDuration,
      operatingHours: { open: '08:30', close: '17:30' },
      location: { building: 'Main Center', floor: '1' }
    }).subscribe({
      next: () => {
        this.showCreateModal.set(false);
        this.newServiceName = '';
        this.newServiceCode = '';
        this.newServicePrefix = '';
        this.loadServices();
      }
    });
  }
}
