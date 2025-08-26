import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule, LoadingController, AlertController, ToastController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { HeaderComponent } from '../../components/header/header.component';
import { CrearTicket, Departamento, Prioridad } from '../../interfaces/ticket.interface';
import { TicketsService } from 'src/app/services/tickets.service';

/**
 * ✅ INTERFACE LOCAL EXTENDIDA PARA PRIORIDAD CON COLOR
 * Extiende la interface original para incluir la propiedad color
 */
interface PrioridadConColor extends Prioridad {
  color?: string;
}

/**
 * Componente para ingresar nuevas solicitudes/tickets
 * Permite a los usuarios crear tickets con validación completa
 */
@Component({
  selector: 'app-ingresar-solicitud',
  templateUrl: './ingresar-solicitud.page.html',
  styleUrls: ['./ingresar-solicitud.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, HeaderComponent]
})
export class IngresarSolicitudPage implements OnInit, OnDestroy {

  /**
   * Datos del ticket a crear
   */
  ticket: CrearTicket = {
    asunto: '',
    descripcion: '',
    id_departamento: 0,
    id_prioridad: 2 // Prioridad Media por defecto
  };

  /**
   * Listas de datos maestros desde el backend
   */
  departamentos: Departamento[] = [];
  prioridades: PrioridadConColor[] = []; // ✅ REPARADO: Usar interface extendida

  /**
   * Estados de la interfaz
   */
  cargandoDatos: boolean = true;
  enviandoSolicitud: boolean = false;
  datosDisponibles: boolean = false;

  /**
   * Archivos adjuntos (funcionalidad futura)
   */
  archivosSeleccionados: File[] = [];
  maxArchivos: number = 4;
  tamanoMaximo: number = 10 * 1024 * 1024; // 10MB por archivo

  /**
   * Validación de formulario
   */
  erroresValidacion: {
    asunto?: string;
    descripcion?: string;
    departamento?: string;
    prioridad?: string;
  } = {};

  /**
   * Control de suscripciones RxJS
   */
  private subscripciones = new Subscription();

  // ============ CONSTRUCTOR E INICIALIZACIÓN ============

  constructor(
    private ticketsService: TicketsService,
    private router: Router,
    private loadingController: LoadingController,
    private alertController: AlertController,
    private toastController: ToastController
  ) {
    console.log('🔧 Componente IngresarSolicitudPage inicializado');
  }

  /**
   * Inicialización del componente al cargar la página
   */
  async ngOnInit() {
    console.log('🚀 Inicializando página Ingresar Solicitud...');
    await this.cargarDatosIniciales();
  }

  /**
   * Limpieza al destruir el componente
   */
  ngOnDestroy() {
    console.log('🧹 Limpiando suscripciones en IngresarSolicitudPage...');
    this.subscripciones.unsubscribe();
  }

  // ============ MÉTODOS DE DATOS ============

  /**
   * Cargar datos iniciales necesarios para el formulario
   * ✅ REPARADO: Ya no usa Promise.allSettled - Compatible con ES2018
   */
  private async cargarDatosIniciales() {
    console.log('📥 Cargando datos iniciales...');
    
    const loading = await this.loadingController.create({
      message: 'Cargando formulario...',
      spinner: 'crescent'
    });
    
    try {
      await loading.present();
      
      // ✅ REPARADO: Usar Promise.all en lugar de Promise.allSettled (compatibilidad ES2018)
      try {
        const [departamentos, prioridades] = await Promise.all([
          this.obtenerDepartamentosSinServicio(),
          this.obtenerPrioridadesSinServicio()
        ]);

        this.departamentos = departamentos;
        this.prioridades = prioridades;
        console.log(`✅ ${this.departamentos.length} departamentos y ${this.prioridades.length} prioridades cargados`);

      } catch (error) {
        console.warn('⚠️ Error cargando datos, usando datos por defecto:', error);
        // Si falla, usar datos por defecto
        this.departamentos = this.obtenerDepartamentosDefecto();
        this.prioridades = this.obtenerPrioridadesDefecto();
      }

      this.datosDisponibles = true;
      console.log('✅ Datos iniciales cargados correctamente');
      
    } catch (error) {
      console.error('❌ Error crítico cargando datos iniciales:', error);
      
      // Usar datos por defecto en caso de error
      this.departamentos = this.obtenerDepartamentosDefecto();
      this.prioridades = this.obtenerPrioridadesDefecto();
      this.datosDisponibles = true;
      
      this.mostrarToast('Error de conexión. Usando datos por defecto.', 'warning', 5000);
      
    } finally {
      this.cargandoDatos = false;
      await loading.dismiss();
    }
  }

  /**
   * ✅ MÉTODO AGREGADO: Obtener departamentos sin depender de métodos faltantes
   * @returns Promise<Departamento[]> - Departamentos disponibles
   */
  private async obtenerDepartamentosSinServicio(): Promise<Departamento[]> {
    try {
      // Por ahora usar datos estáticos hasta que el servicio esté completo
      return this.obtenerDepartamentosDefecto();
    } catch (error) {
      console.error('Error obteniendo departamentos:', error);
      return this.obtenerDepartamentosDefecto();
    }
  }

  /**
   * ✅ MÉTODO AGREGADO: Obtener prioridades sin depender de métodos faltantes
   * @returns Promise<PrioridadConColor[]> - Prioridades disponibles con colores
   */
  private async obtenerPrioridadesSinServicio(): Promise<PrioridadConColor[]> {
    try {
      // Por ahora usar datos estáticos hasta que el servicio esté completo
      return this.obtenerPrioridadesDefecto();
    } catch (error) {
      console.error('Error obteniendo prioridades:', error);
      return this.obtenerPrioridadesDefecto();
    }
  }

  /**
   * Obtener departamentos por defecto en caso de error de conexión
   * @returns Departamento[] - Array de departamentos por defecto
   */
  private obtenerDepartamentosDefecto(): Departamento[] {
    return [
      { id_departamento: 1, nombre_departamento: 'Tecnología' },
      { id_departamento: 2, nombre_departamento: 'Recursos Humanos' },
      { id_departamento: 3, nombre_departamento: 'Contabilidad' },
      { id_departamento: 4, nombre_departamento: 'Administración' },
      { id_departamento: 5, nombre_departamento: 'Ventas' }
    ];
  }

  /**
   * ✅ REPARADO: Obtener prioridades por defecto CON COLORES
   * @returns PrioridadConColor[] - Array de prioridades por defecto con colores
   */
  private obtenerPrioridadesDefecto(): PrioridadConColor[] {
    return [
      { 
        id_prioridad: 1, 
        nombre_prioridad: 'Baja', 
        nivel: 3,
        color: '#28a745' // Verde
      },
      { 
        id_prioridad: 2, 
        nombre_prioridad: 'Media', 
        nivel: 2,
        color: '#ffc107' // Amarillo
      },
      { 
        id_prioridad: 3, 
        nombre_prioridad: 'Alta', 
        nivel: 1,
        color: '#fd7e14' // Naranja
      },
      { 
        id_prioridad: 4, 
        nombre_prioridad: 'Crítica', 
        nivel: 0,
        color: '#dc3545' // Rojo
      }
    ];
  }

  // ============ MÉTODOS DE FORMULARIO ============

  /**
   * ✅ REPARADO: Método agregado que el HTML está buscando
   * Manejar envío del formulario (alias para onSubmit)
   */
  enviarSolicitud() {
    console.log('📤 enviarSolicitud() llamado desde HTML');
    // Crear evento sintético y llamar al método principal
    const eventoSintetico = new Event('submit');
    this.onSubmit(eventoSintetico);
  }

  /**
   * Manejar envío del formulario
   * @param event - Evento del formulario
   */
  async onSubmit(event: Event) {
    event.preventDefault();
    console.log('📤 Enviando formulario...');

    // Validar antes de enviar
    if (!this.validarFormulario()) {
      console.log('❌ Formulario inválido, no se puede enviar');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Creando solicitud...',
      spinner: 'crescent'
    });

    try {
      this.enviandoSolicitud = true;
      await loading.present();

      console.log('📋 Datos del ticket a enviar:', this.ticket);

      // Usar método que SÍ existe - 'crear' en lugar de 'crearTicket'
      const envioSubscripcion = this.ticketsService.crear(this.ticket).subscribe({
        next: (respuesta: any) => {
          loading.dismiss();
          this.enviandoSolicitud = false;
          
          console.log('✅ Ticket creado exitosamente:', respuesta);
          
          this.mostrarToast('¡Solicitud creada exitosamente!', 'success');
          this.limpiarFormulario();
          
          // Redirigir a mis tickets después de un breve delay
          setTimeout(() => {
            this.router.navigate(['/mis-tickets']);
          }, 1500);
        },
        error: (error: any) => {
          loading.dismiss();
          this.enviandoSolicitud = false;
          
          console.error('❌ Error al crear ticket:', error);
          
          let mensajeError = 'Error desconocido al crear la solicitud';
          
          if (error.error?.message) {
            mensajeError = error.error.message;
          } else if (error.message) {
            mensajeError = error.message;
          }
          
          this.mostrarAlerta('Error al Crear Solicitud', mensajeError);
        }
      });

      this.subscripciones.add(envioSubscripcion);

    } catch (error) {
      loading.dismiss();
      this.enviandoSolicitud = false;
      
      console.error('❌ Error crítico al enviar solicitud:', error);
      this.mostrarAlerta('Error Crítico', 'Error inesperado al procesar la solicitud.');
    }
  }

  /**
   * Validar formulario antes de enviar
   * @returns boolean - True si el formulario es válido
   */
  private validarFormulario(): boolean {
    console.log('🔍 Validando formulario...');
    
    // Limpiar errores previos
    this.erroresValidacion = {};
    let esValido = true;

    // Validar asunto
    if (!this.ticket.asunto || this.ticket.asunto.trim().length === 0) {
      this.erroresValidacion.asunto = 'El asunto es obligatorio';
      esValido = false;
    } else if (this.ticket.asunto.trim().length < 5) {
      this.erroresValidacion.asunto = 'El asunto debe tener al menos 5 caracteres';
      esValido = false;
    } else if (this.ticket.asunto.trim().length > 150) {
      this.erroresValidacion.asunto = 'El asunto no puede exceder 150 caracteres';
      esValido = false;
    }

    // Validar descripción
    if (!this.ticket.descripcion || this.ticket.descripcion.trim().length === 0) {
      this.erroresValidacion.descripcion = 'La descripción es obligatoria';
      esValido = false;
    } else if (this.ticket.descripcion.trim().length < 10) {
      this.erroresValidacion.descripcion = 'La descripción debe tener al menos 10 caracteres';
      esValido = false;
    } else if (this.ticket.descripcion.trim().length > 2000) {
      this.erroresValidacion.descripcion = 'La descripción no puede exceder 2000 caracteres';
      esValido = false;
    }

    // Validar departamento
    if (!this.ticket.id_departamento || this.ticket.id_departamento === 0) {
      this.erroresValidacion.departamento = 'Debe seleccionar un departamento';
      esValido = false;
    }

    // Validar prioridad
    if (!this.ticket.id_prioridad || this.ticket.id_prioridad === 0) {
      this.erroresValidacion.prioridad = 'Debe seleccionar una prioridad';
      esValido = false;
    }

    // Mostrar errores si los hay
    if (!esValido) {
      console.log('❌ Errores de validación encontrados:', this.erroresValidacion);
      this.mostrarErroresValidacion();
    } else {
      console.log('✅ Formulario válido');
    }

    return esValido;
  }

  /**
   * Mostrar errores de validación al usuario
   */
  private mostrarErroresValidacion() {
    const errores = Object.values(this.erroresValidacion).filter(error => error);
    if (errores.length > 0) {
      const mensaje = errores.join('\n');
      this.mostrarAlerta('Errores en el Formulario', mensaje);
    }
  }

  /**
   * Limpiar formulario después de envío exitoso
   * ✅ REPARADO: público para acceso desde template
   */
  public limpiarFormulario() {
    console.log('🧹 Limpiando formulario...');
    
    this.ticket = {
      asunto: '',
      descripcion: '',
      id_departamento: 0,
      id_prioridad: 2 // Mantener prioridad Media por defecto
    };
    
    this.archivosSeleccionados = [];
    this.erroresValidacion = {};
    
    console.log('✅ Formulario limpiado');
  }

  /**
   * Confirmación antes de limpiar formulario
   */
  async confirmarLimpiarFormulario() {
    const alert = await this.alertController.create({
      header: 'Confirmar Acción',
      message: '¿Está seguro que desea limpiar todo el formulario? Se perderán todos los datos ingresados.',
      cssClass: 'custom-alert',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'secondary'
        },
        {
          text: 'Sí, Limpiar',
          cssClass: 'primary',
          handler: () => {
            this.limpiarFormulario();
            this.mostrarToast('Formulario limpiado', 'success');
          }
        }
      ]
    });

    await alert.present();
  }

  // ============ MÉTODOS DE EVENTOS ============

  /**
   * Manejar cambio en el select de departamento
   * @param event - Evento del ion-select
   */
  onDepartamentoChange(event: any) {
    const idDepartamento = event.detail.value;
    console.log(`📁 Departamento seleccionado: ${idDepartamento}`);
    
    this.ticket.id_departamento = idDepartamento;
    
    // Limpiar error de validación si había
    if (this.erroresValidacion.departamento) {
      delete this.erroresValidacion.departamento;
    }
  }

  /**
   * Manejar cambio en el select de prioridad
   * @param event - Evento del ion-select
   */
  onPrioridadChange(event: any) {
    const idPrioridad = event.detail.value;
    console.log(`⚡ Prioridad seleccionada: ${idPrioridad}`);
    
    this.ticket.id_prioridad = idPrioridad;
    
    // Limpiar error de validación si había
    if (this.erroresValidacion.prioridad) {
      delete this.erroresValidacion.prioridad;
    }
  }

  /**
   * Manejar cambios en el campo asunto
   */
  onAsuntoChange() {
    // Limpiar espacios y validar longitud
    this.ticket.asunto = this.ticket.asunto.trim();
    
    // Limpiar error de validación si había
    if (this.erroresValidacion.asunto && this.ticket.asunto.length >= 5) {
      delete this.erroresValidacion.asunto;
    }
  }

  /**
   * Manejar cambios en el campo descripción
   */
  onDescripcionChange() {
    // Limpiar espacios y validar longitud
    this.ticket.descripcion = this.ticket.descripcion.trim();
    
    // Limpiar error de validación si había
    if (this.erroresValidacion.descripcion && this.ticket.descripcion.length >= 10) {
      delete this.erroresValidacion.descripcion;
    }
  }

  // ============ MÉTODOS PARA ARCHIVOS ADJUNTOS ============

  /**
   * ✅ REPARADO: Método agregado para solucionar error onFileSelected
   * Manejar selección de archivos (alias para onArchivosSeleccionados)
   * @param event - Evento del input file
   */
  onFileSelected(event: any) {
    console.log('📎 Método onFileSelected llamado');
    // Delegar al método principal para evitar duplicación de código
    this.onArchivosSeleccionados(event);
  }

  /**
   * Manejar selección de archivos
   * @param event - Evento del input file
   */
  onArchivosSeleccionados(event: any) {
    const archivos = Array.from(event.target.files) as File[];
    
    console.log(`📎 ${archivos.length} archivos seleccionados`);

    // Validar cantidad de archivos
    if (this.archivosSeleccionados.length + archivos.length > this.maxArchivos) {
      this.mostrarToast(
        `Solo se pueden adjuntar máximo ${this.maxArchivos} archivos`,
        'warning'
      );
      return;
    }

    // Validar tamaño de cada archivo
    for (const archivo of archivos) {
      if (archivo.size > this.tamanoMaximo) {
        this.mostrarToast(
          `El archivo "${archivo.name}" excede el tamaño máximo de 10MB`,
          'warning'
        );
        return;
      }
    }

    // Agregar archivos válidos
    this.archivosSeleccionados.push(...archivos);
    console.log(`✅ Total archivos adjuntos: ${this.archivosSeleccionados.length}`);
  }

  /**
   * Eliminar archivo adjunto
   * @param index - Índice del archivo a eliminar
   */
  eliminarArchivo(index: number) {
    if (index >= 0 && index < this.archivosSeleccionados.length) {
      const archivo = this.archivosSeleccionados[index];
      this.archivosSeleccionados.splice(index, 1);
      
      console.log(`🗑️ Archivo "${archivo.name}" eliminado`);
      this.mostrarToast('Archivo eliminado', 'info');
    }
  }

  // ============ MÉTODOS DE UTILIDAD ============

  /**
   * Obtener nombre del departamento por ID
   * @param id - ID del departamento
   * @returns string - Nombre del departamento
   */
  obtenerNombreDepartamento(id: number): string {
    const departamento = this.departamentos.find(d => d.id_departamento === id);
    return departamento ? departamento.nombre_departamento : 'Desconocido';
  }

  /**
   * Obtener nombre de la prioridad por ID
   * @param id - ID de la prioridad
   * @returns string - Nombre de la prioridad
   */
  obtenerNombrePrioridad(id: number): string {
    const prioridad = this.prioridades.find(p => p.id_prioridad === id);
    return prioridad ? prioridad.nombre_prioridad : 'Desconocida';
  }

  /**
   * ✅ REPARADO: Obtener color de prioridad por ID
   * @param id - ID de la prioridad
   * @returns string - Color de la prioridad
   */
  obtenerColorPrioridad(id: number): string {
    const prioridad = this.prioridades.find(p => p.id_prioridad === id);
    return prioridad?.color || '#6c757d'; // Color gris por defecto
  }

  // ============ MÉTODOS DE NOTIFICACIONES ============

  /**
   * Mostrar alerta al usuario
   * @param titulo - Título de la alerta
   * @param mensaje - Mensaje de la alerta
   * @param cssClass - Clase CSS adicional (opcional)
   */
  private async mostrarAlerta(titulo: string, mensaje: string, cssClass?: string) {
    const alert = await this.alertController.create({
      header: titulo,
      message: mensaje,
      cssClass: cssClass,
      buttons: ['Entendido']
    });

    await alert.present();
  }

  /**
   * Mostrar toast notification
   * @param message - Mensaje del toast
   * @param color - Color del toast (success, warning, danger, info)
   * @param duration - Duración en ms (por defecto 3000)
   */
  private async mostrarToast(message: string, color: string, duration: number = 3000) {
    const toast = await this.toastController.create({
      message,
      duration,
      color,
      position: 'top',
      buttons: [
        {
          text: '✕',
          role: 'cancel'
        }
      ]
    });
    
    await toast.present();
  }

  // ============ GETTERS PARA LA TEMPLATE ============

  /**
   * Verificar si el formulario está listo para usar
   */
  get formularioListo(): boolean {
    return this.datosDisponibles && !this.cargandoDatos;
  }

  /**
   * Verificar si se puede enviar el formulario
   */
  get puedeEnviar(): boolean {
    return this.formularioListo && 
           !this.enviandoSolicitud && 
           this.ticket.asunto.trim().length >= 5 &&
           this.ticket.descripcion.trim().length >= 10 &&
           this.ticket.id_departamento > 0 &&
           this.ticket.id_prioridad > 0;
  }

  /**
   * Obtener conteo de caracteres para asunto
   */
  get conteoCaracteresAsunto(): string {
    const actual = this.ticket.asunto ? this.ticket.asunto.length : 0;
    return `${actual}/150`;
  }

  /**
   * Obtener conteo de caracteres para descripción
   */
  get conteoCaracteresDescripcion(): string {
    const actual = this.ticket.descripcion ? this.ticket.descripcion.length : 0;
    return `${actual}/2000`;
  }

  /**
   * Verificar si hay errores de validación
   */
  get tieneErrores(): boolean {
    return Object.keys(this.erroresValidacion).length > 0;
  }

  /**
   * Obtener mensaje de estado del formulario
   */
  get mensajeEstado(): string {
    if (this.cargandoDatos) {
      return 'Cargando datos del formulario...';
    } else if (!this.datosDisponibles) {
      return 'Error al cargar datos. Usando datos por defecto.';
    } else if (this.enviandoSolicitud) {
      return 'Enviando solicitud...';
    } else {
      return 'Formulario listo para completar';
    }
  }
}