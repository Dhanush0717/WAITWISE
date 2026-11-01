import { Component, inject, signal, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import * as L from 'leaflet';
import { QueueService } from '../../core/services/queue.service';
import { OrganisationService } from '../../core/services/organisation.service';
import { GeolocationService } from '../../core/services/geolocation.service';
import { Service } from '../../core/models/service.model';

@Component({
  selector: 'app-location-map',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      <div class="max-w-7xl mx-auto space-y-6">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-800 gap-4">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300">
                Facility &amp; Campus Map
              </span>
              <span class="text-xs text-slate-400 font-medium">
                {{ orgService.currentOrganisation()?.name }}
              </span>
            </div>
            <h1 class="text-3xl font-black text-slate-900 dark:text-white">
              Interactive Service Location Map
            </h1>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Visualize physical departments, live queue densities, and walking routes across the facility grounds.
            </p>
          </div>

          <!-- Legend -->
          <div class="flex items-center gap-3 bg-white dark:bg-slate-900 px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs shadow-xs">
            <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Low Load (&lt;3)</span>
            <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Moderate (3-7)</span>
            <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-rose-500"></span> High Crowd (&gt;7)</span>
          </div>
        </div>

        <!-- Map Container -->
        <div class="relative bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-lg h-[500px]">
          <div #mapContainer id="map" class="w-full h-full z-10"></div>
        </div>

        <!-- Service Cards Grid Below Map -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            *ngFor="let svc of services()"
            class="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <div>
              <div class="flex items-center gap-2">
                <span class="text-base">{{ svc.icon || '📌' }}</span>
                <h4 class="font-bold text-xs text-slate-900 dark:text-white">{{ svc.name }}</h4>
              </div>
              <p class="text-[11px] text-slate-400 mt-0.5">
                {{ svc.location.building || 'Main Block' }} &bull; Floor {{ svc.location.floor || 'G' }}
              </p>
            </div>

            <div class="flex items-center gap-2">
              <span
                [ngClass]="{
                  'bg-emerald-100 text-emerald-700': (svc.waitingCount || 0) < 3,
                  'bg-amber-100 text-amber-700': (svc.waitingCount || 0) >= 3 && (svc.waitingCount || 0) <= 7,
                  'bg-rose-100 text-rose-700': (svc.waitingCount || 0) > 7
                }"
                class="px-2 py-0.5 rounded-full font-mono text-[10px] font-bold">
                {{ svc.waitingCount || 0 }} in line
              </span>
              <a
                [routerLink]="['/services', svc._id || (svc | json)]"
                class="px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-xs">
                Join
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class LocationMapComponent implements OnInit, OnDestroy {
  queueService = inject(QueueService);
  orgService = inject(OrganisationService);
  geoService = inject(GeolocationService);
  private router = inject(Router);

  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef<HTMLDivElement>;

  services = signal<Service[]>([]);
  private map: L.Map | null = null;

  ngOnInit() {
    this.loadServices();
  }

  loadServices() {
    const orgId = this.orgService.currentOrganisation()?._id;
    this.queueService.getServices(orgId ? { organisationId: orgId } : undefined).subscribe({
      next: (svcs) => {
        this.services.set(svcs || []);
        this.initMap(svcs || []);
      }
    });
  }

  initMap(services: Service[]) {
    setTimeout(() => {
      if (this.map) return;

      // Center on facility grounds or first service location
      const defaultCenter: [number, number] = [28.6139, 77.2090];
      this.map = L.map(this.mapContainer.nativeElement).setView(defaultCenter, 15);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(this.map);

      // Add user position if available
      const userLoc = this.geoService.userLocation();
      if (userLoc) {
        const userIcon = L.divIcon({
          className: 'user-pin',
          html: `<div style="background-color: #3b82f6; width: 14px; height: 14px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(59,130,246,0.6);"></div>`,
          iconSize: [14, 14]
        });
        L.marker([userLoc.lat, userLoc.lng], { icon: userIcon })
          .addTo(this.map)
          .bindPopup('<b>Your Current Location</b>')
          .openPopup();
      }

      // Add service pins with dynamic load color
      services.forEach((s, idx) => {
        const lat = s.location?.coordinates?.lat || (28.6139 + (idx * 0.0015));
        const lng = s.location?.coordinates?.lng || (77.2090 + (idx * 0.0018));
        const waiting = s.waitingCount || 0;

        let pinColor = '#10b981'; // green
        if (waiting >= 3 && waiting <= 7) pinColor = '#f59e0b'; // amber
        if (waiting > 7) pinColor = '#ef4444'; // red

        const customIcon = L.divIcon({
          className: 'service-marker',
          html: `<div style="background-color: ${pinColor}; color: white; padding: 4px 8px; border-radius: 12px; font-weight: 800; font-size: 11px; border: 2px solid white; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.2); white-space: nowrap;">${s.code || 'SVC'}: ${waiting}</div>`,
          iconSize: [40, 20]
        });

        const marker = L.marker([lat, lng], { icon: customIcon }).addTo(this.map!);
        marker.bindPopup(`
          <div style="font-family: inherit; font-size: 12px; padding: 4px;">
            <strong style="display:block; font-size: 13px; color: #0f172a;">${s.name}</strong>
            <span style="color: #64748b;">${s.location?.building || 'Main Desk'}, Floor ${s.location?.floor || '1'}</span>
            <div style="margin-top: 6px; font-weight: bold; color: ${pinColor};">Waiting: ${waiting} &bull; Est. wait: ${waiting * (s.avgServiceDuration || 8)}m</div>
          </div>
        `);
      });
    }, 150);
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }
}
