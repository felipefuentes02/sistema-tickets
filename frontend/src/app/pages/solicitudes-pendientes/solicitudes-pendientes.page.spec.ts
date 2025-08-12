import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SolicitudesPendientesPage } from './solicitudes-pendientes.page';

describe('SolicitudesPendientesPage', () => {
  let component: SolicitudesPendientesPage;
  let fixture: ComponentFixture<SolicitudesPendientesPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(SolicitudesPendientesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
