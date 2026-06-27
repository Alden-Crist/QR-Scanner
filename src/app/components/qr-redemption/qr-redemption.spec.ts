import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QrRedemption } from './qr-redemption';

describe('QrRedemption', () => {
  let component: QrRedemption;
  let fixture: ComponentFixture<QrRedemption>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QrRedemption]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QrRedemption);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
