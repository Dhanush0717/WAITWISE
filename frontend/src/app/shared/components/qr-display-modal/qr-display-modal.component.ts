import { Component, Input, Output, EventEmitter, OnInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as QRCode from 'qrcode';

@Component({
  selector: 'app-qr-display-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
      <div class="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div>
            <h3 class="font-bold text-lg text-slate-900 dark:text-white">{{ title }}</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400">{{ subtitle }}</p>
          </div>
          <button (click)="close.emit()" class="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Printable Ticket Card Body -->
        <div id="printable-area" class="p-6 text-center flex flex-col items-center">
          <div class="p-3 bg-white rounded-2xl border-2 border-slate-100 shadow-sm inline-block mb-4">
            <canvas #qrCanvas class="max-w-[200px] h-auto"></canvas>
          </div>

          <div *ngIf="highlightValue" class="mb-3">
            <span class="inline-block px-4 py-1.5 bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 text-2xl font-mono font-black tracking-wider rounded-xl border border-brand-200 dark:border-brand-800">
              {{ highlightValue }}
            </span>
          </div>

          <div *ngIf="metaInfo" class="space-y-1 mb-4 text-sm text-slate-600 dark:text-slate-300">
            <div *ngFor="let item of metaInfo" class="flex justify-between w-full max-w-xs text-xs py-1 border-b border-slate-100 dark:border-slate-800/80">
              <span class="text-slate-500 dark:text-slate-400 font-medium">{{ item.label }}:</span>
              <span class="font-bold text-slate-900 dark:text-slate-100">{{ item.value }}</span>
            </div>
          </div>

          <p class="text-xs text-slate-400 dark:text-slate-500 max-w-xs">
            Scan this QR code with any smartphone camera or entrance scanner to track live position.
          </p>
        </div>

        <!-- Footer Actions -->
        <div class="flex gap-3 px-6 py-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800">
          <button (click)="printTicket()" class="flex-1 inline-flex justify-center items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm bg-brand-600 hover:bg-brand-700 text-white shadow-sm transition-all active:scale-[0.98]">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print Ticket
          </button>
          <button (click)="close.emit()" class="px-4 py-2.5 rounded-xl font-semibold text-sm border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  `
})
export class QrDisplayModalComponent implements OnInit {
  @Input() title: string = 'Digital Token QR';
  @Input() subtitle: string = 'Universal Queue Pass';
  @Input() qrData: string = '';
  @Input() highlightValue?: string;
  @Input() metaInfo?: { label: string; value: string }[];
  @Output() close = new EventEmitter<void>();

  @ViewChild('qrCanvas', { static: true }) qrCanvas!: ElementRef<HTMLCanvasElement>;

  ngOnInit() {
    this.renderQr();
  }

  renderQr() {
    if (!this.qrData) return;
    QRCode.toCanvas(this.qrCanvas.nativeElement, this.qrData, {
      width: 200,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    }, (error) => {
      if (error) console.error('QR Render Error:', error);
    });
  }

  printTicket() {
    window.print();
  }
}
