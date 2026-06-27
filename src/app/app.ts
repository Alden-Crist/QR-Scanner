import { Component } from '@angular/core';
import { TopBar } from './components/top-bar/top-bar';

import { QrRedemption } from './components/qr-redemption/qr-redemption';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [TopBar, QrRedemption],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  title = 'QR_Scanner';
}
