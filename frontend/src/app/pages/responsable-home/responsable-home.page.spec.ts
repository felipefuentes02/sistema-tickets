import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ResponsableHomePage } from './responsable-home.page';

describe('ResponsableHomePage', () => {
  let component: ResponsableHomePage;
  let fixture: ComponentFixture<ResponsableHomePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ResponsableHomePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
