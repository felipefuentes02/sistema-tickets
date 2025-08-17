import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule, LoadingController, RefresherCustomEvent } from '@ionic/angular';
import { HeaderComponent } from '../../components/header/header.component';
import { AuthService } from '../../services/auth.service';
import { AdminService } from '../../services/admin.service';

/**
 * Interface para métricas detalladas por departamento
 */
interface MetricasDepartamentoDetalladas {
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
 * Interface para métricas de usuarios por departamento
 */
interface MetricasUsuario {
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
  // Removido: estado: 'activo' | 'ocupado' | 'disponible';
}

/**
 * Interface para distribución de tickets por estado y departamento
 */
interface DistribucionTickets {
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
interface TendenciaAvanzada {
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
interface AnalisisSLA {
  departamento: string;
  cumplimientoSLA: number;
  ticketsDentroSLA: number;
  ticketsFueraSLA: number;
  tiempoPromedio: number;
  tiempoLimite: number;
  riesgoIncumplimiento: number;
}

/**
 * Interface para derivaciones por departamento (nueva estructura)
 */
interface DerivacionesPorDepartamento {
  departamento: string;
  totalDerivados: number;
  tiempoPromedioDerivacion: number; // en días
  derivacionesA: {
    departamentoDestino: string;
    cantidad: number;
    tiempoPromedio: number;
    porcentaje: number;
  }[];
}

/**
 * Interface para métricas de derivación (DEPRECATED - reemplazada por DerivacionesPorDepartamento)
 */
interface MetricasDerivacion {
  departamentoOrigen: string;
  departamentoDestino: string;
  cantidad: number;
  tiempoPromedio: number;
  motivo: string;
  frecuencia: number;
}

/**
 * Componente de Dashboard detallado para el administrador
 * Muestra métricas avanzadas, análisis por departamento y usuario
 */
@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.page.html',
  styleUrls: ['./admin-dashboard.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, HeaderComponent]
})
export class AdminDashboardPage implements OnInit {

  // Propiedades del usuario y estado de carga
  usuario: any = null;
  cargando = false;
  fechaActual = new Date();
  
  /**
   * Métricas detalladas por departamento
   */
  metricasDetalladas: MetricasDepartamentoDetalladas[] = [
    {
      id: 1,
      nombre: 'Administración',
      totalTickets: 0,
      ticketsAbiertos: 0,
      ticketsCerrados: 0,
      ticketsPendientes: 0,
      ticketsVencidos: 0,
      ticketsDerivados: 0,
      ticketsEscalados: 0,
      tiempoPromedioResolucion: 0,
      tiempoPromedioRespuesta: 0,
      satisfaccionPromedio: 0,
      eficienciaResolucion: 0,
      usuariosActivos: 0,
      cargaTrabajo: 0,
      color: '#3498db'
    },
    {
      id: 2,
      nombre: 'Comercial',
      totalTickets: 0,
      ticketsAbiertos: 0,
      ticketsCerrados: 0,
      ticketsPendientes: 0,
      ticketsVencidos: 0,
      ticketsDerivados: 0,
      ticketsEscalados: 0,
      tiempoPromedioResolucion: 0,
      tiempoPromedioRespuesta: 0,
      satisfaccionPromedio: 0,
      eficienciaResolucion: 0,
      usuariosActivos: 0,
      cargaTrabajo: 0,
      color: '#e74c3c'
    },
    {
      id: 3,
      nombre: 'Informática',
      totalTickets: 0,
      ticketsAbiertos: 0,
      ticketsCerrados: 0,
      ticketsPendientes: 0,
      ticketsVencidos: 0,
      ticketsDerivados: 0,
      ticketsEscalados: 0,
      tiempoPromedioResolucion: 0,
      tiempoPromedioRespuesta: 0,
      satisfaccionPromedio: 0,
      eficienciaResolucion: 0,
      usuariosActivos: 0,
      cargaTrabajo: 0,
      color: '#f39c12'
    },
    {
      id: 4,
      nombre: 'Operaciones',
      totalTickets: 0,
      ticketsAbiertos: 0,
      ticketsCerrados: 0,
      ticketsPendientes: 0,
      ticketsVencidos: 0,
      ticketsDerivados: 0,
      ticketsEscalados: 0,
      tiempoPromedioResolucion: 0,
      tiempoPromedioRespuesta: 0,
      satisfaccionPromedio: 0,
      eficienciaResolucion: 0,
      usuariosActivos: 0,
      cargaTrabajo: 0,
      color: '#9b59b6'
    }
  ];

