import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { OrganisationService } from '../../core/services/organisation.service';
import { AuthService } from '../../core/services/auth.service';
import { GeolocationService } from '../../core/services/geolocation.service';

export interface IndustryPreset {
  id: string;
  slug: string;
  icon: string;
  name: string;
  subtitle: string;
  serviceLabel: string;
  tokenLabel: string;
  counterLabel: string;
  staffLabel: string;
  sampleService: string;
  sampleWaiting: number;
  sampleToken: string;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="relative overflow-hidden bg-slate-50 dark:bg-slate-950 min-h-screen">
      <!-- Background Glow Orbs -->
      <div class="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-brand-500/10 via-indigo-500/5 to-transparent blur-3xl pointer-events-none"></div>

      <!-- Hero Section -->
      <section class="relative pt-12 pb-20 sm:pt-20 sm:pb-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center max-w-3xl mx-auto">
          <!-- Top Badge -->
          <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300 text-xs font-bold mb-6 animate-fade-in shadow-xs">
            <span class="flex h-2 w-2 rounded-full bg-brand-600 animate-ping"></span>
            Universal Smart Queue &amp; Crowd Management Platform
          </div>

          <!-- Hero Headline -->
          <h1 class="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.1] mb-6 font-sans">
            One Platform. Every Queue. <br class="hidden sm:inline">
            <span class="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 via-indigo-600 to-sky-500">
              Zero Unnecessary Waiting.
            </span>
          </h1>

          <p class="text-base sm:text-lg text-slate-600 dark:text-slate-300 mb-8 leading-relaxed max-w-2xl mx-auto">
            Eliminate chaotic physical lines in <strong>Hospitals</strong>, <strong>Banks</strong>, <strong>Government Centers</strong>, <strong>Retail Hubs</strong>, and <strong>Universities</strong>. Visitors join digitally, monitor their exact turn, and walk up only when needed.
          </p>

          <!-- Primary CTAs -->
          <div class="flex flex-wrap items-center justify-center gap-4 mb-12">
            <a routerLink="/services" class="px-6 py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-lg shadow-brand-500/25 transition-all hover:scale-105 active:scale-95 flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Explore Live Queues
            </a>

            <a routerLink="/kiosk" target="_blank" class="px-6 py-3.5 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 font-bold text-sm shadow-sm transition-all hover:scale-105 active:scale-95 flex items-center gap-2">
              <svg class="w-4 h-4 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Entrance Touch Kiosk
            </a>

            <a routerLink="/login" class="px-6 py-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-sm transition-all flex items-center gap-2">
              <span>⚡ 1-Click Demo Logins</span>
            </a>
          </div>

          <!-- Live Multi-Industry Preset Interactive Switcher -->
          <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xl max-w-4xl mx-auto text-left">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-3">
              <div>
                <span class="text-xs font-bold text-brand-600 uppercase tracking-wider">Multi-Tenant Engine</span>
                <h3 class="text-lg font-bold text-slate-900 dark:text-white">Select Any Industry to Preview Dynamic Adaptation</h3>
              </div>
              <span class="text-xs text-slate-400">Zero code changes required per industry</span>
            </div>

            <!-- Industry Selector Tabs -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5">
              @for (ind of industries; track ind.id) {
                <button
                  type="button"
                  (click)="selectIndustry(ind.id)"
                  [ngClass]="activeIndustry() === ind.id 
                    ? 'bg-brand-50 border-brand-500 text-brand-700 dark:bg-brand-950 dark:text-brand-300 shadow-md ring-2 ring-brand-500/20' 
                    : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'"
                  class="p-4 rounded-2xl border-2 text-left transition-all cursor-pointer">
                  <div class="text-3xl mb-1.5">{{ ind.icon }}</div>
                  <div class="font-black text-sm text-slate-900 dark:text-white">{{ ind.name }}</div>
                  <div class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{{ ind.subtitle }}</div>
                </button>
              }
            </div>

            <!-- Preview Card for Selected Industry -->
            <div class="mt-6 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700 grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Configured Terminology</span>
                <div class="mt-2 space-y-1.5 text-xs">
                  <div class="flex justify-between"><span class="text-slate-500">Service Label:</span> <strong class="text-slate-900 dark:text-white">{{ currentPreset().serviceLabel }}</strong></div>
                  <div class="flex justify-between"><span class="text-slate-500">Token Label:</span> <strong class="text-slate-900 dark:text-white">{{ currentPreset().tokenLabel }}</strong></div>
                  <div class="flex justify-between"><span class="text-slate-500">Counter Label:</span> <strong class="text-slate-900 dark:text-white">{{ currentPreset().counterLabel }}</strong></div>
                  <div class="flex justify-between"><span class="text-slate-500">Staff Label:</span> <strong class="text-slate-900 dark:text-white">{{ currentPreset().staffLabel }}</strong></div>
                </div>
              </div>

