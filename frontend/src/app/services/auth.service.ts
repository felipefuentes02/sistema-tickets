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

 // Login
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
          console.log('No hay datos de usuario, creando usuario básico');
          // Crear usuario básico basado en las credenciales
          const basicUser = {
            correo: credentials.correo,
            id_rol: credentials.correo.includes('responsable') ? 4 : 2,
            primer_nombre: credentials.correo.includes('responsable') ? 'Responsable' : 'Cliente',
            primer_apellido: 'Test'
          };
          localStorage.setItem('user', JSON.stringify(basicUser));
          this.currentUser$.next(basicUser);
        }
      } else {
        console.error('Respuesta del backend sin token:', response);
      }
    })
  );
}

  // Logout
  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    this.currentUser$.next(null);
  }

  // Verificar si está autenticado
  isAuthenticated(): boolean {
    const token = localStorage.getItem('access_token');
    return !!token;
  }

  // Obtener usuario actual
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

  // Obtener la ruta home correspondiente según el rol
  getHomeRoute(): string {
    const user = this.getCurrentUser();
    console.log('getHomeRoute - usuario:', user);
    
    if (!user) {
      console.log('No hay usuario, redirigiendo a login');
      return '/login';
    }
    
    const role = user.id_rol;
    console.log('getHomeRoute - rol detectado:', role);
    
    // Por ahora, redirigir según el correo para debugging
    if (user.correo && user.correo.includes('responsable')) {
      console.log('Detectado responsable por correo');
      return '/responsable-home';
    } else {
      console.log('Detectado cliente por defecto');
      return '/home';
    }
  }
}