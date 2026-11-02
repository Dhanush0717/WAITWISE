import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <footer class="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 pt-12 pb-8 transition-colors">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          <!-- Col 1: Platform Vision -->
          <div class="md:col-span-2 space-y-3">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold text-lg">
                W
              </div>
              <span class="text-lg font-black tracking-tight text-slate-900 dark:text-white">WAIT<span class="text-brand-600">WISE</span></span>
              <span class="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold border border-slate-200 dark:border-slate-700">
                Universal Edition
              </span>
            </div>
            <p class="text-sm text-slate-600 dark:text-slate-400 max-w-md leading-relaxed">
              <strong>One Platform. Every Queue. Zero Unnecessary Waiting.</strong><br>
              A universal, configurable multi-tenant queue orchestration platform built for hospitals, financial institutions, government centers, retail hubs, and campus facilities.
            </p>
            <div class="flex items-center gap-2 pt-2 text-xs text-slate-500">
              <span class="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Real-Time Queue Orchestration &amp; Instant Turn Alerts</span>
            </div>
          </div>

          <!-- Col 2: Supported Industries -->
          <div>
            <h4 class="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">Universal Industries</h4>
            <ul class="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
              <li class="flex items-center gap-1.5"><span>🏥</span> Healthcare & Hospitals</li>
              <li class="flex items-center gap-1.5"><span>🏦</span> Banks & Financial Branches</li>
              <li class="flex items-center gap-1.5"><span>🏛️</span> Citizen & Govt Services</li>
              <li class="flex items-center gap-1.5"><span>🎓</span> Universities & Colleges</li>
              <li class="flex items-center gap-1.5"><span>🛍️</span> Retail & Service Centers</li>
            </ul>
          </div>

          <!-- Col 3: Hybrid Access & Quick Links -->
          <div>
            <h4 class="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">Hybrid Access Channels</h4>
            <ul class="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
              <li>
                <a routerLink="/services" class="hover:text-brand-600 transition-colors">📱 Mobile QR Self-Join</a>
              </li>
              <li>
                <a routerLink="/kiosk" target="_blank" class="hover:text-brand-600 transition-colors">🖥️ Entrance Touch Kiosk</a>
              </li>
              <li>
                <a routerLink="/staff" class="hover:text-brand-600 transition-colors">👨‍💼 Assisted Walk-In Desk</a>
              </li>
              <li>
                <a routerLink="/onboarding" class="text-brand-600 font-semibold hover:underline">+ Register Organisation</a>
              </li>
            </ul>
          </div>
        </div>

        <!-- Bottom bar -->
        <div class="border-t border-slate-100 dark:border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <p>&copy; 2026 WAITWISE &bull; Enterprise Virtual Queue &amp; Crowd Management Platform.</p>
          <div class="flex items-center gap-4">
            <span class="text-[11px] text-slate-400">High-Availability Multi-Tenant Queue System</span>
          </div>
        </div>
      </div>
    </footer>
  `
})
export class FooterComponent {}
