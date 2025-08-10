import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IngresarSolicitudPage } from './ingresar-solicitud.page';

describe('IngresarSolicitudPage', () => {
  let component: IngresarSolicitudPage;
  let fixture: ComponentFixture<IngresarSolicitudPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(IngresarSolicitudPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