  /**
   * Métricas de usuarios por departamento
   */
  usuariosPorDepartamento: { [key: string]: MetricasUsuario[] } = {};

  /**
   * Distribución de tickets por estado y departamento
   */
  distribucionTickets: DistribucionTickets[] = [];

  /**
   * Tendencias temporales avanzadas
   */
  tendenciaAvanzada: TendenciaAvanzada[] = [];

  /**
   * Análisis de cumplimiento de SLA
   */
  analisisSLA: AnalisisSLA[] = [];

  /**
   * Métricas de derivación entre departamentos (nueva estructura)
   */
  derivacionesPorDepartamento: DerivacionesPorDepartamento[] = [];

  /**
   * Métricas de derivación entre departamentos (DEPRECATED)
   */
  metricasDerivacion: MetricasDerivacion[] = [];

  /**
   * Configuración de vista
   */
  vistaActual: 'general' | 'departamentos' | 'usuarios' | 'sla' | 'derivaciones' = 'general';
  departamentoSeleccionado: number | null = null;
  periodoSeleccionado: 'semana' | 'mes' | 'año' = 'mes';

  /**
   * Propiedades calculadas para el template
   */
  totalTickets = 0;
  totalTicketsAbiertos = 0;
  totalTicketsPendientes = 0;
  totalTicketsVencidos = 0;
  totalTicketsDerivados = 0;
  eficienciaPromedio = 0;
  tiempoPromedioResolucion = 0;
  satisfaccionPromedio = 0;
  nombreDepartamentoSeleccionado = '';

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
   */
  ngOnInit() {
    console.log('Iniciando AdminDashboardPage...');
    this.usuario = this.authService.getCurrentUser();
    
    // Verificar permisos de administrador
    if (!this.verificarPermisosAdmin()) {
      console.error('Usuario sin permisos de administrador');
      this.router.navigate(['/login']);
      return;
    }

    this.cargarDatosDashboard();
  }

  /**
   * Verifica que el usuario actual tenga permisos de administrador
   */
  private verificarPermisosAdmin(): boolean {
    if (!this.usuario) return false;
    return this.usuario.id_rol === 1 || 
           (this.usuario.correo && this.usuario.correo.includes('admin'));
  }

  /**
   * Carga todos los datos del dashboard
   */
  async cargarDatosDashboard(): Promise<void> {
    this.cargando = true;
    this.fechaActual = new Date();

    const loading = await this.loadingController.create({
      message: 'Cargando dashboard completo...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      await Promise.all([
        this.cargarMetricasDetalladas(),
        this.cargarUsuariosPorDepartamento(),
        this.cargarDistribucionTickets(),
        this.cargarTendenciaAvanzada(),
        this.cargarAnalisisSLA(),
        this.cargarDerivacionesPorDepartamento()
      ]);

      // Actualizar propiedades calculadas
      this.actualizarPropiedadesCalculadas();

      console.log('Dashboard cargado correctamente');
    } catch (error) {
      console.error('Error al cargar dashboard:', error);
      this.cargarDatosEjemplo();
    } finally {
      this.cargando = false;
      await loading.dismiss();
    }
  }

