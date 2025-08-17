import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';


//Interface para el resumen general de la empresa
interface ResumenEmpresa {
  totalTickets: number;
  ticketsAbiertos: number;
  ticketsCerrados: number;
  ticketsPendientes: number;
  ticketsVencidos: number;
  tiempoPromedioResolucion: number;
  satisfaccionPromedio: number;
  usuariosActivos: number;
}

//nterface para métricas de departamento
interface MetricasDepartamento {
  id: number;
  nombre: string;
  totalTickets: number;
  ticketsAbiertos: number;
  ticketsCerrados: number;
  porcentajeResolucion: number;
  tiempoPromedioResolucion: number;
  satisfaccionPromedio: number;
  color: string;
}

//Interface para tendencias mensuales
interface TendenciaMensual {
  mes: string;
  creados: number;
  resueltos: number;
  pendientes: number;
}

//Interface para tickets por estado
interface TicketsPorEstado {
  estado: string;
  cantidad: number;
  porcentaje: number;
}

//Interface para datos de usuarios
interface Usuario {
  id: number;
  nombre: string;
  correo: string;
  id_rol: number;
  nombre_rol: string;
  id_departamento?: number;
  nombre_departamento?: string;
  activo: boolean;
  fecha_creacion: string;
  ultimo_acceso?: string;
}

/**
 * Interface para respuesta del backend
 */
interface RespuestaApi<T> {
  success: boolean;
  data: T;
  message: string;
  error?: string;
}

/**
 * Servicio para manejar las operaciones del administrador
 * Gestiona la comunicación con el backend para métricas, usuarios y configuración
 */
@Injectable({
  providedIn: 'root'
})
export class AdminService {

  private readonly apiUrl = environment.apiUrl;
  private readonly endpoints = {
    resumenEmpresa: '/admin/resumen-empresa',
    metricasDepartamentos: '/admin/metricas-departamentos',
    tendenciaMensual: '/admin/tendencia-mensual',
    ticketsPorEstado: '/admin/tickets-estado',
    usuarios: '/admin/usuarios',
    departamentos: '/admin/departamentos',
    configuracion: '/admin/configuracion'
  };

  /**
   * Constructor del servicio
   * @param http - Cliente HTTP de Angular
   */
  constructor(private http: HttpClient) { }

  /**
   * Obtiene los headers de autenticación con el token JWT
   * @returns Headers HTTP con Authorization
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
   * @param error - Error de la petición
   * @returns Observable con el error procesado
   */
  private manejarError(error: any): Observable<never> {
    console.error('Error en AdminService:', error);
    
    let mensajeError = 'Error desconocido';
    
    if (error.error?.message) {
      mensajeError = error.error.message;
    } else if (error.status === 401) {
      mensajeError = 'No autorizado. Token expirado o inválido.';
    } else if (error.status === 403) {
      mensajeError = 'No tienes permisos para realizar esta acción.';
    } else if (error.status === 404) {
      mensajeError = 'Recurso no encontrado.';
    } else if (error.status === 500) {
      mensajeError = 'Error interno del servidor.';
    } else if (error.status === 0) {
      mensajeError = 'Error de conexión. Verifica tu conexión a internet.';
    }

    return throwError(() => new Error(mensajeError));
  }

