/**
 * Archivo: frontend/src/app/pages/admin-usuarios/admin-usuarios.page.ts
 * Descripción: Página principal para gestión de usuarios del administrador
 * Autor: Sistema de Gestión de Tickets
 * Fecha: 2025
 */

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule, AlertController, LoadingController, ToastController } from '@ionic/angular';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';

import { UsuariosService } from '../../services/usuarios.service';
import { 
  Usuario, 
  Departamento, 
  FiltrosUsuario, 
  RolUsuario 
} from '../../interfaces/admin-usuarios.interface';

/**
 * Componente principal para la gestión de usuarios
 * Permite listar, filtrar, crear, editar y eliminar usuarios
 */
@Component({
  selector: 'app-admin-usuarios',
  templateUrl: './admin-usuarios.page.html',
  styleUrls: ['./admin-usuarios.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
  ]
})
export class AdminUsuariosPage implements OnInit, OnDestroy {

  /** Subject para destruir suscripciones */
  private destroy$ = new Subject<void>();

  /** Lista de usuarios cargados */
  usuarios: Usuario[] = [];

  /** Lista de departamentos para filtros */
  departamentos: Departamento[] = [];

  /** Estado de carga */
  cargando = false;

  /** Formulario de filtros */
  formularioFiltros!: FormGroup;

  /** Filtros activos */
  filtrosActivos: FiltrosUsuario = {};

  /** Vista actual (lista o crear) */
  vistaActual: 'lista' | 'crear' = 'lista';

  /** Enum de roles para el template */
  readonly RolUsuario = RolUsuario;

  /** Opciones de roles para filtros */
  readonly opcionesRol = [
    { valor: RolUsuario.ADMINISTRADOR, etiqueta: 'Administrador' },
    { valor: RolUsuario.RESPONSABLE, etiqueta: 'Responsable' },
    { valor: RolUsuario.USUARIO_INTERNO, etiqueta: 'Usuario Interno' },
    { valor: RolUsuario.USUARIO_EXTERNO, etiqueta: 'Usuario Externo' }
  ];

  /** Configuración de paginación */
  paginacion = {
    paginaActual: 1,
    elementosPorPagina: 10,
    totalElementos: 0,
    totalPaginas: 0
  };

