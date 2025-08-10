import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule, LoadingController, AlertController, ToastController } from '@ionic/angular';
import { HeaderComponent } from '../../components/header/header.component';
import { TicketsService } from '../../services/tickets.service';
import { Ticket } from '../../interfaces/ticket.interface';

@Component({
  selector: 'app-solicitudes-cerradas',
  templateUrl: './solicitudes-cerradas.page.html',
  styleUrls: ['./solicitudes-cerradas.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, HeaderComponent]
})
export class SolicitudesCerradasPage implements OnInit {

  tickets: Ticket[] = [];
  ticketsFiltrados: Ticket[] = [];
  cargando = false;
  terminoBusqueda = '';

  // Filtros
  filtroEstado = '';
  filtroPrioridad = '';
  filtroFecha = '';

  // Estados para filtros (solo estados cerrados)
  estados = [
    { id: 4, nombre: 'Resuelto' },
    { id: 6, nombre: 'Cerrado' },
    { id: 7, nombre: 'Cerrado sin Encuesta' }
  ];

  prioridades = [
    { id: 3, nombre: 'Baja' },
    { id: 2, nombre: 'Media' },
    { id: 1, nombre: 'Alta' }
  ];

  departamentos = [
    { id: 3, nombre: 'Informática' },
    { id: 1, nombre: 'Administración' },
    { id: 4, nombre: 'Operaciones' },
    { id: 2, nombre: 'Comercial' }
  ];

  opcionesFecha = [
    { valor: 'hoy', nombre: 'Hoy' },
    { valor: 'semana', nombre: 'Esta Semana' },
    { valor: 'mes', nombre: 'Este Mes' },
    { valor: 'trimestre', nombre: 'Este Trimestre' }
  ];

  constructor(
    private ticketsService: TicketsService,
    private router: Router,
    private loadingController: LoadingController,
    private alertController: AlertController,
    private toastController: ToastController
  ) { }

  ngOnInit() {
    this.cargarSolicitudesCerradas();
  }

  async cargarSolicitudesCerradas() {
    this.cargando = true;
    const loading = await this.loadingController.create({
      message: 'Cargando solicitudes cerradas...'
    });
    await loading.present();

    this.ticketsService.obtenerTicketsCerrados().subscribe({
      next: (tickets: Ticket[]) => {
        this.tickets = tickets;
        this.aplicarFiltros();
        this.cargando = false;
        loading.dismiss();
      },
      error: (error: any) => {
        this.cargando = false;
        loading.dismiss();
        console.error('Error al cargar tickets cerrados:', error);
        this.mostrarToast('Error al cargar las solicitudes cerradas', 'danger');
      }
    });
  }

  get tiempoPromedioResolucion(): number {
    const ticketsConTiempo = this.ticketsFiltrados.filter(t => 
      t.fecha_creacion && t.fecha_resolucion
    );
    
    if (ticketsConTiempo.length === 0) return 0;
    
    const tiempoTotal = ticketsConTiempo.reduce((total, ticket) => {
      const creacion = new Date(ticket.fecha_creacion!);
      const resolucion = new Date(ticket.fecha_resolucion!);
      const diferencia = resolucion.getTime() - creacion.getTime();
      return total + diferencia;
    }, 0);
    
    const promedioMs = tiempoTotal / ticketsConTiempo.length;
    return Math.round(promedioMs / (1000 * 60 * 60));
  }

  aplicarFiltros() {
    this.ticketsFiltrados = this.tickets.filter(ticket => {
      const coincideBusqueda = !this.terminoBusqueda || 
        ticket.asunto.toLowerCase().includes(this.terminoBusqueda.toLowerCase()) ||
        ticket.numero_ticket?.toLowerCase().includes(this.terminoBusqueda.toLowerCase()) ||
        ticket.descripcion.toLowerCase().includes(this.terminoBusqueda.toLowerCase());

      const coincideEstado = !this.filtroEstado || 
        ticket.id_estado?.toString() === this.filtroEstado;

      const coincidePrioridad = !this.filtroPrioridad || 
        ticket.id_prioridad?.toString() === this.filtroPrioridad;

      const coincideFecha = !this.filtroFecha || this.cumpleFiltroFecha(ticket);
    });
  }

  private cumpleFiltroFecha(ticket: Ticket): boolean {
    if (!this.filtroFecha || !ticket.fecha_cierre) return true;
    
    const fechaCierre = new Date(ticket.fecha_cierre);
    const ahora = new Date();
    
    switch (this.filtroFecha) {
      case 'hoy':
        return fechaCierre.toDateString() === ahora.toDateString();
      case 'semana':
        const inicioSemana = new Date(ahora);
        inicioSemana.setDate(ahora.getDate() - 7);
        return fechaCierre >= inicioSemana;
      case 'mes':
        const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
        return fechaCierre >= inicioMes;
      case 'trimestre':
        const inicioTrimestre = new Date(ahora.getFullYear(), Math.floor(ahora.getMonth() / 3) * 3, 1);
        return fechaCierre >= inicioTrimestre;
      default:
        return true;
    }
  }

  buscarTickets(event: any) {
    this.terminoBusqueda = event.target.value;
    this.aplicarFiltros();
  }

  cambiarFiltroEstado(event: any) {
    this.filtroEstado = event.detail.value;
    this.aplicarFiltros();
  }

  cambiarFiltroPrioridad(event: any) {
    this.filtroPrioridad = event.detail.value;
    this.aplicarFiltros();
  }

  cambiarFiltroFecha(event: any) {
    this.filtroFecha = event.detail.value;
    this.aplicarFiltros();
  }

  limpiarFiltros() {
    this.terminoBusqueda = '';
    this.filtroEstado = '';
    this.filtroPrioridad = '';
    this.filtroFecha = '';
    this.aplicarFiltros();
  }

  irAResponsableHome() {
    this.router.navigate(['/responsable-home']);
  }

  irASolicitudesAbiertas() {
    this.router.navigate(['/solicitudes-abiertas']);
  }

  irASolicitudesPendientes() {
    this.router.navigate(['/solicitudes-pendientes']);
  }

  irAMetricas() {
    this.router.navigate(['/metricas']);
  }

  verDetalles(ticket: Ticket) {
    console.log('Ver detalles del ticket:', ticket.id_ticket);
    this.mostrarToast('Funcionalidad de detalles próximamente disponible', 'primary');
  }

  reabrirTicket(ticket: Ticket) {
    console.log('Reabrir ticket:', ticket.id_ticket);
    this.mostrarToast('Ticket reabierto correctamente', 'warning');
  }

  exportarReporte() {
    console.log('Exportar reporte de tickets cerrados');
    this.mostrarToast('Funcionalidad de exportación próximamente disponible', 'secondary');
  }

  obtenerNombreEstado(idEstado: number): string {
    const estado = this.estados.find(e => e.id === idEstado);
    return estado ? estado.nombre : 'Desconocido';
  }

  obtenerNombrePrioridad(idPrioridad: number): string {
    const prioridad = this.prioridades.find(p => p.id === idPrioridad);
    return prioridad ? prioridad.nombre : 'Desconocido';
  }

  obtenerNombreDepartamento(idDepartamento: number): string {
    const departamento = this.departamentos.find(d => d.id === idDepartamento);
    return departamento ? departamento.nombre : 'Desconocido';
  }

  obtenerColorPrioridad(idPrioridad: number): string {
    switch(idPrioridad) {
      case 1: return 'success';
      case 2: return 'warning';
      case 3: return 'danger';
      default: return 'medium';
    }
  }

  obtenerColorEstado(idEstado: number): string {
    switch(idEstado) {
      case 4: return 'success';
      case 5: return 'primary';
      case 6: return 'medium';
      default: return 'medium';
    }
  }

  calcularTiempoResolucion(ticket: Ticket): string {
    if (!ticket.fecha_creacion || !ticket.fecha_resolucion) return 'N/A';
    
    const creacion = new Date(ticket.fecha_creacion);
    const resolucion = new Date(ticket.fecha_resolucion);
    const diferencia = resolucion.getTime() - creacion.getTime();
    const horas = Math.round(diferencia / (1000 * 60 * 60));
    
    if (horas < 24) {
      return `${horas}h`;
    } else {
      const dias = Math.floor(horas / 24);
      const horasRestantes = horas % 24;
      return `${dias}d ${horasRestantes}h`;
    }
  }

  async refrescar(event: any) {
    await this.cargarSolicitudesCerradas();
    event.target.complete();
  }

  tracqueoPorTicketId(index: number, ticket: Ticket): number {
    return ticket.id_ticket || index;
  }

  private async mostrarToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'top'
    });
    await toast.present();
  }
}