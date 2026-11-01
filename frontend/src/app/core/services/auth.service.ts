import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap, catchError, map, of } from 'rxjs';
import { ApiService } from './api.service';
import { User, AuthResponse } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private api = inject(ApiService);
  private router = inject(Router);

  // Angular Signals
  currentUser = signal<User | null>(null);
  token = signal<string | null>(localStorage.getItem('waitwise_token'));
  isAuthenticated = computed(() => !!this.currentUser() && !!this.token());
  userRole = computed(() => this.currentUser()?.role || 'customer');
  isStaffOrAbove = computed(() => {
    const role = this.currentUser()?.role;
    return role === 'staff' || role === 'branch_manager' || role === 'org_admin' || role === 'super_admin';
  });
  isAdminOrAbove = computed(() => {
    const role = this.currentUser()?.role;
    return role === 'branch_manager' || role === 'org_admin' || role === 'super_admin';
  });

  constructor() {
    this.initAuth();
  }

  private initAuth() {
    const savedToken = localStorage.getItem('waitwise_token');
    const savedUser = localStorage.getItem('waitwise_user');
    if (savedToken && savedUser) {
      try {
        const parsedUser: User = JSON.parse(savedUser);
        this.currentUser.set(parsedUser);
        this.token.set(savedToken);
        // Verify with server in background
        this.fetchMe().subscribe();
      } catch (e) {
        this.logout();
      }
    }
  }

  login(credentials: { email: string; password: string }): Observable<AuthResponse> {
    return this.api.post<AuthResponse>('/auth/login', credentials).pipe(
      tap(res => {
        if (res && res.token && res.user) {
          this.setSession(res.token, res.user);
        }
      })
    );
  }

  register(userData: any): Observable<AuthResponse> {
    return this.api.post<AuthResponse>('/auth/register', userData).pipe(
      tap(res => {
        if (res && res.token && res.user) {
          this.setSession(res.token, res.user);
        }
      })
    );
  }

  fetchMe(): Observable<User | null> {
    return this.api.get<{ success: boolean; user: User }>('/auth/me').pipe(
      tap(res => {
        if (res && res.user) {
          this.currentUser.set(res.user);
          localStorage.setItem('waitwise_user', JSON.stringify(res.user));
          if (res.user.organisationId) {
            localStorage.setItem('waitwise_active_org_id', res.user.organisationId);
          }
        }
      }),
      map(res => res?.user || null),
      catchError(() => {
        this.logout();
        return of(null);
      })
    );
  }

  private setSession(token: string, user: User) {
    this.token.set(token);
    this.currentUser.set(user);
    localStorage.setItem('waitwise_token', token);
    localStorage.setItem('waitwise_user', JSON.stringify(user));
    if (user.organisationId) {
      localStorage.setItem('waitwise_active_org_id', user.organisationId);
    }
  }

  logout() {
    this.token.set(null);
    this.currentUser.set(null);
    localStorage.removeItem('waitwise_token');
    localStorage.removeItem('waitwise_user');
    this.router.navigate(['/login']);
  }
}
