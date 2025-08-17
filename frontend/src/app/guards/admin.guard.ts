import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

 //Guard para proteger las rutas del administrador, Verifica que el usuario autenticado tenga permisos de administrador
@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {

  /**
   * Constructor del guard
   * @param authService - Servicio de autenticación
   * @param router - Router para navegación
   */
  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  /**
   * Determina si se puede activar la ruta
   * @param route - Información de la ruta activada
   * @param state - Estado actual del router
   * @returns true si puede acceder, false en caso contrario
   */
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {

    console.log('AdminGuard: Verificando permisos de administrador...');

    // Obtener el usuario actual
    const usuario = this.authService.getCurrentUser();
    
    if (!usuario) {
      console.log('AdminGuard: No hay usuario autenticado');
      this.router.navigate(['/login']);
      return false;
    }

    // Verificar si es administrador
    const esAdmin = this.verificarPermisoAdmin(usuario);
    
    if (!esAdmin) {
      console.log('AdminGuard: Usuario sin permisos de administrador');
      this.manejarAccesoDenegado(usuario);
      return false;
    }

    console.log('AdminGuard: Acceso permitido para administrador');
    return true;
  }

  /**
   * Verifica si el usuario tiene permisos de administrador
   * @param usuario - Datos del usuario
   * @returns true si es administrador, false en caso contrario
   */
  private verificarPermisoAdmin(usuario: any): boolean {
    // Método principal: verificar por ID de rol
    if (usuario.id_rol !== undefined && usuario.id_rol !== null) {
      // ID de rol 1 = Administrador
      return usuario.id_rol === 1;
    }

    // Método alternativo: verificar por nombre de rol
    if (usuario.nombre_rol) {
      const rolesAdmin = ['administrador', 'admin', 'administrator'];
      return rolesAdmin.includes(usuario.nombre_rol.toLowerCase());
    }

    // Método de respaldo: verificar por correo electrónico
    if (usuario.correo) {
      const correosAdmin = [
        'admin@empresa.com',
        'administrador@empresa.com',
        'superuser@empresa.com'
      ];
      
      // También verificar si el correo contiene 'admin'
      const contieneAdmin = usuario.correo.toLowerCase().includes('admin');
      const esCorreoAdmin = correosAdmin.includes(usuario.correo.toLowerCase());
      
      return contieneAdmin || esCorreoAdmin;
    }

    // Si no se puede determinar, denegar acceso por seguridad
    return false;
  }

  /**
   * Maneja el acceso denegado redirigiendo según el rol del usuario
   * @param usuario - Datos del usuario
   */
  private manejarAccesoDenegado(usuario: any): void {
    console.log('AdminGuard: Redirigiendo usuario según su rol...');

    // Redirigir según el rol del usuario
    if (usuario.id_rol === 2) {
      // Cliente/Usuario normal
      console.log('AdminGuard: Redirigiendo a home de cliente');
      this.router.navigate(['/home']);
    } else if (usuario.id_rol === 3) {
      // Responsable de respuesta
      console.log('AdminGuard: Redirigiendo a home de responsable');
      this.router.navigate(['/responsable-home']);
    } else {
      // Rol desconocido o sin permisos
      console.log('AdminGuard: Rol desconocido, redirigiendo a login');
      this.router.navigate(['/login']);
    }

    // Mostrar mensaje de error (opcional)
    this.mostrarMensajeAccesoDenegado();
  }

  /**
   * Muestra un mensaje informativo sobre el acceso denegado
   */
  private mostrarMensajeAccesoDenegado(): void {
    // Aquí podrías usar un servicio de notificaciones o toast
    console.warn('Acceso denegado: Se requieren permisos de administrador para acceder a esta sección');
    
    // Ejemplo usando alert (en producción usar un toast o modal más elegante)
    setTimeout(() => {
      alert('Acceso denegado: No tienes permisos para acceder a la sección de administrador');
    }, 100);
  }

  /**
   * Verifica si el token JWT aún es válido
   * @returns true si el token es válido, false en caso contrario
   */
  private verificarTokenValido(): boolean {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        return false;
      }

      // Decodificar el token JWT para verificar la expiración
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        return false;
      }

      const payload = JSON.parse(atob(tokenParts[1]));
      const ahora = Math.floor(Date.now() / 1000);

      // Verificar si el token ha expirado
      if (payload.exp && payload.exp < ahora) {
        console.log('AdminGuard: Token JWT expirado');
        return false;
      }

      return true;
    } catch (error) {
      console.error('AdminGuard: Error al verificar token JWT:', error);
      return false;
    }
  }

  /**
   * Registra el intento de acceso para auditoría
   * @param usuario - Usuario que intenta acceder
   * @param permitido - Si se permitió el acceso
   * @param ruta - Ruta a la que intenta acceder
   */
  private registrarIntentoAcceso(usuario: any, permitido: boolean, ruta: string): void {
    const logData = {
      timestamp: new Date().toISOString(),
      usuario: usuario?.correo || 'desconocido',
      id_usuario: usuario?.id || null,
      rol: usuario?.nombre_rol || usuario?.id_rol || 'desconocido',
      ruta: ruta,
      acceso_permitido: permitido,
      ip: this.obtenerIP(),
      user_agent: navigator.userAgent
    };

    console.log('AdminGuard: Registro de acceso:', logData);

    // En un entorno de producción, enviar esto a un servicio de auditoría
    // this.auditService.registrarAcceso(logData);
  }

  /**
   * Obtiene la IP del cliente (simplificado)
   * @returns IP del cliente o 'desconocida'
   */
  private obtenerIP(): string {
    // En un entorno real, obtendrías esto del backend
    return 'cliente_ip';
  }

  /**
   * Verifica permisos específicos para funcionalidades del administrador
   * @param usuario - Usuario a verificar
   * @param permiso - Permiso específico a verificar
   * @returns true si tiene el permiso, false en caso contrario
   */
  public verificarPermisoEspecifico(usuario: any, permiso: string): boolean {
    if (!this.verificarPermisoAdmin(usuario)) {
      return false;
    }

    // Permisos específicos del administrador
    const permisosAdmin = [
      'crear_usuario',
      'editar_usuario',
      'eliminar_usuario',
      'ver_reportes',
      'configurar_sistema',
      'gestionar_departamentos',
      'ver_metricas_globales',
      'exportar_datos',
      'enviar_notificaciones'
    ];

    return permisosAdmin.includes(permiso);
  }

  /**
   * Valida el acceso a una funcionalidad específica
   * @param funcionalidad - Nombre de la funcionalidad
   * @returns true si puede acceder, false en caso contrario
   */
  public puedeAccederA(funcionalidad: string): boolean {
    const usuario = this.authService.getCurrentUser();
    
    if (!usuario || !this.verificarPermisoAdmin(usuario)) {
      return false;
    }

    // Mapeo de funcionalidades a permisos
    const mapeoFuncionalidades: { [key: string]: string } = {
      'gestion_usuarios': 'crear_usuario',
      'reportes': 'ver_reportes',
      'configuracion': 'configurar_sistema',
      'dashboard_completo': 'ver_metricas_globales',
      'exportar': 'exportar_datos'
    };

    const permisoRequerido = mapeoFuncionalidades[funcionalidad];
    
    if (!permisoRequerido) {
      console.warn(`AdminGuard: Funcionalidad '${funcionalidad}' no reconocida`);
      return false;
    }

    return this.verificarPermisoEspecifico(usuario, permisoRequerido);
  }
}