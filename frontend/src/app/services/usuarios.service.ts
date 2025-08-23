/**
 * Archivo: frontend/src/app/services/usuarios.service.ts
 * Descripción: Servicio completo para gestión de usuarios del sistema
 * Autor: Sistema de Gestión de Tickets
 * Fecha: 2025
 */

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { 
  Usuario, 
  CrearUsuario, 
  ActualizarUsuario, 
  Departamento, 
  RespuestaUsuarios,
  FiltrosUsuario,
  RolUsuario 
} from '../interfaces/admin-usuarios.interface';

/**
 * Interfaz para respuesta de validación
 */
interface RespuestaValidacion {
  success: boolean;
  disponible: boolean;
  message: string;
}

/**
 * Interfaz para respuesta de departamentos
 */
interface RespuestaDepartamentos {
  success: boolean;
  data: Departamento[];
  message: string;
}

/**
 * Servicio para gestión de usuarios del sistema
 * Maneja todas las operaciones CRUD y comunicación con el backend
 */
@Injectable({
  providedIn: 'root'
})
export class UsuariosService {

  /** URL base del API */
  private readonly apiUrl = `${environment.apiUrl}/admin`;
  
  /** Endpoints específicos */
  private readonly endpoints = {
    usuarios: '/usuarios',
    departamentos: '/departamentos',
    validarEmail: '/usuarios/validar-email',
    validarRut: '/usuarios/validar-rut'
  };

  /** Subject para usuarios en tiempo real */
  private usuariosSubject = new BehaviorSubject<Usuario[]>([]);
  
  /** Observable público de usuarios */
  public usuarios$ = this.usuariosSubject.asObservable();

  /** Subject para departamentos */
  private departamentosSubject = new BehaviorSubject<Departamento[]>([]);
  
  /** Observable público de departamentos */
  public departamentos$ = this.departamentosSubject.asObservable();

  /**
   * Constructor del servicio
   * @param http Cliente HTTP de Angular
   */
  constructor(private http: HttpClient) {
    console.log('🏗️ Inicializando UsuariosService con API:', this.apiUrl);
    this.cargarDepartamentosIniciales();
  }

  // ============ MÉTODOS PRIVADOS DE UTILIDAD ============

  /**
   * Obtiene los headers HTTP con autenticación
   * @returns Headers con token JWT
   */
  private obtenerHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * Maneja errores de las peticiones HTTP
   * @param error Error de la petición
   * @returns Observable con error procesado
   */
  private manejarError(error: any): Observable<never> {
    console.error('❌ Error en UsuariosService:', error);
    
    let mensajeError = 'Error desconocido en el servidor';
    
    if (error.error?.message) {
      mensajeError = error.error.message;
    } else if (error.status === 401) {
      mensajeError = 'No autorizado. Tu sesión ha expirado.';
      localStorage.removeItem('token');
    } else if (error.status === 403) {
      mensajeError = 'No tienes permisos para realizar esta acción.';
    } else if (error.status === 404) {
      mensajeError = 'Usuario no encontrado.';
    } else if (error.status === 409) {
      mensajeError = 'El correo ya existe en el sistema.';
    } else if (error.status === 422) {
      mensajeError = 'Datos de entrada inválidos.';
    } else if (error.status === 500) {
      mensajeError = 'Error interno del servidor. Intenta nuevamente.';
    } else if (error.status === 0) {
      mensajeError = 'No se puede conectar al servidor. Verifica tu conexión.';
    }

    return throwError(() => new Error(mensajeError));
  }

  /**
   * Convierte parámetros a HttpParams
   * @param filtros Filtros a convertir
   * @returns HttpParams configurado
   */
  private construirParametros(filtros: any): HttpParams {
    let params = new HttpParams();
    
    Object.keys(filtros).forEach(key => {
      if (filtros[key] !== undefined && filtros[key] !== null && filtros[key] !== '') {
        params = params.append(key, filtros[key].toString());
      }
    });
    
    return params;
  }

  /**
   * Valida los datos de un usuario antes de enviar
   * @param usuario Datos del usuario
   */
  private validarDatosUsuario(usuario: CrearUsuario): void {
    if (!usuario.nombre?.trim()) {
      throw new Error('El nombre es requerido');
    }
    if (!usuario.email?.trim()) {
      throw new Error('El correo es requerido');
    }
    if (!usuario.password?.trim()) {
      throw new Error('La contraseña es requerida');
    }
    if (usuario.password !== usuario.confirmarPassword) {
      throw new Error('Las contraseñas no coinciden');
    }
  }

