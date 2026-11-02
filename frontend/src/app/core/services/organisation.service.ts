import { Injectable, signal, computed, inject } from '@angular/core';
import { Observable, tap, map } from 'rxjs';
import { ApiService } from './api.service';
import { Organisation, OrganisationTerminology } from '../models/organisation.model';
import { Branch } from '../models/branch.model';

@Injectable({
  providedIn: 'root'
})
export class OrganisationService {
  private api = inject(ApiService);

  organisations = signal<Organisation[]>([]);
  currentOrganisation = signal<Organisation | null>(null);
  branches = signal<Branch[]>([]);
  isLoading = signal<boolean>(false);
  private pendingSector: string | null = null;

  // Dynamic Multi-Industry Terminology Computeds
  terminology = computed<OrganisationTerminology>(() => {
    const org = this.currentOrganisation();
    return org?.terminology || {
      serviceLabel: 'Service',
      branchLabel: 'Branch / Facility',
      tokenLabel: 'Token',
      customerLabel: 'Visitor / Customer',
      staffLabel: 'Staff / Operator',
      counterLabel: 'Counter / Desk'
    };
  });

  serviceLabel = computed(() => this.terminology().serviceLabel);
  branchLabel = computed(() => this.terminology().branchLabel);
  tokenLabel = computed(() => this.terminology().tokenLabel);
  customerLabel = computed(() => this.terminology().customerLabel);
  staffLabel = computed(() => this.terminology().staffLabel);
  counterLabel = computed(() => this.terminology().counterLabel);

  constructor() {
    this.initOrganisation();
  }

  private initOrganisation() {
    this.loadOrganisations().subscribe();
  }

  loadOrganisations(): Observable<Organisation[]> {
    this.isLoading.set(true);
    return this.api.get<any>('/organisations').pipe(
      map(res => (res && res.data) ? res.data : (Array.isArray(res) ? res : [])),
      tap((orgs: Organisation[]) => {
        this.isLoading.set(false);
        this.organisations.set(orgs || []);
        
        // If a sector was queued while loading, activate it
        if (this.pendingSector && orgs && orgs.length > 0) {
          const match = orgs.find(o => o.slug === this.pendingSector || o.type === this.pendingSector);
          if (match) {
            this.pendingSector = null;
            this.setOrganisation(match);
            return;
          }
        }

        // Restore last chosen org from local storage, or default to first
        const savedOrgId = localStorage.getItem('waitwise_active_org_id');
        if (savedOrgId && orgs && orgs.length > 0) {
          const found = orgs.find(o => o._id === savedOrgId || (o as any).id === savedOrgId || o.slug === savedOrgId);
          if (found) {
            this.setOrganisation(found);
            return;
          }
        }
        if (orgs && orgs.length > 0 && !this.currentOrganisation()) {
          const govtOrg = orgs.find(o => o.slug === 'citizen-services' || o.type === 'government') || orgs[0];
          this.setOrganisation(govtOrg);
        }
      })
    );
  }

  selectSector(slugOrType: string): Organisation | null {
    const orgs = this.organisations();
    if (orgs && orgs.length > 0) {
      const found = orgs.find(o => o.slug === slugOrType || o.type === slugOrType || o._id === slugOrType);
      if (found) {
        this.setOrganisation(found);
        return found;
      }
    }
    // Queue pending sector if data hasn't arrived yet
    this.pendingSector = slugOrType;
    return null;
  }

  setOrganisation(org: Organisation) {
    this.currentOrganisation.set(org);
    const id = org._id || (org as any).id;
    localStorage.setItem('waitwise_active_org_id', id);
    this.loadBranches(id).subscribe();
  }

  loadBranches(orgId: string): Observable<Branch[]> {
    return this.api.get<any>(`/organisations/${orgId}/branches`).pipe(
      map(res => (res && res.data) ? res.data : (Array.isArray(res) ? res : [])),
      tap(branches => this.branches.set(branches || []))
    );
  }

  createOrganisation(data: any): Observable<Organisation> {
    return this.api.post<any>('/organisations', data).pipe(
      map(res => (res && res.data) ? res.data : res),
      tap(newOrg => {
        this.organisations.update(list => [...list, newOrg]);
        this.setOrganisation(newOrg);
      })
    );
  }

  createBranch(orgId: string, data: any): Observable<Branch> {
    return this.api.post<any>(`/organisations/${orgId}/branches`, data).pipe(
      map(res => (res && res.data) ? res.data : res),
      tap(newBranch => {
        this.branches.update(list => [...list, newBranch]);
      })
    );
  }
}
