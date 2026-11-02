import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { OrganisationService } from '../../core/services/organisation.service';
import { AuthService } from '../../core/services/auth.service';
import { GeolocationService } from '../../core/services/geolocation.service';

export interface IndustrySector {
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
      <!-- Background Ambient Glow -->
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
          <div class="flex flex-wrap items-center justify-center gap-4 mb-14">
            <a routerLink="/services" class="px-6 py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-lg shadow-brand-500/25 transition-all hover:scale-105 active:scale-95 flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Explore Live Desks
            </a>

            <a routerLink="/kiosk" target="_blank" class="px-6 py-3.5 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 font-bold text-sm shadow-sm transition-all hover:scale-105 active:scale-95 flex items-center gap-2">
              <svg class="w-4 h-4 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Entrance Touch Kiosk
            </a>

            <a routerLink="/service-management" class="px-6 py-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-bold text-sm shadow-sm transition-all hover:scale-105 active:scale-95 flex items-center gap-2">
              <span>🛠️ + Create Custom Desk</span>
            </a>

            <a routerLink="/login" class="px-6 py-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-sm transition-all flex items-center gap-2">
              <span>⚡ 1-Click Demo Logins</span>
            </a>
          </div>

          <!-- Customizable Service Desk Setup Showcase -->
          <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xl max-w-4xl mx-auto text-left">
            <div class="pb-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span class="text-xs font-bold text-brand-600 uppercase tracking-wider">Customizable Queue System</span>
                <h3 class="text-xl font-black text-slate-900 dark:text-white mt-1">Deploy Your Own Service Desks &amp; Counters</h3>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Any company, clinic, store, or office can define custom desks, assign token prefixes, and start counter service.
                </p>
              </div>
              <a routerLink="/service-management" class="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-sm shrink-0 flex items-center gap-1.5 self-start sm:self-auto">
                <span>+ Add Service Desk</span>
                <span>&rarr;</span>
              </a>
            </div>

            <!-- 3 Step Flow -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6">
              <div class="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                <div class="w-8 h-8 rounded-xl bg-brand-100 dark:bg-brand-950 text-brand-600 flex items-center justify-center font-bold text-sm mb-3">1</div>
                <h4 class="font-bold text-sm text-slate-900 dark:text-white mb-1">Define Service Details</h4>
                <p class="text-xs text-slate-500 leading-relaxed">
                  Provide your desk name, custom token code (e.g. <code>CS</code>, <code>PASS</code>), duration, and counter number.
                </p>
              </div>

              <div class="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                <div class="w-8 h-8 rounded-xl bg-brand-100 dark:bg-brand-950 text-brand-600 flex items-center justify-center font-bold text-sm mb-3">2</div>
                <h4 class="font-bold text-sm text-slate-900 dark:text-white mb-1">Launch Kiosk &amp; Posters</h4>
                <p class="text-xs text-slate-500 leading-relaxed">
                  Visitors touch your entrance kiosk or scan printed QR posters on their phone to receive an instant queue pass.
                </p>
              </div>

              <div class="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                <div class="w-8 h-8 rounded-xl bg-brand-100 dark:bg-brand-950 text-brand-600 flex items-center justify-center font-bold text-sm mb-3">3</div>
                <h4 class="font-bold text-sm text-slate-900 dark:text-white mb-1">Call Next &amp; Serve</h4>
                <p class="text-xs text-slate-500 leading-relaxed">
                  Desk staff click "Call Next" on their operator screen. Visitors receive real-time audio chimes and turn alerts.
                </p>
              </div>
            </div>

