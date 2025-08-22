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
  FiltrosUsuario 
} from '../interfaces/admin-usuarios.interface';

/**
 * Servicio para gestión de usuarios del sistema
 * Maneja todas las operaciones CRUD y comunicación con el backend
 */
@Injectable({
  providedIn: 'root'
})
export class UsuariosService {

  /** URL base del API */
  private readonly apiUrl = environment.apiUrl;
  
  /** Endpoints específicos */
  private readonly endpoints = {
    usuarios: '/admin/usuarios',
    departamentos: '/admin/departamentos',
    validarEmail: '/admin/usuarios/validar-email',
    validarRut: '/admin/usuarios/validar-rut'
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
    this.cargarDepartamentos();
  }

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
    console.error('Error en UsuariosService:', error);
    
    let mensajeError = 'Error desconocido en el servidor';
    
    // Procesar diferentes tipos de errores
    if (error.error?.message) {
      mensajeError = error.error.message;
    } else if (error.status === 401) {
      mensajeError = 'No autorizado. Tu sesión ha expirado.';
      // Redirigir al login si es necesario
      localStorage.removeItem('token');
    } else if (error.status === 403) {
      mensajeError = 'No tienes permisos para realizar esta acción.';
    } else if (error.status === 404) {
      mensajeError = 'Usuario no encontrado.';
    } else if (error.status === 409) {
      mensajeError = 'El email o RUT ya existe en el sistema.';
    } else if (error.status === 422) {
      mensajeError = 'Datos de entrada inválidos.';
    } else if (error.status === 500) {
      mensajeError = 'Error interno del servidor.';
    } else if (error.status === 0) {
      mensajeError = 'Error de conexión. Verifica tu conexión a internet.';
    }