  /**
   * Actualiza las propiedades calculadas para el template
   */
  private actualizarPropiedadesCalculadas(): void {
    this.totalTickets = this.metricasDetalladas.reduce((sum, d) => sum + d.totalTickets, 0);
    this.totalTicketsAbiertos = this.metricasDetalladas.reduce((sum, d) => sum + d.ticketsAbiertos, 0);
    this.totalTicketsPendientes = this.metricasDetalladas.reduce((sum, d) => sum + d.ticketsPendientes, 0);
    this.totalTicketsVencidos = this.metricasDetalladas.reduce((sum, d) => sum + d.ticketsVencidos, 0);
    this.totalTicketsDerivados = this.metricasDetalladas.reduce((sum, d) => sum + d.ticketsDerivados, 0);
    
    if (this.metricasDetalladas.length > 0) {
      this.eficienciaPromedio = this.metricasDetalladas.reduce((sum, d) => sum + d.eficienciaResolucion, 0) / this.metricasDetalladas.length;
      this.tiempoPromedioResolucion = this.metricasDetalladas.reduce((sum, d) => sum + d.tiempoPromedioResolucion, 0) / this.metricasDetalladas.length;
      this.satisfaccionPromedio = this.metricasDetalladas.reduce((sum, d) => sum + d.satisfaccionPromedio, 0) / this.metricasDetalladas.length;
    }

    // Actualizar nombre del departamento seleccionado
    if (this.departamentoSeleccionado) {
      const dept = this.metricasDetalladas.find(d => d.id === this.departamentoSeleccionado);
      this.nombreDepartamentoSeleccionado = dept ? dept.nombre : '';
    }
  }

  /**
   * Carga las métricas detalladas por departamento
   */
  private async cargarMetricasDetalladas(): Promise<void> {
    try {
      // TODO: Reemplazar con llamada real al servicio
      // const metricas = await this.adminService.obtenerMetricasDetalladas(this.periodoSeleccionado);
      
      // Datos de ejemplo más detallados
      this.metricasDetalladas[0] = { // Administración
        ...this.metricasDetalladas[0],
        totalTickets: 456,
        ticketsAbiertos: 23,
        ticketsCerrados: 400,
        ticketsPendientes: 18,
        ticketsVencidos: 8,
        ticketsDerivados: 45,
        ticketsEscalados: 7,
        tiempoPromedioResolucion: 3.2,
        tiempoPromedioRespuesta: 1.1,
        satisfaccionPromedio: 8.7,
        eficienciaResolucion: 87.7,
        usuariosActivos: 8,
        cargaTrabajo: 75.5
      };

      this.metricasDetalladas[1] = { // Comercial
        ...this.metricasDetalladas[1],
        totalTickets: 342,
        ticketsAbiertos: 31,
        ticketsCerrados: 285,
        ticketsPendientes: 15,
        ticketsVencidos: 11,
        ticketsDerivados: 28,
        ticketsEscalados: 11,
        tiempoPromedioResolucion: 4.1,
        tiempoPromedioRespuesta: 1.5,
        satisfaccionPromedio: 8.2,
        eficienciaResolucion: 83.3,
        usuariosActivos: 6,
        cargaTrabajo: 82.1
      };

      this.metricasDetalladas[2] = { // Informática
        ...this.metricasDetalladas[2],
        totalTickets: 528,
        ticketsAbiertos: 42,
        ticketsCerrados: 445,
        ticketsPendientes: 28,
        ticketsVencidos: 13,
        ticketsDerivados: 67,
        ticketsEscalados: 15,
        tiempoPromedioResolucion: 5.8,
        tiempoPromedioRespuesta: 2.1,
        satisfaccionPromedio: 8.9,
        eficienciaResolucion: 84.3,
        usuariosActivos: 12,
        cargaTrabajo: 91.2
      };

      this.metricasDetalladas[3] = { // Operaciones
        ...this.metricasDetalladas[3],
        totalTickets: 289,
        ticketsAbiertos: 19,
        ticketsCerrados: 255,
        ticketsPendientes: 12,
        ticketsVencidos: 3,
        ticketsDerivados: 22,
        ticketsEscalados: 3,
        tiempoPromedioResolucion: 2.9,
        tiempoPromedioRespuesta: 0.8,
        satisfaccionPromedio: 9.1,
        eficienciaResolucion: 88.2,
        usuariosActivos: 5,
        cargaTrabajo: 68.7
      };
    } catch (error) {
      console.error('Error al cargar métricas detalladas:', error);
      throw error;
    }
  }

