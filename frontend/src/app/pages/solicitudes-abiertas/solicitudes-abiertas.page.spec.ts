import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SolicitudesAbiertasPage } from './solicitudes-abiertas.page';

describe('SolicitudesAbiertasPage', () => {
  let component: SolicitudesAbiertasPage;
  let fixture: ComponentFixture<SolicitudesAbiertasPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(SolicitudesAbiertasPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