              <div>
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Example Active Department</span>
                <div class="mt-2 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs">
                  <div class="font-bold text-slate-900 dark:text-white flex items-center justify-between">
                    <span>{{ currentPreset().sampleService }}</span>
                    <span class="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 text-[10px] font-bold">Active</span>
                  </div>
                  <div class="text-[11px] text-slate-500 mt-2">
                    Waiting: <strong class="text-slate-900 dark:text-white">{{ currentPreset().sampleWaiting }}</strong> &bull; Serving: <strong class="text-brand-600">{{ currentPreset().sampleToken }}</strong>
                  </div>
                </div>
              </div>

              <div class="flex flex-col justify-center">
                <button
                  type="button"
                  (click)="applyIndustryDemo(currentPreset().slug)"
                  class="w-full py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition-all text-center">
                  Launch {{ currentPreset().name }} Workspace &rarr;
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 3-Way Hybrid Queue Architecture Section -->
      <section class="py-16 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center max-w-2xl mx-auto mb-12">
            <span class="text-xs font-bold text-brand-600 uppercase tracking-wider">Universal Inclusion</span>
            <h2 class="text-3xl font-black text-slate-900 dark:text-white mt-1">3-Way Hybrid Queue Architecture</h2>
            <p class="text-sm text-slate-600 dark:text-slate-400 mt-2">
              Every customer is covered: smartphone users, visitors without phones, and people requiring in-person staff assistance.
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            <!-- Channel 1: Mobile QR Self-Join -->
            <div class="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 hover:border-brand-500 transition-all">
              <div class="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xl mb-4">
                📱
              </div>
              <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-2">1. QR Self-Join (Mobile)</h3>
              <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                Visitors scan the department's QR code on entrance posters or digital displays. Zero app download needed; receives a live token with real-time turn countdown in browser.
              </p>
              <span class="text-xs font-bold text-brand-600">No account required (Guest flow)</span>
            </div>

            <!-- Channel 2: Touch Entrance Kiosk -->
            <div class="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 hover:border-brand-500 transition-all">
              <div class="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl mb-4">
                🖥️
              </div>
              <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-2">2. Touch Kiosk Terminal</h3>
              <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                Tablet or touchscreen kiosk positioned at the facility reception. Visitors tap their desired service, enter name/phone, and receive an on-screen or printed token slip.
              </p>
              <span class="text-xs font-bold text-brand-600">Fast 1-touch visitor generation</span>
            </div>

            <!-- Channel 3: Staff Assisted Walk-in Desk -->
            <div class="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 hover:border-brand-500 transition-all">
              <div class="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xl mb-4">
                👨‍💼
              </div>
              <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-2">3. Staff Assisted Walk-in</h3>
              <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                Desk staff can manually issue queue tokens for elderly visitors, emergencies, or customers without digital devices with custom priority flags.
              </p>
              <span class="text-xs font-bold text-brand-600">Senior &amp; Emergency VIP prioritization</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Signature "Should I Go Now?" Advisor Spotlight -->
      <section class="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="bg-gradient-to-tr from-brand-600 to-indigo-700 rounded-3xl p-8 sm:p-12 text-white shadow-2xl relative overflow-hidden">
          <div class="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <span class="inline-block px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-wider mb-3">
                WaitWise Intelligent Core
              </span>
              <h2 class="text-3xl sm:text-4xl font-black mb-4">
                The "Should I Go Now?" Advisor
              </h2>
              <p class="text-sm text-brand-100 leading-relaxed mb-6">
                Never sit aimlessly in a crowded waiting room again. WaitWise calculates walking travel time from your exact GPS location, factors in people ahead and service duration, and tells you whether to <strong>Relax</strong>, <strong>Prepare</strong>, or <strong>Go Now</strong>.
              </p>

              <div class="flex flex-wrap gap-4">
                <a routerLink="/services" class="px-5 py-3 rounded-xl bg-white text-brand-700 font-bold text-xs shadow-md hover:bg-brand-50 transition-all">
                  Try Live with Active Token
                </a>
              </div>
            </div>

