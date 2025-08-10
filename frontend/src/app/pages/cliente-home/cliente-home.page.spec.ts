import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClienteHomePage } from './cliente-home.page';

describe('ClienteHomePage', () => {
  let component: ClienteHomePage;
  let fixture: ComponentFixture<ClienteHomePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ClienteHomePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
