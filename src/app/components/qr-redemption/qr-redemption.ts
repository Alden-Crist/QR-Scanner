import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { Html5Qrcode } from 'html5-qrcode';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-qr-redemption',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './qr-redemption.html',
  styleUrl: './qr-redemption.css',
})
export class QrRedemption implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];

  private html5QrCode: Html5Qrcode | null = null;

  eCommerceCategoryList: any[] = [];
  redeemableItems: any[] = []; // List of redeemable items returned from email/mobile search
  scanCompleted = false; // True after a QR is successfully scanned and validated; false when waiting for a scan or after clearing/resetting
  isScannerRunning = false; // True while the camera scanner is actively running; false when scanner is stopped/not started
  isSearchMode = false; // True when using email/mobile search instead of QR scanner mode
  searchType = 'email';
  searchEmail = '';
  searchMobile = '';
  selectedItems: any[] = []; // Redeemable items currently selected from the search results grid
  selectedItem: any = null; // Single redeemable item currently shown in the validation panel (from QR scan or search selection)
  selectedQrCategory = 'ADMISSION_TICKET'; // QR item category selected for scanning/search (admission, ride ticket, wristband, annual pass)
  scannedQrItemId = ''; // Item ID of the last successfully scanned QR code, used to show scan success state
  scanErrorMessage = '';
  scanErrorTitle = '';
  validationMessage = '';
  wasRedeemedNow = false;
  validSelectedCount = 0;
  invalidSelectedCount = 0;
  //

  private isProcessingScan = false;
  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {}

  searchTickets(): void {}

  async startScanning() {
    await this.resetValidationState();

    console.log('========== START SCANNER ==========');
    console.log('Scanner Running:', this.isScannerRunning);
    console.log('Html5QrCode Instance:', this.html5QrCode);

    try {
      if (this.isScannerRunning) {
        console.log('Scanner is already running.');
        return;
      }

      if (!this.html5QrCode) {
        console.log('Creating Html5QrCode instance...');
        this.html5QrCode = new Html5Qrcode('qr-reader');
      }

      this.isProcessingScan = false;

      // ==========================
      // Try Environment Camera
      // ==========================
      try {
        console.log('Trying Environment (Back) Camera...');

        this.isScannerRunning = true;
        this.cdr.detectChanges();
        console.time('QR Detection Time');
        await this.html5QrCode.start(
          { facingMode: 'environment' },
          {
            fps: 20,
            qrbox: {
              width: 350,
              height: 290,
            },
          },
          async (decodedText: string) => {
            if (this.isProcessingScan) {
              return;
            }

            this.isProcessingScan = true;
            console.timeEnd('QR Detection Time');
            console.log('==============================');
            console.log('QR DETECTED');
            console.log(decodedText);
            console.log('Stopping scanner...');
            console.log('==============================');

            // Update UI first
            this.handleScannedQr(decodedText);

            // Then stop scanner
            await this.stopScanning();
          },
          () => {
            // Ignore scan failures
          },
        );

        console.log('✅ Environment camera started successfully.');

        setTimeout(() => {
          const video = document.querySelector(
            '#qr-reader video',
          ) as HTMLVideoElement;

          console.log('Video Element:', video);

          if (video) {
            console.table({
              readyState: video.readyState,
              paused: video.paused,
              videoWidth: video.videoWidth,
              videoHeight: video.videoHeight,
              currentTime: video.currentTime,
              srcObject: video.srcObject,
            });
          }
        }, 1000);

        return;
      } catch (facingModeError) {
        console.warn('❌ Environment camera failed.', facingModeError);
        console.log('Falling back to available cameras...');
      }

      // ==========================
      // Get Cameras
      // ==========================

      console.log('Fetching available cameras...');

      const cameras = await Html5Qrcode.getCameras();

      console.log('Available Cameras:');
      console.table(cameras);

      if (!cameras || cameras.length === 0) {
        console.warn('No cameras detected.');

        this.isScannerRunning = false;
        this.isProcessingScan = false;

        return;
      }

      let cameraId = cameras[0].id;

      const rearCamera = cameras.find(
        (c) =>
          (c.label || '').toLowerCase().includes('back') ||
          (c.label || '').toLowerCase().includes('rear') ||
          (c.label || '').toLowerCase().includes('environment'),
      );

      if (rearCamera) {
        console.log('Rear camera found:', rearCamera);
        cameraId = rearCamera.id;
      }

      console.log('Starting Camera ID:', cameraId);

      this.isScannerRunning = true;
      this.cdr.detectChanges();

      console.time('QR Detection Time');
      await this.html5QrCode.start(
        cameraId,
        {
          fps: 20,
          qrbox: {
            width: 250,
            height: 250,
          },
        },
        async (decodedText: string) => {
          if (this.isProcessingScan) {
            return;
          }

          this.isProcessingScan = true;
          console.timeEnd('QR Detection Time');
          console.log('==============================');
          console.log('QR DETECTED');
          console.log(decodedText);
          console.log('Stopping scanner...');
          console.log('==============================');

          this.handleScannedQr(decodedText);

          await this.stopScanning();
        },
        () => {
          // Ignore scan failures
        },
      );

      console.log('✅ Camera started successfully.');

      setTimeout(() => {
        const video = document.querySelector(
          '#qr-reader video',
        ) as HTMLVideoElement;

        console.log('Video Element:', video);

        if (video) {
          console.table({
            readyState: video.readyState,
            paused: video.paused,
            videoWidth: video.videoWidth,
            videoHeight: video.videoHeight,
            currentTime: video.currentTime,
            srcObject: video.srcObject,
          });
        }
      }, 1000);
    } catch (error: any) {
      console.error('Scanner Start Error:', error);

      this.isScannerRunning = false;
      this.isProcessingScan = false;

      this.cdr.detectChanges();

      if (error?.name === 'NotAllowedError') {
        console.error('Camera permission denied. Please allow camera access.');
      } else if (error?.name === 'NotFoundError') {
        console.error('No camera device found.');
      } else {
        console.error('Unable to start camera scanner.');
      }
    }
  }

  async stopScanning() {
    console.log('========== STOP SCANNER ==========');
    console.log('stopScanning() called');
    console.log('isScannerRunning:', this.isScannerRunning);
    console.log('Html5QrCode Instance:', this.html5QrCode);

    try {
      if (this.html5QrCode && this.isScannerRunning) {
        console.log('Stopping camera...');

        if (this.html5QrCode.getState) {
          console.log(
            'Scanner State Before Stop:',
            this.html5QrCode.getState(),
          );
        }

        await this.html5QrCode.stop();
        console.log('✅ Scanner stopped.');

        await this.html5QrCode.clear();
        console.log('✅ Scanner UI cleared.');

        // Destroy the scanner instance
        this.html5QrCode = null;
      } else {
        console.warn('stopScanning skipped.');
        console.log('html5QrCode exists:', !!this.html5QrCode);
        console.log('isScannerRunning:', this.isScannerRunning);
      }
    } catch (error) {
      console.error('❌ Error stopping scanner:', error);
    } finally {
      this.isScannerRunning = false;
      this.isProcessingScan = false;

      this.cdr.detectChanges();

      console.log('Scanner Running:', this.isScannerRunning);
      console.log('========== STOP COMPLETE ==========');
    }
  }

  handleScannedQr(qrPayload: string) {
    console.log('========== SCAN SUCCESS ==========');
    console.log(qrPayload);

    // Simulate successful validation
    this.scanCompleted = true;

    this.scannedQrItemId = 'f3l4j3-43334343-43434343-34343';

    this.validationMessage = 'Ticket is valid for redemption.';

    this.scanErrorTitle = '';
    this.scanErrorMessage = '';

    this.cdr.detectChanges();
  }

  async clearScan() {
    await this.resetValidationState();
    this.clearSearchState();
  }

  async resetValidationState() {
    if (this.isScannerRunning) {
      await this.stopScanning();
    }

    this.scannedQrItemId = '';
    this.scanCompleted = false;
    this.selectedItem = null;

    this.scanErrorTitle = '';
    this.scanErrorMessage = '';
    this.validationMessage = '';

    this.wasRedeemedNow = false;

    this.validSelectedCount = 0;
    this.invalidSelectedCount = 0;
  }

  clearSearchState() {
    this.selectedItems = [];
    this.redeemableItems = [];
  }

  private restoreScroll() {
    document.body.style.overflow = 'auto';
  }

  async ngOnDestroy(): Promise<void> {
    await this.stopScanning();
    this.restoreScroll();
    this.subscriptions.forEach((subscription) => {
      if (subscription) {
        subscription.unsubscribe();
      }
    });
  }
}
