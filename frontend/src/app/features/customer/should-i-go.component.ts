import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { GeolocationService, ShouldIGoResult } from '../../core/services/geolocation.service';
import { QueueService } from '../../core/services/queue.service';
import { OrganisationService } from '../../core/services/organisation.service';

@Component({
  selector: 'app-should-i-go',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 px-4 sm:px-6 lg:px-8">
      <div class="max-w-3xl mx-auto space-y-8">
        <!-- Header -->
        <div class="text-center">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950/60 text-brand-600 text-xs font-bold mb-3 border border-brand-200 dark:border-brand-800">
            <span>🧭</span> Intelligent Departure System
          </div>
          <h1 class="text-3xl font-black text-slate-900 dark:text-white">
            "Should I Go Now?" Advisor
          </h1>
          <p class="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-2 max-w-lg mx-auto">
            Dynamic algorithm factoring walking travel time, queue velocity, and safety buffer so you approach the counter right as your turn arrives.
          </p>
        </div>

        <!-- Main Recommendation Card -->
        <div
          [ngClass]="{
            'border-emerald-300 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-950 dark:text-emerald-100': result.colorScheme === 'emerald',
            'border-amber-300 bg-amber-50/70 dark:bg-amber-950/30 text-amber-950 dark:text-amber-100': result.colorScheme === 'amber',
            'border-blue-300 bg-blue-50/70 dark:bg-blue-950/30 text-blue-950 dark:text-blue-100': result.colorScheme === 'blue'
          }"
          class="p-8 rounded-3xl border-2 shadow-xl transition-all">
          <div class="flex items-center justify-between mb-4">
            <span
              [ngClass]="{
                'bg-emerald-600 text-white': result.colorScheme === 'emerald',
                'bg-amber-600 text-white': result.colorScheme === 'amber',
                'bg-blue-600 text-white': result.colorScheme === 'blue'
              }"
              class="px-4 py-1.5 rounded-full text-xs font-black tracking-wider uppercase shadow-sm">
              {{ result.badge }}
            </span>

            <span class="text-xs font-bold opacity-75">
              {{ geoService.hasLocationPermission() ? '📍 Live GPS Active' : '📍 Ground Benchmark' }}
            </span>
          </div>

          <h2 class="text-2xl sm:text-3xl font-black mb-2">{{ result.headline }}</h2>
          <p class="text-sm opacity-90 leading-relaxed max-w-xl">{{ result.subtext }}</p>

          <!-- Core Variables Grid -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-current/15 text-xs">
            <div>
              <span class="block opacity-75 font-semibold text-[10px] uppercase">Walk Distance</span>
              <strong class="text-base font-mono font-bold">{{ result.distanceMeters }}m</strong>
            </div>
            <div>
              <span class="block opacity-75 font-semibold text-[10px] uppercase">Walk Travel Time</span>
              <strong class="text-base font-mono font-bold">~{{ result.walkMinutes }} min</strong>
            </div>
            <div>
              <span class="block opacity-75 font-semibold text-[10px] uppercase">Queue Wait Ahead</span>
              <strong class="text-base font-mono font-bold">~{{ result.estimatedWaitMinutes }} min</strong>
            </div>
            <div>
              <span class="block opacity-75 font-semibold text-[10px] uppercase">Safety Cushion</span>
              <strong class="text-base font-mono font-bold">+{{ result.safetyBufferMinutes }} min</strong>
            </div>
          </div>
        </div>

        <!-- Interactive Adjustments Panel -->
        <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
          <h3 class="font-bold text-base text-slate-900 dark:text-white">
            Fine-Tune Queue &amp; Distance Parameters
          </h3>

          <!-- People ahead slider -->
          <div class="space-y-2">
            <div class="flex justify-between text-xs font-medium">
              <span class="text-slate-600 dark:text-slate-400">People Ahead of You:</span>
              <span class="font-mono font-bold text-slate-900 dark:text-white">{{ peopleAhead() }} people</span>
            </div>
            <input
              type="range"
              min="0"
              max="20"
              [value]="peopleAhead()"
              (input)="onPeopleChange($event)"
              class="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-600"
            />
          </div>

          <!-- Walk minutes slider -->
          <div class="space-y-2">
            <div class="flex justify-between text-xs font-medium">
              <span class="text-slate-600 dark:text-slate-400">Your Walking Distance:</span>
              <span class="font-mono font-bold text-slate-900 dark:text-white">{{ walkMinutes() }} minutes away</span>
            </div>
            <input
              type="range"
              min="1"
              max="20"
              [value]="walkMinutes()"
              (input)="onWalkChange($event)"
              class="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-600"
            />
          </div>

          <!-- Avg duration slider -->
          <div class="space-y-2">
            <div class="flex justify-between text-xs font-medium">
              <span class="text-slate-600 dark:text-slate-400">Avg Service Time per Customer:</span>
              <span class="font-mono font-bold text-slate-900 dark:text-white">{{ avgDuration() }} minutes</span>
            </div>
            <input
              type="range"
              min="2"
              max="25"
              [value]="avgDuration()"
              (input)="onAvgDurationChange($event)"
              class="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-600"
            />
          </div>
        </div>
      </div>
    </div>
  `
})
export class ShouldIGoComponent {
  geoService = inject(GeolocationService);
  queueService = inject(QueueService);
  orgService = inject(OrganisationService);

  peopleAhead = signal<number>(4);
  walkMinutes = signal<number>(5);
  avgDuration = signal<number>(8);

  get result(): ShouldIGoResult {
    return this.geoService.calculateShouldIGo(
      undefined,
      this.peopleAhead(),
      this.avgDuration(),
      this.walkMinutes(),
      4
    );
  }

  onPeopleChange(e: Event) {
    this.peopleAhead.set(Number((e.target as HTMLInputElement).value));
  }

  onWalkChange(e: Event) {
    this.walkMinutes.set(Number((e.target as HTMLInputElement).value));
  }

  onAvgDurationChange(e: Event) {
    this.avgDuration.set(Number((e.target as HTMLInputElement).value));
  }
}
