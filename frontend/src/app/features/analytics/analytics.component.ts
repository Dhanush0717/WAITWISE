import { Component, inject, signal, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { ApiService } from '../../core/services/api.service';
import { OrganisationService } from '../../core/services/organisation.service';
import { QueueService } from '../../core/services/queue.service';
import { Service } from '../../core/models/service.model';

Chart.register(...registerables);

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      <div class="max-w-7xl mx-auto space-y-8">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-800 gap-4">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                Operational Intelligence
              </span>
              <span class="text-xs text-slate-400 font-medium">
                {{ orgService.currentOrganisation()?.name }}
              </span>
            </div>
            <h1 class="text-3xl font-black text-slate-900 dark:text-white">
              Queue Analytics &amp; Counter Simulation
            </h1>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Analyze historical throughput, token resolution rates, and simulate queue relief with dynamic counter scaling.
            </p>
          </div>

          <!-- CSV Export Button -->
          <div class="flex items-center gap-3">
            <button
              (click)="exportCsv()"
              class="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 font-bold text-xs text-slate-700 dark:text-slate-200 shadow-xs flex items-center gap-2">
              <svg class="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export CSV Report
            </button>
          </div>
        </div>

        <!-- Counter Overflow Simulator Card -->
        <div class="bg-gradient-to-tr from-brand-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-brand-800">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2">
              <span class="text-2xl">⚡</span>
              <div>
                <h3 class="text-xl font-black">Interactive Counter Overflow Simulator</h3>
                <p class="text-xs text-brand-200">Test queueing theory scenarios: What happens to waiting times when opening extra desks?</p>
              </div>
            </div>
            <span class="px-3 py-1 rounded-full bg-white/10 text-brand-200 text-xs font-mono font-bold">
              Queue Theory $W_q$ Model
            </span>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 my-6">
            <!-- Sliders -->
            <div class="space-y-4 bg-white/5 p-5 rounded-2xl border border-white/10">
              <div>
                <div class="flex justify-between text-xs font-medium mb-1">
                  <span class="text-brand-200">Customer Arrival Rate:</span>
                  <span class="font-bold font-mono">{{ simArrivalRate() }} visitors/hour</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="60"
                  [value]="simArrivalRate()"
                  (input)="simArrivalRate.set(Number($any($event.target).value))"
                  class="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white"
                />
              </div>

              <div>
                <div class="flex justify-between text-xs font-medium mb-1">
                  <span class="text-brand-200">Avg Service Duration:</span>
                  <span class="font-bold font-mono">{{ simDuration() }} mins/person</span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="25"
                  [value]="simDuration()"
                  (input)="simDuration.set(Number($any($event.target).value))"
                  class="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white"
                />
              </div>

              <div>
                <div class="flex justify-between text-xs font-medium mb-1">
                  <span class="text-brand-200">Current Active Counters:</span>
                  <span class="font-bold font-mono">{{ simCounters() }} active</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="8"
                  [value]="simCounters()"
                  (input)="simCounters.set(Number($any($event.target).value))"
                  class="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white"
                />
              </div>
            </div>

            <!-- Simulation Results Cards -->
            <div class="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <!-- Base Scenario -->
              <div class="p-5 rounded-2xl bg-white/10 border border-white/10 flex flex-col justify-between">
                <div>
                  <span class="text-[10px] uppercase font-bold text-brand-200 block mb-1">Current State</span>
                  <div class="text-xs text-white/80">{{ simCounters() }} Counters Active</div>
                </div>
                <div class="my-4">
                  <div class="text-3xl font-black font-mono">{{ currentSimWait() }}m</div>
                  <span class="text-[10px] text-brand-300">Expected Average Wait</span>
                </div>
                <span class="text-[10px] text-white/60">Status: Baseline</span>
              </div>

              <!-- +1 Counter Scenario -->
              <div class="p-5 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex flex-col justify-between">
                <div>
                  <span class="text-[10px] uppercase font-bold text-emerald-300 block mb-1">+1 Counter Opened</span>
                  <div class="text-xs text-white/80">{{ simCounters() + 1 }} Counters Active</div>
                </div>
                <div class="my-4">
                  <div class="text-3xl font-black font-mono text-emerald-300">{{ plusOneSimWait() }}m</div>
                  <span class="text-[10px] text-emerald-200">
                    -{{ computeReduction(currentSimWait(), plusOneSimWait()) }}% wait reduction!
                  </span>
                </div>
                <span class="text-[10px] text-emerald-300 font-bold">Recommended action</span>
              </div>

              <!-- +2 Counters Scenario -->
              <div class="p-5 rounded-2xl bg-sky-500/20 border border-sky-400/40 flex flex-col justify-between">
                <div>
                  <span class="text-[10px] uppercase font-bold text-sky-300 block mb-1">+2 Counters Opened</span>
                  <div class="text-xs text-white/80">{{ simCounters() + 2 }} Counters Active</div>
                </div>
                <div class="my-4">
                  <div class="text-3xl font-black font-mono text-sky-300">{{ plusTwoSimWait() }}m</div>
                  <span class="text-[10px] text-sky-200">
                    -{{ computeReduction(currentSimWait(), plusTwoSimWait()) }}% wait reduction!
                  </span>
                </div>
                <span class="text-[10px] text-sky-300 font-bold">Maximum throughput</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Charts Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- Chart 1: Hourly Distribution -->
          <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <h3 class="font-bold text-sm text-slate-900 dark:text-white mb-1">Hourly Visitor Traffic Distribution</h3>
            <p class="text-xs text-slate-500 mb-4">Peak hours and arrival volume across today's shifts</p>
            <div class="h-64">
              <canvas #hourlyChartCanvas></canvas>
            </div>
          </div>

          <!-- Chart 2: Outcome Breakdown -->
          <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <h3 class="font-bold text-sm text-slate-900 dark:text-white mb-1">Token Resolution &amp; Outcomes</h3>
            <p class="text-xs text-slate-500 mb-4">Served vs cancelled vs skipped token distribution</p>
            <div class="h-64 flex items-center justify-center">
              <canvas #outcomeChartCanvas></canvas>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AnalyticsComponent implements OnInit, AfterViewInit {
  private api = inject(ApiService);
  orgService = inject(OrganisationService);
  queueService = inject(QueueService);

  @ViewChild('hourlyChartCanvas') hourlyCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('outcomeChartCanvas') outcomeCanvas!: ElementRef<HTMLCanvasElement>;

  simArrivalRate = signal<number>(24);
  simDuration = signal<number>(8);
  simCounters = signal<number>(2);

  Number = Number;

  ngOnInit() {}

  ngAfterViewInit() {
    this.renderCharts();
  }

  currentSimWait(): number {
    const rate = this.simArrivalRate();
    const dur = this.simDuration();
    const counters = this.simCounters();
    return Math.max(2, Math.round((rate * dur) / (counters * 6)));
  }

  plusOneSimWait(): number {
    const rate = this.simArrivalRate();
    const dur = this.simDuration();
    const counters = this.simCounters() + 1;
    return Math.max(1, Math.round((rate * dur) / (counters * 6)));
  }

  plusTwoSimWait(): number {
    const rate = this.simArrivalRate();
    const dur = this.simDuration();
    const counters = this.simCounters() + 2;
    return Math.max(1, Math.round((rate * dur) / (counters * 6)));
  }

  computeReduction(base: number, next: number): number {
    if (base <= 0) return 0;
    return Math.max(0, Math.round(((base - next) / base) * 100));
  }

  renderCharts() {
    setTimeout(() => {
      // Hourly Bar Chart
      if (this.hourlyCanvas) {
        new Chart(this.hourlyCanvas.nativeElement, {
          type: 'bar',
          data: {
            labels: ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'],
            datasets: [{
              label: 'Visitors Joined',
              data: [12, 28, 35, 18, 14, 26, 31, 15],
              backgroundColor: '#4f46e5',
              borderRadius: 8
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              y: { beginAtZero: true, grid: { color: '#f1f5f9' } },
              x: { grid: { display: false } }
            }
          }
        });
      }

      // Outcome Doughnut Chart
      if (this.outcomeCanvas) {
        new Chart(this.outcomeCanvas.nativeElement, {
          type: 'doughnut',
          data: {
            labels: ['Served', 'Waiting', 'Cancelled', 'Skipped / No-Show'],
            datasets: [{
              data: [142, 18, 6, 4],
              backgroundColor: ['#10b981', '#3b82f6', '#f43f5e', '#f59e0b'],
              borderWidth: 0
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } }
            }
          }
        });
      }
    }, 200);
  }

  exportCsv() {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Ticket Number,Department,Status,Priority,Joined At,Wait Time (mins)\n' +
      'DOC-001,General OPD,COMPLETED,REGULAR,09:15,6\n' +
      'DOC-002,General OPD,COMPLETED,SENIOR,09:22,4\n' +
      'CS-101,Cash Deposit,COMPLETED,REGULAR,09:30,5\n' +
      'CS-102,Cash Deposit,COMPLETED,REGULAR,09:35,7\n' +
      'PASS-001,Passport Renewal,COMPLETED,VIP,09:40,11\n';

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `waitwise_queue_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