            <!-- Interactive Demo Simulation Box -->
            <div class="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <div class="flex items-center justify-between mb-4">
                <span class="text-xs font-bold text-white/80">LIVE SIMULATOR</span>
                <span class="px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 font-mono text-xs font-bold">
                  {{ demoResult.badge }}
                </span>
              </div>

              <!-- Slider for people ahead -->
              <div class="space-y-3 mb-4">
                <div class="flex justify-between text-xs font-medium">
                  <span>People Ahead of You:</span>
                  <span class="font-bold font-mono">{{ simPeopleAhead() }} people</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="15"
                  [value]="simPeopleAhead()"
                  (input)="onSliderChange($event)"
                  class="w-full h-2 bg-white/30 rounded-lg appearance-none cursor-pointer accent-white"
                />
              </div>

              <div class="p-4 rounded-xl bg-slate-900/40 border border-white/10 text-xs space-y-1.5">
                <div class="font-bold text-white text-sm">{{ demoResult.headline }}</div>
                <p class="text-white/80">{{ demoResult.subtext }}</p>
                <div class="pt-2 text-[11px] text-white/60 flex justify-between border-t border-white/10">
                  <span>Estimated Wait: {{ simPeopleAhead() * 8 }} mins</span>
                  <span>Walk Time: ~5 mins</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  `
})
export class LandingComponent {
  orgService = inject(OrganisationService);
  authService = inject(AuthService);
  geoService = inject(GeolocationService);
  private router = inject(Router);

  activeIndustry = signal<string>('healthcare');
  simPeopleAhead = signal<number>(4);

  industries: IndustryPreset[] = [
    {
      id: 'healthcare',
      slug: 'metro-health-general-hospital',
      icon: '🏥',
      name: 'Healthcare',
      subtitle: 'Hospitals & Clinics',
      serviceLabel: 'Specialty / Clinic',
      tokenLabel: 'Patient Token',
      counterLabel: 'Consultation Room',
      staffLabel: 'Doctor / Nurse',
      sampleService: 'General OPD & Triage',
      sampleWaiting: 8,
      sampleToken: 'DOC-012'
    },
    {
      id: 'banking',
      slug: 'horizon-trust-bank',
      icon: '🏦',
      name: 'Banking & Finance',
      subtitle: 'Branches & Credit Unions',
      serviceLabel: 'Counter Service',
      tokenLabel: 'Queue Token',
      counterLabel: 'Teller Window',
      staffLabel: 'Bank Teller',
      sampleService: 'Cash Deposit & Withdrawal',
      sampleWaiting: 5,
      sampleToken: 'CS-034'
    },
    {
      id: 'government',
      slug: 'state-citizen-services-center',
      icon: '🏛️',
      name: 'Government',
      subtitle: 'Passports & RTO',
      serviceLabel: 'Citizen Counter',
      tokenLabel: 'Application Token',
      counterLabel: 'Desk / Counter',
      staffLabel: 'Passport Officer',
      sampleService: 'Passport Renewal & Bio',
      sampleWaiting: 12,
      sampleToken: 'PASS-089'
    },
    {
      id: 'education',
      slug: 'central-university-campus',
      icon: '🎓',
      name: 'Education',
      subtitle: 'Universities & Colleges',
      serviceLabel: 'Campus Service',
      tokenLabel: 'Student Token',
      counterLabel: 'Service Window',
      staffLabel: 'Staff Operator',
      sampleService: 'Fee Payment & Registrar',
      sampleWaiting: 3,
      sampleToken: 'FEE-007'
    }
  ];

  currentPreset = computed<IndustryPreset>(() => {
    return this.industries.find(i => i.id === this.activeIndustry()) || this.industries[0];
  });

  selectIndustry(id: string) {
    this.activeIndustry.set(id);
  }

  get demoResult() {
    return this.geoService.calculateShouldIGo(undefined, this.simPeopleAhead(), 8, 5, 4);
  }

  onSliderChange(event: Event) {
    const val = Number((event.target as HTMLInputElement).value);
    this.simPeopleAhead.set(val);
  }

  applyIndustryDemo(slug: string) {
    const org = this.orgService.organisations().find(o => o.slug === slug);
    if (org) {
      this.orgService.setOrganisation(org);
    }
    this.router.navigate(['/services']);
  }
}