  /**
   * Carga las métricas de usuarios por departamento
   */
  private async cargarUsuariosPorDepartamento(): Promise<void> {
    try {
      // Datos de ejemplo de usuarios
      this.usuariosPorDepartamento = {
        'Administración': [
          {
            id: 1,
            nombreCompleto: 'Ana García López',
            correo: 'ana.garcia@empresa.com',
            departamento: 'Administración',
            ticketsAsignados: 15,
            ticketsResueltos: 12,
            ticketsPendientes: 3,
            tiempoPromedioResolucion: 2.8,
            satisfaccionPromedio: 8.9,
            eficiencia: 80.0
          },
          {
            id: 2,
            nombreCompleto: 'Carlos Mendoza Silva',
            correo: 'carlos.mendoza@empresa.com',
            departamento: 'Administración',
            ticketsAsignados: 8,
            ticketsResueltos: 8,
            ticketsPendientes: 0,
            tiempoPromedioResolucion: 3.5,
            satisfaccionPromedio: 8.5,
            eficiencia: 100.0
          }
        ],
        'Comercial': [
          {
            id: 3,
            nombreCompleto: 'María Rodríguez Vega',
            correo: 'maria.rodriguez@empresa.com',
            departamento: 'Comercial',
            ticketsAsignados: 22,
            ticketsResueltos: 18,
            ticketsPendientes: 4,
            tiempoPromedioResolucion: 4.2,
            satisfaccionPromedio: 8.1,
            eficiencia: 81.8
          },
          {
            id: 4,
            nombreCompleto: 'Luis Fernández Castro',
            correo: 'luis.fernandez@empresa.com',
            departamento: 'Comercial',
            ticketsAsignados: 9,
            ticketsResueltos: 7,
            ticketsPendientes: 2,
            tiempoPromedioResolucion: 3.9,
            satisfaccionPromedio: 8.3,
            eficiencia: 77.8
          }
        ],
        'Informática': [
          {
            id: 5,
            nombreCompleto: 'David Torres Morales',
            correo: 'david.torres@empresa.com',
            departamento: 'Informática',
            ticketsAsignados: 18,
            ticketsResueltos: 15,
            ticketsPendientes: 3,
            tiempoPromedioResolucion: 6.1,
            satisfaccionPromedio: 9.2,
            eficiencia: 83.3
          },
          {
            id: 6,
            nombreCompleto: 'Laura Jiménez Ruiz',
            correo: 'laura.jimenez@empresa.com',
            departamento: 'Informática',
            ticketsAsignados: 24,
            ticketsResueltos: 20,
            ticketsPendientes: 4,
            tiempoPromedioResolucion: 5.5,
            satisfaccionPromedio: 8.7,
            eficiencia: 83.3
          }
        ],
        'Operaciones': [
          {
            id: 7,
            nombreCompleto: 'Roberto Sánchez Díaz',
            correo: 'roberto.sanchez@empresa.com',
            departamento: 'Operaciones',
            ticketsAsignados: 12,
            ticketsResueltos: 11,
            ticketsPendientes: 1,
            tiempoPromedioResolucion: 2.7,
            satisfaccionPromedio: 9.3,
            eficiencia: 91.7
          },
          {
            id: 8,
            nombreCompleto: 'Patricia López Herrera',
            correo: 'patricia.lopez@empresa.com',
            departamento: 'Operaciones',
            ticketsAsignados: 7,
            ticketsResueltos: 6,
            ticketsPendientes: 1,
            tiempoPromedioResolucion: 3.1,
            satisfaccionPromedio: 8.9,
            eficiencia: 85.7
          }
        ]
      };
    } catch (error) {
      console.error('Error al cargar usuarios por departamento:', error);
      throw error;
    }
  }

