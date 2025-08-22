import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule, LoadingController, ToastController, AlertController } from '@ionic/angular';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';

import { UsuariosService } from '../../services/usuarios.service';
import { 
  CrearUsuario, 
  Departamento, 
  RolUsuario, 
  ErroresValidacion 
} from '../../interfaces/admin-usuarios.interface';

/**
 * Componente para crear un nuevo usuario
 * Incluye validaciones en tiempo real y manejo de errores
 */
@Component({
  selector: 'app-crear-usuario',
  templateUrl: './crear-usuario.page.html',
  styleUrls: ['./crear-usuario.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule
  ]
})
export class CrearUsuarioPage implements OnInit, OnDestroy {

  /** Subject para destruir suscripciones */
  private destroy$ = new Subject<void>();

  /** Formulario de creación de usuario */
  formularioUsuario!: FormGroup;

  /** Lista de departamentos disponibles */
  departamentos: Departamento[] = [];

  /** Estado de carga */
  cargando = false;

  /** Estado de guardado */
  guardando = false;

  /** Errores de validación */
  errores: ErroresValidacion = {};

  /** Enum de roles para el template */
  readonly RolUsuario = RolUsuario;

  /** Opciones de roles disponibles */
  readonly opcionesRol = [
    { valor: RolUsuario.ADMINISTRADOR, etiqueta: 'Administrador' },
    { valor: RolUsuario.RESPONSABLE, etiqueta: 'Responsable' },
    { valor: RolUsuario.USUARIO_INTERNO, etiqueta: 'Usuario Interno' },
    { valor: RolUsuario.USUARIO_EXTERNO, etiqueta: 'Usuario Externo' }
  ];

  /** Configuración de validación de contraseña */
  readonly configuracionPassword = {
    minimo: 8,
    requiereNumero: true,
    requiereMayuscula: true,
    requiereMinuscula: true,
    requiereEspecial: true
  };

  /**
   * Constructor del componente
   * @param formBuilder Constructor de formularios
   * @param usuariosService Servicio de usuarios
   * @param router Router de Angular
   * @param loadingController Controlador de loading
   * @param toastController Controlador de toast
   * @param alertController Controlador de alertas
   */
  constructor(
    private formBuilder: FormBuilder,
    private usuariosService: UsuariosService,
    private router: Router,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private alertController: AlertController
  ) {
    this.inicializarFormulario();
  }

  /**
   * Inicialización del componente
   */
  ngOnInit(): void {
    this.cargarDepartamentos();
    this.configurarValidacionesTiempoReal();
  }

