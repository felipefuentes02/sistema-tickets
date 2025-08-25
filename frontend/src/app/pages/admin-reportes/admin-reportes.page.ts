/**
 * Página de Reportes del Administrador - Componente Corregido
 * 
 * Incluye todas las importaciones necesarias y correcciones de errores
 * 
 * @author Sistema de Tickets
 * @version 1.0.0
 */

import { Component, OnInit, OnDestroy, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule, AlertController, LoadingController, ToastController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { AdminService } from '../../services/admin.service';
import { AuthService } from '../../services/auth.service';

/**
 * Interface para los filtros de reportes
 */
interface FiltrosReporte {
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
interface ReporteRendimiento {
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
interface ReporteTemporal {
  fecha: string;
  ticketsCreados: number;
  ticketsResueltos: number;
  ticketsPendientes: number;
  tiempoPromedioRespuesta: number;
}

/**
 * Interface para datos de reporte de usuarios
 */
interface ReporteUsuarios {
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
 * Interface para opciones de filtro
 */
interface OpcionFiltro {
  valor: string;
  etiqueta: string;
}

@Component({
  selector: 'app-admin-reportes',
  templateUrl: './admin-reportes.page.html',
  styleUrls: ['./admin-reportes.page.scss'],
  standalone: true,
  imports: [
    IonicModule, 
    CommonModule, 
    FormsModule,
    DatePipe
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  providers: [DatePipe]
})
export class AdminReportesPage implements OnInit, OnDestroy {

  /**
   * Estado de carga de la página
   */
  cargando: boolean = false;

  /**
   * Tipo de reporte actualmente seleccionado
   */
  tipoReporteSeleccionado: string = 'rendimiento';

  /**
   * Filtros aplicados a los reportes
   */
  filtros: FiltrosReporte = {
    fechaInicio: this.obtenerFechaMesAnterior(),
    fechaFin: this.obtenerFechaHoy(),
    departamento: 'todos',
    rol: 'todos',
    estado: 'todos',
    prioridad: 'todas',
    cliente: 'todos',
    responsable: 'todos'
  };

  /**
   * Datos para los diferentes tipos de reportes
   */
  datosReporteRendimiento: ReporteRendimiento[] = [];
  datosReporteTemporal: ReporteTemporal[] = [];
  datosReporteUsuarios: ReporteUsuarios[] = [];

  /**
   * Opciones para los filtros desplegables
   */
  opcionesDepartamentos: OpcionFiltro[] = [
    { valor: 'todos', etiqueta: 'Todos los Departamentos' },
    { valor: 'administracion', etiqueta: 'Administración' },
    { valor: 'comercial', etiqueta: 'Comercial' },
    { valor: 'informatica', etiqueta: 'Informática' },
    { valor: 'operaciones', etiqueta: 'Operaciones' }
  ];

  opcionesRoles: OpcionFiltro[] = [
    { valor: 'todos', etiqueta: 'Todos los Roles' },
    { valor: 'administrador', etiqueta: 'Administrador' },
    { valor: 'tecnico', etiqueta: 'Técnico/Responsable' },
    { valor: 'usuario_interno', etiqueta: 'Usuario Interno' },
    { valor: 'usuario_externo', etiqueta: 'Usuario Externo' }
  ];

  opcionesEstados: OpcionFiltro[] = [
    { valor: 'todos', etiqueta: 'Todos los Estados' },
    { valor: 'abierto', etiqueta: 'Abierto' },
    { valor: 'en_proceso', etiqueta: 'En Proceso' },
    { valor: 'pendiente_cliente', etiqueta: 'Pendiente Cliente' },
    { valor: 'resuelto', etiqueta: 'Resuelto' },
    { valor: 'cerrado', etiqueta: 'Cerrado' },
    { valor: 'escalado', etiqueta: 'Escalado' }
  ];

  opcionesPrioridades: OpcionFiltro[] = [
    { valor: 'todas', etiqueta: 'Todas las Prioridades' },
    { valor: 'critica', etiqueta: 'Crítica' },
    { valor: 'alta', etiqueta: 'Alta' },
    { valor: 'media', etiqueta: 'Media' },
    { valor: 'baja', etiqueta: 'Baja' }
  ];

  /**
   * Lista de responsables disponibles (se carga dinámicamente)
   */
  opcionesResponsables: OpcionFiltro[] = [
    { valor: 'todos', etiqueta: 'Todos los Responsables' }
  ];

  /**
   * Lista de clientes disponibles (se carga dinámicamente)
   */
  opcionesClientes: OpcionFiltro[] = [
    { valor: 'todos', etiqueta: 'Todos los Clientes' }
  ];

  /**
   * Subscripciones a observables
   */
  private subscripciones: Subscription[] = [];

  /**
   * Usuario actual logueado
   */
  usuarioActual: any = null;

  /**
   * Fecha actual para mostrar en la interfaz
   */
  currentDate: Date = new Date();

  /**
   * Estados de expansión de secciones de filtros
   */
  seccionFiltrosExpandida: boolean = true;
  seccionFiltrosAvanzadosExpandida: boolean = false;

  /**
   * Métricas resumen para mostrar en cards
   */
  metricsResumen = {
    totalTicketsPeriodo: 0,
    ticketsResueltosPromedio: 0,
    tiempoPromedioGlobal: 0,
    satisfaccionPromedio: 0,
    cumplimientoSLAPromedio: 0,
    departamentoMasEficiente: '',
    usuarioMasProductivo: ''
  };
new: any;

  constructor(
    private router: Router,
    private adminService: AdminService,
    private authService: AuthService,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private datePipe: DatePipe
  ) {}

  /**
   * Inicialización del componente
   */
  async ngOnInit(): Promise<void> {
    console.log('AdminReportesPage: Inicializando página de reportes');
    
    try {
      // Verificar autenticación y permisos
      await this.verificarPermisos();
      
      // Cargar opciones dinámicas para filtros
      await this.cargarOpcionesFiltros();
      
      // Cargar reporte inicial
      await this.cargarReporte();
      
    } catch (error) {
      console.error('Error en ngOnInit:', error);
      await this.mostrarError('Error al cargar la página de reportes');
    }
  }

  /**
   * Limpieza de recursos al destruir el componente
   */
  ngOnDestroy(): void {
    console.log('AdminReportesPage: Limpiando recursos');
    
    // Desuscribirse de todos los observables
    this.subscripciones.forEach(sub => sub.unsubscribe());
  }

  /**
   * Verifica que el usuario tenga permisos de administrador
   */
  private async verificarPermisos(): Promise<void> {
    this.usuarioActual = this.authService.getCurrentUser();
    
    if (!this.usuarioActual) {
      console.error('AdminReportesPage: Usuario no autenticado');
      await this.router.navigate(['/login']);
      throw new Error('Usuario no autenticado');
    }

    // Verificar si el usuario tiene rol de administrador
    if (!this.tieneRolAdministrador()) {
      console.error('AdminReportesPage: Usuario sin permisos de administrador');
      await this.router.navigate(['/home']);
      throw new Error('Sin permisos de administrador');
    }

    console.log('AdminReportesPage: Permisos verificados correctamente');
  }

  /**
   * Verifica si el usuario actual tiene rol de administrador
   */
  private tieneRolAdministrador(): boolean {
    if (!this.usuarioActual) return false;
    
    // Verificar por nombre de rol
    if (this.usuarioActual.nombre_rol && 
        this.usuarioActual.nombre_rol.toLowerCase() === 'administrador') {
      return true;
    }
    
    // Verificar por ID de rol (asumiendo que 1 es administrador)
    if (this.usuarioActual.id_rol === 1) {
      return true;
    }
    
    return false;
  }

  /**
   * Carga las opciones dinámicas para los filtros
   */
  private async cargarOpcionesFiltros(): Promise<void> {
    try {
      // Cargar responsables disponibles
      const responsablesSub = this.adminService.obtenerUsuariosResponsables().subscribe({
        next: (responsables) => {
          this.opcionesResponsables = [
            { valor: 'todos', etiqueta: 'Todos los Responsables' },
            ...responsables.map(r => ({
              valor: r.id.toString(),
              etiqueta: `${r.nombre} ${r.apellido}`
            }))
          ];
        },
        error: (error) => {
          console.error('Error al cargar responsables:', error);
        }
      });
      this.subscripciones.push(responsablesSub);

      // Cargar clientes (usuarios externos)
      const clientesSub = this.adminService.obtenerClientesActivos().subscribe({
        next: (clientes) => {
          this.opcionesClientes = [
            { valor: 'todos', etiqueta: 'Todos los Clientes' },
            ...clientes.map(c => ({
              valor: c.id.toString(),
              etiqueta: c.nombre || c.correo
            }))
          ];
        },
        error: (error) => {
          console.error('Error al cargar clientes:', error);
        }
      });
      this.subscripciones.push(clientesSub);

      console.log('AdminReportesPage: Opciones de filtros cargadas');
      
    } catch (error) {
      console.error('Error al cargar opciones de filtros:', error);
      // Continuar con opciones por defecto
    }
  }

  /**
   * Carga el reporte según el tipo seleccionado y filtros aplicados
   */
  async cargarReporte(): Promise<void> {
    const loading = await this.loadingController.create({
      message: 'Generando reporte...',
      spinner: 'crescent'
    });
    
    await loading.present();
    this.cargando = true;

    try {
      console.log(`AdminReportesPage: Cargando reporte ${this.tipoReporteSeleccionado}`);
      
      // Cargar datos según el tipo de reporte
      switch (this.tipoReporteSeleccionado) {
        case 'rendimiento':
          await this.cargarReporteRendimiento();
          break;
        case 'temporal':
          await this.cargarReporteTemporal();
          break;
        case 'usuarios':
          await this.cargarReporteUsuarios();
          break;
        default:
          throw new Error('Tipo de reporte no válido');
      }

      // Actualizar métricas resumen
      this.calcularMetricasResumen();

      console.log('AdminReportesPage: Reporte cargado exitosamente');
      
    } catch (error) {
      console.error('Error al cargar reporte:', error);
      await this.mostrarError('Error al generar el reporte');
    } finally {
      this.cargando = false;
      await loading.dismiss();
    }
  }

  /**
   * Carga datos para el reporte de rendimiento por departamento
   */
  private async cargarReporteRendimiento(): Promise<void> {
    try {
      // TODO: Reemplazar con llamada real al servicio
      // const datosSub = this.adminService.obtenerReporteRendimiento(this.filtros).subscribe({
      //   next: (datos) => {
      //     this.datosReporteRendimiento = datos;
      //   },
      //   error: (error) => {
      //     console.error('Error al cargar reporte de rendimiento:', error);
      //     throw error;
      //   }
      // });
      // this.subscripciones.push(datosSub);
      
      // Datos de ejemplo para demostración
      this.datosReporteRendimiento = [
        {
          departamento: 'Administración',
          totalTickets: 245,
          ticketsResueltos: 220,
          ticketsPendientes: 25,
          tiempoPromedioResolucion: 3.2,
          cumplimientoSLA: 89.8,
          satisfaccionCliente: 4.2,
          eficiencia: 89.8
        },
        {
          departamento: 'Comercial',
          totalTickets: 189,
          ticketsResueltos: 165,
          ticketsPendientes: 24,
          tiempoPromedioResolucion: 4.1,
          cumplimientoSLA: 87.3,
          satisfaccionCliente: 4.0,
          eficiencia: 87.3
        },
        {
          departamento: 'Informática',
          totalTickets: 312,
          ticketsResueltos: 287,
          ticketsPendientes: 25,
          tiempoPromedioResolucion: 5.8,
          cumplimientoSLA: 92.0,
          satisfaccionCliente: 4.4,
          eficiencia: 92.0
        },
        {
          departamento: 'Operaciones',
          totalTickets: 156,
          ticketsResueltos: 148,
          ticketsPendientes: 8,
          tiempoPromedioResolucion: 2.9,
          cumplimientoSLA: 94.9,
          satisfaccionCliente: 4.6,
          eficiencia: 94.9
        }
      ];

      console.log('AdminReportesPage: Datos de rendimiento cargados:', this.datosReporteRendimiento.length);
      
    } catch (error) {
      console.error('Error al cargar reporte de rendimiento:', error);
      throw error;
    }
  }

  /**
   * Carga datos para el reporte temporal de tickets
   */
  private async cargarReporteTemporal(): Promise<void> {
    try {
      // TODO: Reemplazar con llamada real al servicio
      // const datosSub = this.adminService.obtenerReporteTemporal(this.filtros).subscribe({
      //   next: (datos) => {
      //     this.datosReporteTemporal = datos;
      //   },
      //   error: (error) => {
      //     console.error('Error al cargar reporte temporal:', error);
      //     throw error;
      //   }
      // });
      // this.subscripciones.push(datosSub);
      
      // Generar datos de ejemplo para los últimos 30 días
      this.datosReporteTemporal = this.generarDatosTemporalesEjemplo();

      console.log('AdminReportesPage: Datos temporales cargados:', this.datosReporteTemporal.length);
      
    } catch (error) {
      console.error('Error al cargar reporte temporal:', error);
      throw error;
    }
  }

  /**
   * Carga datos para el reporte de usuarios/responsables
   */
  private async cargarReporteUsuarios(): Promise<void> {
    try {
      // TODO: Reemplazar con llamada real al servicio
      // const datosSub = this.adminService.obtenerReporteUsuarios(this.filtros).subscribe({
      //   next: (datos) => {
      //     this.datosReporteUsuarios = datos;
      //   },
      //   error: (error) => {
      //     console.error('Error al cargar reporte de usuarios:', error);
      //     throw error;
      //   }
      // });
      // this.subscripciones.push(datosSub);
      
      // Datos de ejemplo para demostración
      this.datosReporteUsuarios = [
        {
          usuario: 'Ana García',
          departamento: 'Administración',
          rol: 'Técnico',
          ticketsAsignados: 45,
          ticketsResueltos: 42,
          ticketsPendientes: 3,
          tiempoPromedioResolucion: 2.8,
          cargaTrabajo: 75,
          ultimaActividad: '2025-08-24T10:30:00Z'
        },
        {
          usuario: 'Carlos López',
          departamento: 'Informática',
          rol: 'Técnico',
          ticketsAsignados: 62,
          ticketsResueltos: 58,
          ticketsPendientes: 4,
          tiempoPromedioResolucion: 5.2,
          cargaTrabajo: 85,
          ultimaActividad: '2025-08-24T14:15:00Z'
        },
        {
          usuario: 'María Rodríguez',
          departamento: 'Comercial',
          rol: 'Técnico',
          ticketsAsignados: 38,
          ticketsResueltos: 35,
          ticketsPendientes: 3,
          tiempoPromedioResolucion: 3.9,
          cargaTrabajo: 68,
          ultimaActividad: '2025-08-24T11:45:00Z'
        },
        {
          usuario: 'Roberto Silva',
          departamento: 'Operaciones',
          rol: 'Técnico',
          ticketsAsignados: 33,
          ticketsResueltos: 32,
          ticketsPendientes: 1,
          tiempoPromedioResolucion: 2.1,
          cargaTrabajo: 55,
          ultimaActividad: '2025-08-24T13:20:00Z'
        }
      ];

      console.log('AdminReportesPage: Datos de usuarios cargados:', this.datosReporteUsuarios.length);
      
    } catch (error) {
      console.error('Error al cargar reporte de usuarios:', error);
      throw error;
    }
  }

  /**
   * Genera datos temporales de ejemplo para los últimos 30 días
   */
  private generarDatosTemporalesEjemplo(): ReporteTemporal[] {
    const datos: ReporteTemporal[] = [];
    const fechaInicio = new Date();
    fechaInicio.setDate(fechaInicio.getDate() - 30);

    for (let i = 0; i < 30; i++) {
      const fecha = new Date(fechaInicio);
      fecha.setDate(fecha.getDate() + i);
      
      // Simular variaciones realistas en los datos
      const esFinDeSemana = fecha.getDay() === 0 || fecha.getDay() === 6;
      const multiplicador = esFinDeSemana ? 0.3 : 1.0;
      
      datos.push({
        fecha: fecha.toISOString().split('T')[0],
        ticketsCreados: Math.floor((Math.random() * 25 + 15) * multiplicador),
        ticketsResueltos: Math.floor((Math.random() * 20 + 10) * multiplicador),
        ticketsPendientes: Math.floor((Math.random() * 10 + 5) * multiplicador),
        tiempoPromedioRespuesta: Math.round((Math.random() * 3 + 2) * 10) / 10
      });
    }

    return datos;
  }

  /**
   * Calcula métricas resumen globales
   */
  private calcularMetricasResumen(): void {
    switch (this.tipoReporteSeleccionado) {
      case 'rendimiento':
        this.calcularResumenRendimiento();
        break;
      case 'temporal':
        this.calcularResumenTemporal();
        break;
      case 'usuarios':
        this.calcularResumenUsuarios();
        break;
    }
  }

  /**
   * Calcula métricas resumen para reporte de rendimiento
   */
  private calcularResumenRendimiento(): void {
    if (this.datosReporteRendimiento.length === 0) return;

    const totales = this.datosReporteRendimiento.reduce((acc, item) => ({
      tickets: acc.tickets + item.totalTickets,
      resueltos: acc.resueltos + item.ticketsResueltos,
      tiempo: acc.tiempo + item.tiempoPromedioResolucion,
      satisfaccion: acc.satisfaccion + item.satisfaccionCliente,
      sla: acc.sla + item.cumplimientoSLA
    }), { tickets: 0, resueltos: 0, tiempo: 0, satisfaccion: 0, sla: 0 });

    const count = this.datosReporteRendimiento.length;

    this.metricsResumen = {
      totalTicketsPeriodo: totales.tickets,
      ticketsResueltosPromedio: Math.round((totales.resueltos / totales.tickets) * 100),
      tiempoPromedioGlobal: Math.round((totales.tiempo / count) * 10) / 10,
      satisfaccionPromedio: Math.round((totales.satisfaccion / count) * 10) / 10,
      cumplimientoSLAPromedio: Math.round((totales.sla / count) * 10) / 10,
      departamentoMasEficiente: this.datosReporteRendimiento
        .reduce((max, item) => item.eficiencia > max.eficiencia ? item : max).departamento,
      usuarioMasProductivo: ''
    };
  }

  /**
   * Calcula métricas resumen para reporte temporal
   */
  private calcularResumenTemporal(): void {
    if (this.datosReporteTemporal.length === 0) return;

    const totales = this.datosReporteTemporal.reduce((acc, item) => ({
      creados: acc.creados + item.ticketsCreados,
      resueltos: acc.resueltos + item.ticketsResueltos,
      pendientes: acc.pendientes + item.ticketsPendientes,
      tiempo: acc.tiempo + item.tiempoPromedioRespuesta
    }), { creados: 0, resueltos: 0, pendientes: 0, tiempo: 0 });

    const count = this.datosReporteTemporal.length;

    this.metricsResumen = {
      totalTicketsPeriodo: totales.creados,
      ticketsResueltosPromedio: Math.round((totales.resueltos / totales.creados) * 100),
      tiempoPromedioGlobal: Math.round((totales.tiempo / count) * 10) / 10,
      satisfaccionPromedio: 0,
      cumplimientoSLAPromedio: 0,
      departamentoMasEficiente: '',
      usuarioMasProductivo: ''
    };
  }

  /**
   * Calcula métricas resumen para reporte de usuarios
   */
  private calcularResumenUsuarios(): void {
    if (this.datosReporteUsuarios.length === 0) return;

    const totales = this.datosReporteUsuarios.reduce((acc, item) => ({
      asignados: acc.asignados + item.ticketsAsignados,
      resueltos: acc.resueltos + item.ticketsResueltos,
      tiempo: acc.tiempo + item.tiempoPromedioResolucion,
      carga: acc.carga + item.cargaTrabajo
    }), { asignados: 0, resueltos: 0, tiempo: 0, carga: 0 });

    const count = this.datosReporteUsuarios.length;

    this.metricsResumen = {
      totalTicketsPeriodo: totales.asignados,
      ticketsResueltosPromedio: Math.round((totales.resueltos / totales.asignados) * 100),
      tiempoPromedioGlobal: Math.round((totales.tiempo / count) * 10) / 10,
      satisfaccionPromedio: 0,
      cumplimientoSLAPromedio: 0,
      departamentoMasEficiente: '',
      usuarioMasProductivo: this.datosReporteUsuarios
        .reduce((max, item) => item.ticketsResueltos > max.ticketsResueltos ? item : max).usuario
    };
  }

  // ===== MÉTODOS DE INTERACCIÓN =====

  /**
   * Cambia el tipo de reporte y recarga los datos
   */
  async cambiarTipoReporte(tipo: string): Promise<void> {
    if (this.tipoReporteSeleccionado === tipo) return;

    console.log(`AdminReportesPage: Cambiando a reporte ${tipo}`);
    this.tipoReporteSeleccionado = tipo;
    await this.cargarReporte();
  }

  /**
   * Aplica los filtros y recarga el reporte
   */
  async aplicarFiltros(): Promise<void> {
    console.log('AdminReportesPage: Aplicando filtros:', this.filtros);
    
    // Validar fechas
    if (this.filtros.fechaInicio && this.filtros.fechaFin) {
      const inicio = new Date(this.filtros.fechaInicio);
      const fin = new Date(this.filtros.fechaFin);
      
      if (inicio > fin) {
        await this.mostrarError('La fecha de inicio no puede ser mayor a la fecha de fin');
        return;
      }
      
      // Verificar que no sea un rango muy amplio (más de 1 año)
      const diferenciaMeses = (fin.getFullYear() - inicio.getFullYear()) * 12 + 
                             (fin.getMonth() - inicio.getMonth());
      
      if (diferenciaMeses > 12) {
        const confirmar = await this.confirmarAccion(
          'Rango de fechas amplio',
          'El rango seleccionado es mayor a 1 año. Esto puede afectar el rendimiento. ¿Continuar?'
        );
        
        if (!confirmar) return;
      }
    }

    await this.cargarReporte();
    await this.mostrarToast('Filtros aplicados correctamente', 'success');
  }

  /**
   * Limpia todos los filtros y vuelve a los valores por defecto
   */
  async limpiarFiltros(): Promise<void> {
    console.log('AdminReportesPage: Limpiando filtros');
    
    this.filtros = {
      fechaInicio: this.obtenerFechaMesAnterior(),
      fechaFin: this.obtenerFechaHoy(),
      departamento: 'todos',
      rol: 'todos',
      estado: 'todos',
      prioridad: 'todas',
      cliente: 'todos',
      responsable: 'todos'
    };

    await this.cargarReporte();
    await this.mostrarToast('Filtros limpiados', 'success');
  }

  /**
   * Actualiza automáticamente los datos del reporte
   */
  async actualizarReporte(): Promise<void> {
    console.log('AdminReportesPage: Actualizando reporte automáticamente');
    await this.cargarReporte();
    await this.mostrarToast('Reporte actualizado', 'success');
  }
  toggleFiltros(): void {
    this.seccionFiltrosExpandida = !this.seccionFiltrosExpandida;
  }

  /**
   * Alterna la expansión de los filtros avanzados
   */
  toggleFiltrosAvanzados(): void {
    this.seccionFiltrosAvanzadosExpandida = !this.seccionFiltrosAvanzadosExpandida;
  }

  // ===== MÉTODOS AUXILIARES =====

  /**
   * Obtiene la fecha de hace un mes en formato YYYY-MM-DD
   */
  private obtenerFechaMesAnterior(): string {
    const fecha = new Date();
    fecha.setMonth(fecha.getMonth() - 1);
    return fecha.toISOString().split('T')[0];
  }

  /**
   * Obtiene la fecha actual en formato YYYY-MM-DD
   */
  private obtenerFechaHoy(): string {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Formatea un número con separadores de miles
   */
  formatearNumero(numero: number): string {
    return numero.toLocaleString('es-CL');
  }

  /**
   * Formatea una fecha y hora para mostrar
   */
  formatearFechaHora(fecha: string): string {
    const date = new Date(fecha);
    return this.datePipe.transform(date, 'dd/MM/yyyy HH:mm') || '';
  }

  /**
   * Formatea una fecha simple
   */
  formatearFecha(fecha: string): string {
    const date = new Date(fecha);
    return this.datePipe.transform(date, 'dd/MM/yyyy') || '';
  }

  /**
   * Obtiene el color para un valor de cumplimiento SLA
   */
  obtenerColorSLA(porcentaje: number): string {
    if (porcentaje >= 95) return 'success';
    if (porcentaje >= 85) return 'warning';
    return 'danger';
  }

  /**
   * Calcula el porcentaje de eficiencia
   */
  calcularEficiencia(resueltos: number, asignados: number): number {
    if (asignados === 0) return 0;
    return Math.round((resueltos / asignados) * 100);
  }

  /**
   * Funciones de tracking para ngFor (optimización de rendimiento)
   */
  trackByDepartamento(index: number, item: ReporteRendimiento): string {
    return item.departamento;
  }

  trackByFecha(index: number, item: ReporteTemporal): string {
    return item.fecha;
  }

  trackByUsuario(index: number, item: ReporteUsuarios): string {
    return item.usuario;
  }

  // ===== MÉTODOS DE UI Y NAVEGACIÓN =====

  /**
   * Navega de regreso al dashboard principal
   */
  volverAlDashboard(): void {
    console.log('AdminReportesPage: Navegando al dashboard');
    this.router.navigate(['/admin-dashboard']);
  }

  /**
   * Verifica si hay datos disponibles para mostrar
   */
  hayDatos(): boolean {
    switch (this.tipoReporteSeleccionado) {
      case 'rendimiento':
        return this.datosReporteRendimiento.length > 0;
      case 'temporal':
        return this.datosReporteTemporal.length > 0;
      case 'usuarios':
        return this.datosReporteUsuarios.length > 0;
      default:
        return false;
    }
  }

  /**
   * Obtiene el título del reporte actual
   */
  obtenerTituloReporte(): string {
    switch (this.tipoReporteSeleccionado) {
      case 'rendimiento':
        return 'Reporte de Rendimiento por Departamento';
      case 'temporal':
        return 'Reporte de Evolución Temporal';
      case 'usuarios':
        return 'Reporte de Productividad de Usuarios';
      default:
        return 'Reporte';
    }
  }

  /**
   * Obtiene la descripción del reporte actual
   */
  obtenerDescripcionReporte(): string {
    switch (this.tipoReporteSeleccionado) {
      case 'rendimiento':
        return 'Análisis de métricas de rendimiento, cumplimiento de SLA y satisfacción por departamento';
      case 'temporal':
        return 'Evolución de tickets creados, resueltos y tiempos de respuesta a lo largo del tiempo';
      case 'usuarios':
        return 'Análisis de productividad y carga de trabajo de usuarios responsables';
      default:
        return 'Análisis de datos del sistema';
    }
  }

  // ===== MÉTODOS DE MENSAJES Y NOTIFICACIONES =====

  /**
   * Muestra un mensaje de error
   */
  private async mostrarError(mensaje: string): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Error',
      message: mensaje,
      buttons: ['Cerrar'],
      cssClass: 'alert-danger'
    });
    
    await alert.present();
  }

  /**
   * Muestra un mensaje de confirmación
   */
  private async confirmarAccion(titulo: string, mensaje: string): Promise<boolean> {
    return new Promise(async (resolve) => {
      const alert = await this.alertController.create({
        header: titulo,
        message: mensaje,
        buttons: [
          {
            text: 'Cancelar',
            role: 'cancel',
            handler: () => resolve(false)
          },
          {
            text: 'Continuar',
            handler: () => resolve(true)
          }
        ]
      });
      
      await alert.present();
    });
  }

  /**
   * Muestra un toast informativo
   */
  private async mostrarToast(mensaje: string, color: string = 'medium'): Promise<void> {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 3000,
      color: color,
      position: 'bottom'
    });
    
    await toast.present();
  }
}