  // ============ MÉTODOS DE USUARIOS ============

  /**
   * Obtiene la lista completa de usuarios
   * @param filtros Filtros opcionales
   * @returns Observable con lista de usuarios
   */
  obtenerUsuarios(filtros: FiltrosUsuario = {}): Observable<Usuario[]> {
    console.log('📋 Obteniendo usuarios con filtros:', filtros);
    
    const params = this.construirParametros(filtros);
    
    return this.http.get<RespuestaUsuarios>(
      `${this.apiUrl}${this.endpoints.usuarios}`,
      { 
        headers: this.obtenerHeaders(),
        params
      }
    ).pipe(
      map(respuesta => {
        if (respuesta.success && Array.isArray(respuesta.data)) {
          this.usuariosSubject.next(respuesta.data);
          return respuesta.data;
        }
        throw new Error(respuesta.message || 'Error al obtener usuarios');
      }),
      catchError(this.manejarError.bind(this))
    );
  }

  /**
   * Obtiene un usuario específico por ID
   * @param id ID del usuario
   * @returns Observable con usuario
   */
  obtenerUsuario(id: number): Observable<Usuario> {
    console.log('👤 Obteniendo usuario con ID:', id);
    
    return this.http.get<RespuestaUsuarios>(
      `${this.apiUrl}${this.endpoints.usuarios}/${id}`,
      { headers: this.obtenerHeaders() }
    ).pipe(
      map(respuesta => {
        if (respuesta.success && respuesta.data && !Array.isArray(respuesta.data)) {
          return respuesta.data;
        }
        throw new Error(respuesta.message || 'Usuario no encontrado');
      }),
      catchError(this.manejarError.bind(this))
    );
  }

  /**
   * Crea un nuevo usuario en el sistema
   * @param datosUsuario Datos del usuario a crear
   * @returns Observable con usuario creado
   */
  crearUsuario(datosUsuario: CrearUsuario): Observable<Usuario> {
    console.log('✨ Creando nuevo usuario:', { ...datosUsuario, password: '***', confirmarPassword: '***' });
    
    // Validar datos antes de enviar
    this.validarDatosUsuario(datosUsuario);
    
    // Mapear datos desde la interfaz del formulario al DTO del backend
    const datosBackend = {
      primer_nombre: this.extraerPrimerNombre(datosUsuario.nombre),
      segundo_nombre: this.extraerSegundoNombre(datosUsuario.nombre),
      primer_apellido: this.extraerPrimerApellido(datosUsuario.nombre),
      segundo_apellido: this.extraerSegundoApellido(datosUsuario.nombre),
      correo: datosUsuario.email,
      contrasena: datosUsuario.password,
      id_departamento: datosUsuario.id_departamento,
      rol: this.convertirRolAString(datosUsuario.rol)
    };
    
    return this.http.post<RespuestaUsuarios>(
      `${this.apiUrl}${this.endpoints.usuarios}`,
      datosBackend,
      { headers: this.obtenerHeaders() }
    ).pipe(
      map(respuesta => {
        if (respuesta.success && respuesta.data && !Array.isArray(respuesta.data)) {
          this.actualizarListaUsuarios();
          return respuesta.data;
        }
        throw new Error(respuesta.message || 'Error al crear usuario');
      }),
      catchError(this.manejarError.bind(this))
    );
  }

  /**
   * Actualiza un usuario existente
   * @param id ID del usuario a actualizar
   * @param datosActualizacion Datos a actualizar
   * @returns Observable con usuario actualizado
   */
  actualizarUsuario(id: number, datosActualizacion: ActualizarUsuario): Observable<Usuario> {
    console.log('📝 Actualizando usuario con ID:', id);
    
    return this.http.put<RespuestaUsuarios>(
      `${this.apiUrl}${this.endpoints.usuarios}/${id}`,
      datosActualizacion,
      { headers: this.obtenerHeaders() }
    ).pipe(
      map(respuesta => {
        if (respuesta.success && respuesta.data && !Array.isArray(respuesta.data)) {
          this.actualizarListaUsuarios();
          return respuesta.data;
        }
        throw new Error(respuesta.message || 'Error al actualizar usuario');
      }),
      catchError(this.manejarError.bind(this))
    );
  }

