import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SolicitudesCerradasPage } from './solicitudes-cerradas.page';

describe('SolicitudesCerradasPage', () => {
  let component: SolicitudesCerradasPage;
  let fixture: ComponentFixture<SolicitudesCerradasPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(SolicitudesCerradasPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
