import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  FormsModule, 
  ReactiveFormsModule, 
  FormBuilder, 
  FormGroup, 
  Validators, 
  AbstractControl, 
  ValidationErrors,
  AsyncValidatorFn 
} from '@angular/forms';
import { Router } from '@angular/router';
import { 
  IonicModule,
  LoadingController, 
  ToastController, 
  AlertController 
} from '@ionic/angular';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, of, Observable } from 'rxjs';
import { map, catchError, delay } from 'rxjs/operators';

// Servicio e interfaces
import { UsuariosService } from '../../../services/usuarios.service';
import { 
  CrearUsuario, 
  Departamento, 
  RolUsuario, 
  ErroresValidacion 
} from '../../../interfaces/admin-usuarios.interface';

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

  /** Estado de envío del formulario */
  enviandoFormulario = false;

  /** Errores de validación */
  errores: ErroresValidacion = {};

  /** Enum de roles para el template */
  readonly RolUsuario = RolUsuario;

  /** Opciones de roles disponibles para el select */
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
  ) {}

  /**
   * Inicialización del componente
   */
  ngOnInit(): void {
    console.log('🚀 Inicializando CrearUsuarioPage');
    this.inicializarFormulario();
    this.configurarValidacionesDinamicas();
    this.cargarDepartamentos();
  }

  /**
   * Destrucción del componente
   */
  ngOnDestroy(): void {
    console.log('🧹 Destruyendo CrearUsuarioPage');
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ============ MÉTODOS DE INICIALIZACIÓN ============

  /**
   * Inicializa el formulario con validadores
   */
  private inicializarFormulario(): void {
    console.log('📝 Inicializando formulario de usuario');
    
    this.formularioUsuario = this.formBuilder.group({
      // Campos de nombre usando nomenclatura completa
      primer_nombre: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(25),
        Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
      ]],
      segundo_nombre: ['', [
        Validators.maxLength(25),
        Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/)
      ]],
      primer_apellido: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(25),
        Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
      ]],
      segundo_apellido: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(25),
        Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
      ]],
      
      // Email usando nomenclatura 'correo'
      correo: ['', 
        [
          Validators.required,
          Validators.email,
          Validators.maxLength(80)
        ],
        [this.validadorEmailAsincrono()]
      ],
      
      // Campo RUT
      rut: ['', [
        Validators.required,
        this.validadorRut.bind(this)
      ]],
      
      // Campos de contraseña
      contrasena: ['', [
        Validators.required,
        this.validadorPassword.bind(this)
      ]],
      confirmarContrasena: ['', [
        Validators.required
      ]],
      
      // Campos adicionales
      id_departamento: [null, [Validators.required]],
      rol: ['', [Validators.required]]
      
    }, { 
      validators: this.validadorContrasenaCoincidente.bind(this)
    });
  }

  /**
   * Configura validaciones dinámicas y observables
   */
  private configurarValidacionesDinamicas(): void {
    console.log('🔍 Configurando validaciones dinámicas');
    
    // Validación en tiempo real para correo
    this.formularioUsuario.get('correo')?.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(async (correo) => {
        if (correo && this.formularioUsuario.get('correo')?.valid) {
          await this.validarCorreoDisponible(correo);
        }
        this.actualizarErroresValidacion();
      });
    
    // Validación en tiempo real para contraseñas
    this.formularioUsuario.get('contrasena')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.formularioUsuario.get('confirmarContrasena')?.updateValueAndValidity();
        this.actualizarErroresValidacion();
      });

    this.formularioUsuario.get('confirmarContrasena')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.actualizarErroresValidacion();
      });
  }

  // ============ MÉTODOS DE CARGA DE DATOS ============

  /**
   * Carga la lista de departamentos disponibles
   */
  private async cargarDepartamentos(): Promise<void> {
    this.cargando = true;
    console.log('🏢 Cargando departamentos...');
    
    try {
      this.departamentos = await this.usuariosService.obtenerDepartamentos().toPromise() || [];
      console.log('✅ Departamentos cargados:', this.departamentos.length);
    } catch (error) {
      console.error('❌ Error al cargar departamentos:', error);
      await this.mostrarError('Error al cargar la lista de departamentos');
    } finally {
      this.cargando = false;
    }
  }

  // ============ MÉTODOS DE VALIDACIÓN ============

  /**
   * Validador de RUT chileno
   * @param control Control del formulario
   * @returns Error de validación o null
   */
  private validadorRut(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null; // El required ya maneja este caso
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
   * Validador personalizado para contraseñas
   * @param control Control del formulario
   * @returns Errores de validación o null
   */
  private validadorPassword(control: AbstractControl): ValidationErrors | null {
    const password = control.value;
    
    if (!password) {
      return null; // El required ya maneja este caso
    }
    
    const errores: ValidationErrors = {};
    
    // Validar longitud mínima
    if (password.length < this.configuracionPassword.minimo) {
      errores['longitudMinima'] = true;
    }
    
    // Validar que contenga al menos un número
    if (this.configuracionPassword.requiereNumero && !/\d/.test(password)) {
      errores['requiereNumero'] = true;
    }
    
    // Validar que contenga al menos una mayúscula
    if (this.configuracionPassword.requiereMayuscula && !/[A-Z]/.test(password)) {
      errores['requiereMayuscula'] = true;
    }
    
    // Validar que contenga al menos una minúscula
    if (this.configuracionPassword.requiereMinuscula && !/[a-z]/.test(password)) {
      errores['requiereMinuscula'] = true;
    }
    
    // Validar que contenga al menos un carácter especial
    if (this.configuracionPassword.requiereEspecial && !/[@$!%*?&_]/.test(password)) {
      errores['requiereEspecial'] = true;
    }
    
    return Object.keys(errores).length > 0 ? errores : null;
  }

  /**
   * Validador para confirmar que las contraseñas coincidan
   * @param formGroup Grupo del formulario
   * @returns Error de validación o null
   */
  private validadorContrasenaCoincidente(formGroup: FormGroup): ValidationErrors | null {
    const contrasena = formGroup.get('contrasena')?.value;
    const confirmarContrasena = formGroup.get('confirmarContrasena')?.value;
    
    if (contrasena && confirmarContrasena && contrasena !== confirmarContrasena) {
      return { 'contrasenasNoCoinciden': true };
    }
    
    return null;
  }

  /**
   * Validador asíncrono para verificar disponibilidad del email
   * @returns Función validadora asíncrona
   */
  private validadorEmailAsincrono(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value || !this.isValidEmail(control.value)) {
        return of(null);
      }
      
      return this.usuariosService.validarEmail(control.value).pipe(
        delay(300),
        map(disponible => disponible ? null : { 'correoEnUso': true }),
        catchError(() => of(null))
      );
    };
  }

  /**
   * Valida formato básico de email
   * @param email Email a validar
   * @returns true si es válido
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Valida si un correo está disponible
   * @param correo Correo a validar
   */
  private async validarCorreoDisponible(correo: string): Promise<void> {
    try {
      const disponible = await this.usuariosService.validarEmail(correo).toPromise();
      
      if (!disponible) {
        this.errores.correo = 'Este correo ya está registrado en el sistema';
        this.formularioUsuario.get('correo')?.setErrors({ 'correoEnUso': true });
      } else {
        if (this.errores.correo === 'Este correo ya está registrado en el sistema') {
          delete this.errores.correo;
        }
        
        const control = this.formularioUsuario.get('correo');
        if (control?.errors?.['correoEnUso']) {
          delete control.errors['correoEnUso'];
          if (Object.keys(control.errors).length === 0) {
            control.setErrors(null);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error al validar correo:', error);
    }
  }

  /**
   * Actualiza los errores de validación para mostrar en el template
   */
  private actualizarErroresValidacion(): void {
    this.errores = {};
    
    // Errores de primer nombre
    const primerNombreControl = this.formularioUsuario.get('primer_nombre');
    if (primerNombreControl?.touched && primerNombreControl?.errors) {
      if (primerNombreControl.errors['required']) {
        this.errores.primer_nombre = 'El primer nombre es requerido';
      } else if (primerNombreControl.errors['minlength']) {
        this.errores.primer_nombre = 'El primer nombre debe tener al menos 2 caracteres';
      } else if (primerNombreControl.errors['maxlength']) {
        this.errores.primer_nombre = 'El primer nombre no puede exceder 25 caracteres';
      } else if (primerNombreControl.errors['pattern']) {
        this.errores.primer_nombre = 'El primer nombre solo puede contener letras';
      }
    }
    
    // Errores de segundo nombre
    const segundoNombreControl = this.formularioUsuario.get('segundo_nombre');
    if (segundoNombreControl?.touched && segundoNombreControl?.errors) {
      if (segundoNombreControl.errors['maxlength']) {
        this.errores.segundo_nombre = 'El segundo nombre no puede exceder 25 caracteres';
      } else if (segundoNombreControl.errors['pattern']) {
        this.errores.segundo_nombre = 'El segundo nombre solo puede contener letras';
      }
    }
    
    // Errores de primer apellido
    const primerApellidoControl = this.formularioUsuario.get('primer_apellido');
    if (primerApellidoControl?.touched && primerApellidoControl?.errors) {
      if (primerApellidoControl.errors['required']) {
        this.errores.primer_apellido = 'El primer apellido es requerido';
      } else if (primerApellidoControl.errors['minlength']) {
        this.errores.primer_apellido = 'El primer apellido debe tener al menos 2 caracteres';
      } else if (primerApellidoControl.errors['maxlength']) {
        this.errores.primer_apellido = 'El primer apellido no puede exceder 25 caracteres';
      } else if (primerApellidoControl.errors['pattern']) {
        this.errores.primer_apellido = 'El primer apellido solo puede contener letras';
      }
    }
    
    // Errores de segundo apellido
    const segundoApellidoControl = this.formularioUsuario.get('segundo_apellido');
    if (segundoApellidoControl?.touched && segundoApellidoControl?.errors) {
      if (segundoApellidoControl.errors['required']) {
        this.errores.segundo_apellido = 'El segundo apellido es requerido';
      } else if (segundoApellidoControl.errors['minlength']) {
        this.errores.segundo_apellido = 'El segundo apellido debe tener al menos 2 caracteres';
      } else if (segundoApellidoControl.errors['maxlength']) {
        this.errores.segundo_apellido = 'El segundo apellido no puede exceder 25 caracteres';
      } else if (segundoApellidoControl.errors['pattern']) {
        this.errores.segundo_apellido = 'El segundo apellido solo puede contener letras';
      }
    }
    
    // Errores de correo
    const correoControl = this.formularioUsuario.get('correo');
    if (correoControl?.touched && correoControl?.errors) {
      if (correoControl.errors['required']) {
        this.errores.correo = 'El correo es requerido';
      } else if (correoControl.errors['email']) {
        this.errores.correo = 'Formato de correo inválido';
      } else if (correoControl.errors['maxlength']) {
        this.errores.correo = 'El correo no puede exceder 80 caracteres';
      } else if (correoControl.errors['correoEnUso']) {
        this.errores.correo = 'Este correo ya está registrado en el sistema';
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
      }
    }
    
    // Errores de contraseña
    const contrasenaControl = this.formularioUsuario.get('contrasena');
    if (contrasenaControl?.touched && contrasenaControl?.errors) {
      if (contrasenaControl.errors['required']) {
        this.errores.contrasena = 'La contraseña es requerida';
      } else {
        const requisitos = [];
        if (contrasenaControl.errors['longitudMinima']) {
          requisitos.push(`mínimo ${this.configuracionPassword.minimo} caracteres`);
        }
        if (contrasenaControl.errors['requiereNumero']) {
          requisitos.push('al menos un número');
        }
        if (contrasenaControl.errors['requiereMayuscula']) {
          requisitos.push('al menos una mayúscula');
        }
        if (contrasenaControl.errors['requiereMinuscula']) {
          requisitos.push('al menos una minúscula');
        }
        if (contrasenaControl.errors['requiereEspecial']) {
          requisitos.push('al menos un carácter especial');
        }
        
        if (requisitos.length > 0) {
          this.errores.contrasena = `La contraseña debe tener: ${requisitos.join(', ')}`;
        }
      }
    }
    
    // Errores de confirmación de contraseña
    const confirmarContrasenaControl = this.formularioUsuario.get('confirmarContrasena');
    if (confirmarContrasenaControl?.touched) {
      if (confirmarContrasenaControl.errors?.['required']) {
        this.errores.confirmarContrasena = 'Debes confirmar la contraseña';
      } else if (this.formularioUsuario.errors?.['contrasenasNoCoinciden']) {
        this.errores.confirmarContrasena = 'Las contraseñas no coinciden';
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

  // ============ MÉTODOS DE EVENTOS ============

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
    console.log('📤 Iniciando envío de formulario...');
    
    // Marcar todos los campos como tocados para mostrar errores
    this.formularioUsuario.markAllAsTouched();
    this.actualizarErroresValidacion();
    
    // Verificar si el formulario es válido
    if (!this.formularioUsuario.valid) {
      console.log('❌ Formulario inválido:', this.formularioUsuario.errors);
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
          handler: () => this.crearUsuario()
        }
      ]
    });
    
    await alert.present();
  }

  /**
   * Crea el usuario en el sistema
   */
  private async crearUsuario(): Promise<void> {
    this.enviandoFormulario = true;
    
    // Mostrar loading
    const loading = await this.loadingController.create({
      message: 'Creando usuario...',
      spinner: 'crescent'
    });
    await loading.present();
    
    try {
      // Preparar datos del usuario
      const datosUsuario: CrearUsuario = {
        nombre: `${this.formularioUsuario.value.primer_nombre} ${this.formularioUsuario.value.segundo_nombre || ''} ${this.formularioUsuario.value.primer_apellido} ${this.formularioUsuario.value.segundo_apellido}`.trim(),
        email: this.formularioUsuario.value.correo,
        rut: '', // Si se necesita RUT, agregar campo al formulario
        password: this.formularioUsuario.value.contrasena,
        confirmarPassword: this.formularioUsuario.value.confirmarContrasena,
        id_departamento: this.formularioUsuario.value.id_departamento,
        rol: this.formularioUsuario.value.rol
      };
      
      console.log('📤 Enviando datos del usuario:', { ...datosUsuario, password: '***', confirmarPassword: '***' });
      
      // Crear usuario
      const respuesta = await this.usuariosService.crearUsuario(datosUsuario).toPromise();
      
      console.log('✅ Usuario creado exitosamente:', respuesta);
      
      // Mostrar mensaje de éxito
      await this.mostrarExito('Usuario creado exitosamente');
      
      // Navegar de vuelta a la lista
      await this.router.navigate(['/admin-usuarios']);
      
    } catch (error: any) {
      console.error('❌ Error al crear usuario:', error);
      
      let mensajeError = 'Error al crear el usuario';
      
      if (error.error?.message) {
        mensajeError = error.error.message;
      } else if (error.message) {
        mensajeError = error.message;
      }
      
      await this.mostrarError(mensajeError);
      
    } finally {
      await loading.dismiss();
      this.enviandoFormulario = false;
    }
  }

  /**
   * Navega de vuelta a la lista de usuarios
   */
  async volver(): Promise<void> {
    // Verificar si hay cambios sin guardar
    if (this.formularioUsuario.dirty) {
      const alert = await this.alertController.create({
        header: 'Cambios sin guardar',
        message: '¿Estás seguro de que quieres salir? Se perderán los cambios realizados.',
        buttons: [
          {
            text: 'Cancelar',
            role: 'cancel'
          },
          {
            text: 'Salir',
            handler: () => this.router.navigate(['/admin-usuarios'])
          }
        ]
      });
      
      await alert.present();
    } else {
      await this.router.navigate(['/admin-usuarios']);
    }
  }

  // ============ MÉTODOS DE UTILIDAD ============

  /**
   * Muestra un mensaje de error
   * @param mensaje Mensaje a mostrar
   */
  private async mostrarError(mensaje: string): Promise<void> {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 4000,
      color: 'danger',
      position: 'top',
      icon: 'alert-circle-outline'
    });
    await toast.present();
  }

  /**
   * Muestra un mensaje de éxito
   * @param mensaje Mensaje a mostrar
   */
  private async mostrarExito(mensaje: string): Promise<void> {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 3000,
      color: 'success',
      position: 'top',
      icon: 'checkmark-circle-outline'
    });
    await toast.present();
  }
}