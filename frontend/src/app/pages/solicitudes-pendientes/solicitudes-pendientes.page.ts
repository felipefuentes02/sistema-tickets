import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule, LoadingController, ToastController, RefresherCustomEvent } from '@ionic/angular';
import { HeaderComponent } from '../../components/header/header.component';

/**
 * Interface para representar un ticket del sistema
 */
interface Ticket {
  id_ticket: number;
  numero_ticket?: string;
  asunto: string;
  descripcion: string;
  id_solicitante: number;
  nombre_solicitante?: string;
  id_departamento: number;
  id_prioridad: number;
  id_estado: number;
  fecha_creacion: Date;
  fecha_vencimiento: Date;
}

/**
 * Interface para estados disponibles
 */
interface Estado {
  id: number;
  nombre: string;
  color: string;
}

/**
 * Interface para prioridades disponibles
 */
interface Prioridad {
  id: number;
  nombre: string;
  color: string;
}

/**
 * Interface para departamentos disponibles
 */
interface Departamento {
  id: number;
  nombre: string;
}

/**
 * Componente para gestionar las solicitudes pendientes (vencidas)
 * Muestra todos los tickets que ya vencieron el plazo de respuesta
 */
@Component({
  selector: 'app-solicitudes-pendientes',
  templateUrl: './solicitudes-pendientes.page.html',
  styleUrls: ['./solicitudes-pendientes.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, HeaderComponent]
})
export class SolicitudesPendientesPage implements OnInit {

  // Propiedades de datos
  tickets: Ticket[] = [];
  ticketsFiltrados: Ticket[] = [];
  
  // Propiedades de estado
  cargando = false;
  
  // Propiedades de filtros
  terminoBusqueda = '';
  filtroEstado = '';
  filtroPrioridad = '';
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
    { valor: 'hoy', nombre: 'Vencidas hoy' },
    { valor: 'semana', nombre: 'Vencidas esta semana' },
    { valor: 'mes', nombre: 'Vencidas este mes' },
    { valor: 'todas', nombre: 'Todas las vencidas' }
  ];

  /**
   * Constructor del componente
   */
  constructor(
    private router: Router,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) { }

  /**
   * Inicialización del componente
   */
  ngOnInit() {
    console.log('Iniciando SolicitudesPendientesPage...');
    this.cargarSolicitudesPendientes();
  }

  /**
   * Carga las solicitudes pendientes (vencidas) desde el backend
   */
  async cargarSolicitudesPendientes(): Promise<void> {
    this.cargando = true;
    
    const loading = await this.loadingController.create({
      message: 'Cargando solicitudes vencidas...',
      duration: 2000
    });
    await loading.present();

    try {
      // TODO: Integrar con el backend real
      await this.cargarDatosEjemplo();
      
      await loading.dismiss();
      this.cargando = false;
      console.log('Solicitudes pendientes cargadas exitosamente');
    } catch (error) {
      console.error('Error al cargar solicitudes pendientes:', error);
      await loading.dismiss();
      this.cargando = false;
      await this.mostrarToast('Error al cargar las solicitudes pendientes', 'danger');
    }
  }

  /**
   * Carga datos de ejemplo - solo tickets vencidos
   */
  private async cargarDatosEjemplo(): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Solo tickets que ya vencieron el plazo de respuesta
        this.tickets = [
          {
            id_ticket: 1,
            numero_ticket: 'TK202508001',
            asunto: 'Sistema de correo no funciona',
            descripcion: 'El servidor de correo presenta fallas intermitentes que afectan la comunicación',
            id_solicitante: 1,
            nombre_solicitante: 'María González',
            id_departamento: 1,
            id_prioridad: 3,
            id_estado: 3,
            fecha_creacion: new Date('2025-08-05T08:30:00'),
            fecha_vencimiento: new Date('2025-08-07T17:00:00') // Ya vencido
          },
          {
            id_ticket: 2,
            numero_ticket: 'TK202508002',
            asunto: 'Backup automático fallando',
            descripcion: 'El sistema de backup automático no se ejecuta desde hace 5 días',
            id_solicitante: 2,
            nombre_solicitante: 'Carlos Pérez',
            id_departamento: 1,
            id_prioridad: 3,
            id_estado: 4,
            fecha_creacion: new Date('2025-08-04T10:15:00'),
            fecha_vencimiento: new Date('2025-08-06T10:15:00') // Ya vencido
          },
          {
            id_ticket: 3,
            numero_ticket: 'TK202508003',
            asunto: 'Acceso a sistema de nóminas',
            descripcion: 'Personal de RRHH no puede acceder al sistema de nóminas',
            id_solicitante: 3,
            nombre_solicitante: 'Ana Rodríguez',
            id_departamento: 2,
            id_prioridad: 2,
            id_estado: 2,
            fecha_creacion: new Date('2025-08-06T09:00:00'),
            fecha_vencimiento: new Date('2025-08-08T17:00:00') // Ya vencido
          },
          {
            id_ticket: 4,
            numero_ticket: 'TK202508004',
            asunto: 'Servidor de base de datos lento',
            descripcion: 'La base de datos principal presenta lentitud extrema en consultas',
            id_solicitante: 4,
            nombre_solicitante: 'Luis Martínez',
            id_departamento: 1,
            id_prioridad: 3,
            id_estado: 1,
            fecha_creacion: new Date('2025-08-03T14:30:00'),
            fecha_vencimiento: new Date('2025-08-05T14:30:00') // Ya vencido
          },
          {
            id_ticket: 5,
            numero_ticket: 'TK202508005',
            asunto: 'Impresora central no responde',
            descripcion: 'La impresora principal de administración no imprime documentos',
            id_solicitante: 5,
            nombre_solicitante: 'Patricia Silva',
            id_departamento: 3,
            id_prioridad: 1,
            id_estado: 1,
            fecha_creacion: new Date('2025-08-07T11:00:00'),
            fecha_vencimiento: new Date('2025-08-09T17:00:00') // Ya vencido
          }
        ];
        
        this.aplicarFiltros();
        console.log(`${this.tickets.length} solicitudes pendientes (vencidas) cargadas`);
        resolve();
      }, 1000);
    });
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
        ticket.descripcion.toLowerCase().includes(this.terminoBusqueda.toLowerCase()) ||
        ticket.nombre_solicitante?.toLowerCase().includes(this.terminoBusqueda.toLowerCase());

      // Filtro por estado
      const coincideEstado = !this.filtroEstado || 
        ticket.id_estado?.toString() === this.filtroEstado;

      // Filtro por prioridad
      const coincidePrioridad = !this.filtroPrioridad || 
        ticket.id_prioridad?.toString() === this.filtroPrioridad;

      // Filtro por fecha de vencimiento
      const coincideFecha = this.verificarFiltroFecha(ticket);

      return coincideBusqueda && coincideEstado && coincidePrioridad && coincideFecha;
    });

    console.log(`Filtros aplicados: ${this.ticketsFiltrados.length} de ${this.tickets.length} tickets pendientes`);
  }

  /**
   * Verifica si un ticket cumple con el filtro de fecha seleccionado
   */
  private verificarFiltroFecha(ticket: Ticket): boolean {
    if (!this.filtroFecha || this.filtroFecha === 'todas') return true;

    const ahora = new Date();
    const fechaVencimiento = ticket.fecha_vencimiento;

    switch (this.filtroFecha) {
      case 'hoy':
        return fechaVencimiento.toDateString() === ahora.toDateString();
      case 'semana':
        const inicioSemana = new Date(ahora);
        inicioSemana.setDate(ahora.getDate() - ahora.getDay());
        return fechaVencimiento >= inicioSemana && fechaVencimiento <= ahora;
      case 'mes':
        return fechaVencimiento.getMonth() === ahora.getMonth() && 
               fechaVencimiento.getFullYear() === ahora.getFullYear() &&
               fechaVencimiento <= ahora;
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
    this.filtroFecha = '';
    this.aplicarFiltros();
  }

  // ===============================
  // MÉTODOS DE NAVEGACIÓN
  // ===============================

  irAResponsableHome(): void {
    this.router.navigate(['/responsable-home']);
  }

  irASolicitudesAbiertas(): void {
    this.router.navigate(['/solicitudes-abiertas']);
  }

  irASolicitudesCerradas(): void {
    this.router.navigate(['/solicitudes-cerradas']);
  }

  irAMetricas(): void {
    this.router.navigate(['/metricas']);
  }

  // ===============================
  // MÉTODOS DE ACCIONES
  // ===============================

  verDetalles(ticket: Ticket): void {
    console.log('Ver detalles del ticket vencido:', ticket.id_ticket);
    this.mostrarToast('Funcionalidad de detalles próximamente disponible', 'primary');
  }

  escalarTicket(ticket: Ticket): void {
    console.log('Escalar ticket vencido:', ticket.id_ticket);
    this.mostrarToast('Ticket escalado correctamente', 'warning');
  }

  // ===============================
  // MÉTODOS DE UTILIDAD
  // ===============================

  obtenerNombreEstado(idEstado: number): string {
    const estado = this.estados.find(e => e.id === idEstado);
    return estado ? estado.nombre : 'Desconocido';
  }

  obtenerColorEstado(idEstado: number): string {
    const estado = this.estados.find(e => e.id === idEstado);
    return estado ? estado.color : 'medium';
  }

  obtenerNombrePrioridad(idPrioridad: number): string {
    const prioridad = this.prioridades.find(p => p.id === idPrioridad);
    return prioridad ? prioridad.nombre : 'Desconocido';
  }

  obtenerColorPrioridad(idPrioridad: number): string {
    const prioridad = this.prioridades.find(p => p.id === idPrioridad);
    return prioridad ? prioridad.color : 'medium';
  }

  obtenerNombreDepartamento(idDepartamento: number): string {
    const departamento = this.departamentos.find(d => d.id === idDepartamento);
    return departamento ? departamento.nombre : 'Desconocido';
  }

  /**
   * Calcula cuántos días lleva vencido un ticket
   */
  diasVencido(ticket: Ticket): number {
    const ahora = new Date();
    const vencimiento = ticket.fecha_vencimiento;
    const diferencia = ahora.getTime() - vencimiento.getTime();
    return Math.ceil(diferencia / (1000 * 3600 * 24));
  }

  /**
   * Refresca los datos
   */
  async refrescar(event: RefresherCustomEvent): Promise<void> {
    console.log('Refrescando solicitudes pendientes...');
    
    try {
      await this.cargarSolicitudesPendientes();
    } catch (error) {
      console.error('Error al refrescar:', error);
    } finally {
      event.target.complete();
    }
  }

  /**
   * Muestra un mensaje toast
   */
  private async mostrarToast(message: string, color: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'top'
    });
    await toast.present();
  }
}
