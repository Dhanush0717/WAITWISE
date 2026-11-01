import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../core/services/notification.service';
import { NotificationItem } from '../../../core/models/notification.model';

@Component({
  selector: 'app-notification-dropdown',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative">
      <!-- Bell Button -->
      <button
        type="button"
        (click)="isOpen.set(!isOpen())"
        class="relative p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none"
        title="Notifications">
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>

        <span
          *ngIf="notificationService.unreadCount() > 0"
          class="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-slate-900 animate-pulse">
          {{ notificationService.unreadCount() }}
        </span>
      </button>

      <!-- Dropdown Popup -->
      <div
        *ngIf="isOpen()"
        class="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden animate-fade-in">
        <!-- Header -->
        <div class="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div class="flex items-center gap-2">
            <span class="font-bold text-sm text-slate-900 dark:text-white">Live Notifications</span>
            <span class="px-2 py-0.5 text-xs font-semibold rounded-full bg-brand-100 dark:bg-brand-900/60 text-brand-700 dark:text-brand-300">
              {{ notificationService.unreadCount() }} new
            </span>
          </div>
          <button
            *ngIf="notificationService.unreadCount() > 0"
            (click)="notificationService.markAllAsRead().subscribe()"
            class="text-xs text-brand-600 dark:text-brand-400 hover:underline font-medium">
            Mark all read
          </button>
        </div>

        <!-- Push Permission Prompt -->
        <div
          *ngIf="!notificationService.hasBrowserPermission()"
          class="p-3 bg-brand-50/70 dark:bg-brand-950/40 border-b border-brand-100 dark:border-brand-900/50 flex items-center justify-between gap-2">
          <div class="text-[11px] text-brand-900 dark:text-brand-300 leading-tight">
            Enable desktop notifications for audio and queue alert popups.
          </div>
          <button
            (click)="notificationService.requestBrowserPermission()"
            class="px-2.5 py-1 text-xs font-semibold rounded-lg bg-brand-600 text-white hover:bg-brand-700 whitespace-nowrap shadow-xs">
            Enable
          </button>
        </div>

        <!-- Notification List -->
        <div class="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
          <div
            *ngFor="let item of notificationService.notifications()"
            (click)="onItemClick(item)"
            [class.bg-brand-50]="!item.isRead"
            class="p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors flex items-start gap-3">
            <!-- Icon -->
            <div
              [ngClass]="getBadgeClass(item.type)"
              class="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
              <svg *ngIf="item.type === 'YOUR_TURN'" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
              <svg *ngIf="item.type !== 'YOUR_TURN'" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            <!-- Content -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between gap-1">
                <p class="text-xs font-bold text-slate-900 dark:text-white truncate">{{ item.title }}</p>
                <span class="text-[10px] text-slate-400 shrink-0">{{ item.createdAt | date:'shortTime' }}</span>
              </div>
              <p class="text-xs text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-2 leading-relaxed">{{ item.message }}</p>
            </div>

            <!-- Dot -->
            <span *ngIf="!item.isRead" class="w-2 h-2 rounded-full bg-brand-500 shrink-0 mt-1.5"></span>
          </div>

          <div *ngIf="notificationService.notifications().length === 0" class="py-10 text-center text-slate-400">
            <svg class="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p class="text-xs font-medium">No alerts right now</p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class NotificationDropdownComponent implements OnInit {
  public notificationService: NotificationService = inject(NotificationService);
  isOpen = signal<boolean>(false);

  ngOnInit() {
    this.notificationService.fetchNotifications().subscribe();
  }

  getBadgeClass(type: string): string {
    if (type === 'YOUR_TURN') return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400';
    if (type === 'TURN_APPROACHING') return 'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400';
    if (type === 'ALERT') return 'bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400';
    return 'bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400';
  }

  onItemClick(item: NotificationItem) {
    if (!item.isRead) {
      const id = item._id || (item as any).id;
      this.notificationService.markAsRead(id).subscribe();
    }
    this.isOpen.set(false);
  }
}