  /**
   * Obtiene el resumen general de la empresa
   * @returns Observable con las métricas generales
   */
  obtenerResumenEmpresa(): Observable<ResumenEmpresa> {
    const headers = this.obtenerHeaders();
    
    return this.http.get<RespuestaApi<ResumenEmpresa>>(
      `${this.apiUrl}${this.endpoints.resumenEmpresa}`,
      { headers }
    ).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.message || 'Error al obtener resumen de empresa');
        }
        return response.data;
      }),
      catchError(this.manejarError)
    );
  }

  /**
   * Obtiene las métricas de todos los departamentos
   * @returns Observable con array de métricas por departamento
   */
  obtenerMetricasDepartamentos(): Observable<MetricasDepartamento[]> {
    const headers = this.obtenerHeaders();
    
    return this.http.get<RespuestaApi<MetricasDepartamento[]>>(
      `${this.apiUrl}${this.endpoints.metricasDepartamentos}`,
      { headers }
    ).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.message || 'Error al obtener métricas de departamentos');
        }
        return response.data;
      }),
      catchError(this.manejarError)
    );
  }

  /**
   * Obtiene las métricas de un departamento específico
   * @param idDepartamento - ID del departamento
   * @returns Observable con las métricas del departamento
   */
  obtenerMetricasDepartamento(idDepartamento: number): Observable<MetricasDepartamento> {
    const headers = this.obtenerHeaders();
    
    return this.http.get<RespuestaApi<MetricasDepartamento>>(
      `${this.apiUrl}${this.endpoints.metricasDepartamentos}/${idDepartamento}`,
      { headers }
    ).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.message || 'Error al obtener métricas del departamento');
        }
        return response.data;
      }),
      catchError(this.manejarError)
    );
  }

  /**
   * Obtiene la tendencia mensual de tickets
   * @param meses - Número de meses hacia atrás (por defecto 6)
   * @returns Observable con datos de tendencia mensual
   */
  obtenerTendenciaMensual(meses: number = 6): Observable<TendenciaMensual[]> {
    const headers = this.obtenerHeaders();
    
    return this.http.get<RespuestaApi<TendenciaMensual[]>>(
      `${this.apiUrl}${this.endpoints.tendenciaMensual}?meses=${meses}`,
      { headers }
    ).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.message || 'Error al obtener tendencia mensual');
        }
        return response.data;
      }),
      catchError(this.manejarError)
    );
  }

  /**
   * Obtiene la distribución de tickets por estado
   * @param idDepartamento - ID del departamento (opcional, si no se envía obtiene de todos)
   * @returns Observable con distribución por estado
   */
  obtenerTicketsPorEstado(idDepartamento?: number): Observable<TicketsPorEstado[]> {
    const headers = this.obtenerHeaders();
    let url = `${this.apiUrl}${this.endpoints.ticketsPorEstado}`;
    
    if (idDepartamento) {
      url += `?departamento=${idDepartamento}`;
    }
    
    return this.http.get<RespuestaApi<TicketsPorEstado[]>>(url, { headers }).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.message || 'Error al obtener tickets por estado');
        }
        return response.data;
      }),
      catchError(this.manejarError)
    );
  }

  /**
   * Obtiene la lista de todos los usuarios
   * @returns Observable con array de usuarios
   */
  obtenerUsuarios(): Observable<Usuario[]> {
    const headers = this.obtenerHeaders();
    
    return this.http.get<RespuestaApi<Usuario[]>>(
      `${this.apiUrl}${this.endpoints.usuarios}`,
      { headers }
    ).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.message || 'Error al obtener usuarios');
        }
        return response.data;
      }),
      catchError(this.manejarError)
    );
  }

  /**
   * Crea un nuevo usuario
   * @param usuario - Datos del usuario a crear
   * @returns Observable con el usuario creado
   */
  crearUsuario(usuario: Partial<Usuario>): Observable<Usuario> {
    const headers = this.obtenerHeaders();
    
    return this.http.post<RespuestaApi<Usuario>>(
      `${this.apiUrl}${this.endpoints.usuarios}`,
      usuario,
      { headers }
    ).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.message || 'Error al crear usuario');
        }
        return response.data;
      }),
      catchError(this.manejarError)
    );
  }

  /**
   * Actualiza un usuario existente
   * @param id - ID del usuario
   * @param usuario - Datos actualizados del usuario
   * @returns Observable con el usuario actualizado
   */
  actualizarUsuario(id: number, usuario: Partial<Usuario>): Observable<Usuario> {
    const headers = this.obtenerHeaders();
    
    return this.http.put<RespuestaApi<Usuario>>(
      `${this.apiUrl}${this.endpoints.usuarios}/${id}`,
      usuario,
      { headers }
    ).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.message || 'Error al actualizar usuario');
        }
        return response.data;
      }),
      catchError(this.manejarError)
    );
  }

  /**
   * Elimina un usuario
   * @param id - ID del usuario a eliminar
   * @returns Observable con confirmación de eliminación
   */
  eliminarUsuario(id: number): Observable<boolean> {
    const headers = this.obtenerHeaders();
    
    return this.http.delete<RespuestaApi<any>>(
      `${this.apiUrl}${this.endpoints.usuarios}/${id}`,
      { headers }
    ).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.message || 'Error al eliminar usuario');
        }
        return true;
      }),
      catchError(this.manejarError)
    );
  }

  /**
   * Obtiene la lista de departamentos
   * @returns Observable con array de departamentos
   */
  obtenerDepartamentos(): Observable<any[]> {
    const headers = this.obtenerHeaders();
    
    return this.http.get<RespuestaApi<any[]>>(
      `${this.apiUrl}${this.endpoints.departamentos}`,
      { headers }
    ).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.message || 'Error al obtener departamentos');
        }
        return response.data;
      }),
      catchError(this.manejarError)
    );
  }

  /**
   * Obtiene datos para reportes personalizados
   * @param filtros - Filtros para el reporte
   * @returns Observable con datos del reporte
   */
  obtenerDatosReporte(filtros: any): Observable<any> {
    const headers = this.obtenerHeaders();
    
    return this.http.post<RespuestaApi<any>>(
      `${this.apiUrl}/admin/reportes`,
      filtros,
      { headers }
    ).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.message || 'Error al generar reporte');
        }
        return response.data;
      }),
      catchError(this.manejarError)
    );
  }

  /**
   * Obtiene la configuración del sistema
   * @returns Observable con la configuración actual
   */
  obtenerConfiguracion(): Observable<any> {
    const headers = this.obtenerHeaders();
    
    return this.http.get<RespuestaApi<any>>(
      `${this.apiUrl}${this.endpoints.configuracion}`,
      { headers }
    ).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.message || 'Error al obtener configuración');
        }
        return response.data;
      }),
      catchError(this.manejarError)
    );
  }

  /**
   * Actualiza la configuración del sistema
   * @param configuracion - Nueva configuración
   * @returns Observable con confirmación de actualización
   */
  actualizarConfiguracion(configuracion: any): Observable<boolean> {
    const headers = this.obtenerHeaders();
    
    return this.http.put<RespuestaApi<any>>(
      `${this.apiUrl}${this.endpoints.configuracion}`,
      configuracion,
      { headers }
    ).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.message || 'Error al actualizar configuración');
        }
        return true;
      }),
      catchError(this.manejarError)
    );
  }

  /**
   * Verifica el estado de salud del sistema
   * @returns Observable con el estado del sistema
   */
  verificarEstadoSistema(): Observable<any> {
    const headers = this.obtenerHeaders();
    
    return this.http.get<RespuestaApi<any>>(
      `${this.apiUrl}/admin/estado-sistema`,
      { headers }
    ).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.message || 'Error al verificar estado del sistema');
        }
        return response.data;
      }),
      catchError(this.manejarError)
    );
  }

  /**
   * Exporta datos a Excel
   * @param tipo - Tipo de datos a exportar ('usuarios', 'tickets', 'reportes')
   * @param filtros - Filtros para la exportación
   * @returns Observable con el archivo blob
   */
  exportarDatos(tipo: string, filtros?: any): Observable<Blob> {
    const headers = this.obtenerHeaders();
    
    return this.http.post(
      `${this.apiUrl}/admin/exportar/${tipo}`,
      filtros || {},
      { 
        headers, 
        responseType: 'blob' 
      }
    ).pipe(
      catchError(this.manejarError)
    );
  }

  /**
   * Envía notificaciones masivas
   * @param notificacion - Datos de la notificación
   * @returns Observable con confirmación de envío
   */
  enviarNotificacionMasiva(notificacion: any): Observable<boolean> {
    const headers = this.obtenerHeaders();
    
    return this.http.post<RespuestaApi<any>>(
      `${this.apiUrl}/admin/notificacion-masiva`,
      notificacion,
      { headers }
    ).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.message || 'Error al enviar notificación');
        }
        return true;
      }),
      catchError(this.manejarError)
    );
  }
}