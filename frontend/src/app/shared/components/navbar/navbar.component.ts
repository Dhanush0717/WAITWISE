import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { OrganisationService } from '../../../core/services/organisation.service';
import { QueueService } from '../../../core/services/queue.service';
import { SocketService } from '../../../core/services/socket.service';
import { NotificationDropdownComponent } from '../notification-dropdown/notification-dropdown.component';
import { QrScannerModalComponent } from '../qr-scanner-modal/qr-scanner-modal.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, NotificationDropdownComponent, QrScannerModalComponent],
  template: `
    <header class="sticky top-0 z-40 w-full backdrop-blur-md bg-white/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16 gap-3">
          <!-- Logo & Brand -->
          <div class="flex items-center gap-3 shrink-0">
            <a routerLink="/" class="flex items-center gap-2.5 group">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
                <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div class="flex flex-col">
                <div class="flex items-center gap-1.5">
                  <span class="text-xl font-black tracking-tight text-slate-900 dark:text-white font-sans">WAIT<span class="text-brand-600">WISE</span></span>
                  <span class="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 uppercase tracking-widest border border-brand-200 dark:border-brand-800">
                    2.0
                  </span>
                </div>
                <span class="text-[10px] font-medium text-slate-500 dark:text-slate-400 hidden sm:inline -mt-1">Universal Queue Platform</span>
              </div>
            </a>

            <!-- Socket Connection Indicator -->
            <div class="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border"
              [ngClass]="socketService.isConnected() ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60' : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60'">
              <span class="w-2 h-2 rounded-full"
                [ngClass]="socketService.isConnected() ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'"></span>
              <span>{{ socketService.isConnected() ? 'Live Sync' : 'Connecting' }}</span>
            </div>
          </div>

          <!-- Dynamic Organisation Switcher -->
          <div class="relative hidden lg:block" *ngIf="orgService.organisations().length > 0">
            <button
              (click)="isOrgDropdownOpen.set(!isOrgDropdownOpen())"
              class="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors">
              <span class="w-2 h-2 rounded-full"
                [ngClass]="{
                  'bg-rose-500': orgService.currentOrganisation()?.type === 'healthcare',
                  'bg-emerald-500': orgService.currentOrganisation()?.type === 'banking',
                  'bg-blue-500': orgService.currentOrganisation()?.type === 'government',
                  'bg-purple-500': orgService.currentOrganisation()?.type === 'education',
                  'bg-indigo-500': !orgService.currentOrganisation()?.type
                }">
              </span>
              <span class="truncate max-w-[180px]">{{ orgService.currentOrganisation()?.name || 'Select Organisation' }}</span>
              <svg class="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <!-- Org Selector Dropdown -->
            <div
              *ngIf="isOrgDropdownOpen()"
              class="absolute left-0 mt-2 w-72 rounded-2xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50">
              <div class="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Select Active Organization
              </div>
              <button
                *ngFor="let org of orgService.organisations()"
                (click)="selectOrg(org)"
                class="w-full px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between text-xs transition-colors"
                [class.bg-brand-50]="orgService.currentOrganisation()?._id === org._id">
                <div>
                  <div class="font-bold text-slate-900 dark:text-white">{{ org.name }}</div>
                  <div class="text-[10px] text-slate-500 capitalize">{{ org.type }} &bull; {{ org.terminology.serviceLabel || 'Service' }}s</div>
                </div>
                <span *ngIf="orgService.currentOrganisation()?._id === org._id" class="text-brand-600 font-bold text-xs">Active</span>
              </button>
              <div class="border-t border-slate-100 dark:border-slate-800 mt-2 pt-1.5 px-3">
                <a routerLink="/onboarding" (click)="isOrgDropdownOpen.set(false)" class="text-xs text-brand-600 hover:underline font-semibold block py-1">
                  + Register New Organisation
                </a>
              </div>
            </div>
          </div>

          <!-- Navigation Links -->
          <nav class="hidden md:flex items-center gap-1">
            <a routerLink="/services" routerLinkActive="text-brand-600 bg-brand-50 dark:bg-brand-950/60 dark:text-brand-400" [routerLinkActiveOptions]="{ exact: true }"
              class="px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              {{ orgService.serviceLabel() }} Directory
            </a>

            <a routerLink="/service-management" routerLinkActive="text-brand-600 bg-brand-50 dark:bg-brand-950/60 dark:text-brand-400"
              class="px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              Manage Desks
            </a>

            <a routerLink="/kiosk" target="_blank"
              class="px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1">
              <span>Kiosk Mode</span>
              <svg class="w-3 h-3 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>

            <!-- Staff Desk (if staff+) -->
            <a *ngIf="authService.isStaffOrAbove()" routerLink="/staff" routerLinkActive="text-brand-600 bg-brand-50 dark:bg-brand-950/60 dark:text-brand-400"
              class="px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              Operator Station
            </a>

            <!-- Admin Command Dashboard (if admin+) -->
            <a *ngIf="authService.isAdminOrAbove()" routerLink="/dashboard" routerLinkActive="text-brand-600 bg-brand-50 dark:bg-brand-950/60 dark:text-brand-400"
              class="px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              Org Command
            </a>

            <!-- Analytics & Simulator (if admin+) -->
            <a *ngIf="authService.isAdminOrAbove()" routerLink="/analytics" routerLinkActive="text-brand-600 bg-brand-50 dark:bg-brand-950/60 dark:text-brand-400"
              class="px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              Analytics & Sim
            </a>
          </nav>

          <!-- Right Action Bar -->
          <div class="flex items-center gap-2">
            <!-- Active Ticket Pill -->
            <a
              *ngIf="queueService.activeTicket()"
              [routerLink]="['/ticket', getActiveTicketId()]"
              class="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-brand-500 to-indigo-600 text-white font-mono text-xs font-bold shadow-md shadow-brand-500/20 hover:opacity-95 transition-all animate-pulse">
              <span>🎟️ {{ queueService.activeTicket()?.ticketNumber }}</span>
              <span class="text-[10px] bg-white/20 px-1.5 py-0.5 rounded">
                {{ queueService.activeTicket()?.status }}
              </span>
            </a>

            <!-- QR Scanner Button -->
            <button
              (click)="isScannerOpen.set(true)"
              class="p-2 text-slate-600 dark:text-slate-300 hover:text-brand-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Scan QR Code">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </button>

            <!-- Notifications Dropdown -->
            <app-notification-dropdown></app-notification-dropdown>

            <!-- User Auth Profile -->
            <div *ngIf="authService.isAuthenticated(); else authButtons" class="relative">
              <button
                (click)="isUserMenuOpen.set(!isUserMenuOpen())"
                class="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <div class="w-7 h-7 rounded-lg bg-brand-600 text-white font-bold text-xs flex items-center justify-center">
                  {{ authService.currentUser()?.name?.charAt(0) || 'U' }}
                </div>
                <div class="text-left hidden sm:block">
                  <div class="text-xs font-bold text-slate-800 dark:text-white leading-tight">
                    {{ authService.currentUser()?.name }}
                  </div>
                  <div class="text-[10px] text-slate-500 font-medium capitalize">
                    {{ authService.currentUser()?.role?.replace('_', ' ') }}
                  </div>
                </div>
              </button>

              <!-- User Menu Dropdown -->
              <div
                *ngIf="isUserMenuOpen()"
                class="absolute right-0 mt-2 w-48 rounded-2xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50">
                <div class="px-3 py-1 text-xs text-slate-400 font-semibold border-b border-slate-100 dark:border-slate-800 mb-1">
                  {{ authService.currentUser()?.email }}
                </div>
                <button
                  (click)="handleLogout()"
                  class="w-full px-3 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 font-semibold transition-colors">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign Out
                </button>
              </div>
            </div>

            <ng-template #authButtons>
              <div class="flex items-center gap-2">
                <a routerLink="/login" class="px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-brand-600 transition-colors">
                  Sign In
                </a>
                <a routerLink="/register" class="px-3 py-1.5 text-xs font-bold rounded-xl bg-brand-600 hover:bg-brand-700 text-white shadow-xs transition-all">
                  Join Queue
                </a>
              </div>
            </ng-template>
          </div>
        </div>
      </div>

      <!-- QR Scanner Modal -->
      <app-qr-scanner-modal
        *ngIf="isScannerOpen()"
        (scanned)="onQrScanned($event)"
        (close)="isScannerOpen.set(false)">
      </app-qr-scanner-modal>
    </header>
  `
})
export class NavbarComponent {
  public authService: AuthService = inject(AuthService);
  public orgService: OrganisationService = inject(OrganisationService);
  public queueService: QueueService = inject(QueueService);
  public socketService: SocketService = inject(SocketService);
  private router: Router = inject(Router);

  isScannerOpen = signal<boolean>(false);
  isOrgDropdownOpen = signal<boolean>(false);
  isUserMenuOpen = signal<boolean>(false);

  getActiveTicketId(): string {
    const t = this.queueService.activeTicket();
    return t ? (t._id || (t as any).id || '') : '';
  }

  selectOrg(org: any) {
    this.orgService.setOrganisation(org);
    this.isOrgDropdownOpen.set(false);
  }

  handleLogout() {
    this.isUserMenuOpen.set(false);
    this.authService.logout();
  }

  onQrScanned(code: string) {
    this.isScannerOpen.set(false);
    if (code.includes('-') || code.length === 24) {
      this.router.navigate(['/ticket', code]);
    } else {
      this.router.navigate(['/services', code]);
    }
  }
}
