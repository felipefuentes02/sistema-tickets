import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule, LoadingController, RefresherCustomEvent } from '@ionic/angular';
import { HeaderComponent } from '../../components/header/header.component';
import { AuthService } from '../../services/auth.service';
import { ResumenResponsable, MetricasDepartamento, TicketsPorEstado, TicketsPorPrioridad, TendenciaSemanal } from '../../interfaces/metricas.interface';

@Component({
  selector: 'app-responsable-home',
  templateUrl: './responsable-home.page.html',
  styleUrls: ['./responsable-home.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, HeaderComponent]
})
export class ResponsableHomePage implements OnInit {

  usuario: any = null;
  cargando = false;
  fechaActual = new Date();
  
  // Datos del resumen
  resumen: ResumenResponsable = {
  abiertas: 0,
  cerradas: 0,     // <-- Agregar esta línea
  pendientes: 0,
  vencidas: 0,
  tiempoPromedio: 0,
  satisfaccionPromedio: 0
};
  
  // Datos para gráficos (temporales - luego vendrán del backend)
  metricasPrincipales: MetricasDepartamento = {
    total_tickets: 0,
    tickets_abiertos: 0,
    tickets_cerrados: 0,
    tickets_vencidos: 0,
    tiempo_promedio_resolucion: 0,
    satisfaccion_promedio: 0
  };

  ticketsPorEstado: TicketsPorEstado[] = [];
  ticketsPorPrioridad: TicketsPorPrioridad[] = [];
  tendenciaSemanal: TendenciaSemanal[] = [];

  constructor(
    private authService: AuthService,
    private router: Router,
    private loadingController: LoadingController
  ) { }

  ngOnInit() {
    this.usuario = this.authService.getCurrentUser();
    this.cargarDatosResumen();
  }

  async cargarDatosResumen() {
    this.cargando = true;
    this.fechaActual = new Date();
    
    const loading = await this.loadingController.create({
      message: 'Cargando métricas...',
      duration: 1000
    });
    await loading.present();

    try {
      // TODO: Integrar con el backend
      // Por ahora cargamos datos de ejemplo
      await this.cargarDatosEjemplo();
      
      loading.dismiss();
      this.cargando = false;
    } catch (error) {
      loading.dismiss();
      this.cargando = false;
      console.error('Error al cargar métricas:', error);
    }
  }

    private cargarDatosEjemplo() {
    // Simular datos de resumen
    this.resumen = {
      abiertas: 8,
      cerradas: 24,    // <-- Agregar esta línea
      pendientes: 3,
      vencidas: 2,
      tiempoPromedio: 4.2,
      satisfaccionPromedio: 4.1
    };

        // Tickets por estado
        this.ticketsPorEstado = [
          { estado: 'Nuevo', cantidad: 5, color: '#3880ff' },
          { estado: 'En Proceso', cantidad: 7, color: '#ffce00' },
          { estado: 'Pendiente', cantidad: 3, color: '#ff6900' },
          { estado: 'Resuelto', cantidad: 25, color: '#2dd36f' },
          { estado: 'Cerrado', cantidad: 10, color: '#92949c' }
        ];

        // Tickets por prioridad
        this.ticketsPorPrioridad = [
          { prioridad: 'Baja', cantidad: 20, color: '#2dd36f' },
          { prioridad: 'Media', cantidad: 18, color: '#ffce00' },
          { prioridad: 'Alta', cantidad: 9, color: '#eb445a' }
        ];

        // Tendencia semanal
        this.tendenciaSemanal = [
          { dia: 'Lun', creados: 8, resueltos: 6 },
          { dia: 'Mar', creados: 12, resueltos: 10 },
          { dia: 'Mié', creados: 6, resueltos: 8 },
          { dia: 'Jue', creados: 9, resueltos: 7 },
          { dia: 'Vie', creados: 5, resueltos: 9 },
          { dia: 'Sáb', creados: 2, resueltos: 4 },
          { dia: 'Dom', creados: 1, resueltos: 2 }
        ];

        resolve();
      }, 1000);
    });
  }

  // Métodos de navegación
  irASolicitudesAbiertas() {
  console.log('Navegando a solicitudes abiertas...');
  this.router.navigate(['/solicitudes-abiertas']);
  }

  irASolicitudesCerradas() {
  console.log('Navegando a solicitudes cerradas...');
  this.router.navigate(['/solicitudes-cerradas']);
}

  irASolicitudesPendientes() {
    console.log('Navegando a solicitudes pendientes...');
    // TODO: this.router.navigate(['/responsable/solicitudes-pendientes']);
  }

  irAMetricas() {
    console.log('Navegando a métricas detalladas...');
    // TODO: this.router.navigate(['/responsable/metricas']);
  }

  // Métodos de utilidad
  obtenerPorcentajeCompletado(): number {
    const total = this.metricasPrincipales.total_tickets;
    const cerrados = this.metricasPrincipales.tickets_cerrados;
    return total > 0 ? Math.round((cerrados / total) * 100) : 0;
  }

  obtenerPorcentajeVencidos(): number {
    const total = this.metricasPrincipales.total_tickets;
    const vencidos = this.metricasPrincipales.tickets_vencidos;
    return total > 0 ? Math.round((vencidos / total) * 100) : 0;
  }

  obtenerColorSatisfaccion(): string {
    const satisfaccion = this.metricasPrincipales.satisfaccion_promedio;
    if (satisfaccion >= 4.0) return 'success';
    if (satisfaccion >= 3.0) return 'warning';
    return 'danger';
  }

  obtenerNombreUsuario(): string {
    return this.usuario ? `${this.usuario.primer_nombre} ${this.usuario.primer_apellido}` : 'Responsable';
  }

  obtenerDepartamento(): string {
    return this.usuario ? this.usuario.departamento || 'Departamento' : 'Departamento';
  }

  // Refrescar datos
  async refrescar(event: RefresherCustomEvent) {
    this.fechaActual = new Date();
    await this.cargarDatosResumen();
    event.target.complete();
  }
}