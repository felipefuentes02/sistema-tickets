import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule, LoadingController, AlertController, ToastController } from '@ionic/angular';
import { HeaderComponent } from '../../components/header/header.component';
import { TicketsService } from '../../services/tickets.service';
import { Ticket } from '../../interfaces/ticket.interface';

@Component({
  selector: 'app-solicitudes-abiertas',
  templateUrl: './solicitudes-abiertas.page.html',
  styleUrls: ['./solicitudes-abiertas.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, HeaderComponent]
})
export class SolicitudesAbiertasPage implements OnInit {

  tickets: Ticket[] = [];
  ticketsFiltrados: Ticket[] = [];
  cargando = false;
  terminoBusqueda = '';

  // Filtros
  filtroEstado = '';
  filtroPrioridad = '';
  filtroDepartamento = '';

  // Estados para filtros (solo estados abiertos)
  estados = [
    { id: 1, nombre: 'Nuevo' },
    { id: 2, nombre: 'En Proceso' },
    { id: 3, nombre: 'Pendiente Validación' }
  ];

  prioridades = [
    { id: 1, nombre: 'Alta' },
    { id: 2, nombre: 'Media' },    
    { id: 3, nombre: 'Baja' },
  ];

  departamentos = [
    { id: 1, nombre: 'Administración' },
    { id: 2, nombre: 'Comercial' },
    { id: 3, nombre: 'Informática' }, 
    { id: 4, nombre: 'Operaciones' }    
  ];

  constructor(
    private ticketsService: TicketsService,
    private router: Router,
    private loadingController: LoadingController,
    private alertController: AlertController,
    private toastController: ToastController
  ) { }

  ngOnInit() {
    this.cargarSolicitudesAbiertas();
  }

  async cargarSolicitudesAbiertas() {
    this.cargando = true;
    const loading = await this.loadingController.create({
      message: 'Cargando solicitudes abiertas...'
    });
    await loading.present();

    this.ticketsService.obtenerTicketsAbiertos().subscribe({
      next: (tickets: Ticket[]) => { // <-- Agregar tipo explícito
        this.tickets = tickets;
        this.aplicarFiltros();
        this.cargando = false;
        loading.dismiss();
      },
      error: (error: any) => { // <-- Agregar tipo explícito
        this.cargando = false;
        loading.dismiss();
        console.error('Error al cargar tickets abiertos:', error);
        // Cargar datos de ejemplo si no hay backend implementado
        this.cargarDatosEjemplo();
      }
    });
  }

get cantidadTicketsVencidos(): number {
  return this.ticketsFiltrados.filter(t => this.estaVencido(t)).length;
}

// Getter para verificar si hay tickets vencidos
get hayTicketsVencidos(): boolean {
  return this.ticketsFiltrados.some(t => this.estaVencido(t));
}

  // Método temporal con datos de ejemplo
  private cargarDatosEjemplo() {
    this.tickets = [
      {
        id_ticket: 1,
        numero_ticket: 'TK202508001',
        asunto: 'Problema con conexión de red',
        descripcion: 'La conexión a internet se corta constantemente en el área de desarrollo',
        id_solicitante: 5,
        id_departamento: 1,
        id_prioridad: 3,
        id_estado: 1,
        fecha_creacion: new Date('2025-08-09T09:30:00'),
        fecha_vencimiento: new Date('2025-08-09T17:30:00')
      },
      {
        id_ticket: 2,
        numero_ticket: 'TK202508002',
        asunto: 'Solicitud de nuevo software',
        descripcion: 'Necesitamos instalar el software de diseño Adobe Creative Suite en 3 equipos',
        id_solicitante: 3,
        id_departamento: 1,
        id_prioridad: 2,
        id_estado: 2,
        fecha_creacion: new Date('2025-08-09T10:15:00'),
        fecha_vencimiento: new Date('2025-08-12T17:00:00')
      },
      {
        id_ticket: 3,
        numero_ticket: 'TK202508003',
        asunto: 'Error en sistema de facturación',
        descripcion: 'El sistema de facturación no permite generar reportes del mes anterior',
        id_solicitante: 7,
        id_departamento: 2,
        id_prioridad: 3,
        id_estado: 3,
        fecha_creacion: new Date('2025-08-08T14:20:00'),
        fecha_vencimiento: new Date('2025-08-09T14:20:00')
      },
      {
        id_ticket: 4,
        numero_ticket: 'TK202508004',
        asunto: 'Configuración de correo corporativo',
        descripcion: 'El nuevo empleado necesita configuración de su cuenta de correo corporativo',
        id_solicitante: 4,
        id_departamento: 1,
        id_prioridad: 1,
        id_estado: 1,
        fecha_creacion: new Date('2025-08-09T11:45:00'),
        fecha_vencimiento: new Date('2025-08-11T17:00:00')
      },
      {
        id_ticket: 5,
        numero_ticket: 'TK202508005',
        asunto: 'Mantenimiento servidor de archivos',
        descripcion: 'El servidor de archivos está presentando lentitud y necesita mantenimiento preventivo',
        id_solicitante: 6,
        id_departamento: 1,
        id_prioridad: 2,
        id_estado: 2,
        fecha_creacion: new Date('2025-08-08T16:30:00'),
        fecha_vencimiento: new Date('2025-08-10T16:30:00')
      },
      {
        id_ticket: 6,
        numero_ticket: 'TK202508006',
        asunto: 'Problema con impresora láser',
        descripcion: 'La impresora láser del piso 2 no está imprimiendo y muestra error de tóner',
        id_solicitante: 8,
        id_departamento: 3,
        id_prioridad: 1,
        id_estado: 1,
        fecha_creacion: new Date('2025-08-09T13:15:00'),
        fecha_vencimiento: new Date('2025-08-12T17:00:00')
      }
    ];
    this.aplicarFiltros();
    this.cargando = false;
  }

  // Filtrar tickets por búsqueda y filtros
  aplicarFiltros() {
    this.ticketsFiltrados = this.tickets.filter(ticket => {
      // Filtro por término de búsqueda
      const coincideBusqueda = !this.terminoBusqueda || 
        ticket.asunto.toLowerCase().includes(this.terminoBusqueda.toLowerCase()) ||
        ticket.numero_ticket?.toLowerCase().includes(this.terminoBusqueda.toLowerCase()) ||
        ticket.descripcion.toLowerCase().includes(this.terminoBusqueda.toLowerCase());

      // Filtro por estado
      const coincideEstado = !this.filtroEstado || 
        ticket.id_estado?.toString() === this.filtroEstado;

      // Filtro por prioridad
      const coincidePrioridad = !this.filtroPrioridad || 
        ticket.id_prioridad?.toString() === this.filtroPrioridad;

      // Filtro por departamento
      const coincideDepartamento = !this.filtroDepartamento || 
        ticket.id_departamento?.toString() === this.filtroDepartamento;

      return coincideBusqueda && coincideEstado && coincidePrioridad && coincideDepartamento;
    });
  }

  // Buscar tickets
  buscarTickets(event: any) {
    this.terminoBusqueda = event.target.value;
    this.aplicarFiltros();
  }

  // Cambiar filtros
  cambiarFiltroEstado(event: any) {
    this.filtroEstado = event.detail.value;
    this.aplicarFiltros();
  }

  cambiarFiltroPrioridad(event: any) {
    this.filtroPrioridad = event.detail.value;
    this.aplicarFiltros();
  }

  cambiarFiltroDepartamento(event: any) {
    this.filtroDepartamento = event.detail.value;
    this.aplicarFiltros();
  }

  // Limpiar filtros
  limpiarFiltros() {
    this.terminoBusqueda = '';
    this.filtroEstado = '';
    this.filtroPrioridad = '';
    this.filtroDepartamento = '';
    this.aplicarFiltros();
  }

  // Navegación
  irAResponsableHome() {
    this.router.navigate(['/responsable-home']);
  }

  irASolicitudesCerradas() {
    this.router.navigate(['/solicitudes-cerradas']);
  }

  irASolicitudesPendientes() {
    this.router.navigate(['/solicitudes-pendientes']);
  }

  irAMetricas() {
    this.router.navigate(['/metricas']);
  }

  // Acciones de tickets
  verDetalles(ticket: Ticket) {
    console.log('Ver detalles del ticket:', ticket.id_ticket);
    this.mostrarToast('Funcionalidad de detalles próximamente disponible', 'info');
  }

  tomarTicket(ticket: Ticket) {
    console.log('Tomar ticket:', ticket.id_ticket);
    this.mostrarToast('Ticket tomado correctamente', 'success');
  }

  derivarTicket(ticket: Ticket) {
    console.log('Derivar ticket:', ticket.id_ticket);
    this.mostrarToast('Funcionalidad de derivación próximamente disponible', 'info');
  }

  // Métodos de utilidad
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
      case 1: return 'success'; // Baja - Verde
      case 2: return 'warning'; // Media - Amarillo
      case 3: return 'danger';  // Alta - Rojo
      default: return 'medium';
    }
  }

  obtenerColorEstado(idEstado: number): string {
    switch(idEstado) {
      case 1: return 'primary'; // Nuevo
      case 2: return 'warning'; // En Proceso
      case 3: return 'tertiary'; // Pendiente Validación
      default: return 'medium';
    }
  }

  // Verificar si está vencido
  estaVencido(ticket: Ticket): boolean {
    if (!ticket.fecha_vencimiento) return false;
    return new Date() > new Date(ticket.fecha_vencimiento);
  }

  // Refrescar lista
  async refrescar(event: any) {
    await this.cargarSolicitudesAbiertas();
    event.target.complete();
  }

  // Método para tracking de la lista
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
