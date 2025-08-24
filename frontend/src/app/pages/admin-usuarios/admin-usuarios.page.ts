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
  RolUsuario,
  MapeoCodigosDepartamento,
  CodigoDepartamento
} from '../../interfaces/admin-usuarios.interface';

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

  private destroy$ = new Subject<void>();

  usuarios: Usuario[] = [];
  departamentos: Departamento[] = [];
  cargando = false;
  formularioFiltros!: FormGroup;
  filtrosActivos: FiltrosUsuario = {};
  vistaActual: 'lista' | 'crear' = 'lista';

  readonly RolUsuario = RolUsuario;

  readonly opcionesRol = [
    { valor: RolUsuario.ADMINISTRADOR, etiqueta: 'Administrador' },
    { valor: RolUsuario.RESPONSABLE, etiqueta: 'Responsable' },
    { valor: RolUsuario.USUARIO_INTERNO, etiqueta: 'Usuario Interno' },
    { valor: RolUsuario.USUARIO_EXTERNO, etiqueta: 'Usuario Externo' }
  ];

  // ✅ CORREGIDO: Tipado explícito para evitar error de tipo implícito
  readonly codigosDepartamento: MapeoCodigosDepartamento = {
    1: { nombre: 'Administración', clase: 'bg-primary', descripcion: 'Gestión administrativa' },
    2: { nombre: 'Comercial', clase: 'bg-success', descripcion: 'Ventas y marketing' },
    3: { nombre: 'Informática', clase: 'bg-info', descripcion: 'Desarrollo y soporte técnico' },
    4: { nombre: 'Operaciones', clase: 'bg-warning', descripcion: 'Logística y operaciones' }
  };

  paginacion = {
    paginaActual: 1,
    elementosPorPagina: 10,
    totalElementos: 0,
    totalPaginas: 0
  };

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

  ngOnInit(): void {
    this.configurarSuscripciones();
    this.cargarDatos();
  }

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
  }

  /**
   * Configura las suscripciones a cambios en filtros
   */
  private configurarSuscripciones(): void {
    this.formularioFiltros.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(filtros => {
        this.filtrosActivos = { ...filtros };
        this.paginacion.paginaActual = 1;
        this.aplicarFiltrosLocalmente();
      });
  }

  /**
   * Carga los datos iniciales
   */
  private async cargarDatos(): Promise<void> {
    await Promise.all([
      this.cargarUsuarios(),
      this.cargarDepartamentos()
    ]);
  }

  /**
   * Carga la lista de usuarios desde el servicio
   */
  private async cargarUsuarios(): Promise<void> {
    try {
      this.cargando = true;
      console.log('📥 Cargando usuarios...');

      const respuesta = await this.usuariosService.obtenerUsuarios();
      
      if (respuesta.success) {
        this.usuarios = Array.isArray(respuesta.data) ? respuesta.data : [respuesta.data];
        this.calcularPaginacion();
        console.log(`✅ ${this.usuarios.length} usuarios cargados`);
      } else {
        await this.mostrarError('Error al cargar usuarios', respuesta.message);
      }

    } catch (error) {
      console.error('❌ Error al cargar usuarios:', error);
      await this.mostrarError('Error de conexión', 'No se pudieron cargar los usuarios');
    } finally {
      this.cargando = false;
    }
  }

  /**
   * Carga la lista de departamentos
   */
  private async cargarDepartamentos(): Promise<void> {
    try {
      console.log('🏢 Cargando departamentos...');
      
      const respuesta = await this.usuariosService.obtenerDepartamentos();
      
      if (respuesta.success) {
        this.departamentos = Array.isArray(respuesta.data) ? respuesta.data : [respuesta.data];
        console.log(`✅ ${this.departamentos.length} departamentos cargados`);
      }

    } catch (error) {
      console.error('❌ Error al cargar departamentos:', error);
    }
  }

  /**
   * Refresca todos los datos
   */
  async refrescar(): Promise<void> {
    await this.cargarDatos();
    await this.mostrarToast('Datos actualizados correctamente', 'success');
  }

  /**
   * Aplica filtros localmente a la lista de usuarios
   */
  private aplicarFiltrosLocalmente(): void {
    this.calcularPaginacion();
  }

  /**
   * Aplica los filtros del formulario
   */
  aplicarFiltros(): void {
    this.paginacion.paginaActual = 1;
    this.aplicarFiltrosLocalmente();
  }

  /**
   * Limpia todos los filtros
   */
  limpiarFiltros(): void {
    this.formularioFiltros.reset();
    this.filtrosActivos = {};
    this.paginacion.paginaActual = 1;
  }

  // ============ MÉTODOS DE NAVEGACIÓN ============

  irACrearUsuario(): void {
    console.log('➕ Navegando a crear usuario');
    this.router.navigate(['/admin-usuarios/crear']);
  }

  irAEditarUsuario(usuario: Usuario): void {
    console.log('✏️ Navegando a editar usuario:', usuario.id);
    this.router.navigate(['/admin-usuarios/editar', usuario.id]);
  }

  async verDetalleUsuario(usuario: Usuario): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Detalles del Usuario',
      message: `
        <strong>Nombre:</strong> ${usuario.nombre}<br>
        <strong>Email:</strong> ${usuario.email}<br>
        <strong>RUT:</strong> ${usuario.rut || 'Sin RUT'}<br>
        <strong>Departamento:</strong> ${this.obtenerNombreDepartamento(usuario.id_departamento)}<br>
        <strong>Rol:</strong> ${this.obtenerEtiquetaRol(usuario.rol)}<br>
        <strong>Último acceso:</strong> ${usuario.ultimo_acceso ? new Date(usuario.ultimo_acceso).toLocaleString() : 'Nunca'}
      `,
      buttons: ['Cerrar']
    });

    await alert.present();
  }

  // ============ MÉTODOS DE GESTIÓN DE USUARIOS ============

  async eliminarUsuario(usuario: Usuario): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Confirmar Eliminación',
      message: `¿Estás seguro de que deseas eliminar al usuario <strong>${usuario.nombre}</strong>?<br><br>Esta acción no se puede deshacer.`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            await this.confirmarEliminacion(usuario);
          }
        }
      ]
    });

    await alert.present();
  }

  private async confirmarEliminacion(usuario: Usuario): Promise<void> {
    const loading = await this.loadingController.create({
      message: 'Eliminando usuario...'
    });

    try {
      await loading.present();

      const respuesta = await this.usuariosService.eliminarUsuario(usuario.id);
      
      if (respuesta.success) {
        this.usuarios = this.usuarios.filter(u => u.id !== usuario.id);
        this.calcularPaginacion();
        
        await this.mostrarToast('Usuario eliminado correctamente', 'success');
      } else {
        await this.mostrarError('Error al eliminar', respuesta.message);
      }

    } catch (error) {
      console.error('❌ Error al eliminar usuario:', error);
      await this.mostrarError('Error de conexión', 'No se pudo eliminar el usuario');
    } finally {
      await loading.dismiss();
    }
  }
  /**
   * ✅ CORREGIDO: Tipado explícito del parámetro
   */
  obtenerNombreDepartamento(codigoDepartamento: number): string {
    return this.codigosDepartamento[codigoDepartamento]?.nombre || `Departamento ${codigoDepartamento}`;
  }

  /**
   * ✅ CORREGIDO: Tipado explícito del parámetro
   */
  obtenerClaseDepartamento(codigoDepartamento: number): string {
    return this.codigosDepartamento[codigoDepartamento]?.clase || 'bg-secondary';
  }

  obtenerClaseRol(rol: RolUsuario): string {
    const clases = {
      [RolUsuario.ADMINISTRADOR]: 'bg-danger',
      [RolUsuario.RESPONSABLE]: 'bg-warning',
      [RolUsuario.USUARIO_INTERNO]: 'bg-info',
      [RolUsuario.USUARIO_EXTERNO]: 'bg-secondary'
    };
    return clases[rol] || 'bg-secondary';
  }

  obtenerIniciales(nombre: string): string {
    return nombre
      .split(' ')
      .map(palabra => palabra.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }

  obtenerEtiquetaRol(rol: RolUsuario): string {
    const opcion = this.opcionesRol.find(o => o.valor === rol);
    return opcion?.etiqueta || rol;
  }

  obtenerUsuariosActivos(): number {
    return this.usuarios.length;
  }

  obtenerAdministradores(): number {
    return this.usuarios.filter(u => u.rol === RolUsuario.ADMINISTRADOR).length;
  }

  obtenerUsuariosPorDepartamento(): number {
    const departamentosUnicos = new Set(this.usuarios.map(u => u.id_departamento));
    return departamentosUnicos.size;
  }

  private calcularPaginacion(): void {
    this.paginacion.totalElementos = this.usuarios.length;
    this.paginacion.totalPaginas = Math.ceil(
      this.paginacion.totalElementos / this.paginacion.elementosPorPagina
    );
  }

  obtenerUsuariosPaginados(): Usuario[] {
    const inicio = (this.paginacion.paginaActual - 1) * this.paginacion.elementosPorPagina;
    const fin = inicio + this.paginacion.elementosPorPagina;
    return this.usuarios.slice(inicio, fin);
  }

  obtenerNumerosPaginas(): number[] {
    const paginas: number[] = [];
    const maxPaginas = 5;
    
    let inicio = Math.max(1, this.paginacion.paginaActual - Math.floor(maxPaginas / 2));
    let fin = Math.min(this.paginacion.totalPaginas, inicio + maxPaginas - 1);
    
    inicio = Math.max(1, fin - maxPaginas + 1);
    
    for (let i = inicio; i <= fin; i++) {
      paginas.push(i);
    }
    
    return paginas;
  }

  irAPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.paginacion.totalPaginas) {
      this.paginacion.paginaActual = pagina;
    }
  }

  trackByUsuarioId(index: number, usuario: Usuario): number {
    return usuario.id;
  }

  private async mostrarError(titulo: string, mensaje: string): Promise<void> {
    const alert = await this.alertController.create({
      header: titulo,
      message: mensaje,
      buttons: ['OK']
    });
    await alert.present();
  }

  private async mostrarToast(mensaje: string, color: 'success' | 'warning' | 'danger' = 'success'): Promise<void> {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 3000,
      color: color,
      position: 'bottom'
    });
    await toast.present();
  }

  readonly Math = Math;
}