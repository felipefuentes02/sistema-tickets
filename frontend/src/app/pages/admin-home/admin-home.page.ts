import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule, LoadingController, RefresherCustomEvent } from '@ionic/angular';
import { HeaderComponent } from '../../components/header/header.component';
import { AuthService } from '../../services/auth.service';
import { AdminService } from '../../services/admin.service';

/**
 * Interface para el resumen general de la empresa
 */
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

/**
 * Interface para las métricas por departamento
 */
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

/**
 * Interface para datos de gráficos de tickets por estado
 */
interface TicketsPorEstado {
  estado: string;
  cantidad: number;
  porcentaje: number;
  color: string;
}

/**
 * Interface para tendencias mensuales
 */
interface TendenciaMensual {
  mes: string;
  creados: number;
  resueltos: number;
  pendientes: number;
}

/**
 * Componente de página principal para el administrador
 * Muestra resúmenes generales y métricas por departamento
 */
@Component({
  selector: 'app-admin-home',
  templateUrl: './admin-home.page.html',
  styleUrls: ['./admin-home.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, HeaderComponent]
})
export class AdminHomePage implements OnInit {

  // Propiedades del usuario y estado de carga
  usuario: any = null;
  cargando = false;
  fechaActual = new Date();
  
  /**
   * Resumen general de toda la empresa
   */
  resumenEmpresa: ResumenEmpresa = {
    totalTickets: 0,
    ticketsAbiertos: 0,
    ticketsCerrados: 0,
    ticketsPendientes: 0,
    ticketsVencidos: 0,
    tiempoPromedioResolucion: 0,
    satisfaccionPromedio: 0,
    usuariosActivos: 0
  };

  /**
   * Lista de departamentos con sus métricas
   * Departamentos corregidos según los códigos reales del sistema
   */
  departamentos: MetricasDepartamento[] = [
    {
      id: 1,
      nombre: 'Administración',
      totalTickets: 0,
      ticketsAbiertos: 0,
      ticketsCerrados: 0,
      porcentajeResolucion: 0,
      tiempoPromedioResolucion: 0,
      satisfaccionPromedio: 0,
      color: '#3498db'
    },
    {
      id: 2,
      nombre: 'Comercial',
      totalTickets: 0,
      ticketsAbiertos: 0,
      ticketsCerrados: 0,
      porcentajeResolucion: 0,
      tiempoPromedioResolucion: 0,
      satisfaccionPromedio: 0,
      color: '#e74c3c'
    },
    {
      id: 3,
      nombre: 'Informática',
      totalTickets: 0,
      ticketsAbiertos: 0,
      ticketsCerrados: 0,
      porcentajeResolucion: 0,
      tiempoPromedioResolucion: 0,
      satisfaccionPromedio: 0,
      color: '#f39c12'
    },
    {
      id: 4,
      nombre: 'Operaciones',
      totalTickets: 0,
      ticketsAbiertos: 0,
      ticketsCerrados: 0,
      porcentajeResolucion: 0,
      tiempoPromedioResolucion: 0,
      satisfaccionPromedio: 0,
      color: '#9b59b6'
    }
  ];

  /**
   * Datos para gráficos de distribución por estado
   */
  ticketsPorEstado: TicketsPorEstado[] = [
    { estado: 'Abierto', cantidad: 0, porcentaje: 0, color: '#3498db' },
    { estado: 'En Proceso', cantidad: 0, porcentaje: 0, color: '#f39c12' },
    { estado: 'Cerrado', cantidad: 0, porcentaje: 0, color: '#2ecc71' },
    { estado: 'Vencido', cantidad: 0, porcentaje: 0, color: '#e74c3c' }
  ];

  /**
   * Datos para tendencias mensuales
   */
  tendenciaMensual: TendenciaMensual[] = [];

  /**
   * Departamento seleccionado para vista detallada
   */
  departamentoSeleccionado: string = 'todos';

  /**
   * Constructor del componente
   * @param authService - Servicio de autenticación
   * @param adminService - Servicio específico del administrador
   * @param router - Router para navegación
   * @param loadingController - Controlador de loading de Ionic
   */
  constructor(
    private authService: AuthService,
    private adminService: AdminService,
    private router: Router,
    private loadingController: LoadingController
  ) { }

  /**
   * Método de inicialización del componente
   * Se ejecuta al cargar la página
   */
  ngOnInit() {
    console.log('Iniciando AdminHomePage...');
    this.usuario = this.authService.getCurrentUser();
    
    // Verificar que el usuario tenga permisos de administrador
    if (!this.verificarPermisosAdmin()) {
      console.error('Usuario sin permisos de administrador');
      this.router.navigate(['/login']);
      return;
    }

    this.cargarDatosResumen();
  }

  /**
   * Verifica que el usuario actual tenga permisos de administrador
   * @returns true si es administrador, false en caso contrario
   */
  private verificarPermisosAdmin(): boolean {
    if (!this.usuario) {
      return false;
    }

    // Verificar por ID de rol (1 = administrador)
    if (this.usuario.id_rol === 1) {
      return true;
    }

    // Método alternativo: verificar por correo si no hay id_rol
    if (this.usuario.correo && this.usuario.correo.includes('admin')) {
      return true;
    }

    return false;
  }

  /**
   * Carga todos los datos del resumen y métricas
   * Muestra un loading mientras carga los datos
   */
  async cargarDatosResumen(): Promise<void> {
    this.cargando = true;
    this.fechaActual = new Date();

    const loading = await this.loadingController.create({
      message: 'Cargando métricas...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      // Cargar datos en paralelo para mejor rendimiento
      await Promise.all([
        this.cargarResumenEmpresa(),
        this.cargarMetricasDepartamentos(),
        this.cargarTicketsPorEstado(),
        this.cargarTendenciaMensual()
      ]);

      console.log('Datos cargados correctamente');
    } catch (error) {
      console.error('Error al cargar datos del resumen:', error);
      // En caso de error, cargar datos de ejemplo
      this.cargarDatosEjemplo();
    } finally {
      this.cargando = false;
      await loading.dismiss();
    }
  }

  /**
   * Carga el resumen general de la empresa
   */
  private async cargarResumenEmpresa(): Promise<void> {
    try {
      // TODO: Reemplazar con llamada real al servicio
      // const resumen = await this.adminService.obtenerResumenEmpresa();
      
      // Datos de ejemplo mientras se implementa el backend
      this.resumenEmpresa = {
        totalTickets: 1247,
        ticketsAbiertos: 89,
        ticketsCerrados: 1158,
        ticketsPendientes: 34,
        ticketsVencidos: 12,
        tiempoPromedioResolucion: 4.2,
        satisfaccionPromedio: 8.6,
        usuariosActivos: 156
      };
    } catch (error) {
      console.error('Error al cargar resumen de empresa:', error);
      throw error;
    }
  }

  /**
   * Carga las métricas de todos los departamentos
   */
  private async cargarMetricasDepartamentos(): Promise<void> {
    try {
      // TODO: Reemplazar con llamada real al servicio
      // const metricas = await this.adminService.obtenerMetricasDepartamentos();
      
      // Datos de ejemplo para los 4 departamentos con nombres corregidos
      this.departamentos[0] = { // Administración
        ...this.departamentos[0],
        totalTickets: 456,
        ticketsAbiertos: 23,
        ticketsCerrados: 433,
        porcentajeResolucion: 94.9,
        tiempoPromedioResolucion: 3.8,
        satisfaccionPromedio: 9.1
      };

      this.departamentos[1] = { // Comercial
        ...this.departamentos[1],
        totalTickets: 298,
        ticketsAbiertos: 18,
        ticketsCerrados: 280,
        porcentajeResolucion: 93.9,
        tiempoPromedioResolucion: 4.5,
        satisfaccionPromedio: 8.7
      };

      this.departamentos[2] = { // Informática
        ...this.departamentos[2],
        totalTickets: 267,
        ticketsAbiertos: 31,
        ticketsCerrados: 236,
        porcentajeResolucion: 88.4,
        tiempoPromedioResolucion: 5.2,
        satisfaccionPromedio: 8.2
      };

      this.departamentos[3] = { // Operaciones
        ...this.departamentos[3],
        totalTickets: 226,
        ticketsAbiertos: 17,
        ticketsCerrados: 209,
        porcentajeResolucion: 92.5,
        tiempoPromedioResolucion: 4.1,
        satisfaccionPromedio: 8.9
      };
    } catch (error) {
      console.error('Error al cargar métricas de departamentos:', error);
      throw error;
    }
  }

  /**
   * Carga la distribución de tickets por estado
   */
  private async cargarTicketsPorEstado(): Promise<void> {
    try {
      const total = this.resumenEmpresa.totalTickets;
      
      this.ticketsPorEstado = [
        {
          estado: 'Abierto',
          cantidad: this.resumenEmpresa.ticketsAbiertos,
          porcentaje: (this.resumenEmpresa.ticketsAbiertos / total) * 100,
          color: '#3498db'
        },
        {
          estado: 'En Proceso',
          cantidad: this.resumenEmpresa.ticketsPendientes,
          porcentaje: (this.resumenEmpresa.ticketsPendientes / total) * 100,
          color: '#f39c12'
        },
        {
          estado: 'Cerrado',
          cantidad: this.resumenEmpresa.ticketsCerrados,
          porcentaje: (this.resumenEmpresa.ticketsCerrados / total) * 100,
          color: '#2ecc71'
        },
        {
          estado: 'Vencido',
          cantidad: this.resumenEmpresa.ticketsVencidos,
          porcentaje: (this.resumenEmpresa.ticketsVencidos / total) * 100,
          color: '#e74c3c'
        }
      ];
    } catch (error) {
      console.error('Error al cargar tickets por estado:', error);
      throw error;
    }
  }

  /**
   * Carga la tendencia mensual de tickets
   */
  private async cargarTendenciaMensual(): Promise<void> {
    try {
      // TODO: Reemplazar con llamada real al servicio
      // const tendencia = await this.adminService.obtenerTendenciaMensual();
      
      // Datos de ejemplo para los últimos 6 meses
      this.tendenciaMensual = [
        { mes: 'Feb', creados: 187, resueltos: 182, pendientes: 5 },
        { mes: 'Mar', creados: 245, resueltos: 239, pendientes: 6 },
        { mes: 'Abr', creados: 198, resueltos: 195, pendientes: 3 },
        { mes: 'May', creados: 267, resueltos: 258, pendientes: 9 },
        { mes: 'Jun', creados: 223, resueltos: 218, pendientes: 5 },
        { mes: 'Jul', creados: 127, resueltos: 124, pendientes: 3 }
      ];
    } catch (error) {
      console.error('Error al cargar tendencia mensual:', error);
      throw error;
    }
  }

  /**
   * Carga datos de ejemplo en caso de error del backend
   */
  private cargarDatosEjemplo(): void {
    console.log('Cargando datos de ejemplo...');
    // Los datos ya están inicializados en los métodos privados
  }

  /**
   * Refresca los datos cuando el usuario desliza hacia abajo
   * @param event - Evento del refresher de Ionic
   */
  async refrescar(event: RefresherCustomEvent): Promise<void> {
    console.log('Refrescando datos...');
    
    try {
      await this.cargarDatosResumen();
    } catch (error) {
      console.error('Error al refrescar:', error);
    } finally {
      event.target.complete();
    }
  }

  /**
   * Cambia el departamento seleccionado para filtrar métricas
   * @param event - Evento del ion-segment
   */
  cambiarDepartamento(event: any): void {
    // Obtener el valor del evento de forma segura
    const departamento = event?.detail?.value;
    
    // Validar que el valor existe y es string
    if (!departamento || typeof departamento !== 'string') {
      console.warn('Valor de departamento inválido:', departamento);
      return;
    }

    this.departamentoSeleccionado = departamento;
    console.log('Departamento seleccionado:', departamento);
    
    if (departamento === 'todos') {
      // Mostrar métricas generales
      this.cargarTicketsPorEstado();
    } else {
      // Filtrar por departamento específico
      this.filtrarPorDepartamento(parseInt(departamento));
    }
  }

  /**
   * Método alternativo más específico para el cambio de departamento
   * @param departamento - ID del departamento o 'todos'
   */
  seleccionarDepartamento(departamento: string): void {
    this.departamentoSeleccionado = departamento;
    console.log('Departamento seleccionado:', departamento);
    
    if (departamento === 'todos') {
      // Mostrar métricas generales
      this.cargarTicketsPorEstado();
    } else {
      // Filtrar por departamento específico
      this.filtrarPorDepartamento(parseInt(departamento));
    }
  }

  /**
   * Filtra las métricas por un departamento específico
   * @param idDepartamento - ID del departamento
   */
  private filtrarPorDepartamento(idDepartamento: number): void {
    const dept = this.departamentos.find(d => d.id === idDepartamento);
    if (!dept) return;

    // Actualizar gráfico de estados con datos del departamento
    const total = dept.totalTickets;
    this.ticketsPorEstado = [
      {
        estado: 'Abierto',
        cantidad: dept.ticketsAbiertos,
        porcentaje: (dept.ticketsAbiertos / total) * 100,
        color: '#3498db'
      },
      {
        estado: 'Cerrado',
        cantidad: dept.ticketsCerrados,
        porcentaje: (dept.ticketsCerrados / total) * 100,
        color: '#2ecc71'
      },
      {
        estado: 'En Proceso',
        cantidad: Math.round(total * 0.1),
        porcentaje: 10,
        color: '#f39c12'
      },
      {
        estado: 'Vencido',
        cantidad: Math.round(total * 0.02),
        porcentaje: 2,
        color: '#e74c3c'
      }
    ];
  }

  /**
   * Obtiene el nombre del usuario actual
   * @returns Nombre del usuario o string por defecto
   */
  obtenerNombreUsuario(): string {
    if (!this.usuario) return 'Administrador';
    return this.usuario.nombre || this.usuario.correo || 'Administrador';
  }

  /**
   * Navegación a la página de Dashboard completo
   */
  irADashboard(): void {
    console.log('Navegando a Dashboard...');
    this.router.navigate(['/admin-dashboard']);
  }

  /**
   * Navegación a la página de Gestión de Usuarios
   */
  irAGestionUsuarios(): void {
    console.log('Navegando a Gestión de Usuarios...');
    this.router.navigate(['/admin-usuarios']);
  }

  /**
   * Navegación a la página de Reportes
   */
  irAReportes(): void {
    console.log('Navegando a Reportes...');
    this.router.navigate(['/admin-reportes']);
  }

  /**
   * Navegación a la página de Configuración
   */
  irAConfiguracion(): void {
    console.log('Navegando a Configuración...');
    this.router.navigate(['/admin-configuracion']);
  }

  /**
   * Navega al detalle de un departamento específico
   * @param departamento - Datos del departamento
   */
  verDetalleDepartamento(departamento: MetricasDepartamento): void {
    console.log('Ver detalle del departamento:', departamento.nombre);
    this.router.navigate(['/admin-departamento', departamento.id]);
  }

  /**
   * Calcula el porcentaje de un valor respecto al total
   * @param valor - Valor específico
   * @param total - Valor total
   * @returns Porcentaje redondeado
   */
  calcularPorcentaje(valor: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((valor / total) * 100);
  }

  /**
   * Formatea un número para mostrar con separadores de miles
   * @param numero - Número a formatear
   * @returns String formateado
   */
  formatearNumero(numero: number): string {
    return numero.toLocaleString('es-CL');
  }

  /**
   * Obtiene el color de estado según el porcentaje de resolución
   * @param porcentaje - Porcentaje de resolución
   * @returns Color CSS
   */
  obtenerColorEstado(porcentaje: number): string {
    if (porcentaje >= 95) return '#2ecc71'; // Verde
    if (porcentaje >= 85) return '#f39c12'; // Naranja
    return '#e74c3c'; // Rojo
  }
}