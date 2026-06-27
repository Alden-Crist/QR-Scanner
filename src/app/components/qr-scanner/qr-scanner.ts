import {
  Component,
  AfterViewInit,
  OnDestroy,
  ChangeDetectorRef,
} from '@angular/core';
import { Html5Qrcode } from 'html5-qrcode';

@Component({
  selector: 'app-qr-scanner',
  standalone: true,
  imports: [],
  templateUrl: './qr-scanner.html',
  styleUrl: './qr-scanner.css',
})
export class QrScanner implements AfterViewInit, OnDestroy {
  scannedText = '';

  private qrCode: Html5Qrcode | null = null;

  isScannerRunning = false;

  constructor(private cdr: ChangeDetectorRef) {}

  async ngAfterViewInit() {
    // Scanner will start only when Start button is clicked.
  }

  async startScanning() {
    console.log('========== START SCANNER ==========');

    try {
      if (!this.qrCode) {
        this.qrCode = new Html5Qrcode('qr-reader');
      }

      if (this.isScannerRunning) {
        console.log('Scanner already running.');
        return;
      }

      try {
        await this.qrCode.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: {
              width: 250,
              height: 250,
            },
          },
          async (decodedText: string) => {
            console.log('QR DETECTED');
            console.log(decodedText);

            this.scannedText = decodedText;
            this.cdr.detectChanges();

            await this.stopScanning();
          },
          () => {},
        );

        this.isScannerRunning = true;
        console.log('Environment camera started.');
      } catch {
        console.log('Environment camera unavailable.');

        const cameras = await Html5Qrcode.getCameras();

        if (!cameras.length) {
          alert('No camera found.');
          return;
        }

        await this.qrCode.start(
          cameras[0].id,
          {
            fps: 10,
            qrbox: {
              width: 250,
              height: 250,
            },
          },
          async (decodedText: string) => {
            console.log('QR DETECTED');
            console.log(decodedText);

            this.scannedText = decodedText;
            this.cdr.detectChanges();

            await this.stopScanning();
          },
          () => {},
        );

        this.isScannerRunning = true;
      }
    } catch (err) {
      console.error(err);
      alert('Unable to start scanner.');
    }
  }

  async stopScanning() {
    try {
      if (this.qrCode && this.isScannerRunning) {
        await this.qrCode.stop();
        await this.qrCode.clear();

        this.isScannerRunning = false;

        console.log('Scanner stopped.');
      }
    } catch (err) {
      console.error(err);
    }
  }

  async ngOnDestroy() {
    await this.stopScanning();
  }
}
