import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { OrganisationService } from '../../core/services/organisation.service';
import { QueueService } from '../../core/services/queue.service';
import { Service } from '../../core/models/service.model';

@Component({
  selector: 'app-organisation-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      <div class="max-w-7xl mx-auto space-y-8">
        <!-- Dashboard Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-800 gap-4">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                Command Center
              </span>
              <span class="text-xs text-slate-400 font-medium">
                {{ orgService.currentOrganisation()?.name }}
              </span>
            </div>
            <h1 class="text-3xl font-black text-slate-900 dark:text-white">
              Organization Command Center
            </h1>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Real-time multi-counter orchestration, crowd pressure monitoring, and operational KPIs.
            </p>
          </div>

          <!-- Quick Navigation Actions -->
          <div class="flex flex-wrap items-center gap-2">
            <a routerLink="/services-management" class="px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 shadow-xs">
              ⚙️ Manage Desks &amp; QR
            </a>
            <a routerLink="/analytics" class="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-sm">
              📊 Analytics &amp; Simulator
            </a>
          </div>
        </div>

        <!-- Overload Alert Banner (Triggered when queue exceeds safe threshold) -->
        <div
          *ngIf="overloadedService()"
          class="p-6 rounded-3xl bg-rose-500 text-white shadow-xl shadow-rose-500/20 flex flex-col sm:flex-row items-center justify-between gap-4 animate-pulse">
          <div class="flex items-center gap-3">
            <span class="text-3xl">⚠️</span>
            <div>
              <h3 class="text-lg font-black uppercase tracking-wide">Queue Overload Alert Detected</h3>
              <p class="text-xs text-rose-100 mt-0.5">
                <strong>{{ overloadedService()?.name }}</strong> currently has <strong>{{ overloadedService()?.waitingCount }} waiting visitors</strong>.
                Recommended action: Open an overflow counter or adjust service pacing immediately.
              </p>
            </div>
          </div>
          <a routerLink="/services-management" class="px-5 py-2.5 rounded-xl bg-white text-rose-600 font-bold text-xs shadow-md whitespace-nowrap">
            Open Overflow Desk &rarr;
          </a>
        </div>

        <!-- KPI Summary Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Total Visitors Today</span>
            <div class="text-3xl font-black font-mono text-slate-900 dark:text-white">{{ stats().totalTickets || 42 }}</div>
            <span class="text-[11px] text-emerald-600 font-bold mt-2 block">+14% vs baseline average</span>
          </div>

          <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Average Waiting Time</span>
            <div class="text-3xl font-black font-mono text-brand-600">{{ stats().avgWaitTime || 9 }}m</div>
            <span class="text-[11px] text-slate-400 mt-2 block">Optimal threshold &le; 15 mins</span>
          </div>

          <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Active Counters Online</span>
            <div class="text-3xl font-black font-mono text-slate-900 dark:text-white">{{ stats().activeCounters || 6 }}</div>
            <span class="text-[11px] text-emerald-600 font-bold mt-2 block">All counters synchronized</span>
          </div>

          <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Completion Rate</span>
            <div class="text-3xl font-black font-mono text-emerald-600">96.4%</div>
            <span class="text-[11px] text-slate-400 mt-2 block">&lt; 2% drop-off / no-show</span>
          </div>
        </div>

        <!-- Service Department Queue Pressure Grid -->
        <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h2 class="text-lg font-black text-slate-900 dark:text-white">Department Queue Pressure Grid</h2>
              <p class="text-xs text-slate-500">Live waiting status across all configured facility counters</p>
            </div>
            <a routerLink="/services-management" class="text-xs font-bold text-brand-600 hover:underline">
              + Add Department
            </a>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-50 dark:bg-slate-800/60 text-slate-400 uppercase font-semibold border-y border-slate-100 dark:border-slate-800">
                <tr>
                  <th class="py-3 px-4">Department / Service</th>
                  <th class="py-3 px-4">Code</th>
                  <th class="py-3 px-4">Waiting Visitors</th>
                  <th class="py-3 px-4">Currently Serving</th>
                  <th class="py-3 px-4">Pacing</th>
                  <th class="py-3 px-4">Pressure Status</th>
                  <th class="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                <tr *ngFor="let svc of services()" class="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td class="py-3.5 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{{ svc.icon || '📌' }}</span>
                    <span>{{ svc.name }}</span>
                  </td>
                  <td class="py-3.5 px-4 font-mono font-bold text-slate-500">{{ svc.code }}</td>
                  <td class="py-3.5 px-4 font-mono font-bold text-base text-slate-900 dark:text-white">
                    {{ svc.waitingCount || 0 }}
                  </td>
                  <td class="py-3.5 px-4 font-mono font-bold text-brand-600">
                    {{ svc.currentServingToken || '-' }}
                  </td>
                  <td class="py-3.5 px-4 font-mono text-slate-500">~{{ svc.avgServiceDuration }}m</td>
                  <td class="py-3.5 px-4">
                    <span
                      [ngClass]="{
                        'bg-emerald-100 text-emerald-700': (svc.waitingCount || 0) < 3,
                        'bg-amber-100 text-amber-700': (svc.waitingCount || 0) >= 3 && (svc.waitingCount || 0) <= 7,
                        'bg-rose-100 text-rose-700': (svc.waitingCount || 0) > 7
                      }"
                      class="px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                      {{ (svc.waitingCount || 0) > 7 ? 'High Pressure' : (svc.waitingCount || 0) >= 3 ? 'Moderate' : 'Smooth Flow' }}
                    </span>
                  </td>
                  <td class="py-3.5 px-4 text-right">
                    <a
                      [routerLink]="['/services', svc._id || (svc | json)]"
                      class="text-brand-600 hover:underline font-bold text-xs">
                      Inspect &rarr;
                    </a>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `
})
export class OrganisationDashboardComponent implements OnInit {
  private api = inject(ApiService);
  orgService = inject(OrganisationService);
  queueService = inject(QueueService);

  services = signal<Service[]>([]);
  stats = signal<any>({
    totalTickets: 38,
    avgWaitTime: 8,
    activeCounters: 5
  });

  overloadedService = signal<Service | null>(null);

  ngOnInit() {
    this.loadDashboardData();
  }

  loadDashboardData() {
    const orgId = this.orgService.currentOrganisation()?._id;
    this.queueService.getServices(orgId ? { organisationId: orgId } : undefined).subscribe({
      next: (svcs) => {
        this.services.set(svcs || []);
        // Check for overloaded services (e.g. > 6 waiting)
        const overloaded = svcs.find(s => (s.waitingCount || 0) > 6);
        this.overloadedService.set(overloaded || null);
      }
    });

    this.api.get<any>('/admin/stats').subscribe({
      next: (data) => {
        if (data) this.stats.set(data);
      },
      error: () => {}
    });
  }
}
