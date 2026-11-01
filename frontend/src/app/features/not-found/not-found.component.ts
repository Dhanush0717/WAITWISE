import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-[calc(100vh-8rem)] flex items-center justify-center p-6 text-center bg-slate-50 dark:bg-slate-950">
      <div class="max-w-md">
        <div class="text-7xl font-mono font-black text-brand-600 mb-2">404</div>
        <h2 class="text-2xl font-black text-slate-900 dark:text-white mb-2">Queue Not Found</h2>
        <p class="text-xs text-slate-500 mb-6">
          The requested service page, ticket URL, or route does not exist or has expired.
        </p>
        <a routerLink="/" class="px-6 py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md transition-all">
          Return to WaitWise Home &rarr;
        </a>
      </div>
    </div>
  `
})
export class NotFoundComponent {}