  /**
   * Carga la distribución de tickets por estado y departamento
   */
  private async cargarDistribucionTickets(): Promise<void> {
    try {
      this.distribucionTickets = [
        {
          departamento: 'Administración',
          abiertos: 23,
          enProceso: 18,
          pendientes: 12,
          cerrados: 400,
          vencidos: 8,
          derivados: 45,
          escalados: 7
        },
        {
          departamento: 'Comercial',
          abiertos: 31,
          enProceso: 15,
          pendientes: 9,
          cerrados: 285,
          vencidos: 11,
          derivados: 28,
          escalados: 11
        },
        {
          departamento: 'Informática',
          abiertos: 42,
          enProceso: 28,
          pendientes: 18,
          cerrados: 445,
          vencidos: 13,
          derivados: 67,
          escalados: 15
        },
        {
          departamento: 'Operaciones',
          abiertos: 19,
          enProceso: 12,
          pendientes: 7,
          cerrados: 255,
          vencidos: 3,
          derivados: 22,
          escalados: 3
        }
      ];
    } catch (error) {
      console.error('Error al cargar distribución de tickets:', error);
      throw error;
    }
  }

  /**
   * Carga las tendencias temporales avanzadas
   */
  private async cargarTendenciaAvanzada(): Promise<void> {
    try {
      this.tendenciaAvanzada = [
        {
          periodo: 'Ene 2025',
          creados: 387,
          resueltos: 356,
          pendientes: 31,
          derivados: 45,
          escalados: 12,
          promedioResolucion: 4.2,
          satisfaccion: 8.5
        },
        {
          periodo: 'Feb 2025',
          creados: 425,
          resueltos: 401,
          pendientes: 24,
          derivados: 52,
          escalados: 18,
          promedioResolucion: 3.9,
          satisfaccion: 8.7
        },
        {
          periodo: 'Mar 2025',
          creados: 456,
          resueltos: 432,
          pendientes: 24,
          derivados: 48,
          escalados: 15,
          promedioResolucion: 4.1,
          satisfaccion: 8.6
        },
        {
          periodo: 'Abr 2025',
          creados: 398,
          resueltos: 385,
          pendientes: 13,
          derivados: 41,
          escalados: 9,
          promedioResolucion: 3.8,
          satisfaccion: 8.8
        },
        {
          periodo: 'May 2025',
          creados: 512,
          resueltos: 487,
          pendientes: 25,
          derivados: 63,
          escalados: 21,
          promedioResolucion: 4.3,
          satisfaccion: 8.4
        },
        {
          periodo: 'Jun 2025',
          creados: 467,
          resueltos: 442,
          pendientes: 25,
          derivados: 56,
          escalados: 16,
          promedioResolucion: 4.0,
          satisfaccion: 8.7
        }
      ];
    } catch (error) {
      console.error('Error al cargar tendencia avanzada:', error);
      throw error;
    }
  }