  /**
   * Elimina un usuario del sistema
   * @param id ID del usuario a eliminar
   * @returns Observable con confirmación
   */
  eliminarUsuario(id: number): Observable<boolean> {
    console.log('🗑️ Eliminando usuario con ID:', id);
    
    return this.http.delete<RespuestaUsuarios>(
      `${this.apiUrl}${this.endpoints.usuarios}/${id}`,
      { headers: this.obtenerHeaders() }
    ).pipe(
      map(respuesta => {
        if (respuesta.success) {
          this.actualizarListaUsuarios();
          return true;
        }
        throw new Error(respuesta.message || 'Error al eliminar usuario');
      }),
      catchError(this.manejarError.bind(this))
    );
  }

  // ============ MÉTODOS DE VALIDACIÓN ============

  /**
   * Valida si un correo electrónico está disponible
   * @param correo Correo a validar
   * @param usuarioId ID del usuario actual (para edición)
   * @returns Observable con resultado de validación
   */
  validarEmail(correo: string, usuarioId?: number): Observable<boolean> {
    console.log('✅ Validando disponibilidad de correo:', correo);
    
    let params = new HttpParams().set('email', correo);
    if (usuarioId) {
      params = params.set('usuarioId', usuarioId.toString());
    }
    
    return this.http.get<RespuestaValidacion>(
      `${this.apiUrl}${this.endpoints.validarEmail}`,
      { 
        headers: this.obtenerHeaders(),
        params
      }
    ).pipe(
      map(respuesta => respuesta.disponible),
      catchError(error => {
        console.error('Error validando correo:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Valida si un RUT está disponible
   * @param rut RUT a validar
   * @param usuarioId ID del usuario actual (para edición)
   * @returns Observable con resultado de validación
   */
  validarRut(rut: string, usuarioId?: number): Observable<boolean> {
    console.log('✅ Validando disponibilidad de RUT:', rut);
    
    let params = new HttpParams().set('rut', rut);
    if (usuarioId) {
      params = params.set('usuarioId', usuarioId.toString());
    }
    
    return this.http.get<RespuestaValidacion>(
      `${this.apiUrl}${this.endpoints.validarRut}`,
      { 
        headers: this.obtenerHeaders(),
        params
      }
    ).pipe(
      map(respuesta => respuesta.disponible),
      catchError(error => {
        console.error('Error validando RUT:', error);
        return throwError(() => error);
      })
    );
  }

  // ============ MÉTODOS DE DEPARTAMENTOS ============

  /**
   * Obtiene la lista de departamentos
   * @param activo Filtrar por estado activo
   * @returns Observable con lista de departamentos
   */
  obtenerDepartamentos(activo: boolean = true): Observable<Departamento[]> {
    console.log('🏢 Obteniendo departamentos, activos:', activo);
    
    const params = new HttpParams().set('activo', activo.toString());
    
    return this.http.get<RespuestaDepartamentos>(
      `${this.apiUrl}${this.endpoints.departamentos}`,
      { 
        headers: this.obtenerHeaders(),
        params
      }
    ).pipe(
      map(respuesta => {
        if (respuesta.success && Array.isArray(respuesta.data)) {
          this.departamentosSubject.next(respuesta.data);
          return respuesta.data;
        }
        throw new Error(respuesta.message || 'Error al obtener departamentos');
      }),
      catchError(this.manejarError.bind(this))
    );
  }

  // ============ MÉTODOS DE UTILIDAD PRIVADOS ============

  /**
   * Actualiza la lista local de usuarios
   */
  private actualizarListaUsuarios(): void {
    this.obtenerUsuarios().subscribe({
      next: (usuarios) => console.log('📋 Lista de usuarios actualizada:', usuarios.length),
      error: (error) => console.error('❌ Error actualizando lista de usuarios:', error)
    });
  }

  /**
   * Carga inicial de departamentos
   */
  private cargarDepartamentosIniciales(): void {
    this.obtenerDepartamentos().subscribe({
      next: (departamentos) => console.log('🏢 Departamentos cargados inicialmente:', departamentos.length),
      error: (error) => console.error('❌ Error cargando departamentos iniciales:', error)
    });
  }

  /**
   * Extrae el primer nombre de un nombre completo
   * @param nombreCompleto Nombre completo
   * @returns Primer nombre
   */
  private extraerPrimerNombre(nombreCompleto: string): string {
    const partes = nombreCompleto.trim().split(' ').filter(parte => parte.length > 0);
    return partes[0] || '';
  }

  /**
   * Extrae el segundo nombre de un nombre completo
   * @param nombreCompleto Nombre completo
   * @returns Segundo nombre o null
   */
  private extraerSegundoNombre(nombreCompleto: string): string | null {
    const partes = nombreCompleto.trim().split(' ').filter(parte => parte.length > 0);
    if (partes.length >= 4) {
      return partes[1];
    }
    return null;
  }

  /**
   * Extrae el primer apellido de un nombre completo
   * @param nombreCompleto Nombre completo
   * @returns Primer apellido
   */
  private extraerPrimerApellido(nombreCompleto: string): string {
    const partes = nombreCompleto.trim().split(' ').filter(parte => parte.length > 0);
    if (partes.length >= 4) {
      return partes[2];
    } else if (partes.length === 3) {
      return partes[1];
    } else if (partes.length === 2) {
      return partes[1];
    }
    return '';
  }

  /**
   * Extrae el segundo apellido de un nombre completo
   * @param nombreCompleto Nombre completo
   * @returns Segundo apellido
   */
  private extraerSegundoApellido(nombreCompleto: string): string {
    const partes = nombreCompleto.trim().split(' ').filter(parte => parte.length > 0);
    if (partes.length >= 4) {
      return partes[3];
    } else if (partes.length === 3) {
      return partes[2];
    }
    return '';
  }

  /**
   * Convierte el enum RolUsuario a string para el backend
   * @param rol Rol del enum
   * @returns String del rol
   */
  private convertirRolAString(rol: RolUsuario): string {
    const mapeoRoles = {
      [RolUsuario.ADMINISTRADOR]: 'administrador',
      [RolUsuario.RESPONSABLE]: 'responsable',
      [RolUsuario.USUARIO_INTERNO]: 'usuario_interno',
      [RolUsuario.USUARIO_EXTERNO]: 'usuario_externo'
    };
    
    return mapeoRoles[rol] || 'usuario_interno';
  }

  // ============ MÉTODOS PÚBLICOS DE UTILIDAD ============

  /**
   * Formatea un RUT chileno
   * @param rut RUT sin formatear
   * @returns RUT formateado (ej: 12.345.678-9)
   */
  formatearRut(rut: string): string {
    const rutLimpio = rut.replace(/[^0-9kK]/g, '').toUpperCase();
    
    if (rutLimpio.length < 2) {
      return rutLimpio;
    }
    
    const cuerpo = rutLimpio.slice(0, -1);
    const dv = rutLimpio.slice(-1);
    
    const cuerpoFormateado = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    
    return `${cuerpoFormateado}-${dv}`;
  }

  /**
   * Valida el formato de un RUT chileno
   * @param rut RUT a validar
   * @returns true si el formato es válido
   */
  validarFormatoRut(rut: string): boolean {
    const rutRegex = /^\d{1,3}(\.\d{3})*-[0-9kK]$/;
    return rutRegex.test(rut);
  }

  /**
   * Calcula el dígito verificador de un RUT
   * @param rutSinDv RUT sin dígito verificador
   * @returns Dígito verificador calculado
   */
  calcularDigitoVerificador(rutSinDv: string): string {
    let suma = 0;
    let multiplicador = 2;
    
    for (let i = rutSinDv.length - 1; i >= 0; i--) {
      suma += parseInt(rutSinDv[i]) * multiplicador;
      multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
    }
    
    const resto = suma % 11;
    const dv = 11 - resto;
    
    if (dv === 11) return '0';
    if (dv === 10) return 'K';
    return dv.toString();
  }

  /**
   * Obtiene el nombre completo de un usuario
   * @param usuario Usuario del cual obtener el nombre
   * @returns Nombre completo formateado
   */
  obtenerNombreCompleto(usuario: Usuario): string {
    const partes = [
      usuario.nombre || '',
    ].filter(parte => parte.trim().length > 0);
    
    return partes.join(' ');
  }

  /**
   * Obtiene la etiqueta legible de un rol
   * @param rol Rol del usuario
   * @returns Etiqueta legible del rol
   */
  obtenerEtiquetaRol(rol: RolUsuario): string {
    const etiquetas = {
      [RolUsuario.ADMINISTRADOR]: 'Administrador',
      [RolUsuario.RESPONSABLE]: 'Responsable',
      [RolUsuario.USUARIO_INTERNO]: 'Usuario Interno',
      [RolUsuario.USUARIO_EXTERNO]: 'Usuario Externo'
    };
    
    return etiquetas[rol] || 'Usuario';
  }

  /**
   * Verifica si un usuario tiene permisos de administrador
   * @param usuario Usuario a verificar
   * @returns true si es administrador
   */
  esAdministrador(usuario: Usuario): boolean {
    return usuario.rol === RolUsuario.ADMINISTRADOR;
  }

  /**
   * Verifica si un usuario tiene permisos de responsable o superior
   * @param usuario Usuario a verificar
   * @returns true si es responsable o administrador
   */
  esResponsableOSuperior(usuario: Usuario): boolean {
    return [RolUsuario.ADMINISTRADOR, RolUsuario.RESPONSABLE].includes(usuario.rol);
  }

  /**
   * Obtiene los usuarios filtrados por departamento
   * @param idDepartamento ID del departamento
   * @returns Observable con usuarios del departamento
   */
  obtenerUsuariosPorDepartamento(idDepartamento: number): Observable<Usuario[]> {
    return this.obtenerUsuarios({ departamento: idDepartamento });
  }

  /**
   * Obtiene los usuarios filtrados por rol
   * @param rol Rol a filtrar
   * @returns Observable con usuarios del rol especificado
   */
  obtenerUsuariosPorRol(rol: RolUsuario): Observable<Usuario[]> {
    return this.obtenerUsuarios({ rol });
  }

  /**
   * Busca usuarios por nombre o correo
   * @param termino Término de búsqueda
   * @returns Observable con usuarios que coinciden
   */
  buscarUsuarios(termino: string): Observable<Usuario[]> {
    return this.obtenerUsuarios({ nombre: termino });
  }

  // ============ MÉTODOS DE ESTADO ============

  /**
   * Limpia la cache local de usuarios
   */
  limpiarCacheUsuarios(): void {
    this.usuariosSubject.next([]);
    console.log('🧹 Cache de usuarios limpiada');
  }

  /**
   * Limpia la cache local de departamentos
   */
  limpiarCacheDepartamentos(): void {
    this.departamentosSubject.next([]);
    console.log('🧹 Cache de departamentos limpiada');
  }

  /**
   * Refresca todos los datos
   */
  refrescarDatos(): void {
    console.log('🔄 Refrescando todos los datos...');
    this.actualizarListaUsuarios();
    this.cargarDepartamentosIniciales();
  }

  /**
   * Obtiene estadísticas básicas de usuarios
   * @returns Observable con estadísticas
   */
  obtenerEstadisticasUsuarios(): Observable<any> {
    return this.obtenerUsuarios().pipe(
      map(usuarios => {
        const stats = {
          total: usuarios.length,
          administradores: usuarios.filter(u => u.rol === RolUsuario.ADMINISTRADOR).length,
          responsables: usuarios.filter(u => u.rol === RolUsuario.RESPONSABLE).length,
          usuarios_internos: usuarios.filter(u => u.rol === RolUsuario.USUARIO_INTERNO).length,
          usuarios_externos: usuarios.filter(u => u.rol === RolUsuario.USUARIO_EXTERNO).length,
          departamentos_representados: [...new Set(usuarios.map(u => u.id_departamento))].length
        };
        
        console.log('📊 Estadísticas de usuarios:', stats);
        return stats;
      })
    );
  }

  // ============ MÉTODOS DE GESTIÓN DE ARCHIVOS ============

  /**
   * Exporta la lista de usuarios a CSV
   * @param filtros Filtros opcionales para la exportación
   * @returns Observable con blob del archivo CSV
   */
  exportarUsuariosCSV(filtros: FiltrosUsuario = {}): Observable<Blob> {
    console.log('📊 Exportando usuarios a CSV con filtros:', filtros);
    
    const params = this.construirParametros({ ...filtros, formato: 'csv' });
    
    return this.http.get(
      `${this.apiUrl}${this.endpoints.usuarios}/exportar`,
      { 
        headers: this.obtenerHeaders(),
        params,
        responseType: 'blob'
      }
    ).pipe(
      catchError(this.manejarError.bind(this))
    );
  }

  // ============ MÉTODOS DE CLEANUP ============

  /**
   * Limpia todos los recursos del servicio
   */
  destruirServicio(): void {
    console.log('🧹 Limpiando recursos del UsuariosService...');
    this.limpiarCacheUsuarios();
    this.limpiarCacheDepartamentos();
  }

  /**
   * Verifica el estado del servicio
   * @returns Objeto con estado del servicio
   */
  obtenerEstadoServicio(): any {
    const usuariosActuales = this.usuariosSubject.value;
    const departamentosActuales = this.departamentosSubject.value;
    
    return {
      usuarios_cache: usuariosActuales.length,
      departamentos_cache: departamentosActuales.length,
      api_url: this.apiUrl,
      token_presente: !!localStorage.getItem('token'),
      timestamp: new Date().toISOString()
    };
  }
}