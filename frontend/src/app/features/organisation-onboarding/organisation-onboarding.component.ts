import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { OrganisationService } from '../../core/services/organisation.service';
import { AuthService } from '../../core/services/auth.service';
import { OrganisationType } from '../../core/models/organisation.model';

@Component({
  selector: 'app-organisation-onboarding',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="min-h-[calc(100vh-4rem)] p-4 sm:p-8 bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
      <div class="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 sm:p-10">
        <!-- Progress Stepper -->
        <div class="mb-8">
          <div class="flex items-center justify-between">
            <div *ngFor="let s of [1, 2, 3]; let i = index" class="flex items-center gap-2">
              <div
                [ngClass]="step() >= s 
                  ? 'bg-brand-600 text-white' 
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500'"
                class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs">
                {{ s }}
              </div>
              <span class="text-xs font-semibold text-slate-700 dark:text-slate-300 hidden sm:inline">
                {{ s === 1 ? 'Organization' : s === 2 ? 'Branch & Facility' : 'Terminology & Admin' }}
              </span>
              <div *ngIf="i < 2" class="w-12 sm:w-20 h-0.5 bg-slate-200 dark:bg-slate-800 mx-1"></div>
            </div>
          </div>
        </div>

        <!-- Step 1: Organisation Details -->
        <div *ngIf="step() === 1" class="space-y-5">
          <div>
            <h2 class="text-2xl font-black text-slate-900 dark:text-white">Register Your Organisation</h2>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Set up your independent multi-tenant workspace on WaitWise
            </p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="sm:col-span-2">
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Organisation Name *</label>
              <input
                type="text"
                [(ngModel)]="orgName"
                placeholder="e.g. Apex Health Clinic or Summit Credit Union"
                class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Industry / Category *</label>
              <select
                [(ngModel)]="orgType"
                (ngModelChange)="onTypeChange()"
                class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500">
                <option value="healthcare">🏥 Healthcare & Clinics</option>
                <option value="banking">🏦 Banking & Finance</option>
                <option value="government">🏛️ Government & Public Services</option>
                <option value="education">🎓 Education & Universities</option>
                <option value="retail">🛍️ Retail & Service Centers</option>
                <option value="hospitality">🏨 Hospitality & Travel</option>
                <option value="corporate">🏢 Corporate HQ & Facilities</option>
                <option value="other">⚡ Other Multi-Service Center</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Contact Email *</label>
              <input
                type="email"
                [(ngModel)]="contactEmail"
                placeholder="admin@organisation.com"
                class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div class="sm:col-span-2">
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Brief Description</label>
              <textarea
                [(ngModel)]="orgDescription"
                rows="2"
                placeholder="Tell visitors about your facility and services..."
                class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500"></textarea>
            </div>
          </div>

          <div class="flex justify-end pt-4">
            <button
              (click)="step.set(2)"
              [disabled]="!orgName || !contactEmail"
              class="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs disabled:opacity-50">
              Continue to Facility Details &rarr;
            </button>
          </div>
        </div>

        <!-- Step 2: Primary Branch Details -->
        <div *ngIf="step() === 2" class="space-y-5">
          <div>
            <h2 class="text-2xl font-black text-slate-900 dark:text-white">Main Branch / Campus Facility</h2>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Configure your primary location where counters operate
            </p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Branch Name *</label>
              <input
                type="text"
                [(ngModel)]="branchName"
                placeholder="e.g. Main City Branch"
                class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Branch Code *</label>
              <input
                type="text"
                [(ngModel)]="branchCode"
                placeholder="e.g. MAIN-01"
                class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">City / Location</label>
              <input
                type="text"
                [(ngModel)]="branchCity"
                placeholder="e.g. Metro City"
                class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Street Address</label>
              <input
                type="text"
                [(ngModel)]="branchStreet"
                placeholder="e.g. 100 Civic Center Blvd"
                class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div class="flex justify-between pt-4">
            <button
              (click)="step.set(1)"
              class="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs">
              &larr; Back
            </button>
            <button
              (click)="step.set(3)"
              [disabled]="!branchName || !branchCode"
              class="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs disabled:opacity-50">
              Continue to Terminology &rarr;
            </button>
          </div>
        </div>

        <!-- Step 3: Dynamic Terminology & Completion -->
        <div *ngIf="step() === 3" class="space-y-5">
          <div>
            <h2 class="text-2xl font-black text-slate-900 dark:text-white">Terminology &amp; Configuration</h2>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Custom terms for your organization's specific workflows
            </p>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-xs">
            <div>
              <label class="block font-semibold text-slate-500 mb-1">Service Label</label>
              <input type="text" [(ngModel)]="serviceLabel" class="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold" />
            </div>
            <div>
              <label class="block font-semibold text-slate-500 mb-1">Token Label</label>
              <input type="text" [(ngModel)]="tokenLabel" class="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold" />
            </div>
            <div>
              <label class="block font-semibold text-slate-500 mb-1">Counter Label</label>
              <input type="text" [(ngModel)]="counterLabel" class="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold" />
            </div>
            <div>
              <label class="block font-semibold text-slate-500 mb-1">Customer Label</label>
              <input type="text" [(ngModel)]="customerLabel" class="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold" />
            </div>
            <div>
              <label class="block font-semibold text-slate-500 mb-1">Staff Label</label>
              <input type="text" [(ngModel)]="staffLabel" class="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold" />
            </div>
            <div>
              <label class="block font-semibold text-slate-500 mb-1">Facility Label</label>
              <input type="text" [(ngModel)]="branchLabel" class="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold" />
            </div>
          </div>

          <div *ngIf="errorMessage()" class="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold">
            {{ errorMessage() }}
          </div>

          <div class="flex justify-between pt-4">
            <button
              (click)="step.set(2)"
              class="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs">
              &larr; Back
            </button>
            <button
              (click)="submitOnboarding()"
              [disabled]="isLoading()"
              class="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/20 disabled:opacity-50 flex items-center gap-2">
              <span *ngIf="isLoading()" class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              <span>Complete Setup &amp; Launch</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class OrganisationOnboardingComponent {
  private orgService = inject(OrganisationService);
  private router = inject(Router);

  step = signal(1);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  orgName = '';
  orgType: OrganisationType = 'healthcare';
  contactEmail = '';
  orgDescription = '';

  branchName = 'Main Facility Branch';
  branchCode = 'MAIN-01';
  branchCity = '';
  branchStreet = '';

  serviceLabel = 'Specialty / Clinic';
  tokenLabel = 'Patient Token';
  counterLabel = 'Consultation Room';
  customerLabel = 'Patient';
  staffLabel = 'Doctor / Nurse';
  branchLabel = 'Hospital Facility';

  onTypeChange() {
    switch (this.orgType) {
      case 'healthcare':
        this.serviceLabel = 'Specialty / Clinic';
        this.tokenLabel = 'Patient Token';
        this.counterLabel = 'Consultation Room';
        this.customerLabel = 'Patient';
        this.staffLabel = 'Doctor / Nurse';
        this.branchLabel = 'Hospital Facility';
        break;
      case 'banking':
        this.serviceLabel = 'Counter Service';
        this.tokenLabel = 'Queue Token';
        this.counterLabel = 'Teller Window';
        this.customerLabel = 'Bank Customer';
        this.staffLabel = 'Teller / Officer';
        this.branchLabel = 'Bank Branch';
        break;
      case 'government':
        this.serviceLabel = 'Citizen Counter';
        this.tokenLabel = 'Application Token';
        this.counterLabel = 'Officer Desk';
        this.customerLabel = 'Citizen / Applicant';
        this.staffLabel = 'Service Officer';
        this.branchLabel = 'Public Office';
        break;
      case 'education':
        this.serviceLabel = 'Campus Service';
        this.tokenLabel = 'Student Token';
        this.counterLabel = 'Service Desk';
        this.customerLabel = 'Student / Staff';
        this.staffLabel = 'Administrator';
        this.branchLabel = 'Campus Center';
        break;
      case 'retail':
        this.serviceLabel = 'Service Desk';
        this.tokenLabel = 'Order Token';
        this.counterLabel = 'Pick-up Counter';
        this.customerLabel = 'Customer';
        this.staffLabel = 'Store Associate';
        this.branchLabel = 'Store Location';
        break;
      default:
        this.serviceLabel = 'Service Desk';
        this.tokenLabel = 'Token';
        this.counterLabel = 'Counter';
        this.customerLabel = 'Visitor';
        this.staffLabel = 'Staff';
        this.branchLabel = 'Facility Branch';
        break;
    }
  }

  submitOnboarding() {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const payload = {
      name: this.orgName,
      type: this.orgType,
      description: this.orgDescription,
      contact: { email: this.contactEmail },
      terminology: {
        serviceLabel: this.serviceLabel,
        tokenLabel: this.tokenLabel,
        counterLabel: this.counterLabel,
        customerLabel: this.customerLabel,
        staffLabel: this.staffLabel,
        branchLabel: this.branchLabel
      }
    };

    this.orgService.createOrganisation(payload).subscribe({
      next: (createdOrg) => {
        const orgId = createdOrg._id || (createdOrg as any).id;
        // Create initial branch
        this.orgService.createBranch(orgId, {
          name: this.branchName,
          code: this.branchCode,
          address: { street: this.branchStreet, city: this.branchCity }
        }).subscribe({
          next: () => {
            this.isLoading.set(false);
            this.router.navigate(['/services']);
          },
          error: () => {
            this.isLoading.set(false);
            this.router.navigate(['/services']);
          }
        });
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'Could not register organization. Please check fields.');
      }
    });
  }
}
