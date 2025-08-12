import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule, LoadingController, RefresherCustomEvent } from '@ionic/angular';
import { HeaderComponent } from '../../components/header/header.component';
import { AuthService } from '../../services/auth.service';

/**
 * Interface para el resumen del responsable
 */
interface ResumenResponsable {
  abiertas: number;
  cerradas: number;
  pendientes: number;
  vencidas: number;
  tiempoPromedio: number;
  satisfaccionPromedio: number;
}
//Interface para métricas del departamento
 
interface MetricasDepartamento {
  total_tickets: number;
  tickets_abiertos: number;
  tickets_cerrados: number;
  tickets_vencidos: number;
  tiempo_promedio_resolucion: number;
  satisfaccion_promedio: number;
}

/**
 * Interface para tickets por estado
 */
interface TicketsPorEstado {
  estado: string;
  cantidad: number;
  color: string;
}

/**
 * Interface para tickets por prioridad
 */
interface TicketsPorPrioridad {
  prioridad: string;
  cantidad: number;
  color: string;
}

/**
 * Interface para tendencia semanal
 */
interface TendenciaSemanal {
  dia: string;
  creados: number;
  resueltos: number;
}

/**
 * Componente de página principal para el responsable de respuesta
 * Muestra métricas y dashboard del departamento
 */
@Component({
  selector: 'app-responsable-home',
  templateUrl: './responsable-home.page.html',
  styleUrls: ['./responsable-home.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, HeaderComponent]
})
export class ResponsableHomePage implements OnInit {

  // Propiedades del usuario y estado de carga
  usuario: any = null;
  cargando = false;
  fechaActual = new Date();
  
  /**
   * Datos del resumen general
   */
  resumen: ResumenResponsable = {
    abiertas: 0,
    cerradas: 0,
    pendientes: 0,
    vencidas: 0,
    tiempoPromedio: 0,
    satisfaccionPromedio: 0
  };
  
  /**
   * Métricas principales del departamento
   */
  metricasPrincipales: MetricasDepartamento = {
    total_tickets: 0,
    tickets_abiertos: 0,
    tickets_cerrados: 0,
    tickets_vencidos: 0,
    tiempo_promedio_resolucion: 0,
    satisfaccion_promedio: 0
  };

  /**
   * Datos para gráficos y visualizaciones
   */
  ticketsPorEstado: TicketsPorEstado[] = [];
  ticketsPorPrioridad: TicketsPorPrioridad[] = [];
  tendenciaSemanal: TendenciaSemanal[] = [];

  /**
   * Constructor del componente
   * @param authService - Servicio de autenticación
   * @param router - Router para navegación
   * @param loadingController - Controlador de loading de Ionic
   */
  constructor(
    private authService: AuthService,
    private router: Router,
    private loadingController: LoadingController
  ) { }

  /**
   * Método de inicialización del componente
   * Se ejecuta al cargar la página
   */
  ngOnInit() {
    console.log('Iniciando ResponsableHomePage...');
    this.usuario = this.authService.getCurrentUser();
    this.cargarDatosResumen();
  }

  /**
   * Carga los datos del resumen y métricas
   * Muestra un loading mientras carga los datos
   */
  async cargarDatosResumen(): Promise<void> {
    this.cargando = true;
    this.fechaActual = new Date();
    
    const loading = await this.loadingController.create({
      message: 'Cargando métricas del departamento...',
      duration: 2000
    });
    await loading.present();

    try {
      console.log('Cargando datos del resumen...');
      // TODO: Integrar con el backend real
      await loading.dismiss();
      this.cargando = false;
      console.log('Datos cargados exitosamente');
    } catch (error) {
      console.error('Error al cargar métricas:', error);
      await loading.dismiss();
      this.cargando = false;
    }
  }

    /**
   * Navega a la página de solicitudes abiertas
   */
  irASolicitudesAbiertas(): void {
    console.log('Navegando a solicitudes abiertas...');
    this.router.navigate(['/solicitudes-abiertas']);
  }

  /**
   * Navega a la página de solicitudes cerradas
   */
  irASolicitudesCerradas(): void {
    console.log('Navegando a solicitudes cerradas...');
    this.router.navigate(['/solicitudes-cerradas']);
  }

   //Navega a la página de solicitudes pendientes
  irASolicitudesPendientes(): void {
    console.log('Navegando a solicitudes pendientes...');
    this.router.navigate(['solicitudes-pendientes']);
  }

   //Navega a la página de métricas detalladas
  irAMetricas(): void {
    console.log('Navegando a métricas detalladas...');
     this.router.navigate(['metricas']);
  }
  /**
   * Calcula el porcentaje de tickets completados
   * @returns Porcentaje de tickets cerrados sobre el total
   */
  obtenerPorcentajeCompletado(): number {
    const total = this.metricasPrincipales.total_tickets;
    const cerrados = this.metricasPrincipales.tickets_cerrados;
    return total > 0 ? Math.round((cerrados / total) * 100) : 0;
  }

  /**
   * Calcula el porcentaje de tickets vencidos
   * @returns Porcentaje de tickets vencidos sobre el total
   */
  obtenerPorcentajeVencidos(): number {
    const total = this.metricasPrincipales.total_tickets;
    const vencidos = this.metricasPrincipales.tickets_vencidos;
    return total > 0 ? Math.round((vencidos / total) * 100) : 0;
  }

  /**
   * Obtiene el color indicativo según el nivel de satisfacción
   * @returns Color Ionic (success, warning, danger)
   */
  obtenerColorSatisfaccion(): string {
    const satisfaccion = this.metricasPrincipales.satisfaccion_promedio;
    if (satisfaccion >= 4.0) return 'success';
    if (satisfaccion >= 3.0) return 'warning';
    return 'danger';
  }

  /**
   * Obtiene el nombre completo del usuario actual
   * @returns Nombre y apellido del usuario o texto por defecto
   */
  obtenerNombreUsuario(): string {
    if (this.usuario) {
      const nombre = this.usuario.primer_nombre || this.usuario.nombre || '';
      const apellido = this.usuario.primer_apellido || this.usuario.apellido || '';
      return `${nombre} ${apellido}`.trim() || 'Responsable';
    }
    return 'Responsable';
  }

  /**
   * Obtiene el departamento del usuario actual
   * @returns Nombre del departamento o texto por defecto
   */
  obtenerDepartamento(): string {
    return this.usuario?.departamento || 'Departamento de TI';
  }

  /**
   * Refresca los datos cuando el usuario desliza hacia abajo
   * @param event - Evento del refresher de Ionic
   */
  async refrescar(event: RefresherCustomEvent): Promise<void> {
    console.log('Refrescando datos...');
    this.fechaActual = new Date();
    
    try {
      await this.cargarDatosResumen();
      console.log('Datos refrescados exitosamente');
    } catch (error) {
      console.error('Error al refrescar datos:', error);
    } finally {
      event.target.complete();
    }
  }

  /**
   * Verifica si hay datos cargados
   * @returns true si hay datos disponibles
   */
  hayDatosDisponibles(): boolean {
    return this.ticketsPorEstado.length > 0;
  }

  /**
   * Obtiene el total de tickets en el sistema
   * @returns Número total de tickets
   */
  obtenerTotalTickets(): number {
    return this.metricasPrincipales.total_tickets;
  }
}