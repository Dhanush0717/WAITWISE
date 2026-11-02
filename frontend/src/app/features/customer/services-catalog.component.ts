import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { QueueService } from '../../core/services/queue.service';
import { OrganisationService } from '../../core/services/organisation.service';
import { SocketService } from '../../core/services/socket.service';
import { Service } from '../../core/models/service.model';

@Component({
  selector: 'app-services-catalog',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      <div class="max-w-7xl mx-auto">
        <!-- Header Banner -->
        <div class="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-800 gap-4">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 capitalize">
                {{ orgService.currentOrganisation()?.type || 'Universal' }} Workspace
              </span>
              <span class="text-xs text-slate-500 font-semibold">
                {{ orgService.currentOrganisation()?.name || 'All Active Facilities' }}
              </span>
            </div>
            <h1 class="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {{ orgService.serviceLabel() }} Directory
            </h1>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Select any counter desk or service department to join the live virtual queue.
            </p>
          </div>

          <!-- Quick Actions -->
          <div class="flex flex-wrap items-center gap-3">
            <a routerLink="/service-management" class="px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-xs font-bold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 flex items-center gap-1.5 shadow-xs">
              <span>🛠️ + Add Custom Desk</span>
            </a>
            <a routerLink="/kiosk" target="_blank" class="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5">
              <span>🖥️ Kiosk Terminal</span>
            </a>
          </div>
        </div>

        <!-- Info Bar -->
        <div class="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-2">
          <span>Active Service Desks for <strong>{{ orgService.currentOrganisation()?.name || 'Citizen Services Center' }}</strong></span>
          <a routerLink="/service-management" class="text-brand-600 hover:underline font-bold text-xs inline-flex items-center gap-1">
            <span>Manage Desks &amp; Counters &rarr;</span>
          </a>
        </div>

        <!-- Filter & Search Toolbar -->
        <div class="my-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <!-- Search Input -->
          <div class="relative w-full sm:w-72">
            <input
              type="text"
              [(ngModel)]="searchQuery"
              placeholder="Search by name or code..."
              class="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500"
            />
            <svg class="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <!-- Category Filter Pills -->
          <div class="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            <button
              (click)="selectedCategory.set('ALL')"
              [ngClass]="selectedCategory() === 'ALL'
                ? 'bg-brand-600 text-white'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50'"
              class="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold transition-colors whitespace-nowrap shadow-xs">
              All Categories
            </button>
            <button
              *ngFor="let cat of uniqueCategories()"
              (click)="selectedCategory.set(cat)"
              [ngClass]="selectedCategory() === cat
                ? 'bg-brand-600 text-white'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50'"
              class="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold transition-colors whitespace-nowrap shadow-xs capitalize">
              {{ cat }}
            </button>
          </div>
        </div>

        <!-- Services Grid -->
        @if (isLoading()) {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div *ngFor="let _ of [1, 2, 3]" class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm animate-pulse space-y-4">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-2xl bg-slate-200 dark:bg-slate-800"></div>
                <div class="space-y-1.5 flex-1">
                  <div class="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
                  <div class="h-4 bg-slate-200 dark:bg-slate-800 rounded w-2/3"></div>
                </div>
              </div>
              <div class="h-3 bg-slate-200 dark:bg-slate-800 rounded w-full"></div>
              <div class="h-16 bg-slate-100 dark:bg-slate-800/60 rounded-2xl"></div>
              <div class="h-9 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
            </div>
          </div>
        } @else {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            @for (svc of filteredServices(); track (svc._id || svc.id)) {
              <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
                <!-- Top Card Header -->
                <div>
                  <div class="flex items-start justify-between gap-3 mb-3">
                    <div class="flex items-center gap-2.5">
                      <div class="w-10 h-10 rounded-2xl bg-brand-50 dark:bg-brand-950 text-brand-600 flex items-center justify-center font-bold text-lg">
                        {{ getServiceIcon(svc) }}
                      </div>
                      <div>
                        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{{ svc.code }} &bull; {{ svc.category || 'General' }}</span>
                        <h3 class="font-bold text-base text-slate-900 dark:text-white group-hover:text-brand-600 transition-colors">
                          {{ svc.name }}
                        </h3>
                      </div>
                    </div>

                    <!-- Status Badge -->
                    <span
                      [ngClass]="{
                        'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200': getStatus(svc) === 'ACTIVE',
                        'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200': getStatus(svc) === 'PAUSED',
                        'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200': getStatus(svc) === 'CLOSED'
                      }"
                      class="px-2 py-0.5 rounded-full text-[10px] font-bold border">
                      {{ getStatus(svc) }}
                    </span>
                  </div>

                  <p class="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                    {{ svc.description || 'Professional service desk with virtual queueing.' }}
                  </p>

                  <!-- Location & Hours Info -->
                  <div class="flex items-center gap-3 text-[11px] text-slate-400 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <span>📍 {{ getLocationInfo(svc) }}</span>
                    <span>⏱️ ~{{ getEstimatedDuration(svc) }}m / person</span>
                  </div>

                  <!-- Live Queue Metrics -->
                  <div class="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800/80 mb-5 text-center">
                    <div>
                      <span class="block text-[10px] text-slate-400 uppercase font-semibold">Waiting</span>
                      <span class="font-mono font-bold text-base text-slate-900 dark:text-white">{{ getWaitingCount(svc) }}</span>
                    </div>
                    <div>
                      <span class="block text-[10px] text-slate-400 uppercase font-semibold">Serving</span>
                      <span class="font-mono font-bold text-base text-brand-600 dark:text-brand-400">{{ getServingToken(svc) }}</span>
                    </div>
                    <div>
                      <span class="block text-[10px] text-slate-400 uppercase font-semibold">Est. Wait</span>
                      <span class="font-mono font-bold text-base text-slate-900 dark:text-white">{{ getWaitingCount(svc) * getEstimatedDuration(svc) }}m</span>
                    </div>
                  </div>
                </div>

                <!-- Card Bottom Action -->
                <div class="flex items-center gap-2">
                  <a
                    *ngIf="getStatus(svc) === 'ACTIVE'"
                    [routerLink]="['/services', (svc._id || svc.id)]"
                    class="flex-1 py-2.5 px-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs text-center shadow-xs transition-all active:scale-[0.98]">
                    Join Virtual Queue &rarr;
                  </a>
                  <button
                    *ngIf="getStatus(svc) !== 'ACTIVE'"
                    disabled
                    class="flex-1 py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 font-bold text-xs text-center cursor-not-allowed border border-slate-200 dark:border-slate-700">
                    {{ getStatus(svc) === 'CLOSED' ? 'Service Desk Closed' : 'Desk Paused' }}
                  </button>
                </div>
              </div>
            } @empty {
              <!-- Empty State -->
              <div class="col-span-full py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8">
                <div class="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3 text-2xl">
                  📂
                </div>
                <h3 class="text-base font-bold text-slate-800 dark:text-white">No Desks Configured for This Sector</h3>
                <p class="text-xs text-slate-400 mt-1 max-w-sm mx-auto mb-4">
                  Switch facilities using the top dropdown or click below to view all services across the platform.
                </p>
                <button
                  type="button"
                  (click)="loadAllServices()"
                  class="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-xs">
                  View All Available Desks
                </button>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `
})
export class ServicesCatalogComponent implements OnInit, OnDestroy {
  queueService = inject(QueueService);
  orgService = inject(OrganisationService);
  socketService = inject(SocketService);
  private route = inject(ActivatedRoute);

  services = signal<Service[]>([]);
  isLoading = signal<boolean>(false);
  searchQuery = '';
  selectedCategory = signal<string>('ALL');
  private sub = new Subscription();

  uniqueCategories = computed(() => {
    const set = new Set<string>();
    const list = this.services();
    if (Array.isArray(list)) {
      list.forEach(s => {
        if (s.category) set.add(s.category);
      });
    }
    return Array.from(set);
  });

  filteredServices = computed(() => {
    let list = this.services();
    if (!Array.isArray(list)) return [];

    const cat = this.selectedCategory();
    const query = this.searchQuery.toLowerCase().trim();

    if (cat !== 'ALL') {
      list = list.filter(s => s.category?.toLowerCase() === cat.toLowerCase());
    }

    if (query) {
      list = list.filter(s =>
        s.name.toLowerCase().includes(query) ||
        s.code.toLowerCase().includes(query) ||
        (s.description && s.description.toLowerCase().includes(query))
      );
    }
    return list;
  });

  ngOnInit() {
    this.sub.add(
      this.route.queryParams.subscribe(params => {
        if (params['sector']) {
          this.selectSectorQuick(params['sector']);
        } else {
          this.loadCatalog();
        }
      })
    );

    this.sub.add(
      this.socketService.queueUpdated$.subscribe((data) => {
        if (data && data.serviceId) {
          this.services.update(list =>
            Array.isArray(list) ? list.map(s => {
              const sid = s._id || (s as any).id;
              if (sid === data.serviceId) {
                return {
                  ...s,
                  waitingCount: data.waitingCount !== undefined ? data.waitingCount : s.waitingCount,
                  currentServingToken: data.currentServingToken || s.currentServingToken
                };
              }
              return s;
            }) : []
          );
        }
      })
    );
  }

  selectSectorQuick(type: string) {
    const org = this.orgService.selectSector(type);
    if (org) {
      this.fetchServices(org._id || (org as any).id);
    } else {
      this.orgService.loadOrganisations().subscribe({
        next: (orgs) => {
          const match = orgs.find(o => o.type === type || o.slug === type);
          if (match) {
            this.orgService.setOrganisation(match);
            this.fetchServices(match._id || (match as any).id);
          } else {
            this.fetchServices();
          }
        },
        error: () => this.fetchServices()
      });
    }
  }

  loadCatalog(orgId?: string) {
    this.isLoading.set(true);
    const currentOrg = this.orgService.currentOrganisation();
    const id = orgId || currentOrg?._id || (currentOrg as any)?.id;

    if (!id) {
      this.orgService.loadOrganisations().subscribe({
        next: (orgs) => {
          const target = orgs.find(o => o.slug === 'citizen-services' || o.type === 'government') || orgs[0];
          if (target) {
            this.orgService.setOrganisation(target);
            this.fetchServices(target._id || (target as any).id);
          } else {
            this.fetchServices();
          }
        },
        error: () => this.fetchServices()
      });
      return;
    }

    this.fetchServices(id);
  }

  private fetchServices(id?: string) {
    this.isLoading.set(true);
    this.queueService.getServices(id ? { organisationId: id } : undefined).subscribe({
      next: (data) => {
        this.isLoading.set(false);
        const list = Array.isArray(data) ? data : (data as any)?.data || [];
        if (list.length > 0) {
          this.services.set(list);
          list.forEach((s: any) => {
            const sid = s._id || s.id;
            if (sid) this.socketService.joinService(sid);
          });
        } else {
          this.loadAllServices();
        }
      },
      error: () => {
        this.isLoading.set(false);
        this.loadAllServices();
      }
    });
  }

  loadAllServices() {
    this.isLoading.set(true);
    this.queueService.getServices().subscribe({
      next: (data) => {
        this.isLoading.set(false);
        const list = Array.isArray(data) ? data : (data as any)?.data || [];
        this.services.set(list);
        list.forEach((s: any) => {
          const sid = s._id || s.id;
          if (sid) this.socketService.joinService(sid);
        });
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  getServiceIcon(svc: any): string {
    if (svc.icon) return svc.icon;
    const cat = (svc.category || '').toLowerCase();
    if (cat.includes('consult') || cat.includes('health') || cat.includes('opd')) return '🩺';
    if (cat.includes('lab') || cat.includes('diag')) return '🧪';
    if (cat.includes('pharm')) return '💊';
    if (cat.includes('cash') || cat.includes('bank') || cat.includes('money')) return '💵';
    if (cat.includes('loan') || cat.includes('credit')) return '💳';
    if (cat.includes('pass') || cat.includes('travel')) return '🛂';
    if (cat.includes('admin') || cat.includes('exam') || cat.includes('college')) return '🎓';
    return '📌';
  }

  getStatus(svc: any): string {
    return (svc.status || 'ACTIVE').toUpperCase();
  }

  getLocationInfo(svc: any): string {
    if (svc.location?.room && svc.location?.building) {
      return `${svc.location.building} (${svc.location.room})`;
    }
    return svc.location?.building || svc.location?.room || 'Main Campus';
  }

  getWaitingCount(svc: any): number {
    return svc.stats?.waitingCount ?? svc.waitingCount ?? 0;
  }

  getServingToken(svc: any): string {
    return svc.currentServingToken || svc.stats?.currentServingToken || '-';
  }

  getEstimatedDuration(svc: any): number {
    return svc.estimatedServiceTimeMinutes || svc.avgServiceDuration || 6;
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }
}