  /**
   * Carga el análisis de cumplimiento de SLA
   */
  private async cargarAnalisisSLA(): Promise<void> {
    try {
      this.analisisSLA = [
        {
          departamento: 'Administración',
          cumplimientoSLA: 92.1,
          ticketsDentroSLA: 420,
          ticketsFueraSLA: 36,
          tiempoPromedio: 3.2,
          tiempoLimite: 4.0,
          riesgoIncumplimiento: 15.2
        },
        {
          departamento: 'Comercial',
          cumplimientoSLA: 88.6,
          ticketsDentroSLA: 303,
          ticketsFueraSLA: 39,
          tiempoPromedio: 4.1,
          tiempoLimite: 4.5,
          riesgoIncumplimiento: 22.8
        },
        {
          departamento: 'Informática',
          cumplimientoSLA: 85.4,
          ticketsDentroSLA: 451,
          ticketsFueraSLA: 77,
          tiempoPromedio: 5.8,
          tiempoLimite: 6.0,
          riesgoIncumplimiento: 28.3
        },
        {
          departamento: 'Operaciones',
          cumplimientoSLA: 96.2,
          ticketsDentroSLA: 278,
          ticketsFueraSLA: 11,
          tiempoPromedio: 2.9,
          tiempoLimite: 3.5,
          riesgoIncumplimiento: 8.7
        }
      ];
    } catch (error) {
      console.error('Error al cargar análisis SLA:', error);
      throw error;
    }
  }

  /**
   * Carga las derivaciones por departamento (nueva estructura)
   */
  private async cargarDerivacionesPorDepartamento(): Promise<void> {
    try {
      // TODO: Reemplazar con llamada real al servicio
      // const derivaciones = await this.adminService.obtenerDerivacionesPorDepartamento();
      
      // Datos de ejemplo con la nueva estructura
      this.derivacionesPorDepartamento = [
        {
          departamento: 'Administración',
          totalDerivados: 45,
          tiempoPromedioDerivacion: 1.2,
          derivacionesA: [
            {
              departamentoDestino: 'Informática',
              cantidad: 28,
              tiempoPromedio: 1.4,
              porcentaje: 62.2
            },
            {
              departamentoDestino: 'Comercial',
              cantidad: 12,
              tiempoPromedio: 0.8,
              porcentaje: 26.7
            },
            {
              departamentoDestino: 'Operaciones',
              cantidad: 5,
              tiempoPromedio: 1.6,
              porcentaje: 11.1
            }
          ]
        },
        {
          departamento: 'Comercial',
          totalDerivados: 23,
          tiempoPromedioDerivacion: 0.9,
          derivacionesA: [
            {
              departamentoDestino: 'Administración',
              cantidad: 15,
              tiempoPromedio: 0.7,
              porcentaje: 65.2
            },
            {
              departamentoDestino: 'Informática',
              cantidad: 8,
              tiempoPromedio: 1.2,
              porcentaje: 34.8
            }
          ]
        },
        {
          departamento: 'Informática',
          totalDerivados: 18,
          tiempoPromedioDerivacion: 2.1,
          derivacionesA: [
            {
              departamentoDestino: 'Operaciones',
              cantidad: 11,
              tiempoPromedio: 2.3,
              porcentaje: 61.1
            },
            {
              departamentoDestino: 'Comercial',
              cantidad: 7,
              tiempoPromedio: 1.8,
              porcentaje: 38.9
            }
          ]
        },
        {
          departamento: 'Operaciones',
          totalDerivados: 8,
          tiempoPromedioDerivacion: 0.6,
          derivacionesA: [
            {
              departamentoDestino: 'Comercial',
              cantidad: 5,
              tiempoPromedio: 0.5,
              porcentaje: 62.5
            },
            {
              departamentoDestino: 'Administración',
              cantidad: 3,
              tiempoPromedio: 0.8,
              porcentaje: 37.5
            }
          ]
        }
      ];
    } catch (error) {
      console.error('Error al cargar derivaciones por departamento:', error);
      throw error;
    }
  }

  /**
   * Carga las métricas de derivación entre departamentos (DEPRECATED)
   */
  private async cargarMetricasDerivacion(): Promise<void> {
    try {
      // Esta función se mantiene por compatibilidad pero ya no se usa
      this.metricasDerivacion = [];
    } catch (error) {
      console.error('Error al cargar métricas de derivación:', error);
      throw error;
    }
  }

  /**
   * Carga datos de ejemplo en caso de error
   */
  private cargarDatosEjemplo(): void {
    console.log('Cargando datos de ejemplo para dashboard...');
  }

