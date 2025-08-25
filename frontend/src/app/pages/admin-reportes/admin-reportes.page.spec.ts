import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminReportesPage } from './admin-reportes.page';

describe('AdminReportesPage', () => {
  let component: AdminReportesPage;
  let fixture: ComponentFixture<AdminReportesPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminReportesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