    return throwError(() => new Error(mensajeError));
  }

  /**
   * Obtiene la lista completa de usuarios con filtros opcionales
   * @param filtros Filtros para la búsqueda
   * @returns Observable con array de usuarios
   */
  obtenerUsuarios(filtros?: FiltrosUsuario): Observable<Usuario[]> {
    const headers = this.obtenerHeaders();
    let params = new HttpParams();

    // Aplicar filtros si existen
    if (filtros) {
      if (filtros.nombre) {
        params = params.set('nombre', filtros.nombre);
      }
      if (filtros.departamento) {
        params = params.set('departamento', filtros.departamento.toString());
      }
      if (filtros.rol) {
        params = params.set('rol', filtros.rol);
      }
      if (filtros.ordenarPor) {
        params = params.set('ordenarPor', filtros.ordenarPor);
      }
      if (filtros.direccion) {
        params = params.set('direccion', filtros.direccion);
      }
      if (filtros.pagina) {
        params = params.set('pagina', filtros.pagina.toString());
      }
      if (filtros.limite) {
        params = params.set('limite', filtros.limite.toString());
      }
    }

    return this.http.get<RespuestaUsuarios>(
      `${this.apiUrl}${this.endpoints.usuarios}`,
      { headers, params }
    ).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.message || 'Error al obtener usuarios');
        }
        
        // Asegurar que data es un array
        const usuarios = Array.isArray(response.data) ? response.data : [response.data];
        
        // Actualizar el subject
        this.usuariosSubject.next(usuarios);
        
        return usuarios;
      }),
      catchError(this.manejarError)
    );
  }

  /**
   * Obtiene un usuario específico por ID
   * @param id ID del usuario
   * @returns Observable con el usuario
   */
  obtenerUsuarioPorId(id: number): Observable<Usuario> {
    const headers = this.obtenerHeaders();
    
    return this.http.get<RespuestaUsuarios>(
      `${this.apiUrl}${this.endpoints.usuarios}/${id}`,
      { headers }
    ).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.message || 'Error al obtener usuario');
        }
        
        // Asegurar que data es un usuario individual
        const usuario = Array.isArray(response.data) ? response.data[0] : response.data;
        return usuario;
      }),
      catchError(this.manejarError)
    );
  }

  /**
   * Crea un nuevo usuario en el sistema
   * @param usuario Datos del nuevo usuario
   * @returns Observable con el usuario creado
   */
  crearUsuario(usuario: CrearUsuario): Observable<Usuario> {
    const headers = this.obtenerHeaders();
    
    // Validar datos antes de enviar
    this.validarDatosUsuario(usuario);
    
    // Remover confirmarPassword antes de enviar al backend
    const { confirmarPassword, ...datosUsuario } = usuario;
    
    return this.http.post<RespuestaUsuarios>(
      `${this.apiUrl}${this.endpoints.usuarios}`,
      datosUsuario,
      { headers }
    ).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.message || 'Error al crear usuario');
        }
        
        const usuarioCreado = Array.isArray(response.data) ? response.data[0] : response.data;
        
        // Actualizar la lista de usuarios
        this.refrescarUsuarios();
        
        return usuarioCreado;
      }),
      catchError(this.manejarError)
    );
  }

  /**
   * Actualiza un usuario existente
   * @param id ID del usuario
   * @param usuario Datos actualizados
   * @returns Observable con el usuario actualizado
   */
  actualizarUsuario(id: number, usuario: ActualizarUsuario): Observable<Usuario> {
    const headers = this.obtenerHeaders();
    
    // Remover confirmarPassword si existe
    const { confirmarPassword, ...datosUsuario } = usuario;
    
    return this.http.put<RespuestaUsuarios>(
      `${this.apiUrl}${this.endpoints.usuarios}/${id}`,
      datosUsuario,
      { headers }
    ).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.message || 'Error al actualizar usuario');
        }
        
        const usuarioActualizado = Array.isArray(response.data) ? response.data[0] : response.data;
        
        // Actualizar la lista de usuarios
        this.refrescarUsuarios();
        
        return usuarioActualizado;
      }),
      catchError(this.manejarError)
    );
  }

  /**
   * Elimina un usuario del sistema
   * @param id ID del usuario a eliminar
   * @returns Observable con confirmación
   */
  eliminarUsuario(id: number): Observable<boolean> {
    const headers = this.obtenerHeaders();
    
    return this.http.delete<RespuestaUsuarios>(
      `${this.apiUrl}${this.endpoints.usuarios}/${id}`,
      { headers }
    ).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.message || 'Error al eliminar usuario');
        }
        
        // Actualizar la lista de usuarios
        this.refrescarUsuarios();
        
        return true;
      }),
      catchError(this.manejarError)
    );
  }

  /**
   * Obtiene la lista de departamentos activos
   * @returns Observable con array de departamentos
   */
  obtenerDepartamentos(): Observable<Departamento[]> {
    const headers = this.obtenerHeaders();
    
    return this.http.get<any>(
      `${this.apiUrl}${this.endpoints.departamentos}`,
      { headers }
    ).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.message || 'Error al obtener departamentos');
        }
        
        const departamentos = Array.isArray(response.data) ? response.data : [response.data];
        
        // Actualizar el subject
        this.departamentosSubject.next(departamentos);
        
        return departamentos;
      }),
      catchError(this.manejarError)
    );
  }

  /**
   * Valida si un email está disponible
   * @param email Email a validar
   * @param usuarioId ID del usuario actual (para edición)
   * @returns Observable con resultado de validación
   */
  validarEmail(email: string, usuarioId?: number): Observable<boolean> {
    const headers = this.obtenerHeaders();
    let params = new HttpParams().set('email', email);
    
    if (usuarioId) {
      params = params.set('usuarioId', usuarioId.toString());
    }
    
    return this.http.get<any>(
      `${this.apiUrl}${this.endpoints.validarEmail}`,
      { headers, params }
    ).pipe(
      map(response => response.disponible),
      catchError(this.manejarError)
    );
  }

  /**
   * Valida si un RUT está disponible
   * @param rut RUT a validar
   * @param usuarioId ID del usuario actual (para edición)
   * @returns Observable con resultado de validación
   */
  validarRut(rut: string, usuarioId?: number): Observable<boolean> {
    const headers = this.obtenerHeaders();
    let params = new HttpParams().set('rut', rut);
    
    if (usuarioId) {
      params = params.set('usuarioId', usuarioId.toString());
    }
    
    return this.http.get<any>(
      `${this.apiUrl}${this.endpoints.validarRut}`,
      { headers, params }
    ).pipe(
      map(response => response.disponible),
      catchError(this.manejarError)
    );
  }

  /**
   * Refresca la lista de usuarios desde el servidor
   */
  private refrescarUsuarios(): void {
    this.obtenerUsuarios().subscribe({
      next: (usuarios) => {
        console.log('Usuarios actualizados:', usuarios.length);
      },
      error: (error) => {
        console.error('Error al refrescar usuarios:', error);
      }
    });
  }

  /**
   * Carga la lista de departamentos al inicializar el servicio
   */
  private cargarDepartamentos(): void {
    this.obtenerDepartamentos().subscribe({
      next: (departamentos) => {
        console.log('Departamentos cargados:', departamentos.length);
      },
      error: (error) => {
        console.error('Error al cargar departamentos:', error);
      }
    });
  }

  /**
   * Valida los datos básicos de un usuario
   * @param usuario Datos del usuario a validar
   */
  private validarDatosUsuario(usuario: CrearUsuario | ActualizarUsuario): void {
    if ('confirmarPassword' in usuario && usuario.password !== usuario.confirmarPassword) {
      throw new Error('Las contraseñas no coinciden');
    }
    
    if ('email' in usuario && usuario.email && !this.validarFormatoEmail(usuario.email)) {
      throw new Error('Formato de email inválido');
    }
    
    if ('rut' in usuario && usuario.rut && !this.validarFormatoRut(usuario.rut)) {
      throw new Error('Formato de RUT inválido');
    }
  }

  /**
   * Valida el formato de un email
   * @param email Email a validar
   * @returns true si el formato es válido
   */
  private validarFormatoEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  /**
   * Valida el formato de un RUT chileno
   * @param rut RUT a validar
   * @returns true si el formato es válido
   */
  private validarFormatoRut(rut: string): boolean {
    // Remover puntos y guión
    const rutLimpio = rut.replace(/\./g, '').replace('-', '');
    
    // Verificar longitud
    if (rutLimpio.length < 8 || rutLimpio.length > 9) {
      return false;
    }
    
    // Separar número y dígito verificador
    const numero = rutLimpio.slice(0, -1);
    const dv = rutLimpio.slice(-1).toLowerCase();
    
    // Calcular dígito verificador
    let suma = 0;
    let multiplicador = 2;
    
    for (let i = numero.length - 1; i >= 0; i--) {
      suma += parseInt(numero[i]) * multiplicador;
      multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
    }
    
    const resto = suma % 11;
    const dvCalculado = resto === 0 ? '0' : resto === 1 ? 'k' : (11 - resto).toString();
    
    return dv === dvCalculado;
  }

  /**
   * Formatea un RUT con puntos y guión
   * @param rut RUT sin formato
   * @returns RUT formateado
   */
  formatearRut(rut: string): string {
    // Remover formato previo
    const rutLimpio = rut.replace(/\./g, '').replace('-', '');
    
    if (rutLimpio.length < 2) {
      return rutLimpio;
    }
    
    // Separar número y dígito verificador
    const numero = rutLimpio.slice(0, -1);
    const dv = rutLimpio.slice(-1);
    
    // Agregar puntos al número
    const numeroFormateado = numero.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    
    return `${numeroFormateado}-${dv}`;
  }

  /**
   * Limpia todos los datos en memoria
   */
  limpiar(): void {
    this.usuariosSubject.next([]);
    this.departamentosSubject.next([]);
  }
}