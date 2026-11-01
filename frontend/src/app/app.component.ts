import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { FooterComponent } from './shared/components/footer/footer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent, FooterComponent],
  template: `
    <div class="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 antialiased selection:bg-brand-500 selection:text-white">
      <!-- Navbar (Hidden in full-screen Kiosk mode) -->
      <app-navbar *ngIf="!isKioskMode()"></app-navbar>

      <!-- Main Router Outlet -->
      <main class="flex-1">
        <router-outlet></router-outlet>
      </main>

      <!-- Footer (Hidden in full-screen Kiosk mode) -->
      <app-footer *ngIf="!isKioskMode()"></app-footer>
    </div>
  `
})
export class AppComponent {
  private router = inject(Router);

  isKioskMode(): boolean {
    return this.router.url.startsWith('/kiosk');
  }
}
