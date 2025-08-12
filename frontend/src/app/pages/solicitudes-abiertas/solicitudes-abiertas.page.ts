import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule, ToastController, LoadingController, RefresherCustomEvent } from '@ionic/angular';
import { HeaderComponent } from '../../components/header/header.component';

//Interface para representar un ticket del sistema
interface Ticket {
  id_ticket: number;
  numero_ticket?: string;
  asunto: string;
  descripcion: string;
  id_solicitante: number;
  id_departamento: number;
  id_prioridad: number;
  id_estado: number;
  fecha_creacion: Date;
  fecha_vencimiento: Date;
}

//Interface para estados disponibles
interface Estado {
  id: number;
  nombre: string;
  color: string;
}

//Interface para prioridades disponibles
interface Prioridad {
  id: number;
  nombre: string;
  color: string;
}

//Interface para departamentos disponibles

interface Departamento {
  id: number;
  nombre: string;
}

/**
 * Componente para gestionar las solicitudes abiertas del responsable
 * Muestra todas las solicitudes pendientes por resolver dentro de los SLA
 */
@Component({
  selector: 'app-solicitudes-abiertas',
  templateUrl: './solicitudes-abiertas.page.html',
  styleUrls: ['./solicitudes-abiertas.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, HeaderComponent]
})
export class SolicitudesAbiertasPage implements OnInit {

  // Propiedades de datos
  tickets: Ticket[] = [];
  ticketsFiltrados: Ticket[] = [];
  
  // Propiedades de estado
  cargando = false;
  
  // Propiedades de filtros
  terminoBusqueda = '';
  filtroEstado = '';
  filtroPrioridad = '';
  filtroDepartamento = '';
  filtroFecha = '';
  
  // Catálogos de datos
  estados: Estado[] = [
    { id: 1, nombre: 'Nuevo', color: 'primary' },
    { id: 2, nombre: 'En Proceso', color: 'warning' },
    { id: 3, nombre: 'Pendiente', color: 'danger' },
    { id: 4, nombre: 'Escalado', color: 'secondary' }
  ];
  
  prioridades: Prioridad[] = [
    { id: 1, nombre: 'Baja', color: 'success' },
    { id: 2, nombre: 'Media', color: 'warning' },
    { id: 3, nombre: 'Alta', color: 'danger' }
  ];
  
  departamentos: Departamento[] = [
    { id: 1, nombre: 'Tecnologías de la Información' },
    { id: 2, nombre: 'Recursos Humanos' },
    { id: 3, nombre: 'Administración' },
    { id: 4, nombre: 'Operaciones' }
  ];

  /**
   * Opciones para filtro de fecha
   */
  opcionesFecha = [
    { valor: 'hoy', nombre: 'Hoy' },
    { valor: 'semana', nombre: 'Esta semana' },
    { valor: 'mes', nombre: 'Este mes' },
    { valor: 'vencidas', nombre: 'Vencidas' }
  ];

  /**
   * Constructor del componente
   */
  constructor(
    private router: Router,
    private toastController: ToastController,
    private loadingController: LoadingController
  ) { }

  /**
   * Inicialización del componente
   */
  ngOnInit() {
    console.log('Iniciando SolicitudesAbiertasPage...');
    this.cargarSolicitudes();
  }

  /**
   * Carga las solicitudes abiertas desde el backend
   */
  async cargarSolicitudes(): Promise<void> {
    this.cargando = true;
    
    const loading = await this.loadingController.create({
      message: 'Cargando solicitudes abiertas...',
      duration: 2000
    });
    await loading.present();

    try {
      // TODO: Integrar con el backend real      
      await loading.dismiss();
      this.cargando = false;
      console.log('Solicitudes cargadas exitosamente');
    } catch (error) {
      console.error('Error al cargar solicitudes:', error);
      await loading.dismiss();
      this.cargando = false;
      await this.mostrarToast('Error al cargar las solicitudes', 'danger');
    }
  }

  /**
   * Aplica todos los filtros activos a la lista de tickets
   */
  aplicarFiltros(): void {
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

      // Filtro por fecha
      const coincideFecha = this.verificarFiltroFecha(ticket);

      return coincideBusqueda && coincideEstado && coincidePrioridad && 
             coincideDepartamento && coincideFecha;
    });

    console.log(`Filtros aplicados: ${this.ticketsFiltrados.length} de ${this.tickets.length} tickets`);
  }

  /**
   * Verifica si un ticket cumple con el filtro de fecha seleccionado
   */
  private verificarFiltroFecha(ticket: Ticket): boolean {
    if (!this.filtroFecha) return true;

    const ahora = new Date();
    const fechaCreacion = ticket.fecha_creacion;
    const fechaVencimiento = ticket.fecha_vencimiento;

    switch (this.filtroFecha) {
      case 'hoy':
        return fechaCreacion.toDateString() === ahora.toDateString();
      case 'semana':
        const inicioSemana = new Date(ahora);
        inicioSemana.setDate(ahora.getDate() - ahora.getDay());
        return fechaCreacion >= inicioSemana;
      case 'mes':
        return fechaCreacion.getMonth() === ahora.getMonth() && 
               fechaCreacion.getFullYear() === ahora.getFullYear();
      case 'vencidas':
        return fechaVencimiento < ahora;
      default:
        return true;
    }
  }

  /**
   * Limpia todos los filtros aplicados
   */
  limpiarFiltros(): void {
    console.log('Limpiando filtros...');
    this.terminoBusqueda = '';
    this.filtroEstado = '';
    this.filtroPrioridad = '';
    this.filtroDepartamento = '';
    this.filtroFecha = '';
    this.aplicarFiltros();
  }

  // ===============================
  // MÉTODOS DE NAVEGACIÓN
  // ===============================

  /**
   * Navega al dashboard del responsable
   */
  irAResponsableHome(): void {
    console.log('Navegando al dashboard del responsable...');
    this.router.navigate(['/responsable-home']);
  }

  /**
   * Navega a solicitudes cerradas
   */
  irASolicitudesCerradas(): void {
    console.log('Navegando a solicitudes cerradas...');
    this.router.navigate(['/solicitudes-cerradas']);
  }

  /**
   * Navega a solicitudes pendientes
   */
  irASolicitudesPendientes(): void {
    console.log('Navegando a solicitudes pendientes...');
    this.router.navigate(['/solicitudes-pendientes']);
  }

  /**
   * Navega a métricas detalladas
   */
  irAMetricas(): void {
    console.log('Navegando a métricas...');
    this.router.navigate(['/metricas']);
  }

  /**
   * Muestra los detalles de un ticket específico
   */
  verDetalles(ticket: Ticket): void {
    console.log('Ver detalles del ticket:', ticket.id_ticket);
    this.mostrarToast('Funcionalidad de detalles próximamente disponible', 'primary');
  }

  /**
   * Toma la responsabilidad de un ticket
   */
  tomarTicket(ticket: Ticket): void {
    console.log('Tomar responsabilidad del ticket:', ticket.id_ticket);
    this.mostrarToast('Ticket asignado correctamente', 'success');
    // TODO: Implementar lógica de asignación
  }

  /**
   * Escala un ticket a un nivel superior
   */
  escalarTicket(ticket: Ticket): void {
    console.log('Escalar ticket:', ticket.id_ticket);
    this.mostrarToast('Ticket escalado correctamente', 'warning');
    // TODO: Implementar lógica de escalamiento
  }

  /**
   * Exporta un reporte de las solicitudes abiertas
   */
  exportarReporte(): void {
    console.log('Exportar reporte de solicitudes abiertas');
    this.mostrarToast('Funcionalidad de exportación próximamente disponible', 'secondary');
  }
  /**
   * Obtiene el nombre del estado por su ID
   */
  obtenerNombreEstado(idEstado: number): string {
    const estado = this.estados.find(e => e.id === idEstado);
    return estado ? estado.nombre : 'Desconocido';
  }

  /**
   * Obtiene el color del estado por su ID
   */
  obtenerColorEstado(idEstado: number): string {
    const estado = this.estados.find(e => e.id === idEstado);
    return estado ? estado.color : 'medium';
  }

  /**
   * Obtiene el nombre de la prioridad por su ID
   */
  obtenerNombrePrioridad(idPrioridad: number): string {
    const prioridad = this.prioridades.find(p => p.id === idPrioridad);
    return prioridad ? prioridad.nombre : 'Desconocido';
  }

  /**
   * Obtiene el color de la prioridad por su ID
   */
  obtenerColorPrioridad(idPrioridad: number): string {
    const prioridad = this.prioridades.find(p => p.id === idPrioridad);
    return prioridad ? prioridad.color : 'medium';
  }

  /**
   * Obtiene el nombre del departamento por su ID
   */
  obtenerNombreDepartamento(idDepartamento: number): string {
    const departamento = this.departamentos.find(d => d.id === idDepartamento);
    return departamento ? departamento.nombre : 'Desconocido';
  }

  /**
   * Verifica si un ticket está vencido
   */
  estaVencido(ticket: Ticket): boolean {
    return ticket.fecha_vencimiento < new Date();
  }

  /**
   * Obtiene la cantidad de tickets vencidos
   */
  get cantidadTicketsVencidos(): number {
    return this.ticketsFiltrados.filter(ticket => this.estaVencido(ticket)).length;
  }

  /**
   * Verifica si hay tickets vencidos en la lista filtrada
   */
  get hayTicketsVencidos(): boolean {
    return this.cantidadTicketsVencidos > 0;
  }

  /**
   * Calcula los días restantes hasta el vencimiento
   */
  diasRestantes(ticket: Ticket): number {
    const ahora = new Date();
    const vencimiento = ticket.fecha_vencimiento;
    const diferencia = vencimiento.getTime() - ahora.getTime();
    return Math.ceil(diferencia / (1000 * 3600 * 24));
  }
  
 //Obtiene la cantidad de tickets de alta priorida
  obtenerTicketsAltaPrioridad(): number {
    return this.ticketsFiltrados.filter(ticket => ticket.id_prioridad === 3).length;
  }

   //Refresca los datos cuando el usuario desliza hacia abajo
  async refrescar(event: RefresherCustomEvent): Promise<void> {
    console.log('Refrescando solicitudes abiertas...');
    
    try {
      await this.cargarSolicitudes();
      console.log('Solicitudes refrescadas exitosamente');
    } catch (error) {
      console.error('Error al refrescar solicitudes:', error);
    } finally {
      event.target.complete();
    }
  }
   //Muestra un mensaje toast al usuario  
  private async mostrarToast(message: string, color: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'top'
    });
    await toast.present();
  }
  trackByTicketId(index: number, ticket: Ticket): number {
  return ticket.id_ticket;
  }
}