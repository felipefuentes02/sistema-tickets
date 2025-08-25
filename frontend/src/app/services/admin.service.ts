import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, map, retry, timeout } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface ResumenEmpresa {
  totalTickets: number;
  ticketsAbiertos: number;
  ticketsCerrados: number;
  ticketsPendientes: number;
  ticketsVencidos: number;
  tiempoPromedioResolucion: number;
  satisfaccionPromedio: number;
  usuariosActivos: number;
}

/**
 * Interface para métricas de departamento
 */
export interface MetricasDepartamento {
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

/**
 * Interface para métricas detalladas por departamento
 */
export interface MetricasDepartamentoDetalladas {
  id: number;
  nombre: string;
  totalTickets: number;
  ticketsAbiertos: number;
  ticketsCerrados: number;
  ticketsPendientes: number;
  ticketsVencidos: number;
  ticketsDerivados: number;
  ticketsEscalados: number;
  tiempoPromedioResolucion: number;
  tiempoPromedioRespuesta: number;
  satisfaccionPromedio: number;
  eficienciaResolucion: number;
  usuariosActivos: number;
  cargaTrabajo: number;
  color: string;
}

/**
 * Interface para tendencias mensuales
 */
export interface TendenciaMensual {
  mes: string;
  creados: number;
  resueltos: number;
  pendientes: number;
}

/**
 * Interface para tickets por estado
 */
export interface TicketsPorEstado {
  estado: string;
  cantidad: number;
  porcentaje: number;
  color: string;
}

/**
 * Interface para tickets por prioridad
 */
export interface TicketsPorPrioridad {
  prioridad: string;
  cantidad: number;
  color: string;
}

/**
 * Interface para tendencia semanal
 */
export interface TendenciaSemanal {
  dia: string;
  creados: number;
  resueltos: number;
}

/**
 * Interface para datos de usuarios
 */
export interface Usuario {
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
 * Interface para métricas de usuarios por departamento
 */
export interface MetricasUsuario {
  id: number;
  nombreCompleto: string;
  correo: string;
  departamento: string;
  ticketsAsignados: number;
  ticketsResueltos: number;
  ticketsPendientes: number;
  tiempoPromedioResolucion: number;
  satisfaccionPromedio: number;
  eficiencia: number;
}

/**
 * Interface para distribución de tickets por estado y departamento
 */
export interface DistribucionTickets {
  departamento: string;
  abiertos: number;
  enProceso: number;
  pendientes: number;
  cerrados: number;
  vencidos: number;
  derivados: number;
  escalados: number;
}

/**
 * Interface para tendencias temporales avanzadas
 */
export interface TendenciaAvanzada {
  periodo: string;
  creados: number;
  resueltos: number;
  pendientes: number;
  derivados: number;
  escalados: number;
  promedioResolucion: number;
  satisfaccion: number;
}

/**
 * Interface para análisis de SLA
 */
export interface AnalisisSLA {
  departamento: string;
  cumplimientoSLA: number;
  ticketsDentroSLA: number;
  ticketsFueraSLA: number;
  tiempoPromedio: number;
  tiempoLimite: number;
  riesgoIncumplimiento: number;
}

/**
 * Interface para derivaciones por departamento
 */
export interface DerivacionesPorDepartamento {
  departamento: string;
  totalDerivados: number;
  tiempoPromedioDerivacion: number;
  derivacionesA: {
    departamentoDestino: string;
    cantidad: number;
    tiempoPromedio: number;
    porcentaje: number;
  }[];
}

/**
 * Interface para métricas de derivación (DEPRECATED)
 */
export interface MetricasDerivacion {
  desde: string;
  hacia: string;
  cantidad: number;
  tiempoPromedio: number;
  porcentaje: number;
}

/**
 * Interface para resumen de responsable
 */
export interface ResumenResponsable {
  id_departamento: number;
  nombre_departamento: string;
  metricas: MetricasDepartamento;
  tickets_por_estado: TicketsPorEstado[];
  tickets_por_prioridad: TicketsPorPrioridad[];
  tendencia_semanal: TendenciaSemanal[];
}

// ===== INTERFACES PARA REPORTES =====

/**
 * Interface para los filtros de reportes
 */
export interface FiltrosReporte {
  fechaInicio: string;
  fechaFin: string;
  departamento: string;
  rol: string;
  estado: string;
  prioridad: string;
  cliente: string;
  responsable: string;
}

/**
 * Interface para datos de reporte de rendimiento
 */
export interface ReporteRendimiento {
  departamento: string;
  totalTickets: number;
  ticketsResueltos: number;
  ticketsPendientes: number;
  tiempoPromedioResolucion: number;
  cumplimientoSLA: number;
  satisfaccionCliente: number;
  eficiencia: number;
}

/**
 * Interface para datos de reporte temporal
 */
export interface ReporteTemporal {
  fecha: string;
  ticketsCreados: number;
  ticketsResueltos: number;
  ticketsPendientes: number;
  tiempoPromedioRespuesta: number;
}

/**
 * Interface para datos de reporte de usuarios
 */
export interface ReporteUsuarios {
  id: number;
  usuario: string;
  departamento: string;
  rol: string;
  ticketsAsignados: number;
  ticketsResueltos: number;
  ticketsPendientes: number;
  tiempoPromedioResolucion: number;
  cargaTrabajo: number;
  ultimaActividad: string;
}

/**
 * Interface para usuarios responsables
 */
export interface UsuarioResponsable {
  id: number;
  nombre: string;
  apellido: string;
  correo: string;
  departamento: string;
  activo: boolean;
}

/**
 * Interface para clientes activos
 */
export interface ClienteActivo {
  id: number;
  nombre?: string;
  correo: string;
  empresa?: string;
  ultimaActividad: string;
}

/**
 * Interface para métricas globales
 */
export interface MetricasGlobales {
  totalTickets: number;
  ticketsAbiertos: number;
  ticketsCerrados: number;
  tiempoPromedioResolucion: number;
  satisfaccionPromedio: number;
  cumplimientoSLA: number;
}

/**
 * Interface para información de departamentos
 */
export interface DepartamentoInfo {
  id: number;
  nombre: string;
  descripcion?: string;
  responsable?: string;
  usuariosActivos: number;
  ticketsActivos: number;
}

/**
 * Interface para respuesta del backend
 */
export interface RespuestaApi<T> {
  success: boolean;
  data: T;
  message: string;
  error?: string;
}

/**
 * Interface para filtros de usuarios
 */
export interface FiltrosUsuarios {
  nombre?: string;
  departamento?: number;
  rol?: string;
  activo?: boolean;
  pagina?: number;
  limite?: number;
}

/**
 * Interface para DTOs de creación/actualización de usuario
 */
export interface CrearUsuarioDto {
  nombre: string;
  correo: string;
  id_rol: number;
  id_departamento?: number;
  activo?: boolean;
}

export interface ActualizarUsuarioDto {
  nombre?: string;
  correo?: string;
  id_rol?: number;
  id_departamento?: number;
  activo?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {

  /**
   * URL base para las APIs de administración
   */
  private readonly apiUrl = environment.apiUrl;

  /**
   * Endpoints del servicio
   */
  private readonly endpoints = {
    // Endpoints originales
    resumenEmpresa: '/admin/resumen-empresa',
    metricasDepartamentos: '/admin/metricas-departamentos',
    tendenciaMensual: '/admin/tendencia-mensual',
    ticketsPorEstado: '/admin/tickets-estado',
    usuarios: '/admin/usuarios',
    departamentos: '/admin/departamentos',
    configuracion: '/admin/configuracion',
    
    // Endpoints para reportes
    reporteRendimiento: '/admin/reportes/rendimiento',
    reporteTemporal: '/admin/reportes/temporal',
    reporteUsuarios: '/admin/reportes/usuarios',
    usuariosResponsables: '/admin/usuarios/responsables',
    clientesActivos: '/admin/clientes/activos',
    metricasGlobales: '/admin/metricas/globales'
  };

  /**
   * Timeout por defecto para las peticiones HTTP (30 segundos)
   */
  private readonly defaultTimeout = 30000;

  /**
   * Subject para notificar cambios en los reportes
   */
  private reportesActualizados = new BehaviorSubject<boolean>(false);
  public reportesActualizados$ = this.reportesActualizados.asObservable();

  /**
   * Constructor del servicio
   * @param http - Cliente HTTP de Angular
   */
  constructor(private http: HttpClient) {
    console.log('AdminService: Servicio inicializado con endpoints completos');
  }

  // ===== MÉTODOS DE AUTENTICACIÓN Y HEADERS =====

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

  // ===== MÉTODOS ORIGINALES DEL SISTEMA =====

  /**
   * Obtiene el resumen general de la empresa
   * @returns Observable con el resumen
   */
  obtenerResumenEmpresa(): Observable<ResumenEmpresa> {
    console.log('AdminService: Obteniendo resumen empresa');
    
    return this.http.get<RespuestaApi<ResumenEmpresa>>(
      `${this.apiUrl}${this.endpoints.resumenEmpresa}`,
      { headers: this.obtenerHeaders() }
    ).pipe(
      timeout(this.defaultTimeout),
      retry(2),
      map(response => {
        if (!response.success) {
          throw new Error(response.message || 'Error al obtener resumen');
        }
        return response.data;
      }),
      catchError(this.manejarError)
    );
  }

  /**
   * Obtiene las métricas de todos los departamentos
   * @returns Observable con las métricas
   */
  obtenerMetricasDepartamentos(): Observable<MetricasDepartamento[]> {
    console.log('AdminService: Obteniendo métricas departamentos');
    
    return this.http.get<RespuestaApi<MetricasDepartamento[]>>(
      `${this.apiUrl}${this.endpoints.metricasDepartamentos}`,
      { headers: this.obtenerHeaders() }
    ).pipe(
      timeout(this.defaultTimeout),
      retry(2),
      map(response => {
        if (!response.success) {
          throw new Error(response.message || 'Error al obtener métricas');
        }
        return response.data || [];
      }),
      catchError(this.manejarError)
    );
  }

  /**
   * Obtiene las métricas de un departamento específico
   * @param id - ID del departamento
   * @returns Observable con las métricas del departamento
   */
  obtenerMetricasDepartamento(id: number): Observable<MetricasDepartamentoDetalladas> {
    console.log('AdminService: Obteniendo métricas departamento:', id);
    
    return this.http.get<RespuestaApi<MetricasDepartamentoDetalladas>>(
      `${this.apiUrl}${this.endpoints.metricasDepartamentos}/${id}`,
      { headers: this.obtenerHeaders() }
    ).pipe(
      timeout(this.defaultTimeout),
      retry(2),
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
   * @param meses - Número de meses a consultar
   * @returns Observable con la tendencia
   */
  obtenerTendenciaMensual(meses: number = 6): Observable<TendenciaMensual[]> {
    console.log('AdminService: Obteniendo tendencia mensual:', meses, 'meses');
    
    const params = new HttpParams().set('meses', meses.toString());
    
    return this.http.get<RespuestaApi<TendenciaMensual[]>>(
      `${this.apiUrl}${this.endpoints.tendenciaMensual}`,
      { headers: this.obtenerHeaders(), params }
    ).pipe(
      timeout(this.defaultTimeout),
      retry(2),
      map(response => {
        if (!response.success) {
          throw new Error(response.message || 'Error al obtener tendencia mensual');
        }
        return response.data || [];
      }),
      catchError(this.manejarError)
    );
  }

  /**
   * Obtiene la distribución de tickets por estado
   * @param departamento - ID del departamento (opcional)
   * @returns Observable con la distribución
   */
  obtenerTicketsPorEstado(departamento?: number): Observable<TicketsPorEstado[]> {
    console.log('AdminService: Obteniendo tickets por estado, departamento:', departamento);
    
    let params = new HttpParams();
    if (departamento) {
      params = params.set('departamento', departamento.toString());
    }
    
    return this.http.get<RespuestaApi<TicketsPorEstado[]>>(
      `${this.apiUrl}${this.endpoints.ticketsPorEstado}`,
      { headers: this.obtenerHeaders(), params }
    ).pipe(
      timeout(this.defaultTimeout),
      retry(2),
      map(response => {
        if (!response.success) {
          throw new Error(response.message || 'Error al obtener tickets por estado');
        }
        return response.data || [];
      }),
      catchError(this.manejarError)
    );
  }

  // ===== MÉTODOS DE GESTIÓN DE USUARIOS =====

  /**
   * Obtiene la lista de usuarios con filtros
   * @param filtros - Filtros a aplicar
   * @returns Observable con la lista de usuarios
   */
  obtenerUsuarios(filtros?: FiltrosUsuarios): Observable<{
    usuarios: Usuario[];
    total: number;
    pagina: number;
    limite: number;
    totalPaginas: number;
  }> {
    console.log('AdminService: Obteniendo usuarios con filtros:', filtros);
    
    let params = new HttpParams();
    if (filtros) {
      if (filtros.nombre) params = params.set('nombre', filtros.nombre);
      if (filtros.departamento) params = params.set('departamento', filtros.departamento.toString());
      if (filtros.rol) params = params.set('rol', filtros.rol);
      if (filtros.activo !== undefined) params = params.set('activo', filtros.activo.toString());
      if (filtros.pagina) params = params.set('pagina', filtros.pagina.toString());
      if (filtros.limite) params = params.set('limite', filtros.limite.toString());
    }
    
    return this.http.get<RespuestaApi<any>>(
      `${this.apiUrl}${this.endpoints.usuarios}`,
      { headers: this.obtenerHeaders(), params }
    ).pipe(
      timeout(this.defaultTimeout),
      retry(2),
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
   * Obtiene un usuario específico por ID
   * @param id - ID del usuario
   * @returns Observable con el usuario
   */
  obtenerUsuarioPorId(id: number): Observable<Usuario> {
    console.log('AdminService: Obteniendo usuario por ID:', id);
    
    return this.http.get<RespuestaApi<Usuario>>(
      `${this.apiUrl}${this.endpoints.usuarios}/${id}`,
      { headers: this.obtenerHeaders() }
    ).pipe(
      timeout(this.defaultTimeout),
      retry(2),
      map(response => {
        if (!response.success) {
          throw new Error(response.message || 'Error al obtener usuario');
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
  crearUsuario(usuario: CrearUsuarioDto): Observable<Usuario> {
    console.log('AdminService: Creando usuario:', usuario);
    
    return this.http.post<RespuestaApi<Usuario>>(
      `${this.apiUrl}${this.endpoints.usuarios}`,
      usuario,
      { headers: this.obtenerHeaders() }
    ).pipe(
      timeout(this.defaultTimeout),
      retry(1),
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
   * @param usuario - Datos a actualizar
   * @returns Observable con el usuario actualizado
   */
  actualizarUsuario(id: number, usuario: ActualizarUsuarioDto): Observable<Usuario> {
    console.log('AdminService: Actualizando usuario:', id, usuario);
    
    return this.http.put<RespuestaApi<Usuario>>(
      `${this.apiUrl}${this.endpoints.usuarios}/${id}`,
      usuario,
      { headers: this.obtenerHeaders() }
    ).pipe(
      timeout(this.defaultTimeout),
      retry(1),
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
   * @param id - ID del usuario
   * @returns Observable de confirmación
   */
  eliminarUsuario(id: number): Observable<boolean> {
    console.log('AdminService: Eliminando usuario:', id);
    
    return this.http.delete<RespuestaApi<any>>(
      `${this.apiUrl}${this.endpoints.usuarios}/${id}`,
      { headers: this.obtenerHeaders() }
    ).pipe(
      timeout(this.defaultTimeout),
      retry(1),
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
   * Valida si un RUT está disponible
   * @param rut - RUT a validar
   * @param usuarioId - ID del usuario (opcional, para edición)
   * @returns Observable con disponibilidad
   */
  validarRut(rut: string, usuarioId?: number): Observable<boolean> {
    console.log('AdminService: Validando RUT:', rut, 'usuario:', usuarioId);
    
    let params = new HttpParams().set('rut', rut);
    if (usuarioId) {
      params = params.set('usuarioId', usuarioId.toString());
    }
    
    return this.http.get<RespuestaApi<{ disponible: boolean }>>(
      `${this.apiUrl}/admin/validar-rut`,
      { headers: this.obtenerHeaders(), params }
    ).pipe(
      timeout(this.defaultTimeout),
      retry(2),
      map(response => {
        if (!response.success) {
          throw new Error(response.message || 'Error al validar RUT');
        }
        return response.data.disponible;
      }),
      catchError(this.manejarError)
    );
  }

  // ===== MÉTODOS DE REPORTES =====

  /**
   * Obtiene el reporte de rendimiento por departamento
   * @param filtros - Filtros a aplicar al reporte
   * @returns Observable con los datos del reporte
   */
  obtenerReporteRendimiento(filtros: FiltrosReporte): Observable<ReporteRendimiento[]> {
    console.log('AdminService: Obteniendo reporte de rendimiento con filtros:', filtros);

    const params = this.construirParametrosFiltros(filtros);
    
    return this.http.get<ReporteRendimiento[]>(
      `${this.apiUrl}${this.endpoints.reporteRendimiento}`, 
      { headers: this.obtenerHeaders(), params }
    ).pipe(
      timeout(this.defaultTimeout),
      retry(2),
      map(response => {
        // Validar y procesar la respuesta
        if (!Array.isArray(response)) {
          throw new Error('Respuesta inválida del servidor');
        }
        
        return response.map(item => ({
          ...item,
          // Asegurar que los números son válidos
          totalTickets: Number(item.totalTickets) || 0,
          ticketsResueltos: Number(item.ticketsResueltos) || 0,
          ticketsPendientes: Number(item.ticketsPendientes) || 0,
          tiempoPromedioResolucion: Number(item.tiempoPromedioResolucion) || 0,
          cumplimientoSLA: Number(item.cumplimientoSLA) || 0,
          satisfaccionCliente: Number(item.satisfaccionCliente) || 0,
          eficiencia: Number(item.eficiencia) || 0
        }));
      }),
      catchError(this.manejarError)
    );
  }

  /**
   * Obtiene el reporte temporal de tickets
   * @param filtros - Filtros a aplicar al reporte
   * @returns Observable con los datos temporales
   */
  obtenerReporteTemporal(filtros: FiltrosReporte): Observable<ReporteTemporal[]> {
    console.log('AdminService: Obteniendo reporte temporal con filtros:', filtros);

    const params = this.construirParametrosFiltros(filtros);
    
    return this.http.get<ReporteTemporal[]>(
      `${this.apiUrl}${this.endpoints.reporteTemporal}`, 
      { headers: this.obtenerHeaders(), params }
    ).pipe(
      timeout(this.defaultTimeout),
      retry(2),
      map(response => {
        if (!Array.isArray(response)) {
          throw new Error('Respuesta inválida del servidor');
        }
        
        return response.map(item => ({
          ...item,
          ticketsCreados: Number(item.ticketsCreados) || 0,
          ticketsResueltos: Number(item.ticketsResueltos) || 0,
          ticketsPendientes: Number(item.ticketsPendientes) || 0,
          tiempoPromedioRespuesta: Number(item.tiempoPromedioRespuesta) || 0
        })).sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
      }),
      catchError(this.manejarError)
    );
  }

  /**
   * Obtiene el reporte de usuarios y productividad
   * @param filtros - Filtros a aplicar al reporte
   * @returns Observable con los datos de usuarios
   */
  obtenerReporteUsuarios(filtros: FiltrosReporte): Observable<ReporteUsuarios[]> {
    console.log('AdminService: Obteniendo reporte de usuarios con filtros:', filtros);

    const params = this.construirParametrosFiltros(filtros);
    
    return this.http.get<ReporteUsuarios[]>(
      `${this.apiUrl}${this.endpoints.reporteUsuarios}`, 
      { headers: this.obtenerHeaders(), params }
    ).pipe(
      timeout(this.defaultTimeout),
      retry(2),
      map(response => {
        if (!Array.isArray(response)) {
          throw new Error('Respuesta inválida del servidor');
        }
        
        return response.map(item => ({
          ...item,
          id: Number(item.id) || 0,
          ticketsAsignados: Number(item.ticketsAsignados) || 0,
          ticketsResueltos: Number(item.ticketsResueltos) || 0,
          ticketsPendientes: Number(item.ticketsPendientes) || 0,
          tiempoPromedioResolucion: Number(item.tiempoPromedioResolucion) || 0,
          cargaTrabajo: Number(item.cargaTrabajo) || 0
        }));
      }),
      catchError(this.manejarError)
    );
  }

  // ===== MÉTODOS DE USUARIOS Y CLIENTES PARA REPORTES =====

  /**
   * Obtiene la lista de usuarios responsables activos
   * @returns Observable con la lista de responsables
   */
  obtenerUsuariosResponsables(): Observable<UsuarioResponsable[]> {
    console.log('AdminService: Obteniendo usuarios responsables');

    return this.http.get<UsuarioResponsable[]>(
      `${this.apiUrl}${this.endpoints.usuariosResponsables}`,
      { headers: this.obtenerHeaders() }
    ).pipe(
      timeout(this.defaultTimeout),
      retry(2),
      map(response => {
        if (!Array.isArray(response)) {
          throw new Error('Respuesta inválida del servidor');
        }
        
        return response.filter(usuario => usuario.activo);
      }),
      catchError(this.manejarError)
    );
  }

  /**
   * Obtiene la lista de clientes activos
   * @returns Observable con la lista de clientes
   */
  obtenerClientesActivos(): Observable<ClienteActivo[]> {
    console.log('AdminService: Obteniendo clientes activos');

    return this.http.get<ClienteActivo[]>(
      `${this.apiUrl}${this.endpoints.clientesActivos}`,
      { headers: this.obtenerHeaders() }
    ).pipe(
      timeout(this.defaultTimeout),
      retry(2),
      map(response => {
        if (!Array.isArray(response)) {
          throw new Error('Respuesta inválida del servidor');
        }
        
        return response.sort((a, b) => {
          const nombreA = a.nombre || a.correo;
          const nombreB = b.nombre || b.correo;
          return nombreA.localeCompare(nombreB);
        });
      }),
      catchError(this.manejarError)
    );
  }

  // ===== MÉTODOS DE MÉTRICAS GLOBALES =====

  /**
   * Obtiene métricas globales del sistema
   * @returns Observable con las métricas globales
   */
  obtenerMetricasGlobales(): Observable<MetricasGlobales> {
    console.log('AdminService: Obteniendo métricas globales');

    return this.http.get<MetricasGlobales>(
      `${this.apiUrl}${this.endpoints.metricasGlobales}`,
      { headers: this.obtenerHeaders() }
    ).pipe(
      timeout(this.defaultTimeout),
      retry(2),
      map(response => ({
        ...response,
        totalTickets: Number(response.totalTickets) || 0,
        ticketsAbiertos: Number(response.ticketsAbiertos) || 0,
        ticketsCerrados: Number(response.ticketsCerrados) || 0,
        tiempoPromedioResolucion: Number(response.tiempoPromedioResolucion) || 0,
        satisfaccionPromedio: Number(response.satisfaccionPromedio) || 0,
        cumplimientoSLA: Number(response.cumplimientoSLA) || 0
      })),
      catchError(this.manejarError)
    );
  }

  /**
   * Obtiene información de todos los departamentos
   * @returns Observable con la información de departamentos
   */
  obtenerDepartamentos(): Observable<DepartamentoInfo[]> {
    console.log('AdminService: Obteniendo información de departamentos');

    return this.http.get<RespuestaApi<DepartamentoInfo[]>>(
      `${this.apiUrl}${this.endpoints.departamentos}`,
      { headers: this.obtenerHeaders() }
    ).pipe(
      timeout(this.defaultTimeout),
      retry(2),
      map(response => {
        if (!response.success) {
          throw new Error(response.message || 'Error al obtener departamentos');
        }
        
        if (!Array.isArray(response.data)) {
          throw new Error('Respuesta inválida del servidor');
        }
        
        return response.data.map(dept => ({
          ...dept,
          id: Number(dept.id) || 0,
          usuariosActivos: Number(dept.usuariosActivos) || 0,
          ticketsActivos: Number(dept.ticketsActivos) || 0
        }));
      }),
      catchError(this.manejarError)
    );
  }

  // ===== MÉTODOS DE CONFIGURACIÓN =====

  /**
   * Actualiza la configuración de reportes automáticos
   * @param configuracion - Nueva configuración
   * @returns Observable de confirmación
   */
  actualizarConfiguracionReportes(configuracion: any): Observable<any> {
    console.log('AdminService: Actualizando configuración de reportes:', configuracion);

    return this.http.put(
      `${this.apiUrl}${this.endpoints.configuracion}/reportes`,
      configuracion,
      { headers: this.obtenerHeaders() }
    ).pipe(
      timeout(this.defaultTimeout),
      retry(1),
      catchError(this.manejarError)
    );
  }

  /**
   * Obtiene la configuración actual de reportes
   * @returns Observable con la configuración
   */
  obtenerConfiguracionReportes(): Observable<any> {
    console.log('AdminService: Obteniendo configuración de reportes');

    return this.http.get(
      `${this.apiUrl}${this.endpoints.configuracion}/reportes`,
      { headers: this.obtenerHeaders() }
    ).pipe(
      timeout(this.defaultTimeout),
      retry(2),
      catchError(this.manejarError)
    );
  }

  // ===== MÉTODOS DE ACTUALIZACIÓN =====

  /**
   * Fuerza la actualización de reportes
   * @returns Observable de confirmación
   */
  actualizarReportes(): Observable<boolean> {
    console.log('AdminService: Forzando actualización de reportes');

    return this.http.post<{ success: boolean }>(
      `${this.apiUrl}/admin/reportes/actualizar`,
      {},
      { headers: this.obtenerHeaders() }
    ).pipe(
      timeout(this.defaultTimeout),
      map(response => response.success),
      catchError(this.manejarError)
    );
  }

  /**
   * Notifica que los reportes han sido actualizados
   */
  notificarReportesActualizados(): void {
    console.log('AdminService: Notificando actualización de reportes');
    this.reportesActualizados.next(true);
  }

  // ===== MÉTODOS DE VALIDACIÓN =====

  /**
   * Valida que los filtros sean correctos
   * @param filtros - Filtros a validar
   * @returns true si son válidos, string con error si no
   */
  validarFiltros(filtros: FiltrosReporte): true | string {
    // Validar fechas
    if (filtros.fechaInicio && filtros.fechaFin) {
      const fechaInicio = new Date(filtros.fechaInicio);
      const fechaFin = new Date(filtros.fechaFin);

      if (fechaInicio > fechaFin) {
        return 'La fecha de inicio no puede ser mayor a la fecha de fin';
      }

      // Validar que no sea un rango muy amplio (más de 2 años)
      const diferenciaMeses = (fechaFin.getFullYear() - fechaInicio.getFullYear()) * 12 + 
                             (fechaFin.getMonth() - fechaInicio.getMonth());

      if (diferenciaMeses > 24) {
        return 'El rango de fechas no puede ser mayor a 2 años';
      }

      // Validar que no sea futuro
      const hoy = new Date();
      if (fechaFin > hoy) {
        return 'No se pueden seleccionar fechas futuras';
      }
    }

    return true;
  }

  /**
   * Obtiene el rango de fechas recomendado
   * @returns Objeto con fechaInicio y fechaFin recomendadas
   */
  obtenerRangoFechasRecomendado(): { fechaInicio: string; fechaFin: string } {
    const hoy = new Date();
    const hace30Dias = new Date(hoy.getTime() - (30 * 24 * 60 * 60 * 1000));

    return {
      fechaInicio: hace30Dias.toISOString().split('T')[0],
      fechaFin: hoy.toISOString().split('T')[0]
    };
  }

  // ===== MÉTODOS DE ANÁLISIS DE DATOS =====

  /**
   * Analiza tendencias en los datos temporales
   * @param datos - Datos temporales a analizar
   * @returns Objeto con análisis de tendencias
   */
  analizarTendencias(datos: ReporteTemporal[]): {
    tendenciaTicketsCreados: 'subida' | 'bajada' | 'estable';
    tendenciaTicketsResueltos: 'subida' | 'bajada' | 'estable';
    tendenciaTiempoRespuesta: 'mejora' | 'empeora' | 'estable';
    promedioCreados: number;
    promedioResueltos: number;
    promedioTiempo: number;
  } {
    if (datos.length < 7) {
      // No hay suficientes datos para análisis de tendencia
      return {
        tendenciaTicketsCreados: 'estable',
        tendenciaTicketsResueltos: 'estable',
        tendenciaTiempoRespuesta: 'estable',
        promedioCreados: 0,
        promedioResueltos: 0,
        promedioTiempo: 0
      };
    }

    // Dividir datos en dos mitades para comparar
    const mitad = Math.floor(datos.length / 2);
    const primeraMetad = datos.slice(0, mitad);
    const segundaMetad = datos.slice(-mitad);

    // Calcular promedios de cada mitad
    const promedioCreados1 = primeraMetad.reduce((sum, d) => sum + d.ticketsCreados, 0) / primeraMetad.length;
    const promedioCreados2 = segundaMetad.reduce((sum, d) => sum + d.ticketsCreados, 0) / segundaMetad.length;

    const promedioResueltos1 = primeraMetad.reduce((sum, d) => sum + d.ticketsResueltos, 0) / primeraMetad.length;
    const promedioResueltos2 = segundaMetad.reduce((sum, d) => sum + d.ticketsResueltos, 0) / segundaMetad.length;

    const promedioTiempo1 = primeraMetad.reduce((sum, d) => sum + d.tiempoPromedioRespuesta, 0) / primeraMetad.length;
    const promedioTiempo2 = segundaMetad.reduce((sum, d) => sum + d.tiempoPromedioRespuesta, 0) / segundaMetad.length;

    // Determinar tendencias (cambio mayor al 10% se considera significativo)
    const umbralCambio = 0.1;

    const tendenciaCreados = Math.abs(promedioCreados2 - promedioCreados1) / promedioCreados1 < umbralCambio ? 
      'estable' : (promedioCreados2 > promedioCreados1 ? 'subida' : 'bajada');

    const tendenciaResueltos = Math.abs(promedioResueltos2 - promedioResueltos1) / promedioResueltos1 < umbralCambio ? 
      'estable' : (promedioResueltos2 > promedioResueltos1 ? 'subida' : 'bajada');

    const tendenciaTiempo = Math.abs(promedioTiempo2 - promedioTiempo1) / promedioTiempo1 < umbralCambio ? 
      'estable' : (promedioTiempo2 < promedioTiempo1 ? 'mejora' : 'empeora');

    return {
      tendenciaTicketsCreados: tendenciaCreados,
      tendenciaTicketsResueltos: tendenciaResueltos,
      tendenciaTiempoRespuesta: tendenciaTiempo,
      promedioCreados: Math.round((promedioCreados1 + promedioCreados2) / 2),
      promedioResueltos: Math.round((promedioResueltos1 + promedioResueltos2) / 2),
      promedioTiempo: Math.round(((promedioTiempo1 + promedioTiempo2) / 2) * 10) / 10
    };
  }

  /**
   * Identifica departamentos con problemas de rendimiento
   * @param datos - Datos de rendimiento por departamento
   * @returns Lista de departamentos con alertas
   */
  identificarProblemasRendimiento(datos: ReporteRendimiento[]): {
    departamento: string;
    problema: string;
    severidad: 'alta' | 'media' | 'baja';
  }[] {
    const problemas: {
      departamento: string;
      problema: string;
      severidad: 'alta' | 'media' | 'baja';
    }[] = [];

    datos.forEach(dept => {
      // SLA bajo (menos del 85%)
      if (dept.cumplimientoSLA < 85) {
        problemas.push({
          departamento: dept.departamento,
          problema: `Cumplimiento SLA bajo: ${dept.cumplimientoSLA}%`,
          severidad: dept.cumplimientoSLA < 70 ? 'alta' : 'media'
        });
      }

      // Satisfacción baja (menos de 3.5)
      if (dept.satisfaccionCliente < 3.5) {
        problemas.push({
          departamento: dept.departamento,
          problema: `Satisfacción baja: ${dept.satisfaccionCliente}/5`,
          severidad: dept.satisfaccionCliente < 3 ? 'alta' : 'media'
        });
      }

      // Tiempo de resolución alto (más de 8 horas)
      if (dept.tiempoPromedioResolucion > 8) {
        problemas.push({
          departamento: dept.departamento,
          problema: `Tiempo de resolución alto: ${dept.tiempoPromedioResolucion}h`,
          severidad: dept.tiempoPromedioResolucion > 12 ? 'alta' : 'media'
        });
      }

      // Muchos tickets pendientes (más del 20% del total)
      const porcentajePendientes = (dept.ticketsPendientes / dept.totalTickets) * 100;
      if (porcentajePendientes > 20) {
        problemas.push({
          departamento: dept.departamento,
          problema: `Muchos tickets pendientes: ${Math.round(porcentajePendientes)}%`,
          severidad: porcentajePendientes > 35 ? 'alta' : 'media'
        });
      }
    });

    return problemas.sort((a, b) => {
      const orden: { [key: string]: number } = { 'alta': 3, 'media': 2, 'baja': 1 };
      return orden[b.severidad] - orden[a.severidad];
    });
  }

  /**
   * Calcula métricas comparativas entre departamentos
   * @param datos - Datos de rendimiento
   * @returns Métricas comparativas
   */
  calcularMetricasComparativas(datos: ReporteRendimiento[]): {
    mejorDepartamento: string;
    peorDepartamento: string;
    promedioSLA: number;
    promedioSatisfaccion: number;
    promedioTiempo: number;
    totalTickets: number;
  } {
    if (datos.length === 0) {
      return {
        mejorDepartamento: '',
        peorDepartamento: '',
        promedioSLA: 0,
        promedioSatisfaccion: 0,
        promedioTiempo: 0,
        totalTickets: 0
      };
    }

    // Calcular promedios generales
    const promedioSLA = datos.reduce((sum, d) => sum + d.cumplimientoSLA, 0) / datos.length;
    const promedioSatisfaccion = datos.reduce((sum, d) => sum + d.satisfaccionCliente, 0) / datos.length;
    const promedioTiempo = datos.reduce((sum, d) => sum + d.tiempoPromedioResolucion, 0) / datos.length;
    const totalTickets = datos.reduce((sum, d) => sum + d.totalTickets, 0);

    // Encontrar mejor y peor departamento basado en eficiencia general
    const mejorDept = datos.reduce((mejor, actual) => 
      actual.eficiencia > mejor.eficiencia ? actual : mejor
    );
    
    const peorDept = datos.reduce((peor, actual) => 
      actual.eficiencia < peor.eficiencia ? actual : peor
    );

    return {
      mejorDepartamento: mejorDept.departamento,
      peorDepartamento: peorDept.departamento,
      promedioSLA: Math.round(promedioSLA * 10) / 10,
      promedioSatisfaccion: Math.round(promedioSatisfaccion * 10) / 10,
      promedioTiempo: Math.round(promedioTiempo * 10) / 10,
      totalTickets
    };
  }

  /**
   * Obtiene resumen completo de un responsable específico
   * @param idDepartamento - ID del departamento
   * @returns Observable con el resumen del responsable
   */
  obtenerResumenResponsable(idDepartamento: number): Observable<ResumenResponsable> {
    console.log('AdminService: Obteniendo resumen responsable, departamento:', idDepartamento);
    
    return this.http.get<RespuestaApi<ResumenResponsable>>(
      `${this.apiUrl}/admin/resumen-responsable/${idDepartamento}`,
      { headers: this.obtenerHeaders() }
    ).pipe(
      timeout(this.defaultTimeout),
      retry(2),
      map(response => {
        if (!response.success) {
          throw new Error(response.message || 'Error al obtener resumen del responsable');
        }
        return response.data;
      }),
      catchError(this.manejarError)
    );
  }

  /**
   * Obtiene métricas avanzadas de derivaciones
   * @returns Observable con las métricas de derivación
   */
  obtenerDerivacionesPorDepartamento(): Observable<DerivacionesPorDepartamento[]> {
    console.log('AdminService: Obteniendo métricas de derivaciones por departamento');
    
    return this.http.get<RespuestaApi<DerivacionesPorDepartamento[]>>(
      `${this.apiUrl}/admin/derivaciones-departamento`,
      { headers: this.obtenerHeaders() }
    ).pipe(
      timeout(this.defaultTimeout),
      retry(2),
      map(response => {
        if (!response.success) {
          throw new Error(response.message || 'Error al obtener métricas de derivación');
        }
        return response.data || [];
      }),
      catchError(this.manejarError)
    );
  }

  /**
   * Obtiene análisis de cumplimiento SLA
   * @returns Observable con el análisis SLA
   */
  obtenerAnalisisSLA(): Observable<AnalisisSLA[]> {
    console.log('AdminService: Obteniendo análisis de cumplimiento SLA');
    
    return this.http.get<RespuestaApi<AnalisisSLA[]>>(
      `${this.apiUrl}/admin/analisis-sla`,
      { headers: this.obtenerHeaders() }
    ).pipe(
      timeout(this.defaultTimeout),
      retry(2),
      map(response => {
        if (!response.success) {
          throw new Error(response.message || 'Error al obtener análisis SLA');
        }
        return response.data || [];
      }),
      catchError(this.manejarError)
    );
  }

  // ===== MÉTODOS PRIVADOS AUXILIARES =====

  /**
   * Construye los parámetros HTTP a partir de los filtros
   * @param filtros - Filtros del reporte
   * @returns HttpParams configurado
   */
  private construirParametrosFiltros(filtros: FiltrosReporte): HttpParams {
    let params = new HttpParams();

    // Agregar solo los filtros que tienen valor
    Object.entries(filtros).forEach(([key, value]) => {
      if (value && value !== 'todos' && value !== 'todas') {
        params = params.set(key, value.toString());
      }
    });

    // Agregar información adicional para el servidor
    params = params.set('timezone', Intl.DateTimeFormat().resolvedOptions().timeZone);
    params = params.set('timestamp', new Date().toISOString());

    return params;
  }

  /**
   * Maneja los errores de las peticiones HTTP
   * @param error - Error de HTTP
   * @returns Observable con error procesado
   */
  private manejarError = (error: HttpErrorResponse): Observable<never> => {
    let mensajeError = 'Error desconocido en el servidor';

    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      mensajeError = `Error de conexión: ${error.error.message}`;
    } else {
      // Error del lado del servidor
      switch (error.status) {
        case 400:
          mensajeError = 'Parámetros de consulta inválidos';
          break;
        case 401:
          mensajeError = 'No autorizado para acceder a los datos. Token expirado o inválido.';
          break;
        case 403:
          mensajeError = 'Sin permisos para realizar esta operación administrativa';
          break;
        case 404:
          mensajeError = 'Endpoint no encontrado';
          break;
        case 422:
          mensajeError = 'Datos de entrada inválidos o incompletos';
          break;
        case 429:
          mensajeError = 'Demasiadas consultas. Intente más tarde';
          break;
        case 500:
          mensajeError = 'Error interno del servidor';
          break;
        case 503:
          mensajeError = 'Servicio temporalmente no disponible';
          break;
        default:
          mensajeError = error.error?.message || `Error del servidor: ${error.status} - ${error.message}`;
      }
    }

    console.error('AdminService - Error en petición HTTP:', {
      status: error.status,
      mensaje: mensajeError,
      url: error.url,
      timestamp: new Date().toISOString(),
      error: error
    });

    return throwError(() => new Error(mensajeError));
  };

  /**
   * Formatea fechas para envío al servidor
   * @param fecha - Fecha en formato string
   * @returns Fecha formateada para la API
   */
  private formatearFechaParaAPI(fecha: string): string {
    if (!fecha) return '';
    
    const date = new Date(fecha);
    return date.toISOString().split('T')[0];
  }

  /**
   * Valida que una fecha esté en formato correcto
   * @param fecha - Fecha a validar
   * @returns true si es válida, false si no
   */
  private validarFormatoFecha(fecha: string): boolean {
    if (!fecha) return false;
    
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(fecha)) return false;
    
    const date = new Date(fecha);
    return date instanceof Date && !isNaN(date.getTime());
  }

  /**
   * Limpia y normaliza los filtros antes de enviarlos
   * @param filtros - Filtros a limpiar
   * @returns Filtros normalizados
   */
  private normalizarFiltros(filtros: FiltrosReporte): FiltrosReporte {
    return {
      fechaInicio: this.formatearFechaParaAPI(filtros.fechaInicio),
      fechaFin: this.formatearFechaParaAPI(filtros.fechaFin),
      departamento: filtros.departamento?.toLowerCase() || 'todos',
      rol: filtros.rol?.toLowerCase() || 'todos',
      estado: filtros.estado?.toLowerCase() || 'todos',
      prioridad: filtros.prioridad?.toLowerCase() || 'todas',
      cliente: filtros.cliente || 'todos',
      responsable: filtros.responsable || 'todos'
    };
  }

  /**
   * Obtiene estadísticas de uso del sistema
   * @returns Observable con estadísticas
   */
  obtenerEstadisticasUso(): Observable<{
    sesionesActivas: number;
    ticketsCreadosHoy: number;
    ticketsResueltosHoy: number;
    promedioRespuestaHoy: number;
  }> {
    console.log('AdminService: Obteniendo estadísticas de uso');
    
    return this.http.get<RespuestaApi<any>>(
      `${this.apiUrl}/admin/estadisticas-uso`,
      { headers: this.obtenerHeaders() }
    ).pipe(
      timeout(this.defaultTimeout),
      retry(2),
      map(response => {
        if (!response.success) {
          throw new Error(response.message || 'Error al obtener estadísticas');
        }
        return response.data;
      }),
      catchError(this.manejarError)
    );
  }

  /**
   * Limpia la caché de datos en el frontend
   */
  limpiarCache(): void {
    console.log('AdminService: Limpiando caché local');
    
    // Limpiar cualquier caché local si es necesario
    this.reportesActualizados.next(true);
  }

  /**
   * Verifica el estado de salud del servicio
   * @returns Observable con el estado
   */
  verificarEstadoSalud(): Observable<{
    status: 'ok' | 'error';
    timestamp: string;
    version: string;
  }> {
    console.log('AdminService: Verificando estado de salud del servicio');
    
    return this.http.get<any>(
      `${this.apiUrl}/admin/health`,
      { headers: this.obtenerHeaders() }
    ).pipe(
      timeout(5000), // Timeout más corto para health check
      retry(1),
      map(response => ({
        status: response.status || 'ok',
        timestamp: response.timestamp || new Date().toISOString(),
        version: response.version || '1.0.0'
      })),
      catchError(() => {
        return throwError(() => new Error('Servicio no disponible'));
      })
    );
  }
}