  /**
   * Refresca los datos del dashboard
   */
  async refrescar(event: RefresherCustomEvent): Promise<void> {
    console.log('Refrescando dashboard...');
    try {
      await this.cargarDatosDashboard();
    } catch (error) {
      console.error('Error al refrescar dashboard:', error);
    } finally {
      event.target.complete();
    }
  }

  /**
   * Cambia la vista del dashboard
   */
  cambiarVista(vista: 'general' | 'departamentos' | 'usuarios' | 'sla' | 'derivaciones'): void {
    this.vistaActual = vista;
    console.log('Vista cambiada a:', vista);
  }

  /**
   * Selecciona un departamento para análisis detallado
   */
  seleccionarDepartamento(idDepartamento: number): void {
    this.departamentoSeleccionado = idDepartamento;
    this.vistaActual = 'usuarios';
    this.actualizarPropiedadesCalculadas();
    console.log('Departamento seleccionado:', idDepartamento);
  }

  /**
   * Quita el filtro de departamento y muestra todos los usuarios
   */
  quitarFiltroDepartamento(): void {
    this.departamentoSeleccionado = null;
    this.nombreDepartamentoSeleccionado = '';
    this.actualizarPropiedadesCalculadas();
    console.log('Filtro de departamento removido - mostrando todos los usuarios');
  }

  /**
   * Obtiene las iniciales de un nombre completo
   * @param nombreCompleto - Nombre completo del usuario
   * @returns Iniciales (máximo 2 caracteres)
   */
  obtenerIniciales(nombreCompleto: string): string {
    if (!nombreCompleto) return 'U';
    
    const palabras = nombreCompleto.split(' ');
    if (palabras.length >= 2) {
      return (palabras[0][0] + palabras[1][0]).toUpperCase();
    } else if (palabras.length === 1) {
      return palabras[0].substring(0, 2).toUpperCase();
    }
    
    return 'U';
  }

  /**
   * Cambia el período de análisis
   */
  cambiarPeriodo(periodo: 'semana' | 'mes' | 'año'): void {
    this.periodoSeleccionado = periodo;
    console.log('Período cambiado a:', periodo);
    this.cargarDatosDashboard();
  }

  /**
   * Obtiene el nombre del usuario
   */
  obtenerNombreUsuario(): string {
    if (!this.usuario) return 'Administrador';
    return this.usuario.nombre || this.usuario.correo || 'Administrador';
  }

  /**
   * Obtiene usuarios del departamento seleccionado
   */
  obtenerUsuariosDepartamento(): MetricasUsuario[] {
    if (!this.departamentoSeleccionado) return [];
    
    const nombreDept = this.metricasDetalladas.find(d => d.id === this.departamentoSeleccionado)?.nombre;
    return nombreDept ? (this.usuariosPorDepartamento[nombreDept] || []) : [];
  }

  /**
   * Calcula el porcentaje de eficiencia
   */
  calcularPorcentaje(valor: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((valor / total) * 100);
  }

  /**
   * Formatea números para mostrar
   */
  formatearNumero(numero: number): string {
    return numero.toLocaleString('es-CL');
  }

  /**
   * Obtiene el color de estado según el porcentaje
   */
  obtenerColorEstado(porcentaje: number): string {
    if (porcentaje >= 90) return '#2ecc71';
    if (porcentaje >= 80) return '#f39c12';
    if (porcentaje >= 70) return '#e67e22';
    return '#e74c3c';
  }

  /**
   * Obtiene el color del estado del usuario
   */
  obtenerColorUsuario(estado: string): string {
    switch (estado) {
      case 'disponible': return '#2ecc71';
      case 'activo': return '#f39c12';
      case 'ocupado': return '#e74c3c';
      default: return '#95a5a6';
    }
  }

  /**
   * Navega al detalle de un usuario específico
   */
  verDetalleUsuario(usuario: MetricasUsuario): void {
    console.log('Ver detalle del usuario:', usuario.nombreCompleto);
    // TODO: Implementar navegación al detalle del usuario
  }