            <!-- Quick Live Test Bar -->
            <div class="mt-6 p-4 rounded-2xl bg-brand-50/60 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-900/60 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div class="flex items-center gap-3">
                <span class="text-2xl">🏛️</span>
                <div>
                  <div class="font-bold text-xs text-brand-900 dark:text-brand-100">Live Configured Organization: State Citizen Services Center</div>
                  <div class="text-[11px] text-brand-700/80 dark:text-brand-300/80">Window 1 active &bull; Passport &amp; Vehicle RTO Desks ready for testing</div>
                </div>
              </div>
              <div class="flex items-center gap-2 w-full sm:w-auto">
                <a routerLink="/services" class="flex-1 sm:flex-none text-center px-4 py-2 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-white font-bold text-xs border border-slate-200 dark:border-slate-800 hover:bg-slate-50 shadow-xs">
                  View Desks Directory
                </a>
                <a routerLink="/staff" class="flex-1 sm:flex-none text-center px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-xs">
                  Open Staff Console &rarr;
                </a>
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
export class LandingComponent implements OnInit {
  orgService = inject(OrganisationService);
  authService = inject(AuthService);
  geoService = inject(GeolocationService);
  private router = inject(Router);

  sectors: IndustrySector[] = [
    {
      id: 'government',
      slug: 'citizen-services',
      icon: '🏛️',
      name: 'Public & Government',
      subtitle: 'Passports, RTO, & civic bureaus',
      serviceLabel: 'Citizen Counter',
      tokenLabel: 'Application Token',
      counterLabel: 'Service Window',
      staffLabel: 'Passport Officer',
      sampleService: 'Passport Issuance & Renewal',
      sampleWaiting: 12,
      sampleToken: 'PASS-089'
    },
    {
      id: 'healthcare',
      slug: 'metro-health',
      icon: '🏥',
      name: 'Healthcare & Clinical',
      subtitle: 'Hospitals, triage, & diagnostics',
      serviceLabel: 'Clinic / Department',
      tokenLabel: 'Patient Token',
      counterLabel: 'Consultation Room',
      staffLabel: 'Doctor / Nurse',
      sampleService: 'General Outpatient Clinic (OPD)',
      sampleWaiting: 8,
      sampleToken: 'DOC-012'
    },
    {
      id: 'banking',
      slug: 'horizon-bank',
      icon: '🏦',
      name: 'Banking & Financial',
      subtitle: 'Retail branches & teller desks',
      serviceLabel: 'Counter Service',
      tokenLabel: 'Queue Token',
      counterLabel: 'Teller Window',
      staffLabel: 'Bank Teller',
      sampleService: 'Cash Deposit & Withdrawal',
      sampleWaiting: 5,
      sampleToken: 'CS-034'
    },
    {
      id: 'education',
      slug: 'central-univ',
      icon: '🎓',
      name: 'Higher Education',
      subtitle: 'Campus administration & exams',
      serviceLabel: 'Campus Service',
      tokenLabel: 'Student Token',
      counterLabel: 'Service Desk',
      staffLabel: 'Staff Operator',
      sampleService: 'College Administration Office',
      sampleWaiting: 3,
      sampleToken: 'ADM-005'
    }
  ];

  activeSectorId = signal<string>('government');
  simPeopleAhead = signal<number>(4);

  currentSector = computed<IndustrySector>(() => {
    return this.sectors.find(s => s.id === this.activeSectorId()) || this.sectors[0];
  });

  ngOnInit() {
    const current = this.orgService.currentOrganisation();
    if (current && current.type) {
      const match = this.sectors.find(s => s.id === current.type || s.slug === current.slug);
      if (match) {
        this.activeSectorId.set(match.id);
      }
    }
  }

  onSelectSector(sec: IndustrySector) {
    this.activeSectorId.set(sec.id);
    this.orgService.selectSector(sec.slug || sec.id);
  }

  openSectorWorkspace(sec: IndustrySector) {
    this.onSelectSector(sec);
    this.router.navigate(['/services'], { queryParams: { sector: sec.id } });
  }

  get demoResult() {
    return this.geoService.calculateShouldIGo(undefined, this.simPeopleAhead(), 8, 5, 4);
  }

  onSliderChange(event: Event) {
    const val = Number((event.target as HTMLInputElement).value);
    this.simPeopleAhead.set(val);
  }
}
