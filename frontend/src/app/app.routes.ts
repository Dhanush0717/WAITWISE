import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/landing/landing.component').then(m => m.LandingComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'onboarding',
    loadComponent: () => import('./features/organisation-onboarding/organisation-onboarding.component').then(m => m.OrganisationOnboardingComponent)
  },
  {
    path: 'services',
    loadComponent: () => import('./features/customer/services-catalog.component').then(m => m.ServicesCatalogComponent)
  },
  {
    path: 'services/:id',
    loadComponent: () => import('./features/customer/service-detail.component').then(m => m.ServiceDetailComponent)
  },
  {
    path: 'ticket/:id',
    loadComponent: () => import('./features/customer/ticket-dashboard.component').then(m => m.TicketDashboardComponent)
  },
  {
    path: 'should-i-go',
    loadComponent: () => import('./features/customer/should-i-go.component').then(m => m.ShouldIGoComponent)
  },
  {
    path: 'kiosk',
    loadComponent: () => import('./features/kiosk/kiosk.component').then(m => m.KioskComponent)
  },
  {
    path: 'staff',
    canActivate: [authGuard, roleGuard(['staff', 'branch_manager', 'org_admin', 'super_admin'])],
    loadComponent: () => import('./features/staff/staff-dashboard.component').then(m => m.StaffDashboardComponent)
  },
  {
    path: 'dashboard',
    canActivate: [authGuard, roleGuard(['branch_manager', 'org_admin', 'super_admin'])],
    loadComponent: () => import('./features/organisation-dashboard/organisation-dashboard.component').then(m => m.OrganisationDashboardComponent)
  },
  {
    path: 'service-management',
    loadComponent: () => import('./features/service-management/service-management.component').then(m => m.ServiceManagementComponent)
  },
  {
    path: 'services-management',
    loadComponent: () => import('./features/service-management/service-management.component').then(m => m.ServiceManagementComponent)
  },
  {
    path: 'analytics',
    canActivate: [authGuard, roleGuard(['branch_manager', 'org_admin', 'super_admin'])],
    loadComponent: () => import('./features/analytics/analytics.component').then(m => m.AnalyticsComponent)
  },
  {
    path: '**',
    loadComponent: () => import('./features/not-found/not-found.component').then(m => m.NotFoundComponent)
  }
];