  /**
   * Obtiene la eficiencia de derivación basada en el tiempo
   * @param tiempoDerivacion - Tiempo promedio de derivación en días
   * @returns Porcentaje de eficiencia (0-100)
   */
  obtenerEficienciaDerivacion(tiempoDerivacion: number): number {
    // Lógica: <= 1 día = 100%, 1-2 días = 75%, 2-3 días = 50%, >3 días = 25%
    if (tiempoDerivacion <= 1) return 100;
    if (tiempoDerivacion <= 2) return 75;
    if (tiempoDerivacion <= 3) return 50;
    return 25;
  }

  /**
   * Obtiene el color para la eficiencia de derivación
   * @param tiempoDerivacion - Tiempo promedio de derivación en días
   * @returns Color CSS
   */
  obtenerColorEficienciaDerivacion(tiempoDerivacion: number): string {
    if (tiempoDerivacion <= 1) return '#2ecc71';    // Verde - Excelente
    if (tiempoDerivacion <= 2) return '#f39c12';    // Naranja - Bueno
    if (tiempoDerivacion <= 3) return '#e67e22';    // Naranja oscuro - Regular
    return '#e74c3c';                               // Rojo - Malo
  }

  /**
   * Obtiene el color según el porcentaje
   * @param porcentaje - Porcentaje a evaluar
   * @returns Color CSS
   */
  obtenerColorPorcentaje(porcentaje: number): string {
    if (porcentaje >= 60) return '#e74c3c';      // Rojo - Muy alto
    if (porcentaje >= 40) return '#f39c12';      // Naranja - Alto
    if (porcentaje >= 20) return '#f1c40f';      // Amarillo - Medio
    return '#2ecc71';                            // Verde - Bajo
  }

  /**
   * Obtiene el total de derivaciones de todos los departamentos
   * @returns Total de derivaciones
   */
  obtenerTotalDerivaciones(): number {
    return this.derivacionesPorDepartamento.reduce((sum, dept) => sum + dept.totalDerivados, 0);
  }

  /**
   * Obtiene el tiempo promedio global de derivación
   * @returns Tiempo promedio global en días
   */
  obtenerTiempoPromedioGlobal(): number {
    if (this.derivacionesPorDepartamento.length === 0) return 0;
    
    const totalTiempo = this.derivacionesPorDepartamento.reduce((sum, dept) => {
      return sum + (dept.tiempoPromedioDerivacion * dept.totalDerivados);
    }, 0);
    
    const totalDerivaciones = this.obtenerTotalDerivaciones();
    return totalDerivaciones > 0 ? totalTiempo / totalDerivaciones : 0;
  }

  /**
   * Obtiene el departamento más eficiente en derivaciones
   * @returns Nombre del departamento más eficiente
   */
  obtenerDepartamentoMasEficiente(): string {
    if (this.derivacionesPorDepartamento.length === 0) return 'N/A';
    
    const masEficiente = this.derivacionesPorDepartamento.reduce((min, dept) => 
      dept.tiempoPromedioDerivacion < min.tiempoPromedioDerivacion ? dept : min
    );
    
    return masEficiente.departamento;
  }

  /**
   * Obtiene el departamento menos eficiente en derivaciones
   * @returns Nombre del departamento menos eficiente
   */
  obtenerDepartamentoMenosEficiente(): string {
    if (this.derivacionesPorDepartamento.length === 0) return 'N/A';
    
    const menosEficiente = this.derivacionesPorDepartamento.reduce((max, dept) => 
      dept.tiempoPromedioDerivacion > max.tiempoPromedioDerivacion ? dept : max
    );
    
    return menosEficiente.departamento;
  }

  /**
   * Exporta los datos del dashboard
   */
  exportarDatos(): void {
    console.log('Exportando datos del dashboard...');
    // TODO: Implementar exportación de datos
  }
}