  /**
   * Destrucción del componente
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Inicializa el formulario con validaciones
   */
  private inicializarFormulario(): void {
    this.formularioUsuario = this.formBuilder.group({
      nombre: [
        '', 
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(100),
          Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/) // Solo letras y espacios
        ]
      ],
      email: [
        '', 
        [
          Validators.required,
          Validators.email,
          Validators.maxLength(150)
        ]
      ],
      rut: [
        '', 
        [
          Validators.required,
          this.validadorRut.bind(this)
        ]
      ],
      password: [
        '', 
        [
          Validators.required,
          Validators.minLength(this.configuracionPassword.minimo),
          this.validadorPassword.bind(this)
        ]
      ],
      confirmarPassword: [
        '', 
        [
          Validators.required
        ]
      ],
      id_departamento: [
        '', 
        [
          Validators.required
        ]
      ],
      rol: [
        '', 
        [
          Validators.required
        ]
      ],
      activo: [true] // Por defecto activo
    }, {
      // Validador personalizado para confirmar contraseña
      validators: this.validadorConfirmarPassword.bind(this)
    });
  }

  /**
   * Configura validaciones en tiempo real
   */
  private configurarValidacionesTiempoReal(): void {
    // Validación de email en tiempo real
    this.formularioUsuario.get('email')?.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(async (email) => {
        if (email && this.formularioUsuario.get('email')?.valid) {
          await this.validarEmailDisponible(email);
        }
      });

    // Validación de RUT en tiempo real
    this.formularioUsuario.get('rut')?.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(async (rut) => {
        if (rut && this.formularioUsuario.get('rut')?.valid) {
          // Formatear RUT automáticamente
          const rutFormateado = this.usuariosService.formatearRut(rut);
          if (rutFormateado !== rut) {
            this.formularioUsuario.get('rut')?.setValue(rutFormateado, { emitEvent: false });
          }
          await this.validarRutDisponible(rut);
        }
      });

    // Validación de contraseña en tiempo real
    this.formularioUsuario.get('password')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.formularioUsuario.get('confirmarPassword')?.updateValueAndValidity();
      });

    this.formularioUsuario.get('confirmarPassword')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.actualizarErroresValidacion();
      });
  }

  /**
   * Carga la lista de departamentos
   */
  private async cargarDepartamentos(): Promise<void> {
    this.cargando = true;
    
    try {
      this.departamentos = await this.usuariosService.obtenerDepartamentos().toPromise() || [];
    } catch (error) {
      console.error('Error al cargar departamentos:', error);
      await this.mostrarError('Error al cargar la lista de departamentos');
    } finally {
      this.cargando = false;
    }
  }

  /**
   * Valida si un email está disponible
   * @param email Email a validar
   */
  private async validarEmailDisponible(email: string): Promise<void> {
    try {
      const disponible = await this.usuariosService.validarEmail(email).toPromise();
      
      if (!disponible) {
        this.errores.email = 'Este email ya está registrado en el sistema';
        this.formularioUsuario.get('email')?.setErrors({ 'emailEnUso': true });
      } else {
        // Limpiar error si el email está disponible
        if (this.errores.email === 'Este email ya está registrado en el sistema') {
          delete this.errores.email;
        }
        
        // Remover error específico pero mantener otros errores de validación
        const control = this.formularioUsuario.get('email');
        if (control?.errors?.['emailEnUso']) {
          delete control.errors['emailEnUso'];
          if (Object.keys(control.errors).length === 0) {
            control.setErrors(null);
          }
        }
      }
    } catch (error) {
      console.error('Error al validar email:', error);
    }
  }

  /**
   * Valida si un RUT está disponible
   * @param rut RUT a validar
   */
  private async validarRutDisponible(rut: string): Promise<void> {
    try {
      const disponible = await this.usuariosService.validarRut(rut).toPromise();
      
      if (!disponible) {
        this.errores.rut = 'Este RUT ya está registrado en el sistema';
        this.formularioUsuario.get('rut')?.setErrors({ 'rutEnUso': true });
      } else {
        // Limpiar error si el RUT está disponible
        if (this.errores.rut === 'Este RUT ya está registrado en el sistema') {
          delete this.errores.rut;
        }
        
        // Remover error específico pero mantener otros errores de validación
        const control = this.formularioUsuario.get('rut');
        if (control?.errors?.['rutEnUso']) {
          delete control.errors['rutEnUso'];
          if (Object.keys(control.errors).length === 0) {
            control.setErrors(null);
          }
        }
      }
    } catch (error) {
      console.error('Error al validar RUT:', error);
    }
  }

  /**
   * Validador personalizado para RUT chileno
   * @param control Control del formulario
   * @returns Error de validación o null
   */
  private validadorRut(control: any): { [key: string]: any } | null {
    if (!control.value) {
      return null; // Si está vacío, lo maneja Validators.required
    }

    const rut = control.value.replace(/\./g, '').replace('-', '');
    
    // Verificar formato básico
    if (!/^\d{7,8}[0-9kK]$/.test(rut)) {
      return { 'formatoRutInvalido': true };
    }

    // Validar dígito verificador
    const numero = rut.slice(0, -1);
    const dv = rut.slice(-1).toLowerCase();
    
    let suma = 0;
    let multiplicador = 2;
    
    for (let i = numero.length - 1; i >= 0; i--) {
      suma += parseInt(numero[i]) * multiplicador;
      multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
    }
    
    const resto = suma % 11;
    const dvCalculado = resto === 0 ? '0' : resto === 1 ? 'k' : (11 - resto).toString();
    
    if (dv !== dvCalculado) {
      return { 'digitoVerificadorInvalido': true };
    }

    return null;
  }

  /**
   * Validador personalizado para contraseña
   * @param control Control del formulario
   * @returns Error de validación o null
   */
  private validadorPassword(control: any): { [key: string]: any } | null {
    if (!control.value) {
      return null;
    }

    const password = control.value;
    const errores: any = {};

    // Verificar longitud mínima
    if (password.length < this.configuracionPassword.minimo) {
      errores.longitudMinima = true;
    }

    // Verificar que tenga al menos un número
    if (this.configuracionPassword.requiereNumero && !/\d/.test(password)) {
      errores.requiereNumero = true;
    }

    // Verificar que tenga al menos una mayúscula
    if (this.configuracionPassword.requiereMayuscula && !/[A-Z]/.test(password)) {
      errores.requiereMayuscula = true;
    }

    // Verificar que tenga al menos una minúscula
    if (this.configuracionPassword.requiereMinuscula && !/[a-z]/.test(password)) {
      errores.requiereMinuscula = true;
    }

    // Verificar que tenga al menos un carácter especial
    if (this.configuracionPassword.requiereEspecial && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errores.requiereEspecial = true;
    }

    return Object.keys(errores).length > 0 ? errores : null;
  }

  /**
   * Validador para confirmar contraseña
   * @param formGroup Grupo del formulario
   * @returns Error de validación o null
   */
  private validadorConfirmarPassword(formGroup: FormGroup): { [key: string]: any } | null {
    const password = formGroup.get('password')?.value;
    const confirmarPassword = formGroup.get('confirmarPassword')?.value;

    if (password && confirmarPassword && password !== confirmarPassword) {
      return { 'passwordsNoCoinciden': true };
    }

    return null;
  }

  /**
   * Actualiza los errores de validación para mostrar en el template
   */
  private actualizarErroresValidacion(): void {
    this.errores = {};

    // Errores de nombre
    const nombreControl = this.formularioUsuario.get('nombre');
    if (nombreControl?.touched && nombreControl?.errors) {
      if (nombreControl.errors['required']) {
        this.errores.nombre = 'El nombre es requerido';
      } else if (nombreControl.errors['minlength']) {
        this.errores.nombre = 'El nombre debe tener al menos 2 caracteres';
      } else if (nombreControl.errors['maxlength']) {
        this.errores.nombre = 'El nombre no puede exceder 100 caracteres';
      } else if (nombreControl.errors['pattern']) {
        this.errores.nombre = 'El nombre solo puede contener letras y espacios';
      }
    }

    // Errores de email
    const emailControl = this.formularioUsuario.get('email');
    if (emailControl?.touched && emailControl?.errors) {
      if (emailControl.errors['required']) {
        this.errores.email = 'El email es requerido';
      } else if (emailControl.errors['email']) {
        this.errores.email = 'Formato de email inválido';
      } else if (emailControl.errors['maxlength']) {
        this.errores.email = 'El email no puede exceder 150 caracteres';
      } else if (emailControl.errors['emailEnUso']) {
        this.errores.email = 'Este email ya está registrado en el sistema';
      }
    }

    // Errores de RUT
    const rutControl = this.formularioUsuario.get('rut');
    if (rutControl?.touched && rutControl?.errors) {
      if (rutControl.errors['required']) {
        this.errores.rut = 'El RUT es requerido';
      } else if (rutControl.errors['formatoRutInvalido']) {
        this.errores.rut = 'Formato de RUT inválido (ej: 12345678-9)';
      } else if (rutControl.errors['digitoVerificadorInvalido']) {
        this.errores.rut = 'Dígito verificador del RUT es incorrecto';
      } else if (rutControl.errors['rutEnUso']) {
        this.errores.rut = 'Este RUT ya está registrado en el sistema';
      }
    }

    // Errores de contraseña
    const passwordControl = this.formularioUsuario.get('password');
    if (passwordControl?.touched && passwordControl?.errors) {
      if (passwordControl.errors['required']) {
        this.errores.password = 'La contraseña es requerida';
      } else {
        const requisitos = [];
        if (passwordControl.errors['longitudMinima']) {
          requisitos.push(`mínimo ${this.configuracionPassword.minimo} caracteres`);
        }
        if (passwordControl.errors['requiereNumero']) {
          requisitos.push('al menos un número');
        }
        if (passwordControl.errors['requiereMayuscula']) {
          requisitos.push('al menos una mayúscula');
        }
        if (passwordControl.errors['requiereMinuscula']) {
          requisitos.push('al menos una minúscula');
        }
        if (passwordControl.errors['requiereEspecial']) {
          requisitos.push('al menos un carácter especial');
        }
        
        if (requisitos.length > 0) {
          this.errores.password = `La contraseña debe tener: ${requisitos.join(', ')}`;
        }
      }
    }

    // Errores de confirmación de contraseña
    const confirmarPasswordControl = this.formularioUsuario.get('confirmarPassword');
    if (confirmarPasswordControl?.touched) {
      if (confirmarPasswordControl.errors?.['required']) {
        this.errores.confirmarPassword = 'Debes confirmar la contraseña';
      } else if (this.formularioUsuario.errors?.['passwordsNoCoinciden']) {
        this.errores.confirmarPassword = 'Las contraseñas no coinciden';
      }
    }

    // Errores de departamento
    const departamentoControl = this.formularioUsuario.get('id_departamento');
    if (departamentoControl?.touched && departamentoControl?.errors?.['required']) {
      this.errores.id_departamento = 'Debes seleccionar un departamento';
    }

    // Errores de rol
    const rolControl = this.formularioUsuario.get('rol');
    if (rolControl?.touched && rolControl?.errors?.['required']) {
      this.errores.rol = 'Debes seleccionar un rol';
    }
  }

  /**
   * Maneja el evento de cambio en los campos del formulario
   */
  onCampoFormulario(): void {
    this.actualizarErroresValidacion();
  }

  /**
   * Maneja el envío del formulario
   */
  async onSubmit(): Promise<void> {
    // Marcar todos los campos como tocados para mostrar errores
    this.formularioUsuario.markAllAsTouched();
    this.actualizarErroresValidacion();

    // Verificar si el formulario es válido
    if (!this.formularioUsuario.valid) {
      await this.mostrarError('Por favor corrige los errores en el formulario');
      return;
    }

    // Mostrar confirmación antes de crear el usuario
    const alert = await this.alertController.create({
      header: 'Confirmar Creación',
      message: '¿Estás seguro de que quieres crear este usuario?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Crear Usuario',
          handler: () => {
            this.crearUsuario();
          }
        }
      ]
    });

    await alert.present();
  }

  /**
   * Crea el usuario en el sistema
   */
  private async crearUsuario(): Promise<void> {
    this.guardando = true;
    const loading = await this.loadingController.create({
      message: 'Creando usuario...',
      spinner: 'circular'
    });
    await loading.present();

    try {
      const datosUsuario: CrearUsuario = this.formularioUsuario.value;
      
      await this.usuariosService.crearUsuario(datosUsuario).toPromise();
      
      await this.mostrarToast('Usuario creado exitosamente', 'success');
      
      // Redirigir a la lista de usuarios
      this.router.navigate(['/admin-usuarios']);
      
    } catch (error: any) {
      console.error('Error al crear usuario:', error);
      await this.mostrarError(error.message || 'Error al crear el usuario');
    } finally {
      this.guardando = false;
      await loading.dismiss();
    }
  }

  /**
   * Cancela la creación y vuelve a la lista
   */
  async cancelar(): Promise<void> {
    // Si hay cambios en el formulario, mostrar confirmación
    if (this.formularioUsuario.dirty) {
      const alert = await this.alertController.create({
        header: 'Cancelar Creación',
        message: 'Tienes cambios sin guardar. ¿Estás seguro de que quieres cancelar?',
        buttons: [
          {
            text: 'Continuar Editando',
            role: 'cancel'
          },
          {
            text: 'Cancelar y Salir',
            handler: () => {
              this.router.navigate(['/admin-usuarios']);
            }
          }
        ]
      });

      await alert.present();
    } else {
      this.router.navigate(['/admin-usuarios']);
    }
  }

  /**
   * Obtiene el nombre del departamento
   * @param id ID del departamento
   * @returns Nombre del departamento
   */
  obtenerNombreDepartamento(id: number): string {
    const departamento = this.departamentos.find(d => d.id === id);
    return departamento?.nombre || 'Departamento no encontrado';
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
   * Verifica si un campo tiene errores
   * @param campo Nombre del campo
   * @returns true si el campo tiene errores
   */
  tieneError(campo: string): boolean {
    const control = this.formularioUsuario.get(campo);
    return !!(control?.touched && (control?.errors || this.errores[campo as keyof ErroresValidacion]));
  }

  /**
   * Obtiene el mensaje de error para un campo
   * @param campo Nombre del campo
   * @returns Mensaje de error
   */
  obtenerMensajeError(campo: string): string {
    return this.errores[campo as keyof ErroresValidacion] || '';
  }

  /**
   * Evalúa la fortaleza de la contraseña
   * @returns Objeto con información de fortaleza
   */
  evaluarFortalezaPassword(): { porcentaje: number; nivel: string; color: string } {
    const password = this.formularioUsuario.get('password')?.value || '';
    let puntos = 0;
    const maxPuntos = 5;

    // Longitud mínima
    if (password.length >= this.configuracionPassword.minimo) puntos++;
    
    // Contiene número
    if (/\d/.test(password)) puntos++;
    
    // Contiene mayúscula
    if (/[A-Z]/.test(password)) puntos++;
    
    // Contiene minúscula
    if (/[a-z]/.test(password)) puntos++;
    
    // Contiene carácter especial
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) puntos++;

    const porcentaje = (puntos / maxPuntos) * 100;
    
    let nivel = 'Muy Débil';
    let color = 'danger';
    
    if (porcentaje >= 80) {
      nivel = 'Muy Fuerte';
      color = 'success';
    } else if (porcentaje >= 60) {
      nivel = 'Fuerte';
      color = 'primary';
    } else if (porcentaje >= 40) {
      nivel = 'Moderada';
      color = 'warning';
    } else if (porcentaje >= 20) {
      nivel = 'Débil';
      color = 'danger';
    }

    return { porcentaje, nivel, color };
  }

  /**
   * Muestra un mensaje toast
   * @param mensaje Mensaje a mostrar
   * @param color Color del toast
   */
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