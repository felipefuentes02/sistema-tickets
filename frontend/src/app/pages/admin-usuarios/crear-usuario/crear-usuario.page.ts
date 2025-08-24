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
import { Subject, takeUntil, debounceTime, distinctUntilChanged, of, Observable, from } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';

import { UsuariosService } from '../../../services/usuarios.service';
import { 
  CrearUsuario, 
  Departamento, 
  RolUsuario, 
  ErroresValidacion,
  CodigoDepartamento,
  MapeoCodigosDepartamento
} from '../../../interfaces/admin-usuarios.interface';

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

  private destroy$ = new Subject<void>();

  formularioUsuario!: FormGroup;
  departamentos: Departamento[] = [];
  cargando = false;
  enviandoFormulario = false;
  errores: ErroresValidacion = {};

  readonly RolUsuario = RolUsuario;

  readonly opcionesRol = [
    { valor: RolUsuario.ADMINISTRADOR, etiqueta: 'Administrador' },
    { valor: RolUsuario.RESPONSABLE, etiqueta: 'Responsable' },
    { valor: RolUsuario.USUARIO_INTERNO, etiqueta: 'Usuario Interno' },
    { valor: RolUsuario.USUARIO_EXTERNO, etiqueta: 'Usuario Externo' }
  ];

  readonly codigosDepartamento: MapeoCodigosDepartamento = {
    1: { nombre: 'Administración', descripcion: 'Gestión administrativa y recursos humanos', clase: 'bg-primary' },
    2: { nombre: 'Comercial', descripcion: 'Ventas, marketing y atención comercial', clase: 'bg-success' },
    3: { nombre: 'Informática', descripcion: 'Desarrollo, infraestructura y soporte técnico', clase: 'bg-info' },
    4: { nombre: 'Operaciones', descripcion: 'Logística, producción y operaciones', clase: 'bg-warning' }
  };

  readonly configuracionPassword = {
    minimo: 8,
    requiereNumero: true,
    requiereMayuscula: true,
    requiereMinuscula: true,
    requiereEspecial: true
  };

  constructor(
    private formBuilder: FormBuilder,
    private usuariosService: UsuariosService,
    private router: Router,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private alertController: AlertController
  ) {}

  ngOnInit(): void {
    this.inicializarFormulario();
    this.configurarValidacionesEnTiempoReal();
    this.cargarDepartamentos();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

   private inicializarFormulario(): void {
    this.formularioUsuario = this.formBuilder.group({
      primerNombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(25)]],
      segundoNombre: ['', [Validators.maxLength(25)]],
      primerApellido: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(25)]],
      segundoApellido: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(25)]],
      rut: ['', [Validators.required, this.validadorRUT], [this.validadorRUTUnico()]],
      email: ['', [Validators.required, Validators.email], [this.validadorEmailUnico()]],
      departamento: ['', [Validators.required, this.validadorCodigoDepartamento]],
      rol: ['', [Validators.required]],
      password: ['', [Validators.required, this.validadorPassword]],
      confirmarPassword: ['', [Validators.required]]
    }, {
      validators: [this.validadorPasswordsCoinciden]
    });
  }

  private validadorRUT = (control: AbstractControl): ValidationErrors | null => {
    const rut = control.value;
    if (!rut) return null;

    if (!this.usuariosService.validarFormatoRUT(rut)) {
      return { rutInvalido: true };
    }

    return null;
  };

  private validadorRUTUnico(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value || this.validadorRUT(control)) {
        return of(null);
      }

      // ✅ Convertir Promise a Observable usando from()
      return from(this.usuariosService.verificarRutDisponible(control.value)).pipe(
        map(disponible => disponible ? null : { rutYaExiste: true }),
        catchError(() => of(null))
      );
    };
  }

  private validadorCodigoDepartamento = (control: AbstractControl): ValidationErrors | null => {
    const codigo = parseInt(control.value);
    const codigosValidos = [1, 2, 3, 4];
    
    if (!codigosValidos.includes(codigo)) {
      return { codigoDepartamentoInvalido: true };
    }
    
    return null;
  };

  private validadorEmailUnico(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value || Validators.email(control)) {
        return of(null);
      }

      return from(this.usuariosService.verificarEmailDisponible(control.value)).pipe(
        map(disponible => disponible ? null : { emailYaExiste: true }),
        catchError(() => of(null))
      );
    };
  }

  private validadorPassword = (control: AbstractControl): ValidationErrors | null => {
    const password = control.value;
    if (!password) return null;

    const errores: any = {};

    if (password.length < 8) {
      errores.longitudMinima = true;
    }

    if (!/[0-9]/.test(password)) {
      errores.requiereNumero = true;
    }

    if (!/[A-Z]/.test(password)) {
      errores.requiereMayuscula = true;
    }

    if (!/[a-z]/.test(password)) {
      errores.requiereMinuscula = true;
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errores.requiereEspecial = true;
    }

    return Object.keys(errores).length > 0 ? errores : null;
  };

  private validadorPasswordsCoinciden = (group: AbstractControl): ValidationErrors | null => {
    const password = group.get('password')?.value;
    const confirmarPassword = group.get('confirmarPassword')?.value;

    return password === confirmarPassword ? null : { passwordsNoCoinciden: true };
  };

  private configurarValidacionesEnTiempoReal(): void {
    this.formularioUsuario.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.errores = {};
      });

    const camposCriticos = ['email', 'rut', 'departamento'];
    
    camposCriticos.forEach(campo => {
      this.formularioUsuario.get(campo)?.statusChanges
        .pipe(
          takeUntil(this.destroy$),
          debounceTime(300),
          distinctUntilChanged()
        )
        .subscribe(status => {
          if (status === 'INVALID') {
            this.validarCampoEspecifico(campo);
          }
        });
    });
  }

  onCampoFormulario(): void {
    // Obtener todos los controles del formulario
    const controles = Object.keys(this.formularioUsuario.controls);
    
    // Validar cada control que ha sido tocado
    controles.forEach(nombreControl => {
      const control = this.formularioUsuario.get(nombreControl);
      if (control?.touched) {
        this.validarCampoEspecifico(nombreControl);
      }
    });
  }

  private validarCampoEspecifico(campo: string): void {
    const control = this.formularioUsuario.get(campo);
    
    if (control) {
      if (control.errors && control.touched) {
        // Si hay errores y el campo fue tocado, actualiza los mensajes de error
        this.errores[campo] = this.obtenerMensajeError(campo, control.errors);
      } else {
        // Si no hay errores o el campo no fue tocado, elimina el mensaje de error
        delete this.errores[campo];
      }
    }
  }

  private obtenerMensajeError(campo: string, errores: any): string {
    if (errores.required) return 'Este campo es requerido';
    if (errores.email) return 'Debe ser un correo electrónico válido';
    if (errores.minlength) return `Mínimo ${errores.minlength.requiredLength} caracteres`;
    if (errores.maxlength) return `Máximo ${errores.maxlength.requiredLength} caracteres`;
    if (errores.pattern) return 'Formato inválido';
    
    // Errores específicos por campo
    switch (campo) {
      case 'rut':
        if (errores.rutInvalido) return 'RUT inválido';
        if (errores.rutDuplicado) return 'Este RUT ya está registrado';
        break;
      case 'correo':
        if (errores.emailDuplicado) return 'Este correo ya está registrado';
        break;
      case 'contrasena':
        if (errores.passwordDebil) return 'La contraseña no cumple con los requisitos mínimos';
        break;
      case 'confirmarContrasena':
        if (errores.passwordsNoCoinciden) return 'Las contraseñas no coinciden';
        break;
    }

    return 'Campo inválido';
  }

  private async cargarDepartamentos(): Promise<void> {
    try {
      this.cargando = true;
      console.log('Cargando departamentos para crear usuario...');
      
      const respuesta = await this.usuariosService.obtenerDepartamentos();
      
      if (respuesta.success) {
        this.departamentos = Array.isArray(respuesta.data) ? respuesta.data : [respuesta.data];
        console.log(`${this.departamentos.length} departamentos cargados`);
      }

    } catch (error) {
      console.error('Error al cargar departamentos:', error);
      await this.mostrarError('Error', 'No se pudieron cargar los departamentos');
    } finally {
      this.cargando = false;
    }
  }

  async crearUsuario(): Promise<void> {
    if (this.formularioUsuario.invalid || this.enviandoFormulario) {
      this.marcarCamposComoTocados();
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Creando usuario...',
      spinner: 'crescent'
    });

    try {
      await loading.present();
      this.enviandoFormulario = true;

      const datosUsuario: CrearUsuario = {
        nombre: this.obtenerNombreCompleto(),
        email: this.formularioUsuario.get('email')?.value,
        rut: this.formularioUsuario.get('rut')?.value,
        password: this.formularioUsuario.get('password')?.value,
        confirmarPassword: this.formularioUsuario.get('confirmarPassword')?.value,
        id_departamento: parseInt(this.formularioUsuario.get('departamento')?.value),
        rol: this.formularioUsuario.get('rol')?.value
      };

      // Validar departamento
      if (!this.validarCodigoDepartamentoFinal(datosUsuario.id_departamento)) {
        throw new Error('Código de departamento inválido. Debe ser 1, 2, 3 o 4');
      }

      console.log('Creando usuario:', datosUsuario);

      const respuesta = await this.usuariosService.crearUsuario(datosUsuario);

      if (respuesta.success) {
        await this.mostrarExito('Usuario creado correctamente');
        this.router.navigate(['/admin-usuarios']);
      } else {
        await this.mostrarError('Error al crear usuario', respuesta.message);
      }

    } catch (error: any) {
      console.error('Error al crear usuario:', error);
      
      if (error.message.includes('departamento')) {
        this.errores.id_departamento = error.message;
      } else if (error.message.includes('RUT')) {
        this.errores.rut = error.message;
      } else if (error.message.includes('email')) {
        this.errores.correo = error.message;
      } else {
        await this.mostrarError('Error', error.message || 'No se pudo crear el usuario');
      }

    } finally {
      await loading.dismiss();
      this.enviandoFormulario = false;
    }
  }

  private validarCodigoDepartamentoFinal(codigo: number): boolean {
    const codigosValidos = [1, 2, 3, 4];
    return codigosValidos.includes(codigo);
  }

  private marcarCamposComoTocados(): void {
    Object.keys(this.formularioUsuario.controls).forEach(campo => {
      this.formularioUsuario.get(campo)?.markAsTouched();
    });

    this.validarCampoEspecifico('rut');
    this.validarCampoEspecifico('email');
    this.validarCampoEspecifico('departamento');
  }

  async cancelar(): Promise<void> {
    if (this.formularioUsuario.dirty) {
      const alert = await this.alertController.create({
        header: 'Confirmar Cancelación',
        message: '¿Estás seguro de que deseas cancelar? Se perderán los datos ingresados.',
        buttons: [
          {
            text: 'Continuar Editando',
            role: 'cancel'
          },
          {
            text: 'Cancelar',
            role: 'destructive',
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

  async mostrarAyuda(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Ayuda - Crear Usuario',
      message: `
        <p><strong>Información Personal:</strong></p>
        <ul>
          <li>Primer y segundo nombre (segundo opcional)</li>
          <li>Ambos apellidos son obligatorios</li>
          <li>RUT en formato 12345678-9</li>
        </ul>
        
        <p><strong>Departamentos:</strong></p>
        <ul>
          <li>1 → Administración</li>
          <li>2 → Comercial</li>
          <li>3 → Informática</li>
          <li>4 → Operaciones</li>
        </ul>
      `,
      buttons: ['Entendido']
    });

    await alert.present();
  }
  
  volver() {
    this.router.navigate(['/admin-usuarios']);
  }
  obtenerNombreCompleto(): string {
    const primerNombre = this.formularioUsuario.get('primerNombre')?.value || '';
    const segundoNombre = this.formularioUsuario.get('segundoNombre')?.value || '';
    const primerApellido = this.formularioUsuario.get('primerApellido')?.value || '';
    const segundoApellido = this.formularioUsuario.get('segundoApellido')?.value || '';

    return `${primerNombre} ${segundoNombre} ${primerApellido} ${segundoApellido}`.replace(/\s+/g, ' ').trim();
  }

  obtenerNombreDepartamento(): string {
    const codigoDepartamento: number = parseInt(this.formularioUsuario.get('departamento')?.value);
    return this.codigosDepartamento[codigoDepartamento]?.nombre || 'No seleccionado';
  }

  obtenerNombreRol(): string {
    const rolSeleccionado = this.formularioUsuario.get('rol')?.value;
    const opcion = this.opcionesRol.find(r => r.valor === rolSeleccionado);
    return opcion?.etiqueta || 'No seleccionado';
  }

  private async mostrarExito(mensaje: string): Promise<void> {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 3000,
      color: 'success',
      position: 'bottom',
      icon: 'checkmark-circle-outline'
    });
    await toast.present();
  }

  private async mostrarError(titulo: string, mensaje: string): Promise<void> {
    const alert = await this.alertController.create({
      header: titulo,
      message: mensaje,
      buttons: ['OK']
    });
    await alert.present();
  }
}