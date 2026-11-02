import { Injectable, signal, computed, inject } from '@angular/core';
import { Observable, tap, map } from 'rxjs';
import { ApiService } from './api.service';
import { SocketService } from './socket.service';
import { AudioService } from '../../shared/components/audio-chime/audio.service';
import { NotificationItem } from '../models/notification.model';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private api = inject(ApiService);
  private socket = inject(SocketService);
  private audio = inject(AudioService);

  notifications = signal<NotificationItem[]>([]);
  unreadCount = computed(() => {
    const list = this.notifications();
    return Array.isArray(list) ? list.filter(n => !n.isRead).length : 0;
  });
  hasBrowserPermission = signal<boolean>(
    typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted'
  );

  constructor() {
    this.listenToSocketNotifications();
  }

  private listenToSocketNotifications() {
    this.socket.notification$.subscribe((notification: NotificationItem) => {
      this.notifications.update(prev => [notification, ...(Array.isArray(prev) ? prev : [])]);
      this.audio.playChime();
      this.showBrowserNotification(notification.title, notification.message);
    });
  }

  requestBrowserPermission() {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      Notification.requestPermission().then(permission => {
        this.hasBrowserPermission.set(permission === 'granted');
      });
    }
  }

  showBrowserNotification(title: string, body: string) {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/favicon.ico',
          badge: '/favicon.ico'
        });
      } catch (e) {
        console.warn('Browser notification error:', e);
      }
    }
  }

  fetchNotifications(): Observable<NotificationItem[]> {
    return this.api.get<any>('/notifications').pipe(
      map(res => (res && Array.isArray(res.data)) ? res.data : (Array.isArray(res) ? res : [])),
      tap(list => this.notifications.set(Array.isArray(list) ? list : []))
    );
  }

  markAsRead(notificationId: string): Observable<any> {
    return this.api.patch(`/notifications/${notificationId}/read`, {}).pipe(
      tap(() => {
        this.notifications.update(list =>
          Array.isArray(list) ? list.map(n => (n._id === notificationId || (n as any).id === notificationId ? { ...n, isRead: true } : n)) : []
        );
      })
    );
  }

  markAllAsRead(): Observable<any> {
    return this.api.patch('/notifications/read-all', {}).pipe(
      tap(() => {
        this.notifications.update(list => Array.isArray(list) ? list.map(n => ({ ...n, isRead: true })) : []);
      })
    );
  }
}
