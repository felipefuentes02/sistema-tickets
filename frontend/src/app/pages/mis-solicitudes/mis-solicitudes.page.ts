import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule, LoadingController, AlertController, ToastController } from '@ionic/angular';
import { HeaderComponent } from '../../components/header/header.component';
import { TicketsService } from '../../services/tickets.service';
import { Ticket } from '../../interfaces/ticket.interface';

@Component({
  selector: 'app-mis-solicitudes',
  templateUrl: './mis-solicitudes.page.html',
  styleUrls: ['./mis-solicitudes.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, HeaderComponent]
})
export class MisSolicitudesPage implements OnInit {

  tickets: Ticket[] = [];
  ticketsFiltrados: Ticket[] = [];
  cargando = false;
  terminoBusqueda = '';

  // Filtros
  filtroEstado = '';
  filtroPrioridad = '';

  // Estados y prioridades para los filtros (datos estáticos por ahora)
  estados = [
    { id: 1, nombre: 'Nuevo' },
    { id: 2, nombre: 'En Proceso' },
    { id: 3, nombre: 'Pendiente Validación' },
    { id: 4, nombre: 'Resuelto' },
    { id: 5, nombre: 'Cerrado' }
  ];

  prioridades = [
    { id: 1, nombre: 'Baja' },
    { id: 2, nombre: 'Media' },
    { id: 3, nombre: 'Alta' }
  ];

  constructor(
    private ticketsService: TicketsService,
    private router: Router,
    private loadingController: LoadingController,
    private alertController: AlertController,
    private toastController: ToastController
  ) { }

  ngOnInit() {
    this.cargarMisTickets();
  }

  async cargarMisTickets() {
    this.cargando = true;
    const loading = await this.loadingController.create({
      message: 'Cargando solicitudes...'
    });
    await loading.present();

    this.ticketsService.obtenerMisTickets().subscribe({
      next: (tickets) => {
        this.tickets = tickets;
        this.aplicarFiltros();
        this.cargando = false;
        loading.dismiss();
      },
      error: (error) => {
        this.cargando = false;
        loading.dismiss();
        console.error('Error al cargar tickets:', error);
        this.mostrarAlerta('Error', 'No se pudieron cargar las solicitudes');
      }
    });
  }

  // Filtrar tickets por búsqueda y filtros
  aplicarFiltros() {
    this.ticketsFiltrados = this.tickets.filter(ticket => {
      // Filtro por término de búsqueda
      const coincideBusqueda = !this.terminoBusqueda || 
        ticket.asunto.toLowerCase().includes(this.terminoBusqueda.toLowerCase()) ||
        ticket.numero_ticket?.toLowerCase().includes(this.terminoBusqueda.toLowerCase());

      // Filtro por estado
      const coincideEstado = !this.filtroEstado || 
        ticket.id_estado?.toString() === this.filtroEstado;

      // Filtro por prioridad
      const coincidePrioridad = !this.filtroPrioridad || 
        ticket.id_prioridad?.toString() === this.filtroPrioridad;

      return coincideBusqueda && coincideEstado && coincidePrioridad;
    });
  }

  // Buscar tickets
  buscarTickets(event: any) {
    this.terminoBusqueda = event.target.value;
    this.aplicarFiltros();
  }

  // Cambiar filtro de estado
  cambiarFiltroEstado(event: any) {
    this.filtroEstado = event.detail.value;
    this.aplicarFiltros();
  }

  // Cambiar filtro de prioridad
  cambiarFiltroPrioridad(event: any) {
    this.filtroPrioridad = event.detail.value;
    this.aplicarFiltros();
  }

  // Limpiar filtros
  limpiarFiltros() {
    this.terminoBusqueda = '';
    this.filtroEstado = '';
    this.filtroPrioridad = '';
    this.aplicarFiltros();
  }

  // Ver detalles del ticket
  verDetalles(ticket: Ticket) {
    // TODO: Navegar a página de detalles del ticket
    console.log('Ver detalles del ticket:', ticket.id_ticket);
    // this.router.navigate(['/ticket-detalle', ticket.id_ticket]);
  }

  // Obtener nombre del estado
  obtenerNombreEstado(idEstado: number): string {
    const estado = this.estados.find(e => e.id === idEstado);
    return estado ? estado.nombre : 'Desconocido';
  }

  // Obtener nombre de prioridad
  obtenerNombrePrioridad(idPrioridad: number): string {
    const prioridad = this.prioridades.find(p => p.id === idPrioridad);
    return prioridad ? prioridad.nombre : 'Desconocido';
  }

  // Obtener color de la prioridad
  obtenerColorPrioridad(idPrioridad: number): string {
    switch(idPrioridad) {
      case 1: return 'success'; // Baja - Verde
      case 2: return 'warning'; // Media - Amarillo
      case 3: return 'danger';  // Alta - Rojo
      default: return 'medium';
    }
  }

  // Método para tracking de la lista (mejora performance)
  tracqueoPorTicketId(index: number, ticket: Ticket): number {
    return ticket.id_ticket || index;
  }

  // Obtener color del estado
  obtenerColorEstado(idEstado: number): string {
    switch(idEstado) {
      case 1: return 'primary'; // Nuevo
      case 2: return 'warning'; // En Proceso
      case 3: return 'tertiary'; // Pendiente Validación
      case 4: return 'success'; // Resuelto
      case 5: return 'medium';  // Cerrado
      default: return 'medium';
    }
  }

  // Navegar a crear nuevo ticket
  crearNuevoTicket() {
    this.router.navigate(['/ingresar-solicitud']);
  }

  // Refrescar lista
  async refrescar(event: any) {
    await this.cargarMisTickets();
    event.target.complete();
  }

  private async mostrarAlerta(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
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