import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = 'http://localhost:3000/api';
  private currentUser$ = new BehaviorSubject<any>(null);

  constructor(private http: HttpClient) {}

  /**
   * Método de login
   * @param credentials - Credenciales de usuario
   * @returns Observable con la respuesta del login
   */
  login(credentials: { correo: string; contrasena: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/login`, credentials).pipe(
      tap((response: any) => {
        console.log('Respuesta completa del backend:', response);
        console.log('Tipo de respuesta:', typeof response);
        console.log('Propiedades de respuesta:', Object.keys(response || {}));
        
        // Verificar si la respuesta tiene datos válidos
        if (response && response.access_token) {
          console.log('Token encontrado:', response.access_token);
          
          // Guardar token
          localStorage.setItem('access_token', response.access_token);
          
          // Verificar usuario
          if (response.user) {
            console.log('Usuario encontrado:', response.user);
            localStorage.setItem('user', JSON.stringify(response.user));
            this.currentUser$.next(response.user);
          } else {
            console.log('No hay datos de usuario en la respuesta');
          }
        } else {
          console.error('Respuesta del backend sin token:', response);
        }
      })
    );
  }

  /**
   * Método de logout
   */
  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    this.currentUser$.next(null);
  }

  /**
   * Verificar si está autenticado
   * @returns true si tiene token válido
   */
  isAuthenticated(): boolean {
    const token = localStorage.getItem('access_token');
    return !!token;
  }

  /**
   * Obtener usuario actual
   * @returns Datos del usuario o null
   */
  getCurrentUser(): any {
    const user = localStorage.getItem('user');
    console.log('getCurrentUser - raw data:', user);
    
    if (user) {
      try {
        const parsedUser = JSON.parse(user);
        console.log('getCurrentUser - parsed user:', parsedUser);
        return parsedUser;
      } catch (error) {
        console.error('Error al parsear usuario:', error);
        return null;
      }
    }
    return null;
  }

  /**
   * Obtener la ruta home correspondiente según el rol
   * @returns Ruta de navegación según el rol
   */
  getHomeRoute(): string {
    const user = this.getCurrentUser();
    console.log('getHomeRoute - usuario completo:', user);
    
    if (!user) {
      console.log('No hay usuario, redirigiendo a login');
      return '/login';
    }
    
    const role = user.id_rol;
    console.log('getHomeRoute - rol detectado:', role, typeof role);
    
    // Verificar por ID de rol (método principal y más confiable)
    switch (role) {
      case 1:
        console.log('✅ Rol 1 detectado - ADMINISTRADOR - Redirigiendo a /admin-home');
        return '/admin-home';
        
      case 2:
        console.log('✅ Rol 2 detectado - CLIENTE - Redirigiendo a /home');
        return '/home';
        
      case 3:
        console.log('✅ Rol 3 detectado - RESPONSABLE - Redirigiendo a /responsable-home');
        return '/responsable-home';
        
      default:
        console.log('❌ Rol desconocido:', role, '- Intentando método alternativo por correo');
        // Método de respaldo: verificar por correo electrónico
        return this.getHomeRouteByEmail(user);
    }
  }

  /**
   * Método de respaldo para determinar la ruta por correo electrónico
   * @param user - Datos del usuario
   * @returns Ruta según el correo
   */
  private getHomeRouteByEmail(user: any): string {
    if (!user.correo) {
      console.log('No hay correo, redirigiendo a cliente por defecto');
      return '/home';
    }

    const email = user.correo.toLowerCase();
    console.log('Analizando correo:', email);

    // Verificar patrones en el correo
    if (email.includes('admin') || email === 'felipefuentes02@gmail.com') {
      console.log('Correo de administrador detectado');
      return '/admin-home';
    } else if (email.includes('responsable')) {
      console.log('Correo de responsable detectado');
      return '/responsable-home';
    } else {
      console.log('Correo de cliente por defecto');
      return '/home';
    }
  }

  /**
   * Verificar si el usuario es administrador
   * @returns true si es administrador
   */
  isAdmin(): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;

    // Verificar por rol
    if (user.id_rol === 1) return true;
    
    // Verificar por correo como respaldo
    if (user.correo) {
      return user.correo.toLowerCase().includes('admin') || 
             user.correo === 'felipefuentes02@gmail.com';
    }

    return false;
  }

  /**
   * Verificar si el usuario es responsable
   * @returns true si es responsable
   */
  isResponsable(): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;

    // Verificar por rol
    if (user.id_rol === 3) return true;
    
    // Verificar por correo como respaldo
    if (user.correo) {
      return user.correo.toLowerCase().includes('responsable');
    }

    return false;
  }

  /**
   * Verificar si el usuario es cliente
   * @returns true si es cliente
   */
  isCliente(): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;

    // Verificar por rol
    return user.id_rol === 2;
  }

  /**
   * Obtener nombre del rol del usuario
   * @returns Nombre del rol
   */
  getRoleName(): string {
    const user = this.getCurrentUser();
    if (!user) return 'Desconocido';

    switch (user.id_rol) {
      case 1: return 'Administrador';
      case 2: return 'Cliente';
      case 3: return 'Responsable';
      default: return 'Usuario';
    }
  }

  /**
   * Debug: Mostrar información completa del usuario
   */
  debugUserInfo(): void {
    const user = this.getCurrentUser();
    console.log('=== DEBUG USER INFO ===');
    console.log('Usuario completo:', user);
    console.log('ID de rol:', user?.id_rol, typeof user?.id_rol);
    console.log('Correo:', user?.correo);
    console.log('Es Admin:', this.isAdmin());
    console.log('Es Responsable:', this.isResponsable());
    console.log('Es Cliente:', this.isCliente());
    console.log('Ruta home:', this.getHomeRoute());
    console.log('=====================');
  }
}