import { Component, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Html5QrcodeScanner } from 'html5-qrcode';

@Component({
  selector: 'app-qr-scanner-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
      <div class="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div>
            <h3 class="font-bold text-lg text-slate-900 dark:text-white">Scan Service / Ticket QR</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400">Position QR code inside viewfinder or type manually</p>
          </div>
          <button (click)="handleClose()" class="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Mode Tabs -->
        <div class="flex border-b border-slate-200 dark:border-slate-800 text-sm font-semibold">
          <button 
            (click)="activeTab = 'camera'"
            [class.text-brand-600]="activeTab === 'camera'"
            [class.border-b-2]="activeTab === 'camera'"
            [class.border-brand-600]="activeTab === 'camera'"
            class="flex-1 py-3 text-center text-slate-600 dark:text-slate-300 hover:text-brand-600 transition-colors">
            Camera Scanner
          </button>
          <button 
            (click)="activeTab = 'manual'"
            [class.text-brand-600]="activeTab === 'manual'"
            [class.border-b-2]="activeTab === 'manual'"
            [class.border-brand-600]="activeTab === 'manual'"
            class="flex-1 py-3 text-center text-slate-600 dark:text-slate-300 hover:text-brand-600 transition-colors">
            Manual Entry
          </button>
        </div>

        <!-- Body -->
        <div class="p-6">
          <div *ngIf="activeTab === 'camera'" class="flex flex-col items-center">
            <div id="reader" class="w-full max-w-sm rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner"></div>
            <p class="text-xs text-slate-400 mt-3 text-center">
              Requires browser camera permission. Grant access when prompted.
            </p>
          </div>

          <div *ngIf="activeTab === 'manual'" class="space-y-4">
            <div>
              <label class="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Service ID or Ticket Code
              </label>
              <input
                type="text"
                [(ngModel)]="manualCode"
                placeholder="e.g. DOC-001 or Service ID"
                class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm"
              />
            </div>
            <button
              (click)="submitManualCode()"
              [disabled]="!manualCode.trim()"
              class="w-full py-2.5 px-4 rounded-xl font-semibold text-sm bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white shadow-sm transition-all">
              Look Up & Open
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class QrScannerModalComponent implements OnInit, OnDestroy {
  @Output() scanned = new EventEmitter<string>();
  @Output() close = new EventEmitter<void>();

  activeTab: 'camera' | 'manual' = 'camera';
  manualCode: string = '';
  private html5QrcodeScanner: Html5QrcodeScanner | null = null;

  ngOnInit() {
    this.initScanner();
  }

  initScanner() {
    setTimeout(() => {
      try {
        this.html5QrcodeScanner = new Html5QrcodeScanner(
          'reader',
          { fps: 10, qrbox: { width: 250, height: 250 } },
          /* verbose= */ false
        );

        this.html5QrcodeScanner.render(
          (decodedText: string) => {
            this.handleScanSuccess(decodedText);
          },
          (errorMessage: string) => {
            // Scanner frame scan error - standard noise
          }
        );
      } catch (err) {
        console.warn('Camera scanner init failed, falling back to manual entry:', err);
        this.activeTab = 'manual';
      }
    }, 100);
  }

  handleScanSuccess(decodedText: string) {
    this.cleanUpScanner();
    this.scanned.emit(decodedText);
  }

  submitManualCode() {
    if (this.manualCode.trim()) {
      this.handleScanSuccess(this.manualCode.trim());
    }
  }

  handleClose() {
    this.cleanUpScanner();
    this.close.emit();
  }

  private cleanUpScanner() {
    if (this.html5QrcodeScanner) {
      try {
        this.html5QrcodeScanner.clear();
      } catch (e) {
        console.warn('Scanner clear error:', e);
      }
      this.html5QrcodeScanner = null;
    }
  }

  ngOnDestroy() {
    this.cleanUpScanner();
  }
}
