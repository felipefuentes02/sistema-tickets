import { Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {

  constructor() {}

  canActivate(): boolean {
    // Temporalmente deshabilitado para debugging
    return true;
  }
}