  /**
   * Constructor del componente
   * @param usuariosService Servicio de usuarios
   * @param router Router de Angular
   * @param formBuilder Constructor de formularios
   * @param alertController Controlador de alertas
   * @param loadingController Controlador de loading
   * @param toastController Controlador de toast
   */
  constructor(
    private usuariosService: UsuariosService,
    private router: Router,
    private formBuilder: FormBuilder,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {
    this.inicializarFormularioFiltros();
  }

  /**
   * Inicialización del componente
   */
  ngOnInit(): void {
    this.configurarSuscripciones();
    this.cargarDatos();
  }

  /**
   * Destrucción del componente
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Inicializa el formulario de filtros
   */
  private inicializarFormularioFiltros(): void {
    this.formularioFiltros = this.formBuilder.group({
      busqueda: [''],
      departamento: [''],
      rol: ['']
    });

    // Configurar búsqueda en tiempo real
    this.formularioFiltros.get('busqueda')?.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(valor => {
        this.filtrosActivos.nombre = valor;
        this.aplicarFiltros();
      });
  }

  /**
   * Configura las suscripciones del componente
   */
  private configurarSuscripciones(): void {
    // Usar servicio real
    const servicio = this.usuariosService;
    
    // Suscribirse a cambios en usuarios
    servicio.usuarios$
      .pipe(takeUntil(this.destroy$))
      .subscribe(usuarios => {
        console.log('📊 Usuarios actualizados via observable:', usuarios.length);
        this.usuarios = usuarios;
        this.paginacion.totalElementos = usuarios.length;
        this.calcularPaginacion();
      });

    // Suscribirse a cambios en departamentos
    servicio.departamentos$
      .pipe(takeUntil(this.destroy$))
      .subscribe(departamentos => {
        console.log('🏢 Departamentos actualizados via observable:', departamentos.length);
        this.departamentos = departamentos.filter(d => d.activo);
      });
  }

  /**
   * Carga los datos iniciales
   */
  private async cargarDatos(): Promise<void> {
    await this.mostrarCargando();
    
    try {
      // Cargar usuarios y departamentos en paralelo
      await Promise.all([
        this.cargarUsuarios(),
        this.cargarDepartamentos()
      ]);
      
    } catch (error) {
      console.error('Error al cargar datos:', error);
      await this.mostrarError('Error al cargar los datos iniciales');
    } finally {
      await this.ocultarCargando();
    }
  }

  /**
   * Carga la lista de usuarios
   */
  private async cargarUsuarios(): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log('📥 Cargando usuarios con filtros:', this.filtrosActivos);
      
      // Usar servicio real (comentar línea siguiente para usar mock)
      const servicio = this.usuariosService;
      
      servicio.obtenerUsuarios(this.filtrosActivos)
        .subscribe({
          next: (usuarios) => {
            console.log('✅ Usuarios cargados:', usuarios.length);
            resolve();
          },
          error: (error) => {
            console.error('❌ Error al cargar usuarios:', error);
            reject(error);
          }
        });
    });
  }

  /**
   * Carga la lista de departamentos
   */
  private async cargarDepartamentos(): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log('🏢 Cargando departamentos...');
      
      // Usar servicio real (comentar línea siguiente para usar mock)
      const servicio = this.usuariosService;
      
      servicio.obtenerDepartamentos()
        .subscribe({
          next: (departamentos) => {
            console.log('✅ Departamentos cargados:', departamentos.length);
            resolve();
          },
          error: (error) => {
            console.error('❌ Error al cargar departamentos:', error);
            reject(error);
          }
        });
    });
  }

  /**
   * Cambia la vista actual
   * @param vista Nueva vista a mostrar
   */
  cambiarVista(vista: 'lista' | 'crear'): void {
    this.vistaActual = vista;
  }

  /**
   * Navega a la página de crear usuario
   */
  irACrearUsuario(): void {
    console.log('🚀 Iniciando navegación a crear usuario...');
    console.log('📍 Ruta destino: /admin-usuarios/crear');
    
    this.router.navigate(['/admin-usuarios/crear']).then(success => {
      if (success) {
        console.log('✅ Navegación exitosa a crear usuario');
      } else {
        console.error('❌ Error en navegación a crear usuario');
        console.error('🔍 Verificar que exista la ruta y el componente');
      }
    }).catch(error => {
      console.error('💥 Error crítico en navegación:', error);
    });
  }

  /**
   * Navega a la página de editar usuario
   * @param usuario Usuario a editar
   */
  irAEditarUsuario(usuario: Usuario): void {
    this.router.navigate(['/admin-usuarios/editar', usuario.id]);
  }

  /**
   * Aplica los filtros seleccionados
   */
  aplicarFiltros(): void {
    console.log('🔍 Aplicando filtros...', this.formularioFiltros.value);
    
    const valores = this.formularioFiltros.value;
    
    // Construir objeto de filtros
    this.filtrosActivos = {
      nombre: valores.busqueda || undefined,
      departamento: valores.departamento || undefined,
      rol: valores.rol || undefined,
      pagina: 1, // Resetear a primera página
      limite: this.paginacion.elementosPorPagina
    };

    console.log('🎯 Filtros activos:', this.filtrosActivos);

    // Resetear paginación
    this.paginacion.paginaActual = 1;
    
    // Cargar usuarios con filtros
    this.cargarUsuarios();
  }

  /**
   * Limpia todos los filtros
   */
  limpiarFiltros(): void {
    this.formularioFiltros.reset();
    this.filtrosActivos = {};
    this.paginacion.paginaActual = 1;
    this.cargarUsuarios();
  }

  /**
   * Elimina un usuario del sistema
   * @param usuario Usuario a eliminar
   */
  async eliminarUsuario(usuario: Usuario): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Eliminar Usuario',
      message: `¿Estás seguro de que quieres eliminar al usuario ${usuario.nombre}? Esta acción no se puede deshacer.`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            await this.mostrarCargando();
            
            try {
              await this.usuariosService.eliminarUsuario(usuario.id).toPromise();
              
              await this.mostrarToast('Usuario eliminado correctamente', 'success');
              
            } catch (error) {
              console.error('Error al eliminar usuario:', error);
              await this.mostrarError('Error al eliminar el usuario');
            } finally {
              await this.ocultarCargando();
            }
          }
        }
      ]
    });

    await alert.present();
  }

  /**
   * Cambia de página en la paginación
   * @param pagina Nueva página
   */
  cambiarPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.paginacion.totalPaginas) {
      this.paginacion.paginaActual = pagina;
      this.filtrosActivos.pagina = pagina;
      this.cargarUsuarios();
    }
  }

  /**
   * Obtiene el nombre del departamento
   * @param idDepartamento ID del departamento
   * @returns Nombre del departamento
   */
  obtenerNombreDepartamento(idDepartamento: number): string {
    const departamento = this.departamentos.find(d => d.id === idDepartamento);
    return departamento?.nombre || 'Sin departamento';
  }

  /**
   * Obtiene la etiqueta del rol
   * @param rol Rol del usuario
   * @returns Etiqueta legible del rol
   */
  obtenerEtiquetaRol(rol: RolUsuario): string {
    const opcion = this.opcionesRol.find(o => o.valor === rol);
    return opcion?.etiqueta || rol;
  }

  /**
   * Obtiene la clase CSS para el estado del usuario
   * @returns Clase CSS (todos activos por ahora)
   */
  obtenerClaseEstado(): string {
    return 'badge badge-success'; // Todos los usuarios se muestran como activos
  }

  /**
   * Obtiene el texto del estado del usuario
   * @returns Texto del estado (todos activos por ahora)
   */
  obtenerTextoEstado(): string {
    return 'Activo'; // Todos los usuarios se muestran como activos
  }

  /**
   * Calcula la información de paginación
   */
  private calcularPaginacion(): void {
    this.paginacion.totalPaginas = Math.ceil(
      this.paginacion.totalElementos / this.paginacion.elementosPorPagina
    );
  }

  /**
   * Obtiene los usuarios para la página actual
   * @returns Array de usuarios paginados
   */
  obtenerUsuariosPaginados(): Usuario[] {
    const inicio = (this.paginacion.paginaActual - 1) * this.paginacion.elementosPorPagina;
    const fin = inicio + this.paginacion.elementosPorPagina;
    return this.usuarios.slice(inicio, fin);
  }

  /**
   * Genera array de números para la paginación
   * @returns Array de números de página
   */
  obtenerNumerosPaginas(): number[] {
    const paginas: number[] = [];
    const maxPaginas = 5; // Máximo de páginas a mostrar
    
    let inicio = Math.max(1, this.paginacion.paginaActual - Math.floor(maxPaginas / 2));
    let fin = Math.min(this.paginacion.totalPaginas, inicio + maxPaginas - 1);
    
    // Ajustar el inicio si estamos cerca del final
    if (fin - inicio < maxPaginas - 1) {
      inicio = Math.max(1, fin - maxPaginas + 1);
    }
    
    for (let i = inicio; i <= fin; i++) {
      paginas.push(i);
    }
    
    return paginas;
  }

  /**
   * Refresca la lista de usuarios
   */
  async refrescar(): Promise<void> {
    await this.cargarUsuarios();
    await this.mostrarToast('Lista actualizada', 'success');
  }

  /**
   * Muestra un loading spinner
   */
  private async mostrarCargando(): Promise<void> {
    if (!this.cargando) {
      this.cargando = true;
      const loading = await this.loadingController.create({
        message: 'Cargando...',
        spinner: 'circular'
      });
      await loading.present();
    }
  }

  /**
   * Oculta el loading spinner
   */
  private async ocultarCargando(): Promise<void> {
    if (this.cargando) {
      this.cargando = false;
      await this.loadingController.dismiss();
    }
  }

  /**
   * Obtiene usuarios activos (método auxiliar para estadísticas)
   * @returns Cantidad de usuarios activos (todos por ahora)
   */
  obtenerUsuariosActivos(): number {
    return this.usuarios.length; // Todos los usuarios se consideran activos
  }

  /**
   * Obtiene el número de administradores
   * @returns Cantidad de administradores
   */
  obtenerAdministradores(): number {
    return this.usuarios.filter(usuario => usuario.rol === RolUsuario.ADMINISTRADOR).length;
  }

  /**
   * Obtiene el número de usuarios inactivos
   * @returns Cantidad de usuarios inactivos (0 por ahora)
   */
  obtenerUsuariosInactivos(): number {
    return 0; // Sin campo activo, asumimos que no hay usuarios inactivos
  }

  /**
   * Maneja el cambio en el filtro de departamento
   * @param event Evento de cambio
   */
  onCambioDepartamento(event: any): void {
    console.log('🏢 Cambio de departamento:', event.detail.value);
    this.aplicarFiltros();
  }

  /**
   * Maneja el cambio en el filtro de rol
   * @param event Evento de cambio
   */
  onCambioRol(event: any): void {
    console.log('👤 Cambio de rol:', event.detail.value);
    this.aplicarFiltros();
  }

  /**
   * Maneja el evento de búsqueda por nombre
   * @param event Evento de entrada
   */
  onBusquedaNombre(event: any): void {
    console.log('🔍 Búsqueda por nombre:', event.target.value);
    // El debounce ya está configurado en valueChanges, no necesitamos hacer nada aquí
  }
  private async mostrarToast(mensaje: string, color: 'success' | 'warning' | 'danger' = 'success'): Promise<void> {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 3000,
      color: color,
      position: 'top'
    });
    await toast.present();
  }

  /**
   * Muestra un mensaje de error
   * @param mensaje Mensaje de error
   */
  private async mostrarError(mensaje: string): Promise<void> {
    await this.mostrarToast(mensaje, 'danger');
  }
}