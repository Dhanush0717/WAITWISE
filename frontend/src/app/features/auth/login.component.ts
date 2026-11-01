import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
      <div class="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-8">
        <!-- Header -->
        <div class="text-center mb-8">
          <div class="w-12 h-12 rounded-2xl bg-brand-600 text-white font-black text-xl flex items-center justify-center mx-auto mb-3 shadow-md shadow-brand-500/20">
            W
          </div>
          <h2 class="text-2xl font-black text-slate-900 dark:text-white">Sign In to WaitWise</h2>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Universal Smart Queue &amp; Crowd Management Platform
          </p>
        </div>

        <!-- Error Message -->
        <div *ngIf="errorMessage()" class="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
          <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{{ errorMessage() }}</span>
        </div>

        <!-- Login Form -->
        <form (ngSubmit)="handleLogin()" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
            <input
              type="email"
              [(ngModel)]="email"
              name="email"
              required
              placeholder="name@organization.com"
              class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Password</label>
            <input
              type="password"
              [(ngModel)]="password"
              name="password"
              required
              placeholder="••••••••"
              class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
          </div>

          <button
            type="submit"
            [disabled]="isLoading() || !email || !password"
            class="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-md shadow-brand-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
            <span *ngIf="isLoading()" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            <span>Sign In</span>
          </button>
        </form>

        <!-- 1-Click Multi-Role Demo Logins -->
        <div class="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">⚡ 1-Click Demo Accounts</span>
            <span class="text-[10px] text-slate-400">Instant test login</span>
          </div>

          <div class="grid grid-cols-2 gap-2 text-xs">
            <button
              (click)="quickLogin('superadmin@waitwise.io', 'admin123')"
              class="p-2 text-left rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors">
              <div class="font-bold text-purple-600 dark:text-purple-400">🛡️ Super Admin</div>
              <div class="text-[10px] text-slate-400 truncate">superadmin&#64;waitwise.io</div>
            </button>

            <button
              (click)="quickLogin('doctor@metrohealth.org', 'staff123')"
              class="p-2 text-left rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors">
              <div class="font-bold text-rose-600 dark:text-rose-400">🏥 Hospital Doctor</div>
              <div class="text-[10px] text-slate-400 truncate">doctor&#64;metrohealth.org</div>
            </button>

            <button
              (click)="quickLogin('teller@horizonbank.com', 'staff123')"
              class="p-2 text-left rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors">
              <div class="font-bold text-emerald-600 dark:text-emerald-400">🏦 Bank Teller</div>
              <div class="text-[10px] text-slate-400 truncate">teller&#64;horizonbank.com</div>
            </button>

            <button
              (click)="quickLogin('clerk@citizenservices.gov', 'staff123')"
              class="p-2 text-left rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors">
              <div class="font-bold text-blue-600 dark:text-blue-400">🏛️ Passport Clerk</div>
              <div class="text-[10px] text-slate-400 truncate">clerk&#64;citizenservices.gov</div>
            </button>

            <button
              (click)="quickLogin('staff.admin@waitwise.campus', 'staff123')"
              class="p-2 text-left rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors">
              <div class="font-bold text-amber-600 dark:text-amber-400">🎓 University Staff</div>
              <div class="text-[10px] text-slate-400 truncate">staff.admin&#64;waitwise.campus</div>
            </button>

            <button
              (click)="quickLogin('student@waitwise.campus', 'student123')"
              class="p-2 text-left rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors">
              <div class="font-bold text-slate-700 dark:text-slate-300">👤 Visitor / Student</div>
              <div class="text-[10px] text-slate-400 truncate">student&#64;waitwise.campus</div>
            </button>
          </div>
        </div>

        <!-- Footer Links -->
        <div class="mt-6 text-center text-xs text-slate-500">
          Don't have an account?
          <a routerLink="/register" class="text-brand-600 hover:underline font-bold">Register as Visitor</a>
          or
          <a routerLink="/onboarding" class="text-brand-600 hover:underline font-bold">Register Organisation</a>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  email = '';
  password = '';
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  handleLogin() {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        const returnUrl = this.route.snapshot.queryParams['returnUrl'];
        if (returnUrl) {
          this.router.navigateByUrl(returnUrl);
        } else if (res.user.role === 'staff') {
          this.router.navigate(['/staff']);
        } else if (['org_admin', 'super_admin', 'branch_manager'].includes(res.user.role)) {
          this.router.navigate(['/dashboard']);
        } else {
          this.router.navigate(['/services']);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'Invalid email or password. Please try again.');
      }
    });
  }

  quickLogin(email: string, pass: string) {
    this.email = email;
    this.password = pass;
    this.handleLogin();
  }
}
