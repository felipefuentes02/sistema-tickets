import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SolicitudesCopiaPage } from './solicitudes-copia.page';

describe('SolicitudesCopiaPage', () => {
  let component: SolicitudesCopiaPage;
  let fixture: ComponentFixture<SolicitudesCopiaPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(SolicitudesCopiaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
