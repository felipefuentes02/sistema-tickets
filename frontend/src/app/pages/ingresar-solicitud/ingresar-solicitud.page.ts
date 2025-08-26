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
  prioridades: Prioridad[] = [];

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
   * Subscripciones para cleanup
   */
  private subscripciones: Subscription = new Subscription();

  constructor(
    private router: Router,
    private loadingController: LoadingController,
    private alertController: AlertController,
    private toastController: ToastController,
    private ticketsService: TicketsService
  ) { 
    console.log('🎫 IngresarSolicitudPage constructor inicializado');
  }

  /**
   * Inicialización del componente
   * Carga datos maestros desde el backend
   */
  async ngOnInit() {
    console.log('🔄 Inicializando página de ingresar solicitud...');
    
    await this.cargarDatosMaestros();
    this.establecerValoresPorDefecto();
  }

  /**
   * Limpieza al destruir el componente
   */
  ngOnDestroy() {
    console.log('🧹 Limpiando subscripciones...');
    this.subscripciones.unsubscribe();
  }

  /**
   * Cargar departamentos y prioridades desde el backend
   */
  private async cargarDatosMaestros() {
    const loading = await this.loadingController.create({
      message: 'Cargando datos del formulario...',
      spinner: 'dots'
    });
    await loading.present();

    try {
      console.log('📚 Cargando datos maestros desde backend...');

      // Suscribirse a los datos maestros
      const subscripcion = this.ticketsService.obtenerDatosMaestrosFormulario().subscribe({
        next: (datos) => {
          console.log('✅ Datos maestros cargados:', datos);
          
          this.departamentos = datos.departamentos;
          this.prioridades = datos.prioridades;
          this.datosDisponibles = true;
          this.cargandoDatos = false;
          
          loading.dismiss();
        },
        error: (error) => {
          console.error('❌ Error al cargar datos maestros:', error);
          
          this.cargandoDatos = false;
          loading.dismiss();
          
          this.mostrarAlerta(
            'Error de Conexión',
            'No se pudieron cargar los datos del formulario. Se usarán datos por defecto.'
          );

          // Cargar datos de fallback
          this.cargarDatosFallback();
        }
      });

      this.subscripciones.add(subscripcion);

    } catch (error) {
      console.error('❌ Error crítico al cargar datos:', error);
      loading.dismiss();
      this.cargarDatosFallback();
    }
  }

  /**
   * Cargar datos de fallback si el backend no responde
   */
  private cargarDatosFallback() {
    console.log('⚠️ Cargando datos de fallback...');

    this.departamentos = [
      { id_departamento: 1, nombre_departamento: 'Administración' },
      { id_departamento: 2, nombre_departamento: 'Comercial' },
      { id_departamento: 3, nombre_departamento: 'Informática' },
      { id_departamento: 4, nombre_departamento: 'Operaciones' }
    ];

    this.prioridades = [
      { id_prioridad: 1, nombre_prioridad: 'Alta', nivel: 1 },
      { id_prioridad: 2, nombre_prioridad: 'Media', nivel: 2 },
      { id_prioridad: 3, nombre_prioridad: 'Baja', nivel: 3 }
    ];

    this.datosDisponibles = true;
    this.cargandoDatos = false;
  }

  /**
   * Establecer valores por defecto del formulario
   */
  private establecerValoresPorDefecto() {
    // Prioridad Media por defecto
    this.ticket.id_prioridad = 2;
    
    console.log('📝 Valores por defecto establecidos');
  }

  /**
   * Enviar solicitud al backend
   */
  async enviarSolicitud() {
    console.log('📤 Iniciando envío de solicitud...');

    // Validar formulario antes de enviar
    if (!this.validarFormulario()) {
      console.log('❌ Validación fallida, no se envía el formulario');
      return;
    }

    // Prevenir envíos múltiples
    if (this.enviandoSolicitud) {
      console.log('⚠️ Ya se está enviando una solicitud...');
      return;
    }

    this.enviandoSolicitud = true;

    const loading = await this.loadingController.create({
      message: 'Enviando solicitud...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      console.log('🚀 Enviando ticket al backend:', this.ticket);

      // Validar datos con el backend antes de crear
      const validacionSubscripcion = this.ticketsService.validarDatosTicket(
        this.ticket.id_departamento,
        this.ticket.id_prioridad
      ).subscribe({
        next: async (esValido) => {
          if (!esValido) {
            loading.dismiss();
            this.enviandoSolicitud = false;
            this.mostrarAlerta('Datos Inválidos', 'Los datos seleccionados no son válidos.');
            return;
          }

          // Proceder con la creación si los datos son válidos
          const crearSubscripcion = this.ticketsService.crear(this.ticket).subscribe({
            next: (ticketCreado) => {
              loading.dismiss();
              this.enviandoSolicitud = false;
              
              console.log('✅ Ticket creado exitosamente:', ticketCreado);
              
              this.mostrarToast('Solicitud enviada exitosamente', 'success');
              this.limpiarFormulario();
              
              // Redirigir a mis solicitudes después de 1.5 segundos
              setTimeout(() => {
                this.router.navigate(['/mis-solicitudes']);
              }, 1500);
            },
            error: (error) => {
              loading.dismiss();
              this.enviandoSolicitud = false;
              
              console.error('❌ Error al crear ticket:', error);
              
              let mensaje = 'No se pudo enviar la solicitud. Intente nuevamente.';
              
              // Personalizar mensaje según el tipo de error
              if (error.error && error.error.message) {
                mensaje = error.error.message;
              } else if (error.message) {
                mensaje = error.message;
              }
              
              this.mostrarAlerta('Error al Enviar', mensaje);
            }
          });

          this.subscripciones.add(crearSubscripcion);
        },
        error: (error) => {
          loading.dismiss();
          this.enviandoSolicitud = false;
          
          console.error('❌ Error en validación:', error);
          this.mostrarAlerta('Error de Validación', 'No se pudieron validar los datos.');
        }
      });

      this.subscripciones.add(validacionSubscripcion);

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
   */
  private limpiarFormulario() {
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

  // ============ MÉTODOS PARA ARCHIVOS ADJUNTOS (FUTURO) ============

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
   * Obtener color de la prioridad para la UI
   * @param id - ID de la prioridad
   * @returns string - Clase CSS de color
   */
  obtenerColorPrioridad(id: number): string {
    return this.ticketsService.obtenerColorPrioridad(id);
  }

  /**
   * Formatear tamaño de archivo para mostrar
   * @param bytes - Tamaño en bytes
   * @returns string - Tamaño formateado
   */
  formatearTamanoArchivo(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Cancelar y volver atrás
   */
  cancelar() {
    console.log('❌ Usuario canceló la creación de solicitud');
    
    if (this.ticket.asunto || this.ticket.descripcion) {
      // Si hay datos, confirmar antes de cancelar
      this.confirmarCancelacion();
    } else {
      // Si no hay datos, volver directamente
      this.volverAtras();
    }
  }

  /**
   * Confirmar cancelación si hay datos en el formulario
   */
  private async confirmarCancelacion() {
    const alert = await this.alertController.create({
      header: 'Confirmar Cancelación',
      message: '¿Está seguro que desea cancelar? Se perderán los datos ingresados.',
      buttons: [
        {
          text: 'No, Continuar',
          role: 'cancel',
          cssClass: 'secondary'
        },
        {
          text: 'Sí, Cancelar',
          cssClass: 'danger',
          handler: () => {
            this.volverAtras();
          }
        }
      ]
    });

    await alert.present();
  }

  /**
   * Volver a la página anterior
   */
  private volverAtras() {
    console.log('🔙 Volviendo a la página anterior...');
    this.router.navigate(['/cliente-home']);
  }

  /**
   * Limpiar formulario manualmente
   */
  limpiarFormularioManual() {
    console.log('🧹 Limpieza manual del formulario solicitada');
    
    if (this.ticket.asunto || this.ticket.descripcion || this.archivosSeleccionados.length > 0) {
      this.confirmarLimpieza();
    } else {
      this.mostrarToast('El formulario ya está vacío', 'info');
    }
  }

  /**
   * Confirmar limpieza del formulario
   */
  private async confirmarLimpieza() {
    const alert = await this.alertController.create({
      header: 'Limpiar Formulario',
      message: '¿Está seguro que desea limpiar todos los datos ingresados?',
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